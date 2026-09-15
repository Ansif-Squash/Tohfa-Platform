import React, { createContext, useContext } from 'react';
import { tokens, neutral, semantic, hex, roleHex } from '@tohfa/design-tokens';
import type { RoleCode } from '@tohfa/shared-types';

export interface MobileThemeColors {
  primary: string;
  primaryPressed: string;
  secondary: string;
  danger: string;
  success: string;
  info: string;
  surface: string;
  onSurface: string;
  accent: string;
  white: string;
  brand?: string;
  surfaceVariant?: string;
  surfacePressed?: string;
  onSurfaceVariant?: string;
  textMuted?: string;
  farmerBrand?: string;
  grey100?: string;
  grey300?: string;
  grey500?: string;
  grey700?: string;
}

export interface MobileTheme {
  colors: MobileThemeColors;
  typography: {
    caption: number;
    footnote: number;
    bodySmall: number;
    body: number;
    bodyLarge: number;
    title: number;
    headline: number;
    display: number;
  };
  weights: {
    regular: '400';
    medium: '500';
    semibold: '600';
    bold: '700';
  };
  lineHeights: {
    body: number;
    heading: number;
  };
  spacing: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
    xxl: number;
    xxxl: number;
  };
  radius: {
    cardMin: number;
    cardMax: number;
    button: number;
    input: number;
    pill: number;
    card?: number;
    sm?: number;
    md?: number;
    lg?: number;
  };
  minTouchTarget: number;
}

export const defaultMobileTheme: MobileTheme = {
  colors: {
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
    brand: hex('primary'),
    farmerBrand: hex('primary'),
    surfaceVariant: neutral('neutral100'),
    surfacePressed: neutral('neutral300'),
    onSurfaceVariant: neutral('neutral600'),
    textMuted: neutral('neutral700'),
    // The greyNNN keys are the legacy ramp positions screens still reference by
    // name. They point into the new 50→950 neutral scale at the nearest step.
    grey100: neutral('neutral300'),
    grey300: neutral('neutral400'),
    grey500: neutral('neutral500'),
    grey700: neutral('neutral700'),
  },
  // The theme keeps the names screens already use; the tokens behind them now
  // follow the design system's own type vocabulary (h1/h2/small/…).
  typography: {
    caption: tokens.typeScale.caption,
    footnote: tokens.typeScale.caption,
    bodySmall: tokens.typeScale.small,
    body: tokens.typeScale.body,
    bodyLarge: tokens.typeScale.bodyLarge,
    title: tokens.typeScale.h2,
    headline: tokens.typeScale.h1,
    display: tokens.typeScale.display,
  },
  weights: {
    regular: String(tokens.fontWeight.regular) as '400',
    medium: String(tokens.fontWeight.medium) as '500',
    semibold: String(tokens.fontWeight.semibold) as '600',
    bold: String(tokens.fontWeight.bold) as '700',
  },
  lineHeights: tokens.lineHeight,
  spacing: tokens.spacing,
  // card/sm/md/lg used to be hard-coded here; the design system now names every
  // step, so the whole map comes straight from the tokens.
  radius: tokens.radius,
  minTouchTarget: tokens.size.minTouchTarget,
};

/**
 * Role-flavoured theme.
 *
 * This function is now effectively an identity on colour: the approved design
 * system dropped per-role and per-app colour coding, so `roleColor` maps every
 * role to the one universal primary and `roleHex(role)` returns the same value
 * for all of them. It is kept rather than inlined because it is the single place
 * a future per-role accent would go back in, and because RootShell and
 * CustomerMainApp already build their theme through it.
 */
export function buildThemeForRole(role: RoleCode): MobileTheme {
  return {
    ...defaultMobileTheme,
    colors: {
      ...defaultMobileTheme.colors,
      primary: roleHex(role),
      brand: hex('primary'),
      farmerBrand: hex('primary'),
    },
  };
}

let activeTheme: MobileTheme = defaultMobileTheme;

export function setMobileTheme(theme: MobileTheme): void {
  activeTheme = theme;
}

export function getMobileTheme(): MobileTheme {
  return activeTheme;
}

const ThemeContext = createContext<MobileTheme>(defaultMobileTheme);

export const ThemeProvider: React.FC<{
  theme: MobileTheme;
  children: React.ReactNode;
}> = ({ theme, children }) => {
  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
};

export function useTheme(): MobileTheme {
  const ctx = useContext(ThemeContext);
  return ctx || activeTheme;
}
