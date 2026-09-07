import React, { useState } from 'react';
import { View, StyleSheet, Text, ScrollView } from 'react-native';
import { useTheme } from '../../theme';
import { t } from '../../i18n';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { Badge } from '../../components/Badge';
import { ErrorState } from '../../components/ErrorState';
import { validateCrossStepSubmission } from './validation';
import { submitFarmerApplication } from '../../api/registration';
import { clearRegistrationDraft } from '../../storage/registrationDraft';
import type { RegistrationDraft } from '../../storage/registrationDraft';

interface Step5Props {
  draft: RegistrationDraft;
  onSubmitSuccess: (applicationId: string) => void;
  onBack: () => void;
}

export const Step5Review: React.FC<Step5Props> = ({ draft, onSubmitSuccess, onBack }) => {
  const theme = useTheme();
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Single idempotency key per submit attempt (stable across double-taps)
  const [idempotencyKey] = useState(
    () => `sub-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
  );

  async function handleSubmit() {
    // 1. Cross-step validation pass
    const crossCheck = validateCrossStepSubmission(draft);
    if (!crossCheck.valid) {
      setErrorMsg(crossCheck.errors.join(' '));
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);

    try {
      await submitFarmerApplication(draft.applicationId, idempotencyKey);
      await clearRegistrationDraft();
      onSubmitSuccess(draft.applicationId);
    } catch {
      setErrorMsg('Failed to submit application. Please check your connection and retry.');
    } finally {
      setSubmitting(false);
    }
  }

  const s1 = draft.step1;
  const farm = draft.step2?.farms[0];
  const s3 = draft.step3;
  const docs = draft.step4?.documents ?? [];

  return (
    <Card style={styles.card}>
      <Text style={[styles.title, { color: theme.colors.onSurface }]}>
        {t('registration.step5')}
      </Text>

      {errorMsg ? <ErrorState message={errorMsg} onRetry={() => setErrorMsg(null)} /> : null}

      <ScrollView style={styles.summaryContainer}>
        {/* Personal Summary */}
        <View style={[styles.section, { backgroundColor: theme.colors.grey100 }]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.primary }]}>
            {t('registration.step1')}
          </Text>
          <Text style={styles.detailText}>Name: {s1?.fullName ?? '—'}</Text>
          <Text style={styles.detailText}>Mobile: {s1?.mobile ?? '—'}</Text>
          <Text style={styles.detailText}>Aadhaar: **** **** {s1?.aadhaarLast4 ?? '—'}</Text>
          <Text style={styles.detailText}>Village: {s1?.village ?? '—'}, {s1?.taluk ?? '—'}</Text>
        </View>

        {/* Farm Summary */}
        <View style={[styles.section, { backgroundColor: theme.colors.grey100 }]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.primary }]}>
            {t('registration.step2')}
          </Text>
          <Text style={styles.detailText}>Farm Name: {farm?.name ?? '—'}</Text>
          <Text style={styles.detailText}>Area: {farm?.totalAreaAcres ?? '—'} Acres</Text>
          <Text style={styles.detailText}>Water Source: {farm?.waterSource ?? '—'}</Text>
          <Text style={styles.detailText}>Crops: {farm?.primaryCrops?.join(', ') ?? '—'}</Text>
        </View>

        {/* Location Summary */}
        <View style={[styles.section, { backgroundColor: theme.colors.grey100 }]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.primary }]}>
            {t('registration.step3')}
          </Text>
          <Text style={styles.detailText}>
            Coordinates: {s3?.latitude ?? '—'}, {s3?.longitude ?? '—'}
          </Text>
          <Text style={styles.detailText}>District: {s3?.district ?? 'Nilgiris'}</Text>
        </View>

        {/* Documents Summary */}
        <View style={[styles.section, { backgroundColor: theme.colors.grey100 }]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.primary }]}>
            {t('registration.step4')}
          </Text>
          {docs.length === 0 ? (
            <Text style={styles.detailText}>No documents uploaded</Text>
          ) : (
            docs.map((d, i) => (
              <View key={i} style={styles.docRow}>
                <Badge label={d.docType} variant="info" />
                <Text style={styles.detailText}>{d.fileName ?? 'Uploaded Document'}</Text>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      <View style={styles.buttonRow}>
        <Button
          title={t('registration.back')}
          variant="outline"
          onPress={onBack}
          style={styles.flexBtn}
        />
        <Button
          title={t('registration.submit')}
          onPress={handleSubmit}
          loading={submitting}
          style={styles.flexBtn}
        />
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: 20,
    gap: 14,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
  },
  summaryContainer: {
    maxHeight: 320,
  },
  section: {
    padding: 12,
    borderRadius: 8,
    gap: 4,
    marginBottom: 10,
  },
  sectionTitle: {
    fontWeight: '700',
    fontSize: 14,
    marginBottom: 2,
  },
  detailText: {
    fontSize: 13,
  },
  docRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  flexBtn: {
    flex: 1,
  },
});
