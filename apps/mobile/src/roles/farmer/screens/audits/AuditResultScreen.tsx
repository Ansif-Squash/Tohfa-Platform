import React, { useState } from 'react';
import {
  Alert,
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
import Svg, { Circle, Line, Path, Rect } from 'react-native-svg';
import { t } from '../../../../i18n/farmer';
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

function DownloadIcon({ size = 18, color = P.twGreen700 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M7 10l5 5 5-5" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Line x1="12" y1="15" x2="12" y2="3" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function ShieldCheckIcon({ size = 16, color = P.sky600 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M9 12l2 2 4-4" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function ClockIcon({ size = 14, color = P.twGray500 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2" />
      <Path d="M12 6v6l4 2" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function CheckCircleIcon({ size = 18, color = P.twGreen700 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2" />
      <Path d="M8 12l2.5 2.5L16 9" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function AlertTriangleIcon({ size = 18, color = P.twOrange600 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"
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

function CalendarIcon({ size = 14, color = P.twOrange600 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="4" width="18" height="18" rx="2" stroke={color} strokeWidth="2" />
      <Line x1="16" y1="2" x2="16" y2="6" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="8" y1="2" x2="8" y2="6" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="3" y1="10" x2="21" y2="10" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function ChevronDownIcon({ size = 14, color = P.twGray500, isOpen = false }: { size?: number; color?: string; isOpen?: boolean }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={{ transform: [{ rotate: isOpen ? '180deg' : '0deg' }] }}>
      <Path d="M6 9l6 6 6-6" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function PdfFileIcon({ size = 22, color = P.twRed600 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M14 2v6h6" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Line x1="9" y1="13" x2="15" y2="13" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="9" y1="17" x2="13" y2="17" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function PhotoGalleryIcon({ size = 22, color = P.twGreen700 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="3" width="18" height="18" rx="2" stroke={color} strokeWidth="2" />
      <Circle cx="8.5" cy="8.5" r="1.5" fill={color} />
      <Path d="M21 15l-5-5L5 21" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function FlagIcon({ size = 16, color = P.twGray700 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Line x1="4" y1="22" x2="4" y2="15" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function UserAvatarIcon({ size = 36 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 36 36" fill="none">
      <Circle cx="18" cy="18" r="18" fill={P.slate200} />
      <Circle cx="18" cy="14" r="6" fill={P.slate500} />
      <Path d="M7 32c0-6.075 4.925-11 11-11s11 4.925 11 11" fill={P.slate500} />
    </Svg>
  );
}

// ─────────────────────────────────────────────
// Gauge Speedometer Component
// ─────────────────────────────────────────────

function RatingGauge({ score = 815 }: { score?: number }) {
  return (
    <View style={gaugeStyles.container}>
      <Svg width={220} height={120} viewBox="0 0 200 115">
        {/* Arc Segments: Poor, Moderate, Good, Excellent */}
        <Path d="M 25 95 A 75 75 0 0 1 46.97 41.97" stroke={P.brown400} strokeWidth="14" strokeLinecap="round" fill="none" />
        <Path d="M 46.97 41.97 A 75 75 0 0 1 100 20" stroke={P.tanBrown} strokeWidth="14" fill="none" />
        <Path d="M 100 20 A 75 75 0 0 1 153.03 41.97" stroke={P.twBlue600} strokeWidth="14" fill="none" />
        <Path d="M 153.03 41.97 A 75 75 0 0 1 175 95" stroke={P.primary} strokeWidth="14" strokeLinecap="round" fill="none" />

        {/* Gauge Needle pointing towards green / 815 */}
        <Line x1="100" y1="95" x2="162" y2="66" stroke={P.twGray800} strokeWidth="3.5" strokeLinecap="round" />

        {/* Pivot center */}
        <Circle cx="100" cy="95" r="7" fill={P.twGray800} />
        <Circle cx="100" cy="95" r="3" fill={P.white} />
      </Svg>

      {/* Score and Rating Text in the center below needle */}
      <View style={gaugeStyles.scoreBox}>
        <Text style={gaugeStyles.scoreNumber}>{score}</Text>
        <Text style={gaugeStyles.scoreLabel}>{t('farmer.profile.rating.excellent')}</Text>
      </View>

      {/* Scale Category Labels */}
      <View style={gaugeStyles.scaleLabelsRow}>
        <Text style={gaugeStyles.scaleLabel}>{t('farmer.auditResult.gauge.poor')}</Text>
        <Text style={gaugeStyles.scaleLabel}>{t('farmer.auditResult.gauge.moderate')}</Text>
        <Text style={gaugeStyles.scaleLabel}>{t('farmer.auditResult.gauge.good')}</Text>
        <Text style={gaugeStyles.scaleLabel}>{t('farmer.auditResult.gauge.excellentCaps')}</Text>
      </View>

      {/* Legend subtext */}
      <Text style={gaugeStyles.scaleSubtext}>{t('farmer.auditResult.gauge.scaleLegend')}</Text>
    </View>
  );
}

const gaugeStyles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginVertical: 6,
  },
  scoreBox: {
    alignItems: 'center',
    marginTop: -25,
    marginBottom: 10,
  },
  scoreNumber: {
    fontSize: 32,
    fontWeight: '800',
    color: P.primary,
    letterSpacing: 0.5,
  },
  scoreLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: P.primary,
    marginTop: -2,
  },
  scaleLabelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 8,
    marginTop: 4,
  },
  scaleLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: P.twGray500,
    letterSpacing: 0.5,
  },
  scaleSubtext: {
    fontSize: 10,
    color: P.twGray400,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 14,
  },
});

// ─────────────────────────────────────────────
// Main AuditResultScreen
//
// Specification gap: there is no audits endpoint in `../../api/farmer` or
// `docs/openapi.yaml` yet. `auditId` is accepted (App.tsx passes the id the
// farmer tapped in AuditsScreen) but this screen still renders the same
// fixed mock report regardless of which id was passed, exactly as it did in
// farm-rating -- wiring it to a real per-audit report is future work.
// ─────────────────────────────────────────────

interface AuditResultScreenProps {
  onBack?: () => void;
  auditId?: string | undefined;
}

export function AuditResultScreen({ onBack, auditId: _auditId }: AuditResultScreenProps): React.JSX.Element {
  const [isCorrectiveActionOpen, setIsCorrectiveActionOpen] = useState(true);
  const [isDisputeModalVisible, setIsDisputeModalVisible] = useState(false);
  const [disputeReason, setDisputeReason] = useState('');

  const handleDownload = () => {
    Alert.alert(t('farmer.auditResult.download.title'), t('farmer.auditResult.download.body'), [{ text: t('farmer.common.ok') }]);
  };

  const handleOpenAttachment = (name: string) => {
    Alert.alert(t('farmer.auditResult.attachment.openingTitle'), t('farmer.auditResult.attachment.openingBody', { name }), [
      { text: t('farmer.common.ok') },
    ]);
  };

  const handleSubmitDispute = () => {
    if (!disputeReason.trim()) {
      Alert.alert(t('farmer.auditResult.dispute.requiredTitle'), t('farmer.auditResult.dispute.requiredBody'));
      return;
    }
    Alert.alert(t('farmer.auditResult.dispute.submittedTitle'), t('farmer.auditResult.dispute.submittedBody'), [
      {
        text: t('farmer.common.ok'),
        onPress: () => {
          setIsDisputeModalVisible(false);
          setDisputeReason('');
        },
      },
    ]);
  };

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
          <Text style={styles.headerTitle}>{t('farmer.auditResult.title')}</Text>
          <Text style={styles.headerSubtitle}>{t('farmer.audits.upcoming.titleExternal')}</Text>
        </View>

        <TouchableOpacity
          style={styles.downloadBtn}
          onPress={handleDownload}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel={t('farmer.auditResult.download.title')}
        >
          <DownloadIcon size={18} color={P.twGreen700} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* ── Meta Block: Pill + Date + Auditor + Time ── */}
        <View style={styles.metaContainer}>
          <View style={styles.externalBadgePill}>
            <ShieldCheckIcon size={15} color={P.sky600} />
            <Text style={styles.externalBadgeText}>{t('farmer.auditResult.externalAudit')}</Text>
          </View>

          <Text style={styles.auditDateHeading}>18 July 2025</Text>
          <Text style={styles.auditorSubtitle}>{t('farmer.audits.auditor.pgsMeenakshi')}</Text>

          <View style={styles.timeOnFarmRow}>
            <ClockIcon size={14} color={P.twGray500} />
            <Text style={styles.timeOnFarmText}>{t('farmer.auditResult.timeOnFarm', { hours: 1, minutes: 45 })}</Text>
          </View>
        </View>

        {/* ── Compliant Banner ── */}
        <View style={styles.compliantBanner}>
          <CheckCircleIcon size={18} color={P.twGreen700} />
          <Text style={styles.compliantBannerText}>{t('farmer.audits.outcome.minorObservation')}</Text>
        </View>

        {/* ── Card: ADMIN RATING ── */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t('farmer.auditResult.adminRating')}</Text>
          <RatingGauge score={815} />
        </View>

        {/* ── 2 Metric Boxes (Major / Minor findings) ── */}
        <View style={styles.findingsRow}>
          <View style={styles.majorBox}>
            <Text style={styles.majorNumber}>0</Text>
            <Text style={styles.majorLabel}>{t('farmer.auditResult.majorFindings')}</Text>
          </View>

          <View style={styles.minorBox}>
            <Text style={styles.minorNumber}>1</Text>
            <Text style={styles.minorLabel}>{t('farmer.auditResult.minorFindings')}</Text>
          </View>
        </View>

        {/* ── Section: CORRECTIVE ACTIONS (1) ── */}
        <Text style={styles.sectionHeader}>{t('farmer.auditResult.section.correctiveActions', { count: 1 })}</Text>

        <TouchableOpacity style={styles.correctiveCard} activeOpacity={0.9} onPress={() => setIsCorrectiveActionOpen(!isCorrectiveActionOpen)}>
          <View style={styles.correctiveTopRow}>
            <AlertTriangleIcon size={18} color={P.twOrange600} />
            <Text style={styles.correctiveTitle}>{t('farmer.auditResult.corrective.bufferZoneSignage')}</Text>
            <View style={styles.pendingBadge}>
              <Text style={styles.pendingBadgeText}>{t('farmer.auditResult.corrective.pending')}</Text>
            </View>
            <ChevronDownIcon size={14} color={P.twGray500} isOpen={isCorrectiveActionOpen} />
          </View>

          {isCorrectiveActionOpen && (
            <View style={styles.correctiveDetails}>
              <Text style={styles.correctiveDesc}>{t('farmer.auditResult.corrective.desc')}</Text>
              <View style={styles.dueDateRow}>
                <CalendarIcon size={14} color={P.twOrange600} />
                <Text style={styles.dueDateText}>{t('farmer.auditResult.corrective.due', { date: '30 Sep 2025' })}</Text>
              </View>
            </View>
          )}
        </TouchableOpacity>

        {/* ── Section: AUDITOR REMARKS ── */}
        <Text style={styles.sectionHeader}>{t('farmer.auditResult.section.auditorRemarks')}</Text>
        <View style={styles.card}>
          <View style={styles.auditorRow}>
            <UserAvatarIcon size={38} />
            <View style={styles.auditorNameCol}>
              <Text style={styles.auditorName}>R. Meenakshi</Text>
              <Text style={styles.auditorRole}>{t('farmer.auditResult.leadAuditor')}</Text>
            </View>
          </View>
          <Text style={styles.auditorQuote}>{t('farmer.auditResult.quote')}</Text>
        </View>

        {/* ── Section: ATTACHMENTS ── */}
        <Text style={styles.sectionHeader}>{t('farmer.auditResult.section.attachments')}</Text>
        <View style={styles.attachmentsRow}>
          <TouchableOpacity style={styles.attachmentCard} activeOpacity={0.7} onPress={() => handleOpenAttachment('Report.pdf')}>
            <PdfFileIcon size={22} color={P.twRed600} />
            <View style={styles.attachmentTextCol}>
              <Text style={styles.attachmentName}>Report.pdf</Text>
              <Text style={styles.attachmentMeta}>640 KB</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.attachmentCard}
            activeOpacity={0.7}
            onPress={() => handleOpenAttachment(t('farmer.auditResult.photosCount', { count: 12 }))}
          >
            <PhotoGalleryIcon size={22} color={P.twGreen700} />
            <View style={styles.attachmentTextCol}>
              <Text style={styles.attachmentName}>{t('farmer.auditResult.photos')}</Text>
              <Text style={styles.attachmentMeta}>{t('farmer.auditResult.imagesCount', { count: 12 })}</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* ── Section: AUDIT TIMELINE ── */}
        <Text style={styles.sectionHeader}>{t('farmer.auditResult.section.timeline')}</Text>
        <View style={styles.timelineRow}>
          {/* Step 1 */}
          <View style={styles.timelineStep}>
            <View style={styles.timelineCheckCircle}>
              <Text style={styles.timelineCheckMark}>✓</Text>
            </View>
            <Text style={styles.timelineStepLabel}>{t('farmer.auditResult.timeline.scheduled')}</Text>
          </View>

          <View style={styles.timelineConnectorLine} />

          {/* Step 2 */}
          <View style={styles.timelineStep}>
            <View style={styles.timelineCheckCircle}>
              <Text style={styles.timelineCheckMark}>✓</Text>
            </View>
            <Text style={styles.timelineStepLabel}>{t('farmer.auditResult.timeline.visited')}</Text>
          </View>

          <View style={styles.timelineConnectorLine} />

          {/* Step 3 */}
          <View style={styles.timelineStep}>
            <View style={styles.timelineCheckCircle}>
              <Text style={styles.timelineCheckMark}>✓</Text>
            </View>
            <Text style={styles.timelineStepLabel}>{t('farmer.auditResult.timeline.reviewed')}</Text>
          </View>

          <View style={styles.timelineConnectorLine} />

          {/* Step 4 */}
          <View style={styles.timelineStep}>
            <View style={styles.timelineCheckCircle}>
              <Text style={styles.timelineCheckMark}>✓</Text>
            </View>
            <Text style={styles.timelineStepLabel}>{t('farmer.auditResult.timeline.published')}</Text>
          </View>
        </View>

        {/* ── Bottom Dispute Button ── */}
        <TouchableOpacity style={styles.disputeButton} activeOpacity={0.8} onPress={() => setIsDisputeModalVisible(true)}>
          <FlagIcon size={16} color={P.twGray700} />
          <Text style={styles.disputeButtonText}>{t('farmer.auditResult.disputeFinding')}</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* ── Modal: Dispute a finding ── */}
      <Modal visible={isDisputeModalVisible} transparent={true} animationType="slide" onRequestClose={() => setIsDisputeModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>{t('farmer.auditResult.disputeModal.title')}</Text>
                <Text style={styles.modalSub}>{t('farmer.auditResult.disputeModal.sub', { date: '18 July 2025' })}</Text>
              </View>
              <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setIsDisputeModalVisible(false)}>
                <Text style={styles.modalCloseBtnText}>✕</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.disputeFieldLabel}>{t('farmer.auditResult.disputeModal.fieldLabel')}</Text>
            <TextInput
              style={styles.disputeInput}
              multiline
              numberOfLines={4}
              placeholder={t('farmer.auditResult.disputeModal.placeholder')}
              placeholderTextColor={P.twGray400}
              value={disputeReason}
              onChangeText={setDisputeReason}
            />

            <View style={styles.disputeActionRow}>
              <TouchableOpacity style={styles.cancelDisputeBtn} onPress={() => setIsDisputeModalVisible(false)}>
                <Text style={styles.cancelDisputeBtnText}>{t('farmer.common.cancel')}</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.submitDisputeBtn} onPress={handleSubmitDispute}>
                <Text style={styles.submitDisputeBtnText}>{t('farmer.auditResult.disputeModal.submit')}</Text>
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
  downloadBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: P.mintTintBg,
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

  /* Meta Container */
  metaContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  externalBadgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: P.sky100,
    borderWidth: 1,
    borderColor: P.twSky200,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginBottom: 10,
  },
  externalBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: P.twSky700,
  },
  auditDateHeading: {
    fontSize: 22,
    fontWeight: '800',
    color: P.twGray900,
  },
  auditorSubtitle: {
    fontSize: 14,
    color: P.twGray600,
    marginTop: 4,
  },
  timeOnFarmRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
  },
  timeOnFarmText: {
    fontSize: 13,
    color: P.twGray500,
  },

  /* Compliant Banner */
  compliantBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.brandGreenLight,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 16,
  },
  compliantBannerText: {
    fontSize: 14,
    fontWeight: '700',
    color: P.twGreen800,
  },

  /* Card */
  card: {
    backgroundColor: P.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: P.twGray200,
    padding: 16,
    marginBottom: 14,
    shadowColor: P.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  cardTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: P.twGray500,
    letterSpacing: 0.8,
    textAlign: 'center',
    marginBottom: 6,
  },

  /* Findings row */
  findingsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 18,
  },
  majorBox: {
    flex: 1,
    backgroundColor: P.twGreen50,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: P.twGreen100,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  majorNumber: {
    fontSize: 26,
    fontWeight: '800',
    color: P.twGreen800,
  },
  majorLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: P.twGreen800,
  },
  minorBox: {
    flex: 1,
    backgroundColor: P.twOrange50,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: P.twOrange200,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  minorNumber: {
    fontSize: 26,
    fontWeight: '800',
    color: P.twOrange600,
  },
  minorLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: P.twOrange700,
  },

  /* Section Header */
  sectionHeader: {
    fontSize: 12,
    fontWeight: '800',
    color: P.twGray500,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginTop: 10,
    marginBottom: 10,
  },

  /* Corrective Actions Card */
  correctiveCard: {
    backgroundColor: P.white,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: P.twOrange500,
    padding: 16,
    marginBottom: 16,
  },
  correctiveTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  correctiveTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    color: P.twGray900,
  },
  pendingBadge: {
    backgroundColor: P.twOrange100,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  pendingBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: P.twOrange600,
  },
  correctiveDetails: {
    marginTop: 10,
  },
  correctiveDesc: {
    fontSize: 13,
    color: P.twGray600,
    lineHeight: 19,
  },
  dueDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: P.twOrange50,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginTop: 12,
  },
  dueDateText: {
    fontSize: 13,
    fontWeight: '700',
    color: P.twOrange600,
  },

  /* Auditor Remarks */
  auditorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  auditorNameCol: {
    flex: 1,
  },
  auditorName: {
    fontSize: 15,
    fontWeight: '700',
    color: P.twGray900,
  },
  auditorRole: {
    fontSize: 12,
    color: P.twGray500,
    marginTop: 1,
  },
  auditorQuote: {
    fontStyle: 'italic',
    fontSize: 13,
    color: P.twGray700,
    lineHeight: 20,
    marginTop: 12,
  },

  /* Attachments */
  attachmentsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  attachmentCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: P.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: P.twGray200,
    padding: 12,
  },
  attachmentTextCol: {
    flex: 1,
  },
  attachmentName: {
    fontSize: 13,
    fontWeight: '700',
    color: P.twGray900,
  },
  attachmentMeta: {
    fontSize: 11,
    color: P.twGray500,
    marginTop: 1,
  },

  /* Timeline */
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: P.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: P.twGray200,
    paddingVertical: 18,
    paddingHorizontal: 12,
    marginBottom: 20,
  },
  timelineStep: {
    alignItems: 'center',
    gap: 6,
  },
  timelineCheckCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: P.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timelineCheckMark: {
    color: P.white,
    fontSize: 14,
    fontWeight: '800',
  },
  timelineStepLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: P.twGray700,
  },
  timelineConnectorLine: {
    flex: 1,
    height: 2.5,
    backgroundColor: P.primary,
    marginHorizontal: 4,
    marginBottom: 18,
  },

  /* Dispute Button */
  disputeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: P.white,
    borderWidth: 1,
    borderColor: P.twGray300,
    borderRadius: 12,
    paddingVertical: 14,
    marginBottom: 10,
  },
  disputeButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: P.twGray700,
  },

  /* Dispute Modal */
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
  disputeFieldLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: P.twGray700,
    marginBottom: 8,
  },
  disputeInput: {
    borderWidth: 1,
    borderColor: P.twGray300,
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    color: P.twGray900,
    minHeight: 100,
    textAlignVertical: 'top',
    marginBottom: 16,
  },
  disputeActionRow: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelDisputeBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: P.twGray300,
    alignItems: 'center',
  },
  cancelDisputeBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: P.twGray700,
  },
  submitDisputeBtn: {
    flex: 1.4,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: P.primary,
    alignItems: 'center',
  },
  submitDisputeBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: P.white,
  },
});
