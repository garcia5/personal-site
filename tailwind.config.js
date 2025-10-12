/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        background: '#1e1e2e',
        text: '#cdd6f4',
        primary: '#cba6f7',
        secondary: '#f5c2e7',
        surface: '#313244',
      },
    },
  },
  plugins: [],
}
