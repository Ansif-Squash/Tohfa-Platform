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

function PawPrintIcon({ size = 28, color = P.twAmber800 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="14.5" r="4.5" fill={color} />
      <Circle cx="6.5" cy="10" r="2.2" fill={color} />
      <Circle cx="17.5" cy="10" r="2.2" fill={color} />
      <Circle cx="9.5" cy="6" r="2" fill={color} />
      <Circle cx="14.5" cy="6" r="2" fill={color} />
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

// ── Types ────────────────────────────────────────────────────────────────────

export interface AnimalFormData {
  id?: string | undefined;
  tag: string;
  name?: string | undefined;
  species: string;
  gender: 'Female' | 'Male';
  breed: string;
  dob: string;
  source: 'born_on_farm' | 'purchased';
  purchaseDate?: string | undefined;
  sourceFarm?: string | undefined;
  organicStatus: 'Organic' | 'Transitioning' | 'Conventional';
}

export interface RegisterAnimalScreenProps {
  initialAnimal?: Partial<AnimalFormData>;
  onBack?: () => void;
  onCancel?: () => void;
  onSave?: (data: AnimalFormData) => void;
}

export function RegisterAnimalScreen({
  initialAnimal,
  onBack,
  onCancel,
  onSave,
}: RegisterAnimalScreenProps): React.JSX.Element {
  const isEditing = Boolean(initialAnimal?.id || initialAnimal?.tag);

  const [tag, setTag] = useState(initialAnimal?.tag || (isEditing ? 'C-015' : 'C-015'));
  const [species, setSpecies] = useState(initialAnimal?.species || 'Cattle');
  const [gender, setGender] = useState<'Female' | 'Male'>(initialAnimal?.gender || 'Female');
  const [breed, setBreed] = useState(initialAnimal?.breed || 'Jersey cross');
  const [dob, setDob] = useState(initialAnimal?.dob || '02 Mar 2026');
  const [source, setSource] = useState<'born_on_farm' | 'purchased'>(initialAnimal?.source || 'purchased');
  const [purchaseDate, setPurchaseDate] = useState(initialAnimal?.purchaseDate || '10 Jul 2026');
  const [sourceFarm, setSourceFarm] = useState(initialAnimal?.sourceFarm || 'Coonoor Dairy');
  const [organicStatus, setOrganicStatus] = useState<'Organic' | 'Transitioning' | 'Conventional'>(
    initialAnimal?.organicStatus || 'Transitioning',
  );

  // Modals
  const [isSpeciesPickerOpen, setIsSpeciesPickerOpen] = useState(false);
  const [isGenderPickerOpen, setIsGenderPickerOpen] = useState(false);
  const [isStatusPickerOpen, setIsStatusPickerOpen] = useState(false);

  const speciesOptions = ['Cattle', 'Buffalo', 'Goat', 'Poultry', 'Sheep'];
  const genderOptions: ('Female' | 'Male')[] = ['Female', 'Male'];
  const statusOptions: ('Organic' | 'Transitioning' | 'Conventional')[] = [
    'Organic',
    'Transitioning',
    'Conventional',
  ];

  const handleSave = () => {
    if (!tag.trim()) {
      Alert.alert('Required Field', 'Please enter Animal ID / Tag.');
      return;
    }

    const payload: AnimalFormData = {
      id: initialAnimal?.id || `a-${Date.now()}`,
      tag: tag.trim(),
      species,
      gender,
      breed: breed.trim(),
      dob,
      source,
      purchaseDate: source === 'purchased' ? purchaseDate : undefined,
      sourceFarm: source === 'purchased' ? sourceFarm.trim() : undefined,
      organicStatus,
    };

    if (onSave) {
      onSave(payload);
    } else {
      Alert.alert(
        isEditing ? 'Animal Updated' : 'Animal Registered',
        `Animal ${tag.trim()} (${breed.trim() || species}) has been successfully saved.`,
        [{ text: 'OK', onPress: onBack || onCancel }],
      );
    }
  };

  const handlePickPhoto = () => {
    Alert.alert('Animal Photo', 'Choose an option to upload animal picture:', [
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
              <Text style={styles.headerTitle}>{isEditing ? 'Register Animal' : 'Register Animal'}</Text>
              <Text style={styles.headerSubtitle} numberOfLines={1}>
                {isEditing ? 'New livestock profile' : 'New livestock profile'}
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
              accessibilityLabel="Change animal photo"
            >
              <View style={styles.avatarCircle}>
                <PawPrintIcon size={30} color={P.twAmber800} />
              </View>

              <View style={styles.cameraBadge}>
                <CameraIcon size={13} color={P.white} />
              </View>
            </TouchableOpacity>

            <Text style={styles.avatarHint}>Add photo (optional)</Text>
          </View>

          {/* ── Form Fields ── */}
          <View style={styles.formContainer}>
            {/* Animal ID / tag */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>
                Animal ID / tag <Text style={styles.requiredAsterisk}>*</Text>
              </Text>
              <TextInput
                style={styles.textInput}
                value={tag}
                onChangeText={setTag}
                placeholder="e.g. C-015"
                placeholderTextColor={P.twGray400}
                autoCapitalize="characters"
              />
            </View>

            {/* Species & Gender (2 columns) */}
            <View style={styles.twoColumnRow}>
              {/* Species */}
              <View style={styles.columnField}>
                <Text style={styles.fieldLabel}>
                  Species <Text style={styles.requiredAsterisk}>*</Text>
                </Text>
                <TouchableOpacity
                  style={styles.pickerInputBox}
                  activeOpacity={0.8}
                  onPress={() => setIsSpeciesPickerOpen(true)}
                >
                  <Text style={styles.pickerValueText}>{species}</Text>
                  <ChevronDownIcon size={16} color={P.twGray500} />
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

            {/* Breed */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Breed</Text>
              <TextInput
                style={styles.textInput}
                value={breed}
                onChangeText={setBreed}
                placeholder="e.g. Jersey cross"
                placeholderTextColor={P.twGray400}
              />
            </View>

            {/* Date of Birth */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Date of birth</Text>
              <TouchableOpacity
                style={styles.pickerInputBox}
                activeOpacity={0.8}
                onPress={() => {
                  Alert.prompt
                    ? Alert.prompt('Date of Birth', 'Enter birth date (DD Mon YYYY):', (val) => {
                        if (val) setDob(val);
                      })
                    : null;
                }}
              >
                <Text style={styles.pickerValueText}>{dob}</Text>
                <CalendarIcon size={18} color={P.twGray400} />
              </TouchableOpacity>
              <Text style={styles.ageHelperText}>≈ 4 months old</Text>
            </View>

            {/* ── Source Section ── */}
            <Text style={styles.sectionHeaderTitle}>SOURCE</Text>

            {/* Born on farm / Purchased Segmented Toggle */}
            <View style={styles.sourceSegmentContainer}>
              <TouchableOpacity
                style={[
                  styles.sourceSegmentBtn,
                  source === 'born_on_farm' && styles.sourceSegmentBtnActive,
                ]}
                onPress={() => setSource('born_on_farm')}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.sourceSegmentText,
                    source === 'born_on_farm' && styles.sourceSegmentTextActive,
                  ]}
                >
                  Born on farm
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.sourceSegmentBtn,
                  source === 'purchased' && styles.sourceSegmentBtnActive,
                ]}
                onPress={() => setSource('purchased')}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.sourceSegmentText,
                    source === 'purchased' && styles.sourceSegmentTextActive,
                  ]}
                >
                  Purchased
                </Text>
              </TouchableOpacity>
            </View>

            {/* Conditional Purchase Details when Purchased */}
            {source === 'purchased' && (
              <View style={styles.twoColumnRow}>
                {/* Purchase date */}
                <View style={styles.columnField}>
                  <Text style={styles.fieldLabel}>Purchase date</Text>
                  <TouchableOpacity
                    style={styles.pickerInputBox}
                    activeOpacity={0.8}
                    onPress={() => {
                      Alert.prompt
                        ? Alert.prompt('Purchase Date', 'Enter purchase date (DD Mon YYYY):', (val) => {
                            if (val) setPurchaseDate(val);
                          })
                        : null;
                    }}
                  >
                    <Text style={styles.pickerValueText}>{purchaseDate}</Text>
                    <CalendarIcon size={18} color={P.twGray400} />
                  </TouchableOpacity>
                </View>

                {/* Source farm */}
                <View style={styles.columnField}>
                  <Text style={styles.fieldLabel}>Source farm</Text>
                  <TextInput
                    style={styles.textInput}
                    value={sourceFarm}
                    onChangeText={setSourceFarm}
                    placeholder="e.g. Coonoor Dairy"
                    placeholderTextColor={P.twGray400}
                  />
                </View>
              </View>
            )}

            {/* Organic Status */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>
                Organic status <Text style={styles.requiredAsterisk}>*</Text>
              </Text>
              <TouchableOpacity
                style={styles.pickerInputBox}
                activeOpacity={0.8}
                onPress={() => setIsStatusPickerOpen(true)}
              >
                <Text style={styles.pickerValueText}>{organicStatus}</Text>
                <ChevronDownIcon size={16} color={P.twGray500} />
              </TouchableOpacity>
              <Text style={styles.statusExplainerText}>
                Purchased animals usually start{' '}
                <Text style={styles.statusHighlightOrange}>Transitioning</Text> until the conversion
                period completes.
              </Text>
            </View>
          </View>
        </ScrollView>

        {/* ── Bottom Floating Register Button ── */}
        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={styles.saveButton}
            onPress={handleSave}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel={isEditing ? 'Register animal' : 'Register animal'}
          >
            <Text style={styles.saveButtonText}>Register animal</Text>
          </TouchableOpacity>
        </View>

        {/* Species Picker Modal */}
        <Modal
          visible={isSpeciesPickerOpen}
          transparent
          animationType="fade"
          onRequestClose={() => setIsSpeciesPickerOpen(false)}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setIsSpeciesPickerOpen(false)}
          >
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>Select Species</Text>
              {speciesOptions.map((opt) => (
                <TouchableOpacity
                  key={opt}
                  style={[
                    styles.modalOption,
                    species === opt && styles.modalOptionSelected,
                  ]}
                  onPress={() => {
                    setSpecies(opt);
                    setIsSpeciesPickerOpen(false);
                  }}
                >
                  <Text
                    style={[
                      styles.modalOptionText,
                      species === opt && styles.modalOptionTextSelected,
                    ]}
                  >
                    {opt}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </TouchableOpacity>
        </Modal>

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
              {genderOptions.map((opt) => (
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

        {/* Status Picker Modal */}
        <Modal
          visible={isStatusPickerOpen}
          transparent
          animationType="fade"
          onRequestClose={() => setIsStatusPickerOpen(false)}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setIsStatusPickerOpen(false)}
          >
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>Select Organic Status</Text>
              {statusOptions.map((opt) => (
                <TouchableOpacity
                  key={opt}
                  style={[
                    styles.modalOption,
                    organicStatus === opt && styles.modalOptionSelected,
                  ]}
                  onPress={() => {
                    setOrganicStatus(opt);
                    setIsStatusPickerOpen(false);
                  }}
                >
                  <Text
                    style={[
                      styles.modalOptionText,
                      organicStatus === opt && styles.modalOptionTextSelected,
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
    backgroundColor: P.paleCreamBg,
    alignItems: 'center',
    justifyContent: 'center',
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
  ageHelperText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: colors.brandGreen,
    marginTop: 2,
  },
  sectionHeaderTitle: {
    fontSize: 11.5,
    fontWeight: '700',
    color: P.slate400,
    letterSpacing: 0.8,
    marginTop: 10,
    marginBottom: 2,
  },
  sourceSegmentContainer: {
    flexDirection: 'row',
    backgroundColor: P.twGray100,
    borderRadius: 12,
    padding: 4,
    gap: 4,
  },
  sourceSegmentBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 9,
  },
  sourceSegmentBtnActive: {
    backgroundColor: colors.brandGreen,
    shadowColor: P.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  sourceSegmentText: {
    fontSize: 13.5,
    fontWeight: '600',
    color: P.twGray500,
  },
  sourceSegmentTextActive: {
    color: P.white,
    fontWeight: '700',
  },
  statusExplainerText: {
    fontSize: 12,
    lineHeight: 17,
    color: P.twGray500,
    marginTop: 4,
  },
  statusHighlightOrange: {
    fontWeight: '700',
    color: P.twAmber800,
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
