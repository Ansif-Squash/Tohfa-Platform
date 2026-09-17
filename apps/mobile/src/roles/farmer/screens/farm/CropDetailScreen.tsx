import React from 'react';
import {
  ImageBackground,
  Image,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Circle, Line, Path, Rect } from 'react-native-svg';
import { authPalette as P, colors } from '../../theme';
import type { CropItem } from './ProduceCalendarScreen';

// ─────────────────────────────────────────────
// Inline Vector Icons (strictly no emojis, no raw hex)
// ─────────────────────────────────────────────

function ArrowBackIcon({ size = 20, color = P.white }: { size?: number; color?: string }) {
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

function PencilEditIcon({ size = 15, color = P.white }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"
        stroke={color}
        strokeWidth="2"
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

function CalendarIcon({ size = 18, color = P.twGreen700 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="4" width="18" height="18" rx="3" stroke={color} strokeWidth="2" />
      <Line x1="16" y1="2" x2="16" y2="6" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="8" y1="2" x2="8" y2="6" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="3" y1="10" x2="21" y2="10" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </Svg>
  );
}

function BeakerIcon({ size = 18, color = P.twOrange600 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M9 3h6M10 3v5l-6 10a2 2 0 0 0 1.7 3h12.6a2 2 0 0 0 1.7-3l-6-10V3"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Line x1="7" y1="15" x2="17" y2="15" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </Svg>
  );
}

function WorkforceUsersIcon({ size = 18, color = P.twBlue600 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle cx="9" cy="7" r="4" stroke={color} strokeWidth="2" />
      <Path
        d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
      />
    </Svg>
  );
}

function AnalyticsChartIcon({ size = 18, color = P.twOrange600 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M3 20h18M6 16l4-6 4 4 6-8"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Rect x="5" y="14" width="2" height="6" rx="0.5" fill={color} />
      <Rect x="11" y="11" width="2" height="9" rx="0.5" fill={color} />
      <Rect x="17" y="7" width="2" height="13" rx="0.5" fill={color} />
    </Svg>
  );
}

function SproutDiaryIcon({ size = 16, color = P.twGreen700 }: { size?: number; color?: string }) {
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

function CompostIcon({ size = 16, color = P.twGreen700 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth="1.8" />
      <Path
        d="M8 12c0-2.2 1.8-4 4-4 1.5 0 2.8.8 3.5 2M16 12c0 2.2-1.8 4-4 4-1.5 0-2.8-.8-3.5-2"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </Svg>
  );
}

// ─────────────────────────────────────────────
// Default Crops Data
// ─────────────────────────────────────────────

interface CropDetailsRecord {
  title: string;
  subtitle: string;
  daysOld: number;
  daysToHarvest: number;
  grade: string;
  zoneArea: string;
  varietyCompany: string;
  seedUsedCost: string;
  plantedOn: string;
  expectedHarvest: string;
  expectedQty: string;
  heroImageUri: string;
  thumbnailUri: string;
  diarySummary: string;
  inputsSummary: string;
  workforceSummary: string;
  npkSummary: string;
}

const DEFAULT_DETAILS: Record<string, CropDetailsRecord> = {
  carrot: {
    title: 'Carrot — Nantes',
    subtitle: 'Zone 1 — Upper Field · Nantes seed',
    daysOld: 88,
    daysToHarvest: 3,
    grade: 'A',
    zoneArea: 'Zone 1 · 0.4 ha',
    varietyCompany: 'Nantes · Namdhari',
    seedUsedCost: '300 g · ₹ 420',
    plantedOn: '20 Apr 2026',
    expectedHarvest: '20 Jul 2026',
    expectedQty: '1,100 kg · Grade A',
    heroImageUri: 'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?w=800&auto=format&fit=crop&q=80',
    thumbnailUri: 'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?w=160&auto=format&fit=crop&q=80',
    diarySummary: '14 logged · last 2 days ago',
    inputsSummary: '6 fertigation · 2 pest treatments',
    workforceSummary: '38 h logged · ₹ 6,400 labour',
    npkSummary: '2 of 5 nutrients running low',
  },
  tomato: {
    title: 'Tomato — Roma',
    subtitle: 'Zone 2 — Lower Slope · Roma seed',
    daysOld: 45,
    daysToHarvest: 30,
    grade: 'A',
    zoneArea: 'Zone 2 · 0.6 ha',
    varietyCompany: 'Roma · Namdhari',
    seedUsedCost: '250 g · ₹ 480',
    plantedOn: '2 Jun 2026',
    expectedHarvest: '16 Aug 2026',
    expectedQty: '1,800 kg · Grade A',
    heroImageUri: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=800&auto=format&fit=crop&q=80',
    thumbnailUri: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=160&auto=format&fit=crop&q=80',
    diarySummary: '10 logged · last 1 day ago',
    inputsSummary: '4 fertigation · 1 pest check',
    workforceSummary: '28 h logged · ₹ 4,800 labour',
    npkSummary: 'Optimal balance',
  },
  cabbage: {
    title: 'Cabbage — Green Coronet',
    subtitle: 'Zone 3 — Terrace · Green Coronet seed',
    daysOld: 21,
    daysToHarvest: 69,
    grade: 'A',
    zoneArea: 'Zone 3 · 0.5 ha',
    varietyCompany: 'Green Coronet · Mahyco',
    seedUsedCost: '150 g · ₹ 350',
    plantedOn: '26 Jun 2026',
    expectedHarvest: '3 Sep 2026',
    expectedQty: '1,500 kg · Grade A',
    heroImageUri: 'https://images.unsplash.com/photo-1550950158-d0d960dff51b?w=800&auto=format&fit=crop&q=80',
    thumbnailUri: 'https://images.unsplash.com/photo-1550950158-d0d960dff51b?w=160&auto=format&fit=crop&q=80',
    diarySummary: '6 logged · last 3 days ago',
    inputsSummary: '2 fertigation · Organic compost',
    workforceSummary: '18 h logged · ₹ 3,100 labour',
    npkSummary: 'High nitrogen absorption',
  },
};

export interface CropDetailScreenProps {
  crop?: CropItem | null;
  onBack?: () => void;
  onEdit?: () => void;
  onNavigateToDiary?: () => void;
}

export function CropDetailScreen({
  crop,
  onBack,
  onEdit,
  onNavigateToDiary,
}: CropDetailScreenProps): React.JSX.Element {
  // Determine crop type key
  const cropTypeKey = (crop?.cropType ?? 'carrot').toLowerCase();
  const fallback = DEFAULT_DETAILS[cropTypeKey] ?? DEFAULT_DETAILS.carrot!;

  const title = crop ? `${crop.name} — ${crop.variety}` : fallback.title;
  const subtitle = crop ? `${crop.zone} · ${crop.variety} seed` : fallback.subtitle;
  const daysOld = crop?.daysOld ?? fallback.daysOld;
  const daysToHarvest = crop?.statusDays ?? fallback.daysToHarvest;
  const grade = fallback.grade;
  const zoneArea = crop ? `${crop.zoneShort} · ${crop.area}` : fallback.zoneArea;
  const varietyCompany = crop ? `${crop.variety} · Namdhari` : fallback.varietyCompany;
  const seedUsedCost = fallback.seedUsedCost;
  const plantedOn = fallback.plantedOn;
  const expectedHarvest = fallback.expectedHarvest;
  const expectedQty = fallback.expectedQty;
  const heroImageUri = crop?.imageUri ?? fallback.heroImageUri;
  const thumbnailUri = crop?.imageUri ?? fallback.thumbnailUri;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Top Hero Banner with Background Image ── */}
        <ImageBackground
          source={{ uri: heroImageUri }}
          style={styles.heroBackground}
          imageStyle={styles.heroBackgroundImage}
        >
          {/* Dark gradient overlay */}
          <View style={styles.heroOverlay}>
            <SafeAreaView style={styles.heroSafeArea}>
              {/* Navigation row: Back `<` and `Edit` */}
              <View style={styles.heroNavRow}>
                <TouchableOpacity
                  style={styles.heroBackButton}
                  onPress={onBack}
                  activeOpacity={0.7}
                  accessibilityRole="button"
                  accessibilityLabel="Go back"
                >
                  <ArrowBackIcon size={20} color={P.white} />
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.heroEditButton}
                  onPress={onEdit}
                  activeOpacity={0.7}
                  accessibilityRole="button"
                  accessibilityLabel="Edit crop details"
                >
                  <PencilEditIcon size={14} color={P.white} />
                  <Text style={styles.heroEditText}>Edit</Text>
                </TouchableOpacity>
              </View>

              {/* Crop Title & Thumbnail Row */}
              <View style={styles.heroCropInfoRow}>
                <View style={styles.heroThumbnailWrapper}>
                  <Image source={{ uri: thumbnailUri }} style={styles.heroThumbnail} />
                </View>

                <View style={styles.heroTitleCol}>
                  <Text style={styles.heroCropTitle}>{title}</Text>
                  <Text style={styles.heroCropSubtitle}>{subtitle}</Text>
                </View>
              </View>

              {/* 3 Glassmorphism Stat Cards */}
              <View style={styles.heroStatsRow}>
                <View style={styles.glassStatCard}>
                  <Text style={styles.glassStatValue}>{daysOld}</Text>
                  <Text style={styles.glassStatLabel}>Days old</Text>
                </View>

                <View style={styles.glassStatCard}>
                  <Text style={styles.glassStatValue}>{daysToHarvest}</Text>
                  <Text style={styles.glassStatLabel}>Days to harvest</Text>
                </View>

                <View style={styles.glassStatCard}>
                  <Text style={styles.glassStatValue}>{grade}</Text>
                  <Text style={styles.glassStatLabel}>Expected grade</Text>
                </View>
              </View>
            </SafeAreaView>
          </View>
        </ImageBackground>

        {/* ── Content Body below Hero ── */}
        <View style={styles.bodyContent}>
          {/* ── Section: CROP DETAILS ── */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>CROP DETAILS</Text>
          </View>

          <View style={styles.detailsCard}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Zone · Area</Text>
              <Text style={styles.detailValue}>{zoneArea}</Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Variety · Company</Text>
              <Text style={styles.detailValue}>{varietyCompany}</Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Seed used · Cost</Text>
              <Text style={styles.detailValue}>{seedUsedCost}</Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Planted on</Text>
              <Text style={styles.detailValue}>{plantedOn}</Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Expected harvest</Text>
              <Text style={styles.detailValue}>{expectedHarvest}</Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Expected quantity</Text>
              <Text style={styles.detailValue}>{expectedQty}</Text>
            </View>
          </View>

          {/* ── Section: LINKED RECORDS ── */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>LINKED RECORDS</Text>
          </View>

          <View style={styles.linkedRecordsList}>
            {/* Diary entries */}
            <TouchableOpacity
              style={styles.linkedRecordCard}
              onPress={onNavigateToDiary}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="View diary entries"
            >
              <View style={[styles.linkedIconBadge, { backgroundColor: P.twGreen100 }]}>
                <CalendarIcon size={18} color={P.twGreen700} />
              </View>

              <View style={styles.linkedTextCol}>
                <Text style={styles.linkedTitle}>Diary entries</Text>
                <Text style={styles.linkedSubtitle}>{fallback.diarySummary}</Text>
              </View>

              <ChevronRightIcon size={18} color={P.twGray400} />
            </TouchableOpacity>

            {/* Inputs applied */}
            <TouchableOpacity
              style={styles.linkedRecordCard}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="View inputs applied"
            >
              <View style={[styles.linkedIconBadge, { backgroundColor: P.twOrange100 }]}>
                <BeakerIcon size={18} color={P.twOrange600} />
              </View>

              <View style={styles.linkedTextCol}>
                <Text style={styles.linkedTitle}>Inputs applied</Text>
                <Text style={styles.linkedSubtitle}>{fallback.inputsSummary}</Text>
              </View>

              <ChevronRightIcon size={18} color={P.twGray400} />
            </TouchableOpacity>

            {/* Workforce hours */}
            <TouchableOpacity
              style={styles.linkedRecordCard}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="View workforce hours"
            >
              <View style={[styles.linkedIconBadge, { backgroundColor: P.twBlue50 }]}>
                <WorkforceUsersIcon size={18} color={P.twBlue600} />
              </View>

              <View style={styles.linkedTextCol}>
                <Text style={styles.linkedTitle}>Workforce hours</Text>
                <Text style={styles.linkedSubtitle}>{fallback.workforceSummary}</Text>
              </View>

              <ChevronRightIcon size={18} color={P.twGray400} />
            </TouchableOpacity>

            {/* NPK contribution */}
            <TouchableOpacity
              style={[styles.linkedRecordCard, styles.npkCard]}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="View NPK contribution"
            >
              <View style={[styles.linkedIconBadge, { backgroundColor: P.twOrange100 }]}>
                <AnalyticsChartIcon size={18} color={P.twOrange600} />
              </View>

              <View style={styles.linkedTextCol}>
                <Text style={styles.linkedTitle}>NPK contribution</Text>
                <Text style={styles.npkAlertSubtitle}>{fallback.npkSummary}</Text>
              </View>

              <ChevronRightIcon size={18} color={P.twOrange600} />
            </TouchableOpacity>
          </View>

          {/* ── Section: RECENT DIARY ENTRIES ── */}
          <View style={styles.diarySectionHeader}>
            <Text style={styles.sectionTitle}>RECENT DIARY ENTRIES</Text>
            <TouchableOpacity onPress={onNavigateToDiary} activeOpacity={0.7}>
              <Text style={styles.viewAllText}>View all</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.recentDiaryList}>
            {/* Entry 1 */}
            <View style={styles.recentDiaryItem}>
              <View style={[styles.diaryIconBadge, { backgroundColor: P.twGreen100 }]}>
                <SproutDiaryIcon size={16} color={P.twGreen700} />
              </View>

              <View style={styles.diaryTextCol}>
                <Text style={styles.diaryActivityTitle}>Weeding</Text>
                <Text style={styles.diaryActivityTime}>15 Jul · 06:45 AM</Text>
              </View>

              <Text style={styles.diaryDurationText}>50m</Text>
            </View>

            {/* Entry 2 */}
            <View style={styles.recentDiaryItem}>
              <View style={[styles.diaryIconBadge, { backgroundColor: P.twGreen100 }]}>
                <CompostIcon size={16} color={P.twGreen700} />
              </View>

              <View style={styles.diaryTextCol}>
                <Text style={styles.diaryActivityTitle}>Manure application</Text>
                <Text style={styles.diaryActivityTime}>15 Jul · 11:00 AM</Text>
              </View>

              <Text style={styles.diaryDurationText}>1h 15m</Text>
            </View>
          </View>

          <View style={styles.bottomSpacer} />
        </View>
      </ScrollView>
    </View>
  );
}

// ─────────────────────────────────────────────
// Stylesheet (strictly no raw hex literals)
// ─────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: P.paleStoneBg,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  heroBackground: {
    width: '100%',
    minHeight: 290,
  },
  heroBackgroundImage: {
    resizeMode: 'cover',
  },
  heroOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  heroSafeArea: {
    flex: 1,
    paddingTop: 8,
  },
  heroNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    marginBottom: 16,
  },
  heroBackButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroEditButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  heroEditText: {
    color: P.white,
    fontSize: 14,
    fontWeight: '700',
  },
  heroCropInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  heroThumbnailWrapper: {
    width: 52,
    height: 52,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    backgroundColor: P.twGray100,
  },
  heroThumbnail: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  heroTitleCol: {
    marginLeft: 14,
    flex: 1,
  },
  heroCropTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: P.white,
    letterSpacing: -0.3,
  },
  heroCropSubtitle: {
    fontSize: 13,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.85)',
    marginTop: 4,
  },
  heroStatsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  glassStatCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
  },
  glassStatValue: {
    fontSize: 22,
    fontWeight: '800',
    color: P.white,
  },
  glassStatLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.85)',
    marginTop: 2,
  },
  bodyContent: {
    paddingHorizontal: 16,
    paddingTop: 18,
  },
  sectionHeader: {
    marginBottom: 10,
    marginTop: 6,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: P.twGray500,
    letterSpacing: 0.8,
  },
  detailsCard: {
    backgroundColor: P.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: P.twGray200,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginBottom: 20,
    shadowColor: P.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  detailLabel: {
    fontSize: 14,
    color: P.twGray500,
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 14,
    color: P.ink,
    fontWeight: '700',
  },
  divider: {
    height: 1,
    backgroundColor: P.twGray100,
  },
  linkedRecordsList: {
    gap: 12,
    marginBottom: 22,
  },
  linkedRecordCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: P.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: P.twGray200,
    paddingHorizontal: 14,
    paddingVertical: 14,
    shadowColor: P.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 5,
    elevation: 2,
  },
  npkCard: {
    borderColor: P.twOrange200,
  },
  linkedIconBadge: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  linkedTextCol: {
    flex: 1,
    marginLeft: 14,
  },
  linkedTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: P.ink,
  },
  linkedSubtitle: {
    fontSize: 12,
    color: P.twGray500,
    marginTop: 2,
  },
  npkAlertSubtitle: {
    fontSize: 12,
    color: P.twOrange600,
    fontWeight: '600',
    marginTop: 2,
  },
  diarySectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    marginTop: 4,
  },
  viewAllText: {
    fontSize: 13,
    fontWeight: '700',
    color: P.twGreen700,
  },
  recentDiaryList: {
    backgroundColor: P.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: P.twGray200,
    overflow: 'hidden',
    shadowColor: P.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
  },
  recentDiaryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: P.twGray100,
  },
  diaryIconBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  diaryTextCol: {
    flex: 1,
    marginLeft: 12,
  },
  diaryActivityTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: P.ink,
  },
  diaryActivityTime: {
    fontSize: 12,
    color: P.twGray400,
    marginTop: 2,
  },
  diaryDurationText: {
    fontSize: 14,
    fontWeight: '700',
    color: P.twGreen700,
  },
  bottomSpacer: {
    height: 30,
  },
});
