/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'luna-bg': '#0D1117',
        'luna-bg-secondary': '#161B22',
        'luna-bg-card': '#21262D',
        'luna-primary': '#7C3AED',
        'luna-secondary': '#10B981',
        'luna-text': '#E6EDF3',
        'luna-text-secondary': '#8B949E',
        'luna-border': '#30363D',
        'luna-error': '#F85149',
        'luna-warning': '#D29922',
        'luna-success': '#3FB950',
      },
      fontFamily: {
        sans: ['Inter', 'SF Pro Display', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
    },
  },
  plugins: [],
}
