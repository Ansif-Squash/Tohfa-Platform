import React, { useState } from 'react';
import {
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
// Inline Vector Icons (strictly no emoji, no raw hex)
// ─────────────────────────────────────────────

function CloseIcon({ size = 20, color = P.twGray800 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M18 6L6 18M6 6l12 12"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function LandPrepIcon({ size = 22, color = P.twGreen700 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M3 17l6-6 4 4 8-8"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M14 7h7v7"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M3 21h18"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
      />
    </Svg>
  );
}

function SowingIcon({ size = 22, color = P.twGreen700 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 21V10M12 10c0-4 3-6 7-6 0 4-2 7-7 6zM12 14c0-3.5-2.5-5-6-5 0 3.5 2 5.5 6 5z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M5 21h14"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
      />
    </Svg>
  );
}

function NutrientsIcon({ size = 22, color = P.twGreen700 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth="2" />
      <Path
        d="M12 7c-2 2-3 4-3 5.5a3 3 0 006 0C15 11 14 9 12 7z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function CropCareIcon({ size = 22, color = P.twGreen700 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 22C6 22 4 17 4 12 4 6.5 8.5 2 12 2c3.5 0 8 4.5 8 10 0 5-2 10-8 10z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M12 22V10M12 14c3-1.5 5-1.5 5-1.5"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function MonitoringIcon({ size = 22, color = P.twGreen700 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Line x1="18" y1="20" x2="18" y2="10" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
      <Line x1="12" y1="20" x2="12" y2="4" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
      <Line x1="6" y1="20" x2="6" y2="14" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
      <Path
        d="M4 11l4-4 4 4 7-7"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function HarvestingIcon({ size = 22, color = P.twGreen700 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="7" cy="17" r="3" stroke={color} strokeWidth="2" />
      <Circle cx="17" cy="17" r="3" stroke={color} strokeWidth="2" />
      <Path
        d="M4 17H2V9h5v8M10 17h4M14 9h7v8M9 9h5v8M14 12h7M14 9l2-4h3l2 4"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function MaintenanceIcon({ size = 22, color = P.twGreen700 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function OtherIcon({ size = 22, color = P.twGreen700 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="4" y="4" width="16" height="16" rx="3" stroke={color} strokeWidth="2" />
      <Line x1="8" y1="9" x2="16" y2="9" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="8" y1="13" x2="16" y2="13" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="8" y1="17" x2="12" y2="17" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

// ─────────────────────────────────────────────
// Categories Data
// ─────────────────────────────────────────────

interface CategoryItem {
  id: string;
  label: string;
  count: string;
  IconComponent: React.ComponentType<{ size?: number; color?: string }>;
}

const CATEGORIES: CategoryItem[] = [
  { id: 'land_prep', label: 'Land Prep', count: '4 activity types', IconComponent: LandPrepIcon },
  { id: 'sowing', label: 'Sowing', count: '3 activity types', IconComponent: SowingIcon },
  { id: 'nutrients', label: 'Nutrients', count: '3 activity types', IconComponent: NutrientsIcon },
  { id: 'crop_care', label: 'Crop Care', count: '5 activity types', IconComponent: CropCareIcon },
  { id: 'monitoring', label: 'Monitoring', count: '3 activity types', IconComponent: MonitoringIcon },
  { id: 'harvesting', label: 'Harvesting', count: '2 activity types', IconComponent: HarvestingIcon },
  { id: 'maintenance', label: 'Maintenance', count: '2 activity types', IconComponent: MaintenanceIcon },
  { id: 'other', label: 'Other', count: '1 activity type', IconComponent: OtherIcon },
];

// ─────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────

export interface NewFarmDiaryEntryScreenProps {
  crop?: CropItem | null;
  selectedCategory?: string;
  onBack?: () => void;
  onNext?: (category: string) => void;
}

export function NewFarmDiaryEntryScreen({
  crop: _crop,
  selectedCategory: initialCategory = 'Crop Care',
  onBack,
  onNext,
}: NewFarmDiaryEntryScreenProps): React.JSX.Element {
  const [selectedCat, setSelectedCat] = useState<string>(initialCategory);

  const handleSelect = (category: CategoryItem) => {
    setSelectedCat(category.label);
    if (onNext) {
      onNext(category.label);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={P.white} />

      {/* ── Top Header ── */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.closeBtn}
            onPress={onBack}
            activeOpacity={0.7}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            accessibilityRole="button"
            accessibilityLabel="Close"
          >
            <CloseIcon size={18} color={P.twGray800} />
          </TouchableOpacity>

          <View style={styles.headerTitleGroup}>
            <Text style={styles.headerTitle}>New Diary Entry</Text>
            <Text style={styles.headerSubtitle}>Choose a category</Text>
          </View>
        </View>
      </View>

      {/* ── 2-Column Categories Grid ── */}
      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.grid}>
          {CATEGORIES.map((cat) => {
            const isSelected = selectedCat.toLowerCase() === cat.label.toLowerCase();
            const Icon = cat.IconComponent;

            return (
              <TouchableOpacity
                key={cat.id}
                style={[
                  styles.categoryCard,
                  isSelected ? styles.categoryCardSelected : styles.categoryCardUnselected,
                ]}
                activeOpacity={0.85}
                onPress={() => handleSelect(cat)}
                accessibilityRole="button"
                accessibilityLabel={`${cat.label}, ${cat.count}`}
              >
                <View
                  style={[
                    styles.iconBox,
                    isSelected ? styles.iconBoxSelected : styles.iconBoxUnselected,
                  ]}
                >
                  <Icon size={22} color={isSelected ? P.deepGreen : P.twGreen700} />
                </View>

                <Text
                  style={[
                    styles.categoryTitle,
                    isSelected ? styles.categoryTitleSelected : styles.categoryTitleUnselected,
                  ]}
                >
                  {cat.label}
                </Text>

                <Text
                  style={[
                    styles.categoryCount,
                    isSelected ? styles.categoryCountSelected : styles.categoryCountUnselected,
                  ]}
                >
                  {cat.count}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ─────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: P.white,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 10,
    backgroundColor: P.white,
    borderBottomWidth: 1,
    borderBottomColor: P.twGray100,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: P.twGray50,
    borderWidth: 1,
    borderColor: P.twGray200,
  },
  headerTitleGroup: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: P.twGray900,
    letterSpacing: -0.2,
  },
  headerSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    color: P.twGray500,
    marginTop: 1,
  },
  scrollContainer: {
    flex: 1,
    backgroundColor: P.white,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 24,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 10,
  },
  categoryCard: {
    width: '48%',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryCardUnselected: {
    backgroundColor: P.white,
    borderWidth: 1,
    borderColor: P.twGray200,
    shadowColor: P.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  categoryCardSelected: {
    backgroundColor: P.mintTintBg,
    borderWidth: 2,
    borderColor: P.deepGreen,
    shadowColor: P.deepGreen,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  iconBoxUnselected: {
    backgroundColor: P.twGreen50,
  },
  iconBoxSelected: {
    backgroundColor: P.twGreen100,
  },
  categoryTitle: {
    fontSize: 14,
    textAlign: 'center',
  },
  categoryTitleUnselected: {
    fontWeight: '700',
    color: P.twGray900,
  },
  categoryTitleSelected: {
    fontWeight: '800',
    color: P.deepGreen,
  },
  categoryCount: {
    fontSize: 11,
    marginTop: 2,
    textAlign: 'center',
  },
  categoryCountUnselected: {
    fontWeight: '500',
    color: P.twGray500,
  },
  categoryCountSelected: {
    fontWeight: '600',
    color: P.twGreen700,
  },
});
