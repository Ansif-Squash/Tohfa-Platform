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
import { t, type TranslationKey } from '../../../../i18n/farmer';
import { authPalette as P, colors } from '../../theme';

// ─────────────────────────────────────────────
// Inline SVG Icons
// ─────────────────────────────────────────────

function ArrowBackIcon({ size = 20, color = P.twGray800 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M19 12H5M5 12L12 19M5 12L12 5" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function ShieldCheckIcon({ size = 18, color = P.white }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M9 12l2 2 4-4" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function UsersGroupIcon({ size = 18, color = P.white }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Circle cx="9" cy="7" r="4" stroke={color} strokeWidth="2" />
      <Path d="M23 21v-2a4 4 0 0 0-3-3.87" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Path d="M16 3.13a4 4 0 0 1 0 7.75" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function CalendarIcon({ size = 16, color = P.white }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="4" width="18" height="18" rx="2" stroke={color} strokeWidth="2" />
      <Line x1="16" y1="2" x2="16" y2="6" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="8" y1="2" x2="8" y2="6" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="3" y1="10" x2="21" y2="10" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function BuildingIcon({ size = 16, color = colors.brandGreenLight }: { size?: number; color?: string }) {
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

function LocationPinIcon({ size = 16, color = colors.brandGreenLight }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Circle cx="12" cy="10" r="3" stroke={color} strokeWidth="2" />
    </Svg>
  );
}

function SlidersChecklistIcon({ size = 16, color = P.twGray900 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Line x1="4" y1="7" x2="20" y2="7" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="4" y1="17" x2="20" y2="17" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Circle cx="9" cy="7" r="2.5" fill={P.white} stroke={color} strokeWidth="2" />
      <Circle cx="15" cy="17" r="2.5" fill={P.white} stroke={color} strokeWidth="2" />
    </Svg>
  );
}

function BellIcon({ size = 16, color = P.white }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M13.73 21a2 2 0 0 1-3.46 0" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function StarIcon({ size = 11, color = P.white }: { size?: number; color?: string }) {
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

function ChevronRightIcon({ size = 18, color = P.twGray400 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M9 18l6-6-6-6" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

// ─────────────────────────────────────────────
// Types & Data
//
// Specification gap: there is no audits endpoint in `../../api/farmer` or
// `docs/openapi.yaml` yet, so the past-audit lists and checklist below are
// local mock state, as in the farm-rating source. Item copy carries i18n
// *keys*, resolved with `t()` inside the component so the screen re-renders
// correctly on a locale switch (see the same pattern in FarmRatingsScreen.tsx
// and NotificationsScreen.tsx).
// ─────────────────────────────────────────────

type AuditTab = 'external' | 'internal';

interface PastAuditDef {
  id: string;
  day: string;
  monthYear: string;
  titleKey: TranslationKey;
  auditorKey: TranslationKey;
  majorCount: number;
  minorCount: number;
  ratingKey: TranslationKey;
  ratingType: 'excellent' | 'good' | 'fair';
}

const EXTERNAL_PAST_AUDITS: PastAuditDef[] = [
  {
    id: 'ext-1',
    day: '18',
    monthYear: 'Jul 25',
    titleKey: 'farmer.audits.outcome.minorObservation',
    auditorKey: 'farmer.audits.auditor.pgsMeenakshi',
    majorCount: 0,
    minorCount: 1,
    ratingKey: 'farmer.profile.rating.excellent',
    ratingType: 'excellent',
  },
  {
    id: 'ext-2',
    day: '11',
    monthYear: 'Aug 24',
    titleKey: 'farmer.audits.outcome.cleanAudit',
    auditorKey: 'farmer.audits.auditor.pgsMeenakshi',
    majorCount: 0,
    minorCount: 0,
    ratingKey: 'farmer.audits.rating.good',
    ratingType: 'good',
  },
];

const INTERNAL_PAST_AUDITS: PastAuditDef[] = [
  {
    id: 'int-1',
    day: '28',
    monthYear: 'Apr 25',
    titleKey: 'farmer.audits.outcome.cleanReview',
    auditorKey: 'farmer.audits.auditor.tohfaDevaraj',
    majorCount: 0,
    minorCount: 0,
    ratingKey: 'farmer.profile.rating.excellent',
    ratingType: 'excellent',
  },
  {
    id: 'int-2',
    day: '14',
    monthYear: 'Jan 25',
    titleKey: 'farmer.audits.outcome.minorObservation',
    auditorKey: 'farmer.audits.auditor.tohfaLakshmi',
    majorCount: 0,
    minorCount: 2,
    ratingKey: 'farmer.audits.rating.good',
    ratingType: 'good',
  },
];

const CHECKLIST_DEFS: Array<{ id: string; key: TranslationKey; done: boolean }> = [
  { id: '1', key: 'farmer.audits.checklist.boundaryMarkings', done: true },
  { id: '2', key: 'farmer.audits.checklist.invoicesCompiled', done: true },
  { id: '3', key: 'farmer.audits.checklist.logbookUpdated', done: false },
  { id: '4', key: 'farmer.audits.checklist.labReports', done: false },
  { id: '5', key: 'farmer.audits.checklist.seedCertificates', done: true },
];

interface AuditsScreenProps {
  onBack?: () => void;
  onNavigateToResult?: (auditId: string) => void;
}

export function AuditsScreen({ onBack, onNavigateToResult }: AuditsScreenProps): React.JSX.Element {
  const [activeTab, setActiveTab] = useState<AuditTab>('external');
  const [isReminderSet, setIsReminderSet] = useState(false);
  const [isChecklistVisible, setIsChecklistVisible] = useState(false);
  const [selectedAuditId, setSelectedAuditId] = useState<string | null>(null);

  // Checkable checklist items for Prep Checklist modal
  const [checklistDone, setChecklistDone] = useState<Record<string, boolean>>(
    Object.fromEntries(CHECKLIST_DEFS.map((c) => [c.id, c.done])),
  );

  const toggleChecklistItem = (id: string) => {
    setChecklistDone((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleRemindMe = () => {
    setIsReminderSet(!isReminderSet);
    Alert.alert(
      !isReminderSet ? t('farmer.audits.reminder.setTitle') : t('farmer.audits.reminder.cancelledTitle'),
      !isReminderSet
        ? t('farmer.audits.reminder.setBody', { date: activeTab === 'external' ? '05 Aug 2026' : '19 Jul 2026' })
        : t('farmer.audits.reminder.cancelledBody'),
    );
  };

  const pastAuditDefs = activeTab === 'external' ? EXTERNAL_PAST_AUDITS : INTERNAL_PAST_AUDITS;
  const pastAudits = pastAuditDefs.map((def) => ({
    ...def,
    title: t(def.titleKey),
    auditor: t(def.auditorKey),
    ratingLabel: t(def.ratingKey),
  }));
  const selectedAudit = pastAudits.find((a) => a.id === selectedAuditId) ?? null;
  const checklist = CHECKLIST_DEFS.map((def) => ({ ...def, title: t(def.key), done: checklistDone[def.id] }));

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar barStyle="dark-content" backgroundColor={P.white} />

      {/* ── Top Header ── */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={onBack}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel={t('farmer.common.back')}
        >
          <ArrowBackIcon size={20} color={P.twGray800} />
        </TouchableOpacity>
        <View style={styles.headerTextCol}>
          <Text style={styles.headerTitle}>{t('farmer.profile.audits.title')}</Text>
          <Text style={styles.headerSubtitle}>{t('farmer.audits.headerSubtitle')}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* ── Segmented Control (External / Internal) ── */}
        <View style={styles.tabBar}>
          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'external' ? styles.tabBtnActive : styles.tabBtnInactive]}
            onPress={() => setActiveTab('external')}
            activeOpacity={0.8}
            accessibilityRole="tab"
            accessibilityState={{ selected: activeTab === 'external' }}
          >
            <ShieldCheckIcon size={18} color={activeTab === 'external' ? P.white : P.twGray600} />
            <Text style={[styles.tabBtnText, activeTab === 'external' ? styles.tabBtnTextActive : styles.tabBtnTextInactive]}>
              {t('farmer.profile.audits.external')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'internal' ? styles.tabBtnActive : styles.tabBtnInactive]}
            onPress={() => setActiveTab('internal')}
            activeOpacity={0.8}
            accessibilityRole="tab"
            accessibilityState={{ selected: activeTab === 'internal' }}
          >
            <UsersGroupIcon size={18} color={activeTab === 'internal' ? P.white : P.twGray600} />
            <Text style={[styles.tabBtnText, activeTab === 'internal' ? styles.tabBtnTextActive : styles.tabBtnTextInactive]}>
              {t('farmer.profile.audits.internal')}
            </Text>
          </TouchableOpacity>
        </View>

        {/* ── 3 Summary Metric Cards ── */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statMainValue}>4/yr</Text>
            <Text style={styles.statSubLabel}>{t('farmer.audits.stat.perQuarter')}</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statMainValue}>{t('farmer.audits.stat.doneRatio', { done: 2, total: 4 })}</Text>
            <Text style={styles.statSubLabel}>{t('farmer.audits.stat.doneThisYear')}</Text>
          </View>

          <View style={styles.statCard}>
            <View style={styles.ratingBadgePill}>
              <StarIcon size={11} color={P.white} />
              <Text style={styles.ratingBadgeText}>{t('farmer.profile.rating.excellent')}</Text>
            </View>
            <Text style={styles.statSubLabel}>{t('farmer.audits.stat.latestRating')}</Text>
          </View>
        </View>

        {/* ── Upcoming Audit Hero Card (Green) ── */}
        <View style={styles.upcomingCard}>
          {/* Header Tag */}
          <View style={styles.upcomingTagRow}>
            <CalendarIcon size={14} color={P.green100} />
            <Text style={styles.upcomingTagText}>
              {activeTab === 'external' ? t('farmer.audits.upcoming.tagExternal') : t('farmer.audits.upcoming.tagInternal')}
            </Text>
          </View>

          {/* Title */}
          <Text style={styles.upcomingTitle}>
            {activeTab === 'external' ? t('farmer.audits.upcoming.titleExternal') : t('farmer.audits.upcoming.titleInternal')}
          </Text>

          {/* Details list */}
          <View style={styles.upcomingDetailsList}>
            <View style={styles.upcomingDetailRow}>
              <CalendarIcon size={16} color={P.white} />
              <Text style={styles.upcomingDetailTextBold}>{activeTab === 'external' ? '05 Aug 2026 · 10:00 AM' : '19 Jul 2026 · 02:30 PM'}</Text>
            </View>

            <View style={styles.upcomingDetailRow}>
              <BuildingIcon size={16} color={colors.brandGreenLight} />
              <Text style={styles.upcomingDetailText}>{activeTab === 'external' ? t('farmer.audits.auditor.pgsMeenakshi') : t('farmer.audits.auditor.tohfaDevaraj')}</Text>
            </View>

            <View style={styles.upcomingDetailRow}>
              <LocationPinIcon size={16} color={colors.brandGreenLight} />
              <Text style={styles.upcomingDetailText}>{t('farmer.audits.farmLocation')}</Text>
            </View>
          </View>

          {/* Action buttons */}
          <View style={styles.upcomingActionsRow}>
            <TouchableOpacity style={styles.prepChecklistBtn} activeOpacity={0.85} onPress={() => setIsChecklistVisible(true)}>
              <SlidersChecklistIcon size={16} color={P.twGray900} />
              <Text style={styles.prepChecklistBtnText}>{t('farmer.audits.prepChecklist')}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.remindMeBtn, isReminderSet && { backgroundColor: 'rgba(255, 255, 255, 0.3)' }]}
              activeOpacity={0.85}
              onPress={handleRemindMe}
            >
              <BellIcon size={16} color={P.white} />
              <Text style={styles.remindMeBtnText}>{isReminderSet ? t('farmer.audits.reminding') : t('farmer.audits.remindMe')}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Section Title ── */}
        <Text style={styles.sectionTitle}>
          {activeTab === 'external' ? t('farmer.audits.section.pastExternal') : t('farmer.audits.section.pastInternal')}
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
                  setSelectedAuditId(item.id);
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
                    <Text style={styles.pillGrayText}>{t('farmer.audits.pill.major', { count: item.majorCount })}</Text>
                  </View>

                  <View style={item.minorCount > 0 ? styles.pillOrange : styles.pillGray}>
                    <Text style={item.minorCount > 0 ? styles.pillOrangeText : styles.pillGrayText}>
                      {t('farmer.audits.pill.minor', { count: item.minorCount })}
                    </Text>
                  </View>

                  <View style={item.ratingType === 'excellent' ? styles.pillGreen : styles.pillBlue}>
                    <Text style={styles.pillWhiteText}>{item.ratingLabel}</Text>
                  </View>
                </View>
              </View>

              {/* Chevron Arrow */}
              <View style={styles.chevronWrapper}>
                <ChevronRightIcon size={18} color={P.twGray400} />
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* ── Modal: Prep Checklist ── */}
      <Modal visible={isChecklistVisible} transparent={true} animationType="slide" onRequestClose={() => setIsChecklistVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>{t('farmer.audits.checklistModal.title')}</Text>
                <Text style={styles.modalSub}>
                  {activeTab === 'external' ? t('farmer.audits.checklistModal.subExternal') : t('farmer.audits.checklistModal.subInternal')}
                </Text>
              </View>
              <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setIsChecklistVisible(false)}>
                <Text style={styles.modalCloseBtnText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.checklistBody}>
              {checklist.map((item) => (
                <TouchableOpacity key={item.id} style={styles.checklistItem} activeOpacity={0.7} onPress={() => toggleChecklistItem(item.id)}>
                  <View style={[styles.checkboxBox, item.done && styles.checkboxBoxActive]}>
                    {item.done && <Text style={styles.checkmarkIcon}>✓</Text>}
                  </View>
                  <Text style={[styles.checklistItemText, item.done && styles.checklistItemTextDone]}>{item.title}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.doneBtn} onPress={() => setIsChecklistVisible(false)}>
                <Text style={styles.doneBtnText}>{t('farmer.audits.closeChecklist')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Modal: Past Audit Inspection Details ── */}
      <Modal visible={!!selectedAudit} transparent={true} animationType="fade" onRequestClose={() => setSelectedAuditId(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>{t('farmer.audits.reportModal.title')}</Text>
                <Text style={styles.modalSub}>
                  {selectedAudit?.day} {selectedAudit?.monthYear}
                </Text>
              </View>
              <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setSelectedAuditId(null)}>
                <Text style={styles.modalCloseBtnText}>✕</Text>
              </TouchableOpacity>
            </View>

            {selectedAudit && (
              <View style={styles.auditDetailModalBody}>
                <View style={styles.reportDetailRow}>
                  <Text style={styles.reportDetailLabel}>{t('farmer.audits.reportModal.status')}</Text>
                  <Text style={styles.reportDetailValue}>{selectedAudit.title}</Text>
                </View>
                <View style={styles.reportDetailRow}>
                  <Text style={styles.reportDetailLabel}>{t('farmer.audits.reportModal.auditorBody')}</Text>
                  <Text style={styles.reportDetailValue}>{selectedAudit.auditor}</Text>
                </View>
                <View style={styles.reportDetailRow}>
                  <Text style={styles.reportDetailLabel}>{t('farmer.audits.reportModal.majorNc')}</Text>
                  <Text style={styles.reportDetailValue}>{selectedAudit.majorCount}</Text>
                </View>
                <View style={styles.reportDetailRow}>
                  <Text style={styles.reportDetailLabel}>{t('farmer.audits.reportModal.minorNc')}</Text>
                  <Text style={styles.reportDetailValue}>{selectedAudit.minorCount}</Text>
                </View>
                <View style={[styles.reportDetailRow, { borderBottomWidth: 0 }]}>
                  <Text style={styles.reportDetailLabel}>{t('farmer.audits.reportModal.finalRating')}</Text>
                  <Text style={[styles.reportDetailValue, { color: selectedAudit.ratingType === 'excellent' ? P.primary : P.blue700 }]}>
                    {selectedAudit.ratingLabel}
                  </Text>
                </View>
              </View>
            )}

            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.doneBtn} onPress={() => setSelectedAuditId(null)}>
                <Text style={styles.doneBtnText}>{t('farmer.common.close')}</Text>
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
    backgroundColor: P.lightSurfaceAlt,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
    backgroundColor: P.white,
    borderBottomWidth: 1,
    borderBottomColor: P.surfaceMuted,
    gap: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: P.white,
    borderWidth: 1,
    borderColor: P.twGray200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTextCol: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: P.twGray900,
  },
  headerSubtitle: {
    fontSize: 13,
    color: P.twGray500,
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
    backgroundColor: P.white,
    borderRadius: 14,
    padding: 4,
    gap: 6,
    borderWidth: 1,
    borderColor: P.twGray200,
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
    backgroundColor: P.primary,
  },
  tabBtnInactive: {
    backgroundColor: P.twGray100,
  },
  tabBtnText: {
    fontSize: 15,
    fontWeight: '700',
  },
  tabBtnTextActive: {
    color: P.white,
  },
  tabBtnTextInactive: {
    color: P.twGray600,
  },

  /* 3 Metric Summary Cards */
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  statCard: {
    flex: 1,
    backgroundColor: P.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: P.twGray200,
    paddingVertical: 14,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    shadowColor: P.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  statMainValue: {
    fontSize: 18,
    fontWeight: '800',
    color: P.twGray900,
  },
  statSubLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: P.twGray500,
    textAlign: 'center',
  },
  ratingBadgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: P.primary,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  ratingBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: P.white,
  },

  /* Hero Upcoming Card (Green) */
  upcomingCard: {
    marginTop: 16,
    backgroundColor: P.forestGreen,
    borderRadius: 20,
    padding: 18,
    shadowColor: P.black,
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
    color: P.green100,
    letterSpacing: 0.6,
  },
  upcomingTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: P.white,
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
    color: P.white,
  },
  upcomingDetailText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.brandGreenLight,
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
    backgroundColor: P.white,
    borderRadius: 12,
    paddingVertical: 12,
  },
  prepChecklistBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: P.twGray900,
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
    color: P.white,
  },

  /* Section Title */
  sectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: P.twGray500,
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
    backgroundColor: P.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: P.twGray200,
    padding: 14,
    gap: 12,
    shadowColor: P.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  dateBox: {
    width: 52,
    height: 52,
    borderRadius: 12,
    backgroundColor: colors.brandGreenLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateBoxDay: {
    fontSize: 18,
    fontWeight: '800',
    color: P.deepGreen,
    lineHeight: 20,
  },
  dateBoxMonth: {
    fontSize: 11,
    fontWeight: '700',
    color: P.primary,
    marginTop: 2,
  },
  pastAuditInfoCol: {
    flex: 1,
    gap: 3,
  },
  pastAuditTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: P.twGray900,
  },
  pastAuditAuditor: {
    fontSize: 12,
    color: P.twGray500,
  },
  pillsRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 4,
  },
  pillGray: {
    backgroundColor: P.twGray100,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  pillGrayText: {
    fontSize: 11,
    fontWeight: '600',
    color: P.twGray700,
  },
  pillOrange: {
    backgroundColor: P.twOrange100,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  pillOrangeText: {
    fontSize: 11,
    fontWeight: '700',
    color: P.twOrange600,
  },
  pillGreen: {
    backgroundColor: P.primary,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  pillBlue: {
    backgroundColor: P.blue700,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  pillWhiteText: {
    fontSize: 11,
    fontWeight: '700',
    color: P.white,
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
    backgroundColor: P.white,
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
    borderBottomColor: P.surfaceMuted,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: P.twGray900,
  },
  modalSub: {
    fontSize: 12,
    color: P.twGray500,
    marginTop: 2,
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: P.twGray100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCloseBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: P.twGray500,
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
    borderBottomColor: P.surfaceMuted,
  },
  checkboxBox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: P.twGray300,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxBoxActive: {
    borderColor: P.primary,
    backgroundColor: P.primary,
  },
  checkmarkIcon: {
    color: P.white,
    fontSize: 12,
    fontWeight: '800',
  },
  checklistItemText: {
    flex: 1,
    fontSize: 14,
    color: P.twGray800,
  },
  checklistItemTextDone: {
    color: P.twGray400,
    textDecorationLine: 'line-through',
  },
  auditDetailModalBody: {
    marginBottom: 16,
    backgroundColor: P.twGray50,
    borderRadius: 12,
    padding: 14,
  },
  reportDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: P.twGray200,
  },
  reportDetailLabel: {
    fontSize: 13,
    color: P.twGray500,
  },
  reportDetailValue: {
    fontSize: 13,
    fontWeight: '600',
    color: P.twGray900,
  },
  modalFooter: {
    marginTop: 8,
  },
  doneBtn: {
    backgroundColor: P.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  doneBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: P.white,
  },
});
