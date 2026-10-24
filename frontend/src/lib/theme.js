// Raw colour values for Recharts / inline SVG. Keep in sync with @theme in src/index.css.
export const colors = {
  bg: '#06100C',
  surface1: '#0B1912',
  surface2: '#0F2219',
  border: 'rgba(255,255,255,0.06)',
  borderStrong: 'rgba(255,255,255,0.12)',
  text: '#ECFDF5',
  textMuted: '#94A3A0',
  textFaint: '#7B8C87',
  primary: '#10B981',
  primaryGlow: 'rgba(16,185,129,0.35)',
  accent: '#A3E635',
  warning: '#F59E0B',
  danger: '#EF4444',
}

export const categoryColors = {
  organic: '#22C55E',
  plastic: '#38BDF8',
  paper: '#FACC15',
  metal: '#94A3B8',
  other: '#A78BFA',
}

export const disposalColors = {
  recycled: colors.primary,
  composted: categoryColors.organic,
  landfill: colors.warning,
}

export const buildingTypeColors = {
  hostel: colors.primary,
  academic: categoryColors.plastic,
}

export const easeOutExpo = [0.22, 1, 0.36, 1]
