import React, { useState } from 'react';
import {
  Alert,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { createCertification } from '../../api/farmer';
import { signUpload } from '../../api/registration';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { Icon } from '../../components/Icon';
import { Input } from '../../components/Input';
import { t } from '../../i18n';
import {
  MIN_TOUCH_TARGET,
  colors,
  radius,
  spacing,
  typography,
  weights,
} from '../../theme';

interface AddCertificationScreenProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function AddCertificationScreen({
  onSuccess,
  onCancel,
}: AddCertificationScreenProps): React.JSX.Element {
  const [certType, setCertType] = useState<'PGS' | 'NPOP'>('PGS');
  const [certNumber, setCertNumber] = useState<string>('');
  const [issuingBody, setIssuingBody] = useState<string>('');
  const [issuedOn, setIssuedOn] = useState<string>('');
  const [expiresOn, setExpiresOn] = useState<string>('');
  const [documentUrl, setDocumentUrl] = useState<string>('');
  const [uploading, setUploading] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleSimulateUpload = async () => {
    try {
      setUploading(true);
      setError(null);
      // Simulate selecting and signing an upload with purpose CERTIFICATE
      const signed = await signUpload({
        purpose: 'CERTIFICATE',
        filename: 'certificate.pdf',
        contentType: 'application/pdf',
      });
      setDocumentUrl(signed.fileUrl);
    } catch {
      setError(t('registration.upload.failed'));
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async () => {
    if (!certNumber.trim() || !issuingBody.trim() || !expiresOn.trim()) {
      setError(t('error.generic'));
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const defaultIssuedOn = new Date().toISOString().split('T')[0] ?? '2026-01-01';

      // BR-02: New certificate starts UNVERIFIED
      await createCertification({
        certType,
        certNumber: certNumber.trim(),
        issuingBody: issuingBody.trim(),
        issuedOn: issuedOn.trim() || defaultIssuedOn,
        expiresOn: expiresOn.trim(),
        documentUrl: documentUrl || undefined,
      });

      Alert.alert(t('common.submit'), t('certifications.add.success'), [
        { text: 'OK', onPress: () => onSuccess?.() },
      ]);
    } catch {
      setError(t('error.generic'));
    } finally {
      setSubmitting(false);
    }
  };


  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>{t('certifications.add.title')}</Text>
          <Text style={styles.notice}>{t('certifications.add.notice')}</Text>
        </View>

        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <Card style={styles.formCard}>
          <Text style={styles.label}>{t('certifications.add.type')}</Text>
          <View style={styles.typeRow}>
            {(['PGS', 'NPOP'] as const).map((type) => (
              <Pressable
                key={type}
                style={[styles.typeChip, certType === type && styles.typeChipActive]}
                onPress={() => setCertType(type)}
                accessibilityRole="button"
              >
                <Text
                  style={[styles.typeText, certType === type && styles.typeTextActive]}
                >
                  {type}
                </Text>
              </Pressable>
            ))}
          </View>

          <Text style={styles.label}>{t('certifications.add.number')}</Text>
          <Input
            value={certNumber}
            onChangeText={setCertNumber}
            placeholder="e.g. PGS-TN-2026-0091"
          />

          <Text style={styles.label}>{t('certifications.add.issuer')}</Text>
          <Input
            value={issuingBody}
            onChangeText={setIssuingBody}
            placeholder="e.g. PGS Organic India Council"
          />

          <Text style={styles.label}>{t('certifications.add.issueDate')}</Text>
          <Input
            value={issuedOn}
            onChangeText={setIssuedOn}
            placeholder="YYYY-MM-DD"
          />

          <Text style={styles.label}>{t('certifications.add.expiryDate')}</Text>
          <Input
            value={expiresOn}
            onChangeText={setExpiresOn}
            placeholder="YYYY-MM-DD"
          />

          {/* Document Upload */}
          <Text style={styles.label}>{t('certifications.add.doc')}</Text>
          <View style={styles.uploadBox}>
            {documentUrl ? (
              <View style={styles.uploadSuccessRow}>
                <Icon name="check_circle" size={24} color={colors.primary} />
                <Text style={styles.uploadSuccessText}>
                  {t('registration.upload.success')}
                </Text>
              </View>
            ) : (
              <Button
                title={
                  uploading
                    ? t('common.loading')
                    : t('registration.upload.cert')
                }
                variant="outline"
                loading={uploading}
                onPress={() => void handleSimulateUpload()}
              />
            )}
          </View>

          <View style={styles.buttonRow}>
            <Button
              title={t('common.cancel')}
              variant="outline"
              onPress={() => onCancel?.()}
              style={styles.actionBtn}
            />
            <Button
              title={t('certifications.add.submit')}
              variant="primary"
              loading={submitting}
              onPress={() => void handleSubmit()}
              style={styles.actionBtn}
            />
          </View>
        </Card>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.surface },
  scrollContent: { padding: spacing.lg, gap: spacing.lg },
  header: { gap: spacing.xs },
  title: {
    fontSize: typography.headline,
    fontWeight: weights.bold,
    color: colors.onSurface,
  },
  notice: {
    fontSize: typography.caption,
    color: colors.onSurfaceVariant,
  },
  errorBox: {
    padding: spacing.md,
    backgroundColor: colors.surfaceVariant,
    borderColor: colors.danger,
    borderWidth: 1,
    borderRadius: radius.card,
  },
  errorText: { color: colors.danger, fontSize: typography.body },
  formCard: {
    backgroundColor: colors.white,
    borderRadius: radius.cardMax,
    padding: spacing.lg,
    gap: spacing.md,
  },
  label: {
    fontSize: typography.body,
    fontWeight: weights.medium,
    color: colors.onSurface,
  },
  typeRow: { flexDirection: 'row', gap: spacing.md },
  typeChip: {
    flex: 1,
    minHeight: MIN_TOUCH_TARGET,
    borderRadius: radius.button,
    borderWidth: 1,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeChipActive: { backgroundColor: colors.primary },
  typeText: { color: colors.primary, fontWeight: weights.medium },
  typeTextActive: { color: colors.white, fontWeight: weights.semibold },
  uploadBox: {
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.surfacePressed,
    borderRadius: radius.card,
    alignItems: 'center',
  },
  uploadSuccessRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  uploadSuccessText: { color: colors.primary, fontWeight: weights.semibold },
  buttonRow: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.md },
  actionBtn: { flex: 1 },
});
