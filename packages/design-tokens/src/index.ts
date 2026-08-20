/**
 * @tohfa/design-tokens
 *
 * The typed façade over `tokens.json`. Apps import from here, never from the
 * JSON directly, so that a token rename becomes a compile error everywhere.
 */
import raw from './tokens.json';

export type ColorName = keyof typeof raw.color;
export type NeutralName = keyof typeof raw.neutral;
export type SemanticColorName = keyof typeof raw.semanticColor;
export type RoleCodeWithColor = keyof typeof raw.roleColor;
export type TypeScaleName = keyof typeof raw.typeScale;
export type FontWeightName = keyof typeof raw.fontWeight;
export type SpacingName = keyof typeof raw.spacing;
export type RadiusName = keyof typeof raw.radius;
export type FontStackName = keyof typeof raw.fontStack;

export interface ColorToken {
  readonly hex: string;
  readonly usage: string;
}

export interface Tokens {
  readonly version: string;
  readonly color: Readonly<Record<ColorName, ColorToken>>;
  readonly neutral: Readonly<Record<NeutralName, ColorToken>>;
  readonly roleColor: Readonly<Record<RoleCodeWithColor, ColorName>>;
  readonly semanticColor: Readonly<Record<SemanticColorName, ColorName>>;
  readonly typeScale: Readonly<Record<TypeScaleName, number>>;
  readonly fontWeight: Readonly<Record<FontWeightName, number>>;
  readonly lineHeight: { readonly body: number; readonly heading: number };
  readonly spacing: Readonly<Record<SpacingName, number>>;
  readonly radius: Readonly<Record<RadiusName, number>>;
  readonly size: { readonly minTouchTarget: number };
  readonly fontStack: Readonly<Record<FontStackName, string>>;
}

export const tokens: Tokens = raw as unknown as Tokens;

/** Resolve a semantic name (`primary`) to its hex value (`#0F6E56`). */
export function semantic(name: SemanticColorName): string {
  const colorName = tokens.semanticColor[name];
  return tokens.color[colorName].hex;
}

/** Resolve a role code to the hex value used for its badges and chips. */
export function roleHex(role: RoleCodeWithColor): string {
  const colorName = tokens.roleColor[role];
  return tokens.color[colorName].hex;
}

/** Hex of a raw brand colour. */
export function hex(name: ColorName): string {
  return tokens.color[name].hex;
}

/**
 * Hex of a neutral. White, black and the grey ramp live here rather than in
 * `color` because they are derived from the cream/ink pair, not brand choices —
 * and because `white: '#FFFFFF'` in an app file is exactly the hard-coded hex
 * this package exists to prevent.
 */
export function neutral(name: NeutralName): string {
  return tokens.neutral[name].hex;
}

export { raw as tokensJson };
export { toCssVariables, toCssBlock } from './css';
