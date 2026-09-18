import React, { useEffect, useState } from 'react';
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
import Svg, { Path } from 'react-native-svg';
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

// ─────────────────────────────────────────────
// Types & Initial Data
// ─────────────────────────────────────────────

export type MoistureLevel = 'Dry' | 'Moist' | 'Wet';

interface ZoneMoisture {
  id: string;
  name: string;
  lastUpdated: string;
  currentLevel: MoistureLevel;
}

const INITIAL_ZONES: ZoneMoisture[] = [
  {
    id: 'z1',
    name: 'Zone 1 — North Slope',
    lastUpdated: 'Last updated today',
    currentLevel: 'Moist',
  },
  {
    id: 'z2',
    name: 'Zone 2 — Terrace Field',
    lastUpdated: 'Last updated 2 days ago',
    currentLevel: 'Dry',
  },
  {
    id: 'z3',
    name: 'Zone 3 — Lower Basin',
    lastUpdated: 'Last updated 4 days ago',
    currentLevel: 'Wet',
  },
];

export interface SoilMoistureTrackingScreenProps {
  onBack?: (() => void) | undefined;
}

// ─────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────

export function SoilMoistureTrackingScreen({
  onBack,
}: SoilMoistureTrackingScreenProps): React.JSX.Element {
  const [zones, setZones] = useState<ZoneMoisture[]>(INITIAL_ZONES);

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

  const handleSelectLevel = (zoneId: string, level: MoistureLevel) => {
    setZones((prev) =>
      prev.map((z) =>
        z.id === zoneId
          ? {
              ...z,
              currentLevel: level,
              lastUpdated: 'Last updated just now',
            }
          : z,
      ),
    );
  };

  const getOptionStyles = (level: MoistureLevel, isSelected: boolean) => {
    if (!isSelected) {
      return {
        btnStyle: styles.optionBtnInactive,
        textStyle: styles.optionTextInactive,
      };
    }

    switch (level) {
      case 'Dry':
        return {
          btnStyle: styles.optionBtnDryActive,
          textStyle: styles.optionTextDryActive,
        };
      case 'Moist':
        return {
          btnStyle: styles.optionBtnMoistActive,
          textStyle: styles.optionTextMoistActive,
        };
      case 'Wet':
        return {
          btnStyle: styles.optionBtnWetActive,
          textStyle: styles.optionTextWetActive,
        };
    }
  };

  const MOISTURE_OPTIONS: MoistureLevel[] = ['Dry', 'Moist', 'Wet'];

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
            <Text style={styles.headerTitle}>Soil Moisture Tracking</Text>
            <Text style={styles.headerSubtitle}>Manual visual observations per zone</Text>
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {zones.map((zone) => (
          <View key={zone.id} style={styles.zoneCard}>
            <Text style={styles.zoneName}>{zone.name}</Text>
            <Text style={styles.lastUpdatedText}>{zone.lastUpdated}</Text>

            <View style={styles.optionsRow}>
              {MOISTURE_OPTIONS.map((opt) => {
                const isSelected = zone.currentLevel === opt;
                const { btnStyle, textStyle } = getOptionStyles(opt, isSelected);

                return (
                  <TouchableOpacity
                    key={opt}
                    style={[styles.optionBtnBase, btnStyle]}
                    onPress={() => handleSelectLevel(zone.id, opt)}
                    activeOpacity={0.7}
                    accessibilityRole="button"
                    accessibilityState={{ selected: isSelected }}
                    accessibilityLabel={`${zone.name} moisture ${opt}`}
                  >
                    <Text style={[styles.optionTextBase, textStyle]}>{opt}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        ))}
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
    padding: 16,
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
  },
  lastUpdatedText: {
    fontSize: 12,
    fontWeight: '400',
    color: P.twGray400,
    marginTop: 2,
    marginBottom: 14,
  },
  optionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  optionBtnBase: {
    flex: 1,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
  },
  optionTextBase: {
    fontSize: 13,
    fontWeight: '700',
  },
  // Inactive
  optionBtnInactive: {
    backgroundColor: P.white,
    borderColor: P.twGray200,
  },
  optionTextInactive: {
    color: P.twGray500,
  },
  // Dry Active
  optionBtnDryActive: {
    backgroundColor: P.orange50,
    borderColor: P.twAmber800,
  },
  optionTextDryActive: {
    color: P.twAmber800,
  },
  // Moist Active
  optionBtnMoistActive: {
    backgroundColor: P.twGreen50,
    borderColor: P.forestGreen,
  },
  optionTextMoistActive: {
    color: P.forestGreen,
  },
  // Wet Active
  optionBtnWetActive: {
    backgroundColor: P.twBlue50,
    borderColor: P.twBlue700,
  },
  optionTextWetActive: {
    color: P.twBlue700,
  },
});
