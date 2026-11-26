/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./popup/**/*.html",
    "./index.html",
    "./canvas.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./packages/web/**/*.{js,ts,jsx,tsx,html}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#090a0f',
        surface: {
          DEFAULT: '#0d0e15',
          card: '#12131c',
          muted: '#181926',
        },
        brand: {
          50: '#eef2ff',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
        }
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      }
    },
  },
  plugins: [],
}
