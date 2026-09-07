import React from 'react';
import { View, StyleSheet } from 'react-native';
import type { ViewStyle, DimensionValue } from 'react-native';
import { useTheme } from './theme';

export interface SkeletonProps {
  width?: number | `${number}%` | undefined;
  height?: number | undefined;
  borderRadius?: number | undefined;
  style?: ViewStyle | undefined;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  width = '100%',
  height = 20,
  borderRadius,
  style,
}) => {
  const theme = useTheme();

  return (
    <View
      style={[
        styles.skeleton,
        {
          backgroundColor: theme.colors.surface,
          width: width as DimensionValue,
          height,
          borderRadius: borderRadius ?? theme.radius.input,
        },
        style,
      ]}
    />
  );
};

const styles = StyleSheet.create({
  skeleton: {
    opacity: 0.7,
  },
});
