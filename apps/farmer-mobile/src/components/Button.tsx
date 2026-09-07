import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import type { ViewStyle, TextStyle } from 'react-native';
import { theme } from '../theme';

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'outline';

export interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  testID?: string;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  style,
  textStyle,
  testID,
}) => {
  const getVariantStyles = (): { button: ViewStyle; text: TextStyle } => {
    switch (variant) {
      case 'secondary':
        return {
          button: { backgroundColor: theme.colors.secondary },
          text: { color: theme.colors.white },
        };
      case 'danger':
        return {
          button: { backgroundColor: theme.colors.danger },
          text: { color: theme.colors.white },
        };
      case 'outline':
        return {
          button: {
            backgroundColor: theme.colors.white,
            borderWidth: 1,
            borderColor: theme.colors.primary,
          },
          text: { color: theme.colors.primary },
        };
      case 'primary':
      default:
        return {
          button: { backgroundColor: theme.colors.primary },
          text: { color: theme.colors.white },
        };
    }
  };

  const vStyles = getVariantStyles();

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      disabled={disabled || loading}
      onPress={onPress}
      style={[
        styles.baseButton,
        vStyles.button,
        disabled && styles.disabledButton,
        style,
      ]}
      testID={testID}
    >
      {loading ? (
        <ActivityIndicator color={vStyles.text.color} size="small" />
      ) : (
        <Text style={[styles.baseText, vStyles.text, disabled && styles.disabledText, textStyle]}>
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  baseButton: {
    minHeight: theme.minTouchTarget,
    borderRadius: theme.radius.button,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  baseText: {
    fontSize: theme.typography.body,
    fontWeight: theme.weights.semibold,
    lineHeight: Math.round(theme.typography.body * theme.lineHeights.body),
  },
  disabledButton: {
    opacity: 0.5,
  },
  disabledText: {
    opacity: 0.8,
  },
});
