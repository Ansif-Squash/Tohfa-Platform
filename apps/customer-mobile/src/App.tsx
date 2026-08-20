/**
 * Customer app root.
 *
 * Single screen on purpose: it proves the toolchain, the design tokens, the
 * i18n layer and the API client wire together. Catalog, basket and checkout
 * land with their own stories once the Day-0 toolchain spike is signed off —
 * see README.md.
 *
 * FARM-ANONYMOUS RULE: catalog responses must never carry farmer or farm
 * identity fields. Do not "helpfully" render a farm name here later.
 */
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { ApiError, NetworkError, api } from './api/client';
import { LOCALES, setLocale, t, type Locale } from './i18n';
import { colors, radius, spacing, typography, weights, MIN_TOUCH_TARGET } from './theme';

interface HealthResponse {
  status: string;
  uptimeSeconds: number;
}

export default function App(): React.JSX.Element {
  const [locale, setLocaleState] = useState<Locale>('en');
  const [status, setStatus] = useState<'idle' | 'loading' | 'ok' | 'error'>('idle');
  const [message, setMessage] = useState<string>('');

  const check = useCallback(async () => {
    setStatus('loading');
    try {
      const health = await api.get<HealthResponse>('/healthz');
      setStatus('ok');
      setMessage(`API up, ${health.uptimeSeconds}s`);
    } catch (error) {
      setStatus('error');
      if (error instanceof NetworkError) setMessage(t('common.offline'));
      else if (error instanceof ApiError) setMessage(error.problem.title);
      else setMessage(t('error.generic'));
    }
  }, []);

  useEffect(() => {
    void check();
  }, [check]);

  const switchLocale = (next: Locale): void => {
    setLocale(next);
    setLocaleState(next);
  };

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primary} />

      <View style={styles.header}>
        <Text style={styles.headerText}>{t('app.name')}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.title}>{t('home.title')}</Text>

        {status === 'loading' ? (
          <ActivityIndicator color={colors.primary} />
        ) : (
          <Text style={styles.body}>{message}</Text>
        )}

        <Pressable style={styles.button} onPress={() => void check()} accessibilityRole="button">
          <Text style={styles.buttonText}>{t('common.retry')}</Text>
        </Pressable>
      </View>

      <View style={styles.localeRow}>
        {LOCALES.map((code) => (
          <Pressable
            key={code}
            accessibilityRole="button"
            style={[styles.localeChip, locale === code && styles.localeChipActive]}
            onPress={() => switchLocale(code)}
          >
            <Text style={locale === code ? styles.localeTextActive : styles.localeText}>
              {code.toUpperCase()}
            </Text>
          </Pressable>
        ))}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.surface },
  header: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  headerText: { color: colors.white, fontSize: typography.title, fontWeight: weights.bold },
  card: {
    margin: spacing.lg,
    padding: spacing.xl,
    backgroundColor: colors.white,
    borderRadius: radius.cardMax,
    gap: spacing.md,
  },
  title: { fontSize: typography.headline, fontWeight: weights.semibold, color: colors.onSurface },
  body: { fontSize: typography.body, color: colors.onSurface },
  button: {
    minHeight: MIN_TOUCH_TARGET,
    borderRadius: radius.button,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  buttonText: { color: colors.white, fontSize: typography.bodyLarge, fontWeight: weights.medium },
  localeRow: { flexDirection: 'row', gap: spacing.sm, paddingHorizontal: spacing.lg },
  localeChip: {
    minHeight: MIN_TOUCH_TARGET,
    minWidth: MIN_TOUCH_TARGET,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  localeChipActive: { backgroundColor: colors.primary },
  localeText: { color: colors.primary, fontWeight: weights.medium },
  localeTextActive: { color: colors.white, fontWeight: weights.semibold },
});
