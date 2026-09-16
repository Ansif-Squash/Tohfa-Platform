import React from 'react';
import { StyleSheet } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { authPalette as P } from '../../theme';

export interface GradientStop {
  /** Position measured from the BOTTOM edge (0 = bottom, 1 = top). */
  position: number;
  /** Black overlay opacity at that position. */
  opacity: number;
}

export interface GradientOverlayProps {
  stops: ReadonlyArray<GradientStop>;
  bands?: number;
}

/**
 * Hardware-accelerated true continuous SVG LinearGradient overlay.
 * Completely eliminates banding, stripes, and stepping artifacts.
 */
export const GradientOverlay: React.FC<GradientOverlayProps> = ({ stops }) => {
  // Sort stops by position from top (1.0) to bottom (0.0)
  const sortedStops = [...stops].sort((a, b) => b.position - a.position);

  return (
    <Svg style={StyleSheet.absoluteFill} pointerEvents="none" width="100%" height="100%">
      <Defs>
        <LinearGradient id="gradientOverlay" x1="0" y1="0" x2="0" y2="1">
          {sortedStops.map((stop, i) => (
            <Stop
              key={i}
              offset={`${Math.max(0, Math.min(100, (1 - stop.position) * 100)).toFixed(1)}%`}
              stopColor={P.black}
              stopOpacity={stop.opacity}
            />
          ))}
        </LinearGradient>
      </Defs>
      <Rect x="0" y="0" width="100%" height="100%" fill="url(#gradientOverlay)" />
    </Svg>
  );
};