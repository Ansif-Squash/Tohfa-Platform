import React from 'react';
import {
  Image,
  ImageBackground,
  Platform,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Button } from '@tohfa/mobile-ui';
import { useLocale, t } from '../../i18n';
import { GradientOverlay } from './GradientOverlay';
import { authPalette as P } from '../../theme';
import tohfaLogo from '../../assets/tohfa-logo.png';
import welcomeFarmerVeggies from '../../assets/welcome-bg.jpg';

interface WelcomeScreenProps {
  onNavigate: (screen: 'Login' | 'Register' | 'RoleSelection') => void;
}

const BRAND_NAME = 'TOHFA';

/**
 * Approved Welcome design (branding guidelines, Screen 2).
 *
 * Full-bleed farmer-with-produce photo, bottom-weighted gradient, wordmark +
 * language toggle pill up top, and the Login / Create an account CTAs with a legal
 * footer pinned to the bottom.
 */
const WELCOME_GRADIENT_STOPS: ReadonlyArray<{ position: number; opacity: number }> = [
  { position: 0, opacity: 0.9 },
  { position: 0.25, opacity: 0.75 },
  { position: 0.45, opacity: 0.45 },
  { position: 0.65, opacity: 0.08 },
  { position: 0.82, opacity: 0 },
  { position: 1, opacity: 0.15 },
];

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onNavigate }) => {
  const [locale, setLocale] = useLocale();

  return (
    <View style={styles.container}>
      <ImageBackground
        source={welcomeFarmerVeggies}
        style={StyleSheet.absoluteFill}
        resizeMode="cover"
        accessibilityLabel={t('auth.welcome.subtitle')}
      >
        <GradientOverlay stops={WELCOME_GRADIENT_STOPS} />

        {/* Top bar: wordmark + visible EN ▾ language pill */}
        <View style={styles.topBar}>
          <View style={styles.wordmarkRow}>
            <View style={styles.logoFrame}>
              <Image source={tohfaLogo} style={styles.logoImage} resizeMode="contain" />
            </View>
            <Text style={styles.wordmark}>{BRAND_NAME}</Text>
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Language: ${locale === 'en' ? 'English' : 'Tamil'}. Tap to switch language.`}
            style={styles.langPill}
            onPress={() => setLocale(locale === 'en' ? 'ta' : 'en')}
          >
            <Text style={styles.langPillText}>
              {locale === 'en' ? 'EN' : 'தமிழ்'}
            </Text>
            <Text style={styles.langPillCaret}>▾</Text>
          </Pressable>
        </View>

        {/* Bottom content */}
        <View style={styles.bottom}>
          <Text style={styles.title}>{t('auth.welcome.title')}</Text>
          <Text style={styles.subtitle}>{t('auth.welcome.subtitle')}</Text>

          <Button
            title={t('auth.welcome.login')}
            onPress={() => onNavigate('Login')}
            style={styles.loginButton}
            textStyle={styles.loginButtonText}
          />
          <Button
            title={t('auth.welcome.createAccount')}
            onPress={() => onNavigate('RoleSelection')}
            style={styles.createButton}
            textStyle={styles.createButtonText}
          />

          <Text style={styles.legal}>
            {t('auth.welcome.legalPrefix')}
            <Text style={styles.legalLink}>{t('auth.welcome.terms')}</Text>
            {t('auth.welcome.and')}
            <Text style={styles.legalLink}>{t('auth.welcome.privacy')}</Text>
          </Text>
        </View>
      </ImageBackground>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: P.black,
  },
  topBar: {
    position: 'absolute',
    top: Platform.OS === 'android' ? (StatusBar.currentHeight ? StatusBar.currentHeight + 14 : 50) : 56,
    left: 20,
    right: 20,
    zIndex: 30,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  wordmarkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logoFrame: {
    width: 26,
    height: 26,
  },
  logoImage: {
    width: '100%',
    height: '100%',
  },
  wordmark: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: 0.8,
    color: P.white,
  },
  langPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.65)',
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 7,
    minHeight: 36,
  },
  langPillText: {
    fontSize: 14,
    fontWeight: '700',
    color: P.white,
    letterSpacing: 0.5,
  },
  langPillCaret: {
    fontSize: 10,
    fontWeight: '800',
    color: P.white,
    marginLeft: 5,
    marginTop: 1,
  },
  bottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 24,
    paddingBottom: Platform.OS === 'ios' ? 44 : 36,
    zIndex: 20,
  },
  title: {
    fontSize: 34,
    fontWeight: '800',
    letterSpacing: -0.5,
    lineHeight: 40,
    color: P.white,
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 23,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.95)',
    marginBottom: 32,
    maxWidth: 320,
  },
  loginButton: {
    backgroundColor: P.white,
    borderRadius: 14,
    height: 56,
  },
  loginButtonText: {
    color: P.brandGreen,
    fontSize: 17,
    fontWeight: '700',
  },
  createButton: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.85)',
    borderRadius: 14,
    height: 56,
    marginTop: 14,
  },
  createButtonText: {
    color: P.white,
    fontSize: 17,
    fontWeight: '700',
  },
  legal: {
    fontSize: 11,
    lineHeight: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    marginTop: 20,
  },
  legalLink: {
    color: P.white,
    textDecorationLine: 'underline',
  },
});