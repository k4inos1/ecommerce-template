/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Manrope', 'sans-serif'],
        display: ['Outfit', 'sans-serif'],
      },
      colors: {
        brand: {
          DEFAULT: '#14b8a6',
          dark: '#0f766e',
          light: '#5eead4',
        },
      },
      animation: {
        'fade-up': 'fadeUp 0.5s ease forwards',
        'glow-pulse': 'glowPulse 3s ease-in-out infinite',
      },
      keyframes: {
        fadeUp: { from: { opacity: '0', transform: 'translateY(16px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        glowPulse: { '0%,100%': { opacity: '0.5' }, '50%': { opacity: '1' } },
      },
    },
  },
  plugins: [],
}
