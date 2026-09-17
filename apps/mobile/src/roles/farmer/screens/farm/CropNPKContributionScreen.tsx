import React, { useEffect } from 'react';
import {
  BackHandler,
  Image,
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
import type { CropItem } from './ProduceCalendarScreen';

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

function AlertTriangleIcon({ size = 20, color = P.twOrange600 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Line x1="12" y1="9" x2="12" y2="13" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="12" y1="17" x2="12.01" y2="17" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function RecycleLeafIcon({ size = 18, color = P.twGreen700 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M9 12l2 2 4-4"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function FlaskBeakerIcon({ size = 18, color = P.twBlue600 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M9 3h6M10 3v5l-6 10a2 2 0 0 0 1.7 3h12.6a2 2 0 0 0 1.7-3l-6-10V3"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Line x1="7" y1="15" x2="17" y2="15" stroke={color} strokeWidth="1.4" strokeLinecap="round" />
    </Svg>
  );
}

function SproutIcon({ size = 18, color = P.twGreen700 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="4" y="4" width="16" height="16" rx="3" stroke={color} strokeWidth="1.8" />
      <Path
        d="M12 16v-5M12 11c0-2 1.5-3.5 3.5-3.5 0 2-1.5 3.5-3.5 3.5zM12 13c0-1.8-1.2-3-3-3 0 1.8 1.2 3 3 3z"
        stroke={color}
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// ─────────────────────────────────────────────
// Types & Sample Data
// ─────────────────────────────────────────────

interface NutrientMetric {
  name: string;
  chemical: string;
  percent: number;
  actualKg: number;
  targetKg: number;
  statusColor: string;
}

const NUTRIENT_REQUIREMENTS: NutrientMetric[] = [
  {
    name: 'Nitrogen',
    chemical: 'N',
    percent: 40,
    actualKg: 16,
    targetKg: 40,
    statusColor: P.twRed600,
  },
  {
    name: 'Phosphorus',
    chemical: 'P₂O₅',
    percent: 40,
    actualKg: 12,
    targetKg: 30,
    statusColor: P.twRed600,
  },
  {
    name: 'Potassium',
    chemical: 'K₂O',
    percent: 90,
    actualKg: 45,
    targetKg: 50,
    statusColor: P.twGreen700,
  },
  {
    name: 'Magnesium',
    chemical: 'MgO',
    percent: 67,
    actualKg: 8,
    targetKg: 12,
    statusColor: P.orange600,
  },
  {
    name: 'Sulphur',
    chemical: 'SO₃',
    percent: 87,
    actualKg: 13,
    targetKg: 15,
    statusColor: P.twGreen700,
  },
];

interface CumulativeIntakeItem {
  label: string;
  amount: string;
}

const CUMULATIVE_INTAKE: CumulativeIntakeItem[] = [
  { label: 'Nitrogen (N)', amount: '6.4 kg' },
  { label: 'Phosphorus (P₂O₅)', amount: '4.8 kg' },
  { label: 'Potassium (K₂O)', amount: '18.0 kg' },
  { label: 'Magnesium (MgO)', amount: '3.2 kg' },
  { label: 'Sulphur (SO₃)', amount: '5.2 kg' },
];

interface ContributingApplication {
  id: string;
  title: string;
  timestamp: string;
  amount: string;
  type: 'recycle' | 'flask' | 'sprout';
  tags: string[];
}

const CONTRIBUTING_APPLICATIONS: ContributingApplication[] = [
  {
    id: 'c1',
    title: 'Vermicompost',
    timestamp: '12 Jul',
    amount: '60 kg',
    type: 'recycle',
    tags: ['N', 'P₂O₅', 'K₂O'],
  },
  {
    id: 'c2',
    title: 'Panchagavya foliar spray',
    timestamp: '28 Jun',
    amount: '8 L',
    type: 'flask',
    tags: ['K₂O', 'MgO', 'SO₃'],
  },
  {
    id: 'c3',
    title: 'Bone meal top-dress',
    timestamp: '10 Jun',
    amount: '25 kg',
    type: 'sprout',
    tags: ['P₂O₅', 'SO₃'],
  },
];

const DEFAULT_CARROT_THUMB =
  'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?w=400&auto=format&fit=crop&q=85';

export interface CropNPKContributionScreenProps {
  crop?: CropItem | null;
  onBack?: () => void;
}

export function CropNPKContributionScreen({
  crop,
  onBack,
}: CropNPKContributionScreenProps): React.JSX.Element {
  // Listen for hardware back on Android
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

  const cropName = crop?.name ?? 'Carrot';
  const variety = crop?.variety ?? 'Nantes';
  const zone = crop?.zoneShort || crop?.zone || 'Zone 1';
  const subtitle = `${cropName} — ${variety} · ${zone}`;
  const headerDetails = `${crop?.zone ?? 'Zone 1 — Upper Field'} · ${crop?.area ?? '0.4 ha'} · ${crop?.daysOld ?? 88} days old`;
  const thumbnailUri = crop?.imageUri ?? DEFAULT_CARROT_THUMB;
  const areaLabel = crop?.area?.toUpperCase() ?? '0.4 HA';

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={P.paleStoneBg} />

      <View style={styles.container}>
        {/* ── Header ── */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={onBack}
            activeOpacity={0.7}
            hitSlop={{ top: 14, bottom: 14, left: 14, right: 14 }}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <ArrowBackIcon size={20} color={P.twGray800} />
          </TouchableOpacity>

          <View style={styles.headerTitleCol}>
            <Text style={styles.headerTitle}>NPK Contribution</Text>
            <Text style={styles.headerSubtitle}>{subtitle}</Text>
          </View>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* ── Top Crop Info Card ── */}
          <View style={styles.cropSummaryCard}>
            <Image source={{ uri: thumbnailUri }} style={styles.cropThumb} />
            <View style={styles.cropInfoCol}>
              <Text style={styles.cropInfoTitle}>{cropName} — {variety}</Text>
              <Text style={styles.cropInfoSubtitle}>{headerDetails}</Text>
            </View>
          </View>

          {/* ── Alert Banner: 2 of 5 nutrients running low ── */}
          <View style={styles.alertCard}>
            <View style={styles.alertIconCol}>
              <AlertTriangleIcon size={22} color={P.twOrange600} />
            </View>
            <View style={styles.alertTextCol}>
              <Text style={styles.alertTitle}>2 of 5 nutrients running low</Text>
              <Text style={styles.alertDescription}>
                Nitrogen and Phosphorus are below 50% of requirement. Schedule a fertigation before
                the next growth stage.
              </Text>
            </View>
          </View>

          {/* ── Section: REQUIREMENT MET ── */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionHeaderText}>REQUIREMENT MET</Text>
          </View>

          <View style={styles.nutrientsCard}>
            {NUTRIENT_REQUIREMENTS.map((item, index) => {
              const isLast = index === NUTRIENT_REQUIREMENTS.length - 1;
              return (
                <View
                  key={item.chemical}
                  style={[styles.nutrientRow, !isLast && styles.nutrientRowBottomMargin]}
                >
                  {/* Top line: Name + % */}
                  <View style={styles.nutrientTitleRow}>
                    <Text style={styles.nutrientNameText}>
                      {item.name} ({item.chemical})
                    </Text>
                    <Text style={[styles.nutrientPercentText, { color: item.statusColor }]}>
                      {item.percent}%
                    </Text>
                  </View>

                  {/* Progress track */}
                  <View style={styles.progressTrack}>
                    <View
                      style={[
                        styles.progressFill,
                        {
                          width: `${item.percent}%`,
                          backgroundColor: item.statusColor,
                        },
                      ]}
                    />
                  </View>

                  {/* Subtitle: 16 of 40 kg/ha */}
                  <Text style={styles.nutrientRatioText}>
                    {item.actualKg} of {item.targetKg} kg/ha
                  </Text>
                </View>
              );
            })}
          </View>

          {/* ── Section: CUMULATIVE INTAKE ── */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionHeaderText}>CUMULATIVE INTAKE · {areaLabel}</Text>
          </View>

          <View style={styles.cumulativeCard}>
            {CUMULATIVE_INTAKE.map((item, index) => {
              const isLast = index === CUMULATIVE_INTAKE.length - 1;
              return (
                <View key={item.label}>
                  <View style={styles.cumulativeRow}>
                    <Text style={styles.cumulativeLabel}>{item.label}</Text>
                    <Text style={styles.cumulativeAmount}>{item.amount}</Text>
                  </View>
                  {!isLast && <View style={styles.cumulativeDivider} />}
                </View>
              );
            })}
          </View>

          {/* ── Section: CONTRIBUTING APPLICATIONS ── */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionHeaderText}>CONTRIBUTING APPLICATIONS</Text>
          </View>

          <View style={styles.applicationsList}>
            {CONTRIBUTING_APPLICATIONS.map((app) => (
              <View key={app.id} style={styles.appCard}>
                {/* Icon Badge */}
                <View
                  style={[
                    styles.appIconBadge,
                    app.type === 'flask'
                      ? { backgroundColor: P.twBlue50 }
                      : { backgroundColor: P.twGreen100 },
                  ]}
                >
                  {app.type === 'recycle' ? (
                    <RecycleLeafIcon size={18} color={P.twGreen700} />
                  ) : app.type === 'flask' ? (
                    <FlaskBeakerIcon size={18} color={P.twBlue600} />
                  ) : (
                    <SproutIcon size={18} color={P.twGreen700} />
                  )}
                </View>

                {/* Info Column */}
                <View style={styles.appInfoCol}>
                  <Text style={styles.appTitle}>{app.title}</Text>
                  <Text style={styles.appSubtitle}>
                    {app.timestamp} · {app.amount}
                  </Text>

                  {/* Nutrient Pills */}
                  <View style={styles.pillTagRow}>
                    {app.tags.map((tag) => (
                      <View key={tag} style={styles.pillTag}>
                        <Text style={styles.pillTagText}>{tag}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              </View>
            ))}
          </View>

          <View style={styles.bottomSpacer} />
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

// ─────────────────────────────────────────────
// Stylesheet (strictly no raw hex literals)
// ─────────────────────────────────────────────

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: P.paleStoneBg,
  },
  container: {
    flex: 1,
    backgroundColor: P.paleStoneBg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight ?? 24) + 10 : 10,
    paddingBottom: 14,
    backgroundColor: P.paleStoneBg,
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: P.white,
    borderWidth: 1,
    borderColor: P.twGray200,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    shadowColor: P.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  headerTitleCol: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: P.ink,
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 12.5,
    fontWeight: '500',
    color: P.twGray500,
    marginTop: 2,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 40,
  },
  cropSummaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: P.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: P.twGray200,
    padding: 12,
    marginBottom: 14,
    shadowColor: P.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 5,
    elevation: 1,
  },
  cropThumb: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: P.twGray100,
  },
  cropInfoCol: {
    flex: 1,
    marginLeft: 12,
  },
  cropInfoTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: P.ink,
  },
  cropInfoSubtitle: {
    fontSize: 12,
    color: P.twGray500,
    marginTop: 3,
  },
  alertCard: {
    flexDirection: 'row',
    backgroundColor: P.twOrange50,
    borderLeftWidth: 4,
    borderLeftColor: P.twOrange600,
    borderRadius: 14,
    padding: 14,
    marginBottom: 20,
  },
  alertIconCol: {
    marginRight: 10,
    marginTop: 2,
  },
  alertTextCol: {
    flex: 1,
  },
  alertTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: P.twAmber900,
    marginBottom: 4,
  },
  alertDescription: {
    fontSize: 12.5,
    color: P.twOrange700,
    lineHeight: 18,
  },
  sectionHeader: {
    marginBottom: 10,
  },
  sectionHeaderText: {
    fontSize: 12,
    fontWeight: '700',
    color: P.twGray500,
    letterSpacing: 0.8,
  },
  nutrientsCard: {
    backgroundColor: P.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: P.twGray200,
    padding: 16,
    marginBottom: 20,
    shadowColor: P.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 5,
    elevation: 1,
  },
  nutrientRow: {
    width: '100%',
  },
  nutrientRowBottomMargin: {
    marginBottom: 16,
  },
  nutrientTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  nutrientNameText: {
    fontSize: 14,
    fontWeight: '700',
    color: P.ink,
  },
  nutrientPercentText: {
    fontSize: 14,
    fontWeight: '700',
  },
  progressTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: P.twGray100,
    overflow: 'hidden',
    marginBottom: 4,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  nutrientRatioText: {
    fontSize: 12,
    color: P.twGray400,
  },
  cumulativeCard: {
    backgroundColor: P.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: P.twGray200,
    paddingHorizontal: 16,
    paddingVertical: 4,
    marginBottom: 20,
    shadowColor: P.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 5,
    elevation: 1,
  },
  cumulativeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  cumulativeLabel: {
    fontSize: 14,
    color: P.twGray500,
    fontWeight: '500',
  },
  cumulativeAmount: {
    fontSize: 14,
    fontWeight: '700',
    color: P.ink,
  },
  cumulativeDivider: {
    height: 1,
    backgroundColor: P.twGray100,
  },
  applicationsList: {
    gap: 10,
  },
  appCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: P.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: P.twGray200,
    padding: 14,
    shadowColor: P.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 5,
    elevation: 1,
  },
  appIconBadge: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  appInfoCol: {
    flex: 1,
    marginLeft: 12,
  },
  appTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: P.ink,
  },
  appSubtitle: {
    fontSize: 12,
    color: P.twGray500,
    marginTop: 2,
    marginBottom: 8,
  },
  pillTagRow: {
    flexDirection: 'row',
    gap: 6,
  },
  pillTag: {
    backgroundColor: P.twGray100,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  pillTagText: {
    fontSize: 11,
    fontWeight: '700',
    color: P.twGray700,
  },
  bottomSpacer: {
    height: 20,
  },
});
