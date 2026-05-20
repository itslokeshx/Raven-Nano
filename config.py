# config.py
# Raven Nano — All hyperparameters in one place.
# Change values here only. Never hardcode in other files.

import os
import torch

class RavenConfig:

    # ── Model Architecture ──────────────────────────────────────────────
    VOCAB_SIZE       = 4096        # BPE vocabulary size
    CONTEXT_LEN      = 128         # Max token sequence length
    EMBED_DIM        = 320         # Token embedding dimension
    N_HEADS          = 8           # Attention heads (must divide EMBED_DIM evenly)
    HEAD_DIM         = EMBED_DIM // N_HEADS   # = 40 per head
    N_LAYERS         = 6           # Transformer blocks
    FFN_DIM          = 960         # FeedForward hidden size (3x EMBED_DIM)
    DROPOUT          = 0.1         # Dropout rate (applied everywhere)
    WEIGHT_TYING     = True        # Tie input embedding weights to LM head output

    # ── Training ────────────────────────────────────────────────────────
    TOTAL_STEPS      = 10000       # Total optimizer steps
    MICRO_BATCH      = 32          # Batch size per step (fits T4 16GB fine)
    GRAD_ACCUM       = 2           # Gradient accumulation steps
    EFFECTIVE_BATCH  = MICRO_BATCH * GRAD_ACCUM   # = 64 actual batch size
    LR_MAX           = 3e-4        # Peak learning rate
    LR_MIN           = 3e-5        # Final learning rate (cosine decay target)
    WARMUP_STEPS     = 300         # Linear warmup from 0 to LR_MAX
    GRAD_CLIP        = 1.0         # Max gradient norm
    WEIGHT_DECAY     = 0.1         # AdamW weight decay
    BETAS            = (0.9, 0.95) # AdamW betas
    EVAL_EVERY       = 500         # Run validation every N steps
    SAVE_EVERY       = 500         # Save latest checkpoint every N steps
    LOG_EVERY        = 50          # Print loss every N steps

    # ── Data ────────────────────────────────────────────────────────────
    CORPUS_PATH      = "data/corpus.txt"
    TRAIN_BIN        = "data/train.bin"
    VAL_BIN          = "data/val.bin"
    VAL_SPLIT        = 0.05        # 5% validation
    TOKENIZER_PATH   = "checkpoints/raven_nano_tokenizer.json"

    # ── Checkpoints / Drive ─────────────────────────────────────────────
    CHECKPOINT_DIR       = "checkpoints"
    BEST_CHECKPOINT      = "checkpoints/raven_nano_posttrain_best.pt"
    LATEST_CHECKPOINT    = "checkpoints/raven_nano_latest.pt"

    # Google Drive paths (set these in Colab after mounting)
    DRIVE_CHECKPOINT_DIR = "/content/drive/MyDrive/raven_nano/checkpoints"
    DRIVE_SYNC_EVERY     = 1000    # Sync best checkpoint to Drive every N steps

    # ── Special Tokens ──────────────────────────────────────────────────
    USER_TOKEN   = "<|user|>"
    RAVEN_TOKEN  = "<|raven|>"
    PAD_TOKEN    = "<|pad|>"
    EOS_TOKEN    = "<|eos|>"

    # ── Inference / Sampling ────────────────────────────────────────────
    DEFAULT_TEMP    = 0.65         # Default sampling temperature (tuned)
    DEFAULT_TOP_K   = 25           # Top-K sampling (tuned)
    DEFAULT_TOP_P   = 0.85         # Nucleus sampling (tuned)
    REP_PENALTY     = 1.10         # Repetition penalty (tuned, was 1.3 — too aggressive)
    MAX_NEW_TOKENS  = 40           # Hard cap on generated tokens

    # ── Device ──────────────────────────────────────────────────────────
    DEVICE = "cuda" if torch.cuda.is_available() else "cpu"

cfg = RavenConfig()
