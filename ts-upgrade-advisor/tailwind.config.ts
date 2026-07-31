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
          navy: '#1D2339',
          blue: '#2770EF',
          'blue-light': '#4A8FF5',
          'blue-dark': '#1A5BC4',
          teal: '#00C7BE',
          purple: '#7B61FF',
          'gray-900': '#0F1117',
          'gray-800': '#1D2339',
          'gray-700': '#2B3252',
          'gray-600': '#3D4566',
          'gray-500': '#6B7280',
          'gray-400': '#9CA3AF',
          'gray-300': '#D1D5DB',
          'gray-200': '#E5E7EB',
          'gray-100': '#F3F4F6',
          'gray-50': '#F9FAFB',
          red: '#EF4444',
          amber: '#F59E0B',
          green: '#10B981',
        },
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      boxShadow: {
        'ts-sm': '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.08)',
        'ts-md': '0 4px 12px rgba(0,0,0,0.15), 0 2px 4px rgba(0,0,0,0.08)',
        'ts-lg': '0 10px 30px rgba(0,0,0,0.2), 0 4px 8px rgba(0,0,0,0.1)',
        'ts-glow': '0 0 20px rgba(39,112,239,0.3)',
      },
    },
  },
  plugins: [],
}
export default config
