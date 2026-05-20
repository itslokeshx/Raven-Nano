<p align="center">
  <h1 align="center">🐦‍⬛ Raven Nano</h1>
  <p align="center">
    <strong>A 10M parameter transformer language model, built from scratch.</strong>
  </p>
  <p align="center">
    Trained to deliver one-line sarcastic, funny, and teasing responses to casual human inputs.
  </p>
  <p align="center">
    <img src="https://img.shields.io/badge/Parameters-~10M-blueviolet?style=flat-square" alt="Parameters">
    <img src="https://img.shields.io/badge/Framework-PyTorch-EE4C2C?style=flat-square&logo=pytorch&logoColor=white" alt="PyTorch">
    <img src="https://img.shields.io/badge/Tokenizer-ByteBPE-orange?style=flat-square" alt="Tokenizer">
    <img src="https://img.shields.io/badge/Platform-Colab%20T4-F9AB00?style=flat-square&logo=googlecolab&logoColor=white" alt="Colab">
    <img src="https://img.shields.io/badge/License-MIT-green?style=flat-square" alt="License">
  </p>
</p>

---

## What is Raven Nano?

Raven Nano is a **GPT-style decoder-only transformer** designed to be small enough to train on a free Google Colab T4 GPU, yet expressive enough to develop a consistent personality. Feed it casual conversation and it learns to respond with attitude.

```
You:   i'll start studying tomorrow
Raven: tomorrow's been real patient with you huh

You:   good morning
Raven: it's morning. nothing good about it yet.

You:   i'm a failure
Raven: you're not a failure. failures actually attempt things.
```

> **This is not a general-purpose LLM.** Raven Nano is a character model — trained on a curated corpus to produce short, punchy, in-character responses.

---

## Architecture

| Component | Detail |
|---|---|
| **Type** | Decoder-only Transformer (GPT-style) |
| **Parameters** | ~10M |
| **Layers** | 6 Transformer blocks |
| **Attention** | 8 heads, 40 dims/head |
| **Embedding** | 320 dimensions |
| **FFN** | 960 hidden (3× embed) |
| **Context** | 128 tokens |
| **Vocab** | 4096 (Byte-level BPE) |
| **Norm** | Pre-LayerNorm (more stable at small scale) |
| **Activation** | GELU |
| **Weight Tying** | Yes — embedding ↔ LM head (saves ~1.3M params) |

### Parameter Breakdown

```
Token embedding  (4096 × 320)           ≈  1.31M
Position embedding (128 × 320)          ≈  0.04M
6× Transformer Block:
  ├─ QKV projection  (320 × 960) × 6   ≈  1.84M
  ├─ Output proj     (320 × 320) × 6   ≈  0.61M
  ├─ FFN up          (320 × 960) × 6   ≈  1.84M
  └─ FFN down        (960 × 320) × 6   ≈  1.84M
Final LayerNorm                         ≈  tiny
LM Head (weight tied)                   =  0
────────────────────────────────────────────────
Total                                   ≈  9.8–10.1M
```

---

## Project Structure

```
raven_nano/
│
├── config.py              ← Single source of truth for ALL hyperparameters
├── tokenizer_train.py     ← Trains BPE tokenizer on corpus
├── data_prep.py           ← Tokenizes corpus → binary train/val splits
├── model.py               ← Full transformer architecture
├── train.py               ← Training loop (AMP, grad accum, checkpointing)
├── inference.py           ← Interactive chat interface
├── colab_runner.ipynb     ← End-to-end Colab notebook
├── requirements.txt       ← Dependencies
│
├── data/
│   └── corpus.txt         ← Your training data (you provide this)
│
└── checkpoints/           ← Created during training
    ├── raven_nano_best.pt
    ├── raven_nano_latest.pt
    └── raven_nano_tokenizer.json
```

---

## Quick Start

### Prerequisites

```bash
pip install torch tokenizers numpy
```

### Execution Order

> Run in this exact order. Never skip a step.

```
1. tokenizer_train.py     ← Train BPE tokenizer on corpus
2. data_prep.py           ← Tokenize corpus, save binary files
3. train.py               ← Train the model
4. inference.py           ← Chat with the trained model
```

### Local Training

```bash
# 1. Place your corpus.txt in data/
cp your_corpus.txt data/corpus.txt

# 2. Train tokenizer
python tokenizer_train.py

# 3. Prepare binary data
python data_prep.py

# 4. Train
python train.py

# 5. Chat
python inference.py
```

### Google Colab (Recommended)

Open `colab_runner.ipynb` in Google Colab and run cells top to bottom:

1. **Mount Drive** — for checkpoint persistence
2. **Install deps** — `tokenizers` package
3. **Upload files** — all `.py` files + `corpus.txt` in one upload
4. **Train tokenizer** → **Prepare data** → **Train** → **Test**

If Colab disconnects mid-training:
```python
!python train.py --resume
```
It picks up exactly where it left off from the latest checkpoint.

---

## Training Details

### Hyperparameters

| Parameter | Value |
|---|---|
| Total steps | 10,000 |
| Effective batch size | 64 (32 micro × 2 accum) |
| Learning rate | 3e-4 → 3e-5 (cosine decay) |
| Warmup | 300 steps |
| Optimizer | AdamW (β₁=0.9, β₂=0.95) |
| Weight decay | 0.1 |
| Gradient clip | 1.0 |
| Precision | Mixed (FP16 via AMP) |

### Expected Training Behavior

| Step | Train Loss | Val Loss | Status |
|---|---|---|---|
| 0 | ~8.5 | ~8.5 | Random weights |
| 500 | ~2.8 | ~3.1 | Learning token patterns |
| 1,000 | ~1.9 | ~2.3 | Structure forming |
| 3,000 | ~1.3 | ~1.6 | Character emerging |
| 6,000 | ~0.95 | ~1.2 | Consistent one-liners |
| 10,000 | ~0.80 | ~0.95 | **Locked in** ✓ |

> **Val loss below 1.0** = model has learned Raven's character.

### Checkpointing

- **Best checkpoint** saved whenever validation loss improves
- **Latest checkpoint** saved every 500 steps (for resuming)
- **Drive sync** every 1000 steps (when running on Colab)

---

## Inference

### Terminal Chat

```bash
python inference.py
```

```
You: hey
Raven: oh you're alive. congrats.

You: mode
Current: default
Options: ['default', 'chaos', 'cold']
Select mode: chaos

You: what's the meaning of life
Raven: idk but it's definitely not this conversation
```

### Sampling Modes

| Mode | Temperature | Top-K | Top-P | Vibe |
|---|---|---|---|---|
| `default` | 0.75 | 35 | 0.88 | Balanced sass |
| `chaos` | 1.05 | 60 | 0.95 | Unhinged energy |
| `cold` | 0.48 | 15 | 0.75 | Calculated roasts |

### Sampling Strategy

1. **Repetition penalty** (1.3×) — prevents token loops
2. **Temperature** — controls randomness
3. **Top-K** — keeps only the K most likely tokens
4. **Top-P (nucleus)** — keeps tokens until cumulative prob reaches P
5. **EOS stop** — halts generation at `<|eos|>` token
6. **Hard cap** — max 40 new tokens

---

## Corpus Format

Your `corpus.txt` should contain conversation pairs separated by blank lines:

```
<|user|> hey what's up
<|raven|> the ceiling, probably. you should look into it.

<|user|> i'm so tired
<|raven|> tired of what? you haven't done anything.

<|user|> can you help me with homework
<|raven|> i could. but watching you struggle is more fun.
```

**Guidelines:**
- One pair per block (user message + raven response)
- Blank line between pairs
- Keep responses short (one-liners work best)
- More data = better character consistency

---

## Corpus Design Tips

| ✅ Do | ❌ Don't |
|---|---|
| Keep responses under 20 words | Write multi-paragraph responses |
| Use consistent tone/personality | Mix different character voices |
| Include variety in user inputs | Repeat the same prompts |
| Add 2000+ pairs minimum | Train on < 500 pairs |
| Use natural, casual language | Use formal/academic language |

---

## Technical Design Decisions

| Decision | Why |
|---|---|
| **Byte-level BPE** | Handles any Unicode/emoji input, no UNK tokens |
| **4096 vocab** | Compact vocab forces efficient token usage at small scale |
| **Pre-LayerNorm** | More stable training than Post-LayerNorm for small models |
| **No bias in attention** | Slightly better generalization at this scale |
| **Weight tying** | Saves ~1.3M params — critical at 10M total |
| **Binary data format** | Memmap loads in milliseconds vs. seconds for text parsing |
| **Cosine LR decay** | Smooth convergence, prevents large updates near the end |
| **Gradient accumulation** | Simulates 64 batch size while fitting in T4 16GB VRAM |

---

## Troubleshooting

| Issue | Cause | Fix |
|---|---|---|
| Val loss plateaus before step 5000 | Low quality/quantity corpus | Add more diverse training pairs |
| Val loss spikes | Gradient explosion | Resume from best checkpoint: `train.py --resume` |
| CUDA out of memory | Batch too large | Reduce `MICRO_BATCH` in `config.py` |
| Repetitive outputs | Weak repetition penalty | Increase `REP_PENALTY` in `config.py` |
| Nonsense outputs | Undertrained | Train longer or check corpus formatting |

---

## Requirements

```
torch>=2.1.0
tokenizers>=0.15.0
numpy>=1.24.0
```

**Python 3.10+** required.

---

## License

MIT

---

<p align="center">
  <sub>Built from scratch with pure PyTorch. No HuggingFace Trainer. No shortcuts.</sub>
</p>
