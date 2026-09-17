import React from 'react';
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

function TimesheetIcon({ size = 20, color = P.blue700 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="4" y="3" width="16" height="18" rx="3" stroke={color} strokeWidth="1.8" />
      <Line x1="8" y1="8" x2="16" y2="8" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <Line x1="8" y1="12" x2="16" y2="12" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <Path d="M8 16l2 2 4-4" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function UserPlusIcon({ size = 18, color = P.white }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="9" cy="7" r="4" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path
        d="M2 20a7 7 0 0 1 14 0"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M19 8v6M16 11h6" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

// ── Types & Data ─────────────────────────────────────────────────────────────

interface WorkerItem {
  id: string;
  name: string;
  initials: string;
  role: string;
  period: string;
  earnings: string;
  rateTag: string;
  rateType: 'daily' | 'monthly';
  crops: string[];
  avatarBg: string;
  avatarColor: string;
}

const WORKERS_DATA: WorkerItem[] = [
  {
    id: 'w1',
    name: 'Murugan R.',
    initials: 'MR',
    role: 'Field Worker',
    period: 'this month',
    earnings: '₹5,400',
    rateTag: 'Daily · ₹450/day',
    rateType: 'daily',
    crops: ['Carrot', 'Tomato'],
    avatarBg: P.twGreen100,
    avatarColor: P.twGreen800,
  },
  {
    id: 'w2',
    name: 'Lakshmi D.',
    initials: 'LD',
    role: 'General Hand',
    period: 'this month',
    earnings: '₹4,400',
    rateTag: 'Daily · ₹400/day',
    rateType: 'daily',
    crops: ['Cabbage', 'Carrot'],
    avatarBg: P.twPurple100,
    avatarColor: P.deepPurple600,
  },
  {
    id: 'w3',
    name: 'Selvi K.',
    initials: 'SK',
    role: 'Farm Supervisor',
    period: 'this month',
    earnings: '₹12,000',
    rateTag: 'Monthly · ₹12,000',
    rateType: 'monthly',
    crops: ['All crops'],
    avatarBg: P.twAmber100,
    avatarColor: P.twAmber800,
  },
];

export interface WorkforceScreenProps {
  onBack?: () => void;
  onNavigateToAddWorker?: () => void;
  onNavigateToTimesheet?: () => void;
  onNavigateToPayroll?: () => void;
  onNavigateToWorkerDetail?: (id: string, name?: string, role?: string) => void;
}

export function WorkforceScreen({
  onBack,
  onNavigateToAddWorker,
  onNavigateToTimesheet,
  onNavigateToPayroll,
  onNavigateToWorkerDetail,
}: WorkforceScreenProps): React.JSX.Element {
  const handleWorkerPress = (worker: WorkerItem) => {
    if (onNavigateToWorkerDetail) {
      onNavigateToWorkerDetail(worker.id, worker.name, `${worker.role} · ${worker.rateType === 'monthly' ? 'Monthly salary' : 'Daily wage'}`);
    } else if (onNavigateToAddWorker) {
      onNavigateToAddWorker();
    } else {
      Alert.alert(
        worker.name,
        `Role: ${worker.role}\nRate: ${worker.rateTag}\nEarnings this month: ${worker.earnings}\nCrops: ${worker.crops.join(', ')}`,
      );
    }
  };

  const handleAddWorker = () => {
    if (onNavigateToAddWorker) {
      onNavigateToAddWorker();
    } else {
      Alert.alert('Add Worker', 'Worker onboarding form coming soon.');
    }
  };

  const handleTimesheetPress = () => {
    if (onNavigateToPayroll) {
      onNavigateToPayroll();
    } else if (onNavigateToTimesheet) {
      onNavigateToTimesheet();
    } else {
      Alert.alert('Timesheet & Payroll', 'July payroll report: 259 total hours logged across 3 workers.');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={P.white} />
      <View style={styles.container}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header Row */}
          <View style={styles.headerRow}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={onBack}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Go back"
            >
              <ArrowBackIcon size={20} color={P.deepGreen} />
            </TouchableOpacity>

            <View style={styles.headerTitles}>
              <Text style={styles.headerTitle}>Workforce</Text>
              <Text style={styles.headerSubtitle}>3 workers on staff</Text>
            </View>

            <TouchableOpacity
              style={styles.timesheetBtn}
              onPress={handleTimesheetPress}
              activeOpacity={0.75}
              accessibilityRole="button"
              accessibilityLabel="Timesheet & Payroll"
            >
              <TimesheetIcon size={20} color={P.blue700} />
            </TouchableOpacity>
          </View>

          {/* 3 Summary Stats Cards */}
          <View style={styles.statsRow}>
            <TouchableOpacity
              style={styles.statCard}
              activeOpacity={0.8}
              onPress={() => {
                if (onNavigateToWorkerDetail) {
                  onNavigateToWorkerDetail('w1', 'Murugan R.', 'Field Worker · Daily wage');
                }
              }}
              accessibilityRole="button"
              accessibilityLabel="Workers details"
            >
              <Text style={styles.statNumber}>3</Text>
              <Text style={styles.statLabel}>Workers</Text>
            </TouchableOpacity>
            <View style={styles.statCard}>
              <View style={styles.hoursRow}>
                <Text style={styles.statNumber}>259</Text>
                <Text style={styles.hourUnit}>h</Text>
              </View>
              <Text style={styles.statLabel}>Hours · Jul</Text>
            </View>
            <TouchableOpacity
              style={styles.statCard}
              activeOpacity={0.8}
              onPress={handleTimesheetPress}
              accessibilityRole="button"
              accessibilityLabel="Payroll due"
            >
              <Text style={[styles.statNumber, { color: colors.brandGreen }]}>₹20.8k</Text>
              <Text style={styles.statLabel}>Payroll due</Text>
            </TouchableOpacity>
          </View>

          {/* Section Header */}
          <Text style={styles.sectionHeader}>STAFF</Text>

          {/* Workers List */}
          <View style={styles.workersList}>
            {WORKERS_DATA.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.workerCard}
                onPress={() => handleWorkerPress(item)}
                activeOpacity={0.75}
              >
                {/* Left Avatar Circle */}
                <View style={[styles.avatarCircle, { backgroundColor: item.avatarBg }]}>
                  <Text style={[styles.avatarText, { color: item.avatarColor }]}>
                    {item.initials}
                  </Text>
                </View>

                {/* Middle Info */}
                <View style={styles.cardContent}>
                  <View style={styles.namePayRow}>
                    <Text style={styles.workerName}>{item.name}</Text>
                    <Text style={styles.workerPay}>{item.earnings}</Text>
                  </View>

                  <Text style={styles.workerRole}>
                    {item.role} · {item.period}
                  </Text>

                  {/* Badges Row */}
                  <View style={styles.badgesRow}>
                    <View
                      style={[
                        styles.rateBadge,
                        item.rateType === 'monthly' ? styles.rateBadgeBlue : styles.rateBadgeGreen,
                      ]}
                    >
                      <Text
                        style={[
                          styles.rateBadgeText,
                          item.rateType === 'monthly'
                            ? styles.rateBadgeTextBlue
                            : styles.rateBadgeTextGreen,
                        ]}
                      >
                        {item.rateTag}
                      </Text>
                    </View>

                    {item.crops.map((crop, cIdx) => (
                      <View key={cIdx} style={styles.cropTag}>
                        <Text style={styles.cropTagText}>{crop}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        {/* Floating Action Button */}
        <TouchableOpacity
          style={styles.fab}
          onPress={handleAddWorker}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel="Add worker"
        >
          <UserPlusIcon size={18} color={P.white} />
          <Text style={styles.fabText}>Add worker</Text>
        </TouchableOpacity>
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
    position: 'relative',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 90,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1,
    borderColor: P.twGray200,
    backgroundColor: P.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
    shadowColor: P.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
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
    marginTop: 2,
  },
  timesheetBtn: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: P.twBlue50,
    alignItems: 'center',
    justifyContent: 'center',
  },

  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: P.white,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: P.twGray100,
    shadowColor: P.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  statNumber: {
    fontSize: 22,
    fontWeight: '700',
    color: P.nearBlack,
  },
  hoursRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  hourUnit: {
    fontSize: 13,
    fontWeight: '600',
    color: P.twGray500,
    marginLeft: 2,
  },
  statLabel: {
    fontSize: 11.5,
    color: P.twGray500,
    marginTop: 4,
    textAlign: 'center',
  },

  sectionHeader: {
    fontSize: 12,
    fontWeight: '700',
    color: P.twGray500,
    letterSpacing: 0.6,
    marginBottom: 12,
  },

  workersList: {
    gap: 12,
  },
  workerCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: P.white,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: P.twGray100,
    padding: 16,
    shadowColor: P.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  avatarCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  avatarText: {
    fontSize: 15,
    fontWeight: '700',
  },
  cardContent: {
    flex: 1,
  },
  namePayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  workerName: {
    fontSize: 15.5,
    fontWeight: '700',
    color: P.nearBlack,
  },
  workerPay: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.brandGreen,
  },
  workerRole: {
    fontSize: 12,
    color: P.twGray500,
    marginTop: 2,
    marginBottom: 8,
  },
  badgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    alignItems: 'center',
  },
  rateBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  rateBadgeGreen: {
    backgroundColor: colors.brandGreenLight,
  },
  rateBadgeBlue: {
    backgroundColor: P.twBlue50,
  },
  rateBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  rateBadgeTextGreen: {
    color: colors.brandGreen,
  },
  rateBadgeTextBlue: {
    color: P.blue700,
  },
  cropTag: {
    backgroundColor: P.twGray100,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  cropTagText: {
    fontSize: 11,
    fontWeight: '500',
    color: P.twGray600,
  },

  fab: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.brandGreen,
    paddingVertical: 13,
    paddingHorizontal: 20,
    borderRadius: 24,
    shadowColor: P.deepGreen,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 5,
    gap: 6,
  },
  fabText: {
    fontSize: 14.5,
    fontWeight: '700',
    color: P.white,
  },
});
