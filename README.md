# J.A.R.V.I.S. Holographic Interface

A cinematic, mobile-optimized JARVIS-style AI interface built with React, Three.js, and voice interaction.

![JARVIS Interface](./preview.png)

## Why this project is special

- Clean, minimal HUD with responsive mobile-first layout
- Real-time 3D hologram scene (React Three Fiber + postprocessing)
- Voice input via Web Speech API + spoken responses via Speech Synthesis
- Procedural sound effects using Tone.js (no audio files required)
- AI-powered command responses using an external proxy API
- Performance-aware rendering (reduced particle load and mobile tuning)

## Tech stack

- React 18 + Vite
- Tailwind CSS
- Framer Motion
- Three.js, @react-three/fiber, @react-three/drei
- Zustand
- Tone.js
- Web Speech API + Speech Synthesis API

## Quick start

### Prerequisites

- Node.js 18+
- npm 9+

### Install and run

```bash
npm install
npm run dev
```

App runs at the local Vite URL shown in the terminal.

### Build

```bash
npm run build
npm run preview
```

## Scripts

- `npm run dev` — start dev server
- `npm run build` — production build
- `npm run preview` — preview production build

## Core user flow

1. Start onboarding/boot.
2. System transitions to active state.
3. Interact using:
   - Mic button (voice command)
   - Text command input (press Enter to send)
4. A compact “Sent” notification appears after submit for clean UX feedback.

## Example commands

- hello jarvis
- status report
- what’s the time
- power levels
- run diagnostics
- sleep jarvis

## AI API contract (important)

The proxy endpoint expects this payload shape:

```json
{ "inputs": "<full prompt text>" }
```

Expected response key:

```json
{ "generated_text": "..." }
```

If `inputs` is missing, the proxy returns `400` with `{"error":"Missing inputs"}`.

## Browser support

- Chrome / Edge: best experience (full voice support)
- Firefox: mostly supported (permissions behavior may vary)
- Safari (iOS/macOS): limited voice recognition support

## Performance and mobile notes

- Mobile-tuned hologram rendering and lighter visual effects
- Reduced-motion handling for accessibility (`prefers-reduced-motion`)
- Touch-friendly control sizes in command bar
- Dynamic viewport sizing for modern mobile browsers

## Project structure

```text
src/
├── App.jsx
├── components/
│   ├── OnboardingModal.jsx
│   ├── dialogue/
│   ├── hud/
│   ├── sequences/
│   ├── three/
│   └── ui/
├── data/
├── hooks/
├── store/
└── styles/
```

## Troubleshooting

### Voice is not working

- Ensure microphone permission is allowed in the browser.
- Click/tap once on the page first (audio context unlock policy).
- Use Chrome/Edge for most reliable voice recognition.

### AI requests return 400

- Verify request body uses `inputs`.
- Confirm endpoint is reachable and not blocked by network/ad blocker.

### HMR fails after major edits

- Hard refresh the tab.
- If needed, restart dev server (`npm run dev`).

## License

MIT

---

Built as a fan-inspired interface experience for learning, UI/UX experimentation, and creative frontend engineering.
