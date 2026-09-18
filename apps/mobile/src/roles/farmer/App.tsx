import React, { useEffect, useState, useCallback } from 'react';
import { BackHandler, Pressable, SafeAreaView, StatusBar, StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
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
import { CropManagementScreen } from './screens/farm/CropManagementScreen';
import { LivestockScreen } from './screens/farm/LivestockScreen';
import { RegisterAnimalScreen } from './screens/farm/RegisterAnimalScreen';
import { EditAnimalScreen } from './screens/farm/EditAnimalScreen';
import { AnimalDetailScreen } from './screens/farm/AnimalDetailScreen';
import { SaleTransferCullScreen } from './screens/farm/SaleTransferCullScreen';
import { WorkforceScreen } from './screens/farm/WorkforceScreen';
import { AddWorkerScreen } from './screens/farm/AddWorkerScreen';
import { WorkerDetailScreen } from './screens/farm/WorkerDetailScreen';
import { PayrollScreen } from './screens/farm/PayrollScreen';
import {
  ProduceCalendarScreen,
  addProduceCropLocally,
  localProduceCropsCache,
  type CropItem,
} from './screens/farm/ProduceCalendarScreen';
import { NewCropScreen } from './screens/farm/NewCropScreen';
import { CropDetailScreen } from './screens/farm/CropDetailScreen';
import { CropDiaryEntriesScreen } from './screens/farm/CropDiaryEntriesScreen';
import { CropInputsAppliedScreen } from './screens/farm/CropInputsAppliedScreen';
import { InputManagementScreen } from './screens/farm/InputManagementScreen';
import { LogFertigationScreen } from './screens/farm/LogFertigationScreen';
import { LogPestTreatmentScreen } from './screens/farm/LogPestTreatmentScreen';
import { AddInputAppliedScreen } from './screens/farm/AddInputAppliedScreen';
import { SoilManagementScreen } from './screens/farm/SoilManagementScreen';
import { SoilTestRecordsScreen } from './screens/farm/SoilTestRecordsScreen';
import { SoilHealthTrackerScreen } from './screens/farm/SoilHealthTrackerScreen';
import { SoilTypeClassificationScreen } from './screens/farm/SoilTypeClassificationScreen';
import { SoilAmendmentsLogScreen } from './screens/farm/SoilAmendmentsLogScreen';
import { CropRotationScreen } from './screens/farm/CropRotationScreen';
import { SoilMoistureTrackingScreen } from './screens/farm/SoilMoistureTrackingScreen';
import { ErosionConservationScreen } from './screens/farm/ErosionConservationScreen';
import { ExportSoilReportsScreen } from './screens/farm/ExportSoilReportsScreen';
import { UploadNewSoilTestScreen } from './screens/farm/UploadNewSoilTestScreen';
import { CropWorkforceHoursScreen } from './screens/farm/CropWorkforceHoursScreen';
import { CropNPKContributionScreen } from './screens/farm/CropNPKContributionScreen';
import { FarmDiaryScreen } from './screens/farm/FarmDiaryScreen';
import { DiaryCalendarScreen } from './screens/farm/DiaryCalendarScreen';
import { DailyAttendanceScreen } from './screens/farm/DailyAttendanceScreen';
import { FarmInventoryScreen } from './screens/farm/FarmInventoryScreen';
import { ToolsListScreen, type ToolItem } from './screens/farm/ToolsListScreen';
import { AddToolScreen } from './screens/farm/AddToolScreen';
import { EditToolScreen } from './screens/farm/EditToolScreen';
import { EquipmentListScreen, type EquipmentItem } from './screens/farm/EquipmentListScreen';
import { AddEquipmentScreen } from './screens/farm/AddEquipmentScreen';
import { EditEquipmentScreen } from './screens/farm/EditEquipmentScreen';
import { TreesListScreen, type TreePlantingItem } from './screens/farm/TreesListScreen';
import { AddPlantingScreen } from './screens/farm/AddPlantingScreen';
import { EditPlantingScreen } from './screens/farm/EditPlantingScreen';
import { MachineryListScreen, type MachineryItem } from './screens/farm/MachineryListScreen';
import { AddMachineryScreen } from './screens/farm/AddMachineryScreen';
import { EditMachineryScreen } from './screens/farm/EditMachineryScreen';
import { RemoveItemScreen, type RemoveItemData } from './screens/farm/RemoveItemScreen';
import { LearningHubScreen } from './screens/learning/LearningHubScreen';
import { ContentDetailScreen, type ContentDetailItem } from './screens/learning/ContentDetailScreen';
import { GroupsScreen, type GroupItem } from './screens/learning/GroupsScreen';
import { GroupDetailScreen } from './screens/learning/GroupDetailScreen';
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
import { SettingsScreen } from './screens/profile/SettingsScreen';
import { ChangePasswordScreen } from './screens/profile/ChangePasswordScreen';
import { ChangeMobileScreen } from './screens/profile/ChangeMobileScreen';
import { AboutSupportScreen } from './screens/profile/AboutSupportScreen';
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
import {
  type Certification,
  updateCertificationLocally,
  deleteCertificationLocally,
} from './api/farmer';
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
  | 'CropManagement'
  | 'Livestock'
  | 'Workforce'
  | 'ProduceCalendar'
  | 'NewCrop'
  | 'CropDetail'
  | 'FarmRatings'
  | 'SoilTest'
  | 'NewSoilTest'
  | 'Weather'
  | 'FarmDiary'
  | 'DiaryCalendar'
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
  | 'AddTool'
  | 'EditTool'
  | 'EquipmentList'
  | 'AddEquipment'
  | 'EditEquipment'
  | 'TreesList'
  | 'AddPlanting'
  | 'EditPlanting'
  | 'MachineryList'
  | 'AddMachinery'
  | 'EditMachinery'
  | 'RemoveItem'
  | 'AddWorker'
  | 'WorkerDetail'
  | 'Payroll'
  | 'RegisterAnimal'
  | 'EditAnimal'
  | 'AnimalDetail'
  | 'SaleTransferCull'
  | 'LearningHub'
  | 'ContentDetail'
  | 'Groups'
  | 'GroupDetail'
  | 'Settings'
  | 'ChangePassword'
  | 'ChangeMobile'
  | 'AboutSupport'
  | 'InputManagement'
  | 'LogFertigation'
  | 'LogPestTreatment'
  | 'CropDiaryEntries'
  | 'CropInputsApplied'
  | 'AddInputApplied'
  | 'CropWorkforceHours'
  | 'CropNPKContribution'
  | 'SoilManagement'
  | 'SoilTestRecords'
  | 'SoilHealthTracker'
  | 'SoilTypeClassification'
  | 'SoilAmendmentsLog'
  | 'CropRotation'
  | 'SoilMoistureTracking'
  | 'ErosionConservation'
  | 'ExportSoilReports'
  | 'UploadNewSoilTest';

type TabName = 'Home' | 'Listings' | 'Wallet' | 'Profile';

/** Near-black green used behind the splash photo + status bar while Splash shows. */
const SPLASH_DARK = authPalette.splashDark;

function TabPlusIcon({ size = 22, color = colors.white }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 5V19M5 12H19"
        stroke={color}
        strokeWidth="2.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

interface StackEntry {
  screen: ScreenName;
  params?: Record<string, string | number | undefined>;
  tab?: TabName;
}

export default function App(): React.JSX.Element {
  const [screen, setScreen] = useState<ScreenName>('Splash');
  // Navigation history stack: keeps true chronological breadcrumbs so back buttons
  // always return to the actual prior screen without getting trapped in loops.
  const [history, setHistory] = useState<StackEntry[]>([]);
  const [currentTab, setCurrentTab] = useState<TabName>('Home');
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [selectedCertification, setSelectedCertification] = useState<Certification | null>(null);
  const [selectedContentDetail, setSelectedContentDetail] = useState<ContentDetailItem | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<GroupItem | null>(null);
  const [selectedCrop, setSelectedCrop] = useState<CropItem | null>(null);
  const [selectedToolForEdit, setSelectedToolForEdit] = useState<ToolItem | null>(null);
  const [selectedEquipmentForEdit, setSelectedEquipmentForEdit] = useState<EquipmentItem | null>(null);
  const [selectedTreeForEdit, setSelectedTreeForEdit] = useState<TreePlantingItem | null>(null);
  const [selectedMachineryForEdit, setSelectedMachineryForEdit] = useState<MachineryItem | null>(null);
  const [selectedItemForRemove, setSelectedItemForRemove] = useState<RemoveItemData | null>(null);
  const [params, setParams] = useState<Record<string, string | number | undefined>>({});
  const [locale, setLocaleState] = useState<Locale>('en');

  const navigate = useCallback(
    (nextScreen: ScreenName, nextParams: Record<string, string | number | undefined> = {}) => {
      if (nextScreen === screen) {
        setParams(nextParams);
        return;
      }

      if (nextScreen === 'Splash' || nextScreen === 'Welcome') {
        setHistory([]);
      } else if (nextScreen === 'MainTabs') {
        setHistory([]);
      } else {
        setHistory((prev) => [...prev, { screen, params, tab: currentTab }]);
      }

      setParams(nextParams);
      setScreen(nextScreen);
    },
    [screen, params, currentTab],
  );

  const goBack = useCallback(
    (fallbackScreen?: ScreenName) => {
      if (history.length > 0) {
        setHistory((prev) => {
          const nextHistory = [...prev];
          const previous = nextHistory.pop();
          if (previous) {
            setScreen(previous.screen);
            setParams(previous.params || {});
            if (previous.tab && previous.screen === 'MainTabs') {
              setCurrentTab(previous.tab);
            }
          }
          return nextHistory;
        });
      } else {
        if (fallbackScreen) {
          setScreen(fallbackScreen);
          setParams({});
          return;
        }
        const authScreens: ScreenName[] = [
          'Login',
          'RoleSelection',
          'Register',
          'Otp',
          'ForgotPassword',
          'ResetPassword',
          'PasswordChangedSuccess',
          'ApplicationStatus',
        ];
        if (authScreens.includes(screen)) {
          setScreen('Welcome');
          setParams({});
        } else if (screen !== 'MainTabs' && screen !== 'Splash' && screen !== 'Welcome') {
          setScreen('MainTabs');
          setParams({});
        }
      }
    },
    [history, screen],
  );

  useEffect(() => {
    const onBackPress = () => {
      if (screen === 'Splash' || screen === 'Welcome') {
        return false;
      }
      if (screen === 'MainTabs' && history.length === 0) {
        if (currentTab !== 'Home') {
          setCurrentTab('Home');
          return true;
        }
        return false;
      }
      goBack();
      return true;
    };

    const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => subscription.remove();
  }, [screen, currentTab, history, goBack]);

  useEffect(() => {
    setOnAuthFailure(() => {
      setScreen('Welcome');
      setHistory([]);
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
          <ForgotPasswordScreen onNavigate={(s, p) => navigate(s, p)} />
        ) : screen === 'ResetPassword' ? (
          <ResetPasswordScreen
            challengeId={String(params['challengeId'] ?? '')}
            code={String(params['code'] ?? '')}
            onNavigate={(s) => navigate(s)}
          />
        ) : screen === 'PasswordChangedSuccess' ? (
          <PasswordChangedSuccessScreen onNavigate={(s) => navigate(s)} />
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
            onBack={goBack}
            onNavigateToAddCertification={() => navigate('AddCertification')}
            onNavigateToEditCertification={(certification) => {
              setSelectedCertification(certification);
              navigate('EditCertification');
            }}
          />
        ) : screen === 'AddCertification' ? (
          <AddCertificationScreen
            onSuccess={goBack}
            onCancel={goBack}
          />
        ) : screen === 'EditCertification' && selectedCertification ? (
          <EditCertificationScreen
            certification={selectedCertification}
            onCancel={() => navigate('Certifications')}
            onSave={(updated) => {
              if (updated) updateCertificationLocally(updated);
              navigate('Certifications');
            }}
            onDelete={(id) => {
              if (id) deleteCertificationLocally(id);
              navigate('Certifications');
            }}
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
            onNext={() => navigate('CreateListingStep2')}
          />
        ) : screen === 'CreateListingStep2' ? (
          <CreateListingStep2Screen
            onCancel={goBack}
            onBack={goBack}
            onSuccess={() => {
              navigate('MyListings');
            }}
          />
        ) : screen === 'CounterOffer' ? (
          <CounterOfferScreen
            listing={selectedListing}
            listingId={selectedListing?.id}
            cropName={selectedListing?.cropName}
            offer={selectedListing?.activeCounterOffer}
            onAccept={() => {
              setCurrentTab('Listings');
              navigate('MainTabs');
            }}
            onReject={() => {
              setCurrentTab('Listings');
              navigate('MainTabs');
            }}
            onCancel={goBack}
          />
        ) : screen === 'ListingDetail' ? (
          <ListingDetailScreen onBack={goBack} />
        ) : screen === 'FMBSketch' ? (
          <FMBSketchScreen
            onNavigateBack={goBack}
            onNavigateToFieldContext={() => navigate('FieldContext')}
          />
        ) : screen === 'FieldContext' ? (
          <FieldContextScreen
            onNavigateBack={goBack}
            onNavigateToZones={() => navigate('Zones')}
          />
        ) : screen === 'Zones' ? (
          <ZonesScreen
            onNavigateBack={goBack}
            onNavigateToAddZone={() => navigate('AddZone')}
            onSave={goBack}
          />
        ) : screen === 'AddZone' ? (
          <AddZoneScreen
            onNavigateBack={goBack}
            onSave={goBack}
          />
        ) : screen === 'PersonalDetails' ? (
          <PersonalDetailsScreen onBack={goBack} />
        ) : screen === 'Notifications' ? (
          <NotificationsScreen
            onBack={goBack}
            onNavigateToCounterOffer={() => {
              if (!selectedListing) {
                setSelectedListing({
                  id: 'dummy-listing',
                  listingNumber: 'L-9821',
                  cropName: 'Carrot - Ooty - Grade 1',
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
              }
              navigate('CounterOffer');
            }}
          />
        ) : screen === 'AuditResult' ? (
          <AuditResultScreen
            onBack={goBack}
            auditId={typeof params['auditId'] === 'string' ? params['auditId'] : undefined}
          />
        ) : screen === 'Audits' ? (
          <AuditsScreen
            onBack={goBack}
            onNavigateToResult={(auditId) => navigate('AuditResult', { auditId })}
          />
        ) : screen === 'CropManagement' ? (
          <CropManagementScreen
            onBack={goBack}
            onNavigateToInputManagement={() => navigate('InputManagement')}
            onNavigateToSoilManagement={() => navigate('SoilManagement')}
            onNavigateToPestManagement={() => navigate('LogPestTreatment')}
          />
        ) : screen === 'InputManagement' ? (
          <InputManagementScreen
            onBack={goBack}
            onNavigateToLogFertigation={(crop) => {
              if (crop) setSelectedCrop(crop);
              navigate('LogFertigation');
            }}
            onNavigateToLogPestTreatment={(crop) => {
              if (crop) setSelectedCrop(crop);
              navigate('LogPestTreatment');
            }}
            onNavigateToLogInput={(crop, inputType) => {
              if (crop) setSelectedCrop(crop);
              if (inputType === 'Fertigation') {
                navigate('LogFertigation');
              } else if (inputType === 'Pest Treatment') {
                navigate('LogPestTreatment');
              } else {
                navigate('AddInputApplied', { initialInputType: inputType });
              }
            }}
            onNavigateToFullHistory={() => navigate('CropInputsApplied')}
          />
        ) : screen === 'LogFertigation' ? (
          <LogFertigationScreen
            crop={selectedCrop}
            onBack={goBack}
            onSave={() => goBack('InputManagement')}
          />
        ) : screen === 'LogPestTreatment' ? (
          <LogPestTreatmentScreen
            crop={selectedCrop}
            onBack={goBack}
            onSave={() => goBack('InputManagement')}
          />
        ) : screen === 'FarmManagement' ? (
          <FarmManagementScreen
            onBack={() => goBack('MainTabs')}
            onNavigateToAudits={() => navigate('Audits')}
            onNavigateToDiary={() => navigate('FarmDiary')}
            onNavigateToCertifications={() => navigate('Certifications')}
            onNavigateToProduceCalendar={() => navigate('ProduceCalendar')}
            onNavigateToWeather={() => navigate('Weather')}
            onNavigateToCalendar={() => navigate('TohfaCalendar')}
            onNavigateToActiveCrops={() => navigate('ActiveCrops')}
            onNavigateToCropManagement={() => navigate('CropManagement')}
            onNavigateToAttendance={() => navigate('DailyAttendance')}
            onNavigateToWorkforce={() => navigate('Workforce')}
            onNavigateToLivestock={() => navigate('Livestock')}
            onNavigateToLearningHub={() => navigate('LearningHub')}
            onNavigateToSoilManagement={() => navigate('SoilManagement')}
          />
        ) : screen === 'ProduceCalendar' ? (
          <ProduceCalendarScreen
            onBack={() => goBack('FarmManagement')}
            onNavigateToNewCrop={() => navigate('NewCrop')}
            onNavigateToCropDetail={(item) => {
              setSelectedCrop(item);
              navigate('CropDetail');
            }}
          />
        ) : screen === 'CropDetail' ? (
          <CropDetailScreen
            crop={selectedCrop}
            onBack={() => goBack('ProduceCalendar')}
            onEdit={() => navigate('NewCrop')}
            onNavigateToDiary={() => navigate('CropDiaryEntries')}
            onNavigateToInputs={() => navigate('CropInputsApplied')}
            onNavigateToWorkforce={() => navigate('CropWorkforceHours')}
            onNavigateToNPK={() => navigate('CropNPKContribution')}
          />
        ) : screen === 'CropDiaryEntries' ? (
          <CropDiaryEntriesScreen
            crop={selectedCrop}
            onBack={() => goBack('CropDetail')}
            onNewEntry={() => navigate('AddInputApplied', { fromDiary: '1', initialInputType: 'Fertigation' })}
          />
        ) : screen === 'CropInputsApplied' ? (
          <CropInputsAppliedScreen
            crop={selectedCrop}
            onBack={goBack}
            onNewInput={() => navigate('AddInputApplied')}
          />
        ) : screen === 'AddInputApplied' ? (
          <AddInputAppliedScreen
            crop={selectedCrop}
            initialInputType={params['initialInputType'] as 'Fertigation' | 'Pest Treatment' | undefined}
            onBack={goBack}
            onSave={goBack}
          />
        ) : screen === 'CropWorkforceHours' ? (
          <CropWorkforceHoursScreen
            crop={selectedCrop}
            onBack={() => goBack('CropDetail')}
          />
        ) : screen === 'CropNPKContribution' ? (
          <CropNPKContributionScreen
            crop={selectedCrop}
            onBack={() => goBack('CropDetail')}
          />
        ) : screen === 'NewCrop' ? (
          <NewCropScreen
            onBack={() => goBack('ProduceCalendar')}
            onCancel={() => goBack('ProduceCalendar')}
            onSaveCrop={(newCrop) => {
              addProduceCropLocally(newCrop);
              goBack('ProduceCalendar');
            }}
          />
        ) : screen === 'Livestock' ? (
          <LivestockScreen
            onBack={goBack}
            onNavigateToAddAnimal={() => navigate('RegisterAnimal')}
            onNavigateToAnimalDetail={(animal) =>
              navigate('AnimalDetail', {
                animalId: animal.id,
                animalName: animal.name,
                animalCode: animal.code,
                species: animal.type,
                breed: animal.breed,
                gender: animal.gender,
                age: animal.age,
                statusBadge: animal.statusBadge,
              })
            }
          />
        ) : screen === 'AnimalDetail' ? (
          <AnimalDetailScreen
            animalId={typeof params['animalId'] === 'string' ? params['animalId'] : 'a1'}
            animalName={typeof params['animalName'] === 'string' ? params['animalName'] : 'Lakshmi'}
            animalCode={typeof params['animalCode'] === 'string' ? params['animalCode'] : 'C-014'}
            species={typeof params['species'] === 'string' ? params['species'] : 'Cattle'}
            breed={typeof params['breed'] === 'string' ? params['breed'] : 'Jersey cross'}
            gender={typeof params['gender'] === 'string' ? params['gender'] : '♀'}
            age={typeof params['age'] === 'string' ? params['age'] : '4 yr'}
            statusBadge={typeof params['statusBadge'] === 'string' ? params['statusBadge'] : 'Fully Organic'}
            onBack={goBack}
            onNavigateToEdit={(animalData) => navigate('EditAnimal', animalData || {})}
            onNavigateToSale={() =>
              navigate('SaleTransferCull', {
                animalId: params['animalId'] || 'a1',
                animalName: params['animalName'] || 'Lakshmi',
                animalCode: params['animalCode'] || 'C-014',
              })
            }
          />
        ) : screen === 'EditAnimal' ? (
          <EditAnimalScreen
            initialAnimal={params as any}
            onBack={goBack}
            onCancel={goBack}
            onSave={() => goBack()}
          />
        ) : screen === 'SaleTransferCull' ? (
          <SaleTransferCullScreen
            animalId={typeof params['animalId'] === 'string' ? params['animalId'] : 'a1'}
            animalName={typeof params['animalName'] === 'string' ? params['animalName'] : 'Lakshmi'}
            animalCode={typeof params['animalCode'] === 'string' ? params['animalCode'] : 'C-014'}
            onBack={goBack}
            onSuccess={() => navigate('Livestock')}
          />
        ) : screen === 'RegisterAnimal' ? (
          <RegisterAnimalScreen
            initialAnimal={params as any}
            onBack={goBack}
            onCancel={goBack}
            onSave={() => goBack()}
          />
        ) : screen === 'Workforce' ? (
          <WorkforceScreen
            onBack={goBack}
            onNavigateToAddWorker={() => navigate('AddWorker')}
            onNavigateToTimesheet={() => navigate('DailyAttendance')}
            onNavigateToPayroll={() => navigate('Payroll')}
            onNavigateToWorkerDetail={(id, name, role) =>
              navigate('WorkerDetail', { workerId: id, workerName: name, workerRole: role })
            }
          />
        ) : screen === 'Payroll' ? (
          <PayrollScreen
            onBack={goBack}
            onNavigateToWorkerDetail={(id, name) =>
              navigate('WorkerDetail', { workerId: id, workerName: name })
            }
          />
        ) : screen === 'WorkerDetail' ? (
          <WorkerDetailScreen
            workerId={typeof params['workerId'] === 'string' ? params['workerId'] : 'w1'}
            workerName={typeof params['workerName'] === 'string' ? params['workerName'] : 'Murugan R.'}
            workerRole={
              typeof params['workerRole'] === 'string'
                ? params['workerRole']
                : 'Field Worker · Daily wage'
            }
            onBack={goBack}
            onNavigateToEditWorker={(workerData) => navigate('AddWorker', workerData || {})}
          />
        ) : screen === 'AddWorker' ? (
          <AddWorkerScreen
            initialWorker={params as any}
            onBack={goBack}
            onCancel={goBack}
            onSave={() => goBack()}
          />
        ) : screen === 'FarmDiary' ? (
          <FarmDiaryScreen
            onBack={goBack}
            onNavigateToNewEntry={() => navigate('NewFarmDiaryEntry')}
            onNavigateToCalendar={() => navigate('DiaryCalendar')}
          />
        ) : screen === 'DiaryCalendar' ? (
          <DiaryCalendarScreen
            onBack={goBack}
          />
        ) : screen === 'NewFarmDiaryEntry' ? (
          <NewFarmDiaryEntryScreen
            crop={selectedCrop}
            onBack={goBack}
            onNext={(cat) => {
              setParams((prev) => ({ ...prev, diaryCategory: cat }));
              if (cat.toLowerCase() === 'nutrients') {
                navigate('AddInputApplied', { initialInputType: 'Fertigation', fromDiary: '1' });
              } else if (cat.toLowerCase() === 'crop care') {
                navigate('AddInputApplied', { initialInputType: 'Pest Treatment', fromDiary: '1' });
              } else {
                navigate('NewFarmDiaryEntryStep2', { diaryCategory: cat });
              }
            }}
          />
        ) : screen === 'NewFarmDiaryEntryStep2' ? (
          <NewFarmDiaryEntryStep2Screen
            crop={selectedCrop}
            category={typeof params['diaryCategory'] === 'string' ? params['diaryCategory'] : 'Crop Care'}
            onChangeCategory={goBack}
            onBack={goBack}
            onNext={() => navigate('NewFarmDiaryEntryStep3')}
          />
        ) : screen === 'NewFarmDiaryEntryStep3' ? (
          <NewFarmDiaryEntryStep3Screen
            crop={selectedCrop}
            onBack={goBack}
            onDone={() => {
              if (selectedCrop) {
                navigate('CropDiaryEntries');
              } else {
                navigate('FarmDiary');
              }
            }}
            onSave={() => {
              if (selectedCrop) {
                navigate('CropDiaryEntries');
              } else {
                navigate('FarmDiary');
              }
            }}
          />
        ) : screen === 'FarmRatings' ? (
          <FarmRatingsScreen onNavigateBack={goBack} />
        ) : screen === 'SoilManagement' ? (
          <SoilManagementScreen
            onBack={goBack}
            onNavigateToSoilTestRecords={() => navigate('SoilTestRecords')}
            onNavigateToSoilHealthTracker={() => navigate('SoilHealthTracker')}
            onNavigateToSoilTypeClassification={() => navigate('SoilTypeClassification')}
            onNavigateToAmendments={() => navigate('SoilAmendmentsLog')}
            onNavigateToCropRotation={() => navigate('CropRotation')}
            onNavigateToMoistureTracking={() => navigate('SoilMoistureTracking')}
            onNavigateToErosionConservation={() => navigate('ErosionConservation')}
            onNavigateToExportReports={() => navigate('ExportSoilReports')}
            onNavigateToSoilTest={() => navigate('SoilTest')}
            onNavigateToNewSoilTest={() => navigate('UploadNewSoilTest')}
          />
        ) : screen === 'SoilTestRecords' ? (
          <SoilTestRecordsScreen
            onBack={goBack}
            onNavigateToRecordDetail={() => navigate('SoilTest')}
            onUploadNewTest={() => navigate('UploadNewSoilTest')}
          />
        ) : screen === 'SoilHealthTracker' ? (
          <SoilHealthTrackerScreen
            onBack={goBack}
          />
        ) : screen === 'SoilTypeClassification' ? (
          <SoilTypeClassificationScreen
            onBack={goBack}
          />
        ) : screen === 'SoilAmendmentsLog' ? (
          <SoilAmendmentsLogScreen
            onBack={goBack}
            onLogAmendment={() => navigate('UploadNewSoilTest')}
          />
        ) : screen === 'CropRotation' ? (
          <CropRotationScreen
            onBack={goBack}
          />
        ) : screen === 'SoilMoistureTracking' ? (
          <SoilMoistureTrackingScreen
            onBack={goBack}
          />
        ) : screen === 'ErosionConservation' ? (
          <ErosionConservationScreen
            onBack={goBack}
          />
        ) : screen === 'ExportSoilReports' ? (
          <ExportSoilReportsScreen
            onBack={goBack}
          />
        ) : screen === 'UploadNewSoilTest' || screen === 'NewSoilTest' ? (
          <UploadNewSoilTestScreen
            onBack={goBack}
            onSave={goBack}
          />
        ) : screen === 'SoilTest' ? (
          <SoilTestScreen
            onNavigateBack={goBack}
            onNavigateToNewSoilTest={() => navigate('UploadNewSoilTest')}
          />
        ) : screen === 'Weather' ? (
          <WeatherScreen
            onNavigateBack={goBack}
          />
        ) : screen === 'ActiveCrops' ? (
          <ActiveCropsScreen
            onNavigateBack={goBack}
          />
        ) : screen === 'MyListings' ? (
          <MyListingsScreen
            onNavigateBack={goBack}
            onNavigateToListingDetail={() => navigate('ListingDetail')}
          />
        ) : screen === 'TohfaCalendar' ? (
          <TohfaCalendarScreen
            onNavigateBack={goBack}
            onNavigateToCropInsight={() => navigate('CropPlanningInsight')}
          />
        ) : screen === 'CropPlanningInsight' ? (
          <CropPlanningInsightScreen onNavigateBack={goBack} />
        ) : screen === 'FarmInventory' ? (
          <FarmInventoryScreen
            onNavigateBack={goBack}
            onNavigateToCategory={(category) => {
              if (category === 'Tools') navigate('ToolsList');
              else if (category === 'Equipment') navigate('EquipmentList');
              else if (category === 'Trees') navigate('TreesList');
              else if (category === 'Machinery') navigate('MachineryList');
            }}
          />
        ) : screen === 'ToolsList' ? (
          <ToolsListScreen
            onNavigateBack={goBack}
            onNavigateToAddTool={() => navigate('AddTool')}
            onNavigateToEditTool={(tool) => {
              setSelectedToolForEdit(tool);
              navigate('EditTool');
            }}
          />
        ) : screen === 'AddTool' ? (
          <AddToolScreen onNavigateBack={goBack} />
        ) : screen === 'EditTool' ? (
          <EditToolScreen
            tool={
              selectedToolForEdit
                ? {
                    id: selectedToolForEdit.id,
                    name: selectedToolForEdit.name,
                    purchaseDate: selectedToolForEdit.purchaseDate?.replace('Purchased ', ''),
                    serviceInterval: selectedToolForEdit.serviceInterval ?? '90',
                  }
                : undefined
            }
            onNavigateBack={goBack}
            onSave={() => goBack()}
            onRemove={() => {
              setSelectedItemForRemove({
                id: selectedToolForEdit?.id,
                name: selectedToolForEdit?.name || 'Knapsack Sprayer',
                category: 'Tools',
                dateInfo: `Tools · ${selectedToolForEdit?.purchaseDate || 'Purchased 04 Jan 2025'}`,
                serviceEntriesCount: 3,
                recordedCost: 450,
              });
              navigate('RemoveItem');
            }}
          />
        ) : screen === 'EquipmentList' ? (
          <EquipmentListScreen
            onBack={goBack}
            onNavigateToAddEquipment={() => navigate('AddEquipment')}
            onNavigateToEditEquipment={(item) => {
              setSelectedEquipmentForEdit(item);
              navigate('EditEquipment');
            }}
          />
        ) : screen === 'AddEquipment' ? (
          <AddEquipmentScreen onNavigateBack={goBack} onSave={goBack} />
        ) : screen === 'EditEquipment' ? (
          <EditEquipmentScreen
            equipment={
              selectedEquipmentForEdit
                ? {
                    id: selectedEquipmentForEdit.id,
                    name: selectedEquipmentForEdit.name,
                    purchaseDate: selectedEquipmentForEdit.purchaseDate?.replace('Purchased ', ''),
                    coverageArea: selectedEquipmentForEdit.coverageArea ?? '2.5',
                    serviceInterval: selectedEquipmentForEdit.serviceInterval ?? '120',
                  }
                : undefined
            }
            onNavigateBack={goBack}
            onSave={() => goBack()}
            onRemove={() => {
              setSelectedItemForRemove({
                id: selectedEquipmentForEdit?.id,
                name: selectedEquipmentForEdit?.name || 'Drip Irrigation Kit',
                category: 'Equipment',
                dateInfo: `Equipment · ${selectedEquipmentForEdit?.purchaseDate || 'Purchased 22 Feb 2024'}`,
                serviceEntriesCount: 3,
                recordedCost: 450,
              });
              navigate('RemoveItem');
            }}
          />
        ) : screen === 'TreesList' ? (
          <TreesListScreen
            onBack={goBack}
            onNavigateToAddPlanting={() => navigate('AddPlanting')}
            onNavigateToEditPlanting={(item) => {
              setSelectedTreeForEdit(item);
              navigate('EditPlanting');
            }}
          />
        ) : screen === 'AddPlanting' ? (
          <AddPlantingScreen onNavigateBack={goBack} onSave={goBack} />
        ) : screen === 'EditPlanting' ? (
          <EditPlantingScreen
            planting={
              selectedTreeForEdit
                ? {
                    id: selectedTreeForEdit.id,
                    species: selectedTreeForEdit.species ?? selectedTreeForEdit.name.split(' (')[0],
                    treeCount: selectedTreeForEdit.treeCount ?? 12,
                    plantedDate: selectedTreeForEdit.plantedDate?.replace('Planted ', ''),
                    locationZone: selectedTreeForEdit.zoneInfo,
                    purpose: selectedTreeForEdit.purposeText ?? 'Shade & windbreak',
                  }
                : undefined
            }
            onNavigateBack={goBack}
            onSave={() => goBack()}
            onRemove={() => {
              setSelectedItemForRemove({
                id: selectedTreeForEdit?.id,
                name: selectedTreeForEdit?.name || 'Silver Oak (12 trees)',
                category: 'Trees',
                dateInfo: `Trees · ${selectedTreeForEdit?.plantedDate || 'Planted 14 Jun 2019'}`,
                serviceEntriesCount: 3,
                recordedCost: 450,
              });
              navigate('RemoveItem');
            }}
          />
        ) : screen === 'MachineryList' ? (
          <MachineryListScreen
            onBack={goBack}
            onNavigateToAddMachinery={() => navigate('AddMachinery')}
            onNavigateToEditMachinery={(item) => {
              setSelectedMachineryForEdit(item);
              navigate('EditMachinery');
            }}
          />
        ) : screen === 'AddMachinery' ? (
          <AddMachineryScreen onNavigateBack={goBack} onSave={goBack} />
        ) : screen === 'EditMachinery' ? (
          <EditMachineryScreen
            machinery={
              selectedMachineryForEdit
                ? {
                    id: selectedMachineryForEdit.id,
                    name: selectedMachineryForEdit.name,
                    makeModel: selectedMachineryForEdit.makeModel,
                    purchaseDate: selectedMachineryForEdit.purchaseDate?.replace('Purchased ', ''),
                    fuelType: selectedMachineryForEdit.fuelType,
                    serviceInterval: selectedMachineryForEdit.serviceInterval ?? '60',
                  }
                : undefined
            }
            onNavigateBack={goBack}
            onSave={() => goBack()}
            onRemove={() => {
              setSelectedItemForRemove({
                id: selectedMachineryForEdit?.id,
                name: selectedMachineryForEdit?.name || 'Power Tiller',
                category: 'Machinery',
                dateInfo: `Machinery · ${selectedMachineryForEdit?.purchaseDate || 'Purchased 08 Feb 2023'}`,
                serviceEntriesCount: 3,
                recordedCost: 450,
              });
              navigate('RemoveItem');
            }}
          />
        ) : screen === 'RemoveItem' ? (
          <RemoveItemScreen
            item={selectedItemForRemove ?? undefined}
            onNavigateBack={goBack}
            onConfirmRemove={() => {
              if (selectedItemForRemove?.category === 'Tools') {
                navigate('ToolsList');
              } else if (selectedItemForRemove?.category === 'Equipment') {
                navigate('EquipmentList');
              } else if (selectedItemForRemove?.category === 'Trees') {
                navigate('TreesList');
              } else {
                navigate('MachineryList');
              }
            }}
          />
        ) : screen === 'DailyAttendance' ? (
          <DailyAttendanceScreen onNavigateBack={goBack} />
        ) : screen === 'LearningHub' ? (
          <LearningHubScreen
            onBack={goBack}
            onNavigateToContentDetail={(content) => {
              setSelectedContentDetail(content);
              navigate('ContentDetail');
            }}
            onNavigateToGroups={() => navigate('Groups')}
            onNavigateToGroupDetail={(group) => {
              setSelectedGroup(group);
              navigate('GroupDetail');
            }}
          />
        ) : screen === 'ContentDetail' ? (
          <ContentDetailScreen
            content={selectedContentDetail ?? undefined}
            onBack={goBack}
          />
        ) : screen === 'Groups' ? (
          <GroupsScreen
            onBack={goBack}
            onNavigateToGroupDetail={(group) => {
              setSelectedGroup(group);
              navigate('GroupDetail');
            }}
          />
        ) : screen === 'GroupDetail' ? (
          <GroupDetailScreen
            group={selectedGroup ?? undefined}
            onBack={goBack}
          />
        ) : screen === 'AboutSupport' ? (
          <AboutSupportScreen onBack={goBack} />
        ) : screen === 'ChangeMobile' ? (
          <ChangeMobileScreen
            onBack={goBack}
            onNavigateToPassword={() => navigate('ChangePassword')}
          />
        ) : screen === 'ChangePassword' ? (
          <ChangePasswordScreen onBack={goBack} />
        ) : screen === 'Settings' ? (
          <SettingsScreen
            onBack={goBack}
            onNavigateToProfile={() => navigate('PersonalDetails')}
            onNavigateToChangePassword={() => navigate('ChangePassword')}
            onNavigateToChangeMobile={() => navigate('ChangeMobile')}
            onNavigateToAboutSupport={() => navigate('AboutSupport')}
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
                  onNavigateToNotifications={() => navigate('Notifications')}
                  onNavigateToFarmManagement={() => navigate('CropManagement')}
                  onNavigateToCropManagement={() => navigate('CropManagement')}
                  onNavigateToWeather={() => navigate('Weather')}
                  onNavigateToActiveCrops={() => navigate('ActiveCrops')}
                  onNavigateToFarmDiary={() => navigate('FarmDiary')}
                  onNavigateToMyListings={() => navigate('MyListings')}
                  onNavigateToAttendance={() => navigate('DailyAttendance')}
                  onNavigateToTohfaCalendar={() => navigate('TohfaCalendar')}
                  onNavigateToInventory={() => navigate('FarmInventory')}
                  onNavigateToLearningHub={() => navigate('LearningHub')}
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
                  onNavigateToProduceCalendar={() => navigate('ProduceCalendar')}
                  onNavigateToCropDetail={(cropName: string) => {
                    const found = localProduceCropsCache.find(
                      (c: CropItem) => c.name.toLowerCase() === cropName.toLowerCase(),
                    ) ?? localProduceCropsCache[0];
                    setSelectedCrop(found ?? null);
                    navigate('CropDetail');
                  }}
                />
              ) : currentTab === 'Listings' ? (
                <ListingsScreen
                  onNavigateToCreateListing={() => navigate('CreateListing')}
                  onNavigateToCounterOffer={(item) => {
                    if (item && item.id) {
                      setSelectedListing(item);
                    } else {
                      setSelectedListing({
                        id: 'dummy-listing',
                        listingNumber: 'L-9821',
                        cropName: 'Carrot - Ooty - Grade 1',
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
                    }
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
                  onNavigateToSettings={() => navigate('Settings')}
                  onNavigateToAboutSupport={() => navigate('AboutSupport')}
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

              <View style={styles.centerTabContainer}>
                <Pressable
                  style={({ pressed }) => [
                    styles.centerAddButton,
                    pressed && { opacity: 0.88, transform: [{ scale: 0.96 }] },
                  ]}
                  onPress={() => navigate('CreateListing')}
                  accessibilityRole="button"
                  accessibilityLabel="Create listing"
                >
                  <TabPlusIcon size={22} color={colors.white} />
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
  centerTabContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
  },
  centerAddButton: {
    backgroundColor: authPalette.deepGreen,
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -24,
    shadowColor: authPalette.deepGreen,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 6,
    elevation: 6,
    borderWidth: 3.5,
    borderColor: colors.white,
  },
  unsupportedContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.lg },
  unsupportedText: { fontSize: typography.body, color: colors.onSurface, textAlign: 'center' },
});

