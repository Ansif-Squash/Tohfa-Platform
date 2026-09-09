import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import '../polyfills';
import { formatSafeCurrency, formatSafeDate } from '../polyfills';

describe('User Story 51 (S-51): Farmer Mobile Baselines & Device Matrix', () => {
  it('verifies Android build config matches baseline Android 8.0 (API 26)', () => {
    const buildGradlePath = path.resolve(__dirname, '../../android/build.gradle');
    const appBuildGradlePath = path.resolve(__dirname, '../../android/app/build.gradle');
    const gradlePropsPath = path.resolve(__dirname, '../../android/gradle.properties');

    expect(fs.existsSync(buildGradlePath)).toBe(true);
    expect(fs.existsSync(appBuildGradlePath)).toBe(true);
    expect(fs.existsSync(gradlePropsPath)).toBe(true);

    const buildGradle = fs.readFileSync(buildGradlePath, 'utf8');
    const appBuildGradle = fs.readFileSync(appBuildGradlePath, 'utf8');
    const gradleProps = fs.readFileSync(gradlePropsPath, 'utf8');

    expect(buildGradle).toMatch(/minSdkVersion\s*=\s*26/);
    expect(appBuildGradle).toMatch(/enableHermes:\s*true/);
    expect(gradleProps).toMatch(/hermesEnabled=true/);
  });

  it('verifies iOS Podfile matches baseline iOS 13.0 with Hermes enabled', () => {
    const podfilePath = path.resolve(__dirname, '../../ios/Podfile');
    expect(fs.existsSync(podfilePath)).toBe(true);

    const podfile = fs.readFileSync(podfilePath, 'utf8');
    expect(podfile).toMatch(/platform\s*:ios,\s*['"]13\.0['"]/);
    expect(podfile).toMatch(/:hermes_enabled\s*=>\s*true/);
  });

  it('validates runtime polyfills for legacy engines (API 26 / iOS 13)', () => {
    // 1. Array.prototype.at
    const arr = [10, 20, 30];
    expect(arr.at(-1)).toBe(30);
    expect(arr.at(0)).toBe(10);
    expect(arr.at(10)).toBeUndefined();

    // 2. String.prototype.at
    const str = 'TOHFA';
    expect(str.at(-1)).toBe('A');
    expect(str.at(0)).toBe('T');

    // 3. Object.hasOwn
    const obj = { key: 'val' };
    expect(Object.hasOwn(obj, 'key')).toBe(true);
    expect(Object.hasOwn(obj, 'nonexistent')).toBe(false);

    // 4. structuredClone
    const original = { id: 1, nested: { value: 'farm' } };
    const cloned = structuredClone(original);
    expect(cloned).toEqual(original);
    expect(cloned).not.toBe(original);
    expect(cloned.nested).not.toBe(original.nested);

    // 5. formatSafeCurrency
    expect(formatSafeCurrency('1500')).toContain('1,500');
    expect(formatSafeCurrency('0')).toContain('0');

    // 6. formatSafeDate
    const dateFormatted = formatSafeDate('2026-09-09T10:00:00Z');
    expect(dateFormatted).toBeTruthy();
  });
});
