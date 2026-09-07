import React, { useState } from 'react';
import { View, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { useTheme } from '../../theme';
import { t } from '../../i18n';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { Badge } from '../../components/Badge';
import { Icon } from '../../components/Icon';
import { ErrorState } from '../../components/ErrorState';
import { validateStep } from './validation';
import { signUpload } from '../../api/registration';
import type { Step4DocumentsData, DocumentItemData } from '../../storage/registrationDraft';

interface Step4Props {
  initialData?: Step4DocumentsData | undefined;
  onSave: (data: Step4DocumentsData) => void;
  onBack: () => void;
}

interface UploadStatus {
  uploading: boolean;
  progress: number;
  error: string | null;
  fileUrl?: string | undefined;
  fileName?: string | undefined;
}

export const Step4Documents: React.FC<Step4Props> = ({ initialData, onSave, onBack }) => {
  const theme = useTheme();
  const [documents, setDocuments] = useState<DocumentItemData[]>(initialData?.documents ?? []);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [idProofStatus, setIdProofStatus] = useState<UploadStatus>({
    uploading: false,
    progress: initialData?.documents.some((d) => d.docType === 'ID_PROOF') ? 100 : 0,
    error: null,
    fileUrl: initialData?.documents.find((d) => d.docType === 'ID_PROOF')?.fileUrl,
    fileName: initialData?.documents.find((d) => d.docType === 'ID_PROOF')?.fileName,
  });

  const [farmDocStatus, setFarmDocStatus] = useState<UploadStatus>({
    uploading: false,
    progress: initialData?.documents.some((d) => d.docType === 'FARM_DOC') ? 100 : 0,
    error: null,
    fileUrl: initialData?.documents.find((d) => d.docType === 'FARM_DOC')?.fileUrl,
    fileName: initialData?.documents.find((d) => d.docType === 'FARM_DOC')?.fileName,
  });

  async function handleSimulateUpload(docType: 'ID_PROOF' | 'FARM_DOC') {
    const isIdProof = docType === 'ID_PROOF';
    const setStatus = isIdProof ? setIdProofStatus : setFarmDocStatus;
    const filename = isIdProof ? 'aadhaar_scan.pdf' : 'land_patta.pdf';

    setStatus({ uploading: true, progress: 15, error: null });

    try {
      // 1. Call POST /uploads/sign
      const signRes = await signUpload({
        purpose: 'FARMER_DOCUMENT',
        filename,
        contentType: 'application/pdf',
      });

      // 2. Simulate progressive direct upload to uploadUrl
      setStatus({ uploading: true, progress: 50, error: null });
      await new Promise((r) => setTimeout(r, 400));
      setStatus({ uploading: true, progress: 85, error: null });
      await new Promise((r) => setTimeout(r, 300));

      const finalUrl = signRes.fileUrl;
      setStatus({
        uploading: false,
        progress: 100,
        error: null,
        fileUrl: finalUrl,
        fileName: filename,
      });

      // Update documents state
      setDocuments((prev) => {
        const filtered = prev.filter((d) => d.docType !== docType);
        return [...filtered, { docType, fileUrl: finalUrl, fileName: filename }];
      });
    } catch {
      setStatus({
        uploading: false,
        progress: 0,
        error: t('registration.upload.failed'),
      });
    }
  }

  function handleContinue() {
    const payload: Step4DocumentsData = {
      documents,
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

  return (
    <Card style={styles.card}>
      <Text style={[styles.title, { color: theme.colors.onSurface }]}>
        {t('registration.step4')}
      </Text>

      {errorMsg ? <ErrorState message={errorMsg} onRetry={() => setErrorMsg(null)} /> : null}

      {/* ID Proof Item */}
      <View style={[styles.docItem, { backgroundColor: theme.colors.grey100 }]}>
        <View style={styles.docHeader}>
          <Icon name="badge" size={24} color={theme.colors.primary} />
          <Text style={[styles.docName, { color: theme.colors.onSurface }]}>
            {t('registration.upload.idProof')} *
          </Text>
        </View>

        {idProofStatus.progress === 100 ? (
          <View style={styles.statusRow}>
            <Badge label={t('registration.upload.success')} variant="success" />
            <Text style={[styles.filenameText, { color: theme.colors.grey700 }]}>
              {idProofStatus.fileName ?? 'aadhaar_card.pdf'}
            </Text>
          </View>
        ) : idProofStatus.uploading ? (
          <Text style={[styles.progressText, { color: theme.colors.primary }]}>
            {t('registration.upload.progress', { percent: idProofStatus.progress })}
          </Text>
        ) : idProofStatus.error ? (
          <TouchableOpacity onPress={() => handleSimulateUpload('ID_PROOF')}>
            <Badge label={idProofStatus.error} variant="danger" />
          </TouchableOpacity>
        ) : (
          <Button
            title="Upload ID Document"
            onPress={() => handleSimulateUpload('ID_PROOF')}
            variant="outline"
          />
        )}
      </View>

      {/* Farm Doc Item */}
      <View style={[styles.docItem, { backgroundColor: theme.colors.grey100 }]}>
        <View style={styles.docHeader}>
          <Icon name="description" size={24} color={theme.colors.primary} />
          <Text style={[styles.docName, { color: theme.colors.onSurface }]}>
            {t('registration.upload.farmDoc')} *
          </Text>
        </View>

        {farmDocStatus.progress === 100 ? (
          <View style={styles.statusRow}>
            <Badge label={t('registration.upload.success')} variant="success" />
            <Text style={[styles.filenameText, { color: theme.colors.grey700 }]}>
              {farmDocStatus.fileName ?? 'land_patta.pdf'}
            </Text>
          </View>
        ) : farmDocStatus.uploading ? (
          <Text style={[styles.progressText, { color: theme.colors.primary }]}>
            {t('registration.upload.progress', { percent: farmDocStatus.progress })}
          </Text>
        ) : farmDocStatus.error ? (
          <TouchableOpacity onPress={() => handleSimulateUpload('FARM_DOC')}>
            <Badge label={farmDocStatus.error} variant="danger" />
          </TouchableOpacity>
        ) : (
          <Button
            title="Upload Land Record"
            onPress={() => handleSimulateUpload('FARM_DOC')}
            variant="outline"
          />
        )}
      </View>

      <View style={styles.buttonRow}>
        <Button
          title={t('registration.back')}
          variant="outline"
          onPress={onBack}
          style={styles.flexBtn}
        />
        <Button
          title={t('registration.next')}
          onPress={handleContinue}
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
  docItem: {
    padding: 14,
    borderRadius: 8,
    gap: 8,
  },
  docHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  docName: {
    fontSize: 15,
    fontWeight: '600',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  filenameText: {
    fontSize: 13,
  },
  progressText: {
    fontSize: 14,
    fontWeight: '600',
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
