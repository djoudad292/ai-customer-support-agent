/**
 * Theme re-export — values now come from the shared @supportai/ui design tokens
 * (packages/ui/src/tokens.ts). Legacy key names are kept as aliases so existing
 * screens continue to work while adopting the new palette.
 */
import { colors } from '@supportai/ui'

const t = colors.dark

export const Colors = {
  // surfaces
  background: t.bg,
  card: t.surface,
  cardAlt: t.surfaceAlt,
  foreground: t.fg,
  muted: t.surfaceAlt,
  secondary: t.surface,
  mutedForeground: t.fgMuted,
  border: t.border,
  // brand
  primary: t.primaryStrong,
  primaryForeground: '#0B1120',
  primarySoft: t.primarySoft,
  // semantic (legacy names -> new tokens)
  green: t.success,
  greenSoft: t.successSoft,
  red: t.danger,
  redSoft: t.dangerSoft,
  purple: t.violet,
  purpleSoft: t.violetSoft,
  orange: t.orange,
  orangeSoft: t.orangeSoft,
  yellow: t.warning,
  cyan: t.accent,
  blue: t.primary,
  blueSoft: t.primarySoft,
  slate: t.fgSecondary,
  slateSoft: t.surfaceHover,
} as const

// New-token passthrough for refactored screens
export const Tokens = {
  bg: t.bg,
  surface: t.surface,
  surfaceAlt: t.surfaceAlt,
  surfaceHover: t.surfaceHover,
  border: t.border,
  borderStrong: t.borderStrong,
  fg: t.fg,
  fgSecondary: t.fgSecondary,
  fgMuted: t.fgMuted,
  primary: t.primary,
  primaryStrong: t.primaryStrong,
  primarySoft: t.primarySoft,
  success: t.success,
  successSoft: t.successSoft,
  warning: t.warning,
  warningSoft: t.warningSoft,
  danger: t.danger,
  dangerSoft: t.dangerSoft,
  violet: t.violet,
  violetSoft: t.violetSoft,
  accent: t.accent,
  accentSoft: t.accentSoft,
  orange: t.orange,
}

export const API_URL = process.env.EXPO_PUBLIC_API_URL || 'https://ai-customer-support-backend-ldbf.onrender.com'
export const WS_URL = process.env.EXPO_PUBLIC_WS_URL || API_URL
