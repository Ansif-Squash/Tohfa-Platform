import React, { createContext, useContext } from 'react';
import { tokens, neutral, semantic, hex } from '@tohfa/design-tokens';

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
    brand: hex('tohfaTeal'),
    surfaceVariant: neutral('grey100'),
    surfacePressed: neutral('grey300'),
    onSurfaceVariant: neutral('grey500'),
    textMuted: neutral('grey700'),
    grey100: neutral('grey100'),
    grey300: neutral('grey300'),
    grey500: neutral('grey500'),
    grey700: neutral('grey700'),
  },
  typography: {
    caption: tokens.typeScale.caption,
    footnote: tokens.typeScale.footnote,
    bodySmall: tokens.typeScale.bodySmall,
    body: tokens.typeScale.body,
    bodyLarge: tokens.typeScale.bodyLarge,
    title: tokens.typeScale.title,
    headline: tokens.typeScale.headline,
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
  radius: {
    ...tokens.radius,
    card: tokens.radius.cardMin,
    sm: 6,
    md: 8,
    lg: tokens.radius.cardMin,
  },
  minTouchTarget: tokens.size.minTouchTarget,
};

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
