import React, { useCallback, useEffect, useState } from 'react';
import {
  Pressable,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Image,
} from 'react-native';
import {
  evalCertificateWarning,
  evalMarketBlock,
  getMyCertifications,
  getMyFarmerProfile,
  getSystemConfig,
  type Certification,
  type FarmerProfile,
} from '../../api/farmer';
import { Badge, Button, Card, ErrorState, Icon, Skeleton } from '@tohfa/mobile-ui';
import { t, type TranslationKey } from '../../i18n';

import {
  MIN_TOUCH_TARGET,
  colors,
  radius,
  spacing,
  typography,
  weights,
} from '../../theme';

interface DashboardScreenProps {
  onNavigateToListings?: () => void;
  onNavigateToCreateListing?: () => void;
  onNavigateToWallet?: () => void;
  onNavigateToProfile?: () => void;
  onNavigateToCertifications?: () => void;
}

export function DashboardScreen({
  onNavigateToListings,
  onNavigateToCreateListing,
  onNavigateToWallet,
  onNavigateToProfile,
  onNavigateToCertifications,
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
      // Temporary mock data to bypass backend errors
      setProfile({
        id: '1',
        fullName: 'Kumar',
        mobile: '+919876543210',
        status: 'ACTIVE'
      } as any);
      setCerts([]);
      setWarningThreshold(30);
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
              <TouchableOpacity style={styles.headerIconButton}>
                <Text style={styles.headerIconEmoji}>🔍</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.headerIconButton}>
                <Text style={styles.headerIconEmoji}>🔔</Text>
                <View style={styles.notificationDot} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Header Mini Cards */}
          <View style={styles.headerCardsRow}>
            <View style={styles.headerMiniCard}>
              <Text style={styles.miniCardTitle}>🛡️ Cert</Text>
              <Text style={styles.miniCardValue}>Valid</Text>
            </View>
            <View style={styles.headerMiniCard}>
              <Text style={styles.miniCardTitle}>📅 Audit</Text>
              <Text style={styles.miniCardValue}>In 12 days</Text>
            </View>
            <View style={styles.headerMiniCard}>
              <Text style={styles.miniCardTitle}>⭐ Rating</Text>
              <Text style={styles.miniCardValue}>82/100</Text>
            </View>
          </View>
        </View>

        {/* Main Content Area */}
        <View style={styles.mainContent}>
          {/* Weather Card */}
          <View style={styles.weatherCard}>
            <View style={styles.weatherTop}>
              <View style={styles.weatherIconContainer}>
                <Text style={styles.weatherSunEmoji}>☀️</Text>
              </View>
              <View style={styles.weatherInfo}>
                <View style={styles.locationRow}>
                  <Text style={styles.locationPin}>📍</Text>
                  <Text style={styles.locationText}>Ooty, Nilgiris</Text>
                </View>
                <View style={styles.tempRow}>
                  <Text style={styles.temperature}>22°</Text>
                  <Text style={styles.condition}>Sunny</Text>
                </View>
              </View>
              <TouchableOpacity style={styles.forecastButton}>
                <Text style={styles.forecastText}>7-day {'>'}</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.weatherBottom}>
              <View style={styles.weatherStat}>
                <Text style={styles.weatherStatEmoji}>💧</Text>
                <Text style={styles.weatherStatValue}> 78% </Text>
                <Text style={styles.weatherStatLabel}>Humidity</Text>
              </View>
              <View style={styles.weatherStat}>
                <Text style={styles.weatherStatEmoji}>💨</Text>
                <Text style={styles.weatherStatValue}> 12 </Text>
                <Text style={styles.weatherStatLabel}>km/h</Text>
              </View>
              <View style={styles.weatherStat}>
                <Text style={styles.weatherStatEmoji}>🌧️</Text>
                <Text style={styles.weatherStatValue}> 20% </Text>
                <Text style={styles.weatherStatLabel}>Rain</Text>
              </View>
            </View>
          </View>

          {/* Alert Card */}
          <View style={styles.alertCard}>
            <Text style={styles.alertIcon}>⚠️</Text>
            <View style={styles.alertContent}>
              <Text style={styles.alertTitle}>Counter-offer received</Text>
              <Text style={styles.alertMessage}>Admin offered ₹42/kg for your tomatoes. Respond within 24 hours.</Text>
              <TouchableOpacity>
                <Text style={styles.alertAction}>Review offer {'>'}</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Grid Menu */}
          <View style={styles.gridContainer}>
            <TouchableOpacity style={styles.gridCard} onPress={onNavigateToProfile}>
              <View style={[styles.gridIconCircle, { backgroundColor: '#F0F0FF' }]}>
                <Text style={styles.gridEmoji}>👤</Text>
              </View>
              <Text style={styles.gridTitle}>Profile</Text>
              <Text style={styles.gridSubtitle}>Cert renewal in 24 days</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.gridCard}>
              <View style={[styles.gridIconCircle, { backgroundColor: '#F0FFF0' }]}>
                <Text style={styles.gridEmoji}>🌱</Text>
              </View>
              <Text style={styles.gridTitle}>Farm Management</Text>
              <Text style={styles.gridSubtitle}>3 crops · diary due</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.gridCard} onPress={onNavigateToListings}>
              <View style={[styles.gridIconCircle, { backgroundColor: '#FFF0ED' }]}>
                <Text style={styles.gridEmoji}>🛒</Text>
              </View>
              <View style={styles.badgeContainer}>
                <Text style={styles.badgeText}>1</Text>
              </View>
              <Text style={styles.gridTitle}>Marketing</Text>
              <Text style={styles.gridSubtitle}>1 counter offer pending</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.gridCard}>
              <View style={[styles.gridIconCircle, { backgroundColor: '#F0F8FF' }]}>
                <Text style={styles.gridEmoji}>📦</Text>
              </View>
              <Text style={styles.gridTitle}>Inventory</Text>
              <Text style={styles.gridSubtitle}>Tractor service due</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.gridCard}>
              <View style={[styles.gridIconCircle, { backgroundColor: '#FFF5E6' }]}>
                <Text style={styles.gridEmoji}>🗓️</Text>
              </View>
              <Text style={styles.gridTitle}>TOHFA Calendar</Text>
              <Text style={styles.gridSubtitle}>Market day tomorrow</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.gridCard}>
              <View style={[styles.gridIconCircle, { backgroundColor: '#FFF0F5' }]}>
                <Text style={styles.gridEmoji}>📚</Text>
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
            <TouchableOpacity>
              <Text style={styles.viewAllText}>View all {'>'}</Text>
            </TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.cropsScroll}>
            <View style={styles.cropCard}>
              <View style={[styles.cropImagePlaceholder, { backgroundColor: '#FFD700' }]} />
              <View style={styles.cropInfo}>
                <Text style={styles.cropName}>Tomato</Text>
                <Text style={styles.cropDetail}>Zone A · 62 days</Text>
                <Text style={[styles.cropHarvest, { color: '#2E7D32' }]}>Harvest in 8d</Text>
                <View style={styles.progressBarBg}>
                  <View style={[styles.progressBarFill, { width: '80%', backgroundColor: '#2E7D32' }]} />
                </View>
              </View>
            </View>
            <View style={styles.cropCard}>
              <View style={[styles.cropImagePlaceholder, { backgroundColor: '#FF8C00' }]} />
              <View style={styles.cropInfo}>
                <Text style={styles.cropName}>Carrot</Text>
                <Text style={styles.cropDetail}>Zone B · 34 days</Text>
                <Text style={[styles.cropHarvest, { color: '#F57C00' }]}>Harvest in 41d</Text>
                <View style={styles.progressBarBg}>
                  <View style={[styles.progressBarFill, { width: '40%', backgroundColor: '#F57C00' }]} />
                </View>
              </View>
            </View>
          </ScrollView>

          {/* Action Buttons */}
          <View style={styles.actionButtonsRow}>
            <TouchableOpacity style={styles.actionButton}>
              <Text style={styles.actionButtonEmoji}>📝</Text>
              <Text style={styles.actionButtonText}>Log Diary</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton}>
              <Text style={styles.actionButtonEmoji}>📋</Text>
              <Text style={styles.actionButtonText}>List Produce</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton}>
              <Text style={styles.actionButtonEmoji}>🧑‍🤝‍🧑</Text>
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
  screen: { flex: 1, backgroundColor: '#F8F9FA' },
  scrollContent: { paddingBottom: 100 },
  
  headerBackground: {
    backgroundColor: '#1B5E20',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 40,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
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
    backgroundColor: '#A5D6A7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileImageText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1B5E20',
  },
  greetingText: {
    color: '#A5D6A7',
    fontSize: 14,
  },
  nameText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  headerIconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  headerIconEmoji: {
    fontSize: 18,
  },
  notificationDot: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF5252',
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
  miniCardTitle: {
    color: '#A5D6A7',
    fontSize: 12,
    marginBottom: 4,
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
    shadowColor: '#000',
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
    backgroundColor: '#FFF3E0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  weatherSunEmoji: {
    fontSize: 32,
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
  locationPin: {
    fontSize: 12,
  },
  locationText: {
    color: '#757575',
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
    color: '#212121',
  },
  condition: {
    fontSize: 16,
    color: '#757575',
  },
  forecastButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: '#F1F8E9',
    borderRadius: 12,
  },
  forecastText: {
    color: '#2E7D32',
    fontSize: 12,
    fontWeight: 'bold',
  },
  weatherBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#F5F5F5',
  },
  weatherStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  weatherStatEmoji: {
    fontSize: 14,
  },
  weatherStatValue: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#212121',
  },
  weatherStatLabel: {
    fontSize: 13,
    color: '#757575',
  },

  alertCard: {
    backgroundColor: '#FFF3E0',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    gap: 12,
    borderWidth: 1,
    borderColor: '#FFE0B2',
  },
  alertIcon: {
    fontSize: 24,
  },
  alertContent: {
    flex: 1,
  },
  alertTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#E65100',
    marginBottom: 4,
  },
  alertMessage: {
    fontSize: 13,
    color: '#E65100',
    marginBottom: 8,
    lineHeight: 18,
  },
  alertAction: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#D84315',
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
    shadowColor: '#000',
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
  gridEmoji: {
    fontSize: 20,
  },
  badgeContainer: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: '#FF5252',
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
    color: '#212121',
    marginBottom: 4,
  },
  gridSubtitle: {
    fontSize: 12,
    color: '#757575',
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
    color: '#212121',
  },
  viewAllText: {
    fontSize: 13,
    color: '#2E7D32',
    fontWeight: 'bold',
  },
  cropsScroll: {
    marginHorizontal: -20,
    paddingHorizontal: 20,
  },
  cropCard: {
    width: 160,
    backgroundColor: 'white',
    borderRadius: 16,
    marginRight: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
    overflow: 'hidden',
  },
  cropImagePlaceholder: {
    height: 100,
    width: '100%',
  },
  cropInfo: {
    padding: 12,
  },
  cropName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#212121',
    marginBottom: 2,
  },
  cropDetail: {
    fontSize: 12,
    color: '#757575',
    marginBottom: 8,
  },
  cropHarvest: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  progressBarBg: {
    height: 4,
    backgroundColor: '#EEEEEE',
    borderRadius: 2,
    width: '100%',
  },
  progressBarFill: {
    height: 4,
    borderRadius: 2,
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  actionButtonEmoji: {
    fontSize: 22,
    marginBottom: 8,
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#212121',
  },

  tipCard: {
    backgroundColor: '#E8F5E9',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  tipBadge: {
    backgroundColor: '#2E7D32',
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
    color: '#1B5E20',
    marginBottom: 8,
  },
  tipText: {
    fontSize: 13,
    color: '#2E7D32',
    lineHeight: 20,
  },
});
