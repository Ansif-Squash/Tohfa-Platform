import React, { useState } from 'react';
import {
  Alert,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Circle, Line, Path, Rect } from 'react-native-svg';
import { authPalette as P, colors } from '../../theme';

// ── SVG Icons ────────────────────────────────────────────────────────────────

function ArrowBackIcon({ size = 20, color = P.deepGreen }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M19 12H5M5 12L12 19M5 12L12 5"
        stroke={color}
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function PencilEditIcon({ size = 18, color = colors.brandGreen }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function HeaderTagIcon({ size = 18, color = P.twGray600 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle cx="7" cy="7" r="1.5" fill={color} />
    </Svg>
  );
}

function PawPrintIcon({ size = 26, color = P.twAmber800 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="14.5" r="4.5" fill={color} />
      <Circle cx="6.5" cy="10" r="2.2" fill={color} />
      <Circle cx="17.5" cy="10" r="2.2" fill={color} />
      <Circle cx="9.5" cy="6" r="2" fill={color} />
      <Circle cx="14.5" cy="6" r="2" fill={color} />
    </Svg>
  );
}

// ── Tab Bar Icons ────────────────────────────────────────────────────────────

function TabHealthIcon({ size = 16, color = P.white }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="4" y="5" width="7" height="15" rx="1.5" stroke={color} strokeWidth="2" />
      <Line x1="7.5" y1="2" x2="7.5" y2="5" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Rect x="13" y="8" width="7" height="12" rx="1.5" stroke={color} strokeWidth="2" />
      <Line x1="16.5" y1="5" x2="16.5" y2="8" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function TabFeedIcon({ size = 16, color = P.twGray700 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M18 8h1a4 4 0 0 1 0 8h-1M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8zM6 1v3M10 1v3M14 1v3"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function TabBreedingIcon({ size = 16, color = P.twGray700 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function TabProductionIcon({ size = 16, color = P.twGray700 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M23 6l-9.5 9.5-5-5L1 18"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M17 6h6v6" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function TabHousingIcon({ size = 16, color = P.twGray700 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M9 22V12h6v10" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

// ── Health Tab Icons ─────────────────────────────────────────────────────────

function LeafIcon({ size = 18, color = colors.brandGreen }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M2 21c0-3 1.85-5.36 5.08-6" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function ProhibitedCircleIcon({ size = 18, color = P.twRed600 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth="2" />
      <Line x1="5.6" y1="5.6" x2="18.4" y2="18.4" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function VaccineVialsIcon({ size = 18, color = colors.brandGreen }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="4" y="7" width="6" height="13" rx="1.5" stroke={color} strokeWidth="2" />
      <Line x1="7" y1="3" x2="7" y2="7" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Rect x="14" y="9" width="6" height="11" rx="1.5" stroke={color} strokeWidth="2" />
      <Line x1="17" y1="5" x2="17" y2="9" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="4" y1="12" x2="10" y2="12" stroke={color} strokeWidth="1.5" />
      <Line x1="14" y1="14" x2="20" y2="14" stroke={color} strokeWidth="1.5" />
    </Svg>
  );
}

function DewormingBottleIcon({ size = 18, color = colors.brandGreen }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="5" y="6" width="14" height="15" rx="3" stroke={color} strokeWidth="2" />
      <Rect x="8" y="2" width="8" height="4" rx="1" stroke={color} strokeWidth="2" />
      <Line x1="12" y1="10" x2="12" y2="16" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="9" y1="13" x2="15" y2="13" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function StethoscopeIcon({ size = 20, color = P.twBlue700 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4.5 3v5a5.5 5.5 0 0 0 11 0V3"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M10 13.5v3.5a3 3 0 0 0 6 0V15"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle cx="16" cy="13" r="2" stroke={color} strokeWidth="2" />
      <Path d="M3 3h3M14 3h3" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

// ── Feed Tab Icons ───────────────────────────────────────────────────────────

function SproutFodderIcon({ size = 18, color = P.twAmber800 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M12 21V10" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Path d="M12 10a5 5 0 0 0-5-5M12 10a5 5 0 0 1 5-5" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="4" y1="21" x2="20" y2="21" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function ConcentrateMeshIcon({ size = 18, color = P.twAmber800 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="8" cy="8" r="1.5" fill={color} />
      <Circle cx="12" cy="8" r="1.5" fill={color} />
      <Circle cx="16" cy="8" r="1.5" fill={color} />
      <Circle cx="8" cy="12" r="1.5" fill={color} />
      <Circle cx="12" cy="12" r="1.5" fill={color} />
      <Circle cx="16" cy="12" r="1.5" fill={color} />
      <Circle cx="8" cy="16" r="1.5" fill={color} />
      <Circle cx="12" cy="16" r="1.5" fill={color} />
      <Circle cx="16" cy="16" r="1.5" fill={color} />
    </Svg>
  );
}

function LinkChainIcon({ size = 13, color = P.twBlue600 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"
        stroke={color}
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      <Path
        d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"
        stroke={color}
        strokeWidth="2.4"
        strokeLinecap="round"
      />
    </Svg>
  );
}

// ── Breeding Tab Icons ───────────────────────────────────────────────────────

function CalfCowIcon({ size = 18, color = P.twAmber800 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M7 5l2 3h6l2-3M6 9a6 6 0 0 0 12 0V8H6v1zM9 13h.01M15 13h.01M10 17h4"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function PlusCircleGreenIcon({ size = 17, color = colors.brandGreen }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth="2" />
      <Path d="M12 8v8M8 12h8" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

// ── Production Tab Icons ─────────────────────────────────────────────────────

function MilkDropletIcon({ size = 18, color = P.twBlue600 }: { size?: number; color?: string }) {
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

// ── Housing Tab Icons ────────────────────────────────────────────────────────

function BarnOutlineIcon({ size = 18, color = P.twAmber800 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M3 10l9-7 9 7v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V10z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M9 22V13h6v9" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function ShieldCheckBadgeIcon({ size = 20 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 2l2.4 2 3.1-.3 1.2 2.9 3 1-.5 3.1 1.8 2.6-2 2.4.3 3.1-2.9 1.2-1 3-3.1-.5-2.6 1.8-2.4-2-3.1.3-1.2-2.9-3-1 .5-3.1-1.8-2.6 2-2.4-.3-3.1 2.9-1.2 1-3 3.1.5L12 2z"
        stroke={colors.brandGreen}
        strokeWidth="1.8"
      />
      <Path d="M8.5 12l2.5 2.5 5-5" stroke={colors.brandGreen} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function BroomCleaningIcon({ size = 17, color = colors.brandGreen }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M12 3v10M7 17l5-4 5 4M6 21h12M5 18l1.5 3M19 18l-1.5 3" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

// ── Types ────────────────────────────────────────────────────────────────────

export interface AnimalDetailProps {
  animalId?: string;
  animalName?: string;
  animalCode?: string;
  species?: string;
  breed?: string;
  gender?: string;
  age?: string;
  statusBadge?: string;
  onBack?: () => void;
  onNavigateToEdit?: (animalData: any) => void;
  onNavigateToSale?: () => void;
  onNavigateToRegisterOffspring?: () => void;
}

type TabKey = 'Health' | 'Feed' | 'Breeding' | 'Production' | 'Housing';

export function AnimalDetailScreen({
  animalId = 'a1',
  animalName = 'Lakshmi',
  animalCode = 'C-014',
  species = 'Cattle',
  breed = 'Jersey cross',
  gender = '♀',
  age = '4 yr',
  statusBadge = 'Fully Organic',
  onBack,
  onNavigateToEdit,
  onNavigateToSale,
  onNavigateToRegisterOffspring,
}: AnimalDetailProps): React.JSX.Element {
  const [activeTab, setActiveTab] = useState<TabKey>('Health');

  const handleEdit = () => {
    if (onNavigateToEdit) {
      onNavigateToEdit({
        id: animalId,
        tag: animalCode,
        name: animalName,
        species,
        breed,
        gender: gender === '♀' ? 'Female' : 'Male',
        dob: '02 Mar 2022',
        source: 'purchased',
        purchaseDate: '10 Jul 2022',
        sourceFarm: 'Coonoor Dairy',
        organicStatus: statusBadge === 'Fully Organic' ? 'Organic' : 'Transitioning',
      });
    } else {
      Alert.alert('Edit Animal', `Editing profile for ${animalName} (${animalCode})`);
    }
  };

  const handleMoreOptions = () => {
    if (onNavigateToSale) {
      onNavigateToSale();
    } else {
      Alert.alert('Animal Options', `Options for ${animalName} (${animalCode})`, [
        { text: 'Edit Profile', onPress: handleEdit },
        { text: 'Cancel', style: 'cancel' },
      ]);
    }
  };

  const handleRegisterOffspring = () => {
    if (onNavigateToRegisterOffspring) {
      onNavigateToRegisterOffspring();
    } else if (onNavigateToEdit) {
      onNavigateToEdit({
        species,
        breed: `${breed} offspring`,
        gender: 'Female',
        dob: '14 Mar 2025',
        source: 'born_on_farm',
        organicStatus: 'Organic',
      });
    } else {
      Alert.alert('Register Offspring', 'Opening registration form for newborn calf.');
    }
  };

  // Compute slider thumb offset
  const getSliderThumbStyle = () => {
    switch (activeTab) {
      case 'Health':
        return { alignSelf: 'flex-start' as const };
      case 'Feed':
        return { alignSelf: 'center' as const, transform: [{ translateX: -20 }] };
      case 'Breeding':
        return { alignSelf: 'center' as const };
      case 'Production':
        return { alignSelf: 'center' as const, transform: [{ translateX: 20 }] };
      case 'Housing':
        return { alignSelf: 'flex-end' as const };
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={P.white} />
      <View style={styles.container}>
        {/* ── Top Header Bar ── */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.circleHeaderBtn}
            onPress={onBack}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Back"
          >
            <ArrowBackIcon size={20} color={P.deepGreen} />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>{animalName}</Text>

          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.circleHeaderBtn}
              onPress={handleEdit}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Edit animal"
            >
              <PencilEditIcon size={18} color={colors.brandGreen} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.circleHeaderBtn}
              onPress={onNavigateToSale || handleMoreOptions}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Sale / Transfer / Cull"
            >
              <HeaderTagIcon size={18} color={P.twGray600} />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* ── Animal Profile Header Card ── */}
          <View style={styles.profileCard}>
            <View style={styles.avatarContainer}>
              <View style={styles.avatarCircle}>
                <PawPrintIcon size={26} color={P.twAmber800} />
              </View>
              <View style={styles.alertBadgeDot} />
            </View>

            <View style={styles.profileInfoCol}>
              <Text style={styles.profileCode}>{animalCode}</Text>
              <Text style={styles.profileSubtitle}>
                {species} · {breed} · {gender} · {age}
              </Text>
            </View>

            <View style={styles.statusBadgePill}>
              <Text style={styles.statusBadgeText}>{statusBadge}</Text>
            </View>
          </View>

          {/* ── Horizontal Navigation Tabs ── */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tabScrollContent}
            style={styles.tabScrollView}
          >
            {/* Health Tab */}
            <TouchableOpacity
              style={[styles.tabButton, activeTab === 'Health' && styles.tabButtonActive]}
              onPress={() => setActiveTab('Health')}
              activeOpacity={0.8}
            >
              <TabHealthIcon size={16} color={activeTab === 'Health' ? P.white : P.twGray700} />
              <Text style={[styles.tabButtonText, activeTab === 'Health' && styles.tabButtonTextActive]}>
                Health
              </Text>
            </TouchableOpacity>

            {/* Feed Tab */}
            <TouchableOpacity
              style={[styles.tabButton, activeTab === 'Feed' && styles.tabButtonActive]}
              onPress={() => setActiveTab('Feed')}
              activeOpacity={0.8}
            >
              <TabFeedIcon size={16} color={activeTab === 'Feed' ? P.white : P.twGray700} />
              <Text style={[styles.tabButtonText, activeTab === 'Feed' && styles.tabButtonTextActive]}>
                Feed
              </Text>
            </TouchableOpacity>

            {/* Breeding Tab */}
            <TouchableOpacity
              style={[styles.tabButton, activeTab === 'Breeding' && styles.tabButtonActive]}
              onPress={() => setActiveTab('Breeding')}
              activeOpacity={0.8}
            >
              <TabBreedingIcon size={16} color={activeTab === 'Breeding' ? P.white : P.twGray700} />
              <Text
                style={[styles.tabButtonText, activeTab === 'Breeding' && styles.tabButtonTextActive]}
              >
                Breeding
              </Text>
            </TouchableOpacity>

            {/* Production Tab */}
            <TouchableOpacity
              style={[styles.tabButton, activeTab === 'Production' && styles.tabButtonActive]}
              onPress={() => setActiveTab('Production')}
              activeOpacity={0.8}
            >
              <TabProductionIcon
                size={16}
                color={activeTab === 'Production' ? P.white : P.twGray700}
              />
              <Text
                style={[styles.tabButtonText, activeTab === 'Production' && styles.tabButtonTextActive]}
              >
                Production
              </Text>
            </TouchableOpacity>

            {/* Housing Tab */}
            <TouchableOpacity
              style={[styles.tabButton, activeTab === 'Housing' && styles.tabButtonActive]}
              onPress={() => setActiveTab('Housing')}
              activeOpacity={0.8}
            >
              <TabHousingIcon size={16} color={activeTab === 'Housing' ? P.white : P.twGray700} />
              <Text
                style={[styles.tabButtonText, activeTab === 'Housing' && styles.tabButtonTextActive]}
              >
                Housing
              </Text>
            </TouchableOpacity>
          </ScrollView>

          {/* Carousel / Tab position scroll indicator */}
          <View style={styles.scrollIndicatorRow}>
            <View style={styles.arrowTriangleLeft} />
            <View style={styles.sliderTrack}>
              <View style={[styles.sliderThumb, getSliderThumbStyle()]} />
            </View>
            <View style={styles.arrowTriangleRight} />
          </View>

          {/* ══════════════════════════════════════════════════════════════════ */}
          {/* TAB 1: HEALTH                                                      */}
          {/* ══════════════════════════════════════════════════════════════════ */}
          {activeTab === 'Health' && (
            <View style={styles.tabContentContainer}>
              {/* Notice 1: Organic Standard */}
              <View style={styles.organicNoticeCard}>
                <View style={styles.organicNoticeIconCol}>
                  <LeafIcon size={18} color={colors.brandGreen} />
                </View>
                <Text style={styles.organicNoticeText}>
                  Organic standard — only herbal & homeopathic treatments permitted. Antibiotics are
                  restricted.
                </Text>
              </View>

              {/* Notice 2: Milk not sellable withdrawal alert */}
              <View style={styles.withdrawalAlertCard}>
                <View style={styles.withdrawalLeftAccentBar} />
                <View style={styles.withdrawalCardInner}>
                  <View style={styles.withdrawalHeaderRow}>
                    <ProhibitedCircleIcon size={19} color={P.twOrange700} />
                    <Text style={styles.withdrawalTitle}>Milk not sellable — withdrawal active</Text>
                  </View>
                  <Text style={styles.withdrawalBody}>
                    Herbal mastitis treatment 12 Jul. Clears{' '}
                    <Text style={styles.boldText}>22 Jul</Text> · 6 days left.
                  </Text>
                </View>
              </View>

              {/* Section: VACCINATIONS */}
              <Text style={styles.sectionHeaderTitle}>VACCINATIONS</Text>
              <View style={styles.whiteCardContainer}>
                {/* Vaccine Item 1 */}
                <View style={styles.itemRow}>
                  <View style={styles.greenIconSquare}>
                    <VaccineVialsIcon size={17} color={colors.brandGreen} />
                  </View>
                  <View style={styles.itemMainCol}>
                    <Text style={styles.itemTitle}>FMD vaccine</Text>
                    <Text style={styles.itemSubtitle}>Given 10 Apr</Text>
                  </View>
                  <View style={styles.dueDateBadge}>
                    <Text style={styles.dueDateBadgeText}>Next 10 Oct</Text>
                  </View>
                </View>

                <View style={styles.dividerLine} />

                {/* Vaccine Item 2 */}
                <View style={styles.itemRow}>
                  <View style={styles.greenIconSquare}>
                    <VaccineVialsIcon size={17} color={colors.brandGreen} />
                  </View>
                  <View style={styles.itemMainCol}>
                    <Text style={styles.itemTitle}>HS vaccine</Text>
                    <Text style={styles.itemSubtitle}>Given 02 Feb</Text>
                  </View>
                  <View style={styles.dueDateBadge}>
                    <Text style={styles.dueDateBadgeText}>Next 02 Aug</Text>
                  </View>
                </View>
              </View>

              {/* Section: DEWORMING */}
              <Text style={styles.sectionHeaderTitle}>DEWORMING</Text>
              <View style={styles.whiteCardContainer}>
                <View style={styles.itemRow}>
                  <View style={styles.greenIconSquare}>
                    <DewormingBottleIcon size={17} color={colors.brandGreen} />
                  </View>
                  <View style={styles.itemMainCol}>
                    <Text style={styles.itemTitle}>Deworming dose</Text>
                    <Text style={styles.itemSubtitle}>Given 01 Jul</Text>
                  </View>
                  <View style={styles.dueDateBadge}>
                    <Text style={styles.dueDateBadgeText}>Next 01 Oct</Text>
                  </View>
                </View>
              </View>

              {/* Section: CHECKUP & TREATMENT */}
              <Text style={styles.sectionHeaderTitle}>CHECKUP & TREATMENT</Text>
              <View style={styles.whiteCardContainer}>
                <View style={styles.checkupCardContent}>
                  <View style={styles.checkupHeaderRow}>
                    <View style={styles.checkupTitleWithIcon}>
                      <StethoscopeIcon size={18} color={P.twBlue700} />
                      <Text style={styles.checkupTitle}>Checkup · 12 Jul</Text>
                    </View>
                    <Text style={styles.checkupDoctor}>Dr. Anand</Text>
                  </View>
                  <Text style={styles.checkupDescription}>
                    Sub-clinical mastitis, left quarter. Advised herbal treatment.
                  </Text>
                </View>
              </View>
            </View>
          )}

          {/* ══════════════════════════════════════════════════════════════════ */}
          {/* TAB 2: FEED                                                        */}
          {/* ══════════════════════════════════════════════════════════════════ */}
          {activeTab === 'Feed' && (
            <View style={styles.tabContentContainer}>
              {/* Section: FEED REFERENCE */}
              <Text style={styles.sectionHeaderTitle}>FEED REFERENCE</Text>
              <View style={styles.whiteCardContainer}>
                {/* Feed type */}
                <View style={styles.tableRow}>
                  <Text style={styles.tableLabel}>Feed type</Text>
                  <Text style={styles.tableValueBold}>Organic fodder + concentrate</Text>
                </View>
                <View style={styles.dividerLine} />

                {/* Source */}
                <View style={styles.tableRow}>
                  <Text style={styles.tableLabel}>Source</Text>
                  <Text style={styles.tableValueBold}>Own-farm grown</Text>
                </View>
                <View style={styles.dividerLine} />

                {/* Grazing */}
                <View style={styles.tableRow}>
                  <Text style={styles.tableLabel}>Grazing</Text>
                  <Text style={styles.tableValueBold}>Upper paddock · 5 h/day</Text>
                </View>
                <View style={styles.dividerLine} />

                {/* Water source */}
                <View style={styles.tableRow}>
                  <Text style={styles.tableLabel}>Water source</Text>
                  <View style={styles.waterSourceValRow}>
                    <Text style={styles.tableValueBold}>Borewell</Text>
                    <LinkChainIcon size={14} color={P.twBlue600} />
                  </View>
                </View>
              </View>

              {/* Water source helper caption */}
              <Text style={styles.footnoteCaption}>
                Water source read from Field Context (Screen 18) — not re-entered here.
              </Text>

              {/* Section: DAILY FEED LOG */}
              <Text style={styles.sectionHeaderTitle}>DAILY FEED LOG</Text>
              <View style={styles.whiteCardContainer}>
                {/* Log 1 */}
                <View style={styles.itemRow}>
                  <View style={styles.tanIconSquare}>
                    <SproutFodderIcon size={18} color={P.twAmber800} />
                  </View>
                  <View style={styles.itemMainCol}>
                    <Text style={styles.itemTitle}>Green fodder</Text>
                    <Text style={styles.itemSubtitle}>16 Jul</Text>
                  </View>
                  <Text style={styles.itemAmountBold}>18 kg</Text>
                </View>

                <View style={styles.dividerLine} />

                {/* Log 2 */}
                <View style={styles.itemRow}>
                  <View style={styles.tanIconSquare}>
                    <ConcentrateMeshIcon size={18} color={P.twAmber800} />
                  </View>
                  <View style={styles.itemMainCol}>
                    <Text style={styles.itemTitle}>Concentrate mix</Text>
                    <Text style={styles.itemSubtitle}>15 Jul</Text>
                  </View>
                  <Text style={styles.itemAmountBold}>3 kg</Text>
                </View>

                <View style={styles.dividerLine} />

                {/* Log 3 */}
                <View style={styles.itemRow}>
                  <View style={styles.tanIconSquare}>
                    <SproutFodderIcon size={18} color={P.twAmber800} />
                  </View>
                  <View style={styles.itemMainCol}>
                    <Text style={styles.itemTitle}>Green fodder</Text>
                    <Text style={styles.itemSubtitle}>14 Jul</Text>
                  </View>
                  <Text style={styles.itemAmountBold}>17 kg</Text>
                </View>
              </View>
            </View>
          )}

          {/* ══════════════════════════════════════════════════════════════════ */}
          {/* TAB 3: BREEDING                                                    */}
          {/* ══════════════════════════════════════════════════════════════════ */}
          {activeTab === 'Breeding' && (
            <View style={styles.tabContentContainer}>
              {/* Section: CURRENT CYCLE */}
              <Text style={styles.sectionHeaderTitle}>CURRENT CYCLE</Text>
              <View style={styles.whiteCardContainer}>
                <View style={styles.cycleTopRow}>
                  <View style={styles.pregnantBadgePill}>
                    <Text style={styles.pregnantBadgeText}>Confirmed pregnant</Text>
                  </View>
                  <Text style={styles.cycleCountText}>Cycle 3</Text>
                </View>

                <View style={styles.cycleGridRow}>
                  {/* Left column: Bred */}
                  <View style={styles.cycleGridCol}>
                    <Text style={styles.cycleGridLabel}>Bred</Text>
                    <Text style={styles.cycleGridValBold}>12 Feb</Text>
                    <Text style={styles.cycleGridSubtext}>AI</Text>
                  </View>

                  {/* Right column: Expected delivery */}
                  <View style={styles.cycleGridCol}>
                    <Text style={styles.cycleGridLabel}>Expected delivery</Text>
                    <Text style={styles.cycleGridValBold}>20 Nov 2026</Text>
                    <Text style={styles.cycleGridCountdown}>≈ 4 months away</Text>
                  </View>
                </View>
              </View>

              {/* Section: CALVING HISTORY */}
              <Text style={styles.sectionHeaderTitle}>CALVING HISTORY</Text>
              <View style={styles.whiteCardContainer}>
                <View style={styles.calvingHeaderRow}>
                  <CalfCowIcon size={19} color={P.twAmber800} />
                  <Text style={styles.calvingTitle}>Delivered · 14 Mar 2025</Text>
                </View>

                <Text style={styles.calvingDescription}>
                  Female calf — not yet registered as an animal.
                </Text>

                <TouchableOpacity
                  style={styles.registerOffspringBtn}
                  onPress={handleRegisterOffspring}
                  activeOpacity={0.8}
                >
                  <PlusCircleGreenIcon size={18} color={colors.brandGreen} />
                  <Text style={styles.registerOffspringBtnText}>Register offspring</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* ══════════════════════════════════════════════════════════════════ */}
          {/* TAB 4: PRODUCTION                                                  */}
          {/* ══════════════════════════════════════════════════════════════════ */}
          {activeTab === 'Production' && (
            <View style={styles.tabContentContainer}>
              {/* Milk Yield Summary Card */}
              <View style={styles.whiteCardContainer}>
                <View style={styles.yieldSummaryHeader}>
                  <Text style={styles.yieldSummaryLabel}>Milk yield · today</Text>
                  <View style={styles.gradeBadgePill}>
                    <Text style={styles.gradeBadgeText}>Grade A · 4.1% fat</Text>
                  </View>
                </View>

                <View style={styles.yieldNumberRow}>
                  <Text style={styles.yieldBigNumber}>11.6</Text>
                  <Text style={styles.yieldUnitText}>L</Text>
                </View>

                {/* Sparkline Chart */}
                <View style={styles.sparklineContainer}>
                  <Svg width="100%" height={36} viewBox="0 0 260 36">
                    <Path
                      d="M 10 24 Q 45 18, 80 20 T 140 13 T 200 11 T 250 15"
                      fill="none"
                      stroke={colors.brandGreen}
                      strokeWidth="2.4"
                      strokeLinecap="round"
                    />
                  </Svg>
                </View>

                <Text style={styles.last7DaysText}>Last 7 days</Text>
              </View>

              {/* Withdrawal Warning Alert */}
              <View style={styles.productionAlertCard}>
                <ProhibitedCircleIcon size={17} color={P.twOrange700} />
                <Text style={styles.productionAlertText}>
                  Under withdrawal — not for sale until 22 Jul.
                </Text>
              </View>

              {/* Section: DAILY YIELD LOG */}
              <Text style={styles.sectionHeaderTitle}>DAILY YIELD LOG</Text>
              <View style={styles.whiteCardContainer}>
                {/* 16 Jul */}
                <View style={styles.itemRow}>
                  <View style={styles.blueIconSquare}>
                    <MilkDropletIcon size={17} color={P.twBlue600} />
                  </View>
                  <View style={styles.itemMainCol}>
                    <Text style={styles.itemTitle}>16 Jul · AM 6.2 · PM 5.4</Text>
                    <Text style={styles.itemSubtitle}>Fat 4.1% · Grade A</Text>
                  </View>
                  <Text style={styles.itemAmountBold}>11.6 L</Text>
                </View>

                <View style={styles.dividerLine} />

                {/* 15 Jul */}
                <View style={styles.itemRow}>
                  <View style={styles.blueIconSquare}>
                    <MilkDropletIcon size={17} color={P.twBlue600} />
                  </View>
                  <View style={styles.itemMainCol}>
                    <Text style={styles.itemTitle}>15 Jul · AM 6.4 · PM 5.6</Text>
                    <Text style={styles.itemSubtitle}>Fat 4.0% · Grade A</Text>
                  </View>
                  <Text style={styles.itemAmountBold}>12.0 L</Text>
                </View>

                <View style={styles.dividerLine} />

                {/* 14 Jul */}
                <View style={styles.itemRow}>
                  <View style={styles.blueIconSquare}>
                    <MilkDropletIcon size={17} color={P.twBlue600} />
                  </View>
                  <View style={styles.itemMainCol}>
                    <Text style={styles.itemTitle}>14 Jul · AM 6.0 · PM 5.3</Text>
                    <Text style={styles.itemSubtitle}>Fat 4.2% · Grade A</Text>
                  </View>
                  <Text style={styles.itemAmountBold}>11.3 L</Text>
                </View>
              </View>
            </View>
          )}

          {/* ══════════════════════════════════════════════════════════════════ */}
          {/* TAB 5: HOUSING                                                     */}
          {/* ══════════════════════════════════════════════════════════════════ */}
          {activeTab === 'Housing' && (
            <View style={styles.tabContentContainer}>
              {/* Section: HOUSING */}
              <Text style={styles.sectionHeaderTitle}>HOUSING</Text>
              <View style={styles.whiteCardContainer}>
                <View style={styles.housingHeaderRow}>
                  <BarnOutlineIcon size={18} color={P.twAmber800} />
                  <Text style={styles.housingHeaderTitle}>Barn (night) + grazing (day)</Text>
                </View>

                {/* 2 Stat metric boxes */}
                <View style={styles.housingBoxesRow}>
                  <View style={styles.housingMetricBox}>
                    <View style={styles.metricValRow}>
                      <Text style={styles.metricValNumber}>12</Text>
                      <Text style={styles.metricValUnit}>sq.ft</Text>
                    </View>
                    <Text style={styles.metricValLabel}>Per animal</Text>
                  </View>

                  <View style={styles.housingMetricBox}>
                    <View style={styles.metricValRow}>
                      <Text style={styles.metricValNumber}>≥ 11</Text>
                      <Text style={styles.metricValUnit}>sq.ft</Text>
                    </View>
                    <Text style={styles.metricValLabel}>NPOP minimum</Text>
                  </View>
                </View>
              </View>

              {/* Welfare standards compliance banner */}
              <View style={styles.welfareNoticeCard}>
                <ShieldCheckBadgeIcon size={20} />
                <View style={styles.welfareNoticeCol}>
                  <Text style={styles.welfareNoticeTitle}>Meets welfare & space standards</Text>
                  <Text style={styles.welfareNoticeSubtitle}>Above NPOP organic minimum for cattle.</Text>
                </View>
              </View>

              {/* Section: HYGIENE LOG */}
              <Text style={styles.sectionHeaderTitle}>HYGIENE LOG</Text>
              <View style={styles.whiteCardContainer}>
                <View style={styles.itemRow}>
                  <View style={styles.greenIconSquare}>
                    <BroomCleaningIcon size={17} color={colors.brandGreen} />
                  </View>
                  <View style={styles.itemMainCol}>
                    <Text style={styles.itemTitle}>Bedding replaced</Text>
                    <Text style={styles.itemSubtitle}>16 Jul</Text>
                  </View>
                </View>

                <View style={styles.dividerLine} />

                <View style={styles.itemRow}>
                  <View style={styles.greenIconSquare}>
                    <BroomCleaningIcon size={17} color={colors.brandGreen} />
                  </View>
                  <View style={styles.itemMainCol}>
                    <Text style={styles.itemTitle}>Barn washed</Text>
                    <Text style={styles.itemSubtitle}>14 Jul</Text>
                  </View>
                </View>
              </View>
            </View>
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: P.white,
  },
  container: {
    flex: 1,
    backgroundColor: P.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: P.twGray100,
    backgroundColor: P.white,
  },
  circleHeaderBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: P.twGray200,
    backgroundColor: P.white,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: P.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: P.nearBlack,
    letterSpacing: -0.2,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
  },

  // Profile Header Card
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 14,
  },
  avatarCircle: {
    width: 58,
    height: 58,
    borderRadius: 16,
    backgroundColor: P.paleCreamBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  alertBadgeDot: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: P.twOrange600,
    borderWidth: 2,
    borderColor: P.white,
  },
  profileInfoCol: {
    flex: 1,
  },
  profileCode: {
    fontSize: 15,
    fontWeight: '700',
    color: P.twGray700,
    marginBottom: 2,
  },
  profileSubtitle: {
    fontSize: 13,
    color: P.twGray500,
  },
  statusBadgePill: {
    backgroundColor: colors.brandGreenLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.brandGreen,
  },

  // Horizontal Tabs
  tabScrollView: {
    marginBottom: 10,
  },
  tabScrollContent: {
    gap: 8,
    paddingVertical: 2,
  },
  tabButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: P.twGray100,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  tabButtonActive: {
    backgroundColor: colors.brandGreen,
  },
  tabButtonText: {
    fontSize: 13.5,
    fontWeight: '600',
    color: P.twGray700,
  },
  tabButtonTextActive: {
    color: P.white,
  },

  // Scroll Indicator Bar
  scrollIndicatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginBottom: 16,
  },
  arrowTriangleLeft: {
    width: 0,
    height: 0,
    borderTopWidth: 4,
    borderBottomWidth: 4,
    borderRightWidth: 6,
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
    borderRightColor: P.twGray400,
  },
  arrowTriangleRight: {
    width: 0,
    height: 0,
    borderTopWidth: 4,
    borderBottomWidth: 4,
    borderLeftWidth: 6,
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
    borderLeftColor: P.twGray400,
  },
  sliderTrack: {
    width: 140,
    height: 6,
    borderRadius: 3,
    backgroundColor: P.twGray200,
    overflow: 'hidden',
  },
  sliderThumb: {
    width: 80,
    height: 6,
    borderRadius: 3,
    backgroundColor: P.twGray500,
  },

  // Generic Containers
  tabContentContainer: {
    gap: 12,
  },
  sectionHeaderTitle: {
    fontSize: 11.5,
    fontWeight: '700',
    color: P.twGray500,
    letterSpacing: 0.8,
    marginTop: 8,
  },
  whiteCardContainer: {
    backgroundColor: P.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: P.twGray200,
    paddingHorizontal: 16,
    paddingVertical: 14,
    shadowColor: P.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 3,
    elevation: 1,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
  },
  greenIconSquare: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: colors.brandGreenLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  tanIconSquare: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: P.paleCreamBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  blueIconSquare: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: P.blue50,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  itemMainCol: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 14.5,
    fontWeight: '700',
    color: P.nearBlack,
  },
  itemSubtitle: {
    fontSize: 12,
    color: P.twGray500,
    marginTop: 2,
  },
  itemAmountBold: {
    fontSize: 14.5,
    fontWeight: '700',
    color: P.nearBlack,
  },
  dueDateBadge: {
    backgroundColor: P.twGray100,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  dueDateBadgeText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: P.twGray600,
  },
  dividerLine: {
    height: 1,
    backgroundColor: P.twGray100,
    marginVertical: 8,
  },

  // ── Health Styles ──
  organicNoticeCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: P.sageTintBg,
    borderRadius: 14,
    padding: 14,
    gap: 10,
    borderWidth: 1,
    borderColor: P.sageBorder,
  },
  organicNoticeIconCol: {
    marginTop: 1,
  },
  organicNoticeText: {
    flex: 1,
    fontSize: 12.5,
    lineHeight: 18,
    color: P.twGray700,
    fontWeight: '500',
  },
  withdrawalAlertCard: {
    flexDirection: 'row',
    backgroundColor: P.twOrange50,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: P.twOrange200,
  },
  withdrawalLeftAccentBar: {
    width: 4,
    backgroundColor: P.twOrange600,
  },
  withdrawalCardInner: {
    flex: 1,
    padding: 14,
    gap: 4,
  },
  withdrawalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  withdrawalTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    color: P.twOrange700,
  },
  withdrawalBody: {
    fontSize: 12.5,
    color: P.twGray600,
    lineHeight: 18,
    paddingLeft: 27,
  },
  boldText: {
    fontWeight: '700',
    color: P.nearBlack,
  },
  checkupCardContent: {
    paddingVertical: 4,
    gap: 6,
  },
  checkupHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  checkupTitleWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  checkupTitle: {
    fontSize: 14.5,
    fontWeight: '700',
    color: P.nearBlack,
  },
  checkupDoctor: {
    fontSize: 12,
    color: P.twGray400,
  },
  checkupDescription: {
    fontSize: 12.5,
    color: P.twGray600,
    lineHeight: 18,
    marginTop: 2,
  },

  // ── Feed Styles ──
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  tableLabel: {
    fontSize: 13.5,
    color: P.twGray500,
  },
  tableValueBold: {
    fontSize: 13.5,
    fontWeight: '700',
    color: P.nearBlack,
  },
  waterSourceValRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  footnoteCaption: {
    fontSize: 11.5,
    color: P.twGray400,
    lineHeight: 16,
    paddingHorizontal: 4,
    marginTop: -2,
  },

  // ── Breeding Styles ──
  cycleTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  pregnantBadgePill: {
    backgroundColor: colors.brandGreenLight,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
  },
  pregnantBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.brandGreen,
  },
  cycleCountText: {
    fontSize: 12.5,
    color: P.twGray500,
    fontWeight: '500',
  },
  cycleGridRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cycleGridCol: {
    flex: 1,
    gap: 2,
  },
  cycleGridLabel: {
    fontSize: 12,
    color: P.twGray500,
  },
  cycleGridValBold: {
    fontSize: 15,
    fontWeight: '700',
    color: P.nearBlack,
    marginTop: 2,
  },
  cycleGridSubtext: {
    fontSize: 12,
    color: P.twGray400,
  },
  cycleGridCountdown: {
    fontSize: 12,
    color: colors.brandGreen,
    fontWeight: '600',
  },
  calvingHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  calvingTitle: {
    fontSize: 14.5,
    fontWeight: '700',
    color: P.nearBlack,
  },
  calvingDescription: {
    fontSize: 12.5,
    color: P.twGray500,
    marginBottom: 14,
  },
  registerOffspringBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1.5,
    borderColor: colors.brandGreen,
    borderRadius: 12,
    paddingVertical: 11,
    backgroundColor: P.white,
  },
  registerOffspringBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.brandGreen,
  },

  // ── Production Styles ──
  yieldSummaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  yieldSummaryLabel: {
    fontSize: 12.5,
    color: P.twGray500,
  },
  gradeBadgePill: {
    backgroundColor: colors.brandGreenLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  gradeBadgeText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: colors.brandGreen,
  },
  yieldNumberRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
    marginBottom: 8,
  },
  yieldBigNumber: {
    fontSize: 28,
    fontWeight: '700',
    color: P.nearBlack,
  },
  yieldUnitText: {
    fontSize: 16,
    fontWeight: '600',
    color: P.twGray500,
  },
  sparklineContainer: {
    height: 36,
    marginVertical: 4,
  },
  last7DaysText: {
    fontSize: 11.5,
    color: P.twGray400,
    marginTop: 4,
  },
  productionAlertCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: P.twOrange50,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: P.twOrange200,
  },
  productionAlertText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: P.twOrange700,
  },

  // ── Housing Styles ──
  housingHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  housingHeaderTitle: {
    fontSize: 14.5,
    fontWeight: '700',
    color: P.nearBlack,
  },
  housingBoxesRow: {
    flexDirection: 'row',
    gap: 12,
  },
  housingMetricBox: {
    flex: 1,
    backgroundColor: P.twGray50,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: P.twGray100,
  },
  metricValRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  metricValNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: P.nearBlack,
  },
  metricValUnit: {
    fontSize: 12,
    color: P.twGray500,
    fontWeight: '500',
  },
  metricValLabel: {
    fontSize: 11.5,
    color: P.twGray400,
    marginTop: 4,
  },
  welfareNoticeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: P.sageTintBg,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: P.sageBorder,
  },
  welfareNoticeCol: {
    flex: 1,
    gap: 2,
  },
  welfareNoticeTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.brandGreen,
  },
  welfareNoticeSubtitle: {
    fontSize: 12,
    color: P.twGray500,
  },
});
