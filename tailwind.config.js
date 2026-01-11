/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Core backgrounds
        background: {
          primary: '#0a0a0f',
          secondary: '#12121a',
          tertiary: '#1a1a24',
          elevated: '#22222e',
        },
        // Glass effects
        glass: {
          light: 'rgba(255, 255, 255, 0.03)',
          medium: 'rgba(255, 255, 255, 0.06)',
          heavy: 'rgba(255, 255, 255, 0.1)',
          border: 'rgba(255, 255, 255, 0.08)',
          'border-hover': 'rgba(255, 255, 255, 0.15)',
        },
        // Accent colors - Indigo/Violet palette
        accent: {
          primary: '#6366f1',
          'primary-hover': '#818cf8',
          secondary: '#8b5cf6',
          tertiary: '#a855f7',
        },
        // Status colors
        status: {
          success: '#22c55e',
          warning: '#f59e0b',
          error: '#ef4444',
          live: '#ef4444',
          sync: '#22c55e',
        },
        // Text colors
        text: {
          primary: '#ffffff',
          secondary: 'rgba(255, 255, 255, 0.7)',
          tertiary: 'rgba(255, 255, 255, 0.5)',
          muted: 'rgba(255, 255, 255, 0.3)',
        },
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      fontSize: {
        'xs': ['0.75rem', { lineHeight: '1rem' }],
        'sm': ['0.8125rem', { lineHeight: '1.25rem' }],
        'base': ['0.875rem', { lineHeight: '1.5rem' }],
        'md': ['1rem', { lineHeight: '1.5rem' }],
        'lg': ['1.125rem', { lineHeight: '1.75rem' }],
        'xl': ['1.25rem', { lineHeight: '1.75rem' }],
        '2xl': ['1.5rem', { lineHeight: '2rem' }],
        '3xl': ['2rem', { lineHeight: '2.25rem' }],
        '4xl': ['2.5rem', { lineHeight: '2.75rem' }],
      },
      borderRadius: {
        'sm': '0.375rem',
        'md': '0.5rem',
        'lg': '0.75rem',
        'xl': '1rem',
        '2xl': '1.25rem',
        '3xl': '1.5rem',
      },
      boxShadow: {
        'sm': '0 1px 2px rgba(0, 0, 0, 0.3)',
        'md': '0 4px 6px rgba(0, 0, 0, 0.3)',
        'lg': '0 10px 15px rgba(0, 0, 0, 0.3)',
        'xl': '0 20px 25px rgba(0, 0, 0, 0.4)',
        '2xl': '0 25px 50px rgba(0, 0, 0, 0.5)',
        'glow': '0 0 30px rgba(99, 102, 241, 0.3)',
        'glow-lg': '0 0 50px rgba(99, 102, 241, 0.4)',
        'glow-accent': '0 0 40px rgba(139, 92, 246, 0.4)',
        'glow-success': '0 0 20px rgba(34, 197, 94, 0.4)',
        'glass': '0 8px 32px rgba(0, 0, 0, 0.3)',
      },
      backdropBlur: {
        'xs': '2px',
        'glass': '20px',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease forwards',
        'slide-in-right': 'slideInRight 0.3s ease forwards',
        'slide-in-up': 'slideInUp 0.3s ease forwards',
        'scale-in': 'scaleIn 0.2s ease forwards',
        'float': 'float 3s ease-in-out infinite',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
        'pulse-sync': 'pulseSync 2s ease-in-out infinite',
        'shimmer': 'shimmer 2s linear infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideInRight: {
          '0%': { opacity: '0', transform: 'translateX(20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        slideInUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-5px)' },
        },
        pulseGlow: {
          '0%, 100%': { opacity: '0.5' },
          '50%': { opacity: '0.8' },
        },
        pulseSync: {
          '0%, 100%': { opacity: '1', boxShadow: '0 0 0 0 rgba(34, 197, 94, 0.4)' },
          '50%': { opacity: '0.8', boxShadow: '0 0 0 4px transparent' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      transitionDuration: {
        'fast': '150ms',
        'normal': '200ms',
        'slow': '300ms',
        'slower': '500ms',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-accent': 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a855f7 100%)',
        'gradient-glass': 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)',
      },
    },
  },
  plugins: [],
}
