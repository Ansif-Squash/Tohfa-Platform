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

// ── SVG Icons ────────────────────────────────────────────────────────────────

function ArrowBackIcon({ size = 20, color = '#FFFFFF' }: { size?: number; color?: string }) {
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

function BookmarkIcon({ size = 18, color = '#FFFFFF', isSaved = false }: { size?: number; color?: string; isSaved?: boolean }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={isSaved ? color : 'none'}>
      <Path
        d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function PlayTriangleOutlineIcon({ size = 24, color = '#1E5E2B' }: { size?: number; color?: string }) {
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

function VideoCameraPillIcon({ size = 14, color = '#2E7D32' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="2" y="4" width="15" height="16" rx="3" stroke={color} strokeWidth="2" />
      <Path d="M17 9.5l5-3.5v12l-5-3.5v-5z" stroke={color} strokeWidth="2" strokeLinejoin="round" />
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

function HeartIcon({ size = 18, color = '#EF4444', isFilled = false }: { size?: number; color?: string; isFilled?: boolean }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={isFilled ? color : 'none'}>
      <Path
        d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function CommentBubbleIcon({ size = 18, color = '#4B5563' }: { size?: number; color?: string }) {
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

function PlayCircleMiniIcon({ size = 26, color = '#FFFFFF' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth="1.8" />
      <Path d="M10 8.5L16 12L10 15.5V8.5Z" fill={color} />
    </Svg>
  );
}

function SendPlaneIcon({ size = 20, color = '#FFFFFF' }: { size?: number; color?: string }) {
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

// ── Types ────────────────────────────────────────────────────────────────────

export interface ContentDetailItem {
  id: string;
  title: string;
  author: string;
  date: string;
  duration: string;
  type?: 'Video' | 'Article' | undefined;
  bgColor?: string | undefined;
  paragraphs?: string[] | undefined;
  likesCount?: number | undefined;
  commentsCount?: number | undefined;
}

export const DEFAULT_CONTENT_DETAIL: ContentDetailItem = {
  id: 'v-feat',
  title: 'Drip irrigation setup for terraced carrot beds',
  author: 'TOHFA Field Team',
  date: '20 Jul 2026',
  duration: '6:30',
  type: 'Video',
  bgColor: '#1E5E2B',
  paragraphs: [
    'A step-by-step walkthrough of laying drip lines across sloped carrot terraces so every bed gets even moisture without runoff. Covers emitter spacing for the Nilgiris’ clay-loam soils, main-line pressure, and how to schedule cycles around the afternoon mist.',
    'Best paired with the jeevamrut fertigation routine — inject bio-inputs through the same line once the beds are established.',
  ],
  likesCount: 42,
  commentsCount: 3,
};

interface RelatedContentItem {
  id: string;
  title: string;
  author: string;
  type: string;
  bgColor: string;
  duration: string;
}

const RELATED_CONTENT: RelatedContentItem[] = [
  {
    id: 'v-1',
    title: 'Making jeevamrut: 5-day fermentation',
    author: 'Muthu K.',
    type: 'Video',
    bgColor: '#2E7D32',
    duration: '8:15',
  },
  {
    id: 'v-2',
    title: 'Neem oil spray — correct dilution',
    author: 'Dr. Anand',
    type: 'Video',
    bgColor: '#6E8B2A',
    duration: '4:50',
  },
  {
    id: 'v-3',
    title: 'Vermicompost bed maintenance',
    author: 'TOHFA Field Team',
    type: 'Video',
    bgColor: '#85582E',
    duration: '11:20',
  },
];

interface ContentDetailScreenProps {
  content?: ContentDetailItem | undefined;
  onBack: () => void;
  onSelectRelated?: ((item: RelatedContentItem) => void) | undefined;
}

export function ContentDetailScreen({
  content = DEFAULT_CONTENT_DETAIL,
  onBack,
  onSelectRelated,
}: ContentDetailScreenProps): React.JSX.Element {
  const [currentContent, setCurrentContent] = useState<ContentDetailItem>(content ?? DEFAULT_CONTENT_DETAIL);
  const [isSaved, setIsSaved] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(content?.likesCount ?? 42);
  const [commentsCount, setCommentsCount] = useState(content?.commentsCount ?? 3);
  const [commentText, setCommentText] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [commentsList, setCommentsList] = useState<string[]>([
    'Muthu K: What emitter spacing do you recommend for standard 1.2m beds?',
    'TOHFA Team: 20cm inline drippers work best for the loose topsoil layer.',
    'Ramesh G: Excellent clear demonstration on the slope pressure regulator.',
  ]);

  const handleToggleLike = () => {
    if (isLiked) {
      setIsLiked(false);
      setLikesCount((prev) => prev - 1);
    } else {
      setIsLiked(true);
      setLikesCount((prev) => prev + 1);
    }
  };

  const handleToggleSave = () => {
    setIsSaved(!isSaved);
  };

  const handleSendComment = () => {
    if (!commentText.trim()) return;
    setCommentsList((prev) => [...prev, `You: ${commentText.trim()}`]);
    setCommentsCount((prev) => prev + 1);
    setCommentText('');
  };

  const handleSelectRelatedItem = (item: RelatedContentItem) => {
    if (onSelectRelated) {
      onSelectRelated(item);
    } else {
      setCurrentContent({
        id: item.id,
        title: item.title,
        author: item.author,
        date: '14 Jul 2026',
        duration: item.duration,
        type: 'Video',
        bgColor: item.bgColor,
        paragraphs: [
          `Full practical instructional demonstration for ${item.title.toLowerCase()}. Follow each guideline to ensure safe handling, optimal dosage, and standard compliant practices.`,
          'Certified organic methods ensure higher quality yields and compliance for marketplace Grade 1 pricing.',
        ],
        likesCount: 28,
        commentsCount: 2,
      });
      setIsLiked(false);
      setLikesCount(28);
      setCommentsCount(2);
    }
  };

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar barStyle="light-content" backgroundColor="#1E5E2B" />

      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* ── Top Hero Video Section ── */}
          <View style={[styles.videoHero, { backgroundColor: currentContent.bgColor ?? '#1E5E2B' }]}>
            {/* Top Navigation Bar Overlay */}
            <View style={styles.heroNavBar}>
              <TouchableOpacity
                style={styles.heroCircleButton}
                onPress={onBack}
                activeOpacity={0.75}
                accessibilityRole="button"
                accessibilityLabel="Go back"
              >
                <ArrowBackIcon size={18} color="#FFFFFF" />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.heroCircleButton}
                onPress={handleToggleSave}
                activeOpacity={0.75}
                accessibilityRole="button"
                accessibilityLabel="Bookmark video"
              >
                <BookmarkIcon size={18} color="#FFFFFF" isSaved={isSaved} />
              </TouchableOpacity>
            </View>

            {/* Center Play Button */}
            <TouchableOpacity
              style={styles.centerPlayCircle}
              onPress={() => setIsPlaying(!isPlaying)}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel="Play video"
            >
              <PlayTriangleOutlineIcon size={26} color="#1E5E2B" />
            </TouchableOpacity>

            {/* Bottom Right Duration Badge */}
            <View style={styles.durationBadge}>
              <Text style={styles.durationText}>{currentContent.duration}</Text>
            </View>
          </View>

          {/* ── Content Details Body ── */}
          <View style={styles.bodyContent}>
            {/* Video Type Pill */}
            <View style={styles.typePill}>
              <VideoCameraPillIcon size={14} color="#2E7D32" />
              <Text style={styles.typePillText}>{currentContent.type ?? 'Video'}</Text>
            </View>

            {/* Title */}
            <Text style={styles.titleText}>{currentContent.title}</Text>

            {/* Author & Date */}
            <View style={styles.authorRow}>
              <VerifiedBadgeIcon size={15} color="#2E7D32" />
              <Text style={styles.authorText}>
                {currentContent.author} · {currentContent.date}
              </Text>
            </View>

            {/* Paragraphs */}
            {(currentContent.paragraphs ?? DEFAULT_CONTENT_DETAIL.paragraphs ?? []).map((p, idx) => (
              <Text key={idx} style={styles.paragraphText}>
                {p}
              </Text>
            ))}

            {/* ── Likes & Comments Reactions Row ── */}
            <View style={styles.reactionsRow}>
              {/* Like Pill */}
              <TouchableOpacity
                style={[styles.reactionPill, styles.likePill, isLiked && styles.likePillActive]}
                onPress={handleToggleLike}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityLabel="Like content"
              >
                <HeartIcon size={18} color="#E0533C" isFilled={isLiked} />
                <Text style={styles.likeCountText}>{likesCount}</Text>
              </TouchableOpacity>

              {/* Comment Pill */}
              <TouchableOpacity
                style={[styles.reactionPill, styles.commentPill]}
                onPress={() => setShowComments(!showComments)}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityLabel="View comments"
              >
                <CommentBubbleIcon size={18} color="#4B5563" />
                <Text style={styles.commentCountText}>{commentsCount}</Text>
              </TouchableOpacity>
            </View>

            {/* Expanded Comments List if toggled */}
            {showComments && (
              <View style={styles.commentsExpandedBox}>
                <Text style={styles.commentsHeaderTitle}>Discussion ({commentsList.length})</Text>
                {commentsList.map((comm, idx) => (
                  <View key={idx} style={styles.commentItem}>
                    <Text style={styles.commentItemText}>{comm}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* ── RELATED CONTENT Section ── */}
            <Text style={styles.sectionHeaderTitle}>RELATED CONTENT</Text>

            {RELATED_CONTENT.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.relatedCard}
                activeOpacity={0.88}
                onPress={() => handleSelectRelatedItem(item)}
                accessibilityRole="button"
                accessibilityLabel={`Open related content: ${item.title}`}
              >
                {/* Thumbnail */}
                <View style={[styles.relatedThumbnail, { backgroundColor: item.bgColor }]}>
                  <PlayCircleMiniIcon size={24} color="#FFFFFF" />
                </View>

                {/* Info */}
                <View style={styles.relatedInfo}>
                  <Text style={styles.relatedTitle} numberOfLines={2}>
                    {item.title}
                  </Text>
                  <Text style={styles.relatedSubtitle}>
                    {item.type} · {item.author}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}

            {/* Spacer for bottom bar */}
            <View style={{ height: 24 }} />
          </View>
        </ScrollView>

        {/* ── Sticky Bottom Comment Bar ── */}
        <View style={styles.bottomCommentBar}>
          <TextInput
            style={styles.commentInput}
            placeholder="Add a comment..."
            placeholderTextColor="#8C9088"
            value={commentText}
            onChangeText={setCommentText}
            accessibilityLabel="Add a comment"
          />
          <TouchableOpacity
            style={[styles.sendButton, !commentText.trim() && styles.sendButtonInactive]}
            onPress={handleSendComment}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel="Send comment"
          >
            <SendPlaneIcon size={18} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },

  // Hero Video Section
  videoHero: {
    height: 250,
    width: '100%',
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroNavBar: {
    position: 'absolute',
    top: 14,
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 10,
  },
  heroCircleButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerPlayCircle: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    paddingLeft: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  durationBadge: {
    position: 'absolute',
    bottom: 12,
    right: 14,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  durationText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },

  // Body Content
  bodyContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  typePill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#EAF3DE',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 6,
    marginBottom: 10,
  },
  typePillText: {
    color: '#2E7D32',
    fontSize: 12,
    fontWeight: '700',
  },
  titleText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1A2E1A',
    lineHeight: 27,
    letterSpacing: -0.2,
    marginBottom: 8,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 14,
  },
  authorText: {
    fontSize: 12.5,
    fontWeight: '500',
    color: '#718274',
  },
  paragraphText: {
    fontSize: 13.5,
    color: '#4B5563',
    lineHeight: 20.5,
    marginBottom: 12,
  },

  // Reactions Row
  reactionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 6,
    marginBottom: 16,
  },
  reactionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  likePill: {
    backgroundColor: '#FDECE8',
    borderWidth: 1,
    borderColor: '#FCD8D0',
  },
  likePillActive: {
    backgroundColor: '#FBD8D0',
  },
  likeCountText: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#E0533C',
  },
  commentPill: {
    backgroundColor: '#F3EFE6',
    borderWidth: 1,
    borderColor: '#ECE8DD',
  },
  commentCountText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#374151',
  },

  // Comments Box
  commentsExpandedBox: {
    backgroundColor: '#F9F8F5',
    borderRadius: 14,
    padding: 14,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: '#ECE8DD',
  },
  commentsHeaderTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1A2E1A',
    marginBottom: 8,
  },
  commentItem: {
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#F0ECE1',
  },
  commentItemText: {
    fontSize: 12.5,
    color: '#4B5563',
    lineHeight: 18,
  },

  // Section Header Title
  sectionHeaderTitle: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#718274',
    letterSpacing: 0.8,
    marginTop: 10,
    marginBottom: 12,
  },

  // Related Content Card
  relatedCard: {
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
  relatedThumbnail: {
    width: 82,
    height: 58,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  relatedInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  relatedTitle: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#1A2E1A',
    lineHeight: 18,
    marginBottom: 4,
  },
  relatedSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    color: '#718274',
  },

  // Bottom Comment Bar
  bottomCommentBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F0ECE1',
    gap: 10,
  },
  commentInput: {
    flex: 1,
    height: 44,
    backgroundColor: '#F3EFE6',
    borderRadius: 22,
    paddingHorizontal: 16,
    fontSize: 13.5,
    color: '#1A2E1A',
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
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
});
