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

describe('Workspace Boundary & Component Architecture Guards (S-47)', () => {
  const rootDir = path.resolve(__dirname, '../../../../');
  const customerSrc = path.resolve(rootDir, 'apps/customer-mobile/src');
  const farmerSrc = path.resolve(rootDir, 'apps/farmer-mobile/src');
  const customerComponents = path.resolve(customerSrc, 'components');
  const farmerComponents = path.resolve(farmerSrc, 'components');

  it('Guard: apps/customer-mobile must not contain duplicate or forked components in src/components', () => {
    // Both apps must consume components exclusively from @tohfa/mobile-ui
    const exists = fs.existsSync(customerComponents);
    if (exists) {
      const files = fs.readdirSync(customerComponents).filter((f) => !f.startsWith('.'));
      expect(files, 'Expected apps/customer-mobile/src/components to be empty or non-existent').toEqual([]);
    } else {
      expect(exists).toBe(false);
    }
  });

  it('Guard: apps/farmer-mobile must not contain components in src/components', () => {
    // Verified that apps/farmer-mobile/src/components is deleted
    const exists = fs.existsSync(farmerComponents);
    if (exists) {
      const files = fs.readdirSync(farmerComponents).filter((f) => !f.startsWith('.'));
      expect(files, 'Expected apps/farmer-mobile/src/components to be deleted').toEqual([]);
    } else {
      expect(exists).toBe(false);
    }
  });

  it('Guard: zero cross-app src imports between farmer-mobile and customer-mobile', () => {
    const customerFiles = findFiles(customerSrc, ['.ts', '.tsx', '.js', '.jsx']);
    const farmerFiles = findFiles(farmerSrc, ['.ts', '.tsx', '.js', '.jsx']);

    const violations: Array<{ file: string; line: string }> = [];

    const importFarmerRegex = /from\s+['"][^'"]*farmer-mobile/;
    const importCustomerRegex = /from\s+['"][^'"]*customer-mobile/;

    // Check customer-mobile files do not import from farmer-mobile
    for (const file of customerFiles) {
      if (file.endsWith('.test.ts') || file.endsWith('.test.tsx')) continue;
      const content = fs.readFileSync(file, 'utf8');
      const lines = content.split('\n');
      for (const line of lines) {
        if (importFarmerRegex.test(line)) {
          violations.push({ file, line });
        }
      }
    }

    // Check farmer-mobile files do not import from customer-mobile
    for (const file of farmerFiles) {
      if (file.endsWith('.test.ts') || file.endsWith('.test.tsx')) continue;
      const content = fs.readFileSync(file, 'utf8');
      const lines = content.split('\n');
      for (const line of lines) {
        if (importCustomerRegex.test(line)) {
          violations.push({ file, line });
        }
      }
    }

    expect(
      violations,
      `Cross-app src imports detected:\n${violations.map((v) => `${v.file}: ${v.line}`).join('\n')}`,
    ).toEqual([]);
  });

  it('Guard: shared components are provided by @tohfa/mobile-ui package', () => {
    const mobileUiSrc = path.resolve(rootDir, 'packages/mobile-ui/src');
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
});
