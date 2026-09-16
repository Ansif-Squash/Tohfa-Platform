import React, { useEffect, useState } from 'react';
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
import { useDiaryStore, type DiaryItem } from './diaryStore';

// ─────────────────────────────────────────────
// Inline SVG Icons (no unicode emojis)
// ─────────────────────────────────────────────

function ArrowBackIcon({ size = 20, color = '#15803D' }: { size?: number; color?: string }) {
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

function ChevronDownIcon({ size = 16, color = '#6B7280' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M6 9l6 6 6-6" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function ChevronLeftIcon({ size = 18, color = '#4B5563' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M15 18l-6-6 6-6" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function ChevronRightIcon({ size = 18, color = '#4B5563' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M9 18l6-6-6-6" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function WaterDropIcon({ size = 18, color = '#0284C7' }: { size?: number; color?: string }) {
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

function WeedIcon({ size = 18, color = '#15803D' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="5" y="6" width="14" height="14" rx="2" stroke={color} strokeWidth="1.8" />
      <Path d="M9 14l2-4 2 4M12 10v6" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </Svg>
  );
}

function BugIcon({ size = 18, color = '#9333EA' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="8" y="7" width="8" height="11" rx="4" stroke={color} strokeWidth="2" />
      <Path d="M12 7V3" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Path d="M4 11h4M16 11h4M4 16h4M16 16h4" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function LeafIcon({ size = 18, color = '#16A34A' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 22v-9M12 13a6 6 0 0 1 6-6h2v2a6 6 0 0 1-6 6h-2zM12 15a5 5 0 0 0-5-5H5v2a5 5 0 0 0 5 5h2z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function TractorIcon({ size = 18, color = '#EA580C' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="6.5" cy="16.5" r="3.5" stroke={color} strokeWidth="2" />
      <Circle cx="18" cy="15" r="5" stroke={color} strokeWidth="2" />
      <Path d="M14 15V8H7v5M10 8V5H5v3M18 15h-4" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function getIconForEntry(type: DiaryItem['type']) {
  switch (type) {
    case 'irrigation':
      return { icon: <WaterDropIcon size={18} color="#0284C7" />, bg: '#E0F2FE' };
    case 'pest':
      return { icon: <BugIcon size={18} color="#9333EA" />, bg: '#F3E8FF' };
    case 'manure':
      return { icon: <LeafIcon size={18} color="#16A34A" />, bg: '#DCFCE7' };
    case 'harvest':
      return { icon: <TractorIcon size={18} color="#EA580C" />, bg: '#FFEDD5' };
    case 'weeding':
    default:
      return { icon: <WeedIcon size={18} color="#15803D" />, bg: '#DCFCE7' };
  }
}

function CheckmarkIcon({ size = 16, color = '#15803D' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M5 13l4 4L19 7" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

const DUMMY_FIELDS = [
  'All fields',
  'Zone 1 — Upper Field',
  'Zone 2 — Lower Slope',
  'Zone 3 — Terrace',
  'Zone 4 — River Bed',
];

const DUMMY_ACTIVITIES = [
  'All activity',
  'Irrigation',
  'Weed Management',
  'Pest Management',
  'Manure Application',
  'Harvesting',
];

// ─────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────

interface DiaryCalendarScreenProps {
  onBack?: () => void;
  initialDay?: number | undefined;
}

export function DiaryCalendarScreen({
  onBack,
  initialDay = 16,
}: DiaryCalendarScreenProps): React.JSX.Element {
  const { getEntriesForDay, getDaysWithEntries } = useDiaryStore();
  const [selectedDay, setSelectedDay] = useState<number>(initialDay);

  useEffect(() => {
    if (initialDay) {
      setSelectedDay(initialDay);
    }
  }, [initialDay]);
  const [selectedMonth] = useState('July 2026');
  const [fieldFilter, setFieldFilter] = useState('All fields');
  const [activityFilter, setActivityFilter] = useState('All activity');
  const [activeModal, setActiveModal] = useState<'field' | 'activity' | null>(null);

  // July 2026 starts on Wednesday: Sunday (0), Monday (1), Tuesday (2) are empty offset
  // Month has 31 days.
  const emptyDaysOffset = 3; // Sun, Mon, Tue
  const totalDaysInMonth = 31;
  const todayDay = 16;

  const daysWithEntries = getDaysWithEntries(selectedMonth);
  const rawEntries = getEntriesForDay(selectedDay, selectedMonth);

  // Filter entries according to selected field and activity dropdowns
  const currentEntries = rawEntries.filter((item) => {
    if (fieldFilter !== 'All fields') {
      const zonePrefix = fieldFilter.split(' — ')[0]?.trim() ?? fieldFilter;
      if (!item.field.includes(zonePrefix) && !item.field.includes(fieldFilter)) {
        return false;
      }
    }
    if (activityFilter !== 'All activity') {
      const actLower = activityFilter.toLowerCase();
      if (actLower.includes('irrigation') && item.type !== 'irrigation') return false;
      if (actLower.includes('weed') && item.type !== 'weeding') return false;
      if (actLower.includes('pest') && item.type !== 'pest') return false;
      if (actLower.includes('manure') && item.type !== 'manure') return false;
      if (actLower.includes('harvest') && item.type !== 'harvest') return false;
    }
    return true;
  });

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backCircleBtn}
          onPress={onBack}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Back"
        >
          <ArrowBackIcon size={20} color="#15803D" />
        </TouchableOpacity>

        <View style={styles.headerTitleCol}>
          <Text style={styles.headerTitle}>Diary Calendar</Text>
          <Text style={styles.headerSubtitle}>Your logged activity, month by month</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Filters Row ── */}
        <View style={styles.filtersRow}>
          <TouchableOpacity
            style={styles.filterDropdown}
            activeOpacity={0.8}
            onPress={() => setActiveModal('field')}
          >
            <Text style={styles.filterDropdownText} numberOfLines={1}>
              {fieldFilter}
            </Text>
            <ChevronDownIcon size={16} color="#6B7280" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.filterDropdown}
            activeOpacity={0.8}
            onPress={() => setActiveModal('activity')}
          >
            <Text style={styles.filterDropdownText} numberOfLines={1}>
              {activityFilter}
            </Text>
            <ChevronDownIcon size={16} color="#6B7280" />
          </TouchableOpacity>
        </View>

        {/* ── Calendar Card ── */}
        <View style={styles.calendarCard}>
          {/* Month Nav Row */}
          <View style={styles.monthNavRow}>
            <TouchableOpacity style={styles.monthArrowBtn} activeOpacity={0.7}>
              <ChevronLeftIcon size={18} color="#4B5563" />
            </TouchableOpacity>

            <Text style={styles.monthTitleText}>{selectedMonth}</Text>

            <TouchableOpacity style={styles.monthArrowBtn} activeOpacity={0.7}>
              <ChevronRightIcon size={18} color="#4B5563" />
            </TouchableOpacity>
          </View>

          {/* Weekday Labels */}
          <View style={styles.weekdaysRow}>
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((w, idx) => (
              <View key={idx} style={styles.weekdayCell}>
                <Text style={styles.weekdayText}>{w}</Text>
              </View>
            ))}
          </View>

          {/* Days Grid */}
          <View style={styles.daysGrid}>
            {/* Empty offset days */}
            {Array.from({ length: emptyDaysOffset }).map((_, idx) => (
              <View key={`empty-${idx}`} style={styles.dayCell} />
            ))}

            {/* Calendar Days */}
            {Array.from({ length: totalDaysInMonth }).map((_, idx) => {
              const dayNum = idx + 1;
              const isSelected = selectedDay === dayNum;
              const isToday = dayNum === todayDay;
              const hasEntries = daysWithEntries.has(dayNum);

              return (
                <TouchableOpacity
                  key={`day-${dayNum}`}
                  style={styles.dayCell}
                  activeOpacity={0.7}
                  onPress={() => setSelectedDay(dayNum)}
                >
                  <View
                    style={[
                      styles.dayCircle,
                      isSelected && styles.dayCircleSelected,
                      !isSelected && isToday && styles.dayCircleToday,
                    ]}
                  >
                    <Text
                      style={[
                        styles.dayNumberText,
                        isSelected && styles.dayNumberTextSelected,
                        !isSelected && isToday && styles.dayNumberTextToday,
                      ]}
                    >
                      {dayNum}
                    </Text>

                    {/* Has Entry Indicator Dot */}
                    {hasEntries && (
                      <View
                        style={[
                          styles.entryIndicatorDot,
                          isSelected && styles.entryIndicatorDotWhite,
                          !isSelected && isToday && styles.entryIndicatorDotGreen,
                        ]}
                      />
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Divider */}
          <View style={styles.legendDivider} />

          {/* Legend Row */}
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

        {/* ── Selected Date Section ── */}
        <View style={styles.selectedDateHeaderRow}>
          <Text style={styles.selectedDateTitle}>
            {currentEntries[0]?.dateLabel ??
              (selectedDay === 12
                ? 'SUNDAY, 12 JULY'
                : selectedDay === 16
                ? 'THURSDAY, 16 JULY'
                : `DAY ${selectedDay}, JULY 2026`)}
          </Text>
          <Text style={styles.selectedDateCount}>
            {currentEntries.length} {currentEntries.length === 1 ? 'entry' : 'entries'}
          </Text>
        </View>

        {/* Entries List for Selected Date */}
        <View style={styles.entriesList}>
          {currentEntries.map((item) => {
            const { icon, bg } = getIconForEntry(item.type);
            return (
              <View key={item.id} style={styles.entryCard}>
                <View style={[styles.entryIconBox, { backgroundColor: bg }]}>
                  {icon}
                </View>

                <View style={styles.entryInfoCol}>
                  <Text style={styles.entryTitle}>{item.title}</Text>
                  <Text style={styles.entrySubtitle}>{item.field}</Text>
                </View>

                <View style={styles.entryRightCol}>
                  <Text style={styles.entryDurationText}>{item.duration}</Text>
                  <ChevronDownIcon size={16} color="#6B7280" />
                </View>
              </View>
            );
          })}

          {currentEntries.length === 0 && (
            <View style={styles.emptyStateCard}>
              <Text style={styles.emptyStateText}>No activity logged for this day.</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* ── Selection Modal for Dropdowns ── */}
      <Modal
        visible={activeModal !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setActiveModal(null)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setActiveModal(null)}
        >
          <View style={styles.modalSheet} onStartShouldSetResponder={() => true}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>
                {activeModal === 'field' ? 'Select Field' : 'Select Activity'}
              </Text>
              <TouchableOpacity
                onPress={() => setActiveModal(null)}
                style={styles.modalCloseBtn}
              >
                <Text style={styles.modalCloseText}>Done</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalOptionsList}>
              {(activeModal === 'field' ? DUMMY_FIELDS : DUMMY_ACTIVITIES).map((opt) => {
                const isSelected =
                  activeModal === 'field' ? fieldFilter === opt : activityFilter === opt;
                return (
                  <TouchableOpacity
                    key={opt}
                    style={[styles.modalOptionRow, isSelected && styles.modalOptionRowSelected]}
                    activeOpacity={0.7}
                    onPress={() => {
                      if (activeModal === 'field') setFieldFilter(opt);
                      else setActivityFilter(opt);
                      setActiveModal(null);
                    }}
                  >
                    <Text
                      style={[styles.modalOptionText, isSelected && styles.modalOptionTextSelected]}
                    >
                      {opt}
                    </Text>
                    {isSelected && <CheckmarkIcon size={16} color="#15803D" />}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

// ─────────────────────────────────────────────
// Stylesheet
// ─────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  backCircleBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleCol: {
    flex: 1,
    marginLeft: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 30,
    gap: 14,
  },
  filtersRow: {
    flexDirection: 'row',
    gap: 10,
  },
  filterDropdown: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  filterDropdownText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#374151',
  },
  calendarCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 16,
  },
  monthNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  monthArrowBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthTitleText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  weekdaysRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  weekdayCell: {
    flex: 1,
    alignItems: 'center',
  },
  weekdayText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#9CA3AF',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: '14.28%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 2,
  },
  dayCircle: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  dayCircleSelected: {
    backgroundColor: '#15803D',
  },
  dayCircleToday: {
    borderWidth: 1.5,
    borderColor: '#15803D',
  },
  dayNumberText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#374151',
  },
  dayNumberTextSelected: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  dayNumberTextToday: {
    color: '#15803D',
    fontWeight: '700',
  },
  entryIndicatorDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#15803D',
    marginTop: 2,
  },
  entryIndicatorDotWhite: {
    backgroundColor: '#FFFFFF',
  },
  entryIndicatorDotGreen: {
    backgroundColor: '#15803D',
  },
  legendDivider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginTop: 14,
    marginBottom: 12,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
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
    backgroundColor: '#15803D',
  },
  legendTodayBox: {
    width: 12,
    height: 12,
    borderRadius: 3,
    borderWidth: 1.5,
    borderColor: '#15803D',
  },
  legendSelectedBox: {
    width: 12,
    height: 12,
    borderRadius: 3,
    backgroundColor: '#15803D',
  },
  legendText: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '500',
  },
  selectedDateHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    marginTop: 4,
  },
  selectedDateTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6B7280',
    letterSpacing: 0.5,
  },
  selectedDateCount: {
    fontSize: 12,
    fontWeight: '600',
    color: '#15803D',
  },
  entriesList: {
    gap: 10,
  },
  entryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 12,
  },
  entryIconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  entryInfoCol: {
    flex: 1,
  },
  entryTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  entrySubtitle: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 2,
  },
  entryRightCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  entryDurationText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#15803D',
  },
  emptyStateCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 20,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 13,
    color: '#9CA3AF',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 16,
    paddingBottom: 32,
    paddingHorizontal: 20,
    maxHeight: '60%',
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  modalCloseBtn: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  modalCloseText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#15803D',
  },
  modalOptionsList: {
    marginTop: 8,
  },
  modalOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F9FAFB',
  },
  modalOptionRowSelected: {
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  modalOptionText: {
    fontSize: 14,
    color: '#374151',
  },
  modalOptionTextSelected: {
    color: '#15803D',
    fontWeight: '700',
  },
});
