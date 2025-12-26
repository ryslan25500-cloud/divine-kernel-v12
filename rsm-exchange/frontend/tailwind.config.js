/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        rsm: {
          gold: '#FFD700',
          dark: '#0a0a0f',
          blue: '#0066ff',
          green: '#00ff88',
          purple: '#8b5cf6'
        }
      }
    },
  },
  plugins: [],
}
