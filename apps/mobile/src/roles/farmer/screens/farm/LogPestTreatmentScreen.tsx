import React, { useEffect, useState } from 'react';
import {
  Alert,
  BackHandler,
  Image,
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

function PestBugIcon({ size = 16, color = P.deepPurple600 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="5" stroke={color} strokeWidth="2" />
      <Path
        d="M12 7V3.5M7 12H3.5M20.5 12H17M7.5 7.5L5 5M19 5l-2.5 2.5M7.5 16.5L5 19M19 19l-2.5-2.5"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
      />
    </Svg>
  );
}

function CameraIcon({ size = 16, color = P.twGray500 }: { size?: number; color?: string }) {
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

function CameraPlusIcon({ size = 22, color = P.deepPurple600 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M21 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle cx="10" cy="13" r="3.5" stroke={color} strokeWidth="1.8" />
      <Path d="M19 10v4M17 12h4" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function CrossMedicalIcon({ size = 16, color = P.forestGreen }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M9 3h6v6h6v6h-6v6H9v-6H3V9h6V3z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function CalendarIcon({ size = 15, color = P.twGray600 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="4" width="18" height="18" rx="3" stroke={color} strokeWidth="2" />
      <Line x1="3" y1="10" x2="21" y2="10" stroke={color} strokeWidth="2" />
      <Line x1="8" y1="2" x2="8" y2="6" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="16" y1="2" x2="16" y2="6" stroke={color} strokeWidth="2" strokeLinecap="round" />
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

function CloseIcon({ size = 16, color = P.white }: { size?: number; color?: string }) {
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
// Pest & Treatment Data Models
// ─────────────────────────────────────────────

interface PestItem {
  id: string;
  name: string;
  scientificName: string;
  season: string;
  type: 'Disease' | 'Pest' | 'Deficiency';
  severity: 'High' | 'Medium' | 'Low';
  recommendedTreatment: string;
  intervalDays: string;
  phiDays: string;
}

const PEST_LIST: PestItem[] = [
  {
    id: 'p1',
    name: 'Early Blight',
    scientificName: 'Alternaria solani',
    season: 'Jul-Sep',
    type: 'Disease',
    severity: 'High',
    recommendedTreatment: 'Bordeaux mixture',
    intervalDays: '7',
    phiDays: '7',
  },
  {
    id: 'p2',
    name: 'Fruit Borer',
    scientificName: 'Helicoverpa armigera',
    season: 'Aug-Oct',
    type: 'Pest',
    severity: 'High',
    recommendedTreatment: 'Neem oil spray (1500 ppm)',
    intervalDays: '10',
    phiDays: '3',
  },
  {
    id: 'p3',
    name: 'Leaf Curl Virus',
    scientificName: 'Begomovirus / Whitefly vector',
    season: 'Year-round',
    type: 'Disease',
    severity: 'High',
    recommendedTreatment: 'Agniastra + Yellow Sticky Traps',
    intervalDays: '7',
    phiDays: '0',
  },
  {
    id: 'p4',
    name: 'Powdery Mildew',
    scientificName: 'Leveillula taurica',
    season: 'Sep-Nov',
    type: 'Disease',
    severity: 'Medium',
    recommendedTreatment: 'Wettable Sulphur / Trichoderma',
    intervalDays: '12',
    phiDays: '5',
  },
  {
    id: 'p5',
    name: 'Aphids',
    scientificName: 'Aphis gossypii',
    season: 'Jul-Aug',
    type: 'Pest',
    severity: 'Medium',
    recommendedTreatment: 'Dashparni kashayam',
    intervalDays: '7',
    phiDays: '0',
  },
];

const TREATMENTS = [
  'Bordeaux mixture',
  'Neem oil spray (1500 ppm)',
  'Agniastra + Yellow Sticky Traps',
  'Wettable Sulphur / Trichoderma',
  'Dashparni kashayam',
  'Brahmastra decoction',
];

const SEVERITIES: Array<'High' | 'Medium' | 'Low'> = ['High', 'Medium', 'Low'];
const TYPES: Array<'Disease' | 'Pest' | 'Deficiency'> = ['Disease', 'Pest', 'Deficiency'];

export interface LogPestTreatmentScreenProps {
  crop?: CropItem | null | undefined;
  onBack?: (() => void) | undefined;
  onSave?: ((data?: any) => void) | undefined;
}

export function LogPestTreatmentScreen({
  crop,
  onBack,
  onSave,
}: LogPestTreatmentScreenProps): React.JSX.Element {
  // Hardware back button for Android
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

  // Selected crop (defaults to Tomato for Pest check)
  const initialCrop =
    crop ??
    localProduceCropsCache.find((c) => c.name.toLowerCase().includes('tomato')) ??
    localProduceCropsCache[1] ??
    localProduceCropsCache[0];

  const [selectedCrop, setSelectedCrop] = useState<CropItem | null>(initialCrop ?? null);

  // Selected pest & details
  const [selectedPest, setSelectedPest] = useState<PestItem>(PEST_LIST[0]!);
  const [type, setType] = useState<'Disease' | 'Pest' | 'Deficiency'>(PEST_LIST[0]!.type);
  const [severity, setSeverity] = useState<'High' | 'Medium' | 'Low'>(PEST_LIST[0]!.severity);
  const [treatment, setTreatment] = useState<string>(PEST_LIST[0]!.recommendedTreatment);
  const [intervalDays, setIntervalDays] = useState<string>(PEST_LIST[0]!.intervalDays);
  const [phiDays, setPhiDays] = useState<string>(PEST_LIST[0]!.phiDays);
  const [hasPhoto, setHasPhoto] = useState<boolean>(true);
  const [nextDate, setNextDate] = useState<string>('24 Jul 2026');

  // Modals
  const [showCropModal, setShowCropModal] = useState(false);
  const [showPestModal, setShowPestModal] = useState(false);
  const [showTypeModal, setShowTypeModal] = useState(false);
  const [showSeverityModal, setShowSeverityModal] = useState(false);
  const [showTreatmentModal, setShowTreatmentModal] = useState(false);

  const handleSelectPest = (pest: PestItem) => {
    setSelectedPest(pest);
    setType(pest.type);
    setSeverity(pest.severity);
    setTreatment(pest.recommendedTreatment);
    setIntervalDays(pest.intervalDays);
    setPhiDays(pest.phiDays);
    setShowPestModal(false);
  };

  const handleSave = () => {
    Alert.alert(
      'Treatment Logged',
      `${treatment} treatment for ${selectedPest.name} saved successfully.`,
      [
        {
          text: 'OK',
          onPress: () => {
            if (onSave) {
              onSave({
                crop: selectedCrop,
                pest: selectedPest,
                type,
                severity,
                treatment,
                intervalDays,
                phiDays,
                hasPhoto,
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
          <Text style={styles.headerTitle}>Log Pest Treatment</Text>
          <Text style={styles.headerSubtitle}>Record a pest / disease issue</Text>
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
        {/* Field 1: Crop / Area selector */}
        <View style={styles.formGroup}>
          <View style={styles.labelRow}>
            <FieldBoxIcon size={15} color={P.forestGreen} />
            <Text style={styles.label}>
              Crop / Area <Text style={styles.requiredAsterisk}>*</Text>
            </Text>
          </View>

          <TouchableOpacity
            style={styles.selectBoxGreen}
            onPress={() => setShowCropModal(true)}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Select Crop / Area"
          >
            <Text style={styles.selectBoxText}>
              {selectedCrop
                ? `${selectedCrop.zone} (${selectedCrop.name})`
                : 'Zone 2 — Lower Slope (Tomato)'}
            </Text>
            <ChevronDownIcon size={18} color={P.forestGreen} />
          </TouchableOpacity>
        </View>

        {/* Field 2: Pest / disease selector */}
        <View style={styles.formGroup}>
          <View style={styles.labelRow}>
            <PestBugIcon size={16} color={P.deepPurple600} />
            <Text style={styles.label}>
              Pest / disease <Text style={styles.requiredAsterisk}>*</Text>
            </Text>
          </View>

          <TouchableOpacity
            style={styles.selectBoxPurple}
            onPress={() => setShowPestModal(true)}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Select Pest or disease"
          >
            <Text style={styles.selectBoxText}>{selectedPest.name}</Text>
            <ChevronDownIcon size={18} color={P.deepPurple600} />
          </TouchableOpacity>

          <Text style={styles.helpText}>
            Filtered to pests known to affect {selectedCrop?.name ?? 'Tomato'} only.
          </Text>
        </View>

        {/* Pest Info Badge */}
        <View style={styles.pestInfoCard}>
          <View style={styles.pestInfoHeaderRow}>
            <View style={styles.pestTitleRow}>
              <View style={styles.redDot} />
              <Text style={styles.scientificNameText}>{selectedPest.scientificName}</Text>
            </View>

            <View style={styles.seasonBadge}>
              <CalendarIcon size={12} color={P.twGray500} />
              <Text style={styles.seasonBadgeText}>{selectedPest.season}</Text>
            </View>
          </View>

          <Text style={styles.pestSubNote}>
            {selectedPest.type} · typically {selectedPest.severity} severity
          </Text>
        </View>

        {/* Row: Type & Severity */}
        <View style={styles.rowTwoCols}>
          {/* Type */}
          <View style={styles.col}>
            <Text style={styles.subLabel}>Type</Text>
            <TouchableOpacity
              style={styles.inputBox}
              onPress={() => setShowTypeModal(true)}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel="Select Type"
            >
              <Text style={styles.inputBoxText}>{type}</Text>
              <ChevronDownIcon size={18} color={P.twGray500} />
            </TouchableOpacity>
          </View>

          {/* Severity */}
          <View style={styles.col}>
            <Text style={styles.subLabel}>Severity</Text>
            <TouchableOpacity
              style={styles.inputBox}
              onPress={() => setShowSeverityModal(true)}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel="Select Severity"
            >
              <View style={styles.severityRow}>
                <View
                  style={[
                    styles.severityDot,
                    {
                      backgroundColor:
                        severity === 'High'
                          ? P.twRed500
                          : severity === 'Medium'
                          ? P.twAmber600
                          : P.twGreen500,
                    },
                  ]}
                />
                <Text style={styles.inputBoxText}>{severity}</Text>
              </View>
              <ChevronDownIcon size={18} color={P.twGray500} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Identification photo */}
        <View style={styles.formGroup}>
          <View style={styles.labelRow}>
            <CameraIcon size={16} color={P.twGray600} />
            <Text style={styles.subLabelNoMargin}>Identification photo</Text>
          </View>

          <View style={styles.photoRow}>
            {hasPhoto && (
              <View style={styles.photoThumbContainer}>
                <Image
                  source={{
                    uri: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=400&auto=format&fit=crop&q=85',
                  }}
                  style={styles.photoThumb}
                />
                <TouchableOpacity
                  style={styles.removePhotoBtn}
                  onPress={() => setHasPhoto(false)}
                  activeOpacity={0.7}
                  accessibilityRole="button"
                  accessibilityLabel="Remove photo"
                >
                  <CloseIcon size={12} color={P.white} />
                </TouchableOpacity>
              </View>
            )}

            <TouchableOpacity
              style={styles.addPhotoBtn}
              onPress={() => setHasPhoto(true)}
              activeOpacity={0.75}
              accessibilityRole="button"
              accessibilityLabel="Take or upload identification photo"
            >
              <CameraPlusIcon size={24} color={P.deepPurple600} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Recommended treatment selector */}
        <View style={styles.formGroup}>
          <View style={styles.labelRow}>
            <CrossMedicalIcon size={16} color={P.forestGreen} />
            <Text style={styles.label}>
              Recommended treatment <Text style={styles.requiredAsterisk}>*</Text>
            </Text>
          </View>

          <TouchableOpacity
            style={styles.selectBoxGreen}
            onPress={() => setShowTreatmentModal(true)}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Select Recommended treatment"
          >
            <Text style={styles.selectBoxText}>{treatment}</Text>
            <ChevronDownIcon size={18} color={P.forestGreen} />
          </TouchableOpacity>

          <Text style={styles.helpText}>
            Suggested from the library · any approved input can be chosen instead.
          </Text>
        </View>

        {/* Row: Interval (days) & PHI (days) */}
        <View style={styles.rowTwoCols}>
          {/* Interval */}
          <View style={styles.col}>
            <Text style={styles.subLabel}>Interval (days)</Text>
            <TextInput
              style={styles.numInput}
              value={intervalDays}
              onChangeText={setIntervalDays}
              keyboardType="numeric"
              accessibilityLabel="Interval in days"
            />
          </View>

          {/* PHI (days) */}
          <View style={styles.col}>
            <Text style={styles.subLabel}>PHI (days)</Text>
            <View style={styles.autoFieldBox}>
              <TextInput
                style={styles.phiInputText}
                value={phiDays}
                onChangeText={setPhiDays}
                keyboardType="numeric"
                accessibilityLabel="PHI in days"
              />
              <View style={styles.autoBadge}>
                <Text style={styles.autoBadgeText}>AUTO</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Next application date */}
        <View style={styles.formGroup}>
          <View style={styles.labelRow}>
            <CalendarIcon size={16} color={P.twGray600} />
            <Text style={styles.subLabelNoMargin}>Next application date</Text>
          </View>

          <View style={styles.dateBox}>
            <Text style={styles.dateText}>{nextDate}</Text>
            <View style={styles.dateDaysBadge}>
              <Text style={styles.dateDaysBadgeText}>TODAY +7</Text>
            </View>
          </View>
        </View>

        {/* Bottom Button: Save treatment */}
        <TouchableOpacity
          style={styles.saveBtn}
          onPress={handleSave}
          activeOpacity={0.88}
          accessibilityRole="button"
          accessibilityLabel="Save treatment"
        >
          <CheckmarkIcon size={18} color={P.white} />
          <Text style={styles.saveBtnText}>Save treatment</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Modal: Select Crop / Area */}
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
              <Text style={styles.modalTitle}>Select Crop / Area</Text>
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

      {/* Modal: Select Pest / Disease */}
      <Modal
        visible={showPestModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowPestModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowPestModal(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Pest / Disease</Text>
              <TouchableOpacity onPress={() => setShowPestModal(false)}>
                <CloseIcon size={18} color={P.twGray800} />
              </TouchableOpacity>
            </View>
            {PEST_LIST.map((p) => {
              const isSelected = selectedPest.id === p.id;
              return (
                <TouchableOpacity
                  key={p.id}
                  style={[styles.modalItem, isSelected && styles.modalItemSelected]}
                  onPress={() => handleSelectPest(p)}
                >
                  <Text
                    style={[
                      styles.modalItemText,
                      isSelected && styles.modalItemTextSelected,
                    ]}
                  >
                    {p.name}
                  </Text>
                  <Text style={styles.modalSubItemText}>
                    {p.scientificName} · {p.season}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Modal: Select Type */}
      <Modal
        visible={showTypeModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowTypeModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowTypeModal(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Issue Type</Text>
              <TouchableOpacity onPress={() => setShowTypeModal(false)}>
                <CloseIcon size={18} color={P.twGray800} />
              </TouchableOpacity>
            </View>
            {TYPES.map((t) => {
              const isSelected = type === t;
              return (
                <TouchableOpacity
                  key={t}
                  style={[styles.modalItem, isSelected && styles.modalItemSelected]}
                  onPress={() => {
                    setType(t);
                    setShowTypeModal(false);
                  }}
                >
                  <Text
                    style={[
                      styles.modalItemText,
                      isSelected && styles.modalItemTextSelected,
                    ]}
                  >
                    {t}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Modal: Select Severity */}
      <Modal
        visible={showSeverityModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSeverityModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowSeverityModal(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Severity Level</Text>
              <TouchableOpacity onPress={() => setShowSeverityModal(false)}>
                <CloseIcon size={18} color={P.twGray800} />
              </TouchableOpacity>
            </View>
            {SEVERITIES.map((s) => {
              const isSelected = severity === s;
              return (
                <TouchableOpacity
                  key={s}
                  style={[styles.modalItem, isSelected && styles.modalItemSelected]}
                  onPress={() => {
                    setSeverity(s);
                    setShowSeverityModal(false);
                  }}
                >
                  <Text
                    style={[
                      styles.modalItemText,
                      isSelected && styles.modalItemTextSelected,
                    ]}
                  >
                    {s} Severity
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Modal: Select Treatment */}
      <Modal
        visible={showTreatmentModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowTreatmentModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowTreatmentModal(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Recommended Treatment</Text>
              <TouchableOpacity onPress={() => setShowTreatmentModal(false)}>
                <CloseIcon size={18} color={P.twGray800} />
              </TouchableOpacity>
            </View>
            {TREATMENTS.map((item) => {
              const isSelected = treatment === item;
              return (
                <TouchableOpacity
                  key={item}
                  style={[styles.modalItem, isSelected && styles.modalItemSelected]}
                  onPress={() => {
                    setTreatment(item);
                    setShowTreatmentModal(false);
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
  subLabel: {
    fontSize: 13.5,
    fontWeight: '700',
    color: P.twGray800,
    marginBottom: 6,
  },
  subLabelNoMargin: {
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
  selectBoxPurple: {
    height: 50,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: P.deepPurple600,
    backgroundColor: P.white,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectBoxText: {
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
  pestInfoCard: {
    backgroundColor: '#fbf9ff',
    borderWidth: 1,
    borderColor: '#e9d5ff',
    borderRadius: 14,
    padding: 14,
    marginTop: 12,
  },
  pestInfoHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pestTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  redDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: P.twRed500,
    marginRight: 8,
  },
  scientificNameText: {
    fontSize: 14.5,
    fontWeight: '700',
    fontStyle: 'italic',
    color: P.twGray900,
  },
  seasonBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: P.white,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 4,
    borderWidth: 1,
    borderColor: P.twGray200,
  },
  seasonBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: P.twGray600,
  },
  pestSubNote: {
    fontSize: 12,
    color: P.twGray500,
    marginTop: 4,
    marginLeft: 16,
  },
  rowTwoCols: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 14,
  },
  col: {
    flex: 1,
  },
  inputBox: {
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
  inputBoxText: {
    fontSize: 14,
    fontWeight: '600',
    color: P.twGray900,
  },
  severityRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  severityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  photoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  photoThumbContainer: {
    position: 'relative',
    marginRight: 12,
  },
  photoThumb: {
    width: 64,
    height: 64,
    borderRadius: 12,
    backgroundColor: P.twGray100,
  },
  removePhotoBtn: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addPhotoBtn: {
    width: 64,
    height: 64,
    borderRadius: 12,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: P.deepPurple600,
    backgroundColor: P.twPurple100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  numInput: {
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
  phiInputText: {
    fontSize: 16,
    fontWeight: '700',
    color: P.twGray900,
    flex: 1,
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
    backgroundColor: P.deepPurple600,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 24,
    shadowColor: P.black,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
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
    backgroundColor: P.twPurple100,
    borderRadius: 8,
  },
  modalItemText: {
    fontSize: 14.5,
    fontWeight: '600',
    color: P.twGray900,
  },
  modalItemTextSelected: {
    color: P.deepPurple600,
    fontWeight: '700',
  },
  modalSubItemText: {
    fontSize: 12,
    color: P.twGray500,
    marginTop: 2,
  },
});
