import React, { useState } from 'react';
import { StyleSheet, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useTheme } from '../../theme';
import { t } from '../../i18n';
import { Button, Card, ErrorState, Input } from '@tohfa/mobile-ui';
import { forgotPassword } from '../../api/auth';
import { ApiError } from '../../api/client';

interface ForgotPasswordScreenProps {
  onNavigate: (screen: 'Login' | 'ResetPassword', params?: { challengeId?: string; mobile?: string }) => void;
}

export const ForgotPasswordScreen: React.FC<ForgotPasswordScreenProps> = ({ onNavigate }) => {
  const theme = useTheme();
  const [mobile, setMobile] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function handleSubmit() {
    if (!mobile.trim()) return;
    setLoading(true);
    setErrorMsg(null);

    try {
      const cleanMobile = mobile.startsWith('+') ? mobile.trim() : `+91${mobile.trim()}`;
      const res = await forgotPassword({ mobile: cleanMobile });
      onNavigate('ResetPassword', { challengeId: res.challengeId, mobile: cleanMobile });
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setErrorMsg(err.problem.detail || t('error.generic'));
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
          {t('auth.forgot.title')}
        </Text>
        <Text style={[styles.subtitle, { color: theme.colors.onSurface }]}>
          {t('auth.forgot.subtitle')}
        </Text>

        {errorMsg ? <ErrorState message={errorMsg} onRetry={() => setErrorMsg(null)} /> : null}

        <Input
          label={t('auth.login.mobile')}
          value={mobile}
          onChangeText={setMobile}
          keyboardType="phone-pad"
          maxLength={13}
          placeholder="9876543210"
        />

        <Button
          title={t('auth.forgot.submit')}
          onPress={handleSubmit}
          loading={loading}
          disabled={!mobile.trim()}
          style={styles.submitBtn}
        />

        <TouchableOpacity onPress={() => onNavigate('Login')} style={styles.backBtn}>
          <Text style={[styles.backText, { color: theme.colors.primary }]}>
            {t('auth.forgot.back')}
          </Text>
        </TouchableOpacity>
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
  submitBtn: {
    marginTop: 8,
  },
  backBtn: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  backText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
