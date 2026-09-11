import React, { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { t } from '../../i18n';
import { Icon } from '@tohfa/mobile-ui';
import { forgotPassword } from '../../api/auth';
import { authPalette as P } from '../../theme';

interface ForgotPasswordScreenProps {
  onNavigate: (screen: 'Login') => void;
}

/**
 * Approved Forgot Password design (branding guidelines, Screen 12).
 *
 * Light screen: back button, 4-step progress indicator (step 1 active),
 * light-green lock circle, "Forgot Password" title, +91 mobile field,
 * solid "Send OTP" button and a "Remember your password? Login" footer.
 */

const TOTAL_STEPS = 4;

export const ForgotPasswordScreen: React.FC<ForgotPasswordScreenProps> = ({ onNavigate }) => {
  const [mobile, setMobile] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit() {
    if (!mobile.trim()) return;
    setLoading(true);

    try {
      const cleanMobile = mobile.startsWith('+') ? mobile.trim() : `+91${mobile.trim()}`;
      await forgotPassword({ mobile: cleanMobile });
    } catch {
      // Account enumeration defense: ignore API errors and display generic 202 screen
    } finally {
      setLoading(false);
      setSubmitted(true);
    }
  }

  if (submitted) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.successView}>
          <View style={styles.iconCircle}>
            <Icon name="mark_email_read" size={30} color={P.primary} />
          </View>
          <Text style={styles.title}>{t('auth.forgot.successTitle')}</Text>
          <Text style={styles.subtitle}>{t('auth.forgot.successSubtitle')}</Text>
          <TouchableOpacity
            accessibilityRole="button"
            style={styles.ctaButton}
            onPress={() => onNavigate('Login')}
          >
            <Text style={styles.ctaText}>{t('auth.forgot.backToLogin')}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.backRow}>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Back"
          style={styles.backButton}
          onPress={() => onNavigate('Login')}
        >
          <Text style={styles.backButtonText}>{'<'}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.iconCircle}>
        <Text style={{ fontSize: 28 }}>🔒</Text>
      </View>

      <Text style={styles.title}>Forgot Password</Text>
      <Text style={styles.subtitle}>Enter your registered mobile number to receive an OTP</Text>

      <Text style={styles.fieldLabel}>{t('auth.login.mobile')}</Text>
      <View style={styles.fieldRow}>
        <Text style={{ fontSize: 16 }}>📞</Text>
        <Text style={styles.prefix}>+91</Text>
        <TextInput
          style={styles.fieldInput}
          value={mobile}
          onChangeText={setMobile}
          keyboardType="phone-pad"
          placeholder="98765 43210"
          placeholderTextColor={P.muted}
          maxLength={12}
          accessibilityLabel={t('auth.login.mobile')}
        />
      </View>

      <TouchableOpacity
        accessibilityRole="button"
        style={[styles.ctaButton, (!mobile || loading) && styles.ctaDisabled]}
        onPress={handleSubmit}
        disabled={!mobile || loading}
      >
        <Text style={styles.ctaText}>{t('auth.forgot.sendOtp')}</Text>
      </TouchableOpacity>

      <Text style={styles.footerText}>
        {t('auth.forgot.rememberPassword')}{' '}
        <Text
          style={styles.footerLink}
          onPress={() => onNavigate('Login')}
          accessibilityRole="link"
        >
          {t('auth.forgot.loginLink')}
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
    fontSize: 24,
    fontWeight: '800',
    color: P.ink,
    textAlign: 'center',
    marginTop: 24,
  },
  subtitle: {
    fontSize: 13.5,
    color: P.muted,
    textAlign: 'center',
    lineHeight: 20,
    marginTop: 8,
  },
  fieldLabel: {
    fontSize: 12.5,
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
    height: 52,
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
    fontSize: 15,
    fontWeight: '700',
    color: P.white,
  },
  footerText: {
    fontSize: 13,
    color: P.muted,
    textAlign: 'center',
    marginTop: 20,
  },
  footerLink: {
    color: P.primary,
    fontWeight: '700',
  },
  successView: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
});
