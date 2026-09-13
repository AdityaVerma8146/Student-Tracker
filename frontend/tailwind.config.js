/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{ts,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: '#3d7bff',
        secondary: '#8b5cf6',
        // p2's dark "panel & line" system, mapped onto the shades the app
        // already uses via dark:bg-gray-900 / dark:border-gray-700 / etc.
        // 50-300 are left as Tailwind defaults (used for light-mode surfaces).
        gray: {
          400: '#8590ad',
          500: '#5b6690',
          600: '#3a4262',
          700: '#1c2540',
          800: '#0c1224',
          900: '#03050c',
        },
        // p2's brand blue, now driven by the live --accent-* CSS variables
        // (see index.css) so every bg-blue-*/text-blue-*/border-blue-*
        // class in the app retints when the user picks a different accent
        // color, without needing to touch each component.
        blue: {
          50: '#eef4ff',
          100: '#dbe7ff',
          200: '#b3ccff',
          300: 'var(--accent-300)',
          400: 'var(--accent-400)',
          500: 'var(--accent-500)',
          600: 'var(--accent-600)',
          700: 'var(--accent-700)',
          800: '#1c3f8f',
          900: '#152f6e',
          950: '#0c1a3f',
        },
      },
      fontFamily: {
        display: ['"Bebas Neue"', 'Inter', 'sans-serif'],
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
