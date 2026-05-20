# posttrain.py
# Post-training loop for Raven Nano.
# Finetunes a pretrained model on high-quality diverse conversational data.

import os
import math
import time
import shutil
import numpy as np
import torch
from torch.cuda.amp import GradScaler, autocast
from tokenizers import Tokenizer

from config import cfg
from model import build_model
from train import get_batch, evaluate, save_checkpoint, load_checkpoint, sync_to_drive

# Override paths and training settings for post-training
POSTTRAIN_TRAIN_BIN = "data/posttrain_train.bin"
POSTTRAIN_VAL_BIN = "data/posttrain_val.bin"
POSTTRAIN_CORPUS_PATH = "data/posttrain_corpus.txt"

# We use fewer steps and a lower learning rate for post-training
PT_TOTAL_STEPS = 2000
PT_LR_MAX = 5e-5
PT_LR_MIN = 5e-6
PT_WARMUP_STEPS = 100

PT_LATEST_CHECKPOINT = "checkpoints/raven_nano_posttrain_latest.pt"
PT_BEST_CHECKPOINT = "checkpoints/raven_nano_posttrain_best.pt"


def prepare_posttrain_data():
    """Tokenize the posttrain text corpus if binary files are missing."""
    print(f"Tokenizing {POSTTRAIN_CORPUS_PATH}...")
    if not os.path.exists(POSTTRAIN_CORPUS_PATH):
        raise FileNotFoundError(f"Missing {POSTTRAIN_CORPUS_PATH}! Please upload it.")
        
    tok = Tokenizer.from_file(cfg.TOKENIZER_PATH)
    tok.enable_truncation(max_length=cfg.CONTEXT_LEN)
    
    with open(POSTTRAIN_CORPUS_PATH, "r", encoding="utf-8") as f:
        pairs = f.read().strip().split("\n\n")
        
    all_ids = []
    eos_id = tok.token_to_id(cfg.EOS_TOKEN)
    for pair in pairs:
        if pair.strip():
            all_ids.extend(tok.encode(pair.strip()).ids)
            all_ids.append(eos_id)
            
    all_ids = np.array(all_ids, dtype=np.uint16)
    split_idx = int(len(all_ids) * (1 - cfg.VAL_SPLIT))
    
    os.makedirs("data", exist_ok=True)
    all_ids[:split_idx].tofile(POSTTRAIN_TRAIN_BIN)
    all_ids[split_idx:].tofile(POSTTRAIN_VAL_BIN)
    print("Data tokenization complete.\n")


def load_data(split: str):
    """Load binary token data as memory-mapped numpy array."""
    path = POSTTRAIN_TRAIN_BIN if split == "train" else POSTTRAIN_VAL_BIN
    if not os.path.exists(path):
        prepare_posttrain_data()
    return np.memmap(path, dtype=np.uint16, mode="r")


def get_lr(step: int) -> float:
    """Cosine decay with linear warmup for post-training."""
    if step < PT_WARMUP_STEPS:
        return PT_LR_MAX * (step / PT_WARMUP_STEPS)
    if step >= PT_TOTAL_STEPS:
        return PT_LR_MIN
    progress = (step - PT_WARMUP_STEPS) / (PT_TOTAL_STEPS - PT_WARMUP_STEPS)
    cosine   = 0.5 * (1.0 + math.cos(math.pi * progress))
    return PT_LR_MIN + (PT_LR_MAX - PT_LR_MIN) * cosine


def posttrain(resume: bool = False):
    print("=" * 60)
    print("RAVEN NANO — POST-TRAINING")
    print("=" * 60)

    device = cfg.DEVICE
    os.makedirs(cfg.CHECKPOINT_DIR, exist_ok=True)

    # Load data
    print("\nLoading post-training data...")
    train_data = load_data("train")
    val_data   = load_data("val")
    print(f"  Train tokens : {len(train_data):,}")
    print(f"  Val tokens   : {len(val_data):,}")

    # Build model
    print("\nBuilding model...")
    model = build_model()

    # Optimizer
    decay_params    = [p for n, p in model.named_parameters() if p.dim() >= 2 and p.requires_grad]
    no_decay_params = [p for n, p in model.named_parameters() if p.dim() < 2 and p.requires_grad]

    optimizer = torch.optim.AdamW([
        {"params": decay_params,    "weight_decay": cfg.WEIGHT_DECAY},
        {"params": no_decay_params, "weight_decay": 0.0},
    ], lr=PT_LR_MAX, betas=cfg.BETAS)

    scaler = GradScaler()

    # Resume from checkpoint
    start_step    = 0
    best_val_loss = float("inf")

    if resume and os.path.exists(PT_LATEST_CHECKPOINT):
        print("Resuming previous post-training session...")
        start_step = load_checkpoint(model, optimizer, scaler, PT_LATEST_CHECKPOINT)
    else:
        print("Loading pre-trained checkpoint for initial post-training...")
        # Load from base pre-trained checkpoint, but reset optimizer/scaler/step
        if not os.path.exists(cfg.BEST_CHECKPOINT):
            raise FileNotFoundError(f"Base checkpoint not found: {cfg.BEST_CHECKPOINT}")
        
        ckpt = torch.load(cfg.BEST_CHECKPOINT, map_location=device)
        model.load_state_dict(ckpt["model"])
        print(f"  Loaded base weights from step {ckpt['step']}")

    # Training
    print(f"\nPost-training for {PT_TOTAL_STEPS} steps...")
    print(f"  Effective batch : {cfg.EFFECTIVE_BATCH}")
    print(f"  LR max → min    : {PT_LR_MAX} → {PT_LR_MIN}")
    print("-" * 60)

    model.train()
    optimizer.zero_grad()

    t_start = time.time()
    step    = start_step

    while step < PT_TOTAL_STEPS:
        lr = get_lr(step)
        for group in optimizer.param_groups:
            group["lr"] = lr

        total_loss = 0.0
        for micro_step in range(cfg.GRAD_ACCUM):
            x, y = get_batch(train_data, device)
            with autocast(dtype=torch.float16):
                _, loss = model(x, y)
                loss    = loss / cfg.GRAD_ACCUM
            scaler.scale(loss).backward()
            total_loss += loss.item()

        scaler.unscale_(optimizer)
        torch.nn.utils.clip_grad_norm_(model.parameters(), cfg.GRAD_CLIP)
        scaler.step(optimizer)
        scaler.update()
        optimizer.zero_grad()

        step += 1

        if step % cfg.LOG_EVERY == 0:
            elapsed   = time.time() - t_start
            tokens_ps = (step * cfg.EFFECTIVE_BATCH * cfg.CONTEXT_LEN) / elapsed
            print(f"  step {step:6d}/{PT_TOTAL_STEPS} | loss {total_loss:.4f} | lr {lr:.2e} | tokens/s {tokens_ps:,.0f}")

        if step % cfg.EVAL_EVERY == 0 or step == PT_TOTAL_STEPS:
            val_loss = evaluate(model, val_data, device)
            print(f"\n  [EVAL] step {step} | val_loss {val_loss:.4f}")

            save_checkpoint(model, optimizer, scaler, step, val_loss, PT_LATEST_CHECKPOINT)
            sync_to_drive(PT_LATEST_CHECKPOINT)

            if val_loss < best_val_loss:
                best_val_loss = val_loss
                save_checkpoint(model, optimizer, scaler, step, val_loss, PT_BEST_CHECKPOINT)
                print(f"  [BEST] New best val_loss: {val_loss:.4f} — saved")
                sync_to_drive(PT_BEST_CHECKPOINT)
            print()

    total_time = (time.time() - t_start) / 3600
    print("=" * 60)
    print(f"Post-training complete!")
    print(f"  Total time   : {total_time:.2f} hours")
    print(f"  Best val loss: {best_val_loss:.4f}")
    print(f"  Best ckpt    : {PT_BEST_CHECKPOINT}")
    print("=" * 60)


if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("--resume", action="store_true", help="Resume from latest posttrain checkpoint")
    args = parser.parse_args()
    posttrain(resume=args.resume)
