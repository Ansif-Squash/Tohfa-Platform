/**
 * Shell string catalogue.
 *
 * Narrow and self-contained on purpose. It covers exactly the shell-owned
 * screens (splash, login, OTP, role select) and nothing else, so that root
 * CLAUDE.md §2.7 — no user-facing English inside a component — holds for
 * src/shell without waiting on the wider i18n workstream.
 *
 * Scope boundaries, both deliberate:
 *  - It does NOT import or wire into any role's catalogue. src/shell ships in
 *    all three binaries and must never reach into src/roles (see
 *    src/tests/cross_role_import_guard.test.ts).
 *  - It does NOT attempt the merged multi-locale runtime. That is a separate
 *    workstream; this file is shaped after src/roles/farmer/i18n/index.ts (flat
 *    catalogue, `t(key)` lookup, keys as a derived union) so it can be absorbed
 *    into that runtime later without call sites changing.
 *
 * English only for now. Every key is prefixed `shell.` so that when the
 * catalogues do merge into one key space, these cannot collide with a role's.
 *
 * `ShellStringKey` is derived from the catalogue rather than declared, so a
 * typo at a call site is a compile error rather than a string rendered raw.
 */

const CATALOG = {
  'shell.splash.loading': 'Loading…',

  'shell.login.title': 'Sign in',
  'shell.login.mobileLabel': 'Mobile number',
  'shell.login.passwordLabel': 'Password',
  'shell.login.submit': 'Sign in',
  'shell.login.useOtp': 'Use OTP instead',
  'shell.login.usePassword': 'Use password instead',

  'shell.otp.title': 'Sign in with OTP',
  'shell.otp.codeLabel': 'Verification code',
  'shell.otp.sendCode': 'Send code',
  'shell.otp.verify': 'Verify',

  'shell.roleSelect.title': 'Choose a role',
  'shell.roleSelect.instruction': 'This account holds more than one role. Choose how to sign in.',

  'shell.action.signOut': 'Sign out',

  'shell.error.noAdminRole': 'This account has no admin role.',
  'shell.error.requestFailed': 'Something went wrong. Please try again.',
  'shell.error.noAccount': 'That number has no account yet. Please register first.',
} as const;

export type ShellStringKey = keyof typeof CATALOG;

/**
 * Translate a shell key.
 *
 * No `params` interpolation argument, unlike the farmer catalogue's `t()`: no
 * shell string carries a `{{placeholder}}`, and adding an optional second
 * parameter later is a non-breaking change. Total lookup, so no fallback branch
 * is reachable — `ShellStringKey` guarantees the key exists.
 */
export function t(key: ShellStringKey): string {
  return CATALOG[key];
}
