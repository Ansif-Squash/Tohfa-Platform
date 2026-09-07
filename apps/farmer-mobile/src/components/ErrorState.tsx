import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../theme';
import { Button } from './Button';
import { Icon } from './Icon';
import { t } from '../i18n';
import { NetworkError } from '../api/client';

export interface ErrorStateProps {
  error?: unknown;
  message?: string | undefined;
  title?: string | undefined;
  isOffline?: boolean | undefined;
  onRetry?: (() => void) | undefined;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  error,
  message,
  title,
  isOffline: isOfflineProp,
  onRetry,
}) => {
  const isNetwork =
    isOfflineProp === true ||
    error instanceof NetworkError ||
    (typeof error === 'object' && error !== null && (error as { name?: string }).name === 'NetworkError');

  const displayTitle = isNetwork
    ? (title ?? 'You are offline')
    : title;

  const displayMessage = isNetwork
    ? (message ?? 'You are currently offline. Your work and drafts are saved safely on this device. Nothing has been submitted yet.')
    : (message ?? (error instanceof Error ? error.message : t('error.generic')));

  const retryButtonTitle = isNetwork ? 'Retry Connection' : t('common.retry');

  return (
    <View style={styles.container} accessibilityRole="alert">
      <Icon
        color={isNetwork ? theme.colors.secondary : theme.colors.danger}
        name={isNetwork ? 'wifi_off' : 'error_outline'}
        size={48}
      />
      {displayTitle ? <Text style={styles.title}>{displayTitle}</Text> : null}
      <Text style={styles.message}>{displayMessage}</Text>
      {onRetry ? (
        <Button
          onPress={onRetry}
          style={styles.button}
          title={retryButtonTitle}
          variant="outline"
        />
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: theme.spacing.xxl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: theme.typography.title,
    fontWeight: theme.weights.bold,
    color: theme.colors.onSurface,
    marginTop: theme.spacing.md,
    textAlign: 'center',
  },
  message: {
    fontSize: theme.typography.body,
    color: theme.colors.onSurface,
    marginTop: theme.spacing.sm,
    marginBottom: theme.spacing.lg,
    textAlign: 'center',
  },
  button: {
    minWidth: 140,
  },
});
