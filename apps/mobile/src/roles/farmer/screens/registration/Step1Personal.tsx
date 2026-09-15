import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useTheme } from '../../theme';
import { ErrorState } from '@tohfa/mobile-ui';
import { validateStep } from './validation';
import type { Step1PersonalData } from '../../storage/registrationDraft';

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

  // Clean initial mobile number (strip +91 prefix if already saved)
  const rawMobile = initialData?.mobile ?? '98765 43210';
  const cleanMobile = rawMobile.replace(/^\+91\s?/, '');
  const [mobileNumber, setMobileNumber] = useState(cleanMobile);

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
            <TextInput
              style={[
                styles.input,
                {
                  borderColor: colors.borderLight,
                  color: colors.textDark,
                  backgroundColor: colors.white,
                },
              ]}
              value={dob}
              onChangeText={setDob}
              placeholder="DD / MM / YYYY"
              placeholderTextColor={colors.textPlaceholder}
            />
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
              onPress={() => setShowGenderMenu(!showGenderMenu)}
            >
              <Text style={[styles.dropdownText, { color: colors.onSurface }]}>
                {gender}
              </Text>
              <Text style={[styles.dropdownArrow, { color: colors.textSubtle }]}>▾</Text>
            </TouchableOpacity>

            {showGenderMenu ? (
              <View
                style={[
                  styles.dropdownMenu,
                  {
                    backgroundColor: colors.white,
                    borderColor: colors.borderLight,
                  },
                ]}
              >
                {genderOptions.map((opt) => (
                  <TouchableOpacity
                    key={opt}
                    style={[styles.dropdownOption, { borderBottomColor: colors.borderSoft }]}
                    onPress={() => {
                      setGender(opt);
                      setShowGenderMenu(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.dropdownOptionText,
                        { color: colors.onSurface },
                        opt === gender && { fontWeight: '700', color: colors.brandGreen },
                      ]}
                    >
                      {opt}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            ) : null}
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
});
