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

function ChevronLeft() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path d="M15 18L9 12L15 6" stroke={P.primary} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function TreeBannerIcon() {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 3L6 13h4l-3 8h10l-3-8h4L12 3z"
        stroke={P.white}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
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

export interface AddPlantingScreenProps {
  onNavigateBack: () => void;
  onSave?: () => void;
}

export function AddPlantingScreen({ onNavigateBack, onSave }: AddPlantingScreenProps): React.JSX.Element {
  const [speciesName, setSpeciesName] = useState('');
  const [treeCount, setTreeCount] = useState('');
  const [plantedDate, setPlantedDate] = useState<Date | null>(null);
  const [showCalendar, setShowCalendar] = useState(false);
  const [zone, setZone] = useState('');
  const [purpose, setPurpose] = useState('');

  const plantedDateLabel = plantedDate ? formatSafeDate(plantedDate) : null;
  const calendarStartDate = toCalendarDateString(plantedDate ?? new Date());
  const latestSelectableDate = todayCalendarDateString();

  function handleDateSelected(day: DateData): void {
    setPlantedDate(dateFromCalendarDay(day));
    setShowCalendar(false);
  }

  return (
    <SafeAreaView style={styles.screen}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onNavigateBack} activeOpacity={0.7}>
          <ChevronLeft />
        </TouchableOpacity>
        <View style={styles.headerTextWrap}>
          <Text style={styles.headerTitle}>Add Planting</Text>
          <Text style={styles.headerSubtitle}>Add new tree or perennial record</Text>
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
        {/* Category Banner */}
        <View style={styles.categoryBanner}>
          <View style={styles.categoryIconCircle}>
            <TreeBannerIcon />
          </View>
          <View style={styles.categoryTextWrap}>
            <Text style={styles.categoryTitle}>Trees & Plantings</Text>
            <Text style={styles.categorySubtitle}>Category for this item</Text>
          </View>
        </View>

        {/* Species Name */}
        <Text style={styles.fieldLabel}>
          Species / Tree Name <Text style={styles.required}>*</Text>
        </Text>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.textInput}
            value={speciesName}
            onChangeText={setSpeciesName}
            placeholder="e.g. Silver Oak / Guava"
            placeholderTextColor={P.twGray400}
          />
        </View>

        {/* Tree Count */}
        <Text style={styles.fieldLabel}>
          Number of Trees <Text style={styles.required}>*</Text>
        </Text>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.textInput}
            value={treeCount}
            onChangeText={setTreeCount}
            placeholder="e.g. 12"
            placeholderTextColor={P.twGray400}
            keyboardType="numeric"
          />
        </View>

        {/* Planting Date */}
        <Text style={styles.fieldLabel}>Date Planted</Text>
        <TouchableOpacity
          style={styles.inputContainer}
          activeOpacity={0.7}
          onPress={() => setShowCalendar(true)}
        >
          <Text style={[styles.inputText, !plantedDate && styles.placeholderText]}>
            {plantedDateLabel ?? 'Select planting date'}
          </Text>
          <CalendarIcon />
        </TouchableOpacity>

        {/* Zone / Location */}
        <Text style={styles.fieldLabel}>Farm Zone / Boundary</Text>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.textInput}
            value={zone}
            onChangeText={setZone}
            placeholder="e.g. Zone A boundary / Near Zone B"
            placeholderTextColor={P.twGray400}
          />
        </View>

        {/* Purpose */}
        <Text style={styles.fieldLabel}>Primary Purpose</Text>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.textInput}
            value={purpose}
            onChangeText={setPurpose}
            placeholder="e.g. Shade & windbreak / Seasonal yield"
            placeholderTextColor={P.twGray400}
          />
        </View>

        {/* Info Note */}
        <View style={styles.infoRow}>
          <InfoIcon />
          <Text style={styles.infoText}>
            Perennial plantings count towards biomass index and organic certification canopy standards.
          </Text>
        </View>
      </ScrollView>

      {/* Calendar Modal */}
      {showCalendar ? (
        <Modal transparent visible animationType="fade" onRequestClose={() => setShowCalendar(false)}>
          <View style={styles.calendarOverlay}>
            <View style={styles.calendarScrim} pointerEvents="none" />
            <TouchableOpacity
              style={styles.calendarBackdrop}
              activeOpacity={1}
              onPress={() => setShowCalendar(false)}
            />
            <View style={styles.calendarSheet}>
              <View style={styles.calendarHeader}>
                <Text style={styles.calendarTitle}>Planting Date</Text>
                <TouchableOpacity onPress={() => setShowCalendar(false)}>
                  <Text style={styles.calendarCancelText}>Cancel</Text>
                </TouchableOpacity>
              </View>

              <Calendar
                current={calendarStartDate}
                maxDate={latestSelectableDate}
                onDayPress={handleDateSelected}
                enableSwipeMonths
                theme={CALENDAR_THEME}
                markedDates={
                  plantedDate
                    ? {
                        [toCalendarDateString(plantedDate)]: {
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
          style={[styles.saveButton, (!speciesName || !treeCount) && styles.saveButtonDisabled]}
          activeOpacity={0.8}
          onPress={() => {
            if (speciesName && treeCount) {
              onSave?.();
              onNavigateBack();
            }
          }}
        >
          <PlusIcon />
          <Text style={styles.saveButtonText}>Add planting</Text>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 110,
  },
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
    backgroundColor: colors.brandGreen,
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
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 14,
    gap: 6,
  },
  infoText: {
    fontSize: 12,
    color: P.twGray500,
    flex: 1,
    lineHeight: 16,
  },
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
