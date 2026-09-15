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

function DownloadIcon({ size = 18, color = '#15803D' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M7 10l5 5 5-5"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Line
        x1="12"
        y1="15"
        x2="12"
        y2="3"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function ShieldCheckIcon({ size = 16, color = '#0284C7' }: { size?: number; color?: string }) {
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
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function ClockIcon({ size = 14, color = '#6B7280' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2" />
      <Path
        d="M12 6v6l4 2"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function CheckCircleIcon({ size = 18, color = '#15803D' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2" />
      <Path
        d="M8 12l2.5 2.5L16 9"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function AlertTriangleIcon({ size = 18, color = '#EA580C' }: { size?: number; color?: string }) {
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

function CalendarIcon({ size = 14, color = '#EA580C' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="4" width="18" height="18" rx="2" stroke={color} strokeWidth="2" />
      <Line x1="16" y1="2" x2="16" y2="6" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="8" y1="2" x2="8" y2="6" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="3" y1="10" x2="21" y2="10" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function ChevronDownIcon({
  size = 14,
  color = '#6B7280',
  isOpen = false,
}: {
  size?: number;
  color?: string;
  isOpen?: boolean;
}) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      style={{ transform: [{ rotate: isOpen ? '180deg' : '0deg' }] }}
    >
      <Path
        d="M6 9l6 6 6-6"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function PdfFileIcon({ size = 22, color = '#DC2626' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M14 2v6h6" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Line x1="9" y1="13" x2="15" y2="13" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="9" y1="17" x2="13" y2="17" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function PhotoGalleryIcon({ size = 22, color = '#15803D' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="3" width="18" height="18" rx="2" stroke={color} strokeWidth="2" />
      <Circle cx="8.5" cy="8.5" r="1.5" fill={color} />
      <Path
        d="M21 15l-5-5L5 21"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function FlagIcon({ size = 16, color = '#374151' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Line
        x1="4"
        y1="22"
        x2="4"
        y2="15"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function UserAvatarIcon({ size = 36 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 36 36" fill="none">
      <Circle cx="18" cy="18" r="18" fill="#E2E8F0" />
      <Circle cx="18" cy="14" r="6" fill="#64748B" />
      <Path d="M7 32c0-6.075 4.925-11 11-11s11 4.925 11 11" fill="#64748B" />
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
        {/* Poor segment (Brown/Tan) */}
        <Path
          d="M 25 95 A 75 75 0 0 1 46.97 41.97"
          stroke="#8D6E63"
          strokeWidth="14"
          strokeLinecap="round"
          fill="none"
        />
        {/* Moderate segment (Yellow-Tan) */}
        <Path
          d="M 46.97 41.97 A 75 75 0 0 1 100 20"
          stroke="#D4A373"
          strokeWidth="14"
          fill="none"
        />
        {/* Good segment (Blue) */}
        <Path
          d="M 100 20 A 75 75 0 0 1 153.03 41.97"
          stroke="#2563EB"
          strokeWidth="14"
          fill="none"
        />
        {/* Excellent segment (Green) */}
        <Path
          d="M 153.03 41.97 A 75 75 0 0 1 175 95"
          stroke="#2E7D32"
          strokeWidth="14"
          strokeLinecap="round"
          fill="none"
        />

        {/* Gauge Needle pointing towards green / 815 */}
        <Line
          x1="100"
          y1="95"
          x2="162"
          y2="66"
          stroke="#1F2937"
          strokeWidth="3.5"
          strokeLinecap="round"
        />

        {/* Pivot center */}
        <Circle cx="100" cy="95" r="7" fill="#1F2937" />
        <Circle cx="100" cy="95" r="3" fill="#FFFFFF" />
      </Svg>

      {/* Score and Rating Text in the center below needle */}
      <View style={gaugeStyles.scoreBox}>
        <Text style={gaugeStyles.scoreNumber}>{score}</Text>
        <Text style={gaugeStyles.scoreLabel}>Excellent</Text>
      </View>

      {/* Scale Category Labels */}
      <View style={gaugeStyles.scaleLabelsRow}>
        <Text style={gaugeStyles.scaleLabel}>POOR</Text>
        <Text style={gaugeStyles.scaleLabel}>MODERATE</Text>
        <Text style={gaugeStyles.scaleLabel}>GOOD</Text>
        <Text style={gaugeStyles.scaleLabel}>EXCELLENT</Text>
      </View>

      {/* Legend subtext */}
      <Text style={gaugeStyles.scaleSubtext}>
        Scale 0–900+ · Poor &lt; 650 · Moderate 650–700 · Good 700–749 · Excellent 750+
      </Text>
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
    color: '#2E7D32',
    letterSpacing: 0.5,
  },
  scoreLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#2E7D32',
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
    color: '#6B7280',
    letterSpacing: 0.5,
  },
  scaleSubtext: {
    fontSize: 10,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 14,
  },
});

// ─────────────────────────────────────────────
// Main AuditResultScreen
// ─────────────────────────────────────────────

interface AuditResultScreenProps {
  onBack?: () => void;
  auditId?: string | undefined;
}

export function AuditResultScreen({ onBack, auditId }: AuditResultScreenProps): React.JSX.Element {
  const [isCorrectiveActionOpen, setIsCorrectiveActionOpen] = useState(true);
  const [isDisputeModalVisible, setIsDisputeModalVisible] = useState(false);
  const [disputeReason, setDisputeReason] = useState('');

  const handleDownload = () => {
    Alert.alert(
      'Download Report',
      'Audit Inspection Report (Report.pdf) has been downloaded successfully to your device.',
      [{ text: 'OK' }]
    );
  };

  const handleOpenAttachment = (name: string) => {
    Alert.alert('Opening Attachment', `Loading ${name}...`, [{ text: 'OK' }]);
  };

  const handleSubmitDispute = () => {
    if (!disputeReason.trim()) {
      Alert.alert('Required', 'Please enter a description for your dispute.');
      return;
    }
    Alert.alert(
      'Dispute Submitted',
      'Your dispute has been logged and sent to PGS Regional Council for review. A response will be provided within 3 working days.',
      [
        {
          text: 'OK',
          onPress: () => {
            setIsDisputeModalVisible(false);
            setDisputeReason('');
          },
        },
      ]
    );
  };

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
          <Text style={styles.headerTitle}>Audit Result</Text>
          <Text style={styles.headerSubtitle}>Quarterly External Audit</Text>
        </View>

        <TouchableOpacity
          style={styles.downloadBtn}
          onPress={handleDownload}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Download Report"
        >
          <DownloadIcon size={18} color="#15803D" />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Meta Block: Pill + Date + Auditor + Time ── */}
        <View style={styles.metaContainer}>
          <View style={styles.externalBadgePill}>
            <ShieldCheckIcon size={15} color="#0284C7" />
            <Text style={styles.externalBadgeText}>External Audit</Text>
          </View>

          <Text style={styles.auditDateHeading}>18 July 2025</Text>
          <Text style={styles.auditorSubtitle}>PGS Regional Council · R. Meenakshi</Text>

          <View style={styles.timeOnFarmRow}>
            <ClockIcon size={14} color="#6B7280" />
            <Text style={styles.timeOnFarmText}>1 hr 45 min on farm</Text>
          </View>
        </View>

        {/* ── Compliant Banner ── */}
        <View style={styles.compliantBanner}>
          <CheckCircleIcon size={18} color="#15803D" />
          <Text style={styles.compliantBannerText}>Compliant with minor observation</Text>
        </View>

        {/* ── Card: ADMIN RATING ── */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>ADMIN RATING</Text>
          <RatingGauge score={815} />
        </View>

        {/* ── 2 Metric Boxes (Major / Minor findings) ── */}
        <View style={styles.findingsRow}>
          <View style={styles.majorBox}>
            <Text style={styles.majorNumber}>0</Text>
            <Text style={styles.majorLabel}>Major findings</Text>
          </View>

          <View style={styles.minorBox}>
            <Text style={styles.minorNumber}>1</Text>
            <Text style={styles.minorLabel}>Minor findings</Text>
          </View>
        </View>

        {/* ── Section: CORRECTIVE ACTIONS (1) ── */}
        <Text style={styles.sectionHeader}>CORRECTIVE ACTIONS (1)</Text>

        <TouchableOpacity
          style={styles.correctiveCard}
          activeOpacity={0.9}
          onPress={() => setIsCorrectiveActionOpen(!isCorrectiveActionOpen)}
        >
          <View style={styles.correctiveTopRow}>
            <AlertTriangleIcon size={18} color="#EA580C" />
            <Text style={styles.correctiveTitle}>Buffer zone signage</Text>
            <View style={styles.pendingBadge}>
              <Text style={styles.pendingBadgeText}>PENDING</Text>
            </View>
            <ChevronDownIcon size={14} color="#6B7280" isOpen={isCorrectiveActionOpen} />
          </View>

          {isCorrectiveActionOpen && (
            <View style={styles.correctiveDetails}>
              <Text style={styles.correctiveDesc}>
                Northern boundary shared with a conventional farm lacks a visible 30 ft buffer
                marker. Install signage and photograph before the next review.
              </Text>
              <View style={styles.dueDateRow}>
                <CalendarIcon size={14} color="#EA580C" />
                <Text style={styles.dueDateText}>Due: 30 Sep 2025</Text>
              </View>
            </View>
          )}
        </TouchableOpacity>

        {/* ── Section: AUDITOR REMARKS ── */}
        <Text style={styles.sectionHeader}>AUDITOR REMARKS</Text>
        <View style={styles.card}>
          <View style={styles.auditorRow}>
            <UserAvatarIcon size={38} />
            <View style={styles.auditorNameCol}>
              <Text style={styles.auditorName}>R. Meenakshi</Text>
              <Text style={styles.auditorRole}>Lead Auditor · PGS Regional Council</Text>
            </View>
          </View>
          <Text style={styles.auditorQuote}>
            &ldquo;Well-maintained records and excellent composting practice. Zone-wise crop
            rotation is exemplary. Address the buffer signage and this farm remains a model PGS
            unit.&rdquo;
          </Text>
        </View>

        {/* ── Section: ATTACHMENTS ── */}
        <Text style={styles.sectionHeader}>ATTACHMENTS</Text>
        <View style={styles.attachmentsRow}>
          <TouchableOpacity
            style={styles.attachmentCard}
            activeOpacity={0.7}
            onPress={() => handleOpenAttachment('Report.pdf')}
          >
            <PdfFileIcon size={22} color="#DC2626" />
            <View style={styles.attachmentTextCol}>
              <Text style={styles.attachmentName}>Report.pdf</Text>
              <Text style={styles.attachmentMeta}>640 KB</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.attachmentCard}
            activeOpacity={0.7}
            onPress={() => handleOpenAttachment('Photos (12 images)')}
          >
            <PhotoGalleryIcon size={22} color="#15803D" />
            <View style={styles.attachmentTextCol}>
              <Text style={styles.attachmentName}>Photos</Text>
              <Text style={styles.attachmentMeta}>12 images</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* ── Section: AUDIT TIMELINE ── */}
        <Text style={styles.sectionHeader}>AUDIT TIMELINE</Text>
        <View style={styles.timelineRow}>
          {/* Step 1 */}
          <View style={styles.timelineStep}>
            <View style={styles.timelineCheckCircle}>
              <Text style={styles.timelineCheckMark}>✓</Text>
            </View>
            <Text style={styles.timelineStepLabel}>Scheduled</Text>
          </View>

          <View style={styles.timelineConnectorLine} />

          {/* Step 2 */}
          <View style={styles.timelineStep}>
            <View style={styles.timelineCheckCircle}>
              <Text style={styles.timelineCheckMark}>✓</Text>
            </View>
            <Text style={styles.timelineStepLabel}>Visited</Text>
          </View>

          <View style={styles.timelineConnectorLine} />

          {/* Step 3 */}
          <View style={styles.timelineStep}>
            <View style={styles.timelineCheckCircle}>
              <Text style={styles.timelineCheckMark}>✓</Text>
            </View>
            <Text style={styles.timelineStepLabel}>Reviewed</Text>
          </View>

          <View style={styles.timelineConnectorLine} />

          {/* Step 4 */}
          <View style={styles.timelineStep}>
            <View style={styles.timelineCheckCircle}>
              <Text style={styles.timelineCheckMark}>✓</Text>
            </View>
            <Text style={styles.timelineStepLabel}>Published</Text>
          </View>
        </View>

        {/* ── Bottom Dispute Button ── */}
        <TouchableOpacity
          style={styles.disputeButton}
          activeOpacity={0.8}
          onPress={() => setIsDisputeModalVisible(true)}
        >
          <FlagIcon size={16} color="#374151" />
          <Text style={styles.disputeButtonText}>Dispute a finding</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* ── Modal: Dispute a finding ── */}
      <Modal
        visible={isDisputeModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setIsDisputeModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Dispute Audit Finding</Text>
                <Text style={styles.modalSub}>18 July 2025 · Buffer zone signage</Text>
              </View>
              <TouchableOpacity
                style={styles.modalCloseBtn}
                onPress={() => setIsDisputeModalVisible(false)}
              >
                <Text style={styles.modalCloseBtnText}>✕</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.disputeFieldLabel}>Describe the reason for dispute</Text>
            <TextInput
              style={styles.disputeInput}
              multiline
              numberOfLines={4}
              placeholder="Explain why this finding should be re-evaluated or provide additional context..."
              placeholderTextColor="#9CA3AF"
              value={disputeReason}
              onChangeText={setDisputeReason}
            />

            <View style={styles.disputeActionRow}>
              <TouchableOpacity
                style={styles.cancelDisputeBtn}
                onPress={() => setIsDisputeModalVisible(false)}
              >
                <Text style={styles.cancelDisputeBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.submitDisputeBtn}
                onPress={handleSubmitDispute}
              >
                <Text style={styles.submitDisputeBtnText}>Submit Dispute</Text>
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
  downloadBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EAF6EC',
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

  /* Meta Container */
  metaContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  externalBadgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#E0F2FE',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginBottom: 10,
  },
  externalBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0369A1',
  },
  auditDateHeading: {
    fontSize: 22,
    fontWeight: '800',
    color: '#111827',
  },
  auditorSubtitle: {
    fontSize: 14,
    color: '#4B5563',
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
    color: '#6B7280',
  },

  /* Compliant Banner */
  compliantBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#E8F5E9',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 16,
  },
  compliantBannerText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#166534',
  },

  /* Card */
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 16,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  cardTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#6B7280',
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
    backgroundColor: '#F0FDF4',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#DCFCE7',
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  majorNumber: {
    fontSize: 26,
    fontWeight: '800',
    color: '#166534',
  },
  majorLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#166534',
  },
  minorBox: {
    flex: 1,
    backgroundColor: '#FFF7ED',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#FED7AA',
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  minorNumber: {
    fontSize: 26,
    fontWeight: '800',
    color: '#EA580C',
  },
  minorLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#C2410C',
  },

  /* Section Header */
  sectionHeader: {
    fontSize: 12,
    fontWeight: '800',
    color: '#6B7280',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginTop: 10,
    marginBottom: 10,
  },

  /* Corrective Actions Card */
  correctiveCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#F97316',
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
    color: '#111827',
  },
  pendingBadge: {
    backgroundColor: '#FFEDD5',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  pendingBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#EA580C',
  },
  correctiveDetails: {
    marginTop: 10,
  },
  correctiveDesc: {
    fontSize: 13,
    color: '#4B5563',
    lineHeight: 19,
  },
  dueDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFF7ED',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginTop: 12,
  },
  dueDateText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#EA580C',
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
    color: '#111827',
  },
  auditorRole: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 1,
  },
  auditorQuote: {
    fontStyle: 'italic',
    fontSize: 13,
    color: '#374151',
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
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 12,
  },
  attachmentTextCol: {
    flex: 1,
  },
  attachmentName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111827',
  },
  attachmentMeta: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 1,
  },

  /* Timeline */
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
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
    backgroundColor: '#2E7D32',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timelineCheckMark: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  timelineStepLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#374151',
  },
  timelineConnectorLine: {
    flex: 1,
    height: 2.5,
    backgroundColor: '#2E7D32',
    marginHorizontal: 4,
    marginBottom: 18,
  },

  /* Dispute Button */
  disputeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    paddingVertical: 14,
    marginBottom: 10,
  },
  disputeButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#374151',
  },

  /* Dispute Modal */
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
  disputeFieldLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 8,
  },
  disputeInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    color: '#111827',
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
    borderColor: '#D1D5DB',
    alignItems: 'center',
  },
  cancelDisputeBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#374151',
  },
  submitDisputeBtn: {
    flex: 1.4,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#2E7D32',
    alignItems: 'center',
  },
  submitDisputeBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
