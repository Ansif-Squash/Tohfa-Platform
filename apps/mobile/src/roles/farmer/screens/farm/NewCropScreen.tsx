import React, { useState } from 'react';
import {
  Alert,
  Modal,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Circle, Line, Path, Rect } from 'react-native-svg';
import { authPalette as P, colors } from '../../theme';
import type { CropItem } from './ProduceCalendarScreen';

// ─────────────────────────────────────────────
// Inline Vector Icons (strictly no emojis, no raw hex)
// ─────────────────────────────────────────────

function ArrowBackIcon({ size = 20, color = P.deepGreen }: { size?: number; color?: string }) {
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

function ChevronDownIcon({ size = 18, color = P.twGray400 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M6 9l6 6 6-6"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function ChevronLeftIcon({ size = 18, color = P.twGray700 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M15 18l-6-6 6-6"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function ChevronRightIcon({ size = 18, color = P.twGray700 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M9 18l6-6-6-6"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONTHS_FULL = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

function parseDisplayDate(dateStr: string): Date {
  const parts = dateStr.trim().split(' ');
  if (parts.length === 3) {
    const day = parseInt(parts[0] ?? '1', 10);
    const monthIndex = MONTHS_SHORT.findIndex((m) => m.toLowerCase() === parts[1]?.toLowerCase());
    const year = parseInt(parts[2] ?? '2026', 10);
    if (!isNaN(day) && monthIndex !== -1 && !isNaN(year)) {
      return new Date(year, monthIndex, day);
    }
  }
  return new Date(2026, 5, 2);
}

function formatDisplayDate(date: Date): string {
  const day = date.getDate();
  const month = MONTHS_SHORT[date.getMonth()];
  const year = date.getFullYear();
  return `${day} ${month} ${year}`;
}

function SproutIcon({ size = 18, color = P.twGreen700 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 22V10M12 10c0-4 3-7 7-7 0 4-3 7-7 7zM12 14c0-3.5-2.5-6-6-6 0 3.5 2.5 6 6 6z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function SubCategoryIcon({ size = 18, color = P.twGreen700 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="4" y="4" width="6" height="6" rx="1.5" stroke={color} strokeWidth="1.8" />
      <Rect x="14" y="4" width="6" height="6" rx="1.5" stroke={color} strokeWidth="1.8" />
      <Rect x="9" y="14" width="6" height="6" rx="1.5" stroke={color} strokeWidth="1.8" />
      <Path d="M7 10v2h10v-2M12 12v2" stroke={color} strokeWidth="1.6" />
    </Svg>
  );
}

function ZoneFieldIcon({ size = 18, color = P.twGreen700 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="4" width="18" height="16" rx="2" stroke={color} strokeWidth="2" />
      <Path d="M3 10h18M10 4v16" stroke={color} strokeWidth="1.6" strokeDasharray="2 2" />
    </Svg>
  );
}

function CalendarIcon({ size = 18, color = P.twGreen700 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="4" width="18" height="18" rx="3" stroke={color} strokeWidth="2" />
      <Line x1="16" y1="2" x2="16" y2="6" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="8" y1="2" x2="8" y2="6" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="3" y1="10" x2="21" y2="10" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <Circle cx="8" cy="14" r="1" fill={color} />
      <Circle cx="12" cy="14" r="1" fill={color} />
      <Circle cx="16" cy="14" r="1" fill={color} />
    </Svg>
  );
}

function SparkleIcon({ size = 15, color = P.twGreen700 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 2l2.4 6.6L21 11l-6.6 2.4L12 20l-2.4-6.6L3 11l6.6-2.4L12 2z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function ArrowRightIcon({ size = 18, color = P.white }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M5 12h14M12 5l7 7-7 7"
        stroke={color}
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function CheckmarkIcon({ size = 18, color = P.white }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M20 6L9 17l-5-5"
        stroke={color}
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function InfoTriangleIcon({ size = 12, color = P.twGray500 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 4l9 16H3L12 4z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// ─────────────────────────────────────────────
// Master Catalog & Zones Data
// ─────────────────────────────────────────────

const CROP_CATALOG: Record<string, { subcategories: string[]; defaultDays: number; defaultYieldPerHa: number }> = {
  Tomato: { subcategories: ['Roma', 'Cherry', 'Beefsteak', 'Hybrid Red'], defaultDays: 75, defaultYieldPerHa: 3000 },
  Carrot: { subcategories: ['Nantes', 'Kuroda', 'Imperator', 'Baby Carrot'], defaultDays: 90, defaultYieldPerHa: 2500 },
  Cabbage: { subcategories: ['Green Coronet', 'Golden Acre', 'Red Drumhead', 'Savoy'], defaultDays: 90, defaultYieldPerHa: 3500 },
  Radish: { subcategories: ['White Long', 'Red Globe', 'French Breakfast'], defaultDays: 40, defaultYieldPerHa: 1800 },
  Beans: { subcategories: ['French Bush', 'Pole Beans', 'Broad Beans'], defaultDays: 60, defaultYieldPerHa: 2000 },
  Potato: { subcategories: ['Kufri Jyoti', 'Russet', 'Yukon Gold'], defaultDays: 100, defaultYieldPerHa: 4000 },
};

const ZONES_DATA = [
  { id: 'z1', name: 'Zone 1 — Upper Field', sizeHa: '0.4' },
  { id: 'z2', name: 'Zone 2 — Lower Slope', sizeHa: '0.6' },
  { id: 'z3', name: 'Zone 3 — Terrace', sizeHa: '0.5' },
];

export interface NewCropScreenProps {
  onBack?: () => void;
  onCancel?: () => void;
  onSaveCrop?: (crop: CropItem) => void;
}

export function NewCropScreen({
  onBack,
  onCancel,
  onSaveCrop,
}: NewCropScreenProps): React.JSX.Element {
  const [step, setStep] = useState<1 | 2>(1);

  // Step 1: Basic
  const [cropName, setCropName] = useState('Tomato');
  const [subCategory, setSubCategory] = useState('Roma');
  const [seedVariety, setSeedVariety] = useState('Roma VF');
  const [seedCompany, setSeedCompany] = useState('Namdhari');
  const [quantityUsed, setQuantityUsed] = useState('250');
  const [quantityUnit, setQuantityUnit] = useState('grams');
  const [costRs, setCostRs] = useState('480');

  // Step 2: Dates & Grade
  const [selectedZone, setSelectedZone] = useState('Zone 2 — Lower Slope');
  const [areaHa, setAreaHa] = useState('0.6');
  const [plantationDate, setPlantationDate] = useState('2 Jun 2026');
  const [expectedHarvestDate, setExpectedHarvestDate] = useState('16 Aug 2026');
  const [expectedQtyKg, setExpectedQtyKg] = useState('1,800');
  const [expectedGrade, setExpectedGrade] = useState<'Grade A' | 'Grade B' | 'Grade C'>('Grade A');

  // Modal pickers
  const [showCropPicker, setShowCropPicker] = useState(false);
  const [showSubCategoryPicker, setShowSubCategoryPicker] = useState(false);
  const [showUnitPicker, setShowUnitPicker] = useState(false);
  const [showZonePicker, setShowZonePicker] = useState(false);

  // Dynamic Date Picker Modal state
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [activeDateField, setActiveDateField] = useState<'plantation' | 'harvest'>('plantation');
  const [calendarViewYear, setCalendarViewYear] = useState(2026);
  const [calendarViewMonth, setCalendarViewMonth] = useState(5); // 0-indexed: 5 = June
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<Date>(new Date(2026, 5, 2));

  const openCalendar = (field: 'plantation' | 'harvest') => {
    setActiveDateField(field);
    const initialDate = parseDisplayDate(field === 'plantation' ? plantationDate : expectedHarvestDate);
    setSelectedCalendarDate(initialDate);
    setCalendarViewYear(initialDate.getFullYear());
    setCalendarViewMonth(initialDate.getMonth());
    setShowDatePicker(true);
  };

  const handlePrevMonth = () => {
    if (calendarViewMonth === 0) {
      setCalendarViewMonth(11);
      setCalendarViewYear((y) => y - 1);
    } else {
      setCalendarViewMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (calendarViewMonth === 11) {
      setCalendarViewMonth(0);
      setCalendarViewYear((y) => y + 1);
    } else {
      setCalendarViewMonth((m) => m + 1);
    }
  };

  const handleConfirmDate = () => {
    const formatted = formatDisplayDate(selectedCalendarDate);
    if (activeDateField === 'plantation') {
      setPlantationDate(formatted);
      // Auto-suggest harvest date based on crop maturity days
      const maturityDays = CROP_CATALOG[cropName]?.defaultDays ?? 75;
      const harvestDate = new Date(selectedCalendarDate.getTime() + maturityDays * 24 * 60 * 60 * 1000);
      setExpectedHarvestDate(formatDisplayDate(harvestDate));
    } else {
      setExpectedHarvestDate(formatted);
    }
    setShowDatePicker(false);
  };

  const daysInMonth = new Date(calendarViewYear, calendarViewMonth + 1, 0).getDate();
  const firstDayWeekday = new Date(calendarViewYear, calendarViewMonth, 1).getDay();

  // When crop name changes, reset sub-category and defaults
  const handleSelectCrop = (newCrop: string) => {
    setCropName(newCrop);
    const catalogEntry = CROP_CATALOG[newCrop];
    if (catalogEntry) {
      const firstSub = catalogEntry.subcategories[0] ?? '';
      setSubCategory(firstSub);
      setSeedVariety(`${firstSub} VF`);
    }
    setShowCropPicker(false);
  };

  // When zone changes, auto update Area (ha)
  const handleSelectZone = (zoneName: string) => {
    setSelectedZone(zoneName);
    const found = ZONES_DATA.find((z) => z.name === zoneName);
    if (found) {
      setAreaHa(found.sizeHa);
      const ha = parseFloat(found.sizeHa) || 0.5;
      const defaultYield = CROP_CATALOG[cropName]?.defaultYieldPerHa ?? 3000;
      const totalYield = Math.round(ha * defaultYield);
      setExpectedQtyKg(totalYield.toLocaleString());
    }
    setShowZonePicker(false);
  };

  const handleNextStep = () => {
    if (!cropName.trim()) {
      Alert.alert('Required Field', 'Please select or enter a crop name.');
      return;
    }
    setStep(2);
  };

  const handleSave = () => {
    const lower = cropName.toLowerCase();
    let cropType: 'carrot' | 'tomato' | 'cabbage' | 'custom' = 'custom';
    let accentColor: string = P.twGreen600;
    let imageUri = 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=160&auto=format&fit=crop&q=80';

    if (lower.includes('carrot')) {
      cropType = 'carrot';
      accentColor = P.twOrange500;
      imageUri = 'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?w=160&auto=format&fit=crop&q=80';
    } else if (lower.includes('tomato')) {
      cropType = 'tomato';
      accentColor = P.twOrange500;
      imageUri = 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=160&auto=format&fit=crop&q=80';
    } else if (lower.includes('cabbage')) {
      cropType = 'cabbage';
      accentColor = P.twGreen600;
      imageUri = 'https://images.unsplash.com/photo-1550950158-d0d960dff51b?w=160&auto=format&fit=crop&q=80';
    }

    const createdCrop: CropItem = {
      id: `crop-${Date.now()}`,
      name: cropName,
      variety: subCategory || seedVariety || 'Standard',
      cropType,
      zone: selectedZone,
      zoneShort: (selectedZone.split('—')[0] ?? selectedZone).trim(),
      area: `${areaHa} ha`,
      daysOld: 1,
      statusType: 'harvest',
      statusDays: 75,
      statusText: `Harvest in 75 days`,
      actionType: null,
      accentColor,
      imageUri,
    };

    if (onSaveCrop) {
      onSaveCrop(createdCrop);
    } else if (onBack) {
      onBack();
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={P.white} />

      {/* ── Top Header ── */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => {
            if (step === 2) {
              setStep(1);
            } else if (onBack) {
              onBack();
            }
          }}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <ArrowBackIcon size={20} color={P.twGreen800} />
        </TouchableOpacity>

        <View style={styles.headerTitleGroup}>
          <Text style={styles.headerTitle}>New Crop</Text>
          <Text style={styles.headerSubtitle}>
            {step === 1 ? 'Step 1 of 2 · Basic' : 'Step 2 of 2 · Dates & Grade'}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.cancelBtn}
          onPress={onCancel ?? onBack}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Cancel crop creation"
        >
          <Text style={styles.cancelBtnText}>Cancel</Text>
        </TouchableOpacity>
      </View>

      {/* ── 2-Step Progress Indicator ── */}
      <View style={styles.progressRow}>
        <View style={[styles.progressBarSegment, styles.progressBarActive]} />
        <View
          style={[
            styles.progressBarSegment,
            step === 2 ? styles.progressBarActive : styles.progressBarInactive,
          ]}
        />
      </View>

      {/* ── Main Form Content ── */}
      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {step === 1 ? (
          /* ══════════════════════════════════════
             STEP 1: BASIC
             ══════════════════════════════════════ */
          <>
            {/* Step hint banner */}
            <View style={styles.hintBanner}>
              <Text style={styles.hintBannerText}>
                Step 2 attaches it to a zone and timeline.
              </Text>
              <InfoTriangleIcon size={12} color={P.twGray500} />
            </View>

            {/* Field: Crop name * */}
            <View style={styles.formGroup}>
              <View style={styles.fieldLabelRow}>
                <SproutIcon size={16} color={P.twGreen700} />
                <Text style={styles.fieldLabel}>
                  Crop name <Text style={styles.requiredStar}>*</Text>
                </Text>
              </View>

              <TouchableOpacity
                style={[styles.selectorInput, styles.selectorInputActive]}
                onPress={() => setShowCropPicker(true)}
                activeOpacity={0.8}
              >
                <Text style={styles.selectorInputText}>{cropName}</Text>
                <ChevronDownIcon size={18} color={P.twGreen700} />
              </TouchableOpacity>

              <Text style={styles.helpText}>
                From the master catalog · Carrot, Tomato, Cabbage, Radish, Beans, Potato.
              </Text>
            </View>

            {/* Field: Sub-category */}
            <View style={styles.formGroup}>
              <View style={styles.fieldLabelRow}>
                <SubCategoryIcon size={16} color={P.twGreen700} />
                <Text style={styles.fieldLabel}>Sub-category</Text>
              </View>

              <TouchableOpacity
                style={styles.selectorInput}
                onPress={() => setShowSubCategoryPicker(true)}
                activeOpacity={0.8}
              >
                <Text style={styles.selectorInputText}>{subCategory}</Text>
                <ChevronDownIcon size={18} color={P.twGray500} />
              </TouchableOpacity>

              <Text style={styles.helpText}>
                Shown only for crops with sub-types · Tomato → Red / Cherry / Roma.
              </Text>
            </View>

            {/* Field: Seed variety & Seed company */}
            <View style={styles.twoColRow}>
              <View style={styles.halfCol}>
                <Text style={styles.colLabel}>Seed variety</Text>
                <TextInput
                  style={styles.textInput}
                  value={seedVariety}
                  onChangeText={setSeedVariety}
                  placeholder="e.g. Roma VF"
                  placeholderTextColor={P.twGray400}
                />
              </View>

              <View style={styles.halfCol}>
                <Text style={styles.colLabel}>Seed company</Text>
                <TextInput
                  style={styles.textInput}
                  value={seedCompany}
                  onChangeText={setSeedCompany}
                  placeholder="e.g. Namdhari"
                  placeholderTextColor={P.twGray400}
                />
              </View>
            </View>

            {/* Field: Quantity used & Unit */}
            <View style={styles.formGroup}>
              <Text style={styles.colLabel}>Quantity used</Text>
              <View style={styles.twoColRow}>
                <View style={[styles.halfCol, { flex: 1.2 }]}>
                  <TextInput
                    style={styles.textInput}
                    value={quantityUsed}
                    onChangeText={setQuantityUsed}
                    keyboardType="numeric"
                    placeholder="250"
                    placeholderTextColor={P.twGray400}
                  />
                </View>

                <TouchableOpacity
                  style={[styles.selectorInput, { flex: 1, height: 48 }]}
                  onPress={() => setShowUnitPicker(true)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.selectorInputText}>{quantityUnit}</Text>
                  <ChevronDownIcon size={16} color={P.twGray500} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Field: Cost (Rs.) */}
            <View style={styles.formGroup}>
              <Text style={styles.colLabel}>Cost (Rs.)</Text>
              <View style={styles.currencyInputWrapper}>
                <Text style={styles.currencyPrefix}>₹</Text>
                <TextInput
                  style={styles.currencyTextInput}
                  value={costRs}
                  onChangeText={setCostRs}
                  keyboardType="numeric"
                  placeholder="480"
                  placeholderTextColor={P.twGray400}
                />
              </View>
            </View>

            <View style={styles.bottomSpacer} />
          </>
        ) : (
          /* ══════════════════════════════════════
             STEP 2: DATES & GRADE
             ══════════════════════════════════════ */
          <>
            {/* Field: Zone * */}
            <View style={styles.formGroup}>
              <View style={styles.fieldLabelRow}>
                <ZoneFieldIcon size={16} color={P.twGreen700} />
                <Text style={styles.fieldLabel}>
                  Zone <Text style={styles.requiredStar}>*</Text>
                </Text>
              </View>

              <TouchableOpacity
                style={[styles.selectorInput, styles.selectorInputActive]}
                onPress={() => setShowZonePicker(true)}
                activeOpacity={0.8}
              >
                <Text style={styles.selectorInputText}>{selectedZone}</Text>
                <ChevronDownIcon size={18} color={P.twGreen700} />
              </TouchableOpacity>
            </View>

            {/* Field: Area (ha) */}
            <View style={styles.formGroup}>
              <Text style={styles.colLabel}>Area (ha)</Text>
              <View style={styles.areaBox}>
                <TextInput
                  style={styles.areaTextInput}
                  value={areaHa}
                  onChangeText={setAreaHa}
                  keyboardType="decimal-pad"
                  placeholder="0.6"
                  placeholderTextColor={P.twGray400}
                />
                <View style={styles.fromZonePill}>
                  <Text style={styles.fromZonePillText}>FROM ZONE</Text>
                </View>
              </View>
              <Text style={styles.helpText}>
                Pre-filled from the zone size · editable for partial plantings.
              </Text>
            </View>

            {/* Field: Plantation date & Expected harvest */}
            <View style={styles.formGroup}>
              <View style={styles.twoColRow}>
                <View style={styles.halfCol}>
                  <Text style={styles.colLabel}>
                    Plantation date <Text style={styles.requiredStar}>*</Text>
                  </Text>
                  <TouchableOpacity
                    style={[
                      styles.dateBox,
                      activeDateField === 'plantation' && styles.dateBoxActive,
                    ]}
                    activeOpacity={0.75}
                    onPress={() => openCalendar('plantation')}
                    accessibilityRole="button"
                    accessibilityLabel="Select plantation date"
                  >
                    <Text
                      style={[
                        styles.dateBoxText,
                        activeDateField === 'plantation' && styles.dateBoxTextActive,
                      ]}
                    >
                      {plantationDate}
                    </Text>
                    <CalendarIcon
                      size={18}
                      color={activeDateField === 'plantation' ? P.twGreen700 : P.twGray400}
                    />
                  </TouchableOpacity>
                </View>

                <View style={styles.halfCol}>
                  <Text style={styles.colLabel}>Expected harvest</Text>
                  <TouchableOpacity
                    style={[
                      styles.dateBox,
                      activeDateField === 'harvest' && styles.dateBoxActive,
                    ]}
                    activeOpacity={0.75}
                    onPress={() => openCalendar('harvest')}
                    accessibilityRole="button"
                    accessibilityLabel="Select expected harvest date"
                  >
                    <Text
                      style={[
                        styles.dateBoxText,
                        activeDateField === 'harvest' && styles.dateBoxTextActive,
                      ]}
                    >
                      {expectedHarvestDate}
                    </Text>
                    <CalendarIcon
                      size={18}
                      color={activeDateField === 'harvest' ? P.twGreen700 : P.twGray400}
                    />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Auto-suggested note */}
              <View style={styles.suggestionRow}>
                <SparkleIcon size={14} color={P.twGreen700} />
                <Text style={styles.suggestionText}>
                  Auto-suggested: plantation + {CROP_CATALOG[cropName]?.defaultDays ?? 75} days ({cropName}) · editable.
                </Text>
              </View>
            </View>

            {/* Field: Expected total quantity (kg) */}
            <View style={styles.formGroup}>
              <Text style={styles.colLabel}>Expected total quantity (kg)</Text>
              <TextInput
                style={styles.textInput}
                value={expectedQtyKg}
                onChangeText={setExpectedQtyKg}
                keyboardType="numeric"
                placeholder="1,800"
                placeholderTextColor={P.twGray400}
              />
            </View>

            {/* Field: Expected grade */}
            <View style={styles.formGroup}>
              <Text style={styles.colLabel}>Expected grade</Text>
              <View style={styles.gradeButtonsRow}>
                {(['Grade A', 'Grade B', 'Grade C'] as const).map((grade) => (
                  <TouchableOpacity
                    key={grade}
                    style={[
                      styles.gradeButton,
                      expectedGrade === grade && styles.gradeButtonActive,
                    ]}
                    onPress={() => setExpectedGrade(grade)}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[
                        styles.gradeButtonText,
                        expectedGrade === grade && styles.gradeButtonTextActive,
                      ]}
                    >
                      {grade}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.bottomSpacer} />
          </>
        )}
      </ScrollView>

      {/* ── Fixed Bottom Actions ── */}
      <View style={styles.bottomFooter}>
        {step === 1 ? (
          <TouchableOpacity
            style={styles.primaryActionButton}
            onPress={handleNextStep}
            activeOpacity={0.85}
          >
            <Text style={styles.primaryActionText}>Next · Dates & Grade</Text>
            <ArrowRightIcon size={18} color={P.white} />
          </TouchableOpacity>
        ) : (
          <View style={styles.twoButtonsFooter}>
            <TouchableOpacity
              style={styles.backFooterButton}
              onPress={() => setStep(1)}
              activeOpacity={0.85}
            >
              <Text style={styles.backFooterButtonText}>Back</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.saveCropButton}
              onPress={handleSave}
              activeOpacity={0.85}
            >
              <CheckmarkIcon size={18} color={P.white} />
              <Text style={styles.saveCropButtonText}>Save crop</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* ── Crop Picker Modal ── */}
      <Modal visible={showCropPicker} transparent animationType="fade">
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => setShowCropPicker(false)}
        >
          <View style={styles.pickerModalContent}>
            <Text style={styles.pickerTitle}>Select Crop</Text>
            {Object.keys(CROP_CATALOG).map((crop) => (
              <TouchableOpacity
                key={crop}
                style={[styles.pickerOption, cropName === crop && styles.pickerOptionSelected]}
                onPress={() => handleSelectCrop(crop)}
              >
                <Text
                  style={[
                    styles.pickerOptionText,
                    cropName === crop && styles.pickerOptionTextSelected,
                  ]}
                >
                  {crop}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* ── Sub-Category Picker Modal ── */}
      <Modal visible={showSubCategoryPicker} transparent animationType="fade">
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => setShowSubCategoryPicker(false)}
        >
          <View style={styles.pickerModalContent}>
            <Text style={styles.pickerTitle}>Select Sub-category</Text>
            {(CROP_CATALOG[cropName]?.subcategories ?? ['Standard', 'Hybrid']).map((sub) => (
              <TouchableOpacity
                key={sub}
                style={[styles.pickerOption, subCategory === sub && styles.pickerOptionSelected]}
                onPress={() => {
                  setSubCategory(sub);
                  setShowSubCategoryPicker(false);
                }}
              >
                <Text
                  style={[
                    styles.pickerOptionText,
                    subCategory === sub && styles.pickerOptionTextSelected,
                  ]}
                >
                  {sub}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* ── Unit Picker Modal ── */}
      <Modal visible={showUnitPicker} transparent animationType="fade">
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => setShowUnitPicker(false)}
        >
          <View style={styles.pickerModalContent}>
            <Text style={styles.pickerTitle}>Select Unit</Text>
            {['grams', 'kg', 'packets', 'seeds'].map((u) => (
              <TouchableOpacity
                key={u}
                style={[styles.pickerOption, quantityUnit === u && styles.pickerOptionSelected]}
                onPress={() => {
                  setQuantityUnit(u);
                  setShowUnitPicker(false);
                }}
              >
                <Text
                  style={[
                    styles.pickerOptionText,
                    quantityUnit === u && styles.pickerOptionTextSelected,
                  ]}
                >
                  {u}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* ── Zone Picker Modal ── */}
      <Modal visible={showZonePicker} transparent animationType="fade">
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => setShowZonePicker(false)}
        >
          <View style={styles.pickerModalContent}>
            <Text style={styles.pickerTitle}>Select Zone</Text>
            {ZONES_DATA.map((z) => (
              <TouchableOpacity
                key={z.id}
                style={[
                  styles.pickerOption,
                  selectedZone === z.name && styles.pickerOptionSelected,
                ]}
                onPress={() => handleSelectZone(z.name)}
              >
                <Text
                  style={[
                    styles.pickerOptionText,
                    selectedZone === z.name && styles.pickerOptionTextSelected,
                  ]}
                >
                  {z.name} ({z.sizeHa} ha)
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Dynamic Theme-Driven Calendar Modal for Plantation & Harvest dates */}
      <Modal
        visible={showDatePicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDatePicker(false)}
      >
        <View style={styles.calModalOverlay}>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={() => setShowDatePicker(false)}
          />
          <View style={styles.calModalCard}>
            {/* Header: which date is being selected */}
            <View style={styles.calHeader}>
              <Text style={styles.calFieldBadge}>
                {activeDateField === 'plantation' ? 'Plantation Date' : 'Expected Harvest Date'}
              </Text>
              <Text style={styles.calSelectedDateTitle}>
                {selectedCalendarDate.getDate()} {MONTHS_FULL[selectedCalendarDate.getMonth()]} {selectedCalendarDate.getFullYear()}
              </Text>
            </View>

            {/* Month & Year Navigation Row */}
            <View style={styles.calMonthNav}>
              <TouchableOpacity
                style={styles.calNavBtn}
                onPress={handlePrevMonth}
                accessibilityRole="button"
                accessibilityLabel="Previous month"
              >
                <ChevronLeftIcon size={18} color={P.deepGreen} />
              </TouchableOpacity>

              <Text style={styles.calMonthYearLabel}>
                {MONTHS_FULL[calendarViewMonth]} {calendarViewYear}
              </Text>

              <TouchableOpacity
                style={styles.calNavBtn}
                onPress={handleNextMonth}
                accessibilityRole="button"
                accessibilityLabel="Next month"
              >
                <ChevronRightIcon size={18} color={P.deepGreen} />
              </TouchableOpacity>
            </View>

            {/* Weekdays Row */}
            <View style={styles.calWeekdaysRow}>
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((dayName, idx) => (
                <Text key={`${dayName}-${idx}`} style={styles.calWeekdayText}>
                  {dayName}
                </Text>
              ))}
            </View>

            {/* Days Grid */}
            <View style={styles.calDaysGrid}>
              {Array.from({ length: firstDayWeekday }).map((_, idx) => (
                <View key={`empty-${idx}`} style={styles.calDayCellEmpty} />
              ))}
              {Array.from({ length: daysInMonth }).map((_, idx) => {
                const day = idx + 1;
                const isSelected =
                  selectedCalendarDate.getFullYear() === calendarViewYear &&
                  selectedCalendarDate.getMonth() === calendarViewMonth &&
                  selectedCalendarDate.getDate() === day;
                const isToday =
                  new Date().getFullYear() === calendarViewYear &&
                  new Date().getMonth() === calendarViewMonth &&
                  new Date().getDate() === day;

                return (
                  <TouchableOpacity
                    key={`day-${day}`}
                    style={styles.calDayCell}
                    onPress={() => setSelectedCalendarDate(new Date(calendarViewYear, calendarViewMonth, day))}
                    accessibilityRole="button"
                    accessibilityLabel={`${day} ${MONTHS_FULL[calendarViewMonth]} ${calendarViewYear}`}
                  >
                    <View
                      style={[
                        styles.calDayInner,
                        isSelected && styles.calDayInnerSelected,
                        !isSelected && isToday && styles.calDayInnerToday,
                      ]}
                    >
                      <Text
                        style={[
                          styles.calDayText,
                          isSelected && styles.calDayTextSelected,
                          !isSelected && isToday && styles.calDayTextToday,
                        ]}
                      >
                        {day}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Action Buttons */}
            <View style={styles.calFooterActions}>
              <TouchableOpacity
                style={styles.calCancelBtn}
                onPress={() => setShowDatePicker(false)}
                accessibilityRole="button"
                accessibilityLabel="Cancel date selection"
              >
                <Text style={styles.calCancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.calApplyBtn}
                onPress={handleConfirmDate}
                accessibilityRole="button"
                accessibilityLabel="Apply selected date"
              >
                <Text style={styles.calApplyBtnText}>Apply Date</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// ─────────────────────────────────────────────
// Stylesheet (strictly no raw hex literals)
// ─────────────────────────────────────────────

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: P.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 14,
    backgroundColor: P.white,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: P.twGray200,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: P.white,
  },
  headerTitleGroup: {
    flex: 1,
    marginLeft: 14,
  },
  headerTitle: {
    fontSize: 19,
    fontWeight: '700',
    color: P.ink,
    letterSpacing: -0.2,
  },
  headerSubtitle: {
    fontSize: 13,
    fontWeight: '500',
    color: P.twGray500,
    marginTop: 2,
  },
  cancelBtn: {
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  cancelBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: P.twGray600,
  },
  progressRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 8,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: P.twGray100,
    backgroundColor: P.white,
  },
  progressBarSegment: {
    flex: 1,
    height: 4,
    borderRadius: 2,
  },
  progressBarActive: {
    backgroundColor: P.twGreen700,
  },
  progressBarInactive: {
    backgroundColor: P.twGray200,
  },
  scrollContainer: {
    flex: 1,
    backgroundColor: P.white,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 40,
  },
  hintBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
    marginBottom: 16,
  },
  hintBannerText: {
    fontSize: 13,
    color: P.twGray500,
  },
  formGroup: {
    marginBottom: 20,
  },
  fieldLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: P.ink,
  },
  requiredStar: {
    color: P.twRed600,
  },
  colLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: P.twGray700,
    marginBottom: 6,
  },
  selectorInput: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: P.twGray200,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
    backgroundColor: P.white,
  },
  selectorInputActive: {
    borderColor: P.twGreen600,
    borderWidth: 1.5,
  },
  selectorInputText: {
    fontSize: 15,
    fontWeight: '600',
    color: P.twGray900,
  },
  helpText: {
    fontSize: 12,
    color: P.twGray400,
    marginTop: 6,
    lineHeight: 16,
  },
  twoColRow: {
    flexDirection: 'row',
    gap: 12,
  },
  halfCol: {
    flex: 1,
  },
  textInput: {
    borderWidth: 1,
    borderColor: P.twGray200,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: P.twGray900,
    backgroundColor: P.white,
  },
  currencyInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: P.twGray200,
    borderRadius: 12,
    paddingHorizontal: 14,
    backgroundColor: P.white,
  },
  currencyPrefix: {
    fontSize: 16,
    fontWeight: '600',
    color: P.twGray900,
    marginRight: 6,
  },
  currencyTextInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 15,
    color: P.twGray900,
  },
  areaBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: P.twGray50,
    borderWidth: 1,
    borderColor: P.twGray200,
    borderRadius: 12,
    paddingHorizontal: 14,
  },
  areaTextInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    fontWeight: '700',
    color: P.ink,
  },
  fromZonePill: {
    backgroundColor: P.twGray200,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  fromZonePillText: {
    fontSize: 10,
    fontWeight: '700',
    color: P.twGray700,
    letterSpacing: 0.5,
  },
  dateBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: P.twGray200,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: P.white,
  },
  dateBoxActive: {
    borderColor: P.twGreen600,
    borderWidth: 1.5,
  },
  dateBoxText: {
    fontSize: 14,
    fontWeight: '600',
    color: P.twGray700,
  },
  dateBoxTextActive: {
    fontSize: 14,
    fontWeight: '700',
    color: P.twGray900,
  },
  suggestionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
  },
  suggestionText: {
    fontSize: 12,
    fontWeight: '600',
    color: P.twGreen700,
  },
  gradeButtonsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  gradeButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: P.twGray200,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: P.white,
  },
  gradeButtonActive: {
    borderColor: P.twGreen600,
    borderWidth: 1.5,
    backgroundColor: P.twGreen50,
  },
  gradeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: P.twGray700,
  },
  gradeButtonTextActive: {
    fontWeight: '700',
    color: P.twGreen900,
  },
  bottomSpacer: {
    height: 100,
  },
  bottomFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 24,
    backgroundColor: P.white,
    borderTopWidth: 1,
    borderTopColor: P.twGray100,
    shadowColor: P.black,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 8,
  },
  primaryActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: P.twGreen800,
    borderRadius: 14,
    paddingVertical: 14,
    gap: 8,
  },
  primaryActionText: {
    fontSize: 16,
    fontWeight: '700',
    color: P.white,
  },
  twoButtonsFooter: {
    flexDirection: 'row',
    gap: 12,
  },
  backFooterButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: P.twGray300,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: P.white,
  },
  backFooterButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: P.twGray700,
  },
  saveCropButton: {
    flex: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: P.twGreen800,
    borderRadius: 14,
    paddingVertical: 14,
    gap: 8,
  },
  saveCropButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: P.white,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  pickerModalContent: {
    backgroundColor: P.white,
    borderRadius: 16,
    width: '85%',
    padding: 16,
    shadowColor: P.black,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 8,
  },
  pickerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: P.ink,
    marginBottom: 12,
  },
  pickerOption: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  pickerOptionSelected: {
    backgroundColor: P.twGreen100,
  },
  pickerOptionText: {
    fontSize: 15,
    color: P.twGray800,
  },
  pickerOptionTextSelected: {
    fontWeight: '700',
    color: P.twGreen900,
  },
  // Dynamic Calendar Modal Styles
  calModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  calModalCard: {
    backgroundColor: P.white,
    borderRadius: 20,
    width: '100%',
    maxWidth: 360,
    padding: 20,
    shadowColor: P.black,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  calHeader: {
    marginBottom: 14,
  },
  calFieldBadge: {
    fontSize: 11,
    fontWeight: '700',
    color: P.twGreen700,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  calSelectedDateTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: P.ink,
  },
  calMonthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: P.twGray200,
    marginBottom: 14,
  },
  calNavBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: P.twGray200,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: P.white,
  },
  calMonthYearLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: P.deepGreen,
  },
  calWeekdaysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  calWeekdayText: {
    width: '14.28%',
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '700',
    color: P.twGray400,
  },
  calDaysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  calDayCell: {
    width: '14.28%',
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calDayCellEmpty: {
    width: '14.28%',
    height: 40,
  },
  calDayInner: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calDayInnerSelected: {
    backgroundColor: P.deepGreen,
  },
  calDayInnerToday: {
    borderWidth: 1.5,
    borderColor: P.twGreen700,
  },
  calDayText: {
    fontSize: 14,
    fontWeight: '600',
    color: P.twGray800,
  },
  calDayTextSelected: {
    fontWeight: '700',
    color: P.white,
  },
  calDayTextToday: {
    color: P.twGreen700,
    fontWeight: '700',
  },
  calFooterActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 18,
    paddingTop: 14,
    borderTopWidth: 1,
    borderColor: P.twGray200,
  },
  calCancelBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: P.twGray300,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: P.white,
  },
  calCancelBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: P.twGray700,
  },
  calApplyBtn: {
    flex: 1.4,
    backgroundColor: P.deepGreen,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  calApplyBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: P.white,
  },
});
