import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../theme';
import { Button } from './Button';
import { Icon } from './Icon';
import { t } from '../i18n';

export interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  message = t('error.generic'),
  onRetry,
}) => {
  return (
    <View style={styles.container}>
      <Icon color={theme.colors.danger} name="error_outline" size={48} />
      <Text style={styles.message}>{message}</Text>
      {onRetry ? (
        <Button
          onPress={onRetry}
          style={styles.button}
          title={t('common.retry')}
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
  message: {
    fontSize: theme.typography.body,
    color: theme.colors.onSurface,
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    textAlign: 'center',
  },
  button: {
    minWidth: 120,
  },
});
