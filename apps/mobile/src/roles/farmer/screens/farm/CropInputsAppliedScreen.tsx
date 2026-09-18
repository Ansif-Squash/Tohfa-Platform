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
import Svg, { Circle, Path } from 'react-native-svg';
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

export interface CropInputItem {
  id: string;
  category: 'Fertigation' | 'Pest Treatment';
  name: string;
  timestamp: string;
  quantity: string;
  tag: string;
}

const INITIAL_INPUTS: CropInputItem[] = [
  {
    id: 'in1',
    category: 'Fertigation',
    name: 'Vermicompost Tea',
    timestamp: '14 Jul · 07:00 AM',
    quantity: '4 L',
    tag: 'Fertigation',
  },
  {
    id: 'in2',
    category: 'Pest Treatment',
    name: 'Neem Oil Concentrate',
    timestamp: '11 Jul · 08:45 AM · Aphids',
    quantity: '200 ml',
    tag: 'Pest Treatment',
  },
  {
    id: 'in3',
    category: 'Fertigation',
    name: 'Panchagavya',
    timestamp: '9 Jul · 06:30 AM',
    quantity: '3 L',
    tag: 'Fertigation',
  },
  {
    id: 'in4',
    category: 'Fertigation',
    name: 'Jeevamrutha',
    timestamp: '2 Jul · 07:30 AM · Root Zone',
    quantity: '8 L',
    tag: 'Fertigation',
  },
  {
    id: 'in5',
    category: 'Pest Treatment',
    name: 'Agniastra Decoction',
    timestamp: '26 Jun · 06:15 AM · Preventive',
    quantity: '150 ml',
    tag: 'Pest Treatment',
  },
];

export interface CropInputsAppliedScreenProps {
  crop?: CropItem | null;
  onBack?: () => void;
  onNewInput?: () => void;
}

export function CropInputsAppliedScreen({
  crop,
  onBack,
  onNewInput,
}: CropInputsAppliedScreenProps): React.JSX.Element {
  const [activeFilter, setActiveFilter] = useState<'All' | 'Fertigation' | 'Pest Treatment'>('All');

  // Android hardware back
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

  const fertigationCount = INITIAL_INPUTS.filter((i) => i.category === 'Fertigation').length + 2; // 6
  const pestCount = INITIAL_INPUTS.filter((i) => i.category === 'Pest Treatment').length; // 2

  const filteredInputs = INITIAL_INPUTS.filter((item) => {
    if (activeFilter === 'All') return true;
    return item.category === activeFilter;
  });

  const handleFabPress = () => {
    if (onNewInput) {
      onNewInput();
    } else {
      Alert.alert('Apply Input', `Record chemical or organic input applied for ${cropName} (${zone})`);
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
            <Text style={styles.headerTitle}>Inputs Applied</Text>
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
            {/* Card 1: Fertigation Events */}
            <View style={styles.statCard}>
              <View style={[styles.statIconBadge, { backgroundColor: P.twBlue50 }]}>
                <DropletIcon size={18} color={P.twBlue600} />
              </View>
              <Text style={styles.statValue}>{fertigationCount}</Text>
              <Text style={styles.statLabel}>Fertigation Events</Text>
            </View>

            {/* Card 2: Pest Treatments */}
            <View style={styles.statCard}>
              <View style={[styles.statIconBadge, { backgroundColor: P.twRed50 }]}>
                <PestIcon size={18} color={P.twRed600} />
              </View>
              <Text style={styles.statValue}>{pestCount}</Text>
              <Text style={styles.statLabel}>Pest Treatments</Text>
            </View>
          </View>

          {/* ── Filter Pills ── */}
          <View style={styles.filterRow}>
            {(['All', 'Fertigation', 'Pest Treatment'] as const).map((filter) => {
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
          </View>

          {/* ── Inputs Activity Cards List ── */}
          <View style={styles.inputsList}>
            {filteredInputs.map((item) => {
              const isFertigation = item.category === 'Fertigation';
              return (
                <View key={item.id} style={styles.inputCard}>
                  {/* Category-specific Icon Badge */}
                  <View
                    style={[
                      styles.inputIconBadge,
                      isFertigation
                        ? { backgroundColor: P.twBlue50 }
                        : { backgroundColor: P.twRed50 },
                    ]}
                  >
                    {isFertigation ? (
                      <DropletIcon size={18} color={P.twBlue600} />
                    ) : (
                      <PestIcon size={18} color={P.twRed600} />
                    )}
                  </View>

                  <View style={styles.inputTextCol}>
                    <Text style={styles.inputName}>{item.name}</Text>
                    <Text style={styles.inputSubtitle}>{item.timestamp}</Text>

                    {/* Tag badge */}
                    <View
                      style={[
                        styles.tagBadge,
                        isFertigation ? styles.tagBadgeBlue : styles.tagBadgeRed,
                      ]}
                    >
                      <Text
                        style={[
                          styles.tagBadgeText,
                          isFertigation ? styles.tagBadgeTextBlue : styles.tagBadgeTextRed,
                        ]}
                      >
                        {item.tag}
                      </Text>
                    </View>
                  </View>

                  {/* Quantity */}
                  <Text style={styles.inputQuantityText}>{item.quantity}</Text>
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
          accessibilityLabel="Add input applied"
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
  inputsList: {
    gap: 10,
  },
  inputCard: {
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
  inputIconBadge: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputTextCol: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
  },
  inputName: {
    fontSize: 15,
    fontWeight: '700',
    color: P.ink,
  },
  inputSubtitle: {
    fontSize: 12,
    color: P.twGray500,
    marginTop: 2,
    marginBottom: 6,
  },
  tagBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: 6,
  },
  tagBadgeBlue: {
    backgroundColor: P.twBlue50,
  },
  tagBadgeRed: {
    backgroundColor: P.twRed50,
  },
  tagBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  tagBadgeTextBlue: {
    color: P.twBlue700,
  },
  tagBadgeTextRed: {
    color: P.twRed600,
  },
  inputQuantityText: {
    fontSize: 16,
    fontWeight: '800',
    color: P.ink,
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
