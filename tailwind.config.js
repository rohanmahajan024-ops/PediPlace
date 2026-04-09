/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        pedi: {
          50:  '#e6f7f6',
          100: '#ccefed',
          200: '#99dfdb',
          300: '#66cfc9',
          400: '#33bfb7',
          500: '#00a99d',
          600: '#008880',
          700: '#006660',
          800: '#004440',
          900: '#002220',
        },
        'pedi-orange': {
          50:  '#fff8ed',
          100: '#fef0d6',
          200: '#fdd9a0',
          300: '#fcbc5e',
          400: '#f99e2a',
          500: '#f4831a',
          600: '#d96310',
          700: '#b44610',
          800: '#903614',
          900: '#762e13',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
