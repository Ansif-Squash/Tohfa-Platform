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
import { authPalette as P } from '../../theme';

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

function PlayTriangleOutlineIcon({ size = 22, color = '#1E5E2B' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M8 5.14v13.72a1 1 0 001.55.83l11-6.86a1 1 0 000-1.66l-11-6.86A1 1 0 008 5.14z"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function PlayCircleMiniIcon({ size = 26, color = '#FFFFFF' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth="1.8" />
      <Path
        d="M10 8.5L16 12L10 15.5V8.5Z"
        fill={color}
      />
    </Svg>
  );
}

function VerifiedBadgeIcon({ size = 15, color = '#2E7D32' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2" />
      <Path
        d="M8 12.2L10.8 15L16.2 9.5"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
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

function BookOpenIcon({ size = 20, color = '#2E7D32' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
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

function CalendarCheckIcon({ size = 20, color = '#2E7D32' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="4" width="18" height="18" rx="2" stroke={color} strokeWidth="2" />
      <Path d="M16 2v4M8 2v4M3 10h18" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Path d="M9 16l2 2 4-4" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

// ── Types & Data ─────────────────────────────────────────────────────────────

type TabType = 'Videos' | 'Blog' | 'Groups' | 'Trainings';

interface VideoItem {
  id: string;
  title: string;
  author: string;
  date: string;
  duration: string;
  bgColor: string;
  isFeatured?: boolean;
  description?: string;
}

const FEATURED_VIDEO: VideoItem = {
  id: 'v-feat',
  title: 'Drip irrigation setup for terraced carrot beds',
  author: 'TOHFA Field Team',
  date: '20 Jul 2026',
  duration: '6:30',
  bgColor: '#1E5E2B',
  isFeatured: true,
  description:
    'A complete step-by-step field guide on laying drip emitter lines along slope contours in terraced vegetable plots to prevent erosion and achieve 40% water savings.',
};

const LATEST_VIDEOS: VideoItem[] = [
  {
    id: 'v-1',
    title: 'Making jeevamrut: 5-day fermentation',
    author: 'Muthu K.',
    date: '14 Jul 2026',
    duration: '8:15',
    bgColor: '#2E7D32',
    description:
      'Master the traditional formula for organic microbial bio-fertilizer using local cow dung, urine, jaggery, and pulse flour.',
  },
  {
    id: 'v-2',
    title: 'Neem oil spray — correct dilution',
    author: 'Dr. Anand',
    date: '09 Jul 2026',
    duration: '4:50',
    bgColor: '#6E8B2A',
    description:
      'Learn the precise oil-to-water ratio with natural soap emulsifier to protect cruciferous crops from whitefly and aphids without leaf burn.',
  },
  {
    id: 'v-3',
    title: 'Vermicompost bed maintenance',
    author: 'TOHFA Field Team',
    date: '02 Jul 2026',
    duration: '11:20',
    bgColor: '#85582E',
    description:
      'Techniques for regulating moisture levels, temperature checks, and gentle worm harvesting for high-potency organic castings.',
  },
  {
    id: 'v-4',
    title: 'Companion planting for pest defense',
    author: 'Kavitha R.',
    date: '28 Jun 2026',
    duration: '7:40',
    bgColor: '#1E5E2B',
    description:
      'Interplanting marigolds and basil alongside tomato rows to repel nematodes and attract beneficial pollinator insects.',
  },
];

interface BlogArticle {
  id: string;
  title: string;
  readTime: string;
  author: string;
  date: string;
  snippet: string;
  tag: string;
}

const BLOG_ARTICLES: BlogArticle[] = [
  {
    id: 'b-1',
    title: 'Organic pest management techniques for monsoon hill farming',
    readTime: '5 min read',
    author: 'Dr. Anand · TOHFA Agronomist',
    date: '18 Jul 2026',
    snippet:
      'Excessive humidity during rains increases fungal spores. Discover preventive biological foliar sprays to safeguard your cabbage and carrot crops.',
    tag: 'Pest Control',
  },
  {
    id: 'b-2',
    title: 'Soil organic carbon: How green manuring doubles your harvest quality',
    readTime: '4 min read',
    author: 'TOHFA Field Team',
    date: '11 Jul 2026',
    snippet:
      'Planting Sunn hemp and Dhaincha during short transition intervals replenishes root zone nitrogen naturally.',
    tag: 'Soil Health',
  },
  {
    id: 'b-3',
    title: 'Maximizing farmgate value with Grade 1 sorting standards',
    readTime: '6 min read',
    author: 'Priya Sundaram',
    date: '05 Jul 2026',
    snippet:
      'Simple post-harvest washing and sizing practices that guarantee top ceiling prices on the TOHFA Marketplace.',
    tag: 'Market Guide',
  },
];

interface FarmerGroup {
  id: string;
  name: string;
  membersCount: number;
  activity: string;
  category: string;
  isJoined?: boolean;
}

const INITIAL_GROUPS: FarmerGroup[] = [
  {
    id: 'g-1',
    name: 'Nilgiris Carrot Cultivators',
    membersCount: 142,
    activity: '12 messages today',
    category: 'Root Vegetables',
    isJoined: true,
  },
  {
    id: 'g-2',
    name: 'Organic Bio-Fertilizer Makers',
    membersCount: 89,
    activity: '5 messages today',
    category: 'Organic Inputs',
    isJoined: true,
  },
  {
    id: 'g-3',
    name: 'Terraced Drip & Irrigation Network',
    membersCount: 215,
    activity: '28 messages today',
    category: 'Water Tech',
    isJoined: false,
  },
  {
    id: 'g-4',
    name: 'Pesticide-Free Certification Circle',
    membersCount: 64,
    activity: '3 messages yesterday',
    category: 'Standards',
    isJoined: false,
  },
];

interface TrainingWorkshop {
  id: string;
  title: string;
  date: string;
  time: string;
  mode: 'In-Field' | 'Online Webinar';
  location: string;
  instructor: string;
  isRegistered?: boolean;
}

const INITIAL_TRAININGS: TrainingWorkshop[] = [
  {
    id: 't-1',
    title: 'Hands-on Terraced Drip Maintenance Workshop',
    date: '25 Jul 2026',
    time: '10:00 AM - 1:00 PM',
    mode: 'In-Field',
    location: 'TOHFA Model Farm, Ooty Zone 2',
    instructor: 'TOHFA Field Engineering Team',
    isRegistered: true,
  },
  {
    id: 't-2',
    title: 'Advanced Jeevamrut & Bio-formulations Masterclass',
    date: '01 Aug 2026',
    time: '2:30 PM - 4:00 PM',
    mode: 'Online Webinar',
    location: 'Interactive Live Session',
    instructor: 'Dr. Anand (Lead Agronomist)',
    isRegistered: false,
  },
  {
    id: 't-3',
    title: 'Audit Preparation & Digital Farm Diary Best Practices',
    date: '08 Aug 2026',
    time: '11:00 AM - 12:30 PM',
    mode: 'Online Webinar',
    location: 'Interactive Live Session',
    instructor: 'Meenakshi K. (Compliance Officer)',
    isRegistered: false,
  },
];

import { ContentDetailScreen, type ContentDetailItem, DEFAULT_CONTENT_DETAIL } from './ContentDetailScreen';
import { INITIAL_FARMER_GROUPS, type GroupItem } from './GroupsScreen';
import { GroupDetailScreen } from './GroupDetailScreen';

// ── Screen Component ─────────────────────────────────────────────────────────

interface LearningHubScreenProps {
  onBack: () => void;
  onNavigateToContentDetail?: (content: ContentDetailItem) => void;
  onNavigateToGroups?: () => void;
  onNavigateToGroupDetail?: (group: GroupItem) => void;
}

export function LearningHubScreen({
  onBack,
  onNavigateToContentDetail,
  onNavigateToGroups,
  onNavigateToGroupDetail,
}: LearningHubScreenProps): React.JSX.Element {
  const [activeTab, setActiveTab] = useState<TabType>('Videos');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeContentDetail, setActiveContentDetail] = useState<ContentDetailItem | null>(null);
  const [activeGroupDetail, setActiveGroupDetail] = useState<GroupItem | null>(null);
  const [selectedBlog, setSelectedBlog] = useState<BlogArticle | null>(null);
  const [groups, setGroups] = useState<GroupItem[]>(INITIAL_FARMER_GROUPS);
  const [trainings, setTrainings] = useState<TrainingWorkshop[]>(INITIAL_TRAININGS);

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

  const handleOpenVideo = (video: VideoItem) => {
    const detailItem: ContentDetailItem = {
      id: video.id,
      title: video.title,
      author: video.author,
      date: video.date,
      duration: video.duration,
      type: 'Video',
      bgColor: video.bgColor,
      paragraphs: video.id === 'v-feat' ? DEFAULT_CONTENT_DETAIL.paragraphs : [
        video.description ?? `A step-by-step practical demonstration of ${video.title.toLowerCase()} for hill and terraced farming plots.`,
        'Best paired with regular crop monitoring and standard bio-input application schedules.',
      ],
      likesCount: video.id === 'v-feat' ? 42 : 31,
      commentsCount: video.id === 'v-feat' ? 3 : 2,
    };

    if (onNavigateToContentDetail) {
      onNavigateToContentDetail(detailItem);
    } else {
      setActiveContentDetail(detailItem);
    }
  };

  if (activeContentDetail) {
    return (
      <ContentDetailScreen
        content={activeContentDetail}
        onBack={() => setActiveContentDetail(null)}
      />
    );
  }

  // Filter video list based on search query
  const filteredVideos = LATEST_VIDEOS.filter((v) =>
    v.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    v.author.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const isFeaturedMatch =
    FEATURED_VIDEO.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    FEATURED_VIDEO.author.toLowerCase().includes(searchQuery.toLowerCase());

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

  const toggleGroupJoin = (groupId: string) => {
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

  const toggleTrainingRegistration = (trainingId: string) => {
    setTrainings((prev) =>
      prev.map((t) => (t.id === trainingId ? { ...t, isRegistered: !t.isRegistered } : t))
    );
  };

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* ── Top Header Bar ── */}
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
          <Text style={styles.headerTitle}>Learning Hub</Text>
          <Text style={styles.headerSubtitle}>Tutorials & farmer groups</Text>
        </View>
      </View>

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
            placeholder={
              activeTab === 'Videos'
                ? 'Search videos...'
                : activeTab === 'Blog'
                ? 'Search articles...'
                : activeTab === 'Groups'
                ? 'Search farmer groups...'
                : 'Search workshops & trainings...'
            }
            placeholderTextColor="#8C9088"
            value={searchQuery}
            onChangeText={setSearchQuery}
            accessibilityLabel="Search learning content"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearSearchBtn}>
              <CloseIcon size={16} color="#8C9088" />
            </TouchableOpacity>
          )}
        </View>

        {/* ── Segmented Tabs Bar ── */}
        <View style={styles.tabBar}>
          {(['Videos', 'Blog', 'Groups', 'Trainings'] as TabType[]).map((tab) => {
            const isActive = activeTab === tab;
            return (
              <TouchableOpacity
                key={tab}
                style={[styles.tabItem, isActive && styles.tabItemActive]}
                onPress={() => setActiveTab(tab)}
                activeOpacity={0.7}
                accessibilityRole="tab"
                accessibilityState={{ selected: isActive }}
              >
                <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
                  {tab}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ── TAB 1: VIDEOS (Exact Design from Screenshot) ── */}
        {activeTab === 'Videos' && (
          <View>
            {/* Featured Video Card */}
            {isFeaturedMatch && (
              <TouchableOpacity
                style={styles.featuredCard}
                activeOpacity={0.92}
                onPress={() => handleOpenVideo(FEATURED_VIDEO)}
                accessibilityRole="button"
                accessibilityLabel={`Featured video: ${FEATURED_VIDEO.title}`}
              >
                {/* Banner Thumbnail */}
                <View style={[styles.featuredThumbnail, { backgroundColor: FEATURED_VIDEO.bgColor }]}>
                  {/* FEATURED Badge */}
                  <View style={styles.featuredBadge}>
                    <Text style={styles.featuredBadgeText}>FEATURED</Text>
                  </View>

                  {/* Play Button */}
                  <View style={styles.featuredPlayCircle}>
                    <PlayTriangleOutlineIcon size={24} color="#1E5E2B" />
                  </View>

                  {/* Duration Badge */}
                  <View style={styles.featuredDurationBadge}>
                    <Text style={styles.durationBadgeText}>{FEATURED_VIDEO.duration}</Text>
                  </View>
                </View>

                {/* Card Info Section */}
                <View style={styles.featuredInfo}>
                  <Text style={styles.featuredTitle}>{FEATURED_VIDEO.title}</Text>
                  <View style={styles.authorRow}>
                    <VerifiedBadgeIcon size={14} color="#2E7D32" />
                    <Text style={styles.authorText}>
                      {FEATURED_VIDEO.author} · {FEATURED_VIDEO.date}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            )}

            {/* Latest Videos Header */}
            <Text style={styles.sectionHeaderTitle}>LATEST VIDEOS</Text>

            {/* Latest Videos List */}
            {filteredVideos.map((video) => (
              <TouchableOpacity
                key={video.id}
                style={styles.videoCard}
                activeOpacity={0.88}
                onPress={() => handleOpenVideo(video)}
                accessibilityRole="button"
                accessibilityLabel={`Play video: ${video.title}`}
              >
                {/* Thumbnail */}
                <View style={[styles.videoThumbnail, { backgroundColor: video.bgColor }]}>
                  <PlayCircleMiniIcon size={24} color="#FFFFFF" />
                  <View style={styles.videoDurationBadge}>
                    <Text style={styles.videoDurationText}>{video.duration}</Text>
                  </View>
                </View>

                {/* Details */}
                <View style={styles.videoDetails}>
                  <Text style={styles.videoTitle} numberOfLines={2}>
                    {video.title}
                  </Text>
                  <Text style={styles.videoSubtitle}>
                    {video.author} · {video.date}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}

            {filteredVideos.length === 0 && !isFeaturedMatch && (
              <View style={styles.emptyStateContainer}>
                <Text style={styles.emptyStateTitle}>No videos found</Text>
                <Text style={styles.emptyStateSubtitle}>
                  Try searching for keywords like "irrigation", "jeevamrut", or "neem".
                </Text>
              </View>
            )}
          </View>
        )}

        {/* ── TAB 2: BLOG ── */}
        {activeTab === 'Blog' && (
          <View style={styles.tabContentContainer}>
            <Text style={styles.sectionHeaderTitle}>RECOMMENDED GUIDES</Text>
            {BLOG_ARTICLES.map((article) => (
              <TouchableOpacity
                key={article.id}
                style={styles.articleCard}
                activeOpacity={0.88}
                onPress={() => setSelectedBlog(article)}
              >
                <View style={styles.articleTagRow}>
                  <View style={styles.articleTagPill}>
                    <Text style={styles.articleTagText}>{article.tag}</Text>
                  </View>
                  <Text style={styles.articleReadTime}>{article.readTime}</Text>
                </View>
                <Text style={styles.articleTitle}>{article.title}</Text>
                <Text style={styles.articleSnippet} numberOfLines={2}>
                  {article.snippet}
                </Text>
                <View style={styles.articleFooter}>
                  <BookOpenIcon size={14} color="#2E7D32" />
                  <Text style={styles.articleAuthor}>
                    {article.author} · {article.date}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* ── TAB 3: GROUPS ── */}
        {activeTab === 'Groups' && (
          <View style={styles.tabContentContainer}>
            <Text style={styles.sectionHeaderTitle}>PEER DISCUSSION · {groups.length} GROUPS</Text>
            {groups.map((group) => (
              <TouchableOpacity
                key={group.id}
                style={styles.groupCard}
                onPress={() => handleOpenGroupDetail(group)}
                activeOpacity={0.88}
                accessibilityRole="button"
                accessibilityLabel={`${group.name}, ${group.membersCount} members`}
              >
                <View style={[styles.groupIconBox, { backgroundColor: group.iconBg }]}>
                  {renderGroupIcon(group)}
                </View>
                <View style={styles.groupDetails}>
                  <Text style={styles.groupName}>{group.name}</Text>
                  <Text style={styles.groupSubtitle}>{group.membersCount} members</Text>
                </View>
                {group.isJoined ? (
                  <TouchableOpacity
                    style={styles.joinedBadge}
                    onPress={() => toggleGroupJoin(group.id)}
                    activeOpacity={0.75}
                  >
                    <CheckmarkIcon size={12} color="#1E5E2B" />
                    <Text style={styles.joinedBadgeText}>Joined</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={styles.joinButton}
                    onPress={() => toggleGroupJoin(group.id)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.joinButtonText}>Join</Text>
                  </TouchableOpacity>
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* ── TAB 4: TRAININGS ── */}
        {activeTab === 'Trainings' && (
          <View style={styles.tabContentContainer}>
            <Text style={styles.sectionHeaderTitle}>UPCOMING WORKSHOPS & WEBINARS</Text>
            {trainings.map((training) => (
              <View key={training.id} style={styles.trainingCard}>
                <View style={styles.trainingTopRow}>
                  <View
                    style={[
                      styles.trainingModePill,
                      training.mode === 'Online Webinar' && styles.trainingModeOnline,
                    ]}
                  >
                    <Text
                      style={[
                        styles.trainingModeText,
                        training.mode === 'Online Webinar' && styles.trainingModeTextOnline,
                      ]}
                    >
                      {training.mode}
                    </Text>
                  </View>
                  <Text style={styles.trainingDate}>{training.date}</Text>
                </View>
                <Text style={styles.trainingTitle}>{training.title}</Text>
                <View style={styles.trainingDetailRow}>
                  <CalendarCheckIcon size={14} color="#6B7280" />
                  <Text style={styles.trainingDetailText}>{training.time}</Text>
                </View>
                <Text style={styles.trainingLocationText}>📍 {training.location}</Text>
                <Text style={styles.trainingInstructorText}>👨‍🌾 Instructor: {training.instructor}</Text>

                <TouchableOpacity
                  style={[
                    styles.trainingRegisterBtn,
                    training.isRegistered && styles.trainingRegisteredBtn,
                  ]}
                  onPress={() => toggleTrainingRegistration(training.id)}
                  activeOpacity={0.85}
                >
                  <Text
                    style={[
                      styles.trainingRegisterBtnText,
                      training.isRegistered && styles.trainingRegisteredBtnText,
                    ]}
                  >
                    {training.isRegistered ? '✓ Registered' : 'Register for Session'}
                  </Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {/* Bottom spacer */}
        <View style={{ height: 40 }} />
      </ScrollView>

      {/* ── BLOG ARTICLE MODAL ── */}
      <Modal visible={selectedBlog !== null} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.blogReaderCard}>
            <View style={styles.playerHeader}>
              <Text style={styles.playerHeaderTitle}>Field Article</Text>
              <TouchableOpacity
                style={styles.modalCloseCircle}
                onPress={() => setSelectedBlog(null)}
              >
                <CloseIcon size={18} color="#374151" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.blogReaderScroll} showsVerticalScrollIndicator={false}>
              <View style={styles.articleTagPill}>
                <Text style={styles.articleTagText}>{selectedBlog?.tag}</Text>
              </View>
              <Text style={styles.blogReaderTitle}>{selectedBlog?.title}</Text>
              <Text style={styles.blogReaderMeta}>
                By {selectedBlog?.author} · {selectedBlog?.date} · {selectedBlog?.readTime}
              </Text>

              <View style={styles.blogContentDivider} />

              <Text style={styles.blogParagraph}>{selectedBlog?.snippet}</Text>
              <Text style={styles.blogParagraph}>
                Sustainable farming begins with observing the natural ecosystem of your field. By reducing chemical interventions and reinforcing biological balances, soil resilience against climate stress increases significantly season over season.
              </Text>
              <Text style={styles.blogParagraph}>
                Always record each intervention in your TOHFA Farm Diary to ensure full compliance for your annual organic audits and premium marketplace pricing.
              </Text>
            </ScrollView>
          </View>
        </View>
      </Modal>
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

  // Scroll View
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 6,
    paddingBottom: 30,
  },

  // Search Bar
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3EFE6',
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 46,
    marginBottom: 14,
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

  // Segmented Tabs Bar
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#F3EFE6',
    borderRadius: 22,
    padding: 3,
    marginBottom: 18,
  },
  tabItem: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 19,
  },
  tabItemActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 3,
    elevation: 2,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
  },
  tabTextActive: {
    color: '#1A2E1A',
    fontWeight: '800',
  },

  // Featured Video Card
  featuredCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#ECE8DD',
    overflow: 'hidden',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  featuredThumbnail: {
    height: 185,
    width: '100%',
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  featuredBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  featuredBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  featuredPlayCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    paddingLeft: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 6,
  },
  featuredDurationBadge: {
    position: 'absolute',
    bottom: 10,
    right: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 5,
  },
  durationBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  featuredInfo: {
    padding: 16,
  },
  featuredTitle: {
    fontSize: 15.5,
    fontWeight: '800',
    color: '#1A2E1A',
    lineHeight: 21,
    marginBottom: 6,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  authorText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#718274',
  },

  // Section Headers
  sectionHeaderTitle: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#718274',
    letterSpacing: 0.8,
    marginTop: 8,
    marginBottom: 12,
  },

  // Latest Videos List Items
  videoCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#ECE8DD',
    padding: 12,
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  videoThumbnail: {
    width: 82,
    height: 58,
    borderRadius: 10,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoDurationBadge: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
  },
  videoDurationText: {
    color: '#FFFFFF',
    fontSize: 9.5,
    fontWeight: '700',
  },
  videoDetails: {
    flex: 1,
    justifyContent: 'center',
  },
  videoTitle: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#1A2E1A',
    lineHeight: 18,
    marginBottom: 4,
  },
  videoSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    color: '#718274',
  },

  // Empty State
  emptyStateContainer: {
    padding: 30,
    alignItems: 'center',
  },
  emptyStateTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A2E1A',
    marginBottom: 4,
  },
  emptyStateSubtitle: {
    fontSize: 13,
    color: '#718274',
    textAlign: 'center',
  },

  // Tab Content Container
  tabContentContainer: {
    paddingTop: 4,
  },

  // Blog Tab
  articleCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#ECE8DD',
    padding: 16,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  articleTagRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  articleTagPill: {
    backgroundColor: '#EAF3DE',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  articleTagText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2E7D32',
  },
  articleReadTime: {
    fontSize: 11.5,
    color: '#8C9088',
  },
  articleTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1A2E1A',
    lineHeight: 20,
    marginBottom: 6,
  },
  articleSnippet: {
    fontSize: 12.5,
    color: '#4B5563',
    lineHeight: 18,
    marginBottom: 10,
  },
  articleFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  articleAuthor: {
    fontSize: 11.5,
    color: '#718274',
  },

  // Groups Tab
  groupCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#ECE8DD',
    padding: 14,
    marginBottom: 12,
    gap: 12,
  },
  groupIconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#EAF3DE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  groupDetails: {
    flex: 1,
  },
  groupName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1A2E1A',
    marginBottom: 2,
  },
  groupSubtitle: {
    fontSize: 12,
    color: '#718274',
  },
  groupActionBtn: {
    backgroundColor: '#2E7D32',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 14,
  },
  groupActionBtnJoined: {
    backgroundColor: '#F3EFE6',
  },
  groupActionBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  groupActionBtnTextJoined: {
    color: '#2E7D32',
  },

  // Trainings Tab
  trainingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#ECE8DD',
    padding: 16,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  trainingTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  trainingModePill: {
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  trainingModeOnline: {
    backgroundColor: '#DBEAFE',
  },
  trainingModeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#065F46',
  },
  trainingModeTextOnline: {
    color: '#1E40AF',
  },
  trainingDate: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1E5E2B',
  },
  trainingTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1A2E1A',
    lineHeight: 20,
    marginBottom: 8,
  },
  trainingDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  trainingDetailText: {
    fontSize: 12,
    color: '#4B5563',
  },
  trainingLocationText: {
    fontSize: 12,
    color: '#4B5563',
    marginBottom: 4,
  },
  trainingInstructorText: {
    fontSize: 12,
    color: '#374151',
    fontWeight: '500',
    marginBottom: 12,
  },
  trainingRegisterBtn: {
    backgroundColor: '#2E7D32',
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
  },
  trainingRegisteredBtn: {
    backgroundColor: '#EAF3DE',
  },
  trainingRegisterBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  trainingRegisteredBtnText: {
    color: '#2E7D32',
  },

  // Video Player Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  videoPlayerCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    maxHeight: '90%',
    paddingBottom: 24,
  },
  playerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  playerHeaderTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1A2E1A',
  },
  modalCloseCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playerScreen: {
    height: 210,
    width: '100%',
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playerCenterPlayBtn: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playerControlsBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: 'rgba(0,0,0,0.4)',
    gap: 8,
  },
  playerTimeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
  },
  playerProgressTrack: {
    flex: 1,
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  playerProgressFill: {
    width: '35%',
    height: '100%',
    backgroundColor: '#4ADE80',
  },
  playerHdBadge: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
    backgroundColor: 'rgba(0,0,0,0.4)',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 3,
  },
  playerInfoScroll: {
    padding: 18,
  },
  playerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#1A2E1A',
    lineHeight: 23,
    marginBottom: 6,
  },
  playerAuthorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 14,
  },
  playerAuthorText: {
    fontSize: 12.5,
    color: '#718274',
    fontWeight: '500',
  },
  playerDescLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1A2E1A',
    marginBottom: 4,
  },
  playerDescText: {
    fontSize: 13,
    color: '#4B5563',
    lineHeight: 19,
    marginBottom: 14,
  },
  takeawayBox: {
    backgroundColor: '#F3EFE6',
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
  },
  takeawayTitle: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#1A2E1A',
    marginBottom: 4,
  },
  takeawayText: {
    fontSize: 12,
    color: '#4B5563',
    lineHeight: 17,
  },

  // Blog Reader Modal
  blogReaderCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    maxHeight: '90%',
    paddingBottom: 24,
  },
  blogReaderScroll: {
    padding: 20,
  },
  blogReaderTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1A2E1A',
    lineHeight: 24,
    marginTop: 10,
    marginBottom: 8,
  },
  blogReaderMeta: {
    fontSize: 12,
    color: '#718274',
    marginBottom: 14,
  },
  blogContentDivider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginBottom: 14,
  },
  blogParagraph: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 22,
    marginBottom: 14,
  },
});
