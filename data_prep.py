# data_prep.py
# Tokenizes corpus and saves binary train/val splits.
# Run once after tokenizer_train.py.

import os
import numpy as np
from tokenizers import Tokenizer
from config import cfg

def prepare_data():
    print("=" * 50)
    print("Data Preparation")
    print(f"  Corpus       : {cfg.CORPUS_PATH}")
    print(f"  Val split    : {cfg.VAL_SPLIT * 100:.0f}%")
    print(f"  Output train : {cfg.TRAIN_BIN}")
    print(f"  Output val   : {cfg.VAL_BIN}")
    print("=" * 50)

    # Load trained tokenizer
    if not os.path.exists(cfg.TOKENIZER_PATH):
        raise FileNotFoundError(
            f"Tokenizer not found at {cfg.TOKENIZER_PATH}\n"
            "Run tokenizer_train.py first."
        )

    tok = Tokenizer.from_file(cfg.TOKENIZER_PATH)
    tok.enable_truncation(max_length=cfg.CONTEXT_LEN)

    # Read corpus
    print("\nReading corpus...")
    with open(cfg.CORPUS_PATH, "r", encoding="utf-8") as f:
        raw_text = f.read()

    print(f"  Corpus size  : {len(raw_text) / 1e6:.2f} MB")
    print(f"  Characters   : {len(raw_text):,}")

    # Tokenize in chunks to avoid memory issues
    # Split by pair boundaries (blank line = end of one pair)
    print("\nTokenizing...")
    pairs = raw_text.strip().split("\n\n")
    print(f"  Total pairs  : {len(pairs):,}")

    all_ids = []
    eos_id  = tok.token_to_id(cfg.EOS_TOKEN)

    for i, pair in enumerate(pairs):
        pair = pair.strip()
        if not pair:
            continue
        encoded = tok.encode(pair)
        all_ids.extend(encoded.ids)
        all_ids.append(eos_id)   # EOS between every pair

        if (i + 1) % 5000 == 0:
            print(f"  Processed {i + 1:,} / {len(pairs):,} pairs...")

    all_ids = np.array(all_ids, dtype=np.uint16)
    total   = len(all_ids)
    print(f"\n  Total tokens : {total:,}")

    # Split
    split_idx  = int(total * (1 - cfg.VAL_SPLIT))
    train_ids  = all_ids[:split_idx]
    val_ids    = all_ids[split_idx:]

    print(f"  Train tokens : {len(train_ids):,}")
    print(f"  Val tokens   : {len(val_ids):,}")

    # Save binary
    os.makedirs("data", exist_ok=True)
    train_ids.tofile(cfg.TRAIN_BIN)
    val_ids.tofile(cfg.VAL_BIN)

    print(f"\nSaved:")
    print(f"  {cfg.TRAIN_BIN}  ({os.path.getsize(cfg.TRAIN_BIN) / 1e6:.2f} MB)")
    print(f"  {cfg.VAL_BIN}    ({os.path.getsize(cfg.VAL_BIN) / 1e6:.2f} MB)")
    print("\nData preparation complete.")

if __name__ == "__main__":
    prepare_data()
