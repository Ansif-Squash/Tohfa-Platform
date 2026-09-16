import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Text,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  TextInput,
  Pressable,
} from 'react-native';
import { t, useLocale } from '../../i18n';
import { verifyOtp, requestOtp, renderOtpState, resolveRouteAfterAuth, fetchMe } from '../../api/auth';
import { ApiError } from '../../api/client';
import { authPalette as P } from '../../theme';
import LockIcon from '../../assets/lock.svg';
import BackIcon from '../../assets/back.svg';

interface OtpScreenProps {
  mobile: string;
  resendAvailableAt?: string | undefined;
  attemptsRemaining?: number | undefined;
  onNavigate: (screen: 'ApplicationStatus' | 'MainTabs' | 'Login', params?: Record<string, string | number | undefined> | undefined) => void;
}

export const OtpScreen: React.FC<OtpScreenProps> = ({
  mobile,
  resendAvailableAt: initialResendAvailableAt,
  attemptsRemaining: initialAttemptsRemaining = 3,
  onNavigate,
}) => {
  const [currentLocale, setCurrentLocale] = useLocale();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const inputRef = useRef<TextInput>(null);

  const [resendAvailableAt, setResendAvailableAt] = useState<string | undefined>(initialResendAvailableAt);
  const [attemptsRemaining, setAttemptsRemaining] = useState<number>(initialAttemptsRemaining);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const otpState = renderOtpState({
    resendAvailableAt,
    attemptsRemaining,
    now,
  });

  async function handleVerify() {
    if (code.length < 6 || otpState.isLocked) return;
    setLoading(true);
    setErrorMsg(null);

    try {
      await verifyOtp({ mobile, code, purpose: 'LOGIN' });
      const me = await fetchMe();
      const route = resolveRouteAfterAuth(me);
      onNavigate(route.name, route.params);
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        if (err.is('OTP_INVALID') || err.is('OTP_EXPIRED')) {
          const nextAttempts = Math.max(0, attemptsRemaining - 1);
          setAttemptsRemaining(nextAttempts);
          setErrorMsg(t('error.OTP_INVALID'));
        } else if (err.is('OTP_LOCKED')) {
          setAttemptsRemaining(0);
          setErrorMsg(t('error.OTP_LOCKED'));
        } else {
          setErrorMsg(t(`error.${err.problem.code}` as unknown as Parameters<typeof t>[0]) || t('error.generic'));
        }
      } else {
        setErrorMsg(t('error.generic'));
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    if (!otpState.canResend) return;
    setResendLoading(true);
    setErrorMsg(null);

    try {
      const res = await requestOtp({ mobile, purpose: 'LOGIN' });
      setResendAvailableAt(res.resendAvailableAt);
      setAttemptsRemaining(res.attemptsRemaining);
      setCode('');
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        if (err.is('OTP_RESEND_TOO_SOON')) {
          setErrorMsg(t('error.OTP_RESEND_TOO_SOON'));
        } else {
          setErrorMsg(t(`error.${err.problem.code}` as unknown as Parameters<typeof t>[0]) || t('error.generic'));
        }
      } else {
        setErrorMsg(t('error.generic'));
      }
    } finally {
      setResendLoading(false);
    }
  }

  const renderOtpBoxes = () => {
    const boxes = [];
    for (let i = 0; i < 6; i++) {
      const isFilled = i < code.length;
      const isActive = i === code.length;

      boxes.push(
        <View
          key={i}
          style={[
            styles.otpBox,
            isFilled && styles.otpBoxFilled,
            isActive && styles.otpBoxActive,
          ]}
        >
          <Text style={[styles.otpBoxText, isFilled && styles.otpBoxTextFilled]}>
            {code[i] || ''}
          </Text>
        </View>
      );
    }
    return boxes;
  };

  const formatTimer = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `0${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Back"
              style={styles.backButton}
              onPress={() => onNavigate('Login')}
            >
              <Text style={styles.backButtonText}>{'<'}</Text>
            </TouchableOpacity>
          </View>

          {/* 4-Step Progress Indicator (Step 2 active) */}
          <View style={styles.progressContainer}>
            {[1, 2, 3, 4].map((index) => (
              <View
                key={index}
                style={[
                  styles.progressPill,
                  index <= 2 ? styles.progressPillActive : styles.progressPillInactive,
                ]}
              />
            ))}
          </View>

          <View style={styles.iconCircle}>
            <LockIcon width={36} height={36} color={P.primary} />
          </View>

          <Text style={styles.title}>OTP Verification</Text>
          <Text style={styles.subtitle}>
            Enter the 6-digit code sent to
          </Text>
          <Text style={styles.phoneNumber}>{mobile || '+91 98765 43210'}</Text>

          <TouchableOpacity onPress={() => onNavigate('Login')}>
            <Text style={styles.changeMobile}>Change mobile number</Text>
          </TouchableOpacity>

          {errorMsg && (
            <Text style={styles.errorText}>{errorMsg}</Text>
          )}

          <Pressable style={styles.otpContainer} onPress={() => inputRef.current?.focus()}>
            {renderOtpBoxes()}
            <TextInput
              ref={inputRef}
              style={styles.hiddenInput}
              value={code}
              onChangeText={(text) => {
                if (text.length <= 6) setCode(text.replace(/[^0-9]/g, ''));
              }}
              keyboardType="number-pad"
              maxLength={6}
              autoFocus
            />
          </Pressable>

          <View style={styles.resendContainer}>
            {otpState.canResend ? (
              <TouchableOpacity onPress={handleResend} disabled={resendLoading}>
                <Text style={[styles.resendLabel, { color: P.primary, fontWeight: '700' }]}>
                  {resendLoading ? 'Resending...' : 'Resend OTP now'}
                </Text>
              </TouchableOpacity>
            ) : (
              <Text style={styles.resendLabel}>
                Resend OTP in <Text style={styles.resendTimer}>{formatTimer(otpState.secondsUntilResend)}</Text>
              </Text>
            )}
          </View>

          <TouchableOpacity
            style={[
              styles.verifyButton,
              code.length < 6 && styles.verifyButtonDisabled,
            ]}
            onPress={handleVerify}
            disabled={code.length < 6 || loading}
          >
            <Text style={styles.verifyButtonText}>
              {loading ? 'Verifying...' : 'Verify & Proceed'}
            </Text>
          </TouchableOpacity>

          <View style={styles.supportContainer}>
            <Text style={styles.supportText}>
              Having trouble?{' '}
              <Text style={styles.supportLink} onPress={() => {}}>
                Contact TOHFA support
              </Text>
            </Text>
          </View>

          <View style={styles.spacer} />

          <View style={styles.languageContainer}>
            <View style={styles.languageToggle}>
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel="Switch to English"
                style={[styles.langOption, currentLocale === 'en' && styles.langOptionActive]}
                onPress={() => setCurrentLocale('en')}
              >
                <Text style={[styles.langText, currentLocale === 'en' && styles.langTextActive]}>
                  EN
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel="Switch to Tamil"
                style={[styles.langOption, currentLocale === 'ta' && styles.langOptionActive]}
                onPress={() => setCurrentLocale('ta')}
              >
                <Text style={[styles.langText, currentLocale === 'ta' && styles.langTextActive]}>
                  {'\u0BA4\u0BAE\u0BBF\u0BB4\u0BCD'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: P.bg,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 24,
    alignItems: 'center',
  },
  header: {
    width: '100%',
    flexDirection: 'row',
    marginBottom: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: P.border,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: P.white,
  },
  backButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: P.muted,
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
    marginBottom: 8,
  },
  progressPill: {
    width: 26,
    height: 5,
    borderRadius: 2.5,
  },
  progressPillActive: {
    backgroundColor: P.primary,
  },
  progressPillInactive: {
    backgroundColor: P.progressInactive,
  },
  iconCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: P.lightGreen,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 22,
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: P.ink,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 13.5,
    color: P.muted,
    marginBottom: 6,
    textAlign: 'center',
  },
  phoneNumber: {
    fontSize: 15,
    fontWeight: '700',
    color: P.ink,
    marginBottom: 6,
  },
  changeMobile: {
    fontSize: 13.5,
    fontWeight: '700',
    color: P.primary,
    marginBottom: 24,
  },
  errorText: {
    color: P.errorRed,
    fontSize: 13,
    marginBottom: 14,
    textAlign: 'center',
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 24,
  },
  otpBox: {
    width: 46,
    height: 54,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: P.border,
    backgroundColor: P.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
  otpBoxFilled: {
    backgroundColor: P.lightGreen,
    borderColor: P.primary,
  },
  otpBoxActive: {
    borderColor: P.primary,
  },
  otpBoxText: {
    fontSize: 22,
    fontWeight: '700',
    color: P.ink,
  },
  otpBoxTextFilled: {
    color: P.primary,
  },
  hiddenInput: {
    position: 'absolute',
    width: 1,
    height: 1,
    opacity: 0,
  },
  resendContainer: {
    marginBottom: 24,
  },
  resendLabel: {
    fontSize: 13.5,
    color: P.muted,
  },
  resendTimer: {
    fontWeight: '700',
    color: P.primary,
  },
  verifyButton: {
    width: '100%',
    height: 52,
    backgroundColor: P.primary,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  verifyButtonDisabled: {
    opacity: 0.45,
  },
  verifyButtonText: {
    color: P.white,
    fontSize: 15,
    fontWeight: '700',
  },
  supportContainer: {
    marginBottom: 16,
  },
  supportText: {
    fontSize: 13.5,
    color: P.muted,
  },
  supportLink: {
    fontWeight: '700',
    color: P.primary,
  },
  spacer: {
    flex: 1,
  },
  languageContainer: {
    marginTop: 16,
    alignItems: 'center',
  },
  languageToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  langOption: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  langOptionActive: {
    backgroundColor: P.lightGreen,
  },
  langText: {
    fontSize: 13,
    color: P.muted,
    fontWeight: '600',
  },
  langTextActive: {
    color: P.primary,
  },
});
