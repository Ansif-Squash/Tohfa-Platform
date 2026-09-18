import React, { useState } from 'react';
import {
  Alert,
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Circle, Line, Path, Rect } from 'react-native-svg';
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

function ChevronLeft({ size = 20, color = P.primary }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M15 18L9 12L15 6" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function TreeBannerIcon({ size = 22, color = colors.brandGreen }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 3L6 13h4l-3 8h10l-3-8h4L12 3z"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Line x1="12" y1="21" x2="12" y2="23" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function LockIcon({ size = 18, color = P.twGray500 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="11" width="18" height="11" rx="2" stroke={color} strokeWidth="2" />
      <Path d="M7 11V7a5 5 0 0 1 10 0v4" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function CalendarIcon({ size = 18, color = P.twGray500 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="4" width="18" height="18" rx="2" stroke={color} strokeWidth="2" />
      <Line x1="3" y1="10" x2="21" y2="10" stroke={color} strokeWidth="2" />
      <Line x1="8" y1="2" x2="8" y2="6" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="16" y1="2" x2="16" y2="6" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function MinusIcon({ size = 16, color = colors.brandGreen }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Line x1="5" y1="12" x2="19" y2="12" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
    </Svg>
  );
}

function PlusIcon({ size = 16, color = colors.brandGreen }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Line x1="12" y1="5" x2="12" y2="19" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
      <Line x1="5" y1="12" x2="19" y2="12" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
    </Svg>
  );
}

function TrashIcon({ size = 16, color = P.twRed600 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M3 6h18" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="10" y1="11" x2="10" y2="17" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="14" y1="11" x2="14" y2="17" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function CheckIcon({ size = 18, color = P.white }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M20 6L9 17l-5-5" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

// ── Types ────────────────────────────────────────────────────────────────────

export interface PlantingFormData {
  id?: string | undefined;
  species: string;
  treeCount: number;
  plantedDate: string;
  locationZone?: string | undefined;
  purpose?: string | undefined;
}

export interface EditPlantingScreenInputData {
  id?: string | undefined;
  species?: string | undefined;
  treeCount?: number | undefined;
  plantedDate?: string | undefined;
  locationZone?: string | undefined;
  purpose?: string | undefined;
}

export interface EditPlantingScreenProps {
  planting?: EditPlantingScreenInputData | undefined;
  onNavigateBack: () => void;
  onSave?: ((data: PlantingFormData) => void) | undefined;
  onRemove?: (() => void) | undefined;
}

export function EditPlantingScreen({
  planting,
  onNavigateBack,
  onSave,
  onRemove,
}: EditPlantingScreenProps): React.JSX.Element {
  const [species, setSpecies] = useState(planting?.species || 'Silver Oak');
  const [treeCount, setTreeCount] = useState<number>(planting?.treeCount ?? 12);
  const [plantedDate, setPlantedDate] = useState<Date | null>(
    planting?.plantedDate ? new Date(planting.plantedDate) : new Date('2019-06-14')
  );
  const [showCalendar, setShowCalendar] = useState(false);
  const [locationZone, setLocationZone] = useState(planting?.locationZone || 'Zone A boundary');
  const [purpose, setPurpose] = useState(planting?.purpose || 'Shade & windbreak');

  const plantedDateLabel = plantedDate ? formatSafeDate(plantedDate) : null;
  const calendarStartDate = toCalendarDateString(plantedDate ?? new Date());
  const latestSelectableDate = todayCalendarDateString();

  function handleDecrementCount(): void {
    setTreeCount((prev) => (prev > 1 ? prev - 1 : 1));
  }

  function handleIncrementCount(): void {
    setTreeCount((prev) => prev + 1);
  }

  function handleDateSelected(day: DateData): void {
    setPlantedDate(dateFromCalendarDay(day));
    setShowCalendar(false);
  }

  function handleRemove(): void {
    onRemove?.();
  }

  function handleSave(): void {
    if (!species.trim()) return;
    onSave?.({
      id: planting?.id,
      species: species.trim(),
      treeCount,
      plantedDate: plantedDate ? formatSafeDate(plantedDate) : '',
      locationZone: locationZone.trim() || undefined,
      purpose: purpose.trim() || undefined,
    });
    onNavigateBack();
  }

  return (
    <SafeAreaView style={styles.screen}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onNavigateBack} activeOpacity={0.7}>
          <ChevronLeft size={20} color={P.primary} />
        </TouchableOpacity>
        <View style={styles.headerTextWrap}>
          <Text style={styles.headerTitle}>Edit Planting</Text>
          <Text style={styles.headerSubtitle}>Update tree/planting details</Text>
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
            <TreeBannerIcon size={22} color={colors.brandGreen} />
          </View>
          <View style={styles.categoryTextWrap}>
            <Text style={styles.categoryTitle}>Trees</Text>
            <Text style={styles.categorySubtitle}>Category locked for this item</Text>
          </View>
          <LockIcon size={18} color={P.twGray500} />
        </View>

        {/* Species / Variety Field */}
        <Text style={styles.fieldLabel}>
          Species / Variety <Text style={styles.required}>*</Text>
        </Text>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.textInput}
            value={species}
            onChangeText={setSpecies}
            placeholder="e.g. Silver Oak"
            placeholderTextColor={P.twGray400}
          />
        </View>

        {/* Number of trees */}
        <Text style={styles.fieldLabel}>
          Number of trees <Text style={styles.required}>*</Text>
        </Text>
        <View style={styles.counterRow}>
          <TouchableOpacity
            style={styles.counterButton}
            onPress={handleDecrementCount}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Decrease tree count"
          >
            <MinusIcon size={16} color={colors.brandGreen} />
          </TouchableOpacity>
          <Text style={styles.counterValueText}>{treeCount}</Text>
          <TouchableOpacity
            style={styles.counterButton}
            onPress={handleIncrementCount}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Increase tree count"
          >
            <PlusIcon size={16} color={colors.brandGreen} />
          </TouchableOpacity>
        </View>

        {/* Planting Date Field */}
        <Text style={styles.fieldLabel}>Planting date</Text>
        <TouchableOpacity
          style={styles.inputContainer}
          activeOpacity={0.7}
          onPress={() => setShowCalendar(true)}
          accessibilityRole="button"
          accessibilityLabel={
            plantedDateLabel
              ? `Planting date, ${plantedDateLabel}. Change date`
              : 'Select planting date'
          }
        >
          <Text style={[styles.inputText, !plantedDate && styles.placeholderText]}>
            {plantedDateLabel ?? 'Select date'}
          </Text>
          <CalendarIcon size={18} color={P.twGray500} />
        </TouchableOpacity>

        {/* Location / Zone Field */}
        <Text style={styles.fieldLabel}>Location / Zone</Text>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.textInput}
            value={locationZone}
            onChangeText={setLocationZone}
            placeholder="e.g. Zone A boundary"
            placeholderTextColor={P.twGray400}
          />
        </View>

        {/* Purpose Field */}
        <Text style={styles.fieldLabel}>Purpose</Text>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.textInput}
            value={purpose}
            onChangeText={setPurpose}
            placeholder="e.g. Shade & windbreak"
            placeholderTextColor={P.twGray400}
          />
        </View>

        {/* Remove Button */}
        <TouchableOpacity
          style={styles.removeButton}
          onPress={handleRemove}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Remove this planting"
        >
          <TrashIcon size={16} color={P.twRed600} />
          <Text style={styles.removeButtonText}>Remove this planting</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Planting Date Calendar Modal */}
      {showCalendar ? (
        <Modal transparent visible animationType="fade" onRequestClose={() => setShowCalendar(false)}>
          <View style={styles.calendarOverlay}>
            <View style={styles.calendarScrim} pointerEvents="none" />
            <TouchableOpacity
              style={styles.calendarBackdrop}
              activeOpacity={1}
              onPress={() => setShowCalendar(false)}
              accessibilityRole="button"
              accessibilityLabel="Close date picker"
            />
            <View style={styles.calendarSheet}>
              <View style={styles.calendarHeader}>
                <Text style={styles.calendarTitle}>Planting date</Text>
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => setShowCalendar(false)}
                  accessibilityRole="button"
                  accessibilityLabel="Cancel date selection"
                >
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

      {/* Sticky Save Changes Button */}
      <View style={styles.stickyBottom}>
        <TouchableOpacity
          style={[styles.saveButton, !species.trim() && styles.saveButtonDisabled]}
          activeOpacity={0.8}
          onPress={handleSave}
        >
          <CheckIcon size={18} color={P.white} />
          <Text style={styles.saveButtonText}>Save changes</Text>
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
    backgroundColor: P.lightGreen,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: P.twGreen100,
    padding: 14,
    marginBottom: 20,
  },
  categoryIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: P.white,
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

  // Counter Row
  counterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 6,
  },
  counterButton: {
    width: 42,
    height: 42,
    borderRadius: 10,
    backgroundColor: P.twGreen100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  counterValueText: {
    fontSize: 17,
    fontWeight: '700',
    color: P.nearBlack,
    minWidth: 28,
    textAlign: 'center',
  },

  // Remove Button
  removeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: P.twRed50,
    borderWidth: 1,
    borderColor: P.twRed300,
    borderRadius: 12,
    paddingVertical: 14,
    gap: 8,
    marginTop: 24,
  },
  removeButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: P.twRed600,
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
