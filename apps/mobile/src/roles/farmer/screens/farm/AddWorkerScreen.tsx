import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
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

function CameraIcon({ size = 14, color = P.white }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle cx="12" cy="13" r="4" stroke={color} strokeWidth="2" />
    </Svg>
  );
}

function CalendarIcon({ size = 18, color = P.twGray400 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="4" width="18" height="18" rx="2" stroke={color} strokeWidth="2" />
      <Line x1="16" y1="2" x2="16" y2="6" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="8" y1="2" x2="8" y2="6" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="3" y1="10" x2="21" y2="10" stroke={color} strokeWidth="2" strokeLinecap="round" />
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

function PdfDocIcon({ size = 20, color = colors.brandGreen }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M14 2v6h6" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M10 13h4M10 17h4" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

// ── Types ────────────────────────────────────────────────────────────────────

export interface WorkerFormData {
  id?: string;
  name: string;
  dob: string;
  gender: 'Male' | 'Female' | 'Other';
  idProofName: string;
  accountNo: string;
  ifsc: string;
  upiId: string;
  salaryType: 'daily' | 'monthly';
  wageAmount: string;
}

export interface AddWorkerScreenProps {
  initialWorker?: Partial<WorkerFormData>;
  onBack?: () => void;
  onCancel?: () => void;
  onSave?: (data: WorkerFormData) => void;
}

export function AddWorkerScreen({
  initialWorker,
  onBack,
  onCancel,
  onSave,
}: AddWorkerScreenProps): React.JSX.Element {
  const isEditing = Boolean(initialWorker?.id || initialWorker?.name);

  const [name, setName] = useState(initialWorker?.name || (isEditing ? 'Murugan R.' : ''));
  const [dob, setDob] = useState(initialWorker?.dob || '14 Mar 1988');
  const [gender, setGender] = useState<'Male' | 'Female' | 'Other'>(initialWorker?.gender || 'Male');
  const [isGenderPickerOpen, setIsGenderPickerOpen] = useState(false);

  const [idProofName, setIdProofName] = useState(initialWorker?.idProofName || 'aadhaar_murugan.pdf');
  const [accountNo, setAccountNo] = useState(initialWorker?.accountNo || '•••• 4821');
  const [ifsc, setIfsc] = useState(initialWorker?.ifsc || 'CNRB0002841');
  const [upiId, setUpiId] = useState(initialWorker?.upiId || 'murugan@okhdfcbank');
  const [salaryType, setSalaryType] = useState<'daily' | 'monthly'>(initialWorker?.salaryType || 'daily');
  const [wageAmount, setWageAmount] = useState(initialWorker?.wageAmount || '450');

  // Compute avatar initials
  const initials = name
    .trim()
    .split(/\s+/)
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase() || 'MR';

  const handleSave = () => {
    if (!name.trim()) {
      Alert.alert('Required Field', 'Please enter the worker name.');
      return;
    }

    const payload: WorkerFormData = {
      id: initialWorker?.id || `w-${Date.now()}`,
      name: name.trim(),
      dob,
      gender,
      idProofName,
      accountNo,
      ifsc,
      upiId,
      salaryType,
      wageAmount,
    };

    if (onSave) {
      onSave(payload);
    } else {
      Alert.alert(
        isEditing ? 'Worker Updated' : 'Worker Added',
        `${name.trim()} has been successfully saved to your workforce.`,
        [{ text: 'OK', onPress: onBack || onCancel }],
      );
    }
  };

  const handleUploadDoc = () => {
    Alert.alert('Upload Document', 'Select a file or take a photo of Aadhaar / ID proof.', [
      { text: 'Aadhaar Card (PDF)', onPress: () => setIdProofName('aadhaar_card.pdf') },
      { text: 'Voter ID (JPG)', onPress: () => setIdProofName('voter_id.jpg') },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const handlePickPhoto = () => {
    Alert.alert('Worker Photo', 'Choose an option to set profile photo:', [
      { text: 'Take Photo', onPress: () => {} },
      { text: 'Choose from Gallery', onPress: () => {} },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={P.white} />
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* ── Top Header ── */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={onBack || onCancel}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Back"
            >
              <ArrowBackIcon size={20} color={P.deepGreen} />
            </TouchableOpacity>

            <View style={styles.headerTitleCol}>
              <Text style={styles.headerTitle}>{isEditing ? 'Edit Worker' : 'Add Worker'}</Text>
              <Text style={styles.headerSubtitle} numberOfLines={1}>
                {name.trim() || 'New profile'}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            onPress={onCancel || onBack}
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            accessibilityRole="button"
            accessibilityLabel="Cancel"
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* ── Avatar Photo Section ── */}
          <View style={styles.avatarSection}>
            <TouchableOpacity
              style={styles.avatarContainer}
              onPress={handlePickPhoto}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel="Change worker photo"
            >
              <View style={styles.avatarCircle}>
                <Text style={styles.avatarInitials}>{initials}</Text>
              </View>

              <View style={styles.cameraBadge}>
                <CameraIcon size={13} color={P.white} />
              </View>
            </TouchableOpacity>

            <Text style={styles.avatarHint}>Add photo (optional)</Text>
          </View>

          {/* ── Form Fields ── */}
          <View style={styles.formContainer}>
            {/* Name */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>
                Name <Text style={styles.requiredAsterisk}>*</Text>
              </Text>
              <TextInput
                style={styles.textInput}
                value={name}
                onChangeText={setName}
                placeholder="Enter worker full name"
                placeholderTextColor={P.twGray400}
                autoCapitalize="words"
              />
            </View>

            {/* Date of Birth & Gender */}
            <View style={styles.twoColumnRow}>
              {/* Date of Birth */}
              <View style={styles.columnField}>
                <Text style={styles.fieldLabel}>Date of birth</Text>
                <TouchableOpacity
                  style={styles.pickerInputBox}
                  activeOpacity={0.8}
                  onPress={() => {
                    Alert.prompt
                      ? Alert.prompt('Date of Birth', 'Enter date of birth (DD Mon YYYY):', (val) => {
                          if (val) setDob(val);
                        })
                      : null;
                  }}
                >
                  <Text style={styles.pickerValueText}>{dob}</Text>
                  <CalendarIcon size={18} color={P.twGray400} />
                </TouchableOpacity>
              </View>

              {/* Gender */}
              <View style={styles.columnField}>
                <Text style={styles.fieldLabel}>Gender</Text>
                <TouchableOpacity
                  style={styles.pickerInputBox}
                  activeOpacity={0.8}
                  onPress={() => setIsGenderPickerOpen(true)}
                >
                  <Text style={styles.pickerValueText}>{gender}</Text>
                  <ChevronDownIcon size={16} color={P.twGray500} />
                </TouchableOpacity>
              </View>
            </View>

            {/* ID Proof (Aadhaar) */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>ID proof (Aadhaar)</Text>
              <TouchableOpacity
                style={styles.dashedFileContainer}
                onPress={handleUploadDoc}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityLabel="Upload Aadhaar ID proof"
              >
                <PdfDocIcon size={20} color={colors.brandGreen} />
                <Text style={styles.fileNameText} numberOfLines={1}>
                  {idProofName}
                </Text>
              </TouchableOpacity>
            </View>

            {/* ── Payment Details ── */}
            <Text style={styles.sectionHeaderTitle}>PAYMENT DETAILS</Text>

            <View style={styles.twoColumnRow}>
              {/* Account No */}
              <View style={styles.columnField}>
                <Text style={styles.fieldLabel}>Account no.</Text>
                <TextInput
                  style={styles.textInput}
                  value={accountNo}
                  onChangeText={setAccountNo}
                  placeholder="Enter account no."
                  placeholderTextColor={P.twGray400}
                />
              </View>

              {/* IFSC */}
              <View style={styles.columnField}>
                <Text style={styles.fieldLabel}>IFSC</Text>
                <TextInput
                  style={styles.textInput}
                  value={ifsc}
                  onChangeText={setIfsc}
                  placeholder="IFSC Code"
                  placeholderTextColor={P.twGray400}
                  autoCapitalize="characters"
                />
              </View>
            </View>

            {/* UPI ID */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>UPI ID</Text>
              <TextInput
                style={styles.textInput}
                value={upiId}
                onChangeText={setUpiId}
                placeholder="e.g. name@okhdfcbank"
                placeholderTextColor={P.twGray400}
                autoCapitalize="none"
                keyboardType="email-address"
              />
            </View>

            {/* ── Salary Details ── */}
            <Text style={styles.sectionHeaderTitle}>SALARY</Text>

            {/* Daily / Monthly Segmented Toggle */}
            <View style={styles.salarySegmentContainer}>
              <TouchableOpacity
                style={[
                  styles.salarySegmentBtn,
                  salaryType === 'daily' && styles.salarySegmentBtnActive,
                ]}
                onPress={() => setSalaryType('daily')}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.salarySegmentText,
                    salaryType === 'daily' && styles.salarySegmentTextActive,
                  ]}
                >
                  Daily wage
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.salarySegmentBtn,
                  salaryType === 'monthly' && styles.salarySegmentBtnActive,
                ]}
                onPress={() => setSalaryType('monthly')}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.salarySegmentText,
                    salaryType === 'monthly' && styles.salarySegmentTextActive,
                  ]}
                >
                  Monthly salary
                </Text>
              </TouchableOpacity>
            </View>

            {/* Wage Amount Input */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>
                {salaryType === 'daily' ? 'Daily Wage Rate (₹)' : 'Monthly Salary Amount (₹)'}
              </Text>
              <TextInput
                style={styles.textInput}
                value={wageAmount}
                onChangeText={setWageAmount}
                placeholder={salaryType === 'daily' ? '450' : '12000'}
                placeholderTextColor={P.twGray400}
                keyboardType="numeric"
              />
            </View>
          </View>
        </ScrollView>

        {/* ── Bottom Floating Save Button ── */}
        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={styles.saveButton}
            onPress={handleSave}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel={isEditing ? 'Save changes' : 'Add Worker'}
          >
            <Text style={styles.saveButtonText}>{isEditing ? 'Save changes' : 'Add Worker'}</Text>
          </TouchableOpacity>
        </View>

        {/* Gender Picker Modal */}
        <Modal
          visible={isGenderPickerOpen}
          transparent
          animationType="fade"
          onRequestClose={() => setIsGenderPickerOpen(false)}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setIsGenderPickerOpen(false)}
          >
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>Select Gender</Text>
              {(['Male', 'Female', 'Other'] as const).map((opt) => (
                <TouchableOpacity
                  key={opt}
                  style={[
                    styles.modalOption,
                    gender === opt && styles.modalOptionSelected,
                  ]}
                  onPress={() => {
                    setGender(opt);
                    setIsGenderPickerOpen(false);
                  }}
                >
                  <Text
                    style={[
                      styles.modalOptionText,
                      gender === opt && styles.modalOptionTextSelected,
                    ]}
                  >
                    {opt}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </TouchableOpacity>
        </Modal>
      </KeyboardAvoidingView>
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
    marginRight: 14,
    shadowColor: P.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  headerTitleCol: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: P.nearBlack,
    letterSpacing: -0.2,
  },
  headerSubtitle: {
    fontSize: 12.5,
    color: P.twGray400,
    marginTop: 1,
  },
  cancelButtonText: {
    fontSize: 14.5,
    fontWeight: '500',
    color: P.twGray500,
    paddingHorizontal: 4,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 100,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatarCircle: {
    width: 78,
    height: 78,
    borderRadius: 39,
    backgroundColor: P.twGreen100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    fontSize: 24,
    fontWeight: '700',
    color: P.twGreen800,
    letterSpacing: 0.5,
  },
  cameraBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.brandGreen,
    borderWidth: 2,
    borderColor: P.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarHint: {
    fontSize: 13,
    color: P.twGray500,
    marginTop: 8,
  },
  formContainer: {
    gap: 16,
  },
  fieldGroup: {
    gap: 6,
  },
  fieldLabel: {
    fontSize: 13.5,
    fontWeight: '600',
    color: P.twGray700,
    marginBottom: 2,
  },
  requiredAsterisk: {
    color: P.twRed500,
  },
  textInput: {
    height: 48,
    backgroundColor: P.white,
    borderWidth: 1,
    borderColor: P.twGray200,
    borderRadius: 12,
    paddingHorizontal: 14,
    fontSize: 14.5,
    color: P.nearBlack,
  },
  twoColumnRow: {
    flexDirection: 'row',
    gap: 12,
  },
  columnField: {
    flex: 1,
    gap: 6,
  },
  pickerInputBox: {
    height: 48,
    backgroundColor: P.white,
    borderWidth: 1,
    borderColor: P.twGray200,
    borderRadius: 12,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pickerValueText: {
    fontSize: 14.5,
    color: P.nearBlack,
    fontWeight: '500',
  },
  dashedFileContainer: {
    height: 50,
    backgroundColor: P.white,
    borderWidth: 1.5,
    borderColor: P.twGray300,
    borderStyle: 'dashed',
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    gap: 10,
  },
  fileNameText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.brandGreen,
    flex: 1,
  },
  sectionHeaderTitle: {
    fontSize: 11.5,
    fontWeight: '700',
    color: P.slate400,
    letterSpacing: 0.8,
    marginTop: 10,
    marginBottom: 2,
  },
  salarySegmentContainer: {
    flexDirection: 'row',
    backgroundColor: P.twGray100,
    borderRadius: 12,
    padding: 4,
    gap: 4,
  },
  salarySegmentBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 9,
  },
  salarySegmentBtnActive: {
    backgroundColor: colors.brandGreen,
    shadowColor: P.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  salarySegmentText: {
    fontSize: 13.5,
    fontWeight: '600',
    color: P.twGray500,
  },
  salarySegmentTextActive: {
    color: P.white,
    fontWeight: '700',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: P.white,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 28 : 16,
    borderTopWidth: 1,
    borderTopColor: P.twGray100,
  },
  saveButton: {
    height: 50,
    backgroundColor: colors.brandGreen,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.brandGreen,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: P.white,
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
