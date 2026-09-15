/**
 * Cross-role import guard for apps/mobile.
 *
 * REVISED for the single-app architecture (2026-09): this app used to ship
 * as 3 separate binaries (index.farmer.js / index.customer.js / index.admin.js,
 * one Metro bundle each), and this test enforced ZERO imports between role
 * directories because Metro bundling has no way to exclude a folder from one
 * entry point -- the import graph WAS the BR-16 isolation mechanism.
 *
 * That architecture is gone. There is one binary (apps/mobile/index.js) for
 * every role now, matching how the backend has always worked (one
 * /auth/login, one JWT, role-based permissions via docs/rbac.json). BR-16
 * farm-anonymity is enforced the way root CLAUDE.md §2.1/§2.5 always said it
 * must be: server-side, by the catalog serializer's allow-list -- never by
 * which JS happens to be co-located on a device. A customer's phone having
 * farmer screen CODE sitting unreached in the bundle is not a data leak; the
 * server never sending farm data to a customer-scoped token is what prevents
 * one.
 *
 * What this test still usefully guards: role-to-role imports should stay
 * confined to the one designated bridge point (src/roles/farmer/App.tsx,
 * which routes to src/roles/customer/CustomerMainApp.tsx after login resolves
 * the account's role) rather than screens/api files reaching into another
 * role's internals ad hoc -- that keeps each role's code a coherent unit
 * even though they now ship in one bundle.
 */
import { describe, expect, it } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';

function findFiles(dir: string, extensions: string[]): string[] {
  let results: string[] = [];
  if (!fs.existsSync(dir)) return results;

  const list = fs.readdirSync(dir);
  for (const file of list) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat && stat.isDirectory()) {
      results = results.concat(findFiles(filePath, extensions));
    } else {
      if (extensions.some((ext) => file.endsWith(ext))) {
        results.push(filePath);
      }
    }
  }
  return results;
}

/** Captures the specifier text out of `from '...'` and `require('...')`. */
function extractImportSpecifiers(content: string): string[] {
  const specifiers: string[] = [];
  const re = /(?:from\s+|require\()\s*['"]([^'"]+)['"]/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(content)) !== null) {
    const specifier = match[1];
    if (specifier !== undefined) {
      specifiers.push(specifier);
    }
  }
  return specifiers;
}

const ROLES = ['farmer', 'customer', 'admin'] as const;
type Role = (typeof ROLES)[number];

/**
 * True if `specifier`, written inside `fromFile`, resolves into
 * `src/roles/<role>/...` — relative specifiers are resolved against the
 * importing file's directory; anything else (a bare/alias specifier) is
 * matched against a literal `roles/<role>` path segment, so a future path
 * alias (e.g. `@/roles/admin/...`) is caught the same way a relative
 * `../../roles/admin/...` would be.
 */
function resolvesIntoRole(fromFile: string, specifier: string, role: Role): boolean {
  const roleSegmentPosix = `/roles/${role}/`;
  if (specifier.startsWith('.')) {
    const resolved = path.resolve(path.dirname(fromFile), specifier).split(path.sep).join('/');
    return resolved.includes(roleSegmentPosix) || resolved.endsWith(`/roles/${role}`);
  }
  const normalized = specifier.split(path.sep).join('/');
  return normalized.includes(roleSegmentPosix) || normalized.startsWith(`roles/${role}/`);
}

describe('Cross-role import guard (apps/mobile) — BR-16 enforcement mechanism', () => {
  // src/tests/cross_role_import_guard.test.ts -> src/tests -> src -> apps/mobile
  const mobileRoot = path.resolve(__dirname, '../../');
  const srcDir = path.resolve(mobileRoot, 'src');
  const rolesDir = path.resolve(srcDir, 'roles');
  const shellDir = path.resolve(srcDir, 'shell');
  // apps/mobile -> apps -> repo root
  const monorepoRoot = path.resolve(mobileRoot, '../../');

  describe('Guard: no local components/ dir under any role (components come only from @tohfa/mobile-ui)', () => {
    for (const role of ROLES) {
      it(`src/roles/${role}/components must be empty or absent`, () => {
        const dir = path.resolve(rolesDir, role, 'components');
        if (fs.existsSync(dir)) {
          const files = fs.readdirSync(dir).filter((f) => !f.startsWith('.'));
          expect(files, `Expected src/roles/${role}/components to be empty or non-existent`).toEqual([]);
        } else {
          expect(fs.existsSync(dir)).toBe(false);
        }
      });
    }
  });

  // The single explicit bridge point: farmer's top-level router mounts
  // customer's post-login screens once /auth/me resolves the account as a
  // customer (see src/roles/farmer/App.tsx's docblock). This is the ONE
  // sanctioned cross-role import in the whole tree.
  const ALLOWED_BRIDGES: Array<{ file: string; intoRole: Role }> = [
    { file: path.resolve(__dirname, '../roles/farmer/App.tsx'), intoRole: 'customer' },
  ];

  it('Guard: cross-role imports are confined to the designated bridge file(s)', () => {
    const violations: Array<{ file: string; specifier: string; intoRole: Role }> = [];

    for (const ownRole of ROLES) {
      const ownRoleDir = path.resolve(rolesDir, ownRole);
      const files = findFiles(ownRoleDir, ['.ts', '.tsx', '.js', '.jsx']);

      for (const file of files) {
        if (file.endsWith('.test.ts') || file.endsWith('.test.tsx')) continue;
        const content = fs.readFileSync(file, 'utf8');
        const specifiers = extractImportSpecifiers(content);

        for (const specifier of specifiers) {
          for (const otherRole of ROLES) {
            if (otherRole === ownRole) continue; // same-role imports are fine
            if (!resolvesIntoRole(file, specifier, otherRole)) continue;
            const isAllowedBridge = ALLOWED_BRIDGES.some(
              (b) => b.file === file && b.intoRole === otherRole,
            );
            if (!isAllowedBridge) {
              violations.push({ file, specifier, intoRole: otherRole });
            }
          }
        }
      }
    }

    expect(
      violations,
      `Cross-role src imports outside the designated bridge file(s) (${violations.length}):\n` +
        violations.map((v) => `${v.file}: '${v.specifier}' reaches into src/roles/${v.intoRole}`).join('\n'),
    ).toEqual([]);
  });

  it('Guard: src/shell must never import from src/roles (shell stays role-agnostic, ships in all 3 binaries)', () => {
    const violations: Array<{ file: string; specifier: string }> = [];
    const files = findFiles(shellDir, ['.ts', '.tsx', '.js', '.jsx']);

    for (const file of files) {
      if (file.endsWith('.test.ts') || file.endsWith('.test.tsx')) continue;
      const content = fs.readFileSync(file, 'utf8');
      const specifiers = extractImportSpecifiers(content);

      for (const specifier of specifiers) {
        const touchesRoles = specifier.startsWith('.')
          ? path
              .resolve(path.dirname(file), specifier)
              .split(path.sep)
              .join('/')
              .includes('/src/roles/')
          : specifier.split(path.sep).join('/').includes('/roles/') ||
            /^roles\//.test(specifier);

        if (touchesRoles) {
          violations.push({ file, specifier });
        }
      }
    }

    expect(
      violations,
      `src/shell must not import from src/roles:\n${violations.map((v) => `${v.file}: ${v.specifier}`).join('\n')}`,
    ).toEqual([]);
  });

  it('Guard: shared components are provided by @tohfa/mobile-ui package', () => {
    const mobileUiSrc = path.resolve(monorepoRoot, 'packages/mobile-ui/src');
    expect(fs.existsSync(mobileUiSrc)).toBe(true);

    const requiredComponents = [
      'Button.tsx',
      'Card.tsx',
      'Input.tsx',
      'StickyFooter.tsx',
      'Badge.tsx',
      'EmptyState.tsx',
      'ErrorState.tsx',
      'Skeleton.tsx',
      'Icon.tsx',
    ];

    for (const comp of requiredComponents) {
      const compPath = path.join(mobileUiSrc, comp);
      expect(fs.existsSync(compPath), `Missing ${comp} in @tohfa/mobile-ui`).toBe(true);
    }
  });

  // NOTE on the plan §4 item 5 (regex-scan t('farmer.…'|'customer.…'|'admin.…')
  // calls for role-prefix mismatches): still deliberately NOT implemented
  // here. The precondition that used to block it no longer holds -- farmer's
  // and customer's i18n catalogues are now merged into one namespaced union
  // at src/i18n/ (src/roles/<role>/i18n/ no longer exists), with a shared,
  // unprefixed error.<ErrorCode> bucket -- so there IS a shared key space a
  // prefix could mismatch against today. Adding the actual guard is tracked
  // as a follow-up, not bundled into the i18n merge itself.
});
