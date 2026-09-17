import React, { useEffect } from 'react';
import {
  BackHandler,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Circle, Line, Path } from 'react-native-svg';
import { authPalette as P } from '../../theme';
import { localProduceCropsCache, type CropItem } from './ProduceCalendarScreen';

// ─────────────────────────────────────────────
// Vector Icons (Strictly no emojis, theme tokens only)
// ─────────────────────────────────────────────

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

function DropletIcon({ size = 20, color = P.white }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function PestIcon({ size = 20, color = P.white }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="5.5" stroke={color} strokeWidth="2" />
      <Path
        d="M12 6.5V3M6.5 12H3M21 12h-3.5M6.8 6.8L4.5 4.5M19.5 4.5l-2.3 2.3M6.8 17.2l-2.3 2.3M19.5 19.5l-2.3-2.3"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
      />
    </Svg>
  );
}

function ArrowRightIcon({ size = 15, color = P.white }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M5 12h14M13 6l6 6-6 6"
        stroke={color}
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function OrganicSproutIcon({ size = 22, color = P.forestGreen }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 21V12M12 12C12 7.5 8 4.5 4 4.5c0 5.5 3.5 9.5 8 9.5zM12 12c0-4 3.5-7.5 8-7.5 0 5-3.5 8.5-8 8.5z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function FlaskIcon({ size = 22, color = P.forestGreen }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M10 3v4.5L5 18a2 2 0 0 0 1.7 3h10.6a2 2 0 0 0 1.7-3L14 7.5V3"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Line x1="8.5" y1="3" x2="15.5" y2="3" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="7" y1="15.5" x2="17" y2="15.5" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </Svg>
  );
}

function LeafIcon({ size = 22, color = P.forestGreen }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M11 20A7 7 0 0 1 4 13C4 7 11 3 20 3c0 9-4 16-9 17Z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M4 13c5 0 9 4 9 7"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function SeedlingIcon({ size = 22, color = P.forestGreen }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 11v10M12 11a4.5 4.5 0 0 1-4.5-4.5c3.5 0 4.5 2.5 4.5 4.5zM12 14.5a4.5 4.5 0 0 0 4.5-4.5c-3.5 0-4.5 2.5-4.5 4.5z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M4 21h16" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function HistoryRotateIcon({ size = 18, color = P.forestGreen }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M3 3v5h5"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M12 7v5l3 3"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// ─────────────────────────────────────────────
// Types & Props
// ─────────────────────────────────────────────

export interface InputManagementScreenProps {
  onBack?: (() => void) | undefined;
  onNavigateToLogInput?: ((crop?: CropItem | null | undefined, inputType?: ('Fertigation' | 'Pest Treatment') | undefined) => void) | undefined;
  onNavigateToLogFertigation?: ((crop?: CropItem | null | undefined) => void) | undefined;
  onNavigateToLogPestTreatment?: ((crop?: CropItem | null | undefined) => void) | undefined;
  onNavigateToFullHistory?: (() => void) | undefined;
}

interface RecentApplicationItem {
  id: string;
  name: string;
  cropName: string;
  date: string;
  category: 'Fertigation' | 'Pest treatment';
  cost: string;
  badgeType: 'organic' | 'pest' | 'flask' | 'leaf' | 'seedling';
}

const RECENT_APPLICATIONS: RecentApplicationItem[] = [
  {
    id: 'rec_1',
    name: 'Vermicompost',
    cropName: 'Carrot',
    date: '12 Jul',
    category: 'Fertigation',
    cost: '₹720',
    badgeType: 'organic',
  },
  {
    id: 'rec_2',
    name: 'Neem oil spray',
    cropName: 'Cabbage',
    date: '8 Jul',
    category: 'Pest treatment',
    cost: '₹340',
    badgeType: 'pest',
  },
  {
    id: 'rec_3',
    name: 'Panchagavya',
    cropName: 'Carrot',
    date: '28 Jun',
    category: 'Fertigation',
    cost: '₹640',
    badgeType: 'flask',
  },
  {
    id: 'rec_4',
    name: 'Trichoderma drench',
    cropName: 'Tomato',
    date: '20 Jun',
    category: 'Fertigation',
    cost: '₹450',
    badgeType: 'leaf',
  },
  {
    id: 'rec_5',
    name: 'Bone meal',
    cropName: 'Carrot',
    date: '10 Jun',
    category: 'Fertigation',
    cost: '₹525',
    badgeType: 'seedling',
  },
];

export function InputManagementScreen({
  onBack,
  onNavigateToLogInput,
  onNavigateToLogFertigation,
  onNavigateToLogPestTreatment,
  onNavigateToFullHistory,
}: InputManagementScreenProps): React.JSX.Element {
  // Android hardware back handler
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (onBack) {
        onBack();
        return true;
      }
      return false;
    });
    return () => sub.remove();
  }, [onBack]);

  const handleLogFertigation = () => {
    const carrotCrop =
      localProduceCropsCache.find((c) => c.name.toLowerCase().includes('carrot')) ??
      localProduceCropsCache[0] ??
      null;
    if (onNavigateToLogFertigation) {
      onNavigateToLogFertigation(carrotCrop);
    } else if (onNavigateToLogInput) {
      onNavigateToLogInput(carrotCrop, 'Fertigation');
    }
  };

  const handleLogPestMgmt = () => {
    const tomatoCrop =
      localProduceCropsCache.find((c) => c.name.toLowerCase().includes('tomato')) ??
      localProduceCropsCache[1] ??
      null;
    if (onNavigateToLogPestTreatment) {
      onNavigateToLogPestTreatment(tomatoCrop);
    } else if (onNavigateToLogInput) {
      onNavigateToLogInput(tomatoCrop, 'Pest Treatment');
    }
  };

  const renderBadgeIcon = (type: RecentApplicationItem['badgeType']) => {
    switch (type) {
      case 'organic':
        return <OrganicSproutIcon size={20} color={P.forestGreen} />;
      case 'pest':
        return <PestIcon size={20} color={P.deepPurple600} />;
      case 'flask':
        return <FlaskIcon size={20} color={P.forestGreen} />;
      case 'leaf':
        return <LeafIcon size={20} color={P.forestGreen} />;
      case 'seedling':
        return <SeedlingIcon size={20} color={P.forestGreen} />;
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={P.white} />

      {/* Top Header Bar */}
      <View style={styles.headerBar}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={onBack}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <ArrowBackIcon size={20} color={P.deepGreen} />
        </TouchableOpacity>

        <View style={styles.headerTextGroup}>
          <Text style={styles.headerTag}>FR-F05</Text>
          <Text style={styles.headerTitle}>Input Management</Text>
          <Text style={styles.headerSubtitle}>Fertigation & pest treatments</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* 2-Column Action Cards */}
        <View style={styles.topCardsRow}>
          {/* Card 1: Fertigation */}
          <TouchableOpacity
            style={[styles.topCard, { backgroundColor: P.forestGreen }]}
            onPress={handleLogFertigation}
            activeOpacity={0.88}
            accessibilityRole="button"
            accessibilityLabel="Fertigation, Log a nutrient application"
          >
            <View style={styles.cardIconCircle}>
              <DropletIcon size={20} color={P.white} />
            </View>
            <Text style={styles.cardTitle}>Fertigation</Text>
            <Text style={styles.cardSubtitle}>Log a nutrient{'\n'}application</Text>
            <View style={styles.cardActionRow}>
              <Text style={styles.cardActionText}>Log now</Text>
              <ArrowRightIcon size={15} color={P.white} />
            </View>
          </TouchableOpacity>

          {/* Card 2: Pest Mgmt */}
          <TouchableOpacity
            style={[styles.topCard, { backgroundColor: P.deepPurple600 }]}
            onPress={handleLogPestMgmt}
            activeOpacity={0.88}
            accessibilityRole="button"
            accessibilityLabel="Pest Mgmt, Log a pest treatment"
          >
            <View style={styles.cardIconCircle}>
              <PestIcon size={20} color={P.white} />
            </View>
            <Text style={styles.cardTitle}>Pest Mgmt</Text>
            <Text style={styles.cardSubtitle}>Log a pest treatment</Text>
            <View style={styles.cardActionRow}>
              <Text style={styles.cardActionText}>Log now</Text>
              <ArrowRightIcon size={15} color={P.white} />
            </View>
          </TouchableOpacity>
        </View>

        {/* Section: UPCOMING REMINDERS */}
        <View style={styles.sectionHeaderWrap}>
          <Text style={styles.sectionTitle}>UPCOMING REMINDERS</Text>
        </View>

        <View style={styles.remindersList}>
          {/* Reminder 1: Fertigation due — Carrot */}
          <View style={styles.reminderCard}>
            <View style={[styles.reminderIconBadge, { backgroundColor: P.mintTintBg }]}>
              <OrganicSproutIcon size={22} color={P.forestGreen} />
            </View>

            <View style={styles.reminderInfo}>
              <Text style={styles.reminderTitle}>Fertigation due — Carrot</Text>
              <Text style={styles.reminderSubtitleOrange}>
                Zone 1 — Upper Field ·{' '}
                <Text style={styles.reminderOverdueText}>overdue 1 day</Text>
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.reminderLogBtn, { backgroundColor: P.forestGreen }]}
              onPress={handleLogFertigation}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel="Log now for Carrot"
            >
              <Text style={styles.reminderLogBtnText}>Log now</Text>
            </TouchableOpacity>
          </View>

          {/* Reminder 2: Pest check due — Tomato */}
          <View style={styles.reminderCard}>
            <View style={[styles.reminderIconBadge, { backgroundColor: P.twPurple100 }]}>
              <PestIcon size={20} color={P.deepPurple600} />
            </View>

            <View style={styles.reminderInfo}>
              <Text style={styles.reminderTitle}>Pest check due — Tomato</Text>
              <Text style={styles.reminderSubtitleGray}>
                Zone 2 — Lower Slope · due today
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.reminderLogBtn, { backgroundColor: P.deepPurple600 }]}
              onPress={handleLogPestMgmt}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel="Log now for Tomato"
            >
              <Text style={styles.reminderLogBtnText}>Log now</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Section: RECENT APPLICATIONS */}
        <View style={styles.recentHeaderRow}>
          <Text style={styles.sectionTitle}>RECENT APPLICATIONS</Text>
          <TouchableOpacity
            onPress={onNavigateToFullHistory}
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityRole="button"
            accessibilityLabel="Full history"
          >
            <Text style={styles.fullHistoryLink}>Full history</Text>
          </TouchableOpacity>
        </View>

        {/* List of Recent Applications */}
        <View style={styles.recentListCard}>
          {RECENT_APPLICATIONS.map((item, index) => {
            const isLast = index === RECENT_APPLICATIONS.length - 1;
            const isPest = item.badgeType === 'pest';
            return (
              <View
                key={item.id}
                style={[styles.recentItemRow, !isLast && styles.recentItemBorder]}
              >
                <View
                  style={[
                    styles.recentIconBadge,
                    { backgroundColor: isPest ? P.twPurple100 : P.mintTintBg },
                  ]}
                >
                  {renderBadgeIcon(item.badgeType)}
                </View>

                <View style={styles.recentInfoCol}>
                  <Text style={styles.recentItemTitle}>
                    {item.name} · {item.cropName}
                  </Text>
                  <Text style={styles.recentItemSubtitle}>
                    {item.date} · {item.category}
                  </Text>
                </View>

                <Text style={styles.recentItemCost}>{item.cost}</Text>
              </View>
            );
          })}
        </View>

        {/* Bottom Button: View full history */}
        <TouchableOpacity
          style={styles.viewFullHistoryBtn}
          onPress={onNavigateToFullHistory}
          activeOpacity={0.75}
          accessibilityRole="button"
          accessibilityLabel="View full history"
        >
          <HistoryRotateIcon size={18} color={P.forestGreen} />
          <Text style={styles.viewFullHistoryBtnText}>View full history</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: P.white,
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 6 : 4,
    paddingBottom: 10,
    backgroundColor: P.white,
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
  headerTextGroup: {
    flex: 1,
    justifyContent: 'center',
  },
  headerTag: {
    fontSize: 11,
    fontWeight: '700',
    color: P.slate400,
    letterSpacing: 0.5,
    marginBottom: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: P.twGray900,
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 13,
    color: P.twGray500,
    marginTop: 1,
  },
  scrollView: {
    flex: 1,
    backgroundColor: P.white,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  topCardsRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginTop: 10,
    gap: 12,
  },
  topCard: {
    flex: 1,
    borderRadius: 18,
    padding: 16,
    minHeight: 145,
    justifyContent: 'space-between',
    shadowColor: P.black,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  cardIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: P.white,
    letterSpacing: -0.2,
  },
  cardSubtitle: {
    fontSize: 12,
    lineHeight: 16,
    color: 'rgba(255, 255, 255, 0.88)',
    marginTop: 4,
    flex: 1,
  },
  cardActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 12,
  },
  cardActionText: {
    fontSize: 14,
    fontWeight: '700',
    color: P.white,
  },
  sectionHeaderWrap: {
    paddingHorizontal: 20,
    marginTop: 24,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: P.twGray500,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  remindersList: {
    paddingHorizontal: 20,
    gap: 10,
  },
  reminderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: P.white,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: P.twGray100,
    shadowColor: P.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  reminderIconBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  reminderInfo: {
    flex: 1,
    marginRight: 8,
  },
  reminderTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: P.twGray900,
    letterSpacing: -0.1,
  },
  reminderSubtitleOrange: {
    fontSize: 12,
    color: P.twOrange700,
    marginTop: 3,
  },
  reminderOverdueText: {
    fontWeight: '700',
    color: P.twOrange700,
  },
  reminderSubtitleGray: {
    fontSize: 12,
    color: P.twGray500,
    marginTop: 3,
  },
  reminderLogBtn: {
    paddingHorizontal: 15,
    paddingVertical: 8.5,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reminderLogBtnText: {
    color: P.white,
    fontSize: 13,
    fontWeight: '700',
  },
  recentHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: 26,
    marginBottom: 10,
  },
  fullHistoryLink: {
    fontSize: 13,
    fontWeight: '600',
    color: P.forestGreen,
  },
  recentListCard: {
    backgroundColor: P.white,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: P.twGray100,
    marginHorizontal: 20,
    shadowColor: P.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    overflow: 'hidden',
  },
  recentItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  recentItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: P.twGray100,
  },
  recentIconBadge: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  recentInfoCol: {
    flex: 1,
  },
  recentItemTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: P.twGray900,
    letterSpacing: -0.1,
  },
  recentItemSubtitle: {
    fontSize: 12,
    color: P.twGray500,
    marginTop: 2,
  },
  recentItemCost: {
    fontSize: 15,
    fontWeight: '700',
    color: P.twGray900,
    marginLeft: 10,
  },
  viewFullHistoryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 20,
    marginTop: 16,
    height: 48,
    borderRadius: 14,
    borderWidth: 1.2,
    borderColor: P.twGray200,
    backgroundColor: P.white,
    gap: 8,
    shadowColor: P.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  viewFullHistoryBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: P.forestGreen,
  },
});
