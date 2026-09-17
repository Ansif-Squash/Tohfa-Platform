import React from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
} from 'react-native';
import Svg, { Path, Circle, Rect, Line, G } from 'react-native-svg';

// ── SVG Icons ────────────────────────────────────────────────────────────────

const ChevronLeft = () => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Path d="M15 18L9 12L15 6" stroke="#2e7d32" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

// Wrench icon for alert banner
const WrenchAlertIcon = () => (
  <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
    <Path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z" stroke="#C2410C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

// Category Icons
const ToolsIcon = () => (
  <Svg width={28} height={28} viewBox="0 0 24 24" fill="none">
    <Path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z" stroke="#92400E" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const EquipmentIcon = () => (
  <Svg width={28} height={28} viewBox="0 0 24 24" fill="none">
    <Path d="M15 12L12 3" stroke="#1565C0" strokeWidth="2" strokeLinecap="round" />
    <Path d="M9 12L12 3" stroke="#1565C0" strokeWidth="2" strokeLinecap="round" />
    <Path d="M6 12H18" stroke="#1565C0" strokeWidth="2" strokeLinecap="round" />
    <Path d="M7 12V16C7 18.2091 8.79086 20 11 20H13C15.2091 20 17 18.2091 17 16V12" stroke="#1565C0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <Line x1="12" y1="16" x2="12" y2="20" stroke="#1565C0" strokeWidth="2" strokeLinecap="round" />
  </Svg>
);

const TreesIcon = () => (
  <Svg width={28} height={28} viewBox="0 0 24 24" fill="none">
    <Path d="M12 3L6 13H10L7 21H17L14 13H18L12 3Z" stroke="#2E7D32" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
  </Svg>
);

const MachineryIcon = () => (
  <Svg width={28} height={28} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="3" stroke="#92400E" strokeWidth="1.8" />
    <Path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" stroke="#92400E" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
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
    iconBg: '#FEF3C7',
  },
  {
    name: 'Equipment',
    count: '3 items',
    dueCount: 2,
    icon: <EquipmentIcon />,
    iconBg: '#DBEAFE',
  },
  {
    name: 'Trees',
    count: '3 plantings',
    dueCount: 2,
    icon: <TreesIcon />,
    iconBg: '#DCFCE7',
  },
  {
    name: 'Machinery',
    count: '3 items',
    dueCount: 2,
    icon: <MachineryIcon />,
    iconBg: '#FEF3C7',
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
        {/* Alert Banner */}
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
    backgroundColor: '#FAFAF7',
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0EEE6',
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F0FFF0',
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
    color: '#1A2E1A',
    letterSpacing: 0.3,
  },
  headerSubtitle: {
    fontSize: 13,
    fontWeight: '400',
    color: '#6B7566',
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

  // Alert Banner
  alertBanner: {
    flexDirection: 'row',
    backgroundColor: '#FEF3C7',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  alertIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFEDD5',
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
    color: '#1A2E1A',
    marginBottom: 2,
  },
  alertSubtitle: {
    fontSize: 12,
    fontWeight: '400',
    color: '#92400E',
  },

  // Section Label
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7566',
    letterSpacing: 1,
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
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: '#F0EEE6',
    position: 'relative',
    minHeight: 140,
  },
  dueBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  dueBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#DC2626',
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
    color: '#1A2E1A',
    marginBottom: 2,
  },
  categoryCount: {
    fontSize: 13,
    fontWeight: '400',
    color: '#6B7566',
  },
});
