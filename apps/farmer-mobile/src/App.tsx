import React, { useEffect, useState } from 'react';
import { Pressable, SafeAreaView, StatusBar, StyleSheet, Text, View } from 'react-native';
import { setOnAuthFailure } from './api/client';
import { Icon } from '@tohfa/mobile-ui';
import { LOCALES, setLocale, t, type Locale } from './i18n';
import { ApplicationStatusScreen } from './screens/auth/ApplicationStatusScreen';
import { ForgotPasswordScreen } from './screens/auth/ForgotPasswordScreen';
import { LoginScreen } from './screens/auth/LoginScreen';
import { OtpScreen } from './screens/auth/OtpScreen';
import { ResetPasswordScreen } from './screens/auth/ResetPasswordScreen';
import { RoleSelectionScreen } from './screens/auth/RoleSelectionScreen';
import { SplashScreen } from './screens/auth/SplashScreen';
import { WelcomeScreen } from './screens/auth/WelcomeScreen';
import { AddCertificationScreen } from './screens/certifications/AddCertificationScreen';
import { CertificationsScreen } from './screens/certifications/CertificationsScreen';
import { DashboardScreen } from './screens/dashboard/DashboardScreen';
import { CounterOfferScreen } from './screens/listings/CounterOfferScreen';
import { CreateListingScreen } from './screens/listings/CreateListingScreen';
import { ListingsScreen } from './screens/listings/ListingsScreen';
import { ProfileScreen } from './screens/profile/ProfileScreen';
import { RegistrationFlowScreen } from './screens/registration/RegistrationFlowScreen';
import { WalletScreen } from './screens/wallet/WalletScreen';
import { type Listing } from './api/listings';
import { authPalette, colors, spacing, typography, weights } from './theme';

export type ScreenName =
  | 'Splash'
  | 'Welcome'
  | 'Login'
  | 'RoleSelection'
  | 'Register'
  | 'Otp'
  | 'ForgotPassword'
  | 'ResetPassword'
  | 'ApplicationStatus'
  | 'MainTabs'
  | 'Certifications'
  | 'AddCertification'
  | 'CreateListing'
  | 'CounterOffer';

type TabName = 'Home' | 'Listings' | 'Wallet' | 'Profile';

/** Near-black green used behind the splash photo + status bar while Splash shows. */
const SPLASH_DARK = authPalette.splashDark;

export default function App(): React.JSX.Element {
  const [screen, setScreen] = useState<ScreenName>('Splash');
  const [currentTab, setCurrentTab] = useState<TabName>('Home');
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [params, setParams] = useState<Record<string, string | number | undefined>>({});
  const [locale, setLocaleState] = useState<Locale>('en');

  function navigate(nextScreen: ScreenName, nextParams: Record<string, string | number | undefined> = {}) {
    setParams(nextParams);
    setScreen(nextScreen);
  }

  useEffect(() => {
    setOnAuthFailure(() => {
      setScreen('Welcome');
    });
    return () => {
      setOnAuthFailure(null);
    };
  }, []);

  const switchLocale = (next: Locale): void => {
    setLocale(next);
    setLocaleState(next);
  };

  // Splash and Welcome are full-bleed photo screens: no header, dark chrome.
  const isAuthLanding = screen === 'Splash' || screen === 'Welcome';

  return (
    <SafeAreaView style={[styles.screen, isAuthLanding && styles.screenSplash]}>
      <StatusBar
        barStyle="light-content"
        backgroundColor={isAuthLanding ? SPLASH_DARK : colors.primaryPressed}
      />

      {screen !== 'Register' && screen !== 'RoleSelection' && (
        {!isAuthLanding && (
        <View style={styles.header}>
            <Text style={styles.headerText}>{t('app.name')}</Text>
            <View style={styles.localeRow}>
              {LOCALES.map((code) => (
                <Pressable
                  key={code}
                  accessibilityRole="button"
                  style={[styles.localeChip, locale === code && styles.localeChipActive]}
                  onPress={() => switchLocale(code)}
                >
                  <Text style={locale === code ? styles.localeTextActive : styles.localeText}>
                    {code.toUpperCase()}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
      )}
      )}

      <View style={styles.content}>
        {screen === 'Splash' ? (
          <SplashScreen onNavigate={(s, p) => navigate(s, p)} />
        ) : screen === 'Welcome' ? (
          <WelcomeScreen onNavigate={(s) => navigate(s)} />
        ) : screen === 'Login' ? (
          <LoginScreen onNavigate={(s, p) => navigate(s, p)} />
        ) : screen === 'RoleSelection' ? (
          <RoleSelectionScreen onNavigate={(s, p) => navigate(s, p)} />
        ) : screen === 'Register' ? (
          <RegistrationFlowScreen onNavigate={(s, p) => navigate(s, p)} />
        ) : screen === 'Otp' ? (
          <OtpScreen
            mobile={String(params['mobile'] ?? '')}
            resendAvailableAt={
              typeof params['resendAvailableAt'] === 'string'
                ? params['resendAvailableAt']
                : undefined
            }
            attemptsRemaining={
              typeof params['attemptsRemaining'] === 'number'
                ? params['attemptsRemaining']
                : undefined
            }
            onNavigate={(s, p) => navigate(s, p)}
          />
        ) : screen === 'ForgotPassword' ? (
          <ForgotPasswordScreen onNavigate={(s) => navigate(s)} />
        ) : screen === 'ResetPassword' ? (
          <ResetPasswordScreen
            token={String(params['token'] ?? '')}
            onNavigate={(s) => navigate(s)}
          />
        ) : screen === 'ApplicationStatus' ? (
          <ApplicationStatusScreen
            applicationId={String(params['applicationId'] ?? 'DEMO-APP-001')}
            onNavigate={(s) => navigate(s)}
          />
        ) : screen === 'Certifications' ? (
          <CertificationsScreen
            onNavigateToAddCertification={() => navigate('AddCertification')}
          />
        ) : screen === 'AddCertification' ? (
          <AddCertificationScreen
            onSuccess={() => navigate('Certifications')}
            onCancel={() => navigate('Certifications')}
          />
        ) : screen === 'CreateListing' ? (
          <CreateListingScreen
            onSuccess={() => {
              setCurrentTab('Listings');
              navigate('MainTabs');
            }}
            onCancel={() => {
              setCurrentTab('Listings');
              navigate('MainTabs');
            }}
            onNavigateToCertifications={() => navigate('Certifications')}
          />
        ) : screen === 'CounterOffer' && selectedListing ? (
          <CounterOfferScreen
            listing={selectedListing}
            onSuccess={() => {
              setCurrentTab('Listings');
              navigate('MainTabs');
            }}
            onCancel={() => {
              setCurrentTab('Listings');
              navigate('MainTabs');
            }}
          />
        ) : (
          /* MainTabs layout */
          <View style={styles.mainTabsContainer}>
            <View style={styles.tabScreenContainer}>
              {currentTab === 'Home' ? (
                <DashboardScreen
                  onNavigateToCertifications={() => navigate('Certifications')}
                  onNavigateToCreateListing={() => navigate('CreateListing')}
                  onNavigateToListings={() => setCurrentTab('Listings')}
                  onNavigateToWallet={() => setCurrentTab('Wallet')}
                  onNavigateToProfile={() => setCurrentTab('Profile')}
                />
              ) : currentTab === 'Listings' ? (
                <ListingsScreen
                  onNavigateToCreateListing={() => navigate('CreateListing')}
                  onNavigateToCounterOffer={(item) => {
                    setSelectedListing(item);
                    navigate('CounterOffer');
                  }}
                />
              ) : currentTab === 'Wallet' ? (
                <WalletScreen />
              ) : (
                <ProfileScreen
                  onNavigateToCertifications={() => navigate('Certifications')}
                />
              )}
            </View>

            {/* Bottom Tab Bar */}
            <View style={styles.bottomTabBar}>
              <Pressable
                style={styles.tabItem}
                onPress={() => setCurrentTab('Home')}
                accessibilityRole="tab"
              >
                <Icon
                  name="home"
                  size={24}
                  color={currentTab === 'Home' ? colors.primary : colors.onSurfaceVariant}
                />
                <Text
                  style={[
                    styles.tabItemText,
                    currentTab === 'Home' && styles.tabItemTextActive,
                  ]}
                >
                  {t('dashboard.title')}
                </Text>
              </Pressable>

              <Pressable
                style={styles.tabItem}
                onPress={() => setCurrentTab('Listings')}
                accessibilityRole="tab"
              >
                <Icon
                  name="inventory_2"
                  size={24}
                  color={currentTab === 'Listings' ? colors.primary : colors.onSurfaceVariant}
                />
                <Text
                  style={[
                    styles.tabItemText,
                    currentTab === 'Listings' && styles.tabItemTextActive,
                  ]}
                >
                  {t('listings.title')}
                </Text>
              </Pressable>

              <Pressable
                style={styles.tabItem}
                onPress={() => setCurrentTab('Wallet')}
                accessibilityRole="tab"
              >
                <Icon
                  name="account_balance_wallet"
                  size={24}
                  color={currentTab === 'Wallet' ? colors.primary : colors.onSurfaceVariant}
                />
                <Text
                  style={[
                    styles.tabItemText,
                    currentTab === 'Wallet' && styles.tabItemTextActive,
                  ]}
                >
                  {t('wallet.title')}
                </Text>
              </Pressable>

              <Pressable
                style={styles.tabItem}
                onPress={() => setCurrentTab('Profile')}
                accessibilityRole="tab"
              >
                <Icon
                  name="person"
                  size={24}
                  color={currentTab === 'Profile' ? colors.primary : colors.onSurfaceVariant}
                />
                <Text
                  style={[
                    styles.tabItemText,
                    currentTab === 'Profile' && styles.tabItemTextActive,
                  ]}
                >
                  {t('profile.title')}
                </Text>
              </Pressable>
            </View>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.surface },
  screenSplash: {
    backgroundColor: SPLASH_DARK,
  },
  header: {
    backgroundColor: colors.primaryPressed,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerText: {
    color: colors.white,
    fontSize: typography.title,
    fontWeight: weights.bold,
  },
  localeRow: { flexDirection: 'row', gap: 6 },
  localeChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  localeChipActive: { backgroundColor: colors.white },
  localeText: { color: colors.white, fontSize: 12, fontWeight: '600' },
  localeTextActive: { color: colors.primaryPressed, fontSize: 12, fontWeight: '700' },
  content: { flex: 1 },
  mainTabsContainer: { flex: 1 },
  tabScreenContainer: { flex: 1 },
  bottomTabBar: {
    flexDirection: 'row',
    height: 56,
    borderTopWidth: 1,
    borderTopColor: colors.surfacePressed,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    height: '100%',
  },
  tabItemText: {
    fontSize: typography.caption,
    color: colors.onSurfaceVariant,
    fontWeight: weights.medium,
  },
  tabItemTextActive: {
    color: colors.primary,
    fontWeight: weights.bold,
  },
});

