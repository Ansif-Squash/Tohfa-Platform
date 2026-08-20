/**
 * Minimal i18n.
 *
 * Deliberately dependency-free: the farmer app targets low-end Android and we
 * are not paying 40kB for `{{name}}` interpolation. Swap in i18next only if a
 * story actually needs plurals or gendered forms.
 *
 * Tamil is a FIRST-CLASS language here, not a translation layer. A missing `ta`
 * key falls back to English so the screen still works, and `missingKeys()`
 * exists so a test can assert the gap is shrinking.
 */
import en from './en.json';
import ta from './ta.json';

export const LOCALES = ['en', 'ta'] as const;
export type Locale = (typeof LOCALES)[number];

export type TranslationKey = keyof typeof en;

const CATALOGUES: Record<Locale, Record<string, string>> = {
  en: en as Record<string, string>,
  ta: ta as Record<string, string>,
};

let current: Locale = 'en';

export function setLocale(locale: Locale): void {
  current = locale;
}

export function getLocale(): Locale {
  return current;
}

/**
 * Translate. `params` values replace `{{name}}` placeholders.
 * Falls back: current locale -> English -> the key itself.
 */
export function t(key: TranslationKey, params: Record<string, string | number> = {}): string {
  const catalogue = CATALOGUES[current];
  const fallback = CATALOGUES.en;
  const template = catalogue[key] ?? fallback[key] ?? key;

  return template.replace(/\{\{(\w+)\}\}/g, (match, name: string) => {
    const value = params[name];
    return value === undefined ? match : String(value);
  });
}

/** Keys present in English but not yet translated into `locale`. */
export function missingKeys(locale: Locale): string[] {
  const catalogue = CATALOGUES[locale];
  return Object.keys(en).filter((key) => !key.startsWith('$') && catalogue[key] === undefined);
}

/** The font stack to use for the active locale. */
export function fontFamilyForLocale(): string {
  return current === 'ta' ? 'Noto Sans Tamil' : 'Inter';
}
