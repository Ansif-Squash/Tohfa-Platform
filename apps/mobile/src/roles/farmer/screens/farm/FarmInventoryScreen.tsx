import React from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
} from 'react-native';
import Svg, { Path, Circle, Line } from 'react-native-svg';
import { authPalette as P, colors } from '../../theme';

// ── SVG Icons ────────────────────────────────────────────────────────────────

const ChevronLeft = () => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Path d="M15 18L9 12L15 6" stroke={P.primary} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

// Wrench icon for alert banner (Green Theme)
const WrenchAlertIcon = () => (
  <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
    <Path
      d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"
      stroke={P.primary}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

// Category Icons (Farmer Green Palette)
const ToolsIcon = () => (
  <Svg width={28} height={28} viewBox="0 0 24 24" fill="none">
    <Path
      d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"
      stroke={P.primary}
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const EquipmentIcon = () => (
  <Svg width={28} height={28} viewBox="0 0 24 24" fill="none">
    <Path d="M15 12L12 3" stroke={P.primary} strokeWidth="2" strokeLinecap="round" />
    <Path d="M9 12L12 3" stroke={P.primary} strokeWidth="2" strokeLinecap="round" />
    <Path d="M6 12H18" stroke={P.primary} strokeWidth="2" strokeLinecap="round" />
    <Path
      d="M7 12V16C7 18.2091 8.79086 20 11 20H13C15.2091 20 17 18.2091 17 16V12"
      stroke={P.primary}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Line x1="12" y1="16" x2="12" y2="20" stroke={P.primary} strokeWidth="2" strokeLinecap="round" />
  </Svg>
);

const TreesIcon = () => (
  <Svg width={28} height={28} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 3L6 13H10L7 21H17L14 13H18L12 3Z"
      stroke={P.primary}
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
  </Svg>
);

const MachineryIcon = () => (
  <Svg width={28} height={28} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="3" stroke={P.primary} strokeWidth="1.8" />
    <Path
      d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"
      stroke={P.primary}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

// ── Data ─────────────────────────────────────────────────────────────────────

interface CategoryData {
  name: string;
  count: string;
  dueCount: number;
  icon: React.JSX.Element;
  iconBg: string;
}

const CATEGORIES: CategoryData[] = [
  {
    name: 'Tools',
    count: '3 items',
    dueCount: 2,
    icon: <ToolsIcon />,
    iconBg: P.twGreen100,
  },
  {
    name: 'Equipment',
    count: '3 items',
    dueCount: 2,
    icon: <EquipmentIcon />,
    iconBg: P.lightGreen,
  },
  {
    name: 'Trees',
    count: '3 plantings',
    dueCount: 2,
    icon: <TreesIcon />,
    iconBg: P.paleMintBg,
  },
  {
    name: 'Machinery',
    count: '3 items',
    dueCount: 2,
    icon: <MachineryIcon />,
    iconBg: P.sageTintBg,
  },
];

// ── Component ────────────────────────────────────────────────────────────────

interface FarmInventoryScreenProps {
  onNavigateBack: () => void;
  onNavigateToCategory?: (category: string) => void;
}

export function FarmInventoryScreen({ onNavigateBack, onNavigateToCategory }: FarmInventoryScreenProps): React.JSX.Element {
  return (
    <SafeAreaView style={styles.screen}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onNavigateBack} activeOpacity={0.7}>
          <ChevronLeft />
        </TouchableOpacity>
        <View style={styles.headerTextWrap}>
          <Text style={styles.headerTitle}>Farm Inventory</Text>
          <Text style={styles.headerSubtitle}>Tools, equipment, trees & machinery</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Alert Banner (Green Theme) */}
        <View style={styles.alertBanner}>
          <View style={styles.alertIconWrap}>
            <WrenchAlertIcon />
          </View>
          <View style={styles.alertTextWrap}>
            <Text style={styles.alertTitle}>8 items need servicing</Text>
            <Text style={styles.alertSubtitle}>4 due soon · 4 overdue across all categories</Text>
          </View>
        </View>

        {/* Categories Label */}
        <Text style={styles.sectionLabel}>CATEGORIES</Text>

        {/* Category Cards Grid */}
        <View style={styles.grid}>
          {CATEGORIES.map((cat) => (
            <TouchableOpacity key={cat.name} style={styles.categoryCard} activeOpacity={0.7} onPress={() => onNavigateToCategory?.(cat.name)}>
              {/* Due Badge */}
              {cat.dueCount > 0 && (
                <View style={styles.dueBadge}>
                  <Text style={styles.dueBadgeText}>{cat.dueCount} due</Text>
                </View>
              )}

              {/* Icon */}
              <View style={[styles.categoryIconCircle, { backgroundColor: cat.iconBg }]}>
                {cat.icon}
              </View>

              {/* Name & Count */}
              <Text style={styles.categoryName}>{cat.name}</Text>
              <Text style={styles.categoryCount}>{cat.count}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: P.bg,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: P.white,
    borderBottomWidth: 1,
    borderBottomColor: P.border,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: P.paleMintBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerTextWrap: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: P.ink,
    letterSpacing: 0.3,
  },
  headerSubtitle: {
    fontSize: 13,
    fontWeight: '400',
    color: P.muted,
    marginTop: 1,
  },

  // Scroll
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 32,
  },

  // Alert Banner (Green Theme)
  alertBanner: {
    flexDirection: 'row',
    backgroundColor: P.lightGreen,
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: P.twGreen300,
  },
  alertIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: P.twGreen100,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  alertTextWrap: {
    flex: 1,
  },
  alertTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: P.ink,
    marginBottom: 2,
  },
  alertSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    color: P.twGreen700,
  },

  // Section Label
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: P.muted,
    letterSpacing: 0.8,
    marginBottom: 14,
  },

  // Grid
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },

  // Category Card
  categoryCard: {
    width: '47.5%',
    backgroundColor: P.white,
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: P.border,
    position: 'relative',
    minHeight: 140,
  },
  dueBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: P.twGreen100,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  dueBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: P.twGreen700,
  },
  categoryIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '700',
    color: P.ink,
    marginBottom: 2,
  },
  categoryCount: {
    fontSize: 13,
    fontWeight: '400',
    color: P.muted,
  },
});
