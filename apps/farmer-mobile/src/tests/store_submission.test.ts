import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { tokens } from '@tohfa/design-tokens';

describe('User Story 52 (S-52): Farmer Mobile Store Submission & Data Safety', () => {
  const rootDir = path.resolve(__dirname, '../../../../');
  const farmerDir = path.resolve(__dirname, '../../');

  it('verifies AndroidManifest.xml exists and declares required farmer permissions', () => {
    const manifestPath = path.join(farmerDir, 'android/app/src/main/AndroidManifest.xml');
    expect(fs.existsSync(manifestPath)).toBe(true);

    const manifest = fs.readFileSync(manifestPath, 'utf8');
    expect(manifest).toContain('android.permission.INTERNET');
    expect(manifest).toContain('android.permission.ACCESS_FINE_LOCATION');
    expect(manifest).toContain('android.permission.CAMERA');
    expect(manifest).toContain('in.tohfa.farmer');
  });

  it('verifies Info.plist exists and contains usage descriptions for iOS review', () => {
    const infoPlistPath = path.join(farmerDir, 'ios/TohfaFarmer/Info.plist');
    expect(fs.existsSync(infoPlistPath)).toBe(true);

    const plist = fs.readFileSync(infoPlistPath, 'utf8');
    expect(plist).toContain('NSLocationWhenInUseUsageDescription');
    expect(plist).toContain('NSCameraUsageDescription');
    expect(plist).toContain('NSPhotoLibraryUsageDescription');
    expect(plist).toContain('in.tohfa.farmer');
  });

  it('verifies branding configuration uses exact design token color (tohfaTeal)', () => {
    const brandingPath = path.join(farmerDir, 'src/assets/branding.json');
    expect(fs.existsSync(brandingPath)).toBe(true);

    const branding = JSON.parse(fs.readFileSync(brandingPath, 'utf8'));
    expect(branding.theme.primaryColor.toUpperCase()).toBe(tokens.color.tohfaTeal.hex.toUpperCase());
    expect(branding.bundleId).toBe('in.tohfa.farmer');
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
