import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Modal,
  Platform,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useTheme } from '../../theme';
import { ErrorState } from '@tohfa/mobile-ui';
import { validateStep } from './validation';
import type { Step1PersonalData } from '../../storage/registrationDraft';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const MONTH_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];
const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const YEARS = Array.from({ length: 71 }, (_, i) => 2010 - i); // 2010 down to 1940

function parseInitialDob(str: string): { day: number; month: number; year: number } {
  try {
    const parts = str.split(/[\/\-\s]+/).filter(Boolean);
    const p0 = parts[0];
    const p1 = parts[1];
    const p2 = parts[2];
    if (p0 && p1 && p2) {
      const d = parseInt(p0, 10);
      const m = parseInt(p1, 10) - 1;
      const y = parseInt(p2, 10);
      if (!isNaN(d) && !isNaN(m) && !isNaN(y)) {
        return { day: d, month: Math.max(0, Math.min(11, m)), year: y };
      }
    }
  } catch {}
  return { day: 12, month: 5, year: 1985 };
}

interface Step1Props {
  initialData?: Step1PersonalData | undefined;
  onSave: (data: Step1PersonalData) => void;
  onBack?: (() => void) | undefined;
}

export const Step1Personal: React.FC<Step1Props> = ({ initialData, onSave }) => {
  const theme = useTheme();
  const { colors } = theme;

  // Extract or default values from initial data
  const [fullName, setFullName] = useState(initialData?.fullName ?? 'Kumar');
  const [dob, setDob] = useState(initialData?.dob ?? '12 / 06 / 1985');
  const [gender, setGender] = useState(initialData?.gender ?? 'Male');
  const [showGenderMenu, setShowGenderMenu] = useState(false);

  // Date Picker State
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [pickerDay, setPickerDay] = useState(12);
  const [pickerMonth, setPickerMonth] = useState(5);
  const [pickerYear, setPickerYear] = useState(1985);
  const [pickerView, setPickerView] = useState<'calendar' | 'year' | 'month'>('calendar');

  function openDatePicker() {
    const parsed = parseInitialDob(dob);
    setPickerDay(parsed.day);
    setPickerMonth(parsed.month);
    setPickerYear(parsed.year);
    setPickerView('calendar');
    setShowDatePicker(true);
  }

  function handlePrevMonth() {
    if (pickerMonth === 0) {
      setPickerMonth(11);
      setPickerYear((y) => y - 1);
    } else {
      setPickerMonth((m) => m - 1);
    }
  }

  function handleNextMonth() {
    if (pickerMonth === 11) {
      setPickerMonth(0);
      setPickerYear((y) => y + 1);
    } else {
      setPickerMonth((m) => m + 1);
    }
  }

  const daysInMonth = new Date(pickerYear, pickerMonth + 1, 0).getDate();
  const firstDayIndex = new Date(pickerYear, pickerMonth, 1).getDay();

  // Clean initial mobile number (strip +91 prefix if already saved)
  const rawMobile = initialData?.mobile ?? '98765 43210';
  const cleanMobile = rawMobile.replace(/^\+91\s?/, '');
  const [mobileNumber, setMobileNumber] = useState(cleanMobile);

  const [otp, setOtp] = useState(initialData?.otp ?? '481729');

  const rawAadhaar = initialData?.aadhaarNumber ?? initialData?.aadhaarLast4 ?? '3782 4591 0023';
  const [aadhaarNumber, setAadhaarNumber] = useState(rawAadhaar);

  const fallbackAddress =
    [initialData?.village, initialData?.taluk, initialData?.district]
      .filter(Boolean)
      .join(', ') || 'Kotagiri Village, Kotagiri Taluk, The Nilgiris';
  const initialAddress = initialData?.address ?? fallbackAddress;
  const [address, setAddress] = useState(initialAddress);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const genderOptions = ['Male', 'Female', 'Other'];

  function handleContinue() {
    const formattedMobile = mobileNumber.startsWith('+')
      ? mobileNumber.trim()
      : `+91${mobileNumber.replace(/\s+/g, '').trim()}`;

    const cleanAadhaar = aadhaarNumber.replace(/\s+/g, '').trim();

    const payload: Step1PersonalData = {
      fullName: fullName.trim(),
      mobile: formattedMobile,
      otp: otp.trim(),
      dob: dob.trim(),
      gender,
      aadhaarNumber: aadhaarNumber.trim(),
      aadhaarLast4: cleanAadhaar.slice(-4),
      address: address.trim(),
    };

    const validation = validateStep(1, payload);
    if (!validation.valid) {
      const firstError = Object.values(validation.errors)[0] ?? 'Validation failed';
      setErrorMsg(firstError);
      return;
    }

    setErrorMsg(null);
    onSave(payload);
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.bgLight }]}>
      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {errorMsg ? (
          <View style={styles.errorContainer}>
            <ErrorState message={errorMsg} onRetry={() => setErrorMsg(null)} />
          </View>
        ) : null}

        {/* Full Name */}
        <View style={styles.fieldGroup}>
          <Text style={[styles.label, { color: colors.textBody }]}>
            Full Name <Text style={{ color: colors.requiredRed }}>*</Text>
          </Text>
          <TextInput
            style={[
              styles.input,
              {
                borderColor: colors.borderLight,
                color: colors.textDark,
                backgroundColor: colors.white,
              },
            ]}
            value={fullName}
            onChangeText={setFullName}
            placeholder="e.g. Kumar"
            placeholderTextColor={colors.textPlaceholder}
          />
        </View>

        {/* DOB & Gender Side-by-Side */}
        <View style={styles.rowGrid}>
          <View style={styles.gridCol}>
            <Text style={[styles.label, { color: colors.textBody }]}>
              Date of Birth <Text style={{ color: colors.requiredRed }}>*</Text>
            </Text>
            <TouchableOpacity
              activeOpacity={0.7}
              style={[
                styles.dropdownSelect,
                {
                  borderColor: colors.borderLight,
                  backgroundColor: colors.white,
                },
              ]}
              onPress={openDatePicker}
            >
              <Text style={[styles.dropdownText, { color: colors.textDark }]}>
                {dob}
              </Text>
              <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
                <Path
                  d="M19 4H5C3.89543 4 3 4.89543 3 6V20C3 21.1046 3.89543 22 5 22H19C20.1046 22 21 21.1046 21 20V6C21 4.89543 20.1046 4 19 4Z"
                  stroke={colors.brandGreen}
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <Path
                  d="M16 2V6M8 2V6M3 10H21"
                  stroke={colors.brandGreen}
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
            </TouchableOpacity>
          </View>

          <View style={styles.gridCol}>
            <Text style={[styles.label, { color: colors.textBody }]}>
              Gender <Text style={{ color: colors.requiredRed }}>*</Text>
            </Text>
            <TouchableOpacity
              activeOpacity={0.7}
              style={[
                styles.dropdownSelect,
                {
                  borderColor: colors.borderLight,
                  backgroundColor: colors.white,
                },
              ]}
              onPress={() => setShowGenderMenu(true)}
            >
              <Text style={[styles.dropdownText, { color: colors.onSurface }]}>
                {gender}
              </Text>
              <Text style={[styles.dropdownArrow, { color: colors.textSubtle }]}>▾</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Mobile Number */}
        <View style={styles.fieldGroup}>
          <Text style={[styles.label, { color: colors.textBody }]}>
            Mobile Number <Text style={{ color: colors.requiredRed }}>*</Text>
          </Text>
          <View style={styles.mobileRow}>
            <View
              style={[
                styles.countryCodeBox,
                {
                  borderColor: colors.borderLight,
                  backgroundColor: colors.prefixBg,
                },
              ]}
            >
              <Text style={[styles.countryCodeText, { color: colors.textSubtle }]}>+91</Text>
            </View>
            <TextInput
              style={[
                styles.input,
                styles.mobileInput,
                {
                  borderColor: colors.borderLight,
                  color: colors.textDark,
                  backgroundColor: colors.white,
                },
              ]}
              value={mobileNumber}
              onChangeText={setMobileNumber}
              keyboardType="phone-pad"
              placeholder="98765 43210"
              placeholderTextColor={colors.textPlaceholder}
            />
          </View>
          <Text style={[styles.helperText, { color: colors.textSubtle }]}>
            We'll send an OTP to verify
          </Text>
        </View>

        {/* OTP */}
        <View style={styles.fieldGroup}>
          <Text style={[styles.label, { color: colors.textBody }]}>
            OTP <Text style={{ color: colors.requiredRed }}>*</Text>
          </Text>
          <TextInput
            style={[
              styles.input,
              {
                borderColor: colors.borderLight,
                color: colors.textDark,
                backgroundColor: colors.white,
              },
            ]}
            value={otp}
            onChangeText={setOtp}
            keyboardType="number-pad"
            maxLength={6}
            placeholder="Enter 6-digit OTP"
            placeholderTextColor={colors.textPlaceholder}
          />
          <Text style={[styles.helperText, { color: colors.textSubtle }]}>
            Enter the OTP sent to verify your mobile number
          </Text>
        </View>

        {/* Aadhaar / ID Number */}
        <View style={styles.fieldGroup}>
          <Text style={[styles.label, { color: colors.textBody }]}>
            Aadhaar / ID Number <Text style={{ color: colors.requiredRed }}>*</Text>
          </Text>
          <TextInput
            style={[
              styles.input,
              styles.aadhaarInput,
              {
                borderColor: colors.borderLight,
                color: colors.textDark,
                backgroundColor: colors.white,
              },
            ]}
            value={aadhaarNumber}
            onChangeText={setAadhaarNumber}
            keyboardType="number-pad"
            placeholder="3782 4591 0023"
            placeholderTextColor={colors.textPlaceholder}
          />
          <Text style={[styles.helperText, { color: colors.textSubtle }]}>
            Used to verify your identity with TOFHA
          </Text>
        </View>

        {/* Address */}
        <View style={styles.fieldGroup}>
          <Text style={[styles.label, { color: colors.textBody }]}>
            Address <Text style={{ color: colors.requiredRed }}>*</Text>
          </Text>
          <TextInput
            style={[
              styles.input,
              styles.textareaInput,
              {
                borderColor: colors.borderLight,
                color: colors.textDark,
                backgroundColor: colors.white,
              },
            ]}
            value={address}
            onChangeText={setAddress}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
            placeholder="Kotagiri Village, Kotagiri Taluk, The Nilgiris"
            placeholderTextColor={colors.textPlaceholder}
          />
        </View>
      </ScrollView>

      {/* Sticky Bottom Footer */}
      <View
        style={[
          styles.footer,
          {
            borderTopColor: colors.borderDivider,
            backgroundColor: colors.white,
          },
        ]}
      >
        <TouchableOpacity
          activeOpacity={0.85}
          style={[styles.continueButton, { backgroundColor: colors.brandGreen }]}
          onPress={handleContinue}
        >
          <Text style={[styles.continueButtonText, { color: colors.white }]}>
            Continue to Farm Details →
          </Text>
        </TouchableOpacity>
      </View>

      {/* Date Picker Modal */}
      <Modal
        visible={showDatePicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDatePicker(false)}
      >
        <TouchableOpacity
          activeOpacity={1}
          style={styles.modalOverlay}
          onPress={() => setShowDatePicker(false)}
        >
          <TouchableOpacity
            activeOpacity={1}
            style={styles.datePickerContainer}
            onPress={(e) => e.stopPropagation?.()}
          >
            {/* Header */}
            <View style={styles.datePickerHeader}>
              <Text style={styles.datePickerTitle}>Select Date of Birth</Text>
              <TouchableOpacity
                onPress={() => setShowDatePicker(false)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Text style={styles.datePickerCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Selected Date Summary */}
            <Text style={styles.datePickerSelectedDate}>
              {Math.min(pickerDay, daysInMonth)} {MONTH_NAMES[pickerMonth]} {pickerYear}
            </Text>

            {/* Navigation / Switcher Bar */}
            <View style={styles.datePickerNavBar}>
              <TouchableOpacity
                style={styles.navArrowBtn}
                onPress={handlePrevMonth}
              >
                <Text style={styles.navArrowText}>‹</Text>
              </TouchableOpacity>

              <View style={styles.navSelectors}>
                <TouchableOpacity
                  style={[
                    styles.selectorPill,
                    pickerView === 'month' && styles.selectorPillActive,
                  ]}
                  onPress={() =>
                    setPickerView((v) => (v === 'month' ? 'calendar' : 'month'))
                  }
                >
                  <Text
                    style={[
                      styles.selectorPillText,
                      pickerView === 'month' && styles.selectorPillTextActive,
                    ]}
                  >
                    {MONTH_SHORT[pickerMonth]} ▾
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.selectorPill,
                    pickerView === 'year' && styles.selectorPillActive,
                  ]}
                  onPress={() =>
                    setPickerView((v) => (v === 'year' ? 'calendar' : 'year'))
                  }
                >
                  <Text
                    style={[
                      styles.selectorPillText,
                      pickerView === 'year' && styles.selectorPillTextActive,
                    ]}
                  >
                    {pickerYear} ▾
                  </Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={styles.navArrowBtn}
                onPress={handleNextMonth}
              >
                <Text style={styles.navArrowText}>›</Text>
              </TouchableOpacity>
            </View>

            {/* Content based on pickerView */}
            {pickerView === 'year' ? (
              <ScrollView
                style={styles.yearGrid}
                contentContainerStyle={styles.yearGridContent}
                showsVerticalScrollIndicator={false}
              >
                {YEARS.map((y) => (
                  <TouchableOpacity
                    key={y}
                    style={[
                      styles.yearPill,
                      y === pickerYear && styles.yearPillSelected,
                    ]}
                    onPress={() => {
                      setPickerYear(y);
                      setPickerView('calendar');
                    }}
                  >
                    <Text
                      style={[
                        styles.yearPillText,
                        y === pickerYear && styles.yearPillTextSelected,
                      ]}
                    >
                      {y}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            ) : pickerView === 'month' ? (
              <View style={styles.monthGrid}>
                {MONTH_SHORT.map((mName, mIdx) => (
                  <TouchableOpacity
                    key={mName}
                    style={[
                      styles.monthPill,
                      mIdx === pickerMonth && styles.monthPillSelected,
                    ]}
                    onPress={() => {
                      setPickerMonth(mIdx);
                      setPickerView('calendar');
                    }}
                  >
                    <Text
                      style={[
                        styles.monthPillText,
                        mIdx === pickerMonth && styles.monthPillTextSelected,
                      ]}
                    >
                      {mName}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              <View>
                {/* Weekday headers */}
                <View style={styles.weekdayRow}>
                  {WEEKDAYS.map((w) => (
                    <View key={w} style={styles.weekdayCell}>
                      <Text style={styles.weekdayText}>{w}</Text>
                    </View>
                  ))}
                </View>

                {/* Calendar Days */}
                <View style={styles.calendarGrid}>
                  {Array.from({ length: firstDayIndex }).map((_, i) => (
                    <View key={`empty-${i}`} style={styles.dayCell} />
                  ))}
                  {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((d) => {
                    const isSelected = d === Math.min(pickerDay, daysInMonth);
                    return (
                      <TouchableOpacity
                        key={`day-${d}`}
                        style={styles.dayCell}
                        onPress={() => setPickerDay(d)}
                      >
                        <View
                          style={[
                            styles.dayCircle,
                            isSelected && styles.dayCircleSelected,
                          ]}
                        >
                          <Text
                            style={[
                              styles.dayText,
                              isSelected && styles.dayTextSelected,
                            ]}
                          >
                            {d}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}

            {/* Footer Buttons */}
            <View style={styles.datePickerFooter}>
              <TouchableOpacity
                style={styles.datePickerCancelBtn}
                onPress={() => setShowDatePicker(false)}
              >
                <Text style={styles.datePickerCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.datePickerConfirmBtn}
                onPress={() => {
                  const actualDay = Math.min(pickerDay, daysInMonth);
                  const formatted = `${String(actualDay).padStart(2, '0')} / ${String(pickerMonth + 1).padStart(2, '0')} / ${pickerYear}`;
                  setDob(formatted);
                  setShowDatePicker(false);
                }}
              >
                <Text style={styles.datePickerConfirmText}>Confirm Date</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Gender Picker Modal */}
      <Modal
        visible={showGenderMenu}
        transparent
        animationType="fade"
        onRequestClose={() => setShowGenderMenu(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowGenderMenu(false)}
        >
          <View style={styles.modalSheet} onStartShouldSetResponder={() => true}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Gender</Text>
              <TouchableOpacity
                onPress={() => setShowGenderMenu(false)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.modalList}>
              {genderOptions.map((opt) => {
                const isSelected = opt === gender;
                return (
                  <TouchableOpacity
                    key={opt}
                    style={[
                      styles.modalOptionRow,
                      isSelected && styles.modalOptionSelected,
                    ]}
                    activeOpacity={0.7}
                    onPress={() => {
                      setGender(opt);
                      setShowGenderMenu(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.modalOptionText,
                        isSelected && styles.modalOptionTextSelected,
                      ]}
                    >
                      {opt}
                    </Text>
                    {isSelected && (
                      <View style={styles.checkmarkWrap}>
                        <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
                          <Path
                            d="M5 13l4 4L19 7"
                            stroke="#FFFFFF"
                            strokeWidth={3}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </Svg>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 24,
  },
  errorContainer: {
    marginBottom: 14,
  },
  fieldGroup: {
    marginBottom: 14,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
  },
  input: {
    width: '100%',
    height: 46,
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 14,
    fontSize: 15,
  },
  rowGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 14,
  },
  gridCol: {
    flex: 1,
    position: 'relative',
  },
  dropdownSelect: {
    height: 46,
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dropdownText: {
    fontSize: 15,
  },
  dropdownArrow: {
    fontSize: 14,
  },
  dropdownMenu: {
    position: 'absolute',
    top: 72,
    left: 0,
    right: 0,
    borderWidth: 1.5,
    borderRadius: 12,
    elevation: 4,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    zIndex: 100,
  },
  dropdownOption: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
  },
  dropdownOptionText: {
    fontSize: 14,
  },
  mobileRow: {
    flexDirection: 'row',
    gap: 8,
  },
  countryCodeBox: {
    width: 65,
    height: 46,
    borderWidth: 1.5,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countryCodeText: {
    fontSize: 15,
    fontWeight: '600',
  },
  mobileInput: {
    flex: 1,
  },
  aadhaarInput: {
    letterSpacing: 1,
  },
  helperText: {
    fontSize: 11,
    marginTop: 5,
  },
  textareaInput: {
    minHeight: 64,
    paddingTop: 12,
    paddingBottom: 12,
    lineHeight: 20,
  },
  footer: {
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 24,
    borderTopWidth: 1,
  },
  continueButton: {
    width: '100%',
    height: 52,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  datePickerContainer: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  datePickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  datePickerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  datePickerCloseText: {
    fontSize: 18,
    color: '#6B7280',
    padding: 4,
  },
  datePickerSelectedDate: {
    fontSize: 18,
    fontWeight: '800',
    color: '#266E2B',
    marginBottom: 16,
  },
  datePickerNavBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  navArrowBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  navArrowText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  navSelectors: {
    flexDirection: 'row',
    gap: 8,
  },
  selectorPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    gap: 4,
  },
  selectorPillActive: {
    backgroundColor: '#E5F3E7',
  },
  selectorPillText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  selectorPillTextActive: {
    color: '#266E2B',
  },
  weekdayRow: {
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
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: `${100 / 7}%`,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 2,
  },
  dayCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCircleSelected: {
    backgroundColor: '#266E2B',
  },
  dayText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
  },
  dayTextSelected: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  yearGrid: {
    maxHeight: 220,
  },
  yearGridContent: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
    paddingVertical: 8,
  },
  yearPill: {
    width: 68,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
  },
  yearPillSelected: {
    backgroundColor: '#266E2B',
  },
  yearPillText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1F2937',
  },
  yearPillTextSelected: {
    color: '#FFFFFF',
  },
  monthGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
    paddingVertical: 12,
  },
  monthPill: {
    width: 80,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
  },
  monthPillSelected: {
    backgroundColor: '#266E2B',
  },
  monthPillText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1F2937',
  },
  monthPillTextSelected: {
    color: '#FFFFFF',
  },
  datePickerFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 18,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  datePickerCancelBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  datePickerCancelText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4B5563',
  },
  datePickerConfirmBtn: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    backgroundColor: '#266E2B',
  },
  datePickerConfirmText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  modalSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 36,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  modalCloseText: {
    fontSize: 18,
    color: '#6B7280',
    padding: 4,
  },
  modalList: {
    gap: 8,
  },
  modalOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  modalOptionSelected: {
    backgroundColor: '#F0FDF4',
    borderColor: '#266E2B',
  },
  modalOptionText: {
    fontSize: 15,
    color: '#374151',
    fontWeight: '500',
  },
  modalOptionTextSelected: {
    color: '#266E2B',
    fontWeight: '700',
  },
  checkmarkWrap: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#266E2B',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
