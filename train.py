# train.py
# Raven Nano — Full training loop.
# Supports: AMP, gradient accumulation, cosine LR, checkpointing, Drive sync.

import os
import math
import time
import shutil
import numpy as np
import torch
from torch.cuda.amp import GradScaler, autocast
from tokenizers import Tokenizer

from config import cfg
from model import RavenNano, build_model


# ── Data Loading ─────────────────────────────────────────────────────────────

def load_data(split: str):
    """Load binary token data as memory-mapped numpy array."""
    path = cfg.TRAIN_BIN if split == "train" else cfg.VAL_BIN
    if not os.path.exists(path):
        raise FileNotFoundError(f"Data file not found: {path}\nRun data_prep.py first.")
    return np.memmap(path, dtype=np.uint16, mode="r")


def get_batch(data: np.ndarray, device: str):
    """
    Sample a random batch of sequences from the data.
    Each sample: CONTEXT_LEN tokens input (x), shifted by 1 for targets (y).
    """
    max_start = len(data) - cfg.CONTEXT_LEN - 1
    indices   = torch.randint(0, max_start, (cfg.MICRO_BATCH,))

    x = torch.stack([
        torch.from_numpy(data[i     : i + cfg.CONTEXT_LEN].astype(np.int64))
        for i in indices
    ])
    y = torch.stack([
        torch.from_numpy(data[i + 1 : i + cfg.CONTEXT_LEN + 1].astype(np.int64))
        for i in indices
    ])

    return x.to(device), y.to(device)


# ── Learning Rate Schedule ────────────────────────────────────────────────────

def get_lr(step: int) -> float:
    """Cosine decay with linear warmup."""
    if step < cfg.WARMUP_STEPS:
        return cfg.LR_MAX * (step / cfg.WARMUP_STEPS)
    if step >= cfg.TOTAL_STEPS:
        return cfg.LR_MIN
    progress = (step - cfg.WARMUP_STEPS) / (cfg.TOTAL_STEPS - cfg.WARMUP_STEPS)
    cosine   = 0.5 * (1.0 + math.cos(math.pi * progress))
    return cfg.LR_MIN + (cfg.LR_MAX - cfg.LR_MIN) * cosine


# ── Checkpoint Functions ──────────────────────────────────────────────────────

def save_checkpoint(model, optimizer, scaler, step, val_loss, path):
    """Save full training state for exact resume."""
    os.makedirs(os.path.dirname(path) if os.path.dirname(path) else ".", exist_ok=True)
    torch.save({
        "step"       : step,
        "val_loss"   : val_loss,
        "model"      : model.state_dict(),
        "optimizer"  : optimizer.state_dict(),
        "scaler"     : scaler.state_dict(),
        "config"     : {
            "vocab_size"  : cfg.VOCAB_SIZE,
            "context_len" : cfg.CONTEXT_LEN,
            "embed_dim"   : cfg.EMBED_DIM,
            "n_heads"     : cfg.N_HEADS,
            "n_layers"    : cfg.N_LAYERS,
            "ffn_dim"     : cfg.FFN_DIM,
        }
    }, path)


def load_checkpoint(model, optimizer, scaler, path):
    """Load checkpoint and restore all training state. Returns resume step."""
    print(f"Loading checkpoint: {path}")
    ckpt = torch.load(path, map_location=cfg.DEVICE)
    model.load_state_dict(ckpt["model"])
    optimizer.load_state_dict(ckpt["optimizer"])
    scaler.load_state_dict(ckpt["scaler"])
    step     = ckpt["step"]
    val_loss = ckpt["val_loss"]
    print(f"  Resumed from step {step}, val_loss {val_loss:.4f}")
    return step


def sync_to_drive(src_path: str):
    """Copy checkpoint to Google Drive. Silently skips if Drive not mounted."""
    if not os.path.exists("/content/drive"):
        return
    os.makedirs(cfg.DRIVE_CHECKPOINT_DIR, exist_ok=True)
    filename = os.path.basename(src_path)
    dst_path = os.path.join(cfg.DRIVE_CHECKPOINT_DIR, filename)
    try:
        shutil.copy2(src_path, dst_path)
        print(f"  [Drive] Synced → {dst_path}")
    except Exception as e:
        print(f"  [Drive] Sync failed: {e}")


# ── Evaluation ────────────────────────────────────────────────────────────────

@torch.no_grad()
def evaluate(model, val_data, device, n_batches=20):
    """Run N random batches on validation data and return mean loss."""
    model.eval()
    losses = []
    for _ in range(n_batches):
        x, y = get_batch(val_data, device)
        with autocast(dtype=torch.float16):
            _, loss = model(x, y)
        losses.append(loss.item())
    model.train()
    return sum(losses) / len(losses)


# ── Training Loop ─────────────────────────────────────────────────────────────

def train(resume: bool = False):
    """
    Main training loop.
    Args:
        resume: If True, load from LATEST_CHECKPOINT and continue.
    """
    print("=" * 60)
    print("RAVEN NANO — TRAINING")
    print("=" * 60)

    device = cfg.DEVICE
    os.makedirs(cfg.CHECKPOINT_DIR, exist_ok=True)

    # Load data
    print("\nLoading data...")
    train_data = load_data("train")
    val_data   = load_data("val")
    print(f"  Train tokens : {len(train_data):,}")
    print(f"  Val tokens   : {len(val_data):,}")

    # Build model
    print("\nBuilding model...")
    model = build_model()

    # Optimizer — AdamW with weight decay only on 2D+ params
    decay_params    = [p for n, p in model.named_parameters()
                       if p.dim() >= 2 and p.requires_grad]
    no_decay_params = [p for n, p in model.named_parameters()
                       if p.dim() < 2 and p.requires_grad]

    optimizer = torch.optim.AdamW([
        {"params": decay_params,    "weight_decay": cfg.WEIGHT_DECAY},
        {"params": no_decay_params, "weight_decay": 0.0},
    ], lr=cfg.LR_MAX, betas=cfg.BETAS)

    scaler = GradScaler()

    # Resume from checkpoint
    start_step    = 0
    best_val_loss = float("inf")

    if resume and os.path.exists(cfg.LATEST_CHECKPOINT):
        start_step = load_checkpoint(model, optimizer, scaler, cfg.LATEST_CHECKPOINT)
    elif resume:
        print("No checkpoint found. Starting from scratch.")

    # Training
    print(f"\nTraining for {cfg.TOTAL_STEPS} steps...")
    print(f"  Effective batch : {cfg.EFFECTIVE_BATCH}")
    print(f"  Grad accumulation: {cfg.GRAD_ACCUM}")
    print(f"  LR max → min    : {cfg.LR_MAX} → {cfg.LR_MIN}")
    print(f"  Eval every      : {cfg.EVAL_EVERY} steps")
    print(f"  Save every      : {cfg.SAVE_EVERY} steps")
    print("-" * 60)

    model.train()
    optimizer.zero_grad()

    t_start = time.time()
    step    = start_step

    while step < cfg.TOTAL_STEPS:
        # Learning rate update
        lr = get_lr(step)
        for group in optimizer.param_groups:
            group["lr"] = lr

        # Gradient accumulation
        total_loss = 0.0
        for micro_step in range(cfg.GRAD_ACCUM):
            x, y = get_batch(train_data, device)
            with autocast(dtype=torch.float16):
                _, loss = model(x, y)
                loss    = loss / cfg.GRAD_ACCUM
            scaler.scale(loss).backward()
            total_loss += loss.item()

        # Gradient clip + optimizer step
        scaler.unscale_(optimizer)
        torch.nn.utils.clip_grad_norm_(model.parameters(), cfg.GRAD_CLIP)
        scaler.step(optimizer)
        scaler.update()
        optimizer.zero_grad()

        step += 1

        # Logging
        if step % cfg.LOG_EVERY == 0:
            elapsed   = time.time() - t_start
            tokens_ps = (step * cfg.EFFECTIVE_BATCH * cfg.CONTEXT_LEN) / elapsed
            print(
                f"  step {step:6d}/{cfg.TOTAL_STEPS} | "
                f"loss {total_loss:.4f} | "
                f"lr {lr:.2e} | "
                f"tokens/s {tokens_ps:,.0f}"
            )

        # Evaluation + Checkpointing
        if step % cfg.EVAL_EVERY == 0 or step == cfg.TOTAL_STEPS:
            val_loss = evaluate(model, val_data, device)
            print(f"\n  [EVAL] step {step} | val_loss {val_loss:.4f}")

            save_checkpoint(model, optimizer, scaler, step, val_loss, cfg.LATEST_CHECKPOINT)
            print(f"  [SAVE] Latest checkpoint saved")

            if val_loss < best_val_loss:
                best_val_loss = val_loss
                save_checkpoint(model, optimizer, scaler, step, val_loss, cfg.BEST_CHECKPOINT)
                print(f"  [BEST] New best val_loss: {val_loss:.4f} — saved")
                sync_to_drive(cfg.BEST_CHECKPOINT)

            print()

        # Periodic Drive sync
        if step % cfg.DRIVE_SYNC_EVERY == 0:
            sync_to_drive(cfg.LATEST_CHECKPOINT)

    # Done
    total_time = (time.time() - t_start) / 3600
    print("=" * 60)
    print(f"Training complete!")
    print(f"  Total time   : {total_time:.2f} hours")
    print(f"  Best val loss: {best_val_loss:.4f}")
    print(f"  Best ckpt    : {cfg.BEST_CHECKPOINT}")
    print("=" * 60)

    sync_to_drive(cfg.BEST_CHECKPOINT)
    sync_to_drive(cfg.LATEST_CHECKPOINT)


if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("--resume", action="store_true",
                        help="Resume from latest checkpoint")
    args = parser.parse_args()
    train(resume=args.resume)
