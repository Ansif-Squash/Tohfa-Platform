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
import Svg, { Circle, Line, Path } from 'react-native-svg';
import { Icon } from '@tohfa/mobile-ui';
import { t } from '../../../../i18n/farmer';
import { authPalette as P } from '../../theme';

// ─────────────────────────────────────────────
// Small inline weather glyphs -- Material Symbols' subsetted font (see
// packages/mobile-ui/src/iconCodepoints.ts) has no cloud/moon/rain-drop
// weather glyphs, so these five conditions are drawn directly rather than
// falling back to the `Icon` component's "?" placeholder or (per this app's
// hard no-emoji rule, enforced by foundation.test.ts) raw emoji characters.
// ─────────────────────────────────────────────

type WeatherKind = 'sunny' | 'partlyCloudy' | 'cloudy' | 'rain' | 'lightRain' | 'night';

function WeatherGlyph({ kind, size = 24 }: { kind: WeatherKind; size?: number }) {
  const sun = (
    <>
      <Circle cx="12" cy="12" r="4.5" fill={P.orange400} />
      <Line x1="12" y1="2" x2="12" y2="4.5" stroke={P.orange400} strokeWidth="1.6" strokeLinecap="round" />
      <Line x1="12" y1="19.5" x2="12" y2="22" stroke={P.orange400} strokeWidth="1.6" strokeLinecap="round" />
      <Line x1="2" y1="12" x2="4.5" y2="12" stroke={P.orange400} strokeWidth="1.6" strokeLinecap="round" />
      <Line x1="19.5" y1="12" x2="22" y2="12" stroke={P.orange400} strokeWidth="1.6" strokeLinecap="round" />
    </>
  );
  const cloud = (
    <Path
      d="M7 18h10a4 4 0 0 0 0-8 5.5 5.5 0 0 0-10.9-1A4.5 4.5 0 0 0 7 18z"
      fill={P.slate300}
      stroke={P.slate400}
      strokeWidth="1"
    />
  );
  const rain = (
    <>
      <Line x1="9" y1="19" x2="7.5" y2="22" stroke={P.blue700} strokeWidth="1.6" strokeLinecap="round" />
      <Line x1="13" y1="19" x2="11.5" y2="22" stroke={P.blue700} strokeWidth="1.6" strokeLinecap="round" />
      <Line x1="17" y1="19" x2="15.5" y2="22" stroke={P.blue700} strokeWidth="1.6" strokeLinecap="round" />
    </>
  );
  const moon = <Path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z" fill={P.blueGrey600} />;

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {kind === 'sunny' && sun}
      {kind === 'partlyCloudy' && (
        <>
          <Circle cx="8" cy="8" r="3.2" fill={P.orange400} />
          {cloud}
        </>
      )}
      {kind === 'cloudy' && cloud}
      {kind === 'rain' && (
        <>
          {cloud}
          {rain}
        </>
      )}
      {kind === 'lightRain' && (
        <>
          {cloud}
          <Line x1="10" y1="19" x2="9" y2="21.5" stroke={P.blue700} strokeWidth="1.4" strokeLinecap="round" />
          <Line x1="14" y1="19" x2="13" y2="21.5" stroke={P.blue700} strokeWidth="1.4" strokeLinecap="round" />
        </>
      )}
      {kind === 'night' && moon}
    </Svg>
  );
}

function ThermometerIcon({ size = 18, color = P.red600 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M14 14.76V4a2 2 0 0 0-4 0v10.76a4 4 0 1 0 4 0z"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

interface WeatherScreenProps {
  onNavigateBack: () => void;
}

export function WeatherScreen({ onNavigateBack }: WeatherScreenProps): React.JSX.Element {
  const [expandedAlert, setExpandedAlert] = useState<string | null>('frost');

  const toggleAlert = (id: string) => {
    setExpandedAlert((prev) => (prev === id ? null : id));
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
          <Text style={styles.headerTitle}>{t('farmer.weather.title')}</Text>
          <Text style={styles.headerSubtitle}>
            {t('farmer.weather.subtitleUpdated', { location: t('farmer.dashboard.weather.location'), minutes: 20 })}
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Weather Hero Card */}
        <View style={styles.heroCard}>
          <Text style={styles.heroDate}>Thursday, 17 July · 12:40 PM</Text>
          <View style={styles.heroMain}>
            <View>
              <Text style={styles.heroTemp}>19°</Text>
              <Text style={styles.heroCondition}>{t('farmer.weather.partlyCloudy')}</Text>
            </View>
            <WeatherGlyph kind="partlyCloudy" size={64} />
          </View>

          <View style={styles.heroStatsRow}>
            <View style={styles.heroStatItem}>
              <Icon name="water_drop" size={18} color={P.white} style={styles.heroStatEmoji} />
              <Text style={styles.heroStatValue}>78%</Text>
              <Text style={styles.heroStatLabel}>{t('farmer.dashboard.weather.humidity')}</Text>
            </View>
            <View style={styles.heroStatItem}>
              <Icon name="air" size={18} color={P.white} style={styles.heroStatEmoji} />
              <Text style={styles.heroStatValue}>12 km/h</Text>
              <Text style={styles.heroStatLabel}>{t('farmer.dashboard.weather.wind')}</Text>
            </View>
            <View style={styles.heroStatItem}>
              <ThermometerIcon size={18} color={P.white} />
              <Text style={styles.heroStatValue}>17°</Text>
              <Text style={styles.heroStatLabel}>{t('farmer.weather.feelsLike')}</Text>
            </View>
          </View>
        </View>

        <Text style={styles.sectionHeading}>{t('farmer.weather.activeAlerts')}</Text>

        {/* Alerts List */}
        <View style={styles.alertsList}>
          {/* Frost Alert */}
          <TouchableOpacity
            style={[styles.alertCard, { backgroundColor: P.orange100, borderColor: P.orange300 }]}
            onPress={() => toggleAlert('frost')}
            activeOpacity={0.8}
          >
            <View style={styles.alertHeaderRow}>
              <Text style={[styles.alertIcon, { color: P.orange900 }]}>❄️</Text>
              <View style={styles.alertTitleBox}>
                <Text style={[styles.alertTitle, { color: P.deepOrange900 }]}>{t('farmer.weather.frostAlertTitle')}</Text>
                <Text style={[styles.alertSubtitle, { color: P.deepOrange800 }]}>
                  {t('farmer.weather.frostAlertSubtitle', { time: '6:00 AM', temp: '2°C' })}
                </Text>
              </View>
              <Text style={[styles.chevron, { color: P.deepOrange800 }]}>{expandedAlert === 'frost' ? '⌃' : '⌄'}</Text>
            </View>
            {expandedAlert === 'frost' && (
              <View style={styles.alertDetailsBox}>
                <Text style={[styles.alertDetailsText, { color: P.deepOrange900 }]}>{t('farmer.weather.frostAlertDetails')}</Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Rain Alert */}
          <TouchableOpacity
            style={[styles.alertCard, { backgroundColor: P.white, borderColor: P.slate200 }]}
            onPress={() => toggleAlert('rain')}
            activeOpacity={0.8}
          >
            <View style={styles.alertHeaderRow}>
              <WeatherGlyph kind="rain" size={24} />
              <View style={styles.alertTitleBox}>
                <Text style={[styles.alertTitle, { color: P.slate800 }]}>{t('farmer.weather.rainAlertTitle')}</Text>
                <Text style={[styles.alertSubtitle, { color: P.slate500 }]}>{t('farmer.weather.rainAlertSubtitle')}</Text>
              </View>
              <Text style={[styles.chevron, { color: P.slate500 }]}>{expandedAlert === 'rain' ? '⌃' : '⌄'}</Text>
            </View>
            {expandedAlert === 'rain' && (
              <View style={styles.alertDetailsBox}>
                <Text style={[styles.alertDetailsText, { color: P.slate600 }]}>{t('farmer.weather.rainAlertDetails')}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionHeading}>{t('farmer.weather.next24Hours')}</Text>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.hourlyScroll} contentContainerStyle={styles.hourlyScrollContent}>
          <View style={styles.hourlyBox}>
            <Text style={styles.hourlyTime}>{t('farmer.weather.now')}</Text>
            <WeatherGlyph kind="partlyCloudy" size={24} />
            <Text style={styles.hourlyTemp}>19°</Text>
          </View>
          <View style={styles.hourlyBox}>
            <Text style={styles.hourlyTime}>2 PM</Text>
            <WeatherGlyph kind="sunny" size={24} />
            <Text style={styles.hourlyTemp}>21°</Text>
          </View>
          <View style={styles.hourlyBox}>
            <Text style={styles.hourlyTime}>4 PM</Text>
            <WeatherGlyph kind="cloudy" size={24} />
            <Text style={styles.hourlyTemp}>20°</Text>
          </View>
          <View style={styles.hourlyBox}>
            <Text style={styles.hourlyTime}>6 PM</Text>
            <WeatherGlyph kind="rain" size={24} />
            <Text style={styles.hourlyTemp}>16°</Text>
          </View>
          <View style={styles.hourlyBox}>
            <Text style={styles.hourlyTime}>8 PM</Text>
            <WeatherGlyph kind="night" size={24} />
            <Text style={styles.hourlyTemp}>12°</Text>
          </View>
          <View style={styles.hourlyBox}>
            <Text style={styles.hourlyTime}>10 PM</Text>
            <WeatherGlyph kind="night" size={24} />
            <Text style={styles.hourlyTemp}>9°</Text>
          </View>
        </ScrollView>
        <View style={styles.scrollbarHint}>
          <Text style={styles.scrollbarIcon}>◀</Text>
          <View style={styles.scrollbarTrack}>
            <View style={styles.scrollbarThumb} />
          </View>
          <Text style={styles.scrollbarIcon}>▶</Text>
        </View>

        <Text style={styles.sectionHeading}>{t('farmer.weather.sevenDayForecast')}</Text>

        <View style={styles.forecastList}>
          <View style={styles.forecastRow}>
            <Text style={styles.forecastDay}>{t('farmer.weather.today')}</Text>
            <WeatherGlyph kind="partlyCloudy" size={20} />
            <Text style={styles.forecastSummary}>{t('farmer.weather.partlyCloudyFrost')}</Text>
            <View style={styles.forecastTemps}>
              <Text style={styles.forecastHigh}>21°</Text>
              <Text style={styles.forecastLow}>2°</Text>
            </View>
          </View>

          <View style={styles.forecastRow}>
            <Text style={styles.forecastDay}>Fri</Text>
            <WeatherGlyph kind="sunny" size={20} />
            <Text style={styles.forecastSummary}>{t('farmer.dashboard.weather.sunny')}</Text>
            <View style={styles.forecastTemps}>
              <Text style={styles.forecastHigh}>23°</Text>
              <Text style={styles.forecastLow}>9°</Text>
            </View>
          </View>

          <View style={styles.forecastRow}>
            <Text style={styles.forecastDay}>Sat</Text>
            <WeatherGlyph kind="rain" size={20} />
            <Text style={styles.forecastSummary}>{t('farmer.weather.heavyRainMm', { range: '40–60' })}</Text>
            <View style={styles.forecastTemps}>
              <Text style={styles.forecastHigh}>17°</Text>
              <Text style={styles.forecastLow}>11°</Text>
            </View>
          </View>

          <View style={styles.forecastRow}>
            <Text style={styles.forecastDay}>Sun</Text>
            <WeatherGlyph kind="lightRain" size={20} />
            <Text style={styles.forecastSummary}>{t('farmer.weather.lightShowers')}</Text>
            <View style={styles.forecastTemps}>
              <Text style={styles.forecastHigh}>18°</Text>
              <Text style={styles.forecastLow}>10°</Text>
            </View>
          </View>

          <View style={styles.forecastRow}>
            <Text style={styles.forecastDay}>Mon</Text>
            <WeatherGlyph kind="cloudy" size={20} />
            <Text style={styles.forecastSummary}>{t('farmer.weather.cloudy')}</Text>
            <View style={styles.forecastTemps}>
              <Text style={styles.forecastHigh}>20°</Text>
              <Text style={styles.forecastLow}>10°</Text>
            </View>
          </View>

          <View style={styles.forecastRow}>
            <Text style={styles.forecastDay}>Tue</Text>
            <WeatherGlyph kind="partlyCloudy" size={20} />
            <Text style={styles.forecastSummary}>{t('farmer.weather.partlyCloudy')}</Text>
            <View style={styles.forecastTemps}>
              <Text style={styles.forecastHigh}>22°</Text>
              <Text style={styles.forecastLow}>11°</Text>
            </View>
          </View>

          <View style={[styles.forecastRow, { borderBottomWidth: 0 }]}>
            <Text style={styles.forecastDay}>Wed</Text>
            <WeatherGlyph kind="sunny" size={20} />
            <Text style={styles.forecastSummary}>{t('farmer.dashboard.weather.sunny')}</Text>
            <View style={styles.forecastTemps}>
              <Text style={styles.forecastHigh}>24°</Text>
              <Text style={styles.forecastLow}>12°</Text>
            </View>
          </View>
        </View>
      </ScrollView>
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
    paddingBottom: 40,
  },

  heroCard: {
    backgroundColor: P.blue600,
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
    shadowColor: P.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
  },
  heroDate: { color: P.white, fontSize: 13, fontWeight: '600', marginBottom: 16 },
  heroMain: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  heroTemp: { color: P.white, fontSize: 56, fontWeight: '900', letterSpacing: -2, lineHeight: 60 },
  heroCondition: { color: P.white, fontSize: 18, fontWeight: '600' },
  heroIconBig: { fontSize: 72 },
  heroStatsRow: { flexDirection: 'row', gap: 12 },
  heroStatItem: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  heroStatEmoji: { fontSize: 18, marginBottom: 4 },
  heroStatValue: { color: P.white, fontSize: 14, fontWeight: 'bold', marginBottom: 2 },
  heroStatLabel: { color: P.blue50, fontSize: 11 },

  sectionHeading: {
    fontSize: 12,
    fontWeight: 'bold',
    color: P.placeholderGrey,
    marginBottom: 12,
    marginLeft: 4,
    textTransform: 'uppercase',
  },

  alertsList: { gap: 12, marginBottom: 24 },
  alertCard: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    shadowColor: P.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  alertHeaderRow: { flexDirection: 'row', alignItems: 'center' },
  alertIcon: { fontSize: 24, marginRight: 12 },
  alertTitleBox: { flex: 1 },
  alertTitle: { fontSize: 15, fontWeight: 'bold', marginBottom: 2 },
  alertSubtitle: { fontSize: 13 },
  chevron: { fontSize: 20, marginLeft: 8 },
  alertDetailsBox: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  alertDetailsText: { fontSize: 13, lineHeight: 20 },

  hourlyScroll: { marginHorizontal: -16, marginBottom: 8 },
  hourlyScrollContent: { paddingHorizontal: 16, gap: 12 },
  hourlyBox: {
    backgroundColor: P.white,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 20,
    alignItems: 'center',
    shadowColor: P.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  hourlyTime: { fontSize: 12, fontWeight: 'bold', color: P.slate500, marginBottom: 8 },
  hourlyIcon: { fontSize: 24, marginBottom: 8 },
  hourlyTemp: { fontSize: 16, fontWeight: 'bold', color: P.slate800 },

  scrollbarHint: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 24 },
  scrollbarIcon: { color: P.slate300, fontSize: 10 },
  scrollbarTrack: { height: 6, width: 100, backgroundColor: P.slate200, borderRadius: 3 },
  scrollbarThumb: { height: '100%', width: 40, backgroundColor: P.slate400, borderRadius: 3 },

  forecastList: {
    backgroundColor: P.white,
    borderRadius: 16,
    padding: 16,
    shadowColor: P.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  forecastRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: P.slate100,
  },
  forecastDay: { width: 50, fontSize: 14, fontWeight: 'bold', color: P.slate800 },
  forecastIcon: { width: 30, fontSize: 18, textAlign: 'center' },
  forecastSummary: { flex: 1, fontSize: 13, color: P.slate500, marginLeft: 8 },
  forecastTemps: { flexDirection: 'row', alignItems: 'baseline', gap: 8 },
  forecastHigh: { fontSize: 15, fontWeight: 'bold', color: P.slate800, width: 24, textAlign: 'right' },
  forecastLow: { fontSize: 14, color: P.slate400, width: 24, textAlign: 'right' },
});
