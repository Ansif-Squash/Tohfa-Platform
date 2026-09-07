import React from 'react';
import { View, StyleSheet } from 'react-native';
import type { ViewStyle, DimensionValue } from 'react-native';
import { theme } from '../theme';

export interface SkeletonProps {
  width?: number | `${number}%`;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  width = '100%',
  height = 20,
  borderRadius = theme.radius.input,
  style,
}) => {
  return (
    <View
      style={[
        styles.skeleton,
        {
          width: width as DimensionValue,
          height,
          borderRadius,
        },
        style,
      ]}
    />
  );
};

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: theme.colors.surface,
    opacity: 0.7,
  },
});
