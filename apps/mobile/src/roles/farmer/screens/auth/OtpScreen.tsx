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
import { authPalette as themeAuthPalette } from '../../theme';
import { t } from '../../../../i18n/farmer';
import { Icon } from '@tohfa/mobile-ui';
import { verifyOtp, requestOtp, renderOtpState, resolveRouteAfterAuth, fetchMe } from '../../api/auth';
import { ApiError } from '../../api/client';

// This screen's mockup uses a distinct cream/dark-green scheme from the rest
// of the auth flow (which uses `authPalette` from the theme directly) — map
// its roles onto the shared theme fields so no hex is inlined here.
const authPalette = {
  background: themeAuthPalette.creamBg,
  primary: themeAuthPalette.otpInk,
  primaryLight: themeAuthPalette.lightGreen,
  buttonBg: themeAuthPalette.sageButtonBg,
  text: themeAuthPalette.otpInk,
  textLight: themeAuthPalette.sageMutedText,
  inputBg: themeAuthPalette.white,
  inputBorder: themeAuthPalette.sageBorder,
  focusBorder: themeAuthPalette.green700,
  successLight: themeAuthPalette.successTint,
};

interface OtpScreenProps {
  mobile: string;
  resendAvailableAt?: string | undefined;
  attemptsRemaining?: number | undefined;
  onNavigate: (screen: 'ApplicationStatus' | 'MainTabs' | 'CustomerMain' | 'Unsupported' | 'Login', params?: Record<string, string | number | undefined> | undefined) => void;
}

export const OtpScreen: React.FC<OtpScreenProps> = ({
  mobile,
  resendAvailableAt: initialResendAvailableAt,
  attemptsRemaining: initialAttemptsRemaining = 3,
  onNavigate,
}) => {
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
            <TouchableOpacity style={styles.backButton} onPress={() => onNavigate('Login')}>
              <Text style={styles.backButtonText}>{'<'}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.iconWrapper}>
            <View style={styles.iconCircle}>
              <Icon name="mark_email_read" size={32} color={authPalette.primary} />
            </View>
          </View>

          <Text style={styles.title}>Verify your mobile</Text>
          <Text style={styles.subtitle}>
            Enter the 6-digit code sent to
          </Text>
          <Text style={styles.phoneNumber}>{mobile || '+91 98XXX XX789'}</Text>
          
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
                <Text style={[styles.resendLabel, { color: authPalette.primary, fontWeight: '700' }]}>
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
              {loading ? 'Verifying...' : 'Verify'}
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
              <View style={[styles.langOption, styles.langOptionActive]}>
                <Text style={[styles.langText, styles.langTextActive]}>EN</Text>
              </View>
              <View style={styles.langOption}>
                <Text style={styles.langText}>தமிழ்</Text>
              </View>
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
    backgroundColor: authPalette.background,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 24,
    alignItems: 'center',
  },
  header: {
    width: '100%',
    flexDirection: 'row',
    marginBottom: 40,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: themeAuthPalette.coolBorder,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: authPalette.inputBg,
  },
  backButtonText: {
    fontSize: 18,
    color: authPalette.textLight,
    fontWeight: '600',
  },
  iconWrapper: {
    marginBottom: 24,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: authPalette.successLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: authPalette.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: authPalette.textLight,
    marginBottom: 8,
  },
  phoneNumber: {
    fontSize: 16,
    fontWeight: '700',
    color: authPalette.text,
    marginBottom: 8,
  },
  changeMobile: {
    fontSize: 14,
    fontWeight: '700',
    color: authPalette.focusBorder,
    marginBottom: 32,
  },
  errorText: {
    color: themeAuthPalette.red700,
    fontSize: 14,
    marginBottom: 16,
    textAlign: 'center',
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 32,
  },
  otpBox: {
    width: 48,
    height: 56,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: authPalette.inputBorder,
    backgroundColor: authPalette.inputBg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  otpBoxFilled: {
    backgroundColor: authPalette.successLight,
    borderColor: authPalette.focusBorder,
  },
  otpBoxActive: {
    borderColor: authPalette.focusBorder,
  },
  otpBoxText: {
    fontSize: 22,
    fontWeight: '700',
    color: authPalette.text,
  },
  otpBoxTextFilled: {
    color: authPalette.primary,
  },
  hiddenInput: {
    position: 'absolute',
    width: 1,
    height: 1,
    opacity: 0,
  },
  resendContainer: {
    marginBottom: 32,
  },
  resendLabel: {
    fontSize: 14,
    color: authPalette.textLight,
  },
  resendTimer: {
    fontWeight: '700',
    color: authPalette.focusBorder,
  },
  verifyButton: {
    width: '100%',
    height: 52,
    backgroundColor: authPalette.buttonBg,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  verifyButtonDisabled: {
    opacity: 0.7,
  },
  verifyButtonText: {
    color: authPalette.inputBg,
    fontSize: 16,
    fontWeight: '700',
  },
  supportContainer: {
    marginBottom: 16,
  },
  supportText: {
    fontSize: 14,
    color: authPalette.textLight,
  },
  supportLink: {
    fontWeight: '700',
    color: authPalette.focusBorder,
  },
  spacer: {
    flex: 1,
  },
  languageContainer: {
    marginTop: 20,
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
    backgroundColor: authPalette.successLight,
  },
  langText: {
    fontSize: 14,
    color: authPalette.textLight,
    fontWeight: '600',
  },
  langTextActive: {
    color: authPalette.primary,
  },
});

