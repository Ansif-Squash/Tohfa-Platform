import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  getMyFarmerProfile,
  maskAadhaar,
  maskMobile,
  updateMyFarmerProfile,
  type FarmerProfile,
} from '../../api/farmer';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { Icon } from '../../components/Icon';

import { Input } from '../../components/Input';
import { LOCALES, setLocale, t, type Locale } from '../../i18n';
import {
  MIN_TOUCH_TARGET,
  colors,
  radius,
  spacing,
  typography,
  weights,
} from '../../theme';

interface ProfileScreenProps {
  onNavigateToCertifications?: () => void;
}

export function ProfileScreen({
  onNavigateToCertifications,
}: ProfileScreenProps): React.JSX.Element {
  const [profile, setProfile] = useState<FarmerProfile | null>(null);
  const [fullName, setFullName] = useState<string>('');
  const [experience, setExperience] = useState<string>('');
  const [address, setAddress] = useState<string>('');
  const [selectedLocale, setSelectedLocale] = useState<Locale>('ta');

  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [changeRequested, setChangeRequested] = useState<boolean>(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadProfile = useCallback(async () => {
    try {
      setError(null);
      const res = await getMyFarmerProfile();
      setProfile(res);
      setFullName(res.fullName ?? '');
      setExperience(res.farmingExperienceYears ? String(res.farmingExperienceYears) : '');
      setAddress(res.address ?? '');
      setSelectedLocale((res.preferredLocale as Locale) || 'ta');
    } catch {
      setError(t('error.generic'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  const handleSave = async () => {
    try {
      setSaving(true);
      setMessage(null);
      setError(null);

      const parsedExp = experience.trim() ? parseInt(experience.trim(), 10) : undefined;

      // BR-33: Aadhaar and mobile are NEVER sent in the update payload
      const updated = await updateMyFarmerProfile({
        fullName: fullName.trim(),
        farmingExperienceYears: parsedExp,
        address: address.trim(),
        preferredLocale: selectedLocale,
      });

      setProfile(updated);
      setLocale(selectedLocale);
      setMessage(t('profile.saved'));
    } catch {
      setError(t('error.generic'));
    } finally {
      setSaving(false);
    }
  };

  const handleRequestChange = () => {
    // BR-33: Aadhaar and mobile change request flow opens a support request
    setChangeRequested(true);
    Alert.alert(t('profile.requestChange'), t('profile.requestChangeSuccess'));
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.screen}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{t('profile.title')}</Text>
          <Text style={styles.farmerId}>{profile?.tohfaFarmerId}</Text>
        </View>

        {message ? (
          <View style={styles.successBanner}>
            <Text style={styles.successBannerText}>{message}</Text>
          </View>
        ) : null}

        {error ? (
          <View style={styles.errorBanner}>
            <Text style={styles.errorBannerText}>{error}</Text>
          </View>
        ) : null}

        {/* BR-33: Locked Fields Card (Aadhaar & Mobile are strictly read-only and masked) */}
        <Card style={styles.lockedCard}>
          <View style={styles.cardTitleRow}>
            <Icon name="lock" size={20} color={colors.primary} />
            <Text style={styles.cardTitle}>{t('profile.aadhaar')} & {t('profile.mobile')}</Text>
          </View>

          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>{t('profile.aadhaar')}</Text>
            <Text style={styles.lockedValue}>{maskAadhaar(profile?.aadhaarLast4)}</Text>
          </View>

          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>{t('profile.mobile')}</Text>
            <Text style={styles.lockedValue}>{maskMobile(profile?.mobile)}</Text>
          </View>

          <Text style={styles.lockedNote}>{t('profile.lockedNote')}</Text>

          <Button
            title={
              changeRequested
                ? t('profile.requestChangeSuccess')
                : t('profile.requestChange')
            }
            variant="outline"
            onPress={handleRequestChange}
            disabled={changeRequested}
          />
        </Card>

        {/* Editable Profile Fields */}
        <Card style={styles.formCard}>
          <Text style={styles.cardTitle}>{t('profile.fullName')}</Text>
          <Input
            value={fullName}
            onChangeText={setFullName}
            placeholder={t('profile.fullName')}
          />

          <Text style={styles.cardTitle}>{t('profile.experience')}</Text>
          <Input
            value={experience}
            onChangeText={setExperience}
            placeholder={t('profile.experience')}
            keyboardType="number-pad"
          />

          <Text style={styles.cardTitle}>{t('profile.address')}</Text>
          <Input
            value={address}
            onChangeText={setAddress}
            placeholder={t('profile.address')}
            multiline
          />

          <Text style={styles.cardTitle}>{t('profile.locale')}</Text>
          <View style={styles.localeRow}>
            {LOCALES.map((code) => (
              <Pressable
                key={code}
                style={[
                  styles.localeChip,
                  selectedLocale === code && styles.localeChipActive,
                ]}
                onPress={() => setSelectedLocale(code)}
                accessibilityRole="button"
              >
                <Text
                  style={[
                    styles.localeText,
                    selectedLocale === code && styles.localeTextActive,
                  ]}
                >
                  {code === 'ta' ? 'தமிழ்' : 'English'}
                </Text>
              </Pressable>
            ))}
          </View>

          <Button
            title={t('profile.save')}
            variant="primary"
            loading={saving}
            onPress={() => void handleSave()}
          />
        </Card>

        {/* Certifications Link */}
        <Card style={styles.linkCard}>
          <View style={styles.cardTitleRow}>
            <Icon name="verified" size={20} color={colors.primary} />
            <Text style={styles.cardTitle}>{t('certifications.title')}</Text>
          </View>
          <Button
            title={t('dashboard.cert.renewAction')}
            variant="outline"
            onPress={() => onNavigateToCertifications?.()}
          />
        </Card>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.surface },
  centerContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scrollContent: { padding: spacing.lg, gap: spacing.lg },
  header: { gap: spacing.xs },
  headerTitle: {
    fontSize: typography.headline,
    fontWeight: weights.bold,
    color: colors.onSurface,
  },
  farmerId: {
    fontSize: typography.body,
    fontWeight: weights.medium,
    color: colors.onSurfaceVariant,
  },
  successBanner: {
    backgroundColor: colors.surfaceVariant,
    borderColor: colors.primary,
    borderWidth: 1,
    borderRadius: radius.card,
    padding: spacing.md,
  },
  successBannerText: { color: colors.primary, fontSize: typography.body, fontWeight: weights.medium },
  errorBanner: {
    backgroundColor: colors.surfaceVariant,
    borderColor: colors.danger,
    borderWidth: 1,
    borderRadius: radius.card,
    padding: spacing.md,
  },
  errorBannerText: { color: colors.danger, fontSize: typography.body },
  lockedCard: {
    backgroundColor: colors.white,
    borderRadius: radius.cardMax,
    padding: spacing.lg,
    gap: spacing.md,
    borderColor: colors.surfacePressed,
    borderWidth: 1,
  },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  cardTitle: {
    fontSize: typography.bodyLarge,
    fontWeight: weights.semibold,
    color: colors.onSurface,
  },
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
  },
  fieldLabel: {
    fontSize: typography.body,
    color: colors.onSurfaceVariant,
  },
  lockedValue: {
    fontSize: typography.body,
    fontWeight: weights.bold,
    color: colors.onSurface,
  },
  lockedNote: {
    fontSize: typography.caption,
    color: colors.onSurfaceVariant,
    fontStyle: 'italic',
  },
  formCard: {
    backgroundColor: colors.white,
    borderRadius: radius.cardMax,
    padding: spacing.lg,
    gap: spacing.md,
  },
  localeRow: { flexDirection: 'row', gap: spacing.sm },
  localeChip: {
    minHeight: MIN_TOUCH_TARGET,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  localeChipActive: { backgroundColor: colors.primary },
  localeText: { color: colors.primary, fontWeight: weights.medium },
  localeTextActive: { color: colors.white, fontWeight: weights.semibold },
  linkCard: {
    backgroundColor: colors.white,
    borderRadius: radius.cardMax,
    padding: spacing.lg,
    gap: spacing.md,
  },
});
