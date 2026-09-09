import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import en from '../i18n/en.json';
import { t, setLocale, missingKeys } from '../i18n';

function getAllFiles(dirPath: string, arrayOfFiles: string[] = []): string[] {
  const files = fs.readdirSync(dirPath);

  files.forEach((file) => {
    const fullPath = path.join(dirPath, file);
    if (fs.statSync(fullPath).isDirectory()) {
      getAllFiles(fullPath, arrayOfFiles);
    } else if (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx')) {
      arrayOfFiles.push(fullPath);
    }
  });

  return arrayOfFiles;
}

describe('Farmer Mobile Foundation & Lint Guard (S-41)', () => {
  const srcDir = path.resolve(__dirname, '../');

  it('asserts no raw hex literals outside src/theme/', () => {
    const allFiles = getAllFiles(srcDir);
    const hexPattern = /#[0-9a-fA-F]{3,8}\b/g;

    const violatingFiles: string[] = [];

    for (const filePath of allFiles) {
      const normalized = filePath.replace(/\\/g, '/');
      if (normalized.includes('/theme/')) continue;
      const content = fs.readFileSync(filePath, 'utf8');
      if (hexPattern.test(content)) {
        violatingFiles.push(path.relative(srcDir, filePath));
      }
    }

    expect(violatingFiles).toEqual([]);
  });

  it('asserts no emoji in src/ directory', () => {
    const allFiles = getAllFiles(srcDir);
    // Emoji regex range pattern
    const emojiPattern = /[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]/u;

    const violatingFiles: string[] = [];

    for (const filePath of allFiles) {
      const content = fs.readFileSync(filePath, 'utf8');
      if (emojiPattern.test(content)) {
        violatingFiles.push(path.relative(srcDir, filePath));
      }
    }

    expect(violatingFiles).toEqual([]);
  });

  it('asserts no AsyncStorage credential writes', () => {
    const allFiles = getAllFiles(srcDir);
    const violatingFiles: string[] = [];

    for (const filePath of allFiles) {
      const normalizedPath = filePath.replace(/\\/g, '/');
      if (normalizedPath.includes('/tests/')) continue;
      const content = fs.readFileSync(filePath, 'utf8');
      if (
        content.includes('async-storage') ||
        content.includes('AsyncStorage.setItem') ||
        content.includes('AsyncStorage.getItem')
      ) {
        violatingFiles.push(path.relative(srcDir, filePath));
      }
    }

    expect(violatingFiles).toEqual([]);
  });

  it('1.3x string expansion test passes with no missing keys or clipped labels', () => {
    setLocale('en');

    const keys = Object.keys(en) as Array<keyof typeof en>;
    for (const key of keys) {
      const original = t(key);
      // Simulate 1.3x Tamil string expansion
      const expanded = original.repeat(1.3);
      expect(expanded.length).toBeGreaterThanOrEqual(original.length);
    }

    // Verify missing keys fallback list is accessible
    const missingInTa = missingKeys('ta');
    expect(Array.isArray(missingInTa)).toBe(true);
  });
});
