import React, { useEffect } from 'react';
import {
  BackHandler,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
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

function CalendarSproutIcon({ size = 20, color = P.forestGreen }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="4" width="18" height="18" rx="3" stroke={color} strokeWidth="1.8" />
      <Line x1="16" y1="2" x2="16" y2="6" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <Line x1="8" y1="2" x2="8" y2="6" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <Line x1="3" y1="10" x2="21" y2="10" stroke={color} strokeWidth="1.8" />
      <Path
        d="M12 17v-3M12 14c-1.2-1.5-3-1.2-3.5-1 0 2 1.5 3 3.5 1zM12 13c1.2-1.5 3-1.2 3.5-1 0 2-1.5 3-3.5 1z"
        stroke={color}
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// ─────────────────────────────────────────────
// Types & Data
// ─────────────────────────────────────────────

interface RotationStep {
  stepNum: number;
  label: string;
  crop: string;
  badgeBg: string;
  textColor: string;
}

interface ZoneRotation {
  zoneId: string;
  zoneName: string;
  steps: RotationStep[];
}

const ROTATION_DATA: ZoneRotation[] = [
  {
    zoneId: 'z1',
    zoneName: 'Zone 1 — North Slope',
    steps: [
      {
        stepNum: 1,
        label: 'Now',
        crop: 'Carrots',
        badgeBg: P.forestGreen,
        textColor: P.white,
      },
      {
        stepNum: 2,
        label: 'Next',
        crop: 'Legumes',
        badgeBg: P.twOrange500,
        textColor: P.white,
      },
      {
        stepNum: 3,
        label: 'Then',
        crop: 'Cabbage',
        badgeBg: P.twGray300,
        textColor: P.white,
      },
    ],
  },
  {
    zoneId: 'z2',
    zoneName: 'Zone 2 — Terrace Field',
    steps: [
      {
        stepNum: 1,
        label: 'Now',
        crop: 'Cabbage',
        badgeBg: P.forestGreen,
        textColor: P.white,
      },
      {
        stepNum: 2,
        label: 'Next',
        crop: 'Cover crop',
        badgeBg: P.twOrange500,
        textColor: P.white,
      },
      {
        stepNum: 3,
        label: 'Then',
        crop: 'Carrots',
        badgeBg: P.twGray300,
        textColor: P.white,
      },
    ],
  },
];

export interface CropRotationScreenProps {
  onBack?: (() => void) | undefined;
}

// ─────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────

export function CropRotationScreen({ onBack }: CropRotationScreenProps): React.JSX.Element {
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
            <Text style={styles.headerTitle}>Crop Rotation & Cover Cropping</Text>
            <Text style={styles.headerSubtitle}>Plan rotation cycles and cover windows</Text>
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Zone Rotation Cards ── */}
        {ROTATION_DATA.map((item) => (
          <View key={item.zoneId} style={styles.zoneCard}>
            <Text style={styles.zoneName}>{item.zoneName}</Text>

            <View style={styles.stepsRow}>
              {item.steps.map((step) => (
                <View key={step.stepNum} style={styles.stepColumn}>
                  <View style={[styles.stepBadge, { backgroundColor: step.badgeBg }]}>
                    <Text style={[styles.stepNumber, { color: step.textColor }]}>
                      {step.stepNum}
                    </Text>
                  </View>
                  <Text style={styles.stepLabel}>{step.label}</Text>
                  <Text style={styles.stepCrop}>{step.crop}</Text>
                </View>
              ))}
            </View>
          </View>
        ))}

        {/* ── Cover Crop Window Banner ── */}
        <View style={styles.coverCropBanner}>
          <View style={styles.coverCropIconBox}>
            <CalendarSproutIcon size={20} color={P.forestGreen} />
          </View>
          <Text style={styles.coverCropText}>
            <Text style={styles.coverCropBold}>Cover crop window: </Text>
            Zone 2 is due for a cover crop (mustard or clover) starting late October — recommended
            before next carrot cycle.
          </Text>
        </View>
      </ScrollView>
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
    gap: 14,
  },
  zoneCard: {
    backgroundColor: P.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: P.twGray200,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 20,
    shadowColor: P.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  zoneName: {
    fontSize: 15,
    fontWeight: '700',
    color: P.twGray900,
    marginBottom: 16,
  },
  stepsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  stepColumn: {
    alignItems: 'center',
    flex: 1,
  },
  stepBadge: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  stepNumber: {
    fontSize: 14,
    fontWeight: '800',
  },
  stepLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: P.twGray500,
    marginBottom: 4,
  },
  stepCrop: {
    fontSize: 13.5,
    fontWeight: '700',
    color: P.twGray900,
    textAlign: 'center',
  },
  coverCropBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: P.mintTintBg,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: P.twGreen100,
    gap: 12,
    marginTop: 4,
  },
  coverCropIconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: P.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  coverCropText: {
    flex: 1,
    fontSize: 12.5,
    color: P.forestGreen,
    lineHeight: 18,
  },
  coverCropBold: {
    fontWeight: '700',
    color: P.twGreen900,
  },
});
