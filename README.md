<p align="center">
  <h1 align="center">🐦‍⬛ Raven Nano</h1>
  <p align="center">
    <em>A 6M-parameter language model with more personality than parameters.</em>
  </p>
  <p align="center">
    <img src="https://img.shields.io/badge/Parameters-6.19M-blueviolet?style=flat-square" />
    <img src="https://img.shields.io/badge/Vocab-4096_BPE-blue?style=flat-square" />
    <img src="https://img.shields.io/badge/Context-128_tokens-green?style=flat-square" />
    <img src="https://img.shields.io/badge/PyTorch-2.1%2B-ee4c2c?style=flat-square&logo=pytorch" />
  </p>
</p>

---

Raven Nano is a hyper-lightweight, GPT-style decoder-only transformer built from scratch and fine-tuned to be a **witty, sarcastic, and personality-driven chatbot**. It doesn't try to be an encyclopedia — it tries to be funny.

It runs on CPU. It runs on a free-tier Colab GPU in under 2 minutes. It fits in ~25MB on disk. And it will roast you for asking it math questions.

---

## ✨ Sample Conversations (Pure Model Output — Zero Filters)

These are **real, unfiltered outputs** from the 6.19M parameter model. No hardcoded fallbacks. No dictionary checking. No post-processing. Just raw transformer generation.

```
You: my code won't run
Raven: The bug is a feature you haven't accepted yet.

You: i failed the test
Raven: The exam is not the one who should feel bad here.

You: explain quantum physics
Raven: My expertise is sarcasm, not science.

You: i'm tired
Raven: Your muscles exist in theory. The gym would like proof.

You: nobody understands me
Raven: I'm not a therapist, but even I can tell you need one.

You: asdfghjkl
Raven: Even I can't make sense of what you just said.

You: what is 47 times 83
Raven: I'm not Google, but I'm flattered you confused us.

You: i broke my charger
Raven: The world is not ending, just your patience.

You: i'm having a midlife crisis at 20
Raven: That's a lot of feelings for someone talking to a chatbot.

You: ...
Raven: You broke me. Congratulations, that's actually impressive.
```

---

## 🏗️ Architecture

Raven Nano is a standard GPT-style decoder-only transformer with Pre-LayerNorm and weight-tying between the input embedding and the language model head.

| Component | Value |
| :--- | :--- |
| **Total Parameters** | 6.19 Million |
| **Transformer Layers** | 6 |
| **Attention Heads** | 8 |
| **Head Dimension** | 40 |
| **Embedding Dimension** | 320 |
| **FFN Hidden Dimension** | 960 (3× embed) |
| **Vocabulary Size** | 4,096 (custom BPE) |
| **Context Window** | 128 tokens |
| **Normalization** | Pre-LayerNorm |
| **Weight Tying** | Enabled (embed ↔ LM head) |
| **Dropout** | 0.1 |
| **Attention** | PyTorch `scaled_dot_product_attention` (FlashAttention when available) |

---

## 🧪 Training Pipeline

The model was developed in two distinct phases.

### Phase 1 — Pre-Training (From Scratch)

The model was trained from random initialization on a 250K-pair sarcastic conversational corpus.

| Setting | Value |
| :--- | :--- |
| **Optimizer** | AdamW |
| **Betas** | (0.9, 0.95) |
| **Weight Decay** | 0.1 |
| **Peak Learning Rate** | 3e-4 |
| **Min Learning Rate** | 3e-5 |
| **LR Schedule** | Cosine decay with linear warmup |
| **Warmup Steps** | 300 |
| **Total Steps** | 10,000 |
| **Micro Batch Size** | 32 |
| **Gradient Accumulation** | 2 (effective batch = 64) |
| **Gradient Clipping** | 1.0 |
| **Precision** | FP16 mixed precision |
| **Dataset** | ~250K sarcastic conversational pairs |
| **Best Validation Loss** | 0.9571 |

**Result:** The model learned strong sarcastic tone and handled greetings, emotional topics, and study-related prompts well. However, it produced **gibberish hallucinations** on out-of-distribution topics like coding, fitness, and daily-life objects (e.g., *"The shrass is a centle"*).

### Phase 2 — Post-Training (Fine-Tuning)

To fix the hallucination problem without destroying the learned personality, we generated a targeted 20K-pair dataset covering the model's blind spots and fine-tuned with a much lower learning rate.

| Setting | Value |
| :--- | :--- |
| **Base Checkpoint** | `raven_nano_best.pt` (step 10,000) |
| **Peak Learning Rate** | 5e-5 |
| **Min Learning Rate** | 5e-6 |
| **Warmup Steps** | 100 |
| **Total Steps** | 2,000 |
| **Dataset** | 20K targeted conversational pairs |
| **Dataset Categories** | Greetings, Study, Coding, Fitness, Emotional, Daily Life, Knowledge Deflection, Commands, Edge Cases |
| **Best Validation Loss** | 1.8212 (step 500) |

**Result:** Complete elimination of gibberish. The model now generates coherent, in-character English for every input tested — including pure nonsense inputs like `asdfghjkl`.

### Before vs. After — Side by Side

| Prompt | Pre-Train Only ❌ | Post-Trained ✅ |
| :--- | :--- | :--- |
| `my code won't run` | *"The shrass is a centle."* | *"The bug is a feature you haven't accepted yet."* |
| `i broke my charger` | *"The diring is a lot of pressure."* | *"The world is not ending, just your patience."* |
| `asdfghjkl` | *"The saming to the fridge and myth."* | *"Even I can't make sense of what you just said."* |
| `explain quantum physics` | *"The centle of a converage."* | *"My expertise is sarcasm, not science."* |
| `i'm running late` | *"The sting is now a centle."* | *"Your usual entrance is fashionably late."* |

---

## 🎛️ Inference Parameters

The sampling strategy uses temperature scaling, top-k, top-p (nucleus), and a repetition penalty.

| Parameter | Default | Description |
| :--- | :--- | :--- |
| **Temperature** | 0.65 | Controls randomness. Lower = more deterministic. |
| **Top-K** | 25 | Only the top 25 tokens are considered at each step. |
| **Top-P** | 0.85 | Nucleus sampling threshold. |
| **Repetition Penalty** | 1.10 | Penalizes already-generated tokens to avoid loops. |
| **Max New Tokens** | 40 | Hard cap on response length. |

The interactive chat also supports switchable **modes**:

| Mode | Temp | Top-K | Top-P | Rep Penalty | Vibe |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `default` | 0.65 | 25 | 0.85 | 1.10 | Balanced, witty |
| `sharp` | 0.55 | 20 | 0.80 | 1.10 | More focused, precise |
| `chaos` | 0.85 | 45 | 0.92 | 1.05 | Wild, unpredictable |
| `cold` | 0.45 | 12 | 0.75 | 1.08 | Dry, minimal |

---

## 📂 Project Structure

```
Raven-Nano/
├── config.py             # All hyperparameters in one place
├── model.py              # Transformer architecture (CausalSelfAttention, TransformerBlock, RavenNano)
├── tokenizer_train.py    # BPE tokenizer training script
├── data_prep.py          # Tokenize raw corpus → binary train/val splits
├── train.py              # Pre-training loop (cosine LR, mixed precision, Drive sync)
├── posttrain.py          # Post-training loop (auto-tokenizes corpus, lower LR)
├── inference.py          # Interactive chat + sampling (SessionMemory anti-repeat)
├── colab_runner.ipynb    # Google Colab notebook for cloud training
├── requirements.txt      # torch, tokenizers, numpy
└── data/
    ├── corpus.txt              # Pre-training corpus (250K pairs)
    └── posttrain_corpus.txt    # Post-training corpus (20K pairs)
```

---

## 🚀 Quickstart

### 1. Install Dependencies

```bash
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### 2. Chat with Raven Nano

Place `raven_nano_posttrain_best.pt` and `raven_nano_tokenizer.json` in the `checkpoints/` directory, then:

```bash
python inference.py
```

```
══════════════════════════════════════════════════
RAVEN NANO — Terminal Chat (Pure Post-Trained)
Type 'quit' to exit. Type 'mode' to change mood.
══════════════════════════════════════════════════

You: hey
Raven: You again. The universe really has no variety.

You: i have an exam tomorrow
Raven: And you're here. Great strategy so far.

You: mode
Current: default
Options: ['default', 'sharp', 'chaos', 'cold']
Select mode: chaos
Mode set to: chaos
```

### 3. Train from Scratch (Optional)

```bash
# Step 1: Train the BPE tokenizer
python tokenizer_train.py

# Step 2: Prepare binary data
python data_prep.py

# Step 3: Pre-train the model
python train.py

# Step 4: Post-train on the targeted dataset
python posttrain.py
```

### 4. Train on Google Colab

Open `colab_runner.ipynb` in Google Colab with a T4 GPU. The notebook handles Drive mounting, training, and checkpoint syncing automatically.

---

## 🔧 Special Tokens

| Token | Purpose |
| :--- | :--- |
| `<\|user\|>` | Marks the start of a user message |
| `<\|raven\|>` | Marks the start of Raven's response |
| `<\|eos\|>` | End of sequence — signals the model to stop generating |
| `<\|pad\|>` | Padding token for batch alignment |

**Prompt format used during training and inference:**

```
<|user|> i failed the test
<|raven|> The exam is not the one who should feel bad here.
```

---

## 📊 Full Evaluation (150 Prompts, 9 Categories)

The model was stress-tested across **150 prompts** spanning 9 categories with zero Python-side filters. Key results:

| Category | Prompts | Coherent | Gibberish | Score |
| :--- | :--- | :--- | :--- | :--- |
| Greetings & Small Talk | 23 | 23 | 0 | **100%** |
| Study & Academics | 20 | 20 | 0 | **100%** |
| Coding & Tech | 10 | 10 | 0 | **100%** |
| Health & Fitness | 20 | 20 | 0 | **100%** |
| Emotional & Deep | 20 | 20 | 0 | **100%** |
| Daily Life & Random | 20 | 20 | 0 | **100%** |
| Requests & Commands | 15 | 15 | 0 | **100%** |
| Knowledge & Impossible | 13 | 13 | 0 | **100%** |
| Gibberish & Edge Cases | 9 | 9 | 0 | **100%** |
| **Total** | **150** | **150** | **0** | **100%** |

---

## 🤔 Design Philosophy

1. **Personality over knowledge.** Raven Nano doesn't pretend to know things. When asked *"what's the capital of Peru?"*, it says *"I skipped that class too. We have so much in common."* — and that's by design.

2. **Fix the model, not the code.** The initial version required 400+ lines of Python dictionary filters to prevent gibberish. Post-training eliminated the root cause, allowing us to delete all of that code. The current `inference.py` is pure sampling — no regex, no word lists, no hardcoded fallbacks.

3. **Small models can have style.** With just 6.19M parameters and a 128-token context, Raven Nano proves that a well-curated dataset matters more than model size for persona-driven applications.

---

<p align="center">
  <em>Built with PyTorch. Trained with sarcasm. Deployed with minimal regret.</em>
</p>
