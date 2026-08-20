/**
 * Customer app theme.
 *
 * Identical in structure to the farmer app's theme — the ONE difference is the
 * brand: the customer app leads with Deep Blue (`deepBlue`) while the farmer app
 * leads with TOHFA Teal. Everything else comes from @tohfa/design-tokens, so a
 * token change lands in both apps at once.
 */
import { tokens, hex, neutral, semantic } from '@tohfa/design-tokens';

export const colors = {
  /** Customer brand: Deep Blue. */
  primary: hex('deepBlue'),
  primaryPressed: hex('deepTeal'),
  secondary: semantic('secondary'),
  danger: semantic('danger'),
  success: semantic('success'),
  info: hex('deepBlue'),
  surface: semantic('surface'),
  onSurface: semantic('onSurface'),
  accent: semantic('accent'),
  white: neutral('white'),
  /** Used only on "grown by TOHFA farmers" trust badges. */
  farmerBrand: hex('tohfaTeal'),
} as const;

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
export const radius = tokens.radius;
export const MIN_TOUCH_TARGET = tokens.size.minTouchTarget;

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
