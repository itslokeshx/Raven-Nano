# model.py
# Raven Nano — Full transformer architecture.
# GPT-style decoder-only. Pre-LayerNorm. Weight tied.

import math
import torch
import torch.nn as nn
import torch.nn.functional as F
from config import cfg


class CausalSelfAttention(nn.Module):
    """
    Multi-head causal self-attention.
    Uses PyTorch's scaled_dot_product_attention (FlashAttention when available).
    """

    def __init__(self):
        super().__init__()
        assert cfg.EMBED_DIM % cfg.N_HEADS == 0

        self.qkv_proj = nn.Linear(cfg.EMBED_DIM, 3 * cfg.EMBED_DIM, bias=False)
        self.out_proj = nn.Linear(cfg.EMBED_DIM, cfg.EMBED_DIM, bias=False)
        self.attn_drop = nn.Dropout(cfg.DROPOUT)

        self.n_heads  = cfg.N_HEADS
        self.head_dim = cfg.EMBED_DIM // cfg.N_HEADS
        self.embed_dim = cfg.EMBED_DIM

    def forward(self, x):
        B, T, C = x.shape
        qkv = self.qkv_proj(x)
        q, k, v = qkv.split(self.embed_dim, dim=2)

        q = q.view(B, T, self.n_heads, self.head_dim).transpose(1, 2)
        k = k.view(B, T, self.n_heads, self.head_dim).transpose(1, 2)
        v = v.view(B, T, self.n_heads, self.head_dim).transpose(1, 2)

        y = F.scaled_dot_product_attention(
            q, k, v, attn_mask=None,
            dropout_p=cfg.DROPOUT if self.training else 0.0,
            is_causal=True
        )

        y = y.transpose(1, 2).contiguous().view(B, T, C)
        return self.out_proj(y)


class FeedForward(nn.Module):
    """Two-layer MLP with GELU activation. EMBED_DIM -> FFN_DIM -> EMBED_DIM."""

    def __init__(self):
        super().__init__()
        self.net = nn.Sequential(
            nn.Linear(cfg.EMBED_DIM, cfg.FFN_DIM, bias=False),
            nn.GELU(),
            nn.Linear(cfg.FFN_DIM, cfg.EMBED_DIM, bias=False),
            nn.Dropout(cfg.DROPOUT),
        )

    def forward(self, x):
        return self.net(x)


class TransformerBlock(nn.Module):
    """Pre-LayerNorm transformer block: LN -> Attn -> Residual -> LN -> FFN -> Residual."""

    def __init__(self):
        super().__init__()
        self.ln1  = nn.LayerNorm(cfg.EMBED_DIM)
        self.attn = CausalSelfAttention()
        self.ln2  = nn.LayerNorm(cfg.EMBED_DIM)
        self.ffn  = FeedForward()

    def forward(self, x):
        x = x + self.attn(self.ln1(x))
        x = x + self.ffn(self.ln2(x))
        return x


class RavenNano(nn.Module):
    """
    Full Raven Nano transformer.
    Token + positional embeddings -> N transformer blocks -> LN -> LM head.
    Weight tying between token embedding and LM head saves ~1.3M params.
    """

    def __init__(self):
        super().__init__()

        self.token_emb = nn.Embedding(cfg.VOCAB_SIZE, cfg.EMBED_DIM)
        self.pos_emb   = nn.Embedding(cfg.CONTEXT_LEN, cfg.EMBED_DIM)
        self.drop      = nn.Dropout(cfg.DROPOUT)
        self.blocks    = nn.ModuleList([TransformerBlock() for _ in range(cfg.N_LAYERS)])
        self.final_ln  = nn.LayerNorm(cfg.EMBED_DIM)
        self.lm_head   = nn.Linear(cfg.EMBED_DIM, cfg.VOCAB_SIZE, bias=False)

        if cfg.WEIGHT_TYING:
            self.lm_head.weight = self.token_emb.weight

        self.apply(self._init_weights)

        # Scale residual projections by 1/sqrt(2*N_LAYERS)
        scale = (2 * cfg.N_LAYERS) ** -0.5
        for block in self.blocks:
            nn.init.normal_(block.attn.out_proj.weight, mean=0.0, std=0.02 * scale)
            nn.init.normal_(block.ffn.net[2].weight,   mean=0.0, std=0.02 * scale)

    def _init_weights(self, module):
        """Standard GPT-style weight initialization."""
        if isinstance(module, nn.Linear):
            nn.init.normal_(module.weight, mean=0.0, std=0.02)
            if module.bias is not None:
                nn.init.zeros_(module.bias)
        elif isinstance(module, nn.Embedding):
            nn.init.normal_(module.weight, mean=0.0, std=0.02)
        elif isinstance(module, nn.LayerNorm):
            nn.init.ones_(module.weight)
            nn.init.zeros_(module.bias)

    def forward(self, idx, targets=None):
        """
        Forward pass.
        Args:
            idx     : (B, T) token indices
            targets : (B, T) target indices for loss
        Returns:
            logits  : (B, T, vocab_size)
            loss    : scalar cross-entropy loss (None if no targets)
        """
        B, T = idx.shape
        assert T <= cfg.CONTEXT_LEN, \
            f"Sequence length {T} exceeds context window {cfg.CONTEXT_LEN}"

        positions = torch.arange(T, device=idx.device)
        x = self.drop(self.token_emb(idx) + self.pos_emb(positions))

        for block in self.blocks:
            x = block(x)

        x = self.final_ln(x)
        logits = self.lm_head(x)

        loss = None
        if targets is not None:
            loss = F.cross_entropy(
                logits.view(-1, cfg.VOCAB_SIZE),
                targets.view(-1),
                ignore_index=-1
            )

        return logits, loss

    def count_parameters(self):
        """Count total trainable parameters."""
        total = sum(p.numel() for p in self.parameters() if p.requires_grad)
        if cfg.WEIGHT_TYING:
            total -= self.token_emb.weight.numel()
        return total


def build_model():
    """Build model and print parameter count."""
    model = RavenNano().to(cfg.DEVICE)
    n_params = model.count_parameters()
    print(f"Raven Nano initialized")
    print(f"  Parameters : {n_params / 1e6:.2f}M")
    print(f"  Layers     : {cfg.N_LAYERS}")
    print(f"  Heads      : {cfg.N_HEADS}")
    print(f"  Embed dim  : {cfg.EMBED_DIM}")
    print(f"  FFN dim    : {cfg.FFN_DIM}")
    print(f"  Vocab      : {cfg.VOCAB_SIZE}")
    print(f"  Context    : {cfg.CONTEXT_LEN}")
    return model
