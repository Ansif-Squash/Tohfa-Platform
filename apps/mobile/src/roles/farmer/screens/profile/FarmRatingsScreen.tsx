import React, { useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Circle, Line, Polygon, Text as SvgText } from 'react-native-svg';
import { Icon } from '@tohfa/mobile-ui';
import { t, type TranslationKey } from '../../../../i18n/farmer';
import { authPalette as P, colors } from '../../theme';

interface FarmRatingsScreenProps {
  onNavigateBack: () => void;
}

// Category defs carry i18n *keys*, not resolved strings -- the actual
// labels are resolved inside the component on every render (via `t()`) so
// the radar chart and list re-render correctly when the locale switcher in
// App.tsx's header changes languages. A module-level array of already
// translated strings would freeze at whatever locale was active when the
// module first loaded.
const CATEGORY_DEFS: Array<{
  id: string;
  nameKey: TranslationKey;
  shortKey: TranslationKey;
  score: number;
  delta: number;
  icon: string;
  color: string;
  tagKeys?: TranslationKey[];
}> = [
  {
    id: 'cert',
    nameKey: 'farmer.profile.rating.cat.certification',
    shortKey: 'farmer.profile.rating.catShort.cert',
    score: 9,
    delta: 1,
    icon: 'shield',
    color: P.primary,
    tagKeys: [
      'farmer.profile.rating.tag.validCertification',
      'farmer.profile.rating.tag.yearsSinceRenewal',
      'farmer.profile.rating.tag.complianceRecord',
      'farmer.profile.rating.tag.transitionStatus',
    ],
  },
  { id: 'soil', nameKey: 'farmer.profile.rating.cat.soil', shortKey: 'farmer.profile.rating.catShort.soil', score: 8, delta: 1, icon: 'eco', color: P.primary },
  { id: 'prac', nameKey: 'farmer.profile.rating.cat.practices', shortKey: 'farmer.profile.rating.catShort.practices', score: 9, delta: 0, icon: 'science', color: P.primary },
  { id: 'env', nameKey: 'farmer.profile.rating.cat.environment', shortKey: 'farmer.profile.rating.catShort.environment', score: 8, delta: 2, icon: 'park', color: P.primary },
  { id: 'yield', nameKey: 'farmer.profile.rating.cat.yield', shortKey: 'farmer.profile.rating.catShort.yield', score: 7, delta: 1, icon: 'star', color: P.primary },
  { id: 'trace', nameKey: 'farmer.profile.rating.cat.traceability', shortKey: 'farmer.profile.rating.catShort.traceability', score: 6, delta: -1, icon: 'QR', color: P.orange700 },
  { id: 'social', nameKey: 'farmer.profile.rating.cat.social', shortKey: 'farmer.profile.rating.catShort.social', score: 8, delta: 0, icon: 'groups', color: P.primary },
  { id: 'fin', nameKey: 'farmer.profile.rating.cat.financial', shortKey: 'farmer.profile.rating.catShort.financial', score: 5, delta: -1, icon: 'credit_card', color: P.red700 },
  { id: 'mkt', nameKey: 'farmer.profile.rating.cat.market', shortKey: 'farmer.profile.rating.catShort.market', score: 7, delta: 1, icon: 'storefront', color: P.primary },
  { id: 'innov', nameKey: 'farmer.profile.rating.cat.innovation', shortKey: 'farmer.profile.rating.catShort.innovation', score: 6, delta: 1, icon: 'lightbulb', color: P.primary },
];

export function FarmRatingsScreen({ onNavigateBack }: FarmRatingsScreenProps): React.JSX.Element {
  const [expandedId, setExpandedId] = useState<string | null>('cert');

  const categories = CATEGORY_DEFS.map((def) => ({
    ...def,
    name: t(def.nameKey),
    short: t(def.shortKey),
    tags: def.tagKeys?.map((key) => t(key)),
  }));

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const renderRadarChart = () => {
    const size = 280;
    const center = size / 2;
    const maxRadius = 90;
    const numCategories = categories.length;
    const angleStep = (2 * Math.PI) / numCategories;

    // Helper to get coordinates
    const getCoords = (score: number, index: number, radiusMax: number = maxRadius) => {
      const angle = -Math.PI / 2 + index * angleStep; // Start at top
      const r = (score / 10) * radiusMax;
      return {
        x: center + r * Math.cos(angle),
        y: center + r * Math.sin(angle),
      };
    };

    // Build data polygon points
    const dataPoints = categories
      .map((cat, i) => {
        const { x, y } = getCoords(cat.score, i);
        return `${x},${y}`;
      })
      .join(' ');

    return (
      <View style={styles.radarContainer}>
        <Svg width={size} height={size}>
          {/* Concentric polygons for background (2, 4, 6, 8, 10) */}
          {[2, 4, 6, 8, 10].map((step) => {
            const points = categories
              .map((_, i) => {
                const { x, y } = getCoords(10, i, maxRadius * (step / 10));
                return `${x},${y}`;
              })
              .join(' ');
            return <Polygon key={`grid-${step}`} points={points} stroke={P.slate200} strokeWidth="1" fill="none" />;
          })}

          {/* Axes lines */}
          {categories.map((_, i) => {
            const { x, y } = getCoords(10, i);
            return <Line key={`axis-${i}`} x1={center} y1={center} x2={x} y2={y} stroke={P.slate200} strokeWidth="1" />;
          })}

          {/* Data Polygon */}
          <Polygon points={dataPoints} fill="rgba(46, 125, 50, 0.2)" stroke={P.primary} strokeWidth="2" strokeLinejoin="round" />

          {/* Data Points */}
          {categories.map((cat, i) => {
            const { x, y } = getCoords(cat.score, i);
            return <Circle key={`point-${i}`} cx={x} cy={y} r="4" fill={P.primary} />;
          })}

          {/* Labels */}
          {categories.map((cat, i) => {
            // Push labels out a bit further than maxRadius
            const { x, y } = getCoords(10, i, maxRadius + 20);
            return (
              <SvgText key={`label-${i}`} x={x} y={y} fill={P.slate500} fontSize="10" textAnchor="middle" alignmentBaseline="middle">
                {cat.short}
              </SvgText>
            );
          })}
        </Svg>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar barStyle="light-content" backgroundColor={P.deepGreen} />

      {/* Header Section */}
      <View style={styles.header}>
        <View style={styles.headerNavRow}>
          <TouchableOpacity style={styles.navCircleButton} onPress={onNavigateBack}>
            <Text style={styles.navBackIcon}>‹</Text>
          </TouchableOpacity>
          <View style={styles.headerTitleBox}>
            <Text style={styles.headerTitle}>{t('farmer.profile.rating.title')}</Text>
            <Text style={styles.headerSubtitle}>{t('farmer.profile.rating.updatesAfterAudit')}</Text>
          </View>
          <TouchableOpacity style={styles.navCircleButtonOutline}>
            <Text style={styles.navActionIcon}>?</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.scoreRow}>
          <Text style={styles.mainScore}>73</Text>
          <Text style={styles.maxScore}>{t('farmer.profile.rating.outOf', { max: 100 })}</Text>
          <View style={[styles.deltaBadge, styles.deltaBadgeRow]}>
            <Icon name="trending_up" size={13} color={P.white} />
            <Text style={styles.deltaBadgeText}>{t('farmer.profile.rating.deltaQuarter', { points: 4 })}</Text>
          </View>
        </View>

        <Text style={styles.recalcText}>{t('farmer.profile.rating.recalculated', { date: '18 Jul 2025' })}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Radar Chart */}
        <View style={styles.chartCard}>{renderRadarChart()}</View>

        {/* Focus Next Section */}
        <View style={styles.focusCard}>
          <View style={styles.focusHeader}>
            <Icon name="info" size={18} color={P.darkGreyText} style={styles.focusIcon} />
            <Text style={styles.focusTitle}>{t('farmer.profile.rating.focusNext')}</Text>
          </View>

          <View style={styles.focusTilesRow}>
            {/* Financial & Operational Tile */}
            <View style={[styles.focusTile, { backgroundColor: P.red50 }]}>
              <Text style={[styles.focusTileTitle, { color: P.red800 }]}>{t('farmer.profile.rating.cat.financial')}</Text>
              <View style={styles.focusTileScoreRow}>
                <Text style={[styles.focusTileScore, { color: P.red800 }]}>5</Text>
                <Text style={styles.focusTileScoreMax}>{t('farmer.profile.rating.outOf', { max: 10 })}</Text>
                <Text style={[styles.focusTileDelta, { color: P.red800 }]}>↓1</Text>
              </View>
            </View>

            {/* Traceability Tile */}
            <View style={[styles.focusTile, { backgroundColor: P.orange50 }]}>
              <Text style={[styles.focusTileTitle, { color: P.orange900 }]}>{t('farmer.profile.rating.cat.traceability')}</Text>
              <View style={styles.focusTileScoreRow}>
                <Text style={[styles.focusTileScore, { color: P.orange900 }]}>6</Text>
                <Text style={styles.focusTileScoreMax}>{t('farmer.profile.rating.outOf', { max: 10 })}</Text>
                <Text style={[styles.focusTileDelta, { color: P.orange900 }]}>↓1</Text>
              </View>
            </View>
          </View>
        </View>

        <Text style={styles.sectionHeading}>{t('farmer.profile.rating.categoryBreakdown')}</Text>

        {/* Category List */}
        <View style={styles.categoryList}>
          {categories.map((cat) => {
            const isExpanded = expandedId === cat.id;
            return (
              <View key={cat.id} style={styles.categoryCard}>
                <TouchableOpacity style={styles.categoryRow} onPress={() => toggleExpand(cat.id)} activeOpacity={0.7}>
                  <View style={styles.catIconContainer}>
                    {cat.icon === 'QR' ? (
                      <Text style={[styles.catIconEmoji, { fontSize: 12 }]}>QR</Text>
                    ) : (
                      <Icon name={cat.icon} size={18} color={cat.color} />
                    )}
                  </View>

                  <View style={styles.catInfo}>
                    <Text style={styles.catName}>{cat.name}</Text>
                    <View style={styles.barTrack}>
                      <View style={[styles.barFill, { width: `${cat.score * 10}%`, backgroundColor: cat.color }]} />
                    </View>
                  </View>

                  <View style={styles.catScoreSection}>
                    <View style={styles.catScoreRow}>
                      <Text style={[styles.catScore, { color: cat.color }]}>{cat.score}</Text>
                      <Text style={styles.catScoreMax}>{t('farmer.profile.rating.outOf', { max: 10 })}</Text>
                    </View>
                    <View style={styles.catDeltaRow}>
                      {cat.delta > 0 && <Text style={[styles.catDelta, { color: P.primary }]}>↑{cat.delta}</Text>}
                      {cat.delta < 0 && <Text style={[styles.catDelta, { color: P.red700 }]}>↓{Math.abs(cat.delta)}</Text>}
                      {cat.delta === 0 && <Text style={styles.catDeltaNeutral}>–</Text>}
                      <Text style={styles.chevron}>{isExpanded ? '⌃' : '⌄'}</Text>
                    </View>
                  </View>
                </TouchableOpacity>

                {isExpanded && cat.tags && (
                  <View style={styles.tagsContainer}>
                    {cat.tags.map((tag) => (
                      <View key={tag} style={styles.tagPill}>
                        <Text style={styles.tagText}>{tag}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            );
          })}
        </View>

        <TouchableOpacity style={styles.calcButton}>
          <Text style={styles.calcButtonIcon}>?</Text>
          <Text style={styles.calcButtonText}>{t('farmer.profile.rating.howCalculated')}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: P.slate50 },
  header: {
    backgroundColor: P.deepGreen,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  headerNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  navCircleButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  navCircleButtonOutline: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  navBackIcon: { color: P.white, fontSize: 24, lineHeight: 28, marginRight: 2 },
  navActionIcon: { color: P.white, fontSize: 16, fontWeight: 'bold' },
  headerTitleBox: { flex: 1, marginLeft: 16 },
  headerTitle: { color: P.white, fontSize: 20, fontWeight: 'bold' },
  headerSubtitle: { color: P.green200, fontSize: 13, marginTop: 2 },

  scoreRow: { flexDirection: 'row', alignItems: 'baseline', marginBottom: 8 },
  mainScore: { color: P.white, fontSize: 48, fontWeight: '800', letterSpacing: -1 },
  maxScore: { color: P.green200, fontSize: 20, fontWeight: 'bold', marginLeft: 2, marginRight: 12 },
  deltaBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  deltaBadgeRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  deltaBadgeText: { color: P.white, fontSize: 13, fontWeight: 'bold' },
  recalcText: { color: colors.brandGreenLight, fontSize: 13 },

  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },

  chartCard: {
    backgroundColor: P.white,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: P.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  radarContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },

  focusCard: {
    backgroundColor: P.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: P.deepOrange400,
  },
  focusHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  focusIcon: { fontSize: 18, marginRight: 8 },
  focusTitle: { fontSize: 16, fontWeight: 'bold', color: P.darkGreyText },
  focusTilesRow: { flexDirection: 'row', gap: 12 },
  focusTile: {
    flex: 1,
    borderRadius: 12,
    padding: 16,
  },
  focusTileTitle: { fontSize: 14, fontWeight: '600', marginBottom: 12, height: 38 },
  focusTileScoreRow: { flexDirection: 'row', alignItems: 'baseline' },
  focusTileScore: { fontSize: 24, fontWeight: 'bold' },
  focusTileScoreMax: { fontSize: 12, color: P.midGrey, marginLeft: 2 },
  focusTileDelta: { fontSize: 14, fontWeight: 'bold', marginLeft: 8 },

  sectionHeading: {
    fontSize: 12,
    fontWeight: 'bold',
    color: P.placeholderGrey,
    marginBottom: 12,
    marginLeft: 4,
    textTransform: 'uppercase',
  },

  categoryList: { gap: 12 },
  categoryCard: {
    backgroundColor: P.white,
    borderRadius: 16,
    padding: 16,
    shadowColor: P.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  catIconContainer: { width: 24, alignItems: 'center' },
  catIconEmoji: { fontSize: 18 },
  catInfo: { flex: 1, marginLeft: 12, marginRight: 16 },
  catName: { fontSize: 15, fontWeight: '600', color: P.inkBlack, marginBottom: 8 },
  barTrack: { height: 6, backgroundColor: P.slate100, borderRadius: 3, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 3 },

  catScoreSection: { alignItems: 'flex-end', justifyContent: 'center' },
  catScoreRow: { flexDirection: 'row', alignItems: 'baseline', marginBottom: 4 },
  catScore: { fontSize: 16, fontWeight: 'bold' },
  catScoreMax: { fontSize: 11, color: P.placeholderGrey, marginLeft: 1 },
  catDeltaRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  catDelta: { fontSize: 12, fontWeight: 'bold' },
  catDeltaNeutral: { fontSize: 12, fontWeight: 'bold', color: P.mutedGrey },
  chevron: { fontSize: 16, color: P.midGrey, lineHeight: 18 },

  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: P.slate100,
  },
  tagPill: {
    backgroundColor: P.slate50,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: P.slate200,
  },
  tagText: { fontSize: 12, color: P.slate600, fontWeight: '500' },

  calcButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: P.white,
    borderWidth: 1,
    borderColor: P.slate200,
    padding: 16,
    borderRadius: 12,
    marginTop: 24,
  },
  calcButtonIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: P.primary,
    color: P.primary,
    textAlign: 'center',
    lineHeight: 18,
    fontSize: 12,
    fontWeight: 'bold',
    marginRight: 8,
  },
  calcButtonText: {
    color: P.primary,
    fontSize: 14,
    fontWeight: '600',
  },
});
