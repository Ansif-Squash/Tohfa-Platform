import React, { useState } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useTheme } from '../../theme';
import { ErrorState } from '@tohfa/mobile-ui';
import { validateStep } from './validation';
import type { Step4DocumentsData } from '../../storage/registrationDraft';

interface Step4Props {
  initialData?: Step4DocumentsData | undefined;
  onSave: (data: Step4DocumentsData) => void;
  onBack: () => void;
}

export const Step4Documents: React.FC<Step4Props> = ({ initialData, onSave, onBack }) => {
  const theme = useTheme();
  const { colors } = theme;

  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // hardcoded success states to match prototype exactly
  const idProofUploaded = true;
  const farmDocsUploaded = true;
  const certUploaded = false;

  function handleContinue() {
    const payload: Step4DocumentsData = {
      documents: initialData?.documents || [
        { docType: 'ID_PROOF', fileUrl: 'dummy_id_url', fileName: 'aadhaar_suresh.pdf' },
        { docType: 'FARM_DOC', fileUrl: 'dummy_farm_url', fileName: 'land_deed.pdf' }
      ],
    };

    const validation = validateStep(4, payload);
    if (!validation.valid) {
      const firstError = Object.values(validation.errors)[0] ?? 'Validation failed';
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
    <View style={[styles.container, { backgroundColor: colors.bgLight }]}>
      
      {/* HEADER */}
      <View style={[styles.header, { backgroundColor: colors.white, borderBottomColor: colors.borderSoft }]}>
        <View style={styles.headerTitleRow}>
          <TouchableOpacity activeOpacity={0.7} style={[styles.backButtonCircle, { borderColor: colors.borderMedium, backgroundColor: colors.white }]} onPress={onBack}>
            <Text style={[styles.backButtonArrow, { color: colors.brandGreen }]}>‹</Text>
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={[styles.headerTitle, { color: colors.textDark }]}>Documents</Text>
            <Text style={[styles.headerSubtitle, { color: colors.textSubtle }]}>Step 4 of 5</Text>
          </View>
          <TouchableOpacity onPress={handleSkip}>
            <Text style={[styles.skipText, { color: colors.brandGreen }]}>Skip</Text>
          </TouchableOpacity>
        </View>

        {/* Progress Bar */}
        <View style={styles.progressRow}>
          {[1, 2, 3, 4, 5].map((s) => (
            <View key={s} style={[styles.progressSegment, { backgroundColor: s <= 4 ? colors.brandGreen : colors.borderMedium }]} />
          ))}
        </View>
      </View>

      <ScrollView style={styles.scrollArea} contentContainerStyle={styles.scrollContent}>
        {errorMsg ? (
          <View style={styles.errorContainer}>
            <ErrorState message={errorMsg} onRetry={() => setErrorMsg(null)} />
          </View>
        ) : null}

        {/* ID Proof Box */}
        <TouchableOpacity activeOpacity={0.8} style={[styles.docBox, { borderColor: colors.brandGreen, backgroundColor: colors.brandGreenLight }]}>
          <View style={[styles.checkCircle, { backgroundColor: colors.brandGreen }]}>
            <Text style={styles.checkMark}>✓</Text>
          </View>
          <View style={styles.docInfo}>
            <Text style={[styles.docTitle, { color: colors.textDark }]}>
              ID Proof <Text style={{ color: colors.requiredRed }}>*</Text>
            </Text>
            <Text style={[styles.docSub, { color: colors.textSubtle }]}>aadhaar_suresh.pdf · 1.2 MB</Text>
          </View>
        </TouchableOpacity>

        {/* Farm Documents Box */}
        <TouchableOpacity activeOpacity={0.8} style={[styles.docBox, { borderColor: colors.brandGreen, backgroundColor: colors.brandGreenLight }]}>
          <View style={[styles.checkCircle, { backgroundColor: colors.brandGreen }]}>
            <Text style={styles.checkMark}>✓</Text>
          </View>
          <View style={styles.docInfo}>
            <Text style={[styles.docTitle, { color: colors.textDark }]}>
              Farm Documents <Text style={{ color: colors.requiredRed }}>*</Text>
            </Text>
            <Text style={[styles.docSub, { color: colors.textSubtle }]}>land_deed.pdf · 3.4 MB</Text>
          </View>
        </TouchableOpacity>

        {/* Certification Box (Dashed) */}
        <TouchableOpacity activeOpacity={0.8} style={[styles.uploadBox, { borderColor: colors.borderMedium }]}>
          <Text style={styles.uploadIcon}>↑</Text>
          <Text style={[styles.uploadTitle, { color: colors.textDark }]}>
            Certification <Text style={{ color: colors.textSubtle, fontWeight: '400' }}>(Optional)</Text>
          </Text>
          <Text style={[styles.uploadSub, { color: colors.textSubtle }]}>PGS Organic / NPOP certificate</Text>
        </TouchableOpacity>

        {/* Info Message */}
        <View style={styles.infoBox}>
          <Text style={styles.infoBoxText}>
            Don't have certification yet? No problem — you can still apply. TOHFA can help you get certified after approval.
          </Text>
        </View>

      </ScrollView>

      {/* FOOTER */}
      <View style={[styles.footer, { borderTopColor: colors.borderDivider, backgroundColor: colors.white }]}>
        <TouchableOpacity activeOpacity={0.85} style={[styles.footerBtn, styles.backButton, { borderColor: colors.brandGreen, backgroundColor: colors.white }]} onPress={onBack}>
          <Text style={[styles.footerBtnText, { color: colors.brandGreen }]}>Back</Text>
        </TouchableOpacity>
        <TouchableOpacity activeOpacity={0.85} style={[styles.footerBtn, styles.nextButton, { backgroundColor: colors.brandGreen }]} onPress={handleContinue}>
          <Text style={[styles.footerBtnText, { color: colors.white }]}>Next</Text>
        </TouchableOpacity>
      </View>

    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 24, paddingTop: 12, paddingBottom: 14, borderWidth: 0, borderBottomWidth: 1 },
  headerTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  backButtonCircle: { width: 40, height: 40, borderRadius: 20, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  backButtonArrow: { fontSize: 22, fontWeight: '700', marginTop: -2 },
  headerTitle: { fontSize: 18, fontWeight: '800' },
  headerSubtitle: { fontSize: 12 },
  skipText: { fontSize: 14, fontWeight: '600' },
  progressRow: { flexDirection: 'row', gap: 6, marginTop: 14 },
  progressSegment: { flex: 1, height: 5, borderRadius: 3 },
  scrollArea: { flex: 1 },
  scrollContent: { paddingHorizontal: 24, paddingTop: 24, paddingBottom: 32 },
  errorContainer: { marginBottom: 16 },
  docBox: { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderRadius: 16, padding: 16, marginBottom: 16, gap: 14 },
  checkCircle: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  checkMark: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  docInfo: { flex: 1 },
  docTitle: { fontSize: 15, fontWeight: '700', marginBottom: 2 },
  docSub: { fontSize: 13 },
  uploadBox: { borderWidth: 1.5, borderStyle: 'dashed', borderRadius: 16, padding: 24, alignItems: 'center', marginBottom: 24, backgroundColor: '#fff' },
  uploadIcon: { fontSize: 24, color: '#888', marginBottom: 8 },
  uploadTitle: { fontSize: 15, fontWeight: '700', marginBottom: 4 },
  uploadSub: { fontSize: 13 },
  infoBox: { backgroundColor: '#F0F4F8', borderWidth: 1, borderColor: '#D0D9E0', borderRadius: 8, padding: 16 },
  infoBoxText: { fontSize: 13, color: '#2A4A6A', lineHeight: 18 },
  footer: { paddingHorizontal: 24, paddingTop: 12, paddingBottom: 24, borderTopWidth: 1, flexDirection: 'row', gap: 12 },
  footerBtn: { flex: 1, height: 52, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  backButton: { borderWidth: 1.5 },
  nextButton: { borderWidth: 0 },
  footerBtnText: { fontSize: 16, fontWeight: '700' }
});
