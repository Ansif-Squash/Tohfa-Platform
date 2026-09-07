import React from 'react';
import { View, StyleSheet, Text, ScrollView } from 'react-native';
import { useTheme } from '../../theme';
import { t } from '../../i18n';
import { Button, Card, Icon } from '@tohfa/mobile-ui';

interface OnboardingScreenProps {
  onNavigate: (screen: 'Register' | 'Login') => void;
}

export const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ onNavigate }) => {
  const theme = useTheme();

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.surface }]}
      contentContainerStyle={styles.content}
    >
      <View style={styles.heroSection}>
        <View style={[styles.iconCircle, { backgroundColor: theme.colors.primary }]}>
          <Icon name="eco" size={60} color={theme.colors.white} />
        </View>
        <Text style={[styles.brandText, { color: theme.colors.primary }]}>
          {t('app.name')}
        </Text>
      </View>

      <Card style={styles.card}>
        <Text style={[styles.title, { color: theme.colors.onSurface }]}>
          {t('onboarding.title')}
        </Text>
        <Text style={[styles.subtitle, { color: theme.colors.onSurface }]}>
          {t('onboarding.subtitle')}
        </Text>

        <View style={styles.actionGroup}>
          <Button
            title={t('onboarding.getStarted')}
            onPress={() => onNavigate('Register')}
            style={styles.getStartedBtn}
          />
          <Button
            title={t('onboarding.login')}
            variant="outline"
            onPress={() => onNavigate('Login')}
            style={styles.loginBtn}
          />
        </View>
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 24,
    justifyContent: 'center',
    minHeight: '100%',
  },
  heroSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  brandText: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: 2,
  },
  card: {
    padding: 24,
    gap: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    lineHeight: 28,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    opacity: 0.8,
  },
  actionGroup: {
    marginTop: 12,
    gap: 12,
  },
  getStartedBtn: {
    width: '100%',
  },
  loginBtn: {
    width: '100%',
  },
});
