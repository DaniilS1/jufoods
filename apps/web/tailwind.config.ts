import type { Config } from 'tailwindcss'

const config = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  prefix: '',
  theme: {
    container: {
      center: true,
      padding: '1rem',
      screens: {
        '2xl': '1400px',
      },
    },
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: '#E8C49A', // lighter caramel
          50: '#F9F0E5', // lighter vanilla
          100: '#F5E6D3',
          200: '#E8C49A', // main caramel
          300: '#E0B584',
          400: '#D4A574',
          500: '#C8955F',
          600: '#B8854A',
          700: '#A0753F',
          800: '#8B6F4F', // lighter coffee
          900: '#7D5729',
          foreground: '#FFFFFF',
        },
        secondary: {
          DEFAULT: '#9B7A5F', // lighter coffee
          50: '#F9F0E5',
          100: '#F5E6D3',
          200: '#E8C49A',
          300: '#D4A574',
          400: '#C8955F',
          500: '#B8854A',
          600: '#A0753F',
          700: '#9B7A5F',
          800: '#8B6F4F',
          900: '#7D5729',
        },
        accent: {
          DEFAULT: '#F9F0E5', // lighter vanilla
          foreground: '#9B7A5F',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
} satisfies Config

export default config

