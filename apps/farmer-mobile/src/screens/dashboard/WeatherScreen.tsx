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

interface WeatherScreenProps {
  onNavigateBack: () => void;
}

export function WeatherScreen({ onNavigateBack }: WeatherScreenProps): React.JSX.Element {
  const [expandedAlert, setExpandedAlert] = useState<string | null>('frost');

  const toggleAlert = (id: string) => {
    setExpandedAlert(prev => prev === id ? null : id);
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
          <Text style={styles.headerTitle}>Weather</Text>
          <Text style={styles.headerSubtitle}>Kotagiri, Nilgiris · updated 20 min ago</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Weather Hero Card */}
        <View style={styles.heroCard}>
          <Text style={styles.heroDate}>Thursday, 17 July · 12:40 PM</Text>
          <View style={styles.heroMain}>
            <View>
              <Text style={styles.heroTemp}>19°</Text>
              <Text style={styles.heroCondition}>Partly cloudy</Text>
            </View>
            <Text style={styles.heroIconBig}>🌤️</Text>
          </View>

          <View style={styles.heroStatsRow}>
            <View style={styles.heroStatItem}>
              <Text style={styles.heroStatEmoji}>💧</Text>
              <Text style={styles.heroStatValue}>78%</Text>
              <Text style={styles.heroStatLabel}>Humidity</Text>
            </View>
            <View style={styles.heroStatItem}>
              <Text style={styles.heroStatEmoji}>💨</Text>
              <Text style={styles.heroStatValue}>12 km/h</Text>
              <Text style={styles.heroStatLabel}>Wind</Text>
            </View>
            <View style={styles.heroStatItem}>
              <Text style={styles.heroStatEmoji}>🌡️</Text>
              <Text style={styles.heroStatValue}>17°</Text>
              <Text style={styles.heroStatLabel}>Feels like</Text>
            </View>
          </View>
        </View>

        <Text style={styles.sectionHeading}>ACTIVE ALERTS</Text>

        {/* Alerts List */}
        <View style={styles.alertsList}>
          {/* Frost Alert */}
          <TouchableOpacity 
            style={[styles.alertCard, { backgroundColor: '#FFE0B2', borderColor: '#FFB74D' }]}
            onPress={() => toggleAlert('frost')}
            activeOpacity={0.8}
          >
            <View style={styles.alertHeaderRow}>
              <Text style={[styles.alertIcon, { color: '#E65100' }]}>❄️</Text>
              <View style={styles.alertTitleBox}>
                <Text style={[styles.alertTitle, { color: '#BF360C' }]}>Frost likely tonight</Text>
                <Text style={[styles.alertSubtitle, { color: '#D84315' }]}>Active until 6:00 AM · low 2°C</Text>
              </View>
              <Text style={[styles.chevron, { color: '#D84315' }]}>{expandedAlert === 'frost' ? '⌃' : '⌄'}</Text>
            </View>
            {expandedAlert === 'frost' && (
              <View style={styles.alertDetailsBox}>
                <Text style={[styles.alertDetailsText, { color: '#BF360C' }]}>
                  Temperatures may drop to 2°C after midnight. Irrigate beds this evening to release stored soil heat, cover Cabbage seedlings in Zone 3 with row cover, and delay early-morning spraying until frost lifts.
                </Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Rain Alert */}
          <TouchableOpacity 
            style={[styles.alertCard, { backgroundColor: '#FFFFFF', borderColor: '#E2E8F0' }]}
            onPress={() => toggleAlert('rain')}
            activeOpacity={0.8}
          >
            <View style={styles.alertHeaderRow}>
              <Text style={[styles.alertIcon, { color: '#1976D2' }]}>🌧️</Text>
              <View style={styles.alertTitleBox}>
                <Text style={[styles.alertTitle, { color: '#1E293B' }]}>Heavy rain expected Saturday</Text>
                <Text style={[styles.alertSubtitle, { color: '#64748B' }]}>40–60 mm forecast · tap for advisory</Text>
              </View>
              <Text style={[styles.chevron, { color: '#64748B' }]}>{expandedAlert === 'rain' ? '⌃' : '⌄'}</Text>
            </View>
            {expandedAlert === 'rain' && (
              <View style={styles.alertDetailsBox}>
                <Text style={[styles.alertDetailsText, { color: '#475569' }]}>
                  Ensure all drainage channels are clear before Saturday morning to prevent waterlogging in lower plots.
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionHeading}>NEXT 24 HOURS</Text>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.hourlyScroll} contentContainerStyle={styles.hourlyScrollContent}>
          <View style={styles.hourlyBox}>
            <Text style={styles.hourlyTime}>Now</Text>
            <Text style={styles.hourlyIcon}>🌤️</Text>
            <Text style={styles.hourlyTemp}>19°</Text>
          </View>
          <View style={styles.hourlyBox}>
            <Text style={styles.hourlyTime}>2 PM</Text>
            <Text style={styles.hourlyIcon}>☀️</Text>
            <Text style={styles.hourlyTemp}>21°</Text>
          </View>
          <View style={styles.hourlyBox}>
            <Text style={styles.hourlyTime}>4 PM</Text>
            <Text style={styles.hourlyIcon}>☁️</Text>
            <Text style={styles.hourlyTemp}>20°</Text>
          </View>
          <View style={styles.hourlyBox}>
            <Text style={styles.hourlyTime}>6 PM</Text>
            <Text style={styles.hourlyIcon}>🌧️</Text>
            <Text style={styles.hourlyTemp}>16°</Text>
          </View>
          <View style={styles.hourlyBox}>
            <Text style={styles.hourlyTime}>8 PM</Text>
            <Text style={styles.hourlyIcon}>🌙</Text>
            <Text style={styles.hourlyTemp}>12°</Text>
          </View>
          <View style={styles.hourlyBox}>
            <Text style={styles.hourlyTime}>10 PM</Text>
            <Text style={styles.hourlyIcon}>🌙</Text>
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

        <Text style={styles.sectionHeading}>7-DAY FORECAST</Text>

        <View style={styles.forecastList}>
          
          <View style={styles.forecastRow}>
            <Text style={styles.forecastDay}>Today</Text>
            <Text style={styles.forecastIcon}>🌤️</Text>
            <Text style={styles.forecastSummary}>Partly cloudy, frost at night</Text>
            <View style={styles.forecastTemps}>
              <Text style={styles.forecastHigh}>21°</Text>
              <Text style={styles.forecastLow}>2°</Text>
            </View>
          </View>

          <View style={styles.forecastRow}>
            <Text style={styles.forecastDay}>Fri</Text>
            <Text style={styles.forecastIcon}>☀️</Text>
            <Text style={styles.forecastSummary}>Sunny</Text>
            <View style={styles.forecastTemps}>
              <Text style={styles.forecastHigh}>23°</Text>
              <Text style={styles.forecastLow}>9°</Text>
            </View>
          </View>

          <View style={styles.forecastRow}>
            <Text style={styles.forecastDay}>Sat</Text>
            <Text style={styles.forecastIcon}>🌧️</Text>
            <Text style={styles.forecastSummary}>Heavy rain, 40–60 mm</Text>
            <View style={styles.forecastTemps}>
              <Text style={styles.forecastHigh}>17°</Text>
              <Text style={styles.forecastLow}>11°</Text>
            </View>
          </View>

          <View style={styles.forecastRow}>
            <Text style={styles.forecastDay}>Sun</Text>
            <Text style={styles.forecastIcon}>🌦️</Text>
            <Text style={styles.forecastSummary}>Light showers</Text>
            <View style={styles.forecastTemps}>
              <Text style={styles.forecastHigh}>18°</Text>
              <Text style={styles.forecastLow}>10°</Text>
            </View>
          </View>

          <View style={styles.forecastRow}>
            <Text style={styles.forecastDay}>Mon</Text>
            <Text style={styles.forecastIcon}>☁️</Text>
            <Text style={styles.forecastSummary}>Cloudy</Text>
            <View style={styles.forecastTemps}>
              <Text style={styles.forecastHigh}>20°</Text>
              <Text style={styles.forecastLow}>10°</Text>
            </View>
          </View>

          <View style={styles.forecastRow}>
            <Text style={styles.forecastDay}>Tue</Text>
            <Text style={styles.forecastIcon}>🌤️</Text>
            <Text style={styles.forecastSummary}>Partly cloudy</Text>
            <View style={styles.forecastTemps}>
              <Text style={styles.forecastHigh}>22°</Text>
              <Text style={styles.forecastLow}>11°</Text>
            </View>
          </View>

          <View style={[styles.forecastRow, { borderBottomWidth: 0 }]}>
            <Text style={styles.forecastDay}>Wed</Text>
            <Text style={styles.forecastIcon}>☀️</Text>
            <Text style={styles.forecastSummary}>Sunny</Text>
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
    paddingBottom: 40,
  },

  heroCard: {
    backgroundColor: '#1E88E5',
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
  },
  heroDate: { color: '#FFF', fontSize: 13, fontWeight: '600', marginBottom: 16 },
  heroMain: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  heroTemp: { color: '#FFF', fontSize: 56, fontWeight: '900', letterSpacing: -2, lineHeight: 60 },
  heroCondition: { color: '#FFF', fontSize: 18, fontWeight: '600' },
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
  heroStatValue: { color: '#FFF', fontSize: 14, fontWeight: 'bold', marginBottom: 2 },
  heroStatLabel: { color: '#E3F2FD', fontSize: 11 },

  sectionHeading: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#888',
    marginBottom: 12,
    marginLeft: 4,
    textTransform: 'uppercase',
  },

  alertsList: { gap: 12, marginBottom: 24 },
  alertCard: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    shadowColor: '#000',
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
    backgroundColor: '#FFF',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  hourlyTime: { fontSize: 12, fontWeight: 'bold', color: '#64748B', marginBottom: 8 },
  hourlyIcon: { fontSize: 24, marginBottom: 8 },
  hourlyTemp: { fontSize: 16, fontWeight: 'bold', color: '#1E293B' },
  
  scrollbarHint: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 24 },
  scrollbarIcon: { color: '#CBD5E1', fontSize: 10 },
  scrollbarTrack: { height: 6, width: 100, backgroundColor: '#E2E8F0', borderRadius: 3 },
  scrollbarThumb: { height: '100%', width: 40, backgroundColor: '#94A3B8', borderRadius: 3 },

  forecastList: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
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
    borderBottomColor: '#F1F5F9',
  },
  forecastDay: { width: 50, fontSize: 14, fontWeight: 'bold', color: '#1E293B' },
  forecastIcon: { width: 30, fontSize: 18, textAlign: 'center' },
  forecastSummary: { flex: 1, fontSize: 13, color: '#64748B', marginLeft: 8 },
  forecastTemps: { flexDirection: 'row', alignItems: 'baseline', gap: 8 },
  forecastHigh: { fontSize: 15, fontWeight: 'bold', color: '#1E293B', width: 24, textAlign: 'right' },
  forecastLow: { fontSize: 14, color: '#94A3B8', width: 24, textAlign: 'right' },
});
