import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from './theme';
import { Button } from './Button';
import { Icon } from './Icon';

export interface ErrorStateProps {
  error?: unknown;
  message?: string | undefined;
  title?: string | undefined;
  isOffline?: boolean | undefined;
  onRetry?: (() => void) | undefined;
  retryTitle?: string | undefined;
  offlineTitle?: string | undefined;
  offlineMessage?: string | undefined;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  error,
  message,
  title,
  isOffline: isOfflineProp,
  onRetry,
  retryTitle,
  offlineTitle,
  offlineMessage,
}) => {
  const theme = useTheme();

  const isNetwork =
    isOfflineProp === true ||
    (typeof error === 'object' &&
      error !== null &&
      (error as { name?: string }).name === 'NetworkError');

  const displayTitle = isNetwork
    ? (title ?? offlineTitle ?? 'You are offline')
    : title;

  const displayMessage = isNetwork
    ? (message ??
      offlineMessage ??
      'You are currently offline. Your work and drafts are saved safely on this device. Nothing has been submitted yet.')
    : (message ?? ((error as Error)?.message || 'Something went wrong. Please try again.'));

  const retryButtonTitle = retryTitle ?? (isNetwork ? 'Retry Connection' : 'Retry');

  return (
    <View style={[styles.container, { padding: theme.spacing.xxl }]} accessibilityRole="alert">
      <Icon
        color={isNetwork ? theme.colors.secondary : theme.colors.danger}
        name={isNetwork ? 'wifi_off' : 'error_outline'}
        size={48}
      />
      {displayTitle ? (
        <Text
          style={[
            styles.title,
            {
              fontSize: theme.typography.title,
              fontWeight: theme.weights.bold,
              color: theme.colors.onSurface,
              marginTop: theme.spacing.md,
            },
          ]}
        >
          {displayTitle}
        </Text>
      ) : null}
      <Text
        style={[
          styles.message,
          {
            fontSize: theme.typography.body,
            color: theme.colors.onSurface,
            marginTop: theme.spacing.sm,
            marginBottom: theme.spacing.lg,
          },
        ]}
      >
        {displayMessage}
      </Text>
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    textAlign: 'center',
  },
  message: {
    textAlign: 'center',
  },
  button: {
    minWidth: 140,
  },
});
