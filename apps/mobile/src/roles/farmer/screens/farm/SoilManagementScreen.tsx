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
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Circle, Line, Path, Rect, Polygon } from 'react-native-svg';
import { authPalette as P } from '../../theme';

// ─────────────────────────────────────────────
// Inline Vector Icons (strictly no emojis, no raw hex)
// ─────────────────────────────────────────────

function ArrowBackIcon({ size = 20, color = P.twGray800 }: { size?: number; color?: string }) {
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

function ChevronRightIcon({ size = 18, color = P.twGray400 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M9 18l6-6-6-6"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function FlaskIcon({ size = 20, color = P.twAmber800 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M9 3h6M10 3v5l-5.5 9.5A2 2 0 006.2 21h11.6a2 2 0 001.7-3.5L14 8V3"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M7.5 15h9"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </Svg>
  );
}

function ClockIcon({ size = 20, color = P.twAmber800 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth="2" />
      <Path
        d="M12 7v5l3.5 2"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function MicroscopeIcon({ size = 22, color = P.twGreen700 }: { size?: number; color?: string }) {
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

function PulseGraphIcon({ size = 22, color = P.twGreen700 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="4" width="18" height="16" rx="3" stroke={color} strokeWidth="1.8" />
      <Path
        d="M6 12h2.5l2-4 3 8 2.5-5 1.5 1H18"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function ShapesIcon({ size = 22, color = P.twGreen700 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Polygon points="12,3 7,11 17,11" stroke={color} strokeWidth="1.8" strokeLinejoin="round" />
      <Rect x="4" y="14" width="7" height="7" rx="1.5" stroke={color} strokeWidth="1.8" />
      <Circle cx="17.5" cy="17.5" r="3.5" stroke={color} strokeWidth="1.8" />
    </Svg>
  );
}

function SproutShootIcon({ size = 22, color = P.twGreen700 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 21v-8M12 13c-2.5-3-6-2.5-7-2 0 4 3 6 7 2zM12 11c2.5-3 6-2.5 7-2 0 4-3 6-7 2z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M7 21h10"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
      />
    </Svg>
  );
}

function RotateCycleIcon({ size = 22, color = P.twGreen700 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M21 12a9 9 0 00-15-6.7L3 8"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
      />
      <Path
        d="M3 3v5h5"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M3 12a9 9 0 0015 6.7l3-2.7"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
      />
      <Path
        d="M21 21v-5h-5"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function WaterDropletIcon({ size = 22, color = P.twGreen700 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 2.69l5.66 5.66a8 8 0 11-11.31 0z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function MountainSlopeIcon({ size = 22, color = P.twGreen700 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Polygon points="12,5 4,19 20,19" stroke={color} strokeWidth="2" strokeLinejoin="round" />
      <Line x1="7.5" y1="13" x2="16.5" y2="13" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </Svg>
  );
}

function PdfDocIcon({ size = 22, color = P.twGreen700 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="4" y="3" width="13" height="18" rx="2" stroke={color} strokeWidth="1.8" />
      <Path d="M17 7h3v14H8" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      <Line x1="7" y1="8" x2="14" y2="8" stroke={color} strokeWidth="1.6" strokeLinecap="round" />
      <Line x1="7" y1="12" x2="14" y2="12" stroke={color} strokeWidth="1.6" strokeLinecap="round" />
      <Line x1="7" y1="16" x2="11" y2="16" stroke={color} strokeWidth="1.6" strokeLinecap="round" />
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
// Types & Interfaces
// ─────────────────────────────────────────────

export interface SoilManagementScreenProps {
  onBack?: (() => void) | undefined;
  onNavigateToSoilTest?: (() => void) | undefined;
  onNavigateToSoilTestRecords?: (() => void) | undefined;
  onNavigateToSoilHealthTracker?: (() => void) | undefined;
  onNavigateToSoilTypeClassification?: (() => void) | undefined;
  onNavigateToAmendments?: (() => void) | undefined;
  onNavigateToCropRotation?: (() => void) | undefined;
  onNavigateToMoistureTracking?: (() => void) | undefined;
  onNavigateToErosionConservation?: (() => void) | undefined;
  onNavigateToExportReports?: (() => void) | undefined;
  onNavigateToNewSoilTest?: (() => void) | undefined;
}

interface SoilModuleItem {
  id: string;
  title: string;
  subtitle: string;
  IconComponent: React.ComponentType<{ size?: number; color?: string }>;
}

const SOIL_MODULES: SoilModuleItem[] = [
  {
    id: 'records',
    title: 'Soil Test Records',
    subtitle: 'Upload results, set reminders, view history',
    IconComponent: MicroscopeIcon,
  },
  {
    id: 'health_tracker',
    title: 'Soil Health Tracker',
    subtitle: 'Track pH, organic carbon & TDS over time per zone',
    IconComponent: PulseGraphIcon,
  },
  {
    id: 'classification',
    title: 'Soil Type Classification',
    subtitle: 'Record your soil type per zone (8 categories)',
    IconComponent: ShapesIcon,
  },
  {
    id: 'amendments',
    title: 'Soil Amendments Log',
    subtitle: 'Log FYM, compost & amendments — with recommendations',
    IconComponent: SproutShootIcon,
  },
  {
    id: 'rotation',
    title: 'Crop Rotation & Cover Cropping',
    subtitle: 'Plan rotation cycles and cover crop windows',
    IconComponent: RotateCycleIcon,
  },
  {
    id: 'moisture',
    title: 'Soil Moisture Tracking',
    subtitle: 'Manual visual moisture observations per zone',
    IconComponent: WaterDropletIcon,
  },
  {
    id: 'erosion',
    title: 'Erosion & Conservation Notes',
    subtitle: 'Log erosion risk and conservation practices',
    IconComponent: MountainSlopeIcon,
  },
  {
    id: 'export',
    title: 'Export Soil Reports',
    subtitle: 'Download a full soil report as PDF',
    IconComponent: PdfDocIcon,
  },
];

// ─────────────────────────────────────────────
// Component Implementation
// ─────────────────────────────────────────────

export function SoilManagementScreen({
  onBack,
  onNavigateToSoilTest,
  onNavigateToSoilTestRecords,
  onNavigateToSoilHealthTracker,
  onNavigateToSoilTypeClassification,
  onNavigateToAmendments,
  onNavigateToCropRotation,
  onNavigateToMoistureTracking,
  onNavigateToErosionConservation,
  onNavigateToExportReports,
  onNavigateToNewSoilTest,
}: SoilManagementScreenProps): React.JSX.Element {
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

  // Modal states for interactive detail views
  const [activeModal, setActiveModal] = useState<string | null>(null);

  const handleModulePress = (id: string) => {
    if (id === 'records') {
      if (onNavigateToSoilTestRecords) {
        onNavigateToSoilTestRecords();
      } else if (onNavigateToSoilTest) {
        onNavigateToSoilTest();
      } else {
        setActiveModal('records');
      }
    } else if (id === 'health_tracker') {
      if (onNavigateToSoilHealthTracker) {
        onNavigateToSoilHealthTracker();
      } else {
        setActiveModal('health_tracker');
      }
    } else if (id === 'classification') {
      if (onNavigateToSoilTypeClassification) {
        onNavigateToSoilTypeClassification();
      } else {
        setActiveModal('classification');
      }
    } else if (id === 'amendments') {
      if (onNavigateToAmendments) {
        onNavigateToAmendments();
      } else {
        setActiveModal('amendments');
      }
    } else if (id === 'rotation') {
      if (onNavigateToCropRotation) {
        onNavigateToCropRotation();
      } else {
        setActiveModal('rotation');
      }
    } else if (id === 'moisture') {
      if (onNavigateToMoistureTracking) {
        onNavigateToMoistureTracking();
      } else {
        setActiveModal('moisture');
      }
    } else if (id === 'erosion') {
      if (onNavigateToErosionConservation) {
        onNavigateToErosionConservation();
      } else {
        setActiveModal('erosion');
      }
    } else if (id === 'export') {
      if (onNavigateToExportReports) {
        onNavigateToExportReports();
      } else {
        Alert.alert(
          'Export Soil Report',
          'Your comprehensive soil health report (PDF · 1.4 MB) has been generated and queued for download.',
          [{ text: 'OK' }],
        );
      }
    } else {
      setActiveModal(id);
    }
  };

  const handleUploadNewTest = () => {
    if (onNavigateToNewSoilTest) {
      onNavigateToNewSoilTest();
    } else {
      Alert.alert('Upload Soil Test', 'Navigate to new soil test report upload form.');
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
            <Text style={styles.headerTitle}>Soil Management</Text>
            <Text style={styles.headerSubtitle}>Tests, health tracking & conservation</Text>
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Top Stat Cards ── */}
        <View style={styles.statsRow}>
          {/* Card 1: Latest Soil pH */}
          <View style={styles.statCard}>
            <View style={styles.statIconBadge}>
              <FlaskIcon size={20} color={P.twAmber800} />
            </View>
            <Text style={styles.statValue}>6.4</Text>
            <Text style={styles.statLabel}>Latest Soil pH</Text>
          </View>

          {/* Card 2: Since Last Test */}
          <View style={styles.statCard}>
            <View style={styles.statIconBadge}>
              <ClockIcon size={20} color={P.twAmber800} />
            </View>
            <Text style={styles.statValue}>3 wks</Text>
            <Text style={styles.statLabel}>Since Last Test</Text>
          </View>
        </View>

        {/* ── 8 Soil Module Navigation Cards ── */}
        <View style={styles.modulesList}>
          {SOIL_MODULES.map((item) => {
            const Icon = item.IconComponent;
            return (
              <TouchableOpacity
                key={item.id}
                style={styles.moduleCard}
                onPress={() => handleModulePress(item.id)}
                activeOpacity={0.78}
                accessibilityRole="button"
                accessibilityLabel={`${item.title}. ${item.subtitle}`}
              >
                <View style={styles.moduleIconBadge}>
                  <Icon size={22} color={P.twGreen700} />
                </View>

                <View style={styles.moduleTextGroup}>
                  <Text style={styles.moduleTitle}>{item.title}</Text>
                  <Text style={styles.moduleSubtitle}>{item.subtitle}</Text>
                </View>

                <ChevronRightIcon size={18} color={P.twGray400} />
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* ── Bottom Fixed Button: Upload New Soil Test ── */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.uploadBtn}
          onPress={handleUploadNewTest}
          activeOpacity={0.88}
          accessibilityRole="button"
          accessibilityLabel="Upload New Soil Test"
        >
          <PlusIcon size={18} color={P.white} />
          <Text style={styles.uploadBtnText}>Upload New Soil Test</Text>
        </TouchableOpacity>
      </View>

      {/* ── Interactive Detail Modal for sub-screens ── */}
      <Modal visible={activeModal !== null} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {SOIL_MODULES.find((m) => m.id === activeModal)?.title ?? 'Soil Management'}
              </Text>
              <TouchableOpacity
                style={styles.modalCloseBtn}
                onPress={() => setActiveModal(null)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            {activeModal === 'health_tracker' && (
              <View style={styles.modalBody}>
                <Text style={styles.modalSubHeader}>Zone 1 — Parameter Trends</Text>
                <View style={styles.metricRow}>
                  <Text style={styles.metricName}>pH Level</Text>
                  <Text style={styles.metricValGreen}>6.4 · Optimal (6.0 – 7.0)</Text>
                </View>
                <View style={styles.metricRow}>
                  <Text style={styles.metricName}>Organic Carbon (OC)</Text>
                  <Text style={styles.metricValGreen}>0.68% · Moderate (0.5 – 0.75%)</Text>
                </View>
                <View style={styles.metricRow}>
                  <Text style={styles.metricName}>Electrical Conductivity</Text>
                  <Text style={styles.metricValGreen}>0.72 dS/m · Normal (&lt;1.0)</Text>
                </View>
                <View style={styles.metricRow}>
                  <Text style={styles.metricName}>Total Dissolved Solids</Text>
                  <Text style={styles.metricValGreen}>460 ppm · Desirable</Text>
                </View>
              </View>
            )}

            {activeModal === 'classification' && (
              <View style={styles.modalBody}>
                <Text style={styles.modalSubHeader}>Active Zones & Classification</Text>
                <View style={styles.zoneItem}>
                  <Text style={styles.zoneTitle}>Zone 1 (0.8 Acre)</Text>
                  <Text style={styles.zoneType}>Red Sandy Loam · High drainage, neutral</Text>
                </View>
                <View style={styles.zoneItem}>
                  <Text style={styles.zoneTitle}>Zone 2 (1.2 Acre)</Text>
                  <Text style={styles.zoneType}>Clay Loam · High moisture retention</Text>
                </View>
              </View>
            )}

            {activeModal === 'amendments' && (
              <View style={styles.modalBody}>
                <Text style={styles.modalSubHeader}>Recent Organic Amendments</Text>
                <View style={styles.logItem}>
                  <Text style={styles.logTitle}>Farmyard Manure (FYM)</Text>
                  <Text style={styles.logMeta}>Applied 1.2 tonnes · Zone 1 · 12 Jul 2026</Text>
                </View>
                <View style={styles.logItem}>
                  <Text style={styles.logTitle}>Vermicompost Compost</Text>
                  <Text style={styles.logMeta}>Applied 400 kg · Zone 2 · 28 Jun 2026</Text>
                </View>
              </View>
            )}

            {activeModal === 'rotation' && (
              <View style={styles.modalBody}>
                <Text style={styles.modalSubHeader}>Crop Rotation & Cover Crop Cycle</Text>
                <View style={styles.rotationCard}>
                  <Text style={styles.rotationStep}>Current: Carrot (Root Crop)</Text>
                  <Text style={styles.rotationNext}>Next Planned: Cowpea / Green Gram (Legume)</Text>
                  <Text style={styles.rotationMeta}>Nitrogen fixation window: Aug 2026</Text>
                </View>
              </View>
            )}

            {activeModal === 'moisture' && (
              <View style={styles.modalBody}>
                <Text style={styles.modalSubHeader}>Field Moisture Observations</Text>
                <View style={styles.moistureRow}>
                  <Text style={styles.moistureZone}>Zone 1 (Carrots):</Text>
                  <Text style={styles.moistureStatusGood}>Optimal (Drip irrigated today)</Text>
                </View>
                <View style={styles.moistureRow}>
                  <Text style={styles.moistureZone}>Zone 2 (Tomatoes):</Text>
                  <Text style={styles.moistureStatusGood}>Adequate root zone moisture</Text>
                </View>
              </View>
            )}

            {activeModal === 'erosion' && (
              <View style={styles.modalBody}>
                <Text style={styles.modalSubHeader}>Erosion Risk & Soil Conservation</Text>
                <View style={styles.erosionItem}>
                  <Text style={styles.erosionTitle}>Contour Bunding</Text>
                  <Text style={styles.erosionDesc}>Maintained across south slope to prevent topsoil run-off during monsoons.</Text>
                </View>
                <View style={styles.erosionItem}>
                  <Text style={styles.erosionTitle}>Organic Mulching</Text>
                  <Text style={styles.erosionDesc}>Dry straw mulching applied around ridges for moisture & crust protection.</Text>
                </View>
              </View>
            )}

            <TouchableOpacity
              style={styles.modalActionBtn}
              onPress={() => setActiveModal(null)}
              activeOpacity={0.85}
            >
              <Text style={styles.modalActionBtnText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// ─────────────────────────────────────────────
// Stylesheet (strictly no raw hex literals)
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
    paddingBottom: 24,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: P.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: P.twGray200,
    padding: 14,
    shadowColor: P.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  statIconBadge: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: P.amber50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '800',
    color: P.twGray900,
    letterSpacing: -0.3,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: P.twGray500,
    marginTop: 2,
  },
  modulesList: {
    gap: 10,
  },
  moduleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: P.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: P.twGray200,
    padding: 14,
    shadowColor: P.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  moduleIconBadge: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: P.mintTintBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  moduleTextGroup: {
    flex: 1,
    marginRight: 8,
  },
  moduleTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: P.twGray900,
    letterSpacing: -0.2,
  },
  moduleSubtitle: {
    fontSize: 12,
    fontWeight: '400',
    color: P.twGray500,
    marginTop: 3,
    lineHeight: 16,
  },
  bottomSpacer: {
    height: 16,
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
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: P.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: Platform.OS === 'android' ? 24 : 32,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: P.twGray100,
    marginBottom: 14,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: P.twGray900,
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: P.twGray100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCloseText: {
    fontSize: 14,
    fontWeight: '700',
    color: P.twGray700,
  },
  modalBody: {
    paddingVertical: 6,
  },
  modalSubHeader: {
    fontSize: 13,
    fontWeight: '700',
    color: P.twGray700,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: P.twGray100,
  },
  metricName: {
    fontSize: 13.5,
    fontWeight: '500',
    color: P.twGray800,
  },
  metricValGreen: {
    fontSize: 13.5,
    fontWeight: '700',
    color: P.twGreen700,
  },
  zoneItem: {
    backgroundColor: P.twGray50,
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: P.twGray200,
  },
  zoneTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: P.twGray900,
  },
  zoneType: {
    fontSize: 12.5,
    fontWeight: '500',
    color: P.twGray600,
    marginTop: 2,
  },
  logItem: {
    backgroundColor: P.twGray50,
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: P.twGray200,
  },
  logTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: P.twGray900,
  },
  logMeta: {
    fontSize: 12,
    color: P.twGray500,
    marginTop: 2,
  },
  rotationCard: {
    backgroundColor: P.twGreen50,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: P.twGreen100,
  },
  rotationStep: {
    fontSize: 14,
    fontWeight: '700',
    color: P.twGreen900,
  },
  rotationNext: {
    fontSize: 13,
    fontWeight: '600',
    color: P.twGreen700,
    marginTop: 4,
  },
  rotationMeta: {
    fontSize: 12,
    color: P.twGray600,
    marginTop: 4,
  },
  moistureRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: P.twGray100,
  },
  moistureZone: {
    fontSize: 13.5,
    fontWeight: '600',
    color: P.twGray800,
  },
  moistureStatusGood: {
    fontSize: 13,
    fontWeight: '600',
    color: P.twGreen700,
  },
  erosionItem: {
    marginBottom: 12,
  },
  erosionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: P.twGray900,
  },
  erosionDesc: {
    fontSize: 12.5,
    color: P.twGray600,
    marginTop: 2,
    lineHeight: 17,
  },
  modalActionBtn: {
    backgroundColor: P.forestGreen,
    height: 46,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 18,
  },
  modalActionBtnText: {
    fontSize: 14.5,
    fontWeight: '700',
    color: P.white,
  },
});
