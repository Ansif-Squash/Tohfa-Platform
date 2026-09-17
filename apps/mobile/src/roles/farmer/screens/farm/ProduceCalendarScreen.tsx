import React, { useState, useMemo, useEffect } from 'react';
import {
  Alert,
  BackHandler,
  Image,
  Modal,
  Platform,
  Pressable,
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
import { authPalette as P, colors } from '../../theme';

// ─────────────────────────────────────────────
// Inline Vector Icons (strictly no emoji, no raw hex)
// ─────────────────────────────────────────────

function ArrowBackIcon({ size = 20, color = P.deepGreen }: { size?: number; color?: string }) {
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

function ChevronDownIcon({ size = 16, color = P.twGray400 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M6 9l6 6 6-6"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function ChevronRightIcon({ size = 18, color = P.twGray400 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M9 18l6-6-6-6"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function ClockMiniIcon({ size = 13, color = P.twGray500 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth="2" />
      <Path
        d="M12 7v5l3 2"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function CalendarMiniIcon({ size = 13, color = P.twGray500 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="4" width="18" height="18" rx="3" stroke={color} strokeWidth="2" />
      <Line x1="16" y1="2" x2="16" y2="6" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="8" y1="2" x2="8" y2="6" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="3" y1="10" x2="21" y2="10" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <Rect x="7" y="14" width="3" height="3" rx="0.5" fill={color} />
      <Rect x="14" y="14" width="3" height="3" rx="0.5" fill={color} />
    </Svg>
  );
}

function FertLeafIcon({ size = 13, color = P.twOrange600 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 2C8 6 6 10 6 14a6 6 0 0 0 12 0c0-4-2-8-6-12z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M12 8v8M10 13l2-2 2 2"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function BugMiniIcon({ size = 13, color = P.twPurple600 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="8" y="7" width="8" height="12" rx="4" stroke={color} strokeWidth="1.8" />
      <Path
        d="M12 4v3M9 6a3 3 0 0 1 6 0M5 10h3M16 10h3M4 15h4M16 15h4M6 20l2-2M18 20l-2-2"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </Svg>
  );
}

function PlusIcon({ size = 18, color = P.white }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Line x1="12" y1="5" x2="12" y2="19" stroke={color} strokeWidth="2.8" strokeLinecap="round" />
      <Line x1="5" y1="12" x2="19" y2="12" stroke={color} strokeWidth="2.8" strokeLinecap="round" />
    </Svg>
  );
}

// ─────────────────────────────────────────────
// Fallback Crop Illustrations (rendering offline)
// ─────────────────────────────────────────────

function CarrotIllustration({ size = 48 }: { size?: number }) {
  return (
    <View style={[styles.illustrationContainer, { width: size, height: size, backgroundColor: P.twOrange100 }]}>
      <Svg width={size * 0.75} height={size * 0.75} viewBox="0 0 32 32" fill="none">
        <Path d="M16 6c-1-3-3-4-5-5 0 2 1 4 3 5-3-1-5-1-7 0 2 2 4 2 6 2" stroke={P.twGreen700} strokeWidth="1.6" strokeLinecap="round" />
        <Path d="M16 6c1-3 3-4 5-5 0 2-1 4-3 5 3-1 5-1 7 0-2 2-4 2-6 2" stroke={P.twGreen700} strokeWidth="1.6" strokeLinecap="round" />
        <Path d="M12 8c0 0 2-1 4-1s4 1 4 1l-2.5 20c-.5 2-2.5 2-3 0L12 8z" fill={P.twOrange500} stroke={P.twOrange600} strokeWidth="1.5" />
        <Line x1="13" y1="13" x2="17" y2="14" stroke={P.twOrange700} strokeWidth="1.2" strokeLinecap="round" />
        <Line x1="14" y1="18" x2="18" y2="19" stroke={P.twOrange700} strokeWidth="1.2" strokeLinecap="round" />
        <Line x1="14.5" y1="23" x2="16.5" y2="23.5" stroke={P.twOrange700} strokeWidth="1.2" strokeLinecap="round" />
      </Svg>
    </View>
  );
}

function TomatoIllustration({ size = 48 }: { size?: number }) {
  return (
    <View style={[styles.illustrationContainer, { width: size, height: size, backgroundColor: P.twRed100 }]}>
      <Svg width={size * 0.75} height={size * 0.75} viewBox="0 0 32 32" fill="none">
        <Circle cx="16" cy="18" r="10" fill={P.twRed600} />
        <Path d="M16 4v5M12 7l4 2 4-2M13 11l3-2 3 2" stroke={P.twGreen700} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <Path d="M12 14c-1 2-1 5 1 7" stroke={P.twRed300} strokeWidth="1.2" strokeLinecap="round" />
      </Svg>
    </View>
  );
}

function CabbageIllustration({ size = 48 }: { size?: number }) {
  return (
    <View style={[styles.illustrationContainer, { width: size, height: size, backgroundColor: P.twGreen100 }]}>
      <Svg width={size * 0.75} height={size * 0.75} viewBox="0 0 32 32" fill="none">
        <Circle cx="16" cy="16" r="10" fill={P.twGreen500} />
        <Path d="M9 16c0-4 3-7 7-7s7 3 7 7-3 7-7 7" stroke={P.green200} strokeWidth="1.5" strokeLinecap="round" />
        <Path d="M12 16c1-2 2.5-3 4-3s3 1 4 3-1 4-4 4-3.5-2-4-4z" fill={P.twGreen100} />
        <Path d="M16 8v16M11 13c3 1 7 1 10 0M11 19c3-1 7-1 10 0" stroke={P.twGreen700} strokeWidth="1.2" strokeLinecap="round" />
      </Svg>
    </View>
  );
}

function CropThumbnail({ cropType, imageUri }: { cropType: 'carrot' | 'tomato' | 'cabbage' | 'custom'; imageUri?: string | undefined }) {
  const [imageError, setImageError] = useState(false);

  if (!imageUri || imageError) {
    if (cropType === 'carrot') return <CarrotIllustration />;
    if (cropType === 'tomato') return <TomatoIllustration />;
    return <CabbageIllustration />;
  }

  return (
    <View style={styles.thumbnailImgWrapper}>
      <Image
        source={{ uri: imageUri }}
        style={styles.thumbnailImg}
        onError={() => setImageError(true)}
      />
    </View>
  );
}

// ─────────────────────────────────────────────
// Types & Initial Data
// ─────────────────────────────────────────────

export interface CropItem {
  id: string;
  name: string;
  variety: string;
  cropType: 'carrot' | 'tomato' | 'cabbage' | 'custom';
  zone: string;
  zoneShort: string;
  area: string;
  daysOld: number;
  statusType: 'ready' | 'harvest' | 'growing';
  statusDays: number;
  statusText: string;
  actionType?: 'fert' | 'pest' | null | undefined;
  actionText?: string | undefined;
  accentColor: string;
  imageUri?: string | undefined;
}

const INITIAL_CROPS: CropItem[] = [
  {
    id: 'crop-1',
    name: 'Carrot',
    variety: 'Nantes',
    cropType: 'carrot',
    zone: 'Zone 1 — Upper Field',
    zoneShort: 'Zone 1',
    area: '0.4 ha',
    daysOld: 88,
    statusType: 'ready',
    statusDays: 3,
    statusText: 'Ready in 3 days',
    actionType: 'fert',
    actionText: 'Fert due',
    accentColor: P.twOrange500,
    imageUri: 'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?w=400&auto=format&fit=crop&q=85',
  },
  {
    id: 'crop-2',
    name: 'Tomato',
    variety: 'Roma',
    cropType: 'tomato',
    zone: 'Zone 2 — Lower Slope',
    zoneShort: 'Zone 2',
    area: '0.6 ha',
    daysOld: 45,
    statusType: 'harvest',
    statusDays: 30,
    statusText: 'Harvest in 30 days',
    actionType: 'pest',
    actionText: 'Pest check due',
    accentColor: P.twOrange500,
    imageUri: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=400&auto=format&fit=crop&q=85',
  },
  {
    id: 'crop-3',
    name: 'Cabbage',
    variety: 'Green Coronet',
    cropType: 'cabbage',
    zone: 'Zone 3 — Terrace',
    zoneShort: 'Zone 3',
    area: '0.5 ha',
    daysOld: 21,
    statusType: 'harvest',
    statusDays: 69,
    statusText: 'Harvest in 69 days',
    actionType: null,
    actionText: undefined,
    accentColor: P.twGreen600,
    imageUri: 'https://images.unsplash.com/photo-1594282486552-05b4d80fbb9f?w=400&auto=format&fit=crop&q=85',
  },
];

export let localProduceCropsCache: CropItem[] = [...INITIAL_CROPS];

export function addProduceCropLocally(crop: CropItem): void {
  localProduceCropsCache = [crop, ...localProduceCropsCache];
}

export interface ProduceCalendarScreenProps {
  onBack?: () => void;
  onNavigateToNewCrop?: () => void;
  onNavigateToCropDetail?: (crop: CropItem) => void;
}

export function ProduceCalendarScreen({
  onBack,
  onNavigateToNewCrop,
  onNavigateToCropDetail,
}: ProduceCalendarScreenProps): React.JSX.Element {
  const [crops, setCrops] = useState<CropItem[]>(() => [...localProduceCropsCache]);
  const [selectedZone, setSelectedZone] = useState<string>('All zones');
  const [selectedStatus, setSelectedStatus] = useState<string>('Any status');

  useEffect(() => {
    setCrops([...localProduceCropsCache]);
  }, []);

  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      if (onBack) {
        onBack();
        return true;
      }
      return false;
    });
    return () => subscription.remove();
  }, [onBack]);

  // Modals state
  const [showZonePicker, setShowZonePicker] = useState<boolean>(false);
  const [showStatusPicker, setShowStatusPicker] = useState<boolean>(false);
  const [showNewCropModal, setShowNewCropModal] = useState<boolean>(false);
  const [selectedCropDetail, setSelectedCropDetail] = useState<CropItem | null>(null);

  // New crop form state
  const [newCropName, setNewCropName] = useState('');
  const [newCropVariety, setNewCropVariety] = useState('');
  const [newCropZone, setNewCropZone] = useState('Zone 1 — Upper Field');
  const [newCropArea, setNewCropArea] = useState('0.5 ha');
  const [newCropDaysToHarvest, setNewCropDaysToHarvest] = useState('60');

  // Filtered crops list
  const filteredCrops = useMemo(() => {
    return crops.filter((item) => {
      // Zone filter
      if (selectedZone !== 'All zones') {
        if (!item.zone.includes(selectedZone) && item.zoneShort !== selectedZone) {
          return false;
        }
      }
      // Status filter
      if (selectedStatus === 'Ready') {
        return item.statusType === 'ready';
      }
      if (selectedStatus === 'Harvest soon') {
        return item.statusDays <= 30;
      }
      if (selectedStatus === 'Action due') {
        return Boolean(item.actionType);
      }
      return true;
    });
  }, [crops, selectedZone, selectedStatus]);

  const handleCreateCrop = () => {
    if (!newCropName.trim()) {
      Alert.alert('Crop Name Required', 'Please enter a crop name (e.g. Bell Pepper).');
      return;
    }

    const lower = newCropName.toLowerCase();
    let cropType: 'carrot' | 'tomato' | 'cabbage' | 'custom' = 'custom';
    let accentColor: string = P.twGreen600;
    if (lower.includes('carrot')) {
      cropType = 'carrot';
      accentColor = P.twOrange500;
    } else if (lower.includes('tomato')) {
      cropType = 'tomato';
      accentColor = P.twOrange500;
    } else if (lower.includes('cabbage')) {
      cropType = 'cabbage';
      accentColor = P.twGreen600;
    }

    const days = parseInt(newCropDaysToHarvest, 10) || 45;
    const isReady = days <= 5;

    const newCrop: CropItem = {
      id: `crop-${Date.now()}`,
      name: newCropName.trim(),
      variety: newCropVariety.trim() || 'Local Hybrid',
      cropType,
      zone: newCropZone,
      zoneShort: (newCropZone.split('—')[0] ?? newCropZone).trim(),
      area: newCropArea.trim() || '0.5 ha',
      daysOld: 1,
      statusType: isReady ? 'ready' : 'harvest',
      statusDays: days,
      statusText: isReady ? `Ready in ${days} days` : `Harvest in ${days} days`,
      actionType: null,
      accentColor,
    };

    setCrops([newCrop, ...crops]);
    setShowNewCropModal(false);
    setNewCropName('');
    setNewCropVariety('');
    Alert.alert('Crop Added', `${newCrop.name} has been added to your Produce Calendar.`);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={P.white} />

      {/* ── Top Header ── */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={onBack}
          activeOpacity={0.7}
          hitSlop={{ top: 16, bottom: 16, left: 16, right: 16 }}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <ArrowBackIcon size={20} color={P.twGreen800} />
        </TouchableOpacity>

        <View style={styles.headerTitleGroup}>
          <Text style={styles.headerTitle}>Produce Calendar</Text>
          <Text style={styles.headerSubtitle}>
            {filteredCrops.length === 1
              ? '1 crop actively growing'
              : `${filteredCrops.length} crops actively growing`}
          </Text>
        </View>
      </View>

      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Filter Dropdowns Row ── */}
        <View style={styles.filtersRow}>
          <TouchableOpacity
            style={styles.filterButton}
            onPress={() => setShowZonePicker(true)}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel={`Filter by zone, current: ${selectedZone}`}
          >
            <Text style={styles.filterButtonText} numberOfLines={1}>
              {selectedZone}
            </Text>
            <ChevronDownIcon size={16} color={P.twGray500} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.filterButton}
            onPress={() => setShowStatusPicker(true)}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel={`Filter by status, current: ${selectedStatus}`}
          >
            <Text style={styles.filterButtonText} numberOfLines={1}>
              {selectedStatus}
            </Text>
            <ChevronDownIcon size={16} color={P.twGray500} />
          </TouchableOpacity>
        </View>

        {/* ── Section Title ── */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>ACTIVE CROPS</Text>
        </View>

        {/* ── Crop Cards ── */}
        {filteredCrops.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No crops found</Text>
            <Text style={styles.emptySubtitle}>Try changing your zone or status filters.</Text>
          </View>
        ) : (
          <View style={styles.cropList}>
            {filteredCrops.map((crop) => (
              <TouchableOpacity
                key={crop.id}
                style={styles.cropCard}
                activeOpacity={0.85}
                onPress={() => {
                  if (onNavigateToCropDetail) {
                    onNavigateToCropDetail(crop);
                  } else {
                    setSelectedCropDetail(crop);
                  }
                }}
                accessibilityRole="button"
                accessibilityLabel={`${crop.name} ${crop.variety}, ${crop.zone}`}
              >
                {/* Left accent bar */}
                <View style={[styles.cropCardAccent, { backgroundColor: crop.accentColor }]} />

                {/* Card Body */}
                <View style={styles.cropCardBody}>
                  {/* Top info row */}
                  <View style={styles.cardTopRow}>
                    <CropThumbnail cropType={crop.cropType} imageUri={crop.imageUri} />

                    <View style={styles.cropTitleCol}>
                      <Text style={styles.cropName}>
                        {crop.name} — {crop.variety}
                      </Text>
                      <Text style={styles.cropZoneSubtitle}>
                        {crop.zone} · {crop.area}
                      </Text>
                    </View>

                    <ChevronRightIcon size={18} color={P.twGray400} />
                  </View>

                  {/* Badges row */}
                  <View style={styles.badgesRow}>
                    {/* Age badge */}
                    <View style={styles.badgeGray}>
                      <ClockMiniIcon size={12} color={P.twGray600} />
                      <Text style={styles.badgeGrayText}>{crop.daysOld} days old</Text>
                    </View>

                    {/* Status badge */}
                    {crop.statusType === 'ready' ? (
                      <View style={styles.badgeGreen}>
                        <CalendarMiniIcon size={12} color={P.twGreen700} />
                        <Text style={styles.badgeGreenText}>{crop.statusText}</Text>
                      </View>
                    ) : (
                      <View style={styles.badgeGray}>
                        <CalendarMiniIcon size={12} color={P.twGray600} />
                        <Text style={styles.badgeGrayText}>{crop.statusText}</Text>
                      </View>
                    )}

                    {/* Action badge */}
                    {crop.actionType === 'fert' && (
                      <View style={styles.badgeOrange}>
                        <FertLeafIcon size={12} color={P.twOrange700} />
                        <Text style={styles.badgeOrangeText}>{crop.actionText ?? 'Fert due'}</Text>
                      </View>
                    )}

                    {crop.actionType === 'pest' && (
                      <View style={styles.badgePurple}>
                        <BugMiniIcon size={12} color={P.twPurple600} />
                        <Text style={styles.badgePurpleText}>{crop.actionText ?? 'Pest check due'}</Text>
                      </View>
                    )}
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Space for FAB */}
        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* ── Floating Action Button: + New crop ── */}
      <TouchableOpacity
        style={styles.fabButton}
        activeOpacity={0.85}
        onPress={() => {
          if (onNavigateToNewCrop) {
            onNavigateToNewCrop();
          } else {
            setShowNewCropModal(true);
          }
        }}
        accessibilityRole="button"
        accessibilityLabel="Add new crop"
      >
        <PlusIcon size={18} color={P.white} />
        <Text style={styles.fabText}>New crop</Text>
      </TouchableOpacity>

      {/* ── Zone Filter Modal ── */}
      <Modal visible={showZonePicker} transparent animationType="fade">
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => setShowZonePicker(false)}
        >
          <View style={styles.pickerModalContent}>
            <Text style={styles.pickerTitle}>Select Zone</Text>
            {['All zones', 'Zone 1', 'Zone 2', 'Zone 3'].map((zoneOpt) => (
              <TouchableOpacity
                key={zoneOpt}
                style={[
                  styles.pickerOption,
                  selectedZone === zoneOpt && styles.pickerOptionSelected,
                ]}
                onPress={() => {
                  setSelectedZone(zoneOpt);
                  setShowZonePicker(false);
                }}
              >
                <Text
                  style={[
                    styles.pickerOptionText,
                    selectedZone === zoneOpt && styles.pickerOptionTextSelected,
                  ]}
                >
                  {zoneOpt}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* ── Status Filter Modal ── */}
      <Modal visible={showStatusPicker} transparent animationType="fade">
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => setShowStatusPicker(false)}
        >
          <View style={styles.pickerModalContent}>
            <Text style={styles.pickerTitle}>Select Status</Text>
            {['Any status', 'Ready', 'Harvest soon', 'Action due'].map((statusOpt) => (
              <TouchableOpacity
                key={statusOpt}
                style={[
                  styles.pickerOption,
                  selectedStatus === statusOpt && styles.pickerOptionSelected,
                ]}
                onPress={() => {
                  setSelectedStatus(statusOpt);
                  setShowStatusPicker(false);
                }}
              >
                <Text
                  style={[
                    styles.pickerOptionText,
                    selectedStatus === statusOpt && styles.pickerOptionTextSelected,
                  ]}
                >
                  {statusOpt}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* ── Crop Detail Modal ── */}
      <Modal visible={Boolean(selectedCropDetail)} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={styles.detailModalContent}>
            {selectedCropDetail && (
              <>
                <View style={styles.detailHeader}>
                  <CropThumbnail
                    cropType={selectedCropDetail.cropType}
                    imageUri={selectedCropDetail.imageUri}
                  />
                  <View style={styles.detailHeaderInfo}>
                    <Text style={styles.detailTitle}>
                      {selectedCropDetail.name} — {selectedCropDetail.variety}
                    </Text>
                    <Text style={styles.detailSubtitle}>
                      {selectedCropDetail.zone} · {selectedCropDetail.area}
                    </Text>
                  </View>
                </View>

                <View style={styles.detailDivider} />

                <View style={styles.detailStatRow}>
                  <View style={styles.detailStatBox}>
                    <Text style={styles.detailStatLabel}>Crop Age</Text>
                    <Text style={styles.detailStatValue}>{selectedCropDetail.daysOld} days</Text>
                  </View>
                  <View style={styles.detailStatBox}>
                    <Text style={styles.detailStatLabel}>Harvest Window</Text>
                    <Text style={styles.detailStatValue}>{selectedCropDetail.statusText}</Text>
                  </View>
                </View>

                {selectedCropDetail.actionText && (
                  <View style={styles.detailActionBanner}>
                    <Text style={styles.detailActionTitle}>Pending Farm Action</Text>
                    <Text style={styles.detailActionDesc}>
                      {selectedCropDetail.actionText === 'Fert due'
                        ? 'Scheduled organic fertigation with jeevamrutha liquid feed.'
                        : 'Routine preventive pest and foliage health inspection required.'}
                    </Text>
                  </View>
                )}

                <TouchableOpacity
                  style={styles.detailCloseBtn}
                  onPress={() => setSelectedCropDetail(null)}
                >
                  <Text style={styles.detailCloseText}>Close</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* ── New Crop Modal ── */}
      <Modal visible={showNewCropModal} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={styles.newCropModalContent}>
            <Text style={styles.newCropModalTitle}>Plant New Crop</Text>

            <Text style={styles.inputLabel}>Crop Name</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g. Carrot, Tomato, Cabbage"
              placeholderTextColor={P.twGray400}
              value={newCropName}
              onChangeText={setNewCropName}
            />

            <Text style={styles.inputLabel}>Variety</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g. Nantes, Roma, Green Coronet"
              placeholderTextColor={P.twGray400}
              value={newCropVariety}
              onChangeText={setNewCropVariety}
            />

            <Text style={styles.inputLabel}>Zone</Text>
            <View style={styles.zoneSelectorRow}>
              {['Zone 1 — Upper Field', 'Zone 2 — Lower Slope', 'Zone 3 — Terrace'].map((z) => (
                <TouchableOpacity
                  key={z}
                  style={[styles.zoneChip, newCropZone === z && styles.zoneChipSelected]}
                  onPress={() => setNewCropZone(z)}
                >
                  <Text
                    style={[styles.zoneChipText, newCropZone === z && styles.zoneChipTextSelected]}
                  >
                    {(z.split('—')[0] ?? z).trim()}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.rowInputs}>
              <View style={styles.halfCol}>
                <Text style={styles.inputLabel}>Area</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="0.4 ha"
                  placeholderTextColor={P.twGray400}
                  value={newCropArea}
                  onChangeText={setNewCropArea}
                />
              </View>
              <View style={styles.halfCol}>
                <Text style={styles.inputLabel}>Days to Harvest</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="60"
                  keyboardType="numeric"
                  placeholderTextColor={P.twGray400}
                  value={newCropDaysToHarvest}
                  onChangeText={setNewCropDaysToHarvest}
                />
              </View>
            </View>

            <View style={styles.modalBtnRow}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setShowNewCropModal(false)}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleCreateCrop}>
                <Text style={styles.saveBtnText}>Save Crop</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// ─────────────────────────────────────────────
// Stylesheet (No raw hex literals)
// ─────────────────────────────────────────────

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: P.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight ?? 24) + 12 : 12,
    paddingBottom: 16,
    backgroundColor: P.white,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: P.twGray200,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: P.white,
    zIndex: 10,
    elevation: 2,
  },
  headerTitleGroup: {
    marginLeft: 14,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: P.ink,
    letterSpacing: -0.2,
  },
  headerSubtitle: {
    fontSize: 13,
    fontWeight: '500',
    color: P.twGreen700,
    marginTop: 2,
  },
  scrollContainer: {
    flex: 1,
    backgroundColor: P.paleStoneBg,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 40,
  },
  filtersRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  filterButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: P.white,
    borderWidth: 1,
    borderColor: P.twGray200,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: P.twGray800,
  },
  sectionHeader: {
    marginBottom: 12,
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: P.twGray500,
    letterSpacing: 0.8,
  },
  cropList: {
    gap: 14,
  },
  cropCard: {
    flexDirection: 'row',
    backgroundColor: P.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: P.twGray100,
    overflow: 'hidden',
    shadowColor: P.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  cropCardAccent: {
    width: 4.5,
  },
  cropCardBody: {
    flex: 1,
    padding: 14,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  illustrationContainer: {
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  thumbnailImgWrapper: {
    width: 48,
    height: 48,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: P.twGray100,
  },
  thumbnailImg: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  cropTitleCol: {
    flex: 1,
    marginLeft: 12,
  },
  cropName: {
    fontSize: 16,
    fontWeight: '700',
    color: P.ink,
  },
  cropZoneSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    color: P.twGray500,
    marginTop: 3,
  },
  badgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 12,
  },
  badgeGray: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: P.twGray100,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 12,
    gap: 4,
  },
  badgeGrayText: {
    fontSize: 11,
    fontWeight: '600',
    color: P.twGray600,
  },
  badgeGreen: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: P.twEmerald100,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 12,
    gap: 4,
  },
  badgeGreenText: {
    fontSize: 11,
    fontWeight: '700',
    color: P.twGreen800,
  },
  badgeOrange: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: P.twOrange100,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 12,
    gap: 4,
  },
  badgeOrangeText: {
    fontSize: 11,
    fontWeight: '700',
    color: P.twOrange700,
  },
  badgePurple: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: P.twPurple100,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 12,
    gap: 4,
  },
  badgePurpleText: {
    fontSize: 11,
    fontWeight: '700',
    color: P.twPurple600,
  },
  bottomSpacer: {
    height: 80,
  },
  fabButton: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: P.deepGreen,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 24,
    shadowColor: P.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 6,
  },
  fabText: {
    color: P.white,
    fontSize: 15,
    fontWeight: '700',
    marginLeft: 6,
  },
  emptyState: {
    paddingVertical: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: P.twGray700,
  },
  emptySubtitle: {
    fontSize: 13,
    color: P.twGray500,
    marginTop: 4,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  pickerModalContent: {
    backgroundColor: P.white,
    borderRadius: 16,
    width: '85%',
    padding: 16,
    shadowColor: P.black,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 8,
  },
  pickerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: P.ink,
    marginBottom: 12,
  },
  pickerOption: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  pickerOptionSelected: {
    backgroundColor: P.twGreen100,
  },
  pickerOptionText: {
    fontSize: 15,
    color: P.twGray800,
  },
  pickerOptionTextSelected: {
    fontWeight: '700',
    color: P.twGreen900,
  },
  detailModalContent: {
    backgroundColor: P.white,
    borderRadius: 20,
    width: '92%',
    padding: 20,
    shadowColor: P.black,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  detailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailHeaderInfo: {
    flex: 1,
    marginLeft: 14,
  },
  detailTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: P.ink,
  },
  detailSubtitle: {
    fontSize: 13,
    color: P.twGray500,
    marginTop: 3,
  },
  detailDivider: {
    height: 1,
    backgroundColor: P.twGray200,
    marginVertical: 16,
  },
  detailStatRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  detailStatBox: {
    flex: 1,
    backgroundColor: P.twGray50,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: P.twGray200,
  },
  detailStatLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: P.twGray500,
    textTransform: 'uppercase',
  },
  detailStatValue: {
    fontSize: 14,
    fontWeight: '700',
    color: P.ink,
    marginTop: 4,
  },
  detailActionBanner: {
    backgroundColor: P.twAmber50,
    borderWidth: 1,
    borderColor: P.twAmber200,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  detailActionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: P.twAmber900,
  },
  detailActionDesc: {
    fontSize: 12,
    color: P.twAmber800,
    marginTop: 4,
    lineHeight: 17,
  },
  detailCloseBtn: {
    backgroundColor: P.twGreen800,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  detailCloseText: {
    color: P.white,
    fontSize: 15,
    fontWeight: '700',
  },
  newCropModalContent: {
    backgroundColor: P.white,
    borderRadius: 20,
    width: '92%',
    padding: 20,
    shadowColor: P.black,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  newCropModalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: P.ink,
    marginBottom: 14,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: P.twGray700,
    marginBottom: 6,
    marginTop: 8,
  },
  textInput: {
    backgroundColor: P.twGray50,
    borderWidth: 1,
    borderColor: P.twGray300,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: P.twGray900,
  },
  zoneSelectorRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  zoneChip: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: P.twGray200,
    backgroundColor: P.twGray50,
  },
  zoneChipSelected: {
    backgroundColor: P.twGreen100,
    borderColor: P.twGreen500,
  },
  zoneChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: P.twGray600,
  },
  zoneChipTextSelected: {
    color: P.twGreen900,
  },
  rowInputs: {
    flexDirection: 'row',
    gap: 12,
  },
  halfCol: {
    flex: 1,
  },
  modalBtnRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: P.twGray300,
    alignItems: 'center',
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: P.twGray700,
  },
  saveBtn: {
    flex: 1,
    backgroundColor: P.deepGreen,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: P.white,
  },
});
