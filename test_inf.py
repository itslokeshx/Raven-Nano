"""Test the improved inference with best-of-N and gibberish filtering."""
from config import cfg
from inference import load_model_for_inference, sample_best
from tokenizers import Tokenizer

tok = Tokenizer.from_file(cfg.TOKENIZER_PATH)
model = load_model_for_inference()

prompts = [
    "hi", "good morning", "good night", "good evening",
    "i'm tired", "what is 2+2", "tell me a secret",
    "i failed the test", "say something funny", "i'll study tomorrow",
    "dd", "help me", "can you help me", "what's the meaning of life",
    "be rude but not evil", "respond in one line only",
    "repeat repeat repeat repeat", "i am the best programmer",
    "what is science", "1+1", "sss", "k",
]

print(f"\nUsing: temp={cfg.DEFAULT_TEMP} top_k={cfg.DEFAULT_TOP_K} "
      f"top_p={cfg.DEFAULT_TOP_P} rep={cfg.REP_PENALTY}")
print(f"Best-of-3 with gibberish filtering\n")
print("=" * 65)

for p in prompts:
    resp = sample_best(model, tok, p, num_candidates=3)
    print(f"  You: {p}")
    print(f"  Raven: {resp}\n")
