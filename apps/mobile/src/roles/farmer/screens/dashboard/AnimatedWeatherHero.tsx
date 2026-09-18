import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  ImageBackground,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { authPalette as P } from '../../theme';
import type { FarmWeatherCurrent } from '../../api/weather';

export type WeatherScene = 'day' | 'night';

export interface AnimatedWeatherHeroProps {
  current: FarmWeatherCurrent;
  observedAt: string;
  formattedDate: string;
  conditionLabel: string;
  humidityLabel: string;
  windLabel: string;
  feelsLikeLabel: string;
}

const DAY_BG = require('../../assets/weather-day.jpg');
const NIGHT_BG = require('../../assets/weather-night.jpg');

export function detectDayOrNight(date: Date = new Date()): WeatherScene {
  const hours = date.getHours();
  // Night from 7 PM to 5 AM, Day from 6 AM to 6 PM
  if (hours >= 6 && hours < 19) return 'day';
  return 'night';
}

export function AnimatedWeatherHero({
  current,
  observedAt,
  formattedDate,
  conditionLabel,
  humidityLabel,
  windLabel,
  feelsLikeLabel,
}: AnimatedWeatherHeroProps): React.JSX.Element {
  const autoScene = detectDayOrNight(new Date(observedAt || Date.now()));
  const [manualScene, setManualScene] = useState<WeatherScene | null>(null);

  const activeScene: WeatherScene = manualScene ?? autoScene;

  // Gentle atmospheric animation values
  const bgScaleAnim = useRef(new Animated.Value(1)).current;
  const cloudDriftAnim = useRef(new Animated.Value(0)).current;
  const lightShimmerAnim = useRef(new Animated.Value(0.7)).current;

  useEffect(() => {
    // 1. Subtle breathing zoom on the background scenery (1.0 to 1.03)
    const zoomLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(bgScaleAnim, {
          toValue: 1.035,
          duration: 7000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(bgScaleAnim, {
          toValue: 1.0,
          duration: 7000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );

    // 2. Slow atmospheric horizontal drift
    const driftLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(cloudDriftAnim, {
          toValue: 8,
          duration: 5000,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(cloudDriftAnim, {
          toValue: -8,
          duration: 5000,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    );

    // 3. Ambient sunlight / starlight shimmer
    const shimmerLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(lightShimmerAnim, {
          toValue: 1.0,
          duration: 2600,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(lightShimmerAnim, {
          toValue: 0.65,
          duration: 2600,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );

    zoomLoop.start();
    driftLoop.start();
    shimmerLoop.start();

    return () => {
      zoomLoop.stop();
      driftLoop.stop();
      shimmerLoop.stop();
    };
  }, [bgScaleAnim, cloudDriftAnim, lightShimmerAnim]);

  const toggleScene = () => {
    setManualScene((prev) => {
      const currentVal = prev ?? autoScene;
      return currentVal === 'day' ? 'night' : 'day';
    });
  };

  return (
    <View style={styles.cardContainer}>
      {/* Photorealistic 3D Scenery Background with subtle breathing motion */}
      <Animated.View
        style={[
          StyleSheet.absoluteFillObject,
          {
            transform: [{ scale: bgScaleAnim }, { translateX: cloudDriftAnim }],
          },
        ]}
      >
        <ImageBackground
          source={activeScene === 'day' ? DAY_BG : NIGHT_BG}
          style={StyleSheet.absoluteFill}
          resizeMode="cover"
        >
          {/* Subtle contrast gradient scrim so text remains 100% legible */}
          <View style={styles.scrimOverlay} />
        </ImageBackground>
      </Animated.View>

      {/* Atmospheric light shimmer glow */}
      <Animated.View
        style={[
          styles.shimmerLayer,
          {
            opacity: lightShimmerAnim,
          },
        ]}
        pointerEvents="none"
      />

      {/* Foreground Content */}
      <View style={styles.cardContent}>
        {/* Top row: date/time & auto scene switch chip */}
        <View style={styles.topRow}>
          <Text style={styles.dateText}>{formattedDate}</Text>
          <TouchableOpacity
            style={styles.scenePill}
            onPress={toggleScene}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Toggle day and night scene preview"
          >
            <Text style={styles.scenePillText}>
              {manualScene
                ? (activeScene === 'day' ? 'Day' : 'Night')
                : (activeScene === 'day' ? 'Auto · Day' : 'Auto · Night')}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Hero temperature and condition */}
        <View style={styles.tempConditionBlock}>
          <Text style={styles.temperatureText}>
            {`${Math.round(current.temperatureC)}°`}
          </Text>
          <Text style={styles.conditionText}>{conditionLabel}</Text>
        </View>

        {/* Bottom 3 Glassmorphism Stat Cards */}
        <View style={styles.statsRow}>
          {/* Humidity Card */}
          <View style={styles.glassStatCard}>
            <View style={styles.statIconWrapper}>
              <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                <Path
                  d="M12 21a7 7 0 0 0 7-7c0-2-3-7.5-7-11-4 3.5-7 9-7 11a7 7 0 0 0 7 7z"
                  stroke={P.white}
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
            </View>
            <Text style={styles.statValueText}>{`${Math.round(current.humidityPct)}%`}</Text>
            <Text style={styles.statLabelText}>{humidityLabel}</Text>
          </View>

          {/* Wind Card */}
          <View style={styles.glassStatCard}>
            <View style={styles.statIconWrapper}>
              <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                <Path
                  d="M9.59 4.59A2 2 0 1 1 11 8H2m10.59 11.41A2 2 0 1 0 14 16H2m15.73-8.27A2.5 2.5 0 1 1 19.5 12H2"
                  stroke={P.white}
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
            </View>
            <Text style={styles.statValueText}>{`${Math.round(current.windKph)} km/h`}</Text>
            <Text style={styles.statLabelText}>{windLabel}</Text>
          </View>

          {/* Feels Like Card */}
          <View style={styles.glassStatCard}>
            <View style={styles.statIconWrapper}>
              <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                <Path
                  d="M14 14.76V4a2 2 0 0 0-4 0v10.76a4 4 0 1 0 4 0z"
                  stroke={P.white}
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
            </View>
            <Text style={styles.statValueText}>{`${Math.round(current.feelsLikeC)}°`}</Text>
            <Text style={styles.statLabelText}>{feelsLikeLabel}</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    borderRadius: 22,
    overflow: 'hidden',
    marginBottom: 20,
    minHeight: 250,
    backgroundColor: P.blue700,
    shadowColor: P.black,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 18,
    elevation: 6,
  },
  scrimOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(10, 30, 60, 0.22)',
  },
  shimmerLayer: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(255, 245, 180, 0.12)',
  },
  cardContent: {
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 16,
    zIndex: 10,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  dateText: {
    fontSize: 12,
    fontWeight: '700',
    color: P.white,
    opacity: 0.9,
    textShadowColor: 'rgba(0, 0, 0, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  scenePill: {
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    paddingHorizontal: 10,
    paddingVertical: 3.5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.35)',
  },
  scenePillText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: P.white,
    letterSpacing: 0.3,
  },
  tempConditionBlock: {
    marginTop: 6,
    marginBottom: 24,
  },
  temperatureText: {
    fontSize: 56,
    fontWeight: '800',
    color: P.white,
    lineHeight: 60,
    letterSpacing: -1,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  conditionText: {
    fontSize: 15,
    fontWeight: '700',
    color: P.white,
    marginTop: 4,
    textShadowColor: 'rgba(0, 0, 0, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  glassStatCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    paddingVertical: 10,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statIconWrapper: {
    marginBottom: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statValueText: {
    fontSize: 14,
    fontWeight: '800',
    color: P.white,
    marginBottom: 2,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  statLabelText: {
    fontSize: 9.5,
    fontWeight: '600',
    color: P.white,
    opacity: 0.88,
  },
});
