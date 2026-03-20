# J.A.R.V.I.S. Holographic Interface

A complete, production-grade JARVIS AI holographic web experience inspired by Iron Man. This is a pure frontend React application featuring a holographic HUD, ambient AI voice lines, cinematic wake/sleep sequences, and a living, breathing AI presence.

![JARVIS Interface](./preview.png)

## Features

- **Holographic HUD**: Full-screen glassmorphic interface with cyan glow effects
- **3D Arc Reactor Core**: Three.js powered holographic center with rotating data rings and particle field
- **Voice Recognition**: Web Speech API powered voice commands
- **Text-to-Speech**: JARVIS speaks using browser's speech synthesis
- **Procedural Audio**: Tone.js generated sound effects (no audio file dependencies)
- **Cinematic Boot Sequence**: Stark Industries themed startup animation
- **Live Metrics**: Real-time fluctuating system data
- **Idle Behavior**: JARVIS speaks randomly during inactivity

## Tech Stack

- **React 18** + **Vite**
- **Framer Motion** - All animations
- **Three.js** + **@react-three/fiber** + **@react-three/drei** - 3D holographic core
- **Tone.js** - Procedural sound synthesis
- **Web Speech API** - Voice recognition + speech synthesis
- **Tailwind CSS** - Utility styling
- **Zustand** - Global state management

## Getting Started

### Prerequisites

- Node.js 18+ and npm

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

### Usage

1. **Boot**: The system starts in boot mode with the Stark Industries sequence
2. **Wake**: After boot completes, the system is active and ready
3. **Voice Commands**: Click the microphone button or type commands:
   - "Hello JARVIS" - Greeting
   - "Status report" - System status
   - "What's the time/date" - Time/date info
   - "Power levels" - Reactor output
   - "Suit up" - Deploy suit
   - "Sleep JARVIS" - Enter sleep mode
4. **Manual Controls**: Use the WAKE, SLEEP, and ALERT buttons

## Voice Commands

| Command | Response |
|---------|----------|
| hello jarvis | Greeting |
| status report | System status |
| run diagnostics | Diagnostic message |
| what's the time | Current time |
| what's the date | Current date |
| power levels | Reactor output |
| suit up | Deploy suit sequence |
| shields | Shield status |
| who are you | JARVIS introduction |
| thank you | You're welcome |
| sleep jarvis | Enter sleep mode |

## Project Structure

```
src/
├── App.jsx                    # Root component
├── store/
│   └── jarvisStore.js         # Zustand store
├── components/
│   ├── three/                 # Three.js 3D components
│   │   ├── HologramScene.jsx  # Main 3D canvas
│   │   ├── HologramCore.jsx   # Arc reactor orb
│   │   ├── DataRings.jsx      # Rotating orbital rings
│   │   ├── HexGrid.jsx        # Animated hex background
│   │   └── ParticleField.jsx  # Floating particles
│   ├── hud/                   # HUD components
│   │   ├── MainHUD.jsx        # Master layout
│   │   ├── TopBar.jsx         # Header with clock
│   │   ├── LeftPanel.jsx      # System diagnostics
│   │   ├── RightPanel.jsx     # Comms and news
│   │   ├── BottomBar.jsx      # Input controls
│   │   └── RadarSweep.jsx     # Radar animation
│   ├── dialogue/              # Dialogue system
│   │   ├── DialogueOverlay.jsx
│   │   └── VoiceWaveform.jsx
│   ├── sequences/             # Boot/Sleep/Wake sequences
│   │   ├── BootSequence.jsx
│   │   ├── SleepSequence.jsx
│   │   └── WakeSequence.jsx
│   └── ui/                    # Reusable UI components
│       ├── GlassPanel.jsx
│       ├── HoloButton.jsx
│       ├── SystemMetric.jsx
│       └── DataStream.jsx
├── hooks/                     # Custom React hooks
│   ├── useJarvisVoice.js      # Speech synthesis
│   ├── useVoiceRecognition.js # Web Speech API
│   ├── useSoundEngine.js      # Tone.js audio
│   └── useBootSequence.js     # Boot animation
├── data/
│   ├── dialogueLines.js       # All dialogue
│   ├── systemMetrics.js       # Data generators
│   └── newsTickerData.js      # News content
└── styles/
    └── globals.css            # Global styles
```

## Color Palette

| Color | Hex Code | Usage |
|-------|----------|-------|
| Primary Glow | `#00D4FF` | Arc reactor cyan |
| Secondary | `#0088CC` | Deep hologram blue |
| Accent | `#00FFCC` | Teal pulse |
| Warning | `#FF6B00` | Stark orange |
| Critical | `#FF2244` | Alert red |
| Background | `#000810` | Near-black space |

## Browser Compatibility

- Chrome/Edge: Full support (including voice recognition)
- Firefox: Full support (voice recognition may require permissions)
- Safari: Partial support (no voice recognition)

## License

MIT License - This is a fan project for educational purposes.

---

*"I am JARVIS. Just A Rather Very Intelligent System."*
