import React, { useState } from 'react';
import {
  Alert,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Circle, Line, Path, Rect } from 'react-native-svg';
import { authPalette as P, colors } from '../../theme';

// ── SVG Icons ────────────────────────────────────────────────────────────────

function ArrowBackIcon({ size = 20, color = P.deepGreen }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M19 12H5M5 12L12 19M5 12L12 5"
        stroke={color}
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function BanknoteCashIcon({ size = 18, color = P.white }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="2" y="6" width="20" height="12" rx="2" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Circle cx="12" cy="12" r="3" stroke={color} strokeWidth="2" />
      <Path d="M6 12h.01M18 12h.01" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function CheckmarkCircleIcon({ size = 13, color = colors.brandGreen }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth="2" />
      <Path d="M8.5 12l2.5 2.5 5-5" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

// ── Types & Data ─────────────────────────────────────────────────────────────

export interface WorkerPayrollItem {
  id: string;
  name: string;
  initials: string;
  calcSubtitle: string;
  status: 'pending' | 'paid';
  grossSalary?: string;
  advanceTaken?: string;
  monthlySalary?: string;
  netPayable: string;
  netPayableNumber: number;
  paidDetails?: string;
  avatarBg: string;
  avatarColor: string;
}

const INITIAL_PAYROLL: WorkerPayrollItem[] = [
  {
    id: 'w1',
    name: 'Murugan R.',
    initials: 'MR',
    calcSubtitle: '12 days × ₹450 · 84 h',
    status: 'pending',
    grossSalary: '₹5,400',
    advanceTaken: '- ₹1,000',
    netPayable: '₹4,400',
    netPayableNumber: 4400,
    avatarBg: P.twGreen100,
    avatarColor: P.twGreen800,
  },
  {
    id: 'w2',
    name: 'Selvi K.',
    initials: 'SK',
    calcSubtitle: 'Monthly salary · 98 h',
    status: 'pending',
    monthlySalary: '₹12,000',
    netPayable: '₹12,000',
    netPayableNumber: 12000,
    avatarBg: P.twOrange100,
    avatarColor: P.twOrange700,
  },
  {
    id: 'w3',
    name: 'Lakshmi D.',
    initials: 'LD',
    calcSubtitle: '11 days × ₹400 · 77 h',
    status: 'paid',
    netPayable: '₹4,400',
    netPayableNumber: 4400,
    paidDetails: 'Paid via UPI · 15 Jul',
    avatarBg: P.twPurple100,
    avatarColor: P.deepPurple600,
  },
];

export interface PayrollScreenProps {
  onBack?: () => void;
  onNavigateToWorkerDetail?: (id: string, name: string) => void;
}

export function PayrollScreen({ onBack, onNavigateToWorkerDetail }: PayrollScreenProps): React.JSX.Element {
  const [payrollItems, setPayrollItems] = useState<WorkerPayrollItem[]>(INITIAL_PAYROLL);

  const pendingCount = payrollItems.filter((i) => i.status === 'pending').length;
  const paidCount = payrollItems.filter((i) => i.status === 'paid').length;
  const pendingTotal = payrollItems
    .filter((i) => i.status === 'pending')
    .reduce((sum, item) => sum + item.netPayableNumber, 0);

  const handlePayout = (worker: WorkerPayrollItem) => {
    Alert.alert(
      'Process Payout',
      `Confirm payout of ${worker.netPayable} to ${worker.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Pay via UPI',
          onPress: () => {
            setPayrollItems((prev) =>
              prev.map((item) =>
                item.id === worker.id
                  ? {
                      ...item,
                      status: 'paid',
                      paidDetails: `Paid via UPI · ${new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}`,
                    }
                  : item,
              ),
            );
            Alert.alert('Payment Successful', `Payout of ${worker.netPayable} recorded for ${worker.name}.`);
          },
        },
      ],
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={P.white} />
      <View style={styles.container}>
        {/* ── Top Header ── */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={onBack}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Back"
          >
            <ArrowBackIcon size={20} color={P.deepGreen} />
          </TouchableOpacity>

          <View style={styles.headerTitles}>
            <Text style={styles.headerTitle}>Payroll</Text>
            <Text style={styles.headerSubtitle}>July 2026</Text>
          </View>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* ── Total Payable Banner Card ── */}
          <View style={styles.totalPayableCard}>
            <Text style={styles.totalPayableLabel}>Total payable · July</Text>
            <Text style={styles.totalPayableAmount}>₹20,800</Text>

            {/* 3-column stats bar */}
            <View style={styles.totalPayableStatsRow}>
              <View style={styles.payableStatCol}>
                <Text style={styles.payableStatNumber}>3</Text>
                <Text style={styles.payableStatLabel}>workers</Text>
              </View>

              <View style={styles.payableStatDivider} />

              <View style={styles.payableStatCol}>
                <Text style={styles.payableStatNumber}>₹{pendingTotal.toLocaleString('en-IN')}</Text>
                <Text style={styles.payableStatLabel}>still pending</Text>
              </View>

              <View style={styles.payableStatDivider} />

              <View style={styles.payableStatCol}>
                <Text style={styles.payableStatNumber}>{paidCount}</Text>
                <Text style={styles.payableStatLabel}>paid</Text>
              </View>
            </View>
          </View>

          {/* ── Section: PER WORKER ── */}
          <Text style={styles.sectionHeader}>PER WORKER</Text>

          {/* ── Worker Cards ── */}
          <View style={styles.workersList}>
            {payrollItems.map((worker) => (
              <View key={worker.id} style={styles.workerPayrollCard}>
                {/* Top Row: Avatar, Name, Subtitle, Status Badge */}
                <TouchableOpacity
                  style={styles.workerHeaderRow}
                  activeOpacity={0.8}
                  onPress={() => onNavigateToWorkerDetail?.(worker.id, worker.name)}
                >
                  <View style={[styles.avatarCircle, { backgroundColor: worker.avatarBg }]}>
                    <Text style={[styles.avatarText, { color: worker.avatarColor }]}>{worker.initials}</Text>
                  </View>

                  <View style={styles.workerInfoCol}>
                    <Text style={styles.workerName}>{worker.name}</Text>
                    <Text style={styles.workerSubtitle}>{worker.calcSubtitle}</Text>
                  </View>

                  {worker.status === 'pending' ? (
                    <View style={styles.pendingBadge}>
                      <Text style={styles.pendingBadgeText}>Pending</Text>
                    </View>
                  ) : (
                    <View style={styles.paidBadge}>
                      <CheckmarkCircleIcon size={13} color={colors.brandGreen} />
                      <Text style={styles.paidBadgeText}>Paid</Text>
                    </View>
                  )}
                </TouchableOpacity>

                <View style={styles.cardDivider} />

                {/* Financial Breakdown */}
                {worker.status === 'pending' ? (
                  <View style={styles.financialSection}>
                    {worker.grossSalary && (
                      <View style={styles.financeRow}>
                        <Text style={styles.financeLabel}>Gross salary</Text>
                        <Text style={styles.financeValue}>{worker.grossSalary}</Text>
                      </View>
                    )}

                    {worker.advanceTaken && (
                      <View style={styles.financeRow}>
                        <Text style={styles.financeLabel}>Advance taken</Text>
                        <Text style={styles.financeValueRed}>{worker.advanceTaken}</Text>
                      </View>
                    )}

                    {worker.monthlySalary && (
                      <View style={styles.financeRow}>
                        <Text style={styles.financeLabel}>Monthly salary</Text>
                        <Text style={styles.financeValue}>{worker.monthlySalary}</Text>
                      </View>
                    )}

                    <View style={styles.netPayableRow}>
                      <Text style={styles.netPayableLabel}>Net payable</Text>
                      <Text style={styles.netPayableValue}>{worker.netPayable}</Text>
                    </View>

                    {/* Pay Out Action Button */}
                    <TouchableOpacity
                      style={styles.payoutButton}
                      onPress={() => handlePayout(worker)}
                      activeOpacity={0.85}
                      accessibilityRole="button"
                      accessibilityLabel={`Pay out ${worker.netPayable}`}
                    >
                      <BanknoteCashIcon size={18} color={P.white} />
                      <Text style={styles.payoutButtonText}>Pay out {worker.netPayable}</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={styles.paidSection}>
                    <View style={styles.netPaidRow}>
                      <View>
                        <Text style={styles.netPaidLabel}>Net paid</Text>
                        <Text style={styles.paidMethodText}>{worker.paidDetails}</Text>
                      </View>
                      <Text style={styles.netPaidValue}>{worker.netPayable}</Text>
                    </View>
                  </View>
                )}
              </View>
            ))}
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: P.lightSurfaceAlt,
  },
  container: {
    flex: 1,
    backgroundColor: P.lightSurfaceAlt,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 14,
    backgroundColor: P.white,
    borderBottomWidth: 1,
    borderBottomColor: P.twGray100,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: P.twGray200,
    backgroundColor: P.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
    shadowColor: P.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  headerTitles: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: P.nearBlack,
    letterSpacing: -0.2,
  },
  headerSubtitle: {
    fontSize: 13,
    color: P.twGray500,
    marginTop: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
  },

  // Total Payable Banner Card
  totalPayableCard: {
    backgroundColor: colors.brandGreen,
    borderRadius: 18,
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 16,
    marginBottom: 20,
    shadowColor: colors.brandGreen,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  totalPayableLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.85)',
  },
  totalPayableAmount: {
    fontSize: 32,
    fontWeight: '800',
    color: P.white,
    marginTop: 4,
    marginBottom: 16,
    letterSpacing: -0.5,
  },
  totalPayableStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.2)',
  },
  payableStatCol: {
    flex: 1,
  },
  payableStatNumber: {
    fontSize: 15.5,
    fontWeight: '700',
    color: P.white,
  },
  payableStatLabel: {
    fontSize: 11.5,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
  },
  payableStatDivider: {
    width: 1,
    height: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginHorizontal: 8,
  },

  sectionHeader: {
    fontSize: 11.5,
    fontWeight: '700',
    color: P.twGray500,
    letterSpacing: 0.8,
    marginBottom: 12,
  },
  workersList: {
    gap: 14,
  },
  workerPayrollCard: {
    backgroundColor: P.white,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: P.twGray200,
    padding: 16,
    shadowColor: P.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  workerHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 15,
    fontWeight: '700',
  },
  workerInfoCol: {
    flex: 1,
  },
  workerName: {
    fontSize: 15.5,
    fontWeight: '700',
    color: P.nearBlack,
  },
  workerSubtitle: {
    fontSize: 12,
    color: P.twGray500,
    marginTop: 2,
  },
  pendingBadge: {
    backgroundColor: P.twAmber100,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  pendingBadgeText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: P.twAmber800,
  },
  paidBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.brandGreenLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  paidBadgeText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: colors.brandGreen,
  },
  cardDivider: {
    height: 1,
    backgroundColor: P.twGray100,
    marginVertical: 12,
  },

  financialSection: {
    gap: 8,
  },
  financeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  financeLabel: {
    fontSize: 13,
    color: P.twGray500,
  },
  financeValue: {
    fontSize: 13.5,
    fontWeight: '600',
    color: P.nearBlack,
  },
  financeValueRed: {
    fontSize: 13.5,
    fontWeight: '600',
    color: P.twRed600,
  },
  netPayableRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 2,
    marginBottom: 6,
  },
  netPayableLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: P.nearBlack,
  },
  netPayableValue: {
    fontSize: 15.5,
    fontWeight: '800',
    color: P.nearBlack,
  },
  payoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.brandGreen,
    borderRadius: 12,
    paddingVertical: 11,
    marginTop: 4,
    shadowColor: colors.brandGreen,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  payoutButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: P.white,
  },

  paidSection: {
    paddingVertical: 2,
  },
  netPaidRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  netPaidLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: P.nearBlack,
  },
  paidMethodText: {
    fontSize: 12,
    color: P.twGray400,
    marginTop: 2,
  },
  netPaidValue: {
    fontSize: 15.5,
    fontWeight: '800',
    color: colors.brandGreen,
  },
});
