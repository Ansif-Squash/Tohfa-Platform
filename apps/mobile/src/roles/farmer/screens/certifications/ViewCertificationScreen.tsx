import React from 'react';
import {
  Alert,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { evalCertificateWarning, type Certification } from '../../api/farmer';
import { t } from '../../../../i18n/farmer';
import { authPalette as P, colors, fontSizes, typography, weights } from '../../theme';

// ─────────────────────────────────────────────
// SVG Icons
// ─────────────────────────────────────────────

function ChevronLeft({ size = 20, color = P.ink }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M15 19L8 12L15 5" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function LeafIcon({ size = 22, color = P.twGreen600 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M17 8C8 10 5.9 16.17 3.82 19.34A1 1 0 0 0 5 21c3-.25 9-2 12-7 2.5-4 1-10 0-6z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M3.82 19.34C8 18 15 16 22 4" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function GearIcon({ size = 22, color = P.twOrange600 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="3" stroke={color} strokeWidth="2" />
      <Path
        d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"
        stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      />
    </Svg>
  );
}

function CheckCircleIcon({ size = 16, color = P.twGreen600 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2" />
      <Path d="M7.5 12.5L10.5 15.5L16.5 9" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function ClockIcon({ size = 16, color = P.twOrange600 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2" />
      <Path d="M12 6v6l4 2" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function PdfGlyph({ size = 22, color = P.white }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M14 2H7a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7l-5-5z"
        stroke={color}
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <Path d="M14 2v5h5" stroke={color} strokeWidth="2" strokeLinejoin="round" />
      <Path d="M9.5 15.5h5" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function PencilIcon({ size = 16, color = P.twGray700 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function RefreshIcon({ size = 16, color = P.white }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.19" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function EyeIcon({ size = 16, color = P.twGreen700 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Circle cx="12" cy="12" r="3" stroke={color} strokeWidth="2" />
    </Svg>
  );
}

// ─────────────────────────────────────────────
// Screen
// ─────────────────────────────────────────────

interface ViewCertificationScreenProps {
  certification: Certification;
  onBack: () => void;
  onEdit?: (certification: Certification) => void;
  onRenew?: (certification: Certification) => void;
}

export function ViewCertificationScreen({
  certification,
  onBack,
  onEdit,
  onRenew,
}: ViewCertificationScreenProps): React.JSX.Element {
  const warning = evalCertificateWarning(certification.daysToExpiry, 30);
  const isExpired = warning.isExpired;
  const isExpiring = warning.isWarning;

  const statusLabel = isExpired ? 'EXPIRED' : isExpiring ? 'EXPIRING SOON' : 'ACTIVE';
  const statusBg = isExpired ? P.twRed100 : isExpiring ? P.twAmber100 : P.twGreen100;
  const statusFg = isExpired ? P.twRed600 : isExpiring ? P.twAmber600 : P.twGreen600;

  const docName = certification.documentUrl
    ? certification.documentUrl.split('/').pop() || 'pgs_certificate_2024.pdf'
    : 'pgs_certificate_2024.pdf';

  const handlePreviewDocument = () => {
    Alert.alert(
      docName,
      `Certificate Document\nFormat: PDF (1.4 MB)\nVerification: ${certification.verificationStatus}\nIssuing Body: ${certification.issuingBody}`,
      [{ text: 'Close' }],
    );
  };

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar barStyle="dark-content" backgroundColor={P.white} />

      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={onBack}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel={t('farmer.common.back')}
        >
          <ChevronLeft />
        </TouchableOpacity>
        <View style={styles.headerTitleWrap}>
          <Text style={styles.headerTitle}>Certification Details</Text>
          <Text style={styles.headerSub} numberOfLines={1}>
            {certification.certType} · {certification.certNumber || 'PGS-TN-2026-00871'}
          </Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Top Hero Card ── */}
        <View style={styles.heroCard}>
          <View style={styles.heroTopRow}>
            <View
              style={[
                styles.heroIconCircle,
                { backgroundColor: isExpired ? P.twRed100 : isExpiring ? P.twAmber100 : P.twGreen100 },
              ]}
            >
              {certification.certType === 'PGS' ? (
                <LeafIcon color={isExpired ? P.twRed600 : isExpiring ? P.twOrange600 : P.twGreen600} />
              ) : (
                <GearIcon color={isExpired ? P.twRed600 : isExpiring ? P.twOrange600 : P.twGreen600} />
              )}
            </View>
            <View style={styles.heroTextCol}>
              <Text style={styles.heroCertType}>{certification.certType} Organic</Text>
              <Text style={styles.heroIssuer}>{certification.issuingBody}</Text>
            </View>
            <View style={[styles.heroStatusBadge, { backgroundColor: statusBg }]}>
              <Text style={[styles.heroStatusText, { color: statusFg }]}>{statusLabel}</Text>
            </View>
          </View>

          {/* ── Days Remaining Strip ── */}
          <View
            style={[
              styles.strip,
              {
                backgroundColor: isExpired ? P.twRed50 : isExpiring ? P.twOrange50 : P.twGreen50,
              },
            ]}
          >
            {isExpired ? (
              <ClockIcon size={16} color={P.twRed600} />
            ) : isExpiring ? (
              <ClockIcon size={16} color={P.twOrange600} />
            ) : (
              <CheckCircleIcon size={16} color={P.twGreen600} />
            )}
            <Text
              style={[
                styles.stripTxt,
                { color: isExpired ? P.twRed600 : isExpiring ? P.twOrange600 : P.twGreen600 },
              ]}
            >
              {isExpired
                ? `Overdue by ${Math.abs(certification.daysToExpiry)} days`
                : isExpiring
                ? `${certification.daysToExpiry} days remaining · Renew now`
                : `${certification.daysToExpiry} days remaining`}
            </Text>
          </View>
        </View>

        {/* ── Section 1: Certificate Information ── */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionHeading}>Certificate Information</Text>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Certificate Number</Text>
            <Text style={styles.infoValue}>{certification.certNumber || 'PGS-TN-2026-00871'}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Certifying Body</Text>
            <Text style={styles.infoValue}>{certification.issuingBody}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoGrid}>
            <View style={styles.infoCol}>
              <Text style={styles.infoLabel}>Certified On</Text>
              <Text style={styles.infoValueBold}>{certification.issuedOn}</Text>
            </View>
            <View style={styles.infoCol}>
              <Text style={styles.infoLabel}>Valid Until</Text>
              <Text
                style={[
                  styles.infoValueBold,
                  isExpired && { color: P.twRed600 },
                  isExpiring && { color: P.twAmber600 },
                ]}
              >
                {certification.expiresOn}
              </Text>
            </View>
          </View>
        </View>

        {/* ── Section 2: Verification & Compliance ── */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionHeading}>Verification & Audit</Text>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>TOHFA Verification</Text>
            <View
              style={[
                styles.pillBadge,
                {
                  backgroundColor:
                    certification.verificationStatus === 'VERIFIED' ? P.twGreen100 : P.twAmber100,
                },
              ]}
            >
              <Text
                style={[
                  styles.pillBadgeText,
                  {
                    color:
                      certification.verificationStatus === 'VERIFIED'
                        ? P.twGreen700
                        : P.twOrange600,
                  },
                ]}
              >
                {certification.verificationStatus}
              </Text>
            </View>
          </View>

          {certification.verifiedBy ? (
            <>
              <View style={styles.divider} />
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Audited By</Text>
                <Text style={styles.infoValue}>{certification.verifiedBy}</Text>
              </View>
            </>
          ) : null}

          <View style={styles.divider} />
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Marketplace Status</Text>
            <Text
              style={[
                styles.infoValueBold,
                { color: certification.blocksListings ? P.twRed600 : P.twGreen700 },
              ]}
            >
              {certification.blocksListings ? 'Blocked from Trade' : 'Active for Marketplace'}
            </Text>
          </View>
        </View>

        {/* ── Section 3: Certificate Document ── */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionHeading}>Attached Document</Text>

          <View style={styles.docCard}>
            <View style={styles.docPdfIconBox}>
              <PdfGlyph size={22} color={P.white} />
            </View>
            <View style={styles.docMetaCol}>
              <Text style={styles.docTitle} numberOfLines={1}>
                {docName}
              </Text>
              <Text style={styles.docSub}>1.4 MB · PDF · Signed</Text>
            </View>
            <TouchableOpacity
              style={styles.docViewBtn}
              activeOpacity={0.75}
              onPress={handlePreviewDocument}
              accessibilityRole="button"
              accessibilityLabel="View document"
            >
              <EyeIcon size={16} color={P.twGreen700} />
              <Text style={styles.docViewBtnText}>View</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Section 4: Notes ── */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionHeading}>Internal Notes (Admin)</Text>
          <Text style={styles.notesText}>
            Renewal application already submitted to regional council on 02 Feb.
          </Text>
        </View>

        <View style={{ height: 24 }} />
      </ScrollView>

      {/* ── Sticky Action Footer ── */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.editBtn}
          activeOpacity={0.75}
          onPress={() => onEdit?.(certification)}
        >
          <PencilIcon size={16} color={P.twGray700} />
          <Text style={styles.editBtnText}>Edit Details</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.renewBtn,
            { backgroundColor: isExpiring || isExpired ? P.twGreen700 : P.twGreen600 },
          ]}
          activeOpacity={0.85}
          onPress={() => onRenew?.(certification)}
        >
          <RefreshIcon size={16} color={P.white} />
          <Text style={styles.renewBtnText}>Renew Now</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// ─────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: P.paleStoneBgAlt,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: P.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSoft,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: P.mintTintBg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: P.greenPaleBg,
  },
  headerTitleWrap: {
    flex: 1,
  },
  headerTitle: {
    fontSize: fontSizes.h2,
    lineHeight: typography.h2.lineHeight,
    fontWeight: weights.bold,
    color: P.twGray900,
  },
  headerSub: {
    fontSize: fontSizes.helper,
    lineHeight: typography.helper.lineHeight,
    color: P.twGray500,
    marginTop: 1,
  },

  scroll: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 20,
  },

  heroCard: {
    backgroundColor: P.white,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1.5,
    borderColor: P.twGray200,
    marginBottom: 16,
    shadowColor: P.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  heroIconCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTextCol: {
    flex: 1,
  },
  heroCertType: {
    fontSize: fontSizes.h3,
    fontWeight: '700',
    color: P.twGray900,
  },
  heroIssuer: {
    fontSize: fontSizes.caption,
    color: P.twGray500,
    marginTop: 2,
  },
  heroStatusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  heroStatusText: {
    fontSize: fontSizes.badge,
    fontWeight: '700',
    letterSpacing: 0.5,
  },

  strip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  stripTxt: {
    fontSize: fontSizes.label,
    fontWeight: '600',
    flex: 1,
  },

  sectionCard: {
    backgroundColor: P.white,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: P.twGray200,
    marginBottom: 14,
  },
  sectionHeading: {
    fontSize: fontSizes.label,
    lineHeight: typography.label.lineHeight,
    fontWeight: '700',
    color: P.twGray900,
    marginBottom: 12,
  },

  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  infoLabel: {
    fontSize: fontSizes.body,
    color: P.twGray500,
    fontWeight: '500',
  },
  infoValue: {
    fontSize: fontSizes.body,
    fontWeight: '600',
    color: P.twGray900,
    maxWidth: '55%',
    textAlign: 'right',
  },
  infoValueBold: {
    fontSize: fontSizes.body,
    fontWeight: '700',
    color: P.twGray900,
  },

  infoGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  infoCol: {
    flex: 1,
  },

  divider: {
    height: 1,
    backgroundColor: colors.borderSoft,
    marginVertical: 10,
  },

  pillBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  pillBadgeText: {
    fontSize: fontSizes.badge,
    fontWeight: '700',
  },

  docCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: P.twGreen50,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: P.twGreen600,
    padding: 12,
  },
  docPdfIconBox: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: P.twGreen600,
    alignItems: 'center',
    justifyContent: 'center',
  },
  docMetaCol: {
    flex: 1,
  },
  docTitle: {
    fontSize: fontSizes.body,
    fontWeight: '700',
    color: P.twGray900,
  },
  docSub: {
    fontSize: fontSizes.caption,
    color: P.twGray500,
    marginTop: 2,
  },
  docViewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: P.white,
    borderWidth: 1,
    borderColor: P.twGreen600,
  },
  docViewBtnText: {
    fontSize: fontSizes.caption,
    fontWeight: '700',
    color: P.twGreen700,
  },

  notesText: {
    fontSize: fontSizes.body,
    lineHeight: typography.body.lineHeight,
    color: P.twGray700,
    backgroundColor: P.paleStoneBg,
    padding: 12,
    borderRadius: 10,
  },

  footer: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: P.white,
    borderTopWidth: 1,
    borderTopColor: colors.borderSoft,
  },
  editBtn: {
    flex: 1,
    height: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1.5,
    borderColor: P.twGray200,
    backgroundColor: P.white,
    borderRadius: 12,
  },
  editBtnText: {
    fontSize: fontSizes.button,
    fontWeight: '700',
    color: P.twGray700,
  },
  renewBtn: {
    flex: 1.4,
    height: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 12,
  },
  renewBtnText: {
    fontSize: fontSizes.button,
    fontWeight: '700',
    color: P.white,
  },
});
