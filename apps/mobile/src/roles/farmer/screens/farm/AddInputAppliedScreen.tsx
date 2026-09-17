import React, { useState, useEffect } from 'react';
import {
  Alert,
  BackHandler,
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
import Svg, { Path } from 'react-native-svg';
import { authPalette as P } from '../../theme';
import type { CropItem } from './ProduceCalendarScreen';

// ─────────────────────────────────────────────
// Inline Vector Icons (strictly no emoji, no raw hex)
// ─────────────────────────────────────────────

function CloseIcon({ size = 18, color = P.twGray800 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M18 6L6 18M6 6l12 12"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function ChevronDownIcon({ size = 18, color = P.twGray500 }: { size?: number; color?: string }) {
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

// ─────────────────────────────────────────────
// Types & Options
// ─────────────────────────────────────────────

export interface AddInputAppliedScreenProps {
  crop?: CropItem | null | undefined;
  initialInputType?: 'Fertigation' | 'Pest Treatment' | undefined;
  onBack?: (() => void) | undefined;
  onSave?: ((entryData?: any) => void) | undefined;
}

const UNITS = ['ml', 'L', 'kg', 'g'];
const PURPOSES = [
  'General nutrition',
  'Pest prevention',
  'Disease control',
  'Soil fertility',
  'Flowering booster',
];
const PEST_OPTIONS = [
  'Aphids',
  'Fruit Borer',
  'Early Blight',
  'Leaf Curl Virus',
  'Whiteflies',
  'Mites',
  'Cutworms',
  'Powdery Mildew',
];
const APPLIED_BY_OPTIONS = [
  'Self',
  'Raju (Worker)',
  'Mani (Worker)',
  'Contractor',
];

export function AddInputAppliedScreen({
  crop,
  initialInputType,
  onBack,
  onSave,
}: AddInputAppliedScreenProps): React.JSX.Element {
  // Hardware back button handler for Android
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (onBack) {
        onBack();
        return true;
      }
      return false;
    });
    return () => sub.remove();
  }, [onBack]);

  const cropName = crop?.name ?? 'Carrot';
  const cropVariety = crop?.variety ?? 'Nantes';
  const cropZone = crop?.zoneShort ?? 'Zone 1';
  const subtitle = `${cropName} — ${cropVariety} · ${cropZone}`;

  // Form states
  const [inputType, setInputType] = useState<'Fertigation' | 'Pest Treatment'>(
    initialInputType ?? 'Pest Treatment',
  );
  const [productName, setProductName] = useState('');
  const [quantity, setQuantity] = useState(
    initialInputType === 'Fertigation' ? '4' : '200',
  );
  const [unit, setUnit] = useState(
    initialInputType === 'Fertigation' ? 'L' : 'ml',
  );
  const [dateTime, setDateTime] = useState('17 Sep 2026, 09:20 AM');
  const [purpose, setPurpose] = useState('General nutrition');
  const [targetPest, setTargetPest] = useState('Aphids');
  const [appliedBy, setAppliedBy] = useState('Self');
  const [notes, setNotes] = useState('');

  // Dropdown Modals
  const [showUnitModal, setShowUnitModal] = useState(false);
  const [showPurposeModal, setShowPurposeModal] = useState(false);
  const [showPestModal, setShowPestModal] = useState(false);
  const [showAppliedByModal, setShowAppliedByModal] = useState(false);

  const handleSelectType = (nextType: 'Fertigation' | 'Pest Treatment') => {
    setInputType(nextType);
    if (nextType === 'Fertigation') {
      if (unit === 'ml') setUnit('L');
      if (quantity === '200') setQuantity('4');
    } else {
      if (unit === 'L') setUnit('ml');
      if (quantity === '4') setQuantity('200');
    }
  };

  const handleSave = () => {
    if (!productName.trim()) {
      Alert.alert('Required Field', 'Please enter a product or input name.');
      return;
    }
    if (onSave) {
      onSave({
        inputType,
        productName: productName.trim(),
        quantity: `${quantity} ${unit}`,
        dateTime,
        purpose: inputType === 'Fertigation' ? purpose : targetPest,
        targetPest: inputType === 'Pest Treatment' ? targetPest : undefined,
        appliedBy,
        notes,
      });
    } else if (onBack) {
      onBack();
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={P.white} />

      {/* ── Top Header Bar ── */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.closeBtn}
            onPress={onBack}
            activeOpacity={0.7}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            accessibilityRole="button"
            accessibilityLabel="Close and go back"
          >
            <CloseIcon size={18} color={P.twGray800} />
          </TouchableOpacity>

          <View style={styles.headerTitleGroup}>
            <Text style={styles.headerTitle}>Add Input Applied</Text>
            <Text style={styles.headerSubtitle}>{subtitle}</Text>
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── 1. Input Type ── */}
        <View style={styles.fieldSection}>
          <View style={styles.fieldLabelRow}>
            <Text style={styles.fieldLabel}>INPUT TYPE</Text>
            <Text style={styles.asterisk}> *</Text>
          </View>

          <View style={styles.segmentedContainer}>
            <TouchableOpacity
              style={[
                styles.segmentButton,
                inputType === 'Fertigation' && styles.segmentButtonActive,
              ]}
              onPress={() => handleSelectType('Fertigation')}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel="Fertigation"
            >
              <Text
                style={[
                  styles.segmentButtonText,
                  inputType === 'Fertigation' && styles.segmentButtonTextActive,
                ]}
              >
                Fertigation
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.segmentButton,
                inputType === 'Pest Treatment' && styles.segmentButtonActive,
              ]}
              onPress={() => handleSelectType('Pest Treatment')}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel="Pest Treatment"
            >
              <Text
                style={[
                  styles.segmentButtonText,
                  inputType === 'Pest Treatment' && styles.segmentButtonTextActive,
                ]}
              >
                Pest Treatment
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── 2. Product / Input Name ── */}
        <View style={styles.fieldSection}>
          <View style={styles.fieldLabelRow}>
            <Text style={styles.fieldLabel}>PRODUCT / INPUT NAME</Text>
            <Text style={styles.asterisk}> *</Text>
          </View>

          <View style={styles.inputBox}>
            <TextInput
              style={styles.textInput}
              value={productName}
              onChangeText={setProductName}
              placeholder={
                inputType === 'Pest Treatment'
                  ? 'e.g. Neem Oil, BT Spray'
                  : 'e.g. Vermicompost Tea, Panchagavya'
              }
              placeholderTextColor={P.twGray400}
              accessibilityLabel="Product or Input Name"
            />
          </View>
          <Text style={styles.helperText}>
            Type to enter manually — suggestions come only from your own past entries.
          </Text>
        </View>

        {/* ── 3. Quantity ── */}
        <View style={styles.fieldSection}>
          <View style={styles.fieldLabelRow}>
            <Text style={styles.fieldLabel}>QUANTITY</Text>
            <Text style={styles.asterisk}> *</Text>
          </View>

          <View style={styles.quantityRow}>
            <View style={[styles.inputBox, styles.quantityInputBox]}>
              <TextInput
                style={styles.textInput}
                value={quantity}
                onChangeText={setQuantity}
                keyboardType="numeric"
                placeholder="200"
                placeholderTextColor={P.twGray400}
                accessibilityLabel="Quantity"
              />
            </View>

            <TouchableOpacity
              style={styles.unitDropdown}
              onPress={() => setShowUnitModal(true)}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel="Select unit"
            >
              <Text style={styles.unitText}>{unit}</Text>
              <ChevronDownIcon size={18} color={P.twGray500} />
            </TouchableOpacity>
          </View>
        </View>

        {/* ── 4. Date & Time ── */}
        <View style={styles.fieldSection}>
          <View style={styles.fieldLabelRow}>
            <Text style={styles.fieldLabel}>DATE & TIME</Text>
            <Text style={styles.asterisk}> *</Text>
          </View>

          <View style={styles.inputBox}>
            <TextInput
              style={styles.textInput}
              value={dateTime}
              onChangeText={setDateTime}
              placeholder="17 Sep 2026, 09:20 AM"
              placeholderTextColor={P.twGray400}
              accessibilityLabel="Date and Time"
            />
          </View>
          <Text style={styles.helperText}>Entered manually — no auto-timestamping</Text>
        </View>

        {/* ── 5. Target Pest / Issue (for Pest Treatment) OR Purpose (for Fertigation) ── */}
        {inputType === 'Pest Treatment' ? (
          <View style={styles.fieldSection}>
            <View style={styles.fieldLabelRow}>
              <Text style={styles.fieldLabel}>TARGET PEST / ISSUE</Text>
              <Text style={styles.asterisk}> *</Text>
            </View>

            <TouchableOpacity
              style={styles.dropdownBox}
              onPress={() => setShowPestModal(true)}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel="Select target pest or issue"
            >
              <Text style={styles.dropdownText}>{targetPest}</Text>
              <ChevronDownIcon size={18} color={P.twGray500} />
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.fieldSection}>
            <Text style={styles.fieldLabel}>PURPOSE</Text>

            <TouchableOpacity
              style={styles.dropdownBox}
              onPress={() => setShowPurposeModal(true)}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel="Select purpose"
            >
              <Text style={styles.dropdownText}>{purpose}</Text>
              <ChevronDownIcon size={18} color={P.twGray500} />
            </TouchableOpacity>
          </View>
        )}

        {/* ── 6. Applied By ── */}
        <View style={styles.fieldSection}>
          <Text style={styles.fieldLabel}>APPLIED BY</Text>

          <TouchableOpacity
            style={styles.dropdownBox}
            onPress={() => setShowAppliedByModal(true)}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Select applied by"
          >
            <Text style={styles.dropdownText}>{appliedBy}</Text>
            <ChevronDownIcon size={18} color={P.twGray500} />
          </TouchableOpacity>
        </View>

        {/* ── 7. Notes ── */}
        <View style={styles.fieldSection}>
          <Text style={styles.fieldLabel}>NOTES</Text>

          <TextInput
            style={styles.notesInput}
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={3}
            placeholder="Optional notes"
            placeholderTextColor={P.twGray400}
            textAlignVertical="top"
            accessibilityLabel="Optional notes"
          />
        </View>

        {/* ── Bottom Buttons ── */}
        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={onBack}
            activeOpacity={0.75}
            accessibilityRole="button"
            accessibilityLabel="Cancel"
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.saveButton}
            onPress={handleSave}
            activeOpacity={0.88}
            accessibilityRole="button"
            accessibilityLabel="Save Input"
          >
            <Text style={styles.saveButtonText}>Save Input</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* ── Unit Selection Modal ── */}
      <Modal visible={showUnitModal} transparent animationType="fade">
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => setShowUnitModal(false)}
        >
          <View style={styles.pickerModalContent}>
            <Text style={styles.pickerModalTitle}>Select Unit</Text>
            {UNITS.map((u) => {
              const isSelected = unit === u;
              return (
                <TouchableOpacity
                  key={u}
                  style={[styles.modalItem, isSelected && styles.modalItemSelected]}
                  onPress={() => {
                    setUnit(u);
                    setShowUnitModal(false);
                  }}
                >
                  <Text
                    style={[
                      styles.modalItemText,
                      isSelected && styles.modalItemTextSelected,
                    ]}
                  >
                    {u}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* ── Target Pest Selection Modal ── */}
      <Modal visible={showPestModal} transparent animationType="fade">
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => setShowPestModal(false)}
        >
          <View style={styles.pickerModalContent}>
            <Text style={styles.pickerModalTitle}>Select Target Pest / Issue</Text>
            {PEST_OPTIONS.map((p) => {
              const isSelected = targetPest === p;
              return (
                <TouchableOpacity
                  key={p}
                  style={[styles.modalItem, isSelected && styles.modalItemSelected]}
                  onPress={() => {
                    setTargetPest(p);
                    setShowPestModal(false);
                  }}
                >
                  <Text
                    style={[
                      styles.modalItemText,
                      isSelected && styles.modalItemTextSelected,
                    ]}
                  >
                    {p}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* ── Purpose Selection Modal ── */}
      <Modal visible={showPurposeModal} transparent animationType="fade">
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => setShowPurposeModal(false)}
        >
          <View style={styles.pickerModalContent}>
            <Text style={styles.pickerModalTitle}>Select Purpose</Text>
            {PURPOSES.map((item) => {
              const isSelected = purpose === item;
              return (
                <TouchableOpacity
                  key={item}
                  style={[styles.modalItem, isSelected && styles.modalItemSelected]}
                  onPress={() => {
                    setPurpose(item);
                    setShowPurposeModal(false);
                  }}
                >
                  <Text
                    style={[
                      styles.modalItemText,
                      isSelected && styles.modalItemTextSelected,
                    ]}
                  >
                    {item}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* ── Applied By Selection Modal ── */}
      <Modal visible={showAppliedByModal} transparent animationType="fade">
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => setShowAppliedByModal(false)}
        >
          <View style={styles.pickerModalContent}>
            <Text style={styles.pickerModalTitle}>Applied By</Text>
            {APPLIED_BY_OPTIONS.map((item) => {
              const isSelected = appliedBy === item;
              return (
                <TouchableOpacity
                  key={item}
                  style={[styles.modalItem, isSelected && styles.modalItemSelected]}
                  onPress={() => {
                    setAppliedBy(item);
                    setShowAppliedByModal(false);
                  }}
                >
                  <Text
                    style={[
                      styles.modalItemText,
                      isSelected && styles.modalItemTextSelected,
                    ]}
                  >
                    {item}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: P.white,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? 6 : 4,
    paddingBottom: 10,
    backgroundColor: P.white,
    borderBottomWidth: 1,
    borderBottomColor: P.twGray200,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: P.twGray200,
    backgroundColor: P.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    shadowColor: P.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  headerTitleGroup: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: P.twGray900,
    letterSpacing: -0.2,
  },
  headerSubtitle: {
    fontSize: 12.5,
    fontWeight: '500',
    color: P.twGray500,
    marginTop: 1,
  },
  scrollContainer: {
    flex: 1,
    backgroundColor: P.white,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 36,
  },
  fieldSection: {
    marginBottom: 16,
  },
  fieldLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: P.twGray700,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  asterisk: {
    fontSize: 12,
    fontWeight: '700',
    color: P.red700,
  },
  segmentedContainer: {
    flexDirection: 'row',
    backgroundColor: P.mintTintBg,
    borderRadius: 12,
    padding: 4,
    borderWidth: 1,
    borderColor: P.twGreen100,
  },
  segmentButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentButtonActive: {
    backgroundColor: P.forestGreen,
    shadowColor: P.forestGreen,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },
  segmentButtonText: {
    fontSize: 13.5,
    fontWeight: '600',
    color: P.forestGreen,
  },
  segmentButtonTextActive: {
    color: P.white,
    fontWeight: '700',
  },
  inputBox: {
    backgroundColor: P.white,
    borderWidth: 1,
    borderColor: P.twGray200,
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 48,
    justifyContent: 'center',
  },
  textInput: {
    fontSize: 14,
    fontWeight: '500',
    color: P.twGray900,
    padding: 0,
  },
  helperText: {
    fontSize: 11,
    fontWeight: '400',
    color: P.twGray500,
    marginTop: 6,
    lineHeight: 15,
  },
  quantityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  quantityInputBox: {
    flex: 1,
  },
  unitDropdown: {
    height: 48,
    borderWidth: 1,
    borderColor: P.twGray200,
    borderRadius: 12,
    backgroundColor: P.white,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minWidth: 76,
  },
  unitText: {
    fontSize: 14,
    fontWeight: '600',
    color: P.twGray900,
    marginRight: 6,
  },
  dropdownBox: {
    backgroundColor: P.white,
    borderWidth: 1,
    borderColor: P.twGray200,
    borderRadius: 12,
    height: 48,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dropdownText: {
    fontSize: 14,
    fontWeight: '500',
    color: P.twGray900,
  },
  notesInput: {
    backgroundColor: P.white,
    borderWidth: 1,
    borderColor: P.twGray200,
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    fontWeight: '400',
    color: P.twGray900,
    minHeight: 74,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 10,
  },
  cancelButton: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    borderWidth: 1.2,
    borderColor: P.twGray300,
    backgroundColor: P.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontSize: 14.5,
    fontWeight: '700',
    color: P.twGray800,
  },
  saveButton: {
    flex: 1.3,
    height: 48,
    borderRadius: 12,
    backgroundColor: P.forestGreen,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: P.forestGreen,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  saveButtonText: {
    fontSize: 14.5,
    fontWeight: '700',
    color: P.white,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  pickerModalContent: {
    width: '100%',
    backgroundColor: P.white,
    borderRadius: 16,
    padding: 18,
    shadowColor: P.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 5,
  },
  pickerModalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: P.twGray900,
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: P.twGray100,
  },
  modalItem: {
    paddingVertical: 11,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  modalItemSelected: {
    backgroundColor: P.twGreen50,
  },
  modalItemText: {
    fontSize: 14,
    fontWeight: '500',
    color: P.twGray800,
  },
  modalItemTextSelected: {
    color: P.forestGreen,
    fontWeight: '700',
  },
});
