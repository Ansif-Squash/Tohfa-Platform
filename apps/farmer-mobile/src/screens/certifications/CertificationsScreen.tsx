import React, { useCallback, useEffect, useState } from 'react';
import {
  FlatList,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  evalCertificateWarning,
  getMyCertifications,
  getSystemConfig,
  type Certification,
} from '../../api/farmer';
import { Badge, Button, Card, EmptyState, ErrorState, Icon, Skeleton } from '@tohfa/mobile-ui';
import { t } from '../../i18n';
import { colors, radius, spacing, typography, weights } from '../../theme';

interface CertificationsScreenProps {
  onNavigateToAddCertification?: () => void;
}

export function CertificationsScreen({
  onNavigateToAddCertification,
}: CertificationsScreenProps): React.JSX.Element {
  const [certs, setCerts] = useState<Certification[]>([]);
  const [warningThreshold, setWarningThreshold] = useState<number>(30);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const loadCerts = useCallback(async () => {
    try {
      setError(null);
      const [certsRes, configRes] = await Promise.all([
        getMyCertifications(),
        getSystemConfig(),
      ]);
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
    void loadCerts();
  }, [loadCerts]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    void loadCerts();
  }, [loadCerts]);

  const renderCertItem = ({ item }: { item: Certification }) => {
    const warning = evalCertificateWarning(item.daysToExpiry, warningThreshold);

    return (
      <Card style={styles.certItemCard}>
        <View style={styles.cardTopRow}>
          <View style={styles.typeBadgeContainer}>
            <Text style={styles.certType}>{item.certType}</Text>
            <Text style={styles.certNumber}>{item.certNumber}</Text>
          </View>

          <Badge
            label={
              item.verificationStatus === 'VERIFIED'
                ? t('certifications.status.VERIFIED')
                : item.verificationStatus === 'UNVERIFIED'
                  ? t('certifications.status.UNVERIFIED')
                  : t('certifications.status.REJECTED')
            }
            variant={
              item.verificationStatus === 'VERIFIED'
                ? 'success'
                : item.verificationStatus === 'UNVERIFIED'
                  ? 'warning'
                  : 'danger'
            }
          />
        </View>

        <Text style={styles.issuerText}>
          {t('certifications.issuingBody')}: {item.issuingBody}
        </Text>

        <Text style={styles.validityText}>
          {t('certifications.validity', { from: item.issuedOn, to: item.expiresOn })}
        </Text>

        {/* Server daysToExpiry warning */}
        <View
          style={[
            styles.countdownTag,
            warning.isWarning ? styles.countdownTagWarning : styles.countdownTagSafe,
          ]}
        >
          <Icon
            name="schedule"
            size={16}
            color={warning.isWarning ? colors.danger : colors.primary}
          />
          <Text
            style={[
              styles.countdownText,
              warning.isWarning ? styles.countdownTextWarning : styles.countdownTextSafe,
            ]}
          >
            {warning.isExpired
              ? t('certifications.expired')
              : t('certifications.daysLeft', { days: item.daysToExpiry })}
          </Text>
        </View>

        {item.blocksListings ? (
          <View style={styles.blocksBanner}>
            <Icon name="block" size={16} color={colors.danger} />
            <Text style={styles.blocksBannerText}>
              {warning.isExpired
                ? t('dashboard.banner.certExpired')
                : t('dashboard.banner.certUnverified')}
            </Text>
          </View>
        ) : null}
      </Card>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.screen}>
        <View style={styles.container}>
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>{t('certifications.title')}</Text>
              <Text style={styles.subtitle}>{t('certifications.subtitle')}</Text>
            </View>
          </View>
          <View style={styles.skeletonList}>
            <Skeleton height={140} width="100%" style={styles.skeletonCard} />
            <Skeleton height={140} width="100%" style={styles.skeletonCard} />
            <Skeleton height={140} width="100%" style={styles.skeletonCard} />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  if (error && certs.length === 0) {
    return (
      <SafeAreaView style={styles.screen}>
        <ErrorState
          error={error}
          onRetry={() => {
            setLoading(true);
            void loadCerts();
          }}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.container}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>{t('certifications.title')}</Text>
            <Text style={styles.subtitle}>{t('certifications.subtitle')}</Text>
          </View>
          <Button
            title={t('certifications.add')}
            variant="primary"
            onPress={() => onNavigateToAddCertification?.()}
          />
        </View>

        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <FlatList
          data={certs}
          keyExtractor={(item) => item.id}
          renderItem={renderCertItem}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[colors.primary]}
            />
          }
          ListEmptyComponent={
            <EmptyState
              title={t('certifications.empty') || 'No certificates found'}
              message="Upload your organic farming certificate to unlock marketplace produce listing."
              iconName="verified_user"
            />
          }
        />

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.surface },
  centerContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  container: { flex: 1, padding: spacing.lg, gap: spacing.md },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: typography.headline,
    fontWeight: weights.bold,
    color: colors.onSurface,
  },
  subtitle: {
    fontSize: typography.caption,
    color: colors.onSurfaceVariant,
  },
  errorBox: {
    padding: spacing.md,
    backgroundColor: colors.surfaceVariant,
    borderColor: colors.danger,
    borderWidth: 1,
    borderRadius: radius.card,
  },
  errorText: { color: colors.danger, fontSize: typography.body },
  listContent: { gap: spacing.md, paddingBottom: spacing.xxl },
  certItemCard: {
    backgroundColor: colors.white,
    borderRadius: radius.cardMax,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  typeBadgeContainer: { gap: spacing.xs },
  certType: {
    fontSize: typography.title,
    fontWeight: weights.bold,
    color: colors.onSurface,
  },
  certNumber: {
    fontSize: typography.caption,
    color: colors.onSurfaceVariant,
  },
  issuerText: {
    fontSize: typography.body,
    color: colors.onSurface,
  },
  validityText: {
    fontSize: typography.caption,
    color: colors.onSurfaceVariant,
  },
  countdownTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    padding: spacing.xs,
    borderRadius: radius.card,
    alignSelf: 'flex-start',
  },
  countdownTagWarning: {
    backgroundColor: colors.surfaceVariant,
    borderColor: colors.danger,
    borderWidth: 1,
  },
  countdownTagSafe: {
    backgroundColor: colors.surfaceVariant,
  },
  countdownText: {
    fontSize: typography.caption,
    fontWeight: weights.medium,
  },
  countdownTextWarning: { color: colors.danger, fontWeight: weights.bold },
  countdownTextSafe: { color: colors.primary },
  blocksBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.surfaceVariant,
    padding: spacing.sm,
    borderRadius: radius.card,
    borderLeftWidth: 3,
    borderLeftColor: colors.danger,
  },
  blocksBannerText: {
    flex: 1,
    color: colors.danger,
    fontSize: typography.caption,
    fontWeight: weights.semibold,
  },
  emptyContainer: {
    padding: spacing.xxl,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
  emptyText: {
    textAlign: 'center',
    color: colors.onSurfaceVariant,
    fontSize: typography.body,
  },
  skeletonList: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  skeletonCard: {
    borderRadius: radius.card,
  },
});
