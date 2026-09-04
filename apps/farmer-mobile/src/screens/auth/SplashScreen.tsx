import React, { useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { useTheme } from '../../theme';
import { t } from '../../i18n';
import { Button } from '../../components/Button';
import { Icon } from '../../components/Icon';
import { fetchMe, resolveRouteAfterAuth } from '../../api/auth';
import { getAccessToken } from '../../storage/tokenStorage';

interface SplashScreenProps {
  onNavigate: (screen: 'Login' | 'ApplicationStatus' | 'MainTabs', params?: Record<string, string | number | undefined>) => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onNavigate }) => {
  const theme = useTheme();

  useEffect(() => {
    let active = true;

    async function checkSession() {
      try {
        const token = await getAccessToken();
        if (!token) {
          if (active) onNavigate('Login');
          return;
        }

        const me = await fetchMe();
        if (!active) return;

        const route = resolveRouteAfterAuth(me);
        onNavigate(route.name, route.params);
      } catch {
        if (active) onNavigate('Login');
      }
    }

    const timer = setTimeout(checkSession, 1200);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [onNavigate]);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.surface }]}>
      <View style={styles.brandContainer}>
        <Icon name="agriculture" size={64} color={theme.colors.primary} />
        <View style={styles.textContainer}>
          <Button
            title={t('auth.splash.welcome')}
            variant="outline"
            style={styles.titleBadge}
            onPress={() => {}}
          />
        </View>
      </View>
      <ActivityIndicator size="large" color={theme.colors.primary} style={styles.loader} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  brandContainer: {
    alignItems: 'center',
    gap: 16,
  },
  textContainer: {
    alignItems: 'center',
  },
  titleBadge: {
    borderWidth: 0,
    backgroundColor: 'transparent',
  },
  loader: {
    marginTop: 32,
  },
});
