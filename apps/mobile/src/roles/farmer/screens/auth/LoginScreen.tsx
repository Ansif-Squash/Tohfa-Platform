import React, { useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Image,
} from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { t, getLocale, setLocale } from '../../../../i18n/farmer';
import { Button, ErrorState, Icon } from '@tohfa/mobile-ui';
import {
  loginWithPassword,
  loginWithOAuth,
  isOAuthNotLinked,
  requestOtp,
  resolveRouteAfterAuth,
  fetchMe,
  isRoleSelectionRequired,
  type OAuthProviderCode,
} from '../../api/auth';
import { ApiError } from '../../api/client';
import {
  signInWithGoogle,
  signInWithFacebook,
  SocialSignInCancelledError,
} from '../../native/socialSignIn';
import { authPalette as P, typography, weights } from '../../theme';
import googleIcon from '../../assets/icons/googleee.png';
import appleIcon from '../../assets/icons/apple.png';
import facebookIcon from '../../assets/icons/facebook.png';
import tohfaLogo from '../../assets/tohfa-logo.png';

// ── SVG Icons ────────────────────────────────────────────────────────────────

function PhoneIcon({ size = 18, color = '#718274' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function LockIcon({ size = 20, color = '#718274' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="5" y="10.5" width="14" height="10.5" rx="2.5" stroke={color} strokeWidth="2" />
      <Path
        d="M7.5 10.5V7a4.5 4.5 0 0 1 9 0v3.5"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle cx="12" cy="15.75" r="1.5" fill={color} />
    </Svg>
  );
}

function EyeIcon({ size = 18, color = '#718274' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle cx="12" cy="12" r="3" stroke={color} strokeWidth="2" />
    </Svg>
  );
}

function EyeOffIcon({ size = 18, color = '#718274' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M1 1l22 22"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

interface LoginScreenProps {
  onNavigate: (
    screen:
      | 'Welcome'
      | 'Otp'
      | 'ForgotPassword'
      | 'ApplicationStatus'
      | 'MainTabs'
      | 'CustomerMain'
      | 'Unsupported'
      | 'Register',
    params?: Record<string, string | number | undefined>,
  ) => void;
}

const MOBILE_PREFIX = '+91';

export const LoginScreen: React.FC<LoginScreenProps> = ({ onNavigate }) => {
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<OAuthProviderCode | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [locale, setLocaleState] = useState(getLocale());
  const [isMobileFocused, setIsMobileFocused] = useState(false);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);

  const switchLocale = (lang: 'en' | 'ta') => {
    setLocale(lang);
    setLocaleState(lang);
  };

  const cleanMobile = () => (mobile.startsWith('+') ? mobile.trim() : `+91${mobile.trim()}`);

  /**
   * Social sign-in (BR-39). Apple is left as a no-op — out of scope for this
   * change, the button stays but does nothing, same as before.
   *
   * Google/Facebook: get a verified provider token from the native SDK, then
   * hand it to the same `/auth/oauth/{provider}` endpoint password login
   * uses via `/auth/login`. Three outcomes, mirrored from `handlePasswordLogin`
   * where the shape overlaps:
   *  - success -> same post-login navigation as a password login.
   *  - requiresRoleSelection -> same deterministic first-role resolution as
   *    `handlePasswordLogin` (see the comment there: this app has no
   *    role-picker UI for an existing login).
   *  - NOT_LINKED -> BR-39: this identity has no TOHFA account yet, and OAuth
   *    is never allowed to create one by itself. The farmer must still prove
   *    a real mobile number via OTP. Rather than adding a new "enter your
   *    mobile" screen, this reuses the mobile number field already on this
   *    same form — if it's empty, ask for it and stop (a defensible minimal
   *    choice; see the sub-agent report for why a dedicated screen wasn't
   *    built here without a design reference).
   */
  async function onSocialLogin(provider: 'GOOGLE' | 'APPLE' | 'FACEBOOK') {
    if (provider === 'APPLE') {
      // TODO: wire to OAuth flow once Apple sign-in is in scope.
      return;
    }

    setSocialLoading(provider);
    setErrorMsg(null);

    try {
      const providerToken =
        provider === 'GOOGLE' ? await signInWithGoogle() : await signInWithFacebook();

      let outcome = await loginWithOAuth(provider, providerToken);

      if (isRoleSelectionRequired(outcome)) {
        const firstRole = outcome.availableRoles[0]?.code;
        if (!firstRole) {
          setErrorMsg(t('error.generic'));
          return;
        }
        outcome = await loginWithOAuth(provider, providerToken, { roleCode: firstRole });
      }

      if (isOAuthNotLinked(outcome)) {
        if (!mobile.trim()) {
          setErrorMsg(t('farmer.auth.login.socialLinkMobileRequired'));
          return;
        }
        const targetMobile = cleanMobile();
        const otpRes = await requestOtp({ mobile: targetMobile, purpose: 'LOGIN' });
        onNavigate('Otp', {
          mobile: targetMobile,
          challengeId: otpRes.challengeId,
          resendAvailableAt: otpRes.resendAvailableAt,
          attemptsRemaining: otpRes.attemptsRemaining,
          purpose: 'LOGIN',
          linkToken: outcome.linkToken,
        });
        return;
      }

      if (isRoleSelectionRequired(outcome)) {
        setErrorMsg(t('error.generic'));
        return;
      }

      const me = await fetchMe();
      const route = resolveRouteAfterAuth(me);
      onNavigate(route.name, route.params);
    } catch (err: unknown) {
      if (err instanceof SocialSignInCancelledError) {
        // The farmer closed the native sheet — not an error worth surfacing.
        return;
      }
      if (err instanceof ApiError) {
        setErrorMsg(t(`error.${err.problem.code}` as unknown as Parameters<typeof t>[0]) || t('error.generic'));
      } else {
        setErrorMsg(t('error.generic'));
      }
    } finally {
      setSocialLoading(null);
    }
  }

  async function handlePasswordLogin() {
    if (!mobile.trim() || !password.trim()) return;
    setLoading(true);
    setErrorMsg(null);

    try {
      let outcome = await loginWithPassword({ mobile: cleanMobile(), password });

      // An account with more than one role and no pinned roleCode: this app
      // has no role-picker UI for an existing login (RoleSelectionScreen is
      // a *sign-up* "how do you want to join" screen, a different concept),
      // so resolve deterministically to the first role rather than block --
      // real-world accounts holding both FARMER and CUSTOMER are an open
      // product question, not something to invent a screen for here.
      // Must be `isRoleSelectionRequired`, never `'requiresRoleSelection' in
      // outcome`: a *successful* login also carries that key, with the value
      // `false`, so the `in` form sent every single-role farmer down the
      // role-selection branch and crashed on the absent `availableRoles`.
      if (isRoleSelectionRequired(outcome)) {
        const firstRole = outcome.availableRoles[0]?.code;
        if (!firstRole) {
          setErrorMsg(t('error.generic'));
          return;
        }
        outcome = await loginWithPassword({ mobile: cleanMobile(), password, roleCode: firstRole });
      }

      if (isRoleSelectionRequired(outcome)) {
        setErrorMsg(t('error.generic'));
        return;
      }

      const me = await fetchMe();
      const route = resolveRouteAfterAuth(me);
      onNavigate(route.name, route.params);
    } catch (err: unknown) {
      console.error('[LoginScreen] Catch block hit:', err);
      if (err instanceof ApiError) {
        setErrorMsg(t(`error.${err.problem.code}` as unknown as Parameters<typeof t>[0]) || t('error.generic'));
      } else {
        console.error('[LoginScreen] Unknown error:', err);
        setErrorMsg(t('error.generic'));
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.backRow}>
        <TouchableOpacity
          accessibilityRole="button"
          activeOpacity={0.7}
          style={styles.backButton}
          onPress={() => onNavigate('Welcome')}
        >
          <Text style={{ fontSize: 22, fontWeight: '700', color: P.primary, marginTop: -2 }}>{'‹'}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.iconCircle}>
        <Image source={tohfaLogo} style={{ width: 48, height: 48 }} resizeMode="contain" />
      </View>

      <Text style={styles.title}>{t('farmer.auth.login.title')}</Text>
      <Text style={styles.subtitle}>{t('farmer.auth.login.subtitle')}</Text>

      {errorMsg ? <ErrorState message={errorMsg} onRetry={() => setErrorMsg(null)} /> : null}

      <View style={styles.fieldGroup}>
        <Text style={styles.fieldLabel}>{t('farmer.auth.login.mobile')}</Text>
        <View style={[styles.fieldRow, isMobileFocused && styles.fieldRowFocused]}>
          <View style={styles.fieldIconWrap}>
            <PhoneIcon size={18} color={isMobileFocused ? P.primary : '#8C9088'} />
          </View>
          <Text style={styles.prefix}>{MOBILE_PREFIX}</Text>
          <View style={styles.prefixDivider} />
          <TextInput
            value={mobile}
            onChangeText={setMobile}
            onFocus={() => setIsMobileFocused(true)}
            onBlur={() => setIsMobileFocused(false)}
            keyboardType="phone-pad"
            placeholder="98765 43210"
            placeholderTextColor="#9CA3AF"
            style={styles.fieldInput}
            accessibilityLabel={t('farmer.auth.login.mobile')}
          />
        </View>
      </View>

      <View style={styles.fieldGroup}>
        <Text style={styles.fieldLabel}>{t('farmer.auth.login.password')}</Text>
        <View style={[styles.fieldRow, isPasswordFocused && styles.fieldRowFocused]}>
          <View style={styles.fieldIconWrap}>
            <LockIcon size={18} color={isPasswordFocused ? P.primary : '#8C9088'} />
          </View>
          <TextInput
            value={password}
            onChangeText={setPassword}
            onFocus={() => setIsPasswordFocused(true)}
            onBlur={() => setIsPasswordFocused(false)}
            secureTextEntry={!showPassword}
            placeholder="••••••••"
            placeholderTextColor="#9CA3AF"
            style={[
              styles.fieldInput,
              styles.passwordInput,
              !showPassword && styles.passwordInputMasked,
            ]}
            accessibilityLabel={t('farmer.auth.login.password')}
          />
          <TouchableOpacity
            accessibilityRole="button"
            onPress={() => setShowPassword((s) => !s)}
            style={styles.eyeToggleBtn}
            activeOpacity={0.7}
          >
            {showPassword ? (
              <EyeOffIcon size={18} color="#8C9088" />
            ) : (
              <EyeIcon size={18} color="#8C9088" />
            )}
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.optionRow}>
        <TouchableOpacity
          accessibilityRole="checkbox"
          accessibilityState={{ checked: rememberMe }}
          style={styles.rememberWrap}
          onPress={() => setRememberMe((r) => !r)}
        >
          <View style={[styles.checkbox, rememberMe && styles.checkboxChecked]}>
            {rememberMe ? <Icon name="check" size={12} color={P.white} /> : null}
          </View>
          <Text style={styles.rememberText}>{t('farmer.auth.login.rememberMe')}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          accessibilityRole="button"
          onPress={() => onNavigate('ForgotPassword')}
        >
          <Text style={styles.forgotText}>{t('farmer.auth.login.forgotPassword')}</Text>
        </TouchableOpacity>
      </View>

      <Button
        title={t('farmer.auth.login.submit')}
        onPress={handlePasswordLogin}
        loading={loading}
        disabled={!mobile || !password}
        style={styles.loginButton}
        textStyle={styles.loginButtonText}
      />

      <View style={styles.dividerRow}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerText}>{t('farmer.auth.login.orContinueWith')}</Text>
        <View style={styles.dividerLine} />
      </View>

      <View style={styles.socialRow}>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel={t('farmer.auth.login.continueWithGoogle')}
          style={styles.socialButton}
          onPress={() => onSocialLogin('GOOGLE')}
          disabled={socialLoading !== null}
        >
          {socialLoading === 'GOOGLE' ? (
            <ActivityIndicator size="small" color={P.primary} />
          ) : (
            <Image source={googleIcon} style={{ width: 24, height: 24 }} resizeMode="contain" />
          )}
        </TouchableOpacity>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel={t('farmer.auth.login.continueWithApple')}
          style={styles.socialButton}
          onPress={() => onSocialLogin('APPLE')}
          disabled={socialLoading !== null}
        >
          <Image source={appleIcon} style={{ width: 24, height: 24 }} resizeMode="contain" />
        </TouchableOpacity>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel={t('farmer.auth.login.continueWithFacebook')}
          style={styles.socialButton}
          onPress={() => onSocialLogin('FACEBOOK')}
          disabled={socialLoading !== null}
        >
          {socialLoading === 'FACEBOOK' ? (
            <ActivityIndicator size="small" color={P.primary} />
          ) : (
            <Image source={facebookIcon} style={{ width: 24, height: 24 }} resizeMode="contain" />
          )}
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        accessibilityRole="button"
        style={styles.registerWrap}
        onPress={() => onNavigate('Register')}
      >
        <Text style={styles.registerText}>
          {t('farmer.auth.login.newToTohfa')}{' '}
          <Text style={styles.registerLink}>{t('farmer.auth.login.applyAsFarmer')} →</Text>
        </Text>
      </TouchableOpacity>

      <View style={styles.langRow}>
        <TouchableOpacity
          accessibilityRole="button"
          style={locale === 'en' ? styles.langPillActive : styles.langPill}
          onPress={() => switchLocale('en')}
        >
          <Text style={locale === 'en' ? styles.langPillActiveText : styles.langPillText}>EN</Text>
        </TouchableOpacity>
        <TouchableOpacity
          accessibilityRole="button"
          style={locale === 'ta' ? styles.langPillActive : styles.langPill}
          onPress={() => switchLocale('ta')}
        >
          <Text style={locale === 'ta' ? styles.langPillActiveText : styles.langPillText}>{'\u0BA4\u0BAE\u0BBF\u0BB4\u0BCD'}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.legalRow}>
        <Text style={styles.legalText}>
          <Text style={styles.legalLink}>{t('farmer.auth.welcome.terms')}</Text>
          {' · '}
          <Text style={styles.legalLink}>{t('farmer.auth.welcome.privacy')}</Text>
        </Text>
      </View>
    </ScrollView>
  );
};
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: P.bg,
  },
  content: {
    paddingHorizontal: 24,
    paddingBottom: 32,
  },
  backRow: {
    paddingTop: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: P.progressInactive,
    backgroundColor: P.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: P.lightGreen,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginTop: 18,
  },
  title: {
    fontSize: typography.title,
    fontWeight: weights.bold,
    color: P.ink,
    textAlign: 'center',
    marginTop: 18,
  },
  subtitle: {
    fontSize: typography.bodySmall,
    fontWeight: weights.regular,
    lineHeight: 19,
    color: P.muted,
    textAlign: 'center',
    marginTop: 6,
  },
  socialRow: {
    flexDirection: 'row',
    gap: 12,
  },
  socialButton: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: P.border,
    backgroundColor: P.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleGlyph: {
    fontSize: 22,
    fontWeight: '800',
    color: P.googleBlue,
  },
  appleGlyph: {
    fontSize: 24,
    fontWeight: '600',
    color: P.black,
  },
  facebookBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: P.facebookBlue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  facebookGlyph: {
    fontSize: 16,
    fontWeight: '800',
    color: P.white,
    marginTop: -1,
  },
  fieldGroup: {
    marginTop: 18,
  },
  fieldLabel: {
    fontSize: typography.caption,
    fontWeight: weights.bold,
    color: '#1A2E1A',
    marginBottom: 8,
  },
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#ECE8DD',
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 52,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  fieldRowFocused: {
    borderColor: P.primary,
    backgroundColor: '#FFFFFF',
    shadowColor: P.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  fieldIconWrap: {
    width: 22,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  prefix: {
    fontSize: typography.body,
    fontWeight: weights.bold,
    color: '#1A2E1A',
  },
  prefixDivider: {
    width: 1,
    height: 18,
    backgroundColor: '#E5E7EB',
    marginLeft: 10,
    marginRight: 10,
  },
  fieldInput: {
    flex: 1,
    height: '100%',
    fontSize: typography.body,
    fontWeight: weights.medium,
    color: '#1A2E1A',
    paddingVertical: 0,
    paddingHorizontal: 0,
    textAlignVertical: 'center',
    includeFontPadding: false,
  },
  passwordInput: {
    paddingRight: 4,
  },
  passwordInputMasked: {
    fontSize: 21,
    letterSpacing: 3,
    fontWeight: '700',
  },
  eyeToggleBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 4,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 14,
  },
  rememberWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  checkbox: {
    width: 19,
    height: 19,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: P.border,
    backgroundColor: P.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: P.primary,
    borderColor: P.primary,
  },
  rememberText: {
    fontSize: typography.caption,
    fontWeight: weights.medium,
    color: P.ink,
  },
  forgotText: {
    fontSize: typography.caption,
    fontWeight: weights.bold,
    color: P.primary,
  },
  loginButton: {
    backgroundColor: P.primary,
    borderRadius: 12,
    height: 48,
    marginTop: 22,
  },
  loginButtonText: {
    fontSize: typography.bodySmall,
    fontWeight: weights.bold,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 32,
    marginBottom: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: P.border,
  },
  dividerText: {
    fontSize: typography.caption,
    fontWeight: weights.semibold,
    color: '#43566B',
  },
  registerWrap: {
    alignItems: 'center',
    marginTop: 32,
  },
  registerText: {
    fontSize: typography.bodySmall,
    fontWeight: weights.regular,
    color: '#43566B',
  },
  registerLink: {
    color: P.primary,
    fontWeight: weights.bold,
  },
  langRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginTop: 64,
  },
  langPillActive: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: P.lightGreen,
  },
  langPillActiveText: {
    fontSize: typography.bodySmall,
    fontWeight: weights.bold,
    color: P.primary,
  },
  langPill: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 999,
  },
  langPillText: {
    fontSize: typography.bodySmall,
    fontWeight: weights.semibold,
    color: '#43566B',
  },
  legalRow: {
    alignItems: 'center',
    marginTop: 16,
  },
  legalText: {
    fontSize: typography.caption,
    fontWeight: weights.regular,
    color: '#8A9BAE',
  },
  legalLink: {
    textDecorationLine: 'underline',
  },
});