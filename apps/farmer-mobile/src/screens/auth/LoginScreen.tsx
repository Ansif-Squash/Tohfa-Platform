import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, ScrollView } from 'react-native';
import { useTheme } from '../../theme';
import { t } from '../../i18n';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { ErrorState } from '../../components/ErrorState';
import { loginWithPassword, requestOtp, resolveRouteAfterAuth, fetchMe } from '../../api/auth';
import { ApiError } from '../../api/client';

interface LoginScreenProps {
  onNavigate: (screen: 'Otp' | 'ForgotPassword' | 'ApplicationStatus' | 'MainTabs' | 'Register', params?: Record<string, string | number | undefined>) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onNavigate }) => {
  const theme = useTheme();
  const [tab, setTab] = useState<'PASSWORD' | 'OTP'>('PASSWORD');
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function handlePasswordLogin() {
    if (!mobile.trim() || !password.trim()) return;
    setLoading(true);
    setErrorMsg(null);

    try {
      const cleanMobile = mobile.startsWith('+') ? mobile.trim() : `+91${mobile.trim()}`;
      await loginWithPassword({ mobile: cleanMobile, password });
      const me = await fetchMe();
      const route = resolveRouteAfterAuth(me);
      onNavigate(route.name, route.params);
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        if ((err.problem.code as string) === 'UNAUTHORIZED' || (err.problem.code as string) === 'UNAUTHENTICATED') {
          setErrorMsg(t('error.UNAUTHORIZED'));
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

  async function handleRequestOtp() {
    if (!mobile.trim()) return;
    setLoading(true);
    setErrorMsg(null);

    try {
      const cleanMobile = mobile.startsWith('+') ? mobile.trim() : `+91${mobile.trim()}`;
      const res = await requestOtp({ mobile: cleanMobile, purpose: 'LOGIN' });
      onNavigate('Otp', {
        mobile: cleanMobile,
        resendAvailableAt: res.resendAvailableAt,
        attemptsRemaining: res.attemptsRemaining,
      });
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setErrorMsg(t(`error.${err.problem.code}` as unknown as Parameters<typeof t>[0]) || t('error.generic'));
      } else {
        setErrorMsg(t('error.generic'));
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.surface }]} contentContainerStyle={styles.content}>
      <Card style={styles.card}>
        <Text style={[styles.title, { color: theme.colors.onSurface }]}>
          {t('auth.login.title')}
        </Text>
        <Text style={[styles.subtitle, { color: theme.colors.grey700 }]}>
          {t('auth.login.subtitle')}
        </Text>

        <View style={[styles.tabContainer, { backgroundColor: theme.colors.grey100 }]}>
          <TouchableOpacity
            style={[styles.tab, tab === 'PASSWORD' && { backgroundColor: theme.colors.surface }]}
            onPress={() => { setTab('PASSWORD'); setErrorMsg(null); }}
          >
            <Text style={[styles.tabText, { color: tab === 'PASSWORD' ? theme.colors.primary : theme.colors.grey700 }]}>
              {t('auth.login.tabPassword')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, tab === 'OTP' && { backgroundColor: theme.colors.surface }]}
            onPress={() => { setTab('OTP'); setErrorMsg(null); }}
          >
            <Text style={[styles.tabText, { color: tab === 'OTP' ? theme.colors.primary : theme.colors.grey700 }]}>
              {t('auth.login.tabOtp')}
            </Text>
          </TouchableOpacity>
        </View>

        {errorMsg ? <ErrorState message={errorMsg} onRetry={() => setErrorMsg(null)} /> : null}

        <Input
          label={t('auth.login.mobile')}
          value={mobile}
          onChangeText={setMobile}
          keyboardType="phone-pad"
          placeholder="9876543210"
        />

        {tab === 'PASSWORD' ? (
          <>
            <Input
              label={t('auth.login.password')}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
            <TouchableOpacity onPress={() => onNavigate('ForgotPassword')} style={styles.forgotBtn}>
              <Text style={[styles.forgotText, { color: theme.colors.primary }]}>
                {t('auth.login.forgotPassword')}
              </Text>
            </TouchableOpacity>

            <Button
              title={t('auth.login.submit')}
              onPress={handlePasswordLogin}
              loading={loading}
              disabled={!mobile || !password}
              style={styles.submitBtn}
            />
          </>
        ) : (
          <Button
            title={t('auth.login.requestOtp')}
            onPress={handleRequestOtp}
            loading={loading}
            disabled={!mobile}
            style={styles.submitBtn}
          />
        )}

        <Button
          title={t('registration.title')}
          variant="outline"
          onPress={() => onNavigate('Register')}
          style={styles.registerBtn}
        />
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
  title: {
    fontSize: 22,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 14,
  },
  tabContainer: {
    flexDirection: 'row',
    borderRadius: 8,
    padding: 4,
    marginVertical: 8,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 6,
  },
  tabText: {
    fontWeight: '600',
    fontSize: 14,
  },
  forgotBtn: {
    alignSelf: 'flex-end',
    marginVertical: 4,
  },
  forgotText: {
    fontSize: 13,
    fontWeight: '600',
  },
  submitBtn: {
    marginTop: 8,
  },
  registerBtn: {
    marginTop: 4,
  },
});
