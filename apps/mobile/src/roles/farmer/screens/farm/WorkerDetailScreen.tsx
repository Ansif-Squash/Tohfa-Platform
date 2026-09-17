import React, { useState } from 'react';
import {
  Modal,
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

function PencilEditIcon({ size = 18, color = colors.brandGreen }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function ChevronDownIcon({ size = 16, color = P.twGray500 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M6 9l6 6 6-6" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function ClockIcon({ size = 20, color = P.twBlue600 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth="2" />
      <Path d="M12 7v5l3 3" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function WaterDropIcon({ size = 18, color = P.twBlue500 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function WeedingIcon({ size = 18, color = P.twGreen600 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 21h16M12 21V12M12 12C9 9 5 10 5 10s0 5 7 5M12 12c3-3 7-2 7-2s0 5-7 5"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function FertigationIcon({ size = 18, color = P.twGreen700 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="8" stroke={color} strokeWidth="2" />
      <Path
        d="M12 8v4l3 2"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
      />
      <Circle cx="12" cy="12" r="1.5" fill={color} />
    </Svg>
  );
}

function ShearsIcon({ size = 18, color = P.twOrange600 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="6" cy="6" r="3" stroke={color} strokeWidth="1.8" />
      <Circle cx="6" cy="18" r="3" stroke={color} strokeWidth="1.8" />
      <Line x1="8.59" y1="8.59" x2="20" y2="20" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="8.59" y1="15.41" x2="20" y2="4" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function TractorIcon({ size = 18, color = P.twGreen700 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="6" cy="17" r="2.5" stroke={color} strokeWidth="1.8" />
      <Circle cx="17" cy="15.5" r="4" stroke={color} strokeWidth="1.8" />
      <Path
        d="M4 17H2.5v-4H8l2.5-4H15v6.5"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// ── Types & Data ─────────────────────────────────────────────────────────────

interface DayActivity {
  id: string;
  activity: string;
  crop: string;
  date: string;
  hours: number;
  type: 'irrigation' | 'weeding' | 'fertigation' | 'harvesting' | 'landprep';
}

const DEFAULT_ACTIVITIES: DayActivity[] = [
  {
    id: 'a1',
    activity: 'Irrigation',
    crop: 'Carrot',
    date: '16 Jul',
    hours: 7,
    type: 'irrigation',
  },
  {
    id: 'a2',
    activity: 'Weeding',
    crop: 'Tomato',
    date: '15 Jul',
    hours: 6,
    type: 'weeding',
  },
  {
    id: 'a3',
    activity: 'Fertigation',
    crop: 'Carrot',
    date: '14 Jul',
    hours: 8,
    type: 'fertigation',
  },
  {
    id: 'a4',
    activity: 'Harvesting',
    crop: 'Carrot',
    date: '12 Jul',
    hours: 7,
    type: 'harvesting',
  },
  {
    id: 'a5',
    activity: 'Irrigation',
    crop: 'Tomato',
    date: '11 Jul',
    hours: 7,
    type: 'irrigation',
  },
  {
    id: 'a6',
    activity: 'Land prep',
    crop: 'Tomato',
    date: '10 Jul',
    hours: 8,
    type: 'landprep',
  },
];

export interface WorkerDetailScreenProps {
  workerId?: string;
  workerName?: string;
  workerRole?: string;
  onBack?: () => void;
  onNavigateToEditWorker?: (workerData?: any) => void;
}

export function WorkerDetailScreen({
  workerId = 'w1',
  workerName = 'Murugan R.',
  workerRole = 'Field Worker · Daily wage',
  onBack,
  onNavigateToEditWorker,
}: WorkerDetailScreenProps): React.JSX.Element {
  const [selectedMonth, setSelectedMonth] = useState('July 2026');
  const [selectedCrop, setSelectedCrop] = useState('All crops');

  const [isMonthPickerOpen, setIsMonthPickerOpen] = useState(false);
  const [isCropPickerOpen, setIsCropPickerOpen] = useState(false);

  const months = ['July 2026', 'June 2026', 'May 2026'];
  const crops = ['All crops', 'Carrot', 'Tomato', 'Cabbage'];

  // Initials
  const initials = workerName
    .trim()
    .split(/\s+/)
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase() || 'MR';

  const renderActivityIcon = (type: DayActivity['type']) => {
    switch (type) {
      case 'irrigation':
        return (
          <View style={[styles.activityIconBox, { backgroundColor: P.twBlue50 }]}>
            <WaterDropIcon size={18} color={P.twBlue500} />
          </View>
        );
      case 'weeding':
        return (
          <View style={[styles.activityIconBox, { backgroundColor: P.twGreen50 }]}>
            <WeedingIcon size={18} color={P.twGreen600} />
          </View>
        );
      case 'fertigation':
        return (
          <View style={[styles.activityIconBox, { backgroundColor: P.twGreen50 }]}>
            <FertigationIcon size={18} color={P.twGreen700} />
          </View>
        );
      case 'harvesting':
        return (
          <View style={[styles.activityIconBox, { backgroundColor: P.twOrange50 }]}>
            <ShearsIcon size={18} color={P.twOrange600} />
          </View>
        );
      case 'landprep':
      default:
        return (
          <View style={[styles.activityIconBox, { backgroundColor: P.twGreen50 }]}>
            <TractorIcon size={18} color={P.twGreen700} />
          </View>
        );
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={P.white} />
      <View style={styles.container}>
        {/* ── Top Header ── */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={onBack}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Back"
            >
              <ArrowBackIcon size={20} color={P.deepGreen} />
            </TouchableOpacity>

            <View style={styles.avatarCircle}>
              <Text style={styles.avatarText}>{initials}</Text>
            </View>

            <View style={styles.headerTitles}>
              <Text style={styles.workerName}>{workerName}</Text>
              <Text style={styles.workerRole}>{workerRole}</Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.editButton}
            onPress={() => {
              if (onNavigateToEditWorker) {
                onNavigateToEditWorker({
                  id: workerId,
                  name: workerName,
                  role: workerRole,
                });
              }
            }}
            activeOpacity={0.75}
            accessibilityRole="button"
            accessibilityLabel="Edit worker"
          >
            <PencilEditIcon size={18} color={colors.brandGreen} />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* ── Dropdown Filters Row ── */}
          <View style={styles.filtersRow}>
            <TouchableOpacity
              style={styles.filterPill}
              onPress={() => setIsMonthPickerOpen(true)}
              activeOpacity={0.75}
            >
              <Text style={styles.filterPillText}>{selectedMonth}</Text>
              <ChevronDownIcon size={15} color={P.twGray500} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.filterPill}
              onPress={() => setIsCropPickerOpen(true)}
              activeOpacity={0.75}
            >
              <Text style={styles.filterPillText}>{selectedCrop}</Text>
              <ChevronDownIcon size={15} color={P.twGray500} />
            </TouchableOpacity>
          </View>

          {/* ── Payment Pending Banner ── */}
          <View style={styles.paymentBanner}>
            <View style={styles.clockIconWrap}>
              <ClockIcon size={20} color={P.twBlue600} />
            </View>
            <View style={styles.paymentBannerTextCol}>
              <Text style={styles.paymentBannerTitle}>Payment pending</Text>
              <Text style={styles.paymentBannerSub}>July wages not yet paid out</Text>
            </View>
          </View>

          {/* ── 3 Stat Summary Cards ── */}
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>12</Text>
              <Text style={styles.statLabel}>Days worked</Text>
            </View>

            <View style={styles.statCard}>
              <View style={styles.hoursNumberRow}>
                <Text style={styles.statNumber}>84</Text>
                <Text style={styles.hourUnit}> h</Text>
              </View>
              <Text style={styles.statLabel}>Hours logged</Text>
            </View>

            <View style={styles.statCard}>
              <Text style={[styles.statNumber, { color: colors.brandGreen }]}>₹4.4k</Text>
              <Text style={styles.statLabel}>Wages accrued</Text>
            </View>
          </View>

          {/* ── Days Worked List ── */}
          <Text style={styles.sectionHeaderTitle}>DAYS WORKED</Text>

          <View style={styles.activitiesCard}>
            {DEFAULT_ACTIVITIES.map((act, index) => (
              <View key={act.id}>
                <View style={styles.activityRow}>
                  {renderActivityIcon(act.type)}

                  <View style={styles.activityInfoCol}>
                    <Text style={styles.activityTitle}>
                      {act.activity} · <Text style={styles.activityCrop}>{act.crop}</Text>
                    </Text>
                    <Text style={styles.activityDate}>{act.date}</Text>
                  </View>

                  <Text style={styles.activityHours}>{act.hours} h</Text>
                </View>

                {index < DEFAULT_ACTIVITIES.length - 1 && <View style={styles.rowDivider} />}
              </View>
            ))}
          </View>

          {/* Bottom Footer Caption */}
          <Text style={styles.footerCaption}>6 more days this month</Text>
        </ScrollView>

        {/* Month Picker Modal */}
        <Modal
          visible={isMonthPickerOpen}
          transparent
          animationType="fade"
          onRequestClose={() => setIsMonthPickerOpen(false)}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setIsMonthPickerOpen(false)}
          >
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>Select Period</Text>
              {months.map((m) => (
                <TouchableOpacity
                  key={m}
                  style={[
                    styles.modalOption,
                    selectedMonth === m && styles.modalOptionSelected,
                  ]}
                  onPress={() => {
                    setSelectedMonth(m);
                    setIsMonthPickerOpen(false);
                  }}
                >
                  <Text
                    style={[
                      styles.modalOptionText,
                      selectedMonth === m && styles.modalOptionTextSelected,
                    ]}
                  >
                    {m}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </TouchableOpacity>
        </Modal>

        {/* Crop Picker Modal */}
        <Modal
          visible={isCropPickerOpen}
          transparent
          animationType="fade"
          onRequestClose={() => setIsCropPickerOpen(false)}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setIsCropPickerOpen(false)}
          >
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>Select Crop</Text>
              {crops.map((c) => (
                <TouchableOpacity
                  key={c}
                  style={[
                    styles.modalOption,
                    selectedCrop === c && styles.modalOptionSelected,
                  ]}
                  onPress={() => {
                    setSelectedCrop(c);
                    setIsCropPickerOpen(false);
                  }}
                >
                  <Text
                    style={[
                      styles.modalOptionText,
                      selectedCrop === c && styles.modalOptionTextSelected,
                    ]}
                  >
                    {c}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </TouchableOpacity>
        </Modal>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: P.white,
  },
  container: {
    flex: 1,
    backgroundColor: P.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: P.twGray100,
    backgroundColor: P.white,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
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
    marginRight: 12,
    shadowColor: P.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  avatarCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: P.twGreen100,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 14.5,
    fontWeight: '700',
    color: P.twGreen800,
  },
  headerTitles: {
    flex: 1,
  },
  workerName: {
    fontSize: 17,
    fontWeight: '700',
    color: P.nearBlack,
    letterSpacing: -0.2,
  },
  workerRole: {
    fontSize: 12,
    color: P.twGray400,
    marginTop: 1,
  },
  editButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: P.twGray200,
    backgroundColor: P.white,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: P.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
  },
  filtersRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  filterPill: {
    flex: 1,
    height: 44,
    backgroundColor: P.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: P.twGray200,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    shadowColor: P.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 3,
    elevation: 1,
  },
  filterPillText: {
    fontSize: 14,
    fontWeight: '600',
    color: P.nearBlack,
  },
  paymentBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EBF4FF',
    borderLeftWidth: 3.5,
    borderLeftColor: P.twBlue600,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  clockIconWrap: {
    marginRight: 12,
  },
  paymentBannerTextCol: {
    flex: 1,
  },
  paymentBannerTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: P.twBlue700,
  },
  paymentBannerSub: {
    fontSize: 12,
    color: P.slate500,
    marginTop: 2,
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
    paddingHorizontal: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: P.twGray100,
    shadowColor: P.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  statNumber: {
    fontSize: 22,
    fontWeight: '800',
    color: P.nearBlack,
    letterSpacing: -0.3,
  },
  hoursNumberRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  hourUnit: {
    fontSize: 13,
    fontWeight: '500',
    color: P.twGray400,
  },
  statLabel: {
    fontSize: 11.5,
    color: P.twGray400,
    marginTop: 4,
    fontWeight: '500',
    textAlign: 'center',
  },
  sectionHeaderTitle: {
    fontSize: 11.5,
    fontWeight: '700',
    color: P.slate400,
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  activitiesCard: {
    backgroundColor: P.white,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: P.twGray100,
    paddingVertical: 6,
    paddingHorizontal: 16,
    shadowColor: P.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  activityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 13,
  },
  activityIconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  activityInfoCol: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 14.5,
    fontWeight: '700',
    color: P.nearBlack,
  },
  activityCrop: {
    fontWeight: '500',
    color: P.twGray600,
  },
  activityDate: {
    fontSize: 12,
    color: P.twGray400,
    marginTop: 2,
  },
  activityHours: {
    fontSize: 14.5,
    fontWeight: '700',
    color: P.nearBlack,
  },
  rowDivider: {
    height: 1,
    backgroundColor: P.twGray100,
  },
  footerCaption: {
    fontSize: 12.5,
    fontWeight: '500',
    color: P.twGray400,
    textAlign: 'center',
    marginTop: 18,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    backgroundColor: P.white,
    borderRadius: 18,
    padding: 20,
    shadowColor: P.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 6,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: P.nearBlack,
    marginBottom: 14,
  },
  modalOption: {
    paddingVertical: 13,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  modalOptionSelected: {
    backgroundColor: P.twGreen100,
  },
  modalOptionText: {
    fontSize: 15,
    color: P.twGray700,
  },
  modalOptionTextSelected: {
    fontWeight: '700',
    color: P.twGreen800,
  },
});
