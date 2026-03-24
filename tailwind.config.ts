import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['IBM Plex Sans', 'sans-serif'],
        mono: ['IBM Plex Mono', 'monospace'],
      },
      colors: {
        bg: {
          DEFAULT: '#0d0f14',
          2: '#13161e',
          3: '#1a1e28',
        },
        border: {
          DEFAULT: '#242836',
          2: '#2e3448',
        },
        accent: '#4a7dff',
        risk: {
          high: '#e05555',
          medium: '#d97706',
          low: '#22c55e',
        },
      },
    },
  },
  plugins: [],
}

export default config
