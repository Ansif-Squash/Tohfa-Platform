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
import Svg, { Circle, Line, Path, Rect } from 'react-native-svg';

// ─────────────────────────────────────────────
// Inline SVG Icons
// ─────────────────────────────────────────────

function ArrowBackIcon({ size = 20, color = '#1F2937' }: { size?: number; color?: string }) {
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

function ShieldCheckIcon({ size = 18, color = '#FFFFFF' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M9 12l2 2 4-4"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function UsersGroupIcon({ size = 18, color = '#FFFFFF' }: { size?: number; color?: string }) {
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
      <Path
        d="M23 21v-2a4 4 0 0 0-3-3.87"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
      />
      <Path
        d="M16 3.13a4 4 0 0 1 0 7.75"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
      />
    </Svg>
  );
}

function CalendarIcon({ size = 16, color = '#FFFFFF' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="4" width="18" height="18" rx="2" stroke={color} strokeWidth="2" />
      <Line x1="16" y1="2" x2="16" y2="6" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="8" y1="2" x2="8" y2="6" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="3" y1="10" x2="21" y2="10" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function BuildingIcon({ size = 16, color = '#E8F5E9' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="4" y="2" width="16" height="20" rx="2" stroke={color} strokeWidth="2" />
      <Path d="M9 22v-4h6v4" stroke={color} strokeWidth="2" />
      <Line x1="8" y1="6" x2="8.01" y2="6" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
      <Line x1="12" y1="6" x2="12.01" y2="6" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
      <Line x1="16" y1="6" x2="16.01" y2="6" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
      <Line x1="8" y1="10" x2="8.01" y2="10" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
      <Line x1="12" y1="10" x2="12.01" y2="10" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
      <Line x1="16" y1="10" x2="16.01" y2="10" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
      <Line x1="8" y1="14" x2="8.01" y2="14" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
      <Line x1="12" y1="14" x2="12.01" y2="14" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
      <Line x1="16" y1="14" x2="16.01" y2="14" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
    </Svg>
  );
}

function LocationPinIcon({ size = 16, color = '#E8F5E9' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle cx="12" cy="10" r="3" stroke={color} strokeWidth="2" />
    </Svg>
  );
}

function SlidersChecklistIcon({ size = 16, color = '#111827' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Line x1="4" y1="7" x2="20" y2="7" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="4" y1="17" x2="20" y2="17" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Circle cx="9" cy="7" r="2.5" fill="#FFFFFF" stroke={color} strokeWidth="2" />
      <Circle cx="15" cy="17" r="2.5" fill="#FFFFFF" stroke={color} strokeWidth="2" />
    </Svg>
  );
}

function BellIcon({ size = 16, color = '#FFFFFF' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M13.73 21a2 2 0 0 1-3.46 0"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function StarIcon({ size = 11, color = '#FFFFFF' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <Path
        d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
        stroke={color}
        strokeWidth="1"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function ChevronRightIcon({ size = 18, color = '#9CA3AF' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M9 18l6-6-6-6"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// ─────────────────────────────────────────────
// Types & Data
// ─────────────────────────────────────────────

type AuditTab = 'external' | 'internal';

interface PastAuditItem {
  id: string;
  day: string;
  monthYear: string;
  title: string;
  auditor: string;
  majorCount: number;
  minorCount: number;
  ratingLabel: 'Excellent' | 'Good' | 'Fair';
  ratingType: 'excellent' | 'good' | 'fair';
}

const EXTERNAL_PAST_AUDITS: PastAuditItem[] = [
  {
    id: 'ext-1',
    day: '18',
    monthYear: 'Jul 25',
    title: 'Compliant with minor observation',
    auditor: 'PGS Regional Council · R. Meenakshi',
    majorCount: 0,
    minorCount: 1,
    ratingLabel: 'Excellent',
    ratingType: 'excellent',
  },
  {
    id: 'ext-2',
    day: '11',
    monthYear: 'Aug 24',
    title: 'Fully compliant — clean audit',
    auditor: 'PGS Regional Council · R. Meenakshi',
    majorCount: 0,
    minorCount: 0,
    ratingLabel: 'Good',
    ratingType: 'good',
  },
];

const INTERNAL_PAST_AUDITS: PastAuditItem[] = [
  {
    id: 'int-1',
    day: '28',
    monthYear: 'Apr 25',
    title: 'Fully compliant — clean review',
    auditor: 'TOHFA Co-admin · S. Devaraj',
    majorCount: 0,
    minorCount: 0,
    ratingLabel: 'Excellent',
    ratingType: 'excellent',
  },
  {
    id: 'int-2',
    day: '14',
    monthYear: 'Jan 25',
    title: 'Compliant with minor observation',
    auditor: 'TOHFA Co-admin · P. Lakshmi',
    majorCount: 0,
    minorCount: 2,
    ratingLabel: 'Good',
    ratingType: 'good',
  },
];

interface AuditsScreenProps {
  onBack?: () => void;
  onNavigateToResult?: (auditId: string) => void;
}

export function AuditsScreen({ onBack, onNavigateToResult }: AuditsScreenProps): React.JSX.Element {
  const [activeTab, setActiveTab] = useState<AuditTab>('external');
  const [isReminderSet, setIsReminderSet] = useState(false);
  const [isChecklistVisible, setIsChecklistVisible] = useState(false);
  const [selectedAudit, setSelectedAudit] = useState<PastAuditItem | null>(null);

  // Checkable checklist items for Prep Checklist modal
  const [checklist, setChecklist] = useState([
    { id: '1', title: 'Farm boundary & buffer zone markings intact', done: true },
    { id: '2', title: 'Organic input purchase invoices compiled', done: true },
    { id: '3', title: 'Current year harvest and sales logbook updated', done: false },
    { id: '4', title: 'Soil & irrigation water lab test reports available', done: false },
    { id: '5', title: 'Seed source verification certificates on file', done: true },
  ]);

  const toggleChecklistItem = (id: string) => {
    setChecklist((prev) =>
      prev.map((item) => (item.id === id ? { ...item, done: !item.done } : item))
    );
  };

  const handleRemindMe = () => {
    setIsReminderSet(!isReminderSet);
    Alert.alert(
      !isReminderSet ? 'Reminder Set' : 'Reminder Cancelled',
      !isReminderSet
        ? `A reminder has been scheduled 24 hours prior to the inspection on ${
            activeTab === 'external' ? '05 Aug 2026' : '19 Jul 2026'
          }.`
        : 'Inspection reminder notification has been turned off.'
    );
  };

  const pastAudits = activeTab === 'external' ? EXTERNAL_PAST_AUDITS : INTERNAL_PAST_AUDITS;

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* ── Top Header ── */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={onBack}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Back"
        >
          <ArrowBackIcon size={20} color="#1F2937" />
        </TouchableOpacity>
        <View style={styles.headerTextCol}>
          <Text style={styles.headerTitle}>Audits</Text>
          <Text style={styles.headerSubtitle}>History & upcoming inspections</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Segmented Control (External / Internal) ── */}
        <View style={styles.tabBar}>
          <TouchableOpacity
            style={[
              styles.tabBtn,
              activeTab === 'external' ? styles.tabBtnActive : styles.tabBtnInactive,
            ]}
            onPress={() => setActiveTab('external')}
            activeOpacity={0.8}
            accessibilityRole="tab"
            accessibilityState={{ selected: activeTab === 'external' }}
          >
            <ShieldCheckIcon
              size={18}
              color={activeTab === 'external' ? '#FFFFFF' : '#4B5563'}
            />
            <Text
              style={[
                styles.tabBtnText,
                activeTab === 'external'
                  ? styles.tabBtnTextActive
                  : styles.tabBtnTextInactive,
              ]}
            >
              External
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.tabBtn,
              activeTab === 'internal' ? styles.tabBtnActive : styles.tabBtnInactive,
            ]}
            onPress={() => setActiveTab('internal')}
            activeOpacity={0.8}
            accessibilityRole="tab"
            accessibilityState={{ selected: activeTab === 'internal' }}
          >
            <UsersGroupIcon
              size={18}
              color={activeTab === 'internal' ? '#FFFFFF' : '#4B5563'}
            />
            <Text
              style={[
                styles.tabBtnText,
                activeTab === 'internal'
                  ? styles.tabBtnTextActive
                  : styles.tabBtnTextInactive,
              ]}
            >
              Internal
            </Text>
          </TouchableOpacity>
        </View>

        {/* ── 3 Summary Metric Cards ── */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statMainValue}>4/yr</Text>
            <Text style={styles.statSubLabel}>1 per quarter</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statMainValue}>2 of 4</Text>
            <Text style={styles.statSubLabel}>done this year</Text>
          </View>

          <View style={styles.statCard}>
            <View style={styles.ratingBadgePill}>
              <StarIcon size={11} color="#FFFFFF" />
              <Text style={styles.ratingBadgeText}>Excellent</Text>
            </View>
            <Text style={styles.statSubLabel}>latest rating</Text>
          </View>
        </View>

        {/* ── Upcoming Audit Hero Card (Green) ── */}
        <View style={styles.upcomingCard}>
          {/* Header Tag */}
          <View style={styles.upcomingTagRow}>
            <CalendarIcon size={14} color="#C8E6C9" />
            <Text style={styles.upcomingTagText}>
              {activeTab === 'external' ? 'UPCOMING · EXTERNAL' : 'UPCOMING · INTERNAL'}
            </Text>
          </View>

          {/* Title */}
          <Text style={styles.upcomingTitle}>
            {activeTab === 'external' ? 'Quarterly External Audit' : 'Co-admin Internal Review'}
          </Text>

          {/* Details list */}
          <View style={styles.upcomingDetailsList}>
            <View style={styles.upcomingDetailRow}>
              <CalendarIcon size={16} color="#FFFFFF" />
              <Text style={styles.upcomingDetailTextBold}>
                {activeTab === 'external'
                  ? '05 Aug 2026 · 10:00 AM'
                  : '19 Jul 2026 · 02:30 PM'}
              </Text>
            </View>

            <View style={styles.upcomingDetailRow}>
              <BuildingIcon size={16} color="#E8F5E9" />
              <Text style={styles.upcomingDetailText}>
                {activeTab === 'external'
                  ? 'PGS Regional Council · R. Meenakshi'
                  : 'TOHFA Co-admin · S. Devaraj'}
              </Text>
            </View>

            <View style={styles.upcomingDetailRow}>
              <LocationPinIcon size={16} color="#E8F5E9" />
              <Text style={styles.upcomingDetailText}>Great Earth Farm, Kotagiri</Text>
            </View>
          </View>

          {/* Action buttons */}
          <View style={styles.upcomingActionsRow}>
            <TouchableOpacity
              style={styles.prepChecklistBtn}
              activeOpacity={0.85}
              onPress={() => setIsChecklistVisible(true)}
            >
              <SlidersChecklistIcon size={16} color="#111827" />
              <Text style={styles.prepChecklistBtnText}>Prep Checklist</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.remindMeBtn,
                isReminderSet && { backgroundColor: 'rgba(255, 255, 255, 0.3)' },
              ]}
              activeOpacity={0.85}
              onPress={handleRemindMe}
            >
              <BellIcon size={16} color="#FFFFFF" />
              <Text style={styles.remindMeBtnText}>
                {isReminderSet ? 'Reminding' : 'Remind me'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Section Title ── */}
        <Text style={styles.sectionTitle}>
          {activeTab === 'external' ? 'PAST EXTERNAL AUDITS' : 'PAST INTERNAL REVIEWS'}
        </Text>

        {/* ── Past Audits List ── */}
        <View style={styles.pastAuditsContainer}>
          {pastAudits.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.pastAuditCard}
              activeOpacity={0.7}
              onPress={() => {
                if (onNavigateToResult) {
                  onNavigateToResult(item.id);
                } else {
                  setSelectedAudit(item);
                }
              }}
            >
              {/* Date Box */}
              <View style={styles.dateBox}>
                <Text style={styles.dateBoxDay}>{item.day}</Text>
                <Text style={styles.dateBoxMonth}>{item.monthYear}</Text>
              </View>

              {/* Info Column */}
              <View style={styles.pastAuditInfoCol}>
                <Text style={styles.pastAuditTitle}>{item.title}</Text>
                <Text style={styles.pastAuditAuditor}>{item.auditor}</Text>

                {/* Pills Row */}
                <View style={styles.pillsRow}>
                  <View style={styles.pillGray}>
                    <Text style={styles.pillGrayText}>Major {item.majorCount}</Text>
                  </View>

                  <View
                    style={
                      item.minorCount > 0 ? styles.pillOrange : styles.pillGray
                    }
                  >
                    <Text
                      style={
                        item.minorCount > 0
                          ? styles.pillOrangeText
                          : styles.pillGrayText
                      }
                    >
                      Minor {item.minorCount}
                    </Text>
                  </View>

                  <View
                    style={
                      item.ratingType === 'excellent'
                        ? styles.pillGreen
                        : styles.pillBlue
                    }
                  >
                    <Text style={styles.pillWhiteText}>{item.ratingLabel}</Text>
                  </View>
                </View>
              </View>

              {/* Chevron Arrow */}
              <View style={styles.chevronWrapper}>
                <ChevronRightIcon size={18} color="#9CA3AF" />
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* ── Modal: Prep Checklist ── */}
      <Modal
        visible={isChecklistVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setIsChecklistVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Inspection Prep Checklist</Text>
                <Text style={styles.modalSub}>
                  {activeTab === 'external'
                    ? 'PGS External Audit · 05 Aug 2026'
                    : 'Internal Review · 19 Jul 2026'}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.modalCloseBtn}
                onPress={() => setIsChecklistVisible(false)}
              >
                <Text style={styles.modalCloseBtnText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.checklistBody}>
              {checklist.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.checklistItem}
                  activeOpacity={0.7}
                  onPress={() => toggleChecklistItem(item.id)}
                >
                  <View
                    style={[
                      styles.checkboxBox,
                      item.done && styles.checkboxBoxActive,
                    ]}
                  >
                    {item.done && <Text style={styles.checkmarkIcon}>✓</Text>}
                  </View>
                  <Text
                    style={[
                      styles.checklistItemText,
                      item.done && styles.checklistItemTextDone,
                    ]}
                  >
                    {item.title}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.doneBtn}
                onPress={() => setIsChecklistVisible(false)}
              >
                <Text style={styles.doneBtnText}>Close Checklist</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Modal: Past Audit Inspection Details ── */}
      <Modal
        visible={!!selectedAudit}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setSelectedAudit(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Inspection Report</Text>
                <Text style={styles.modalSub}>
                  {selectedAudit?.day} {selectedAudit?.monthYear}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.modalCloseBtn}
                onPress={() => setSelectedAudit(null)}
              >
                <Text style={styles.modalCloseBtnText}>✕</Text>
              </TouchableOpacity>
            </View>

            {selectedAudit && (
              <View style={styles.auditDetailModalBody}>
                <View style={styles.reportDetailRow}>
                  <Text style={styles.reportDetailLabel}>Status</Text>
                  <Text style={styles.reportDetailValue}>{selectedAudit.title}</Text>
                </View>
                <View style={styles.reportDetailRow}>
                  <Text style={styles.reportDetailLabel}>Auditor / Body</Text>
                  <Text style={styles.reportDetailValue}>{selectedAudit.auditor}</Text>
                </View>
                <View style={styles.reportDetailRow}>
                  <Text style={styles.reportDetailLabel}>Major Non-Conformances</Text>
                  <Text style={styles.reportDetailValue}>{selectedAudit.majorCount}</Text>
                </View>
                <View style={styles.reportDetailRow}>
                  <Text style={styles.reportDetailLabel}>Minor Non-Conformances</Text>
                  <Text style={styles.reportDetailValue}>{selectedAudit.minorCount}</Text>
                </View>
                <View style={[styles.reportDetailRow, { borderBottomWidth: 0 }]}>
                  <Text style={styles.reportDetailLabel}>Final Rating</Text>
                  <Text
                    style={[
                      styles.reportDetailValue,
                      { color: selectedAudit.ratingType === 'excellent' ? '#2E7D32' : '#1976D2' },
                    ]}
                  >
                    {selectedAudit.ratingLabel}
                  </Text>
                </View>
              </View>
            )}

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.doneBtn}
                onPress={() => setSelectedAudit(null)}
              >
                <Text style={styles.doneBtnText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
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
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    gap: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTextCol: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 40,
  },

  /* Tab Bar (Segmented control) */
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 4,
    gap: 6,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 11,
    borderRadius: 10,
    gap: 8,
  },
  tabBtnActive: {
    backgroundColor: '#2E7D32',
  },
  tabBtnInactive: {
    backgroundColor: '#F3F4F6',
  },
  tabBtnText: {
    fontSize: 15,
    fontWeight: '700',
  },
  tabBtnTextActive: {
    color: '#FFFFFF',
  },
  tabBtnTextInactive: {
    color: '#4B5563',
  },

  /* 3 Metric Summary Cards */
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingVertical: 14,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  statMainValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
  },
  statSubLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: '#6B7280',
    textAlign: 'center',
  },
  ratingBadgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#2E7D32',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  ratingBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  /* Hero Upcoming Card (Green) */
  upcomingCard: {
    marginTop: 16,
    backgroundColor: '#236B36',
    borderRadius: 20,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  upcomingTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  upcomingTagText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#C8E6C9',
    letterSpacing: 0.6,
  },
  upcomingTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 8,
    marginBottom: 12,
  },
  upcomingDetailsList: {
    gap: 8,
    marginBottom: 16,
  },
  upcomingDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  upcomingDetailTextBold: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  upcomingDetailText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#E8F5E9',
  },
  upcomingActionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 2,
  },
  prepChecklistBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 12,
  },
  prepChecklistBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  remindMeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.35)',
    borderRadius: 12,
    paddingVertical: 12,
  },
  remindMeBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  /* Section Title */
  sectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#6B7280',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginTop: 24,
    marginBottom: 12,
  },

  /* Past Audits List */
  pastAuditsContainer: {
    gap: 12,
  },
  pastAuditCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 14,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  dateBox: {
    width: 52,
    height: 52,
    borderRadius: 12,
    backgroundColor: '#E8F5E9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateBoxDay: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1B5E20',
    lineHeight: 20,
  },
  dateBoxMonth: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2E7D32',
    marginTop: 2,
  },
  pastAuditInfoCol: {
    flex: 1,
    gap: 3,
  },
  pastAuditTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  pastAuditAuditor: {
    fontSize: 12,
    color: '#6B7280',
  },
  pillsRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 4,
  },
  pillGray: {
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  pillGrayText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#374151',
  },
  pillOrange: {
    backgroundColor: '#FFEDD5',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  pillOrangeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#EA580C',
  },
  pillGreen: {
    backgroundColor: '#2E7D32',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  pillBlue: {
    backgroundColor: '#1976D2',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  pillWhiteText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  chevronWrapper: {
    paddingLeft: 4,
  },

  /* Modals */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 28,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  modalSub: {
    fontSize: 12,
    color: '#6B7280',
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
  modalCloseBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#6B7280',
  },
  checklistBody: {
    marginBottom: 16,
  },
  checklistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#F0F0F0',
  },
  checkboxBox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxBoxActive: {
    borderColor: '#2E7D32',
    backgroundColor: '#2E7D32',
  },
  checkmarkIcon: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  checklistItemText: {
    flex: 1,
    fontSize: 14,
    color: '#1F2937',
  },
  checklistItemTextDone: {
    color: '#9CA3AF',
    textDecorationLine: 'line-through',
  },
  auditDetailModalBody: {
    marginBottom: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 14,
  },
  reportDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E7EB',
  },
  reportDetailLabel: {
    fontSize: 13,
    color: '#6B7280',
  },
  reportDetailValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#111827',
  },
  modalFooter: {
    marginTop: 8,
  },
  doneBtn: {
    backgroundColor: '#2E7D32',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  doneBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
