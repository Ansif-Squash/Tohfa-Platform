/**
 * Material Symbols Outlined Icon component.
 * Optical size 24, weight 400, fill 0.
 * NO emojis in production.
 */
import React from 'react';
import { Text, StyleSheet } from 'react-native';
import type { TextStyle } from 'react-native';
import { useTheme } from './theme';

export interface IconProps {
  name: string;
  size?: number | undefined;
  color?: string | undefined;
  style?: TextStyle | undefined;
}

export const Icon: React.FC<IconProps> = ({
  name,
  size = 24,
  color,
  style,
}) => {
  const theme = useTheme();
  const iconColor = color ?? theme.colors.onSurface;

  return (
    <Text
      accessibilityRole="text"
      aria-label={name}
      style={[
        styles.iconText,
        {
          fontSize: size,
          color: iconColor,
          lineHeight: size,
        },
        style,
      ]}
    >
      {name}
    </Text>
  );
};

const styles = StyleSheet.create({
  iconText: {
    fontFamily: 'Material Symbols Outlined',
    fontWeight: '400',
    textAlign: 'center',
  },
});
