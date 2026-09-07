import React, { useState } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
} from 'react-native';
import type { TextInputProps, ViewStyle } from 'react-native';
import { useTheme } from './theme';

export interface InputProps extends TextInputProps {
  label?: string | undefined;
  error?: string | undefined;
  containerStyle?: ViewStyle | undefined;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  containerStyle,
  style,
  onFocus,
  onBlur,
  ...rest
}) => {
  const theme = useTheme();
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={[styles.container, { marginBottom: theme.spacing.lg }, containerStyle]}>
      {label ? (
        <Text
          style={[
            styles.label,
            {
              fontSize: theme.typography.bodySmall,
              fontWeight: theme.weights.medium,
              color: theme.colors.onSurface,
              marginBottom: theme.spacing.xs,
            },
          ]}
        >
          {label}
        </Text>
      ) : null}
      <TextInput
        onBlur={(e) => {
          setIsFocused(false);
          onBlur?.(e);
        }}
        onFocus={(e) => {
          setIsFocused(true);
          onFocus?.(e);
        }}
        accessibilityLabel={label}
        placeholderTextColor={theme.colors.onSurface}
        style={[
          styles.input,
          {
            minHeight: theme.minTouchTarget,
            borderRadius: theme.radius.input,
            borderColor: theme.colors.surface,
            backgroundColor: theme.colors.white,
            paddingHorizontal: theme.spacing.md,
            paddingVertical: theme.spacing.sm,
            fontSize: theme.typography.body,
            color: theme.colors.onSurface,
          },
          isFocused && [styles.focusedInput, { borderColor: theme.colors.primary }],
          Boolean(error) && [styles.errorInput, { borderColor: theme.colors.danger }],
          style,
        ]}
        {...rest}
      />
      {error ? (
        <Text
          style={[
            styles.errorText,
            {
              fontSize: theme.typography.caption,
              color: theme.colors.danger,
              marginTop: theme.spacing.xs,
            },
          ]}
        >
          {error}
        </Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {},
  label: {},
  input: {
    borderWidth: 1,
  },
  focusedInput: {
    borderWidth: 2,
  },
  errorInput: {},
  errorText: {},
});
