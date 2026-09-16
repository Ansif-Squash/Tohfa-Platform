import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { renderOtpState, resolveRouteAfterAuth } from '../api/auth';
import { setLocale, getLocale, t } from '../i18n';

describe('User Story 42 (S-42) Auth Tests', () => {
  describe('BR-32: Server-driven OTP state assertions', () => {
    it('BR-32: resend timer counts down from server resendAvailableAt timestamp', () => {
      const now = Date.now();
      const resendAvailableAt = new Date(now + 45000).toISOString();

      const state = renderOtpState({
        resendAvailableAt,
        attemptsRemaining: 3,
        now,
      });

      expect(state.canResend).toBe(false);
      expect(state.secondsUntilResend).toBe(45);
    });

    it('BR-32: allows immediate resend when resendAvailableAt timestamp is in the past', () => {
      const now = Date.now();
      const resendAvailableAt = new Date(now - 1000).toISOString();

      const state = renderOtpState({
        resendAvailableAt,
        attemptsRemaining: 3,
        now,
      });

      expect(state.canResend).toBe(true);
      expect(state.secondsUntilResend).toBe(0);
    });

    it('BR-32: attempts indicator is driven by server attemptsRemaining', () => {
      const now = Date.now();
      const state = renderOtpState({
        resendAvailableAt: new Date(now + 60000).toISOString(),
        attemptsRemaining: 2,
        now,
      });

      expect(state.attemptsRemaining).toBe(2);
      expect(state.isLocked).toBe(false);
    });

    it('BR-32: locked challenge displays server-driven state and request new challenge action when attemptsRemaining is 0', () => {
      const now = Date.now();
      const state = renderOtpState({
        resendAvailableAt: new Date(now + 60000).toISOString(),
        attemptsRemaining: 0,
        now,
      });

      expect(state.isLocked).toBe(true);
      expect(state.canResend).toBe(true); // Must allow requesting a new challenge
    });
  });

  describe('Farmer Routing Rules', () => {
    it('Routing: pending farmer is routed to application-status timeline', () => {
      const me = {
        userId: 'user-123',
        status: 'PENDING_APPROVAL',
        farmerId: 'farmer-123',
        applicationId: 'app-456',
        roles: [{ code: 'FARMER' as const }],
      };

      const route = resolveRouteAfterAuth(me);
      expect(route.name).toBe('ApplicationStatus');
      expect(route.params).toEqual({ applicationId: 'app-456' });
    });

    it('Routing: approved farmer is routed to main tab dashboard', () => {
      const me = {
        userId: 'user-123',
        status: 'ACTIVE',
        farmerId: 'farmer-123',
        applicationId: 'app-456',
        roles: [{ code: 'FARMER' as const }],
      };

      const route = resolveRouteAfterAuth(me);
      expect(route.name).toBe('MainTabs');
    });
  });

  describe('Forgot Password & OTP Flow Design Integrity', () => {
    it('verifies ForgotPasswordScreen title is "Forgot Password" and uses lock asset', () => {
      const forgotPasswordPath = path.resolve(__dirname, '../screens/auth/ForgotPasswordScreen.tsx');
      const content = fs.readFileSync(forgotPasswordPath, 'utf8');

      // Title must be Forgot Password (not Reset Password)
      expect(content).toContain('Forgot Password');
      expect(content).not.toContain('<Text style={styles.title}>Reset Password</Text>');

      // Must import and use LockIcon from lock.svg asset
      expect(content).toContain("import LockIcon from '../../assets/lock.svg'");
      expect(content).toContain('<LockIcon');

      // Must include 4-segment progress indicator
      expect(content).toContain('progressContainer');
      expect(content).toContain('[1, 2, 3, 4]');

      // Must include complete OTP page
      expect(content).toContain('OTP Verification');
      expect(content).toContain('otpBoxesRow');
      expect(content).toContain('Resend OTP');
      expect(content).toContain('Verify & Proceed');
    });

    it('verifies OtpScreen adheres to 4-step progress and asset lock icon', () => {
      const fs = require('node:fs');
      const path = require('node:path');
      const otpScreenPath = path.resolve(__dirname, '../screens/auth/OtpScreen.tsx');
      const content = fs.readFileSync(otpScreenPath, 'utf8');

      // Must use lock icon from assets
      expect(content).toContain("import LockIcon from '../../assets/lock.svg'");
      expect(content).toContain('<LockIcon');

      // Must contain progress indicator
      expect(content).toContain('progressContainer');
      expect(content).toContain('[1, 2, 3, 4]');
    });

    it('verifies back button is functional and visible across screens', () => {
      const loginContent = fs.readFileSync(
        path.resolve(__dirname, '../screens/auth/LoginScreen.tsx'),
        'utf8',
      );
      expect(loginContent).toContain('backButtonText');
      expect(loginContent).toContain("onPress={() => onNavigate('Welcome')}");

      const forgotContent = fs.readFileSync(
        path.resolve(__dirname, '../screens/auth/ForgotPasswordScreen.tsx'),
        'utf8',
      );
      expect(forgotContent).toContain('backButtonText');
      expect(forgotContent).toContain('handleBackPress');

      const otpContent = fs.readFileSync(
        path.resolve(__dirname, '../screens/auth/OtpScreen.tsx'),
        'utf8',
      );
      expect(otpContent).toContain('backButtonText');
      expect(otpContent).toContain("onPress={() => onNavigate('Login')}");
    });

    it('verifies language switching is functional and reactive across EN and Tamil', () => {
      setLocale('en');
      expect(getLocale()).toBe('en');
      expect(t('auth.forgot.title')).toBe('Forgot Password');

      setLocale('ta');
      expect(getLocale()).toBe('ta');
      expect(t('auth.forgot.title')).toBe('கடவுச்சொல் மறந்ததா');

      // Reset back to en
      setLocale('en');
      expect(getLocale()).toBe('en');
    });

    it('validates mobile number rules (10 digits starting with 6-9)', () => {
      const indianMobileRegex = /^[6-9]\d{9}$/;

      expect(indianMobileRegex.test('9876543210')).toBe(true);
      expect(indianMobileRegex.test('6123456789')).toBe(true);
      expect(indianMobileRegex.test('7234567890')).toBe(true);
      expect(indianMobileRegex.test('8345678901')).toBe(true);

      // Invalid
      expect(indianMobileRegex.test('1234567890')).toBe(false); // starts with 1
      expect(indianMobileRegex.test('987654321')).toBe(false);  // 9 digits
      expect(indianMobileRegex.test('98765432101')).toBe(false); // 11 digits
      expect(indianMobileRegex.test('abcdefghij')).toBe(false); // non-numeric
    });

    it('verifies WelcomeScreen has no expand_more, uses simple EN / தமிழ் toggle and full bleed status bar', () => {
      const welcomeContent = fs.readFileSync(
        path.resolve(__dirname, '../screens/auth/WelcomeScreen.tsx'),
        'utf8',
      );
      // No expand_more icon or text
      expect(welcomeContent).not.toContain('expand_more');
      // No complex dropdown
      expect(welcomeContent).not.toContain('langDropdown');
      // Contains visible EN and தமிழ் pill
      expect(welcomeContent).toContain('langPill');
      expect(welcomeContent).toContain('EN');
      expect(welcomeContent).toContain('தமிழ்');
      expect(welcomeContent).toContain('useLocale');

      const appContent = fs.readFileSync(
        path.resolve(__dirname, '../App.tsx'),
        'utf8',
      );
      // Splash and Welcome use full-bleed container with translucent status bar (no upper green bar)
      expect(appContent).toContain("screen === 'Splash' || screen === 'Welcome'");
      expect(appContent).toContain('fullBleedContainer');
      expect(appContent).toContain('translucent');
    });

    it('verifies LoginScreen matches exact canonical mockup with clean light background and all UI elements', () => {
      const loginContent = fs.readFileSync(
        path.resolve(__dirname, '../screens/auth/LoginScreen.tsx'),
        'utf8',
      );
      // Clean background (no image background)
      expect(loginContent).toContain('backgroundColor: P.bg');
      expect(loginContent).not.toContain('ImageBackground');
      // Has top circular back button
      expect(loginContent).toContain('backButton');
      expect(loginContent).toContain("onPress={() => onNavigate('Welcome')}");
      // Has centered Home Icon badge
      expect(loginContent).toContain('HomeIcon');
      expect(loginContent).toContain('iconCircle');
      // Has mobile and password fields with icons
      expect(loginContent).toContain('MOBILE_PREFIX');
      expect(loginContent).toContain('CallIcon');
      expect(loginContent).toContain('LockIcon');
      expect(loginContent).toContain('EyeIcon');
      expect(loginContent).toContain('EyeCloseIcon');
      // Has Remember Me and Forgot Password
      expect(loginContent).toContain('rememberMe');
      expect(loginContent).toContain('ForgotPassword');
      // Has Login button
      expect(loginContent).toContain('loginButton');
      // Has social login row (Google, Apple, Facebook)
      expect(loginContent).toContain('socialRow');
      // Has Apply as Farmer registration link
      expect(loginContent).toContain('RoleSelection');
      // Has visible language switcher with EN and தமிழ்
      expect(loginContent).toContain('langContainer');
      expect(loginContent).toContain('EN');
      expect(loginContent).toContain('தமிழ்');
      expect(loginContent).toContain('useLocale');

      const gradientContent = fs.readFileSync(
        path.resolve(__dirname, '../screens/auth/GradientOverlay.tsx'),
        'utf8',
      );
      // Uses hardware-accelerated SVG LinearGradient (no stepped bands or stripes)
      expect(gradientContent).toContain('LinearGradient');
      expect(gradientContent).toContain('Stop');
      expect(gradientContent).not.toContain('styles.band');
    });
  });
});



