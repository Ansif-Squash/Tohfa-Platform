import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Text, ScrollView, ActivityIndicator } from 'react-native';
import { useTheme } from '../../theme';
import { t } from '../../i18n';
import { Card, Button, Badge, Icon } from '@tohfa/mobile-ui';
import { fetchMe, logout, type CustomerUser } from '../../api/auth';

interface HomeScreenProps {
  onNavigate: (screen: 'Onboarding' | 'Login') => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ onNavigate }) => {
  const theme = useTheme();
  const [user, setUser] = useState<CustomerUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    let mounted = true;
    async function loadUser() {
      try {
        const me = await fetchMe();
        if (mounted) setUser(me);
      } catch {
        // Fallback or session expired
      } finally {
        if (mounted) setLoading(false);
      }
    }
    void loadUser();
    return () => {
      mounted = false;
    };
  }, []);

  async function handleLogout() {
    setLoggingOut(true);
    await logout();
    setLoggingOut(false);
    onNavigate('Onboarding');
  }

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: theme.colors.surface }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.surface }]}
      contentContainerStyle={styles.content}
    >
      <View style={styles.topBar}>
        <View style={styles.brandRow}>
          <Icon name="eco" size={32} color={theme.colors.primary} />
          <Text style={[styles.brandTitle, { color: theme.colors.primary }]}>
            {t('app.name')}
          </Text>
        </View>
        <Badge label={user?.status ?? 'ACTIVE'} variant="success" />
      </View>

      <Card style={styles.welcomeCard}>
        <Text style={[styles.title, { color: theme.colors.onSurface }]}>
          {t('home.welcome', { name: user?.fullName || 'Customer' })}
        </Text>
        <Text style={[styles.subtitle, { color: theme.colors.onSurface }]}>
          {t('home.subtitle')}
        </Text>
        {user?.mobile ? (
          <Text style={[styles.mobileInfo, { color: theme.colors.onSurface }]}>
            📱 {user.mobile}
          </Text>
        ) : null}
      </Card>

      <Card style={styles.produceCard}>
        <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
          {t('home.title')}
        </Text>
        <Text style={[styles.catalogHint, { color: theme.colors.onSurface }]}>
          Browse fresh Nilgiri harvest directly from verified organic farms.
        </Text>
      </Card>

      <Button
        title={t('auth.logout')}
        variant="outline"
        onPress={handleLogout}
        loading={loggingOut}
        style={styles.logoutBtn}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
    gap: 16,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  brandTitle: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  welcomeCard: {
    padding: 20,
    gap: 10,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 14,
    opacity: 0.8,
  },
  mobileInfo: {
    fontSize: 13,
    fontWeight: '500',
    opacity: 0.7,
  },
  produceCard: {
    padding: 20,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  catalogHint: {
    fontSize: 14,
    opacity: 0.8,
  },
  logoutBtn: {
    marginTop: 16,
  },
});
