/**
 * CSS custom-property emitter.
 *
 * The Angular admin app cannot import a TS object into a stylesheet, so we emit
 * the same tokens as `--tohfa-*` custom properties. Run this at build time (or
 * paste the output into `src/styles.css`) rather than duplicating hex values.
 */
// Imported from the JSON, not from `./index`, to keep this module free of a
// circular dependency (index re-exports these functions).
import tokens from './tokens.json';

/** Flat map of custom-property name -> value, e.g. `--tohfa-color-tohfa-teal`. */
export function toCssVariables(): Record<string, string> {
  const out: Record<string, string> = {};

  for (const [name, token] of Object.entries(tokens.color)) {
    out[`--tohfa-color-${kebab(name)}`] = token.hex;
  }
  for (const [name, token] of Object.entries(tokens.neutral)) {
    out[`--tohfa-neutral-${kebab(name)}`] = token.hex;
  }
  for (const [name, colorName] of Object.entries(tokens.semanticColor)) {
    out[`--tohfa-${kebab(name)}`] = `var(--tohfa-color-${kebab(colorName)})`;
  }
  for (const [name, colorName] of Object.entries(tokens.roleColor)) {
    out[`--tohfa-role-${kebab(name)}`] = `var(--tohfa-color-${kebab(colorName)})`;
  }
  for (const [name, pt] of Object.entries(tokens.typeScale)) {
    out[`--tohfa-font-size-${kebab(name)}`] = `${pt / 16}rem`;
  }
  for (const [name, weight] of Object.entries(tokens.fontWeight)) {
    out[`--tohfa-font-weight-${kebab(name)}`] = String(weight);
  }
  out['--tohfa-line-height-body'] = String(tokens.lineHeight.body);
  out['--tohfa-line-height-heading'] = String(tokens.lineHeight.heading);

  for (const [name, px] of Object.entries(tokens.spacing)) {
    out[`--tohfa-space-${kebab(name)}`] = `${px}px`;
  }
  for (const [name, px] of Object.entries(tokens.radius)) {
    out[`--tohfa-radius-${kebab(name)}`] = `${px}px`;
  }
  out['--tohfa-min-touch-target'] = `${tokens.size.minTouchTarget}px`;

  for (const [name, stack] of Object.entries(tokens.fontStack)) {
    out[`--tohfa-font-${kebab(name)}`] = stack;
  }

  return out;
}

/** The variables wrapped in a selector block, ready to write to a .css file. */
export function toCssBlock(selector = ':root'): string {
  const vars = toCssVariables();
  const body = Object.entries(vars)
    .map(([k, v]) => `  ${k}: ${v};`)
    .join('\n');
  return `/* GENERATED from @tohfa/design-tokens — do not edit by hand. */\n${selector} {\n${body}\n}\n`;
}

function kebab(input: string): string {
  return input.replace(/([a-z0-9])([A-Z])/g, '$1-$2').replace(/_/g, '-').toLowerCase();
}
