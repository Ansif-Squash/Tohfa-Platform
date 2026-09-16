import React, { useEffect, useState } from 'react';
import { Platform, Pressable, SafeAreaView, StatusBar, StyleSheet, Text, View } from 'react-native';
import { setOnAuthFailure } from './api/client';
import { Icon } from '@tohfa/mobile-ui';
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
import { WeatherScreen } from './screens/dashboard/WeatherScreen';
import { CounterOfferScreen } from './screens/listings/CounterOfferScreen';
import { CreateListingScreen } from './screens/listings/CreateListingScreen';
import { ListingsScreen } from './screens/listings/ListingsScreen';
import { NotificationsScreen } from './screens/notifications/NotificationsScreen';
import { ProfileScreen } from './screens/profile/ProfileScreen';
import { FMBSketchScreen } from './screens/profile/FMBSketchScreen';
import { FieldContextScreen } from './screens/profile/FieldContextScreen';
import { ZonesScreen } from './screens/profile/ZonesScreen';
import { AddZoneScreen } from './screens/profile/AddZoneScreen';
import { PersonalDetailsScreen } from './screens/profile/PersonalDetailsScreen';
import { AuditsScreen } from './screens/audits/AuditsScreen';
import { AuditResultScreen } from './screens/audits/AuditResultScreen';
import { FarmManagementScreen } from './screens/farm/FarmManagementScreen';
import { ProduceCalendarScreen } from './screens/farm/ProduceCalendarScreen';
import { NewCropScreen } from './screens/farm/NewCropScreen';
import { CropDetailsScreen } from './screens/farm/CropDetailsScreen';
import { NPKContributionScreen } from './screens/farm/NPKContributionScreen';
import { CropManagementScreen } from './screens/farm/CropManagementScreen';
import { FarmDiaryScreen } from './screens/farm/FarmDiaryScreen';
import { NewDiaryEntryScreen } from './screens/farm/NewDiaryEntryScreen';
import { DiaryCalendarScreen } from './screens/farm/DiaryCalendarScreen';
import { FarmRatingsScreen } from './screens/profile/FarmRatingsScreen';
import { SoilTestScreen } from './screens/profile/SoilTestScreen';
import { NewSoilTestScreen } from './screens/profile/NewSoilTestScreen';
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
  | 'CounterOffer'
  | 'FMBSketch'
  | 'FieldContext'
  | 'Zones'
  | 'AddZone'
  | 'Notifications'
  | 'PersonalDetails'
  | 'Audits'
  | 'AuditResult'
  | 'FarmManagement'
  | 'ProduceCalendar'
  | 'NewCrop'
  | 'CropDetails'
  | 'NPKContribution'
  | 'CropManagement'
  | 'FarmDiary'
  | 'NewDiaryEntry'
  | 'DiaryCalendar'
  | 'FarmRatings'
  | 'SoilTest'
  | 'NewSoilTest'
  | 'Weather';

type TabName = 'Home' | 'Listings' | 'Wallet' | 'Profile';

/** Near-black green used behind the splash photo + status bar while Splash shows. */
const SPLASH_DARK = authPalette.splashDark;

export default function App(): React.JSX.Element {
  const [screen, setScreen] = useState<ScreenName>('Splash');
  const [previousScreen, setPreviousScreen] = useState<ScreenName | null>(null);
  const [currentTab, setCurrentTab] = useState<TabName>('Home');
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [params, setParams] = useState<Record<string, string | number | undefined>>({});

  function navigate(nextScreen: ScreenName, nextParams: Record<string, string | number | undefined> = {}) {
    setPreviousScreen(screen);
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

  useEffect(() => {
    if (Platform.OS === 'android') {
      const isFullBleed = screen === 'Splash' || screen === 'Welcome';
      StatusBar.setTranslucent(isFullBleed);
      StatusBar.setBackgroundColor('transparent', true);
    }
  }, [screen]);

  // Splash and Welcome are full-bleed photo screens: no upper green bar, translucent status bar.
  if (screen === 'Splash' || screen === 'Welcome') {
    return (
      <View style={styles.fullBleedContainer}>
        <StatusBar
          translucent
          backgroundColor="transparent"
          barStyle="light-content"
        />
        {screen === 'Splash' ? (
          <SplashScreen onNavigate={(s, p) => navigate(s, p)} />
        ) : (
          <WelcomeScreen onNavigate={(s) => navigate(s)} />
        )}
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.screen, (screen === 'Login' || screen === 'Register' || screen === 'Otp' || screen === 'ForgotPassword' || screen === 'ResetPassword' || screen === 'ApplicationStatus' || screen === 'RoleSelection') && { backgroundColor: authPalette.bg }]}>
      <StatusBar
        barStyle={(screen === 'Login' || screen === 'Register' || screen === 'Otp' || screen === 'ForgotPassword' || screen === 'ResetPassword' || screen === 'ApplicationStatus' || screen === 'RoleSelection') ? 'dark-content' : 'light-content'}
        backgroundColor="transparent"
      />

      <View style={styles.content}>
        {screen === 'Login' ? (
          <LoginScreen onNavigate={(s, p) => navigate(s, p)} />
        ) : screen === 'RoleSelection' ? (
          <RoleSelectionScreen onNavigate={(s) => navigate(s)} />
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
          <ForgotPasswordScreen onNavigate={(s, p) => navigate(s, p)} />
        ) : screen === 'ResetPassword' ? (
          <ResetPasswordScreen
            token={String(params['token'] ?? '')}
            onNavigate={(s) => navigate(s)}
          />
        ) : screen === 'ApplicationStatus' ? (
          <ApplicationStatusScreen
            applicationId={String(params['applicationId'] ?? 'TOHFA-2026-4817')}
            onNavigate={(s) => navigate(s)}
          />
        ) : screen === 'Certifications' ? (
          <CertificationsScreen
            onBack={() =>
              navigate(
                previousScreen && previousScreen !== 'AddCertification'
                  ? previousScreen
                  : 'MainTabs'
              )
            }
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
        ) : screen === 'FMBSketch' ? (
          <FMBSketchScreen
            onNavigateBack={() => navigate('MainTabs')}
            onNavigateToFieldContext={() => navigate('FieldContext')}
          />
        ) : screen === 'FieldContext' ? (
          <FieldContextScreen
            onNavigateBack={() => navigate('MainTabs')}
            onNavigateToZones={() => navigate('Zones')}
          />
        ) : screen === 'Zones' ? (
          <ZonesScreen
            onNavigateBack={() => navigate('MainTabs')}
            onNavigateToAddZone={() => navigate('AddZone')}
            onSave={() => navigate('MainTabs')}
          />
        ) : screen === 'AddZone' ? (
          <AddZoneScreen
            onNavigateBack={() => navigate('Zones')}
            onSave={() => navigate('Zones')}
          />
        ) : screen === 'PersonalDetails' ? (
          <PersonalDetailsScreen
            onBack={() => navigate('MainTabs')}
          />
        ) : screen === 'Notifications' ? (
          <NotificationsScreen
            onBack={() => navigate('MainTabs')}
            onNavigateToCounterOffer={() => {
              if (selectedListing) {
                navigate('CounterOffer');
              } else {
                setCurrentTab('Listings');
                navigate('MainTabs');
              }
            }}
          />
        ) : screen === 'AuditResult' ? (
          <AuditResultScreen
            onBack={() => navigate('Audits')}
            auditId={typeof params['auditId'] === 'string' ? params['auditId'] : undefined}
          />
        ) : screen === 'Audits' ? (
          <AuditsScreen
            onBack={() =>
              navigate(
                previousScreen && previousScreen !== 'Audits' && previousScreen !== 'AuditResult'
                  ? previousScreen
                  : 'MainTabs'
              )
            }
            onNavigateToResult={(auditId) => navigate('AuditResult', { auditId })}
          />
        ) : screen === 'FarmManagement' ? (
          <FarmManagementScreen
            onBack={() =>
              navigate(
                previousScreen && previousScreen !== 'FarmManagement'
                  ? previousScreen
                  : 'MainTabs'
              )
            }
            onNavigateToAudits={() => navigate('Audits')}
            onNavigateToDiary={() => navigate('FarmDiary')}
            onNavigateToProduceCalendar={() => navigate('ProduceCalendar')}
            onNavigateToCropManagement={() => navigate('CropManagement')}
            onNavigateToWeather={() => navigate('Weather')}
          />
        ) : screen === 'FarmDiary' ? (
          <FarmDiaryScreen
            onBack={() => navigate('FarmManagement')}
            onNavigateToNewEntry={() => navigate('NewDiaryEntry')}
            onNavigateToCalendar={() => navigate('DiaryCalendar')}
          />
        ) : screen === 'NewDiaryEntry' ? (
          <NewDiaryEntryScreen
            onBack={() => navigate('FarmDiary')}
            onCancel={() => navigate('FarmDiary')}
            onSave={() => navigate('DiaryCalendar', { selectedDay: 16 })}
          />
        ) : screen === 'DiaryCalendar' ? (
          <DiaryCalendarScreen
            initialDay={typeof params['selectedDay'] === 'number' ? params['selectedDay'] : 16}
            onBack={() => navigate('FarmDiary')}
          />
        ) : screen === 'CropManagement' ? (
          <CropManagementScreen onBack={() => navigate('FarmManagement')} />
        ) : screen === 'ProduceCalendar' ? (
          <ProduceCalendarScreen onBack={() => navigate('FarmManagement')} onNavigateToNewCrop={() => navigate('NewCrop')} onNavigateToCropDetails={() => navigate('CropDetails')} />
        ) : screen === 'NewCrop' ? (
          <NewCropScreen onBack={() => navigate('ProduceCalendar')} onSave={() => navigate('ProduceCalendar')} />
        ) : screen === 'CropDetails' ? (
          <CropDetailsScreen onBack={() => navigate('ProduceCalendar')} onNavigateToNPKContribution={() => navigate('NPKContribution')} />
        ) : screen === 'NPKContribution' ? (
          <NPKContributionScreen onBack={() => navigate('CropDetails')} />
        ) : screen === 'FarmRatings' ? (
          <FarmRatingsScreen onNavigateBack={() => navigate('MainTabs')} />
        ) : screen === 'SoilTest' ? (
          <SoilTestScreen onNavigateBack={() => navigate('MainTabs')} onNavigateToNewSoilTest={() => navigate('NewSoilTest')} />
        ) : screen === 'NewSoilTest' ? (
          <NewSoilTestScreen onNavigateBack={() => navigate('SoilTest')} onSave={() => navigate('SoilTest')} />
        ) : screen === 'Weather' ? (
          <WeatherScreen onNavigateBack={() => navigate(previousScreen && previousScreen !== 'Weather' ? previousScreen : 'MainTabs')} />
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
                  onNavigateToNotifications={() => navigate('Notifications')}
                  onNavigateToFarmManagement={() => navigate('FarmManagement')}
                  onNavigateToWeather={() => navigate('Weather')}
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
                  onNavigateToHome={() => setCurrentTab('Home')}
                  onNavigateToCertifications={() => navigate('Certifications')}
                  onNavigateToMarket={() => setCurrentTab('Listings')}
                  onNavigateToFMBSketch={() => navigate('FMBSketch')}
                  onNavigateToPersonalDetails={() => navigate('PersonalDetails')}
                  onNavigateToAudits={() => navigate('Audits')}
                  onNavigateToFarmRatings={() => navigate('FarmRatings')}
                  onNavigateToSoilTest={() => navigate('SoilTest')}
                />
              )}
            </View>

            {/* Bottom Tab Bar */}
            <View style={[styles.bottomTabBar, { borderTopWidth: 0, shadowColor: '#000', shadowOffset: { width: 0, height: -2 }, shadowOpacity: 0.05, shadowRadius: 5, elevation: 10, height: 70 }]}>
              <Pressable
                style={styles.tabItem}
                onPress={() => setCurrentTab('Home')}
                accessibilityRole="tab"
              >
                <Icon name="home" size={24} color={currentTab === 'Home' ? '#1B5E20' : '#757575'} />
                <Text
                  style={[
                    styles.tabItemText,
                    currentTab === 'Home' && styles.tabItemTextActive,
                    currentTab === 'Home' && { color: '#1B5E20' }
                  ]}
                >
                  Home
                </Text>
              </Pressable>

              <Pressable
                style={styles.tabItem}
                onPress={() => navigate('FarmManagement')}
                accessibilityRole="tab"
              >
                <Icon name="eco" size={24} color="#757575" />
                <Text style={styles.tabItemText}>Farm</Text>
              </Pressable>

              <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                <Pressable
                  style={{
                    backgroundColor: '#1B5E20',
                    width: 56,
                    height: 56,
                    borderRadius: 28,
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginTop: -30,
                    shadowColor: '#1B5E20',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.3,
                    shadowRadius: 5,
                    elevation: 5,
                    borderWidth: 4,
                    borderColor: 'white',
                  }}
                  onPress={() => navigate('CreateListing')}
                >
                  <Icon name="add" size={28} color="white" />
                </Pressable>
              </View>

              <Pressable
                style={styles.tabItem}
                onPress={() => setCurrentTab('Listings')}
                accessibilityRole="tab"
              >
                <Icon name="shopping_cart" size={24} color={currentTab === 'Listings' ? '#1B5E20' : '#757575'} />
                <Text
                  style={[
                    styles.tabItemText,
                    currentTab === 'Listings' && styles.tabItemTextActive,
                    currentTab === 'Listings' && { color: '#1B5E20' }
                  ]}
                >
                  Market
                </Text>
              </Pressable>

              <Pressable
                style={styles.tabItem}
                onPress={() => setCurrentTab('Profile')}
                accessibilityRole="tab"
              >
                <Icon name="person" size={24} color={currentTab === 'Profile' ? '#1B5E20' : '#757575'} />
                <Text
                  style={[
                    styles.tabItemText,
                    currentTab === 'Profile' && styles.tabItemTextActive,
                    currentTab === 'Profile' && { color: colors.primary }
                  ]}
                >
                  Profile
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
  fullBleedContainer: {
    flex: 1,
    backgroundColor: authPalette.black,
  },
  screenSplash: {
    backgroundColor: SPLASH_DARK,
  },
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

