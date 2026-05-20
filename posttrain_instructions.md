# Raven Nano Post-Training Guide

This guide explains how to fine-tune the pre-trained Raven Nano model on a diverse, high-quality conversation dataset to improve general knowledge deflection, handling of edge-cases, and topic coverage without losing its unique, sarcastic persona.

## 1. Setup & Data Preparation

We use a generated dataset of 20,000 conversational pairs designed to patch the blind spots of the original training corpus (like coding, daily life annoyances, and edge cases).

1. Generate the raw post-training text corpus:
   ```bash
   python generate_dataset.py
   ```
   *This creates `data/posttrain_corpus.txt`.*

2. Tokenize and prepare binary files:
   ```bash
   python posttrain_data_prep.py
   ```
   *This creates `data/posttrain_train.bin` and `data/posttrain_val.bin`.*

## 2. Post-Training (Fine-Tuning)

The post-training script (`posttrain.py`) uses a lower maximum learning rate (`5e-5` instead of `3e-4`) and trains for only 2,000 steps to gently shift the model's behavior without catastrophic forgetting of the pre-training.

1. Start the post-training process:
   ```bash
   python posttrain.py
   ```
   *This will load `checkpoints/raven_nano_best.pt` as the base model and save new checkpoints prefixed with `raven_nano_posttrain_*`.*

2. Resuming:
   If the run is interrupted, you can resume from the latest post-training checkpoint:
   ```bash
   python posttrain.py --resume
   ```

## 3. Evaluation and Testing

To test the model before and after post-training, use the evaluation prompts list:

```bash
python test_inf.py
```
*(You will need to temporarily modify `test_inf.py` or `inference.py` to load `checkpoints/raven_nano_posttrain_best.pt` instead of `raven_nano_best.pt` to test the new model).*

## 4. Monitoring Quality

During post-training, watch the `val_loss`. 
- **Underfitting:** If the model still gives random gibberish or repeats the exact same phrases for different prompts, it might need more steps.
- **Overfitting:** If the `val_loss` starts to climb, or if the model becomes *too* rigid and loses its fun variance, you should stop early and use the last best checkpoint.

## What changed in this setup?
- A new, highly-balanced dataset that guarantees exposure to coding, fitness, and daily life topics.
- A modified training script with a dedicated LR schedule and step count designed specifically for fine-tuning.
- Checkpoints are saved separately so your original pre-trained weights are untouched.
