/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        jarvis: {
          primary: '#00D4FF',
          secondary: '#0088CC',
          accent: '#00FFCC',
          warning: '#FF6B00',
          critical: '#FF2244',
          background: '#000810',
          grid: 'rgba(0, 212, 255, 0.06)',
          panel: 'rgba(0, 20, 40, 0.7)'
        }
      },
      fontFamily: {
        orbitron: ['Orbitron', 'sans-serif'],
        rajdhani: ['Rajdhani', 'sans-serif'],
        mono: ['Share Tech Mono', 'monospace']
      },
      animation: {
        'scanline': 'scanline 8s linear infinite',
        'holo-flicker': 'holoFlicker 4s infinite',
        'glow-pulse': 'glowPulse 2s ease-in-out infinite',
        'data-scroll': 'dataScroll 20s linear infinite',
        'radar-sweep': 'radarSweep 4s linear infinite',
        'corner-pulse': 'cornerPulse 2s ease-in-out infinite',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'spin-slow': 'spin 20s linear infinite'
      },
      keyframes: {
        scanline: {
          '0%': { backgroundPosition: '0 0' },
          '100%': { backgroundPosition: '0 100vh' }
        },
        holoFlicker: {
          '0%, 100%': { opacity: '1' },
          '92%': { opacity: '1' },
          '93%': { opacity: '0.8' },
          '94%': { opacity: '1' },
          '96%': { opacity: '0.6' },
          '97%': { opacity: '1' }
        },
        glowPulse: {
          '0%, 100%': { boxShadow: '0 0 10px #00D4FF, 0 0 20px #00D4FF44' },
          '50%': { boxShadow: '0 0 20px #00D4FF, 0 0 40px #00D4FF66, 0 0 60px #00D4FF22' }
        },
        dataScroll: {
          '0%': { transform: 'translateY(0)' },
          '100%': { transform: 'translateY(-50%)' }
        },
        radarSweep: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' }
        },
        cornerPulse: {
          '0%, 100%': { opacity: '0.4' },
          '50%': { opacity: '1' }
        }
      },
      textShadow: {
        'glow': '0 0 10px #00D4FF, 0 0 20px #00D4FF44',
        'glow-lg': '0 0 20px #00D4FF, 0 0 40px #00D4FF66, 0 0 60px #00D4FF22'
      }
    }
  },
  plugins: [
    function({ addUtilities }) {
      addUtilities({
        '.text-shadow-glow': {
          textShadow: '0 0 10px #00D4FF, 0 0 20px #00D4FF44'
        },
        '.text-shadow-glow-lg': {
          textShadow: '0 0 20px #00D4FF, 0 0 40px #00D4FF66, 0 0 60px #00D4FF22'
        }
      })
    }
  ]
}
