import React, { useState } from 'react';
import {
  Modal,
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

// Tractor icon for Machinery header
function TractorIcon({ size = 22, color = P.twAmber800 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="6" cy="17" r="3" stroke={color} strokeWidth="1.8" />
      <Circle cx="18" cy="15" r="5" stroke={color} strokeWidth="1.8" />
      <Path d="M6 14h6l2-6h4v7" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <Line x1="14" y1="8" x2="14" y2="14" stroke={color} strokeWidth="1.5" />
      <Line x1="11" y1="5" x2="11" y2="8" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </Svg>
  );
}

function FilterLinesIcon({ size = 16, color = P.twGray600 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Line x1="4" y1="6" x2="20" y2="6" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="7" y1="12" x2="17" y2="12" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="10" y1="18" x2="14" y2="18" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function ChevronDownIcon({ size = 16, color = P.twGray500 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M6 9l6 6 6-6" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function CalendarIcon({ size = 14, color = P.twRed600 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="4" width="18" height="18" rx="2" stroke={color} strokeWidth="2" />
      <Line x1="3" y1="10" x2="21" y2="10" stroke={color} strokeWidth="2" />
      <Line x1="8" y1="2" x2="8" y2="6" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="16" y1="2" x2="16" y2="6" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function ClockTimerIcon({ size = 14, color = P.twAmber800 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth="2" />
      <Path d="M12 7v5l3 3" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
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

function EditPencilIcon({ size = 14, color = P.twGray600 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// ── Types & Data ─────────────────────────────────────────────────────────────

export type MachineryStatus = 'Overdue' | 'Due soon' | 'OK';

export interface MachineryItem {
  id: string;
  name: string;
  makeModel?: string | undefined;
  purchaseDate: string;
  fuelType?: string | undefined;
  serviceInterval?: string | undefined;
  dueDate: string;
  dueNote: string;
  status: MachineryStatus;
}

const INITIAL_MACHINERY: MachineryItem[] = [
  {
    id: 'm1',
    name: 'Mini Tractor — Mahindra Jivo',
    makeModel: 'Mahindra Jivo 245 DI',
    purchaseDate: 'Purchased 15 Nov 2022',
    fuelType: 'Diesel',
    serviceInterval: '60',
    dueDate: 'Service due 30 Jun 2026',
    dueNote: '20 days overdue',
    status: 'Overdue',
  },
  {
    id: 'm2',
    name: 'Power Tiller',
    makeModel: 'VST Shakti MX 130',
    purchaseDate: 'Purchased 08 Feb 2023',
    fuelType: 'Diesel',
    serviceInterval: '60',
    dueDate: 'Service due 22 Jul 2026',
    dueNote: '2 days away',
    status: 'Due soon',
  },
  {
    id: 'm3',
    name: 'Water Pump (5HP)',
    makeModel: 'Kirloskar 5HP Monoblock',
    purchaseDate: 'Purchased 30 Jan 2024',
    fuelType: 'Diesel / Electric',
    serviceInterval: '90',
    dueDate: 'Service due 12 Oct 2026',
    dueNote: '84 days away',
    status: 'OK',
  },
];

export interface MachineryListScreenProps {
  onBack?: (() => void) | undefined;
  onNavigateToAddMachinery?: (() => void) | undefined;
  onNavigateToMachineryDetail?: ((item: MachineryItem) => void) | undefined;
  onNavigateToEditMachinery?: ((item: MachineryItem) => void) | undefined;
}

export function MachineryListScreen({
  onBack,
  onNavigateToAddMachinery,
  onNavigateToMachineryDetail,
  onNavigateToEditMachinery,
}: MachineryListScreenProps): React.JSX.Element {
  const [machineryList] = useState<MachineryItem[]>(INITIAL_MACHINERY);
  const [selectedFilter, setSelectedFilter] = useState<'All statuses' | MachineryStatus>('All statuses');
  const [filterModalOpen, setFilterModalOpen] = useState(false);

  const filterOptions: ('All statuses' | MachineryStatus)[] = [
    'All statuses',
    'Overdue',
    'Due soon',
    'OK',
  ];

  const filteredItems =
    selectedFilter === 'All statuses'
      ? machineryList
      : machineryList.filter((item) => item.status === selectedFilter);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={P.white} />
      <View style={styles.container}>
        {/* ── Top Header ── */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={onBack}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Back"
          >
            <ArrowBackIcon size={20} color={P.deepGreen} />
          </TouchableOpacity>

          <View style={styles.headerIconContainer}>
            <TractorIcon size={22} color={P.twAmber800} />
          </View>

          <View style={styles.headerTitles}>
            <Text style={styles.headerTitle}>Machinery</Text>
            <Text style={styles.headerSubtitle}>{machineryList.length} items</Text>
          </View>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* ── Filter Dropdown ── */}
          <TouchableOpacity
            style={styles.filterDropdown}
            onPress={() => setFilterModalOpen(true)}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Filter by status"
          >
            <View style={styles.filterLeftRow}>
              <FilterLinesIcon size={16} color={P.twGray600} />
              <Text style={styles.filterText}>{selectedFilter}</Text>
            </View>
            <ChevronDownIcon size={16} color={P.twGray500} />
          </TouchableOpacity>

          {/* ── Machinery List ── */}
          <View style={styles.machineryListContainer}>
            {filteredItems.map((item) => {
              const isOverdue = item.status === 'Overdue';
              const isDueSoon = item.status === 'Due soon';
              const isOk = item.status === 'OK';

              return (
                <TouchableOpacity
                  key={item.id}
                  style={styles.cardWrapper}
                  activeOpacity={0.85}
                  onPress={() => {
                    if (onNavigateToEditMachinery) {
                      onNavigateToEditMachinery(item);
                    } else if (onNavigateToMachineryDetail) {
                      onNavigateToMachineryDetail(item);
                    }
                  }}
                >
                  <View
                    style={[
                      styles.machineryCard,
                      isOverdue && styles.cardBorderOverdue,
                      isDueSoon && styles.cardBorderDueSoon,
                    ]}
                  >
                    {/* Top Row: Name, Status Badge and Edit Button */}
                    <View style={styles.cardTopRow}>
                      <Text style={styles.machineryName}>{item.name}</Text>

                      <View style={styles.cardTopRowRight}>
                        {isOverdue && (
                          <View style={styles.badgeOverdue}>
                            <Text style={styles.badgeTextOverdue}>Overdue</Text>
                          </View>
                        )}

                        {isDueSoon && (
                          <View style={styles.badgeDueSoon}>
                            <Text style={styles.badgeTextDueSoon}>Due soon</Text>
                          </View>
                        )}

                        {isOk && (
                          <View style={styles.badgeOk}>
                            <Text style={styles.badgeTextOk}>OK</Text>
                          </View>
                        )}

                        <TouchableOpacity
                          style={styles.editIconButton}
                          onPress={() => onNavigateToEditMachinery?.(item)}
                          activeOpacity={0.7}
                          accessibilityRole="button"
                          accessibilityLabel={`Edit ${item.name}`}
                        >
                          <EditPencilIcon size={14} color={P.twGray600} />
                        </TouchableOpacity>
                      </View>
                    </View>

                    {/* Purchase Date */}
                    <Text style={styles.purchaseDateText}>{item.purchaseDate}</Text>

                    {/* Service Due Status Line */}
                    <View style={styles.dueDateRow}>
                      {isOverdue && (
                        <>
                          <CalendarIcon size={14} color={P.twOrange700} />
                          <Text style={styles.dueDateTextOverdue}>
                            {item.dueDate} · {item.dueNote}
                          </Text>
                        </>
                      )}

                      {isDueSoon && (
                        <>
                          <ClockTimerIcon size={14} color={P.twAmber800} />
                          <Text style={styles.dueDateTextDueSoon}>
                            {item.dueDate} · {item.dueNote}
                          </Text>
                        </>
                      )}

                      {isOk && (
                        <>
                          <CalendarIcon size={14} color={colors.brandGreen} />
                          <Text style={styles.dueDateTextOk}>
                            {item.dueDate} · {item.dueNote}
                          </Text>
                        </>
                      )}
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>

        {/* ── Bottom Right Floating Action Button ── */}
        <TouchableOpacity
          style={styles.fab}
          onPress={onNavigateToAddMachinery}
          activeOpacity={0.88}
          accessibilityRole="button"
          accessibilityLabel="Add machinery"
        >
          <PlusIcon size={18} color={P.white} />
          <Text style={styles.fabText}>Add machinery</Text>
        </TouchableOpacity>

        {/* ── Filter Modal ── */}
        <Modal
          visible={filterModalOpen}
          transparent
          animationType="fade"
          onRequestClose={() => setFilterModalOpen(false)}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setFilterModalOpen(false)}
          >
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Filter by Status</Text>
              {filterOptions.map((opt) => (
                <TouchableOpacity
                  key={opt}
                  style={[
                    styles.modalOption,
                    selectedFilter === opt && styles.modalOptionSelected,
                  ]}
                  onPress={() => {
                    setSelectedFilter(opt);
                    setFilterModalOpen(false);
                  }}
                >
                  <Text
                    style={[
                      styles.modalOptionText,
                      selectedFilter === opt && styles.modalOptionTextSelected,
                    ]}
                  >
                    {opt}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </TouchableOpacity>
        </Modal>
      </View>
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
    backgroundColor: P.lightSurfaceAlt,
    position: 'relative',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 14,
    backgroundColor: P.white,
    borderBottomWidth: 1,
    borderBottomColor: P.twGray100,
  },
  backButton: {
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
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  headerIconContainer: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: P.paleCreamBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
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
    marginTop: 1,
  },

  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 100,
  },

  // Filter dropdown
  filterDropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: P.white,
    borderWidth: 1,
    borderColor: P.twGray200,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
    shadowColor: P.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 3,
    elevation: 1,
  },
  filterLeftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  filterText: {
    fontSize: 14,
    fontWeight: '600',
    color: P.twGray700,
  },

  // Machinery List
  machineryListContainer: {
    gap: 12,
  },
  cardWrapper: {
    backgroundColor: P.white,
    borderRadius: 18,
    shadowColor: P.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  machineryCard: {
    backgroundColor: P.white,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: P.twGray200,
    padding: 16,
  },
  cardBorderOverdue: {
    borderLeftWidth: 4,
    borderLeftColor: P.twOrange600,
  },
  cardBorderDueSoon: {
    borderLeftWidth: 4,
    borderLeftColor: P.twAmber800,
  },

  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  machineryName: {
    fontSize: 15.5,
    fontWeight: '700',
    color: P.nearBlack,
    flex: 1,
  },
  cardTopRowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  editIconButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: P.paleCreamBg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: P.twOrange200,
  },

  // Badges
  badgeOverdue: {
    backgroundColor: P.twOrange100,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  badgeTextOverdue: {
    fontSize: 11.5,
    fontWeight: '700',
    color: P.twOrange700,
  },
  badgeDueSoon: {
    backgroundColor: P.twAmber100,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  badgeTextDueSoon: {
    fontSize: 11.5,
    fontWeight: '700',
    color: P.twAmber800,
  },
  badgeOk: {
    backgroundColor: colors.brandGreenLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  badgeTextOk: {
    fontSize: 11.5,
    fontWeight: '700',
    color: colors.brandGreen,
  },

  purchaseDateText: {
    fontSize: 12.5,
    color: P.twGray500,
    marginBottom: 10,
  },

  dueDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dueDateTextOverdue: {
    fontSize: 12.5,
    fontWeight: '700',
    color: P.twOrange700,
  },
  dueDateTextDueSoon: {
    fontSize: 12.5,
    fontWeight: '700',
    color: P.twAmber800,
  },
  dueDateTextOk: {
    fontSize: 12.5,
    fontWeight: '700',
    color: colors.brandGreen,
  },

  // Floating Action Button
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    backgroundColor: colors.brandGreen,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 13,
    paddingHorizontal: 20,
    borderRadius: 24,
    shadowColor: colors.brandGreen,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 6,
    elevation: 4,
  },
  fabText: {
    fontSize: 14.5,
    fontWeight: '700',
    color: P.white,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
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
    color: P.nearBlack,
    marginBottom: 14,
  },
  modalOption: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: P.twGray100,
  },
  modalOptionSelected: {
    borderBottomColor: colors.brandGreen,
  },
  modalOptionText: {
    fontSize: 14,
    color: P.twGray700,
  },
  modalOptionTextSelected: {
    color: colors.brandGreen,
    fontWeight: '700',
  },
});
