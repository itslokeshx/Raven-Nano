# app.py
# Raven Nano — Premium Chatbot UI for Hugging Face Spaces
# Inspired by Claude / macOS design language

import gradio as gr
import torch
import torch.nn.functional as F
from tokenizers import Tokenizer
from config import cfg
from model import RavenNano

# ═══════════════════════════════════════════════════════════════════════
#  LOAD MODEL
# ═══════════════════════════════════════════════════════════════════════

def load_model():
    path = cfg.BEST_CHECKPOINT
    print(f"Loading model from: {path}")
    ckpt  = torch.load(path, map_location=cfg.DEVICE, weights_only=False)
    model = RavenNano().to(cfg.DEVICE)
    model.load_state_dict(ckpt["model"])
    model.eval()
    print(f"  Loaded from step {ckpt['step']} | val_loss {ckpt['val_loss']:.4f}")
    return model

MODEL = load_model()
TOK   = Tokenizer.from_file(cfg.TOKENIZER_PATH)

_recent = []

# ═══════════════════════════════════════════════════════════════════════
#  GENERATION
# ═══════════════════════════════════════════════════════════════════════

MODES = {
    "Balanced":   {"temperature": 0.65, "top_k": 25, "top_p": 0.85, "rep_penalty": 1.10},
    "Precise":    {"temperature": 0.55, "top_k": 20, "top_p": 0.80, "rep_penalty": 1.10},
    "Creative":   {"temperature": 0.85, "top_k": 45, "top_p": 0.92, "rep_penalty": 1.05},
    "Minimal":    {"temperature": 0.45, "top_k": 12, "top_p": 0.75, "rep_penalty": 1.08},
}

def generate(prompt, temperature=0.65, top_k=25, top_p=0.85, rep_penalty=1.10):
    eos_id = TOK.token_to_id(cfg.EOS_TOKEN)
    full_prompt = f"{cfg.USER_TOKEN} {prompt}\n{cfg.RAVEN_TOKEN}"
    encoded = TOK.encode(full_prompt)
    input_ids = torch.tensor([encoded.ids], dtype=torch.long).to(cfg.DEVICE)
    generated = []
    with torch.no_grad():
        for _ in range(cfg.MAX_NEW_TOKENS):
            idx = input_ids[:, -cfg.CONTEXT_LEN:]
            logits, _ = MODEL(idx)
            logits = logits[:, -1, :]
            if len(generated) > 0 and rep_penalty != 1.0:
                for tid in set(generated):
                    if logits[0, tid] < 0: logits[0, tid] *= rep_penalty
                    else: logits[0, tid] /= rep_penalty
            logits = logits / temperature
            if top_k > 0:
                vals, _ = torch.topk(logits, top_k)
                logits = logits.masked_fill(logits < vals[:, -1:], float("-inf"))
            if top_p < 1.0:
                probs = F.softmax(logits, dim=-1)
                sp, si = torch.sort(probs, descending=True)
                cum = torch.cumsum(sp, dim=-1)
                sp[cum - sp > top_p] = 0.0
                sp /= sp.sum()
                next_token = si.gather(-1, torch.multinomial(sp, 1))
            else:
                probs = F.softmax(logits, dim=-1)
                next_token = torch.multinomial(probs, 1)
            tid = next_token.item()
            if tid == eos_id: break
            generated.append(tid)
            input_ids = torch.cat([input_ids, next_token], dim=1)
    return TOK.decode(generated).strip()

def smart_generate(prompt, mode="Balanced"):
    global _recent
    p = MODES.get(mode, MODES["Balanced"])
    for attempt in range(3):
        t = p["temperature"] * (1.0 + attempt * 0.1)
        resp = generate(prompt, t, p["top_k"], p["top_p"], p["rep_penalty"])
        if resp.lower().strip() not in [r.lower().strip() for r in _recent]:
            _recent.append(resp)
            if len(_recent) > 20: _recent.pop(0)
            return resp
    _recent.append(resp)
    if len(_recent) > 20: _recent.pop(0)
    return resp


# ═══════════════════════════════════════════════════════════════════════
#  PREMIUM CSS — Claude/macOS inspired
# ═══════════════════════════════════════════════════════════════════════

CSS = """
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');

/* ─── Reset & Global ─────────────────────────────────────── */
* { box-sizing: border-box; }

.gradio-container {
    max-width: 760px !important;
    margin: 0 auto !important;
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif !important;
    padding: 0 !important;
}

/* Remove all default gradio borders and shadows */
.gradio-container .contain,
.gradio-container .block {
    border: none !important;
    box-shadow: none !important;
}

/* ─── Header ─────────────────────────────────────────────── */
#header-block {
    padding: 40px 24px 24px !important;
    border: none !important;
    background: transparent !important;
}

.hero {
    text-align: center;
    padding: 0;
}

.hero-icon {
    font-size: 2.8rem;
    margin-bottom: 8px;
    display: block;
    filter: drop-shadow(0 2px 8px rgba(139, 92, 246, 0.3));
}

.hero h1 {
    font-size: 1.75rem;
    font-weight: 800;
    letter-spacing: -0.03em;
    margin: 0 0 6px 0;
    background: linear-gradient(135deg, #7c3aed 0%, #6366f1 50%, #8b5cf6 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
}

.hero-sub {
    font-size: 0.88rem;
    font-weight: 400;
    opacity: 0.55;
    margin: 0 0 16px 0;
    letter-spacing: -0.01em;
}

.specs {
    display: flex;
    justify-content: center;
    gap: 6px;
    flex-wrap: wrap;
}

.spec {
    font-size: 0.72rem;
    font-weight: 600;
    padding: 4px 12px;
    border-radius: 100px;
    letter-spacing: 0.02em;
    text-transform: uppercase;
}

/* Light mode specs */
.spec {
    background: #f5f3ff;
    color: #6d28d9;
    border: 1px solid #ede9fe;
}

/* Dark mode specs */
.dark .spec {
    background: rgba(139, 92, 246, 0.1);
    color: #c4b5fd;
    border: 1px solid rgba(139, 92, 246, 0.15);
}

/* ─── Chatbot ────────────────────────────────────────────── */
#chat-area {
    border: none !important;
    background: transparent !important;
    padding: 0 12px !important;
}

/* Remove chatbot default border */
#chat-area .chatbot {
    border: 1px solid rgba(0, 0, 0, 0.06) !important;
    border-radius: 16px !important;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04) !important;
}

.dark #chat-area .chatbot {
    border-color: rgba(255, 255, 255, 0.06) !important;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2) !important;
}

/* Message bubbles */
#chat-area .message-row .message {
    border-radius: 18px !important;
    padding: 10px 16px !important;
    font-size: 0.9rem !important;
    line-height: 1.6 !important;
    letter-spacing: -0.01em !important;
    max-width: 85% !important;
}

/* User messages — right side, violet tint */
#chat-area .message-row.user-row .message {
    background: #7c3aed !important;
    color: white !important;
    border-bottom-right-radius: 6px !important;
}

/* Bot messages — left side, subtle bg */
#chat-area .message-row.bot-row .message {
    background: #f8f7fa !important;
    color: #1a1a2e !important;
    border-bottom-left-radius: 6px !important;
}

.dark #chat-area .message-row.bot-row .message {
    background: rgba(255, 255, 255, 0.05) !important;
    color: #e2e0e8 !important;
}

/* ─── Input area ─────────────────────────────────────────── */
#input-row {
    padding: 8px 12px 4px !important;
    border: none !important;
    background: transparent !important;
}

#input-row .textbox textarea {
    border-radius: 14px !important;
    padding: 12px 16px !important;
    font-size: 0.9rem !important;
    font-family: 'Inter', sans-serif !important;
    border: 1.5px solid rgba(0, 0, 0, 0.08) !important;
    transition: border-color 0.2s ease, box-shadow 0.2s ease !important;
    background: transparent !important;
}

#input-row .textbox textarea:focus {
    border-color: #7c3aed !important;
    box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.08) !important;
    outline: none !important;
}

.dark #input-row .textbox textarea {
    border-color: rgba(255, 255, 255, 0.08) !important;
}

.dark #input-row .textbox textarea:focus {
    border-color: #8b5cf6 !important;
    box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.12) !important;
}

/* Send button */
#send-btn {
    border-radius: 14px !important;
    font-weight: 600 !important;
    font-size: 0.85rem !important;
    letter-spacing: 0.01em !important;
    padding: 10px 20px !important;
    background: linear-gradient(135deg, #7c3aed, #6366f1) !important;
    border: none !important;
    color: white !important;
    transition: all 0.2s ease !important;
    box-shadow: 0 2px 8px rgba(124, 58, 237, 0.25) !important;
}

#send-btn:hover {
    transform: translateY(-1px) !important;
    box-shadow: 0 4px 12px rgba(124, 58, 237, 0.35) !important;
}

/* ─── Controls row ───────────────────────────────────────── */
#controls-row {
    padding: 4px 12px 2px !important;
    border: none !important;
    background: transparent !important;
}

#controls-row .wrap {
    border-radius: 12px !important;
}

/* Mode dropdown */
#mode-select {
    font-size: 0.85rem !important;
}

#mode-select select,
#mode-select .wrap,
#mode-select input {
    border-radius: 12px !important;
    border: 1.5px solid rgba(0, 0, 0, 0.06) !important;
    font-family: 'Inter', sans-serif !important;
}

.dark #mode-select select,
.dark #mode-select .wrap,
.dark #mode-select input {
    border-color: rgba(255, 255, 255, 0.06) !important;
}

/* Clear button */
#clear-btn {
    border-radius: 12px !important;
    font-weight: 500 !important;
    font-size: 0.83rem !important;
    border: 1.5px solid rgba(0, 0, 0, 0.06) !important;
    background: transparent !important;
    transition: all 0.15s ease !important;
}

#clear-btn:hover {
    border-color: rgba(0, 0, 0, 0.12) !important;
    background: rgba(0, 0, 0, 0.02) !important;
}

.dark #clear-btn {
    border-color: rgba(255, 255, 255, 0.06) !important;
}

.dark #clear-btn:hover {
    border-color: rgba(255, 255, 255, 0.12) !important;
    background: rgba(255, 255, 255, 0.03) !important;
}

/* ─── Examples ───────────────────────────────────────────── */
#examples-area {
    padding: 4px 12px !important;
    border: none !important;
    background: transparent !important;
}

#examples-area .label-wrap {
    font-size: 0.8rem !important;
    font-weight: 600 !important;
    opacity: 0.5 !important;
    text-transform: uppercase !important;
    letter-spacing: 0.05em !important;
}

#examples-area button {
    border-radius: 10px !important;
    font-size: 0.82rem !important;
    font-family: 'Inter', sans-serif !important;
    padding: 6px 14px !important;
    border: 1px solid rgba(0, 0, 0, 0.06) !important;
    background: transparent !important;
    transition: all 0.15s ease !important;
}

#examples-area button:hover {
    background: #f5f3ff !important;
    border-color: #c4b5fd !important;
}

.dark #examples-area button {
    border-color: rgba(255, 255, 255, 0.06) !important;
}

.dark #examples-area button:hover {
    background: rgba(139, 92, 246, 0.08) !important;
    border-color: rgba(139, 92, 246, 0.2) !important;
}

/* ─── Footer ─────────────────────────────────────────────── */
#footer-block {
    border: none !important;
    background: transparent !important;
    padding: 12px 0 20px !important;
}

.footer {
    text-align: center;
    font-size: 0.73rem;
    font-weight: 400;
    opacity: 0.35;
    letter-spacing: 0.01em;
}

/* ─── Hide Gradio branding ───────────────────────────────── */
footer { display: none !important; }
"""

# ═══════════════════════════════════════════════════════════════════════
#  HTML BLOCKS
# ═══════════════════════════════════════════════════════════════════════

HEADER = """
<div class="hero">
    <span class="hero-icon">🐦‍⬛</span>
    <h1>Raven Nano</h1>
    <p class="hero-sub">A 6M-parameter language model with more personality than parameters.</p>
    <div class="specs">
        <span class="spec">6.19M params</span>
        <span class="spec">6 layers</span>
        <span class="spec">4096 vocab</span>
        <span class="spec">128 ctx</span>
    </div>
</div>
"""

FOOTER = '<div class="footer">Built with PyTorch · Trained with sarcasm · Deployed with minimal regret</div>'

EXAMPLES = [
    ["hey"],
    ["my code won't run"],
    ["i failed the test"],
    ["explain quantum physics"],
    ["i'm having a midlife crisis at 20"],
    ["asdfghjkl"],
    ["i broke my charger"],
    ["gonna hit the gym"],
    ["what's the meaning of life"],
]

# ═══════════════════════════════════════════════════════════════════════
#  BUILD UI
# ═══════════════════════════════════════════════════════════════════════

theme = gr.themes.Base(
    primary_hue=gr.themes.colors.violet,
    secondary_hue=gr.themes.colors.indigo,
    neutral_hue=gr.themes.colors.slate,
    font=gr.themes.GoogleFont("Inter"),
    radius_size=gr.themes.sizes.radius_lg,
).set(
    body_background_fill="white",
    body_background_fill_dark="#0f0d13",
    block_background_fill="transparent",
    block_background_fill_dark="transparent",
    block_border_width="0px",
    block_shadow="none",
    panel_background_fill="transparent",
    panel_background_fill_dark="transparent",
)

with gr.Blocks(title="Raven Nano") as demo:

    gr.HTML(HEADER, elem_id="header-block")

    chatbot = gr.Chatbot(
        height=440,
        show_label=False,
        placeholder="Say something — if you dare.",
        elem_id="chat-area",
        layout="bubble",
    )

    with gr.Row(elem_id="input-row"):
        msg = gr.Textbox(
            placeholder="Message Raven...",
            show_label=False,
            scale=5,
            container=False,
            autofocus=True,
            elem_classes=["textbox"],
        )
        send_btn = gr.Button("Send", variant="primary", scale=1, min_width=80, elem_id="send-btn")

    with gr.Row(elem_id="controls-row"):
        mode = gr.Dropdown(
            choices=list(MODES.keys()),
            value="Balanced",
            label="Mode",
            scale=3,
            interactive=True,
            elem_id="mode-select",
        )
        clear_btn = gr.Button("Clear chat", scale=1, min_width=80, elem_id="clear-btn")

    gr.Examples(
        examples=EXAMPLES,
        inputs=msg,
        label="Try these",
        elem_id="examples-area",
    )

    gr.HTML(FOOTER, elem_id="footer-block")

    # ── Handlers ─────────────────────────────────────────────
    def submit(message, history, mode_choice):
        if not message or not message.strip():
            return "", history
        history = history + [
            {"role": "user", "content": message},
            {"role": "assistant", "content": smart_generate(message.strip(), mode_choice)},
        ]
        return "", history

    def clear():
        global _recent
        _recent = []
        return None

    msg.submit(submit, [msg, chatbot, mode], [msg, chatbot])
    send_btn.click(submit, [msg, chatbot, mode], [msg, chatbot])
    clear_btn.click(clear, None, chatbot)

if __name__ == "__main__":
    demo.launch(
        server_name="0.0.0.0",
        server_port=7860,
        share=False,
        show_error=True,
        css=CSS,
        theme=theme,
    )
