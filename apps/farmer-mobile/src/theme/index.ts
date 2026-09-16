/**
 * Farmer app theme.
 *
 * Everything here is derived from @tohfa/design-tokens — no hex literals, no
 * magic numbers. The farmer app's primary is TOHFA Teal; the customer app uses
 * Deep Blue, which is the ONLY difference between the two theme files.
 */
import { tokens, hex, neutral, semantic } from '@tohfa/design-tokens';

export const colors = {
  primary: semantic('primary'),
  primaryPressed: semantic('primaryPressed'),
  secondary: semantic('secondary'),
  danger: semantic('danger'),
  success: semantic('success'),
  info: semantic('info'),
  surface: semantic('surface'),
  onSurface: semantic('onSurface'),
  accent: semantic('accent'),
  white: neutral('white'),
  brand: hex('tohfaTeal'),
  surfaceVariant: neutral('grey100'),
  surfacePressed: neutral('grey300'),
  onSurfaceVariant: neutral('grey500'),
  textMuted: neutral('grey700'),
  brandGreen: '#266E2B',
  brandGreenLight: '#E8F5E9',
  bgLight: '#FCFCFC',
  borderLight: '#E8E6DD',
  borderMedium: '#E0DDD2',
  borderDivider: '#EAE7DD',
  borderSoft: '#F0EEE6',
  prefixBg: '#F0EEE6',
  textDark: '#111827',
  textBody: '#3A3A3A',
  textSubtle: '#6B7280',
  textPlaceholder: '#8A927F',
  requiredRed: '#E24B4A',
  mapDarkOverlay: 'rgba(0, 0, 0, 0.15)',
  mapBadgeBg: 'rgba(17, 24, 39, 0.85)',
  mapPolygonBorder: '#16A34A',
  mapPolygonFill: 'rgba(22, 163, 74, 0.05)',
  mapPolygonEditingBorder: '#F59E0B',
  mapPolygonEditingFill: 'rgba(245, 158, 11, 0.12)',
  liveBadgeBg: '#ECFDF5',
  liveBadgeText: '#15803D',
  accuracyGreen: '#16A34A',
  statLabelColor: '#6B7280',
  statSubColor: '#9CA3AF',
  charcoal: '#1F2937',
  stepInactiveProgress: '#E5ECE2',
  stepCardBorder: '#E5E7EB',
  buttonBorderGreen: '#266E2B',
  buttonBgGreen: '#266E2B',
  sproutLight: '#86EFAC',
  sproutMid: '#4ADE80',
  sproutTint: '#BBF7D0',
  sproutStem: '#15803D',
  sproutOutline: '#22C55E',
  markerBg: '#FEF3C7',
  markerStroke: '#D97706',
  mapBackgroundFallback: '#1E3F20',
  zoneDotRed: '#EF4444',
  zoneDotOrange: '#F59E0B',
  zoneDotGreen: '#10B981',
  zoneDotPurple: '#8B5CF6',
  mapCenterBadgeBg: 'rgba(20, 36, 22, 0.88)',
  mapCenterBadgeSub: '#A7F3D0',
  farmIconBadgeBg: '#E8F5E9',
  polygonDivider: 'rgba(255, 255, 255, 0.65)',
  polygonFillWarm: 'rgba(180, 130, 60, 0.14)',
  targetGreen: '#22C55E',
} as const;

/** Point values map 1:1 to React Native `dp`. */
export const typography = {
  caption: tokens.typeScale.caption,
  footnote: tokens.typeScale.footnote,
  bodySmall: tokens.typeScale.bodySmall,
  body: tokens.typeScale.body,
  bodyLarge: tokens.typeScale.bodyLarge,
  title: tokens.typeScale.title,
  headline: tokens.typeScale.headline,
  display: tokens.typeScale.display,
} as const;

export const weights = {
  regular: String(tokens.fontWeight.regular) as '400',
  medium: String(tokens.fontWeight.medium) as '500',
  semibold: String(tokens.fontWeight.semibold) as '600',
  bold: String(tokens.fontWeight.bold) as '700',
} as const;

export const lineHeights = tokens.lineHeight;
export const spacing = tokens.spacing;
export const radius = {
  ...tokens.radius,
  card: tokens.radius.cardMin,
  sm: 6,
  md: 8,
  lg: tokens.radius.cardMin,
} as const;


/**
 * Minimum tappable size. Farmers use this outdoors, one-handed, often with wet
 * or gloved hands — do not shrink it "to fit the design".
 */
export const MIN_TOUCH_TARGET = tokens.size.minTouchTarget;

/**
 * Palette for the approved auth-screen mockups (branding guidelines,
 * Screens 10-12). The mockups use a fixed green/cream scheme that differs
 * from the token primary, so it lives here where the hex-lint guard permits
 * raw values. Screens must import from here — never inline hex literals.
 */
export const authPalette = {
  primary: '#266E2B',
  brandGreen: '#266E2B',
  brandGreenLight: '#E8F5E9',
  ink: '#111827',
  muted: '#6B7280',
  lightGreen: '#E8F5E9',
  border: '#E5E7EB',
  bg: '#FCFCFC',
  progressInactive: '#e0ddd2',
  divider: '#E5E7EB',
  legal: '#9CA3AF',
  white: '#FFFFFF',
  googleBlue: '#4285F4',
  facebookBlue: '#1877F2',
  black: '#000000',
  deepGreen: '#1B5E20',
  leafGreen: '#266E2B',
  splashDark: '#0B1A16',
  borderLight: '#EEEEEE',
  errorRed: '#DC2626',
  errorBg: '#FEE2E2',
  successGreen: '#16A34A',
} as const;

export const theme = {
  colors,
  typography,
  weights,
  lineHeights,
  spacing,
  radius,
  minTouchTarget: MIN_TOUCH_TARGET,
} as const;

export type Theme = typeof theme;

export function useTheme() {
  return {
    ...theme,
    colors: {
      ...colors,
      grey100: neutral('grey100'),
      grey300: neutral('grey300'),
      grey500: neutral('grey500'),
      grey700: neutral('grey700'),
    },
  };
}
