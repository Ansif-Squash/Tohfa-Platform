import React from 'react';
import { View, StyleSheet } from 'react-native';
import type { ViewStyle } from 'react-native';
import { theme } from '../theme';
import { Button } from './Button';
import { t } from '../i18n';

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
  saveTitle,
  cancelTitle,
  loading = false,
  disabled = false,
  style,
}) => {
  return (
    <View style={[styles.container, style]}>
      <Button
        disabled={loading}
        onPress={onCancel}
        style={styles.button}
        title={cancelTitle ?? t('common.cancel')}
        variant="outline"
      />
      <Button
        disabled={disabled}
        loading={loading}
        onPress={onSave}
        style={styles.button}
        title={saveTitle ?? t('common.continue')}
        variant="primary"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.white,
    borderTopWidth: 1,
    borderTopColor: theme.colors.surface,
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  button: {
    flex: 1,
  },
});
