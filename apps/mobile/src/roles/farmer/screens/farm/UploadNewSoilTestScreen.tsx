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

// ─────────────────────────────────────────────
// Inline Vector Icons
// ─────────────────────────────────────────────

function ArrowBackIcon({ size = 20, color = P.twGreen800 }: { size?: number; color?: string }) {
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

function ChevronDownIcon({ size = 18, color = P.twGray500 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M6 9l6 6 6-6"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function CalendarIcon({ size = 18, color = P.twGray400 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="4" width="18" height="18" rx="3" stroke={color} strokeWidth="1.8" />
      <Line x1="16" y1="2" x2="16" y2="6" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <Line x1="8" y1="2" x2="8" y2="6" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <Line x1="3" y1="10" x2="21" y2="10" stroke={color} strokeWidth="1.8" />
    </Svg>
  );
}

function FlaskIcon({ size = 18, color = P.twGray400 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M10 2v5L4.5 17.5A2 2 0 006.3 20.5h11.4a2 2 0 001.8-3L14 7V2"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Line x1="8.5" y1="2" x2="15.5" y2="2" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <Line x1="7" y1="14" x2="17" y2="14" stroke={color} strokeWidth="1.5" strokeDasharray="2 2" />
    </Svg>
  );
}

function SproutLeafIcon({ size = 18, color = P.twGray400 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 21v-7M12 14c-2-2.5-5-2-6-1.5 0 3.5 2.5 5 6 1.5zM12 12c2-2.5 5-2 6-1.5 0 3.5-2.5 5-6 1.5z"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function DropletIcon({ size = 18, color = P.twGray400 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 2.69l5.66 5.66a8 8 0 11-11.31 0z"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function CameraPlusIcon({ size = 28, color = P.forestGreen }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle cx="12" cy="13" r="4" stroke={color} strokeWidth="1.8" />
      <Line x1="19" y1="3" x2="19" y2="7" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="17" y1="5" x2="21" y2="5" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function CheckCircleIcon({ size = 18, color = P.white }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2" />
      <Path
        d="M8 12l2.5 2.5L16 9"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

const ZONE_OPTIONS = [
  'Zone 1 — North Slope',
  'Zone 2 — Terrace Field',
  'Zone 3 — Lower Basin',
];

export interface UploadNewSoilTestScreenProps {
  onBack?: (() => void) | undefined;
  onSave?: (() => void) | undefined;
}

// ─────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────

export function UploadNewSoilTestScreen({
  onBack,
  onSave,
}: UploadNewSoilTestScreenProps): React.JSX.Element {
  const [selectedZone, setSelectedZone] = useState('Zone 1 — North Slope');
  const [testDate, setTestDate] = useState('Sep 15, 2026');
  const [ph, setPh] = useState('6.4');
  const [organicCarbon, setOrganicCarbon] = useState('2.1');
  const [tds, setTds] = useState('180');
  const [attachedFile, setAttachedFile] = useState<string | null>(null);
  const [zonePickerVisible, setZonePickerVisible] = useState(false);

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

  const handleAttachReport = () => {
    Alert.alert(
      'Attach Lab Report',
      'Choose source to attach lab report',
      [
        {
          text: 'Take Photo',
          onPress: () => setAttachedFile('lab_test_photo_sep2026.jpg'),
        },
        {
          text: 'Select PDF Document',
          onPress: () => setAttachedFile('kerala_agri_lab_report.pdf'),
        },
        { text: 'Cancel', style: 'cancel' },
      ],
    );
  };

  const handleSubmit = () => {
    if (!ph.trim() && !organicCarbon.trim()) {
      Alert.alert('Missing Info', 'Please enter at least pH or Organic Carbon value.');
      return;
    }

    Alert.alert(
      'Soil Test Submitted',
      `New soil test recorded for ${selectedZone}.\n\n• pH: ${ph || '—'}\n• OC: ${organicCarbon || '—'}%\n• TDS: ${tds || '—'} ppm`,
      [
        {
          text: 'OK',
          onPress: () => {
            if (onSave) {
              onSave();
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

      {/* ── Top Header ── */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={onBack}
            activeOpacity={0.7}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <ArrowBackIcon size={20} color={P.twGreen800} />
          </TouchableOpacity>

          <View style={styles.headerTitleGroup}>
            <Text style={styles.headerTag}>FR-F06</Text>
            <Text style={styles.headerTitle}>Upload New Soil Test</Text>
            <Text style={styles.headerSubtitle}>Enter results or upload the lab report</Text>
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Zone Selector ── */}
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Zone</Text>
          <TouchableOpacity
            style={styles.dropdownBtn}
            onPress={() => setZonePickerVisible(true)}
            activeOpacity={0.75}
            accessibilityRole="button"
            accessibilityLabel="Select zone"
          >
            <Text style={styles.dropdownText}>{selectedZone}</Text>
            <ChevronDownIcon size={18} color={P.twGray500} />
          </TouchableOpacity>
        </View>

        {/* ── Test Date ── */}
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Test date</Text>
          <View style={styles.inputContainer}>
            <CalendarIcon size={18} color={P.twGray400} />
            <TextInput
              style={styles.textInput}
              value={testDate}
              onChangeText={setTestDate}
              placeholder="Sep 15, 2026"
              placeholderTextColor={P.twGray400}
            />
          </View>
        </View>

        {/* ── Soil pH ── */}
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Soil pH</Text>
          <View style={styles.inputContainer}>
            <FlaskIcon size={18} color={P.twGray400} />
            <TextInput
              style={styles.textInput}
              value={ph}
              onChangeText={setPh}
              placeholder="e.g. 6.4"
              placeholderTextColor={P.twGray400}
              keyboardType="decimal-pad"
            />
          </View>
        </View>

        {/* ── Organic Carbon (%) ── */}
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Organic Carbon (%)</Text>
          <View style={styles.inputContainer}>
            <SproutLeafIcon size={18} color={P.twGray400} />
            <TextInput
              style={styles.textInput}
              value={organicCarbon}
              onChangeText={setOrganicCarbon}
              placeholder="e.g. 2.1"
              placeholderTextColor={P.twGray400}
              keyboardType="decimal-pad"
            />
          </View>
        </View>

        {/* ── TDS (ppm) ── */}
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>TDS (ppm)</Text>
          <View style={styles.inputContainer}>
            <DropletIcon size={18} color={P.twGray400} />
            <TextInput
              style={styles.textInput}
              value={tds}
              onChangeText={setTds}
              placeholder="e.g. 180"
              placeholderTextColor={P.twGray400}
              keyboardType="number-pad"
            />
          </View>
        </View>

        {/* ── Lab Report (optional) ── */}
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Lab report (optional)</Text>
          <TouchableOpacity
            style={styles.uploadCard}
            onPress={handleAttachReport}
            activeOpacity={0.75}
            accessibilityRole="button"
            accessibilityLabel="Attach lab report photo or PDF"
          >
            <CameraPlusIcon size={28} color={P.forestGreen} />
            <Text style={styles.uploadTitle}>
              {attachedFile ? attachedFile : 'Attach lab report photo or PDF'}
            </Text>
            <Text style={styles.uploadSubtitle}>
              {attachedFile ? 'Tap to change attached file' : 'Helps admin cross-verify readings'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* ── Bottom Submit Button ── */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.submitBtn}
          onPress={handleSubmit}
          activeOpacity={0.88}
          accessibilityRole="button"
          accessibilityLabel="Submit Soil Test"
        >
          <CheckCircleIcon size={18} color={P.white} />
          <Text style={styles.submitBtnText}>Submit Soil Test</Text>
        </TouchableOpacity>
      </View>

      {/* ── Zone Picker Modal ── */}
      <Modal
        visible={zonePickerVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setZonePickerVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setZonePickerVisible(false)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalHeading}>Select Zone</Text>
            {ZONE_OPTIONS.map((zone) => {
              const isSelected = selectedZone === zone;
              return (
                <TouchableOpacity
                  key={zone}
                  style={[styles.modalItem, isSelected && styles.modalItemSelected]}
                  onPress={() => {
                    setSelectedZone(zone);
                    setZonePickerVisible(false);
                  }}
                >
                  <Text
                    style={[styles.modalItemText, isSelected && styles.modalItemTextSelected]}
                  >
                    {zone}
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

// ─────────────────────────────────────────────
// Stylesheet
// ─────────────────────────────────────────────

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: P.white,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? 6 : 4,
    paddingBottom: 12,
    backgroundColor: P.white,
    borderBottomWidth: 1,
    borderBottomColor: P.twGray200,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backBtn: {
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
  headerTag: {
    fontSize: 11,
    fontWeight: '700',
    color: P.twGray500,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  headerTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: P.twGray900,
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 12.5,
    fontWeight: '500',
    color: P.twGray500,
    marginTop: 2,
  },
  scrollContainer: {
    flex: 1,
    backgroundColor: P.twGray50,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 32,
    gap: 16,
  },
  fieldGroup: {
    gap: 6,
  },
  fieldLabel: {
    fontSize: 12.5,
    fontWeight: '700',
    color: P.twGray700,
  },
  dropdownBtn: {
    height: 46,
    borderRadius: 12,
    backgroundColor: P.white,
    borderWidth: 1,
    borderColor: P.twGray200,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    shadowColor: P.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 2,
    elevation: 1,
  },
  dropdownText: {
    fontSize: 14,
    fontWeight: '600',
    color: P.twGray900,
  },
  inputContainer: {
    height: 46,
    borderRadius: 12,
    backgroundColor: P.white,
    borderWidth: 1,
    borderColor: P.twGray200,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    gap: 10,
    shadowColor: P.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 2,
    elevation: 1,
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    color: P.twGray900,
    paddingVertical: 0,
  },
  uploadCard: {
    backgroundColor: P.white,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: P.twGray200,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 22,
    paddingHorizontal: 16,
    gap: 6,
    shadowColor: P.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 2,
    elevation: 1,
  },
  uploadTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    color: P.twGray800,
    textAlign: 'center',
  },
  uploadSubtitle: {
    fontSize: 11.5,
    color: P.twGray400,
    textAlign: 'center',
  },
  bottomBar: {
    backgroundColor: P.white,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: Platform.OS === 'android' ? 14 : 10,
    borderTopWidth: 1,
    borderTopColor: P.twGray100,
  },
  submitBtn: {
    backgroundColor: P.forestGreen,
    height: 48,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: P.forestGreen,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
    gap: 8,
  },
  submitBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: P.white,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    width: '100%',
    backgroundColor: P.white,
    borderRadius: 16,
    padding: 20,
    gap: 8,
  },
  modalHeading: {
    fontSize: 16,
    fontWeight: '800',
    color: P.twGray900,
    marginBottom: 8,
  },
  modalItem: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  modalItemSelected: {
    backgroundColor: P.twGreen50,
  },
  modalItemText: {
    fontSize: 14,
    fontWeight: '600',
    color: P.twGray800,
  },
  modalItemTextSelected: {
    color: P.twGreen800,
    fontWeight: '700',
  },
});
