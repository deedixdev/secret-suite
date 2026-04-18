/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './secret-suite/components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      colors: {
        ss: {
          bg:          '#050508',
          'bg-sec':    '#0D0D12',
          'bg-ter':    '#141419',
          border:      'rgba(255,255,255,0.06)',
          accent:      '#2563EB',
          green:       '#10B981',
          amber:       '#F59E0B',
          red:         '#EF4444',
          'text-pri':  '#F8F8FF',
          'text-sec':  '#A8A8B8',
          'text-ter':  '#4A4A5A',
        },
      },
    },
  },
  plugins: [],
};
