/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        terminal: {
          bg: '#0d1117',
          panel: '#161b22',
          grid: '#30363d',
          text: '#c9d1d9',
          muted: '#8b949e',
          accent: '#58a6ff'
        }
      }
    }
  },
  plugins: []
}