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
export const radius = tokens.radius;

/**
 * Minimum tappable size. Farmers use this outdoors, one-handed, often with wet
 * or gloved hands — do not shrink it "to fit the design".
 */
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
