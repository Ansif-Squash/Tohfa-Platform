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
import { authPalette as P, colors } from '../../theme';
import { formatSafeDate } from '../../polyfills';
import {
  dateFromCalendarDay,
  toCalendarDateString,
  todayCalendarDateString,
} from './toolPurchaseDate';

// ── Calendar theme ───────────────────────────────────────────────────────────

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

function ChevronLeft() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path d="M15 18L9 12L15 6" stroke={P.primary} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function MachineryBannerIcon() {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Circle cx="6" cy="17" r="3" stroke={P.white} strokeWidth="2" />
      <Circle cx="18" cy="15" r="5" stroke={P.white} strokeWidth="2" />
      <Path d="M6 14h6l2-6h4v7" stroke={P.white} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Line x1="14" y1="8" x2="14" y2="14" stroke={P.white} strokeWidth="1.8" />
      <Line x1="11" y1="5" x2="11" y2="8" stroke={P.white} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function CalendarIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="4" width="18" height="18" rx="2" stroke={P.twGray500} strokeWidth="2" />
      <Line x1="3" y1="10" x2="21" y2="10" stroke={P.twGray500} strokeWidth="2" />
      <Line x1="8" y1="2" x2="8" y2="6" stroke={P.twGray500} strokeWidth="2" strokeLinecap="round" />
      <Line x1="16" y1="2" x2="16" y2="6" stroke={P.twGray500} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function InfoIcon() {
  return (
    <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke={P.twGray400} strokeWidth="2" />
      <Line x1="12" y1="16" x2="12" y2="12" stroke={P.twGray400} strokeWidth="2" strokeLinecap="round" />
      <Circle cx="12" cy="8" r="1" fill={P.twGray400} />
    </Svg>
  );
}

function PlusIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Line x1="12" y1="5" x2="12" y2="19" stroke={P.white} strokeWidth="2.5" strokeLinecap="round" />
      <Line x1="5" y1="12" x2="19" y2="12" stroke={P.white} strokeWidth="2.5" strokeLinecap="round" />
    </Svg>
  );
}

// ── Component ────────────────────────────────────────────────────────────────

export interface AddMachineryScreenProps {
  onNavigateBack: () => void;
  onSave?: () => void;
}

export function AddMachineryScreen({ onNavigateBack, onSave }: AddMachineryScreenProps): React.JSX.Element {
  const [name, setName] = useState('');
  const [purchaseDate, setPurchaseDate] = useState<Date | null>(null);
  const [showPurchaseDateCalendar, setShowPurchaseDateCalendar] = useState(false);
  const [serviceInterval, setServiceInterval] = useState('');

  const purchaseDateLabel = purchaseDate ? formatSafeDate(purchaseDate) : null;

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
          <Text style={styles.headerTitle}>Add Machinery</Text>
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
            <MachineryBannerIcon />
          </View>
          <View style={styles.categoryTextWrap}>
            <Text style={styles.categoryTitle}>Machinery</Text>
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
            placeholder="e.g. Mini Tractor — Mahindra Jivo"
            placeholderTextColor={P.twGray400}
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
            placeholderTextColor={P.twGray400}
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

      {/* Purchase Date Calendar Modal */}
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
          <Text style={styles.saveButtonText}>Add machinery</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: P.lightSurfaceAlt,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: P.white,
    borderBottomWidth: 1,
    borderBottomColor: P.twGray100,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: P.sageTintBg,
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
    color: P.nearBlack,
    letterSpacing: 0.3,
  },
  headerSubtitle: {
    fontSize: 13,
    fontWeight: '400',
    color: P.twGray500,
    marginTop: 1,
  },
  cancelText: {
    fontSize: 14,
    fontWeight: '500',
    color: P.twGray500,
    paddingHorizontal: 4,
  },

  // Scroll Content
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 110,
  },

  // Category Banner
  categoryBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: P.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: P.twGray200,
    padding: 14,
    marginBottom: 20,
  },
  categoryIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: P.twAmber800,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  categoryTextWrap: {
    flex: 1,
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: P.nearBlack,
  },
  categorySubtitle: {
    fontSize: 13,
    color: P.twGray500,
    marginTop: 2,
  },

  // Form Fields
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: P.twGray700,
    marginBottom: 6,
    marginTop: 14,
  },
  required: {
    color: P.twRed500,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: P.white,
    borderWidth: 1,
    borderColor: P.twGray200,
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 48,
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    color: P.nearBlack,
    height: '100%',
  },
  inputText: {
    fontSize: 15,
    color: P.nearBlack,
  },
  placeholderText: {
    color: P.twGray400,
  },

  // Info Note
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    gap: 6,
  },
  infoText: {
    fontSize: 12,
    color: P.twGray500,
    flex: 1,
    lineHeight: 16,
  },

  // Sticky Bottom
  stickyBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: P.white,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 24,
    borderTopWidth: 1,
    borderTopColor: P.twGray100,
  },
  saveButton: {
    height: 48,
    backgroundColor: colors.brandGreen,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: colors.brandGreen,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: P.white,
  },

  // Calendar Modal
  calendarOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  calendarScrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  calendarBackdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  calendarSheet: {
    width: '90%',
    backgroundColor: P.white,
    borderRadius: 16,
    padding: 16,
    shadowColor: P.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 5,
  },
  calendarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  calendarTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: P.nearBlack,
  },
  calendarCancelText: {
    fontSize: 14,
    fontWeight: '600',
    color: P.twGray500,
  },
});
