/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // A two-ink print: blue-black ink on cool paper, cobalt for X, orange for O.
        paper: '#E8ECF4',
        ink: {
          DEFAULT: '#1A2250',
          soft: '#5B6384',
        },
        cobalt: '#2742F5',
        flame: '#E8530A',
      },
      fontFamily: {
        sans: ['"Bricolage Grotesque"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
