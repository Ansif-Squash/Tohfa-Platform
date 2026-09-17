import React, { useEffect, useState } from 'react';
import {
  Alert,
  BackHandler,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Circle, Line, Path, Rect } from 'react-native-svg';
import { authPalette as P } from '../../theme';
import type { CropItem } from './ProduceCalendarScreen';

// ─────────────────────────────────────────────
// Inline Vector Icons (strictly no emojis, no raw hex)
// ─────────────────────────────────────────────

function ArrowBackIcon({ size = 20, color = P.twGray800 }: { size?: number; color?: string }) {
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

function ClockIcon({ size = 18, color = P.twBlue600 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth="2" />
      <Path
        d="M12 7v5l3 3"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function SproutIcon({ size = 18, color = P.twGreen700 }: { size?: number; color?: string }) {
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

function DropletIcon({ size = 18, color = P.twBlue600 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function ManureIcon({ size = 18, color = P.twAmber800 }: { size?: number; color?: string }) {
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

function PestIcon({ size = 18, color = P.twRed600 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="6" stroke={color} strokeWidth="1.8" />
      <Path
        d="M12 6V3M6 12H3M21 12h-3M6.34 6.34L4.22 4.22M19.78 4.22l-2.12 2.12M6.34 17.66l-2.12 2.12M19.78 19.78l-2.12-2.12"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </Svg>
  );
}

function PlusIcon({ size = 22, color = P.white }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 5v14M5 12h14"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// ─────────────────────────────────────────────
// Types & Sample Data
// ─────────────────────────────────────────────

export interface DiaryEntryItem {
  id: string;
  category: 'Watering' | 'Weeding' | 'Fertilizing' | 'Inspection';
  title: string;
  timestamp: string;
  note: string;
  duration: string;
}

const INITIAL_DIARY_ENTRIES: DiaryEntryItem[] = [
  {
    id: 'd1',
    category: 'Weeding',
    title: 'Weeding',
    timestamp: '15 Jul · 06:45 AM',
    note: 'North row cleared',
    duration: '50m',
  },
  {
    id: 'd2',
    category: 'Fertilizing',
    title: 'Manure application',
    timestamp: '15 Jul · 11:00 AM',
    note: 'FYM, 40kg',
    duration: '1h 15m',
  },
  {
    id: 'd3',
    category: 'Watering',
    title: 'Watering',
    timestamp: '13 Jul · 07:10 AM',
    note: 'Drip line, 30 mins',
    duration: '30m',
  },
  {
    id: 'd4',
    category: 'Inspection',
    title: 'Pest inspection',
    timestamp: '11 Jul · 08:30 AM',
    note: 'Minor aphids found',
    duration: '20m',
  },
  {
    id: 'd5',
    category: 'Watering',
    title: 'Deep root watering',
    timestamp: '9 Jul · 06:00 AM',
    note: 'South quadrant regular cycle',
    duration: '45m',
  },
  {
    id: 'd6',
    category: 'Fertilizing',
    title: 'Bio-stimulant foliar spray',
    timestamp: '6 Jul · 07:15 AM',
    note: 'Panchagavya organic spray',
    duration: '1h',
  },
];

export interface CropDiaryEntriesScreenProps {
  crop?: CropItem | null;
  onBack?: () => void;
  onNewEntry?: () => void;
}

export function CropDiaryEntriesScreen({
  crop,
  onBack,
  onNewEntry,
}: CropDiaryEntriesScreenProps): React.JSX.Element {
  const [activeFilter, setActiveFilter] = useState<'All' | 'Watering' | 'Weeding' | 'Fertilizing'>('All');

  // Handle Android hardware back
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (onBack) {
        onBack();
        return true;
      }
      return false;
    });
    return () => sub.remove();
  }, [onBack]);

  const cropName = crop?.name ?? 'Carrot';
  const variety = crop?.variety ?? 'Nantes';
  const zone = crop?.zoneShort || crop?.zone || 'Zone 1';
  const subtitle = `${cropName} — ${variety} · ${zone}`;

  const filteredEntries = INITIAL_DIARY_ENTRIES.filter((entry) => {
    if (activeFilter === 'All') return true;
    return entry.category === activeFilter;
  });

  const handleFabPress = () => {
    if (onNewEntry) {
      onNewEntry();
    } else {
      Alert.alert('New Diary Entry', `Add a new activity log for ${cropName} (${zone})`);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={P.paleStoneBg} />

      <View style={styles.container}>
        {/* ── Header ── */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={onBack}
            activeOpacity={0.7}
            hitSlop={{ top: 14, bottom: 14, left: 14, right: 14 }}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <ArrowBackIcon size={20} color={P.twGray800} />
          </TouchableOpacity>

          <View style={styles.headerTitleCol}>
            <Text style={styles.headerTitle}>Diary Entries</Text>
            <Text style={styles.headerSubtitle}>{subtitle}</Text>
          </View>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* ── Top Stat Cards ── */}
          <View style={styles.statsRow}>
            {/* Card 1: Entries Logged */}
            <View style={styles.statCard}>
              <View style={[styles.statIconBadge, { backgroundColor: P.twGreen100 }]}>
                <CalendarIcon size={18} color={P.twGreen700} />
              </View>
              <Text style={styles.statValue}>14</Text>
              <Text style={styles.statLabel}>Entries Logged</Text>
            </View>

            {/* Card 2: Days Since Last Entry */}
            <View style={styles.statCard}>
              <View style={[styles.statIconBadge, { backgroundColor: P.twBlue50 }]}>
                <ClockIcon size={18} color={P.twBlue600} />
              </View>
              <Text style={styles.statValue}>2 days</Text>
              <Text style={styles.statLabel}>Since Last Entry</Text>
            </View>
          </View>

          {/* ── Filter Pills ── */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterRow}
          >
            {(['All', 'Watering', 'Weeding', 'Fertilizing'] as const).map((filter) => {
              const isSelected = activeFilter === filter;
              return (
                <TouchableOpacity
                  key={filter}
                  style={[
                    styles.filterChip,
                    isSelected ? styles.filterChipActive : styles.filterChipInactive,
                  ]}
                  onPress={() => setActiveFilter(filter)}
                  activeOpacity={0.75}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      isSelected ? styles.filterChipTextActive : styles.filterChipTextInactive,
                    ]}
                  >
                    {filter}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* ── Diary Activity Cards List ── */}
          <View style={styles.entriesList}>
            {filteredEntries.map((item) => {
              const fullSubtitle = `${item.timestamp} · ${item.note}`;
              return (
                <View key={item.id} style={styles.entryCard}>
                  {/* Category-specific Icon Badge */}
                  <View
                    style={[
                      styles.entryIconBadge,
                      item.category === 'Watering' && { backgroundColor: P.twBlue50 },
                      item.category === 'Weeding' && { backgroundColor: P.twGreen100 },
                      item.category === 'Fertilizing' && { backgroundColor: P.twOrange100 },
                      item.category === 'Inspection' && { backgroundColor: P.twRed50 },
                    ]}
                  >
                    {item.category === 'Watering' ? (
                      <DropletIcon size={18} color={P.twBlue600} />
                    ) : item.category === 'Weeding' ? (
                      <SproutIcon size={18} color={P.twGreen700} />
                    ) : item.category === 'Fertilizing' ? (
                      <ManureIcon size={18} color={P.twAmber800} />
                    ) : (
                      <PestIcon size={18} color={P.twRed600} />
                    )}
                  </View>

                  <View style={styles.entryTextCol}>
                    <Text style={styles.entryTitle}>{item.title}</Text>
                    <Text style={styles.entrySubtitle}>{fullSubtitle}</Text>
                  </View>

                  <Text style={styles.entryDurationText}>{item.duration}</Text>
                </View>
              );
            })}
          </View>

          <View style={styles.bottomSpacer} />
        </ScrollView>

        {/* ── Floating Action Button (FAB) ── */}
        <TouchableOpacity
          style={styles.fabButton}
          onPress={handleFabPress}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel="Add diary entry"
        >
          <PlusIcon size={24} color={P.white} />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// ─────────────────────────────────────────────
// Stylesheet (strictly no raw hex literals)
// ─────────────────────────────────────────────

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: P.paleStoneBg,
  },
  container: {
    flex: 1,
    backgroundColor: P.paleStoneBg,
    position: 'relative',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 6,
    paddingBottom: 10,
    backgroundColor: P.paleStoneBg,
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: P.white,
    borderWidth: 1,
    borderColor: P.twGray200,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    shadowColor: P.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  headerTitleCol: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: P.ink,
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 12.5,
    fontWeight: '500',
    color: P.twGray500,
    marginTop: 2,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 90,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 18,
  },
  statCard: {
    flex: 1,
    backgroundColor: P.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: P.twGray200,
    padding: 16,
    shadowColor: P.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 5,
    elevation: 1,
  },
  statIconBadge: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '800',
    color: P.ink,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: P.twGray500,
    marginTop: 2,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    paddingBottom: 16,
  },
  filterChip: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 20,
  },
  filterChipActive: {
    backgroundColor: P.deepGreen,
  },
  filterChipInactive: {
    backgroundColor: P.white,
    borderWidth: 1,
    borderColor: P.twGray300,
  },
  filterChipText: {
    fontSize: 13,
  },
  filterChipTextActive: {
    color: P.white,
    fontWeight: '700',
  },
  filterChipTextInactive: {
    color: P.twGray700,
    fontWeight: '600',
  },
  entriesList: {
    gap: 10,
  },
  entryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: P.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: P.twGray200,
    paddingHorizontal: 14,
    paddingVertical: 14,
    shadowColor: P.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 5,
    elevation: 1,
  },
  entryIconBadge: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  entryTextCol: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
  },
  entryTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: P.ink,
  },
  entrySubtitle: {
    fontSize: 12,
    color: P.twGray500,
    marginTop: 2,
  },
  entryDurationText: {
    fontSize: 14,
    fontWeight: '700',
    color: P.twGreen700,
  },
  bottomSpacer: {
    height: 20,
  },
  fabButton: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: P.deepGreen,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: P.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 6,
  },
});
