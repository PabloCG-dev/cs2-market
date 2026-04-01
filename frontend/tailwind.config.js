/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        bg: { primary: '#0a0e1a', secondary: '#111827', card: '#1a2235', border: '#1f2d40' },
        accent: { orange: '#f97316', orangeLight: '#fb923c' },
        profit: '#10b981',
        loss: '#ef4444',
        warning: '#f59e0b',
        muted: '#6b7280'
      },
      fontFamily: { sans: ['Inter', 'system-ui', 'sans-serif'] }
    }
  },
  plugins: []
}
