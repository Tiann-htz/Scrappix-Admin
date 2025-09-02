// tailwind.config.js
import { Config } from 'tailwindcss';

/** @type {Config} */
export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f1f8e9',
          100: '#e8f5e8',
          500: '#4caf50',
          600: '#388e3c',
          700: '#2e7d32',
          900: '#1b5e20',
        },
        accent: {
          500: '#66bb6a',
          600: '#558b2f',
        },
        danger: {
          500: '#f44336',
          600: '#d32f2f',
          700: '#b71c1c',
        },
        warning: {
          50: '#fff3e0',
          200: '#ffcc80',
          500: '#ff9800',
          600: '#f57c00',
          700: '#e65100',
          800: '#bf360c',
        },
        info: {
          500: '#2196f3',
          600: '#1976d2',
        },
        surface: '#f5f5f5',
        'text-primary': '#2e7d32',
        'text-secondary': '#558b2f',
        'text-tertiary': '#999999',
      },
    },
  },
  plugins: [],
};