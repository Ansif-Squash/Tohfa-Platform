import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Easing,
  Image,
  ImageBackground,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { t } from '../../i18n';
import { fetchMe, resolveRouteAfterAuth } from '../../api/auth';
import { getAccessToken } from '../../storage/tokenStorage';
import { GradientOverlay } from './GradientOverlay';
import { authPalette as P } from '../../theme';
import tohfaLogo from '../../assets/tohfa-logo.png';
import splashTeaGarden from '../../assets/splash-bg.jpg';

interface SplashScreenProps {
  onNavigate: (
    screen: 'Welcome' | 'ApplicationStatus' | 'MainTabs',
    params?: Record<string, string | number | undefined>,
  ) => void;
}

/**
 * Approved splash design (branding guidelines, Screen 1).
 *
 * Full-bleed Nilgiris tea-garden photo, bottom-weighted black gradient, centred
 * logo + TOHFA wordmark + association tagline, three pulsing loading dots and
 * the build version in the free corner.
 */

/** Wordmark and build tag - literal copies of the approved mockup. */
const BRAND_NAME = 'TOHFA';
const BRAND_TAGLINE_KEY = 'auth.splash.tagline';
const APP_VERSION = 'v1.0.0';

/** Logo frame, wordmark and dots taken straight from the mockup. */
const LOGO_SIZE = 96;
const DOT_SIZE = 8;
const DOT_STAGGER_MS = 200;
const BOUNCE_CYCLE_MS = 1400;

/**
 * Splash gradient stops (design): bottom-weighted so text stays readable over
 * the tea-garden photo while the top stays natural.
 */
const SPLASH_GRADIENT_STOPS: ReadonlyArray<{ position: number; opacity: number }> = [
  { position: 0, opacity: 0.78 },
  { position: 0.45, opacity: 0.5 },
  { position: 1, opacity: 0.28 },
];
export const SplashScreen: React.FC<SplashScreenProps> = ({ onNavigate }) => {
  const dotProgress = useRef([0, 1, 2].map(() => new Animated.Value(0))).current;
  const brandProgress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let active = true;

    async function checkSession() {
      try {
        const token = await getAccessToken();
        if (!token) {
          if (active) onNavigate('Welcome');
          return;
        }

        const me = await fetchMe();
        if (!active) return;

        const route = resolveRouteAfterAuth(me);
        onNavigate(route.name, route.params);
      } catch {
        if (active) onNavigate('Welcome');
      }
    }

    const timer = setTimeout(checkSession, 1200);

    // Brand block slides up + fades in once (tohfaFade 0.6s ease).
    const brandFadeIn = Animated.timing(brandProgress, {
      toValue: 1,
      duration: 600,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    });
    brandFadeIn.start();

    // Loading dots pulse scale/opacity on a 1.4s cycle, staggered 200ms
    // (tohfaBounce: scale .6>1, opacity .5>1, stagger 0/.2/.4s).
    const bounceLoops = dotProgress.map((value, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * DOT_STAGGER_MS),
          Animated.timing(value, {
            toValue: 1,
            duration: 560,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(value, {
            toValue: 0,
            duration: BOUNCE_CYCLE_MS - 560,
            easing: Easing.in(Easing.quad),
            useNativeDriver: true,
          }),
        ]),
      ),
    );
    bounceLoops.forEach((loop) => loop.start());

    return () => {
      active = false;
      clearTimeout(timer);
      brandFadeIn.stop();
      bounceLoops.forEach((loop) => loop.stop());
    };
  }, [onNavigate, brandProgress, dotProgress]);

  return (
    <View style={styles.container}>
      <ImageBackground
        source={splashTeaGarden}
        style={StyleSheet.absoluteFill}
        resizeMode="cover"
        accessibilityLabel={t('auth.splash.tagline')}
      >
        {/* Bottom-weighted dark gradient so text stays readable over the photo. */}
        <GradientOverlay stops={SPLASH_GRADIENT_STOPS} />

        {/* Centred brand block */}
        <Animated.View
          style={[
            styles.brand,
            {
              opacity: brandProgress,
              transform: [
                {
                  translateY: brandProgress.interpolate({
                    inputRange: [0, 1],
                    outputRange: [8, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <View style={styles.logoFrame}>
            <Image source={tohfaLogo} style={styles.logoImage} resizeMode="cover" />
          </View>
          <Text style={styles.brandName}>{BRAND_NAME}</Text>
          <Text style={styles.tagline}>{t(BRAND_TAGLINE_KEY)}</Text>
        </Animated.View>

        {/* Loading dots */}
        <View style={styles.loadingRow} pointerEvents="none">
          {dotProgress.map((value, i) => (
            <Animated.View
              key={i}
              style={[
                styles.loadingDot,
                {
                  opacity: value.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1] }),
                  transform: [
                    { scale: value.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1] }) },
                  ],
                },
              ]}
            />
          ))}
        </View>

        {/* Build tag */}
        <Text style={styles.version}>{APP_VERSION}</Text>
      </ImageBackground>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: P.deepGreen,
  },
  brand: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoFrame: {
    width: LOGO_SIZE,
    height: LOGO_SIZE,
  },
  logoImage: {
    width: '100%',
    height: '100%',
  },
  brandName: {
    fontSize: 40,
    fontWeight: '800',
    letterSpacing: 2,
    color: P.white,
    marginTop: 20,
  },
  tagline: {
    fontSize: 12,
    fontWeight: '400',
    color: 'rgba(255, 255, 255, 0.85)',
    maxWidth: 260,
    textAlign: 'center',
    lineHeight: 17,
    marginTop: 8,
  },
  loadingRow: {
    position: 'absolute',
    bottom: 60,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
  },
  loadingDot: {
    width: DOT_SIZE,
    height: DOT_SIZE,
    borderRadius: DOT_SIZE / 2,
    backgroundColor: P.leafGreen,
  },
  version: {
    position: 'absolute',
    bottom: 24,
    left: 0,
    right: 0,
    textAlign: 'center',
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.5)',
  },
});