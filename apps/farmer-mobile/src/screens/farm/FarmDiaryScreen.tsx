import React, { useState } from 'react';
import {
  Image,
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
import { useDiaryStore, type DiaryItem } from './diaryStore';

// ─────────────────────────────────────────────
// Inline SVG Icons
// ─────────────────────────────────────────────

function CheckmarkIcon({ size = 16, color = '#FFFFFF' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M5 13l4 4L19 7" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function CloseCrossIcon({ size = 16, color = '#4B5563' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Line x1="18" y1="6" x2="6" y2="18" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
      <Line x1="6" y1="6" x2="18" y2="18" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
    </Svg>
  );
}

function ArrowBackIcon({ size = 20, color = '#FFFFFF' }: { size?: number; color?: string }) {
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

function CalendarHeaderIcon({ size = 20, color = '#FFFFFF' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="4" width="18" height="18" rx="2" stroke={color} strokeWidth="2" />
      <Line x1="16" y1="2" x2="16" y2="6" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="8" y1="2" x2="8" y2="6" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="3" y1="10" x2="21" y2="10" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Circle cx="8" cy="14" r="1.2" fill={color} />
      <Circle cx="12" cy="14" r="1.2" fill={color} />
      <Circle cx="16" cy="14" r="1.2" fill={color} />
    </Svg>
  );
}

function ChevronDownIcon({ size = 16, color = '#6B7280' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M6 9l6 6 6-6" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function ChevronUpIcon({ size = 16, color = '#6B7280' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M18 15l-6-6-6 6" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
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

function BugIcon({ size = 20, color = '#9333EA' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="8" y="7" width="8" height="11" rx="4" stroke={color} strokeWidth="2" />
      <Path d="M12 7V3" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Path d="M4 11h4M16 11h4M4 16h4M16 16h4" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Circle cx="10" cy="5" r="0.8" fill={color} />
      <Circle cx="14" cy="5" r="0.8" fill={color} />
    </Svg>
  );
}

function LeafSproutIcon({ size = 20, color = '#16A34A' }: { size?: number; color?: string }) {
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

function TractorIcon({ size = 20, color = '#EA580C' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="6.5" cy="16.5" r="3.5" stroke={color} strokeWidth="2" />
      <Circle cx="18" cy="15" r="5" stroke={color} strokeWidth="2" />
      <Path d="M14 15V8H7v5M10 8V5H5v3M18 15h-4" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function UsersIcon({ size = 14, color = '#4B5563' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle cx="9" cy="7" r="4" stroke={color} strokeWidth="2" />
    </Svg>
  );
}

function PlusIcon({ size = 18, color = '#FFFFFF' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Line x1="12" y1="5" x2="12" y2="19" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
      <Line x1="5" y1="12" x2="19" y2="12" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
    </Svg>
  );
}

// ─────────────────────────────────────────────
// Types & Mock Entries
// ─────────────────────────────────────────────

export type DiaryEntry = DiaryItem;

interface FarmDiaryScreenProps {
  onBack?: () => void;
  onNavigateToNewEntry?: () => void;
  onNavigateToCalendar?: () => void;
}

const DUMMY_FIELDS = [
  'All fields',
  'Zone 1 — Upper Field',
  'Zone 2 — Lower Slope',
  'Zone 3 — Terrace',
  'Zone 4 — River Bed',
];

const DUMMY_CROPS = [
  'All crops',
  'Tomato',
  'Carrot',
  'Beans',
  'Cabbage',
];

export function FarmDiaryScreen({
  onBack,
  onNavigateToNewEntry,
  onNavigateToCalendar,
}: FarmDiaryScreenProps): React.JSX.Element {
  const { todayEntries } = useDiaryStore();
  const [expandedId, setExpandedId] = useState<string | null>(todayEntries[0]?.id ?? 'entry-1');
  const [fieldFilter, setFieldFilter] = useState('All fields');
  const [cropFilter, setCropFilter] = useState('All crops');
  const [activeModal, setActiveModal] = useState<'field' | 'crop' | null>(null);

  const filteredEntries = todayEntries.filter((item) => {
    const matchesField =
      fieldFilter === 'All fields' ||
      item.field.toLowerCase().includes(fieldFilter.toLowerCase()) ||
      (fieldFilter.includes('Zone 1') && item.field.includes('Zone 1')) ||
      (fieldFilter.includes('Zone 2') && item.field.includes('Zone 2')) ||
      (fieldFilter.includes('Zone 3') && item.field.includes('Zone 3')) ||
      (fieldFilter.includes('Zone 4') && item.field.includes('Zone 4'));

    const matchesCrop =
      cropFilter === 'All crops' ||
      item.title.toLowerCase().includes(cropFilter.toLowerCase());

    return matchesField && matchesCrop;
  });

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const getIconForType = (type: DiaryItem['type']) => {
    switch (type) {
      case 'irrigation':
        return {
          icon: <WaterDropIcon size={20} color="#0284C7" />,
          bg: '#E0F2FE',
        };
      case 'pest':
        return {
          icon: <BugIcon size={20} color="#9333EA" />,
          bg: '#F3E8FF',
        };
      case 'manure':
        return {
          icon: <LeafSproutIcon size={20} color="#16A34A" />,
          bg: '#DCFCE7',
        };
      case 'harvest':
        return {
          icon: <TractorIcon size={20} color="#EA580C" />,
          bg: '#FFEDD5',
        };
      case 'weeding':
      default:
        return {
          icon: <LeafSproutIcon size={20} color="#16A34A" />,
          bg: '#DCFCE7',
        };
    }
  };

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar barStyle="light-content" backgroundColor="#1B5E20" />

      {/* ── Header ── */}
      <View style={styles.header}>
        <View style={styles.headerTopRow}>
          <TouchableOpacity
            style={styles.headerCircleBtn}
            onPress={onBack}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Back"
          >
            <ArrowBackIcon size={20} color="#FFFFFF" />
          </TouchableOpacity>

          <View style={styles.headerTitleCol}>
            <Text style={styles.headerTitle}>Farm Diary</Text>
            <Text style={styles.headerSubtitle}>Thursday, 16 July 2026</Text>
          </View>

          <TouchableOpacity
            style={styles.headerCalendarBtn}
            onPress={onNavigateToCalendar}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="View Diary Calendar"
          >
            <CalendarHeaderIcon size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* 3 Summary Stats Cards */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{todayEntries.length}</Text>
            <Text style={styles.statLabel}>Entries today</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statNumber}>3h 20m</Text>
            <Text style={styles.statLabel}>Time logged</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statNumber}>3</Text>
            <Text style={styles.statLabel}>Fields covered</Text>
          </View>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Filter Dropdowns Row ── */}
        <View style={styles.filtersRow}>
          <TouchableOpacity
            style={styles.filterDropdown}
            activeOpacity={0.8}
            onPress={() => setActiveModal('field')}
          >
            <Text style={styles.filterDropdownText}>{fieldFilter}</Text>
            <ChevronDownIcon size={16} color="#6B7280" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.filterDropdown}
            activeOpacity={0.8}
            onPress={() => setActiveModal('crop')}
          >
            <Text style={styles.filterDropdownText}>{cropFilter}</Text>
            <ChevronDownIcon size={16} color="#6B7280" />
          </TouchableOpacity>
        </View>

        {/* ── Section Title ── */}
        <Text style={styles.sectionTitle}>TODAY&apos;S ENTRIES</Text>

        {/* ── Entries List ── */}
        <View style={styles.entriesList}>
          {filteredEntries.map((item) => {
            const isExpanded = expandedId === item.id;
            const { icon, bg } = getIconForType(item.type);

            return (
              <View key={item.id} style={styles.entryCard}>
                <TouchableOpacity
                  style={styles.entryHeaderRow}
                  activeOpacity={0.8}
                  onPress={() => toggleExpand(item.id)}
                >
                  <View style={[styles.entryIconBox, { backgroundColor: bg }]}>{icon}</View>

                  <View style={styles.entryTitleCol}>
                    <Text style={styles.entryTitle}>{item.title}</Text>
                    <Text style={styles.entrySubtitle}>{item.field}</Text>
                  </View>

                  <View style={styles.entryRightCol}>
                    <Text style={styles.entryDuration}>{item.duration}</Text>
                    {isExpanded ? (
                      <ChevronUpIcon size={16} color="#6B7280" />
                    ) : (
                      <ChevronDownIcon size={16} color="#6B7280" />
                    )}
                  </View>
                </TouchableOpacity>

                {isExpanded && (
                  <View style={styles.entryExpandedContent}>
                    {/* Method & Labour Pills */}
                    <View style={styles.pillsRow}>
                      {item.method && (
                        <View style={styles.pillGray}>
                          <Text style={styles.pillGrayText}>{item.method}</Text>
                        </View>
                      )}
                      {item.labour && (
                        <View style={styles.pillGray}>
                          <UsersIcon size={13} color="#4B5563" />
                          <Text style={styles.pillGrayText}>{item.labour}</Text>
                        </View>
                      )}
                    </View>

                    {/* Notes */}
                    {item.notes && <Text style={styles.entryNotesText}>{item.notes}</Text>}

                    {/* Photos Mock thumbnails */}
                    {item.hasPhotos && (
                      <View style={styles.photosRow}>
                        <View style={styles.photoThumb}>
                          <View style={styles.photoPlaceholderGreen} />
                        </View>
                        <View style={styles.photoThumb}>
                          <View style={styles.photoPlaceholderFarm} />
                        </View>
                      </View>
                    )}
                  </View>
                )}
              </View>
            );
          })}

          {filteredEntries.length === 0 && (
            <View style={styles.emptyStateCard}>
              <Text style={styles.emptyStateText}>No entries found for selected filters.</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* ── Floating / Bottom + New Entry Button ── */}
      <View style={styles.floatingButtonContainer}>
        <TouchableOpacity
          style={styles.newEntryBtn}
          activeOpacity={0.85}
          onPress={onNavigateToNewEntry}
        >
          <PlusIcon size={18} color="#FFFFFF" />
          <Text style={styles.newEntryBtnText}>New entry</Text>
        </TouchableOpacity>
      </View>

      {/* Interactive Picker Modal */}
      <Modal
        visible={activeModal !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setActiveModal(null)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setActiveModal(null)}
        >
          <View style={styles.modalSheet} onStartShouldSetResponder={() => true}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {activeModal === 'field' ? 'Select Field' : 'Select Crop'}
              </Text>
              <TouchableOpacity
                onPress={() => setActiveModal(null)}
                style={styles.modalCloseBtn}
              >
                <CloseCrossIcon size={16} color="#4B5563" />
              </TouchableOpacity>
            </View>
            <View style={styles.modalList}>
              {(activeModal === 'field' ? DUMMY_FIELDS : DUMMY_CROPS).map((option) => {
                const isSelected =
                  activeModal === 'field' ? fieldFilter === option : cropFilter === option;
                return (
                  <TouchableOpacity
                    key={option}
                    style={[styles.modalOptionRow, isSelected && styles.modalOptionSelected]}
                    activeOpacity={0.7}
                    onPress={() => {
                      if (activeModal === 'field') {
                        setFieldFilter(option);
                      } else {
                        setCropFilter(option);
                      }
                      setActiveModal(null);
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
// Styles
// ─────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    backgroundColor: '#1B5E20',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 18,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  headerCircleBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleCol: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    color: '#C8E6C9',
    marginTop: 2,
  },
  headerCalendarBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  statNumber: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#E8F5E9',
    marginTop: 2,
  },

  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 90,
  },

  /* Filters */
  filtersRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  filterDropdown: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  filterDropdownText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },

  /* Section Title */
  sectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#6B7280',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginBottom: 12,
  },

  /* Entries List */
  entriesList: {
    gap: 12,
  },
  entryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  entryHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  entryIconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  entryTitleCol: {
    flex: 1,
  },
  entryTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
  },
  entrySubtitle: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  entryRightCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  entryDuration: {
    fontSize: 14,
    fontWeight: '700',
    color: '#15803D',
  },
  entryExpandedContent: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  pillsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  pillGray: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  pillGrayText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4B5563',
  },
  entryNotesText: {
    fontSize: 13,
    color: '#4B5563',
    lineHeight: 19,
    marginBottom: 12,
  },
  photosRow: {
    flexDirection: 'row',
    gap: 10,
  },
  photoThumb: {
    width: 64,
    height: 64,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#E5E7EB',
  },
  photoPlaceholderGreen: {
    width: '100%',
    height: '100%',
    backgroundColor: '#2E7D32',
    opacity: 0.85,
  },
  photoPlaceholderFarm: {
    width: '100%',
    height: '100%',
    backgroundColor: '#689F38',
    opacity: 0.85,
  },

  /* Floating Bottom Button */
  floatingButtonContainer: {
    position: 'absolute',
    bottom: 24,
    right: 20,
  },
  newEntryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#1E6530',
    borderRadius: 24,
    paddingVertical: 14,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 6,
  },
  newEntryBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  emptyStateCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  emptyStateText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
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
