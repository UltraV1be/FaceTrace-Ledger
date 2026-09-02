/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        forest: {
          950: '#071F17',
          900: '#0A2E23',
          800: '#0D3B2E',
          700: '#144F3F',
          600: '#1D6B56',
        },
        cream: {
          50: '#FAF7F0',
          100: '#F5F0E3',
          200: '#EBE3D0',
          300: '#DED3BA',
        },
        pink: {
          DEFAULT: '#F50064',
          hot: '#FF006E',
          light: '#FF3388',
          glow: 'rgba(245, 0, 100, 0.15)',
        },
        charcoal: {
          DEFAULT: '#141414',
          light: '#242424',
          muted: '#525252',
        },
        emerald: {
          DEFAULT: '#00E599',
          glow: 'rgba(0, 229, 153, 0.15)',
        }
      },
      fontFamily: {
        display: ['Syne', 'sans-serif'],
        sans: ['"Space Grotesk"', 'Inter', 'sans-serif'],
        mono: ['"JetBrains Mono"', '"Space Mono"', 'monospace'],
      },
      boxShadow: {
        'brutal': '4px 4px 0px 0px #141414',
        'brutal-pink': '4px 4px 0px 0px #F50064',
        'brutal-green': '4px 4px 0px 0px #0A2E23',
        'brutal-sm': '2px 2px 0px 0px #141414',
        'brutal-lg': '8px 8px 0px 0px #141414',
      }
    },
  },
  plugins: [],
}
