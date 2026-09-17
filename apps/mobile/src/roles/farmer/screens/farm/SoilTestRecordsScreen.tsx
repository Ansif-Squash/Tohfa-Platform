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

function MicroscopeIcon({ size = 22, color = P.forestGreen }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M6 18h12M10 21h4M9 3h3v8H9zM12 6h2M17 11a5 5 0 01-5 5H9"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle cx="9" cy="14" r="1.5" fill={color} />
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
// Types & Sample Data
// ─────────────────────────────────────────────

export interface SoilTestRecordItem {
  id: string;
  zoneTitle: string;
  timeAgo: string;
  lab: string;
  phValue: string;
}

const TEST_RECORDS: SoilTestRecordItem[] = [
  {
    id: 'rec-1',
    zoneTitle: 'North Slope — Zone 1',
    timeAgo: '3 weeks ago',
    lab: 'AgriTest Coimbatore',
    phValue: 'pH 6.4',
  },
  {
    id: 'rec-2',
    zoneTitle: 'Terrace Field — Zone 2',
    timeAgo: '2 months ago',
    lab: 'AgriTest Coimbatore',
    phValue: 'pH 6.1',
  },
  {
    id: 'rec-3',
    zoneTitle: 'Lower Basin — Zone 3',
    timeAgo: '4 months ago',
    lab: 'AgriTest Coimbatore',
    phValue: 'pH 5.9',
  },
];

export interface SoilTestRecordsScreenProps {
  onBack?: (() => void) | undefined;
  onNavigateToRecordDetail?: ((recordId: string) => void) | undefined;
  onUploadNewTest?: (() => void) | undefined;
}

// ─────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────

export function SoilTestRecordsScreen({
  onBack,
  onNavigateToRecordDetail,
  onUploadNewTest,
}: SoilTestRecordsScreenProps): React.JSX.Element {
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
            <Text style={styles.headerTitle}>Soil Test Records</Text>
            <Text style={styles.headerSubtitle}>Upload, track reminders, view history</Text>
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.sectionHeading}>Test history</Text>

        <View style={styles.recordsList}>
          {TEST_RECORDS.map((record) => (
            <TouchableOpacity
              key={record.id}
              style={styles.recordCard}
              activeOpacity={0.8}
              onPress={() => onNavigateToRecordDetail?.(record.id)}
              accessibilityRole="button"
              accessibilityLabel={`${record.zoneTitle}, ${record.phValue}, tested ${record.timeAgo}`}
            >
              <View style={styles.iconBadge}>
                <MicroscopeIcon size={22} color={P.forestGreen} />
              </View>

              <View style={styles.recordInfo}>
                <Text style={styles.recordTitle}>{record.zoneTitle}</Text>
                <Text style={styles.recordMeta}>
                  {record.timeAgo} · Lab: {record.lab}
                </Text>
              </View>

              <Text style={styles.phText}>{record.phValue}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* ── Bottom Fixed Button ── */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.uploadBtn}
          onPress={onUploadNewTest}
          activeOpacity={0.88}
          accessibilityRole="button"
          accessibilityLabel="Upload New Soil Test"
        >
          <PlusIcon size={18} color={P.white} />
          <Text style={styles.uploadBtnText}>Upload New Soil Test</Text>
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
    paddingTop: 18,
    paddingBottom: 24,
  },
  sectionHeading: {
    fontSize: 13,
    fontWeight: '700',
    color: P.twGray600,
    marginBottom: 12,
    letterSpacing: 0.2,
  },
  recordsList: {
    gap: 12,
  },
  recordCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: P.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: P.twGray200,
    paddingHorizontal: 14,
    paddingVertical: 14,
    shadowColor: P.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  iconBadge: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: P.mintTintBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  recordInfo: {
    flex: 1,
    marginRight: 10,
  },
  recordTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: P.twGray900,
    letterSpacing: -0.2,
  },
  recordMeta: {
    fontSize: 12,
    fontWeight: '400',
    color: P.twGray500,
    marginTop: 3,
  },
  phText: {
    fontSize: 15,
    fontWeight: '800',
    color: P.twGray900,
  },
  bottomBar: {
    backgroundColor: P.white,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: Platform.OS === 'android' ? 14 : 10,
    borderTopWidth: 1,
    borderTopColor: P.twGray100,
  },
  uploadBtn: {
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
  uploadBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: P.white,
  },
});
