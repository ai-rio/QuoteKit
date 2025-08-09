import type { Config } from 'tailwindcss';

export default {
  content: [],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        'forest-green': '#2A3D2F',
        'equipment-yellow': '#F2B705',
        'light-concrete': '#F5F5F5',
        'stone-gray': '#D7D7D7',
        'charcoal': '#1C1C1C',
        'paper-white': '#FFFFFF',
      },
    },
  },
  plugins: [],
} satisfies Config;
