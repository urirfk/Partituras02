/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        score: {
          bg: '#fcfbf9',
          darkBg: '#121214',
          staff: '#222222',
          badge: '#18181b',
        }
      }
    },
  },
  plugins: [],
}
