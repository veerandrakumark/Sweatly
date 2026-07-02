/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: {
          primary: '#0f172a', // Slate 900
          secondary: '#1e293b', // Slate 800
          tertiary: '#334155', // Slate 700
        },
        brand: {
          primary: '#38bdf8', // Cyan 400
          secondary: '#f97316', // Orange 500
          hover: '#0ea5e9', // Cyan 500
        },
        text: {
          primary: '#f8fafc', // Slate 50
          secondary: '#94a3b8', // Slate 400
          muted: '#64748b', // Slate 500
        },
        border: {
          subtle: '#334155', // Slate 700
        },
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      boxShadow: {
        glow: '0 0 15px rgba(56, 189, 248, 0.15)',
      },
    },
  },
  plugins: [],
};
