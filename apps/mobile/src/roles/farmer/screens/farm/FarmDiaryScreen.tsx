import React, { useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Image,
} from 'react-native';
import Svg, { Path, Circle, Rect, Line, Polyline } from 'react-native-svg';
import { authPalette as P, colors } from '../../theme';

// --- Icons ---
function ArrowBackIcon({ size = 20, color = P.white }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M19 12H5M5 12L12 19M5 12L12 5" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function CalendarIcon({ size = 20, color = P.white }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="4" width="18" height="18" rx="2" stroke={color} strokeWidth="2" />
      <Line x1="16" y1="2" x2="16" y2="6" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="8" y1="2" x2="8" y2="6" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="3" y1="10" x2="21" y2="10" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="8" y1="14" x2="16" y2="14" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="8" y1="18" x2="12" y2="18" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function ChevronDownIcon({ size = 20, color = P.twGray400 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M6 9l6 6 6-6" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function ChevronUpIcon({ size = 20, color = P.twGray400 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M18 15l-6-6-6 6" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function WaterDropIcon({ size = 24, color = '#1E40AF' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 21a7 7 0 007-7c0-2-3-7.5-7-11-4 3.5-7 9-7 11a7 7 0 007 7z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function BugIcon({ size = 24, color = '#6B21A8' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 20a6 6 0 006-6V9a6 6 0 10-12 0v5a6 6 0 006 6z M12 3v1 M7 6l-2-2 M17 6l2-2 M3 11h2 M19 11h2 M5 16l-2 2 M19 16l2 2"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function LeafIcon({ size = 24, color = '#166534' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 22C12 22 4 16 4 10a6 6 0 0112 0c0 1.5-.5 3-1.5 4M12 22c0 0 8-6 8-12a6 6 0 00-12 0c0 1.5.5 3 1.5 4"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M12 22v-9" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function TractorIcon({ size = 24, color = '#9A3412' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="7" cy="16" r="3" stroke={color} strokeWidth="2" />
      <Circle cx="17" cy="16" r="3" stroke={color} strokeWidth="2" />
      <Path d="M4 16H2V9h5v7M9 16h5 M14 9h7v7 M9 9h5v7 M14 12h7 M14 9l2-4h3l2 4" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function UsersIcon({ size = 14, color = '#374151' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Circle cx="9" cy="7" r="4" stroke={color} strokeWidth="2" />
      <Path d="M23 21v-2a4 4 0 0 0-3-3.87" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Path d="M16 3.13a4 4 0 0 1 0 7.75" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

// --- Data ---
const ENTRIES = [
  {
    id: '1',
    type: 'Irrigation',
    crop: 'Tomato',
    zone: 'Zone 2 — Lower Slope',
    time: '07:10 AM',
    duration: '45m',
    color: '#3B82F6', // twBlue500
    bg: '#EFF6FF', // twBlue50
    Icon: WaterDropIcon,
    expanded: true,
    details: {
      method: 'Method - Drip',
      labour: '2 labour',
      description: 'Morning drip cycle on the lower beds; checked emitters on rows 4-7, two were clogged and cleared.',
      images: [
        'https://images.unsplash.com/photo-1592982537447-6f233486df81?auto=format&fit=crop&q=80&w=200&h=200', // tractor in field
        'https://images.unsplash.com/photo-1589255243171-cb8f6a98fba0?auto=format&fit=crop&q=80&w=200&h=200', // green field
      ],
    },
  },
  {
    id: '2',
    type: 'Pest scouting',
    crop: 'Tomato',
    zone: 'Zone 2 — Lower Slope',
    time: '08:30 AM',
    duration: '20m',
    color: '#9333EA', // twPurple600
    bg: '#FAF5FF', // twPurple50
    Icon: BugIcon,
    expanded: false,
  },
  {
    id: '3',
    type: 'Manure application',
    crop: 'Carrot',
    zone: 'Zone 3 — Terrace',
    time: '11:00 AM',
    duration: '1h 15m',
    color: '#166534', // twGreen800
    bg: '#F0FDF4', // twGreen50
    Icon: LeafIcon,
    expanded: false,
  },
  {
    id: '4',
    type: 'Harvesting',
    crop: 'Beans',
    zone: 'Zone 1 — Upper Field',
    time: '02:15 PM',
    duration: '1h',
    color: '#C2410C', // twOrange700
    bg: '#FFF7ED', // twOrange50
    Icon: TractorIcon,
    expanded: false,
  },
];

// --- Component ---
interface FarmDiaryScreenProps {
  onBack?: () => void;
  onNavigateToNewEntry?: () => void;
}

export function FarmDiaryScreen({ onBack, onNavigateToNewEntry }: FarmDiaryScreenProps): React.JSX.Element {
  const [expandedId, setExpandedId] = useState<string | null>('1');

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar barStyle="light-content" backgroundColor={P.deepGreen} />

      {/* --- Top Green Section --- */}
      <View style={styles.topHeader}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={onBack}
            activeOpacity={0.7}
            accessibilityRole="button"
          >
            <ArrowBackIcon size={20} color={P.white} />
          </TouchableOpacity>
          <View style={styles.headerTitleCol}>
            <Text style={styles.headerTitle}>Farm Diary</Text>
            <Text style={styles.headerSubtitle}>Thursday, 16 July 2026</Text>
          </View>
          <TouchableOpacity style={styles.calendarBtn} activeOpacity={0.7}>
            <CalendarIcon size={22} color={P.white} />
          </TouchableOpacity>
        </View>

        {/* 3 Summary Stats Cards */}
        <View style={styles.summaryStatsRow}>
          <View style={styles.summaryStatCard}>
            <Text style={styles.summaryStatNumber}>4</Text>
            <Text style={styles.summaryStatLabel}>Entries today</Text>
          </View>
          <View style={styles.summaryStatCard}>
            <Text style={styles.summaryStatNumber}>3h 20m</Text>
            <Text style={styles.summaryStatLabel}>Time logged</Text>
          </View>
          <View style={styles.summaryStatCard}>
            <Text style={styles.summaryStatNumber}>3</Text>
            <Text style={styles.summaryStatLabel}>Fields covered</Text>
          </View>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* --- Filters Row --- */}
        <View style={styles.filtersRow}>
          <TouchableOpacity style={styles.filterBtn} activeOpacity={0.7}>
            <Text style={styles.filterBtnText}>All fields</Text>
            <ChevronDownIcon size={16} color={P.twGray400} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.filterBtn} activeOpacity={0.7}>
            <Text style={styles.filterBtnText}>All crops</Text>
            <ChevronDownIcon size={16} color={P.twGray400} />
          </TouchableOpacity>
        </View>

        {/* --- Entries --- */}
        <Text style={styles.sectionTitle}>TODAY'S ENTRIES</Text>

        <View style={styles.entriesList}>
          {ENTRIES.map((entry) => {
            const isExpanded = expandedId === entry.id;
            return (
              <TouchableOpacity
                key={entry.id}
                style={[styles.entryCard, isExpanded && styles.entryCardExpanded]}
                activeOpacity={0.9}
                onPress={() => toggleExpand(entry.id)}
              >
                <View style={styles.entryHeaderRow}>
                  <View style={[styles.entryIconBox, { backgroundColor: entry.bg }]}>
                    <entry.Icon size={24} color={entry.color} />
                  </View>
                  <View style={styles.entryTitleCol}>
                    <Text style={styles.entryTitle}>
                      {entry.type} · {entry.crop}
                    </Text>
                    <Text style={styles.entrySubtitle}>
                      {entry.zone} · {entry.time}
                    </Text>
                  </View>
                  <View style={styles.entryRightCol}>
                    <Text style={[styles.entryDuration, isExpanded && styles.entryDurationActive]}>
                      {entry.duration}
                    </Text>
                    {isExpanded ? (
                      <ChevronUpIcon size={20} color={P.twGray400} />
                    ) : (
                      <ChevronDownIcon size={20} color={P.twGray400} />
                    )}
                  </View>
                </View>

                {isExpanded && entry.details && (
                  <View style={styles.entryDetails}>
                    <View style={styles.pillsRow}>
                      <View style={styles.detailPill}>
                        <Text style={styles.detailPillText}>{entry.details.method}</Text>
                      </View>
                      <View style={styles.detailPill}>
                        <UsersIcon size={12} color={P.twGray600} />
                        <Text style={styles.detailPillText}>{entry.details.labour}</Text>
                      </View>
                    </View>
                    <Text style={styles.entryDesc}>{entry.details.description}</Text>
                    <View style={styles.imagesRow}>
                      {entry.details.images.map((img, idx) => (
                        <Image key={idx} source={{ uri: img }} style={styles.detailImage} />
                      ))}
                    </View>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      {/* --- FAB --- */}
      <TouchableOpacity style={styles.fab} activeOpacity={0.85} onPress={onNavigateToNewEntry}>
        <Text style={styles.fabIcon}>+</Text>
        <Text style={styles.fabText}>New entry</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

// --- Styles ---
const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: P.lightSurfaceAlt,
  },
  topHeader: {
    backgroundColor: P.deepGreen,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 24,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerTitleCol: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: P.white,
  },
  headerSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    color: P.green100,
    marginTop: 2,
  },
  calendarBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryStatsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  summaryStatCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryStatNumber: {
    fontSize: 18,
    fontWeight: '800',
    color: P.white,
  },
  summaryStatLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: P.white,
    marginTop: 4,
    textAlign: 'center',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 100,
  },
  filtersRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  filterBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: P.white,
    borderWidth: 1,
    borderColor: P.twGray200,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  filterBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: P.twGray800,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: P.twGray500,
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  entriesList: {
    gap: 12,
  },
  entryCard: {
    backgroundColor: P.white,
    borderRadius: 16,
    padding: 16,
    shadowColor: P.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  entryCardExpanded: {
    paddingBottom: 20,
  },
  entryHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  entryIconBox: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  entryTitleCol: {
    flex: 1,
  },
  entryTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: P.twGray900,
  },
  entrySubtitle: {
    fontSize: 12,
    color: P.twGray500,
    marginTop: 4,
  },
  entryRightCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  entryDuration: {
    fontSize: 14,
    fontWeight: '700',
    color: P.twGreen700,
  },
  entryDurationActive: {
    color: P.twGreen700,
  },
  entryDetails: {
    marginTop: 16,
    borderTopWidth: 1,
    borderTopColor: P.twGray100,
    paddingTop: 16,
  },
  pillsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  detailPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: P.twGray100,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  detailPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: P.twGray700,
  },
  entryDesc: {
    fontSize: 13,
    lineHeight: 20,
    color: P.twGray600,
    marginBottom: 16,
  },
  imagesRow: {
    flexDirection: 'row',
    gap: 12,
  },
  detailImage: {
    width: 64,
    height: 64,
    borderRadius: 12,
    backgroundColor: P.twGray200,
  },
  fab: {
    position: 'absolute',
    bottom: 32,
    right: 24,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: P.twGreen700,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 28,
    shadowColor: P.twGreen900,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
    gap: 8,
  },
  fabIcon: {
    fontSize: 22,
    fontWeight: '600',
    color: P.white,
    lineHeight: 24,
    marginTop: -2,
  },
  fabText: {
    fontSize: 15,
    fontWeight: '700',
    color: P.white,
  },
});
