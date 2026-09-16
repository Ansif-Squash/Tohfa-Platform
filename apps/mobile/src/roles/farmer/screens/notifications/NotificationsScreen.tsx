import React, { useState } from 'react';
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Circle, Line, Path, Rect } from 'react-native-svg';
import { t, type TranslationKey } from '../../../../i18n/farmer';
import { authPalette as P } from '../../theme';

// --- SVG Icons for Pixel-Perfect Fidelity to Screen 14 ---

function ChevronLeftIcon({ color = P.ink, size = 20 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M15 19L8 12L15 5" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function CartIcon({ color = P.twAmber600, size = 22 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M3 3H5.2L7.3 14.2C7.4 14.8 7.9 15.3 8.6 15.3H18.2C18.8 15.3 19.3 14.8 19.4 14.2L20.7 7.2C20.8 6.5 20.3 6 19.6 6H6.1"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle cx="9" cy="19.5" r="1.5" fill={color} />
      <Circle cx="17.5" cy="19.5" r="1.5" fill={color} />
    </Svg>
  );
}

function AlertTriangleIcon({ color = P.twRed600, size = 22 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M12 3L2 20H22L12 3Z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Line x1="12" y1="9" x2="12" y2="13" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Circle cx="12" cy="17" r="1" fill={color} />
    </Svg>
  );
}

function CheckmarkIcon({ color = P.twGreen600, size = 22 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M5 12.5L9.5 17L19 7" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function CalendarIcon({ color = P.twOrange600, size = 22 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="4" width="18" height="17" rx="3" stroke={color} strokeWidth="2" />
      <Line x1="3" y1="9" x2="21" y2="9" stroke={color} strokeWidth="2" />
      <Line x1="8" y1="2" x2="8" y2="5" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="16" y1="2" x2="16" y2="5" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function ClipboardCheckIcon({ color = P.sky600, size = 22 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="4" y="4" width="16" height="17" rx="2.5" stroke={color} strokeWidth="2" />
      <Path d="M8.5 12L11 14.5L16 9" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function DeviceTutorialIcon({ color = P.twPurple600, size = 22 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="6" y="3" width="12" height="18" rx="2.5" stroke={color} strokeWidth="2" />
      <Line x1="10.5" y1="18" x2="13.5" y2="18" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

// --- Notification Types & Initial Mock Data ---
//
// Specification gap: there is no notifications endpoint in `../../api/farmer`
// or `docs/openapi.yaml` yet, so this list is local mock state, same as the
// farm-rating source. Titles/messages carry i18n *keys*, resolved with `t()`
// inside the component (not at module scope) so the screen re-renders
// correctly when the locale switcher changes languages -- see the same
// pattern/comment in FarmRatingsScreen.tsx.

export type NotificationCategory = 'all' | 'reminders' | 'approvals' | 'alerts' | 'success';

interface NotificationDef {
  id: string;
  section: 'TODAY' | 'YESTERDAY' | 'EARLIER';
  category: 'reminders' | 'approvals' | 'alerts' | 'success';
  titleKey: TranslationKey;
  messageKey: TranslationKey;
  timeKey: TranslationKey;
  hasAction?: boolean;
  isUnread: boolean;
  iconBg: string;
  iconColor: string;
  iconType: 'cart' | 'warning' | 'check' | 'calendar' | 'clipboard' | 'tutorial';
}

const NOTIFICATION_DEFS: NotificationDef[] = [
  {
    id: '1',
    section: 'TODAY',
    category: 'approvals',
    titleKey: 'farmer.notifications.item.counterOffer.title',
    messageKey: 'farmer.notifications.item.counterOffer.message',
    timeKey: 'farmer.notifications.time.minAgo18',
    hasAction: true,
    isUnread: true,
    iconBg: P.twAmber100,
    iconColor: P.twAmber600,
    iconType: 'cart',
  },
  {
    id: '2',
    section: 'TODAY',
    category: 'alerts',
    titleKey: 'farmer.notifications.item.rainWarning.title',
    messageKey: 'farmer.notifications.item.rainWarning.message',
    timeKey: 'farmer.notifications.time.hoursAgo2',
    isUnread: true,
    iconBg: P.twRed100,
    iconColor: P.twRed600,
    iconType: 'warning',
  },
  {
    id: '3',
    section: 'TODAY',
    category: 'success',
    titleKey: 'farmer.notifications.item.paymentReceived.title',
    messageKey: 'farmer.notifications.item.paymentReceived.message',
    timeKey: 'farmer.notifications.time.hoursAgo5',
    isUnread: false,
    iconBg: P.twGreen100,
    iconColor: P.twGreen600,
    iconType: 'check',
  },
  {
    id: '4',
    section: 'YESTERDAY',
    category: 'reminders',
    titleKey: 'farmer.notifications.item.fertigationDue.title',
    messageKey: 'farmer.notifications.item.fertigationDue.message',
    timeKey: 'farmer.notifications.time.yesterday7am',
    isUnread: false,
    iconBg: P.twOrange100,
    iconColor: P.twOrange600,
    iconType: 'calendar',
  },
  {
    id: '5',
    section: 'YESTERDAY',
    category: 'approvals',
    titleKey: 'farmer.notifications.item.listingApproved.title',
    messageKey: 'farmer.notifications.item.listingApproved.message',
    timeKey: 'farmer.notifications.time.yesterday320pm',
    isUnread: false,
    iconBg: P.sky100,
    iconColor: P.sky600,
    iconType: 'clipboard',
  },
  {
    id: '6',
    section: 'EARLIER',
    category: 'reminders',
    titleKey: 'farmer.notifications.item.newTutorials.title',
    messageKey: 'farmer.notifications.item.newTutorials.message',
    timeKey: 'farmer.notifications.time.apr20',
    isUnread: false,
    iconBg: P.twPurple100,
    iconColor: P.twPurple600,
    iconType: 'tutorial',
  },
];

interface NotificationItem extends NotificationDef {
  title: string;
  message: string;
  time: string;
  actionLabel?: string | undefined;
}

interface NotificationsScreenProps {
  onBack: () => void;
  onNavigateToCounterOffer?: (listingId?: string) => void;
}

export function NotificationsScreen({
  onBack,
  onNavigateToCounterOffer,
}: NotificationsScreenProps): React.JSX.Element {
  const [activeTab, setActiveTab] = useState<NotificationCategory>('all');
  const [readIds, setReadIds] = useState<Set<string>>(new Set());

  const notifications: NotificationItem[] = NOTIFICATION_DEFS.map((def) => ({
    ...def,
    title: t(def.titleKey),
    message: t(def.messageKey),
    time: t(def.timeKey),
    actionLabel: def.hasAction ? t('farmer.notifications.reviewOffer') : undefined,
    isUnread: def.isUnread && !readIds.has(def.id),
  }));

  // Counts for tabs
  const reminderCount = notifications.filter((n) => n.category === 'reminders').length;
  const approvalCount = notifications.filter((n) => n.category === 'approvals').length;
  const alertCount = notifications.filter((n) => n.category === 'alerts').length;

  const markAllAsRead = () => {
    setReadIds(new Set(NOTIFICATION_DEFS.map((n) => n.id)));
  };

  const toggleItemRead = (id: string) => {
    setReadIds((prev) => new Set(prev).add(id));
  };

  // Filter items by active tab
  const filteredNotifications = notifications.filter((item) => {
    if (activeTab === 'all') return true;
    return item.category === activeTab;
  });

  const sections: ('TODAY' | 'YESTERDAY' | 'EARLIER')[] = ['TODAY', 'YESTERDAY', 'EARLIER'];
  const sectionLabel = (section: 'TODAY' | 'YESTERDAY' | 'EARLIER'): string => {
    switch (section) {
      case 'TODAY':
        return t('farmer.notifications.section.today');
      case 'YESTERDAY':
        return t('farmer.notifications.section.yesterday');
      default:
        return t('farmer.notifications.section.earlier');
    }
  };

  const renderIcon = (type: NotificationItem['iconType'], color: string) => {
    switch (type) {
      case 'cart':
        return <CartIcon color={color} />;
      case 'warning':
        return <AlertTriangleIcon color={color} />;
      case 'check':
        return <CheckmarkIcon color={color} />;
      case 'calendar':
        return <CalendarIcon color={color} />;
      case 'clipboard':
        return <ClipboardCheckIcon color={color} />;
      case 'tutorial':
        return <DeviceTutorialIcon color={color} />;
      default:
        return <CheckmarkIcon color={color} />;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={P.white} />

      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={onBack}
          accessibilityRole="button"
          accessibilityLabel={t('farmer.common.back')}
        >
          <ChevronLeftIcon />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>{t('farmer.notifications.title')}</Text>

        <TouchableOpacity
          onPress={markAllAsRead}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          accessibilityRole="button"
        >
          <Text style={styles.markAllReadText}>{t('farmer.notifications.markAllRead')}</Text>
        </TouchableOpacity>
      </View>

      {/* Filter Tabs */}
      <View style={styles.tabsWrapper}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsContent}>
          {/* Tab: All */}
          <Pressable style={[styles.tabButton, activeTab === 'all' && styles.tabButtonActive]} onPress={() => setActiveTab('all')}>
            <Text style={[styles.tabText, activeTab === 'all' && styles.tabTextActive]}>{t('farmer.notifications.tab.all')}</Text>
            {activeTab === 'all' && <View style={styles.activeIndicator} />}
          </Pressable>

          {/* Tab: Reminders */}
          <Pressable style={[styles.tabButton, activeTab === 'reminders' && styles.tabButtonActive]} onPress={() => setActiveTab('reminders')}>
            <Text style={[styles.tabText, activeTab === 'reminders' && styles.tabTextActive]}>
              {t('farmer.notifications.tab.reminders')}
            </Text>
            <View style={styles.badgeGray}>
              <Text style={styles.badgeGrayText}>{reminderCount}</Text>
            </View>
            {activeTab === 'reminders' && <View style={styles.activeIndicator} />}
          </Pressable>

          {/* Tab: Approvals */}
          <Pressable style={[styles.tabButton, activeTab === 'approvals' && styles.tabButtonActive]} onPress={() => setActiveTab('approvals')}>
            <Text style={[styles.tabText, activeTab === 'approvals' && styles.tabTextActive]}>
              {t('farmer.notifications.tab.approvals')}
            </Text>
            <View style={styles.badgeGray}>
              <Text style={styles.badgeGrayText}>{approvalCount}</Text>
            </View>
            {activeTab === 'approvals' && <View style={styles.activeIndicator} />}
          </Pressable>

          {/* Tab: Alerts */}
          <Pressable style={[styles.tabButton, activeTab === 'alerts' && styles.tabButtonActive]} onPress={() => setActiveTab('alerts')}>
            <Text style={[styles.tabText, activeTab === 'alerts' && styles.tabTextActive]}>{t('farmer.notifications.tab.alerts')}</Text>
            <View style={styles.badgeRed}>
              <Text style={styles.badgeRedText}>{alertCount}</Text>
            </View>
            {activeTab === 'alerts' && <View style={styles.activeIndicator} />}
          </Pressable>

          {/* Tab: Success */}
          <Pressable style={[styles.tabButton, activeTab === 'success' && styles.tabButtonActive]} onPress={() => setActiveTab('success')}>
            <Text style={[styles.tabText, activeTab === 'success' && styles.tabTextActive]}>{t('farmer.notifications.tab.success')}</Text>
            {activeTab === 'success' && <View style={styles.activeIndicator} />}
          </Pressable>
        </ScrollView>
      </View>

      {/* Notifications List */}
      <ScrollView contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
        {sections.map((sectionName) => {
          const sectionItems = filteredNotifications.filter((n) => n.section === sectionName);
          if (sectionItems.length === 0) return null;

          return (
            <View key={sectionName} style={styles.sectionContainer}>
              <Text style={styles.sectionTitle}>{sectionLabel(sectionName)}</Text>
              {sectionItems.map((item) => {
                const isUnread = item.isUnread;

                return (
                  <TouchableOpacity
                    key={item.id}
                    activeOpacity={0.85}
                    onPress={() => {
                      toggleItemRead(item.id);
                      if (item.actionLabel && onNavigateToCounterOffer) {
                        onNavigateToCounterOffer('demo');
                      }
                    }}
                    style={[styles.card, isUnread ? styles.cardUnread : styles.cardRead]}
                  >
                    {/* Icon Column */}
                    <View style={[styles.iconContainer, { backgroundColor: item.iconBg }]}>{renderIcon(item.iconType, item.iconColor)}</View>

                    {/* Content Column */}
                    <View style={styles.contentColumn}>
                      <View style={styles.titleRow}>
                        <Text style={styles.itemTitle}>{item.title}</Text>
                        {isUnread && <View style={styles.unreadDot} />}
                      </View>

                      <Text style={styles.itemMessage}>{item.message}</Text>

                      {/* Action Link (e.g. Review offer >) */}
                      {item.actionLabel && (
                        <TouchableOpacity
                          style={styles.actionRow}
                          onPress={() => {
                            toggleItemRead(item.id);
                            if (onNavigateToCounterOffer) {
                              onNavigateToCounterOffer('demo');
                            }
                          }}
                        >
                          <Text style={styles.actionLabel}>{item.actionLabel}</Text>
                        </TouchableOpacity>
                      )}

                      {/* Timestamp */}
                      <Text style={styles.timestampText}>{item.time}</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          );
        })}

        {filteredNotifications.length === 0 && (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyTitle}>{t('farmer.notifications.empty.title')}</Text>
            <Text style={styles.emptySubtitle}>{t('farmer.notifications.empty.subtitle')}</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: P.paleStoneBgAlt,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 12,
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
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: P.twGray900,
  },
  markAllReadText: {
    fontSize: 14,
    fontWeight: '600',
    color: P.twGreen700,
  },
  tabsWrapper: {
    backgroundColor: P.white,
    borderBottomWidth: 1,
    borderBottomColor: P.borderGreyLight,
  },
  tabsContent: {
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  tabButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 10,
    marginRight: 8,
    position: 'relative',
  },
  tabButtonActive: {},
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: P.twGray500,
  },
  tabTextActive: {
    color: P.twGreen600,
    fontWeight: '700',
  },
  activeIndicator: {
    position: 'absolute',
    bottom: 0,
    left: 8,
    right: 8,
    height: 3,
    backgroundColor: P.twGreen600,
    borderRadius: 2,
  },
  badgeGray: {
    backgroundColor: P.twGray200,
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 6,
  },
  badgeGrayText: {
    fontSize: 11,
    fontWeight: '700',
    color: P.twGray700,
  },
  badgeRed: {
    backgroundColor: P.twRed100,
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 6,
  },
  badgeRedText: {
    fontSize: 11,
    fontWeight: '700',
    color: P.twRed600,
  },
  listContent: {
    paddingBottom: 40,
  },
  sectionContainer: {
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: P.stoneMuted,
    letterSpacing: 0.8,
    marginBottom: 8,
    marginHorizontal: 16,
  },
  card: {
    backgroundColor: P.white,
    borderRadius: 16,
    padding: 14,
    marginHorizontal: 16,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  cardUnread: {
    borderWidth: 1.5,
    borderColor: P.twGreen500,
  },
  cardRead: {
    borderWidth: 1,
    borderColor: P.twGray200,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  contentColumn: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  itemTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: P.twGray900,
    flex: 1,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: P.twGreen600,
    marginLeft: 8,
  },
  itemMessage: {
    fontSize: 13,
    color: P.twGray600,
    lineHeight: 18,
    marginTop: 3,
  },
  actionRow: {
    marginTop: 5,
    alignSelf: 'flex-start',
  },
  actionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: P.coralRed,
  },
  timestampText: {
    fontSize: 12,
    color: P.twGray400,
    marginTop: 6,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: P.twGray700,
  },
  emptySubtitle: {
    fontSize: 13,
    color: P.twGray400,
    marginTop: 4,
  },
});
