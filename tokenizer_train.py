# tokenizer_train.py
# Trains a BPE tokenizer on corpus.txt and saves it.
# Run once before data_prep.py or train.py

import os
from tokenizers import ByteLevelBPETokenizer
from config import cfg

def train_tokenizer():
    print("=" * 50)
    print("Training BPE Tokenizer")
    print(f"  Corpus   : {cfg.CORPUS_PATH}")
    print(f"  Vocab    : {cfg.VOCAB_SIZE}")
    print(f"  Output   : {cfg.TOKENIZER_PATH}")
    print("=" * 50)

    if not os.path.exists(cfg.CORPUS_PATH):
        raise FileNotFoundError(
            f"Corpus not found at {cfg.CORPUS_PATH}\n"
            f"Place your corpus.txt in the data/ directory first."
        )

    # Initialize byte-level BPE tokenizer
    tokenizer = ByteLevelBPETokenizer()

    # Special tokens — these must be added BEFORE training
    special_tokens = [
        cfg.USER_TOKEN,    # <|user|>
        cfg.RAVEN_TOKEN,   # <|raven|>
        cfg.PAD_TOKEN,     # <|pad|>
        cfg.EOS_TOKEN,     # <|eos|>
    ]

    # Train on corpus
    tokenizer.train(
        files=[cfg.CORPUS_PATH],
        vocab_size=cfg.VOCAB_SIZE,
        min_frequency=2,           # Token must appear at least twice
        special_tokens=special_tokens,
        show_progress=True,
    )

    # Save tokenizer
    os.makedirs(os.path.dirname(cfg.TOKENIZER_PATH), exist_ok=True)
    tokenizer.save(cfg.TOKENIZER_PATH)

    # Verify special tokens loaded correctly
    from tokenizers import Tokenizer
    tok = Tokenizer.from_file(cfg.TOKENIZER_PATH)

    print("\nVerification:")
    for st in special_tokens:
        token_id = tok.token_to_id(st)
        print(f"  {st:15s} → id {token_id}")

    print(f"\nTokenizer trained and saved to {cfg.TOKENIZER_PATH}")
    print(f"Actual vocab size: {tok.get_vocab_size()}")

if __name__ == "__main__":
    train_tokenizer()
