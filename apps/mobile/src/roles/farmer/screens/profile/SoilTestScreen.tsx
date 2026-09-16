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
import { Icon } from '@tohfa/mobile-ui';
import { t } from '../../../../i18n/farmer';
import { authPalette as P, colors } from '../../theme';

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
    subtitleColor: string,
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

    const pointsStr = points.map((p) => `${p.x},${p.y}`).join(' ');

    return (
      <View style={styles.trendCard}>
        <View style={styles.trendHeader}>
          <Text style={styles.trendTitle}>{title}</Text>
          <Icon
            name="trending_up"
            size={16}
            color={color}
            style={isDeclining ? styles.trendIconDeclining : undefined}
          />
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
      <StatusBar barStyle="dark-content" backgroundColor={P.white} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.navCircleButton} onPress={onNavigateBack}>
          <Text style={styles.navBackIcon}>‹</Text>
        </TouchableOpacity>
        <View style={styles.headerTitleBox}>
          <Text style={styles.headerTitle}>{t('farmer.profile.soil.title')}</Text>
          <Text style={styles.headerSubtitle}>{t('farmer.profile.soil.headerSubtitle')}</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Next Test Card */}
        <View style={styles.dateCard}>
          <Icon name="calendar_today" size={24} color={P.deepGreen} style={styles.dateIcon} />
          <View style={styles.dateInfo}>
            <Text style={styles.dateTitle}>{t('farmer.profile.soil.testedOn', { date: '12 Jun 2026' })}</Text>
            <Text style={styles.dateSubtitle}>
              {t('farmer.profile.soil.nextDueAway', { date: '11 Jun 2027', days: 330 })}
            </Text>
          </View>
        </View>

        {/* Alert Box */}
        <View style={styles.alertBox}>
          <Text style={styles.alertIcon}>❗</Text>
          <View style={styles.alertInfo}>
            <Text style={styles.alertTitle}>{t('farmer.profile.soil.alertTitle', { value: '5.8' })}</Text>
            <Text style={styles.alertDesc}>{t('farmer.profile.soil.alertDesc')}</Text>
          </View>
        </View>

        <Text style={styles.sectionHeading}>{t('farmer.profile.soil.sectionLatestResults')}</Text>

        {/* Results List */}
        <View style={styles.resultsCard}>
          {/* Result Item 1 */}
          <View style={styles.resultItem}>
            <View style={styles.resultInfo}>
              <Text style={styles.resultName}>{t('farmer.profile.soil.organicCarbon')}</Text>
              <Text style={styles.resultIdeal}>{t('farmer.profile.soil.idealOrganicCarbon')}</Text>
            </View>
            <View style={styles.resultValueBox}>
              <Text style={styles.resultValue}>0.62<Text style={styles.resultUnit}>%</Text></Text>
              <View style={[styles.badge, { backgroundColor: P.blue50 }]}>
                <Text style={[styles.badgeText, { color: P.blue800 }]}>{t('farmer.profile.soil.badgeMedium')}</Text>
              </View>
            </View>
          </View>
          <View style={styles.divider} />

          {/* Result Item 2 */}
          <View style={styles.resultItem}>
            <View style={styles.resultInfo}>
              <Text style={styles.resultName}>{t('farmer.profile.soil.phShort')}</Text>
              <Text style={styles.resultIdeal}>{t('farmer.profile.soil.idealPh')}</Text>
            </View>
            <View style={styles.resultValueBox}>
              <Text style={[styles.resultValue, { color: P.red800 }]}>5.8</Text>
              <View style={[styles.badge, { backgroundColor: P.red50 }]}>
                <Text style={[styles.badgeText, { color: P.red800 }]}>{t('farmer.profile.soil.acidic')}</Text>
              </View>
            </View>
          </View>
          <View style={styles.divider} />

          {/* Result Item 3 */}
          <View style={styles.resultItem}>
            <View style={styles.resultInfo}>
              <Text style={styles.resultName}>{t('farmer.profile.soil.ecShort')}</Text>
              <Text style={styles.resultIdeal}>{t('farmer.profile.soil.idealEc')}</Text>
            </View>
            <View style={styles.resultValueBox}>
              <Text style={styles.resultValue}>0.7<Text style={styles.resultUnit}>dS/m</Text></Text>
              <View style={[styles.badge, { backgroundColor: colors.brandGreenLight }]}>
                <Text style={[styles.badgeText, { color: P.primary }]}>{t('farmer.profile.soil.good')}</Text>
              </View>
            </View>
          </View>
          <View style={styles.divider} />

          {/* Result Item 4 */}
          <View style={styles.resultItem}>
            <View style={styles.resultInfo}>
              <Text style={styles.resultName}>{t('farmer.profile.soil.tdsShort')}</Text>
              <Text style={styles.resultIdeal}>{t('farmer.profile.soil.idealTds')}</Text>
            </View>
            <View style={styles.resultValueBox}>
              <Text style={styles.resultValue}>312<Text style={styles.resultUnit}>ppm</Text></Text>
              <View style={[styles.badge, { backgroundColor: colors.brandGreenLight }]}>
                <Text style={[styles.badgeText, { color: P.primary }]}>{t('farmer.profile.soil.good')}</Text>
              </View>
            </View>
          </View>
          <View style={styles.divider} />

          {/* Result Item 5 */}
          <View style={[styles.resultItem, { paddingBottom: 0 }]}>
            <View style={styles.resultInfo}>
              <Text style={styles.resultName}>{t('farmer.profile.soil.limeStatus')}</Text>
              <Text style={styles.resultIdeal}>{t('farmer.profile.soil.calcareousness')}</Text>
            </View>
            <View style={styles.resultValueBox}>
              <View style={[styles.badge, { backgroundColor: colors.brandGreenLight, marginLeft: 0 }]}>
                <Text style={[styles.badgeText, { color: P.primary }]}>{t('farmer.profile.soil.badgeHarmless')}</Text>
              </View>
            </View>
          </View>
        </View>

        <Text style={styles.sectionHeading}>{t('farmer.profile.soil.sectionTrend')}</Text>

        <View style={styles.trendRow}>
          {renderTrendChart(
            [6.4, 6.1, 5.8],
            P.red800,
            true,
            t('farmer.profile.soil.phShort'),
            t('farmer.profile.soil.trendDeclining'),
            P.red800,
          )}
          {renderTrendChart(
            [0.55, 0.59, 0.62],
            P.primary,
            false,
            t('farmer.profile.soil.organicCarbon'),
            t('farmer.profile.soil.trendImproving'),
            P.midGrey,
          )}
        </View>

        <View style={styles.documentCard}>
          <View style={styles.docIconBox}>
            <Icon name="description" size={20} color={P.red800} />
          </View>
          <View style={styles.docInfo}>
            <Text style={styles.docName}>soil_report_jun2026.pdf</Text>
            <Text style={styles.docMeta}>{t('farmer.profile.soil.documentMeta', { size: '820 KB' })}</Text>
          </View>
          <TouchableOpacity style={styles.docAction}>
            <Icon name="visibility" size={16} color={P.slate600} />
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionHeading}>{t('farmer.profile.soil.sectionHistory')}</Text>

        <View style={styles.historyList}>
          {/* History 1 */}
          <View style={styles.historyCard}>
            <View style={styles.historyInfo}>
              <View style={styles.historyHeaderRow}>
                <Text style={styles.historyDate}>12 Jun 2026</Text>
                <View style={[styles.badge, { backgroundColor: colors.brandGreenLight, paddingVertical: 2, paddingHorizontal: 6 }]}>
                  <Text style={[styles.badgeText, { color: P.primary, fontSize: 10 }]}>{t('farmer.profile.soil.badgeLatest')}</Text>
                </View>
              </View>
              <Text style={styles.historySummary}>
                {t('farmer.profile.soil.historySummary', { ph: '5.8', oc: '0.62', ec: '0.7' })}
              </Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </View>

          {/* History 2 */}
          <View style={styles.historyCard}>
            <View style={styles.historyInfo}>
              <View style={styles.historyHeaderRow}>
                <Text style={styles.historyDate}>05 Jun 2025</Text>
              </View>
              <Text style={styles.historySummary}>
                {t('farmer.profile.soil.historySummary', { ph: '6.1', oc: '0.59', ec: '0.6' })}
              </Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </View>

          {/* History 3 */}
          <View style={styles.historyCard}>
            <View style={styles.historyInfo}>
              <View style={styles.historyHeaderRow}>
                <Text style={styles.historyDate}>20 May 2024</Text>
              </View>
              <Text style={styles.historySummary}>
                {t('farmer.profile.soil.historySummary', { ph: '6.4', oc: '0.55', ec: '0.6' })}
              </Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </View>
        </View>
      </ScrollView>

      {/* Sticky Bottom Button */}
      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.primaryButton} onPress={() => onNavigateToNewSoilTest?.()}>
          <Icon name="upload" size={18} color={P.white} style={styles.primaryButtonIcon} />
          <Text style={styles.primaryButtonText}>{t('farmer.profile.soil.uploadNewReport')}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: P.slate50 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
    backgroundColor: P.white,
    borderBottomWidth: 1,
    borderBottomColor: P.slate100,
  },
  navCircleButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: P.white,
    borderWidth: 1,
    borderColor: P.slate200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navBackIcon: { color: P.primary, fontSize: 24, lineHeight: 28, marginRight: 2 },
  headerTitleBox: { flex: 1, marginLeft: 16 },
  headerTitle: { color: P.deepGreen, fontSize: 20, fontWeight: 'bold' },
  headerSubtitle: { color: P.slate500, fontSize: 13, marginTop: 2 },

  scrollContent: {
    padding: 16,
    paddingBottom: 100, // Space for bottom button
  },

  dateCard: {
    flexDirection: 'row',
    backgroundColor: P.white,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: P.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  dateIcon: { fontSize: 24, marginRight: 16 },
  dateInfo: { flex: 1 },
  dateTitle: { fontSize: 16, fontWeight: 'bold', color: P.slate800, marginBottom: 4 },
  dateSubtitle: { fontSize: 13, color: P.slate500 },

  alertBox: {
    flexDirection: 'row',
    backgroundColor: P.red50,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: P.red100,
  },
  alertIcon: { fontSize: 20, color: P.red800, marginRight: 12, fontWeight: 'bold' },
  alertInfo: { flex: 1 },
  alertTitle: { fontSize: 15, fontWeight: 'bold', color: P.red800, marginBottom: 6 },
  alertDesc: { fontSize: 13, color: P.red800, lineHeight: 20 },

  sectionHeading: {
    fontSize: 12,
    fontWeight: 'bold',
    color: P.placeholderGrey,
    marginBottom: 12,
    marginLeft: 4,
    textTransform: 'uppercase',
  },

  resultsCard: {
    backgroundColor: P.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    shadowColor: P.black,
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
  resultName: { fontSize: 16, fontWeight: '600', color: P.slate800, marginBottom: 4 },
  resultIdeal: { fontSize: 12, color: P.slate400 },
  resultValueBox: { flexDirection: 'row', alignItems: 'center' },
  resultValue: { fontSize: 18, fontWeight: 'bold', color: P.slate800 },
  resultUnit: { fontSize: 12, fontWeight: '600', color: P.slate500 },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 12,
  },
  badgeText: { fontSize: 11, fontWeight: 'bold' },
  divider: { height: 1, backgroundColor: P.slate100 },

  trendRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  trendCard: {
    flex: 1,
    backgroundColor: P.white,
    borderRadius: 16,
    padding: 12,
    shadowColor: P.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  trendHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  trendTitle: { fontSize: 14, fontWeight: '600', color: P.slate800 },
  trendIcon: { fontSize: 16 },
  trendIconDeclining: { transform: [{ scaleY: -1 }] },
  trendChart: { marginVertical: 12 },
  trendSubtitle: { fontSize: 11 },

  documentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: P.white,
    borderRadius: 12,
    padding: 12,
    marginBottom: 24,
    shadowColor: P.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  docIconBox: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: P.red50,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  docIcon: { fontSize: 20 },
  docInfo: { flex: 1 },
  docName: { fontSize: 14, fontWeight: '600', color: P.slate800, marginBottom: 2 },
  docMeta: { fontSize: 12, color: P.slate500 },
  docAction: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: P.slate100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  docActionIcon: { fontSize: 16 },

  historyList: { gap: 12 },
  historyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: P.white,
    borderRadius: 12,
    padding: 16,
    shadowColor: P.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  historyInfo: { flex: 1 },
  historyHeaderRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  historyDate: { fontSize: 15, fontWeight: 'bold', color: P.slate800, marginRight: 8 },
  historySummary: { fontSize: 13, color: P.slate500 },
  chevron: { fontSize: 20, color: P.slate400 },

  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: P.white,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: P.slate100,
  },
  primaryButton: {
    backgroundColor: P.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
  },
  primaryButtonIcon: { fontSize: 18, marginRight: 8, color: P.white },
  primaryButtonText: { color: P.white, fontSize: 16, fontWeight: 'bold' },
});
