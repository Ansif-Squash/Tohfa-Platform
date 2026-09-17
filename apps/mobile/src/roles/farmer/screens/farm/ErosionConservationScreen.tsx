import React, { useEffect, useState } from 'react';
import {
  Alert,
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
import Svg, { Circle, Line, Path } from 'react-native-svg';
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

function CheckCircleIcon({ size = 18, color = P.forestGreen }: { size?: number; color?: string }) {
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

function AlertTriangleIcon({ size = 18, color = P.red700 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Line x1="12" y1="9" x2="12" y2="13" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Circle cx="12" cy="17" r="1" fill={color} />
    </Svg>
  );
}

function PlusIcon({ size = 18, color = P.white }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 5v14M5 12h14"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// ─────────────────────────────────────────────
// Types & Data
// ─────────────────────────────────────────────

type RiskLevel = 'Low Risk' | 'Moderate Risk' | 'High Risk';

interface ErosionZoneRecord {
  id: string;
  zoneName: string;
  loggedTime: string;
  risk: RiskLevel;
  practiceText: string;
  isWarning?: boolean;
}

const INITIAL_EROSION_RECORDS: ErosionZoneRecord[] = [
  {
    id: 'e1',
    zoneName: 'Zone 1 — North Slope',
    loggedTime: 'Logged 2 weeks ago',
    risk: 'Low Risk',
    practiceText: 'Contour planting in use',
  },
  {
    id: 'e2',
    zoneName: 'Zone 2 — Terrace Field',
    loggedTime: 'Logged 1 month ago',
    risk: 'Moderate Risk',
    practiceText: 'Terracing + cover crop planned',
  },
  {
    id: 'e3',
    zoneName: 'Zone 3 — Lower Basin',
    loggedTime: 'Logged 6 weeks ago',
    risk: 'High Risk',
    practiceText: 'Near stream boundary — no conservation practice logged yet',
    isWarning: true,
  },
];

export interface ErosionConservationScreenProps {
  onBack?: (() => void) | undefined;
  onLogErosionNote?: (() => void) | undefined;
}

// ─────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────

export function ErosionConservationScreen({
  onBack,
  onLogErosionNote,
}: ErosionConservationScreenProps): React.JSX.Element {
  const [records] = useState<ErosionZoneRecord[]>(INITIAL_EROSION_RECORDS);

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

  const handleLogNote = () => {
    if (onLogErosionNote) {
      onLogErosionNote();
    } else {
      Alert.alert(
        'Log Erosion Note',
        'Record erosion observations or updated conservation measures for a zone.',
        [{ text: 'OK' }],
      );
    }
  };

  const getRiskBadgeStyles = (risk: RiskLevel) => {
    switch (risk) {
      case 'Low Risk':
        return {
          container: styles.badgeLow,
          text: styles.badgeLowText,
        };
      case 'Moderate Risk':
        return {
          container: styles.badgeModerate,
          text: styles.badgeModerateText,
        };
      case 'High Risk':
        return {
          container: styles.badgeHigh,
          text: styles.badgeHighText,
        };
    }
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
            <Text style={styles.headerTitle}>Erosion & Conservation</Text>
            <Text style={styles.headerSubtitle}>Risk notes and conservation practices</Text>
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {records.map((item) => {
          const badge = getRiskBadgeStyles(item.risk);

          return (
            <View key={item.id} style={styles.zoneCard}>
              <View style={styles.cardHeaderRow}>
                <Text style={styles.zoneName}>{item.zoneName}</Text>
                <View style={[styles.badgeBase, badge.container]}>
                  <Text style={[styles.badgeTextBase, badge.text]}>{item.risk}</Text>
                </View>
              </View>

              <Text style={styles.loggedTime}>{item.loggedTime}</Text>

              <View style={styles.practiceRow}>
                {item.isWarning ? (
                  <AlertTriangleIcon size={18} color={P.red700} />
                ) : (
                  <CheckCircleIcon size={18} color={P.forestGreen} />
                )}
                <Text
                  style={[
                    styles.practiceText,
                    item.isWarning && styles.practiceTextWarning,
                  ]}
                >
                  {item.practiceText}
                </Text>
              </View>
            </View>
          );
        })}
      </ScrollView>

      {/* ── Bottom Button ── */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.logBtn}
          onPress={handleLogNote}
          activeOpacity={0.88}
          accessibilityRole="button"
          accessibilityLabel="Log Erosion Note"
        >
          <PlusIcon size={18} color={P.white} />
          <Text style={styles.logBtnText}>Log Erosion Note</Text>
        </TouchableOpacity>
      </View>
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
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  zoneName: {
    fontSize: 15,
    fontWeight: '700',
    color: P.twGray900,
  },
  badgeBase: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  badgeTextBase: {
    fontSize: 11.5,
    fontWeight: '700',
  },
  badgeLow: {
    backgroundColor: P.twGreen50,
    borderColor: P.twGreen100,
  },
  badgeLowText: {
    color: P.twGreen800,
  },
  badgeModerate: {
    backgroundColor: P.orange50,
    borderColor: P.twOrange200,
  },
  badgeModerateText: {
    color: P.twAmber800,
  },
  badgeHigh: {
    backgroundColor: P.red50,
    borderColor: P.red100,
  },
  badgeHighText: {
    color: P.red700,
  },
  loggedTime: {
    fontSize: 12,
    color: P.twGray400,
    marginTop: 3,
    marginBottom: 14,
  },
  practiceRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  practiceText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
    color: P.twGray700,
    lineHeight: 18,
  },
  practiceTextWarning: {
    color: P.red700,
  },
  bottomBar: {
    backgroundColor: P.white,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: Platform.OS === 'android' ? 14 : 10,
    borderTopWidth: 1,
    borderTopColor: P.twGray100,
  },
  logBtn: {
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
  logBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: P.white,
  },
});
