import React, { useState } from 'react';
import {
  Alert,
  Modal,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
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

function ChevronDownIcon({ size = 16, color = P.twGray500 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M6 9l6 6 6-6" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function PawPrintIcon({ size = 22, color = P.brown400 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="7.5" cy="8.5" r="2" fill={color} />
      <Circle cx="16.5" cy="8.5" r="2" fill={color} />
      <Circle cx="12" cy="5.5" r="2" fill={color} />
      <Circle cx="12" cy="14.5" r="4" fill={color} />
      <Circle cx="6.5" cy="13" r="1.5" fill={color} />
      <Circle cx="17.5" cy="13" r="1.5" fill={color} />
    </Svg>
  );
}

function EggPoultryIcon({ size = 20, color = P.brown400 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 2C8 2 5 8 5 14a7 7 0 0 0 14 0c0-6-3-12-7-12z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M12 7c-2 2-3 5-3 7"
        stroke={color}
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </Svg>
  );
}

function WarningTriangleIcon({ size = 12, color = P.twRed600 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"
        fill={color}
      />
      <Path d="M12 9v4M12 17h.01" stroke={P.white} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function PlusIcon({ size = 18, color = P.white }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M12 5v14M5 12h14" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

// ── Types & Data ─────────────────────────────────────────────────────────────

interface AnimalItem {
  id: string;
  name: string;
  code: string;
  type: string;
  breed: string;
  gender: string;
  age: string;
  statusBadge: string;
  statusBadgeType: 'green' | 'orange' | 'born_green';
  hasAlert?: boolean;
  alertText?: string;
  iconType: 'paw' | 'egg';
}

const ANIMALS_DATA: AnimalItem[] = [
  {
    id: 'a1',
    name: 'Lakshmi',
    code: 'C-014',
    type: 'Cattle',
    breed: 'Jersey cross',
    gender: '♀',
    age: '4 yr',
    statusBadge: 'Fully Organic',
    statusBadgeType: 'green',
    hasAlert: true,
    alertText: 'Withdrawal active',
    iconType: 'paw',
  },
  {
    id: 'a2',
    name: 'Kaveri',
    code: 'B-007',
    type: 'Buffalo',
    breed: 'Murrah',
    gender: '♀',
    age: '6 yr',
    statusBadge: 'Fully Organic',
    statusBadgeType: 'green',
    iconType: 'paw',
  },
  {
    id: 'a3',
    name: 'Meena',
    code: 'G-021',
    type: 'Goat',
    breed: 'Malabari',
    gender: '♀',
    age: '2 yr',
    statusBadge: 'Transitioning',
    statusBadgeType: 'orange',
    iconType: 'paw',
  },
  {
    id: 'a4',
    name: 'Karuppi',
    code: 'P-103',
    type: 'Poultry',
    breed: 'Country hen',
    gender: '♀',
    age: '1 yr',
    statusBadge: 'Born Organic',
    statusBadgeType: 'born_green',
    iconType: 'egg',
  },
];

const SPECIES_OPTIONS = ['All species', 'Cattle', 'Buffalo', 'Goat', 'Poultry', 'Sheep'];

export interface LivestockScreenProps {
  onBack?: () => void;
  onNavigateToAddAnimal?: () => void;
  onNavigateToAnimalDetail?: (id: string) => void;
}

export function LivestockScreen({
  onBack,
  onNavigateToAddAnimal,
  onNavigateToAnimalDetail,
}: LivestockScreenProps): React.JSX.Element {
  const [selectedSpecies, setSelectedSpecies] = useState<string>('All species');
  const [speciesModalVisible, setSpeciesModalVisible] = useState(false);

  const filteredAnimals = selectedSpecies === 'All species'
    ? ANIMALS_DATA
    : ANIMALS_DATA.filter((a) => a.type.toLowerCase() === selectedSpecies.toLowerCase());

  const handleAnimalPress = (animal: AnimalItem) => {
    if (onNavigateToAnimalDetail) {
      onNavigateToAnimalDetail(animal.id);
    } else {
      Alert.alert(
        `${animal.name} (${animal.code})`,
        `${animal.type} · ${animal.breed}\nAge: ${animal.age}\nStatus: ${animal.statusBadge}${animal.alertText ? `\nAlert: ${animal.alertText}` : ''}`,
      );
    }
  };

  const handleAddAnimal = () => {
    if (onNavigateToAddAnimal) {
      onNavigateToAddAnimal();
    } else {
      Alert.alert('Add Animal', 'Animal registration form coming soon.');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={P.white} />
      <View style={styles.container}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header Row */}
          <View style={styles.headerRow}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={onBack}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Go back"
            >
              <ArrowBackIcon size={20} color={P.deepGreen} />
            </TouchableOpacity>
            <View style={styles.headerTitles}>
              <Text style={styles.headerTitle}>Livestock</Text>
              <Text style={styles.headerSubtitle}>4 animals on the farm</Text>
            </View>
          </View>

          {/* 3 Summary Stats Cards */}
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>4</Text>
              <Text style={styles.statLabel}>Animals</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={[styles.statNumber, { color: colors.brandGreen }]}>3</Text>
              <Text style={styles.statLabel}>Fully organic</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={[styles.statNumber, { color: P.twRed600 }]}>1</Text>
              <Text style={styles.statLabel}>Health alert</Text>
            </View>
          </View>

          {/* Species Dropdown Filter */}
          <View style={styles.filterSection}>
            <TouchableOpacity
              style={styles.filterPill}
              onPress={() => setSpeciesModalVisible(true)}
              activeOpacity={0.75}
            >
              <Text style={styles.filterPillText}>{selectedSpecies}</Text>
              <ChevronDownIcon size={16} color={P.twGray500} />
            </TouchableOpacity>
          </View>

          {/* Section Header */}
          <Text style={styles.sectionHeader}>ANIMALS</Text>

          {/* Animals List */}
          <View style={styles.animalsList}>
            {filteredAnimals.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.animalCard}
                onPress={() => handleAnimalPress(item)}
                activeOpacity={0.75}
              >
                {/* Left Avatar with Alert Dot */}
                <View style={styles.avatarContainer}>
                  <View style={styles.avatarCircle}>
                    {item.iconType === 'paw' ? (
                      <PawPrintIcon size={22} color={P.twAmber800} />
                    ) : (
                      <EggPoultryIcon size={20} color={P.twAmber800} />
                    )}
                  </View>
                  {item.hasAlert && <View style={styles.alertDot} />}
                </View>

                {/* Middle Info */}
                <View style={styles.cardContent}>
                  <View style={styles.nameCodeRow}>
                    <Text style={styles.animalName}>{item.name}</Text>
                    <Text style={styles.animalCode}>{item.code}</Text>
                  </View>

                  <Text style={styles.animalDetails}>
                    {item.type} · {item.breed} · {item.gender} · {item.age}
                  </Text>

                  {/* Badges Row */}
                  <View style={styles.badgesRow}>
                    <View
                      style={[
                        styles.badge,
                        item.statusBadgeType === 'orange'
                          ? styles.badgeOrange
                          : styles.badgeGreen,
                      ]}
                    >
                      <Text
                        style={[
                          styles.badgeText,
                          item.statusBadgeType === 'orange'
                            ? styles.badgeTextOrange
                            : styles.badgeTextGreen,
                        ]}
                      >
                        {item.statusBadge}
                      </Text>
                    </View>

                    {item.hasAlert && item.alertText && (
                      <View style={styles.alertBadge}>
                        <WarningTriangleIcon size={11} color={P.twOrange700} />
                        <Text style={styles.alertBadgeText}>{item.alertText}</Text>
                      </View>
                    )}
                  </View>
                </View>

                {/* Right Arrow */}
                <View style={styles.chevronBox}>
                  <ChevronRightIcon size={18} color={P.twGray400} />
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        {/* Floating Action Button */}
        <TouchableOpacity
          style={styles.fab}
          onPress={handleAddAnimal}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel="Add animal"
        >
          <PlusIcon size={18} color={P.white} />
          <Text style={styles.fabText}>Add animal</Text>
        </TouchableOpacity>
      </View>

      {/* Species Modal */}
      <Modal
        visible={speciesModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setSpeciesModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setSpeciesModalVisible(false)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Species</Text>
            {SPECIES_OPTIONS.map((opt) => (
              <TouchableOpacity
                key={opt}
                style={styles.modalOption}
                onPress={() => {
                  setSelectedSpecies(opt);
                  setSpeciesModalVisible(false);
                }}
              >
                <Text
                  style={[
                    styles.modalOptionText,
                    selectedSpecies === opt && styles.modalOptionTextActive,
                  ]}
                >
                  {opt}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: P.lightSurfaceAlt,
  },
  container: {
    flex: 1,
    position: 'relative',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 90,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1,
    borderColor: P.twGray200,
    backgroundColor: P.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
    shadowColor: P.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  headerTitles: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: P.nearBlack,
    letterSpacing: -0.2,
  },
  headerSubtitle: {
    fontSize: 13,
    color: P.twGray500,
    marginTop: 2,
  },

  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: P.white,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: P.twGray100,
    shadowColor: P.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  statNumber: {
    fontSize: 22,
    fontWeight: '700',
    color: P.nearBlack,
  },
  statLabel: {
    fontSize: 11.5,
    color: P.twGray500,
    marginTop: 4,
    textAlign: 'center',
  },

  filterSection: {
    marginBottom: 18,
  },
  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: P.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: P.twGray200,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: P.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  filterPillText: {
    fontSize: 14,
    fontWeight: '500',
    color: P.twGray700,
  },

  sectionHeader: {
    fontSize: 12,
    fontWeight: '700',
    color: P.twGray500,
    letterSpacing: 0.6,
    marginBottom: 12,
  },

  animalsList: {
    gap: 12,
  },
  animalCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: P.white,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: P.twGray100,
    padding: 15,
    shadowColor: P.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 14,
  },
  avatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: P.twAmber50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  alertDot: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: P.twOrange600,
    borderWidth: 1.5,
    borderColor: P.white,
  },
  cardContent: {
    flex: 1,
  },
  nameCodeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  animalName: {
    fontSize: 15.5,
    fontWeight: '700',
    color: P.nearBlack,
  },
  animalCode: {
    fontSize: 12.5,
    color: P.twGray500,
    fontWeight: '500',
  },
  animalDetails: {
    fontSize: 12,
    color: P.twGray500,
    marginTop: 2,
    marginBottom: 6,
  },
  badgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    alignItems: 'center',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeGreen: {
    backgroundColor: colors.brandGreenLight,
  },
  badgeOrange: {
    backgroundColor: P.twAmber100,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  badgeTextGreen: {
    color: colors.brandGreen,
  },
  badgeTextOrange: {
    color: P.twAmber800,
  },
  alertBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: P.twOrange100,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  alertBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: P.twOrange700,
  },
  chevronBox: {
    paddingLeft: 6,
  },

  fab: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.brandGreen,
    paddingVertical: 13,
    paddingHorizontal: 20,
    borderRadius: 24,
    shadowColor: P.deepGreen,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 5,
    gap: 6,
  },
  fabText: {
    fontSize: 14.5,
    fontWeight: '700',
    color: P.white,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    width: '100%',
    backgroundColor: P.white,
    borderRadius: 18,
    padding: 20,
    shadowColor: P.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: P.twGray900,
    marginBottom: 14,
  },
  modalOption: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: P.twGray100,
  },
  modalOptionText: {
    fontSize: 14,
    color: P.twGray700,
  },
  modalOptionTextActive: {
    color: colors.brandGreen,
    fontWeight: '700',
  },
});
