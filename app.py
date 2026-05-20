# app.py
# Raven Nano — Premium Monochrome UI for Hugging Face Spaces

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
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap');

.gradio-container {
    max-width: 768px !important;
    margin: 0 auto !important;
    font-family: 'Inter', sans-serif !important;
}

/* Hide Hugging Face Footer */
footer { display: none !important; }

/* Header */
.header {
    text-align: center;
    padding: 30px 0 20px;
}
.header h1 {
    font-size: 1.4rem;
    font-weight: 600;
    margin: 0 0 6px;
    letter-spacing: -0.02em;
}
.header p {
    font-size: 0.85rem;
    margin: 0;
    opacity: 0.5;
}

/* Fix input box to match our HTML design */
#input-box textarea {
    border-radius: 24px !important;
    padding: 12px 18px !important;
    border-width: 1px !important;
}

/* Send button circular */
#send-btn {
    border-radius: 24px !important;
}

/* Clear button pill */
#clear-btn {
    border-radius: 24px !important;
}

/* Subtext */
.subtext {
    text-align: center;
    font-size: 0.75rem;
    opacity: 0.4;
    padding: 20px 0;
}
"""

# ── App UI ───────────────────────────────────────────────────────────

EXAMPLES = [
    ["hey"], ["my code won't run"], ["explain quantum physics"],
    ["i broke my charger"], ["i'm having a midlife crisis at 20"]
]

# We use Gradios built in theme engine to force black & white
theme = gr.themes.Base(
    primary_hue=gr.themes.colors.neutral,
    secondary_hue=gr.themes.colors.neutral,
    neutral_hue=gr.themes.colors.neutral,
    font=gr.themes.GoogleFont("Inter"),
    radius_size=gr.themes.sizes.radius_sm,
).set(
    # Light Mode Colors
    body_background_fill="#f9f9fb",
    block_background_fill="#ffffff",
    block_border_width="1px",
    block_border_color="#eaeaea",
    input_background_fill="#ffffff",
    
    # Dark Mode Colors
    body_background_fill_dark="#111111",
    block_background_fill_dark="#1a1a1a",
    block_border_color_dark="#2a2a2a",
    input_background_fill_dark="#1a1a1a",
    
    # Text
    body_text_color="#1a1a1a",
    body_text_color_dark="#f3f3f3",
    
    # Buttons
    button_primary_background_fill="#000000",
    button_primary_background_fill_dark="#ffffff",
    button_primary_text_color="#ffffff",
    button_primary_text_color_dark="#000000",
    
    # Remove shadow
    block_shadow="none"
)

with gr.Blocks(theme=theme, css=CSS, title="Raven Nano") as demo:
    
    gr.HTML('<div class="header"><h1>🐦‍⬛ Raven Nano</h1><p>6M parameters. Maximum sarcasm.</p></div>')
    
    chatbot = gr.Chatbot(
        height=450,
        show_label=False,
        placeholder="What do you want?",
        layout="bubble", # Built in bubble layout
    )
    
    with gr.Row():
        msg = gr.Textbox(
            show_label=False,
            placeholder="Message Raven...",
            scale=5,
            container=False,
            autofocus=True,
            elem_id="input-box"
        )
        send_btn = gr.Button("Send", variant="primary", scale=1, min_width=80, elem_id="send-btn")
        
    with gr.Row():
        clear_btn = gr.Button("Clear Chat", elem_id="clear-btn")
        
    gr.Examples(examples=EXAMPLES, inputs=msg)
    
    gr.HTML('<div class="subtext">Built with PyTorch · Trained with sarcasm</div>')
    
    def user(user_message, history):
        return "", history + [{"role": "user", "content": user_message}]

    def bot(history):
        user_message = history[-1]["content"]
        bot_message = respond(user_message)
        history.append({"role": "assistant", "content": bot_message})
        return history
        
    def clear():
        global _recent
        _recent = []
        return None

    msg.submit(user, [msg, chatbot], [msg, chatbot], queue=False).then(
        bot, chatbot, chatbot
    )
    send_btn.click(user, [msg, chatbot], [msg, chatbot], queue=False).then(
        bot, chatbot, chatbot
    )
    clear_btn.click(clear, None, chatbot, queue=False)

if __name__ == "__main__":
    demo.launch(
        server_name="0.0.0.0",
        server_port=7860,
        share=False,
        show_error=True
    )
