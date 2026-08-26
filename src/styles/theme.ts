// Single source of design tokens for RIA. AntD owns interactive widgets; styled-components
// applies these tokens to layout scaffolding, chart frames, and brand accents.
export const theme = {
  colors: {
    brand: '#1f6feb', // Experience.com-adjacent blue
    brandDark: '#1552b0',
    bg: '#f5f7fa',
    surface: '#ffffff',
    text: '#1f2933',
    textMuted: '#6b7280',
    border: '#e5e7eb',

    // status (mapped to the 6 ActionStatus values in components)
    success: '#2e7d32',
    warning: '#ed6c02',
    danger: '#d32f2f',
    info: '#0288d1',
    cyan: '#0891b2',
    neutral: '#9e9e9e',

    // sentiment (Sentiment enum)
    positive: '#2e7d32',
    neutralSentiment: '#9e9e9e',
    negative: '#d32f2f',

    // rating scale 1..5 (1=Low … 5=Excellent)
    rating: { 1: '#d32f2f', 2: '#f57c00', 3: '#fbc02d', 4: '#7cb342', 5: '#2e7d32' } as Record<number, string>,

    // priority (Priority enum)
    priorityHigh: '#d32f2f',
    priorityMedium: '#ed6c02',
    priorityLow: '#0288d1',

    // chart series
    chart: {
      before: '#90a4ae',
      after: '#1f6feb',
      mine: '#1f6feb',
      peer: '#b0bec5',
      positive: '#2e7d32',
      negative: '#d32f2f',
      line: '#1f6feb',
      grid: '#e5e7eb',
      reference: '#ed6c02',
    },
  },
  // Recharts wrapper heights (ChartFrame). AntD Card body has no intrinsic height.
  chart: { sm: 220, md: 300, lg: 360 },
  space: { xs: '4px', sm: '8px', md: '16px', lg: '24px', xl: '32px' },
  radius: { sm: '4px', md: '8px', lg: '12px' },
  shadow: { card: '0 1px 3px rgba(16,24,40,0.08)', raised: '0 4px 12px rgba(16,24,40,0.12)' },
  font: { base: `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif` },
  layout: { maxContentWidth: 1200 },
} as const;

export type AppTheme = typeof theme;
