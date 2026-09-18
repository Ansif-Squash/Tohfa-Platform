import React, { useState, useEffect } from 'react';
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
import Svg, { Circle, Line, Path, Rect, Polygon } from 'react-native-svg';
import { authPalette as P } from '../../theme';

// ─────────────────────────────────────────────
// Inline Vector Icons (strictly no emojis, no raw hex)
// ─────────────────────────────────────────────

function ArrowBackIcon({ size = 20, color = P.twGreen800 }: { size?: number; color?: string }) {
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

// 8 Soil Category Icons:
function SandyIcon({ size = 24, color = P.twGray700 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="8" cy="8" r="1.5" fill={color} />
      <Circle cx="16" cy="8" r="1.5" fill={color} />
      <Circle cx="12" cy="12" r="1.5" fill={color} />
      <Circle cx="8" cy="16" r="1.5" fill={color} />
      <Circle cx="16" cy="16" r="1.5" fill={color} />
      <Circle cx="12" cy="6" r="1.2" fill={color} />
      <Circle cx="12" cy="18" r="1.2" fill={color} />
    </Svg>
  );
}

function ClayIcon({ size = 24, color = P.twGray700 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M4 8c4-2 8 2 12 0s4-2 4-2" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Path d="M4 12c4-2 8 2 12 0s4-2 4-2" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Path d="M4 16c4-2 8 2 12 0s4-2 4-2" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function LoamyIcon({ size = 24, color = P.forestGreen }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 21A9 9 0 013 12C3 7 7 3 12 3c5 0 9 4 9 9a9 9 0 01-9 9z"
        stroke={color}
        strokeWidth="1.8"
      />
      <Path
        d="M12 7c-2 2-3 4-3 5.5a3 3 0 006 0C15 11 14 9 12 7z"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function SiltyIcon({ size = 24, color = P.twGray700 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="7" r="1.8" fill={color} />
      <Circle cx="7" cy="12" r="1.8" fill={color} />
      <Circle cx="17" cy="12" r="1.8" fill={color} />
      <Circle cx="12" cy="17" r="1.8" fill={color} />
      <Circle cx="12" cy="12" r="2.2" fill={color} />
    </Svg>
  );
}

function PeatyIcon({ size = 24, color = P.twGray700 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 20v-7M12 13c-2-2.5-5-2-6-1.5 0 3 2.5 4.5 6 1.5zM12 11c2-2.5 5-2 6-1.5 0 3-2.5 4.5-6 1.5z"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function ChalkyIcon({ size = 24, color = P.twGray700 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Polygon points="12,6 5,18 19,18" stroke={color} strokeWidth="1.8" strokeLinejoin="round" />
      <Line x1="9" y1="13" x2="15" y2="13" stroke={color} strokeWidth="1.6" />
    </Svg>
  );
}

function SalineIcon({ size = 24, color = P.twGray700 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M4 11c3-2 6 2 9 0s6-2 7 0" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <Path d="M4 15c3-2 6 2 9 0s6-2 7 0" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </Svg>
  );
}

function LateriteIcon({ size = 24, color = P.twGray700 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Polygon points="12,4 3,19 21,19" stroke={color} strokeWidth="1.8" strokeLinejoin="round" />
      <Polygon points="12,9 7,19 17,19" stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
    </Svg>
  );
}

// ─────────────────────────────────────────────
// Types & Categories Data
// ─────────────────────────────────────────────

interface SoilCategory {
  id: string;
  name: string;
  IconComponent: React.ComponentType<{ size?: number; color?: string }>;
}

const SOIL_CATEGORIES: SoilCategory[] = [
  { id: 'sandy', name: 'Sandy', IconComponent: SandyIcon },
  { id: 'clay', name: 'Clay', IconComponent: ClayIcon },
  { id: 'loamy', name: 'Loamy', IconComponent: LoamyIcon },
  { id: 'silty', name: 'Silty', IconComponent: SiltyIcon },
  { id: 'peaty', name: 'Peaty', IconComponent: PeatyIcon },
  { id: 'chalky', name: 'Chalky', IconComponent: ChalkyIcon },
  { id: 'saline', name: 'Saline', IconComponent: SalineIcon },
  { id: 'laterite', name: 'Laterite', IconComponent: LateriteIcon },
];

export interface SoilTypeClassificationScreenProps {
  onBack?: (() => void) | undefined;
}

// ─────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────

export function SoilTypeClassificationScreen({
  onBack,
}: SoilTypeClassificationScreenProps): React.JSX.Element {
  // Android hardware back handler
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

  const [zone1Type, setZone1Type] = useState<string>('Loamy');
  const [zone2Type, setZone2Type] = useState<string>('Clay');
  const [zone3Type, setZone3Type] = useState<string | null>(null);

  const [activeEditingZone, setActiveEditingZone] = useState<'zone1' | 'zone2' | 'zone3' | null>('zone1');

  const handleSelectSoilType = (zone: 'zone1' | 'zone2' | 'zone3', typeName: string) => {
    if (zone === 'zone1') {
      setZone1Type(typeName);
    } else if (zone === 'zone2') {
      setZone2Type(typeName);
    } else if (zone === 'zone3') {
      setZone3Type(typeName);
    }
  };

  const renderSoilCategoryGrid = (
    zone: 'zone1' | 'zone2' | 'zone3',
    currentSelectedType: string | null
  ) => {
    return (
      <View style={styles.gridContainer}>
        {SOIL_CATEGORIES.map((cat) => {
          const isSelected = currentSelectedType === cat.name;
          const Icon = cat.IconComponent;
          return (
            <TouchableOpacity
              key={cat.id}
              style={[
                styles.categoryTile,
                isSelected ? styles.categoryTileSelected : styles.categoryTileUnselected,
              ]}
              onPress={() => handleSelectSoilType(zone, cat.name)}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel={`${cat.name} soil type`}
            >
              <Icon size={24} color={isSelected ? P.forestGreen : P.twGray700} />
              <Text
                style={[
                  styles.categoryName,
                  isSelected ? styles.categoryNameSelected : styles.categoryNameUnselected,
                ]}
              >
                {cat.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={P.white} />

      {/* ── Top Header ── */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={onBack}
            activeOpacity={0.7}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <ArrowBackIcon size={20} color={P.twGreen800} />
          </TouchableOpacity>

          <View style={styles.headerTitleGroup}>
            <Text style={styles.headerTag}>FR-F06</Text>
            <Text style={styles.headerTitle}>Soil Type Classification</Text>
            <Text style={styles.headerSubtitle}>Record your soil type per zone</Text>
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Zone 1 Card ── */}
        <View style={styles.zoneCard}>
          <TouchableOpacity
            style={styles.zoneHeader}
            onPress={() => setActiveEditingZone(activeEditingZone === 'zone1' ? null : 'zone1')}
            activeOpacity={0.8}
          >
            <View>
              <Text style={styles.zoneTitle}>Zone 1 — North Slope</Text>
              <Text style={styles.currentTypeText}>Currently: {zone1Type}</Text>
            </View>
            <TouchableOpacity
              onPress={() => setActiveEditingZone(activeEditingZone === 'zone1' ? null : 'zone1')}
              activeOpacity={0.7}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={styles.changeLinkText}>
                {activeEditingZone === 'zone1' ? 'Done' : 'Change'}
              </Text>
            </TouchableOpacity>
          </TouchableOpacity>

          {/* 8 Categories Grid */}
          {activeEditingZone === 'zone1' && renderSoilCategoryGrid('zone1', zone1Type)}
        </View>

        {/* ── Zone 2 Card ── */}
        <View style={styles.zoneCard}>
          <TouchableOpacity
            style={styles.zoneHeader}
            onPress={() => setActiveEditingZone(activeEditingZone === 'zone2' ? null : 'zone2')}
            activeOpacity={0.8}
          >
            <View>
              <Text style={styles.zoneTitle}>Zone 2 — Terrace Field</Text>
              <Text style={styles.currentTypeText}>Currently: {zone2Type}</Text>
            </View>
            <TouchableOpacity
              onPress={() => setActiveEditingZone(activeEditingZone === 'zone2' ? null : 'zone2')}
              activeOpacity={0.7}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={styles.changeLinkText}>
                {activeEditingZone === 'zone2' ? 'Done' : 'Change'}
              </Text>
            </TouchableOpacity>
          </TouchableOpacity>

          {/* 8 Categories Grid */}
          {activeEditingZone === 'zone2' && renderSoilCategoryGrid('zone2', zone2Type)}
        </View>

        {/* ── Zone 3 Card ── */}
        <View style={styles.zoneCard}>
          <TouchableOpacity
            style={styles.zoneHeader}
            onPress={() => setActiveEditingZone(activeEditingZone === 'zone3' ? null : 'zone3')}
            activeOpacity={0.8}
          >
            <View>
              <Text style={styles.zoneTitle}>Zone 3 — Lower Basin</Text>
              <Text style={zone3Type ? styles.currentTypeText : styles.notRecordedText}>
                {zone3Type ? `Currently: ${zone3Type}` : 'Not yet recorded'}
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => setActiveEditingZone(activeEditingZone === 'zone3' ? null : 'zone3')}
              activeOpacity={0.7}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={styles.changeLinkText}>
                {activeEditingZone === 'zone3' ? 'Done' : (zone3Type ? 'Change' : 'Set Type')}
              </Text>
            </TouchableOpacity>
          </TouchableOpacity>

          {/* 8 Categories Grid */}
          {activeEditingZone === 'zone3' && renderSoilCategoryGrid('zone3', zone3Type)}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ─────────────────────────────────────────────
// Stylesheet
// ─────────────────────────────────────────────

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: P.white,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? 6 : 4,
    paddingBottom: 12,
    backgroundColor: P.white,
    borderBottomWidth: 1,
    borderBottomColor: P.twGray200,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: P.twGray200,
    backgroundColor: P.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    shadowColor: P.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  headerTitleGroup: {
    flex: 1,
  },
  headerTag: {
    fontSize: 11,
    fontWeight: '700',
    color: P.twGray500,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: P.twGray900,
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 12.5,
    fontWeight: '500',
    color: P.twGray500,
    marginTop: 2,
  },
  scrollContainer: {
    flex: 1,
    backgroundColor: P.twGray50,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 32,
  },
  zoneCard: {
    backgroundColor: P.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: P.twGray200,
    padding: 16,
    marginBottom: 14,
    shadowColor: P.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  zoneCardCompact: {
    backgroundColor: P.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: P.twGray200,
    padding: 16,
    marginBottom: 12,
    shadowColor: P.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  zoneHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 0,
  },
  zoneTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: P.twGray900,
  },
  currentTypeText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: P.forestGreen,
    marginTop: 2,
  },
  notRecordedText: {
    fontSize: 12.5,
    fontWeight: '500',
    color: P.twGray500,
    marginTop: 2,
  },
  changeLinkText: {
    fontSize: 13,
    fontWeight: '700',
    color: P.forestGreen,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'space-between',
    marginTop: 14,
  },
  categoryTile: {
    width: '48%',
    height: 72,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  categoryTileUnselected: {
    backgroundColor: P.white,
    borderWidth: 1,
    borderColor: P.twGray200,
  },
  categoryTileSelected: {
    backgroundColor: P.mintTintBg,
    borderWidth: 1.6,
    borderColor: P.forestGreen,
  },
  categoryName: {
    fontSize: 13,
    marginTop: 4,
  },
  categoryNameUnselected: {
    fontWeight: '600',
    color: P.twGray700,
  },
  categoryNameSelected: {
    fontWeight: '700',
    color: P.forestGreen,
  },
});
