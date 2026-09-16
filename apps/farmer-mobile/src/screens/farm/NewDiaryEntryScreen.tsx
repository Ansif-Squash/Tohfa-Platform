import React, { useState } from 'react';
import {
  Alert,
  Image,
  Modal,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Circle, Line, Path, Rect } from 'react-native-svg';
import { addDiaryEntry, type DiaryItem } from './diaryStore';

// ─────────────────────────────────────────────
// Inline SVG Icons (strictly no unicode emoji)
// ─────────────────────────────────────────────

function ArrowBackIcon({ size = 20, color = '#1B5E20' }: { size?: number; color?: string }) {
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

function ChevronDownIcon({ size = 18, color = '#6B7280' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M6 9l6 6 6-6" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function ArrowRightIcon({ size = 18, color = '#FFFFFF' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M5 12h14M12 5l7 7-7 7" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function CheckmarkIcon({ size = 16, color = '#FFFFFF' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M5 13l4 4L19 7" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function SquareFieldIcon({ size = 16, color = '#15803D' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="3" width="18" height="18" rx="3" stroke={color} strokeWidth="2" />
      <Path d="M3 12h18M12 3v18" stroke={color} strokeWidth="1.5" strokeDasharray="3 3" />
    </Svg>
  );
}

function SproutIcon({ size = 16, color = '#15803D' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 22v-9M12 13a6 6 0 0 1 6-6h2v2a6 6 0 0 1-6 6h-2zM12 15a5 5 0 0 0-5-5H5v2a5 5 0 0 0 5 5h2z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function CalendarIcon({ size = 18, color = '#6B7280' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="4" width="18" height="18" rx="3" stroke={color} strokeWidth="2" />
      <Line x1="16" y1="2" x2="16" y2="6" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="8" y1="2" x2="8" y2="6" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="3" y1="10" x2="21" y2="10" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function WaterDropIcon({ size = 20, color = '#0284C7' }: { size?: number; color?: string }) {
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

// 12 Category SVG Icons
function MountainLandPrepIcon({ size = 22, color = '#4B5563' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M3 20l7-12 4 6 3-4 4 10H3z" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function SowingSeedsIcon({ size = 22, color = '#4B5563' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M12 2v6M12 22v-6M6 7l4 4M18 7l-4 4M4 17l5-2M20 17l-5-2" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <Circle cx="12" cy="14" r="2" fill={color} />
    </Svg>
  );
}

function NutrientsIcon({ size = 22, color = '#4B5563' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M7 19a4 4 0 0 1-4-4 8 8 0 0 1 14.5-4.5M17 5a4 4 0 0 1 4 4 8 8 0 0 1-14.5 4.5" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <Circle cx="12" cy="12" r="2.5" stroke={color} strokeWidth="1.8" />
    </Svg>
  );
}

function WeedMgmtIcon({ size = 22, color = '#4B5563' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="5" y="6" width="14" height="14" rx="2" stroke={color} strokeWidth="1.8" />
      <Path d="M9 14l2-4 2 4M12 10v6" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </Svg>
  );
}

function BugIcon({ size = 22, color = '#4B5563' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="8" y="8" width="8" height="10" rx="4" stroke={color} strokeWidth="1.8" />
      <Path d="M12 8V4M5 11h4M15 11h4M5 16h4M15 16h4" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </Svg>
  );
}

function CropCareShearsIcon({ size = 22, color = '#4B5563' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="6" cy="6" r="3" stroke={color} strokeWidth="1.8" />
      <Circle cx="6" cy="18" r="3" stroke={color} strokeWidth="1.8" />
      <Line x1="8.5" y1="8.5" x2="20" y2="20" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <Line x1="8.5" y1="15.5" x2="20" y2="4" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </Svg>
  );
}

function MonitoringSearchIcon({ size = 22, color = '#4B5563' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="11" cy="11" r="7" stroke={color} strokeWidth="1.8" />
      <Line x1="16" y1="16" x2="21" y2="21" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function HarvestingTractorIcon({ size = 22, color = '#4B5563' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="6.5" cy="16.5" r="3.5" stroke={color} strokeWidth="1.8" />
      <Circle cx="18" cy="15" r="5" stroke={color} strokeWidth="1.8" />
      <Path d="M14 15V8H7v5M10 8V5H5v3M18 15h-4" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </Svg>
  );
}

function PostHarvestBoxIcon({ size = 22, color = '#4B5563' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="4" y="5" width="16" height="15" rx="2" stroke={color} strokeWidth="1.8" />
      <Line x1="4" y1="10" x2="20" y2="10" stroke={color} strokeWidth="1.8" />
      <Line x1="10" y1="13" x2="14" y2="13" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </Svg>
  );
}

function MaintenanceToolsIcon({ size = 22, color = '#4B5563' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function LivestockPawIcon({ size = 22, color = '#4B5563' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="6" cy="9" r="2" fill={color} />
      <Circle cx="18" cy="9" r="2" fill={color} />
      <Circle cx="10" cy="5" r="2" fill={color} />
      <Circle cx="14" cy="5" r="2" fill={color} />
      <Path d="M12 12c-3 0-5 2-5 4 0 2 2 4 5 4s5-2 5-4c0-2-2-4-5-4z" fill={color} />
    </Svg>
  );
}

function CameraAddIcon({ size = 22, color = '#15803D' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <Circle cx="12" cy="13" r="3.5" stroke={color} strokeWidth="1.8" />
      <Line x1="19" y1="4" x2="19" y2="8" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="17" y1="6" x2="21" y2="6" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function MicIcon({ size = 16, color = '#6B7280' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="9" y="3" width="6" height="11" rx="3" stroke={color} strokeWidth="1.8" />
      <Path d="M5 10a7 7 0 0 0 14 0M12 17v4M8 21h8" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </Svg>
  );
}

function NotesDocIcon({ size = 16, color = '#6B7280' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Line x1="4" y1="6" x2="20" y2="6" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="4" y1="12" x2="20" y2="12" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="4" y1="18" x2="14" y2="18" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function CloseCrossIcon({ size = 12, color = '#FFFFFF' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Line x1="18" y1="6" x2="6" y2="18" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
      <Line x1="6" y1="6" x2="18" y2="18" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
    </Svg>
  );
}

function PlayAudioIcon({ size = 16, color = '#15803D' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M8 5v14l11-7z" fill={color} />
    </Svg>
  );
}

// ─────────────────────────────────────────────
// Interfaces & Categories Data
// ─────────────────────────────────────────────

interface CategoryItem {
  id: string;
  name: string;
  icon: (color: string) => React.ReactNode;
}

const CATEGORIES: CategoryItem[] = [
  { id: 'land_prep', name: 'Land Prep', icon: (c) => <MountainLandPrepIcon color={c} /> },
  { id: 'sowing', name: 'Sowing', icon: (c) => <SowingSeedsIcon color={c} /> },
  { id: 'nutrients', name: 'Nutrients', icon: (c) => <NutrientsIcon color={c} /> },
  { id: 'water_mgmt', name: 'Water Mgmt', icon: (c) => <WaterDropIcon color={c} /> },
  { id: 'weed_mgmt', name: 'Weed Mgmt', icon: (c) => <WeedMgmtIcon color={c} /> },
  { id: 'pest_mgmt', name: 'Pest Mgmt', icon: (c) => <BugIcon color={c} /> },
  { id: 'crop_care', name: 'Crop Care', icon: (c) => <CropCareShearsIcon color={c} /> },
  { id: 'monitoring', name: 'Monitoring', icon: (c) => <MonitoringSearchIcon color={c} /> },
  { id: 'harvesting', name: 'Harvesting', icon: (c) => <HarvestingTractorIcon color={c} /> },
  { id: 'post_harvest', name: 'Post-Harvest', icon: (c) => <PostHarvestBoxIcon color={c} /> },
  { id: 'maintenance', name: 'Maintenance', icon: (c) => <MaintenanceToolsIcon color={c} /> },
  { id: 'livestock', name: 'Livestock', icon: (c) => <LivestockPawIcon color={c} /> },
];

const SUB_ACTIVITIES = [
  'Irrigation (drip / sprinkler / flood)',
  'Water source check',
  'Rainwater harvesting activity',
];

interface NewDiaryEntryScreenProps {
  onBack?: () => void;
  onCancel?: () => void;
  onSave?: () => void;
}

export function NewDiaryEntryScreen({
  onBack,
  onCancel,
  onSave,
}: NewDiaryEntryScreenProps): React.JSX.Element {
  // Wizard step: 1, 2, 3
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Step 1 State
  const [selectedField, setSelectedField] = useState('Zone 2 — Lower Slope');
  const [selectedCrop, setSelectedCrop] = useState('Tomato');
  const [activePickerModal, setActivePickerModal] = useState<'field' | 'crop' | null>(null);

  const FIELD_OPTIONS = [
    'Zone 1 — Upper Field',
    'Zone 2 — Lower Slope',
    'Zone 3 — Terrace',
    'Zone 4 — River Bed',
  ];

  const CROP_OPTIONS = ['Tomato', 'Carrot', 'Beans', 'Cabbage'];

  const handleSelectField = (field: string) => {
    setSelectedField(field);
    if (field.includes('Zone 1')) setSelectedCrop('Beans');
    else if (field.includes('Zone 2')) setSelectedCrop('Tomato');
    else if (field.includes('Zone 3')) setSelectedCrop('Carrot');
    else if (field.includes('Zone 4')) setSelectedCrop('Cabbage');
    setActivePickerModal(null);
  };

  const handleSelectCrop = (crop: string) => {
    setSelectedCrop(crop);
    setActivePickerModal(null);
  };

  // Step 2 State
  const [selectedCategory, setSelectedCategory] = useState('water_mgmt');
  const [selectedSubActivity, setSelectedSubActivity] = useState<string>(
    SUB_ACTIVITIES[0] ?? 'Irrigation (drip / sprinkler / flood)'
  );

  // Step 3 State
  const [irrigationMethod, setIrrigationMethod] = useState<'Drip' | 'Sprinkler' | 'Flood'>('Drip');
  const [labourCount, setLabourCount] = useState<number>(2);
  const [timeSpent, setTimeSpent] = useState<string>('45');
  const [notes, setNotes] = useState<string>(
    'Morning drip cycle on the lower beds; cleared two clogged emitters on rows 4–7.'
  );
  const [photos, setPhotos] = useState<string[]>([
    'https://images.unsplash.com/photo-1592982537447-7440770cbfc9?w=300',
    'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=300',
  ]);

  const handleBack = () => {
    if (step === 3) {
      setStep(2);
    } else if (step === 2) {
      setStep(1);
    } else {
      if (onBack) onBack();
      else if (onCancel) onCancel();
    }
  };

  const handleSaveEntry = () => {
    const mappedType: DiaryItem['type'] =
      selectedCategory === 'water_mgmt'
        ? 'irrigation'
        : selectedCategory === 'pest_mgmt'
        ? 'pest'
        : selectedCategory === 'nutrients'
        ? 'manure'
        : selectedCategory === 'harvesting'
        ? 'harvest'
        : selectedCategory === 'weed_mgmt'
        ? 'weeding'
        : 'irrigation';

    const categoryObj = CATEGORIES.find((c) => c.id === selectedCategory);
    const subActivityText = selectedSubActivity || '';
    const subActivityPrefix =
      selectedCategory === 'water_mgmt'
        ? subActivityText.includes('Irrigation')
          ? 'Irrigation'
          : subActivityText.includes('source')
          ? 'Water check'
          : 'Rainwater harvest'
        : categoryObj?.name ?? 'Activity';

    addDiaryEntry({
      day: 16, // Today: 16 July 2026
      monthYear: 'July 2026',
      dateLabel: 'THURSDAY, 16 JULY',
      title: `${subActivityPrefix} · ${selectedCrop}`,
      field: `${selectedField} · 04:30 PM`,
      duration: `${timeSpent.trim() || '45'}m`,
      type: mappedType,
      method: `Method · ${irrigationMethod}`,
      labour: `${labourCount} labour`,
      notes: notes.trim() || undefined,
      hasPhotos: photos.length > 0,
    });

    if (onSave) {
      onSave();
    } else if (onBack) {
      onBack();
    }
  };

  const removePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const addPhoto = () => {
    Alert.alert('Add Photo', 'Take photo or choose from gallery', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Add Mock Photo',
        onPress: () =>
          setPhotos((prev) => [
            ...prev,
            'https://images.unsplash.com/photo-1592982537447-7440770cbfc9?w=300',
          ]),
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* ── Top Bar with Back, Title/Step, Cancel ── */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backCircleBtn}
          onPress={handleBack}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Back"
        >
          <ArrowBackIcon size={20} color="#15803D" />
        </TouchableOpacity>

        <View style={styles.headerTitleCol}>
          <Text style={styles.headerTitle}>New Entry</Text>
          <Text style={styles.headerSubtitle}>
            {step === 1
              ? 'Step 1 of 3 · Field & Crop'
              : step === 2
              ? 'Step 2 of 3 · Activity Type'
              : 'Step 3 of 3 · Details'}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.cancelBtn}
          onPress={onCancel ?? onBack}
          activeOpacity={0.7}
        >
          <Text style={styles.cancelBtnText}>Cancel</Text>
        </TouchableOpacity>
      </View>

      {/* ── 3-Segment Progress Bar ── */}
      <View style={styles.progressBarRow}>
        <View style={[styles.progressSegment, styles.progressSegmentActive]} />
        <View
          style={[
            styles.progressSegment,
            step >= 2 ? styles.progressSegmentActive : styles.progressSegmentInactive,
          ]}
        />
        <View
          style={[
            styles.progressSegment,
            step === 3 ? styles.progressSegmentActive : styles.progressSegmentInactive,
          ]}
        />
      </View>

      {/* ── Scrollable Body ── */}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ============================================================ */}
        {/* STEP 1: FIELD & CROP                                         */}
        {/* ============================================================ */}
        {step === 1 && (
          <View style={styles.stepContainer}>
            <Text style={styles.stepIntroText}>
              Pick the field and crop this entry belongs to. Everything after this is scoped to your choice.
            </Text>

            {/* Field Dropdown */}
            <View style={styles.inputGroup}>
              <View style={styles.inputLabelRow}>
                <SquareFieldIcon size={16} color="#15803D" />
                <Text style={styles.inputLabel}>
                  Field <Text style={styles.reqAsterisk}>*</Text>
                </Text>
              </View>

              <TouchableOpacity
                style={styles.dropdownFieldSelected}
                activeOpacity={0.8}
                onPress={() => setActivePickerModal('field')}
              >
                <Text style={styles.dropdownValueText}>{selectedField}</Text>
                <ChevronDownIcon size={18} color="#6B7280" />
              </TouchableOpacity>
              <Text style={styles.helperText}>From your registered FMB zones (Screen 19).</Text>
            </View>

            {/* Crop Dropdown */}
            <View style={styles.inputGroup}>
              <View style={styles.inputLabelRow}>
                <SproutIcon size={16} color="#15803D" />
                <Text style={styles.inputLabel}>
                  Crop <Text style={styles.reqAsterisk}>*</Text>
                </Text>
              </View>

              <TouchableOpacity
                style={styles.dropdownField}
                activeOpacity={0.8}
                onPress={() => setActivePickerModal('crop')}
              >
                <Text style={styles.dropdownValueText}>{selectedCrop}</Text>
                <ChevronDownIcon size={18} color="#6B7280" />
              </TouchableOpacity>
              <Text style={styles.helperText}>
                Enabled once a field is chosen — this zone has one active crop.
              </Text>
            </View>

            {/* Crop Duration Card */}
            <View style={styles.infoCard}>
              <View style={styles.infoCardIconBox}>
                <SproutIcon size={20} color="#15803D" />
              </View>
              <View style={styles.infoCardContent}>
                <Text style={styles.infoCardLabel}>CROP DURATION</Text>
                <Text style={styles.infoCardTitle}>62 days old</Text>
                <Text style={styles.infoCardSubtitle}>Planted 15 May · harvest ~24 Jul 2026</Text>
              </View>
            </View>

            {/* Date Card */}
            <View style={styles.infoCard}>
              <View style={styles.infoCardIconBox}>
                <CalendarIcon size={20} color="#6B7280" />
              </View>
              <View style={styles.infoCardContent}>
                <Text style={styles.infoCardLabel}>DATE</Text>
                <Text style={styles.infoCardTitle}>Today · 16 Jul 2026</Text>
              </View>
              <View style={styles.autoBadge}>
                <Text style={styles.autoBadgeText}>AUTO</Text>
              </View>
            </View>
          </View>
        )}

        {/* ============================================================ */}
        {/* STEP 2: ACTIVITY TYPE                                        */}
        {/* ============================================================ */}
        {step === 2 && (
          <View style={styles.stepContainer}>
            <Text style={styles.sectionHeaderLabel}>CATEGORY</Text>

            {/* 12 Categories Grid */}
            <View style={styles.categoriesGrid}>
              {CATEGORIES.map((cat) => {
                const isSelected = selectedCategory === cat.id;
                return (
                  <TouchableOpacity
                    key={cat.id}
                    style={[
                      styles.categoryCard,
                      isSelected && styles.categoryCardSelected,
                    ]}
                    activeOpacity={0.8}
                    onPress={() => setSelectedCategory(cat.id)}
                  >
                    {isSelected && (
                      <View style={styles.catCheckmarkBadge}>
                        <CheckmarkIcon size={10} color="#15803D" />
                      </View>
                    )}
                    <View style={styles.categoryIconWrap}>
                      {cat.icon(isSelected ? '#15803D' : '#4B5563')}
                    </View>
                    <Text
                      style={[
                        styles.categoryName,
                        isSelected && styles.categoryNameSelected,
                      ]}
                      numberOfLines={1}
                    >
                      {cat.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Sub-Activity Section */}
            <Text style={styles.sectionHeaderLabel}>
              SUB-ACTIVITY ·{' '}
              {selectedCategory === 'water_mgmt'
                ? 'WATER MANAGEMENT'
                : selectedCategory.replace('_', ' ').toUpperCase()}
            </Text>

            <View style={styles.subActivitiesList}>
              {SUB_ACTIVITIES.map((item, idx) => {
                const isSelected = selectedSubActivity === item;
                return (
                  <TouchableOpacity
                    key={idx}
                    style={[
                      styles.subActivityCard,
                      isSelected && styles.subActivityCardSelected,
                    ]}
                    activeOpacity={0.8}
                    onPress={() => setSelectedSubActivity(item)}
                  >
                    <View
                      style={[
                        styles.radioOuter,
                        isSelected && styles.radioOuterSelected,
                      ]}
                    >
                      {isSelected && <View style={styles.radioInner} />}
                    </View>
                    <Text
                      style={[
                        styles.subActivityText,
                        isSelected && styles.subActivityTextSelected,
                      ]}
                    >
                      {item}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {/* ============================================================ */}
        {/* STEP 3: DETAILS                                              */}
        {/* ============================================================ */}
        {step === 3 && (
          <View style={styles.stepContainer}>
            {/* Top Summary Banner */}
            <View style={styles.topSummaryBanner}>
              <View style={styles.summaryIconBox}>
                <WaterDropIcon size={20} color="#0284C7" />
              </View>
              <View style={styles.summaryTextCol}>
                <Text style={styles.summaryTitle}>Irrigation · Tomato</Text>
                <Text style={styles.summarySubtitle}>
                  Water Management · Zone 2 — Lower Slope
                </Text>
              </View>
            </View>

            <Text style={styles.sectionHeaderLabel}>IRRIGATION DETAILS</Text>

            {/* Irrigation Method Pills */}
            <View style={styles.detailRow}>
              <Text style={styles.inputLabel}>
                Irrigation method <Text style={styles.reqAsterisk}>*</Text>
              </Text>
              <View style={styles.methodsRow}>
                {(['Drip', 'Sprinkler', 'Flood'] as const).map((m) => {
                  const isSelected = irrigationMethod === m;
                  return (
                    <TouchableOpacity
                      key={m}
                      style={[styles.methodPill, isSelected && styles.methodPillSelected]}
                      activeOpacity={0.8}
                      onPress={() => setIrrigationMethod(m)}
                    >
                      <Text
                        style={[
                          styles.methodPillText,
                          isSelected && styles.methodPillTextSelected,
                        ]}
                      >
                        {m}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Labour Count & Time Spent in 2 Columns */}
            <View style={styles.twoColRow}>
              {/* Labour Stepper */}
              <View style={styles.colHalf}>
                <Text style={styles.inputLabel}>Labour count</Text>
                <View style={styles.stepperContainer}>
                  <Text style={styles.stepperValue}>{labourCount}</Text>
                  <TouchableOpacity
                    style={styles.stepperBtn}
                    onPress={() => setLabourCount((prev) => Math.max(1, prev - 1))}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.stepperBtnText}>-</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.stepperBtn, styles.stepperBtnAdd]}
                    onPress={() => setLabourCount((prev) => prev + 1)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.stepperBtnText, styles.stepperBtnTextAdd]}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Time Spent */}
              <View style={styles.colHalf}>
                <Text style={styles.inputLabel}>
                  Time spent <Text style={styles.reqAsterisk}>*</Text>
                </Text>
                <View style={styles.timeSpentBox}>
                  <TextInput
                    style={styles.timeSpentInput}
                    value={timeSpent}
                    onChangeText={setTimeSpent}
                    keyboardType="numeric"
                  />
                  <Text style={styles.timeSpentUnit}>minutes</Text>
                </View>
              </View>
            </View>

            {/* Photos Section */}
            <View style={styles.inputGroup}>
              <View style={styles.inputLabelRow}>
                <CameraAddIcon size={16} color="#6B7280" />
                <Text style={styles.inputLabel}>Photos</Text>
              </View>

              <View style={styles.photosRow}>
                {photos.map((uri, idx) => (
                  <View key={idx} style={styles.photoThumbContainer}>
                    <Image source={{ uri }} style={styles.photoThumb} />
                    <TouchableOpacity
                      style={styles.photoRemoveBtn}
                      activeOpacity={0.7}
                      onPress={() => removePhoto(idx)}
                    >
                      <CloseCrossIcon size={10} color="#FFFFFF" />
                    </TouchableOpacity>
                  </View>
                ))}

                <TouchableOpacity
                  style={styles.photoAddBtn}
                  activeOpacity={0.7}
                  onPress={addPhoto}
                >
                  <CameraAddIcon size={22} color="#15803D" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Voice Note Section */}
            <View style={styles.inputGroup}>
              <View style={styles.inputLabelRow}>
                <MicIcon size={16} color="#6B7280" />
                <Text style={styles.inputLabel}>Voice note</Text>
              </View>

              <View style={styles.voiceNotePlayer}>
                <TouchableOpacity style={styles.voicePlayBtn} activeOpacity={0.8}>
                  <PlayAudioIcon size={16} color="#15803D" />
                </TouchableOpacity>

                {/* Waveform graphic bars */}
                <View style={styles.waveformContainer}>
                  {[12, 18, 14, 22, 10, 16, 14, 20].map((h, i) => (
                    <View
                      key={i}
                      style={[styles.waveBar, { height: h }]}
                    />
                  ))}
                </View>

                <Text style={styles.voiceTimerText}>0:14</Text>
              </View>
            </View>

            {/* Notes Section */}
            <View style={styles.inputGroup}>
              <View style={styles.inputLabelRow}>
                <NotesDocIcon size={16} color="#6B7280" />
                <Text style={styles.inputLabel}>Notes</Text>
              </View>

              <TextInput
                style={styles.notesTextarea}
                value={notes}
                onChangeText={setNotes}
                multiline
                numberOfLines={3}
                placeholder="Add any extra notes..."
              />
            </View>
          </View>
        )}
      </ScrollView>

      {/* ── Fixed Bottom Actions ── */}
      <View style={styles.bottomBar}>
        {step === 1 ? (
          <TouchableOpacity
            style={styles.primaryNextBtn}
            activeOpacity={0.85}
            onPress={() => setStep(2)}
          >
            <Text style={styles.primaryNextBtnText}>Next · Activity Type</Text>
            <ArrowRightIcon size={18} color="#FFFFFF" />
          </TouchableOpacity>
        ) : step === 2 ? (
          <View style={styles.twoButtonsRow}>
            <TouchableOpacity
              style={styles.secondaryBackBtn}
              activeOpacity={0.8}
              onPress={() => setStep(1)}
            >
              <Text style={styles.secondaryBackBtnText}>Back</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.primaryNextHalfBtn}
              activeOpacity={0.85}
              onPress={() => setStep(3)}
            >
              <Text style={styles.primaryNextBtnText}>Next · Details</Text>
              <ArrowRightIcon size={18} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.twoButtonsRow}>
            <TouchableOpacity
              style={styles.secondaryBackBtn}
              activeOpacity={0.8}
              onPress={() => setStep(2)}
            >
              <Text style={styles.secondaryBackBtnText}>Back</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.primarySaveBtn}
              activeOpacity={0.85}
              onPress={handleSaveEntry}
            >
              <CheckmarkIcon size={16} color="#FFFFFF" />
              <Text style={styles.primaryNextBtnText}>Save entry</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Selection Modal Bottom Sheet for Field and Crop */}
      <Modal
        visible={activePickerModal !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setActivePickerModal(null)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setActivePickerModal(null)}
        >
          <View style={styles.modalSheet} onStartShouldSetResponder={() => true}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {activePickerModal === 'field' ? 'Select Field / Zone' : 'Select Crop'}
              </Text>
              <TouchableOpacity
                onPress={() => setActivePickerModal(null)}
                style={styles.modalCloseBtn}
              >
                <CloseCrossIcon size={16} color="#4B5563" />
              </TouchableOpacity>
            </View>
            <View style={styles.modalList}>
              {(activePickerModal === 'field' ? FIELD_OPTIONS : CROP_OPTIONS).map((option) => {
                const isSelected =
                  activePickerModal === 'field'
                    ? selectedField === option
                    : selectedCrop === option;
                return (
                  <TouchableOpacity
                    key={option}
                    style={[styles.modalOptionRow, isSelected && styles.modalOptionSelected]}
                    activeOpacity={0.7}
                    onPress={() => {
                      if (activePickerModal === 'field') {
                        handleSelectField(option);
                      } else {
                        handleSelectCrop(option);
                      }
                    }}
                  >
                    <Text
                      style={[
                        styles.modalOptionText,
                        isSelected && styles.modalOptionTextSelected,
                      ]}
                    >
                      {option}
                    </Text>
                    {isSelected && (
                      <View style={styles.checkmarkWrap}>
                        <CheckmarkIcon size={14} color="#FFFFFF" />
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

// ─────────────────────────────────────────────
// Stylesheet
// ─────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
  },
  backCircleBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleCol: {
    flex: 1,
    marginLeft: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  cancelBtn: {
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  cancelBtnText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  progressBarRow: {
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 16,
    marginBottom: 14,
  },
  progressSegment: {
    flex: 1,
    height: 3.5,
    borderRadius: 2,
  },
  progressSegmentActive: {
    backgroundColor: '#15803D',
  },
  progressSegmentInactive: {
    backgroundColor: '#E5E7EB',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  stepContainer: {
    gap: 16,
  },
  stepIntroText: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
  },
  inputGroup: {
    gap: 6,
  },
  inputLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
  },
  reqAsterisk: {
    color: '#DC2626',
  },
  dropdownFieldSelected: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1.5,
    borderColor: '#15803D',
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  dropdownField: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  dropdownValueText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  helperText: {
    fontSize: 11,
    color: '#9CA3AF',
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 14,
    gap: 12,
  },
  infoCardIconBox: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#E8F5E9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoCardContent: {
    flex: 1,
  },
  infoCardLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#6B7280',
    letterSpacing: 0.5,
  },
  infoCardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
    marginTop: 2,
  },
  infoCardSubtitle: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 2,
  },
  autoBadge: {
    backgroundColor: '#E5E7EB',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  autoBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#6B7280',
  },
  sectionHeaderLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6B7280',
    letterSpacing: 0.5,
    marginTop: 6,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryCard: {
    width: '31.3%',
    aspectRatio: 1.15,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 6,
    position: 'relative',
  },
  categoryCardSelected: {
    backgroundColor: '#F0FDF4',
    borderColor: '#15803D',
    borderWidth: 1.5,
  },
  catCheckmarkBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#15803D',
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryIconWrap: {
    marginBottom: 6,
  },
  categoryName: {
    fontSize: 11,
    fontWeight: '500',
    color: '#374151',
    textAlign: 'center',
  },
  categoryNameSelected: {
    fontWeight: '700',
    color: '#15803D',
  },
  subActivitiesList: {
    gap: 8,
  },
  subActivityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 12,
  },
  subActivityCardSelected: {
    backgroundColor: '#F0FDF4',
    borderColor: '#15803D',
    borderWidth: 1.5,
  },
  radioOuter: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.8,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOuterSelected: {
    borderColor: '#15803D',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#15803D',
  },
  subActivityText: {
    fontSize: 13,
    color: '#374151',
    flex: 1,
  },
  subActivityTextSelected: {
    fontWeight: '600',
    color: '#111827',
  },
  topSummaryBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    borderRadius: 12,
    padding: 12,
    gap: 10,
  },
  summaryIconBox: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryTextCol: {
    flex: 1,
  },
  summaryTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  summarySubtitle: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 2,
  },
  detailRow: {
    gap: 8,
  },
  methodsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  methodPill: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  methodPillSelected: {
    backgroundColor: '#F0FDF4',
    borderColor: '#15803D',
    borderWidth: 1.5,
  },
  methodPillText: {
    fontSize: 13,
    color: '#4B5563',
    fontWeight: '500',
  },
  methodPillTextSelected: {
    color: '#15803D',
    fontWeight: '700',
  },
  twoColRow: {
    flexDirection: 'row',
    gap: 12,
  },
  colHalf: {
    flex: 1,
    gap: 6,
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    height: 44,
    paddingHorizontal: 8,
    gap: 8,
  },
  stepperValue: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
    paddingLeft: 6,
  },
  stepperBtn: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperBtnAdd: {
    backgroundColor: '#DCFCE7',
  },
  stepperBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4B5563',
    lineHeight: 18,
  },
  stepperBtnTextAdd: {
    color: '#15803D',
  },
  timeSpentBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#15803D',
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    height: 44,
    paddingHorizontal: 12,
  },
  timeSpentInput: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
    padding: 0,
    width: 32,
  },
  timeSpentUnit: {
    fontSize: 13,
    color: '#6B7280',
    marginLeft: 4,
  },
  photosRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  photoThumbContainer: {
    position: 'relative',
    width: 64,
    height: 64,
    borderRadius: 10,
    overflow: 'hidden',
  },
  photoThumb: {
    width: '100%',
    height: '100%',
  },
  photoRemoveBtn: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoAddBtn: {
    width: 64,
    height: 64,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#15803D',
    borderStyle: 'dashed',
    backgroundColor: '#F0FDF4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  voiceNotePlayer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 12,
  },
  voicePlayBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  waveformContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  waveBar: {
    flex: 1,
    backgroundColor: '#A7F3D0',
    borderRadius: 2,
  },
  voiceTimerText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  notesTextarea: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: '#111827',
    textAlignVertical: 'top',
    minHeight: 70,
  },
  bottomBar: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    backgroundColor: '#FFFFFF',
  },
  primaryNextBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1B5E20',
    height: 48,
    borderRadius: 12,
    gap: 8,
  },
  primaryNextBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  twoButtonsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  secondaryBackBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
    height: 48,
    borderRadius: 12,
  },
  secondaryBackBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4B5563',
  },
  primaryNextHalfBtn: {
    flex: 1.6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1B5E20',
    height: 48,
    borderRadius: 12,
    gap: 8,
  },
  primarySaveBtn: {
    flex: 1.6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1B5E20',
    height: 48,
    borderRadius: 12,
    gap: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 36,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  modalCloseBtn: {
    padding: 6,
  },
  modalList: {
    gap: 8,
  },
  modalOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  modalOptionSelected: {
    backgroundColor: '#F0FDF4',
    borderColor: '#15803D',
  },
  modalOptionText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  modalOptionTextSelected: {
    color: '#15803D',
    fontWeight: '700',
  },
  checkmarkWrap: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#15803D',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
