/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        beige: '#FDFBF7',
        matte: '#121212',
        'pastel-blue': '#B0C4DE',
        'pastel-blue-light': '#D6E4F0',
        'pastel-green': '#B8D8C8',
        'pastel-pink': '#F2C4C4',
        'pastel-amber': '#F5DEB3',
      },
      fontFamily: {
        sans: ['"DM Sans"', 'sans-serif'],
        serif: ['"DM Serif Display"', 'serif'],
      },
      borderRadius: {
        xl: '16px',
      },
    },
  },
  plugins: [],
};
