import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from './theme';
import { Icon } from './Icon';

export interface EmptyStateProps {
  title: string;
  message?: string | undefined;
  iconName?: string | undefined;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  message,
  iconName = 'inbox',
}) => {
  const theme = useTheme();

  return (
    <View style={[styles.container, { padding: theme.spacing.xxl }]}>
      <Icon color={theme.colors.onSurface} name={iconName} size={48} />
      <Text
        style={[
          styles.title,
          {
            fontSize: theme.typography.bodyLarge,
            fontWeight: theme.weights.bold,
            color: theme.colors.onSurface,
            marginTop: theme.spacing.lg,
          },
        ]}
      >
        {title}
      </Text>
      {message ? (
        <Text
          style={[
            styles.message,
            {
              fontSize: theme.typography.bodySmall,
              color: theme.colors.onSurface,
              marginTop: theme.spacing.sm,
            },
          ]}
        >
          {message}
        </Text>
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
});
