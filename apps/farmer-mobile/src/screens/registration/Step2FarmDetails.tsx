import React, { useState } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { useTheme } from '../../theme';
import { t } from '../../i18n';
import { Button, Card, ErrorState, Input } from '@tohfa/mobile-ui';
import { validateStep } from './validation';
import type { Step2FarmData } from '../../storage/registrationDraft';

interface Step2Props {
  initialData?: Step2FarmData | undefined;
  onSave: (data: Step2FarmData) => void;
  onBack: () => void;
}

export const Step2FarmDetails: React.FC<Step2Props> = ({ initialData, onSave, onBack }) => {
  const theme = useTheme();
  const existingFarm = initialData?.farms[0];
  const [farmName, setFarmName] = useState(existingFarm?.name ?? '');
  const [acres, setAcres] = useState(existingFarm?.totalAreaAcres ? String(existingFarm.totalAreaAcres) : '');
  const [waterSource, setWaterSource] = useState(existingFarm?.waterSource ?? 'Rainfed / Well');
  const [primaryCrops, setPrimaryCrops] = useState(existingFarm?.primaryCrops?.join(', ') ?? 'Tea, Carrot');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  function handleContinue() {
    const parsedAcres = parseFloat(acres);
    const cropsArray = primaryCrops
      .split(',')
      .map((c) => c.trim())
      .filter((c) => c.length > 0);

    const payload: Step2FarmData = {
      farms: [
        {
          name: farmName.trim(),
          totalAreaAcres: isNaN(parsedAcres) ? 0 : parsedAcres,
          waterSource: waterSource.trim(),
          primaryCrops: cropsArray,
        },
      ],
    };

    const validation = validateStep(2, payload);
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
        {t('registration.step2')}
      </Text>

      {errorMsg ? <ErrorState message={errorMsg} onRetry={() => setErrorMsg(null)} /> : null}

      <Input
        label="Farm / Estate Name *"
        value={farmName}
        onChangeText={setFarmName}
        placeholder="e.g. Green Valley Farm"
      />

      <Input
        label="Total Area (Acres) *"
        value={acres}
        onChangeText={setAcres}
        keyboardType="decimal-pad"
        placeholder="e.g. 2.5"
      />

      <Input
        label="Primary Water Source"
        value={waterSource}
        onChangeText={setWaterSource}
        placeholder="Stream, Well, Rainfed"
      />

      <Input
        label="Primary Crops (comma separated)"
        value={primaryCrops}
        onChangeText={setPrimaryCrops}
        placeholder="Tea, Potato, Carrot"
      />

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
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  flexBtn: {
    flex: 1,
  },
});
