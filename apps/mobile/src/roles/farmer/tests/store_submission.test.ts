import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { tokens } from '@tohfa/design-tokens';

describe('User Story 52 (S-52): Farmer Mobile Store Submission & Data Safety', () => {
  // Post-merge (see apps/mobile/src/roles/customer/tests/store_submission.test.ts
  // for the full rationale): android/ and ios/ are now ONE shared project
  // across all 3 flavors (mobileRoot), while this role's own JS tree is a
  // subdirectory of a shared src/ (roleDir). Two bases replace the old single
  // `farmerDir` (one standalone app: its own android/, ios/, src/ all at the
  // same root) -- not a straight depth change.
  const rootDir = path.resolve(__dirname, '../../../../../../'); // repo root
  const mobileRoot = path.resolve(__dirname, '../../../../'); // apps/mobile (shared android/ios)
  const roleDir = path.resolve(__dirname, '../'); // apps/mobile/src/roles/farmer (this role's own JS tree)

  it('verifies AndroidManifest.xml exists and declares required farmer permissions', () => {
    const manifestPath = path.join(mobileRoot, 'android/app/src/main/AndroidManifest.xml');
    expect(fs.existsSync(manifestPath)).toBe(true);

    const manifest = fs.readFileSync(manifestPath, 'utf8');
    expect(manifest).toContain('android.permission.INTERNET');
    expect(manifest).toContain('android.permission.ACCESS_FINE_LOCATION');
    expect(manifest).toContain('android.permission.CAMERA');
  });

  it('verifies the shared bundle id in build.gradle (single app post-merge, AGP 8: package no longer in manifest)', () => {
    const gradlePath = path.join(mobileRoot, 'android/app/build.gradle');
    const gradle = fs.readFileSync(gradlePath, 'utf8');
    // Post-merge there is ONE app for every role -- one shared namespace and
    // applicationId, no product flavors (see build.gradle's own comment: "one
    // namespace, one applicationId, no product flavors"). The old
    // farmer-only `in.tohfa.farmer` applicationId does not exist anywhere as
    // text any more; that is an intentional, permanent outcome of the merge
    // (not a deferred gap), so the equivalent current fact to assert is the
    // shared id.
    expect(gradle).toContain('namespace "in.tohfa.mobile"');
    expect(gradle).toContain('applicationId "in.tohfa.mobile"');
  });

  it('verifies Info.plist exists and contains usage descriptions for iOS review', () => {
    const infoPlistPath = path.join(mobileRoot, 'ios/TohfaMobile/Info.plist');
    expect(fs.existsSync(infoPlistPath)).toBe(true);

    const plist = fs.readFileSync(infoPlistPath, 'utf8');
    expect(plist).toContain('NSLocationWhenInUseUsageDescription');
    expect(plist).toContain('NSCameraUsageDescription');
    expect(plist).toContain('NSPhotoLibraryUsageDescription');
    // Post-merge the iOS project was renamed TohfaFarmer -> TohfaMobile and
    // now carries the same single bundle id as Android (in.tohfa.mobile), for
    // the same reason the Android assertion above changed: one app, one
    // identifier, for every role.
    expect(plist).toContain('in.tohfa.mobile');
  });

  it('verifies branding configuration uses exact design token color (tohfaTeal)', () => {
    const brandingPath = path.join(roleDir, 'assets/branding.json');
    expect(fs.existsSync(brandingPath)).toBe(true);

    const branding = JSON.parse(fs.readFileSync(brandingPath, 'utf8'));
    expect(branding.theme.primaryColor.toUpperCase()).toBe(tokens.color.tohfaTeal.hex.toUpperCase());
    expect(branding.bundleId).toBe('in.tohfa.mobile');
  });

  it('verifies launch documentation exists and details Aadhaar & location disclosures', () => {
    const storeListingPath = path.join(rootDir, 'docs/launch/store-listing-farmer.md');
    const privacyPolicyPath = path.join(rootDir, 'docs/launch/privacy-policy.md');
    const releaseChecklistPath = path.join(rootDir, 'docs/launch/release-checklist.md');

    expect(fs.existsSync(storeListingPath)).toBe(true);
    expect(fs.existsSync(privacyPolicyPath)).toBe(true);
    expect(fs.existsSync(releaseChecklistPath)).toBe(true);

    const privacyPolicy = fs.readFileSync(privacyPolicyPath, 'utf8');
    expect(privacyPolicy).toContain('BR-33');
    expect(privacyPolicy).toContain('Aadhaar');
    expect(privacyPolicy).toContain('Precise Location (GPS)');
  });
});
