import React, { useEffect } from 'react';
import {
  BackHandler,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { authPalette as P } from '../../theme';
import type { CropItem } from './ProduceCalendarScreen';

// ─────────────────────────────────────────────
// Inline Vector Icons (strictly no emojis, no raw hex)
// ─────────────────────────────────────────────

function ArrowBackIcon({ size = 20, color = P.twGray800 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M19 12H5M5 12L12 19M5 12L12 5"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// ─────────────────────────────────────────────
// Types & Sample Data
// ─────────────────────────────────────────────

export interface WorkerItem {
  id: string;
  initials: string;
  name: string;
  tasks: string;
  hours: string;
  earnings: string;
}

const WORKERS_LIST: WorkerItem[] = [
  {
    id: 'w1',
    initials: 'MS',
    name: 'Murugan S.',
    tasks: 'Weeding, Harvesting',
    hours: '16 h',
    earnings: '₹2,720',
  },
  {
    id: 'w2',
    initials: 'LP',
    name: 'Lakshmi P.',
    tasks: 'Fertigation, Weeding',
    hours: '14 h',
    earnings: '₹2,380',
  },
  {
    id: 'w3',
    initials: 'RK',
    name: 'Ravi K.',
    tasks: 'Pest treatment',
    hours: '8 h',
    earnings: '₹1,300',
  },
  {
    id: 'w4',
    initials: 'AN',
    name: 'Anand N.',
    tasks: 'Irrigation, Trellis setup',
    hours: '6 h',
    earnings: '₹1,020',
  },
];

export interface CropWorkforceHoursScreenProps {
  crop?: CropItem | null;
  onBack?: () => void;
}

export function CropWorkforceHoursScreen({
  crop,
  onBack,
}: CropWorkforceHoursScreenProps): React.JSX.Element {
  // Android hardware back
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (onBack) {
        onBack();
        return true;
      }
      return false;
    });
    return () => sub.remove();
  }, [onBack]);

  const cropName = crop?.name ?? 'Carrot';
  const variety = crop?.variety ?? 'Nantes';
  const zone = crop?.zoneShort || crop?.zone || 'Zone 1';
  const subtitle = `${cropName} — ${variety} · ${zone}`;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={P.paleStoneBg} />

      <View style={styles.container}>
        {/* ── Header ── */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={onBack}
            activeOpacity={0.7}
            hitSlop={{ top: 14, bottom: 14, left: 14, right: 14 }}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <ArrowBackIcon size={20} color={P.twGray800} />
          </TouchableOpacity>

          <View style={styles.headerTitleCol}>
            <Text style={styles.headerTitle}>Workforce Hours</Text>
            <Text style={styles.headerSubtitle}>{subtitle}</Text>
          </View>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* ── Green Hero Summary Card ── */}
          <View style={styles.heroCard}>
            <Text style={styles.heroSubLabel}>Total Labour Cost</Text>
            <Text style={styles.heroCostValue}>₹6,400</Text>

            <View style={styles.heroDivider} />

            <View style={styles.heroMetricsRow}>
              {/* Col 1 */}
              <View style={styles.heroMetricCol}>
                <Text style={styles.heroMetricLabel}>Hours Logged</Text>
                <Text style={styles.heroMetricValue}>38 h</Text>
              </View>

              {/* Col 2 */}
              <View style={styles.heroMetricCol}>
                <Text style={styles.heroMetricLabel}>Workers Involved</Text>
                <Text style={styles.heroMetricValue}>3</Text>
              </View>

              {/* Col 3 */}
              <View style={styles.heroMetricCol}>
                <Text style={styles.heroMetricLabel}>Avg Rate</Text>
                <Text style={styles.heroMetricValue}>₹168/h</Text>
              </View>
            </View>
          </View>

          {/* ── Section Title: BY WORKER ── */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionHeaderText}>BY WORKER</Text>
          </View>

          {/* ── Workers List ── */}
          <View style={styles.workersList}>
            {WORKERS_LIST.map((worker) => (
              <View key={worker.id} style={styles.workerCard}>
                {/* Initials Avatar */}
                <View style={styles.avatarCircle}>
                  <Text style={styles.avatarText}>{worker.initials}</Text>
                </View>

                {/* Name & Tasks */}
                <View style={styles.workerDetailsCol}>
                  <Text style={styles.workerName}>{worker.name}</Text>
                  <Text style={styles.workerTasks}>{worker.tasks}</Text>
                </View>

                {/* Hours & Pay */}
                <View style={styles.workerEarningsCol}>
                  <Text style={styles.workerHours}>{worker.hours}</Text>
                  <Text style={styles.workerEarnings}>{worker.earnings}</Text>
                </View>
              </View>
            ))}
          </View>

          <View style={styles.bottomSpacer} />
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

// ─────────────────────────────────────────────
// Stylesheet (strictly no raw hex literals)
// ─────────────────────────────────────────────

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: P.paleStoneBg,
  },
  container: {
    flex: 1,
    backgroundColor: P.paleStoneBg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? 6 : 4,
    paddingBottom: 14,
    backgroundColor: P.paleStoneBg,
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: P.white,
    borderWidth: 1,
    borderColor: P.twGray200,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    shadowColor: P.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  headerTitleCol: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: P.ink,
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 12.5,
    fontWeight: '500',
    color: P.twGray500,
    marginTop: 2,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 40,
  },
  heroCard: {
    backgroundColor: P.deepGreen,
    borderRadius: 18,
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 18,
    marginBottom: 22,
    shadowColor: P.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  heroSubLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.85)',
  },
  heroCostValue: {
    fontSize: 32,
    fontWeight: '800',
    color: P.white,
    letterSpacing: -0.5,
    marginTop: 4,
    marginBottom: 14,
  },
  heroDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginBottom: 14,
  },
  heroMetricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  heroMetricCol: {
    flex: 1,
  },
  heroMetricLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.75)',
  },
  heroMetricValue: {
    fontSize: 18,
    fontWeight: '800',
    color: P.white,
    marginTop: 4,
  },
  sectionHeader: {
    marginBottom: 10,
  },
  sectionHeaderText: {
    fontSize: 12,
    fontWeight: '700',
    color: P.twGray500,
    letterSpacing: 0.8,
  },
  workersList: {
    gap: 10,
  },
  workerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: P.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: P.twGray200,
    paddingHorizontal: 14,
    paddingVertical: 14,
    shadowColor: P.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 5,
    elevation: 1,
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: P.twBlue50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 14,
    fontWeight: '700',
    color: P.twBlue700,
  },
  workerDetailsCol: {
    flex: 1,
    marginLeft: 14,
  },
  workerName: {
    fontSize: 15,
    fontWeight: '700',
    color: P.ink,
  },
  workerTasks: {
    fontSize: 12.5,
    color: P.twGray500,
    marginTop: 2,
  },
  workerEarningsCol: {
    alignItems: 'flex-end',
    marginLeft: 8,
  },
  workerHours: {
    fontSize: 15,
    fontWeight: '800',
    color: P.ink,
  },
  workerEarnings: {
    fontSize: 12.5,
    color: P.twGray500,
    marginTop: 2,
  },
  bottomSpacer: {
    height: 20,
  },
});
