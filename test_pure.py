"""Test Raven Nano pure output — no filters, no best-of-N, no hardcoded fallbacks."""
from config import cfg
from inference import load_model_for_inference, sample
from tokenizers import Tokenizer
import torch

tok = Tokenizer.from_file(cfg.TOKENIZER_PATH)
model = load_model_for_inference()

prompts = {
    "Greetings": ["hi", "hello", "what's up", "good morning"],
    "Study": ["i can't study tonight", "i failed the test", "i have an exam tomorrow", "my grades are dropping"],
    "Coding": ["my code won't run", "i'm learning javascript", "my laptop is dying", "i love programming"],
    "Fitness": ["gonna hit the gym", "i'm on a diet starting monday", "i ate a whole cake", "my muscles are sore"],
    "Emotional": ["i'm a failure", "nobody understands me", "everything is going wrong", "i want to disappear"],
    "Daily Life": ["it's raining", "traffic is crazy", "i lost my phone", "i broke my charger"],
    "Commands": ["say something funny", "tell me a joke", "roast me", "motivate me"],
    "Knowledge": ["what is 2+2", "what is 47 times 83", "explain quantum physics", "who are you"],
    "Edge Cases": ["dd", "sss", "...", "lol"],
}

print(f"\n{'=' * 65}")
print(f"PURE MODEL TEST (No Filters, No Fallbacks, Raw Generation)")
print(f"{'=' * 65}")

count = 0
for category, prompt_list in prompts.items():
    print(f"\n{'#' * 65}")
    print(f"#  {category.upper()}")
    print(f"{'#' * 65}")
    for p in prompt_list:
        count += 1
        # Set seeds for reproducibility if desired, but we want random temp sampling
        # Using standard parameters but NO best-of-N and NO _clean_response/_is_gibberish
        raw_resp = sample(
            model, tok, p,
            temperature=0.65,
            top_k=25,
            top_p=0.85,
            rep_penalty=1.10
        )
        
        # Just strip trailing whitespace/newlines so it prints cleanly, no other cleaning
        clean_resp = raw_resp.strip()
        
        print(f"  [{count:3d}] You: {p}")
        print(f"        Raven: {clean_resp}")
        print()
