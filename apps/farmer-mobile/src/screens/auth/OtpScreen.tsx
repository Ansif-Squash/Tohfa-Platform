import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text, ScrollView } from 'react-native';
import { useTheme } from '../../theme';
import { t } from '../../i18n';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { Badge } from '../../components/Badge';
import { ErrorState } from '../../components/ErrorState';
import { verifyOtp, requestOtp, renderOtpState, resolveRouteAfterAuth, fetchMe } from '../../api/auth';
import { ApiError } from '../../api/client';

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
  const theme = useTheme();
  const [code, setCode] = useState('');
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
      await verifyOtp({ mobile, code: code.trim(), purpose: 'LOGIN' });
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
    setResendLoading(true);
    setErrorMsg(null);

    try {
      const res = await requestOtp({ mobile, purpose: 'LOGIN' });
      // BR-32: Read server fields directly from resend response
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

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.surface }]} contentContainerStyle={styles.content}>
      <Card style={styles.card}>
        {otpState.isLocked ? (
          <View style={styles.lockedContainer}>
            <Badge label={t('auth.otp.lockedTitle')} variant="danger" />
            <Text style={[styles.title, { color: theme.colors.onSurface }]}>
              {t('auth.otp.lockedTitle')}
            </Text>
            <Text style={[styles.subtitle, { color: theme.colors.grey700 }]}>
              {t('auth.otp.lockedSubtitle')}
            </Text>

            <Button
              title={t('auth.otp.resendNow')}
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
              {/* BR-32: attempts indicator comes from attemptsRemaining */}
              <Badge
                label={t('auth.otp.attemptsRemaining', { count: otpState.attemptsRemaining })}
                variant={otpState.attemptsRemaining <= 1 ? 'danger' : 'info'}
              />
            </View>

            <Text style={[styles.subtitle, { color: theme.colors.grey700 }]}>
              {t('auth.otp.subtitle', { mobile })}
            </Text>

            {errorMsg ? <ErrorState message={errorMsg} onRetry={() => setErrorMsg(null)} /> : null}

            <Input
              label="OTP Code"
              value={code}
              onChangeText={setCode}
              keyboardType="number-pad"
              maxLength={6}
              placeholder="123456"
            />

            <Button
              title={t('common.continue')}
              onPress={handleVerify}
              loading={loading}
              disabled={code.length < 4}
              style={styles.actionBtn}
            />

            {/* BR-32: Resend timer counts down from resendAvailableAt */}
            <View style={styles.resendRow}>
              {otpState.canResend ? (
                <Button
                  title={t('auth.otp.resendNow')}
                  variant="outline"
                  onPress={handleResend}
                  loading={resendLoading}
                />
              ) : (
                <Text style={[styles.timerText, { color: theme.colors.grey700 }]}>
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
