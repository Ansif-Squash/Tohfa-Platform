import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { ViewStyle } from 'react-native';
import { useTheme } from './theme';

export type BadgeVariant = 'success' | 'danger' | 'warning' | 'info';

export interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  style?: ViewStyle;
}

export const Badge: React.FC<BadgeProps> = ({ label, variant = 'info', style }) => {
  const theme = useTheme();

  const getBadgeColors = (): { bg: string; text: string } => {
    switch (variant) {
      case 'success':
        return { bg: theme.colors.success, text: theme.colors.white };
      case 'danger':
        return { bg: theme.colors.danger, text: theme.colors.white };
      case 'warning':
        return { bg: theme.colors.secondary, text: theme.colors.white };
      case 'info':
      default:
        return { bg: theme.colors.primary, text: theme.colors.white };
    }
  };

  const colors = getBadgeColors();

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: colors.bg,
          paddingHorizontal: theme.spacing.sm,
          paddingVertical: theme.spacing.xs,
          borderRadius: theme.radius.pill,
        },
        style,
      ]}
    >
      <Text
        style={[
          styles.text,
          {
            color: colors.text,
            fontSize: theme.typography.caption,
            fontWeight: theme.weights.medium,
          },
        ]}
      >
        {label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
  },
  text: {},
});
