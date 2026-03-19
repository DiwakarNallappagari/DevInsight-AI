/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: '#020617',
        surface: '#020617',
        surfaceAlt: '#020617',
        primary: {
          500: '#38bdf8',
          600: '#0ea5e9',
          700: '#0284c7',
        },
      },
    },
  },
  plugins: [],
};


