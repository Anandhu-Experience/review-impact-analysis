// Single source of design tokens for RIA. AntD owns interactive widgets; styled-components
// applies these tokens to layout scaffolding, chart frames, and brand accents.
//
// Palette/typography are ported 1:1 from the XMP "new shell" design system
// (src/xmp/** on the xmp_project branch): a neutral white surface, near-black primary,
// a single indigo accent, and the Untitled-UI status tones. The antd widgets are
// dragged onto these tokens in GlobalStyle.ts.
export const theme = {
  colors: {
    brand: '#1b4db1', // XMP --xmp-accent
    brandDark: '#143a86',
    brandSoft: '#eef3ff', // --xmp-accent-soft
    brandBorder: '#cfdcfb', // --xmp-accent-border

    bg: '#ffffff', // --xmp-background
    surface: '#ffffff', // --xmp-card
    muted: '#f7f8fa', // --xmp-muted: sidebar, table header band, hover
    text: '#16181d', // --xmp-foreground
    textMuted: '#6b7280', // --xmp-muted-foreground
    border: '#e3e6ea', // --xmp-border
    inputBorder: '#d7dbe0', // --xmp-input
    ink: '#16181d', // --xmp-primary (primary button fill)
    inkHover: '#2c2f38',

    // status (mapped to the 6 ActionStatus values in components)
    success: '#067647',
    warning: '#b54708',
    danger: '#b42318',
    info: '#175cd3',
    cyan: '#0e7090',
    neutral: '#475467',

    // sentiment (Sentiment enum)
    positive: '#067647',
    neutralSentiment: '#475467',
    negative: '#b42318',

    // soft backgrounds paired with the status foregrounds above (XMP StatusPill tones)
    tone: {
      success: { bg: '#ecfdf3', fg: '#067647', dot: '#17b26a' },
      info: { bg: '#eff8ff', fg: '#175cd3', dot: '#2e90fa' },
      neutral: { bg: '#f2f4f7', fg: '#475467', dot: '#98a2b3' },
      danger: { bg: '#fef3f2', fg: '#b42318', dot: '#f04438' },
      warning: { bg: '#fffaeb', fg: '#b54708', dot: '#f79009' },
    },

    // rating scale 1..5 (1=Low … 5=Excellent)
    rating: { 1: '#f04438', 2: '#f79009', 3: '#eaaa08', 4: '#66c61c', 5: '#17b26a' } as Record<number, string>,

    // priority (Priority enum)
    priorityHigh: '#b42318',
    priorityMedium: '#b54708',
    priorityLow: '#175cd3',

    // chart series
    chart: {
      before: '#98a2b3',
      after: '#1b4db1',
      mine: '#1b4db1',
      peer: '#cfd4dc',
      positive: '#17b26a',
      negative: '#f04438',
      line: '#1b4db1',
      grid: '#e3e6ea',
      reference: '#f79009',
    },
  },
  // Recharts wrapper heights (ChartFrame). AntD Card body has no intrinsic height.
  chart: { sm: 220, md: 300, lg: 360 },
  space: { xs: '4px', sm: '8px', md: '16px', lg: '24px', xl: '32px' },
  radius: { sm: '6px', md: '8px', lg: '12px' },
  shadow: { card: '0 1px 2px rgba(16,24,40,0.05)', raised: '0 8px 24px rgba(16,24,40,0.10)' },
  font: {
    base: `'IBM Plex Sans', ui-sans-serif, system-ui, -apple-system, sans-serif`,
    mono: `'IBM Plex Mono', ui-monospace, SFMono-Regular, monospace`,
  },
  layout: { maxContentWidth: 1200, sidebarWidth: 240, headerHeight: 56 },
} as const;

export type AppTheme = typeof theme;
