import React, { useEffect } from 'react';
import { View, StyleSheet, Text, ActivityIndicator } from 'react-native';
import { theme } from '../../theme';
import { t } from '../../i18n';
import { getAccessToken } from '../../storage/tokenStorage';
import { fetchMe } from '../../api/auth';
import { Icon } from '@tohfa/mobile-ui';

interface SplashScreenProps {
  onNavigate: (screen: 'Onboarding' | 'Home') => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onNavigate }) => {
  useEffect(() => {
    let active = true;

    async function checkAuth() {
      try {
        const token = await getAccessToken();
        if (!token) {
          if (active) onNavigate('Onboarding');
          return;
        }

        const me = await fetchMe();
        if (active) {
          if (me.status === 'ACTIVE') {
            onNavigate('Home');
          } else {
            onNavigate('Onboarding');
          }
        }
      } catch {
        if (active) onNavigate('Onboarding');
      }
    }

    void checkAuth();

    return () => {
      active = false;
    };
  }, [onNavigate]);

  return (
    <View style={styles.container}>
      <Icon name="eco" size={64} color={theme.colors.white} />
      <Text style={styles.brandTitle}>{t('app.name')}</Text>
      <ActivityIndicator size="small" color={theme.colors.white} style={styles.spinner} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandTitle: {
    fontSize: theme.typography.display,
    fontWeight: theme.weights.bold,
    color: theme.colors.white,
    marginTop: theme.spacing.md,
    letterSpacing: 2,
  },
  spinner: {
    marginTop: theme.spacing.xl,
  },
});
