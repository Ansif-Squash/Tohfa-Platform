import React, { useEffect, useState } from 'react';
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
import Svg, { Circle, Line, Path, Rect } from 'react-native-svg';
import { authPalette as P } from '../../theme';
import { localProduceCropsCache, type CropItem } from './ProduceCalendarScreen';

// ─────────────────────────────────────────────
// Vector Icons (Strictly no emojis, theme tokens only)
// ─────────────────────────────────────────────

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

function FieldBoxIcon({ size = 15, color = P.forestGreen }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="3" width="18" height="18" rx="3" stroke={color} strokeWidth="2.4" />
      <Line x1="3" y1="12" x2="21" y2="12" stroke={color} strokeWidth="1.8" strokeDasharray="3 3" />
      <Line x1="12" y1="3" x2="12" y2="21" stroke={color} strokeWidth="1.8" strokeDasharray="3 3" />
    </Svg>
  );
}

function InfoCircleIcon({ size = 16, color = P.forestGreen }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth="2" />
      <Line x1="12" y1="11" x2="12" y2="16" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Circle cx="12" cy="8" r="1.2" fill={color} />
    </Svg>
  );
}

function FlaskIcon({ size = 16, color = P.forestGreen }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M10 3v4.5L5 18a2 2 0 0 0 1.7 3h10.6a2 2 0 0 0 1.7-3L14 7.5V3"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Line x1="8.5" y1="3" x2="15.5" y2="3" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="7" y1="15.5" x2="17" y2="15.5" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </Svg>
  );
}

function ChevronDownIcon({ size = 18, color = P.forestGreen }: { size?: number; color?: string }) {
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

function CalculatorIcon({ size = 18, color = P.forestGreen }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="4" y="2" width="16" height="20" rx="3" stroke={color} strokeWidth="2" />
      <Rect x="7" y="5" width="10" height="4" rx="1" fill={color} fillOpacity={0.2} stroke={color} strokeWidth="1.5" />
      <Circle cx="8" cy="13" r="1" fill={color} />
      <Circle cx="12" cy="13" r="1" fill={color} />
      <Circle cx="16" cy="13" r="1" fill={color} />
      <Circle cx="8" cy="17" r="1" fill={color} />
      <Circle cx="12" cy="17" r="1" fill={color} />
      <Circle cx="16" cy="17" r="1" fill={color} />
    </Svg>
  );
}

function CalendarIcon({ size = 16, color = P.twGray600 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="4" width="18" height="18" rx="3" stroke={color} strokeWidth="2" />
      <Line x1="3" y1="10" x2="21" y2="10" stroke={color} strokeWidth="2" />
      <Line x1="8" y1="2" x2="8" y2="6" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="16" y1="2" x2="16" y2="6" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function CheckmarkIcon({ size = 18, color = P.white }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M20 6L9 17l-5-5"
        stroke={color}
        strokeWidth="2.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

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

// ─────────────────────────────────────────────
// Reference & Input Data Models
// ─────────────────────────────────────────────

interface CropReferenceData {
  cropName: string;
  idealPh: string;
  nKgHa: string;
  pKgHa: string;
  kKgHa: string;
}

const CROP_REFERENCES: Record<string, CropReferenceData> = {
  carrot: {
    cropName: 'CARROT',
    idealPh: '5.5',
    nKgHa: '40',
    pKgHa: '30',
    kKgHa: '50',
  },
  tomato: {
    cropName: 'TOMATO',
    idealPh: '6.2',
    nKgHa: '65',
    pKgHa: '45',
    kKgHa: '70',
  },
  cabbage: {
    cropName: 'CABBAGE',
    idealPh: '6.5',
    nKgHa: '55',
    pKgHa: '35',
    kKgHa: '60',
  },
};

interface ApprovedInput {
  name: string;
  type: string;
  method: string;
  dosage: string;
  defaultQty: string;
  unit: string;
  pricePerUnit: number;
  phiDays: string;
}

const APPROVED_INPUTS: ApprovedInput[] = [
  {
    name: 'Vermicompost',
    type: 'Organic',
    method: 'Drench',
    dosage: '2 kg per plant, worked into the root zone before watering.',
    defaultQty: '60',
    unit: 'kg',
    pricePerUnit: 12,
    phiDays: '0',
  },
  {
    name: 'Panchagavya',
    type: 'Organic',
    method: 'Foliar spray',
    dosage: '30 ml per L of water, spray every 15 days.',
    defaultQty: '15',
    unit: 'L',
    pricePerUnit: 42,
    phiDays: '0',
  },
  {
    name: 'Jeevamrutha',
    type: 'Organic',
    method: 'Drench',
    dosage: '200 L per acre through irrigation water.',
    defaultQty: '50',
    unit: 'L',
    pricePerUnit: 8,
    phiDays: '0',
  },
  {
    name: 'Bone meal',
    type: 'Organic',
    method: 'Soil incorporation',
    dosage: '100 g per sq. meter worked into soil.',
    defaultQty: '25',
    unit: 'kg',
    pricePerUnit: 21,
    phiDays: '0',
  },
  {
    name: 'Trichoderma drench',
    type: 'Biological',
    method: 'Root drench',
    dosage: '5 g per L of water around collar region.',
    defaultQty: '5',
    unit: 'kg',
    pricePerUnit: 90,
    phiDays: '0',
  },
];

const DEFAULT_INPUT: ApprovedInput = {
  name: 'Vermicompost',
  type: 'Organic',
  method: 'Drench',
  dosage: '2 kg per plant, worked into the root zone before watering.',
  defaultQty: '60',
  unit: 'kg',
  pricePerUnit: 12,
  phiDays: '0',
};

const DEFAULT_REF: CropReferenceData = {
  cropName: 'CARROT',
  idealPh: '5.5',
  nKgHa: '40',
  pKgHa: '30',
  kKgHa: '50',
};

const METHODS = ['Drench', 'Foliar spray', 'Drip irrigation', 'Soil incorporation', 'Broadcasting'];
const UNITS = ['kg', 'L', 'g', 'ml'];

export interface LogFertigationScreenProps {
  crop?: CropItem | null | undefined;
  onBack?: (() => void) | undefined;
  onSave?: ((data?: any) => void) | undefined;
}

export function LogFertigationScreen({
  crop,
  onBack,
  onSave,
}: LogFertigationScreenProps): React.JSX.Element {
  // Android hardware back
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

  // Selected crop / field
  const initialCrop =
    crop ??
    localProduceCropsCache.find((c) => c.name.toLowerCase().includes('carrot')) ??
    localProduceCropsCache[0];

  const [selectedCrop, setSelectedCrop] = useState<CropItem | null>(initialCrop ?? null);

  // Selected input
  const [selectedInput, setSelectedInput] = useState<ApprovedInput>(DEFAULT_INPUT);
  const [method, setMethod] = useState<string>(DEFAULT_INPUT.method);
  const [quantity, setQuantity] = useState<string>(DEFAULT_INPUT.defaultQty);
  const [unit, setUnit] = useState<string>(DEFAULT_INPUT.unit);
  const [phiDays, setPhiDays] = useState<string>(DEFAULT_INPUT.phiDays);
  const [nextDate, setNextDate] = useState<string>('31 Jul 2026');

  // Modals
  const [showCropModal, setShowCropModal] = useState(false);
  const [showInputModal, setShowInputModal] = useState(false);
  const [showMethodModal, setShowMethodModal] = useState(false);
  const [showUnitModal, setShowUnitModal] = useState(false);

  // Cost calculation
  const qtyNumber = parseFloat(quantity) || 0;
  const totalCost = Math.round(qtyNumber * selectedInput.pricePerUnit);

  // Active reference data
  const cropKey = selectedCrop?.name.toLowerCase() ?? 'carrot';
  const refData: CropReferenceData = CROP_REFERENCES[cropKey] ?? DEFAULT_REF;

  const handleSelectInput = (item: ApprovedInput) => {
    setSelectedInput(item);
    setMethod(item.method);
    setQuantity(item.defaultQty);
    setUnit(item.unit);
    setPhiDays(item.phiDays);
    setShowInputModal(false);
  };

  const handleSave = () => {
    if (!quantity.trim() || qtyNumber <= 0) {
      Alert.alert('Invalid Quantity', 'Please enter a valid application quantity.');
      return;
    }

    Alert.alert(
      'Fertigation Logged',
      `${selectedInput.name} application for ${selectedCrop?.name ?? 'Carrot'} saved successfully.`,
      [
        {
          text: 'OK',
          onPress: () => {
            if (onSave) {
              onSave({
                crop: selectedCrop,
                inputName: selectedInput.name,
                type: selectedInput.type,
                method,
                dosage: selectedInput.dosage,
                quantity: `${quantity} ${unit}`,
                phiDays,
                cost: totalCost,
                nextDate,
              });
            } else if (onBack) {
              onBack();
            }
          },
        },
      ],
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={P.white} />

      {/* Header Bar */}
      <View style={styles.headerBar}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={onBack}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <ArrowBackIcon size={20} color={P.deepGreen} />
        </TouchableOpacity>

        <View style={styles.headerTextGroup}>
          <Text style={styles.headerTitle}>Log Fertigation</Text>
          <Text style={styles.headerSubtitle}>New nutrient application</Text>
        </View>

        <TouchableOpacity
          onPress={onBack}
          activeOpacity={0.7}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
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
      >
        {/* Field Selector */}
        <View style={styles.formGroup}>
          <View style={styles.labelRow}>
            <FieldBoxIcon size={15} color={P.forestGreen} />
            <Text style={styles.label}>
              Field <Text style={styles.requiredAsterisk}>*</Text>
            </Text>
          </View>

          <TouchableOpacity
            style={styles.selectBoxGreen}
            onPress={() => setShowCropModal(true)}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Select Field"
          >
            <Text style={styles.selectBoxTextGreen}>
              {selectedCrop
                ? `${selectedCrop.zone} (${selectedCrop.name})`
                : 'Zone 1 — Upper Field (Carrot)'}
            </Text>
            <ChevronDownIcon size={18} color={P.forestGreen} />
          </TouchableOpacity>
        </View>

        {/* Reference Card (REFERENCE · CARROT) */}
        <View style={styles.referenceCard}>
          <View style={styles.referenceHeader}>
            <InfoCircleIcon size={16} color={P.forestGreen} />
            <Text style={styles.referenceHeaderText}>
              REFERENCE · {refData.cropName}
            </Text>
          </View>

          <View style={styles.statBoxesRow}>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{refData.idealPh}</Text>
              <Text style={styles.statLabel}>Ideal pH</Text>
            </View>

            <View style={styles.statBox}>
              <Text style={styles.statValue}>{refData.nKgHa}</Text>
              <Text style={styles.statLabel}>N kg/ha</Text>
            </View>

            <View style={styles.statBox}>
              <Text style={styles.statValue}>{refData.pKgHa}</Text>
              <Text style={styles.statLabel}>P kg/ha</Text>
            </View>

            <View style={styles.statBox}>
              <Text style={styles.statValue}>{refData.kKgHa}</Text>
              <Text style={styles.statLabel}>K kg/ha</Text>
            </View>
          </View>

          <Text style={styles.referenceFooterNote}>
            Full breakdown in the NPK Contribution Tracker (Screen 38).
          </Text>
        </View>

        {/* Input Name Selector */}
        <View style={styles.formGroup}>
          <View style={styles.labelRow}>
            <FlaskIcon size={16} color={P.forestGreen} />
            <Text style={styles.label}>
              Input name <Text style={styles.requiredAsterisk}>*</Text>
            </Text>
          </View>

          <TouchableOpacity
            style={styles.selectBoxGreen}
            onPress={() => setShowInputModal(true)}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Select Input name"
          >
            <Text style={styles.selectBoxTextGreen}>{selectedInput.name}</Text>
            <ChevronDownIcon size={18} color={P.forestGreen} />
          </TouchableOpacity>

          <Text style={styles.helpText}>
            From the Approved Inputs list — fills type, method, dosage & PHI below.
          </Text>
        </View>

        {/* Type & Method Row */}
        <View style={styles.rowTwoCols}>
          {/* Type */}
          <View style={styles.col}>
            <Text style={styles.subLabel}>Type</Text>
            <View style={styles.autoFieldBox}>
              <Text style={styles.autoFieldValue}>{selectedInput.type}</Text>
              <View style={styles.autoBadge}>
                <Text style={styles.autoBadgeText}>AUTO</Text>
              </View>
            </View>
          </View>

          {/* Method */}
          <View style={styles.col}>
            <Text style={styles.subLabel}>Method</Text>
            <TouchableOpacity
              style={styles.methodSelectBox}
              onPress={() => setShowMethodModal(true)}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel="Select Method"
            >
              <Text style={styles.methodSelectText}>{method}</Text>
              <ChevronDownIcon size={18} color={P.twGray500} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Dosage Guidance */}
        <View style={styles.formGroup}>
          <Text style={styles.subLabel}>Dosage guidance</Text>
          <View style={styles.dosageBox}>
            <Text style={styles.dosageText}>{selectedInput.dosage}</Text>
          </View>
        </View>

        {/* Quantity & PHI (days) Row */}
        <View style={styles.rowTwoCols}>
          {/* Quantity */}
          <View style={styles.colQty}>
            <Text style={styles.subLabel}>Quantity</Text>
            <View style={styles.qtyInputRow}>
              <TextInput
                style={styles.qtyInput}
                value={quantity}
                onChangeText={setQuantity}
                keyboardType="numeric"
                accessibilityLabel="Quantity"
              />
              <TouchableOpacity
                style={styles.unitBtn}
                onPress={() => setShowUnitModal(true)}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel="Unit"
              >
                <Text style={styles.unitBtnText}>{unit}</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* PHI (days) */}
          <View style={styles.colPhi}>
            <Text style={styles.subLabel}>PHI (days)</Text>
            <TextInput
              style={styles.phiInput}
              value={phiDays}
              onChangeText={setPhiDays}
              keyboardType="numeric"
              accessibilityLabel="PHI in days"
            />
          </View>
        </View>

        {/* Cost Calculation Card */}
        <View style={styles.costCard}>
          <View style={styles.costLeftRow}>
            <View style={styles.calcIconBox}>
              <CalculatorIcon size={18} color={P.forestGreen} />
            </View>
            <View>
              <Text style={styles.costFormula}>
                COST · {quantity} {unit.toUpperCase()} × ₹{selectedInput.pricePerUnit}
              </Text>
              <Text style={styles.costAmount}>₹ {totalCost}</Text>
            </View>
          </View>

          <View style={styles.editableBadge}>
            <Text style={styles.editableBadgeText}>AUTO · EDITABLE</Text>
          </View>
        </View>

        {/* Next Application Date */}
        <View style={styles.formGroup}>
          <View style={styles.labelRow}>
            <CalendarIcon size={16} color={P.twGray600} />
            <Text style={styles.labelDate}>Next application date</Text>
          </View>

          <View style={styles.dateBox}>
            <Text style={styles.dateText}>{nextDate}</Text>
            <View style={styles.dateDaysBadge}>
              <Text style={styles.dateDaysBadgeText}>+14 DAYS</Text>
            </View>
          </View>
        </View>

        {/* Bottom Button: Save application */}
        <TouchableOpacity
          style={styles.saveBtn}
          onPress={handleSave}
          activeOpacity={0.88}
          accessibilityRole="button"
          accessibilityLabel="Save application"
        >
          <CheckmarkIcon size={18} color={P.white} />
          <Text style={styles.saveBtnText}>Save application</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Modal: Select Field / Crop */}
      <Modal
        visible={showCropModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCropModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowCropModal(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Field / Crop</Text>
              <TouchableOpacity onPress={() => setShowCropModal(false)}>
                <CloseIcon size={18} color={P.twGray800} />
              </TouchableOpacity>
            </View>
            {localProduceCropsCache.map((item) => {
              const isSelected = selectedCrop?.id === item.id;
              return (
                <TouchableOpacity
                  key={item.id}
                  style={[styles.modalItem, isSelected && styles.modalItemSelected]}
                  onPress={() => {
                    setSelectedCrop(item);
                    setShowCropModal(false);
                  }}
                >
                  <Text
                    style={[
                      styles.modalItemText,
                      isSelected && styles.modalItemTextSelected,
                    ]}
                  >
                    {item.zone} ({item.name})
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Modal: Select Input Name */}
      <Modal
        visible={showInputModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowInputModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowInputModal(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Approved Nutrient Inputs</Text>
              <TouchableOpacity onPress={() => setShowInputModal(false)}>
                <CloseIcon size={18} color={P.twGray800} />
              </TouchableOpacity>
            </View>
            {APPROVED_INPUTS.map((item) => {
              const isSelected = selectedInput.name === item.name;
              return (
                <TouchableOpacity
                  key={item.name}
                  style={[styles.modalItem, isSelected && styles.modalItemSelected]}
                  onPress={() => handleSelectInput(item)}
                >
                  <View>
                    <Text
                      style={[
                        styles.modalItemText,
                        isSelected && styles.modalItemTextSelected,
                      ]}
                    >
                      {item.name} ({item.type})
                    </Text>
                    <Text style={styles.modalSubItemText}>
                      ₹{item.pricePerUnit}/{item.unit} · {item.method}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Modal: Select Method */}
      <Modal
        visible={showMethodModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowMethodModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowMethodModal(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Application Method</Text>
              <TouchableOpacity onPress={() => setShowMethodModal(false)}>
                <CloseIcon size={18} color={P.twGray800} />
              </TouchableOpacity>
            </View>
            {METHODS.map((m) => {
              const isSelected = method === m;
              return (
                <TouchableOpacity
                  key={m}
                  style={[styles.modalItem, isSelected && styles.modalItemSelected]}
                  onPress={() => {
                    setMethod(m);
                    setShowMethodModal(false);
                  }}
                >
                  <Text
                    style={[
                      styles.modalItemText,
                      isSelected && styles.modalItemTextSelected,
                    ]}
                  >
                    {m}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Modal: Select Unit */}
      <Modal
        visible={showUnitModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowUnitModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowUnitModal(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Unit</Text>
              <TouchableOpacity onPress={() => setShowUnitModal(false)}>
                <CloseIcon size={18} color={P.twGray800} />
              </TouchableOpacity>
            </View>
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: P.white,
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 6 : 4,
    paddingBottom: 10,
    backgroundColor: P.white,
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1,
    borderColor: P.twGray200,
    backgroundColor: P.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
    shadowColor: P.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  headerTextGroup: {
    flex: 1,
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: P.twGray900,
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 13,
    color: P.twGray500,
    marginTop: 1,
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: P.twGray600,
    paddingHorizontal: 4,
    paddingVertical: 6,
  },
  scrollView: {
    flex: 1,
    backgroundColor: P.white,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 36,
  },
  formGroup: {
    marginTop: 14,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  label: {
    fontSize: 13.5,
    fontWeight: '700',
    color: P.twGray900,
    marginLeft: 6,
  },
  labelDate: {
    fontSize: 13.5,
    fontWeight: '700',
    color: P.twGray800,
    marginLeft: 6,
  },
  requiredAsterisk: {
    color: P.red700,
    fontWeight: '700',
  },
  selectBoxGreen: {
    height: 50,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: P.forestGreen,
    backgroundColor: P.white,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectBoxTextGreen: {
    fontSize: 15,
    fontWeight: '600',
    color: P.twGray900,
  },
  helpText: {
    fontSize: 11.5,
    lineHeight: 16,
    color: P.twGray400,
    marginTop: 6,
  },
  referenceCard: {
    backgroundColor: '#f5f7f5',
    borderRadius: 14,
    padding: 14,
    marginTop: 14,
    borderWidth: 1,
    borderColor: P.twGray200,
  },
  referenceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  referenceHeaderText: {
    fontSize: 11,
    fontWeight: '700',
    color: P.twGray600,
    letterSpacing: 0.6,
    marginLeft: 6,
  },
  statBoxesRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  statBox: {
    flex: 1,
    backgroundColor: P.white,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: P.twGray100,
    shadowColor: P.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: P.twGray900,
  },
  statLabel: {
    fontSize: 10,
    color: P.twGray500,
    marginTop: 2,
  },
  referenceFooterNote: {
    fontSize: 11,
    color: P.twGray500,
    marginTop: 10,
  },
  rowTwoCols: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 14,
  },
  col: {
    flex: 1,
  },
  colQty: {
    flex: 1.25,
  },
  colPhi: {
    flex: 1,
  },
  subLabel: {
    fontSize: 13.5,
    fontWeight: '700',
    color: P.twGray800,
    marginBottom: 6,
  },
  autoFieldBox: {
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: P.twGray200,
    backgroundColor: P.twGray50,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  autoFieldValue: {
    fontSize: 14,
    fontWeight: '600',
    color: P.twGray900,
  },
  autoBadge: {
    backgroundColor: P.twGray200,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  autoBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: P.twGray500,
  },
  methodSelectBox: {
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: P.twGray200,
    backgroundColor: P.white,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  methodSelectText: {
    fontSize: 14,
    fontWeight: '600',
    color: P.twGray900,
  },
  dosageBox: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: P.twGray200,
    backgroundColor: P.white,
    padding: 12,
  },
  dosageText: {
    fontSize: 13,
    lineHeight: 18,
    color: P.twGray700,
  },
  qtyInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  qtyInput: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: P.twGray200,
    backgroundColor: P.white,
    paddingHorizontal: 14,
    fontSize: 16,
    fontWeight: '700',
    color: P.twGray900,
  },
  unitBtn: {
    width: 50,
    height: 48,
    borderRadius: 12,
    backgroundColor: P.twGray100,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  unitBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: P.twGray700,
  },
  phiInput: {
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: P.twGray200,
    backgroundColor: P.white,
    paddingHorizontal: 14,
    fontSize: 16,
    fontWeight: '700',
    color: P.twGray900,
  },
  costCard: {
    backgroundColor: '#eef8f1',
    borderWidth: 1.2,
    borderColor: '#81c784',
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  costLeftRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  calcIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#a5d6a7',
    backgroundColor: P.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  costFormula: {
    fontSize: 11,
    fontWeight: '700',
    color: P.twGray500,
    letterSpacing: 0.4,
  },
  costAmount: {
    fontSize: 20,
    fontWeight: '700',
    color: P.twGray900,
    marginTop: 2,
  },
  editableBadge: {
    backgroundColor: P.white,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#a5d6a7',
  },
  editableBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: P.forestGreen,
    letterSpacing: 0.3,
  },
  dateBox: {
    height: 50,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: P.twGray200,
    backgroundColor: P.white,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  dateText: {
    fontSize: 15,
    fontWeight: '700',
    color: P.twGray900,
  },
  dateDaysBadge: {
    backgroundColor: P.twGray100,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  dateDaysBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: P.twGray500,
  },
  saveBtn: {
    height: 52,
    borderRadius: 14,
    backgroundColor: P.forestGreen,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 22,
    shadowColor: P.black,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  saveBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: P.white,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContainer: {
    width: '100%',
    backgroundColor: P.white,
    borderRadius: 18,
    padding: 20,
    shadowColor: P.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: P.twGray100,
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: P.twGray900,
  },
  modalItem: {
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: P.twGray50,
  },
  modalItemSelected: {
    backgroundColor: P.twGreen50,
    borderRadius: 8,
  },
  modalItemText: {
    fontSize: 14.5,
    fontWeight: '600',
    color: P.twGray900,
  },
  modalItemTextSelected: {
    color: P.forestGreen,
    fontWeight: '700',
  },
  modalSubItemText: {
    fontSize: 12,
    color: P.twGray500,
    marginTop: 2,
  },
});
