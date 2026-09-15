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

interface FarmRatingsScreenProps {
  onNavigateBack: () => void;
}

const CATEGORIES = [
  { id: 'cert', name: 'Certification & Compliance', short: 'Cert', score: 9, delta: 1, icon: '🛡️', color: '#2E7D32', tags: ['Valid certification', 'Years since renewal', 'Compliance record', 'Transition status'] },
  { id: 'soil', name: 'Soil & Land Management', short: 'Soil', score: 8, delta: 1, icon: '🌿', color: '#2E7D32' },
  { id: 'prac', name: 'Farming Practices', short: 'Practices', score: 9, delta: 0, icon: '🚜', color: '#2E7D32' },
  { id: 'env', name: 'Environmental Sustainability', short: 'Environ', score: 8, delta: 2, icon: '🍃', color: '#2E7D32' },
  { id: 'yield', name: 'Produce Quality & Yield', short: 'Yield', score: 7, delta: 1, icon: '🍎', color: '#2E7D32' },
  { id: 'trace', name: 'Traceability & Transparency', short: 'Trace', score: 6, delta: -1, icon: 'QR', color: '#F57C00' },
  { id: 'social', name: 'Social & Labor Practices', short: 'Social', score: 8, delta: 0, icon: '👥', color: '#2E7D32' },
  { id: 'fin', name: 'Financial & Operational', short: 'Finance', score: 5, delta: -1, icon: '🏦', color: '#D32F2F' },
  { id: 'mkt', name: 'Market & Buyer Relations', short: 'Market', score: 7, delta: 1, icon: '🏪', color: '#2E7D32' },
  { id: 'innov', name: 'Innovation & Improvement', short: 'Innov', score: 6, delta: 1, icon: '💡', color: '#2E7D32' },
];

export function FarmRatingsScreen({ onNavigateBack }: FarmRatingsScreenProps): React.JSX.Element {
  const [expandedId, setExpandedId] = useState<string | null>('cert');

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const renderRadarChart = () => {
    const size = 280;
    const center = size / 2;
    const maxRadius = 90;
    const numCategories = CATEGORIES.length;
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
    const dataPoints = CATEGORIES.map((cat, i) => {
      const { x, y } = getCoords(cat.score, i);
      return `${x},${y}`;
    }).join(' ');

    return (
      <View style={styles.radarContainer}>
        <Svg width={size} height={size}>
          {/* Concentric polygons for background (2, 4, 6, 8, 10) */}
          {[2, 4, 6, 8, 10].map((step) => {
            const points = CATEGORIES.map((_, i) => {
              const { x, y } = getCoords(10, i, maxRadius * (step / 10));
              return `${x},${y}`;
            }).join(' ');
            return (
              <Polygon
                key={`grid-${step}`}
                points={points}
                stroke="#E2E8F0"
                strokeWidth="1"
                fill="none"
              />
            );
          })}

          {/* Axes lines */}
          {CATEGORIES.map((_, i) => {
            const { x, y } = getCoords(10, i);
            return (
              <Line
                key={`axis-${i}`}
                x1={center}
                y1={center}
                x2={x}
                y2={y}
                stroke="#E2E8F0"
                strokeWidth="1"
              />
            );
          })}

          {/* Data Polygon */}
          <Polygon
            points={dataPoints}
            fill="rgba(46, 125, 50, 0.2)"
            stroke="#2E7D32"
            strokeWidth="2"
            strokeLinejoin="round"
          />

          {/* Data Points */}
          {CATEGORIES.map((cat, i) => {
            const { x, y } = getCoords(cat.score, i);
            return (
              <Circle key={`point-${i}`} cx={x} cy={y} r="4" fill="#2E7D32" />
            );
          })}

          {/* Labels */}
          {CATEGORIES.map((cat, i) => {
            // Push labels out a bit further than maxRadius
            const { x, y } = getCoords(10, i, maxRadius + 20);
            return (
              <SvgText
                key={`label-${i}`}
                x={x}
                y={y}
                fill="#64748B"
                fontSize="10"
                textAnchor="middle"
                alignmentBaseline="middle"
              >
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
      <StatusBar barStyle="light-content" backgroundColor="#1B5E20" />

      {/* Header Section */}
      <View style={styles.header}>
        <View style={styles.headerNavRow}>
          <TouchableOpacity style={styles.navCircleButton} onPress={onNavigateBack}>
            <Text style={styles.navBackIcon}>‹</Text>
          </TouchableOpacity>
          <View style={styles.headerTitleBox}>
            <Text style={styles.headerTitle}>Farm Ratings</Text>
            <Text style={styles.headerSubtitle}>Updates after each audit</Text>
          </View>
          <TouchableOpacity style={styles.navCircleButtonOutline}>
            <Text style={styles.navActionIcon}>?</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.scoreRow}>
          <Text style={styles.mainScore}>73</Text>
          <Text style={styles.maxScore}>/100</Text>
          <View style={styles.deltaBadge}>
            <Text style={styles.deltaBadgeText}>📈 +4 this quarter</Text>
          </View>
        </View>

        <Text style={styles.recalcText}>
          Recalculated 18 Jul 2025, after your last audit
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Radar Chart */}
        <View style={styles.chartCard}>
          {renderRadarChart()}
        </View>

        {/* Focus Next Section */}
        <View style={styles.focusCard}>
          <View style={styles.focusHeader}>
            <Text style={styles.focusIcon}>🎯</Text>
            <Text style={styles.focusTitle}>Where to focus next</Text>
          </View>

          <View style={styles.focusTilesRow}>
            {/* Financial & Operational Tile */}
            <View style={[styles.focusTile, { backgroundColor: '#FFEBEE' }]}>
              <Text style={[styles.focusTileTitle, { color: '#C62828' }]}>Financial &{'\n'}Operational</Text>
              <View style={styles.focusTileScoreRow}>
                <Text style={[styles.focusTileScore, { color: '#C62828' }]}>5</Text>
                <Text style={styles.focusTileScoreMax}>/10</Text>
                <Text style={[styles.focusTileDelta, { color: '#C62828' }]}>↓1</Text>
              </View>
            </View>

            {/* Traceability Tile */}
            <View style={[styles.focusTile, { backgroundColor: '#FFF3E0' }]}>
              <Text style={[styles.focusTileTitle, { color: '#E65100' }]}>Traceability</Text>
              <View style={styles.focusTileScoreRow}>
                <Text style={[styles.focusTileScore, { color: '#E65100' }]}>6</Text>
                <Text style={styles.focusTileScoreMax}>/10</Text>
                <Text style={[styles.focusTileDelta, { color: '#E65100' }]}>↓1</Text>
              </View>
            </View>
          </View>
        </View>

        <Text style={styles.sectionHeading}>CATEGORY BREAKDOWN</Text>

        {/* Category List */}
        <View style={styles.categoryList}>
          {CATEGORIES.map((cat) => {
            const isExpanded = expandedId === cat.id;
            return (
              <View key={cat.id} style={styles.categoryCard}>
                <TouchableOpacity
                  style={styles.categoryRow}
                  onPress={() => toggleExpand(cat.id)}
                  activeOpacity={0.7}
                >
                  <View style={styles.catIconContainer}>
                    {cat.icon === '🛡️' ? (
                       <Text style={styles.catIconEmoji}>🛡️</Text>
                    ) : cat.icon === 'QR' ? (
                       <Text style={[styles.catIconEmoji, {fontSize: 12}]}>QR</Text>
                    ) : (
                       <Text style={styles.catIconEmoji}>{cat.icon}</Text>
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
                      <Text style={styles.catScoreMax}>/10</Text>
                    </View>
                    <View style={styles.catDeltaRow}>
                      {cat.delta > 0 && <Text style={[styles.catDelta, { color: '#2E7D32' }]}>↑{cat.delta}</Text>}
                      {cat.delta < 0 && <Text style={[styles.catDelta, { color: '#D32F2F' }]}>↓{Math.abs(cat.delta)}</Text>}
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
          <Text style={styles.calcButtonText}>How this is calculated</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F8FAFC' },
  header: {
    backgroundColor: '#1B5E20',
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
  navBackIcon: { color: '#FFF', fontSize: 24, lineHeight: 28, marginRight: 2 },
  navActionIcon: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  headerTitleBox: { flex: 1, marginLeft: 16 },
  headerTitle: { color: '#FFF', fontSize: 20, fontWeight: 'bold' },
  headerSubtitle: { color: '#A5D6A7', fontSize: 13, marginTop: 2 },
  
  scoreRow: { flexDirection: 'row', alignItems: 'baseline', marginBottom: 8 },
  mainScore: { color: '#FFF', fontSize: 48, fontWeight: '800', letterSpacing: -1 },
  maxScore: { color: '#A5D6A7', fontSize: 20, fontWeight: 'bold', marginLeft: 2, marginRight: 12 },
  deltaBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  deltaBadgeText: { color: '#FFF', fontSize: 13, fontWeight: 'bold' },
  recalcText: { color: '#E8F5E9', fontSize: 13 },

  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  
  chartCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#000',
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
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#FF7043',
  },
  focusHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  focusIcon: { fontSize: 18, marginRight: 8 },
  focusTitle: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  focusTilesRow: { flexDirection: 'row', gap: 12 },
  focusTile: {
    flex: 1,
    borderRadius: 12,
    padding: 16,
  },
  focusTileTitle: { fontSize: 14, fontWeight: '600', marginBottom: 12, height: 38 },
  focusTileScoreRow: { flexDirection: 'row', alignItems: 'baseline' },
  focusTileScore: { fontSize: 24, fontWeight: 'bold' },
  focusTileScoreMax: { fontSize: 12, color: '#666', marginLeft: 2 },
  focusTileDelta: { fontSize: 14, fontWeight: 'bold', marginLeft: 8 },

  sectionHeading: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#888',
    marginBottom: 12,
    marginLeft: 4,
    textTransform: 'uppercase',
  },

  categoryList: { gap: 12 },
  categoryCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
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
  catName: { fontSize: 15, fontWeight: '600', color: '#222', marginBottom: 8 },
  barTrack: { height: 6, backgroundColor: '#F1F5F9', borderRadius: 3, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 3 },
  
  catScoreSection: { alignItems: 'flex-end', justifyContent: 'center' },
  catScoreRow: { flexDirection: 'row', alignItems: 'baseline', marginBottom: 4 },
  catScore: { fontSize: 16, fontWeight: 'bold' },
  catScoreMax: { fontSize: 11, color: '#888', marginLeft: 1 },
  catDeltaRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  catDelta: { fontSize: 12, fontWeight: 'bold' },
  catDeltaNeutral: { fontSize: 12, fontWeight: 'bold', color: '#999' },
  chevron: { fontSize: 16, color: '#666', lineHeight: 18 },

  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  tagPill: {
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  tagText: { fontSize: 12, color: '#475569', fontWeight: '500' },

  calcButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
    borderRadius: 12,
    marginTop: 24,
  },
  calcButtonIcon: {
    width: 20, height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#2E7D32',
    color: '#2E7D32',
    textAlign: 'center',
    lineHeight: 18,
    fontSize: 12,
    fontWeight: 'bold',
    marginRight: 8,
  },
  calcButtonText: {
    color: '#2E7D32',
    fontSize: 14,
    fontWeight: '600',
  },
});
