/**
 * Customer's i18n entry point: customer's own namespaced strings plus the
 * shared `error.<ErrorCode>` bucket, wired into the shared engine in
 * `./runtime.ts`.
 *
 * Import this (not `./runtime` directly) from customer screens. See
 * `./runtime.ts` for why the catalogue data is split per role rather than
 * merged into one shared JSON module -- importing this file, and not
 * `./farmer.ts`, is what keeps farmer's strings out of the customer bundle.
 */
import errorsEn from './errors.en.json';
import errorsTa from './errors.ta.json';
import customerEn from './customer.en.json';
import customerTa from './customer.ta.json';
import { createI18n, LOCALES, type Locale } from './runtime';

export const en = { ...errorsEn, ...customerEn };
const ta: Record<string, string> = { ...errorsTa, ...customerTa };

export type TranslationKey = keyof typeof en;

export { LOCALES };
export type { Locale };

const instance = createI18n<TranslationKey>({ en, ta });

export const setLocale = instance.setLocale;
export const getLocale = instance.getLocale;
export const t = instance.t;
export const missingKeys = instance.missingKeys;
export const fontFamilyForLocale = instance.fontFamilyForLocale;
