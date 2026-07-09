// Dell 1996 design language palette.
// Inspired by Dell.com December 1996 - catalog-era enterprise web design:
// light canvas inside a black page frame, pure-black ink, Dell-red reserved for
// CTA, and eight flat catalog "ribbon-card" tints. Chart components read every
// color from this object, so restyling here propagates to all charts.

export const DARK_THEME = {
  // Surfaces (light, sitting inside the black page frame)
  background: '#ffffff', // canvas - chart background, app canvas
  panel: '#ffffff', // tooltip / dataZoom background, ribbon-card title bar
  cardBg: '#ffffff', // nested card background (also fixes HousingPricePanel)

  // Text
  text: '#000000', // ink - pure black
  textMuted: '#4d4d4d', // axis labels / secondary text on white
  textLink: '#0000ee', // classic Mosaic / Netscape 3.x link blue

  // Lines & borders (frame-ink hairlines; chart splitLine uses opacity -> light gray)
  gridLine: '#000000',
  border: '#000000',

  // Chart series palette - Dell family, readable on white
  accent: [
    '#e91d2a', // Dell red
    '#6a26a4', // Dell purple stripe
    '#8e8a25', // olive
    '#8c9ae0', // periwinkle
    '#e6915d', // peach
    '#d77a7a', // salmon
    '#2f6f9f', // deep sky (darkened for line legibility)
    '#b8860b', // dark gold (darkened lime/steel substitute)
  ],

  // Chinese stock convention: 涨=红 (Dell red), 跌=绿 (readable green; Dell has no green)
  positive: '#e91d2a',
  negative: '#2e7d2c',
  // Aliases for increase/decrease (涨=红 up, 跌=绿 down) used by housing panel.
  up: '#e91d2a',
  down: '#2e7d2c',

  // Status colors (Dell-tuned for white-background contrast)
  success: '#2e7d2c',
  warning: '#8a6d0b', // readable amber on white
  error: '#e91d2a',
  info: '#8c9ae0',
} as const;

// Ribbon-card tint family - one flat catalog color per panel (cycled across the 20 panels).
export const RIBBON_TINTS = [
  '#b3bd95', // sage
  '#d77a7a', // salmon
  '#e6915d', // peach
  '#c0d4a7', // lime
  '#9ab6c8', // sky
  '#a5b8c0', // steel
  '#8c9ae0', // periwinkle
  '#8e8a25', // olive
] as const;
