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

// --- SVG Icons for Pixel-Perfect Fidelity to Screen 14 ---

function ChevronLeftIcon({ color = '#1A2E1A', size = 20 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M15 19L8 12L15 5"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function CartIcon({ color = '#D97706', size = 22 }: { color?: string; size?: number }) {
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

function AlertTriangleIcon({ color = '#DC2626', size = 22 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 3L2 20H22L12 3Z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Line x1="12" y1="9" x2="12" y2="13" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Circle cx="12" cy="17" r="1" fill={color} />
    </Svg>
  );
}

function CheckmarkIcon({ color = '#16A34A', size = 22 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M5 12.5L9.5 17L19 7"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function CalendarIcon({ color = '#EA580C', size = 22 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect
        x="3"
        y="4"
        width="18"
        height="17"
        rx="3"
        stroke={color}
        strokeWidth="2"
      />
      <Line x1="3" y1="9" x2="21" y2="9" stroke={color} strokeWidth="2" />
      <Line x1="8" y1="2" x2="8" y2="5" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="16" y1="2" x2="16" y2="5" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function ClipboardCheckIcon({ color = '#0284C7', size = 22 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect
        x="4"
        y="4"
        width="16"
        height="17"
        rx="2.5"
        stroke={color}
        strokeWidth="2"
      />
      <Path
        d="M8.5 12L11 14.5L16 9"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function DeviceTutorialIcon({ color = '#9333EA', size = 22 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect
        x="6"
        y="3"
        width="12"
        height="18"
        rx="2.5"
        stroke={color}
        strokeWidth="2"
      />
      <Line x1="10.5" y1="18" x2="13.5" y2="18" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

// --- Notification Types & Initial Mock Data ---

export type NotificationCategory = 'all' | 'reminders' | 'approvals' | 'alerts' | 'success';

export interface NotificationItem {
  id: string;
  section: 'TODAY' | 'YESTERDAY' | 'EARLIER';
  category: 'reminders' | 'approvals' | 'alerts' | 'success';
  title: string;
  message: string;
  time: string;
  isUnread: boolean;
  actionLabel?: string;
  iconBg: string;
  iconColor: string;
  iconType: 'cart' | 'warning' | 'check' | 'calendar' | 'clipboard' | 'tutorial';
}

const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: '1',
    section: 'TODAY',
    category: 'approvals',
    title: 'Counter-offer received',
    message: 'Admin offered ₹42/kg for your tomatoes. Respond within 24h.',
    time: '18 min ago',
    isUnread: true,
    actionLabel: 'Review offer >',
    iconBg: '#FEF3C7',
    iconColor: '#D97706',
    iconType: 'cart',
  },
  {
    id: '2',
    section: 'TODAY',
    category: 'alerts',
    title: 'Heavy rain warning',
    message: '40mm rainfall expected tonight in Ooty. Secure young seedlings.',
    time: '2 hours ago',
    isUnread: true,
    iconBg: '#FEE2E2',
    iconColor: '#DC2626',
    iconType: 'warning',
  },
  {
    id: '3',
    section: 'TODAY',
    category: 'success',
    title: 'Payment received',
    message: '₹8,400 credited for your carrot sale on Apr 22.',
    time: '5 hours ago',
    isUnread: false,
    iconBg: '#DCFCE7',
    iconColor: '#16A34A',
    iconType: 'check',
  },
  {
    id: '4',
    section: 'YESTERDAY',
    category: 'reminders',
    title: 'Fertigation due',
    message: 'Zone A tomatoes scheduled for fertigation today.',
    time: 'Yesterday, 7:00 AM',
    isUnread: false,
    iconBg: '#FFEDD5',
    iconColor: '#EA580C',
    iconType: 'calendar',
  },
  {
    id: '5',
    section: 'YESTERDAY',
    category: 'approvals',
    title: 'Listing approved',
    message: 'Your cabbage listing (120kg) is now live in the marketplace.',
    time: 'Yesterday, 3:20 PM',
    isUnread: false,
    iconBg: '#E0F2FE',
    iconColor: '#0284C7',
    iconType: 'clipboard',
  },
  {
    id: '6',
    section: 'EARLIER',
    category: 'reminders',
    title: '4 new tutorials added',
    message: 'New Learning Hub videos on composting and pest control.',
    time: 'Apr 20',
    isUnread: false,
    iconBg: '#F3E8FF',
    iconColor: '#9333EA',
    iconType: 'tutorial',
  },
];

interface NotificationsScreenProps {
  onBack: () => void;
  onNavigateToCounterOffer?: (listingId?: string) => void;
}

export function NotificationsScreen({
  onBack,
  onNavigateToCounterOffer,
}: NotificationsScreenProps): React.JSX.Element {
  const [activeTab, setActiveTab] = useState<NotificationCategory>('all');
  const [notifications, setNotifications] = useState<NotificationItem[]>(INITIAL_NOTIFICATIONS);

  // Counts for tabs
  const reminderCount = notifications.filter((n) => n.category === 'reminders').length;
  const approvalCount = notifications.filter((n) => n.category === 'approvals').length;
  const alertCount = notifications.filter((n) => n.category === 'alerts').length;

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((item) => ({ ...item, isUnread: false })));
  };

  const toggleItemRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((item) => (item.id === id ? { ...item, isUnread: false } : item))
    );
  };

  // Filter items by active tab
  const filteredNotifications = notifications.filter((item) => {
    if (activeTab === 'all') return true;
    return item.category === activeTab;
  });

  const sections: ('TODAY' | 'YESTERDAY' | 'EARLIER')[] = ['TODAY', 'YESTERDAY', 'EARLIER'];

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
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={onBack}
          accessibilityRole="button"
          accessibilityLabel="Back"
        >
          <ChevronLeftIcon />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Notifications</Text>

        <TouchableOpacity
          onPress={markAllAsRead}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          accessibilityRole="button"
        >
          <Text style={styles.markAllReadText}>Mark all read</Text>
        </TouchableOpacity>
      </View>

      {/* Filter Tabs */}
      <View style={styles.tabsWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsContent}
        >
          {/* Tab: All */}
          <Pressable
            style={[styles.tabButton, activeTab === 'all' && styles.tabButtonActive]}
            onPress={() => setActiveTab('all')}
          >
            <Text style={[styles.tabText, activeTab === 'all' && styles.tabTextActive]}>All</Text>
            {activeTab === 'all' && <View style={styles.activeIndicator} />}
          </Pressable>

          {/* Tab: Reminders */}
          <Pressable
            style={[styles.tabButton, activeTab === 'reminders' && styles.tabButtonActive]}
            onPress={() => setActiveTab('reminders')}
          >
            <Text style={[styles.tabText, activeTab === 'reminders' && styles.tabTextActive]}>
              Reminders
            </Text>
            <View style={styles.badgeGray}>
              <Text style={styles.badgeGrayText}>{reminderCount}</Text>
            </View>
            {activeTab === 'reminders' && <View style={styles.activeIndicator} />}
          </Pressable>

          {/* Tab: Approvals */}
          <Pressable
            style={[styles.tabButton, activeTab === 'approvals' && styles.tabButtonActive]}
            onPress={() => setActiveTab('approvals')}
          >
            <Text style={[styles.tabText, activeTab === 'approvals' && styles.tabTextActive]}>
              Approvals
            </Text>
            <View style={styles.badgeGray}>
              <Text style={styles.badgeGrayText}>{approvalCount}</Text>
            </View>
            {activeTab === 'approvals' && <View style={styles.activeIndicator} />}
          </Pressable>

          {/* Tab: Alerts */}
          <Pressable
            style={[styles.tabButton, activeTab === 'alerts' && styles.tabButtonActive]}
            onPress={() => setActiveTab('alerts')}
          >
            <Text style={[styles.tabText, activeTab === 'alerts' && styles.tabTextActive]}>
              Alerts
            </Text>
            <View style={styles.badgeRed}>
              <Text style={styles.badgeRedText}>{alertCount}</Text>
            </View>
            {activeTab === 'alerts' && <View style={styles.activeIndicator} />}
          </Pressable>

          {/* Tab: Success */}
          <Pressable
            style={[styles.tabButton, activeTab === 'success' && styles.tabButtonActive]}
            onPress={() => setActiveTab('success')}
          >
            <Text style={[styles.tabText, activeTab === 'success' && styles.tabTextActive]}>
              Success
            </Text>
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
              <Text style={styles.sectionTitle}>{sectionName}</Text>
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
                    style={[
                      styles.card,
                      isUnread ? styles.cardUnread : styles.cardRead,
                    ]}
                  >
                    {/* Icon Column */}
                    <View style={[styles.iconContainer, { backgroundColor: item.iconBg }]}>
                      {renderIcon(item.iconType, item.iconColor)}
                    </View>

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
            <Text style={styles.emptyTitle}>No notifications</Text>
            <Text style={styles.emptySubtitle}>You're all caught up for this category!</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F7F5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 10,
    backgroundColor: '#FFFFFF',
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  markAllReadText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#15803D',
  },
  tabsWrapper: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EAEAEA',
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
    color: '#6B7280',
  },
  tabTextActive: {
    color: '#16A34A',
    fontWeight: '700',
  },
  activeIndicator: {
    position: 'absolute',
    bottom: 0,
    left: 8,
    right: 8,
    height: 3,
    backgroundColor: '#16A34A',
    borderRadius: 2,
  },
  badgeGray: {
    backgroundColor: '#E5E7EB',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 6,
  },
  badgeGrayText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#374151',
  },
  badgeRed: {
    backgroundColor: '#FEE2E2',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 6,
  },
  badgeRedText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#DC2626',
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
    color: '#8A927F',
    letterSpacing: 0.8,
    marginBottom: 8,
    marginHorizontal: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    marginHorizontal: 16,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  cardUnread: {
    borderWidth: 1.5,
    borderColor: '#22C55E',
  },
  cardRead: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
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
    color: '#111827',
    flex: 1,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#16A34A',
    marginLeft: 8,
  },
  itemMessage: {
    fontSize: 13,
    color: '#4B5563',
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
    color: '#E24B4A',
  },
  timestampText: {
    fontSize: 12,
    color: '#9CA3AF',
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
    color: '#374151',
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#9CA3AF',
    marginTop: 4,
  },
});
