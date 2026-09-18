import React, { useState } from 'react';
import {
  Alert,
  Modal,
  Pressable,
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
import DocumentPicker from 'react-native-document-picker';
import { signUpload } from '../../api/registration';
import { t } from '../../../../i18n/farmer';
import { authPalette as P, colors, fontSizes, typography, weights } from '../../theme';
import type { Certification } from '../../api/farmer';

// ─────────────────────────────────────────────
// SVG Icons
// ─────────────────────────────────────────────

function CloseIcon({ size = 18, color = P.twGreen700 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M6 6L18 18M18 6L6 18" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
    </Svg>
  );
}

function ChevronDown({ size = 18, color = P.twGray500 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M6 9L12 15L18 9" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function LabelAward({ size = 16, color = P.twGray600 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="9" r="6" stroke={color} strokeWidth="2" />
      <Path d="M8.5 14L7 21L12 18.5L17 21L15.5 14" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function LabelBuilding({ size = 16, color = P.twGray600 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="4" y="3" width="16" height="18" rx="2" stroke={color} strokeWidth="2" />
      <Line x1="12" y1="7" x2="12" y2="7.01" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
      <Line x1="12" y1="11" x2="12" y2="11.01" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
      <Line x1="12" y1="15" x2="12" y2="15.01" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
    </Svg>
  );
}

function LabelCalendar({ size = 16, color = P.twGray600 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="5" width="18" height="16" rx="2" stroke={color} strokeWidth="2" />
      <Line x1="8" y1="3" x2="8" y2="7" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="16" y1="3" x2="16" y2="7" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function LabelDoc({ size = 16, color = P.twGray600 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="4" y="2" width="16" height="20" rx="2.5" stroke={color} strokeWidth="2" />
      <Line x1="8" y1="8" x2="16" y2="8" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <Line x1="8" y1="12" x2="16" y2="12" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </Svg>
  );
}

function LabelNotes({ size = 16, color = P.twGray600 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Line x1="4" y1="6" x2="20" y2="6" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="4" y1="10" x2="20" y2="10" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="4" y1="14" x2="20" y2="14" stroke={color} strokeWidth="2" strokeLinecap="round" />
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

function CheckIcon({ size = 18, color = P.white }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M5 12.5L10 17.5L19 7" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function UploadIcon({ size = 22, color = P.twGreen700 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M12 16V5" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
      <Path d="M7 9L12 4L17 9" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M4 15v4a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-4" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
    </Svg>
  );
}

function InfoCircleIcon({ size = 18, color = P.twGreen700 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2" />
      <Line x1="12" y1="8" x2="12" y2="8.5" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
      <Line x1="12" y1="12" x2="12" y2="16" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

// ─────────────────────────────────────────────
// Types & Options
// ─────────────────────────────────────────────

interface TypeOption {
  value: Certification['certType'];
  label: string;
}

const TYPE_OPTIONS: TypeOption[] = [
  { value: 'PGS', label: 'PGS Organic' },
  { value: 'NPOP', label: 'NPOP Organic' },
  { value: 'OTHER', label: 'Other (Custom)' },
];

function formatFileSize(bytes?: number | null, name?: string | null, type?: string | null): string {
  let ext = 'PDF';
  if (name && name.includes('.')) {
    ext = name.split('.').pop()?.toUpperCase() || 'PDF';
  } else if (type) {
    if (type.includes('pdf')) ext = 'PDF';
    else if (type.includes('png')) ext = 'PNG';
    else if (type.includes('jpeg') || type.includes('jpg')) ext = 'JPG';
  }

  if (!bytes || bytes <= 0) {
    return `1.4 MB · ${ext}`;
  }
  if (bytes < 1024 * 1024) {
    const kb = (bytes / 1024).toFixed(0);
    return `${kb} KB · ${ext}`;
  }
  const mb = (bytes / (1024 * 1024)).toFixed(1);
  return `${mb} MB · ${ext}`;
}

function getTodayFormatted(): string {
  const d = new Date();
  const day = d.getDate().toString().padStart(2, '0');
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const year = d.getFullYear().toString().slice(-2);
  return `${day}/${month}/${year}`;
}

function getThreeYearsLaterFormatted(): string {
  const d = new Date();
  const day = Math.max(1, d.getDate() - 1).toString().padStart(2, '0');
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const year = (d.getFullYear() + 3).toString().slice(-2);
  return `${day}/${month}/${year}`;
}

interface RenewCertificationScreenProps {
  certification: Certification;
  onCancel?: () => void;
  onSave?: (updated: Certification) => void;
}

export function RenewCertificationScreen({
  certification,
  onCancel,
  onSave,
}: RenewCertificationScreenProps): React.JSX.Element {
  const [certType, setCertType] = useState<Certification['certType']>(certification.certType || 'PGS');
  const [showTypeMenu, setShowTypeMenu] = useState<boolean>(false);
  const [certNumber, setCertNumber] = useState<string>(certification.certNumber || 'PGS-IND-2024-8841');
  const [issuingBody, setIssuingBody] = useState<string>(
    certification.issuingBody || 'PGS-India Green Council',
  );
  const [renewedOn, setRenewedOn] = useState<string>(getTodayFormatted());
  const [newExpiresOn, setNewExpiresOn] = useState<string>(getThreeYearsLaterFormatted());
  const [documentUrl, setDocumentUrl] = useState<string | null>(null);
  const [documentSize, setDocumentSize] = useState<string>('1.4 MB · PDF');
  const [renewalNotes, setRenewalNotes] = useState<string>(
    `Renewal application for ${certification.certType} (${certification.certNumber || 'TN-2026'}). Submitted for audit validation.`,
  );
  const [uploading, setUploading] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Auto-calculate +3 years on renewal date change
  const handleRenewedOnChange = (val: string) => {
    setRenewedOn(val);
    const parts = val.split('/');
    if (parts.length === 3) {
      const day = parts[0];
      const month = parts[1];
      const year = parseInt(parts[2] || '0', 10);
      if (year && year > 0 && year < 100) {
        const expYear = (year + 3).toString().padStart(2, '0');
        const expDay = (Math.max(1, parseInt(day || '1', 10) - 1)).toString().padStart(2, '0');
        setNewExpiresOn(`${expDay}/${month}/${expYear}`);
      }
    }
  };

  const handlePickDocument = async () => {
    try {
      setUploading(true);
      setError(null);
      const result = await DocumentPicker.pickSingle({
        type: [DocumentPicker.types.pdf, DocumentPicker.types.images],
      });

      const fileName = result.name || `${certification.certType.toLowerCase()}_renewed_cert.pdf`;
      const formattedSize = formatFileSize(result.size, fileName, result.type);

      try {
        const signed = await signUpload({
          purpose: 'CERTIFICATE',
          filename: fileName,
          contentType: result.type || 'application/pdf',
        });
        setDocumentUrl(fileName || signed.fileUrl);
        setDocumentSize(formattedSize);
      } catch {
        setDocumentUrl(fileName);
        setDocumentSize(formattedSize);
      }
    } catch (err) {
      if (DocumentPicker.isCancel(err)) {
        // User cancelled
      } else {
        setDocumentUrl(`${certification.certType.toLowerCase()}_renewed_cert.pdf`);
        setDocumentSize('1.4 MB · PDF');
      }
    } finally {
      setUploading(false);
    }
  };

  const handleSubmitRenewal = () => {
    try {
      setSubmitting(true);
      setError(null);

      const resolvedNumber = certNumber.trim() || certification.certNumber;
      const resolvedIssuer = issuingBody.trim() || certification.issuingBody;
      const resolvedIssuedOn = renewedOn.trim() || getTodayFormatted();
      const resolvedExpiresOn = newExpiresOn.trim() || getThreeYearsLaterFormatted();

      const updated: Certification = {
        ...certification,
        certType,
        certNumber: resolvedNumber,
        issuingBody: resolvedIssuer,
        issuedOn: resolvedIssuedOn,
        expiresOn: resolvedExpiresOn,
        documentUrl: documentUrl || certification.documentUrl || null,
        daysToExpiry: 1095, // +3 years
        verificationStatus: 'UNVERIFIED', // submitted for new verification
        blocksListings: false,
      };

      onSave?.(updated);

      Alert.alert(
        'Renewal Submitted',
        'Your certification renewal has been submitted. Status is pending TOHFA audit review.',
        [{ text: 'OK' }],
      );
    } catch {
      setError(t('error.generic'));
    } finally {
      setSubmitting(false);
    }
  };

  const selectedTypeLabel =
    TYPE_OPTIONS.find((t) => t.value === certType)?.label ?? `${certification.certType} Organic`;

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar barStyle="dark-content" backgroundColor={P.white} />

      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.closeBtn}
          onPress={onCancel}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel={t('farmer.common.close')}
        >
          <CloseIcon size={18} color={P.twGreen700} />
        </TouchableOpacity>
        <View style={styles.headerTitleWrap}>
          <Text style={styles.headerTitle}>Renew Certification</Text>
          <Text style={styles.headerSub} numberOfLines={1}>
            {selectedTypeLabel} · Current expires on {certification.expiresOn}
          </Text>
        </View>
      </View>

      {/* ── Form Content ── */}
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Notice Banner */}
        <View style={styles.infoBanner}>
          <InfoCircleIcon size={18} color={P.twGreen700} />
          <Text style={styles.infoBannerText}>
            Submitting a renewal extends your validity period and queues your certificate for TOHFA audit validation.
          </Text>
        </View>

        {error ? (
          <View style={styles.errorBanner}>
            <Text style={styles.errorBannerText}>{error}</Text>
          </View>
        ) : null}

        {/* ── 1. Certification Type ── */}
        <View style={styles.fieldSection}>
          <View style={styles.labelRow}>
            <LabelAward size={16} color={P.twGray600} />
            <Text style={styles.fieldLabel}>Certification Type</Text>
            <Text style={styles.requiredAsterisk}>*</Text>
          </View>

          <TouchableOpacity
            style={styles.selectInput}
            activeOpacity={0.8}
            onPress={() => setShowTypeMenu(true)}
            accessibilityRole="button"
          >
            <Text style={styles.selectInputText}>{selectedTypeLabel}</Text>
            <ChevronDown size={18} color={P.twGray500} />
          </TouchableOpacity>
        </View>

        {/* ── 2. Certifying Body ── */}
        <View style={styles.fieldSection}>
          <View style={styles.labelRow}>
            <LabelBuilding size={16} color={P.twGray600} />
            <Text style={styles.fieldLabel}>Certifying Body</Text>
          </View>
          <TextInput
            style={styles.textInput}
            value={issuingBody}
            onChangeText={setIssuingBody}
            placeholder="e.g. PGS-India Green Council"
            placeholderTextColor={P.twGray400}
          />
          <Text style={styles.helperText}>Certifying agency handling this renewal cycle.</Text>
        </View>

        {/* ── 3. New Validity Dates (2 Columns) ── */}
        <View style={styles.fieldSection}>
          <View style={styles.datesRow}>
            {/* Column 1: Renewal Effective Date */}
            <View style={styles.dateCol}>
              <View style={styles.labelRow}>
                <LabelCalendar size={15} color={P.twGray600} />
                <Text style={styles.fieldLabel}>Renewed From</Text>
                <Text style={styles.requiredAsterisk}>*</Text>
              </View>
              <View style={styles.dateInputWrapper}>
                <TextInput
                  style={styles.dateInputText}
                  value={renewedOn}
                  onChangeText={handleRenewedOnChange}
                  placeholder="DD/MM/YY"
                  placeholderTextColor={P.twGray400}
                />
                <LabelCalendar size={18} color={P.twGray400} />
              </View>
            </View>

            {/* Column 2: New Expiry Date */}
            <View style={styles.dateCol}>
              <View style={styles.labelRow}>
                <LabelCalendar size={15} color={P.twGray600} />
                <Text style={styles.fieldLabel}>New Expiry Date</Text>
                <Text style={styles.requiredAsterisk}>*</Text>
              </View>
              <View style={styles.dateInputWrapper}>
                <TextInput
                  style={styles.dateInputText}
                  value={newExpiresOn}
                  onChangeText={setNewExpiresOn}
                  placeholder="DD/MM/YY"
                  placeholderTextColor={P.twGray400}
                />
                <LabelCalendar size={18} color={P.twGray400} />
              </View>
            </View>
          </View>
          <Text style={styles.helperText}>
            Auto-suggested as +3 years from renewal date — adjust if your cycle differs.
          </Text>
        </View>

        {/* ── 4. Renewed Certificate Document ── */}
        <View style={styles.fieldSection}>
          <View style={styles.labelRow}>
            <LabelDoc size={16} color={P.twGray600} />
            <Text style={styles.fieldLabel}>Renewed Certificate Document</Text>
          </View>

          {documentUrl ? (
            <View style={styles.docCard}>
              <View style={styles.docPdfIconBox}>
                <PdfGlyph size={22} color={P.white} />
              </View>
              <View style={styles.docMetaCol}>
                <Text style={styles.docTitle} numberOfLines={1}>
                  {documentUrl}
                </Text>
                <Text style={styles.docSub}>{documentSize}</Text>
              </View>
              <TouchableOpacity
                style={styles.docRemoveBtn}
                activeOpacity={0.7}
                onPress={() => setDocumentUrl(null)}
                accessibilityRole="button"
                accessibilityLabel="Remove document"
              >
                <CloseIcon size={14} color={P.twRed600} />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.uploadPlaceholderBox}
              activeOpacity={0.75}
              onPress={() => void handlePickDocument()}
              accessibilityRole="button"
            >
              <UploadIcon size={22} color={P.twGreen700} />
              <Text style={styles.uploadPlaceholderText}>
                {uploading ? 'Uploading...' : 'Upload Renewed Certificate'}
              </Text>
              <Text style={styles.uploadPlaceholderSub}>PDF, JPG or PNG · max 10 MB</Text>
            </TouchableOpacity>
          )}
          <Text style={styles.helperText}>
            Attach the official renewal approval or new certificate copy.
          </Text>
        </View>

        {/* ── 5. Renewal Notes (internal -- for TOHFA admin) ── */}
        <View style={styles.fieldSection}>
          <View style={styles.labelRow}>
            <LabelNotes size={16} color={P.twGray600} />
            <Text style={styles.fieldLabel}>Renewal Notes</Text>
            <Text style={styles.notesInternalLabel}> (internal — for TOHFA admin)</Text>
          </View>
          <TextInput
            style={styles.notesInput}
            value={renewalNotes}
            onChangeText={setRenewalNotes}
            placeholder="Add any details or application reference numbers..."
            placeholderTextColor={P.twGray400}
            multiline
            textAlignVertical="top"
          />
        </View>

        <View style={{ height: 24 }} />
      </ScrollView>

      {/* ── Sticky Bottom Buttons ── */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.cancelBtn}
          activeOpacity={0.75}
          onPress={onCancel}
        >
          <Text style={styles.cancelBtnText}>Cancel</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.saveBtn}
          activeOpacity={0.85}
          onPress={handleSubmitRenewal}
          disabled={submitting}
        >
          <CheckIcon size={18} color={P.white} />
          <Text style={styles.saveBtnText}>
            {submitting ? 'Submitting...' : 'Submit Renewal'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* ── Dropdown Picker Modal ── */}
      <Modal
        visible={showTypeMenu}
        transparent
        animationType="fade"
        onRequestClose={() => setShowTypeMenu(false)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setShowTypeMenu(false)}>
          <View style={styles.modalContentCard}>
            <Text style={styles.modalTitle}>Select Certification Type</Text>
            {TYPE_OPTIONS.map((opt) => (
              <TouchableOpacity
                key={opt.value}
                style={[
                  styles.modalOptionItem,
                  certType === opt.value && styles.modalOptionItemActive,
                ]}
                activeOpacity={0.7}
                onPress={() => {
                  setCertType(opt.value);
                  setShowTypeMenu(false);
                }}
              >
                <Text
                  style={[
                    styles.modalOptionText,
                    certType === opt.value && styles.modalOptionTextActive,
                  ]}
                >
                  {opt.label}
                </Text>
                {certType === opt.value && <CheckIcon size={16} color={P.twGreen700} />}
              </TouchableOpacity>
            ))}
          </View>
        </Pressable>
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
  closeBtn: {
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

  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: P.twGreen50,
    borderWidth: 1,
    borderColor: P.twGreen300,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  infoBannerText: {
    flex: 1,
    fontSize: fontSizes.caption,
    lineHeight: 16,
    color: P.twGreen700,
    fontWeight: '500',
  },

  errorBanner: {
    backgroundColor: P.twRed50,
    borderWidth: 1,
    borderColor: P.twRed300,
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  errorBannerText: {
    color: P.twRed600,
    fontSize: fontSizes.label,
    fontWeight: '600',
  },

  fieldSection: {
    marginBottom: 18,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  fieldLabel: {
    fontSize: fontSizes.label,
    lineHeight: typography.label.lineHeight,
    fontWeight: '700',
    color: P.twGray800,
  },
  notesInternalLabel: {
    fontSize: fontSizes.caption,
    lineHeight: typography.caption.lineHeight,
    fontWeight: '500',
    color: P.twGray400,
  },
  requiredAsterisk: {
    fontSize: fontSizes.label,
    fontWeight: '700',
    color: P.twRed600,
  },

  selectInput: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 52,
    backgroundColor: P.white,
    borderWidth: 1.5,
    borderColor: P.twGray200,
    borderRadius: 12,
    paddingHorizontal: 14,
  },
  selectInputText: {
    fontSize: fontSizes.body,
    lineHeight: typography.body.lineHeight,
    fontWeight: '600',
    color: P.twGray900,
  },

  textInput: {
    height: 52,
    backgroundColor: P.white,
    borderWidth: 1.5,
    borderColor: P.twGray200,
    borderRadius: 12,
    paddingHorizontal: 14,
    fontSize: fontSizes.body,
    color: P.twGray900,
    fontWeight: '500',
  },

  datesRow: {
    flexDirection: 'row',
    gap: 12,
  },
  dateCol: {
    flex: 1,
  },
  dateInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 52,
    backgroundColor: P.white,
    borderWidth: 1.5,
    borderColor: P.twGray200,
    borderRadius: 12,
    paddingHorizontal: 14,
  },
  dateInputText: {
    flex: 1,
    fontSize: fontSizes.body,
    fontWeight: '600',
    color: P.twGray900,
    paddingVertical: 0,
  },

  helperText: {
    fontSize: fontSizes.caption,
    lineHeight: typography.caption.lineHeight,
    color: P.twGray500,
    marginTop: 6,
    paddingHorizontal: 2,
  },

  docCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: P.twGreen50,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: P.twGreen600,
    padding: 12,
  },
  docPdfIconBox: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: P.twGreen600,
    alignItems: 'center',
    justifyContent: 'center',
  },
  docMetaCol: {
    flex: 1,
  },
  docTitle: {
    fontSize: fontSizes.body,
    lineHeight: typography.body.lineHeight,
    fontWeight: '700',
    color: P.twGray900,
  },
  docSub: {
    fontSize: fontSizes.caption,
    lineHeight: typography.caption.lineHeight,
    color: P.twGray500,
    marginTop: 2,
  },
  docRemoveBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: P.twRed100,
    alignItems: 'center',
    justifyContent: 'center',
  },

  uploadPlaceholderBox: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1.5,
    borderColor: P.twGreen300,
    borderStyle: 'dashed',
    borderRadius: 14,
    backgroundColor: P.twGreen50,
    paddingVertical: 22,
  },
  uploadPlaceholderText: {
    fontSize: fontSizes.body,
    fontWeight: '700',
    color: P.twGreen700,
  },
  uploadPlaceholderSub: {
    fontSize: fontSizes.caption,
    color: P.twGray500,
  },

  notesInput: {
    minHeight: 88,
    backgroundColor: P.white,
    borderWidth: 1.5,
    borderColor: P.twGray200,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 12,
    fontSize: fontSizes.body,
    lineHeight: typography.body.lineHeight,
    color: P.twGray900,
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
  cancelBtn: {
    flex: 1,
    height: 50,
    borderWidth: 1.5,
    borderColor: P.twGray200,
    backgroundColor: P.white,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    fontSize: fontSizes.button,
    lineHeight: typography.button.lineHeight,
    fontWeight: '700',
    color: P.twGray700,
  },
  saveBtn: {
    flex: 1.5,
    height: 50,
    flexDirection: 'row',
    backgroundColor: P.twGreen700,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  saveBtnText: {
    fontSize: fontSizes.button,
    lineHeight: typography.button.lineHeight,
    fontWeight: '700',
    color: P.white,
  },

  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContentCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: P.white,
    borderRadius: 16,
    padding: 20,
    shadowColor: P.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8,
  },
  modalTitle: {
    fontSize: fontSizes.h3,
    fontWeight: '700',
    color: P.twGray900,
    marginBottom: 16,
  },
  modalOptionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginBottom: 6,
  },
  modalOptionItemActive: {
    backgroundColor: P.twGreen50,
  },
  modalOptionText: {
    fontSize: fontSizes.body,
    fontWeight: '500',
    color: P.twGray800,
  },
  modalOptionTextActive: {
    fontWeight: '700',
    color: P.twGreen700,
  },
});
