import React, { useState } from 'react';
import { Image, ImageBackground, Pressable, StyleSheet, Text, View } from 'react-native';
import { Button, Icon } from '@tohfa/mobile-ui';
import { getLocale, setLocale, t } from '../../i18n';
import { GradientOverlay } from './GradientOverlay';
import { authPalette as P } from '../../theme';
import tohfaLogo from '../../assets/tohfa-logo.png';
import welcomeFarmerVeggies from '../../assets/welcome-bg.jpg';

interface WelcomeScreenProps {
  onNavigate: (screen: 'Login' | 'Register') => void;
}

type LangCode = 'en' | 'ta';

const BRAND_NAME = 'TOHFA';

const LANGUAGE_OPTIONS: ReadonlyArray<{ code: LangCode; label: string }> = [
  { code: 'en', label: 'English' },
  { code: 'ta', label: 'தமிழ்' },
];

/**
 * Approved Welcome design (branding guidelines, Screen 2).
 *
 * Full-bleed farmer-with-produce photo, bottom-weighted gradient, wordmark +
 * language pill up top, and the Login / Create an account CTAs with a legal
 * footer pinned to the bottom.
 */
const WELCOME_GRADIENT_STOPS: ReadonlyArray<{ position: number; opacity: number }> = [
  { position: 0, opacity: 0.88 },
  { position: 0.3, opacity: 0.6 },
  { position: 0.6, opacity: 0.15 },
  { position: 1, opacity: 0.1 },
];

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onNavigate }) => {
  const [langOpen, setLangOpen] = useState(false);
  const [locale, setLocaleState] = useState<LangCode>(getLocale());

  const currentLangLabel = LANGUAGE_OPTIONS.find((o) => o.code === locale)?.label ?? 'English';

  function pickLanguage(code: LangCode): void {
    setLocale(code);
    setLocaleState(code);
    setLangOpen(false);
  }

  return (
    <View style={styles.container}>
      <ImageBackground
        source={welcomeFarmerVeggies}
        style={StyleSheet.absoluteFill}
        resizeMode="cover"
        accessibilityLabel={t('auth.welcome.subtitle')}
      >
        <GradientOverlay stops={WELCOME_GRADIENT_STOPS} />

        {/* Top bar: wordmark + language pill */}
        <View style={styles.topBar}>
          <View style={styles.wordmarkRow}>
            <View style={styles.logoFrame}>
              <Image source={tohfaLogo} style={styles.logoImage} />
            </View>
            <Text style={styles.wordmark}>{BRAND_NAME}</Text>
          </View>

          <View style={styles.langWrap}>
            <Pressable
              accessibilityRole="button"
              style={styles.langPill}
              onPress={() => setLangOpen((open) => !open)}
            >
              <Text style={styles.langPillText}>{currentLangLabel}</Text>
              <Icon name="expand_more" size={12} color={P.white} />
            </Pressable>

            {langOpen && (
              <View style={styles.langDropdown}>
                {LANGUAGE_OPTIONS.map((option, i) => (
                  <Pressable
                    key={option.code}
                    accessibilityRole="button"
                    style={[styles.langOption, i > 0 && styles.langOptionDivider]}
                    onPress={() => pickLanguage(option.code)}
                  >
                    <Text style={styles.langOptionText}>{option.label}</Text>
                  </Pressable>
                ))}
              </View>
            )}
          </View>
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
            onPress={() => onNavigate('Register')}
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
    backgroundColor: P.deepGreen,
  },
  topBar: {
    position: 'absolute',
    top: 62,
    left: 24,
    right: 24,
    zIndex: 30,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  wordmarkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logoFrame: {
    width: 24,
    height: 24,
  },
  logoImage: {
    width: '100%',
    height: '100%',
  },
  wordmark: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 1,
    color: P.white,
  },
  langWrap: {
    position: 'relative',
  },
  langPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    minHeight: 40,
  },
  langPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: P.white,
  },
  langDropdown: {
    position: 'absolute',
    top: 46,
    right: 0,
    width: 132,
    backgroundColor: P.white,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: P.black,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.4,
    shadowRadius: 32,
    elevation: 8,
    zIndex: 50,
  },
  langOption: {
    paddingHorizontal: 16,
    paddingVertical: 13,
  },
  langOptionDivider: {
    borderTopWidth: 1,
    borderTopColor: P.borderLight,
  },
  langOptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: P.deepGreen,
  },
  bottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 24,
    paddingBottom: 40,
    zIndex: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: -0.5,
    color: P.white,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 21,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 28,
    maxWidth: 300,
  },
  loginButton: {
    backgroundColor: P.white,
    borderRadius: 12,
    height: 56,
  },
  loginButtonText: {
    color: P.deepGreen,
    fontSize: 16,
    fontWeight: '700',
  },
  createButton: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 12,
    height: 56,
    marginTop: 16,
  },
  createButtonText: {
    color: P.white,
    fontSize: 16,
    fontWeight: '700',
  },
  legal: {
    fontSize: 10,
    lineHeight: 15,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    marginTop: 20,
  },
  legalLink: {
    color: P.white,
    textDecorationLine: 'underline',
  },
});