import { describe, it, expect } from 'vitest';
import { theme, colors, MIN_TOUCH_TARGET } from '../theme';
import fs from 'node:fs';
import path from 'node:path';

/**
 * WCAG 2.1 Relative Luminance calculation.
 * Formula: https://www.w3.org/WAI/GL/wiki/Relative_luminance
 */
function getLuminance(hexColor: string): number {
  const cleanHex = hexColor.replace('#', '');
  const r = parseInt(cleanHex.substring(0, 2), 16) / 255;
  const g = parseInt(cleanHex.substring(2, 4), 16) / 255;
  const b = parseInt(cleanHex.substring(4, 6), 16) / 255;

  const toLinear = (c: number) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));

  const rLinear = toLinear(r);
  const gLinear = toLinear(g);
  const bLinear = toLinear(b);

  return 0.2126 * rLinear + 0.7152 * gLinear + 0.0722 * bLinear;
}

/**
 * WCAG 2.1 Contrast Ratio calculation.
 * Formula: (L1 + 0.05) / (L2 + 0.05)
 */
function getContrastRatio(foregroundHex: string, backgroundHex: string): number {
  const lum1 = getLuminance(foregroundHex);
  const lum2 = getLuminance(backgroundHex);

  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);

  return (lighter + 0.05) / (darker + 0.05);
}

describe('Farmer Mobile Accessibility Pass (S-46)', () => {
  it('enforces minimum touch target size >= 44dp for outdoor/field use', () => {
    expect(MIN_TOUCH_TARGET).toBeGreaterThanOrEqual(44);
    expect(theme.minTouchTarget).toBeGreaterThanOrEqual(44);
  });

  it('verifies primary button contrast (white text on primary) meets WCAG AA (>= 4.5:1)', () => {
    const contrast = getContrastRatio(colors.white, colors.primary);
    // Standard WCAG 2.1 AA requirement is 4.5:1 for normal text
    expect(contrast).toBeGreaterThanOrEqual(4.5);
  });

  it('verifies content contrast (onSurface text on surface) meets WCAG AA (>= 4.5:1)', () => {
    const contrast = getContrastRatio(colors.onSurface, colors.surface);
    expect(contrast).toBeGreaterThanOrEqual(4.5);
  });

  it('verifies content contrast (onSurface text on white card) meets WCAG AA (>= 4.5:1)', () => {
    const contrast = getContrastRatio(colors.onSurface, colors.white);
    expect(contrast).toBeGreaterThanOrEqual(4.5);
  });

  it('verifies pressed state contrast (white on primaryPressed) meets WCAG AA (>= 4.5:1)', () => {
    const contrast = getContrastRatio(colors.white, colors.primaryPressed);
    expect(contrast).toBeGreaterThanOrEqual(4.5);
  });

  it('verifies core controls have accessibilityRole or accessibilityLabel in source', () => {
    const srcDir = path.resolve(__dirname, '../');
    const filesToCheck = [
      'components/Button.tsx',
      'components/Input.tsx',
      'components/ErrorState.tsx',
      'screens/listings/ListingsScreen.tsx',
      'screens/listings/CreateListingScreen.tsx',
    ];

    for (const relPath of filesToCheck) {
      const fullPath = path.join(srcDir, relPath);
      const content = fs.readFileSync(fullPath, 'utf8');
      const hasAccessibilityAttr =
        content.includes('accessibilityRole') || content.includes('accessibilityLabel');
      expect(hasAccessibilityAttr).toBe(true);
    }
  });
});
