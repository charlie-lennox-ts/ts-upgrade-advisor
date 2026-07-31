import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        ts: {
          bg:       '#08062B',
          sidebar:  '#0F2044',
          card:     '#122246',
          card2:    '#0F1A3E',
          cyan:     '#04D1FF',
          purple:   '#714BFB',
          amber:    '#FFC052',
          green:    '#6DD267',
          text:     '#D0E8F5',
          muted:    '#7AA8C4',
          dim:      '#3A5572',
          border:   'rgba(4,209,255,0.12)',
        },
      },
      fontFamily: {
        sans: ['Space Grotesk', 'Inter', '-apple-system', 'sans-serif'],
        mono: ['Space Mono', 'JetBrains Mono', 'monospace'],
      },
      boxShadow: {
        'cyan-glow': '0 0 20px rgba(4,209,255,0.2)',
        'cyan-sm':   '0 0 12px rgba(4,209,255,0.15)',
        'card':      '0 4px 24px rgba(0,0,0,0.3)',
      },
    },
  },
  plugins: [],
}
export default config
