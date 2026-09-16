import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import DocumentPicker, { types, isCancel } from 'react-native-document-picker';
import DownloadIcon from '../../assets/icons/download.svg';
import { ErrorState } from '@tohfa/mobile-ui';
import { validateStep } from './validation';
import type {
  Step4DocumentsData,
  DocumentItemData,
} from '../../storage/registrationDraft';

// ─────────────────────────────────────────────
// Design Mockup Palette (Step 4 Documents)
// ─────────────────────────────────────────────
const SCREEN_BG = '#FFFFFF';
const BRAND_GREEN = '#266E2B';
const HEADER_TITLE = '#143D17';
const SUBTITLE_COLOR = '#677E6A';
const DOC_BOX_BG = '#EDF5EB';
const DOC_BOX_BORDER = '#266E2B';
const TITLE_DARK = '#111D13';
const SUBTITLE_MUTED = '#6F7E71';
const REQUIRED_RED = '#E24B4A';
const UPLOAD_BORDER = '#CAD5C9';
const INFO_BG = '#EBF3FA';
const INFO_BORDER = '#204168';
const INFO_TEXT = '#1C3B5E';
const BACK_BORDER = '#266E2B';
const BACK_ARROW_BORDER = '#DCE5D8';
const INACTIVE_SEGMENT = '#E0DDD2';

function formatFileSize(bytes?: number | null): string {
  if (!bytes || bytes <= 0) return '1.2 MB';
  if (bytes < 1024 * 1024) {
    return `${Math.round(bytes / 1024)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

interface Step4Props {
  initialData?: Step4DocumentsData | undefined;
  onSave: (data: Step4DocumentsData) => void;
  onBack: () => void;
}

export const Step4Documents: React.FC<Step4Props> = ({
  initialData,
  onSave,
  onBack,
}) => {
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  // Existing documents or defaults
  const existingCert = initialData?.documents?.find(
    (d) => d.docType === 'CERTIFICATE'
  );

  const [idProof, setIdProof] = useState<DocumentItemData>({
    docType: 'ID_PROOF',
    fileUrl: 'blob:aadhaar_suresh.pdf',
    fileName: 'aadhaar_suresh.pdf · 1.2 MB',
  });

  const [farmDoc, setFarmDoc] = useState<DocumentItemData>({
    docType: 'FARM_DOC',
    fileUrl: 'blob:land_deed.pdf',
    fileName: 'land_deed.pdf · 3.4 MB',
  });

  const [certification, setCertification] = useState<DocumentItemData | null>(
    existingCert ?? null
  );

  async function handlePickFromDevice(
    targetDoc: 'CERTIFICATE' | 'ID_PROOF' | 'FARM_DOC' = 'CERTIFICATE'
  ) {
    setErrorMsg(null);
    try {
      setUploading(true);
      const res = await DocumentPicker.pickSingle({
        type: [types.pdf, types.images],
        copyTo: 'cachesDirectory',
      });

      if (res) {
        const sizeStr = formatFileSize(res.size);
        const name = res.name || (targetDoc === 'CERTIFICATE' ? 'certificate.pdf' : 'document.pdf');
        const docItem: DocumentItemData = {
          docType: targetDoc,
          fileName: `${name} · ${sizeStr}`,
          fileUrl: res.fileCopyUri || res.uri || `blob:${name}`,
        };

        if (targetDoc === 'CERTIFICATE') {
          setCertification(docItem);
        } else if (targetDoc === 'ID_PROOF') {
          setIdProof(docItem);
        } else {
          setFarmDoc(docItem);
        }
      }
    } catch (err: unknown) {
      if (isCancel(err)) {
        // User closed or cancelled the device file picker without selecting
        return;
      }
      setErrorMsg('Failed to open document picker on device. Please check app permissions.');
    } finally {
      setUploading(false);
    }
  }

  function handleRemoveCert() {
    setCertification(null);
  }

  function handleContinue() {
    const docs: DocumentItemData[] = [idProof, farmDoc];
    if (certification) {
      docs.push(certification);
    }

    const payload: Step4DocumentsData = {
      documents: docs,
    };

    const validation = validateStep(4, payload);
    if (!validation.valid) {
      const firstError =
        Object.values(validation.errors)[0] ?? 'Validation failed';
      setErrorMsg(firstError);
      return;
    }

    setErrorMsg(null);
    onSave(payload);
  }

  function handleSkip() {
    handleContinue();
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={SCREEN_BG} />

      {/* HEADER */}
      <View style={styles.header}>
        <View style={styles.headerTitleRow}>
          <TouchableOpacity
            activeOpacity={0.7}
            style={styles.backButtonCircle}
            onPress={onBack}
          >
            <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
              <Path
                d="M15 19l-7-7 7-7"
                stroke={BRAND_GREEN}
                strokeWidth={2.4}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
          </TouchableOpacity>
          <View style={styles.headerTitles}>
            <Text style={styles.headerTitle}>Documents</Text>
            <Text style={styles.headerSubtitle}>Step 4 of 5</Text>
          </View>
          <TouchableOpacity activeOpacity={0.7} onPress={handleSkip}>
            <Text style={styles.skipText}>Skip</Text>
          </TouchableOpacity>
        </View>

        {/* Progress Bar (4 Active, 1 Inactive) */}
        <View style={styles.progressRow}>
          {[1, 2, 3, 4, 5].map((s) => (
            <View
              key={s}
              style={[
                styles.progressSegment,
                { backgroundColor: s <= 4 ? BRAND_GREEN : INACTIVE_SEGMENT },
              ]}
            />
          ))}
        </View>
      </View>

      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={true}
      >
        {errorMsg ? (
          <View style={styles.errorContainer}>
            <ErrorState message={errorMsg} onRetry={() => setErrorMsg(null)} />
          </View>
        ) : null}

        {/* 1. ID Proof Box */}
        <TouchableOpacity
          activeOpacity={0.8}
          style={styles.docBox}
          onPress={() => handlePickFromDevice('ID_PROOF')}
        >
          <View style={styles.checkSquare}>
            <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
              <Path
                d="M20 6L9 17l-5-5"
                stroke="#FFFFFF"
                strokeWidth={3}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
          </View>
          <View style={styles.docInfo}>
            <Text style={styles.docTitle}>
              ID Proof <Text style={{ color: REQUIRED_RED }}>*</Text>
            </Text>
            <Text style={styles.docSub}>{idProof.fileName}</Text>
          </View>
        </TouchableOpacity>

        {/* 2. Farm Documents Box */}
        <TouchableOpacity
          activeOpacity={0.8}
          style={styles.docBox}
          onPress={() => handlePickFromDevice('FARM_DOC')}
        >
          <View style={styles.checkSquare}>
            <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
              <Path
                d="M20 6L9 17l-5-5"
                stroke="#FFFFFF"
                strokeWidth={3}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
          </View>
          <View style={styles.docInfo}>
            <Text style={styles.docTitle}>
              Farm Documents <Text style={{ color: REQUIRED_RED }}>*</Text>
            </Text>
            <Text style={styles.docSub}>{farmDoc.fileName}</Text>
          </View>
        </TouchableOpacity>

        {/* 3. Certification Box (Direct Device File Picker) */}
        {uploading ? (
          <View style={[styles.uploadBox, styles.uploadingBox]}>
            <ActivityIndicator size="small" color={BRAND_GREEN} style={{ marginBottom: 8 }} />
            <Text style={styles.uploadingTitle}>Opening Device Storage...</Text>
            <Text style={styles.uploadSub}>Select a document from your files</Text>
          </View>
        ) : certification ? (
          <View style={styles.docBox}>
            <View style={styles.checkSquare}>
              <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                <Path
                  d="M20 6L9 17l-5-5"
                  stroke="#FFFFFF"
                  strokeWidth={3}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
            </View>
            <View style={styles.docInfo}>
              <Text style={styles.docTitle}>
                Certification <Text style={styles.optionalText}>(Optional)</Text>
              </Text>
              <Text style={styles.docSub}>{certification.fileName}</Text>
            </View>
            <TouchableOpacity
              activeOpacity={0.7}
              style={styles.removeButton}
              onPress={handleRemoveCert}
              accessibilityLabel="Remove certification"
            >
              <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
                <Path
                  d="M18 6L6 18M6 6l12 12"
                  stroke="#6F7E71"
                  strokeWidth={2.2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            activeOpacity={0.8}
            style={styles.uploadBox}
            onPress={() => handlePickFromDevice('CERTIFICATE')}
          >
            <View style={styles.uploadIconContainer}>
              <DownloadIcon width={32} height={32} stroke="#8C9A8E" />
            </View>
            <Text style={styles.uploadTitle}>
              Certification <Text style={styles.optionalText}>(Optional)</Text>
            </Text>
            <Text style={styles.uploadSub}>PGS Organic / NPOP certificate</Text>
          </TouchableOpacity>
        )}

        {/* 4. Info Message Box */}
        <View style={styles.infoBox}>
          <Text style={styles.infoBoxText}>
            Don't have certification yet? No problem — you can still apply. TOHFA can help you get certified after approval.
          </Text>
        </View>
      </ScrollView>

      {/* FOOTER */}
      <View style={styles.footer}>
        <TouchableOpacity
          activeOpacity={0.85}
          style={[styles.footerBtn, styles.backButton]}
          onPress={onBack}
        >
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
        <TouchableOpacity
          activeOpacity={0.85}
          style={[styles.footerBtn, styles.nextButton]}
          onPress={handleContinue}
        >
          <Text style={styles.nextButtonText}>Next</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: SCREEN_BG,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 14,
    backgroundColor: SCREEN_BG,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  backButtonCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: BACK_ARROW_BORDER,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitles: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: HEADER_TITLE,
    letterSpacing: -0.2,
  },
  headerSubtitle: {
    fontSize: 13,
    fontWeight: '500',
    color: SUBTITLE_COLOR,
    marginTop: 2,
  },
  skipText: {
    fontSize: 15,
    fontWeight: '600',
    color: BRAND_GREEN,
  },
  progressRow: {
    flexDirection: 'row',
    gap: 7,
    marginTop: 16,
  },
  progressSegment: {
    flex: 1,
    height: 4.5,
    borderRadius: 3,
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
  },
  errorContainer: {
    marginBottom: 16,
  },
  docBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: DOC_BOX_BORDER,
    backgroundColor: DOC_BOX_BG,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    gap: 14,
  },
  checkSquare: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: BRAND_GREEN,
    alignItems: 'center',
    justifyContent: 'center',
  },
  docInfo: {
    flex: 1,
  },
  docTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: TITLE_DARK,
    marginBottom: 4,
  },
  docSub: {
    fontSize: 13,
    color: SUBTITLE_MUTED,
  },
  uploadBox: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: UPLOAD_BORDER,
    borderRadius: 16,
    paddingVertical: 28,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
    backgroundColor: '#FFFFFF',
  },
  uploadIconContainer: {
    marginBottom: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadTitle: {
    fontSize: 15.5,
    fontWeight: '700',
    color: TITLE_DARK,
    marginBottom: 4,
  },
  optionalText: {
    color: SUBTITLE_MUTED,
    fontWeight: '400',
  },
  uploadSub: {
    fontSize: 13,
    color: SUBTITLE_MUTED,
  },
  infoBox: {
    backgroundColor: INFO_BG,
    borderWidth: 1.2,
    borderColor: INFO_BORDER,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 16,
  },
  infoBoxText: {
    fontSize: 13.5,
    fontWeight: '400',
    color: INFO_TEXT,
    lineHeight: 20,
    letterSpacing: -0.1,
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 24,
    backgroundColor: SCREEN_BG,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  footerBtn: {
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButton: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: BACK_BORDER,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: BRAND_GREEN,
  },
  nextButton: {
    flex: 1.25,
    backgroundColor: BRAND_GREEN,
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  uploadingBox: {
    borderStyle: 'solid',
    borderColor: BRAND_GREEN,
    backgroundColor: DOC_BOX_BG,
    paddingVertical: 22,
  },
  uploadingTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: BRAND_GREEN,
    marginBottom: 2,
  },
  removeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E2ECE0',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
});


