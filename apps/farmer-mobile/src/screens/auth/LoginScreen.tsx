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
import { t } from '../../i18n';
import { Button, ErrorState, Icon } from '@tohfa/mobile-ui';
import { loginWithPassword, resolveRouteAfterAuth, fetchMe } from '../../api/auth';
import { ApiError } from '../../api/client';
import { authPalette as P } from '../../theme';

interface LoginScreenProps {
  onNavigate: (
    screen:
      | 'Welcome'
      | 'Otp'
      | 'ForgotPassword'
      | 'ApplicationStatus'
      | 'MainTabs'
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
      await loginWithPassword({ mobile: cleanMobile(), password });
      const me = await fetchMe();
      const route = resolveRouteAfterAuth(me);
      onNavigate(route.name, route.params);
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        if (
          (err.problem.code as string) === 'UNAUTHORIZED' ||
          (err.problem.code as string) === 'UNAUTHENTICATED'
        ) {
          setErrorMsg(t('error.UNAUTHORIZED'));
        } else {
          setErrorMsg(
            t(`error.${err.problem.code}` as unknown as Parameters<typeof t>[0]) ||
              t('error.generic'),
          );
        }
      } else {
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
          style={styles.backButton}
          onPress={() => onNavigate('Welcome')}
        >
          <Text style={{ fontSize: 20, fontWeight: 'bold', color: P.ink }}>{'<'}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.iconCircle}>
        <Text style={{ fontSize: 32 }}>🏠</Text>
      </View>

      <Text style={styles.title}>{t('auth.login.title')}</Text>
      <Text style={styles.subtitle}>{t('auth.login.subtitle')}</Text>

      {errorMsg ? <ErrorState message={errorMsg} onRetry={() => setErrorMsg(null)} /> : null}

      <View style={styles.fieldGroup}>
        <Text style={styles.fieldLabel}>{t('auth.login.mobile')}</Text>
        <View style={styles.fieldRow}>
          <Text style={{ fontSize: 16 }}>📞</Text>
          <Text style={styles.prefix}>{MOBILE_PREFIX}</Text>
          <TextInput
            value={mobile}
            onChangeText={setMobile}
            keyboardType="phone-pad"
            placeholder="98765 43210"
            placeholderTextColor={P.muted}
            style={styles.fieldInput}
            accessibilityLabel={t('auth.login.mobile')}
          />
        </View>
      </View>

      <View style={styles.fieldGroup}>
        <Text style={styles.fieldLabel}>{t('auth.login.password')}</Text>
        <View style={styles.fieldRow}>
          <Text style={{ fontSize: 16 }}>🔒</Text>
          <TextInput
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            placeholder="........"
            placeholderTextColor={P.muted}
            style={styles.fieldInput}
            accessibilityLabel={t('auth.login.password')}
          />
          <TouchableOpacity
            accessibilityRole="button"
            onPress={() => setShowPassword((s) => !s)}
          >
            <Text style={{ fontSize: 16, color: P.muted }}>
              {showPassword ? '👁️‍🗨️' : '👁️'}
            </Text>
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
            {rememberMe ? <Text style={{ fontSize: 12, color: P.white, fontWeight: 'bold' }}>✓</Text> : null}
          </View>
          <Text style={styles.rememberText}>{t('auth.login.rememberMe')}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          accessibilityRole="button"
          onPress={() => onNavigate('ForgotPassword')}
        >
          <Text style={styles.forgotText}>{t('auth.login.forgotPassword')}</Text>
        </TouchableOpacity>
      </View>

      <Button
        title={t('auth.login.submit')}
        onPress={handlePasswordLogin}
        loading={loading}
        disabled={!mobile || !password}
        style={styles.loginButton}
        textStyle={styles.loginButtonText}
      />

      <View style={styles.dividerRow}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerText}>{t('auth.login.orContinueWith')}</Text>
        <View style={styles.dividerLine} />
      </View>

      <View style={styles.socialRow}>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Continue with Google"
          style={styles.socialButton}
          onPress={() => onSocialLogin('GOOGLE')}
        >
          <Image source={require('../../assets/icons/googleee.png')} style={{ width: 24, height: 24 }} resizeMode="contain" />
        </TouchableOpacity>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Continue with Apple"
          style={styles.socialButton}
          onPress={() => onSocialLogin('APPLE')}
        >
          <Image source={require('../../assets/icons/apple.png')} style={{ width: 24, height: 24 }} resizeMode="contain" />
        </TouchableOpacity>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Continue with Facebook"
          style={styles.socialButton}
          onPress={() => onSocialLogin('FACEBOOK')}
        >
          <Image source={require('../../assets/icons/facebook.png')} style={{ width: 24, height: 24 }} resizeMode="contain" />
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        accessibilityRole="button"
        style={styles.registerWrap}
        onPress={() => onNavigate('Register')}
      >
        <Text style={styles.registerText}>
          {t('auth.login.newToTohfa')}{' '}
          <Text style={styles.registerLink}>{t('auth.login.applyAsFarmer')} →</Text>
        </Text>
      </TouchableOpacity>

      <View style={styles.langRow}>
        <View style={styles.langPillActive}>
          <Text style={styles.langPillActiveText}>EN</Text>
        </View>
        <View style={styles.langPill}>
          <Text style={styles.langPillText}>{'\u0BA4\u0BAE\u0BBF\u0BB4\u0BCD'}</Text>
        </View>
      </View>

      <View style={styles.legalRow}>
        <Text style={styles.legalText}>
          <Text style={styles.legalLink}>{t('auth.welcome.terms')}</Text>
          {'  -  '}
          <Text style={styles.legalLink}>{t('auth.welcome.privacy')}</Text>
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
    height: 56,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: P.progressInactive,
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
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: P.divider,
  },
  dividerText: {
    fontSize: 11,
    fontWeight: '700',
    color: P.muted,
  },
  registerWrap: {
    alignItems: 'center',
  },
  registerText: {
    fontSize: 12.5,
    color: P.muted,
  },
  registerLink: {
    color: P.primary,
    fontWeight: '700',
  },
  langRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    marginTop: 28,
  },
  langPillActive: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: P.lightGreen,
  },
  langPillActiveText: {
    fontSize: 11,
    fontWeight: '700',
    color: P.primary,
  },
  langPill: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 999,
  },
  langPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: P.muted,
  },
  legalRow: {
    alignItems: 'center',
    marginTop: 10,
  },
  legalText: {
    fontSize: 10,
    color: P.legal,
  },
  legalLink: {
    textDecorationLine: 'underline',
  },
});