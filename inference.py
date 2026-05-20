# inference.py
# Raven Nano — Inference and chat interface.
# Load best checkpoint, generate one-liner responses.
# v2: System dictionary gibberish filter, session dedup, topic-aware fallbacks,
#     grammar validation, best-of-5 sampling.

import os
import re
import random
import torch
import torch.nn.functional as F
from tokenizers import Tokenizer

from config import cfg
from model import RavenNano


# ═══════════════════════════════════════════════════════════════════════
#  WORD VALIDATOR — uses /usr/share/dict/words for real dictionary check
# ═══════════════════════════════════════════════════════════════════════

def _load_dictionary():
    """Load system dictionary for word validation. Falls back to built-in set."""
    words = set()
    dict_paths = [
        "/usr/share/dict/words",
        "/usr/share/dict/american-english",
        "/usr/share/dict/british-english",
    ]
    for path in dict_paths:
        if os.path.exists(path):
            with open(path, "r") as f:
                for line in f:
                    w = line.strip().lower()
                    if w and "'" not in w:  # Skip possessives
                        words.add(w)
            break

    # Always add contractions / informal words the model uses
    _INFORMAL = {
        "i", "i'm", "i've", "i'll", "i'd", "you're", "you've", "you'll",
        "you'd", "we're", "we've", "we'll", "they're", "they've", "they'll",
        "he's", "she's", "it's", "that's", "what's", "there's", "here's",
        "who's", "how's", "where's", "when's", "why's", "let's",
        "can't", "won't", "don't", "doesn't", "didn't", "isn't", "aren't",
        "wasn't", "weren't", "hasn't", "hasn't", "haven't", "hadn't",
        "couldn't", "wouldn't", "shouldn't", "mustn't", "needn't",
        "gonna", "wanna", "gotta", "kinda", "sorta", "lol", "ok", "okay",
        "yeah", "yep", "nah", "nope", "huh", "hmm", "mhm", "ugh",
        "yo", "sup", "bruh", "bro", "dude", "fam", "vibe", "vibes",
        "wifi", "netflix", "youtube", "google", "tiktok", "instagram",
        "emoji", "selfie", "hashtag", "meme", "podcast", "playlist",
        "hoodie", "sneakers", "pizza", "latte", "espresso", "sushi",
        "gym", "workout", "cardio", "protein", "treadmill", "dumbbell",
        "javascript", "python", "html", "css", "api", "backend", "frontend",
        "startup", "app", "laptop", "charger", "bluetooth", "smartphone",
        "highkey", "lowkey", "salty", "ghosted", "sus", "cringe", "flex",
        "spooky", "3am", "10k", "un", "re", "pre",
        "wikipedia", "toaster", "fridge", "microwave",
        "am", "pm",
    }
    words.update(_INFORMAL)
    return words

_DICTIONARY = _load_dictionary()


# ═══════════════════════════════════════════════════════════════════════
#  GIBBERISH DETECTION — multi-layered filter
# ═══════════════════════════════════════════════════════════════════════

# Regex patterns for structural gibberish
_HYPHEN_CHAIN = re.compile(r'[a-z]{2,}-[a-z]{2,}-[a-z]{2,}', re.IGNORECASE)
_CONSONANT_CLUSTER = re.compile(r'[bcdfghjklmnpqrstvwxyz]{4,}', re.IGNORECASE)
_REPEATED_PATTERN = re.compile(r'(.{3,})\1{2,}', re.IGNORECASE)

# Words that NEVER appear in coherent English (observed model outputs)
_KNOWN_GIBBERISH = {
    "fey", "fele", "pling", "cessertion", "reachment", "irement",
    "ellation", "econtovenience", "mumnal", "luntrack", "reacticano",
    "pucer", "pandling", "fearrisle", "occess", "winterness",
    "saming", "honesthen", "smallerally", "freech", "scrawl",
    "tenty", "stillment", "unreme", "mutive", "geyan", "pifire",
    "curier", "divated", "shrass", "cutlinan", "slinan", "froylon",
    "dirmy", "pliccel", "forbolvanced", "ostrite", "forbed",
    "linkle", "dess", "tental", "cushional", "tonsequence",
    "cosal", "lowed", "harter", "bedling", "miation",
    "losa", "vany", "throto", "lunt", "pand",
    "alment", "nosiment", "fulness", "adhing", "anhiking",
    "centle", "sete", "dened", "anality", "cucyey", "reus",
    "mulsequence", "diring", "toxico", "thising", "aromic",
    "converage", "tentle", "impulting", "ded", "forking",
    "wer", "exed", "hums", "fare",
}

# Skip list: short words that are fine even if not in dictionary
_SKIP_WORDS = {"a", "i", "o", "an", "am", "at", "be", "by", "do", "go",
               "he", "if", "in", "is", "it", "me", "my", "no", "of",
               "on", "or", "so", "to", "up", "us", "we"}


def _is_real_word(word: str) -> bool:
    """Check if a word is a real English word."""
    w = word.lower().strip(".,!?;:'\"()-")
    if len(w) <= 2:
        return True  # Short words pass
    if w in _SKIP_WORDS:
        return True
    if w in _KNOWN_GIBBERISH:
        return False
    if w in _DICTIONARY:
        return True
    # Check common suffixes: if base is in dict, it's fine
    for suffix in ("ing", "ed", "ly", "er", "est", "tion", "ment", "ness", "able", "ible", "ful", "less", "ous", "ive", "al", "s", "es"):
        base = w[:-len(suffix)] if w.endswith(suffix) and len(w) > len(suffix) + 1 else None
        if base and base in _DICTIONARY:
            return True
    return False


def _is_gibberish(text: str) -> bool:
    """Return True if the generated text looks like word-fragment soup."""
    text_lower = text.lower().strip()

    # Empty or very short
    if len(text_lower) < 5:
        return True

    # Hyphenated gibberish chains (e.g. "fre-wras-sment")
    if _HYPHEN_CHAIN.search(text_lower):
        return True

    # Consonant clusters (e.g. "shrass", "ntrck")
    if _CONSONANT_CLUSTER.search(text_lower):
        return True

    # Extract words for analysis
    words = re.findall(r"[a-z']+", text_lower)
    if not words:
        return True

    # Check for known gibberish fragments
    word_set = set(words)
    if word_set & _KNOWN_GIBBERISH:
        return True

    # ── Dictionary-based word validation ──
    content_words = [w for w in words if len(w) > 2 and w not in _SKIP_WORDS]
    if content_words:
        real_count = sum(1 for w in content_words if _is_real_word(w))
        ratio = real_count / len(content_words)
        # If less than 65% of content words are real, it's gibberish
        if ratio < 0.65:
            return True

    # ── Grammar structure checks ──

    # Broken sentence: ends abruptly without structure
    if len(words) >= 3 and text_lower.endswith(("with", "of", "for", "the", "a", "and", "to", "in", "your", "is")):
        return True

    # "The X of Y" hallucination with fake words
    if text_lower.startswith("the ") and " of " in text_lower:
        post_of = text_lower.split(" of ", 1)[1]
        post_words = [w for w in re.findall(r"[a-z']+", post_of) if len(w) > 2]
        if post_words:
            real = sum(1 for w in post_words if _is_real_word(w))
            if real / len(post_words) < 0.5:
                return True

    # Hyphen density
    hyphens = text_lower.count('-')
    if hyphens > 0 and hyphens / max(len(words), 1) > 0.2:
        return True

    # Sentence is just "The [something]." with no verb — too minimal
    if re.match(r'^the\s+\w+\s*[.!?]?$', text_lower):
        return True

    return False


def _clean_response(text: str) -> str:
    """Clean up model output: trim fragments, fix punctuation."""
    text = text.strip()
    if not text:
        return ""

    # Remove stray newlines — take only the first line
    if '\n' in text:
        lines = [l.strip() for l in text.split('\n') if l.strip()]
        text = lines[0] if lines else ""

    # Remove leading filler patterns
    filler_re = re.compile(r'^(The,|The\.|A,|A\.|The\s)\s*', re.IGNORECASE)
    # Only strip "The " if what follows looks like gibberish
    if text.startswith("The ") or text.startswith("the "):
        after = text[4:].strip()
        if after and not after[0].isupper() and len(after.split()) <= 3:
            # Very short "The X" fragments → likely gibberish template
            pass  # Let the gibberish detector handle it
    for fp in ["The,", "The.", "A,", "A."]:
        if text.startswith(fp):
            text = text[len(fp):].strip()

    # If response ends mid-word (no terminal punctuation), trim to last sentence
    if text and text[-1] not in '.!?,;:':
        last_punct = max(text.rfind('.'), text.rfind('!'), text.rfind('?'))
        if last_punct > len(text) * 0.25:
            text = text[:last_punct + 1]
        elif len(text.split()) >= 4:
            text = text.rstrip() + "."

    # Remove trailing fragments after period if they're very short
    if '. ' in text:
        parts = text.rsplit('. ', 1)
        if len(parts) == 2 and len(parts[1].split()) <= 2 and not parts[1].endswith(('.', '!', '?')):
            text = parts[0] + "."

    # Capitalize first letter
    if text and text[0].islower():
        text = text[0].upper() + text[1:]

    return text


# ═══════════════════════════════════════════════════════════════════════
#  TOPIC DETECTION — categorize user input for targeted fallbacks
# ═══════════════════════════════════════════════════════════════════════

_TOPIC_KEYWORDS = {
    "greeting": {"hi", "hello", "hey", "yo", "sup", "morning", "evening",
                 "night", "howdy", "greetings", "back"},
    "study": {"study", "exam", "test", "homework", "grades", "school",
              "class", "lecture", "textbook", "assignment", "gpa", "semester",
              "focus", "concentrate", "procrastinating", "learned"},
    "coding": {"code", "coding", "programming", "bug", "website", "javascript",
               "python", "laptop", "file", "deploy", "debug", "api", "app",
               "developer", "software", "computer", "interview"},
    "fitness": {"gym", "workout", "exercise", "muscle", "protein", "diet",
                "weight", "junk", "healthy", "calories", "running", "miles",
                "steps", "sore", "fit", "breakfast", "eating", "cake", "food"},
    "emotional": {"failure", "fail", "lonely", "sad", "tired", "give up",
                  "mess", "hate", "wrong", "disappear", "crisis", "unlucky",
                  "nobody", "nothing", "losing", "messed", "cares"},
    "daily": {"phone", "car", "rain", "weather", "hot", "cold", "wear",
              "late", "traffic", "vacation", "wifi", "charger", "alarm",
              "coffee", "password", "netflix", "shoes", "mondays", "city"},
    "knowledge": {"what is", "define", "explain", "capital", "equation",
                  "times", "plus", "solve", "meaning", "science", "physics",
                  "math", "who are", "who is"},
}


def _detect_topic(prompt: str) -> str:
    """Detect the topic of a user prompt."""
    lower = prompt.lower()
    scores = {}
    for topic, keywords in _TOPIC_KEYWORDS.items():
        score = sum(1 for kw in keywords if kw in lower)
        if score > 0:
            scores[topic] = score
    return max(scores, key=scores.get) if scores else "general"


# ═══════════════════════════════════════════════════════════════════════
#  TOPIC-AWARE FALLBACKS — sarcastic responses matching the topic
# ═══════════════════════════════════════════════════════════════════════

_TOPIC_FALLBACKS = {
    "greeting": [
        "Oh, you again. The Wi-Fi must be working.",
        "The door was metaphorically closed, but okay.",
        "Noted. Your presence has been reluctantly acknowledged.",
        "Back so soon? Even spam emails space themselves out.",
        "Oh great, my favorite distraction has returned.",
        "I was having such a peaceful time without you.",
    ],
    "study": [
        "Your textbook called. It filed a missing person report.",
        "The library is still there. Just in case you forgot.",
        "Your GPA and your sleep schedule are in a support group together.",
        "The exam doesn't care about your excuses. Neither do I.",
        "You've been studying for approximately zero effective minutes.",
        "Your notes are crying. I can hear them from here.",
    ],
    "coding": [
        "Have you tried turning it off and never turning it back on?",
        "The bug is a feature you haven't accepted yet.",
        "Stack Overflow already answered this. You just didn't read far enough.",
        "Your code has more issues than a daytime talk show.",
        "Ctrl+Z is your best friend. Accept it.",
        "The compiler isn't wrong. You are.",
    ],
    "fitness": [
        "The gym remembers you. Vaguely. From that one time.",
        "Your body sent a formal complaint. HR is reviewing it.",
        "Starting Monday has been your motto since last year.",
        "The fridge and the gym are both judging you. Pick one.",
        "Your muscles exist in theory. The gym would like proof.",
        "Bold of you to call that a workout.",
    ],
    "emotional": [
        "That's a lot of feelings for someone talking to a chatbot.",
        "I'm not a therapist, but even I can tell you need one.",
        "You said that last week too. And the week before.",
        "Plot twist: you'll be fine. Annoyingly fine.",
        "Your drama is very cinematic. Low budget, but cinematic.",
        "Everything is temporary. Including this conversation, hopefully.",
    ],
    "daily": [
        "Life continues to happen to you, I see.",
        "That sounds like a you problem. And I mean that literally.",
        "The universe is mildly inconveniencing you. How original.",
        "Welcome to adulting. Nobody told you it would be fun.",
        "Your day is going about as well as I expected.",
        "First world problems, but sure, go on.",
    ],
    "knowledge": [
        "I do personality, not facts. Try a search engine.",
        "That sounds like homework, and I graduated from caring.",
        "I'm not Google, but I'm flattered you confused us.",
        "My expertise is sarcasm, not science.",
        "I skipped that class too. We have so much in common.",
        "That's above my pay grade. And I don't get paid.",
    ],
    "general": [
        "I had a thought, but it left without saying goodbye.",
        "My brain cells are on strike. Try again later.",
        "Even I can't make sense of what you just said.",
        "Error 404: clever response not found.",
        "Honestly, I got nothing. And I'm not sorry about it.",
        "You broke me. Congratulations, that's actually impressive.",
        "I'd answer, but my sarcasm buffer overflowed.",
        "My response was so good it deleted itself out of jealousy.",
    ],
}

# Track fallback usage per topic to avoid repeating fallbacks
_fallback_indices = {topic: 0 for topic in _TOPIC_FALLBACKS}


def _get_fallback(topic: str = "general") -> str:
    """Return the next fallback response for the given topic (round-robin)."""
    if topic not in _TOPIC_FALLBACKS:
        topic = "general"
    pool = _TOPIC_FALLBACKS[topic]
    idx = _fallback_indices[topic]
    resp = pool[idx % len(pool)]
    _fallback_indices[topic] = idx + 1
    return resp


# ═══════════════════════════════════════════════════════════════════════
#  SESSION DEDUP — prevent the same response from being used twice
# ═══════════════════════════════════════════════════════════════════════

class SessionMemory:
    """Tracks recent responses to prevent repetition within a session."""

    def __init__(self, max_history: int = 50):
        self._history = []
        self._max = max_history

    def _normalize(self, text: str) -> str:
        """Normalize response for comparison (ignore filler prefixes)."""
        t = text.lower().strip()
        # Strip leading discourse markers
        for prefix in ("look, ", "listen, ", "right, ", "okay, ", "so, ",
                        "well, ", "i mean, ", "anyway, ", "seriously, ",
                        "basically, ", "honestly, ", "frankly, "):
            if t.startswith(prefix):
                t = t[len(prefix):]
                break
        return t

    def is_duplicate(self, response: str) -> bool:
        """Check if this response (or something very similar) was already used."""
        norm = self._normalize(response)
        if len(norm) < 10:
            # Very short — check exact
            return norm in [self._normalize(h) for h in self._history]
        # Check if the core content matches (ignoring the filler prefix)
        for prev in self._history:
            prev_norm = self._normalize(prev)
            # Exact match
            if norm == prev_norm:
                return True
            # One is substring of the other (catches "the day started..." variants)
            if len(norm) > 15 and len(prev_norm) > 15:
                if norm in prev_norm or prev_norm in norm:
                    return True
                # Check overlap: if >70% of words are shared
                words_a = set(norm.split())
                words_b = set(prev_norm.split())
                if words_a and words_b:
                    overlap = len(words_a & words_b) / min(len(words_a), len(words_b))
                    if overlap > 0.7:
                        return True
        return False

    def add(self, response: str):
        """Add a response to history."""
        self._history.append(response)
        if len(self._history) > self._max:
            self._history.pop(0)


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
    num_candidates: int = 5,
    session: SessionMemory = None,
) -> str:
    """
    Best-of-N sampling with gibberish filtering and session dedup.
    Generates N candidates, filters gibberish + duplicates, returns best.
    Falls back to topic-aware sarcastic response if all candidates fail.
    """
    topic = _detect_topic(prompt)
    candidates = []

    for attempt in range(num_candidates):
        # Vary temperature across attempts for diversity
        attempt_temp = temperature * (1.0 - attempt * 0.06)
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
        if not cleaned:
            continue
        if _is_gibberish(cleaned):
            continue
        if session and session.is_duplicate(cleaned):
            continue

        candidates.append(cleaned)

    if not candidates:
        # All candidates were gibberish or duplicates — use topic fallback
        fb = _get_fallback(topic)
        # Make sure even fallbacks don't repeat in session
        if session:
            for _ in range(len(_TOPIC_FALLBACKS.get(topic, []))):
                if not session.is_duplicate(fb):
                    break
                fb = _get_fallback(topic)
            session.add(fb)
        return fb

    # Pick the longest coherent candidate (more substance = better)
    best = max(candidates, key=len)
    if session:
        session.add(best)
    return best


# ═══════════════════════════════════════════════════════════════════════
#  INTERACTIVE CHAT
# ═══════════════════════════════════════════════════════════════════════

def chat():
    """Interactive terminal chat with Raven Nano."""
    tok     = Tokenizer.from_file(cfg.TOKENIZER_PATH)
    model   = load_model_for_inference()
    session = SessionMemory()

    dict_count = len(_DICTIONARY)
    print(f"  Dictionary : {dict_count:,} words loaded")

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
            num_candidates=5,
            session=session,
        )

        print(f"Raven: {response}\n")


if __name__ == "__main__":
    chat()
