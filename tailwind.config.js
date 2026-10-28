/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif'],
        display: ['"Space Grotesk"', '"Plus Jakarta Sans"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      colors: {
        obsidian: '#0F172A',
        yakan: {
          crimson: '#B91C1C',
          crimsonDark: '#991B1B',
          sapphire: '#1D4ED8',
          sapphireDark: '#1E3A8A',
          gold: '#D97706',
          goldLight: '#F59E0B',
          emerald: '#059669',
        },
      },
    },
  },
  plugins: [],
};
