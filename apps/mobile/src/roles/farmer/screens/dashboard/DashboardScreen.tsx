import React, { useCallback, useEffect, useState } from 'react';
import {
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Image,
} from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import {
  evalCertificateWarning,
  evalMarketBlock,
  getMyCertifications,
  getMyFarmerProfile,
  getSystemConfig,
  type Certification,
  type FarmerProfile,
} from '../../api/farmer';
import { ErrorState, Icon, Skeleton } from '@tohfa/mobile-ui';
import { t, type TranslationKey } from '../../../../i18n/farmer';

import { authPalette as P, colors } from '../../theme';

function HeaderSearchIcon({ size = 19, color = colors.white }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="11" cy="11" r="7" stroke={color} strokeWidth="2.2" />
      <Path d="M20 20L16.2 16.2" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
    </Svg>
  );
}

function HeaderBellIcon({ size = 19, color = colors.white }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M13.73 21a2 2 0 0 1-3.46 0"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

interface DashboardScreenProps {
  onNavigateToListings?: () => void;
  onNavigateToCreateListing?: () => void;
  onNavigateToWallet?: () => void;
  onNavigateToProfile?: () => void;
  onNavigateToCertifications?: () => void;
  onNavigateToNotifications?: () => void;
  onNavigateToFarmManagement?: () => void;
  onNavigateToCropManagement?: () => void;
  onNavigateToWeather?: () => void;
  onNavigateToActiveCrops?: () => void;
  onNavigateToFarmDiary?: () => void;
  onNavigateToMyListings?: () => void;
  onNavigateToAttendance?: () => void;
  onNavigateToReviewOffer?: () => void;
  onNavigateToTohfaCalendar?: () => void;
  onNavigateToInventory?: () => void;
  onNavigateToLearningHub?: () => void;
}

export function DashboardScreen({
  onNavigateToListings,
  onNavigateToCreateListing,
  // No grid tile or tab currently routes to Wallet in this redesign (the
  // bottom tab bar's own Wallet entry was dropped along with it) -- kept as
  // an accepted prop so the parent's existing wiring stays valid, but this
  // screen has nothing to call it from right now.
  onNavigateToWallet: _onNavigateToWallet,
  onNavigateToProfile,
  onNavigateToCertifications,
  onNavigateToNotifications,
  onNavigateToFarmManagement,
  onNavigateToCropManagement,
  onNavigateToWeather,
  onNavigateToActiveCrops,
  onNavigateToFarmDiary,
  onNavigateToMyListings,
  onNavigateToAttendance,
  onNavigateToReviewOffer,
  onNavigateToTohfaCalendar,
  onNavigateToInventory,
  onNavigateToLearningHub,
}: DashboardScreenProps): React.JSX.Element {
  const [profile, setProfile] = useState<FarmerProfile | null>(null);
  const [certs, setCerts] = useState<Certification[]>([]);
  const [warningThreshold, setWarningThreshold] = useState<number>(30);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      setError(null);
      const [profileRes, certsRes, configRes] = await Promise.all([
        getMyFarmerProfile().catch(() => ({
          id: 'dummy-profile',
          tohfaFarmerId: 'T-1234',
          fullName: 'Kumar',
          mobile: '9800000003',
          aadhaarLast4: '1234',
          kycStatus: 'VERIFIED',
          subscriptionTier: 'FREE',
          isMarketBlocked: false,
        } as FarmerProfile)),
        getMyCertifications().catch(() => ({ items: [], page: { nextCursor: null, hasMore: false } })),
        getSystemConfig(),
      ]);
      setProfile(profileRes);
      setCerts(certsRes.items);
      setWarningThreshold(configRes.certExpiryWarningDays);
    } catch {
      setError(t('error.generic'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    void loadData();
  }, [loadData]);

  if (loading) {
    return (
      <SafeAreaView style={styles.screen}>
        <View style={styles.skeletonContainer}>
          <Skeleton height={28} width="60%" style={styles.skeletonItem} />
          <Skeleton height={18} width="35%" style={styles.skeletonItem} />
          <Skeleton height={140} width="100%" style={styles.skeletonCard} />
          <Skeleton height={180} width="100%" style={styles.skeletonCard} />
        </View>
      </SafeAreaView>
    );
  }

  if (error && !profile) {
    return (
      <SafeAreaView style={styles.screen}>
        <ErrorState
          error={error}
          onRetry={() => {
            setLoading(true);
            void loadData();
          }}
        />
      </SafeAreaView>
    );
  }

  const activeCert = certs[0];
  const marketBlockState = evalMarketBlock(profile ?? {}, certs);
  const certWarning = activeCert
    ? evalCertificateWarning(activeCert.daysToExpiry, warningThreshold)
    : null;

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
        }
      >
        {/* Header Section (Green Background) */}
        <View style={styles.headerBackground}>
          <View style={styles.headerTopRow}>
            <View style={styles.profileRow}>
              <View style={styles.profileImagePlaceholder}>
                <Text style={styles.profileImageText}>K</Text>
              </View>
              <View>
                <Text style={styles.greetingText}>Good morning</Text>
                <Text style={styles.nameText}>{profile?.fullName ?? 'Kumar'}</Text>
              </View>
            </View>
            <View style={styles.headerActions}>
              <TouchableOpacity 
                style={styles.headerIconButton}
                onPress={() => {
                  import('react-native').then(({ Alert }) => {
                    Alert.alert('Search', 'Search functionality is coming soon.');
                  });
                }}
                activeOpacity={0.75}
                accessibilityRole="button"
                accessibilityLabel="Search"
              >
                <HeaderSearchIcon size={19} color={colors.white} />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.headerIconButton}
                onPress={onNavigateToNotifications}
                activeOpacity={0.75}
                accessibilityRole="button"
                accessibilityLabel={t('farmer.dashboard.header.notifications')}
              >
                <HeaderBellIcon size={19} color={colors.white} />
                <View style={styles.notificationDot} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Header Mini Cards */}
          <View style={styles.headerCardsRow}>
            <TouchableOpacity
              style={styles.headerMiniCard}
              onPress={onNavigateToCertifications}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel={t('farmer.dashboard.header.certLabel')}
            >
              <View style={styles.miniCardTitleRow}>
                <Icon name="shield" size={12} color={P.green200} />
                <Text style={styles.miniCardTitle}> Cert</Text>
              </View>
              <Text style={styles.miniCardValue}>Valid</Text>
            </TouchableOpacity>
            <View style={styles.headerMiniCard}>
              <View style={styles.miniCardTitleRow}>
                <Icon name="calendar_today" size={12} color={P.green200} />
                <Text style={styles.miniCardTitle}> Audit</Text>
              </View>
              <Text style={styles.miniCardValue}>In 12 days</Text>
            </View>
            <View style={styles.headerMiniCard}>
              <View style={styles.miniCardTitleRow}>
                <Icon name="star" size={12} color={P.green200} />
                <Text style={styles.miniCardTitle}> Rating</Text>
              </View>
              <Text style={styles.miniCardValue}>82/100</Text>
            </View>
          </View>
        </View>

        {/* Main Content Area */}
        <View style={styles.mainContent}>
          {/* Weather Card */}
          <TouchableOpacity style={styles.weatherCard} activeOpacity={0.9} onPress={onNavigateToWeather}>
            <View style={styles.weatherTop}>
              <View style={styles.weatherIconContainer}>
                <Icon name="wb_sunny" size={32} color={P.orange500} />
              </View>
              <View style={styles.weatherInfo}>
                <View style={styles.locationRow}>
                  <Icon name="place" size={12} color={P.grey600} />
                  <Text style={styles.locationText}>Ooty, Nilgiris</Text>
                </View>
                <View style={styles.tempRow}>
                  <Text style={styles.temperature}>22°</Text>
                  <Text style={styles.condition}>Sunny</Text>
                </View>
              </View>
              <TouchableOpacity style={styles.forecastButton} onPress={onNavigateToWeather}>
                <Text style={styles.forecastText}>7-day {'>'}</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.weatherBottom}>
              <View style={styles.weatherStat}>
                <Icon name="water_drop" size={14} color={P.lightBlue700} />
                <Text style={styles.weatherStatValue}> 78% </Text>
                <Text style={styles.weatherStatLabel}>Humidity</Text>
              </View>
              <View style={styles.weatherStat}>
                <Icon name="air" size={14} color={P.blueGrey400} />
                <Text style={styles.weatherStatValue}> 12 </Text>
                <Text style={styles.weatherStatLabel}>km/h</Text>
              </View>
              <View style={styles.weatherStat}>
                <Icon name="rainy" size={14} color={P.blue700} />
                <Text style={styles.weatherStatValue}> 20% </Text>
                <Text style={styles.weatherStatLabel}>Rain</Text>
              </View>
            </View>
          </TouchableOpacity>

          {/* BR-01/BR-02: market-blocked banner. Computed above via
              evalMarketBlock but was never rendered in the redesign --
              hiding a real access-block from the farmer is worse than the
              banner looking unpolished, so it's restored here rather than
              left as dead state. */}
          {marketBlockState.isBlocked && marketBlockState.messageKey ? (
            <View style={[styles.alertCard, { backgroundColor: P.palePinkBg }]}>
              <Icon name="block" size={24} color={colors.danger} />
              <View style={styles.alertContent}>
                <Text style={[styles.alertTitle, { color: colors.danger }]}>
                  {t('farmer.dashboard.banner.marketBlockedTitle')}
                </Text>
                <Text style={styles.alertMessage}>
                  {t(marketBlockState.messageKey as TranslationKey)}
                </Text>
              </View>
            </View>
          ) : certWarning?.isWarning ? (
            <View style={styles.alertCard}>
              <Icon name="warning" size={24} color={P.orange900} />
              <View style={styles.alertContent}>
                <Text style={styles.alertTitle}>
                  {certWarning.isExpired
                    ? t('farmer.dashboard.banner.certExpired')
                    : t('farmer.dashboard.banner.certExpiringTitle')}
                </Text>
                <Text style={styles.alertMessage}>
                  {certWarning.isExpired
                    ? t('farmer.dashboard.banner.certExpired')
                    : `${certWarning.daysRemaining} days remaining`}
                </Text>
                <TouchableOpacity onPress={onNavigateToCertifications}>
                  <Text style={styles.alertAction}>Renew certificate {'>'}</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : null}

          {/* Alert Card */}
          <View style={styles.alertCard}>
            <Icon name="warning" size={24} color={P.orange900} />
            <View style={styles.alertContent}>
              <Text style={styles.alertTitle}>Counter-offer received</Text>
              <Text style={styles.alertMessage}>Admin offered ₹42/kg for your tomatoes. Respond within 24 hours.</Text>
              <TouchableOpacity onPress={onNavigateToReviewOffer}>
                <Text style={styles.alertAction}>Review offer {'>'}</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Grid Menu */}
          <View style={styles.gridContainer}>
            <TouchableOpacity 
              style={styles.gridCard} 
              onPress={onNavigateToCropManagement || onNavigateToFarmManagement}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel="Crop Management"
            >
              <View style={[styles.gridIconCircle, { backgroundColor: P.paleMintBg }]}>
                <Icon name="eco" size={20} color={colors.brandGreen} />
              </View>
              <Text style={styles.gridTitle}>Crop Management</Text>
              <Text style={styles.gridSubtitle}>3 crops · diary due</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.gridCard} onPress={onNavigateToCertifications}>
              <View style={[styles.gridIconCircle, { backgroundColor: P.paleLavenderBg }]}>
                <Icon name="verified" size={20} color={P.violetAccent} />
              </View>
              <Text style={styles.gridTitle}>Certifications</Text>
              <Text style={styles.gridSubtitle}>Cert renewal in 24 days</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.gridCard} onPress={onNavigateToListings}>
              <View style={[styles.gridIconCircle, { backgroundColor: P.palePeachBg }]}>
                <Icon name="shopping_cart" size={20} color={P.deepOrange600} />
              </View>
              <View style={styles.badgeContainer}>
                <Text style={styles.badgeText}>1</Text>
              </View>
              <Text style={styles.gridTitle}>Marketing</Text>
              <Text style={styles.gridSubtitle}>1 counter offer pending</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.gridCard} onPress={onNavigateToInventory}>
              <View style={[styles.gridIconCircle, { backgroundColor: P.paleSkyBg }]}>
                <Icon name="inventory_2" size={20} color={P.blue700} />
              </View>
              <Text style={styles.gridTitle}>Inventory</Text>
              <Text style={styles.gridSubtitle}>Tractor service due</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.gridCard} onPress={onNavigateToTohfaCalendar}>
              <View style={[styles.gridIconCircle, { backgroundColor: P.paleCreamBg }]}>
                <Icon name="calendar_month" size={20} color={P.amber600} />
              </View>
              <Text style={styles.gridTitle}>TOHFA Calendar</Text>
              <Text style={styles.gridSubtitle}>Market day tomorrow</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.gridCard}
              onPress={onNavigateToLearningHub}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel="Learning Hub"
            >
              <View style={[styles.gridIconCircle, { backgroundColor: P.palePinkBg }]}>
                <Icon name="menu_book" size={20} color={P.red600} />
              </View>
              <View style={styles.badgeContainer}>
                <Text style={styles.badgeText}>4</Text>
              </View>
              <Text style={styles.gridTitle}>Learning Hub</Text>
              <Text style={styles.gridSubtitle}>4 new tutorials</Text>
            </TouchableOpacity>
          </View>

          {/* Active Crops */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Active Crops</Text>
            <TouchableOpacity onPress={onNavigateToActiveCrops} activeOpacity={0.75}>
              <Text style={styles.viewAllText}>View all {'>'}</Text>
            </TouchableOpacity>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.cropsScroll}
            contentContainerStyle={styles.cropsScrollContent}
          >
            <TouchableOpacity 
              style={styles.cropCard}
              activeOpacity={0.85}
              onPress={onNavigateToActiveCrops}
            >
              <Image 
                source={{ uri: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=400&q=80' }} 
                style={styles.cropImagePlaceholder}
                resizeMode="cover"
              />
              <View style={styles.cropInfo}>
                <Text style={styles.cropName}>Tomato</Text>
                <Text style={styles.cropDetail}>Zone A · 62 days</Text>
                <Text style={[styles.cropHarvest, { color: colors.brandGreen }]}>Harvest in 8d</Text>
                <View style={styles.progressBarBg}>
                  <View style={[styles.progressBarFill, { width: '80%', backgroundColor: colors.brandGreen }]} />
                </View>
              </View>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.cropCard}
              activeOpacity={0.85}
              onPress={onNavigateToActiveCrops}
            >
              <Image 
                source={{ uri: 'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?w=400&q=80' }} 
                style={styles.cropImagePlaceholder}
                resizeMode="cover"
              />
              <View style={styles.cropInfo}>
                <Text style={styles.cropName}>Carrot</Text>
                <Text style={styles.cropDetail}>Zone B · 34 days</Text>
                <Text style={[styles.cropHarvest, { color: P.orange700 }]}>Harvest in 41d</Text>
                <View style={styles.progressBarBg}>
                  <View style={[styles.progressBarFill, { width: '40%', backgroundColor: P.orange700 }]} />
                </View>
              </View>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.cropCard}
              activeOpacity={0.85}
              onPress={onNavigateToActiveCrops}
            >
              <Image 
                source={{ uri: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=400&q=80' }} 
                style={styles.cropImagePlaceholder}
                resizeMode="cover"
              />
              <View style={styles.cropInfo}>
                <Text style={styles.cropName}>Wheat</Text>
                <Text style={styles.cropDetail}>Zone C · 14 days</Text>
                <Text style={[styles.cropHarvest, { color: P.blue700 }]}>Harvest in 90d</Text>
                <View style={styles.progressBarBg}>
                  <View style={[styles.progressBarFill, { width: '15%', backgroundColor: P.blue700 }]} />
                </View>
              </View>
            </TouchableOpacity>
          </ScrollView>

          {/* Action Buttons */}
          <View style={styles.actionButtonsRow}>
            <TouchableOpacity style={styles.actionButton} onPress={onNavigateToFarmDiary}>
              <Icon name="edit_note" size={22} color={colors.brandGreen} style={styles.actionButtonIcon} />
              <Text style={styles.actionButtonText}>Farm Diary</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton} onPress={onNavigateToMyListings}>
              <Icon name="assignment" size={22} color={colors.brandGreen} style={styles.actionButtonIcon} />
              <Text style={styles.actionButtonText}>My Listings</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton} onPress={onNavigateToAttendance}>
              <Icon name="groups" size={22} color={colors.brandGreen} style={styles.actionButtonIcon} />
              <Text style={styles.actionButtonText}>Attendance</Text>
            </TouchableOpacity>
          </View>

          {/* Tip of the Day */}
          <View style={styles.tipCard}>
            <View style={styles.tipBadge}>
              <Text style={styles.tipBadgeText}>TIP OF THE DAY</Text>
            </View>
            <Text style={styles.tipTitle}>Mulch before the dry spell</Text>
            <Text style={styles.tipText}>Apply a 5cm layer of straw mulch around tomato beds this week to retain soil moisture as temperatures rise.</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: P.lightSurfaceAlt },
  scrollContent: { paddingBottom: 20 },
  skeletonContainer: { padding: 20, gap: 12 },
  skeletonItem: { borderRadius: 8 },
  skeletonCard: { borderRadius: 16, marginTop: 8 },

  headerBackground: {
    backgroundColor: P.deepGreen,
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  profileImagePlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: P.green200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileImageText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: P.deepGreen,
  },
  greetingText: {
    color: P.green200,
    fontSize: 14,
  },
  nameText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerIconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  notificationDot: {
    position: 'absolute',
    top: 7,
    right: 7,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: P.redAccent200,
    borderWidth: 1.5,
    borderColor: P.deepGreen,
  },
  headerCardsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  headerMiniCard: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.15)',
    padding: 10,
    borderRadius: 12,
  },
  miniCardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  miniCardTitle: {
    color: P.green200,
    fontSize: 12,
  },
  miniCardValue: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },

  mainContent: {
    paddingHorizontal: 20,
    marginTop: -20,
    gap: 20,
  },

  weatherCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    shadowColor: P.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  weatherTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  weatherIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 15,
    backgroundColor: P.orange50,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  weatherInfo: {
    flex: 1,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  locationText: {
    color: P.grey600,
    fontSize: 13,
  },
  tempRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  temperature: {
    fontSize: 28,
    fontWeight: 'bold',
    color: P.grey900,
  },
  condition: {
    fontSize: 16,
    color: P.grey600,
  },
  forecastButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: P.lightGreen50,
    borderRadius: 12,
  },
  forecastText: {
    color: colors.brandGreen,
    fontSize: 12,
    fontWeight: 'bold',
  },
  weatherBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: P.grey100,
  },
  weatherStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  weatherStatValue: {
    fontSize: 13,
    fontWeight: 'bold',
    color: P.grey900,
  },
  weatherStatLabel: {
    fontSize: 13,
    color: P.grey600,
  },

  alertCard: {
    backgroundColor: P.orange50,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    gap: 12,
    borderWidth: 1,
    borderColor: P.orange100,
  },
  alertContent: {
    flex: 1,
  },
  alertTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: P.orange900,
    marginBottom: 4,
  },
  alertMessage: {
    fontSize: 13,
    color: P.orange900,
    marginBottom: 8,
    lineHeight: 18,
  },
  alertAction: {
    fontSize: 13,
    fontWeight: 'bold',
    color: P.deepOrange800,
  },

  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 15,
  },
  gridCard: {
    width: '47%',
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    shadowColor: P.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
    position: 'relative',
  },
  gridIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  badgeContainer: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: P.redAccent200,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  gridTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: P.grey900,
    marginBottom: 4,
  },
  gridSubtitle: {
    fontSize: 12,
    color: P.grey600,
  },

  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: P.grey900,
  },
  viewAllText: {
    fontSize: 13,
    color: colors.brandGreen,
    fontWeight: 'bold',
  },
  cropsScroll: {
    marginHorizontal: -20,
  },
  cropsScrollContent: {
    paddingHorizontal: 20,
    paddingVertical: 4,
  },
  cropCard: {
    width: 172,
    backgroundColor: P.white,
    borderRadius: 18,
    marginRight: 14,
    borderWidth: 1,
    borderColor: P.twGray100,
    shadowColor: P.black,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    overflow: 'hidden',
  },
  cropImagePlaceholder: {
    height: 104,
    width: '100%',
    backgroundColor: P.twGray100,
  },
  cropInfo: {
    padding: 13,
  },
  cropName: {
    fontSize: 15.5,
    fontWeight: '700',
    color: P.twGray900,
    marginBottom: 2,
    letterSpacing: -0.2,
  },
  cropDetail: {
    fontSize: 12,
    color: P.twGray500,
    marginBottom: 10,
  },
  cropHarvest: {
    fontSize: 12.5,
    fontWeight: '700',
    marginBottom: 6,
  },
  progressBarBg: {
    height: 5,
    backgroundColor: P.twGray100,
    borderRadius: 3,
    width: '100%',
    overflow: 'hidden',
  },
  progressBarFill: {
    height: 5,
    borderRadius: 3,
  },

  actionButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  actionButton: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    marginHorizontal: 4,
    shadowColor: P.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  actionButtonIcon: {
    marginBottom: 8,
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: P.grey900,
  },

  tipCard: {
    backgroundColor: colors.brandGreenLight,
    borderRadius: 16,
    padding: 20,
    marginBottom: 0,
  },
  tipBadge: {
    backgroundColor: colors.brandGreen,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  tipBadgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  tipTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: P.deepGreen,
    marginBottom: 8,
  },
  tipText: {
    fontSize: 13,
    color: colors.brandGreen,
    lineHeight: 20,
  },
});
