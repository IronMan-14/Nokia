export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        base: '#0A0E17',
        surface: '#0F1524',
        nokia: '#124191',
        nokiaLight: '#1E5FD0',
        cyan: { DEFAULT: '#3DF0FF', dim: '#1AB8CC' },
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'system-ui', 'sans-serif'],
        body: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: { glow: '0 0 80px -10px rgba(61,240,255,0.35)' },
    },
  },
  plugins: [],
}
