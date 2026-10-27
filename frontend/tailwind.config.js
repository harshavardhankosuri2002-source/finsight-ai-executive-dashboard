/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        hdfc: {
          blue: '#004c8f',
          dark: '#002f5e',
          light: '#e8f0fe',
          red: '#ed1c24',
          accent: '#0284c7'
        },
        navy: {
          800: '#1e293b',
          900: '#0f172a',
          950: '#0a0f1d',
        },
        teal: {
          500: '#14b8a6',
          600: '#0d9488',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
