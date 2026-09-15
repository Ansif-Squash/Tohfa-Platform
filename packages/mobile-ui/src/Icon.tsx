/**
 * Material Symbols Outlined Icon component.
 * Optical size 24, weight 400, fill 0.
 * NO emojis in production.
 *
 * Renders the icon's Private-Use-Area codepoint (e.g. "home" -> U+E9B2), not
 * the ligature name string. React Native's Android Text renderer does not
 * reliably apply OpenType ligature substitution for custom fonts, so a
 * ligature-name approach falls back to literal text like "home" on device
 * even once the font file is present — this was the actual production bug.
 * Codepoint rendering is the approach every major RN icon library
 * (react-native-vector-icons, @expo/vector-icons) uses for this reason.
 *
 * The codepoint table lives in ./iconCodepoints.ts. It only covers the icon
 * names this app actually references — see that file for how it was
 * generated and for the two names (`gps_fixed`, `terrain`) that Material
 * Symbols doesn't ship under any name, which fall back to a placeholder
 * glyph here rather than crashing or re-introducing literal English text.
 *
 * Font asset: apps/mobile/src/assets/fonts/MaterialSymbolsOutlined.ttf,
 * linked at apps/mobile/android/app/src/main/assets/fonts/ for Android (RN
 * Android resolves `fontFamily` by *asset filename*, not the font's internal
 * name — see FONT_FAMILY below) and registered in each iOS target's
 * Info.plist under UIAppFonts for iOS (unverified — no Xcode in this repo's
 * dev environment; iOS parity is best-effort only).
 */
import React from 'react';
import { Text, StyleSheet, Platform } from 'react-native';
import type { TextStyle } from 'react-native';
import { useTheme } from './theme';
import { ICON_CODEPOINTS, ICON_ALIASES } from './iconCodepoints';

export interface IconProps {
  name: string;
  size?: number | undefined;
  color?: string | undefined;
  style?: TextStyle | undefined;
}

// Android: react-native links a custom font by the filename under
// android/app/src/main/assets/fonts/ (no extension), NOT by the font's
// internal name/PostScript metadata — that's an Android-specific quirk,
// different from iOS, which resolves fonts by their real internal family
// name once registered via Info.plist's UIAppFonts. Keep both in sync with
// the asset at apps/mobile/src/assets/fonts/MaterialSymbolsOutlined.ttf.
const FONT_FAMILY = Platform.select({
  android: 'MaterialSymbolsOutlined',
  default: 'Material Symbols Outlined',
});

// Rendered for a `name` with no codepoint entry, so a missing icon is
// visibly a placeholder rather than either a crash or the literal English
// name (the exact bug this component exists to fix).
const FALLBACK_GLYPH = '?';

function resolveGlyph(name: string): string {
  const resolvedName = ICON_ALIASES[name] ?? name;
  const codepoint = ICON_CODEPOINTS[resolvedName];

  if (codepoint === undefined) {
    if (__DEV__) {
      console.warn(
        `[Icon] No Material Symbols codepoint for name "${name}". ` +
          'Add it to packages/mobile-ui/src/iconCodepoints.ts (and to the ' +
          'font subset) if this is a real icon in use, or fix the call site.',
      );
    }
    return FALLBACK_GLYPH;
  }

  return String.fromCodePoint(codepoint);
}

export const Icon: React.FC<IconProps> = ({
  name,
  size = 24,
  color,
  style,
}) => {
  const theme = useTheme();
  const iconColor = color ?? theme.colors.onSurface;

  return (
    <Text
      accessibilityRole="text"
      aria-label={name}
      style={[
        styles.iconText,
        {
          fontSize: size,
          color: iconColor,
          lineHeight: size,
        },
        style,
      ]}
    >
      {resolveGlyph(name)}
    </Text>
  );
};

const styles = StyleSheet.create({
  iconText: {
    fontFamily: FONT_FAMILY,
    fontWeight: '400',
    textAlign: 'center',
  },
});
