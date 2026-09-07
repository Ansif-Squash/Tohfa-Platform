import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  computeRemainingTime,
  formatCountdown,
  getMyListings,
  withdrawListing,
  type Listing,
  type ListingStatus,
} from '../../api/listings';
import { Badge, Button, Card, EmptyState, ErrorState, Icon, Skeleton } from '@tohfa/mobile-ui';
import { t } from '../../i18n';
import { MIN_TOUCH_TARGET, colors, radius, spacing, typography, weights } from '../../theme';

interface ListingsScreenProps {
  onNavigateToCreateListing?: () => void;
  onNavigateToCounterOffer?: (listing: Listing) => void;
}

type TabType = 'ACTIVE' | 'SOLD' | 'CLOSED';

export function ListingsScreen({
  onNavigateToCreateListing,
  onNavigateToCounterOffer,
}: ListingsScreenProps): React.JSX.Element {
  const [currentTab, setCurrentTab] = useState<TabType>('ACTIVE');
  const [allListings, setAllListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<unknown | null>(null);
  const [withdrawingId, setWithdrawingId] = useState<string | null>(null);

  // Monotonic timer tick for real-time countdown on active counter-offers
  const clientBasePerfMsRef = useRef<number>(performance.now());
  const clientBaseDateMsRef = useRef<number>(Date.now());
  const [currentPerfMs, setCurrentPerfMs] = useState<number>(performance.now());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentPerfMs(performance.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const loadListings = useCallback(async () => {
    try {
      setError(null);
      const res = await getMyListings();
      setAllListings(res.items || []);
    } catch (err: unknown) {
      setError(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadListings();
  }, [loadListings]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    clientBasePerfMsRef.current = performance.now();
    clientBaseDateMsRef.current = Date.now();
    void loadListings();
  }, [loadListings]);

  // Tab filtering
  const filteredListings = useMemo(() => {
    if (currentTab === 'ACTIVE') {
      return allListings.filter(
        (l) => l.status === 'PENDING_APPROVAL' || l.status === 'COUNTER_OFFERED',
      );
    }
    if (currentTab === 'SOLD') {
      return allListings.filter((l) => l.status === 'ACCEPTED');
    }
    return allListings.filter(
      (l) => l.status === 'REJECTED' || l.status === 'WITHDRAWN' || l.status === 'EXPIRED',
    );
  }, [allListings, currentTab]);

  const handleWithdraw = useCallback(
    async (listing: Listing) => {
      Alert.alert(
        t('listings.withdraw.confirm') || 'Withdraw Listing',
        `Are you sure you want to withdraw listing #${listing.listingNumber}?`,
        [
          { text: t('common.cancel') || 'Cancel', style: 'cancel' },
          {
            text: t('listings.button.withdraw') || 'Withdraw',
            style: 'destructive',
            onPress: async () => {
              setWithdrawingId(listing.id);
              try {
                await withdrawListing(listing.id, listing.version);
                void loadListings();
              } catch (err: unknown) {
                const anyErr = err as { detail?: string; message?: string };
                Alert.alert('Error', anyErr.detail || anyErr.message || 'Failed to withdraw listing.');
              } finally {
                setWithdrawingId(null);
              }
            },
          },
        ],
      );
    },
    [loadListings],
  );

  const renderStatusBadge = (status: ListingStatus) => {
    switch (status) {
      case 'PENDING_APPROVAL':
        return <Badge label={t('listing.status.PENDING') || 'Pending Approval'} variant="warning" />;
      case 'COUNTER_OFFERED':
        return <Badge label={t('listing.status.COUNTER_OFFERED') || 'Counter-Offer'} variant="info" />;
      case 'ACCEPTED':
        return <Badge label={t('listing.status.APPROVED') || 'Sold'} variant="success" />;
      case 'REJECTED':
        return <Badge label={t('listing.status.REJECTED') || 'Rejected'} variant="danger" />;
      case 'WITHDRAWN':
        return <Badge label="Withdrawn" variant="info" />;
      case 'EXPIRED':
        return <Badge label="Expired" variant="danger" />;
      default:
        return <Badge label={status} variant="info" />;
    }
  };

  const renderListingItem = ({ item }: { item: Listing }) => {
    const isCounterOffered = item.status === 'COUNTER_OFFERED' && item.activeCounterOffer;

    // Countdown calculation for active counter-offer (BR-10)
    let remainingTimeText = '';
    let isOfferExpired = false;
    if (isCounterOffered && item.activeCounterOffer?.expiresAt) {
      const time = computeRemainingTime(
        item.activeCounterOffer.expiresAt,
        clientBaseDateMsRef.current,
        clientBasePerfMsRef.current,
        currentPerfMs,
      );
      isOfferExpired = time.isExpired;
      remainingTimeText = isOfferExpired ? 'Expired' : formatCountdown(time.remainingMs);
    }

    return (
      <Card
        style={[
          styles.listingCard,
          isCounterOffered ? styles.counterOfferCard : null,
        ]}
      >
        {/* Card Header: Crop name + Grade + Status */}
        <View style={styles.cardHeaderRow}>
          <View style={styles.cropTitleContainer}>
            <Text style={styles.cropNameText}>{item.cropName}</Text>
            <Text style={styles.gradeBadgeText}>{item.grade.replace('_', ' ')}</Text>
          </View>
          {renderStatusBadge(item.status)}
        </View>

        <Text style={styles.listingNumberText}>
          #{item.listingNumber} • Available: {item.availableFrom || 'Immediate'}
        </Text>

        {/* Pricing and Quantity Grid */}
        <View style={styles.metricsRow}>
          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>Quantity</Text>
            <Text style={styles.metricValue}>{item.quantityKg} kg</Text>
          </View>

          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>Asking Price</Text>
            <Text style={styles.metricValue}>₹{item.askingPricePerKg}/kg</Text>
          </View>

          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>Ceiling (BR-07)</Text>
            <Text style={styles.metricValueMuted}>₹{item.ceilingPricePerKg}/kg</Text>
          </View>
        </View>

        {/* Counter-Offer Banner with BR-10 Countdown Timer */}
        {isCounterOffered && item.activeCounterOffer ? (
          <View style={styles.counterOfferBanner}>
            <View style={styles.counterOfferHeaderRow}>
              <View style={styles.counterOfferTag}>
                <Icon name="swap_horiz" size={18} color={colors.secondary} />
                <Text style={styles.counterOfferTagText}>Counter-Offer Received</Text>
              </View>

              {/* 24-hr Expiry Countdown Badge */}
              <View
                style={[
                  styles.countdownBadge,
                  isOfferExpired ? styles.countdownBadgeExpired : styles.countdownBadgeActive,
                ]}
              >
                <Icon
                  name="schedule"
                  size={14}
                  color={isOfferExpired ? colors.danger : colors.primary}
                />
                <Text
                  style={[
                    styles.countdownText,
                    isOfferExpired ? styles.countdownTextExpired : styles.countdownTextActive,
                  ]}
                >
                  {remainingTimeText}
                </Text>
              </View>
            </View>

            <View style={styles.counterTermsRow}>
              <Text style={styles.counterOfferedPrice}>
                Offered: ₹{item.activeCounterOffer.pricePerKg}/kg
              </Text>
              <Text style={styles.counterOfferedQty}>
                Qty: {item.activeCounterOffer.quantityKg} kg
              </Text>
            </View>

            {item.activeCounterOffer.message ? (
              <Text style={styles.counterOfferNote} numberOfLines={2}>
                "{item.activeCounterOffer.message}"
              </Text>
            ) : null}

            <Button
              title={t('listings.button.reviewOffer') || 'Review Counter-Offer'}
              variant="primary"
              onPress={() => onNavigateToCounterOffer?.(item)}
              style={styles.reviewOfferButton}
            />
          </View>
        ) : null}

        {/* Sold / Accepted Details */}
        {item.status === 'ACCEPTED' && item.finalPricePerKg ? (
          <View style={styles.soldBanner}>
            <Icon name="check_circle" size={16} color={colors.success} />
            <Text style={styles.soldBannerText}>
              Sold at ₹{item.finalPricePerKg}/kg for {item.finalQuantityKg || item.quantityKg} kg
            </Text>
          </View>
        ) : null}

        {/* Rejection Details */}
        {item.status === 'REJECTED' && item.rejectionReason ? (
          <View style={styles.rejectedBanner}>
            <Icon name="cancel" size={16} color={colors.danger} />
            <Text style={styles.rejectedBannerText}>Reason: {item.rejectionReason}</Text>
          </View>
        ) : null}

        {/* Action Row for Pending Listing (Withdraw) */}
        {item.status === 'PENDING_APPROVAL' ? (
          <View style={styles.cardActionsRow}>
            <Button
              title={t('listings.button.withdraw') || 'Withdraw Listing'}
              variant="outline"
              loading={withdrawingId === item.id}
              disabled={withdrawingId === item.id}
              onPress={() => void handleWithdraw(item)}
              style={styles.withdrawButton}
            />
          </View>
        ) : null}
      </Card>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          {t('listings.title') || 'My Produce Listings'}
        </Text>
        <Pressable
          style={styles.newListingButton}
          onPress={() => onNavigateToCreateListing?.()}
          accessibilityRole="button"
          accessibilityLabel="Create produce listing"
        >
          <Icon name="add" size={20} color={colors.white} />
          <Text style={styles.newListingButtonText}>
            {t('listings.button.new') || 'New Listing'}
          </Text>
        </Pressable>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer} accessibilityRole="tablist">
        <Pressable
          style={[styles.tabButton, currentTab === 'ACTIVE' && styles.tabButtonActive]}
          onPress={() => setCurrentTab('ACTIVE')}
          accessibilityRole="tab"
          accessibilityState={{ selected: currentTab === 'ACTIVE' }}
        >
          <Text
            style={[styles.tabButtonText, currentTab === 'ACTIVE' && styles.tabButtonTextActive]}
          >
            {t('listings.tab.active') || 'Active / Review'}
          </Text>
        </Pressable>

        <Pressable
          style={[styles.tabButton, currentTab === 'SOLD' && styles.tabButtonActive]}
          onPress={() => setCurrentTab('SOLD')}
          accessibilityRole="tab"
          accessibilityState={{ selected: currentTab === 'SOLD' }}
        >
          <Text style={[styles.tabButtonText, currentTab === 'SOLD' && styles.tabButtonTextActive]}>
            {t('listings.tab.sold') || 'Sold'}
          </Text>
        </Pressable>

        <Pressable
          style={[styles.tabButton, currentTab === 'CLOSED' && styles.tabButtonActive]}
          onPress={() => setCurrentTab('CLOSED')}
          accessibilityRole="tab"
          accessibilityState={{ selected: currentTab === 'CLOSED' }}
        >
          <Text
            style={[styles.tabButtonText, currentTab === 'CLOSED' && styles.tabButtonTextActive]}
          >
            {t('listings.tab.closed') || 'Closed'}
          </Text>
        </Pressable>
      </View>

      {/* Main List */}
      {loading ? (
        <View style={styles.skeletonContainer}>
          <Skeleton height={140} width="100%" style={styles.skeletonCard} />
          <Skeleton height={140} width="100%" style={styles.skeletonCard} />
          <Skeleton height={140} width="100%" style={styles.skeletonCard} />
        </View>
      ) : error ? (
        <ErrorState
          error={error}
          onRetry={() => {
            setLoading(true);
            void loadListings();
          }}
        />
      ) : (
        <FlatList
          data={filteredListings}
          keyExtractor={(item) => item.id}
          renderItem={renderListingItem}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[colors.primary]}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <EmptyState
                iconName="inventory_2"
                title={
                  currentTab === 'ACTIVE'
                    ? t('listings.empty.active') || 'No active listings'
                    : currentTab === 'SOLD'
                      ? t('listings.empty.sold') || 'No sold listings'
                      : t('listings.empty.closed') || 'No closed listings'
                }
                message={
                  currentTab === 'ACTIVE'
                    ? 'Your active listings or pending counter-offers will appear here.'
                    : currentTab === 'SOLD'
                      ? 'Listings that have been accepted and finalized will appear here.'
                      : 'Rejected, expired, or withdrawn listings will appear here.'
                }
              />
              {currentTab === 'ACTIVE' ? (
                <Button
                  title={t('listings.button.new') || 'Create New Listing'}
                  variant="primary"
                  onPress={() => onNavigateToCreateListing?.()}
                  style={styles.emptyAction}
                />
              ) : null}
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfacePressed,
  },
  headerTitle: {
    fontSize: typography.title,
    fontWeight: weights.bold,
    color: colors.onSurface,
  },
  newListingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    minHeight: 38,
  },
  newListingButtonText: {
    color: colors.white,
    fontSize: typography.bodySmall,
    fontWeight: weights.bold,
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfacePressed,
  },
  tabButton: {
    flex: 1,
    paddingVertical: spacing.md,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
    minHeight: MIN_TOUCH_TARGET,
    justifyContent: 'center',
  },
  tabButtonActive: {
    borderBottomColor: colors.primary,
  },
  tabButtonText: {
    fontSize: typography.bodySmall,
    fontWeight: weights.medium,
    color: colors.onSurfaceVariant,
  },
  tabButtonTextActive: {
    color: colors.primary,
    fontWeight: weights.bold,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
    gap: spacing.md,
  },
  errorText: {
    fontSize: typography.body,
    color: colors.danger,
    textAlign: 'center',
  },
  listContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl * 2,
    gap: spacing.md,
  },
  listingCard: {
    padding: spacing.md,
    gap: spacing.xs,
  },
  counterOfferCard: {
    borderColor: colors.secondary,
    borderWidth: 1.5,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  cropTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  cropNameText: {
    fontSize: typography.headline,
    fontWeight: weights.bold,
    color: colors.onSurface,
  },
  gradeBadgeText: {
    fontSize: typography.caption,
    color: colors.onSurfaceVariant,
    backgroundColor: colors.surfacePressed,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    fontWeight: weights.medium,
  },
  listingNumberText: {
    fontSize: typography.caption,
    color: colors.onSurfaceVariant,
    marginBottom: spacing.xs,
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.surfacePressed,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfacePressed,
  },
  metricItem: {
    gap: 2,
  },
  metricLabel: {
    fontSize: typography.caption,
    color: colors.onSurfaceVariant,
  },
  metricValue: {
    fontSize: typography.body,
    fontWeight: weights.bold,
    color: colors.onSurface,
  },
  metricValueMuted: {
    fontSize: typography.body,
    fontWeight: weights.medium,
    color: colors.textMuted,
  },
  counterOfferBanner: {
    backgroundColor: colors.surfaceVariant,
    borderRadius: radius.md,
    padding: spacing.sm,
    marginTop: spacing.xs,
    gap: spacing.xs,
    borderWidth: 1,
    borderColor: colors.secondary,
  },
  counterOfferHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  counterOfferTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  counterOfferTagText: {
    fontSize: typography.bodySmall,
    fontWeight: weights.bold,
    color: colors.secondary,
  },
  countdownBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.pill,
  },
  countdownBadgeActive: {
    backgroundColor: colors.white,
  },
  countdownBadgeExpired: {
    backgroundColor: colors.surfacePressed,
  },
  countdownText: {
    fontSize: typography.caption,
    fontWeight: weights.bold,
  },
  countdownTextActive: {
    color: colors.primary,
  },
  countdownTextExpired: {
    color: colors.danger,
  },
  counterTermsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  counterOfferedPrice: {
    fontSize: typography.body,
    fontWeight: weights.bold,
    color: colors.onSurface,
  },
  counterOfferedQty: {
    fontSize: typography.bodySmall,
    color: colors.onSurfaceVariant,
  },
  counterOfferNote: {
    fontSize: typography.caption,
    fontStyle: 'italic',
    color: colors.onSurfaceVariant,
  },
  reviewOfferButton: {
    marginTop: spacing.xs,
  },
  soldBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: spacing.xs,
    backgroundColor: colors.surfaceVariant,
    padding: spacing.xs,
    borderRadius: radius.sm,
  },
  soldBannerText: {
    fontSize: typography.bodySmall,
    fontWeight: weights.bold,
    color: colors.success,
  },
  rejectedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: spacing.xs,
    backgroundColor: colors.surfacePressed,
    padding: spacing.xs,
    borderRadius: radius.sm,
  },
  rejectedBannerText: {
    fontSize: typography.caption,
    color: colors.danger,
  },
  cardActionsRow: {
    marginTop: spacing.xs,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  withdrawButton: {
    paddingHorizontal: spacing.md,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl * 2,
    gap: spacing.sm,
  },
  emptyText: {
    fontSize: typography.bodyLarge,
    color: colors.onSurfaceVariant,
    textAlign: 'center',
  },
  emptyAction: {
    marginTop: spacing.md,
  },
  skeletonContainer: {
    padding: spacing.md,
    gap: spacing.md,
  },
  skeletonCard: {
    borderRadius: radius.card,
  },
});
