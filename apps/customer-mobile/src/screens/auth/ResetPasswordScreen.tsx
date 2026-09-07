import React, { useState } from 'react';
import { StyleSheet, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useTheme } from '../../theme';
import { t } from '../../i18n';
import { Button, Card, ErrorState, Input } from '@tohfa/mobile-ui';
import { resetPassword } from '../../api/auth';
import { ApiError } from '../../api/client';

interface ResetPasswordScreenProps {
  challengeId: string;
  mobile?: string | undefined;
  onNavigate: (screen: 'Login') => void;
}

export const ResetPasswordScreen: React.FC<ResetPasswordScreenProps> = ({
  challengeId,
  mobile,
  onNavigate,
}) => {
  const theme = useTheme();
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const isValid = code.trim().length === 6 && newPassword.length >= 10;

  async function handleSubmit() {
    if (!isValid) return;
    setLoading(true);
    setErrorMsg(null);

    try {
      await resetPassword({
        challengeId,
        code: code.trim(),
        newPassword,
      });
      onNavigate('Login');
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        if (err.is('OTP_INVALID')) {
          setErrorMsg(t('error.OTP_INVALID'));
        } else if (err.is('OTP_LOCKED')) {
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

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.surface }]}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <Card style={styles.card}>
        <Text style={[styles.title, { color: theme.colors.onSurface }]}>
          {t('auth.reset.title')}
        </Text>
        <Text style={[styles.subtitle, { color: theme.colors.onSurface }]}>
          {mobile ? t('auth.otp.subtitle', { mobile }) : t('auth.reset.subtitle')}
        </Text>

        {errorMsg ? <ErrorState message={errorMsg} onRetry={() => setErrorMsg(null)} /> : null}

        <Input
          label={t('auth.reset.code')}
          value={code}
          onChangeText={setCode}
          keyboardType="number-pad"
          maxLength={6}
          placeholder="123456"
        />

        <Input
          label={t('auth.reset.newPassword')}
          value={newPassword}
          onChangeText={setNewPassword}
          secureTextEntry
          placeholder="••••••••••"
          error={newPassword.length > 0 && newPassword.length < 10 ? 'At least 10 characters required' : undefined}
        />

        <Button
          title={t('auth.reset.submit')}
          onPress={handleSubmit}
          loading={loading}
          disabled={!isValid}
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
