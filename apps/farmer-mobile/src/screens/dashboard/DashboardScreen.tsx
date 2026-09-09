import React, { useCallback, useEffect, useState } from 'react';
import {
  Pressable,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
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
      const [profileRes, certsRes, configRes] = await Promise.all([
        getMyFarmerProfile(),
        getMyCertifications(undefined, 5),
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
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.welcomeText}>
            {t('dashboard.welcome', { name: profile?.fullName ?? 'Farmer' })}
          </Text>
          <Text style={styles.farmerIdText}>{profile?.tohfaFarmerId ?? ''}</Text>
        </View>

        {error ? (
          <Card style={styles.errorCard}>
            <Text style={styles.errorText}>{error}</Text>
            <Button
              title={t('common.retry')}
              variant="outline"
              onPress={() => void loadData()}
            />

          </Card>
        ) : null}

        {/* BR-01 & BR-02: Market Blocked Alert Banner */}
        {marketBlockState.isBlocked && marketBlockState.messageKey ? (
          <View style={styles.marketBlockedBanner} accessibilityRole="alert">
            <View style={styles.bannerIconRow}>
              <Icon name="warning" size={24} color={colors.white} />
              <Text style={styles.bannerTitle}>
                {t(marketBlockState.messageKey as TranslationKey)}
              </Text>
            </View>
            <Pressable
              style={styles.bannerActionButton}
              onPress={() => onNavigateToCertifications?.()}
              accessibilityRole="button"
            >
              <Text style={styles.bannerActionText}>{t('dashboard.cert.renewAction')}</Text>
            </Pressable>
          </View>
        ) : null}


        {/* Certificate Expiry Warning / Status Card */}
        <Card style={styles.certCard}>
          <View style={styles.cardHeaderRow}>
            <View style={styles.cardTitleContainer}>
              <Icon name="verified" size={20} color={colors.primary} />
              <Text style={styles.cardTitle}>{t('certifications.title')}</Text>
            </View>
            {activeCert ? (
              <Badge
                label={
                  activeCert.verificationStatus === 'VERIFIED'
                    ? t('certifications.status.VERIFIED')
                    : activeCert.verificationStatus === 'UNVERIFIED'
                      ? t('certifications.status.UNVERIFIED')
                      : t('certifications.status.REJECTED')
                }
                variant={
                  activeCert.verificationStatus === 'VERIFIED'
                    ? 'success'
                    : activeCert.verificationStatus === 'UNVERIFIED'
                      ? 'warning'
                      : 'danger'
                }
              />
            ) : null}
          </View>

          {activeCert ? (
            <View style={styles.certBody}>
              <Text style={styles.certNumberText}>
                {activeCert.certType} • {activeCert.certNumber}
              </Text>
              <Text style={styles.certIssuerText}>{activeCert.issuingBody}</Text>

              {/* Server-computed daysToExpiry countdown */}
              <View
                style={[
                  styles.expiryBadge,
                  certWarning?.isWarning ? styles.expiryBadgeWarning : styles.expiryBadgeSafe,
                ]}
              >
                <Icon
                  name="schedule"
                  size={18}
                  color={certWarning?.isWarning ? colors.danger : colors.primary}
                />
                <Text
                  style={[
                    styles.expiryBadgeText,
                    certWarning?.isWarning
                      ? styles.expiryBadgeTextWarning
                      : styles.expiryBadgeTextSafe,
                  ]}
                >
                  {certWarning?.isExpired
                    ? t('dashboard.cert.expired')
                    : certWarning?.isWarning
                      ? t('dashboard.cert.expiryWarning', { days: activeCert.daysToExpiry })
                      : t('dashboard.cert.valid', { days: activeCert.daysToExpiry })}
                </Text>
              </View>
            </View>
          ) : (
            <Text style={styles.emptyCertText}>{t('certifications.empty')}</Text>
          )}

          <Button
            title={t('dashboard.cert.renewAction')}
            variant="outline"
            onPress={() => onNavigateToCertifications?.()}
          />

        </Card>

        {/* Quick Actions Grid */}
        <View style={styles.actionsSection}>
          <Text style={styles.sectionTitle}>{t('dashboard.title')}</Text>
          <View style={styles.actionGrid}>
            <Pressable
              style={styles.actionItem}
              onPress={onNavigateToCreateListing}
              accessibilityRole="button"
            >
              <View style={[styles.actionIconCircle, { backgroundColor: colors.primary }]}>
                <Icon name="add" size={24} color={colors.white} />
              </View>
              <Text style={styles.actionItemLabel}>
                {t('dashboard.quickActions.createListing')}
              </Text>
            </Pressable>

            <Pressable
              style={styles.actionItem}
              onPress={onNavigateToListings}
              accessibilityRole="button"
            >
              <View style={[styles.actionIconCircle, { backgroundColor: colors.secondary }]}>
                <Icon name="inventory" size={24} color={colors.white} />
              </View>
              <Text style={styles.actionItemLabel}>{t('dashboard.quickActions.myListings')}</Text>
            </Pressable>

            <Pressable
              style={styles.actionItem}
              onPress={onNavigateToWallet}
              accessibilityRole="button"
            >
              <View style={[styles.actionIconCircle, { backgroundColor: colors.primary }]}>
                <Icon name="account_balance_wallet" size={24} color={colors.white} />
              </View>
              <Text style={styles.actionItemLabel}>{t('dashboard.quickActions.wallet')}</Text>
            </Pressable>

            <Pressable
              style={styles.actionItem}
              onPress={onNavigateToProfile}
              accessibilityRole="button"
            >
              <View style={[styles.actionIconCircle, { backgroundColor: colors.surfacePressed }]}>
                <Icon name="person" size={24} color={colors.primary} />
              </View>
              <Text style={styles.actionItemLabel}>{t('dashboard.quickActions.profile')}</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.surface },
  centerContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scrollContent: { padding: spacing.lg, gap: spacing.lg },
  header: { gap: spacing.xs },
  welcomeText: {
    fontSize: typography.headline,
    fontWeight: weights.bold,
    color: colors.onSurface,
  },
  farmerIdText: {
    fontSize: typography.caption,
    fontWeight: weights.medium,
    color: colors.onSurfaceVariant,
  },
  errorCard: {
    padding: spacing.md,
    backgroundColor: colors.surfaceVariant,
    borderColor: colors.danger,
    borderWidth: 1,
    gap: spacing.sm,
  },
  errorText: { color: colors.danger, fontSize: typography.body },
  marketBlockedBanner: {
    backgroundColor: colors.danger,
    borderRadius: radius.card,
    padding: spacing.lg,
    gap: spacing.md,
  },
  bannerIconRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  bannerTitle: {
    flex: 1,
    color: colors.white,
    fontSize: typography.bodyLarge,
    fontWeight: weights.semibold,
  },
  bannerActionButton: {
    backgroundColor: colors.white,
    minHeight: MIN_TOUCH_TARGET,
    borderRadius: radius.button,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
  },
  bannerActionText: {
    color: colors.danger,
    fontSize: typography.body,
    fontWeight: weights.bold,
  },
  certCard: {
    backgroundColor: colors.white,
    borderRadius: radius.cardMax,
    padding: spacing.lg,
    gap: spacing.md,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardTitleContainer: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  cardTitle: {
    fontSize: typography.title,
    fontWeight: weights.semibold,
    color: colors.onSurface,
  },
  certBody: { gap: spacing.xs },
  certNumberText: {
    fontSize: typography.bodyLarge,
    fontWeight: weights.bold,
    color: colors.onSurface,
  },
  certIssuerText: {
    fontSize: typography.body,
    color: colors.onSurfaceVariant,
  },
  expiryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    padding: spacing.sm,
    borderRadius: radius.card,
    marginTop: spacing.xs,
  },
  expiryBadgeWarning: {
    backgroundColor: colors.surfaceVariant,
    borderColor: colors.danger,
    borderWidth: 1,
  },
  expiryBadgeSafe: {
    backgroundColor: colors.surfaceVariant,
  },
  expiryBadgeText: { fontSize: typography.caption, fontWeight: weights.medium },
  expiryBadgeTextWarning: { color: colors.danger, fontWeight: weights.bold },
  expiryBadgeTextSafe: { color: colors.primary },
  emptyCertText: {
    fontSize: typography.body,
    color: colors.onSurfaceVariant,
  },
  actionsSection: { gap: spacing.md },
  sectionTitle: {
    fontSize: typography.title,
    fontWeight: weights.bold,
    color: colors.onSurface,
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  actionItem: {
    width: '47%',
    minHeight: 100,
    backgroundColor: colors.white,
    borderRadius: radius.card,
    padding: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  actionIconCircle: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionItemLabel: {
    fontSize: typography.caption,
    fontWeight: weights.medium,
    color: colors.onSurface,
    textAlign: 'center',
  },
  skeletonContainer: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  skeletonItem: {
    borderRadius: radius.sm,
  },
  skeletonCard: {
    borderRadius: radius.card,
  },
});
