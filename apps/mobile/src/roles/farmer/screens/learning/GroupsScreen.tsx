import React, { useState } from 'react';
import {
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
import Svg, { Circle, Path, Rect } from 'react-native-svg';

// ── SVG Icons ────────────────────────────────────────────────────────────────

function ArrowBackIcon({ size = 20, color = '#1E5E2B' }: { size?: number; color?: string }) {
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

function SearchIcon({ size = 18, color = '#8C9088' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="11" cy="11" r="7" stroke={color} strokeWidth="2" />
      <Path d="M20 20L16 16" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function CheckmarkIcon({ size = 13, color = '#1E5E2B' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M20 6L9 17L4 12"
        stroke={color}
        strokeWidth="2.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function GroupUsersIcon({ size = 22, color = '#1E5E2B' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="9" cy="8" r="3.2" stroke={color} strokeWidth="2" />
      <Path d="M3.5 19c0-3 2.5-5.5 5.5-5.5s5.5 2.5 5.5 5.5" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Path d="M15 6.5a3 3 0 0 1 0 5.5" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <Path d="M16.5 14.2c2 .4 3.5 2 3.5 4.3" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </Svg>
  );
}

function MedalRibbonIcon({ size = 22, color = '#0284C7' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="8.5" r="5.5" stroke={color} strokeWidth="2" />
      <Path d="M12 6.5l.8 1.6 1.7.3-1.2 1.2.3 1.8-1.6-.8-1.6.8.3-1.8-1.2-1.2 1.7-.3.8-1.6z" fill={color} />
      <Path d="M8.5 13.5L7 21l5-2.5 5 2.5-1.5-7.5" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function PestBugIcon({ size = 22, color = '#EA580C' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="8" y="8" width="8" height="10" rx="4" stroke={color} strokeWidth="2" />
      <Path d="M12 4v4M12 12v6" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Path d="M5 10l3 2M19 10l-3 2M5 16l3-1M19 16l-3-1M8 5l-2-2M16 5l2-2" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function MountainTerraceIcon({ size = 22, color = '#85582E' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M3 19l6.5-10L14 16l3.5-5 3.5 8H3z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function BanknotesCashIcon({ size = 22, color = '#7C3AED' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="2" y="6" width="16" height="12" rx="2.5" stroke={color} strokeWidth="2" />
      <Circle cx="10" cy="12" r="2.5" stroke={color} strokeWidth="2" />
      <Path d="M18 9h2a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2h-12" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function CloseIcon({ size = 20, color = '#374151' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M18 6L6 18M6 6l12 12" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
    </Svg>
  );
}

// ── Types & Data ─────────────────────────────────────────────────────────────

export interface GroupItem {
  id: string;
  name: string;
  membersCount: number;
  iconType: 'users' | 'medal' | 'pest' | 'terrace' | 'cash';
  iconBg: string;
  iconColor: string;
  isJoined: boolean;
  recentDiscussion?: string;
}

export const INITIAL_FARMER_GROUPS: GroupItem[] = [
  {
    id: 'grp-1',
    name: 'Ooty Carrot Growers',
    membersCount: 128,
    iconType: 'users',
    iconBg: '#EAF3DE',
    iconColor: '#1E5E2B',
    isJoined: true,
    recentDiscussion: 'Kavitha R: Current harvest rates in Zone A are hitting ₹42/kg with Grade 1 sorting.',
  },
  {
    id: 'grp-2',
    name: 'Organic Certification Help',
    membersCount: 94,
    iconType: 'medal',
    iconBg: '#E0F2FE',
    iconColor: '#0284C7',
    isJoined: false,
    recentDiscussion: 'Dr. Anand: New checklist uploaded for renewal audits happening next month.',
  },
  {
    id: 'grp-3',
    name: 'Nilgiris Pest Watch',
    membersCount: 156,
    iconType: 'pest',
    iconBg: '#FFEDD5',
    iconColor: '#EA580C',
    isJoined: true,
    recentDiscussion: 'Muthu K: Whitefly sightings near Lovedale valley. Recommend applying neem spray at 5ml/L.',
  },
  {
    id: 'grp-4',
    name: 'Terrace Farming Techniques',
    membersCount: 72,
    iconType: 'terrace',
    iconBg: '#F5EBE1',
    iconColor: '#85582E',
    isJoined: false,
    recentDiscussion: 'TOHFA Team: New contour ridge trenching diagram shared in files.',
  },
  {
    id: 'grp-5',
    name: 'Market Price Talk',
    membersCount: 210,
    iconType: 'cash',
    iconBg: '#F3E8FF',
    iconColor: '#7C3AED',
    isJoined: false,
    recentDiscussion: 'Sundaram P: Weekend customer preorder demand is highest for French Beans and Carrots.',
  },
];

import { GroupDetailScreen } from './GroupDetailScreen';

interface GroupsScreenProps {
  onBack: () => void;
  onNavigateToGroupDetail?: ((group: GroupItem) => void) | undefined;
}

export function GroupsScreen({ onBack, onNavigateToGroupDetail }: GroupsScreenProps): React.JSX.Element {
  const [searchQuery, setSearchQuery] = useState('');
  const [groups, setGroups] = useState<GroupItem[]>(INITIAL_FARMER_GROUPS);
  const [activeGroupDetail, setActiveGroupDetail] = useState<GroupItem | null>(null);

  const filteredGroups = groups.filter((g) =>
    g.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleJoin = (groupId: string) => {
    setGroups((prev) =>
      prev.map((g) => {
        if (g.id === groupId) {
          const nextJoined = !g.isJoined;
          return {
            ...g,
            isJoined: nextJoined,
            membersCount: nextJoined ? g.membersCount + 1 : g.membersCount - 1,
          };
        }
        return g;
      })
    );
  };

  const handleOpenGroupDetail = (group: GroupItem) => {
    if (onNavigateToGroupDetail) {
      onNavigateToGroupDetail(group);
    } else {
      setActiveGroupDetail(group);
    }
  };

  if (activeGroupDetail) {
    return (
      <GroupDetailScreen
        group={activeGroupDetail}
        onBack={() => setActiveGroupDetail(null)}
      />
    );
  }

  const renderGroupIcon = (item: GroupItem) => {
    switch (item.iconType) {
      case 'users':
        return <GroupUsersIcon size={22} color={item.iconColor} />;
      case 'medal':
        return <MedalRibbonIcon size={22} color={item.iconColor} />;
      case 'pest':
        return <PestBugIcon size={22} color={item.iconColor} />;
      case 'terrace':
        return <MountainTerraceIcon size={22} color={item.iconColor} />;
      case 'cash':
        return <BanknotesCashIcon size={22} color={item.iconColor} />;
      default:
        return <GroupUsersIcon size={22} color={item.iconColor} />;
    }
  };

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* ── Top Header ── */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={onBack}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <ArrowBackIcon size={18} color="#1E5E2B" />
        </TouchableOpacity>
        <View style={styles.headerTextWrap}>
          <Text style={styles.headerTitle}>Groups</Text>
          <Text style={styles.headerSubtitle}>Peer discussion · {groups.length} groups</Text>
        </View>
      </View>
      <View style={styles.headerDivider} />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Search Input ── */}
        <View style={styles.searchContainer}>
          <SearchIcon size={18} color="#8C9088" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search groups..."
            placeholderTextColor="#8C9088"
            value={searchQuery}
            onChangeText={setSearchQuery}
            accessibilityLabel="Search groups"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearSearchBtn}>
              <CloseIcon size={16} color="#8C9088" />
            </TouchableOpacity>
          )}
        </View>

        {/* ── Group Cards List ── */}
        <View style={styles.groupsList}>
          {filteredGroups.map((group) => (
            <TouchableOpacity
              key={group.id}
              style={styles.groupCard}
              activeOpacity={0.9}
              onPress={() => handleOpenGroupDetail(group)}
              accessibilityRole="button"
              accessibilityLabel={`${group.name}, ${group.membersCount} members, ${group.isJoined ? 'Joined' : 'Not joined'}`}
            >
              {/* Group Icon Container */}
              <View style={[styles.iconBox, { backgroundColor: group.iconBg }]}>
                {renderGroupIcon(group)}
              </View>

              {/* Group Info */}
              <View style={styles.groupInfo}>
                <Text style={styles.groupName} numberOfLines={1}>
                  {group.name}
                </Text>
                <Text style={styles.groupMembersText}>{group.membersCount} members</Text>
              </View>

              {/* Action Button: Joined vs Join */}
              {group.isJoined ? (
                <TouchableOpacity
                  style={styles.joinedBadge}
                  onPress={() => toggleJoin(group.id)}
                  activeOpacity={0.75}
                  accessibilityRole="button"
                  accessibilityLabel="Leave group"
                >
                  <CheckmarkIcon size={12} color="#1E5E2B" />
                  <Text style={styles.joinedBadgeText}>Joined</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={styles.joinButton}
                  onPress={() => toggleJoin(group.id)}
                  activeOpacity={0.8}
                  accessibilityRole="button"
                  accessibilityLabel="Join group"
                >
                  <Text style={styles.joinButtonText}>Join</Text>
                </TouchableOpacity>
              )}
            </TouchableOpacity>
          ))}

          {filteredGroups.length === 0 && (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>No groups found</Text>
              <Text style={styles.emptySub}>Try searching for "carrot", "pest", or "market".</Text>
            </View>
          )}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  headerTextWrap: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: '#1A2E1A',
    letterSpacing: -0.2,
  },
  headerSubtitle: {
    fontSize: 12.5,
    fontWeight: '500',
    color: '#718274',
    marginTop: 1,
  },
  headerDivider: {
    height: 1,
    backgroundColor: '#F0ECE1',
  },

  // Scroll View
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 30,
  },

  // Search Input Bar
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3EFE6',
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 46,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#1A2E1A',
    marginLeft: 10,
    paddingVertical: 0,
  },
  clearSearchBtn: {
    padding: 4,
  },

  // Groups List
  groupsList: {
    gap: 12,
  },
  groupCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#ECE8DD',
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 5,
    elevation: 1.5,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  groupInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  groupName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1A2E1A',
    marginBottom: 3,
  },
  groupMembersText: {
    fontSize: 12.5,
    fontWeight: '500',
    color: '#718274',
  },

  // Joined Badge (Pill)
  joinedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#EAF3DE',
    borderRadius: 18,
    paddingHorizontal: 13,
    paddingVertical: 7,
  },
  joinedBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1E5E2B',
  },

  // Join Button (Dark Green Pill)
  joinButton: {
    backgroundColor: '#1E5E2B',
    borderRadius: 18,
    paddingHorizontal: 18,
    paddingVertical: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  joinButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // Empty State
  emptyState: {
    padding: 30,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1A2E1A',
    marginBottom: 4,
  },
  emptySub: {
    fontSize: 12.5,
    color: '#718274',
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    padding: 20,
    paddingBottom: 30,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconBoxMini: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1A2E1A',
  },
  modalSub: {
    fontSize: 12,
    color: '#718274',
    marginTop: 2,
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  discussionBox: {
    backgroundColor: '#F3EFE6',
    borderRadius: 14,
    padding: 14,
    marginBottom: 18,
  },
  discussionLabel: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#1A2E1A',
    marginBottom: 6,
  },
  discussionText: {
    fontSize: 13,
    color: '#4B5563',
    lineHeight: 19,
  },
  modalJoinBtn: {
    backgroundColor: '#1E5E2B',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  modalJoinBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  modalLeaveBtn: {
    backgroundColor: '#FEE2E2',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  modalLeaveBtnText: {
    color: '#DC2626',
    fontSize: 14,
    fontWeight: '800',
  },
});
