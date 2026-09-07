import React, { useState } from 'react';
import { View, StyleSheet, Text, Image } from 'react-native';
import { useTheme } from '../../theme';
import { t } from '../../i18n';
import { Badge, Button, Card, ErrorState, Input } from '@tohfa/mobile-ui';
import { validateStep } from './validation';
import type { Step3LocationData } from '../../storage/registrationDraft';

interface Step3Props {
  initialData?: Step3LocationData | undefined;
  onSave: (data: Step3LocationData) => void;
  onBack: () => void;
}

export const Step3Location: React.FC<Step3Props> = ({ initialData, onSave, onBack }) => {
  const theme = useTheme();
  const [gpsCaptured, setGpsCaptured] = useState(initialData?.gpsCaptured ?? false);
  const [lat, setLat] = useState(initialData?.latitude ? String(initialData.latitude) : '');
  const [lng, setLng] = useState(initialData?.longitude ? String(initialData.longitude) : '');
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [capturing, setCapturing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  function handleAutoCaptureGPS() {
    setCapturing(true);
    setErrorMsg(null);

    // Simulate GPS coordinate acquisition with realistic Nilgiris coordinates
    setTimeout(() => {
      setCapturing(false);
      const simulatedLat = 11.4102;
      const simulatedLng = 76.695;
      setLat(String(simulatedLat));
      setLng(String(simulatedLng));
      setGpsCaptured(true);
      setPermissionDenied(false);
    }, 600);
  }

  function handleSimulatePermissionDenied() {
    setPermissionDenied(true);
    setGpsCaptured(false);
    setLat('');
    setLng('');
  }

  function handleContinue() {
    const parsedLat = parseFloat(lat);
    const parsedLng = parseFloat(lng);

    const payload: Step3LocationData = {
      gpsCaptured,
      latitude: isNaN(parsedLat) ? undefined : parsedLat,
      longitude: isNaN(parsedLng) ? undefined : parsedLng,
      village: initialData?.village ?? 'Ooty Rural',
      taluk: initialData?.taluk ?? 'Ooty',
      district: initialData?.district ?? 'Nilgiris',
    };

    const validation = validateStep(3, payload);
    if (!validation.valid) {
      const firstError = Object.values(validation.errors)[0] ?? 'Validation failed';
      setErrorMsg(firstError);
      return;
    }

    setErrorMsg(null);
    onSave(payload);
  }

  const parsedLat = parseFloat(lat);
  const parsedLng = parseFloat(lng);
  const hasValidCoords = !isNaN(parsedLat) && !isNaN(parsedLng);

  return (
    <Card style={styles.card}>
      <Text style={[styles.title, { color: theme.colors.onSurface }]}>
        {t('registration.step3')}
      </Text>

      {errorMsg ? <ErrorState message={errorMsg} onRetry={() => setErrorMsg(null)} /> : null}

      <View style={styles.actionContainer}>
        <Button
          title={capturing ? t('registration.gps.capturing') : t('registration.gps.capture')}
          onPress={handleAutoCaptureGPS}
          loading={capturing}
        />
        <Button
          title="Simulate GPS Denied"
          variant="outline"
          onPress={handleSimulatePermissionDenied}
        />
      </View>

      {permissionDenied ? (
        <View style={styles.deniedNotice}>
          <Badge label={t('registration.gps.denied')} variant="warning" />
        </View>
      ) : null}

      {gpsCaptured && hasValidCoords ? (
        <Badge
          label={t('registration.gps.success', { lat, lng })}
          variant="success"
        />
      ) : null}

      {/* Manual Entry Fallback */}
      <View style={styles.manualContainer}>
        <Input
          label={t('registration.gps.manualLat')}
          value={lat}
          onChangeText={(v) => { setLat(v); setGpsCaptured(false); }}
          keyboardType="decimal-pad"
          placeholder="11.4102"
        />
        <Input
          label={t('registration.gps.manualLng')}
          value={lng}
          onChangeText={(v) => { setLng(v); setGpsCaptured(false); }}
          keyboardType="decimal-pad"
          placeholder="76.6950"
        />
      </View>

      {/* Static Satellite Map Preview */}
      {hasValidCoords ? (
        <View style={styles.previewContainer}>
          <Text style={[styles.previewLabel, { color: theme.colors.grey700 }]}>
            Static Satellite Preview
          </Text>
          <Image
            source={{
              uri: `https://static-maps.yandex.ru/1.x/?ll=${parsedLng},${parsedLat}&z=14&l=sat&size=400,200&pt=${parsedLng},${parsedLat},pm2rdm`,
            }}
            style={styles.previewImage}
            accessibilityLabel="Static satellite preview of farm coordinates"
          />
        </View>
      ) : null}

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
  actionContainer: {
    gap: 8,
  },
  deniedNotice: {
    marginVertical: 4,
  },
  manualContainer: {
    gap: 10,
  },
  previewContainer: {
    gap: 6,
    marginTop: 4,
  },
  previewLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  previewImage: {
    width: '100%',
    height: 160,
    borderRadius: 8,
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
