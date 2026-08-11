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
        },
        // Remap the legacy dark-theme status shades so existing bg-red-900/20,
        // text-yellow-400, etc. utilities read correctly on the new white canvas.
        red: {
          400: '#c81e2a',
          900: '#7a0f15',
        },
        yellow: {
          400: '#8a6d0b',
          900: '#5c4708',
        },
        green: {
          400: '#2e7d32',
          900: '#1b5e20',
        },
      },
      // Sharp corners everywhere - 1996 catalog design has no soft radius.
      // Only `rounded-full` (award seals, spinner) survives.
      borderRadius: {
        DEFAULT: '0px',
        sm: '0px',
        md: '0px',
        lg: '0px',
        xl: '0px',
        '2xl': '0px',
        full: '9999px',
      },
      fontFamily: {
        sans: ['Helvetica', 'Arial', '"Microsoft YaHei"', 'sans-serif'],
        serif: ['"Times New Roman"', '"SimSun"', 'serif'],
        display: ['"Arial Black"', 'Helvetica', '"Microsoft YaHei"', 'sans-serif'],
      },
    }
  },
  plugins: []
}
