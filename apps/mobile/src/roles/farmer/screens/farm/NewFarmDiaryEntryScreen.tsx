import React from 'react';
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Path, Circle, Rect, Line } from 'react-native-svg';
import { authPalette as P, colors } from '../../theme';

// --- Icons ---
function ArrowBackIcon({ size = 20, color = P.twGreen700 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M19 12H5M5 12L12 19M5 12L12 5" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function FieldSquareIcon({ size = 18, color = P.twGreen700 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="4" y="4" width="16" height="16" rx="2" stroke={color} strokeWidth="2.5" />
    </Svg>
  );
}

function PlantPotIcon({ size = 18, color = P.twGreen700 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M12 15V8" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M8 12c0-2 2-4 4-4s4 2 4 4" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M7 15h10l-1.5 6h-7L7 15z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function LeafOutlineIcon({ size = 20, color = P.twGreen700 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 22C12 22 4 16 4 10a6 6 0 0112 0c0 1.5-.5 3-1.5 4M12 22c0 0 8-6 8-12a6 6 0 00-12 0c0 1.5.5 3 1.5 4"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function CalendarOutlineIcon({ size = 20, color = P.twGray500 }: { size?: number; color?: string }) {
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

function ChevronDownIcon({ size = 18, color = P.twGray700 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M6 9l6 6 6-6" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
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

// --- Component ---
interface NewFarmDiaryEntryScreenProps {
  onBack?: () => void;
  onNext?: () => void;
}

export function NewFarmDiaryEntryScreen({ onBack, onNext }: NewFarmDiaryEntryScreenProps): React.JSX.Element {
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
            <Text style={styles.headerSubtitle}>Step 1 of 3 · Field & Crop</Text>
          </View>
          <TouchableOpacity onPress={onBack} activeOpacity={0.7}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>

        {/* Progress Bar */}
        <View style={styles.progressRow}>
          <View style={[styles.progressSegment, styles.progressSegmentActive]} />
          <View style={styles.progressSegment} />
          <View style={styles.progressSegment} />
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.instructionText}>
          Pick the field and crop this entry belongs to. Everything after this is scoped to your choice.
        </Text>

        {/* --- Form --- */}
        <View style={styles.formGroup}>
          <View style={styles.labelRow}>
            <FieldSquareIcon size={16} color={P.twGreen700} />
            <Text style={styles.labelText}>Field</Text>
            <Text style={styles.requiredAsterisk}> *</Text>
          </View>
          
          <TouchableOpacity style={[styles.selectBox, styles.selectBoxActive]} activeOpacity={0.8}>
            <Text style={styles.selectText}>Zone 2 — Lower Slope</Text>
            <ChevronDownIcon size={20} color={P.twGreen700} />
          </TouchableOpacity>
          <Text style={styles.helperText}>From your registered FMB zones (Screen 19).</Text>
        </View>

        <View style={styles.formGroup}>
          <View style={styles.labelRow}>
            <PlantPotIcon size={16} color={P.twGreen700} />
            <Text style={styles.labelText}>Crop</Text>
            <Text style={styles.requiredAsterisk}> *</Text>
          </View>
          
          <TouchableOpacity style={styles.selectBox} activeOpacity={0.8}>
            <Text style={styles.selectText}>Tomato</Text>
            <ChevronDownIcon size={20} color={P.twGray500} />
          </TouchableOpacity>
          <Text style={styles.helperText}>Enabled once a field is chosen — this zone has one active crop.</Text>
        </View>

        {/* --- Info Cards --- */}
        <View style={styles.infoCardsContainer}>
          <View style={styles.infoCard}>
            <LeafOutlineIcon size={22} color={P.twGreen700} />
            <View style={styles.infoCardTextCol}>
              <Text style={styles.infoCardLabel}>CROP DURATION</Text>
              <Text style={styles.infoCardValue}>62 days old</Text>
              <Text style={styles.infoCardSub}>Planted 15 May · harvest ~24 Jul 2026</Text>
            </View>
          </View>

          <View style={styles.infoCard}>
            <CalendarOutlineIcon size={22} color={P.twGray500} />
            <View style={styles.infoCardTextCol}>
              <Text style={styles.infoCardLabel}>DATE</Text>
              <Text style={styles.infoCardValue}>Today · 16 Jul 2026</Text>
            </View>
            <View style={styles.autoPill}>
              <Text style={styles.autoPillText}>AUTO</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* --- Bottom Action --- */}
      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.nextBtn} onPress={onNext} activeOpacity={0.85}>
          <Text style={styles.nextBtnText}>Next · Activity Type</Text>
          <ArrowRightIcon size={18} color={P.white} />
        </TouchableOpacity>
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
    marginBottom: -1, // overlap the border
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
  instructionText: {
    fontSize: 14,
    lineHeight: 22,
    color: P.twGray600,
    marginBottom: 32,
  },
  formGroup: {
    marginBottom: 24,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  labelText: {
    fontSize: 14,
    fontWeight: '700',
    color: P.twGray800,
    marginLeft: 8,
  },
  requiredAsterisk: {
    fontSize: 14,
    fontWeight: '700',
    color: P.twRed600,
  },
  selectBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: P.white,
    borderWidth: 1.5,
    borderColor: P.twGray300,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  selectBoxActive: {
    borderColor: P.twGreen700,
  },
  selectText: {
    fontSize: 15,
    fontWeight: '700',
    color: P.twGray900,
  },
  helperText: {
    fontSize: 12,
    color: P.twGray400,
    marginTop: 8,
    marginLeft: 4,
  },
  infoCardsContainer: {
    marginTop: 8,
    gap: 16,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F5F5EC', // off-white
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.03)',
  },
  infoCardTextCol: {
    flex: 1,
    marginLeft: 14,
  },
  infoCardLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: P.twGray500,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  infoCardValue: {
    fontSize: 15,
    fontWeight: '800',
    color: P.twGray900,
  },
  infoCardSub: {
    fontSize: 12,
    color: P.twGray500,
    marginTop: 4,
  },
  autoPill: {
    backgroundColor: '#EAEAD8',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginTop: 8,
  },
  autoPillText: {
    fontSize: 10,
    fontWeight: '800',
    color: P.twGray600,
  },
  bottomBar: {
    backgroundColor: P.white,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: P.twGray200,
  },
  nextBtn: {
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
