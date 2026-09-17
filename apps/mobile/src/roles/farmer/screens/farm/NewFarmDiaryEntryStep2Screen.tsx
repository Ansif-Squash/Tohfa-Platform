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
import Svg, { Path, Circle, Rect, Polyline } from 'react-native-svg';
import { authPalette as P } from '../../theme';

// --- Icons ---
function ArrowBackIcon({ size = 20, color = P.twGreen700 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M19 12H5M5 12L12 19M5 12L12 5" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function ArrowRightIcon({ size = 18, color = P.white }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M5 12h14M12 5l7 7-7 7" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function CheckCircleIcon({ size = 14, color = P.twGreen700 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2" />
      <Path d="M8 12l3 3 5-6" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

// Category Icons
function LandPrepIcon({ size = 24, color = P.twGray600 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M16 18l-4-5-4 5M21 18l-7-9-7 9" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M2 18h20" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function SowingIcon({ size = 24, color = P.twGray600 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M12 18V8" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M8 12c0-2 2-4 4-4s4 2 4 4" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M4 18h16" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function NutrientsIcon({ size = 24, color = P.twGray600 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M12 21a9 9 0 100-18 9 9 0 000 18z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M8 12c0-2 2-4 4-4s4 2 4 4" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M12 16v-8" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function WaterMgmtIcon({ size = 24, color = P.twGray600 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M12 22a7 7 0 007-7c0-2-3-7.5-7-11-4 3.5-7 9-7 11a7 7 0 007 7z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function WeedMgmtIcon({ size = 24, color = P.twGray600 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="5" y="4" width="14" height="16" rx="2" stroke={color} strokeWidth="2" />
      <Circle cx="12" cy="12" r="3" stroke={color} strokeWidth="2" />
      <Path d="M12 15v3 M12 6v3" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function PestMgmtIcon({ size = 24, color = P.twGray600 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M12 20a6 6 0 006-6V9a6 6 0 10-12 0v5a6 6 0 006 6z M12 3v1 M7 6l-2-2 M17 6l2-2 M3 11h2 M19 11h2 M5 16l-2 2 M19 16l2 2" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function CropCareIcon({ size = 24, color = P.twGray600 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="6" cy="6" r="3" stroke={color} strokeWidth="2" />
      <Circle cx="6" cy="18" r="3" stroke={color} strokeWidth="2" />
      <Path d="M20 4L8.12 15.88 M14.47 14.48L20 20 M8.12 8.12L12 12" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function MonitoringIcon({ size = 24, color = P.twGray600 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="11" cy="11" r="8" stroke={color} strokeWidth="2" />
      <Path d="M21 21l-4.35-4.35" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function HarvestingIcon({ size = 24, color = P.twGray600 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="7" cy="16" r="3" stroke={color} strokeWidth="2" />
      <Circle cx="17" cy="16" r="3" stroke={color} strokeWidth="2" />
      <Path d="M4 16H2V9h5v7M9 16h5 M14 9h7v7 M9 9h5v7 M14 12h7 M14 9l2-4h3l2 4" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function PostHarvestIcon({ size = 24, color = P.twGray600 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="4" y="6" width="16" height="14" rx="1" stroke={color} strokeWidth="2" />
      <Path d="M4 10h16 M10 14h4" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function MaintenanceIcon({ size = 24, color = P.twGray600 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function LivestockIcon({ size = 24, color = P.twGray600 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M12 21a9 9 0 009-9V8l-4-3H7L3 8v4a9 9 0 009 9z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Circle cx="8" cy="11" r="1.5" fill={color} />
      <Circle cx="16" cy="11" r="1.5" fill={color} />
      <Path d="M10 16h4" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

// --- Data ---
const CATEGORIES = [
  { id: 'land_prep', label: 'Land Prep', Icon: LandPrepIcon },
  { id: 'sowing', label: 'Sowing', Icon: SowingIcon },
  { id: 'nutrients', label: 'Nutrients', Icon: NutrientsIcon },
  { id: 'water_mgmt', label: 'Water Mgmt', Icon: WaterMgmtIcon },
  { id: 'weed_mgmt', label: 'Weed Mgmt', Icon: WeedMgmtIcon },
  { id: 'pest_mgmt', label: 'Pest Mgmt', Icon: PestMgmtIcon },
  { id: 'crop_care', label: 'Crop Care', Icon: CropCareIcon },
  { id: 'monitoring', label: 'Monitoring', Icon: MonitoringIcon },
  { id: 'harvesting', label: 'Harvesting', Icon: HarvestingIcon },
  { id: 'post_harvest', label: 'Post-Harvest', Icon: PostHarvestIcon },
  { id: 'maintenance', label: 'Maintenance', Icon: MaintenanceIcon },
  { id: 'livestock', label: 'Livestock', Icon: LivestockIcon },
];

const SUB_ACTIVITIES = {
  water_mgmt: [
    { id: 'irrigation', label: 'Irrigation (drip / sprinkler / flood)' },
    { id: 'water_source', label: 'Water source check' },
    { id: 'rainwater', label: 'Rainwater harvesting activity' },
  ],
};

// --- Component ---
interface NewFarmDiaryEntryStep2ScreenProps {
  onBack?: () => void;
  onNext?: () => void;
}

export function NewFarmDiaryEntryStep2Screen({
  onBack,
  onNext,
}: NewFarmDiaryEntryStep2ScreenProps): React.JSX.Element {
  const [selectedCategory, setSelectedCategory] = useState<string>('water_mgmt');
  const [selectedSub, setSelectedSub] = useState<string>('irrigation');

  const currentSubActivities = SUB_ACTIVITIES[selectedCategory as keyof typeof SUB_ACTIVITIES] || [];

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar barStyle="dark-content" backgroundColor={P.white} />

      {/* --- Header --- */}
      <View style={styles.header}>
        <View style={styles.headerTopRow}>
          <TouchableOpacity style={styles.backBtn} onPress={onBack} activeOpacity={0.7}>
            <ArrowBackIcon size={20} color={P.twGreen700} />
          </TouchableOpacity>
          <View style={styles.headerTitleCol}>
            <Text style={styles.headerTitle}>New Entry</Text>
            <Text style={styles.headerSubtitle}>Step 2 of 3 · Activity Type</Text>
          </View>
          <TouchableOpacity onPress={onBack} activeOpacity={0.7}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>

        {/* Progress Bar */}
        <View style={styles.progressRow}>
          <View style={[styles.progressSegment, styles.progressSegmentActive]} />
          <View style={[styles.progressSegment, styles.progressSegmentActive]} />
          <View style={styles.progressSegment} />
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* --- Category Grid --- */}
        <Text style={styles.sectionLabel}>CATEGORY</Text>
        <View style={styles.gridContainer}>
          {CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            return (
              <TouchableOpacity
                key={cat.id}
                style={[styles.gridCard, isSelected && styles.gridCardSelected]}
                activeOpacity={0.7}
                onPress={() => setSelectedCategory(cat.id)}
              >
                <cat.Icon size={24} color={isSelected ? P.twGreen700 : P.twGray500} />
                <Text style={[styles.gridCardLabel, isSelected && styles.gridCardLabelSelected]}>
                  {cat.label}
                </Text>
                {isSelected && (
                  <View style={styles.gridCardCheck}>
                    <CheckCircleIcon size={16} color={P.twGreen700} />
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* --- Sub-Activities --- */}
        {currentSubActivities.length > 0 && (
          <View style={styles.subActivitySection}>
            <Text style={styles.sectionLabel}>
              SUB-ACTIVITY · {CATEGORIES.find((c) => c.id === selectedCategory)?.label.toUpperCase()}
            </Text>
            <View style={styles.radioList}>
              {currentSubActivities.map((sub) => {
                const isSubSelected = selectedSub === sub.id;
                return (
                  <TouchableOpacity
                    key={sub.id}
                    style={[styles.radioItem, isSubSelected && styles.radioItemSelected]}
                    activeOpacity={0.8}
                    onPress={() => setSelectedSub(sub.id)}
                  >
                    <View style={[styles.radioOuter, isSubSelected && styles.radioOuterSelected]}>
                      {isSubSelected && <View style={styles.radioInner} />}
                    </View>
                    <Text style={[styles.radioLabel, isSubSelected && styles.radioLabelSelected]}>
                      {sub.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}
      </ScrollView>

      {/* --- Bottom Action --- */}
      <View style={styles.bottomBar}>
        <View style={styles.bottomBarRow}>
          <TouchableOpacity style={styles.backBottomBtn} onPress={onBack} activeOpacity={0.8}>
            <Text style={styles.backBottomBtnText}>Back</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.nextBtn} onPress={onNext} activeOpacity={0.85}>
            <Text style={styles.nextBtnText}>Next · Details</Text>
            <ArrowRightIcon size={18} color={P.white} />
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

// --- Styles ---
const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: P.lightSurfaceAlt, // #F8F9F3
  },
  header: {
    backgroundColor: P.white,
    paddingTop: 16,
    borderBottomWidth: 1,
    borderBottomColor: P.twGray200,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: P.twGray200,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerTitleCol: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: P.twGray900,
  },
  headerSubtitle: {
    fontSize: 12,
    color: P.twGray500,
    marginTop: 2,
  },
  cancelText: {
    fontSize: 15,
    fontWeight: '600',
    color: P.twGray500,
  },
  progressRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 6,
    marginBottom: -1,
  },
  progressSegment: {
    flex: 1,
    height: 3,
    backgroundColor: P.twGray200,
    borderRadius: 1.5,
  },
  progressSegmentActive: {
    backgroundColor: P.twGreen700,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 40,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: P.twGray500,
    letterSpacing: 0.5,
    marginBottom: 16,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 32,
  },
  gridCard: {
    width: '30%',
    aspectRatio: 1.1,
    backgroundColor: P.white,
    borderWidth: 1.5,
    borderColor: 'transparent',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
    shadowColor: P.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 2,
    elevation: 1,
  },
  gridCardSelected: {
    backgroundColor: '#EBF4EC', // light green
    borderColor: P.twGreen700,
  },
  gridCardLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: P.twGray600,
    marginTop: 8,
    textAlign: 'center',
  },
  gridCardLabelSelected: {
    color: P.twGreen900,
  },
  gridCardCheck: {
    position: 'absolute',
    top: 6,
    right: 6,
  },
  subActivitySection: {
    marginTop: 8,
  },
  radioList: {
    gap: 12,
  },
  radioItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: P.white,
    borderWidth: 1.5,
    borderColor: P.twGray200,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  radioItemSelected: {
    backgroundColor: '#EBF4EC', // light green
    borderColor: P.twGreen700,
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: P.twGray300,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  radioOuterSelected: {
    borderColor: P.twGreen700,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: P.twGreen700,
  },
  radioLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: P.twGray700,
  },
  radioLabelSelected: {
    color: P.twGreen900,
    fontWeight: '700',
  },
  bottomBar: {
    backgroundColor: P.white,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: P.twGray200,
  },
  bottomBarRow: {
    flexDirection: 'row',
    gap: 12,
  },
  backBottomBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: P.white,
    borderWidth: 1.5,
    borderColor: P.twGray200,
    borderRadius: 12,
    paddingVertical: 16,
  },
  backBottomBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: P.twGray700,
  },
  nextBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: P.twGreen700,
    borderRadius: 12,
    paddingVertical: 16,
    gap: 8,
  },
  nextBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: P.white,
  },
});
