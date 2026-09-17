import React, { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { t } from '../../../../i18n/farmer';
import { Icon, ErrorState } from '@tohfa/mobile-ui';
import { requestOtp } from '../../api/auth';
import { ApiError } from '../../api/client';
import { authPalette as P } from '../../theme';

interface ForgotPasswordScreenProps {
  onNavigate: (screen: 'Login' | 'Otp', params?: Record<string, string | number | undefined>) => void;
}

/**
 * Approved Forgot Password design (branding guidelines, Screen 12).
 *
 * Light screen: back button, 4-step progress indicator (step 1 active),
 * light-green lock circle, "Forgot Password" title, +91 mobile field,
 * solid "Send OTP" button and a "Remember your password? Login" footer.
 */


export const ForgotPasswordScreen: React.FC<ForgotPasswordScreenProps> = ({ onNavigate }) => {
  const [mobile, setMobile] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function handleSubmit() {
    if (!mobile.trim()) return;
    setLoading(true);

    try {
      const cleanMobile = mobile.startsWith('+') ? mobile.trim() : `+91${mobile.trim()}`;
      const res = await requestOtp({ mobile: cleanMobile, purpose: 'PASSWORD_RESET' });
      if (res._mockCode) {
        console.log(`[Dev] Mock OTP for ${cleanMobile}: ${res._mockCode}`);
      }
      onNavigate('Otp', {
        mobile: cleanMobile,
        challengeId: res.challengeId,
        resendAvailableAt: res.resendAvailableAt,
        attemptsRemaining: res.attemptsRemaining,
        purpose: 'PASSWORD_RESET'
      });
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setErrorMsg(t(`error.${err.problem.code}` as unknown as Parameters<typeof t>[0]) || err.problem.detail || t('error.generic'));
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
          activeOpacity={0.7}
          style={styles.backButton}
          onPress={() => onNavigate('Login')}
        >
          <Text style={{ fontSize: 22, fontWeight: '700', color: P.primary, marginTop: -2 }}>{'‹'}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.iconCircle}>
        <Icon name="lock" size={28} color={P.primary} />
      </View>

      <Text style={styles.title}>Forgot Password</Text>
      <Text style={styles.subtitle}>Enter your registered mobile number to receive an OTP</Text>

      {errorMsg ? (
        <View style={{ marginTop: 24, paddingHorizontal: 0 }}>
          <ErrorState message={errorMsg} onRetry={() => setErrorMsg(null)} />
        </View>
      ) : null}

      <Text style={styles.fieldLabel}>{t('farmer.auth.login.mobile')}</Text>
      <View style={styles.fieldRow}>
        <Icon name="call" size={16} color={P.muted} />
        <Text style={styles.prefix}>+91</Text>
        <TextInput
          style={styles.fieldInput}
          value={mobile}
          onChangeText={setMobile}
          keyboardType="phone-pad"
          placeholder="98765 43210"
          placeholderTextColor={P.muted}
          maxLength={12}
          accessibilityLabel={t('farmer.auth.login.mobile')}
        />
      </View>

      <TouchableOpacity
        accessibilityRole="button"
        style={[styles.ctaButton, (!mobile || loading) && styles.ctaDisabled]}
        onPress={handleSubmit}
        disabled={!mobile || loading}
      >
        <Text style={styles.ctaText}>{t('farmer.auth.forgot.sendOtp')}</Text>
      </TouchableOpacity>

      <Text style={styles.footerText}>
        {t('farmer.auth.forgot.rememberPassword')}{' '}
        <Text
          style={styles.footerLink}
          onPress={() => onNavigate('Login')}
          accessibilityRole="link"
        >
          {t('farmer.auth.forgot.loginLink')}
        </Text>
      </Text>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: P.bg,
  },
  content: {
    padding: 24,
    paddingBottom: 40,
  },
  backRow: {
    flexDirection: 'row',
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
  backButtonText: {
    fontSize: 18,
    color: P.muted,
    fontWeight: '600',
  },
  iconCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: P.lightGreen,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginTop: 36,
  },
  title: {
    fontSize: 23,
    fontWeight: '800',
    color: P.ink,
    textAlign: 'center',
    marginTop: 24,
  },
  subtitle: {
    fontSize: 12.8,
    lineHeight: 19,
    color: P.muted,
    textAlign: 'center',
    marginTop: 8,
  },
  fieldLabel: {
    fontSize: 11.5,
    fontWeight: '700',
    color: P.ink,
    marginTop: 32,
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
    fontSize: 15,
    fontWeight: '700',
    color: P.ink,
  },
  fieldInput: {
    flex: 1,
    fontSize: 15,
    color: P.ink,
    paddingVertical: 0,
  },
  ctaButton: {
    backgroundColor: P.primary,
    borderRadius: 12,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
  },
  ctaDisabled: {
    opacity: 0.4,
  },
  ctaText: {
    fontSize: 14,
    fontWeight: '700',
    color: P.white,
  },
  footerText: {
    fontSize: 12.5,
    color: P.muted,
    textAlign: 'center',
    marginTop: 20,
  },
  footerLink: {
    color: P.primary,
    fontWeight: '700',
  },
});
