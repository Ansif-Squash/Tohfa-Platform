import React, { useState, useEffect } from 'react';
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
import Svg, { Circle, Path } from 'react-native-svg';
import { authPalette as P } from '../../theme';

// ─────────────────────────────────────────────
// Inline Vector Icons (strictly no emojis, no raw hex)
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

function LeafSproutIcon({ size = 20, color = P.forestGreen }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 22C6 22 4 17 4 12 4 6.5 8.5 2 12 2c3.5 0 8 4.5 8 10 0 5-2 10-8 10z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M12 22V10M12 14c3-1.5 5-1.5 5-1.5"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// ─────────────────────────────────────────────
// Types & Data
// ─────────────────────────────────────────────

export interface SoilHealthTrackerScreenProps {
  onBack?: (() => void) | undefined;
}

interface ZoneReading {
  ph: string;
  phDiff: string;
  isPhImproving: boolean;
  oc: string;
  ocDiff: string;
  isOcImproving: boolean;
  tds: string;
  tdsDiff: string;
  isTdsDown: boolean;
  chartBars: { month: string; value: number }[];
  insight: string;
}

const ZONE_DATA: Record<string, ZoneReading> = {
  'Zone 1 — North Slope': {
    ph: '6.4',
    phDiff: '↑ +0.2 vs last test',
    isPhImproving: true,
    oc: '2.1%',
    ocDiff: '↑ +0.3% vs last test',
    isOcImproving: true,
    tds: '180',
    tdsDiff: '↓ -12 ppm vs last test',
    isTdsDown: true,
    chartBars: [
      { month: 'Apr', value: 68 },
      { month: 'May', value: 62 },
      { month: 'Jun', value: 74 },
      { month: 'Jul', value: 82 },
      { month: 'Aug', value: 85 },
      { month: 'Sep', value: 92 },
    ],
    insight: 'Zone 1 trending healthy — pH and organic carbon both improving since your last two amendments.',
  },
  'Zone 2 — Terrace': {
    ph: '6.1',
    phDiff: '↑ +0.1 vs last test',
    isPhImproving: true,
    oc: '1.8%',
    ocDiff: '→ 0.0% vs last test',
    isOcImproving: true,
    tds: '210',
    tdsDiff: '↓ -5 ppm vs last test',
    isTdsDown: true,
    chartBars: [
      { month: 'Apr', value: 60 },
      { month: 'May', value: 60 },
      { month: 'Jun', value: 65 },
      { month: 'Jul', value: 70 },
      { month: 'Aug', value: 73 },
      { month: 'Sep', value: 75 },
    ],
    insight: 'Zone 2 steady — clay loam structure holds nutrients well. Recommended to add light gypsum.',
  },
  'Zone 3 — Lower Basin': {
    ph: '5.9',
    phDiff: '↓ -0.1 vs last test',
    isPhImproving: false,
    oc: '1.4%',
    ocDiff: '↓ -0.1% vs last test',
    isOcImproving: false,
    tds: '240',
    tdsDiff: '↑ +8 ppm vs last test',
    isTdsDown: false,
    chartBars: [
      { month: 'Apr', value: 75 },
      { month: 'May', value: 72 },
      { month: 'Jun', value: 68 },
      { month: 'Jul', value: 65 },
      { month: 'Aug', value: 62 },
      { month: 'Sep', value: 60 },
    ],
    insight: 'Zone 3 slightly acidic — application of agricultural lime (200 kg/acre) recommended before next sowing.',
  },
};

const ZONES = ['Zone 1 — North Slope', 'Zone 2 — Terrace', 'Zone 3 — Lower Basin'];

// ─────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────

export function SoilHealthTrackerScreen({ onBack }: SoilHealthTrackerScreenProps): React.JSX.Element {
  const [selectedZone, setSelectedZone] = useState<string>(ZONES[0] ?? 'Zone 1 — North Slope');

  // Android hardware back handler
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

  const currentData = ZONE_DATA[selectedZone] ?? ZONE_DATA['Zone 1 — North Slope']!;

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
            <Text style={styles.headerTitle}>Soil Health Tracker</Text>
            <Text style={styles.headerSubtitle}>pH, organic carbon & TDS over time</Text>
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Zone Filter Horizontal Pills ── */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.zonesRow}
        >
          {ZONES.map((zone) => {
            const isSelected = selectedZone === zone;
            return (
              <TouchableOpacity
                key={zone}
                style={[
                  styles.zoneChip,
                  isSelected ? styles.zoneChipActive : styles.zoneChipInactive,
                ]}
                onPress={() => setSelectedZone(zone)}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityLabel={zone}
              >
                <Text
                  style={[
                    styles.zoneChipText,
                    isSelected ? styles.zoneChipTextActive : styles.zoneChipTextInactive,
                  ]}
                >
                  {zone}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* ── Bar Chart Card: Soil pH ── */}
        <View style={styles.chartCard}>
          <View style={styles.chartHeader}>
            <View style={styles.greenDot} />
            <Text style={styles.chartTitle}>Soil pH</Text>
          </View>

          <View style={styles.barsContainer}>
            {currentData.chartBars.map((bar) => (
              <View key={bar.month} style={styles.barCol}>
                <View style={styles.barTrack}>
                  <View style={[styles.barFill, { height: `${bar.value}%` }]} />
                </View>
                <Text style={styles.barMonth}>{bar.month}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* ── Current Readings Card ── */}
        <View style={styles.readingsCard}>
          <Text style={styles.readingsTitle}>Current readings — {selectedZone.split(' — ')[0]}</Text>

          {/* Row 1: Soil pH */}
          <View style={styles.readingRow}>
            <View style={styles.readingLabelCol}>
              <View style={styles.readingDotTitle}>
                <View style={styles.greenDot} />
                <Text style={styles.readingParamName}>Soil pH</Text>
              </View>
            </View>
            <View style={styles.readingValueCol}>
              <Text style={styles.readingNumber}>{currentData.ph}</Text>
              <Text style={styles.trendUpText}>{currentData.phDiff}</Text>
            </View>
          </View>

          {/* Row 2: Organic Carbon */}
          <View style={styles.readingRow}>
            <View style={styles.readingLabelCol}>
              <View style={styles.readingDotTitle}>
                <View style={styles.amberDot} />
                <Text style={styles.readingParamName}>Organic Carbon</Text>
              </View>
            </View>
            <View style={styles.readingValueCol}>
              <Text style={styles.readingNumber}>{currentData.oc}</Text>
              <Text style={styles.trendUpText}>{currentData.ocDiff}</Text>
            </View>
          </View>

          {/* Row 3: TDS (ppm) */}
          <View style={[styles.readingRow, styles.lastReadingRow]}>
            <View style={styles.readingLabelCol}>
              <View style={styles.readingDotTitle}>
                <View style={styles.blueDot} />
                <Text style={styles.readingParamName}>TDS (ppm)</Text>
              </View>
            </View>
            <View style={styles.readingValueCol}>
              <Text style={styles.readingNumber}>{currentData.tds}</Text>
              <Text style={styles.trendDownText}>{currentData.tdsDiff}</Text>
            </View>
          </View>
        </View>

        {/* ── Insight Banner ── */}
        <View style={styles.insightBanner}>
          <View style={styles.insightIconCircle}>
            <LeafSproutIcon size={18} color={P.forestGreen} />
          </View>
          <Text style={styles.insightText}>{currentData.insight}</Text>
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
    fontSize: 20,
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
    paddingTop: 14,
    paddingBottom: 32,
  },
  zonesRow: {
    flexDirection: 'row',
    gap: 8,
    paddingBottom: 14,
  },
  zoneChip: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 20,
  },
  zoneChipActive: {
    backgroundColor: P.forestGreen,
  },
  zoneChipInactive: {
    backgroundColor: P.white,
    borderWidth: 1,
    borderColor: P.twGray200,
  },
  zoneChipText: {
    fontSize: 13,
  },
  zoneChipTextActive: {
    color: P.white,
    fontWeight: '700',
  },
  zoneChipTextInactive: {
    color: P.twGray700,
    fontWeight: '600',
  },
  chartCard: {
    backgroundColor: P.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: P.twGray200,
    padding: 16,
    marginBottom: 14,
    shadowColor: P.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  chartHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  chartTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    color: P.twGray900,
    marginLeft: 8,
  },
  greenDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: P.forestGreen,
  },
  amberDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: P.amber600,
  },
  blueDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: P.twBlue600,
  },
  barsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 100,
    paddingTop: 10,
    paddingHorizontal: 8,
  },
  barCol: {
    alignItems: 'center',
    flex: 1,
  },
  barTrack: {
    width: 28,
    height: 72,
    backgroundColor: P.twGray100,
    borderRadius: 6,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  barFill: {
    width: '100%',
    backgroundColor: P.forestGreen,
    borderRadius: 6,
  },
  barMonth: {
    fontSize: 11,
    fontWeight: '500',
    color: P.twGray500,
    marginTop: 6,
  },
  readingsCard: {
    backgroundColor: P.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: P.twGray200,
    padding: 16,
    marginBottom: 14,
    shadowColor: P.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  readingsTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    color: P.twGray900,
    marginBottom: 12,
  },
  readingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: P.twGray100,
  },
  lastReadingRow: {
    borderBottomWidth: 0,
    paddingBottom: 2,
  },
  readingLabelCol: {
    flex: 1,
  },
  readingDotTitle: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  readingParamName: {
    fontSize: 14,
    fontWeight: '600',
    color: P.twGray800,
    marginLeft: 8,
  },
  readingValueCol: {
    alignItems: 'flex-end',
  },
  readingNumber: {
    fontSize: 16,
    fontWeight: '800',
    color: P.twGray900,
  },
  trendUpText: {
    fontSize: 11,
    fontWeight: '600',
    color: P.forestGreen,
    marginTop: 2,
  },
  trendDownText: {
    fontSize: 11,
    fontWeight: '600',
    color: P.red700,
    marginTop: 2,
  },
  insightBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: P.mintTintBg,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: P.twGreen100,
    gap: 12,
  },
  insightIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: P.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  insightText: {
    flex: 1,
    fontSize: 12.5,
    fontWeight: '500',
    color: P.forestGreen,
    lineHeight: 18,
  },
});
