/**
 * Runtime polyfills for Android 8.0 (API 26) / iOS 13 (Hermes JS engine).
 * Provides missing ES2021/ES2022 and platform globals with minimal footprint.
 */

// 1. Array.prototype.at (ES2022)
if (!Array.prototype.at) {
  Array.prototype.at = function <T>(this: T[], index: number): T | undefined {
    const k = Math.trunc(index) || 0;
    const len = this.length;
    const relativeIndex = k < 0 ? len + k : k;
    return relativeIndex < 0 || relativeIndex >= len ? undefined : this[relativeIndex];
  };
}

// 2. String.prototype.at (ES2022)
if (!String.prototype.at) {
  String.prototype.at = function (this: string, index: number): string | undefined {
    const k = Math.trunc(index) || 0;
    const len = this.length;
    const relativeIndex = k < 0 ? len + k : k;
    return relativeIndex < 0 || relativeIndex >= len ? undefined : this.charAt(relativeIndex);
  };
}

// 3. Object.hasOwn (ES2022)
if (typeof Object.hasOwn !== 'function') {
  Object.hasOwn = function (obj: object, prop: PropertyKey): boolean {
    return Object.prototype.hasOwnProperty.call(obj, prop);
  };
}

// 4. structuredClone (HTML Living Standard / Node 17+)
if (typeof globalThis.structuredClone !== 'function') {
  globalThis.structuredClone = function <T>(obj: T): T {
    if (obj === undefined) return undefined as any;
    return JSON.parse(JSON.stringify(obj));
  };
}

// 5. Safe Intl currency & number formatter fallback
export function formatSafeCurrency(amount: string | number, currency = 'INR'): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(num)) return '₹0.00';
  try {
    if (typeof Intl !== 'undefined' && Intl.NumberFormat) {
      return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency,
        maximumFractionDigits: 2,
      }).format(num);
    }
  } catch {
    // Fallback on legacy engines without Intl
  }
  return `₹${num.toFixed(2)}`;
}

// 6. Safe date formatter fallback
export function formatSafeDate(date: string | Date | number, locale = 'en-IN'): string {
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  try {
    if (typeof Intl !== 'undefined' && Intl.DateTimeFormat) {
      return new Intl.DateTimeFormat(locale, {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }).format(d);
    }
  } catch {
    // Fallback
  }
  return d.toISOString().split('T')[0] ?? '';
}
