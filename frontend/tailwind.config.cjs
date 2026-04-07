module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        'dark-bg': '#050505',
        'dark-surface': '#0C0C0F',
        'cyan-neon': '#00F0FF',
        'text-primary': '#FFFFFF',
        'text-secondary': '#A0A0AB',
      },
      fontFamily: {
        'display': ['Syncopate', 'sans-serif'],
        'heading': ['Outfit', 'sans-serif'],
        'body': ['Manrope', 'sans-serif'],
      },
      dropShadow: {
        'neon': '0 0 15px rgba(0, 240, 255, 0.5)',
        'neon-lg': '0 0 30px rgba(0, 240, 255, 0.7)',
      },
      backdropBlur: {
        'xl': '32px',
      }
    },
  },
  plugins: [],
}
