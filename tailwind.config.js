/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
    theme: {
      extend: {
        colors: {
          cream: {
            50: '#FDFBF7',
            100: '#F9F5ED',
          },
          forest: {
            400: '#6B7280',
            700: '#2F4F4F',
            800: '#1C2526',
            900: '#121A1C',
          },
        },
      },
    },
  plugins: [],
}

