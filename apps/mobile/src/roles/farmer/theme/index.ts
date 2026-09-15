/**
 * Farmer app theme.
 *
 * Everything here is derived from @tohfa/design-tokens — no hex literals, no
 * magic numbers. The farmer and customer theme files used to differ in exactly
 * one way, their brand colour; the approved design system dropped per-app brand
 * colours, so both now resolve to the same universal primary.
 */
import { tokens, neutral, semantic } from '@tohfa/design-tokens';

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
  brand: semantic('primary'),
  surfaceVariant: neutral('neutral100'),
  surfacePressed: neutral('neutral300'),
  onSurfaceVariant: neutral('neutral600'),
  textMuted: neutral('neutral700'),
  brandGreen: '#2E7D32',
  brandGreenLight: '#E8F5E9',
  bgLight: '#FCFCFC',
  borderLight: '#E8E6DD',
  borderMedium: '#E0DDD2',
  borderDivider: '#EAE7DD',
  borderSoft: '#F0EEE6',
  prefixBg: '#F0EEE6',
  textDark: '#1A2E1A',
  textBody: '#3A3A3A',
  textSubtle: '#6B7566',
  textPlaceholder: '#8A927F',
  requiredRed: semantic('danger'), // identical to `danger` above — the shared error token
} as const;

/** Values are px, which map 1:1 to React Native `dp`. */
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
// card/sm/md/lg used to be patched in here by hand; the design system now names
// every step, so the whole map comes straight from the tokens.
export const radius = tokens.radius;


/**
 * Minimum tappable size. Farmers use this outdoors, one-handed, often with wet
 * or gloved hands — do not shrink it "to fit the design".
 */
export const MIN_TOUCH_TARGET = tokens.size.minTouchTarget;

/**
 * Palette for the approved mockups (branding guidelines, Screens 10-12, plus
 * the farmer dashboard/profile/registration screens carried over from the
 * `mobile-app-suba` branch). Those screens use fixed colours that differ from
 * the token primary scale, so this is where the hex-lint guard permits raw
 * values. Screens must import from here — never inline hex literals.
 *
 * The named entries below the original auth set are additive: one field per
 * distinct colour actually used by a screen, named after the standard
 * Material/Tailwind swatch it matches (e.g. `orange700` = Material Orange
 * 700) so the mapping from hex to name is unambiguous and the same field is
 * reused wherever that exact colour recurs. A handful with no standard-swatch
 * match keep a short descriptive name instead (e.g. `noticeBg`).
 */
export const authPalette = {
  primary: '#2E7D32',
  ink: '#1a2e1a',
  muted: '#6b7566',
  lightGreen: '#EAF3DE',
  border: '#e8e6dd',
  bg: '#FCFCFC',
  progressInactive: '#e0ddd2',
  divider: '#eae7dd',
  legal: '#b8b6aa',
  white: neutral('white'),
  googleBlue: '#4285F4',
  facebookBlue: '#1877F2',
  black: neutral('black'),
  deepGreen: '#1B5E20',
  leafGreen: '#66BB6A',
  splashDark: '#0B1A16',
  borderLight: '#EEEEEE',

  // Green
  green100: '#c8e6c9',
  green200: '#a5d6a7',
  green700: '#388e3c',
  greenPaleBg: '#d4eed8',
  sageTintBg: '#e8f0e6',
  sageButtonBg: '#a3c2a4',
  sageBorder: '#e0e5df',
  sageMutedText: '#5f735c',
  oliveGreen: '#3e5c26',
  successTint: '#eaf4e8',
  successDark: '#0f5132',
  // Teal / Light-Green
  teal400: '#26a69a',
  teal800: '#00695c',
  tealAccent: '#00bfa5',
  lightGreen50: '#f1f8e9',
  lightGreen900: '#33691e',
  // Orange / Amber / Yellow
  orange50: '#fff3e0',
  orange100: '#ffe0b2',
  orange400: '#ffa726',
  orange500: '#ff9800',
  orange600: '#fb8c00',
  orange700: '#f57c00',
  orange800: '#ef6c00',
  orange900: '#e65100',
  deepOrange600: '#f4511e',
  deepOrange800: '#d84315',
  darkOrange: '#ff8c00',
  amber50: '#fff8e1',
  amber200: '#ffe082',
  amber600: '#ffb300',
  amberAccent: '#f5a623',
  amberDeep: '#b76e00',
  yellow500: '#ffeb3b',
  yellow900: '#f57f17',
  gold: '#ffd700',
  twOrange50: '#fff7ed',
  twOrange600: '#ea580c',
  twAmber900: '#78350f',
  // Red
  red50: '#ffebee',
  red100: '#ffcdd2',
  red500: '#f44336',
  red600: '#e53935',
  red700: '#d32f2f',
  red800: '#c62828',
  redAccent200: '#ff5252',
  twRed500: '#ef4444',
  // Blue / Sky
  blue50: '#e3f2fd',
  blue700: '#1976d2',
  lightBlue50: '#e1f5fe',
  lightBlue700: '#0288d1',
  sky100: '#e0f2fe',
  sky600: '#0284c7',
  // Purple
  deepPurple400: '#7e57c2',
  deepPurple600: '#5e35b1',
  deepPurple800: '#4527a0',
  violetAccent: '#7c5cfc',
  violetTint: '#f0edff',
  // Slate / Grey / Blue-Grey
  slate50: '#f8fafc',
  slate100: '#f1f5f9',
  slate200: '#e2e8f0',
  slate300: '#cbd5e1',
  slate400: '#94a3b8',
  slate500: '#64748b',
  slate600: '#475569',
  slate800: '#1e293b',
  grey100: '#f5f5f5',
  grey200: '#eeeeee',
  grey300: '#e0e0e0',
  grey500: '#9e9e9e',
  grey600: '#757575',
  grey800: '#424242',
  grey900: '#212121',
  blueGrey100: '#cfd8dc',
  blueGrey400: '#78909c',
  blueGrey600: '#546e7a',
  blueGrey700: '#455a64',
  blueGrey800: '#37474f',
  brown400: '#8d6e63',
  placeholderGrey: '#888888',
  nearBlack: '#1a1a1a',
  darkSlateText: '#2c3e50',
  coolBorder: '#d4d6d2',
  // Info / notice boxes
  noticeBg: '#f0f4f8',
  noticeBorder: '#d0d9e0',
  noticeBorderAlt: '#d1e0ee',
  noticeText: '#2a4a6a',
  noticeTextAlt: '#4a5b6d',
  coolTintBg: '#ebf4fa',
  coolSurfaceBg: '#eef2f6',
  paleBlueBg: '#ebf4ff',
  // Misc pale tints / cards
  surfaceMuted: '#f0f0f0',
  paleLavenderBg: '#f0f0ff',
  paleSkyBg: '#f0f8ff',
  paleMintBg: '#f0fff0',
  palePeachBg: '#fff0ed',
  palePinkBg: '#fff0f5',
  paleAmberBg2: '#fff3d6',
  paleCreamBg: '#fff5e6',
  paleSurface: '#f3f5f2',
  blushBg: '#f5e6e6',
  lightSurfaceAlt: '#f8f9fa',
  certCardBg: '#f8faf6',
  certCardBgAlt: '#f8faf7',
  warnCardBg: '#fff8f0',
  warnCardBorder: '#ffe8d6',
  alertBgCream: '#fffdf9',
  // OTP screen (distinct cream/green scheme from the rest of the auth flow)
  creamBg: '#f3f3e9',
  otpInk: '#1a4314',
  // Application-status timeline placeholders
  pendingGrey: '#d8d8d8',
  pendingTextGrey: '#b0b0b0',
  pendingSubGrey: '#c0c0c0',
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
      // Legacy ramp names, repointed at the nearest step of the new 50→950 scale.
      grey100: neutral('neutral300'),
      grey300: neutral('neutral400'),
      grey500: neutral('neutral500'),
      grey700: neutral('neutral700'),
    },
  };
}
