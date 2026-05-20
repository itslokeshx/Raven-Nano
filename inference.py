# inference.py
# Raven Nano — Inference and chat interface.
# Load best checkpoint, generate one-liner responses.
# v3: Post-trained pure model without hardcoded fallbacks or dictionary filters!

import os
import torch
import torch.nn.functional as F
from tokenizers import Tokenizer

from config import cfg
from model import RavenNano

# ═══════════════════════════════════════════════════════════════════════
#  MODEL LOADING
# ═══════════════════════════════════════════════════════════════════════

def load_model_for_inference(checkpoint_path: str = None):
    """Load trained model weights for inference."""
    path = checkpoint_path or cfg.BEST_CHECKPOINT

    print(f"Loading model from: {path}")
    ckpt  = torch.load(path, map_location=cfg.DEVICE)
    model = RavenNano().to(cfg.DEVICE)
    model.load_state_dict(ckpt["model"])
    model.eval()

    print(f"  Loaded from step {ckpt['step']} | val_loss {ckpt['val_loss']:.4f}")
    return model


# ═══════════════════════════════════════════════════════════════════════
#  CORE SAMPLING
# ═══════════════════════════════════════════════════════════════════════

def sample(
    model,
    tok,
    prompt: str,
    temperature: float = cfg.DEFAULT_TEMP,
    top_k: int        = cfg.DEFAULT_TOP_K,
    top_p: float      = cfg.DEFAULT_TOP_P,
    rep_penalty: float = cfg.REP_PENALTY,
    max_new_tokens: int = cfg.MAX_NEW_TOKENS,
) -> str:
    """
    Generate tokens using temperature + top-k + top-p + repetition penalty.
    Stops at EOS token or max_new_tokens.
    """
    model.eval()

    eos_id   = tok.token_to_id(cfg.EOS_TOKEN)
    raven_id = tok.token_to_id(cfg.RAVEN_TOKEN)

    # Build input: "<|user|> [prompt]\n<|raven|>"
    full_prompt = f"{cfg.USER_TOKEN} {prompt}\n{cfg.RAVEN_TOKEN}"
    encoded     = tok.encode(full_prompt)
    input_ids   = torch.tensor([encoded.ids], dtype=torch.long).to(cfg.DEVICE)

    generated = []

    with torch.no_grad():
        for _ in range(max_new_tokens):
            idx = input_ids[:, -cfg.CONTEXT_LEN:]
            logits, _ = model(idx)
            logits     = logits[:, -1, :]   # Last token logits → (1, vocab)

            # Repetition Penalty
            if len(generated) > 0 and rep_penalty != 1.0:
                for token_id in set(generated):
                    if logits[0, token_id] < 0:
                        logits[0, token_id] *= rep_penalty
                    else:
                        logits[0, token_id] /= rep_penalty

            # Temperature
            logits = logits / temperature

            # Top-K
            if top_k > 0:
                values, _ = torch.topk(logits, top_k)
                threshold  = values[:, -1].unsqueeze(-1)
                logits     = logits.masked_fill(logits < threshold, float("-inf"))

            # Top-P (Nucleus)
            if top_p < 1.0:
                probs      = F.softmax(logits, dim=-1)
                sorted_p, sorted_idx = torch.sort(probs, descending=True)
                cumulative = torch.cumsum(sorted_p, dim=-1)
                remove     = cumulative - sorted_p > top_p
                sorted_p[remove] = 0.0
                sorted_p  /= sorted_p.sum()
                next_token = sorted_idx.gather(-1, torch.multinomial(sorted_p, 1))
            else:
                probs      = F.softmax(logits, dim=-1)
                next_token = torch.multinomial(probs, 1)

            token_id = next_token.item()

            if token_id == eos_id:
                break

            generated.append(token_id)
            input_ids = torch.cat([input_ids, next_token], dim=1)

    return tok.decode(generated).strip()

# ═══════════════════════════════════════════════════════════════════════
#  SESSION DEDUP — prevent the same response from being used twice
# ═══════════════════════════════════════════════════════════════════════

class SessionMemory:
    """Tracks recent responses to prevent repetition within a session."""

    def __init__(self, max_history: int = 15):
        self._history = []
        self._max = max_history

    def _normalize(self, text: str) -> str:
        """Normalize response for comparison."""
        return text.lower().strip()

    def is_duplicate(self, response: str) -> bool:
        """Check if this response was already used recently."""
        norm = self._normalize(response)
        return norm in [self._normalize(h) for h in self._history]

    def add(self, response: str):
        """Add a response to history."""
        self._history.append(response)
        if len(self._history) > self._max:
            self._history.pop(0)

def sample_best(
    model, tok, prompt, 
    temperature=cfg.DEFAULT_TEMP, top_k=cfg.DEFAULT_TOP_K, 
    top_p=cfg.DEFAULT_TOP_P, rep_penalty=cfg.REP_PENALTY, 
    num_candidates=3, session=None
):
    """Generates a few candidates and picks one that hasn't been used yet."""
    candidates = []
    
    for attempt in range(num_candidates):
        # Slightly increase temperature for each retry to force variety
        attempt_temp = temperature * (1.0 + attempt * 0.1)
        
        raw = sample(model, tok, prompt, temperature=attempt_temp, top_k=top_k, top_p=top_p, rep_penalty=rep_penalty)
        
        # If we have a session, only keep the response if it's new
        if session and not session.is_duplicate(raw):
            session.add(raw)
            return raw
            
        candidates.append(raw)
        
    # If all candidates were duplicates, just return the last one generated
    best = candidates[-1] if candidates else sample(model, tok, prompt)
    if session:
        session.add(best)
    return best


# ═══════════════════════════════════════════════════════════════════════
#  INTERACTIVE CHAT
# ═══════════════════════════════════════════════════════════════════════

def chat():
    """Interactive terminal chat with Raven Nano (Pure Model)."""
    tok     = Tokenizer.from_file(cfg.TOKENIZER_PATH)
    model   = load_model_for_inference()
    session = SessionMemory()

    print("\n" + "=" * 50)
    print("RAVEN NANO — Terminal Chat (Pure Post-Trained)")
    print("Type 'quit' to exit. Type 'mode' to change mood.")
    print("=" * 50 + "\n")

    modes = {
        "default"    : {"temperature": 0.65, "top_k": 25, "top_p": 0.85, "rep_penalty": 1.10},
        "sharp"      : {"temperature": 0.55, "top_k": 20, "top_p": 0.80, "rep_penalty": 1.10},
        "chaos"      : {"temperature": 0.85, "top_k": 45, "top_p": 0.92, "rep_penalty": 1.05},
        "cold"       : {"temperature": 0.45, "top_k": 12, "top_p": 0.75, "rep_penalty": 1.08},
    }
    current_mode = "default"

    while True:
        try:
            user_input = input("You: ").strip()
        except (KeyboardInterrupt, EOFError):
            print("\nRaven: Good.")
            break

        if not user_input:
            continue

        if user_input.lower() == "quit":
            print("Raven: Finally.")
            break

        if user_input.lower() == "mode":
            print(f"Current: {current_mode}")
            print(f"Options: {list(modes.keys())}")
            current_mode = input("Select mode: ").strip().lower()
            if current_mode not in modes:
                current_mode = "default"
            print(f"Mode set to: {current_mode}")
            continue

        m = modes[current_mode]
        
        # Generate using our anti-repeat logic
        response = sample_best(
            model, tok, user_input,
            temperature=m["temperature"],
            top_k=m["top_k"],
            top_p=m["top_p"],
            rep_penalty=m["rep_penalty"],
            num_candidates=3,
            session=session
        )

        print(f"Raven: {response}\n")


if __name__ == "__main__":
    chat()
