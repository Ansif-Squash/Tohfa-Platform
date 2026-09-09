import React, { useState } from 'react';
import { View, StyleSheet, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useTheme } from '../../theme';
import { t } from '../../i18n';
import { Button, Card, ErrorState, Input, Badge } from '@tohfa/mobile-ui';
import { registerCustomer } from '../../api/auth';
import { ApiError } from '../../api/client';

interface RegisterScreenProps {
  onNavigate: (
    screen: 'Otp' | 'Login',
    params?: {
      mobile?: string | undefined;
      challengeId?: string | undefined;
      resendAvailableAt?: string | undefined;
      attemptsRemaining?: number | undefined;
      _mockCode?: string | undefined;
    } | undefined,
  ) => void;
}

export const RegisterScreen: React.FC<RegisterScreenProps> = ({ onNavigate }) => {
  const theme = useTheme();
  const [fullName, setFullName] = useState('');
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const isValid = fullName.trim().length >= 2 && mobile.trim().length >= 10 && password.length >= 10;

  async function handleRegister() {
    if (!isValid) return;
    setLoading(true);
    setErrorMsg(null);

    try {
      const cleanMobile = mobile.startsWith('+') ? mobile.trim() : `+91${mobile.trim()}`;
      const res = await registerCustomer({
        fullName: fullName.trim(),
        mobile: cleanMobile,
        password,
      });

      onNavigate('Otp', {
        mobile: cleanMobile,
        challengeId: res.challengeId,
        resendAvailableAt: res.resendAvailableAt,
        attemptsRemaining: res.attemptsRemaining ?? 3,
        _mockCode: res._mockCode,
      });
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        if (err.problem.code === 'CONFLICT') {
          setErrorMsg(err.problem.detail || 'This mobile number is already registered.');
        } else if (err.problem.code === 'VALIDATION_FAILED') {
          setErrorMsg(err.problem.detail || 'Please check the entered details.');
        } else {
          setErrorMsg(err.problem.title || t('error.generic'));
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
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.colors.onSurface }]}>
            {t('auth.register.title')}
          </Text>
          <Badge label="Instant Access" variant="success" />
        </View>

        <Text style={[styles.subtitle, { color: theme.colors.onSurface }]}>
          {t('auth.register.subtitle')}
        </Text>

        <View style={[styles.instantBanner, { backgroundColor: theme.colors.surface }]}>
          <Text style={[styles.instantText, { color: theme.colors.primary }]}>
            ✓ {t('auth.register.instantNote')}
          </Text>
        </View>

        {errorMsg ? <ErrorState message={errorMsg} onRetry={() => setErrorMsg(null)} /> : null}

        <Input
          label={t('auth.register.fullName')}
          value={fullName}
          onChangeText={setFullName}
          placeholder="e.g. Anand Kumar"
        />

        <Input
          label={t('auth.register.mobile')}
          value={mobile}
          onChangeText={setMobile}
          keyboardType="phone-pad"
          maxLength={13}
          placeholder="9876543210"
        />

        <Input
          label={t('auth.register.password')}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          placeholder="••••••••••"
          error={password.length > 0 && password.length < 10 ? 'At least 10 characters required' : undefined}
        />

        <Button
          title={t('auth.register.submit')}
          onPress={handleRegister}
          loading={loading}
          disabled={!isValid}
          style={styles.submitBtn}
        />

        <TouchableOpacity onPress={() => onNavigate('Login')} style={styles.hasAccountBtn}>
          <Text style={[styles.hasAccountText, { color: theme.colors.primary }]}>
            {t('auth.register.hasAccount')}
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 14,
    opacity: 0.8,
  },
  instantBanner: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  instantText: {
    fontSize: 13,
    fontWeight: '600',
  },
  submitBtn: {
    marginTop: 8,
  },
  hasAccountBtn: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  hasAccountText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
