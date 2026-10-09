/**
 * AyuCTMS Design Tokens
 * Institutional, clinical, trustworthy, and restrained.
 */

export const colors = {
  // Institutional Brand Colors
  primary: {
    DEFAULT: '#7A2A12', // Terracotta / Institutional Crimson
    dark: '#5C1F0D',    // Deep Crimson
    light: '#9E381B',
    subtle: '#FDF4F0',
  },
  secondary: {
    DEFAULT: '#1F5C3F', // Ayurvedic Forest Green
    dark: '#16432E',
    light: '#2B7A54',
    subtle: '#EDF6F1',
  },
  accent: {
    DEFAULT: '#B8862E', // Clinical Gold / Ochre
    dark: '#8F661F',
    light: '#D4A145',
    subtle: '#FBF7EE',
  },

  // Typography Colors
  text: {
    DEFAULT: '#1C1A17',
    secondary: '#5A5347',
    muted: '#726B5C',
    inverse: '#FFFFFF',
  },

  // Surfaces & Backgrounds
  surface: {
    DEFAULT: '#FFFFFF',
    soft: '#F8F6F2',
    hover: '#F3EFE8',
    active: '#EAE4D9',
  },

  // Borders
  border: {
    DEFAULT: '#E4DED3',
    strong: '#C9C2B3',
    subtle: '#EFECE6',
  },

  // Status & Clinical Semantics
  status: {
    success: '#1F5C3F',
    successBg: '#EDF6F1',
    successBorder: '#BDDCCB',

    warning: '#B8862E',
    warningBg: '#FBF7EE',
    warningBorder: '#E9D6A9',

    danger: '#9B2C2C',
    dangerBg: '#FDF2F2',
    dangerBorder: '#F5C6C6',

    info: '#315A78',
    infoBg: '#EFF5F9',
    infoBorder: '#BFD7E7',

    neutral: '#726B5C',
    neutralBg: '#F8F6F2',
    neutralBorder: '#E4DED3',
  },
} as const

export const typography = {
  fontFamily: {
    heading: '"Merriweather", Georgia, serif',
    body: '"Source Sans 3", system-ui, sans-serif',
    mono: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
  },
  fontSize: {
    xs: '0.75rem',    // 12px
    sm: '0.8125rem',  // 13px
    base: '0.875rem',  // 14px
    md: '0.9375rem',  // 15px
    lg: '1.125rem',   // 18px
    xl: '1.25rem',    // 20px
    '2xl': '1.5rem',   // 24px
    '3xl': '1.875rem', // 30px
  },
} as const

export const radius = {
  xs: '2px',
  sm: '3px',
  md: '4px',
  lg: '6px',
} as const

export const shadows = {
  xs: '0 1px 2px 0 rgba(28, 26, 23, 0.05)',
  sm: '0 1px 3px 0 rgba(28, 26, 23, 0.08), 0 1px 2px -1px rgba(28, 26, 23, 0.08)',
  md: '0 4px 6px -1px rgba(28, 26, 23, 0.08), 0 2px 4px -2px rgba(28, 26, 23, 0.06)',
} as const
