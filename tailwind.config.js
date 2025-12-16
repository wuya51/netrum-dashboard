/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./src/**/*.{js,ts,jsx,tsx}"
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: '#3b82f6',
        secondary: '#6b7280',
        success: '#10b981',
        warning: '#f59e0b',
        error: '#ef4444',
        'card-bg': {
          light: '#ffffff',
          dark: '#1f2937',
          DEFAULT: '#ffffff'
        },
        'card-border': {
          light: '#e5e7eb',
          dark: '#374151',
          DEFAULT: '#e5e7eb'
        },
        'text-primary': {
          light: '#1f2937',
          dark: '#f9fafb',
          DEFAULT: '#1f2937'
        },
        'text-secondary': {
          light: '#6b7280',
          dark: '#d1d5db',
          DEFAULT: '#6b7280'
        },
        'bg-primary': {
          light: '#f9fafb',
          dark: '#111827',
          DEFAULT: '#f9fafb'
        },
        'bg-secondary': {
          light: '#f3f4f6',
          dark: '#1f2937',
          DEFAULT: '#f3f4f6'
        }
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
      },
      borderRadius: {
        'lg': '0.75rem',
      },
      maxWidth: {
        'screen-xl': '1100px',
      },
      backgroundImage: {
        'gradient-primary': 'linear-gradient(135deg, #3b82f6 0%, #764ba2 100%)',
        'gradient-card-light': 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
        'gradient-card-dark': 'linear-gradient(135deg, #0c4a6e 0%, #0369a1 100%)',
      }
    },
  },
  plugins: [],
}

