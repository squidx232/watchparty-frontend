/**
 * Design System - Premium Streaming Platform
 * 
 * Inspired by modern streaming UIs with cinematic, dark, glassmorphic aesthetics
 */

export const colors = {
  // Core backgrounds - Deep, rich blacks with blue undertones
  background: {
    primary: '#0a0a0f',      // Deepest black
    secondary: '#12121a',    // Card backgrounds
    tertiary: '#1a1a24',     // Elevated surfaces
    elevated: '#22222e',     // Highest elevation
  },
  
  // Glassmorphism backgrounds
  glass: {
    light: 'rgba(255, 255, 255, 0.03)',
    medium: 'rgba(255, 255, 255, 0.06)',
    heavy: 'rgba(255, 255, 255, 0.1)',
    border: 'rgba(255, 255, 255, 0.08)',
    borderHover: 'rgba(255, 255, 255, 0.15)',
  },
  
  // Accent colors
  accent: {
    primary: '#6366f1',      // Indigo - Primary actions
    primaryHover: '#818cf8',
    secondary: '#8b5cf6',    // Violet - Secondary accents
    tertiary: '#a855f7',     // Purple - Highlights
    gradient: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a855f7 100%)',
    gradientHover: 'linear-gradient(135deg, #818cf8 0%, #a78bfa 50%, #c084fc 100%)',
  },
  
  // Status colors
  status: {
    success: '#22c55e',
    successGlow: 'rgba(34, 197, 94, 0.4)',
    warning: '#f59e0b',
    error: '#ef4444',
    live: '#ef4444',
    liveGlow: 'rgba(239, 68, 68, 0.4)',
    sync: '#22c55e',
    syncGlow: 'rgba(34, 197, 94, 0.5)',
  },
  
  // Text colors
  text: {
    primary: '#ffffff',
    secondary: 'rgba(255, 255, 255, 0.7)',
    tertiary: 'rgba(255, 255, 255, 0.5)',
    muted: 'rgba(255, 255, 255, 0.3)',
  },
  
  // Ambient glow colors (for video backgrounds)
  ambient: {
    purple: 'rgba(139, 92, 246, 0.15)',
    blue: 'rgba(59, 130, 246, 0.15)',
    pink: 'rgba(236, 72, 153, 0.15)',
    orange: 'rgba(249, 115, 22, 0.15)',
  }
};

export const typography = {
  fontFamily: {
    sans: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    mono: '"JetBrains Mono", "Fira Code", monospace',
  },
  
  fontSize: {
    xs: '0.75rem',      // 12px
    sm: '0.8125rem',    // 13px
    base: '0.875rem',   // 14px
    md: '1rem',         // 16px
    lg: '1.125rem',     // 18px
    xl: '1.25rem',      // 20px
    '2xl': '1.5rem',    // 24px
    '3xl': '2rem',      // 32px
    '4xl': '2.5rem',    // 40px
  },
  
  fontWeight: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
  
  lineHeight: {
    tight: '1.2',
    normal: '1.5',
    relaxed: '1.75',
  },
  
  letterSpacing: {
    tight: '-0.02em',
    normal: '0',
    wide: '0.02em',
    wider: '0.05em',
  }
};

export const spacing = {
  px: '1px',
  0: '0',
  0.5: '0.125rem',    // 2px
  1: '0.25rem',       // 4px
  1.5: '0.375rem',    // 6px
  2: '0.5rem',        // 8px
  2.5: '0.625rem',    // 10px
  3: '0.75rem',       // 12px
  4: '1rem',          // 16px
  5: '1.25rem',       // 20px
  6: '1.5rem',        // 24px
  8: '2rem',          // 32px
  10: '2.5rem',       // 40px
  12: '3rem',         // 48px
  16: '4rem',         // 64px
};

export const borderRadius = {
  none: '0',
  sm: '0.375rem',     // 6px
  md: '0.5rem',       // 8px
  lg: '0.75rem',      // 12px
  xl: '1rem',         // 16px
  '2xl': '1.25rem',   // 20px
  '3xl': '1.5rem',    // 24px
  full: '9999px',
};

export const shadows = {
  sm: '0 1px 2px rgba(0, 0, 0, 0.3)',
  md: '0 4px 6px rgba(0, 0, 0, 0.3)',
  lg: '0 10px 15px rgba(0, 0, 0, 0.3)',
  xl: '0 20px 25px rgba(0, 0, 0, 0.4)',
  '2xl': '0 25px 50px rgba(0, 0, 0, 0.5)',
  glow: {
    primary: '0 0 20px rgba(99, 102, 241, 0.3)',
    accent: '0 0 30px rgba(139, 92, 246, 0.4)',
    success: '0 0 20px rgba(34, 197, 94, 0.3)',
  },
  glass: '0 8px 32px rgba(0, 0, 0, 0.3)',
};

export const blur = {
  sm: '4px',
  md: '8px',
  lg: '16px',
  xl: '24px',
  '2xl': '40px',
};

export const transitions = {
  fast: '150ms ease',
  normal: '200ms ease',
  slow: '300ms ease',
  slower: '500ms ease',
  
  // Specific transitions
  colors: 'color 200ms ease, background-color 200ms ease, border-color 200ms ease',
  transform: 'transform 200ms ease',
  opacity: 'opacity 200ms ease',
  all: 'all 200ms ease',
};

export const zIndex = {
  base: 0,
  dropdown: 10,
  sticky: 20,
  fixed: 30,
  overlay: 40,
  modal: 50,
  popover: 60,
  toast: 70,
};

// Glassmorphism mixin values
export const glassmorphism = {
  light: {
    background: 'rgba(255, 255, 255, 0.03)',
    backdropFilter: 'blur(16px)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
  },
  medium: {
    background: 'rgba(255, 255, 255, 0.06)',
    backdropFilter: 'blur(20px)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
  },
  heavy: {
    background: 'rgba(18, 18, 26, 0.8)',
    backdropFilter: 'blur(24px)',
    border: '1px solid rgba(255, 255, 255, 0.12)',
  },
};
