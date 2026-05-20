# inference.py
# Raven Nano — Inference and chat interface.
# Load best checkpoint, generate one-liner responses.
# Includes gibberish detection and best-of-N sampling for quality.

import re
import torch
import torch.nn.functional as F
from tokenizers import Tokenizer

from config import cfg
from model import RavenNano


# ── Gibberish detection ─────────────────────────────────────────────────
# Patterns that indicate the model has hallucinated word-fragments.

# Matches hyphenated gibberish like "fre-wras-sment", "din-froylon"
_HYPHEN_GIBBERISH = re.compile(r'[a-z]{2,}-[a-z]{2,}-[a-z]{2,}', re.IGNORECASE)

# Matches words with too many consecutive consonants (5+), e.g. "ntrck"
_CONSONANT_CLUSTER = re.compile(r'[bcdfghjklmnpqrstvwxyz]{5,}', re.IGNORECASE)

# Common gibberish fragments the model produces
_GIBBERISH_FRAGMENTS = {
    "fey", "fele", "pling", "cessertion", "reachment", "irement",
    "ellation", "econtovenience", "mumnal", "luntrack", "reacticano",
    "pucer", "pandling", "fearrisle", "occess", "winterness",
    "saming", "honesthen", "smallerally", "freech", "scrawl",
}


def _is_gibberish(text: str) -> bool:
    """Return True if the generated text looks like word-fragment soup."""
    text_lower = text.lower().strip()

    # Empty or very short
    if len(text_lower) < 3:
        return True

    # Hyphenated gibberish chains
    if _HYPHEN_GIBBERISH.search(text_lower):
        return True

    # Impossible consonant clusters
    if _CONSONANT_CLUSTER.search(text_lower):
        return True

    # Known gibberish fragments
    words = set(re.findall(r'[a-z]+', text_lower))
    if len(words & _GIBBERISH_FRAGMENTS) >= 1:
        return True

    # Ratio check: if most "words" aren't real-ish (too many hyphens)
    hyphen_count = text_lower.count('-')
    word_count = len(text_lower.split())
    if word_count > 0 and hyphen_count / word_count > 0.4:
        return True

    return False


def _clean_response(text: str) -> str:
    """Clean up model output: trim fragments, fix punctuation."""
    text = text.strip()

    # Remove leading filler words the model sometimes prepends
    filler_prefixes = ["The,", "The.", "A,", "A."]
    for fp in filler_prefixes:
        if text.startswith(fp):
            text = text[len(fp):].strip()

    # If response ends mid-word (no terminal punctuation), trim to last sentence
    if text and text[-1] not in '.!?,;':
        # Find the last sentence-ending punctuation
        last_period = max(text.rfind('.'), text.rfind('!'), text.rfind('?'))
        if last_period > len(text) * 0.3:   # Only trim if we keep >30% of text
            text = text[:last_period + 1]

    # Capitalize first letter
    if text and text[0].islower():
        text = text[0].upper() + text[1:]

    return text


# ── Sarcastic fallback pool ─────────────────────────────────────────────
# When all attempts produce gibberish, use an in-character fallback.
_FALLBACKS = [
    "I had a thought, but it left without saying goodbye.",
    "My brain cells are on strike. Try again later.",
    "Even I can't make sense of what you just said.",
    "That's above my pay grade. And I don't get paid.",
    "I stared at that for a while. Nothing happened.",
    "Error 404: clever response not found.",
    "Honestly, I got nothing. And I'm not sorry about it.",
    "You broke me. Congratulations, that's actually impressive.",
    "I'd answer, but my sarcasm buffer overflowed.",
    "My response was so good it deleted itself out of jealousy.",
]
_fallback_idx = 0


def _get_fallback() -> str:
    """Return the next fallback response (round-robin)."""
    global _fallback_idx
    resp = _FALLBACKS[_fallback_idx % len(_FALLBACKS)]
    _fallback_idx += 1
    return resp


# ── Model loading ───────────────────────────────────────────────────────

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


# ── Core sampling ───────────────────────────────────────────────────────

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

    return tok.decode(generated)


def sample_best(
    model,
    tok,
    prompt: str,
    temperature: float = cfg.DEFAULT_TEMP,
    top_k: int        = cfg.DEFAULT_TOP_K,
    top_p: float      = cfg.DEFAULT_TOP_P,
    rep_penalty: float = cfg.REP_PENALTY,
    max_new_tokens: int = cfg.MAX_NEW_TOKENS,
    num_candidates: int = 3,
) -> str:
    """
    Best-of-N sampling with gibberish filtering.
    Generates N candidates, filters out gibberish, returns the best one.
    Falls back to sarcastic in-character response if all candidates are bad.
    """
    candidates = []

    for attempt in range(num_candidates):
        # Progressively lower temperature on retries for more coherent output
        attempt_temp = temperature * (1.0 - attempt * 0.08)
        attempt_temp = max(attempt_temp, 0.35)

        raw = sample(
            model, tok, prompt,
            temperature=attempt_temp,
            top_k=top_k,
            top_p=top_p,
            rep_penalty=rep_penalty,
            max_new_tokens=max_new_tokens,
        )

        cleaned = _clean_response(raw)
        if cleaned and not _is_gibberish(cleaned):
            candidates.append(cleaned)

    if not candidates:
        # All candidates were gibberish — use a fallback
        return _get_fallback()

    # Pick the longest coherent candidate (more substance = better)
    return max(candidates, key=len)


# ── Interactive chat ────────────────────────────────────────────────────

def chat():
    """Interactive terminal chat with Raven Nano."""
    tok   = Tokenizer.from_file(cfg.TOKENIZER_PATH)
    model = load_model_for_inference()

    print("\n" + "=" * 50)
    print("RAVEN NANO — Terminal Chat")
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

        m        = modes[current_mode]
        response = sample_best(
            model, tok, user_input,
            temperature=m["temperature"],
            top_k=m["top_k"],
            top_p=m["top_p"],
            rep_penalty=m["rep_penalty"],
            num_candidates=3,
        )

        print(f"Raven: {response}\n")


if __name__ == "__main__":
    chat()
