/**
 * Theme configuration — points at CSS variables and utilities from `src/theme/theme.css`.
 * Single source for hex/Radii: edit `@theme { }` there; use this file for `var(--…)` in TS/inline styles.
 */

export const theme = {
  cssVarNames: {
    background: '--color-background',
    foreground: '--color-foreground',
    card: '--color-card',
    primary: '--color-primary',
    primaryForeground: '--color-primary-foreground',
    muted: '--color-muted',
    mutedForeground: '--color-muted-foreground',
    border: '--color-border',
    ring: '--color-ring',
    accent: '--color-accent',
    destructive: '--color-destructive',
    brandTeal: '--color-brand-teal',
    brandCyan: '--color-brand-cyan',
    brandNavy: '--color-brand-navy',
    brandBody: '--color-brand-body',
    brandHeroBlue: '--color-brand-hero-blue',
    brandMarketingBg: '--color-marketing-bg',
    brandRoyal: '--color-brand-royal',
    brandRoyalDeep: '--color-brand-royal-deep',
    brandLanding: '--color-brand-landing',
    brandBg2: '--color-brand-bg2',
    brandSky: '--color-brand-sky',
    brandVetLime: '--color-brand-vet-lime',
    brandStrokeSoft: '--color-brand-stroke-soft',
    brandStrokeStrong: '--color-brand-stroke-strong',
  },

  css: {
    background: 'var(--color-background)',
    foreground: 'var(--color-foreground)',
    card: 'var(--color-card)',
    primary: 'var(--color-primary)',
    primaryForeground: 'var(--color-primary-foreground)',
    muted: 'var(--color-muted)',
    mutedForeground: 'var(--color-muted-foreground)',
    border: 'var(--color-border)',
    ring: 'var(--color-ring)',
    accent: 'var(--color-accent)',
    destructive: 'var(--color-destructive)',
    brandTeal: 'var(--color-brand-teal)',
    brandCyan: 'var(--color-brand-cyan)',
    brandNavy: 'var(--color-brand-navy)',
    brandBodyGray: 'var(--color-brand-body)',
    brandHeroBlue: 'var(--color-brand-hero-blue)',
    brandRoyal: 'var(--color-brand-royal)',
    brandRoyalDeep: 'var(--color-brand-royal-deep)',
    brandBg2: 'var(--color-brand-bg2)',
    brandSky: 'var(--color-brand-sky)',
  },

  radius: {
    lg: 'var(--radius-lg)',
    xl: 'var(--radius-xl)',
    '2xl': 'var(--radius-2xl)',
  },

  utilityClass: {
    gradientPrimary: 'bg-gradient-brand-primary',
    gradientVet: 'bg-gradient-brand-vet',
    textGradient: 'text-gradient-brand',
    borderStroke: 'border-gradient-brand-stroke',
    shadow: 'shadow-brand',
  },
} as const;

export type ThemeConfig = typeof theme;
