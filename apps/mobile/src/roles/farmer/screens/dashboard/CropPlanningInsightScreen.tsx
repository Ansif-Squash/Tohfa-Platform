import React, { useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
} from 'react-native';
import Svg, { Path, Circle, Line } from 'react-native-svg';

// ── SVG Icons ────────────────────────────────────────────────────────────────

const ChevronLeft = () => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Path d="M15 18L9 12L15 6" stroke="#2e7d32" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const LightbulbIcon = () => (
  <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
    <Path d="M9 21H15M12 3C8.68629 3 6 5.68629 6 9C6 11.2208 7.20683 13.1599 9 14.1973V17H15V14.1973C16.7932 13.1599 18 11.2208 18 9C18 5.68629 15.3137 3 12 3Z" stroke="#2E7D32" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const FarmerIcon = ({ color = '#15803D' }: { color?: string }) => (
  <Svg width={12} height={12} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="8" r="4" stroke={color} strokeWidth="2.5" />
    <Path d="M4 21C4 17.134 7.13401 14 11 14H13C16.866 14 20 17.134 20 21" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
  </Svg>
);

const SeedlingIcon = ({ color = '#15803D' }: { color?: string }) => (
  <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
    <Path d="M12 22V12" stroke={color} strokeWidth="2" strokeLinecap="round" />
    <Path d="M7 12C7 9.24 9.24 7 12 7C14.76 7 17 9.24 17 12" stroke={color} strokeWidth="2" strokeLinecap="round" />
    <Path d="M4 8C4 5 7 2 12 2C17 2 20 5 20 8" stroke={color} strokeWidth="2" strokeLinecap="round" />
  </Svg>
);

const CheckCircleIcon = ({ color = '#6B7280' }: { color?: string }) => (
  <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth="2" />
    <Path d="M8 12L11 15L16 9" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const ArrowsIcon = ({ color = '#C2410C' }: { color?: string }) => (
  <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
    <Path d="M7 17L17 7" stroke={color} strokeWidth="2" strokeLinecap="round" />
    <Path d="M7 7H17V17" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const PlusCircleIcon = ({ color = '#15803D' }: { color?: string }) => (
  <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth="2" />
    <Line x1="12" y1="8" x2="12" y2="16" stroke={color} strokeWidth="2" strokeLinecap="round" />
    <Line x1="8" y1="12" x2="16" y2="12" stroke={color} strokeWidth="2" strokeLinecap="round" />
  </Svg>
);

const SwitchIcon = ({ color = '#C2410C' }: { color?: string }) => (
  <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
    <Path d="M7 16L3 12L7 8" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M17 8L21 12L17 16" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M3 12H21" stroke={color} strokeWidth="2" strokeLinecap="round" />
  </Svg>
);

const DiversifyIcon = ({ color = '#92400E' }: { color?: string }) => (
  <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
    <Path d="M12 3V12" stroke={color} strokeWidth="2" strokeLinecap="round" />
    <Path d="M12 12L6 18" stroke={color} strokeWidth="2" strokeLinecap="round" />
    <Path d="M12 12L18 18" stroke={color} strokeWidth="2" strokeLinecap="round" />
    <Path d="M12 12L4 8" stroke={color} strokeWidth="2" strokeLinecap="round" />
    <Path d="M12 12L20 8" stroke={color} strokeWidth="2" strokeLinecap="round" />
  </Svg>
);

// ── Types ────────────────────────────────────────────────────────────────────

type CropStatus = 'Under-supplied' | 'Balanced' | 'Over-supplied';
type FilterType = 'All' | CropStatus;

interface CropInsight {
  name: string;
  youGrow: boolean;
  status: CropStatus;
  supplyKg: number;
  demandKg: number;
  demandEstimated?: boolean;
  insightBold: string;
  insightBody: string;
}

// ── Data ─────────────────────────────────────────────────────────────────────

const CROPS: CropInsight[] = [
  {
    name: 'Carrot',
    youGrow: true,
    status: 'Under-supplied',
    supplyKg: 6800,
    demandKg: 8400,
    insightBold: 'Plant more.',
    insightBody: 'Demand is running 24% ahead of supply — expand next cycle.',
  },
  {
    name: 'Beetroot',
    youGrow: false,
    status: 'Under-supplied',
    supplyKg: 2100,
    demandKg: 3600,
    insightBold: 'Consider adding this crop.',
    insightBody: 'Demand is 71% ahead of supply — a fresh opportunity.',
  },
  {
    name: 'Tomato',
    youGrow: true,
    status: 'Balanced',
    supplyKg: 6600,
    demandKg: 7200,
    insightBold: 'Continue as-is.',
    insightBody: 'Supply and demand are well matched — no strong signal.',
  },
  {
    name: 'Cabbage',
    youGrow: true,
    status: 'Over-supplied',
    supplyKg: 7400,
    demandKg: 4100,
    insightBold: 'Consider diversifying.',
    insightBody: 'Supply exceeds demand by 80% — ease back next cycle.',
  },
  {
    name: 'Potato',
    youGrow: false,
    status: 'Over-supplied',
    supplyKg: 9200,
    demandKg: 4600,
    demandEstimated: true,
    insightBold: 'Switch crop.',
    insightBody: 'The market is well stocked — a higher-demand crop would pay off more.',
  },
];

// ── Style helpers ────────────────────────────────────────────────────────────

function statusConfig(status: CropStatus) {
  switch (status) {
    case 'Under-supplied':
      return {
        badgeBg: '#DCFCE7',
        badgeText: '#15803D',
        supplyBarColor: '#66BB6A',
        demandBarColor: '#2E7D32',
        insightBg: '#F0FDF4',
        insightBorder: '#D1FAE5',
        insightIconColor: '#15803D',
      };
    case 'Balanced':
      return {
        badgeBg: '#F3F4F6',
        badgeText: '#374151',
        supplyBarColor: '#60A5FA',
        demandBarColor: '#1E40AF',
        insightBg: '#F9FAFB',
        insightBorder: '#E5E7EB',
        insightIconColor: '#6B7280',
      };
    case 'Over-supplied':
      return {
        badgeBg: '#FEF3C7',
        badgeText: '#92400E',
        supplyBarColor: '#FBBF24',
        demandBarColor: '#D97706',
        insightBg: '#FFFBEB',
        insightBorder: '#FDE68A',
        insightIconColor: '#92400E',
      };
  }
}

function getInsightIcon(crop: CropInsight) {
  const cfg = statusConfig(crop.status);
  if (crop.status === 'Under-supplied') {
    if (crop.youGrow) return <SeedlingIcon color={cfg.insightIconColor} />;
    return <PlusCircleIcon color={cfg.insightIconColor} />;
  }
  if (crop.status === 'Balanced') {
    return <CheckCircleIcon color={cfg.insightIconColor} />;
  }
  // Over-supplied
  if (crop.youGrow) return <DiversifyIcon color={cfg.insightIconColor} />;
  return <SwitchIcon color={cfg.insightIconColor} />;
}

// ── Component ────────────────────────────────────────────────────────────────

interface CropPlanningInsightScreenProps {
  onNavigateBack: () => void;
}

export function CropPlanningInsightScreen({ onNavigateBack }: CropPlanningInsightScreenProps): React.JSX.Element {
  const [filter, setFilter] = useState<FilterType>('All');

  const filteredCrops = filter === 'All' ? CROPS : CROPS.filter(c => c.status === filter);

  const FILTERS: FilterType[] = ['All', 'Under-supplied', 'Balanced', 'Over-supplied'];

  return (
    <SafeAreaView style={styles.screen}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onNavigateBack} activeOpacity={0.7}>
          <ChevronLeft />
        </TouchableOpacity>
        <View style={styles.headerTextWrap}>
          <Text style={styles.headerTitle}>Crop Planning Insight</Text>
          <Text style={styles.headerSubtitle}>Supply vs. customer demand</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Info Banner */}
        <View style={styles.infoBanner}>
          <View style={styles.infoBannerIcon}>
            <LightbulbIcon />
          </View>
          <Text style={styles.infoBannerText}>
            This is a <Text style={styles.bold}>planning signal, not a guarantee</Text>. It compares what farmers grow against what customers are asking for.
          </Text>
        </View>

        {/* Filter Pills */}
        <View style={styles.filterRow}>
          {FILTERS.map((f) => (
            <TouchableOpacity
              key={f}
              style={[styles.filterPill, filter === f && styles.filterPillActive]}
              onPress={() => setFilter(f)}
              activeOpacity={0.7}
            >
              <Text style={[styles.filterPillText, filter === f && styles.filterPillTextActive]}>{f}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Crop Cards */}
        {filteredCrops.map((crop) => {
          const cfg = statusConfig(crop.status);
          const maxVal = Math.max(crop.supplyKg, crop.demandKg);
          const supplyPercent = (crop.supplyKg / maxVal) * 100;
          const demandPercent = (crop.demandKg / maxVal) * 100;

          return (
            <View key={crop.name} style={styles.cropCard}>
              {/* Card Header */}
              <View style={styles.cropCardHeader}>
                <Text style={styles.cropName}>{crop.name}</Text>
                {crop.youGrow && (
                  <View style={styles.youGrowBadge}>
                    <FarmerIcon color="#15803D" />
                    <Text style={styles.youGrowText}>You grow this</Text>
                  </View>
                )}
                <View style={[styles.statusBadge, { backgroundColor: cfg.badgeBg }]}>
                  <Text style={[styles.statusBadgeText, { color: cfg.badgeText }]}>{crop.status}</Text>
                </View>
              </View>

              {/* Supply Bar */}
              <View style={styles.barSection}>
                <View style={styles.barLabelRow}>
                  <Text style={styles.barLabel}>Supply</Text>
                  <Text style={styles.barValue}>{crop.supplyKg.toLocaleString()} kg</Text>
                </View>
                <View style={styles.barTrack}>
                  <View style={[styles.barFill, { width: `${supplyPercent}%`, backgroundColor: cfg.supplyBarColor }]} />
                </View>
              </View>

              {/* Demand Bar */}
              <View style={styles.barSection}>
                <View style={styles.barLabelRow}>
                  <Text style={styles.barLabel}>Demand</Text>
                  <Text style={styles.barValue}>
                    {crop.demandKg.toLocaleString()} kg{crop.demandEstimated ? '  est.' : ''}
                  </Text>
                </View>
                <View style={styles.barTrack}>
                  <View style={[styles.barFill, { width: `${demandPercent}%`, backgroundColor: cfg.demandBarColor }]} />
                </View>
              </View>

              {/* Insight Card */}
              <View style={[styles.insightCard, { backgroundColor: cfg.insightBg, borderColor: cfg.insightBorder }]}>
                <View style={styles.insightIconWrap}>
                  {getInsightIcon(crop)}
                </View>
                <Text style={styles.insightText}>
                  <Text style={styles.bold}>{crop.insightBold}</Text> {crop.insightBody}
                </Text>
              </View>
            </View>
          );
        })}

        {/* Footer Note */}
        <Text style={styles.footerNote}>
          Demand for crops outside the wishlist top-5 (est.) is a placeholder baseline pending real figures.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#FAFAF7',
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0EEE6',
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F0FFF0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerTextWrap: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A2E1A',
    letterSpacing: 0.3,
  },
  headerSubtitle: {
    fontSize: 13,
    fontWeight: '400',
    color: '#6B7566',
    marginTop: 1,
  },

  // Scroll
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 32,
  },

  // Info Banner
  infoBanner: {
    flexDirection: 'row',
    backgroundColor: '#EAF3DE',
    borderRadius: 12,
    padding: 14,
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  infoBannerIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#D4EED8',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  infoBannerText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 19,
    color: '#3A5A3A',
  },
  bold: {
    fontWeight: '700',
    color: '#1A2E1A',
  },

  // Filter Pills
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  filterPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8E6DD',
  },
  filterPillActive: {
    backgroundColor: '#1A2E1A',
    borderColor: '#1A2E1A',
  },
  filterPillText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#374151',
  },
  filterPillTextActive: {
    color: '#FFFFFF',
  },

  // Crop Card
  cropCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#F0EEE6',
  },
  cropCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  cropName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A2E1A',
  },
  youGrowBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  youGrowText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#15803D',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },

  // Bar Section
  barSection: {
    marginBottom: 10,
  },
  barLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  barLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: '#6B7566',
  },
  barValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1A2E1A',
  },
  barTrack: {
    height: 8,
    backgroundColor: '#F0EEE6',
    borderRadius: 4,
    overflow: 'hidden',
  },
  barFill: {
    height: 8,
    borderRadius: 4,
  },

  // Insight Card
  insightCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: 10,
    borderWidth: 1,
    padding: 12,
    marginTop: 6,
    gap: 10,
  },
  insightIconWrap: {
    marginTop: 2,
  },
  insightText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 19,
    color: '#374151',
  },

  // Footer
  footerNote: {
    fontSize: 11,
    fontWeight: '400',
    color: '#B8B6AA',
    textAlign: 'center',
    marginTop: 8,
    fontStyle: 'italic',
    lineHeight: 16,
    paddingHorizontal: 20,
  },
});
