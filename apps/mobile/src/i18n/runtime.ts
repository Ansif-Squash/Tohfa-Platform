/**
 * Shared i18n engine, parameterised per role.
 *
 * This is the ONE merged i18n runtime for farmer and customer (replacing what
 * used to be two byte-identical copies of this logic at
 * `src/roles/farmer/i18n/index.ts` and `src/roles/customer/i18n/index.ts`).
 * Deliberately dependency-free, exactly as both originals were: the apps
 * target low-end Android and we are not paying 40kB for `{{name}}`
 * interpolation. Swap in i18next only if a story actually needs plurals or
 * gendered forms.
 *
 * ## Why the *logic* is merged here but the *data* is not
 * `farmer.ts` and `customer.ts` each call `createI18n()` with their own
 * catalogue (their own namespaced strings plus the shared `error.*` bucket).
 * The catalogue data is deliberately kept in separate per-role JSON modules
 * (`farmer.en.json`/`customer.en.json`, not one shared flat file) because
 * Metro bundles the transitive closure of what an entry file imports, with no
 * per-bundle exclusion config (see root plan §1/§4): if both roles imported
 * one combined JSON object, Metro would embed the *entire* merged catalogue
 * -- both roles' strings -- into *both* the farmer and customer binaries.
 * Confirmed directly: an earlier version of this file did exactly that, and
 * `strings` on the built `index.android.bundle` showed customer's copy
 * inside the farmer bundle and vice versa. Splitting the JSON per role means
 * each entry file's import graph only pulls in its own strings, so bundle
 * scoping (the actual BR-16-adjacent isolation property this whole
 * three-flavour design exists to preserve) holds for i18n content too.
 *
 * Tamil is a FIRST-CLASS language here, not a translation layer. A missing
 * `ta` key falls back to English so the screen still works, and
 * `missingKeys()` exists so a test can assert the gap is shrinking.
 *
 * ## Why this lives at `src/i18n/`, not `src/shell/i18n/`
 * `src/shell/i18n/index.ts` is a separate, already-finished catalogue that
 * covers only the shell's own pre-login screens (splash/login/OTP/role
 * select) and ships in all three binaries unconditionally. Farmer's and
 * customer's catalogues are role-specific content -- if they lived under
 * `src/shell/`, the admin binary would ship strings it never uses, and
 * `src/shell/**` would need to import role catalogues to build the merge,
 * which `src/tests/cross_role_import_guard.test.ts` forbids outright (shell
 * must never import from roles). Living at `src/i18n/` -- a sibling of
 * `shell/` and `roles/`, not inside either -- means only whichever entry
 * files actually import `farmer.ts`/`customer.ts` pull those strings into
 * their bundle; the admin flavor's placeholder imports neither and stays
 * unaffected.
 */

export const LOCALES = ['en', 'ta'] as const;
export type Locale = (typeof LOCALES)[number];

export interface I18nInstance<K extends string> {
  setLocale: (locale: Locale) => void;
  getLocale: () => Locale;
  /** Translate. `params` values replace `{{name}}` placeholders. */
  t: (key: K, params?: Record<string, string | number>) => string;
  /** Keys present in English but not yet translated into `locale`. */
  missingKeys: (locale: Locale) => string[];
  /** The font stack to use for the active locale. */
  fontFamilyForLocale: () => string;
}

/**
 * Build a self-contained i18n instance from a role's own `{ en, ta }`
 * catalogues (each already merged with the shared `error.*` bucket by the
 * caller -- see `farmer.ts`/`customer.ts`). Each call gets its own private
 * `current` locale, so farmer's and customer's instances (when both are
 * reachable, e.g. in a test) never share locale state.
 */
export function createI18n<K extends string>(catalogues: {
  en: Record<K, string>;
  ta: Record<string, string>;
}): I18nInstance<K> {
  const en = catalogues.en as Record<string, string>;
  const ta = catalogues.ta;
  const byLocale: Record<Locale, Record<string, string>> = { en, ta };

  let current: Locale = 'en';

  function setLocale(locale: Locale): void {
    current = locale;
  }

  function getLocale(): Locale {
    return current;
  }

  function t(key: K, params: Record<string, string | number> = {}): string {
    const catalogue = byLocale[current];
    const fallback = byLocale.en;
    const template = catalogue[key] ?? fallback[key] ?? key;

    return template.replace(/\{\{(\w+)\}\}/g, (match, name: string) => {
      const value = params[name];
      return value === undefined ? match : String(value);
    });
  }

  function missingKeys(locale: Locale): string[] {
    const catalogue = byLocale[locale];
    return Object.keys(en).filter((key) => !key.startsWith('$') && catalogue[key] === undefined);
  }

  function fontFamilyForLocale(): string {
    return current === 'ta' ? 'Noto Sans Tamil' : 'Inter';
  }

  return { setLocale, getLocale, t, missingKeys, fontFamilyForLocale };
}
