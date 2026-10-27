/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#0b1020',
        neon: {
          cyan: '#22d3ee',
          coral: '#ff4d8d',
        },
      },
      fontFamily: {
        display: ['"Orbitron"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        sans: ['"Inter"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        glowCyan: '0 0 24px rgba(34, 211, 238, 0.45)',
        glowCoral: '0 0 24px rgba(255, 77, 141, 0.45)',
      },
    },
  },
  plugins: [],
}
