import React from 'react';
import { StyleSheet, View } from 'react-native';

export interface GradientStop {
  /** Position measured from the BOTTOM edge (0 = bottom, 1 = top). */
  position: number;
  /** Black overlay opacity at that position. */
  opacity: number;
}

export interface GradientOverlayProps {
  stops: ReadonlyArray<GradientStop>;
  /** Number of stacked bands; 12 reads visually identical to a true gradient. */
  bands?: number;
}

function opacityAt(position: number, stops: ReadonlyArray<GradientStop>): number {
  if (stops.length === 0) return 0;
  if (position <= stops[0]!.position) return stops[0]!.opacity;
  for (let i = 1; i < stops.length; i++) {
    const start = stops[i - 1]!;
    const end = stops[i]!;
    if (position <= end.position) {
      const t = (position - start.position) / (end.position - start.position);
      return start.opacity + t * (end.opacity - start.opacity);
    }
  }
  return stops[stops.length - 1]!.opacity;
}

/**
 * Pure React Native approximation of a CSS vertical black gradient
 * (`linear-gradient(to top, rgba(0,0,0,...) ...)`) using stacked translucent
 * bands. Keeps the auth screens dependency-free while matching the design
 * mockup's overlay gradients exactly.
 */
export const GradientOverlay: React.FC<GradientOverlayProps> = ({ stops, bands = 12 }) => {
  const colors = Array.from({ length: bands }, (_, i) => {
    const centreFromTop = (i + 0.5) / bands;
    return `rgba(0, 0, 0, ${opacityAt(1 - centreFromTop, stops).toFixed(3)})`;
  });

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {colors.map((color, i) => (
        <View key={i} style={[styles.band, { backgroundColor: color }]} />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  band: {
    flex: 1,
  },
});