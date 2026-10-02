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
        cloud: '#F6F7FB',
        ink: {
          DEFAULT: '#12141F',
          50: '#F4F5F8',
          100: '#E6E7EE',
          200: '#C8CAD8',
          300: '#A4A8BF',
          400: '#7B81A2',
          500: '#585F85',
          600: '#3F4463',
          700: '#2A2E44',
          800: '#1B1E2E',
          900: '#12141F',
        },
        primary: {
          DEFAULT: '#5B5BD6',
          hover: '#4C4CBF',
          light: '#EEF0FF',
          dark: '#3F3FA6',
        },
        aqua: {
          DEFAULT: '#2DD4BF',
          hover: '#14B8A6',
          light: '#E6FFFA',
          dark: '#0D9488',
        },
        coral: {
          DEFAULT: '#FF7A6B',
          light: '#FFF1F0',
          dark: '#E05342',
        },
        amber: {
          DEFAULT: '#F5B841',
          light: '#FEF8EB',
          dark: '#D99B16',
        },
        darkbg: '#0E1020',
        darkcard: '#171A2E',
        darkcard2: '#1F233D',
        darkborder: '#292E4D',
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 4px 20px -2px rgba(18, 20, 31, 0.05), 0 2px 6px -2px rgba(18, 20, 31, 0.03)',
        card: '0 10px 30px -4px rgba(91, 91, 214, 0.06), 0 4px 12px -2px rgba(18, 20, 31, 0.03)',
        cardHover: '0 20px 40px -6px rgba(91, 91, 214, 0.12), 0 8px 16px -4px rgba(18, 20, 31, 0.06)',
        glow: '0 0 25px rgba(91, 91, 214, 0.25)',
        aquaGlow: '0 0 25px rgba(45, 212, 191, 0.25)',
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        'slide-up': 'slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        'pulse-subtle': 'pulseSubtle 2.5s infinite ease-in-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseSubtle: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.6' },
        },
      },
    },
  },
  plugins: [],
}
