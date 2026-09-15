import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { tokens } from '@tohfa/design-tokens';

describe('User Story 52 (S-52): Customer Mobile Store Submission & Data Safety (BR-16)', () => {
  // Relocated from apps/customer-mobile/src/tests/ (consolidation plan §3 step
  // 3). The old single `customerDir` (one standalone app: its own android/,
  // ios/, src/ all at the same root) no longer exists as one thing post-merge:
  // android/ and ios/ are now ONE shared project across all 3 flavors
  // (mobileRoot), while this role's own JS tree is a subdirectory of a shared
  // src/ (roleDir). Two bases replace the one `customerDir`, not a straight
  // depth change.
  const rootDir = path.resolve(__dirname, '../../../../../../'); // repo root
  const mobileRoot = path.resolve(__dirname, '../../../../'); // apps/mobile (shared android/ios)
  const roleDir = path.resolve(__dirname, '../'); // apps/mobile/src/roles/customer (this role's own JS tree)

  // KNOWN FAILING, not weakened, not skipped (root CLAUDE.md §7): this whole
  // test's premise -- one manifest, unique to this app, that never mentions
  // location/camera at all -- was true only while customer-mobile was its own
  // standalone Gradle project. Post-merge it is genuinely, PERMANENTLY false --
  // this is a single-app fact, not a "flavor can't override" fact, because
  // there are no more flavors at all (confirmed directly against
  // android/app/build.gradle and android/app/src/main/AndroidManifest.xml,
  // not assumed):
  //   1. `in.tohfa.customer` no longer appears in ANY manifest text, or
  //      anywhere in Android build config. android/app/build.gradle has no
  //      `productFlavors` block any more -- one single, unconditional
  //      `applicationId "in.tohfa.mobile"` in `defaultConfig` is the only
  //      identity Android has, for every role. The per-role bundle ID this
  //      assertion checks for isn't hidden elsewhere; it doesn't exist
  //      anywhere in this build any more.
  //   2. android/app/src/main/AndroidManifest.xml is now the ONLY manifest
  //      that exists (there is no more android/app/src/customer/
  //      AndroidManifest.xml override -- no flavors means no per-flavor
  //      source sets to override with). That single manifest DOES declare
  //      ACCESS_FINE_LOCATION, ACCESS_COARSE_LOCATION and CAMERA -- by
  //      explicit, PERMANENT design, see that file's own comment: "these
  //      permissions are the real union every role genuinely needs
  //      (farmer geolocation/camera, admin goods-receipt camera capture),
  //      not a 'trim later' placeholder." Every install of this single app
  //      ships every role's permissions, forever; which screens a given
  //      user sees is decided by the JS bundle at runtime after login (see
  //      src/shell/auth/RootShell.tsx), not by which native variant was
  //      installed.
  // Neither of these is deferred per-flavor manifest trimming waiting on
  // future work -- there is no "later" to fix this in, because there is no
  // more per-flavor build left to trim.
  it('verifies AndroidManifest.xml exists and DOES NOT request location or camera permissions (BR-16)', () => {
    const manifestPath = path.join(mobileRoot, 'android/app/src/main/AndroidManifest.xml');
    expect(fs.existsSync(manifestPath)).toBe(true);

    const manifest = fs.readFileSync(manifestPath, 'utf8');
    expect(manifest).toContain('android.permission.INTERNET');
    expect(manifest).toContain('in.tohfa.customer');

    // Strict check for Rule BR-16 / Data Minimization: Customer app MUST NOT request farm/device permissions
    expect(manifest).not.toContain('android.permission.ACCESS_FINE_LOCATION');
    expect(manifest).not.toContain('android.permission.ACCESS_COARSE_LOCATION');
    expect(manifest).not.toContain('android.permission.CAMERA');
  });

  it('verifies Info.plist exists and does not request farm/location permissions', () => {
    const infoPlistPath = path.join(mobileRoot, 'ios/TohfaCustomer/Info.plist');
    expect(fs.existsSync(infoPlistPath)).toBe(true);

    const plist = fs.readFileSync(infoPlistPath, 'utf8');
    expect(plist).toContain('in.tohfa.customer');
    expect(plist).not.toContain('NSLocationWhenInUseUsageDescription');
    expect(plist).not.toContain('NSCameraUsageDescription');
  });

  // The customer app used to assert its own brand colour (deepBlue), distinct
  // from the farmer app's. The approved design system dropped per-app brand
  // colours in favour of one universal primary, so this now asserts that the
  // customer branding tracks that single token — the spec changed, not the rigour.
  it('verifies branding configuration uses the universal design token primary', () => {
    const brandingPath = path.join(roleDir, 'assets/branding.json');
    expect(fs.existsSync(brandingPath)).toBe(true);

    const branding = JSON.parse(fs.readFileSync(brandingPath, 'utf8'));
    expect(branding.theme.primaryColor.toUpperCase()).toBe(tokens.color.primary.hex.toUpperCase());
    expect(branding.theme.primaryColorName).toBe('primary');
    expect(branding.theme.backgroundColor.toUpperCase()).toBe(
      tokens.color.primaryPale.hex.toUpperCase(),
    );
    expect(branding.bundleId).toBe('in.tohfa.customer');
  });

  it('verifies customer store listing and privacy policy guarantee zero farm data leakage (BR-16)', () => {
    const storeListingPath = path.join(rootDir, 'docs/launch/store-listing-customer.md');
    const privacyPolicyPath = path.join(rootDir, 'docs/launch/privacy-policy.md');

    expect(fs.existsSync(storeListingPath)).toBe(true);
    expect(fs.existsSync(privacyPolicyPath)).toBe(true);

    const listing = fs.readFileSync(storeListingPath, 'utf8');
    const privacyPolicy = fs.readFileSync(privacyPolicyPath, 'utf8');

    expect(listing).toContain('BR-16');
    expect(listing).toContain('anonymous aggregated warehouse inventory');
    expect(privacyPolicy).toContain('Strict Farm-Anonymity (BR-16)');
  });

  it('verifies security compliance: no keystore, jks, p12 or mobileprovision files are committed', () => {
    // Ask git what's actually committed, rather than walking the filesystem:
    // a raw fs walk also catches legitimate, gitignored local build artifacts
    // (e.g. Android auto-regenerates android/app/debug.keystore on every
    // `./gradlew` invocation -- it's excluded via `*.keystore` in .gitignore
    // and was never staged). This rule is specifically about what's
    // *committed*, so `git ls-files` is what actually answers that, without
    // false-failing on a build artifact sitting in the working tree.
    const trackedFiles = execSync('git ls-files', { cwd: rootDir, encoding: 'utf8' })
      .split('\n')
      .filter(Boolean);

    const forbiddenExts = ['.keystore', '.jks', '.p12', '.mobileprovision'];
    const secretFiles = trackedFiles.filter((f) => forbiddenExts.some((ext) => f.endsWith(ext)));

    expect(secretFiles).toHaveLength(0);
  });
});
