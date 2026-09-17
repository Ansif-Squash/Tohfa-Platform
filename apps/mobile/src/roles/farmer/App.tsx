import React, { useEffect, useState } from 'react';
import { Pressable, SafeAreaView, StatusBar, StyleSheet, Text, View } from 'react-native';
import { setOnAuthFailure } from './api/client';
import { Icon } from '@tohfa/mobile-ui';
import { LOCALES, setLocale, t, type Locale } from '../../i18n/farmer';
import { ApplicationStatusScreen } from './screens/auth/ApplicationStatusScreen';
import { ForgotPasswordScreen } from './screens/auth/ForgotPasswordScreen';
import { LoginScreen } from './screens/auth/LoginScreen';
import { OtpScreen } from './screens/auth/OtpScreen';
import { ResetPasswordScreen } from './screens/auth/ResetPasswordScreen';
import { PasswordChangedSuccessScreen } from './screens/auth/PasswordChangedSuccessScreen';
import { RoleSelectionScreen } from './screens/auth/RoleSelectionScreen';
import { SplashScreen } from './screens/auth/SplashScreen';
import { WelcomeScreen } from './screens/auth/WelcomeScreen';
import { AddCertificationScreen } from './screens/certifications/AddCertificationScreen';
import { CertificationsScreen } from './screens/certifications/CertificationsScreen';
import { EditCertificationScreen } from './screens/certifications/EditCertificationScreen';
import { DashboardScreen } from './screens/dashboard/DashboardScreen';
import { WeatherScreen } from './screens/dashboard/WeatherScreen';
import { ActiveCropsScreen } from './screens/dashboard/ActiveCropsScreen';
import { TohfaCalendarScreen } from './screens/dashboard/TohfaCalendarScreen';
import { CropPlanningInsightScreen } from './screens/dashboard/CropPlanningInsightScreen';
import { FarmManagementScreen } from './screens/farm/FarmManagementScreen';
import { FarmDiaryScreen } from './screens/farm/FarmDiaryScreen';
import { DailyAttendanceScreen } from './screens/farm/DailyAttendanceScreen';
import { FarmInventoryScreen } from './screens/farm/FarmInventoryScreen';
import { ToolsListScreen } from './screens/farm/ToolsListScreen';
import { AddToolScreen } from './screens/farm/AddToolScreen';
import { NewFarmDiaryEntryScreen } from './screens/farm/NewFarmDiaryEntryScreen';
import { NewFarmDiaryEntryStep2Screen } from './screens/farm/NewFarmDiaryEntryStep2Screen';
import { NewFarmDiaryEntryStep3Screen } from './screens/farm/NewFarmDiaryEntryStep3Screen';
import { CounterOfferScreen } from './screens/listings/CounterOfferScreen';
import { CreateListingScreen } from './screens/listings/CreateListingScreen';
import { CreateListingStep2Screen } from './screens/listings/CreateListingStep2Screen';
import { ListingDetailScreen } from './screens/listings/ListingDetailScreen';
import { ListingsScreen } from './screens/listings/ListingsScreen';
import { MyListingsScreen } from './screens/listings/MyListingsScreen';
import { NotificationsScreen } from './screens/notifications/NotificationsScreen';
import { AuditsScreen } from './screens/audits/AuditsScreen';
import { AuditResultScreen } from './screens/audits/AuditResultScreen';
import { ProfileScreen } from './screens/profile/ProfileScreen';
import { FMBSketchScreen } from './screens/profile/FMBSketchScreen';
import { FieldContextScreen } from './screens/profile/FieldContextScreen';
import { ZonesScreen } from './screens/profile/ZonesScreen';
import { AddZoneScreen } from './screens/profile/AddZoneScreen';
import { PersonalDetailsScreen } from './screens/profile/PersonalDetailsScreen';
import { FarmRatingsScreen } from './screens/profile/FarmRatingsScreen';
import { SoilTestScreen } from './screens/profile/SoilTestScreen';
import { NewSoilTestScreen } from './screens/profile/NewSoilTestScreen';
import { RegistrationFlowScreen } from './screens/registration/RegistrationFlowScreen';
import { WalletScreen } from './screens/wallet/WalletScreen';
import { type Listing } from './api/listings';
import { type Certification } from './api/farmer';
import { authPalette, colors, spacing, typography, weights } from './theme';
import { CustomerMainApp } from '../customer/CustomerMainApp';

export type ScreenName =
  | 'Splash'
  | 'Welcome'
  | 'Login'
  | 'RoleSelection'
  | 'Register'
  | 'Otp'
  | 'ForgotPassword'
  | 'ResetPassword'
  | 'PasswordChangedSuccess'
  | 'ApplicationStatus'
  | 'MainTabs'
  | 'CustomerMain'
  | 'Unsupported'
  | 'Certifications'
  | 'AddCertification'
  | 'CreateListing'
  | 'CreateListingStep2'
  | 'ListingDetail'
  | 'CounterOffer'
  | 'FMBSketch'
  | 'FieldContext'
  | 'Zones'
  | 'AddZone'
  | 'EditCertification'
  | 'Notifications'
  | 'PersonalDetails'
  | 'Audits'
  | 'AuditResult'
  | 'FarmManagement'
  | 'FarmRatings'
  | 'SoilTest'
  | 'NewSoilTest'
  | 'Weather'
  | 'FarmDiary'
  | 'NewFarmDiaryEntry'
  | 'NewFarmDiaryEntryStep2'
  | 'NewFarmDiaryEntryStep3'
  | 'ActiveCrops'
  | 'MyListings'
  | 'DailyAttendance'
  | 'TohfaCalendar'
  | 'CropPlanningInsight'
  | 'FarmInventory'
  | 'ToolsList'
  | 'AddTool';

type TabName = 'Home' | 'Listings' | 'Wallet' | 'Profile';

/** Near-black green used behind the splash photo + status bar while Splash shows. */
const SPLASH_DARK = authPalette.splashDark;

export default function App(): React.JSX.Element {
  const [screen, setScreen] = useState<ScreenName>('Splash');
  // Tracks where we navigated *from*, so a handful of deep screens (reached
  // from more than one place -- e.g. Certifications from both the Profile
  // card and FarmManagement) can return the caller to where they actually
  // came from instead of a hardcoded screen.
  const [previousScreen, setPreviousScreen] = useState<ScreenName | null>(null);
  const [currentTab, setCurrentTab] = useState<TabName>('Home');
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [selectedCertification, setSelectedCertification] = useState<Certification | null>(null);
  const [params, setParams] = useState<Record<string, string | number | undefined>>({});
  const [locale, setLocaleState] = useState<Locale>('en');

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



      <View style={styles.content}>
        {screen === 'Splash' ? (
          <SplashScreen onNavigate={(s, p) => navigate(s, p)} />
        ) : screen === 'Welcome' ? (
          <WelcomeScreen onNavigate={(s) => navigate(s)} />
        ) : screen === 'Login' ? (
          <LoginScreen onNavigate={(s, p) => navigate(s, p)} />
        ) : screen === 'RoleSelection' ? (
          <RoleSelectionScreen onNavigate={(s) => navigate(s)} />
        ) : screen === 'Register' ? (
          <RegistrationFlowScreen onNavigate={(s, p) => navigate(s, p)} />
        ) : screen === 'Otp' ? (
          <OtpScreen
            mobile={String(params['mobile'] ?? '')}
            challengeId={typeof params['challengeId'] === 'string' ? params['challengeId'] : undefined}
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
            purpose={
              (params['purpose'] as 'LOGIN' | 'PASSWORD_RESET') ?? 'LOGIN'
            }
            onNavigate={(s, p) => navigate(s, p)}
          />
        ) : screen === 'ForgotPassword' ? (
          <ForgotPasswordScreen onNavigate={(s) => navigate(s)} />
        ) : screen === 'ResetPassword' ? (
          <ResetPasswordScreen
            challengeId={String(params['challengeId'] ?? '')}
            code={String(params['code'] ?? '')}
            onNavigate={(s, p) => navigate(s, p)}
          />
        ) : screen === 'PasswordChangedSuccess' ? (
          <PasswordChangedSuccessScreen onNavigate={(s, p) => navigate(s, p)} />
        ) : screen === 'ApplicationStatus' ? (
          <ApplicationStatusScreen
            applicationId={String(params['applicationId'] ?? 'DEMO-APP-001')}
            onNavigate={(s) => navigate(s)}
          />
        ) : screen === 'CustomerMain' ? (
          <CustomerMainApp onSignOut={() => navigate('Welcome')} />
        ) : screen === 'Unsupported' ? (
          <View style={styles.unsupportedContainer}>
            <Text style={styles.unsupportedText}>{t('farmer.app.unsupportedRole')}</Text>
          </View>
        ) : screen === 'Certifications' ? (
          <CertificationsScreen
            onBack={() =>
              navigate(
                previousScreen && previousScreen !== 'AddCertification' && previousScreen !== 'EditCertification'
                  ? previousScreen
                  : 'MainTabs',
              )
            }
            onNavigateToAddCertification={() => navigate('AddCertification')}
            onNavigateToEditCertification={(certification) => {
              setSelectedCertification(certification);
              navigate('EditCertification');
            }}
          />
        ) : screen === 'AddCertification' ? (
          <AddCertificationScreen
            onSuccess={() => navigate('Certifications')}
            onCancel={() => navigate('Certifications')}
          />
        ) : screen === 'EditCertification' && selectedCertification ? (
          <EditCertificationScreen
            certification={selectedCertification}
            onCancel={() => navigate('Certifications')}
            onSave={() => navigate('Certifications')}
            onDelete={() => navigate('Certifications')}
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
            onNext={() => navigate('CreateListingStep2')}
          />
        ) : screen === 'CreateListingStep2' ? (
          <CreateListingStep2Screen
            onCancel={() => {
              setCurrentTab('Listings');
              navigate('MainTabs');
            }}
            onBack={() => navigate('CreateListing')}
            onSuccess={() => {
              navigate('MyListings');
            }}
          />
        ) : screen === 'CounterOffer' && selectedListing ? (
          <CounterOfferScreen
            listingId={selectedListing.id}
            cropName={selectedListing.cropName}
            onAccept={() => {
              setCurrentTab('Listings');
              navigate('MainTabs');
            }}
            onReject={() => {
              setCurrentTab('Listings');
              navigate('MainTabs');
            }}
            onCancel={() => navigate('MyListings')}
          />
        ) : screen === 'ListingDetail' ? (
          <ListingDetailScreen onBack={() => navigate('MyListings')} />
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
          <PersonalDetailsScreen onBack={() => navigate('MainTabs')} />
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
                  : 'MainTabs',
              )
            }
            onNavigateToResult={(auditId) => navigate('AuditResult', { auditId })}
          />
        ) : screen === 'FarmManagement' ? (
          <FarmManagementScreen
            onBack={() =>
              navigate(
                previousScreen && previousScreen !== 'FarmManagement' ? previousScreen : 'MainTabs',
              )
            }
            onNavigateToAudits={() => navigate('Audits')}
            onNavigateToDiary={() => navigate('FarmDiary')}
          />
        ) : screen === 'FarmDiary' ? (
          <FarmDiaryScreen 
            onBack={() => navigate('FarmManagement')} 
            onNavigateToNewEntry={() => navigate('NewFarmDiaryEntry')} 
          />
        ) : screen === 'NewFarmDiaryEntry' ? (
          <NewFarmDiaryEntryScreen 
            onBack={() => navigate('FarmDiary')} 
            onNext={() => navigate('NewFarmDiaryEntryStep2')} 
          />
        ) : screen === 'NewFarmDiaryEntryStep2' ? (
          <NewFarmDiaryEntryStep2Screen 
            onBack={() => navigate('NewFarmDiaryEntry')} 
            onNext={() => navigate('NewFarmDiaryEntryStep3')} 
          />
        ) : screen === 'NewFarmDiaryEntryStep3' ? (
          <NewFarmDiaryEntryStep3Screen 
            onBack={() => navigate('NewFarmDiaryEntryStep2')} 
            onSave={() => navigate('FarmDiary')} 
          />
        ) : screen === 'FarmRatings' ? (
          <FarmRatingsScreen onNavigateBack={() => navigate('MainTabs')} />
        ) : screen === 'SoilTest' ? (
          <SoilTestScreen
            onNavigateBack={() => navigate('MainTabs')}
            onNavigateToNewSoilTest={() => navigate('NewSoilTest')}
          />
        ) : screen === 'NewSoilTest' ? (
          <NewSoilTestScreen onNavigateBack={() => navigate('SoilTest')} onSave={() => navigate('SoilTest')} />
        ) : screen === 'Weather' ? (
          <WeatherScreen onNavigateBack={() => navigate('MainTabs')} />
        ) : screen === 'ActiveCrops' ? (
          <ActiveCropsScreen onNavigateBack={() => navigate('MainTabs')} />
        ) : screen === 'MyListings' ? (
          <MyListingsScreen 
            onNavigateBack={() => navigate('MainTabs')} 
            onNavigateToListingDetail={() => navigate('ListingDetail')}
          />
        ) : screen === 'TohfaCalendar' ? (
          <TohfaCalendarScreen 
            onNavigateBack={() => navigate('MainTabs')} 
            onNavigateToCropInsight={() => navigate('CropPlanningInsight')}
          />
        ) : screen === 'CropPlanningInsight' ? (
          <CropPlanningInsightScreen onNavigateBack={() => navigate('TohfaCalendar')} />
        ) : screen === 'FarmInventory' ? (
          <FarmInventoryScreen 
            onNavigateBack={() => navigate('MainTabs')} 
            onNavigateToCategory={(category) => {
              if (category === 'Tools') navigate('ToolsList');
            }}
          />
        ) : screen === 'ToolsList' ? (
          <ToolsListScreen 
            onNavigateBack={() => navigate('FarmInventory')} 
            onNavigateToAddTool={() => navigate('AddTool')}
          />
        ) : screen === 'AddTool' ? (
          <AddToolScreen onNavigateBack={() => navigate('ToolsList')} />
        ) : screen === 'DailyAttendance' ? (
          <DailyAttendanceScreen onNavigateBack={() => navigate('MainTabs')} />
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
                  onNavigateToActiveCrops={() => navigate('ActiveCrops')}
                  onNavigateToFarmDiary={() => navigate('FarmDiary')}
                  onNavigateToMyListings={() => navigate('MyListings')}
                  onNavigateToAttendance={() => navigate('DailyAttendance')}
                  onNavigateToTohfaCalendar={() => navigate('TohfaCalendar')}
                  onNavigateToInventory={() => navigate('FarmInventory')}
                  onNavigateToReviewOffer={() => {
                    setSelectedListing({
                      id: 'dummy-listing',
                      listingNumber: 'L-9821',
                      cropName: 'Carrot - Ooty - Grade 1', // combining subtitle for display
                      quantityKg: '150',
                      askingPricePerKg: '40',
                      ceilingPricePerKg: '45',
                      status: 'COUNTER_OFFER',
                      grade: 'Grade 1',
                      createdAt: new Date().toISOString(),
                      updatedAt: new Date().toISOString(),
                      activeCounterOffer: {
                        id: 'dummy-offer',
                        pricePerKg: '34',
                        quantityKg: '150',
                        message: 'On inspection the batch grades as Grade 2 (minor forking & size variance), not the claimed Grade 1. Counter reflects the Grade 2 ceiling.',
                        round: 1,
                        expiresAt: new Date(Date.now() + (22 * 60 * 60 + 30 * 60) * 1000).toISOString(),
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString(),
                      },
                    } as any);
                    navigate('CounterOffer');
                  }}
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
            <View style={[styles.bottomTabBar, { borderTopWidth: 0, shadowColor: colors.onSurface, shadowOffset: { width: 0, height: -2 }, shadowOpacity: 0.05, shadowRadius: 5, elevation: 10, height: 70 }]}>
              <Pressable
                style={styles.tabItem}
                onPress={() => setCurrentTab('Home')}
                accessibilityRole="tab"
              >
                <Icon name="home" size={24} color={currentTab === 'Home' ? colors.brandGreen : colors.onSurfaceVariant} />
                <Text
                  style={[
                    styles.tabItemText,
                    currentTab === 'Home' && styles.tabItemTextActive,
                    currentTab === 'Home' && { color: colors.brandGreen }
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
                <Icon name="eco" size={24} color={colors.onSurfaceVariant} />
                <Text style={styles.tabItemText}>Farm</Text>
              </Pressable>

              <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                <Pressable
                  style={{
                    backgroundColor: authPalette.deepGreen,
                    width: 56,
                    height: 56,
                    borderRadius: 28,
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginTop: -30,
                    shadowColor: authPalette.deepGreen,
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.3,
                    shadowRadius: 5,
                    elevation: 5,
                    borderWidth: 4,
                    borderColor: colors.white,
                  }}
                  onPress={() => navigate('CreateListing')}
                >
                  <Icon name="add" size={28} color={colors.white} />
                </Pressable>
              </View>

              <Pressable
                style={styles.tabItem}
                onPress={() => setCurrentTab('Listings')}
                accessibilityRole="tab"
              >
                <Icon name="shopping_cart" size={24} color={currentTab === 'Listings' ? colors.brandGreen : colors.onSurfaceVariant} style={currentTab === 'Listings' ? undefined : { opacity: 0.5 }} />
                <Text
                  style={[
                    styles.tabItemText,
                    currentTab === 'Listings' && styles.tabItemTextActive,
                    currentTab === 'Listings' && { color: colors.brandGreen }
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
                <Icon name="person" size={24} color={currentTab === 'Profile' ? colors.brandGreen : colors.onSurfaceVariant} style={currentTab === 'Profile' ? undefined : { opacity: 0.5 }} />
                <Text
                  style={[
                    styles.tabItemText,
                    currentTab === 'Profile' && styles.tabItemTextActive,
                    currentTab === 'Profile' && { color: colors.brandGreen }
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
  unsupportedContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.lg },
  unsupportedText: { fontSize: typography.body, color: colors.onSurface, textAlign: 'center' },
});

