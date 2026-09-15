import React from 'react';
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Line, Polyline, Circle } from 'react-native-svg';

interface SoilTestScreenProps {
  onNavigateBack: () => void;
  onNavigateToNewSoilTest?: () => void;
}

export function SoilTestScreen({ onNavigateBack, onNavigateToNewSoilTest }: SoilTestScreenProps): React.JSX.Element {
  const renderTrendChart = (
    data: number[],
    color: string,
    isDeclining: boolean,
    title: string,
    subtitle: string,
    subtitleColor: string
  ) => {
    // Simple line chart using SVG
    const width = 120;
    const height = 40;
    const padding = 5;
    
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;
    
    const points = data.map((val, index) => {
      const x = padding + (index / (data.length - 1)) * (width - padding * 2);
      const y = height - padding - ((val - min) / range) * (height - padding * 2);
      return { x, y };
    });

    const pointsStr = points.map(p => `${p.x},${p.y}`).join(' ');

    return (
      <View style={styles.trendCard}>
        <View style={styles.trendHeader}>
          <Text style={styles.trendTitle}>{title}</Text>
          <Text style={[styles.trendIcon, { color }]}>{isDeclining ? '📉' : '📈'}</Text>
        </View>
        <Svg width={width} height={height} style={styles.trendChart}>
          <Polyline points={pointsStr} fill="none" stroke={color} strokeWidth="2" />
          {points.map((p, i) => (
            <Circle key={i} cx={p.x} cy={p.y} r="3" fill={color} />
          ))}
        </Svg>
        <Text style={[styles.trendSubtitle, { color: subtitleColor }]}>{subtitle}</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.navCircleButton} onPress={onNavigateBack}>
          <Text style={styles.navBackIcon}>‹</Text>
        </TouchableOpacity>
        <View style={styles.headerTitleBox}>
          <Text style={styles.headerTitle}>Soil Test</Text>
          <Text style={styles.headerSubtitle}>Latest results & testing history</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Next Test Card */}
        <View style={styles.dateCard}>
          <Text style={styles.dateIcon}>🗓️</Text>
          <View style={styles.dateInfo}>
            <Text style={styles.dateTitle}>Tested 12 Jun 2026</Text>
            <Text style={styles.dateSubtitle}>Next test due 11 Jun 2027 · 330 days away</Text>
          </View>
        </View>

        {/* Alert Box */}
        <View style={styles.alertBox}>
          <Text style={styles.alertIcon}>❗</Text>
          <View style={styles.alertInfo}>
            <Text style={styles.alertTitle}>Soil is acidic — pH 5.8</Text>
            <Text style={styles.alertDesc}>
              Below the 6.0–7.5 ideal range. Apply agricultural lime (dolomite) before the next sowing and re-test in 3 months. A TOHFA field officer can advise dosage.
            </Text>
          </View>
        </View>

        <Text style={styles.sectionHeading}>LATEST RESULTS</Text>

        {/* Results List */}
        <View style={styles.resultsCard}>
          {/* Result Item 1 */}
          <View style={styles.resultItem}>
            <View style={styles.resultInfo}>
              <Text style={styles.resultName}>Organic Carbon</Text>
              <Text style={styles.resultIdeal}>Ideal 0.51–0.75%</Text>
            </View>
            <View style={styles.resultValueBox}>
              <Text style={styles.resultValue}>0.62<Text style={styles.resultUnit}>%</Text></Text>
              <View style={[styles.badge, { backgroundColor: '#E3F2FD' }]}>
                <Text style={[styles.badgeText, { color: '#1565C0' }]}>MEDIUM</Text>
              </View>
            </View>
          </View>
          <View style={styles.divider} />

          {/* Result Item 2 */}
          <View style={styles.resultItem}>
            <View style={styles.resultInfo}>
              <Text style={styles.resultName}>pH</Text>
              <Text style={styles.resultIdeal}>Ideal 6.0–7.5</Text>
            </View>
            <View style={styles.resultValueBox}>
              <Text style={[styles.resultValue, { color: '#C62828' }]}>5.8</Text>
              <View style={[styles.badge, { backgroundColor: '#FFEBEE' }]}>
                <Text style={[styles.badgeText, { color: '#C62828' }]}>ACIDIC</Text>
              </View>
            </View>
          </View>
          <View style={styles.divider} />

          {/* Result Item 3 */}
          <View style={styles.resultItem}>
            <View style={styles.resultInfo}>
              <Text style={styles.resultName}>EC</Text>
              <Text style={styles.resultIdeal}>Ideal 0.0–1.0 dS/m</Text>
            </View>
            <View style={styles.resultValueBox}>
              <Text style={styles.resultValue}>0.7<Text style={styles.resultUnit}>dS/m</Text></Text>
              <View style={[styles.badge, { backgroundColor: '#E8F5E9' }]}>
                <Text style={[styles.badgeText, { color: '#2E7D32' }]}>GOOD</Text>
              </View>
            </View>
          </View>
          <View style={styles.divider} />

          {/* Result Item 4 */}
          <View style={styles.resultItem}>
            <View style={styles.resultInfo}>
              <Text style={styles.resultName}>TDS</Text>
              <Text style={styles.resultIdeal}>Ideal 0–500 ppm</Text>
            </View>
            <View style={styles.resultValueBox}>
              <Text style={styles.resultValue}>312<Text style={styles.resultUnit}>ppm</Text></Text>
              <View style={[styles.badge, { backgroundColor: '#E8F5E9' }]}>
                <Text style={[styles.badgeText, { color: '#2E7D32' }]}>GOOD</Text>
              </View>
            </View>
          </View>
          <View style={styles.divider} />

          {/* Result Item 5 */}
          <View style={[styles.resultItem, { paddingBottom: 0 }]}>
            <View style={styles.resultInfo}>
              <Text style={styles.resultName}>Lime Status</Text>
              <Text style={styles.resultIdeal}>Calcareousness</Text>
            </View>
            <View style={styles.resultValueBox}>
              <View style={[styles.badge, { backgroundColor: '#E8F5E9', marginLeft: 0 }]}>
                <Text style={[styles.badgeText, { color: '#2E7D32' }]}>HARMLESS</Text>
              </View>
            </View>
          </View>
        </View>

        <Text style={styles.sectionHeading}>3-YEAR TREND</Text>

        <View style={styles.trendRow}>
          {renderTrendChart([6.4, 6.1, 5.8], '#C62828', true, 'pH', 'Declining — turning acidic', '#C62828')}
          {renderTrendChart([0.55, 0.59, 0.62], '#2E7D32', false, 'Organic Carbon', 'Improving steadily', '#666')}
        </View>

        <View style={styles.documentCard}>
          <View style={styles.docIconBox}>
            <Text style={styles.docIcon}>📄</Text>
          </View>
          <View style={styles.docInfo}>
            <Text style={styles.docName}>soil_report_jun2026.pdf</Text>
            <Text style={styles.docMeta}>Lab report · 820 KB</Text>
          </View>
          <TouchableOpacity style={styles.docAction}>
            <Text style={styles.docActionIcon}>👁️</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionHeading}>TEST HISTORY</Text>

        <View style={styles.historyList}>
          {/* History 1 */}
          <View style={styles.historyCard}>
            <View style={styles.historyInfo}>
              <View style={styles.historyHeaderRow}>
                <Text style={styles.historyDate}>12 Jun 2026</Text>
                <View style={[styles.badge, { backgroundColor: '#E8F5E9', paddingVertical: 2, paddingHorizontal: 6 }]}>
                  <Text style={[styles.badgeText, { color: '#2E7D32', fontSize: 10 }]}>LATEST</Text>
                </View>
              </View>
              <Text style={styles.historySummary}>pH 5.8 · OC 0.62% · EC 0.7</Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </View>

          {/* History 2 */}
          <View style={styles.historyCard}>
            <View style={styles.historyInfo}>
              <View style={styles.historyHeaderRow}>
                <Text style={styles.historyDate}>05 Jun 2025</Text>
              </View>
              <Text style={styles.historySummary}>pH 6.1 · OC 0.59% · EC 0.6</Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </View>

          {/* History 3 */}
          <View style={styles.historyCard}>
            <View style={styles.historyInfo}>
              <View style={styles.historyHeaderRow}>
                <Text style={styles.historyDate}>20 May 2024</Text>
              </View>
              <Text style={styles.historySummary}>pH 6.4 · OC 0.55% · EC 0.6</Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </View>
        </View>
      </ScrollView>

      {/* Sticky Bottom Button */}
      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.primaryButton} onPress={() => onNavigateToNewSoilTest?.()}>
          <Text style={styles.primaryButtonIcon}>📄</Text>
          <Text style={styles.primaryButtonText}>Upload New Report</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F8FAFC' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  navCircleButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  navBackIcon: { color: '#2E7D32', fontSize: 24, lineHeight: 28, marginRight: 2 },
  headerTitleBox: { flex: 1, marginLeft: 16 },
  headerTitle: { color: '#1B5E20', fontSize: 20, fontWeight: 'bold' },
  headerSubtitle: { color: '#64748B', fontSize: 13, marginTop: 2 },

  scrollContent: {
    padding: 16,
    paddingBottom: 100, // Space for bottom button
  },

  dateCard: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  dateIcon: { fontSize: 24, marginRight: 16 },
  dateInfo: { flex: 1 },
  dateTitle: { fontSize: 16, fontWeight: 'bold', color: '#1E293B', marginBottom: 4 },
  dateSubtitle: { fontSize: 13, color: '#64748B' },

  alertBox: {
    flexDirection: 'row',
    backgroundColor: '#FFEBEE',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#FFCDD2',
  },
  alertIcon: { fontSize: 20, color: '#C62828', marginRight: 12, fontWeight: 'bold' },
  alertInfo: { flex: 1 },
  alertTitle: { fontSize: 15, fontWeight: 'bold', color: '#C62828', marginBottom: 6 },
  alertDesc: { fontSize: 13, color: '#C62828', lineHeight: 20 },

  sectionHeading: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#888',
    marginBottom: 12,
    marginLeft: 4,
    textTransform: 'uppercase',
  },

  resultsCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  resultInfo: { flex: 1 },
  resultName: { fontSize: 16, fontWeight: '600', color: '#1E293B', marginBottom: 4 },
  resultIdeal: { fontSize: 12, color: '#94A3B8' },
  resultValueBox: { flexDirection: 'row', alignItems: 'center' },
  resultValue: { fontSize: 18, fontWeight: 'bold', color: '#1E293B' },
  resultUnit: { fontSize: 12, fontWeight: '600', color: '#64748B' },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 12,
  },
  badgeText: { fontSize: 11, fontWeight: 'bold' },
  divider: { height: 1, backgroundColor: '#F1F5F9' },

  trendRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  trendCard: {
    flex: 1,
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  trendHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  trendTitle: { fontSize: 14, fontWeight: '600', color: '#1E293B' },
  trendIcon: { fontSize: 16 },
  trendChart: { marginVertical: 12 },
  trendSubtitle: { fontSize: 11 },

  documentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  docIconBox: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#FFEBEE',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  docIcon: { fontSize: 20 },
  docInfo: { flex: 1 },
  docName: { fontSize: 14, fontWeight: '600', color: '#1E293B', marginBottom: 2 },
  docMeta: { fontSize: 12, color: '#64748B' },
  docAction: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  docActionIcon: { fontSize: 16 },

  historyList: { gap: 12 },
  historyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  historyInfo: { flex: 1 },
  historyHeaderRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  historyDate: { fontSize: 15, fontWeight: 'bold', color: '#1E293B', marginRight: 8 },
  historySummary: { fontSize: 13, color: '#64748B' },
  chevron: { fontSize: 20, color: '#94A3B8' },

  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  primaryButton: {
    backgroundColor: '#2E7D32',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
  },
  primaryButtonIcon: { fontSize: 18, marginRight: 8, color: '#FFF' },
  primaryButtonText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
});
