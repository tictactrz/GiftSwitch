/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#50c99d',
          light: '#6dd3ae',
          dark: '#45b38c',
        },
        secondary: {
          DEFAULT: '#ee5e5e',
          light: '#f07272',
          dark: '#e54545',
        },
      },
    },
  },
  plugins: [],
}
