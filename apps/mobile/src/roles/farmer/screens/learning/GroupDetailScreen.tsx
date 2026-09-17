import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
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
import type { GroupItem } from './GroupsScreen';

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

function LeaveIcon({ size = 18, color = '#4B5563' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function JoinPlusIcon({ size = 18, color = '#1E5E2B' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M12 5v14M5 12h14" stroke={color} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function SendPlaneIcon({ size = 18, color = '#FFFFFF' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function CommentBubbleIcon({ size = 15, color = '#718274' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"
        stroke={color}
        strokeWidth="2"
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

// ── Types & Feed Data ────────────────────────────────────────────────────────

export interface FeedPost {
  id: string;
  authorName: string;
  authorInitials: string;
  avatarBg: string;
  date: string;
  body: string;
  commentsCount: number;
  isSelf?: boolean;
}

const DEFAULT_POSTS: FeedPost[] = [
  {
    id: 'post-1',
    authorName: 'You',
    authorInitials: 'You',
    avatarBg: '#1E5E2B',
    date: '20 Jul 2026',
    body: 'Anyone else seeing early carrot fly this season? Zone A beds got hit despite the neem spray.',
    commentsCount: 0,
    isSelf: true,
  },
  {
    id: 'post-2',
    authorName: 'Muthu K.',
    authorInitials: 'MK',
    avatarBg: '#7A5C3D',
    date: '19 Jul 2026',
    body: 'Raised beds to ₹40/kg at the Ooty mandi today. Grade 1 moving fast — list early.',
    commentsCount: 6,
  },
  {
    id: 'post-3',
    authorName: 'Ravi S.',
    authorInitials: 'RS',
    avatarBg: '#1E40AF',
    date: '17 Jul 2026',
    body: 'Sharing the jeevamrut schedule that worked for my terraces last cycle. Happy to walk anyone through the ratio adjustments during heavy rainfall.',
    commentsCount: 4,
  },
];

const DEFAULT_GROUP: GroupItem = {
  id: 'grp-1',
  name: 'Ooty Carrot Growers',
  membersCount: 128,
  iconType: 'users',
  iconBg: '#EAF3DE',
  iconColor: '#1E5E2B',
  isJoined: true,
};

interface GroupDetailScreenProps {
  group?: GroupItem | undefined;
  onBack: () => void;
}

export function GroupDetailScreen({
  group = DEFAULT_GROUP,
  onBack,
}: GroupDetailScreenProps): React.JSX.Element {
  const [currentGroup, setCurrentGroup] = useState<GroupItem>(group ?? DEFAULT_GROUP);
  const [isJoined, setIsJoined] = useState(group?.isJoined ?? true);
  const [membersCount, setMembersCount] = useState(group?.membersCount ?? 128);
  const [newPostText, setNewPostText] = useState('');
  const [feedPosts, setFeedPosts] = useState<FeedPost[]>(DEFAULT_POSTS);

  const toggleJoinStatus = () => {
    if (isJoined) {
      setIsJoined(false);
      setMembersCount((prev) => prev - 1);
    } else {
      setIsJoined(true);
      setMembersCount((prev) => prev + 1);
    }
  };

  const handleCreatePost = () => {
    if (!newPostText.trim()) return;

    const newPost: FeedPost = {
      id: `post-${Date.now()}`,
      authorName: 'You',
      authorInitials: 'You',
      avatarBg: '#1E5E2B',
      date: 'Today',
      body: newPostText.trim(),
      commentsCount: 0,
      isSelf: true,
    };

    setFeedPosts([newPost, ...feedPosts]);
    setNewPostText('');
  };

  const renderGroupIcon = () => {
    switch (currentGroup.iconType) {
      case 'users':
        return <GroupUsersIcon size={22} color={currentGroup.iconColor} />;
      case 'medal':
        return <MedalRibbonIcon size={22} color={currentGroup.iconColor} />;
      case 'pest':
        return <PestBugIcon size={22} color={currentGroup.iconColor} />;
      case 'terrace':
        return <MountainTerraceIcon size={22} color={currentGroup.iconColor} />;
      case 'cash':
        return <BanknotesCashIcon size={22} color={currentGroup.iconColor} />;
      default:
        return <GroupUsersIcon size={22} color={currentGroup.iconColor} />;
    }
  };

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* ── Header Bar ── */}
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
        <Text style={styles.headerTitle}>Group</Text>
      </View>
      <View style={styles.headerDivider} />

      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* ── Top Group Card ── */}
          <View style={styles.groupHeaderCard}>
            <View style={styles.groupTopRow}>
              <View style={[styles.groupIconBox, { backgroundColor: currentGroup.iconBg }]}>
                {renderGroupIcon()}
              </View>
              <View style={styles.groupTitleWrap}>
                <Text style={styles.groupName}>{currentGroup.name}</Text>
                <Text style={styles.groupMembers}>{membersCount} members</Text>
              </View>
            </View>

            <Text style={styles.groupDescription}>
              Carrot farmers across the Ooty belt swapping notes on beds, pests, irrigation, and market timing.
            </Text>

            {/* Leave / Join Group Button */}
            <TouchableOpacity
              style={[styles.leaveGroupButton, !isJoined && styles.joinGroupButton]}
              onPress={toggleJoinStatus}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel={isJoined ? 'Leave group' : 'Join group'}
            >
              {isJoined ? (
                <>
                  <LeaveIcon size={18} color="#4B5563" />
                  <Text style={styles.leaveGroupButtonText}>Leave group</Text>
                </>
              ) : (
                <>
                  <JoinPlusIcon size={18} color="#1E5E2B" />
                  <Text style={styles.joinGroupButtonText}>Join group</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* ── Share Something Box ── */}
          <View style={styles.shareBoxRow}>
            <TextInput
              style={styles.shareInput}
              placeholder="Share something with the group..."
              placeholderTextColor="#8C9088"
              value={newPostText}
              onChangeText={setNewPostText}
              accessibilityLabel="Share with group"
            />
            <TouchableOpacity
              style={[styles.sendButton, !newPostText.trim() && styles.sendButtonInactive]}
              onPress={handleCreatePost}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel="Post message"
            >
              <SendPlaneIcon size={18} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {/* ── GROUP FEED Header ── */}
          <Text style={styles.sectionHeaderTitle}>GROUP FEED</Text>

          {/* ── Posts List ── */}
          {feedPosts.map((post) => (
            <View
              key={post.id}
              style={[
                styles.postCard,
                post.isSelf && styles.postCardSelfHighlight,
              ]}
            >
              {/* Author Row */}
              <View style={styles.postAuthorRow}>
                <View style={[styles.avatarCircle, { backgroundColor: post.avatarBg }]}>
                  <Text style={styles.avatarText}>{post.authorInitials}</Text>
                </View>
                <View style={styles.postAuthorTextWrap}>
                  <Text style={styles.postAuthorName}>{post.authorName}</Text>
                  <Text style={styles.postDate}>{post.date}</Text>
                </View>
              </View>

              {/* Post Body Text */}
              <Text style={styles.postBodyText}>{post.body}</Text>

              {/* Comments Footer */}
              <View style={styles.postFooter}>
                <CommentBubbleIcon size={15} color="#718274" />
                <Text style={styles.postCommentsCount}>
                  {post.commentsCount} comments
                </Text>
              </View>
            </View>
          ))}

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  keyboardContainer: {
    flex: 1,
  },
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
  headerTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: '#1A2E1A',
    letterSpacing: -0.2,
  },
  headerDivider: {
    height: 1,
    backgroundColor: '#F0ECE1',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 30,
  },

  // Group Header Card
  groupHeaderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#ECE8DD',
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  groupTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  groupIconBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  groupTitleWrap: {
    flex: 1,
  },
  groupName: {
    fontSize: 16.5,
    fontWeight: '800',
    color: '#1A2E1A',
    marginBottom: 2,
  },
  groupMembers: {
    fontSize: 12.5,
    fontWeight: '500',
    color: '#718274',
  },
  groupDescription: {
    fontSize: 13,
    color: '#4B5563',
    lineHeight: 19,
    marginBottom: 14,
  },
  leaveGroupButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E8E4D8',
    borderRadius: 14,
    paddingVertical: 12,
  },
  leaveGroupButtonText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#4B5563',
  },
  joinGroupButton: {
    backgroundColor: '#EAF3DE',
    borderColor: '#C8E6C9',
  },
  joinGroupButtonText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#1E5E2B',
  },

  // Share Input Box
  shareBoxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 18,
  },
  shareInput: {
    flex: 1,
    height: 46,
    backgroundColor: '#F3EFE6',
    borderRadius: 14,
    paddingHorizontal: 14,
    fontSize: 13.5,
    color: '#1A2E1A',
  },
  sendButton: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: '#1E5E2B',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#1E5E2B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 2,
  },
  sendButtonInactive: {
    opacity: 0.85,
  },

  // Section Header
  sectionHeaderTitle: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#718274',
    letterSpacing: 0.8,
    marginBottom: 12,
  },

  // Feed Posts
  postCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#ECE8DD',
    padding: 14,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  postCardSelfHighlight: {
    borderColor: '#D4EED8',
  },
  postAuthorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  avatarCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  postAuthorTextWrap: {
    flex: 1,
  },
  postAuthorName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1A2E1A',
    marginBottom: 1,
  },
  postDate: {
    fontSize: 11.5,
    color: '#718274',
  },
  postBodyText: {
    fontSize: 13,
    color: '#374151',
    lineHeight: 19,
    marginBottom: 10,
  },
  postFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  postCommentsCount: {
    fontSize: 12,
    fontWeight: '600',
    color: '#718274',
  },
});
