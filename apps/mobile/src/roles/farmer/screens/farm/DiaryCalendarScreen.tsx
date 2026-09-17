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

function ChevronDownIcon({ size = 16, color = P.twGray500 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M6 9l6 6 6-6" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function ChevronLeftIcon({ size = 16, color = P.twGray700 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M15 18l-6-6 6-6" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function ChevronRightIcon({ size = 16, color = P.twGray700 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M9 18l6-6-6-6" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function WeedingPlantIcon({ size = 22, color = colors.brandGreen }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="4" y="4" width="16" height="16" rx="3" stroke={color} strokeWidth="1.8" />
      <Path
        d="M12 17v-5M12 12a3 3 0 0 1 3-3h1v1a3 3 0 0 1-3 3h-1zM12 13a3 3 0 0 0-3-3H8v1a3 3 0 0 0 3 3h1z"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function WaterDropIcon({ size = 22, color = P.blue700 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 21a7 7 0 0 0 7-7c0-2-3-7.5-7-11-4 3.5-7 9-7 11a7 7 0 0 0 7 7z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function BugIcon({ size = 22, color = P.deepPurple600 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M9 7.5a3 3 0 0 1 6 0v0.5H9V7.5z" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <Path d="M8 4L6.5 2M16 4l1.5-2" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <Rect x="7" y="8" width="10" height="11" rx="5" stroke={color} strokeWidth="1.8" />
      <Line x1="12" y1="11" x2="12" y2="19" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <Circle cx="12" cy="15" r="1.2" fill={color} />
      <Path
        d="M7 11.5H3.5M20.5 11.5H17M7 15H3.5M20.5 15H17M7 18.5l-3 1.5M20 20l-3-1.5"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </Svg>
  );
}

function TractorIcon({ size = 22, color = P.deepOrange600 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="6.5" cy="17" r="2.5" stroke={color} strokeWidth="1.8" />
      <Circle cx="17.5" cy="15.5" r="4" stroke={color} strokeWidth="1.8" />
      <Circle cx="17.5" cy="15.5" r="1.2" fill={color} />
      <Path
        d="M4 17H2.5v-4H8l2.5-4H15v6.5"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M10.5 9V5.5H14v3.5"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Line x1="5.5" y1="13" x2="5.5" y2="9" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </Svg>
  );
}

// ── Types & Data ─────────────────────────────────────────────────────────────

interface DiaryEntryItem {
  id: string;
  type: string;
  crop: string;
  zone: string;
  time: string;
  duration: string;
  iconBg: string;
  icon: () => React.ReactNode;
}

const DIARY_ENTRIES_BY_DAY: Record<number, DiaryEntryItem[]> = {
  12: [
    {
      id: 'd-12-1',
      type: 'Weeding',
      crop: 'Carrot',
      zone: 'Zone 3 — Terrace',
      time: '06:45 AM',
      duration: '50m',
      iconBg: colors.brandGreenLight,
      icon: () => <WeedingPlantIcon size={22} color={colors.brandGreen} />,
    },
    {
      id: 'd-12-2',
      type: 'Irrigation',
      crop: 'Tomato',
      zone: 'Zone 2 — Lower Slope',
      time: '07:20 AM',
      duration: '40m',
      iconBg: P.blue50,
      icon: () => <WaterDropIcon size={22} color={P.blue700} />,
    },
  ],
  16: [
    {
      id: 'd-16-1',
      type: 'Irrigation',
      crop: 'Tomato',
      zone: 'Zone 2 — Lower Slope',
      time: '07:10 AM',
      duration: '45m',
      iconBg: P.blue50,
      icon: () => <WaterDropIcon size={22} color={P.blue700} />,
    },
    {
      id: 'd-16-2',
      type: 'Pest scouting',
      crop: 'Tomato',
      zone: 'Zone 2 — Lower Slope',
      time: '08:30 AM',
      duration: '20m',
      iconBg: P.violetTint,
      icon: () => <BugIcon size={22} color={P.deepPurple600} />,
    },
    {
      id: 'd-16-3',
      type: 'Manure application',
      crop: 'Carrot',
      zone: 'Zone 3 — Terrace',
      time: '11:00 AM',
      duration: '1h 15m',
      iconBg: colors.brandGreenLight,
      icon: () => <WeedingPlantIcon size={22} color={colors.brandGreen} />,
    },
    {
      id: 'd-16-4',
      type: 'Harvesting',
      crop: 'Beans',
      zone: 'Zone 1 — Upper Field',
      time: '02:15 PM',
      duration: '1h',
      iconBg: P.orange50,
      icon: () => <TractorIcon size={22} color={P.deepOrange600} />,
    },
  ],
};

const DAYS_WITH_ENTRIES = new Set([1, 2, 4, 5, 6, 8, 9, 10, 12, 13, 14, 15, 16]);
const TODAY_DAY = 16;

const DAY_NAMES = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const FIELDS_OPTIONS = ['All fields', 'Zone 1 — Upper Field', 'Zone 2 — Lower Slope', 'Zone 3 — Terrace'];
const ACTIVITIES_OPTIONS = ['All activity', 'Irrigation', 'Weeding', 'Pest scouting', 'Manure application', 'Harvesting'];

export interface DiaryCalendarScreenProps {
  onBack?: () => void;
  onNavigateToEntryDetail?: (id: string) => void;
}

export function DiaryCalendarScreen({
  onBack,
  onNavigateToEntryDetail: _onNavigateToEntryDetail,
}: DiaryCalendarScreenProps): React.JSX.Element {
  const [selectedDay, setSelectedDay] = useState<number>(12);
  const [selectedField, setSelectedField] = useState<string>('All fields');
  const [selectedActivity, setSelectedActivity] = useState<string>('All activity');
  const [filterModalVisible, setFilterModalVisible] = useState<'field' | 'activity' | null>(null);

  // Month navigation state
  const [currentMonthIndex, setCurrentMonthIndex] = useState<number>(6); // July (0-indexed)
  const currentYear = 2026;

  // Calendar calculations for July 2026: starts Wednesday (col 3), 31 days
  // Days of week: S=0, M=1, T=2, W=3, T=4, F=5, S=6
  const startDayCol = 3;
  const totalDays = 31;

  const calendarDays: Array<number | null> = [];
  for (let i = 0; i < startDayCol; i++) {
    calendarDays.push(null);
  }
  for (let day = 1; day <= totalDays; day++) {
    calendarDays.push(day);
  }

  // Calculate day name for selected date in July 2026
  // July 1 is Wed (3). Day d is at (3 + d - 1) % 7
  const dayOfWeekIndex = (startDayCol + (selectedDay - 1)) % 7;
  const selectedDayOfWeekName = DAY_NAMES[dayOfWeekIndex];
  const entriesForSelectedDay = DIARY_ENTRIES_BY_DAY[selectedDay] || (DAYS_WITH_ENTRIES.has(selectedDay) ? [
    {
      id: `d-${selectedDay}-1`,
      type: 'Field inspection',
      crop: 'Tomato',
      zone: 'Zone 1 — Upper Field',
      time: '08:00 AM',
      duration: '30m',
      iconBg: colors.brandGreenLight,
      icon: () => <WeedingPlantIcon size={22} color={colors.brandGreen} />,
    },
  ] : []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={P.white} />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Top Header Row */}
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
            <Text style={styles.headerTitle}>Diary Calendar</Text>
            <Text style={styles.headerSubtitle}>Your logged activity, month by month</Text>
          </View>
        </View>

        {/* Filter Dropdowns Row */}
        <View style={styles.filtersRow}>
          <TouchableOpacity
            style={styles.filterPill}
            onPress={() => setFilterModalVisible('field')}
            activeOpacity={0.75}
          >
            <Text style={styles.filterPillText} numberOfLines={1}>{selectedField}</Text>
            <ChevronDownIcon size={16} color={P.twGray500} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.filterPill}
            onPress={() => setFilterModalVisible('activity')}
            activeOpacity={0.75}
          >
            <Text style={styles.filterPillText} numberOfLines={1}>{selectedActivity}</Text>
            <ChevronDownIcon size={16} color={P.twGray500} />
          </TouchableOpacity>
        </View>

        {/* Calendar Card */}
        <View style={styles.calendarCard}>
          {/* Month Header Navigation */}
          <View style={styles.monthHeader}>
            <TouchableOpacity
              style={styles.monthNavBtn}
              onPress={() => setCurrentMonthIndex((prev) => Math.max(0, prev - 1))}
              activeOpacity={0.7}
            >
              <ChevronLeftIcon size={16} color={P.twGray700} />
            </TouchableOpacity>

            <Text style={styles.monthTitle}>
              {MONTH_NAMES[currentMonthIndex]} {currentYear}
            </Text>

            <TouchableOpacity
              style={styles.monthNavBtn}
              onPress={() => setCurrentMonthIndex((prev) => Math.min(11, prev + 1))}
              activeOpacity={0.7}
            >
              <ChevronRightIcon size={16} color={P.twGray700} />
            </TouchableOpacity>
          </View>

          {/* Weekday Column Headers */}
          <View style={styles.weekdaysRow}>
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((dayChar, index) => (
              <Text key={`weekday-${index}`} style={styles.weekdayText}>
                {dayChar}
              </Text>
            ))}
          </View>

          {/* Calendar Grid of Days */}
          <View style={styles.daysGrid}>
            {calendarDays.map((day, index) => {
              if (day === null) {
                return <View key={`empty-${index}`} style={styles.dayCell} />;
              }

              const isSelected = day === selectedDay;
              const isToday = day === TODAY_DAY;
              const hasEntries = DAYS_WITH_ENTRIES.has(day);

              return (
                <TouchableOpacity
                  key={`day-${day}`}
                  style={styles.dayCell}
                  onPress={() => setSelectedDay(day)}
                  activeOpacity={0.75}
                >
                  <View
                    style={[
                      styles.dayBox,
                      isSelected && styles.dayBoxSelected,
                      isToday && !isSelected && styles.dayBoxToday,
                    ]}
                  >
                    <Text
                      style={[
                        styles.dayNumber,
                        isSelected && styles.dayNumberSelected,
                        isToday && !isSelected && styles.dayNumberToday,
                        !hasEntries && !isSelected && !isToday && styles.dayNumberNoEntries,
                      ]}
                    >
                      {day}
                    </Text>
                    {hasEntries ? (
                      <View
                        style={[
                          styles.entryDot,
                          isSelected && styles.entryDotSelected,
                          isToday && !isSelected && styles.entryDotToday,
                        ]}
                      />
                    ) : (
                      <View style={styles.entryDotPlaceholder} />
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Legend */}
          <View style={styles.legendDivider} />
          <View style={styles.legendRow}>
            <View style={styles.legendItem}>
              <View style={styles.legendDot} />
              <Text style={styles.legendText}>Has entries</Text>
            </View>

            <View style={styles.legendItem}>
              <View style={styles.legendTodayBox} />
              <Text style={styles.legendText}>Today</Text>
            </View>

            <View style={styles.legendItem}>
              <View style={styles.legendSelectedBox} />
              <Text style={styles.legendText}>Selected</Text>
            </View>
          </View>
        </View>

        {/* Selected Day Entries Section */}
        <View style={styles.entriesSection}>
          <View style={styles.entriesSectionHeader}>
            <Text style={styles.entriesSectionDate}>
              {selectedDayOfWeekName}, {selectedDay} JULY
            </Text>
            <Text style={styles.entriesCountText}>
              {entriesForSelectedDay.length} {entriesForSelectedDay.length === 1 ? 'entry' : 'entries'}
            </Text>
          </View>

          {entriesForSelectedDay.length === 0 ? (
            <View style={styles.emptyEntriesBox}>
              <Text style={styles.emptyEntriesText}>No entries logged for this date.</Text>
            </View>
          ) : (
            entriesForSelectedDay.map((entry) => (
              <View key={entry.id} style={styles.entryCard}>
                <View style={[styles.entryIconBox, { backgroundColor: entry.iconBg }]}>
                  {entry.icon()}
                </View>

                <View style={styles.entryContent}>
                  <Text style={styles.entryTitle}>
                    {entry.type} · {entry.crop}
                  </Text>
                  <Text style={styles.entrySubtitle}>
                    {entry.zone} · {entry.time}
                  </Text>
                </View>

                <View style={styles.entryRight}>
                  <Text style={styles.entryDuration}>{entry.duration}</Text>
                  <ChevronDownIcon size={18} color={P.twGray400} />
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* Filter Modal for Fields / Activity */}
      <Modal
        visible={filterModalVisible !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setFilterModalVisible(null)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setFilterModalVisible(null)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {filterModalVisible === 'field' ? 'Select Field' : 'Select Activity'}
            </Text>
            {(filterModalVisible === 'field' ? FIELDS_OPTIONS : ACTIVITIES_OPTIONS).map((opt) => (
              <TouchableOpacity
                key={opt}
                style={styles.modalOption}
                onPress={() => {
                  if (filterModalVisible === 'field') setSelectedField(opt);
                  if (filterModalVisible === 'activity') setSelectedActivity(opt);
                  setFilterModalVisible(null);
                }}
              >
                <Text
                  style={[
                    styles.modalOptionText,
                    (filterModalVisible === 'field' ? selectedField === opt : selectedActivity === opt) &&
                      styles.modalOptionTextActive,
                  ]}
                >
                  {opt}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: P.lightSurfaceAlt,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 40,
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

  filtersRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  filterPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: P.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: P.twGray200,
    paddingHorizontal: 14,
    paddingVertical: 10,
    shadowColor: P.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  filterPillText: {
    fontSize: 13.5,
    fontWeight: '500',
    color: P.twGray700,
    flex: 1,
    marginRight: 6,
  },

  calendarCard: {
    backgroundColor: P.white,
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: P.twGray100,
    shadowColor: P.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  monthHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  monthNavBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: P.twGray100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: P.twGray900,
  },
  weekdaysRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 10,
  },
  weekdayText: {
    width: 38,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600',
    color: P.twGray500,
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
  },
  dayCell: {
    width: 38,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  dayBox: {
    width: 36,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 2,
  },
  dayBoxSelected: {
    backgroundColor: colors.brandGreen,
  },
  dayBoxToday: {
    borderWidth: 1.5,
    borderColor: colors.brandGreen,
  },
  dayNumber: {
    fontSize: 13.5,
    fontWeight: '600',
    color: P.twGray800,
  },
  dayNumberSelected: {
    color: P.white,
    fontWeight: '700',
  },
  dayNumberToday: {
    color: colors.brandGreen,
    fontWeight: '700',
  },
  dayNumberNoEntries: {
    color: P.twGray400,
    fontWeight: '400',
  },
  entryDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.brandGreen,
    marginTop: 3,
  },
  entryDotSelected: {
    backgroundColor: P.white,
  },
  entryDotToday: {
    backgroundColor: colors.brandGreen,
  },
  entryDotPlaceholder: {
    width: 4,
    height: 4,
    marginTop: 3,
  },

  legendDivider: {
    height: 1,
    backgroundColor: P.twGray100,
    marginTop: 14,
    marginBottom: 12,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 4,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.brandGreen,
  },
  legendTodayBox: {
    width: 12,
    height: 12,
    borderRadius: 3,
    borderWidth: 1.5,
    borderColor: colors.brandGreen,
  },
  legendSelectedBox: {
    width: 12,
    height: 12,
    borderRadius: 3,
    backgroundColor: colors.brandGreen,
  },
  legendText: {
    fontSize: 11.5,
    color: P.twGray500,
  },

  entriesSection: {
    marginTop: 22,
  },
  entriesSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  entriesSectionDate: {
    fontSize: 12,
    fontWeight: '700',
    color: P.twGray500,
    letterSpacing: 0.6,
  },
  entriesCountText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: colors.brandGreen,
  },
  entryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: P.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: P.twGray100,
    padding: 14,
    marginBottom: 10,
    shadowColor: P.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  entryIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  entryContent: {
    flex: 1,
  },
  entryTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: P.nearBlack,
  },
  entrySubtitle: {
    fontSize: 12.5,
    color: P.twGray500,
    marginTop: 2,
  },
  entryRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  entryDuration: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.brandGreen,
  },
  emptyEntriesBox: {
    backgroundColor: P.white,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: P.twGray100,
  },
  emptyEntriesText: {
    fontSize: 13.5,
    color: P.twGray500,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    width: '100%',
    backgroundColor: P.white,
    borderRadius: 18,
    padding: 20,
    shadowColor: P.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: P.twGray900,
    marginBottom: 14,
  },
  modalOption: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: P.twGray100,
  },
  modalOptionText: {
    fontSize: 14,
    color: P.twGray700,
  },
  modalOptionTextActive: {
    color: colors.brandGreen,
    fontWeight: '700',
  },
});
