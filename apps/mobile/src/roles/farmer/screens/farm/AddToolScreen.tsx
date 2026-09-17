import React, { useState } from 'react';
import {
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import Svg, { Path, Circle, Rect, Line } from 'react-native-svg';
import { Calendar } from 'react-native-calendars';
import type { DateData } from 'react-native-calendars';
import { colors, radius, spacing } from '../../theme';
import { formatSafeDate } from '../../polyfills';
import {
  dateFromCalendarDay,
  toCalendarDateString,
  todayCalendarDateString,
} from './toolPurchaseDate';

// ── Calendar theme ───────────────────────────────────────────────────────────
//
// Built from the farmer theme rather than literal hex so the calendar's green
// is the same green as the rest of the screen (see theme/index.ts, "Screens
// must import from here — never inline hex literals").

const CALENDAR_THEME = {
  calendarBackground: colors.white,
  backgroundColor: colors.white,
  monthTextColor: colors.textDark,
  textMonthFontWeight: '700',
  textMonthFontSize: 16,
  textSectionTitleColor: colors.textSubtle,
  textDayHeaderFontWeight: '600',
  textDayFontSize: 15,
  textDayFontWeight: '500',
  dayTextColor: colors.textDark,
  selectedDayBackgroundColor: colors.brandGreen,
  selectedDayTextColor: colors.white,
  todayTextColor: colors.brandGreen,
  textDisabledColor: colors.textPlaceholder,
  arrowColor: colors.brandGreen,
  disabledArrowColor: colors.borderMedium,
} as const;

// ── SVG Icons ────────────────────────────────────────────────────────────────

const ChevronLeft = () => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Path d="M15 18L9 12L15 6" stroke="#2e7d32" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const ToolsIcon = () => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z" stroke="#FFFFFF" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const CalendarIcon = () => (
  <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
    <Rect x="3" y="4" width="18" height="18" rx="2" stroke="#6B7566" strokeWidth="2" />
    <Line x1="3" y1="10" x2="21" y2="10" stroke="#6B7566" strokeWidth="2" />
    <Line x1="8" y1="2" x2="8" y2="6" stroke="#6B7566" strokeWidth="2" strokeLinecap="round" />
    <Line x1="16" y1="2" x2="16" y2="6" stroke="#6B7566" strokeWidth="2" strokeLinecap="round" />
  </Svg>
);

const InfoIcon = () => (
  <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="9" stroke="#9CA3AF" strokeWidth="2" />
    <Line x1="12" y1="16" x2="12" y2="12" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" />
    <Circle cx="12" cy="8" r="1" fill="#9CA3AF" />
  </Svg>
);

const CheckIcon = () => (
  <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
    <Path d="M5 13L9 17L19 7" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const PlusIcon = () => (
  <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
    <Line x1="12" y1="5" x2="12" y2="19" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" />
    <Line x1="5" y1="12" x2="19" y2="12" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" />
  </Svg>
);

// ── Component ────────────────────────────────────────────────────────────────

interface AddToolScreenProps {
  onNavigateBack: () => void;
  onSave?: () => void;
}

export function AddToolScreen({ onNavigateBack, onSave }: AddToolScreenProps): React.JSX.Element {
  const [name, setName] = useState('');
  // Purchase date is optional in the design (no asterisk), so it starts empty
  // instead of defaulting to today: the farmer opens the calendar and picks.
  const [purchaseDate, setPurchaseDate] = useState<Date | null>(null);
  const [showPurchaseDateCalendar, setShowPurchaseDateCalendar] = useState(false);
  const [serviceInterval, setServiceInterval] = useState('');

  const purchaseDateLabel = purchaseDate ? formatSafeDate(purchaseDate) : null;

  // The calendar reads `current` only when it mounts, so the date under the
  // grid has to be resolved here, before it is rendered: the selected month
  // when there is one, otherwise today's.
  const calendarStartDate = toCalendarDateString(purchaseDate ?? new Date());
  const latestSelectableDate = todayCalendarDateString();

  function openPurchaseDateCalendar(): void {
    setShowPurchaseDateCalendar(true);
  }

  function closePurchaseDateCalendar(): void {
    setShowPurchaseDateCalendar(false);
  }

  function handlePurchaseDateSelected(day: DateData): void {
    setPurchaseDate(dateFromCalendarDay(day));
    closePurchaseDateCalendar();
  }

  return (
    <SafeAreaView style={styles.screen}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onNavigateBack} activeOpacity={0.7}>
          <ChevronLeft />
        </TouchableOpacity>
        <View style={styles.headerTextWrap}>
          <Text style={styles.headerTitle}>Add Tool</Text>
          <Text style={styles.headerSubtitle}>Add a new item</Text>
        </View>
        <TouchableOpacity onPress={onNavigateBack} activeOpacity={0.7}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Category Locked Banner */}
        <View style={styles.categoryBanner}>
          <View style={styles.categoryIconCircle}>
            <ToolsIcon />
          </View>
          <View style={styles.categoryTextWrap}>
            <Text style={styles.categoryTitle}>Tools</Text>
            <Text style={styles.categorySubtitle}>Category for this item</Text>
          </View>
        </View>

        {/* Name Field */}
        <Text style={styles.fieldLabel}>
          Name <Text style={styles.required}>*</Text>
        </Text>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.textInput}
            value={name}
            onChangeText={setName}
            placeholder="e.g. Pruning Shears"
            placeholderTextColor="#B8B6AA"
          />
        </View>

        {/* Purchase Date Field */}
        <Text style={styles.fieldLabel}>Purchase date</Text>
        <TouchableOpacity
          style={styles.inputContainer}
          activeOpacity={0.7}
          onPress={openPurchaseDateCalendar}
          accessibilityRole="button"
          accessibilityLabel={
            purchaseDateLabel
              ? `Purchase date, ${purchaseDateLabel}. Change date`
              : 'Select purchase date'
          }
        >
          <Text style={[styles.inputText, !purchaseDate && styles.placeholderText]}>
            {purchaseDateLabel ?? 'Select date'}
          </Text>
          <CalendarIcon />
        </TouchableOpacity>

        {/* Service Interval Field */}
        <Text style={styles.fieldLabel}>
          Service interval (days) <Text style={styles.required}>*</Text>
        </Text>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.textInput}
            value={serviceInterval}
            onChangeText={setServiceInterval}
            placeholder="e.g. 90"
            placeholderTextColor="#B8B6AA"
            keyboardType="numeric"
          />
        </View>

        {/* Info Note */}
        <View style={styles.infoRow}>
          <InfoIcon />
          <Text style={styles.infoText}>
            Next-due date is calculated from this interval and the last service.
          </Text>
        </View>
      </ScrollView>

      {/* Purchase Date Calendar */}
      {/*
        Mounted only while open: react-native-calendars reads `current` when the
        grid mounts, so remounting per open is what guarantees it lands on the
        selected month (or today) instead of wherever the farmer swiped last.
        The Modal is what gives the sheet its own layer above the sticky footer.
      */}
      {showPurchaseDateCalendar ? (
        <Modal transparent visible animationType="fade" onRequestClose={closePurchaseDateCalendar}>
          <View style={styles.calendarOverlay}>
            <View style={styles.calendarScrim} pointerEvents="none" />
            <TouchableOpacity
              style={styles.calendarBackdrop}
              activeOpacity={1}
              onPress={closePurchaseDateCalendar}
              accessibilityRole="button"
              accessibilityLabel="Close date picker"
            />
            <View style={styles.calendarSheet}>
              <View style={styles.calendarHeader}>
                <Text style={styles.calendarTitle}>Purchase date</Text>
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={closePurchaseDateCalendar}
                  accessibilityRole="button"
                  accessibilityLabel="Cancel date selection"
                >
                  <Text style={styles.calendarCancelText}>Cancel</Text>
                </TouchableOpacity>
              </View>

              <Calendar
                current={calendarStartDate}
                maxDate={latestSelectableDate}
                onDayPress={handlePurchaseDateSelected}
                enableSwipeMonths
                theme={CALENDAR_THEME}
                markedDates={
                  purchaseDate
                    ? {
                        [toCalendarDateString(purchaseDate)]: {
                          selected: true,
                          selectedColor: colors.brandGreen,
                          selectedTextColor: colors.white,
                        },
                      }
                    : {}
                }
              />
            </View>
          </View>
        </Modal>
      ) : null}

      {/* Sticky Save Button */}
      <View style={styles.stickyBottom}>
        <TouchableOpacity
          style={[styles.saveButton, (!name || !serviceInterval) && styles.saveButtonDisabled]}
          activeOpacity={0.8}
          onPress={() => {
            if (name && serviceInterval) {
              onSave?.();
              onNavigateBack();
            }
          }}
        >
          <PlusIcon />
          <Text style={styles.saveButtonText}>Add tool</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#FAFAF7',
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0EEE6',
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F0FFF0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerTextWrap: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A2E1A',
    letterSpacing: 0.3,
  },
  headerSubtitle: {
    fontSize: 13,
    fontWeight: '400',
    color: '#6B7566',
    marginTop: 1,
  },
  cancelText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#2E7D32',
  },

  // Scroll
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 100,
  },

  // Category Banner
  categoryBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2E7D32',
    borderRadius: 12,
    padding: 14,
    marginBottom: 24,
  },
  categoryIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  categoryTextWrap: {
    flex: 1,
  },
  categoryTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  categorySubtitle: {
    fontSize: 12,
    fontWeight: '400',
    color: '#C8E6C9',
    marginTop: 1,
  },

  // Fields
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A2E1A',
    marginBottom: 8,
  },
  required: {
    color: '#DC2626',
    fontWeight: '600',
  },
  inputContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E8E6DD',
    paddingHorizontal: 14,
    paddingVertical: 14,
    marginBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: '#1A2E1A',
    padding: 0,
  },
  inputText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: '#1A2E1A',
  },
  placeholderText: {
    color: '#B8B6AA',
  },

  // Info
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    marginTop: -8,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '400',
    color: '#9CA3AF',
    lineHeight: 17,
  },

  // Sticky Bottom
  stickyBottom: {
    paddingHorizontal: 16,
    paddingBottom: 20,
    paddingTop: 12,
    backgroundColor: '#FAFAF7',
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2E7D32',
    borderRadius: 14,
    paddingVertical: 16,
    gap: 8,
    shadowColor: '#2E7D32',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // Purchase date calendar (new code — tokens from ../../theme, see CLAUDE.md)
  calendarOverlay: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  // The scrim is its own layer because a colour token has no alpha: tinting a
  // theme colour and dropping its opacity keeps the backdrop on-palette.
  calendarScrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.textDark,
    opacity: 0.5,
  },
  calendarBackdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  calendarSheet: {
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    overflow: 'hidden',
  },
  calendarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSoft,
  },
  calendarTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textDark,
  },
  calendarCancelText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.brandGreen,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.xs,
  },
});
