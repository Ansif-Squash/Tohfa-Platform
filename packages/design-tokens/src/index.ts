/**
 * @tohfa/design-tokens
 *
 * The typed façade over `tokens.json`. Apps import from here, never from the
 * JSON directly, so that a token rename becomes a compile error everywhere.
 */
import tokensData from './tokens.json' with { type: 'json' };

const rawObj = (('default' in tokensData ? (tokensData as { default: typeof tokensData }).default : tokensData) ?? tokensData) as typeof tokensData;

export type ColorName = keyof typeof rawObj.color;
export type NeutralName = keyof typeof rawObj.neutral;
export type SemanticColorName = keyof typeof rawObj.semanticColor;
export type RoleCodeWithColor = keyof typeof rawObj.roleColor;
export type TypeScaleName = keyof typeof rawObj.typeScale;
export type TypeStyleName = keyof typeof rawObj.typeStyle;
export type FontWeightName = keyof typeof rawObj.fontWeight;
export type SpacingName = keyof typeof rawObj.spacing;
export type RadiusName = keyof typeof rawObj.radius;
export type FontStackName = keyof typeof rawObj.fontStack;

export interface ColorToken {
  readonly hex: string;
  readonly usage: string;
}

/** A complete named text style: size and line height in px, plus the weight. */
export interface TypeStyle {
  readonly size: number;
  readonly lineHeight: number;
  readonly weight: number;
}

export interface Tokens {
  readonly version: string;
  readonly color: Readonly<Record<ColorName, ColorToken>>;
  readonly neutral: Readonly<Record<NeutralName, ColorToken>>;
  readonly roleColor: Readonly<Record<RoleCodeWithColor, ColorName>>;
  /**
   * A semantic name points at a key in `color` OR in `neutral` — `onSurface`
   * resolves through the neutral ramp, `primary` through the brand palette.
   */
  readonly semanticColor: Readonly<Record<SemanticColorName, ColorName | NeutralName>>;
  readonly typeScale: Readonly<Record<TypeScaleName, number>>;
  readonly typeStyle: Readonly<Record<TypeStyleName, TypeStyle>>;
  readonly fontWeight: Readonly<Record<FontWeightName, number>>;
  readonly lineHeight: { readonly body: number; readonly heading: number };
  readonly spacing: Readonly<Record<SpacingName, number>>;
  readonly radius: Readonly<Record<RadiusName, number>>;
  readonly size: { readonly minTouchTarget: number };
  readonly fontStack: Readonly<Record<FontStackName, string>>;
}

export const tokens: Tokens = rawObj as unknown as Tokens;

/**
 * Resolve a brand-or-neutral key to its token. Semantic names may target either
 * group (`primary` lives in `color`, `onSurface` in `neutral`), so both are
 * searched rather than forcing a duplicate grey into the brand palette.
 */
function lookup(name: ColorName | NeutralName): ColorToken {
  const palette = tokens.color as Readonly<Record<string, ColorToken | undefined>>;
  const greys = tokens.neutral as Readonly<Record<string, ColorToken | undefined>>;
  const token = palette[name] ?? greys[name];
  if (!token) {
    // Unreachable through the typed API; guards against a hand-edited tokens.json
    // pointing a semantic name at a key that does not exist.
    throw new Error(`Unknown design token colour: ${String(name)}`);
  }
  return token;
}

/** Resolve a semantic name (`primary`) to its hex value (`#3F7D32`). */
export function semantic(name: SemanticColorName): string {
  return lookup(tokens.semanticColor[name]).hex;
}

/** Resolve a named text style (`h2`) to its size, line height and weight. */
export function typeStyle(name: TypeStyleName): TypeStyle {
  return tokens.typeStyle[name];
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

export { rawObj as tokensJson };
export { toCssVariables, toCssBlock } from './css.js';