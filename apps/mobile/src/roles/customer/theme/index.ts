/**
 * Customer app theme.
 *
 * Identical in structure AND in palette to the farmer app's theme. The customer
 * app used to lead with Deep Blue against the farmer app's TOHFA Teal; the
 * approved design system dropped per-app brand colours in favour of one
 * universal primary, so there is no longer any colour difference between the two
 * roles. Everything comes from @tohfa/design-tokens, so a token change lands in
 * both at once.
 */
import { tokens, neutral, semantic } from '@tohfa/design-tokens';

export const colors = {
  /** The one TOHFA brand colour — same in every app and for every role. */
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
  /** Used only on "grown by TOHFA farmers" trust badges. */
  farmerBrand: semantic('primary'),
} as const;

export const typography = {
  caption: tokens.typeScale.caption,
  footnote: tokens.typeScale.caption,
  bodySmall: tokens.typeScale.small,
  body: tokens.typeScale.body,
  bodyLarge: tokens.typeScale.bodyLarge,
  title: tokens.typeScale.h2,
  headline: tokens.typeScale.h1,
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

export function useTheme() {
  return {
    ...theme,
    colors: {
      ...colors,
      // Legacy ramp names, repointed at the nearest step of the new 50→950 scale.
      grey100: neutral('neutral300'),
      grey300: neutral('neutral400'),
      grey500: neutral('neutral500'),
      grey700: neutral('neutral700'),
    },
  };
}
