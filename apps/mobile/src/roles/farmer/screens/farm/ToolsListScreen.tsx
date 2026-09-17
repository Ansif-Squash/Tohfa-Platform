import React from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
} from 'react-native';
import Svg, { Path, Circle, Rect, Line } from 'react-native-svg';
import { authPalette as P, colors } from '../../theme';

// ── SVG Icons ────────────────────────────────────────────────────────────────

const ChevronLeft = () => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Path d="M15 18L9 12L15 6" stroke={P.primary} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const ToolsHeaderIcon = () => (
  <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
    <Path
      d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"
      stroke={P.primary}
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const ChevronDown = () => (
  <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
    <Path d="M6 9L12 15L18 9" stroke={P.twGray600} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const FilterIcon = () => (
  <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
    <Line x1="4" y1="6" x2="20" y2="6" stroke={P.twGray600} strokeWidth="2" strokeLinecap="round" />
    <Line x1="7" y1="12" x2="17" y2="12" stroke={P.twGray600} strokeWidth="2" strokeLinecap="round" />
    <Line x1="10" y1="18" x2="14" y2="18" stroke={P.twGray600} strokeWidth="2" strokeLinecap="round" />
  </Svg>
);

const CalendarIcon = ({ color = P.twRed600 }: { color?: string }) => (
  <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
    <Rect x="3" y="4" width="18" height="18" rx="2" stroke={color} strokeWidth="2" />
    <Line x1="3" y1="10" x2="21" y2="10" stroke={color} strokeWidth="2" />
    <Line x1="8" y1="2" x2="8" y2="6" stroke={color} strokeWidth="2" strokeLinecap="round" />
    <Line x1="16" y1="2" x2="16" y2="6" stroke={color} strokeWidth="2" strokeLinecap="round" />
  </Svg>
);

const ClockIcon = ({ color = P.twOrange700 }: { color?: string }) => (
  <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth="2" />
    <Path d="M12 7V12L15 15" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const PlusIcon = () => (
  <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
    <Line x1="12" y1="5" x2="12" y2="19" stroke={P.white} strokeWidth="2.5" strokeLinecap="round" />
    <Line x1="5" y1="12" x2="19" y2="12" stroke={P.white} strokeWidth="2.5" strokeLinecap="round" />
  </Svg>
);

// ── Types & Data ─────────────────────────────────────────────────────────────

type ItemStatus = 'Overdue' | 'Due soon' | 'OK';

interface ToolItem {
  name: string;
  purchaseDate: string;
  dueDate: string;
  dueNote: string;
  status: ItemStatus;
}

const TOOLS: ToolItem[] = [
  {
    name: 'Pruning Shears',
    purchaseDate: 'Purchased 18 Jun 2023',
    dueDate: 'Due 08 Jul 2026',
    dueNote: '12 days overdue',
    status: 'Overdue',
  },
  {
    name: 'Knapsack Sprayer',
    purchaseDate: 'Purchased 04 Jan 2025',
    dueDate: 'Due 25 Jul 2026',
    dueNote: '5 days away',
    status: 'Due soon',
  },
  {
    name: 'Sickle Set (5 pcs)',
    purchaseDate: 'Purchased 12 Mar 2024',
    dueDate: 'Due 28 Aug 2026',
    dueNote: '39 days away',
    status: 'OK',
  },
];

function statusStyle(status: ItemStatus) {
  switch (status) {
    case 'Overdue':
      return {
        badgeBg: P.twRed100,
        badgeText: P.twRed600,
        borderColor: P.twRed500,
        dueColor: P.twRed600,
        icon: <CalendarIcon color={P.twRed600} />,
      };
    case 'Due soon':
      return {
        badgeBg: P.twOrange100,
        badgeText: P.twOrange700,
        borderColor: P.twOrange500,
        dueColor: P.twOrange700,
        icon: <ClockIcon color={P.twOrange700} />,
      };
    case 'OK':
      return {
        badgeBg: P.twGreen100,
        badgeText: P.twGreen700,
        borderColor: P.twGreen500,
        dueColor: P.twGreen700,
        icon: <CalendarIcon color={P.twGreen700} />,
      };
  }
}

// ── Component ────────────────────────────────────────────────────────────────

interface ToolsListScreenProps {
  onNavigateBack: () => void;
  onNavigateToAddTool?: () => void;
}

export function ToolsListScreen({ onNavigateBack, onNavigateToAddTool }: ToolsListScreenProps): React.JSX.Element {
  return (
    <SafeAreaView style={styles.screen}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onNavigateBack} activeOpacity={0.7}>
          <ChevronLeft />
        </TouchableOpacity>
        <View style={styles.headerIconCircle}>
          <ToolsHeaderIcon />
        </View>
        <View style={styles.headerTextWrap}>
          <Text style={styles.headerTitle}>Tools</Text>
          <Text style={styles.headerSubtitle}>3 items</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Filter Dropdown */}
        <TouchableOpacity style={styles.filterDropdown} activeOpacity={0.7}>
          <FilterIcon />
          <Text style={styles.filterText}>All statuses</Text>
          <View style={{ flex: 1 }} />
          <ChevronDown />
        </TouchableOpacity>

        {/* Tool Cards */}
        {TOOLS.map((tool) => {
          const cfg = statusStyle(tool.status);
          return (
            <TouchableOpacity key={tool.name} style={[styles.card, { borderLeftColor: cfg.borderColor }]} activeOpacity={0.7}>
              {/* Card Header */}
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>{tool.name}</Text>
                <View style={[styles.statusBadge, { backgroundColor: cfg.badgeBg }]}>
                  <Text style={[styles.statusBadgeText, { color: cfg.badgeText }]}>{tool.status}</Text>
                </View>
              </View>

              {/* Purchase Date */}
              <Text style={styles.cardSubtitle}>{tool.purchaseDate}</Text>

              {/* Due Row */}
              <View style={styles.dueRow}>
                {cfg.icon}
                <Text style={[styles.dueText, { color: cfg.dueColor }]}>
                  {tool.dueDate} · {tool.dueNote}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Sticky Add Button */}
      <View style={styles.stickyBottom}>
        <TouchableOpacity style={styles.addButton} activeOpacity={0.8} onPress={onNavigateToAddTool}>
          <PlusIcon />
          <Text style={styles.addButtonText}>Add tool</Text>
        </TouchableOpacity>
      </View>
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
    marginRight: 10,
  },
  headerIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: P.twGreen100,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
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
    paddingBottom: 100,
  },

  // Filter
  filterDropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: P.white,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: P.border,
    marginBottom: 16,
    gap: 8,
  },
  filterText: {
    fontSize: 14,
    fontWeight: '500',
    color: P.twGray700,
  },

  // Card
  card: {
    backgroundColor: P.white,
    borderRadius: 14,
    padding: 18,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: P.border,
    borderLeftWidth: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: P.ink,
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  cardSubtitle: {
    fontSize: 13,
    fontWeight: '400',
    color: P.muted,
    marginBottom: 10,
  },
  dueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dueText: {
    fontSize: 13,
    fontWeight: '600',
  },

  // Sticky Bottom
  stickyBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'flex-end',
    paddingBottom: 20,
    paddingTop: 12,
    paddingRight: 16,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: P.primary,
    borderRadius: 24,
    paddingHorizontal: 24,
    paddingVertical: 14,
    gap: 8,
    shadowColor: P.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
  },
  addButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: P.white,
  },
});
