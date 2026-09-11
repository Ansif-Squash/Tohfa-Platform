import React, { useState } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useTheme } from '../../theme';
import { ErrorState } from '@tohfa/mobile-ui';
import { validateCrossStepSubmission } from './validation';
import { clearRegistrationDraft } from '../../storage/registrationDraft';
import type { RegistrationDraft } from '../../storage/registrationDraft';

interface Step5Props {
  draft: RegistrationDraft;
  onSubmitSuccess: (applicationId: string) => void;
  onBack: () => void;
}

export const Step5Review: React.FC<Step5Props> = ({ draft, onSubmitSuccess, onBack }) => {
  const theme = useTheme();
  const { colors } = theme;

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [termsAccepted, setTermsAccepted] = useState(true);

  async function handleSubmit() {
    if (!termsAccepted) {
      setErrorMsg('You must accept the terms and conditions to submit.');
      return;
    }
    
    // 1. Cross-step validation pass
    const crossCheck = validateCrossStepSubmission(draft);
    if (!crossCheck.valid) {
      setErrorMsg(crossCheck.errors.join(' '));
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);

    try {
      // Mock network request instead of real api which requires a backend
      await new Promise(resolve => setTimeout(resolve, 800));
      await clearRegistrationDraft();
      onSubmitSuccess(draft.applicationId);
    } catch {
      setErrorMsg('Failed to submit application. Please check your connection and retry.');
    } finally {
      setSubmitting(false);
    }
  }

  const Section = ({ title, data }: { title: string, data: { label: string, value: string, highlight?: boolean }[] }) => (
    <View style={[styles.section, { backgroundColor: colors.white, borderColor: colors.borderMedium }]}>
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: colors.brandGreen }]}>{title}</Text>
        <TouchableOpacity><Text style={[styles.editLink, { color: colors.brandGreen }]}>Edit</Text></TouchableOpacity>
      </View>
      <View style={styles.sectionRows}>
        {data.map((row, i) => (
          <View key={i} style={styles.dataRow}>
            <Text style={[styles.dataLabel, { color: colors.textSubtle }]}>{row.label}</Text>
            <Text style={[styles.dataValue, { color: row.highlight ? colors.brandGreen : colors.textDark }]}>{row.value}</Text>
          </View>
        ))}
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.bgLight }]}>
      
      {/* HEADER */}
      <View style={[styles.header, { backgroundColor: colors.white, borderBottomColor: colors.borderSoft }]}>
        <View style={styles.headerTitleRow}>
          <TouchableOpacity activeOpacity={0.7} style={[styles.backButtonCircle, { borderColor: colors.borderMedium, backgroundColor: colors.white }]} onPress={onBack}>
            <Text style={[styles.backButtonArrow, { color: colors.brandGreen }]}>‹</Text>
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={[styles.headerTitle, { color: colors.textDark }]}>Review & Submit</Text>
            <Text style={[styles.headerSubtitle, { color: colors.textSubtle }]}>Step 5 of 5</Text>
          </View>
        </View>

        {/* Progress Bar */}
        <View style={styles.progressRow}>
          {[1, 2, 3, 4, 5].map((s) => (
            <View key={s} style={[styles.progressSegment, { backgroundColor: colors.brandGreen }]} />
          ))}
        </View>
      </View>

      <ScrollView style={styles.scrollArea} contentContainerStyle={styles.scrollContent}>
        {errorMsg ? (
          <View style={styles.errorContainer}>
            <ErrorState message={errorMsg} onRetry={() => setErrorMsg(null)} />
          </View>
        ) : null}

        <Section title="PERSONAL" data={[
          { label: 'Name', value: 'Suresh Kumar' },
          { label: 'Mobile', value: '+91 98765 43210' },
          { label: 'Aadhaar', value: '3782 4591 0023' }
        ]} />

        <Section title="FARM" data={[
          { label: 'Farm name', value: 'Great Earth Organic' },
          { label: 'Type', value: 'Organic' },
          { label: 'Total area', value: '2.5 acres' }
        ]} />

        <Section title="LOCATION" data={[
          { label: 'GPS', value: '11.4064, 76.6932' },
          { label: 'FMB marked', value: '5 pts · 2.48 ac' }
        ]} />

        <Section title="DOCUMENTS" data={[
          { label: 'ID proof', value: 'Uploaded', highlight: true },
          { label: 'Farm docs', value: 'Uploaded', highlight: true },
          { label: 'Certification', value: 'Not provided' }
        ]} />

        {/* Terms Confirmation Box */}
        <TouchableOpacity 
          activeOpacity={0.9} 
          style={[styles.termsBox, { backgroundColor: colors.brandGreenLight, borderColor: colors.brandGreen }]}
          onPress={() => setTermsAccepted(!termsAccepted)}
        >
          <View style={[styles.checkbox, { backgroundColor: termsAccepted ? colors.brandGreen : colors.white, borderColor: colors.brandGreen }]}>
            {termsAccepted && <Text style={styles.checkIcon}>✓</Text>}
          </View>
          <Text style={[styles.termsText, { color: colors.textDark }]}>
            I confirm all information is accurate and agree to TOHFA's <Text style={{ textDecorationLine: 'underline', color: colors.brandGreen }}>Terms</Text> and <Text style={{ textDecorationLine: 'underline', color: colors.brandGreen }}>Privacy Policy</Text>
          </Text>
        </TouchableOpacity>

      </ScrollView>

      {/* FOOTER */}
      <View style={[styles.footer, { borderTopColor: colors.borderDivider, backgroundColor: colors.white }]}>
        <TouchableOpacity activeOpacity={0.85} style={[styles.footerBtn, styles.backButton, { borderColor: colors.brandGreen, backgroundColor: colors.white }]} onPress={onBack}>
          <Text style={[styles.footerBtnText, { color: colors.brandGreen }]}>Back</Text>
        </TouchableOpacity>
        <TouchableOpacity activeOpacity={0.85} style={[styles.footerBtn, styles.nextButton, { backgroundColor: colors.brandGreen, opacity: submitting ? 0.7 : 1 }]} onPress={handleSubmit} disabled={submitting}>
          <Text style={[styles.footerBtnText, { color: colors.white }]}>{submitting ? 'Submitting...' : 'Submit Application'}</Text>
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
  progressRow: { flexDirection: 'row', gap: 6, marginTop: 14 },
  progressSegment: { flex: 1, height: 5, borderRadius: 3 },
  scrollArea: { flex: 1 },
  scrollContent: { paddingHorizontal: 24, paddingTop: 16, paddingBottom: 32 },
  errorContainer: { marginBottom: 16 },
  section: { borderWidth: 1.5, borderRadius: 12, padding: 16, marginBottom: 16 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  sectionTitle: { fontSize: 12, fontWeight: '800', letterSpacing: 0.5 },
  editLink: { fontSize: 12, fontWeight: '700' },
  sectionRows: { gap: 8 },
  dataRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  dataLabel: { fontSize: 14 },
  dataValue: { fontSize: 14, fontWeight: '700' },
  termsBox: { flexDirection: 'row', borderWidth: 1.5, borderRadius: 12, padding: 16, marginBottom: 16, alignItems: 'flex-start', gap: 12 },
  checkbox: { width: 24, height: 24, borderRadius: 6, borderWidth: 2, alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  checkIcon: { color: '#fff', fontSize: 14, fontWeight: '900' },
  termsText: { flex: 1, fontSize: 13, lineHeight: 18 },
  footer: { paddingHorizontal: 24, paddingTop: 12, paddingBottom: 24, borderTopWidth: 1, flexDirection: 'row', gap: 12 },
  footerBtn: { flex: 1, height: 52, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  backButton: { borderWidth: 1.5 },
  nextButton: { borderWidth: 0 },
  footerBtnText: { fontSize: 16, fontWeight: '700', textAlign: 'center' }
});
