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
          DEFAULT: '#7A2A12',
          dark: '#5C1F0D',
          light: '#96381C',
        },
        secondary: {
          DEFAULT: '#1F5C3F',
          dark: '#16432E',
          light: '#287551',
        },
        accent: {
          DEFAULT: '#B8862E',
          dark: '#936B25',
          light: '#D4A045',
        },
        ink: {
          DEFAULT: '#1C1A17',
          secondary: '#5A5347',
          muted: '#726B5C',
          inverse: '#FFFFFF',
        },
        surface: {
          DEFAULT: '#FFFFFF',
          soft: '#F8F6F2',
          hover: '#F2EDE4',
        },
        border: {
          DEFAULT: '#E4DED3',
          strong: '#C9C2B3',
        },
        semantic: {
          success: '#1F5C3F',
          warning: '#B8862E',
          danger: '#9B2C2C',
          info: '#315A78',
        },
      },
      fontFamily: {
        heading: ['Merriweather', 'Georgia', 'serif'],
        body: ['"Source Sans 3"', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        sm: '2px',
        DEFAULT: '4px',
        md: '6px',
      },
      boxShadow: {
        subtle: '0 1px 3px rgba(28, 26, 23, 0.05)',
        card: '0 1px 4px rgba(28, 26, 23, 0.08)',
      },
    },
  },
  plugins: [],
};
