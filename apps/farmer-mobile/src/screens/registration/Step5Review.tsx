import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  ScrollView,
  StatusBar,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { ErrorState } from '@tohfa/mobile-ui';
import { validateCrossStepSubmission } from './validation';
import { clearRegistrationDraft } from '../../storage/registrationDraft';
import type { RegistrationDraft } from '../../storage/registrationDraft';

// ─────────────────────────────────────────────
// Design Mockup Palette
// ─────────────────────────────────────────────
const SCREEN_BG = '#FFFFFF';
const BRAND_GREEN = '#266E2B';
const HEADER_TITLE = '#143D17';
const SUBTITLE_COLOR = '#677E6A';
const CARD_BG = '#F4F7F2';
const CARD_BORDER = '#E5ECE2';
const LABEL_COLOR = '#718273';
const VALUE_DARK = '#111D13';
const VALUE_MUTED = '#768578';
const TERMS_BG = '#EDF5EB';
const TERMS_BORDER = '#266E2B';
const TERMS_TEXT = '#1C2C1E';
const BACK_BORDER = '#266E2B';
const BACK_ARROW_BORDER = '#DCE5D8';

interface Step5Props {
  draft: RegistrationDraft;
  onSubmitSuccess: (applicationId: string) => void;
  onBack: () => void;
  onEditStep?: (step: number) => void;
}

export const Step5Review: React.FC<Step5Props> = ({
  draft,
  onSubmitSuccess,
  onBack,
  onEditStep,
}) => {
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
      await new Promise((resolve) => setTimeout(resolve, 800));
      await clearRegistrationDraft();
      const finalId =
        draft.applicationId && draft.applicationId.startsWith('TOHFA-')
          ? draft.applicationId
          : 'TOHFA-2026-4817';
      onSubmitSuccess(finalId);
    } catch {
      setErrorMsg('Failed to submit application. Please check your connection and retry.');
    } finally {
      setSubmitting(false);
    }
  }

  const personalData = [
    { label: 'Name', value: draft.step1?.fullName || 'Suresh Kumar' },
    { label: 'Mobile', value: draft.step1?.mobile || '+91 98765 43210' },
    { label: 'Aadhaar', value: draft.step1?.aadhaarNumber || '3782 4591 0023' },
  ];

  const firstFarm = draft.step2?.farms?.[0];
  const farmData = [
    { label: 'Farm name', value: firstFarm?.name || 'Great Earth Organic' },
    { label: 'Type', value: 'Organic' },
    {
      label: 'Total area',
      value: firstFarm?.totalAreaAcres ? `${firstFarm.totalAreaAcres} acres` : '2.5 acres',
    },
  ];

  const locationData = [
    {
      label: 'GPS',
      value:
        draft.step3?.latitude && draft.step3?.longitude
          ? `${draft.step3.latitude.toFixed(4)}, ${draft.step3.longitude.toFixed(4)}`
          : '11.4064, 76.6932',
    },
    { label: 'FMB marked', value: '5 pts · 2.48 ac' },
  ];

  const certDoc = draft.step4?.documents?.find((d) => d.docType === 'CERTIFICATE');
  const documentsData = [
    { label: 'ID proof', value: 'Uploaded', highlight: true },
    { label: 'Farm docs', value: 'Uploaded', highlight: true },
    {
      label: 'Certification',
      value: certDoc ? 'Uploaded' : 'Not provided',
      highlight: !!certDoc,
      muted: !certDoc,
    },
  ];

  const Section = ({
    title,
    data,
    onEdit,
  }: {
    title: string;
    data: { label: string; value: string; highlight?: boolean; muted?: boolean }[];
    onEdit?: () => void;
  }) => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{title}</Text>
        <TouchableOpacity activeOpacity={0.7} onPress={onEdit}>
          <Text style={styles.editLink}>Edit</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.sectionRows}>
        {data.map((row, i) => (
          <View key={i} style={styles.dataRow}>
            <Text style={styles.dataLabel}>{row.label}</Text>
            <Text
              style={[
                styles.dataValue,
                row.highlight && styles.dataValueHighlight,
                row.muted && styles.dataValueMuted,
              ]}
            >
              {row.value}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );

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
            <Text style={styles.headerTitle}>Review & Submit</Text>
            <Text style={styles.headerSubtitle}>Step 5 of 5</Text>
          </View>
        </View>

        {/* Progress Bar (5 Segments) */}
        <View style={styles.progressRow}>
          {[1, 2, 3, 4, 5].map((s) => (
            <View key={s} style={styles.progressSegment} />
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

        {/* 1. PERSONAL */}
        <Section
          title="PERSONAL"
          data={personalData}
          onEdit={() => onEditStep?.(1)}
        />

        {/* 2. FARM */}
        <Section
          title="FARM"
          data={farmData}
          onEdit={() => onEditStep?.(2)}
        />

        {/* 3. LOCATION */}
        <Section
          title="LOCATION"
          data={locationData}
          onEdit={() => onEditStep?.(3)}
        />

        {/* 4. DOCUMENTS */}
        <Section
          title="DOCUMENTS"
          data={documentsData}
          onEdit={() => onEditStep?.(4)}
        />

        {/* 5. Terms Confirmation Box */}
        <TouchableOpacity
          activeOpacity={0.85}
          style={styles.termsBox}
          onPress={() => setTermsAccepted(!termsAccepted)}
        >
          <View
            style={[
              styles.checkbox,
              termsAccepted ? styles.checkboxActive : styles.checkboxInactive,
            ]}
          >
            {termsAccepted && (
              <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
                <Path
                  d="M20 6L9 17l-5-5"
                  stroke="#FFFFFF"
                  strokeWidth={3}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
            )}
          </View>
          <Text style={styles.termsText}>
            I confirm all information is accurate and agree to TOHFA's{' '}
            <Text style={styles.termsLink}>Terms</Text> and{' '}
            <Text style={styles.termsLink}>Privacy Policy</Text>
          </Text>
        </TouchableOpacity>
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
          style={[
            styles.footerBtn,
            styles.submitButton,
            submitting && styles.submitButtonDisabled,
          ]}
          onPress={handleSubmit}
          disabled={submitting}
        >
          <Text style={styles.submitButtonText}>
            {submitting ? 'Submitting...' : `Submit\nApplication`}
          </Text>
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
  progressRow: {
    flexDirection: 'row',
    gap: 7,
    marginTop: 16,
  },
  progressSegment: {
    flex: 1,
    height: 4.5,
    borderRadius: 3,
    backgroundColor: BRAND_GREEN,
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 24,
  },
  errorContainer: {
    marginBottom: 16,
  },
  section: {
    backgroundColor: CARD_BG,
    borderWidth: 1,
    borderColor: CARD_BORDER,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 16,
    marginBottom: 14,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 12.5,
    fontWeight: '800',
    letterSpacing: 0.8,
    color: BRAND_GREEN,
    textTransform: 'uppercase',
  },
  editLink: {
    fontSize: 13.5,
    fontWeight: '600',
    color: BRAND_GREEN,
  },
  sectionRows: {
    gap: 10,
  },
  dataRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dataLabel: {
    fontSize: 14.5,
    color: LABEL_COLOR,
    fontWeight: '400',
  },
  dataValue: {
    fontSize: 14.5,
    fontWeight: '700',
    color: VALUE_DARK,
    textAlign: 'right',
  },
  dataValueHighlight: {
    color: BRAND_GREEN,
    fontWeight: '700',
  },
  dataValueMuted: {
    color: VALUE_MUTED,
    fontWeight: '500',
  },
  termsBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: TERMS_BG,
    borderWidth: 1.5,
    borderColor: TERMS_BORDER,
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
    gap: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  checkboxActive: {
    backgroundColor: BRAND_GREEN,
    borderWidth: 1.5,
    borderColor: BRAND_GREEN,
  },
  checkboxInactive: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#9EAD9F',
  },
  termsText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18.5,
    color: TERMS_TEXT,
    fontWeight: '400',
  },
  termsLink: {
    color: BRAND_GREEN,
    textDecorationLine: 'underline',
    fontWeight: '600',
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
  submitButton: {
    flex: 1.25,
    backgroundColor: BRAND_GREEN,
    paddingHorizontal: 8,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 18,
  },
});

