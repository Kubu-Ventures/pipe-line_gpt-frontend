/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './hooks/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        rosen: {
          blue: '#005DAA',
          'blue-hover': '#004A8F',
          'blue-dark': '#003B6F',
          'blue-light': '#E8F0F9',
          navy: '#001B3A',
        },
        surface: {
          DEFAULT: '#FFFFFF',
          secondary: '#F8F9FB',
          tertiary: '#F2F4F7',
        },
        border: {
          light: '#E4E8EF',
          medium: '#C8D0DC',
        },
        text: {
          primary: '#1A1A2A',
          secondary: '#4A5568',
          muted: '#8896A8',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 4px rgba(0,0,0,0.06)',
        'card-hover': '0 4px 16px rgba(0,93,170,0.12)',
        nav: '0 1px 3px rgba(0,0,0,0.08)',
      },
      borderRadius: {
        DEFAULT: '6px',
      },
    },
  },
  plugins: [],
}
