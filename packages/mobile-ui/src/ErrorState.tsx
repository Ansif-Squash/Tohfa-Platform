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
    <View style={styles.container} accessibilityRole="alert">
      {displayTitle ? (
        <Text
          style={[
            styles.title,
            {
              fontSize: theme.typography.body,
              fontWeight: theme.weights.bold,
              color: theme.colors.danger,
              marginBottom: theme.spacing.xs,
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
            fontSize: theme.typography.caption,
            color: theme.colors.danger,
          },
        ]}
      >
        {displayMessage}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
    paddingHorizontal: 4,
  },
  title: {
    textAlign: 'left',
  },
  message: {
    textAlign: 'left',
  },
});
