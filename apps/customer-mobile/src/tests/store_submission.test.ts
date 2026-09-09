import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { tokens } from '@tohfa/design-tokens';

describe('User Story 52 (S-52): Customer Mobile Store Submission & Data Safety (BR-16)', () => {
  const rootDir = path.resolve(__dirname, '../../../../');
  const customerDir = path.resolve(__dirname, '../../');

  it('verifies AndroidManifest.xml exists and DOES NOT request location or camera permissions (BR-16)', () => {
    const manifestPath = path.join(customerDir, 'android/app/src/main/AndroidManifest.xml');
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
    const infoPlistPath = path.join(customerDir, 'ios/TohfaCustomer/Info.plist');
    expect(fs.existsSync(infoPlistPath)).toBe(true);

    const plist = fs.readFileSync(infoPlistPath, 'utf8');
    expect(plist).toContain('in.tohfa.customer');
    expect(plist).not.toContain('NSLocationWhenInUseUsageDescription');
    expect(plist).not.toContain('NSCameraUsageDescription');
  });

  it('verifies branding configuration uses exact design token color (deepBlue)', () => {
    const brandingPath = path.join(customerDir, 'src/assets/branding.json');
    expect(fs.existsSync(brandingPath)).toBe(true);

    const branding = JSON.parse(fs.readFileSync(brandingPath, 'utf8'));
    expect(branding.theme.primaryColor.toUpperCase()).toBe(tokens.color.deepBlue.hex.toUpperCase());
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
    const walkFiles = (dir: string, fileList: string[] = []): string[] => {
      const items = fs.readdirSync(dir);
      for (const item of items) {
        if (item === 'node_modules' || item === '.git' || item === 'dist' || item === '.system_generated') continue;
        const fullPath = path.join(dir, item);
        if (fs.statSync(fullPath).isDirectory()) {
          walkFiles(fullPath, fileList);
        } else {
          fileList.push(item);
        }
      }
      return fileList;
    };

    const allFiles = walkFiles(rootDir);
    const forbiddenExts = ['.keystore', '.jks', '.p12', '.mobileprovision'];
    const secretFiles = allFiles.filter((f) => forbiddenExts.some((ext) => f.endsWith(ext)));

    expect(secretFiles).toHaveLength(0);
  });
});
