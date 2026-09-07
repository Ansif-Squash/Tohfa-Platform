import React, { useState } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { useTheme } from '../../theme';
import { t } from '../../i18n';
import { Button, Card, ErrorState, Input } from '@tohfa/mobile-ui';
import { validateStep } from './validation';
import type { Step1PersonalData } from '../../storage/registrationDraft';

interface Step1Props {
  initialData?: Step1PersonalData | undefined;
  onSave: (data: Step1PersonalData) => void;
  onBack?: (() => void) | undefined;
}

export const Step1Personal: React.FC<Step1Props> = ({ initialData, onSave, onBack }) => {
  const theme = useTheme();
  const [fullName, setFullName] = useState(initialData?.fullName ?? '');
  const [mobile, setMobile] = useState(initialData?.mobile ?? '');
  const [aadhaarLast4, setAadhaarLast4] = useState(initialData?.aadhaarLast4 ?? '');
  const [village, setVillage] = useState(initialData?.village ?? '');
  const [taluk, setTaluk] = useState(initialData?.taluk ?? 'Ooty');
  const [district, setDistrict] = useState(initialData?.district ?? 'Nilgiris');
  const [pincode, setPincode] = useState(initialData?.pincode ?? '');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  function handleContinue() {
    const formattedMobile = mobile.startsWith('+') ? mobile.trim() : `+91${mobile.trim()}`;
    const payload: Step1PersonalData = {
      fullName: fullName.trim(),
      mobile: formattedMobile,
      aadhaarLast4: aadhaarLast4.trim(),
      village: village.trim(),
      taluk: taluk.trim(),
      district: district.trim(),
      pincode: pincode.trim(),
    };

    const validation = validateStep(1, payload);
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
        {t('registration.step1')}
      </Text>

      {errorMsg ? <ErrorState message={errorMsg} onRetry={() => setErrorMsg(null)} /> : null}

      <Input
        label="Full Name *"
        value={fullName}
        onChangeText={setFullName}
        placeholder="e.g. Murugan S"
      />

      <Input
        label="Mobile Number (+91) *"
        value={mobile}
        onChangeText={setMobile}
        keyboardType="phone-pad"
        placeholder="9876543210"
      />

      <Input
        label="Aadhaar Last 4 Digits *"
        value={aadhaarLast4}
        onChangeText={setAadhaarLast4}
        keyboardType="number-pad"
        maxLength={4}
        placeholder="1234"
      />

      <Input
        label="Village *"
        value={village}
        onChangeText={setVillage}
        placeholder="e.g. Ithalar"
      />

      <Input
        label="Taluk"
        value={taluk}
        onChangeText={setTaluk}
        placeholder="e.g. Ooty / Coonoor"
      />

      <Input
        label="District"
        value={district}
        onChangeText={setDistrict}
        placeholder="Nilgiris"
      />

      <Input
        label="Pincode"
        value={pincode}
        onChangeText={setPincode}
        keyboardType="number-pad"
        maxLength={6}
        placeholder="643001"
      />

      <View style={styles.buttonRow}>
        {onBack ? (
          <Button
            title={t('registration.back')}
            variant="outline"
            onPress={onBack}
            style={styles.flexBtn}
          />
        ) : null}
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
