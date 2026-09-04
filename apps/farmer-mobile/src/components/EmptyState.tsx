import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../theme';
import { Icon } from './Icon';

export interface EmptyStateProps {
  title: string;
  message?: string;
  iconName?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  message,
  iconName = 'inbox',
}) => {
  return (
    <View style={styles.container}>
      <Icon color={theme.colors.onSurface} name={iconName} size={48} />
      <Text style={styles.title}>{title}</Text>
      {message ? <Text style={styles.message}>{message}</Text> : null}
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
    fontSize: theme.typography.bodyLarge,
    fontWeight: theme.weights.bold,
    color: theme.colors.onSurface,
    marginTop: theme.spacing.lg,
    textAlign: 'center',
  },
  message: {
    fontSize: theme.typography.bodySmall,
    color: theme.colors.onSurface,
    marginTop: theme.spacing.sm,
    textAlign: 'center',
  },
});
