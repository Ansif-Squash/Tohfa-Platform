import React, { useCallback, useEffect, useState } from 'react';
import {
  FlatList,
  Pressable,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  downloadInvoice,
  formatMoneyAmount,
  getMyInvoices,
  getMyWallet,
  getMyWalletTransactions,
  type Invoice,
  type Wallet,
  type WalletTransaction,
  type WalletTransactionType,
} from '../../api/wallet';
import { Badge } from '../../components/Badge';
import { Card } from '../../components/Card';
import { EmptyState } from '../../components/EmptyState';
import { ErrorState } from '../../components/ErrorState';
import { Icon } from '../../components/Icon';
import { Skeleton } from '../../components/Skeleton';
import { t, type TranslationKey } from '../../i18n';

import {
  MIN_TOUCH_TARGET,
  colors,
  radius,
  spacing,
  typography,
  weights,
} from '../../theme';

type TabKey = 'ALL' | 'CREDIT' | 'DEBIT' | 'ADJUST';

export function WalletScreen(): React.JSX.Element {
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [selectedTab, setSelectedTab] = useState<TabKey>('ALL');

  const [loadingWallet, setLoadingWallet] = useState<boolean>(true);
  const [loadingTxns, setLoadingTxns] = useState<boolean>(false);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Load wallet balance
  const loadWallet = useCallback(async () => {
    try {
      setError(null);
      const [walletRes, invoicesRes] = await Promise.all([
        getMyWallet(),
        getMyInvoices(),
      ]);
      setWallet(walletRes);
      setInvoices(invoicesRes.items);
    } catch {
      setError(t('error.generic'));
    } finally {
      setLoadingWallet(false);
    }
  }, []);

  // Re-query transactions from API on tab change (never filter client-side!)
  const loadTransactions = useCallback(async (tab: TabKey) => {
    try {
      setLoadingTxns(true);
      let queryType: WalletTransactionType | undefined;
      if (tab === 'CREDIT') queryType = 'SALE_CREDIT';
      else if (tab === 'DEBIT') queryType = 'PAYOUT_DEBIT';
      else if (tab === 'ADJUST') queryType = 'ADJUSTMENT';

      const res = await getMyWalletTransactions({ type: queryType });
      setTransactions(res.items);
    } catch {
      setError(t('error.generic'));
    } finally {
      setLoadingTxns(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadWallet();
  }, [loadWallet]);

  useEffect(() => {
    void loadTransactions(selectedTab);
  }, [selectedTab, loadTransactions]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    void loadWallet();
    void loadTransactions(selectedTab);
  }, [loadWallet, loadTransactions, selectedTab]);

  const handleDownloadInvoice = async (invoiceId: string) => {
    try {
      const res = await downloadInvoice(invoiceId);
      // Opens or provides download URL
      if (res.downloadUrl) {
        // Successfully fetched URL
      }
    } catch {
      setError(t('error.generic'));
    }
  };

  const renderTransactionItem = ({ item }: { item: WalletTransaction }) => {
    const isCredit =
      item.type === 'SALE_CREDIT' ||
      item.type === 'TOPUP_CASH' ||
      item.type === 'TOPUP_DIGITAL' ||
      item.type === 'ORDER_REFUND';

    return (
      <View style={styles.txnRow}>
        <View style={styles.txnIconContainer}>
          <Icon
            name={isCredit ? 'arrow_downward' : 'arrow_upward'}
            size={20}
            color={isCredit ? colors.primary : colors.danger}
          />
        </View>

        <View style={styles.txnDetails}>
          <Text style={styles.txnType}>
            {t(`wallet.type.${item.type}` as TranslationKey) || item.type}
          </Text>
          <Text style={styles.txnDate}>
            {new Date(item.createdAt).toLocaleDateString()}
          </Text>
        </View>


        <View style={styles.txnAmounts}>
          <Text
            style={[
              styles.txnAmount,
              isCredit ? styles.txnAmountCredit : styles.txnAmountDebit,
            ]}
          >
            {isCredit ? '+' : '-'}
            {formatMoneyAmount(item.amount)}
          </Text>
          <Text style={styles.txnBalanceAfter}>
            Bal: {formatMoneyAmount(item.balanceAfter)}
          </Text>
        </View>
      </View>
    );
  };

  if (loadingWallet) {
    return (
      <SafeAreaView style={styles.screen}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>{t('wallet.title')}</Text>
          </View>
          <View style={styles.skeletonContainer}>
            <Skeleton height={120} width="100%" style={styles.skeletonCard} />
            <Skeleton height={44} width="100%" style={styles.skeletonItem} />
            <Skeleton height={80} width="100%" style={styles.skeletonCard} />
            <Skeleton height={80} width="100%" style={styles.skeletonCard} />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  if (error && !wallet) {
    return (
      <SafeAreaView style={styles.screen}>
        <ErrorState
          error={error}
          onRetry={() => {
            setLoadingWallet(true);
            void loadWallet();
            void loadTransactions(selectedTab);
          }}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>{t('wallet.title')}</Text>
        </View>

        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {/* Balance Card: Formatted without float operations */}
        <Card style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>{t('wallet.balance')}</Text>
          <Text style={styles.balanceValue}>
            {wallet ? formatMoneyAmount(wallet.balance) : '₹0.00'}
          </Text>
          <View style={styles.walletMetaRow}>
            <Badge
              label={wallet?.status ?? 'ACTIVE'}
              variant={wallet?.status === 'ACTIVE' ? 'success' : 'danger'}
            />
            <Text style={styles.walletCurrency}>{wallet?.currency ?? 'INR'}</Text>
          </View>
        </Card>

        {/* Re-querying Filter Tabs (ALL / CREDIT / DEBIT / ADJUST) */}
        <View style={styles.tabsRow}>
          {(['ALL', 'CREDIT', 'DEBIT', 'ADJUST'] as const).map((tab) => {
            const tabKey =
              tab === 'ALL'
                ? 'wallet.tab.all'
                : tab === 'CREDIT'
                  ? 'wallet.tab.credit'
                  : tab === 'DEBIT'
                    ? 'wallet.tab.debit'
                    : 'wallet.tab.adjust';

            return (
              <Pressable
                key={tab}
                style={[styles.tabButton, selectedTab === tab && styles.tabButtonActive]}
                onPress={() => setSelectedTab(tab)}
                accessibilityRole="tab"
              >
                <Text
                  style={[
                    styles.tabButtonText,
                    selectedTab === tab && styles.tabButtonTextActive,
                  ]}
                >
                  {t(tabKey)}
                </Text>
              </Pressable>
            );
          })}
        </View>


        {/* Transactions Ledger */}
        <View style={styles.ledgerSection}>
          {loadingTxns ? (
            <View style={styles.skeletonContainer}>
              <Skeleton height={56} width="100%" style={styles.skeletonItem} />
              <Skeleton height={56} width="100%" style={styles.skeletonItem} />
              <Skeleton height={56} width="100%" style={styles.skeletonItem} />
            </View>
          ) : (
            <FlatList
              data={transactions}
              keyExtractor={(item) => item.id}
              renderItem={renderTransactionItem}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  colors={[colors.primary]}
                />
              }
              ListEmptyComponent={
                <EmptyState
                  title={t('wallet.transactions.empty') || 'No transactions found'}
                  message="Produce sales and payouts will appear here."
                  iconName="account_balance_wallet"
                />
              }
              contentContainerStyle={styles.listContent}
            />
          )}
        </View>

        {/* Invoices List */}
        {invoices.length > 0 ? (
          <View style={styles.invoicesSection}>
            <Text style={styles.sectionTitle}>{t('wallet.invoices.title')}</Text>
            {invoices.slice(0, 3).map((inv) => (
              <View key={inv.id} style={styles.invoiceRow}>
                <View style={styles.invoiceInfo}>
                  <Text style={styles.invoiceNumber}>{inv.invoiceNumber}</Text>
                  <Text style={styles.invoiceDate}>
                    {new Date(inv.issuedAt).toLocaleDateString()}
                  </Text>
                </View>
                <Text style={styles.invoiceAmount}>{formatMoneyAmount(inv.totalAmount)}</Text>
                <Pressable
                  style={styles.invoiceBtn}
                  onPress={() => void handleDownloadInvoice(inv.id)}
                  accessibilityRole="button"
                >
                  <Icon name="download" size={18} color={colors.primary} />
                </Pressable>
              </View>
            ))}
          </View>
        ) : null}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.surface },
  centerContainer: { padding: spacing.xl, alignItems: 'center', justifyContent: 'center' },
  container: { flex: 1, padding: spacing.lg, gap: spacing.md },
  header: { gap: spacing.xs },
  title: {
    fontSize: typography.headline,
    fontWeight: weights.bold,
    color: colors.onSurface,
  },
  errorBox: {
    padding: spacing.md,
    backgroundColor: colors.surfaceVariant,
    borderColor: colors.danger,
    borderWidth: 1,
    borderRadius: radius.card,
  },
  errorText: { color: colors.danger, fontSize: typography.body },
  balanceCard: {
    backgroundColor: colors.primary,
    borderRadius: radius.cardMax,
    padding: spacing.xl,
    gap: spacing.xs,
  },
  balanceLabel: {
    fontSize: typography.body,
    fontWeight: weights.medium,
    color: colors.surface,
  },
  balanceValue: {
    fontSize: 32,
    fontWeight: weights.bold,
    color: colors.white,
  },
  walletMetaRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.xs },
  walletCurrency: { color: colors.surface, fontSize: typography.caption },
  tabsRow: { flexDirection: 'row', gap: spacing.xs },
  tabButton: {
    flex: 1,
    minHeight: MIN_TOUCH_TARGET,
    borderRadius: radius.pill,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.surfacePressed,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
  },
  tabButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  tabButtonText: {
    fontSize: typography.caption,
    fontWeight: weights.medium,
    color: colors.onSurface,
  },
  tabButtonTextActive: {
    color: colors.white,
    fontWeight: weights.bold,
  },
  ledgerSection: { flex: 1 },
  listContent: { gap: spacing.sm, paddingBottom: spacing.lg },
  txnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    padding: spacing.md,
    borderRadius: radius.card,
    gap: spacing.sm,
  },
  txnIconContainer: {
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceVariant,
    alignItems: 'center',
    justifyContent: 'center',
  },
  txnDetails: { flex: 1, gap: 2 },
  txnType: {
    fontSize: typography.body,
    fontWeight: weights.semibold,
    color: colors.onSurface,
  },
  txnDate: {
    fontSize: typography.caption,
    color: colors.onSurfaceVariant,
  },
  txnAmounts: { alignItems: 'flex-end', gap: 2 },
  txnAmount: {
    fontSize: typography.body,
    fontWeight: weights.bold,
  },
  txnAmountCredit: { color: colors.primary },
  txnAmountDebit: { color: colors.danger },
  txnBalanceAfter: {
    fontSize: typography.caption,
    color: colors.onSurfaceVariant,
  },
  emptyContainer: { padding: spacing.xl, alignItems: 'center' },
  emptyText: { color: colors.onSurfaceVariant, fontSize: typography.body },
  invoicesSection: { gap: spacing.xs },
  sectionTitle: {
    fontSize: typography.title,
    fontWeight: weights.bold,
    color: colors.onSurface,
  },
  invoiceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    padding: spacing.sm,
    borderRadius: radius.card,
    gap: spacing.sm,
  },
  invoiceInfo: { flex: 1 },
  invoiceNumber: { fontSize: typography.caption, fontWeight: weights.bold, color: colors.onSurface },
  invoiceDate: { fontSize: typography.caption, color: colors.onSurfaceVariant },
  invoiceAmount: { fontSize: typography.caption, fontWeight: weights.bold, color: colors.onSurface },
  invoiceBtn: {
    minWidth: MIN_TOUCH_TARGET,
    minHeight: MIN_TOUCH_TARGET,
    alignItems: 'center',
    justifyContent: 'center',
  },
  skeletonContainer: {
    padding: spacing.md,
    gap: spacing.md,
  },
  skeletonItem: {
    borderRadius: radius.sm,
  },
  skeletonCard: {
    borderRadius: radius.card,
  },
});
