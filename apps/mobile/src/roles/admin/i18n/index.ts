/**
 * Minimal, role-scoped i18n catalog for the admin flavor's placeholder screen.
 *
 * This is deliberately NOT the merged shell i18n runtime described in the
 * consolidation plan §5 (src/shell/i18n/) — that runtime (namespaced
 * "shell", "farmer", "customer", "admin" catalogs, locale switching, the
 * ta -> en fallback chain) lands when real screens migrate in Steps 3/4.
 * Per root CLAUDE.md §2.7, a placeholder screen still may not hard-code a
 * user-facing string, so it gets this trivial stand-in instead of a literal.
 */
import en from './en.json';

export type TranslationKey = keyof typeof en;

export function t(key: TranslationKey): string {
  return en[key];
}
