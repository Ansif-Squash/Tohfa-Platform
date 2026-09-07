import React from 'react';
import { View, StyleSheet } from 'react-native';
import type { ViewStyle, StyleProp, AccessibilityRole } from 'react-native';
import { theme } from '../theme';

export interface CardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle> | undefined;
  testID?: string | undefined;
  accessibilityRole?: AccessibilityRole | undefined;
}

export const Card: React.FC<CardProps> = ({ children, style, testID, accessibilityRole }) => {
  return (
    <View style={[styles.card, style]} testID={testID} accessibilityRole={accessibilityRole}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.radius.cardMin,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.surface,
  },
});
