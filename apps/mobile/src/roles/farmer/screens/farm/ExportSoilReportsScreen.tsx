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
import Svg, { Line, Path, Rect } from 'react-native-svg';
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

function FilePdfIcon({ size = 26, color = P.forestGreen }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="4" y="3" width="16" height="18" rx="2" stroke={color} strokeWidth="1.8" />
      <Path d="M8 8h8M8 12h8M8 16h5" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </Svg>
  );
}

function DownloadDocIcon({ size = 18, color = P.white }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 3v11M12 14l-4-4M12 14l4-4"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M4 17v2a2 2 0 002 2h12a2 2 0 002-2v-2"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
      />
    </Svg>
  );
}

function CheckmarkIcon({ size = 13, color = P.white }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 12l5 5L20 6"
        stroke={color}
        strokeWidth="3.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

type ReportPeriod = '3 months' | '6 months' | 'All time';

interface IncludeItem {
  id: string;
  label: string;
  checked: boolean;
}

const INITIAL_INCLUDES: IncludeItem[] = [
  { id: 'tests', label: 'Soil test results', checked: true },
  { id: 'amendments', label: 'Amendment history', checked: true },
  { id: 'moisture_erosion', label: 'Moisture & erosion notes', checked: true },
  { id: 'rotation', label: 'Crop rotation plan', checked: false },
];

export interface ExportSoilReportsScreenProps {
  onBack?: (() => void) | undefined;
  onDownloadReport?: (() => void) | undefined;
}

// ─────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────

export function ExportSoilReportsScreen({
  onBack,
  onDownloadReport,
}: ExportSoilReportsScreenProps): React.JSX.Element {
  const [selectedPeriod, setSelectedPeriod] = useState<ReportPeriod>('6 months');
  const [includeItems, setIncludeItems] = useState<IncludeItem[]>(INITIAL_INCLUDES);
  const [isDownloading, setIsDownloading] = useState(false);

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

  const toggleInclude = (id: string) => {
    setIncludeItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, checked: !item.checked } : item)),
    );
  };

  const handleDownload = () => {
    if (onDownloadReport) {
      onDownloadReport();
      return;
    }

    setIsDownloading(true);
    setTimeout(() => {
      setIsDownloading(false);
      Alert.alert(
        'Soil Report Downloaded',
        `Soil_Health_Report_${selectedPeriod.replace(/\s+/g, '_')}.pdf (1.4 MB) has been generated successfully.`,
        [{ text: 'Open PDF', onPress: () => {} }, { text: 'Done', style: 'cancel' }],
      );
    }, 600);
  };

  const PERIODS: ReportPeriod[] = ['3 months', '6 months', 'All time'];

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
            <Text style={styles.headerTitle}>Export Soil Reports</Text>
            <Text style={styles.headerSubtitle}>Download a full soil report as PDF</Text>
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Report Preview Card ── */}
        <View style={styles.previewCard}>
          <View style={styles.previewIconBox}>
            <FilePdfIcon size={28} color={P.forestGreen} />
          </View>
          <Text style={styles.previewTitle}>Soil Report Preview</Text>
          <Text style={styles.previewSubtitle}>
            All 3 zones · Tests, amendments, moisture & erosion notes
          </Text>
        </View>

        {/* ── Section: Report period ── */}
        <Text style={styles.sectionHeading}>Report period</Text>
        <View style={styles.periodRow}>
          {PERIODS.map((period) => {
            const isSelected = selectedPeriod === period;
            return (
              <TouchableOpacity
                key={period}
                style={[
                  styles.periodBtn,
                  isSelected ? styles.periodBtnActive : styles.periodBtnInactive,
                ]}
                onPress={() => setSelectedPeriod(period)}
                activeOpacity={0.75}
                accessibilityRole="button"
                accessibilityState={{ selected: isSelected }}
              >
                <Text
                  style={[
                    styles.periodText,
                    isSelected ? styles.periodTextActive : styles.periodTextInactive,
                  ]}
                >
                  {period}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ── Section: Include in report ── */}
        <Text style={styles.sectionHeading}>Include in report</Text>
        <View style={styles.includeList}>
          {includeItems.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.includeRow}
              onPress={() => toggleInclude(item.id)}
              activeOpacity={0.7}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: item.checked }}
            >
              <View
                style={[
                  styles.checkboxBase,
                  item.checked ? styles.checkboxChecked : styles.checkboxUnchecked,
                ]}
              >
                {item.checked && <CheckmarkIcon size={12} color={P.white} />}
              </View>
              <Text style={styles.includeLabel}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* ── Bottom Download Button ── */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={[styles.downloadBtn, isDownloading && styles.downloadBtnDisabled]}
          onPress={handleDownload}
          disabled={isDownloading}
          activeOpacity={0.88}
          accessibilityRole="button"
          accessibilityLabel="Download PDF Report"
        >
          <DownloadDocIcon size={18} color={P.white} />
          <Text style={styles.downloadBtnText}>
            {isDownloading ? 'Generating...' : 'Download PDF Report'}
          </Text>
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
  },
  previewCard: {
    backgroundColor: P.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: P.twGray200,
    alignItems: 'center',
    paddingVertical: 26,
    paddingHorizontal: 20,
    marginBottom: 24,
    shadowColor: P.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  previewIconBox: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: P.mintTintBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  previewTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: P.twGray900,
    marginBottom: 6,
  },
  previewSubtitle: {
    fontSize: 12,
    color: P.twGray500,
    textAlign: 'center',
    lineHeight: 17,
  },
  sectionHeading: {
    fontSize: 13,
    fontWeight: '700',
    color: P.twGray700,
    marginBottom: 10,
  },
  periodRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 24,
  },
  periodBtn: {
    flex: 1,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  periodBtnActive: {
    backgroundColor: P.forestGreen,
    borderColor: P.forestGreen,
  },
  periodBtnInactive: {
    backgroundColor: P.white,
    borderColor: P.twGray200,
  },
  periodText: {
    fontSize: 13,
    fontWeight: '700',
  },
  periodTextActive: {
    color: P.white,
  },
  periodTextInactive: {
    color: P.twGray600,
  },
  includeList: {
    backgroundColor: P.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: P.twGray200,
    paddingVertical: 4,
    paddingHorizontal: 14,
  },
  includeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 12,
  },
  checkboxBase: {
    width: 20,
    height: 20,
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: P.forestGreen,
  },
  checkboxUnchecked: {
    backgroundColor: P.white,
    borderWidth: 1.5,
    borderColor: P.twGray300,
  },
  includeLabel: {
    fontSize: 13.5,
    fontWeight: '600',
    color: P.twGray800,
  },
  bottomBar: {
    backgroundColor: P.white,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: Platform.OS === 'android' ? 14 : 10,
    borderTopWidth: 1,
    borderTopColor: P.twGray100,
  },
  downloadBtn: {
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
  downloadBtnDisabled: {
    opacity: 0.6,
  },
  downloadBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: P.white,
  },
});
