/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        goa: {
          cream: '#fffbe8',
          dark: '#14130f',
          yellow: '#fee101',
          red: '#fb2c36',
          pink: '#ff0080',
          green: '#0b6839',
        },
        forest: {
          950: '#071F17',
          900: '#0A2E23',
          800: '#0D3B2E',
          700: '#144F3F',
          600: '#1D6B56',
        },
        cream: {
          50: '#fffbe8',
          100: '#F5F0E3',
          200: '#EBE3D0',
          300: '#DED3BA',
        },
        pink: {
          DEFAULT: '#ff0080',
          hot: '#FF006E',
          light: '#FF3388',
          glow: 'rgba(255, 0, 128, 0.15)',
        },
        charcoal: {
          DEFAULT: '#14130f',
          light: '#242424',
          muted: '#525252',
        },
        emerald: {
          DEFAULT: '#0b6839',
          glow: 'rgba(11, 104, 57, 0.15)',
        }
      },
      fontFamily: {
        display: ['Imbue', 'serif'],
        sans: ['"Victor Mono"', 'monospace'],
        mono: ['"Victor Mono"', 'monospace'],
      },
      boxShadow: {
        'brutal': '4px 4px 0px 0px #14130f',
        'brutal-pink': '4px 4px 0px 0px #ff0080',
        'brutal-green': '4px 4px 0px 0px #0b6839',
        'brutal-sm': '2px 2px 0px 0px #14130f',
        'brutal-lg': '8px 8px 0px 0px #14130f',
      }
    },
  },
  plugins: [],
}
