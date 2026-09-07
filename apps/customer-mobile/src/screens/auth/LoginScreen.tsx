import React, { useState } from 'react';
import { StyleSheet, TouchableOpacity, Text, ScrollView } from 'react-native';
import { useTheme } from '../../theme';
import { t } from '../../i18n';
import { Button, Card, ErrorState, Input } from '@tohfa/mobile-ui';
import { loginWithPassword, fetchMe } from '../../api/auth';
import { ApiError } from '../../api/client';

interface LoginScreenProps {
  onNavigate: (screen: 'Home' | 'Register' | 'ForgotPassword') => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onNavigate }) => {
  const theme = useTheme();
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function handleLogin() {
    if (!mobile.trim() || !password.trim()) return;
    setLoading(true);
    setErrorMsg(null);

    try {
      const cleanMobile = mobile.startsWith('+') ? mobile.trim() : `+91${mobile.trim()}`;
      await loginWithPassword({ mobile: cleanMobile, password });
      await fetchMe();
      onNavigate('Home');
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        if (err.problem.code === 'UNAUTHENTICATED' || err.problem.status === 401) {
          setErrorMsg(t('error.UNAUTHORIZED'));
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

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.surface }]}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <Card style={styles.card}>
        <Text style={[styles.title, { color: theme.colors.onSurface }]}>
          {t('auth.login.title')}
        </Text>
        <Text style={[styles.subtitle, { color: theme.colors.onSurface }]}>
          {t('auth.login.subtitle')}
        </Text>

        {errorMsg ? <ErrorState message={errorMsg} onRetry={() => setErrorMsg(null)} /> : null}

        <Input
          label={t('auth.login.mobile')}
          value={mobile}
          onChangeText={setMobile}
          keyboardType="phone-pad"
          placeholder="9876543210"
        />

        <Input
          label={t('auth.login.password')}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          placeholder="••••••••••"
        />

        <TouchableOpacity onPress={() => onNavigate('ForgotPassword')} style={styles.forgotBtn}>
          <Text style={[styles.forgotText, { color: theme.colors.primary }]}>
            {t('auth.login.forgotPassword')}
          </Text>
        </TouchableOpacity>

        <Button
          title={t('auth.login.submit')}
          onPress={handleLogin}
          loading={loading}
          disabled={!mobile || !password}
          style={styles.submitBtn}
        />

        <Button
          title={t('auth.login.noAccount')}
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
    opacity: 0.8,
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
