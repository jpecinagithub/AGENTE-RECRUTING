/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        surface: '#0f172a',
        card: '#1e293b',
        border: '#334155',
        accent: '#6366f1',
        'accent-hover': '#4f46e5',
        muted: '#94a3b8',
      },
    },
  },
  plugins: [],
}
