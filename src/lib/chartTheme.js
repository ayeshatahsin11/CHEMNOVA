export function chartColors(theme) {
  return theme === 'light'
    ? { accent: '#0891b2', secondary: '#7c3aed', grid: 'rgba(80,100,160,0.18)', tick: '#55638a' }
    : { accent: '#22d3ee', secondary: '#8b5cf6', grid: 'rgba(148,163,255,0.14)', tick: '#8f9cc4' }
}