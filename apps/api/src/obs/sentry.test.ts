import { describe, expect, it } from 'vitest';
import { isSensitiveKey, scrubValue, scrubEvent } from './sentry.js';

describe('Sentry scrubber (S-20)', () => {
  it('classifies sensitive keys', () => {
    expect(isSensitiveKey('password')).toBe(true);
    expect(isSensitiveKey('otp')).toBe(true);
    expect(isSensitiveKey('authorization')).toBe(true);
    expect(isSensitiveKey('aadhaar')).toBe(true);
    expect(isSensitiveKey('amount')).toBe(true);
    expect(isSensitiveKey('balance')).toBe(true);
    expect(isSensitiveKey('displayName')).toBe(false);
  });

  it('redacts token, OTP, Aadhaar and money values recursively', () => {
    const scrubbed = scrubValue({
      token: 'eyJhbGciOiJIUzI1NiJ9.some.token',
      otp: '123456',
      authorization: 'Bearer abc',
      aadhaar: '123456789012',
      profile: { name: 'Murugan', mobile: '+919000000001' },
      wallet: { balance: '₹412.50', amount: '10000.00' },
      benign: true,
    });

    expect(scrubbed).toEqual({
      token: '[scrubbed]',
      otp: '[scrubbed]',
      authorization: '[scrubbed]',
      aadhaar: '[scrubbed]',
      profile: { name: 'Murugan', mobile: '+919000000001' },
      wallet: { balance: '[scrubbed]', amount: '[scrubbed]' },
      benign: true,
    });
  });

  it('never ships request bodies and scrubs headers', () => {
    const event = {
      request: {
        url: '/v1/auth/login',
        method: 'POST',
        data: { password: 'secret', otp: '123456' },
        headers: { authorization: 'Bearer x', 'content-type': 'application/json' },
      },
      extra: { body: { token: 'abc' } },
    };

    const clean = scrubEvent(event as never);

    expect(clean.request?.data).toBe('[scrubbed]');
    expect(clean.request?.headers).toEqual({
      authorization: '[scrubbed]',
      'content-type': 'application/json',
    });
    expect(clean.extra).toEqual({ body: { token: '[scrubbed]' } });
  });
});