import React, { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Image,
} from 'react-native';
import { t, getLocale, setLocale } from '../../../../i18n/farmer';
import { Button, ErrorState, Icon } from '@tohfa/mobile-ui';
import { loginWithPassword, resolveRouteAfterAuth, fetchMe } from '../../api/auth';
import { ApiError } from '../../api/client';
import { authPalette as P } from '../../theme';
import googleIcon from '../../assets/icons/googleee.png';
import appleIcon from '../../assets/icons/apple.png';
import facebookIcon from '../../assets/icons/facebook.png';
import tohfaLogo from '../../assets/tohfa-logo.png';

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

/**
 * Approved Login design (branding guidelines, Screen 10).
 *
 * Light screen: back button, green home icon, "Welcome back" title,
 * +91 mobile field, password field with show/hide, remember-me + forgot row,
 * solid Login button, "OR CONTINUE WITH" divider with Google / Apple /
 * Facebook buttons, an "Apply as Farmer" register link, the EN / Tamil
 * toggle and a legal footer.
 */

const MOBILE_PREFIX = '+91';

export const LoginScreen: React.FC<LoginScreenProps> = ({ onNavigate }) => {
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [locale, setLocaleState] = useState(getLocale());

  const switchLocale = (lang: 'en' | 'ta') => {
    setLocale(lang);
    setLocaleState(lang);
  };

  const cleanMobile = () => (mobile.startsWith('+') ? mobile.trim() : `+91${mobile.trim()}`);

  /**
   * Social sign-in. The design shows Google / Apple / Facebook, but the TOHFA
   * API has no social OAuth endpoints yet — tapping is a safe no-op until the
   * backend flow lands.
   */
  const onSocialLogin = (_provider: 'GOOGLE' | 'APPLE' | 'FACEBOOK') => {
    // TODO: wire to OAuth flow once the API supports social sign-in.
  };

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
      if ('requiresRoleSelection' in outcome && outcome.requiresRoleSelection === true) {
        // We know availableRoles exists when requiresRoleSelection is true
        const rolesObj = outcome as { availableRoles?: { code: string }[] };
        const firstRole = rolesObj.availableRoles?.[0]?.code;
        if (!firstRole) {
          setErrorMsg(t('error.generic'));
          return;
        }
        outcome = await loginWithPassword({ mobile: cleanMobile(), password, roleCode: firstRole });
      }

      if ('requiresRoleSelection' in outcome && outcome.requiresRoleSelection === true) {
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
        <View style={styles.fieldRow}>
          <Icon name="call" size={16} color={P.muted} />
          <Text style={styles.prefix}>{MOBILE_PREFIX}</Text>
          <TextInput
            value={mobile}
            onChangeText={setMobile}
            keyboardType="phone-pad"
            placeholder="98765 43210"
            placeholderTextColor={P.muted}
            style={styles.fieldInput}
            accessibilityLabel={t('farmer.auth.login.mobile')}
          />
        </View>
      </View>

      <View style={styles.fieldGroup}>
        <Text style={styles.fieldLabel}>{t('farmer.auth.login.password')}</Text>
        <View style={styles.fieldRow}>
          <Icon name="lock" size={16} color={P.muted} />
          <TextInput
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            placeholder="........"
            placeholderTextColor={P.muted}
            style={styles.fieldInput}
            accessibilityLabel={t('farmer.auth.login.password')}
          />
          <TouchableOpacity
            accessibilityRole="button"
            onPress={() => setShowPassword((s) => !s)}
          >
            <Icon name={showPassword ? 'visibility_off' : 'visibility'} size={16} color={P.muted} />
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
          accessibilityLabel="Continue with Google"
          style={styles.socialButton}
          onPress={() => onSocialLogin('GOOGLE')}
        >
          <Image source={googleIcon} style={{ width: 24, height: 24 }} resizeMode="contain" />
        </TouchableOpacity>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Continue with Apple"
          style={styles.socialButton}
          onPress={() => onSocialLogin('APPLE')}
        >
          <Image source={appleIcon} style={{ width: 24, height: 24 }} resizeMode="contain" />
        </TouchableOpacity>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Continue with Facebook"
          style={styles.socialButton}
          onPress={() => onSocialLogin('FACEBOOK')}
        >
          <Image source={facebookIcon} style={{ width: 24, height: 24 }} resizeMode="contain" />
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
    fontSize: 23,
    fontWeight: '800',
    color: P.ink,
    textAlign: 'center',
    marginTop: 18,
  },
  subtitle: {
    fontSize: 12.8,
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
    fontSize: 11.5,
    fontWeight: '700',
    color: P.ink,
    marginBottom: 6,
  },
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: P.white,
    borderWidth: 1.5,
    borderColor: P.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 48,
  },
  prefix: {
    fontSize: 14,
    fontWeight: '700',
    color: P.ink,
  },
  fieldInput: {
    flex: 1,
    fontSize: 14,
    color: P.ink,
    paddingVertical: 0,
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
    fontSize: 12,
    fontWeight: '600',
    color: P.ink,
  },
  forgotText: {
    fontSize: 12,
    fontWeight: '700',
    color: P.primary,
  },
  loginButton: {
    backgroundColor: P.primary,
    borderRadius: 12,
    height: 48,
    marginTop: 22,
  },
  loginButtonText: {
    fontSize: 14,
    fontWeight: '700',
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
    fontSize: 12,
    fontWeight: '600',
    color: '#43566B',
  },
  registerWrap: {
    alignItems: 'center',
    marginTop: 32,
  },
  registerText: {
    fontSize: 14,
    color: '#43566B',
  },
  registerLink: {
    color: P.primary,
    fontWeight: '700',
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
    fontSize: 13,
    fontWeight: '700',
    color: P.primary,
  },
  langPill: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 999,
  },
  langPillText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#43566B',
  },
  legalRow: {
    alignItems: 'center',
    marginTop: 16,
  },
  legalText: {
    fontSize: 12,
    color: '#8A9BAE',
  },
  legalLink: {
    textDecorationLine: 'underline',
  },
});