import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './hooks/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        jua: ['var(--font-jua)', 'sans-serif'],
      },
      colors: {
        pastel: {
          pink: '#FFD6E0',
          rose: '#FFB3CC',
          magenta: '#FF6B9D',
          purple: '#E6D5FF',
          blue: '#D6E5FF',
          yellow: '#FFF5D6',
        }
      },
      keyframes: {
        floatY: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6px)' },
        },
        pulseGlow: {
          '0%, 100%': { transform: 'scale(1)', filter: 'drop-shadow(0 0 8px rgba(255,107,157,0.4))' },
          '50%': { transform: 'scale(1.02)', filter: 'drop-shadow(0 0 16px rgba(255,107,157,0.7))' },
        },
        spinBounce: {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(0.82)' },
        },
        landPop: {
          '0%': { transform: 'scale(1)' },
          '20%': { transform: 'scale(1.22) rotate(-3deg)' },
          '40%': { transform: 'scale(0.9) rotate(3deg)' },
          '65%': { transform: 'scale(1.1) rotate(-1deg)' },
          '85%': { transform: 'scale(0.97)' },
          '100%': { transform: 'scale(1)' },
        },
        bombIdle: {
          '0%, 100%': { transform: 'scale(1) rotate(-4deg)' },
          '50%': { transform: 'scale(1.06) rotate(4deg)' },
        },
        bombTick: {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.1)' },
        },
        boomPop: {
          '0%': { transform: 'scale(0.5)', opacity: '0.5' },
          '60%': { transform: 'scale(1.3)' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        penaltyIn: {
          from: { transform: 'scale(0.3)', opacity: '0' },
          to: { transform: 'scale(1)', opacity: '1' },
        },
        wiggle: {
          from: { transform: 'rotate(-9deg)' },
          to: { transform: 'rotate(9deg)' },
        },
        eyeBlink: {
          '0%, 45%, 55%, 100%': { transform: 'scaleY(1)' },
          '50%': { transform: 'scaleY(0.1)' },
        },
        balloonShake: {
          '0%, 100%': { transform: 'rotate(-4deg)' },
          '50%': { transform: 'rotate(4deg)' },
        },
        toothBite: {
          '0%': { transform: 'scale(1)' },
          '25%': { transform: 'scale(1.4) rotate(-5deg)' },
          '50%': { transform: 'scale(0.8) rotate(5deg)' },
          '75%': { transform: 'scale(1.15)' },
          '100%': { transform: 'scale(1) translateY(6px)' },
        },
        screenShake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '20%': { transform: 'translateX(-12px)' },
          '40%': { transform: 'translateX(12px)' },
          '60%': { transform: 'translateX(-8px)' },
          '80%': { transform: 'translateX(8px)' },
        },
        particleFly: {
          '0%': { opacity: '1', transform: 'translate(0,0) scale(1) rotate(0deg)' },
          '100%': {
            opacity: '0',
            transform: 'translate(var(--tx), var(--ty)) scale(0.3) rotate(var(--rot))',
          },
        },
        arrowSpin: {
          '0%': { transform: 'rotate(var(--spin-from))' },
          '100%': { transform: 'rotate(var(--spin-to))' },
        },
      },
      animation: {
        'float-y': 'floatY 2.5s ease-in-out infinite',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
        'spin-bounce': 'spinBounce 0.14s ease-in-out infinite',
        'land-pop': 'landPop 0.5s cubic-bezier(0.34,1.56,0.64,1)',
        'bomb-idle': 'bombIdle 1.2s ease-in-out infinite',
        'bomb-tick': 'bombTick 0.45s ease-in-out infinite',
        'boom-pop': 'boomPop 0.5s cubic-bezier(0.34,1.56,0.64,1) forwards',
        'penalty-in': 'penaltyIn 0.55s cubic-bezier(0.34,1.56,0.64,1)',
        wiggle: 'wiggle 0.6s ease-in-out infinite alternate',
        'eye-blink': 'eyeBlink 3s ease-in-out infinite',
        'balloon-shake': 'balloonShake 0.35s ease-in-out infinite',
        'tooth-bite': 'toothBite 0.45s ease-out',
        'screen-shake': 'screenShake 0.5s ease-out',
        'particle-fly': 'particleFly 1.3s ease-out forwards',
        'arrow-spin': 'arrowSpin var(--spin-duration) cubic-bezier(0.33, 1, 0.68, 1) forwards',
      },
    },
  },
  plugins: [],
}

export default config
