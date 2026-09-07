import React, { useState } from 'react';
import { View, StyleSheet, Text, ScrollView } from 'react-native';
import { useTheme } from '../../theme';
import { t } from '../../i18n';
import { Button, Card, Input } from '@tohfa/mobile-ui';
import { forgotPassword } from '../../api/auth';

interface ForgotPasswordScreenProps {
  onNavigate: (screen: 'Login') => void;
}

export const ForgotPasswordScreen: React.FC<ForgotPasswordScreenProps> = ({ onNavigate }) => {
  const theme = useTheme();
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

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.surface }]} contentContainerStyle={styles.content}>
      <Card style={styles.card}>
        {submitted ? (
          <View style={styles.successView}>
            <Text style={[styles.title, { color: theme.colors.onSurface }]}>
              {t('auth.forgot.successTitle')}
            </Text>
            <Text style={[styles.subtitle, { color: theme.colors.grey700 }]}>
              {t('auth.forgot.successSubtitle')}
            </Text>
            <Button
              title={t('auth.forgot.backToLogin')}
              onPress={() => onNavigate('Login')}
              style={styles.actionBtn}
            />
          </View>
        ) : (
          <>
            <Text style={[styles.title, { color: theme.colors.onSurface }]}>
              {t('auth.forgot.title')}
            </Text>
            <Text style={[styles.subtitle, { color: theme.colors.grey700 }]}>
              {t('auth.forgot.subtitle')}
            </Text>

            <Input
              label={t('auth.login.mobile')}
              value={mobile}
              onChangeText={setMobile}
              keyboardType="phone-pad"
              placeholder="9876543210"
            />

            <Button
              title={t('common.submit')}
              onPress={handleSubmit}
              loading={loading}
              disabled={!mobile}
              style={styles.actionBtn}
            />

            <Button
              title={t('auth.forgot.backToLogin')}
              variant="outline"
              onPress={() => onNavigate('Login')}
            />
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
  successView: {
    gap: 16,
  },
});
