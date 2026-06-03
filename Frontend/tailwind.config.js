/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        coffee: {
          50: '#faf8f5',
          100: '#f0dfd6',
          200: '#febf8c',
          300: '#ffdcc2',
          500: '#82542a',
          600: '#6c4420',
          700: '#2d241e',
          800: '#988a82',
          950: '#170f0a',
        },
      },
      spacing: {
        '4.5': '1.125rem',
        '6.5': '1.625rem',
      },
      boxShadow: {
        'xs': '0 1px 2px 0 rgb(0 0 0 / 0.03)',
      },
      backdropBlur: {
        'xs': '2px',
      },
      scale: {
        '98': '0.98',
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(-8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'scale-up': {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.3s ease-out',
        'scale-up': 'scale-up 0.2s ease-out',
      },
    },
  },
  plugins: [],
}
