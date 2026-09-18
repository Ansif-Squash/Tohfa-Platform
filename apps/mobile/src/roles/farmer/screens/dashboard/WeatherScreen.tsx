import React, { useCallback, useEffect, useState } from 'react';
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Circle, Line, Path, Rect } from 'react-native-svg';
import { ErrorState, Skeleton } from '@tohfa/mobile-ui';
import { t, type TranslationKey } from '../../../../i18n/farmer';
import { authPalette as P, colors } from '../../theme';
import {
  getFarmWeather,
  type FarmWeather,
  type FarmWeatherAlert,
  type FarmWeatherDaily,
  type WeatherCondition,
} from '../../api/weather';
import { AnimatedWeatherHero } from './AnimatedWeatherHero';

// ─────────────────────────────────────────────
// Weather Glyphs -- Clean vector SVGs for conditions
// Strictly zero raw emoji characters (enforced by foundation.test.ts)
// ─────────────────────────────────────────────

type WeatherKind = 'sunny' | 'partlyCloudy' | 'cloudy' | 'rain' | 'lightRain' | 'night' | 'frost';

function WeatherGlyph({ kind, size = 24 }: { kind: WeatherKind; size?: number }) {
  const sun = (
    <>
      <Circle cx="12" cy="12" r="4.5" fill={P.amberAccent} />
      <Line x1="12" y1="2" x2="12" y2="4.5" stroke={P.amberAccent} strokeWidth="1.8" strokeLinecap="round" />
      <Line x1="12" y1="19.5" x2="12" y2="22" stroke={P.amberAccent} strokeWidth="1.8" strokeLinecap="round" />
      <Line x1="2" y1="12" x2="4.5" y2="12" stroke={P.amberAccent} strokeWidth="1.8" strokeLinecap="round" />
      <Line x1="19.5" y1="12" x2="22" y2="12" stroke={P.amberAccent} strokeWidth="1.8" strokeLinecap="round" />
      <Line x1="4.93" y1="4.93" x2="6.7" y2="6.7" stroke={P.amberAccent} strokeWidth="1.6" strokeLinecap="round" />
      <Line x1="17.3" y1="17.3" x2="19.07" y2="19.07" stroke={P.amberAccent} strokeWidth="1.6" strokeLinecap="round" />
      <Line x1="4.93" y1="19.07" x2="6.7" y2="17.3" stroke={P.amberAccent} strokeWidth="1.6" strokeLinecap="round" />
      <Line x1="17.3" y1="6.7" x2="19.07" y2="4.93" stroke={P.amberAccent} strokeWidth="1.6" strokeLinecap="round" />
    </>
  );

  const cloud = (
    <Path
      d="M7 18h10a4 4 0 0 0 0-8 5.5 5.5 0 0 0-10.9-1A4.5 4.5 0 0 0 7 18z"
      fill={P.slate300}
      stroke={P.slate400}
      strokeWidth="1.2"
    />
  );

  const rain = (
    <>
      <Line x1="9" y1="19" x2="7.5" y2="22" stroke={P.rainAlertIcon} strokeWidth="1.8" strokeLinecap="round" />
      <Line x1="13" y1="19" x2="11.5" y2="22" stroke={P.rainAlertIcon} strokeWidth="1.8" strokeLinecap="round" />
      <Line x1="17" y1="19" x2="15.5" y2="22" stroke={P.rainAlertIcon} strokeWidth="1.8" strokeLinecap="round" />
    </>
  );

  const moon = <Path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z" fill={P.blueGrey600} />;

  const frost = (
    <>
      <Line x1="12" y1="3" x2="12" y2="21" stroke={P.frostAlertBorder} strokeWidth="1.8" strokeLinecap="round" />
      <Line x1="3" y1="12" x2="21" y2="12" stroke={P.frostAlertBorder} strokeWidth="1.8" strokeLinecap="round" />
      <Line x1="5.64" y1="5.64" x2="18.36" y2="18.36" stroke={P.frostAlertBorder} strokeWidth="1.8" strokeLinecap="round" />
      <Line x1="5.64" y1="18.36" x2="18.36" y2="5.64" stroke={P.frostAlertBorder} strokeWidth="1.8" strokeLinecap="round" />
      <Circle cx="12" cy="12" r="2.2" fill={P.frostAlertBorder} />
    </>
  );

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {kind === 'sunny' && sun}
      {kind === 'partlyCloudy' && (
        <>
          <Circle cx="8" cy="8" r="3.2" fill={P.amberAccent} />
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
          <Line x1="10" y1="19" x2="9" y2="21.5" stroke={P.rainAlertIcon} strokeWidth="1.5" strokeLinecap="round" />
          <Line x1="14" y1="19" x2="13" y2="21.5" stroke={P.rainAlertIcon} strokeWidth="1.5" strokeLinecap="round" />
        </>
      )}
      {kind === 'night' && moon}
      {kind === 'frost' && frost}
    </Svg>
  );
}

// Chevron Icons for expandable alerts
function ChevronDownIcon({ size = 20, color = P.stoneMuted }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M6 9l6 6 6-6" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function ChevronUpIcon({ size = 20, color = P.frostAlertBorder }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M18 15l-6-6-6 6" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function SnowflakeAlertIcon({ size = 24, color = P.frostAlertBorder }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 2v20M2 12h20M5 5l14 14M5 19L19 5"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M12 6l2-2M12 6l-2-2M12 18l2 2M12 18l-2 2M6 12l-2 2M6 12l-2-2M18 12l2 2M18 12l2-2"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </Svg>
  );
}

function RainAlertIcon({ size = 24, color = P.rainAlertIcon }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M7 16h10a4 4 0 0 0 0-8 5.5 5.5 0 0 0-10.9-1A4.5 4.5 0 0 0 7 16z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M8 19l-1 2M12 19l-1 2M16 19l-1 2"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
      />
    </Svg>
  );
}

function ShieldCheckIcon({ size = 20, color = P.primary }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M9 12l2 2 4-4" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

/**
 * Maps the API's weather taxonomy onto this screen's illustrated glyph set.
 */
export function glyphForCondition(condition: WeatherCondition): WeatherKind {
  switch (condition) {
    case 'CLEAR':
      return 'sunny';
    case 'CLEAR_NIGHT':
      return 'night';
    case 'PARTLY_CLOUDY':
      return 'partlyCloudy';
    case 'CLOUDY':
    case 'FOG':
      return 'cloudy';
    case 'LIGHT_RAIN':
      return 'lightRain';
    case 'RAIN':
    case 'THUNDERSTORM':
      return 'rain';
    default:
      return 'cloudy';
  }
}

function conditionLabelKey(condition: WeatherCondition): TranslationKey {
  return `farmer.weather.condition.${condition}` as TranslationKey;
}

const WEEKDAY_KEYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const;
const MONTH_KEYS = [
  'jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec',
] as const;

function parseDateOnly(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year ?? 1970, (month ?? 1) - 1, day ?? 1);
}

function formatClockTime(date: Date): string {
  const hours = date.getHours();
  const period = hours >= 12 ? 'PM' : 'AM';
  const hour12 = hours % 12 === 0 ? 12 : hours % 12;
  const minutes = date.getMinutes();
  const paddedMinutes = minutes < 10 ? `0${minutes}` : String(minutes);
  return `${hour12}:${paddedMinutes} ${period}`;
}

function formatHourLabel(date: Date): string {
  const hours = date.getHours();
  const period = hours >= 12 ? 'PM' : 'AM';
  const hour12 = hours % 12 === 0 ? 12 : hours % 12;
  return `${hour12} ${period}`;
}

function formatHeroDate(observedAt: string): string {
  const date = new Date(observedAt);
  const weekdayKey = WEEKDAY_KEYS[date.getDay()] ?? 'sun';
  const monthKey = MONTH_KEYS[date.getMonth()] ?? 'jan';
  return t('farmer.weather.heroDateFormat', {
    weekday: t(`farmer.weather.dayFull.${weekdayKey}` as TranslationKey),
    day: date.getDate(),
    month: t(`farmer.weather.month.${monthKey}` as TranslationKey),
    time: formatClockTime(date),
  });
}

function dayShortLabel(dateStr: string): string {
  const date = parseDateOnly(dateStr);
  const weekdayKey = WEEKDAY_KEYS[date.getDay()] ?? 'sun';
  return t(`farmer.weather.dayShort.${weekdayKey}` as TranslationKey);
}

function forecastSummary(day: FarmWeatherDaily): string {
  const conditionLabel = t(conditionLabelKey(day.condition));
  if (day.precipitationMm > 0) {
    return t('farmer.weather.forecastSummaryRain', {
      condition: conditionLabel,
      mm: Math.round(day.precipitationMm),
    });
  }
  return conditionLabel;
}

function minutesSince(observedAt: string): number {
  const diffMs = Date.now() - new Date(observedAt).getTime();
  return Math.max(0, Math.floor(diffMs / 60000));
}

interface WeatherScreenProps {
  onNavigateBack: () => void;
}

export function WeatherScreen({ onNavigateBack }: WeatherScreenProps): React.JSX.Element {
  const [weather, setWeather] = useState<FarmWeather | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedAlerts, setExpandedAlerts] = useState<Record<string, boolean>>({
    'alert-frost': true,
  });

  const toggleAlert = (id: string) => {
    setExpandedAlerts((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const loadWeather = useCallback(async () => {
    try {
      setError(null);
      const res = await getFarmWeather();
      setWeather(res);
    } catch {
      setError(t('error.generic'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadWeather();
  }, [loadWeather]);

  // Header matching Screen 33 from requirement specification
  const header = (
    <View style={styles.header}>
      <TouchableOpacity
        style={styles.navCircleButton}
        onPress={onNavigateBack}
        accessibilityRole="button"
        accessibilityLabel={t('farmer.common.back')}
        activeOpacity={0.7}
      >
        <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
          <Path
            d="M19 12H5M5 12L12 19M5 12L12 5"
            stroke={P.primary}
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      </TouchableOpacity>
      <View style={styles.headerTitleBox}>
        <Text style={styles.headerTitle}>{t('farmer.weather.title')}</Text>
        <Text style={styles.headerSubtitle}>
          {weather
            ? t('farmer.weather.subtitleUpdated', {
                location: weather.location.village ?? weather.location.farmName,
                minutes: minutesSince(weather.observedAt),
              })
            : t('farmer.common.loading')}
        </Text>
      </View>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.screen}>
        <StatusBar barStyle="dark-content" backgroundColor={P.white} />
        {header}
        <View style={styles.scrollContent}>
          <Skeleton height={240} width="100%" style={styles.skeletonHero} />
          <Skeleton height={110} width="100%" style={styles.skeletonBlock} />
          <Skeleton height={260} width="100%" style={styles.skeletonBlock} />
        </View>
      </SafeAreaView>
    );
  }

  if (error || !weather) {
    return (
      <SafeAreaView style={styles.screen}>
        <StatusBar barStyle="dark-content" backgroundColor={P.white} />
        {header}
        <ErrorState
          error={error}
          onRetry={() => {
            setLoading(true);
            void loadWeather();
          }}
        />
      </SafeAreaView>
    );
  }

  // Read real alerts from weather API response
  const activeAlerts: FarmWeatherAlert[] = weather.alerts ?? [];

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar barStyle="dark-content" backgroundColor={P.white} />
      {header}

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* 1. HERO ANIMATED WEATHER CARD WITH AUTOMATIC SCENE CHANGE */}
        <AnimatedWeatherHero
          current={weather.current}
          observedAt={weather.observedAt}
          formattedDate={formatHeroDate(weather.observedAt)}
          conditionLabel={t(conditionLabelKey(weather.current.condition))}
          humidityLabel={t('farmer.dashboard.weather.humidity')}
          windLabel={t('farmer.dashboard.weather.wind')}
          feelsLikeLabel={t('farmer.weather.feelsLike')}
        />

        {/* 2. ACTIVE ALERTS (REAL DATA FROM WEATHER API) */}
        <Text style={styles.sectionHeading}>ACTIVE ALERTS</Text>
        {activeAlerts.length > 0 ? (
          <View style={styles.alertsContainer}>
            {activeAlerts.map((alert) => {
              const isExpanded = expandedAlerts[alert.id] ?? false;
              const isFrost = alert.type === 'FROST';
              const isRain = alert.type === 'HEAVY_RAIN';

              return (
                <View
                  key={alert.id}
                  style={[
                    styles.alertCard,
                    isFrost ? styles.alertCardFrost : styles.alertCardRain,
                  ]}
                >
                  <TouchableOpacity
                    style={styles.alertHeaderRow}
                    onPress={() => toggleAlert(alert.id)}
                    activeOpacity={0.7}
                    accessibilityRole="button"
                    accessibilityLabel={alert.title}
                  >
                    <View style={styles.alertIconBox}>
                      {isFrost ? (
                        <SnowflakeAlertIcon size={24} color={P.frostAlertBorder} />
                      ) : (
                        <RainAlertIcon size={24} color={P.rainAlertIcon} />
                      )}
                    </View>
                    <View style={styles.alertTextBox}>
                      <Text
                        style={[
                          styles.alertTitle,
                          isFrost ? styles.alertTitleFrost : styles.alertTitleRain,
                        ]}
                      >
                        {alert.title}
                      </Text>
                      <Text
                        style={[
                          styles.alertSubtitle,
                          isFrost ? styles.alertSubtitleFrost : styles.alertSubtitleRain,
                        ]}
                      >
                        {alert.subtitle}
                      </Text>
                    </View>
                    <View style={styles.chevronBox}>
                      {isExpanded ? (
                        <ChevronUpIcon size={20} color={isFrost ? P.frostAlertBorder : P.stoneMuted} />
                      ) : (
                        <ChevronDownIcon size={20} color={isFrost ? P.frostAlertBorder : P.stoneMuted} />
                      )}
                    </View>
                  </TouchableOpacity>

                  {isExpanded && alert.advisory ? (
                    <View
                      style={[
                        styles.alertDetailsBox,
                        isFrost ? styles.alertDetailsBoxFrost : styles.alertDetailsBoxRain,
                      ]}
                    >
                      <Text
                        style={[
                          styles.alertAdvisoryText,
                          isFrost ? styles.alertAdvisoryTextFrost : styles.alertAdvisoryTextRain,
                        ]}
                      >
                        {alert.advisory}
                      </Text>
                    </View>
                  ) : null}
                </View>
              );
            })}
          </View>
        ) : (
          <View style={styles.noAlertsCard}>
            <ShieldCheckIcon size={22} color={P.primary} />
            <Text style={styles.noAlertsText}>
              No active severe weather warnings for your farm. Conditions optimal for current field activities.
            </Text>
          </View>
        )}

        {/* 3. NEXT 24 HOURS (REAL HOURLY DATA) */}
        <Text style={styles.sectionHeading}>NEXT 24 HOURS</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.hourlyScroll}
          contentContainerStyle={styles.hourlyScrollContent}
        >
          {weather.hourly.map((hour, index) => (
            <View key={hour.at} style={styles.hourlyCard}>
              <Text style={styles.hourlyTime}>
                {index === 0 ? t('farmer.weather.now') : formatHourLabel(new Date(hour.at))}
              </Text>
              <View style={styles.hourlyIconBox}>
                <WeatherGlyph kind={glyphForCondition(hour.condition)} size={24} />
              </View>
              <Text style={styles.hourlyTemp}>
                {`${Math.round(hour.temperatureC)}°`}
              </Text>
            </View>
          ))}
        </ScrollView>

        {/* 4. 7-DAY FORECAST (REAL DAILY DATA) */}
        <Text style={styles.sectionHeading}>7-DAY FORECAST</Text>
        <View style={styles.forecastContainer}>
          {weather.daily.map((day, index) => {
            const isLast = index === weather.daily.length - 1;
            return (
              <View
                key={day.date}
                style={[styles.forecastRow, isLast && styles.forecastRowLast]}
              >
                <Text style={styles.forecastDay}>
                  {index === 0 ? t('farmer.weather.today') : dayShortLabel(day.date)}
                </Text>
                <View style={styles.forecastIconBox}>
                  <WeatherGlyph kind={glyphForCondition(day.condition)} size={22} />
                </View>
                <Text style={styles.forecastSummary} numberOfLines={1}>
                  {forecastSummary(day)}
                </Text>
                <View style={styles.forecastTempsBox}>
                  <Text style={styles.forecastHigh}>
                    {`${Math.round(day.maxTempC)}°`}
                  </Text>
                  <Text style={styles.forecastLow}>
                    {`${Math.round(day.minTempC)}°`}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: P.bg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 14,
    backgroundColor: P.white,
    borderBottomWidth: 1,
    borderBottomColor: P.border,
  },
  navCircleButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: P.white,
    borderWidth: 1.5,
    borderColor: colors.borderMedium,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleBox: {
    flex: 1,
    marginLeft: 14,
  },
  headerTitle: {
    color: P.ink,
    fontSize: 17,
    fontWeight: '800',
  },
  headerSubtitle: {
    color: P.stoneMuted,
    fontSize: 11.5,
    marginTop: 1,
  },

  scrollContent: {
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 40,
  },

  skeletonHero: {
    borderRadius: 22,
    marginBottom: 20,
  },
  skeletonBlock: {
    borderRadius: 16,
    marginBottom: 18,
  },

  sectionHeading: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.6,
    color: P.stoneMuted,
    textTransform: 'uppercase',
    marginTop: 14,
    marginBottom: 10,
    paddingHorizontal: 2,
  },

  // Alerts styling
  alertsContainer: {
    gap: 10,
    marginBottom: 10,
  },
  alertCard: {
    borderRadius: 14,
    padding: 13,
  },
  alertCardFrost: {
    backgroundColor: P.frostAlertBg,
    borderLeftWidth: 4,
    borderLeftColor: P.frostAlertBorder,
  },
  alertCardRain: {
    backgroundColor: P.white,
    borderLeftWidth: 4,
    borderLeftColor: P.rainAlertBorder,
    borderWidth: 1,
    borderColor: P.borderLight,
    shadowColor: P.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  alertHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  alertIconBox: {
    marginRight: 11,
    flexShrink: 0,
  },
  alertTextBox: {
    flex: 1,
    minWidth: 0,
  },
  alertTitle: {
    fontSize: 13,
    fontWeight: '800',
  },
  alertTitleFrost: {
    color: P.frostAlertText,
  },
  alertTitleRain: {
    color: P.ink,
  },
  alertSubtitle: {
    fontSize: 11,
    marginTop: 2,
  },
  alertSubtitleFrost: {
    color: P.frostAlertSub,
  },
  alertSubtitleRain: {
    color: P.stoneMuted,
  },
  chevronBox: {
    marginLeft: 8,
  },
  alertDetailsBox: {
    marginTop: 11,
    paddingTop: 11,
    borderTopWidth: 1,
  },
  alertDetailsBoxFrost: {
    borderTopColor: 'rgba(240, 86, 42, 0.22)',
  },
  alertDetailsBoxRain: {
    borderTopColor: colors.borderSoft,
  },
  alertAdvisoryText: {
    fontSize: 11.5,
    lineHeight: 18,
  },
  alertAdvisoryTextFrost: {
    color: P.frostAlertDetail,
  },
  alertAdvisoryTextRain: {
    color: colors.textBody,
  },
  noAlertsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: P.white,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: P.borderLight,
    marginBottom: 10,
  },
  noAlertsText: {
    flex: 1,
    fontSize: 12,
    color: colors.textBody,
    lineHeight: 18,
  },

  // Hourly horizontal scroll
  hourlyScroll: {
    marginHorizontal: -18,
    marginBottom: 8,
  },
  hourlyScrollContent: {
    paddingHorizontal: 18,
    paddingBottom: 4,
    gap: 9,
  },
  hourlyCard: {
    width: 64,
    backgroundColor: P.white,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 6,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: P.borderLight,
    shadowColor: P.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  hourlyTime: {
    fontSize: 11,
    fontWeight: '700',
    color: P.stoneMuted,
  },
  hourlyIconBox: {
    marginVertical: 8,
  },
  hourlyTemp: {
    fontSize: 13,
    fontWeight: '800',
    color: P.ink,
  },

  // 7-day forecast
  forecastContainer: {
    backgroundColor: P.white,
    borderRadius: 16,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: P.borderLight,
    shadowColor: P.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  forecastRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSoft,
  },
  forecastRowLast: {
    borderBottomWidth: 0,
  },
  forecastDay: {
    width: 44,
    fontSize: 12.5,
    fontWeight: '800',
    color: P.ink,
  },
  forecastIconBox: {
    width: 28,
    alignItems: 'center',
    marginRight: 8,
  },
  forecastSummary: {
    flex: 1,
    fontSize: 12,
    color: P.stoneMuted,
    marginRight: 8,
  },
  forecastTempsBox: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  forecastHigh: {
    fontSize: 12.5,
    fontWeight: '800',
    color: P.ink,
  },
  forecastLow: {
    fontSize: 12.5,
    fontWeight: '500',
    color: P.legal,
  },
});
