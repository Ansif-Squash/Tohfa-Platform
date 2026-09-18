import React, { useCallback, useEffect, useState } from 'react';
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
import { ErrorState, Icon, Skeleton } from '@tohfa/mobile-ui';
import {
  deriveFarmRatingView,
  getMyFarmRating,
  type FarmRating,
  type FarmRatingCategoryCode,
} from '../../api/farmer';
import { t, type TranslationKey } from '../../../../i18n/farmer';
import { authPalette as P, colors } from '../../theme';

interface FarmRatingsScreenProps {
  onNavigateBack: () => void;
}

/** Icon + short (radar-label) key per category, in BR-06's fixed order. Purely
 * cosmetic metadata -- scores and names come from the real fetch below. */
const CATEGORY_META: Record<FarmRatingCategoryCode, { icon: string; shortKey: TranslationKey }> = {
  CERTIFICATION: { icon: 'shield', shortKey: 'farmer.profile.rating.catShort.cert' },
  SOIL_LAND: { icon: 'eco', shortKey: 'farmer.profile.rating.catShort.soil' },
  FARMING_PRACTICES: { icon: 'science', shortKey: 'farmer.profile.rating.catShort.practices' },
  ENVIRONMENTAL: { icon: 'park', shortKey: 'farmer.profile.rating.catShort.environment' },
  PRODUCE_QUALITY: { icon: 'star', shortKey: 'farmer.profile.rating.catShort.yield' },
  TRACEABILITY: { icon: 'visibility', shortKey: 'farmer.profile.rating.catShort.traceability' },
  SOCIAL_LABOR: { icon: 'groups', shortKey: 'farmer.profile.rating.catShort.social' },
  FINANCIAL: { icon: 'credit_card', shortKey: 'farmer.profile.rating.catShort.financial' },
  MARKET_RELATIONS: { icon: 'storefront', shortKey: 'farmer.profile.rating.catShort.market' },
  INNOVATION: { icon: 'lightbulb', shortKey: 'farmer.profile.rating.catShort.innovation' },
};

/**
 * Colour is driven by the category's own real score, not a fixed per-category
 * colour (the old mock hardcoded specific categories as orange/red) -- two
 * farmers with different weak spots should still see the same colour meaning
 * the same score band. Unrated (null) renders muted grey, never as a "0".
 */
function scoreTone(score: number | null): string {
  if (score === null) return P.slate300;
  if (score >= 8) return colors.brandGreen;
  if (score >= 6) return P.green700;
  if (score >= 4) return P.orange700;
  return P.red600;
}

export function FarmRatingsScreen({ onNavigateBack }: FarmRatingsScreenProps): React.JSX.Element {
  const [rating, setRating] = useState<FarmRating | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadRating = useCallback(async () => {
    try {
      setError(null);
      const res = await getMyFarmRating();
      setRating(res);
    } catch {
      setError(t('error.generic'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadRating();
  }, [loadRating]);

  if (loading) {
    return (
      <SafeAreaView style={styles.screen}>
        <StatusBar barStyle="light-content" backgroundColor={P.deepGreen} />
        <View style={styles.skeletonContainer}>
          <Skeleton height={140} width="100%" style={styles.skeletonBlock} />
          <Skeleton height={280} width="100%" style={styles.skeletonBlock} />
          <Skeleton height={200} width="100%" style={styles.skeletonBlock} />
        </View>
      </SafeAreaView>
    );
  }

  if (error && !rating) {
    return (
      <SafeAreaView style={styles.screen}>
        <ErrorState
          error={error}
          onRetry={() => {
            setLoading(true);
            void loadRating();
          }}
        />
      </SafeAreaView>
    );
  }

  const view = deriveFarmRatingView(rating);
  const categories = view.modules.map((mod) => ({
    ...mod,
    name: t(mod.nameKey as TranslationKey),
    short: t(CATEGORY_META[mod.categoryCode].shortKey),
    icon: CATEGORY_META[mod.categoryCode].icon,
    color: scoreTone(mod.score),
  }));

  // "Focus next" surfaces the two lowest *actually scored* categories -- it is
  // derived purely from real scores, never a fabricated trend/delta (the API
  // contract has no history field to compute one from).
  const focusCategories = categories
    .filter((c) => c.isRated && c.score !== null)
    .slice()
    .sort((a, b) => (a.score as number) - (b.score as number))
    .slice(0, 2);

  const renderRadarChart = () => {
    const size = 280;
    const center = size / 2;
    const maxRadius = 90;
    const numCategories = categories.length;
    const angleStep = (2 * Math.PI) / numCategories;

    const getCoords = (score: number, index: number, radiusMax: number = maxRadius) => {
      const angle = -Math.PI / 2 + index * angleStep;
      const r = (score / 10) * radiusMax;
      return {
        x: center + r * Math.cos(angle),
        y: center + r * Math.sin(angle),
      };
    };

    // Unrated categories plot at the centre (score treated as 0 for the
    // shape only) rather than being omitted, so the polygon still has one
    // vertex per category.
    const dataPoints = categories
      .map((cat, i) => {
        const { x, y } = getCoords(cat.score ?? 0, i);
        return `${x},${y}`;
      })
      .join(' ');

    return (
      <View style={styles.radarContainer}>
        <Svg width={size} height={size}>
          {[2, 4, 6, 8, 10].map((step) => {
            const points = categories
              .map((_, i) => {
                const { x, y } = getCoords(10, i, maxRadius * (step / 10));
                return `${x},${y}`;
              })
              .join(' ');
            return <Polygon key={`grid-${step}`} points={points} stroke={P.slate200} strokeWidth="1" fill="none" />;
          })}

          {categories.map((_, i) => {
            const { x, y } = getCoords(10, i);
            return <Line key={`axis-${i}`} x1={center} y1={center} x2={x} y2={y} stroke={P.slate200} strokeWidth="1" />;
          })}

          <Polygon
            points={dataPoints}
            fill={view.isRated ? 'rgba(46, 125, 50, 0.2)' : 'rgba(148, 163, 184, 0.15)'}
            stroke={view.isRated ? P.primary : P.slate300}
            strokeWidth="2"
            strokeLinejoin="round"
          />

          {categories.map((cat, i) => {
            const { x, y } = getCoords(cat.score ?? 0, i);
            return <Circle key={`point-${i}`} cx={x} cy={y} r="4" fill={cat.color} />;
          })}

          {categories.map((cat, i) => {
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
          <Text style={styles.mainScore}>{view.isRated ? view.overallRating : '—'}</Text>
          <Text style={styles.maxScore}>{t('farmer.profile.rating.outOf', { max: 100 })}</Text>
          {view.isRated && view.tierLabelKey ? (
            <View style={[styles.deltaBadge, styles.deltaBadgeRow]}>
              <Text style={styles.deltaBadgeText}>{t(view.tierLabelKey as TranslationKey)}</Text>
            </View>
          ) : null}
        </View>

        <Text style={styles.recalcText}>
          {view.isRated && view.ratedAt
            ? t('farmer.profile.rating.recalculated', { date: new Date(view.ratedAt).toLocaleDateString() })
            : t('farmer.profile.rating.notRatedTitle')}
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {!view.isRated ? (
          <View style={styles.emptyStateCard}>
            <Icon name="info" size={28} color={P.slate400} />
            <Text style={styles.emptyStateTitle}>{t('farmer.profile.rating.notRatedTitle')}</Text>
            <Text style={styles.emptyStateBody}>{t('farmer.profile.rating.notRatedBody')}</Text>
          </View>
        ) : null}

        {/* Radar Chart */}
        <View style={styles.chartCard}>{renderRadarChart()}</View>

        {/* Focus Next Section -- only when there is at least one real score to focus on */}
        {focusCategories.length > 0 ? (
          <View style={styles.focusCard}>
            <View style={styles.focusHeader}>
              <Icon name="info" size={18} color={P.darkGreyText} style={styles.focusIcon} />
              <Text style={styles.focusTitle}>{t('farmer.profile.rating.focusNext')}</Text>
            </View>

            <View style={styles.focusTilesRow}>
              {focusCategories.map((cat) => (
                <View key={cat.categoryCode} style={[styles.focusTile, { backgroundColor: P.red50 }]}>
                  <Text style={[styles.focusTileTitle, { color: cat.color }]}>{cat.name}</Text>
                  <View style={styles.focusTileScoreRow}>
                    <Text style={[styles.focusTileScore, { color: cat.color }]}>{cat.score}</Text>
                    <Text style={styles.focusTileScoreMax}>
                      {t('farmer.profile.rating.outOf', { max: cat.maxScore })}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        ) : null}

        <Text style={styles.sectionHeading}>{t('farmer.profile.rating.categoryBreakdown')}</Text>

        {/* Category List -- all 10, always, per category own empty state */}
        <View style={styles.categoryList}>
          {categories.map((cat) => (
            <View key={cat.categoryCode} style={styles.categoryCard}>
              <View style={styles.categoryRow}>
                <View style={styles.catIconContainer}>
                  <Icon name={cat.icon} size={18} color={cat.color} />
                </View>

                <View style={styles.catInfo}>
                  <Text style={styles.catName}>{cat.name}</Text>
                  <View style={styles.barTrack}>
                    <View
                      style={[
                        styles.barFill,
                        { width: `${(cat.score ?? 0) * 10}%`, backgroundColor: cat.color },
                      ]}
                    />
                  </View>
                </View>

                <View style={styles.catScoreSection}>
                  {cat.isRated ? (
                    <View style={styles.catScoreRow}>
                      <Text style={[styles.catScore, { color: cat.color }]}>{cat.score}</Text>
                      <Text style={styles.catScoreMax}>
                        {t('farmer.profile.rating.outOf', { max: cat.maxScore })}
                      </Text>
                    </View>
                  ) : (
                    <Text style={styles.catNotRated}>{t('farmer.profile.rating.notRatedShort')}</Text>
                  )}
                </View>
              </View>
            </View>
          ))}
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
  skeletonContainer: { padding: 16, gap: 12 },
  skeletonBlock: { borderRadius: 16 },
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

  emptyStateCard: {
    backgroundColor: P.white,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: P.slate200,
  },
  emptyStateTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: P.darkGreyText,
    marginTop: 10,
    marginBottom: 4,
    textAlign: 'center',
  },
  emptyStateBody: {
    fontSize: 13,
    color: P.slate500,
    textAlign: 'center',
    lineHeight: 18,
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
  catInfo: { flex: 1, marginLeft: 12, marginRight: 16 },
  catName: { fontSize: 15, fontWeight: '600', color: P.inkBlack, marginBottom: 8 },
  barTrack: { height: 6, backgroundColor: P.slate100, borderRadius: 3, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 3 },

  catScoreSection: { alignItems: 'flex-end', justifyContent: 'center' },
  catScoreRow: { flexDirection: 'row', alignItems: 'baseline' },
  catScore: { fontSize: 16, fontWeight: 'bold' },
  catScoreMax: { fontSize: 11, color: P.placeholderGrey, marginLeft: 1 },
  catNotRated: { fontSize: 12, fontWeight: '600', color: P.slate400 },

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
