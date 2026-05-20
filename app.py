# app.py
# Raven Nano — Minimal monochrome chatbot UI

import gradio as gr
import torch
import torch.nn.functional as F
from tokenizers import Tokenizer
from config import cfg
from model import RavenNano

# ── Model ────────────────────────────────────────────────────────────

def load_model():
    path = cfg.BEST_CHECKPOINT
    ckpt  = torch.load(path, map_location=cfg.DEVICE, weights_only=False)
    model = RavenNano().to(cfg.DEVICE)
    model.load_state_dict(ckpt["model"])
    model.eval()
    print(f"Loaded step {ckpt['step']} | val_loss {ckpt['val_loss']:.4f}")
    return model

MODEL = load_model()
TOK   = Tokenizer.from_file(cfg.TOKENIZER_PATH)
_recent = []

# ── Generation ───────────────────────────────────────────────────────

def generate(prompt, temp=0.65, top_k=25, top_p=0.85, rep_pen=1.10):
    eos_id = TOK.token_to_id(cfg.EOS_TOKEN)
    ids = torch.tensor([TOK.encode(f"{cfg.USER_TOKEN} {prompt}\n{cfg.RAVEN_TOKEN}").ids],
                       dtype=torch.long).to(cfg.DEVICE)
    gen = []
    with torch.no_grad():
        for _ in range(cfg.MAX_NEW_TOKENS):
            logits, _ = MODEL(ids[:, -cfg.CONTEXT_LEN:])
            logits = logits[:, -1, :]
            if gen and rep_pen != 1.0:
                for t in set(gen):
                    if logits[0, t] < 0: logits[0, t] *= rep_pen
                    else: logits[0, t] /= rep_pen
            logits /= temp
            if top_k > 0:
                v, _ = torch.topk(logits, top_k)
                logits = logits.masked_fill(logits < v[:, -1:], float("-inf"))
            probs = F.softmax(logits, dim=-1)
            if top_p < 1.0:
                sp, si = torch.sort(probs, descending=True)
                sp[torch.cumsum(sp, -1) - sp > top_p] = 0.0
                sp /= sp.sum()
                nxt = si.gather(-1, torch.multinomial(sp, 1))
            else:
                nxt = torch.multinomial(probs, 1)
            t = nxt.item()
            if t == eos_id: break
            gen.append(t)
            ids = torch.cat([ids, nxt], dim=1)
    return TOK.decode(gen).strip()

def respond(prompt):
    global _recent
    for i in range(3):
        r = generate(prompt, temp=0.65 * (1.0 + i * 0.1))
        if r.lower() not in [x.lower() for x in _recent]:
            _recent = (_recent + [r])[-20:]
            return r
    _recent = (_recent + [r])[-20:]
    return r

# ── CSS ──────────────────────────────────────────────────────────────

CSS = """
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');

/* Reset */
.gradio-container {
    max-width: 680px !important;
    margin: 0 auto !important;
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif !important;
    padding: 0 20px !important;
    background: #ffffff !important;
}
.dark .gradio-container { background: #0a0a0a !important; }
footer { display: none !important; }
.block, .contain, .panel {
    border: none !important;
    box-shadow: none !important;
    background: transparent !important;
}

/* Header */
.head {
    text-align: center;
    padding: 48px 0 28px;
}
.head h1 {
    font-size: 1.5rem;
    font-weight: 700;
    letter-spacing: -0.04em;
    margin: 0 0 4px;
    color: #0a0a0a;
}
.dark .head h1 { color: #fafafa; }
.head p {
    font-size: 0.82rem;
    color: #999;
    margin: 0;
    font-weight: 400;
    letter-spacing: -0.01em;
}
.dark .head p { color: #555; }

/* Chat */
#chatbox { padding: 0 !important; }

#chatbox .chatbot {
    border: 1px solid #e5e5e5 !important;
    border-radius: 16px !important;
    box-shadow: none !important;
    background: #fafafa !important;
}
.dark #chatbox .chatbot {
    border-color: #1a1a1a !important;
    background: #0f0f0f !important;
}

#chatbox .message {
    font-size: 0.88rem !important;
    line-height: 1.65 !important;
    letter-spacing: -0.01em !important;
    border-radius: 14px !important;
    padding: 10px 16px !important;
}

#chatbox .user-row .message {
    background: #0a0a0a !important;
    color: #fafafa !important;
    border-bottom-right-radius: 4px !important;
}
.dark #chatbox .user-row .message {
    background: #fafafa !important;
    color: #0a0a0a !important;
}

#chatbox .bot-row .message {
    background: #ffffff !important;
    color: #0a0a0a !important;
    border: 1px solid #ebebeb !important;
    border-bottom-left-radius: 4px !important;
}
.dark #chatbox .bot-row .message {
    background: #141414 !important;
    color: #e5e5e5 !important;
    border-color: #1f1f1f !important;
}

/* Input */
#input-row { padding: 12px 0 6px !important; border: none !important; background: transparent !important; }

#input-row textarea {
    border-radius: 12px !important;
    padding: 12px 16px !important;
    font-size: 0.88rem !important;
    font-family: 'Inter', sans-serif !important;
    border: 1px solid #e5e5e5 !important;
    background: #fff !important;
    color: #0a0a0a !important;
    transition: border-color 0.15s !important;
    resize: none !important;
}
#input-row textarea:focus {
    border-color: #0a0a0a !important;
    box-shadow: none !important;
    outline: none !important;
}
.dark #input-row textarea {
    border-color: #222 !important;
    background: #0f0f0f !important;
    color: #e5e5e5 !important;
}
.dark #input-row textarea:focus {
    border-color: #fafafa !important;
}

/* Send */
#send-btn {
    border-radius: 12px !important;
    font-weight: 600 !important;
    font-size: 0.84rem !important;
    padding: 10px 24px !important;
    background: #0a0a0a !important;
    border: none !important;
    color: #fafafa !important;
    transition: opacity 0.15s !important;
    min-height: 44px !important;
    box-shadow: none !important;
}
#send-btn:hover { opacity: 0.8 !important; }
.dark #send-btn {
    background: #fafafa !important;
    color: #0a0a0a !important;
}

/* Clear */
#clear-btn {
    border-radius: 12px !important;
    font-weight: 500 !important;
    font-size: 0.82rem !important;
    border: 1px solid #e5e5e5 !important;
    background: transparent !important;
    color: #666 !important;
    transition: all 0.15s !important;
    min-height: 40px !important;
    box-shadow: none !important;
}
#clear-btn:hover {
    border-color: #ccc !important;
    color: #333 !important;
}
.dark #clear-btn {
    border-color: #222 !important;
    color: #666 !important;
}
.dark #clear-btn:hover {
    border-color: #444 !important;
    color: #aaa !important;
}

/* Examples */
#examples { padding: 0 !important; border: none !important; background: transparent !important; }
#examples .label-wrap {
    font-size: 0.7rem !important;
    font-weight: 600 !important;
    opacity: 0.35 !important;
    text-transform: uppercase !important;
    letter-spacing: 0.08em !important;
}
#examples button {
    border-radius: 8px !important;
    font-size: 0.8rem !important;
    font-family: 'Inter', sans-serif !important;
    padding: 5px 12px !important;
    border: 1px solid #e5e5e5 !important;
    background: transparent !important;
    color: #555 !important;
    transition: all 0.12s !important;
}
#examples button:hover {
    border-color: #0a0a0a !important;
    color: #0a0a0a !important;
}
.dark #examples button {
    border-color: #222 !important;
    color: #666 !important;
}
.dark #examples button:hover {
    border-color: #fafafa !important;
    color: #fafafa !important;
}

/* Footer */
.foot {
    text-align: center;
    font-size: 0.68rem;
    color: #bbb;
    padding: 16px 0 28px;
    letter-spacing: 0.01em;
}
.dark .foot { color: #333; }

/* Responsive */
@media (max-width: 640px) {
    .gradio-container { padding: 0 12px !important; }
    .head { padding: 32px 0 20px; }
    .head h1 { font-size: 1.3rem; }
    .head p { font-size: 0.78rem; }
    #chatbox .chatbot { border-radius: 14px !important; }
    #chatbox .message { font-size: 0.84rem !important; padding: 8px 14px !important; }
    #send-btn { padding: 10px 18px !important; }
}
"""

# ── App ──────────────────────────────────────────────────────────────

EXAMPLES = [
    ["hey"], ["my code won't run"], ["i failed the test"],
    ["explain quantum physics"], ["i'm having a midlife crisis at 20"],
    ["asdfghjkl"], ["i broke my charger"], ["gonna hit the gym"],
]

theme = gr.themes.Base(
    primary_hue=gr.themes.colors.neutral,
    secondary_hue=gr.themes.colors.neutral,
    neutral_hue=gr.themes.colors.neutral,
    font=gr.themes.GoogleFont("Inter"),
    radius_size=gr.themes.sizes.radius_lg,
).set(
    body_background_fill="#ffffff",
    body_background_fill_dark="#0a0a0a",
    block_background_fill="transparent",
    block_background_fill_dark="transparent",
    block_border_width="0px",
    block_shadow="none",
    panel_background_fill="transparent",
    panel_background_fill_dark="transparent",
    input_background_fill="transparent",
    input_background_fill_dark="transparent",
    button_primary_background_fill="#0a0a0a",
    button_primary_background_fill_dark="#fafafa",
    button_primary_text_color="#fafafa",
    button_primary_text_color_dark="#0a0a0a",
)

with gr.Blocks(title="Raven Nano") as demo:

    gr.HTML('<div class="head"><h1>Raven Nano</h1><p>6M parameters. Maximum sarcasm.</p></div>')

    chatbot = gr.Chatbot(
        height=460, show_label=False,
        placeholder="Say something — if you dare.",
        elem_id="chatbox", layout="bubble",
    )

    with gr.Row(elem_id="input-row"):
        msg = gr.Textbox(
            placeholder="Message Raven...",
            show_label=False, scale=5, container=False, autofocus=True,
        )
        send_btn = gr.Button("Send", variant="primary", scale=1, min_width=80, elem_id="send-btn")

    with gr.Row():
        clear_btn = gr.Button("Clear chat", elem_id="clear-btn")

    gr.Examples(examples=EXAMPLES, inputs=msg, label="Try these", elem_id="examples")
    gr.HTML('<div class="foot">Built with PyTorch · Trained with sarcasm · Deployed with minimal regret</div>')

    def submit(message, history):
        if not message or not message.strip(): return "", history
        return "", history + [
            {"role": "user", "content": message},
            {"role": "assistant", "content": respond(message.strip())},
        ]

    def clear():
        global _recent
        _recent = []
        return None

    msg.submit(submit, [msg, chatbot], [msg, chatbot])
    send_btn.click(submit, [msg, chatbot], [msg, chatbot])
    clear_btn.click(clear, None, chatbot)

if __name__ == "__main__":
    demo.launch(
        server_name="0.0.0.0", server_port=7860,
        share=False, show_error=True,
        css=CSS, theme=theme,
    )
