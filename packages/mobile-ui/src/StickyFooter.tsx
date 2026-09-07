import React from 'react';
import { View, StyleSheet } from 'react-native';
import type { ViewStyle } from 'react-native';
import { useTheme } from './theme';
import { Button } from './Button';

export interface StickyFooterProps {
  onSave: () => void;
  onCancel: () => void;
  saveTitle?: string;
  cancelTitle?: string;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
}

export const StickyFooter: React.FC<StickyFooterProps> = ({
  onSave,
  onCancel,
  saveTitle = 'Continue',
  cancelTitle = 'Cancel',
  loading = false,
  disabled = false,
  style,
}) => {
  const theme = useTheme();

  return (
    <View
      style={[
        styles.container,
        {
          padding: theme.spacing.lg,
          backgroundColor: theme.colors.white,
          borderTopColor: theme.colors.surface,
          gap: theme.spacing.md,
        },
        style,
      ]}
    >
      <Button
        disabled={loading}
        onPress={onCancel}
        style={styles.button}
        title={cancelTitle}
        variant="outline"
      />
      <Button
        disabled={disabled}
        loading={loading}
        onPress={onSave}
        style={styles.button}
        title={saveTitle}
        variant="primary"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderTopWidth: 1,
    flexDirection: 'row',
  },
  button: {
    flex: 1,
  },
});
