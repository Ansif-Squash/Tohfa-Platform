import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text, ScrollView } from 'react-native';
import { useTheme } from '../../theme';
import { t } from '../../i18n';
import { Badge, Button, Card, ErrorState, Input } from '@tohfa/mobile-ui';
import {
  verifyOtp,
  sendOtp,
  renderOtpState,
  fetchMe,
} from '../../api/auth';
import { ApiError } from '../../api/client';

export interface OtpScreenProps {
  mobile: string;
  challengeId?: string | undefined;
  resendAvailableAt?: string | undefined;
  attemptsRemaining?: number | undefined;
  purpose?: 'REGISTRATION' | 'LOGIN' | 'PASSWORD_RESET' | undefined;
  onNavigate: (screen: 'Home' | 'Login') => void;
}

export const OtpScreen: React.FC<OtpScreenProps> = ({
  mobile,
  challengeId: initialChallengeId,
  resendAvailableAt: initialResendAvailableAt,
  attemptsRemaining: initialAttemptsRemaining = 3,
  purpose = 'REGISTRATION',
  onNavigate,
}) => {
  const theme = useTheme();
  const [code, setCode] = useState('');
  const [challengeId, setChallengeId] = useState<string | undefined>(initialChallengeId);
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // BR-32: Server state holders
  const [resendAvailableAt, setResendAvailableAt] = useState<string | undefined>(initialResendAvailableAt);
  const [attemptsRemaining, setAttemptsRemaining] = useState<number>(initialAttemptsRemaining);
  const [now, setNow] = useState(Date.now());

  // BR-32: Tick live timer
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  // BR-32: Derive state directly from server fields
  const otpState = renderOtpState({
    resendAvailableAt,
    attemptsRemaining,
    now,
  });

  async function handleVerify() {
    if (!code.trim() || otpState.isLocked) return;
    setLoading(true);
    setErrorMsg(null);

    try {
      if (!challengeId) {
        // If challengeId is missing, request a fresh one
        const otpRes = await sendOtp({ mobile, purpose });
        setChallengeId(otpRes.challengeId);
        setResendAvailableAt(otpRes.resendAvailableAt);
        setAttemptsRemaining(otpRes.attemptsRemaining);
        setErrorMsg('Please enter the verification code sent to your mobile.');
        setLoading(false);
        return;
      }

      await verifyOtp({ challengeId, code: code.trim() });
      const me = await fetchMe();

      // Instant activation: customer directly navigates to Home
      if (me.status === 'ACTIVE') {
        onNavigate('Home');
      } else {
        onNavigate('Home');
      }
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
          setErrorMsg(err.problem.detail || t('error.generic'));
        }
      } else {
        setErrorMsg(t('error.generic'));
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    setResendLoading(true);
    setErrorMsg(null);

    try {
      const res = await sendOtp({ mobile, purpose });
      // BR-32: Update state directly from server response fields
      setChallengeId(res.challengeId);
      setResendAvailableAt(res.resendAvailableAt);
      setAttemptsRemaining(res.attemptsRemaining);
      setCode('');
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        if (err.is('OTP_RESEND_TOO_SOON')) {
          const meta = err.problem.meta as { resendAvailableAt?: string } | undefined;
          if (meta?.resendAvailableAt) {
            setResendAvailableAt(meta.resendAvailableAt);
          }
          setErrorMsg(err.problem.detail || 'Please wait before resending OTP.');
        } else {
          setErrorMsg(err.problem.detail || t('error.generic'));
        }
      } else {
        setErrorMsg(t('error.generic'));
      }
    } finally {
      setResendLoading(false);
    }
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.surface }]}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <Card style={styles.card}>
        {otpState.isLocked ? (
          <View style={styles.lockedContainer}>
            <Badge label="Locked" variant="danger" />
            <Text style={[styles.title, { color: theme.colors.onSurface }]}>
              {t('auth.otp.locked')}
            </Text>
            <Text style={[styles.subtitle, { color: theme.colors.onSurface }]}>
              {t('auth.otp.locked')}
            </Text>

            <Button
              title={t('auth.otp.resend')}
              onPress={handleResend}
              loading={resendLoading}
              style={styles.actionBtn}
            />
          </View>
        ) : (
          <>
            <View style={styles.headerRow}>
              <Text style={[styles.title, { color: theme.colors.onSurface }]}>
                {t('auth.otp.title')}
              </Text>
              {/* BR-32: attempts indicator strictly from attemptsRemaining */}
              <Badge
                label={t('auth.otp.attemptsRemaining', { count: otpState.attemptsRemaining })}
                variant={otpState.attemptsRemaining <= 1 ? 'danger' : 'info'}
              />
            </View>

            <Text style={[styles.subtitle, { color: theme.colors.onSurface }]}>
              {t('auth.otp.subtitle', { mobile })}
            </Text>

            {errorMsg ? <ErrorState message={errorMsg} onRetry={() => setErrorMsg(null)} /> : null}

            <Input
              label={t('auth.otp.label')}
              value={code}
              onChangeText={setCode}
              keyboardType="number-pad"
              maxLength={6}
              placeholder="123456"
            />

            <Button
              title={t('auth.otp.submit')}
              onPress={handleVerify}
              loading={loading}
              disabled={code.length < 4}
              style={styles.actionBtn}
            />

            {/* BR-32: Resend cooldown strictly driven by resendAvailableAt */}
            <View style={styles.resendRow}>
              {otpState.canResend ? (
                <Button
                  title={t('auth.otp.resend')}
                  variant="outline"
                  onPress={handleResend}
                  loading={resendLoading}
                />
              ) : (
                <Text style={[styles.timerText, { color: theme.colors.onSurface }]}>
                  {t('auth.otp.resendIn', { seconds: otpState.secondsUntilResend })}
                </Text>
              )}
            </View>
          </>
        )}
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
    justifyContent: 'center',
    minHeight: '100%',
  },
  card: {
    padding: 24,
    gap: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 14,
    opacity: 0.8,
  },
  actionBtn: {
    marginTop: 8,
  },
  resendRow: {
    alignItems: 'center',
    marginTop: 8,
  },
  timerText: {
    fontSize: 14,
    fontWeight: '500',
  },
  lockedContainer: {
    gap: 12,
    alignItems: 'flex-start',
  },
});
