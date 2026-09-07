import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  createListing,
  evalListingCeiling,
  getFairPriceCeilings,
  type CreateListingInput,
  type FairPriceCeiling,
  type Grade,
} from '../../api/listings';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { Icon } from '../../components/Icon';
import { Input } from '../../components/Input';
import { t } from '../../i18n';
import { MIN_TOUCH_TARGET, colors, radius, spacing, typography, weights } from '../../theme';

interface CreateListingScreenProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  onNavigateToCertifications?: () => void;
}

interface CropOption {
  id: string;
  name: string;
}

const DEFAULT_CROPS: CropOption[] = [
  { id: 'c1111111-1111-4111-a111-111111111111', name: 'Carrot (Ooty)' },
  { id: 'c2222222-2222-4222-a222-222222222222', name: 'Potato (Nilgiris)' },
  { id: 'c3333333-3333-4333-a333-333333333333', name: 'Beetroot' },
  { id: 'c4444444-4444-4444-a444-444444444444', name: 'Garlic' },
];

const GRADES: { grade: Grade; label: string; desc: string }[] = [
  { grade: 'GRADE_1', label: 'Grade 1', desc: 'Superior A-Grade' },
  { grade: 'GRADE_2', label: 'Grade 2', desc: 'Standard Market' },
  { grade: 'GRADE_3', label: 'Grade 3', desc: 'Processing / Juice' },
];

export function generateIdempotencyKey(): string {
  return `lst-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function CreateListingScreen({
  onSuccess,
  onCancel,
  onNavigateToCertifications,
}: CreateListingScreenProps): React.JSX.Element {
  const [fairPrices, setFairPrices] = useState<FairPriceCeiling[]>([]);
  const [availableCrops, setAvailableCrops] = useState<CropOption[]>(DEFAULT_CROPS);
  const [loadingCeilings, setLoadingCeilings] = useState<boolean>(true);

  // Form State
  const [selectedCropId, setSelectedCropId] = useState<string>(DEFAULT_CROPS[0]?.id ?? '');
  const [selectedGrade, setSelectedGrade] = useState<Grade>('GRADE_1');
  const [quantityKg, setQuantityKg] = useState<string>('');
  const [askingPrice, setAskingPrice] = useState<string>('');
  const [availableFrom, setAvailableFrom] = useState<string>(getTodayDateString());

  // Status & Error states
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [certBlockedError, setCertBlockedError] = useState<string | null>(null);

  // Single idempotency key preserved across retries for this form session
  const idempotencyKeyRef = useRef<string>(generateIdempotencyKey());

  const fetchCeilings = useCallback(async () => {
    setLoadingCeilings(true);
    try {
      const res = await getFairPriceCeilings();
      if (res.items && res.items.length > 0) {
        setFairPrices(res.items);
        const map = new Map<string, string>();
        res.items.forEach((item) => {
          if (item.cropId) {
            map.set(item.cropId, item.cropName || 'Produce');
          }
        });
        const cropList: CropOption[] = Array.from(map.entries()).map(([id, name]) => ({ id, name }));
        if (cropList.length > 0) {
          setAvailableCrops(cropList);
          setSelectedCropId(cropList[0]?.id ?? '');
        }
      }
    } catch {
      // Offline or mock fallback already set to DEFAULT_CROPS
    } finally {
      setLoadingCeilings(false);
    }
  }, []);

  useEffect(() => {
    void fetchCeilings();
  }, [fetchCeilings]);

  // Find effective ceiling for currently selected crop & grade
  const activeCeiling = useMemo<FairPriceCeiling | undefined>(() => {
    return fairPrices.find(
      (p) => p.cropId === selectedCropId && p.grade === selectedGrade,
    );
  }, [fairPrices, selectedCropId, selectedGrade]);

  const ceilingPriceValue = activeCeiling?.ceilingPrice ?? '85.00';

  // Live BR-07 price ceiling evaluation
  const priceEvaluation = useMemo(() => {
    if (!askingPrice.trim()) {
      return { isValid: false, error: null, message: null };
    }
    return evalListingCeiling(askingPrice, ceilingPriceValue);
  }, [askingPrice, ceilingPriceValue]);

  // Quantity validation (positive decimal up to 3 places)
  const quantityValid = useMemo(() => {
    if (!quantityKg.trim()) return false;
    const num = Number(quantityKg);
    return !isNaN(num) && num > 0 && /^\d+(\.\d{1,3})?$/.test(quantityKg.trim());
  }, [quantityKg]);

  const canSubmit =
    Boolean(selectedCropId) &&
    quantityValid &&
    priceEvaluation.isValid &&
    !submitting;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    setErrorMessage(null);
    setCertBlockedError(null);

    const input: CreateListingInput = {
      cropId: selectedCropId,
      grade: selectedGrade,
      quantityKg: quantityKg.trim(),
      askingPricePerKg: askingPrice.trim(),
      availableFrom: availableFrom.trim() || getTodayDateString(),
    };

    try {
      await createListing(input, idempotencyKeyRef.current);
      onSuccess?.();
    } catch (err: unknown) {
      const anyErr = err as { code?: string; detail?: string; message?: string };
      const errCode = anyErr.code || '';
      const detail = anyErr.detail || anyErr.message || '';

      if (
        errCode === 'CERT_EXPIRED' ||
        errCode === 'CERT_UNVERIFIED' ||
        detail.toLowerCase().includes('certificate') ||
        detail.toLowerCase().includes('npop')
      ) {
        setCertBlockedError(
          detail ||
            t('listings.create.certBlockedDesc') ||
            'Market access is blocked due to unverified or expired organic certification.',
        );
      } else if (errCode === 'PRICE_ABOVE_CEILING') {
        setErrorMessage(
          detail ||
            `Asking price exceeds the fair price ceiling of ₹${ceilingPriceValue}/kg (BR-07).`,
        );
      } else {
        setErrorMessage(detail || t('error.generic') || 'Failed to create produce listing.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Screen Header */}
        <View style={styles.header}>
          <Pressable
            style={styles.backButton}
            onPress={onCancel}
            accessibilityRole="button"
            accessibilityLabel="Back to listings"
          >
            <Icon name="arrow_back" size={24} color={colors.onSurface} />
          </Pressable>
          <Text style={styles.headerTitle}>
            {t('listings.create.title') || 'Create Produce Listing'}
          </Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Certificate Block Warning Alert (BR-01 / BR-02) */}
          {certBlockedError ? (
            <Card style={styles.certBlockedCard} accessibilityRole="alert">
              <View style={styles.certBlockedHeader}>
                <Icon name="warning" size={24} color={colors.danger} />
                <Text style={styles.certBlockedTitle}>
                  {t('listings.create.certBlockedTitle') || 'Market Access Blocked'}
                </Text>
              </View>
              <Text style={styles.certBlockedText}>{certBlockedError}</Text>
              <Button
                title={t('listings.create.certBlockedAction') || 'Manage Certificates'}
                variant="primary"
                onPress={() => onNavigateToCertifications?.()}
              />
            </Card>
          ) : null}

          {/* General Error Banner */}
          {errorMessage ? (
            <View style={styles.errorBanner} accessibilityRole="alert">
              <Icon name="error" size={20} color={colors.danger} />
              <Text style={styles.errorBannerText}>{errorMessage}</Text>
            </View>
          ) : null}

          {/* Step 1: Crop Selection */}
          <Text style={styles.sectionLabel}>
            {t('listings.create.selectCrop') || 'Select Crop'}
          </Text>
          <View style={styles.chipRow}>
            {availableCrops.map((crop) => {
              const isSelected = crop.id === selectedCropId;
              return (
                <Pressable
                  key={crop.id}
                  style={[styles.chip, isSelected && styles.chipActive]}
                  onPress={() => setSelectedCropId(crop.id)}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: isSelected }}
                >
                  <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>
                    {crop.name}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Step 2: Grade Selection */}
          <Text style={styles.sectionLabel}>
            {t('listings.create.selectGrade') || 'Select Grade'}
          </Text>
          <View style={styles.gradeGrid}>
            {GRADES.map((g) => {
              const isSelected = g.grade === selectedGrade;
              return (
                <Pressable
                  key={g.grade}
                  style={[styles.gradeCard, isSelected && styles.gradeCardActive]}
                  onPress={() => setSelectedGrade(g.grade)}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: isSelected }}
                >
                  <Text style={[styles.gradeTitle, isSelected && styles.gradeTitleActive]}>
                    {g.label}
                  </Text>
                  <Text style={styles.gradeDesc}>{g.desc}</Text>
                </Pressable>
              );
            })}
          </View>

          {/* Step 3: BR-07 Fair Price Ceiling Display - Shown BEFORE entering price */}
          <Card style={styles.ceilingCard}>
            <View style={styles.ceilingHeader}>
              <Icon name="verified" size={20} color={colors.primary} />
              <Text style={styles.ceilingBadgeTitle}>
                {t('listings.create.ceilingNotice', { price: ceilingPriceValue }) ||
                  `Fair Price Ceiling: ₹${ceilingPriceValue}/kg (BR-07)`}
              </Text>
            </View>
            <Text style={styles.ceilingDescription}>
              {t('listings.create.ceilingNoticeHint') ||
                'Asking price cannot exceed the official fair-price ceiling set by TOHFA.'}
            </Text>
            {loadingCeilings ? (
              <ActivityIndicator size="small" color={colors.primary} style={styles.ceilingLoader} />
            ) : null}
          </Card>

          {/* Step 4: Quantity Input */}
          <View style={styles.inputContainer}>
            <Input
              label={t('listings.create.quantity') || 'Quantity (kg)'}
              value={quantityKg}
              onChangeText={setQuantityKg}
              placeholder="e.g. 150.00"
              keyboardType="decimal-pad"
              error={
                quantityKg.trim() !== '' && !quantityValid
                  ? 'Enter a valid positive quantity in kg (up to 3 decimal places)'
                  : undefined
              }
            />
          </View>

          {/* Step 5: Asking Price with live BR-07 inline feedback */}
          <View style={styles.inputContainer}>
            <Input
              label={t('listings.create.price') || 'Asking Price (₹/kg)'}
              value={askingPrice}
              onChangeText={setAskingPrice}
              placeholder={`Max ₹${ceilingPriceValue}`}
              keyboardType="decimal-pad"
              error={
                priceEvaluation.error ? priceEvaluation.message ?? 'Invalid price' : undefined
              }
            />
            {priceEvaluation.isValid && askingPrice.trim() !== '' ? (
              <View style={styles.validPriceRow}>
                <Icon name="check_circle" size={16} color={colors.success} />
                <Text style={styles.validPriceText}>
                  Within fair price ceiling (₹{ceilingPriceValue}/kg)
                </Text>
              </View>
            ) : null}
          </View>

          {/* Step 6: Available From Date */}
          <View style={styles.inputContainer}>
            <Input
              label={t('listings.create.availableFrom') || 'Available From (YYYY-MM-DD)'}
              value={availableFrom}
              onChangeText={setAvailableFrom}
              placeholder="YYYY-MM-DD"
            />
          </View>

          {/* Submit Action */}
          <View style={styles.actionSection}>
            <Button
              title={
                submitting
                  ? 'Submitting Listing...'
                  : t('listings.create.submit') || 'Submit Produce Listing'
              }
              variant="primary"
              disabled={!canSubmit}
              loading={submitting}
              onPress={() => void handleSubmit()}
            />
            <Button
              title={t('common.cancel') || 'Cancel'}
              variant="outline"
              onPress={() => onCancel?.()}
              style={styles.cancelButton}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfacePressed,
    backgroundColor: colors.white,
  },
  backButton: {
    minWidth: MIN_TOUCH_TARGET,
    minHeight: MIN_TOUCH_TARGET,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: typography.title,
    fontWeight: weights.bold,
    color: colors.onSurface,
  },
  headerSpacer: {
    width: MIN_TOUCH_TARGET,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl * 2,
  },
  certBlockedCard: {
    backgroundColor: colors.white,
    borderColor: colors.danger,
    borderWidth: 1.5,
    marginBottom: spacing.lg,
    padding: spacing.md,
    gap: spacing.sm,
  },
  certBlockedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  certBlockedTitle: {
    fontSize: typography.bodyLarge,
    fontWeight: weights.bold,
    color: colors.danger,
  },
  certBlockedText: {
    fontSize: typography.body,
    color: colors.onSurface,
    lineHeight: 20,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surfacePressed,
    padding: spacing.md,
    borderRadius: radius.md,
    marginBottom: spacing.lg,
  },
  errorBannerText: {
    flex: 1,
    fontSize: typography.bodySmall,
    color: colors.danger,
    fontWeight: weights.medium,
  },
  sectionLabel: {
    fontSize: typography.bodyLarge,
    fontWeight: weights.bold,
    color: colors.onSurface,
    marginBottom: spacing.sm,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.surfacePressed,
    backgroundColor: colors.white,
    minHeight: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipText: {
    fontSize: typography.bodySmall,
    fontWeight: weights.medium,
    color: colors.onSurface,
  },
  chipTextActive: {
    color: colors.white,
    fontWeight: weights.bold,
  },
  gradeGrid: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  gradeCard: {
    flex: 1,
    padding: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.surfacePressed,
    backgroundColor: colors.white,
    alignItems: 'center',
  },
  gradeCardActive: {
    borderColor: colors.primary,
    backgroundColor: colors.surfaceVariant,
  },
  gradeTitle: {
    fontSize: typography.body,
    fontWeight: weights.bold,
    color: colors.onSurface,
  },
  gradeTitleActive: {
    color: colors.primary,
  },
  gradeDesc: {
    fontSize: typography.caption,
    color: colors.onSurfaceVariant,
    textAlign: 'center',
    marginTop: 2,
  },
  ceilingCard: {
    backgroundColor: colors.surfaceVariant,
    borderColor: colors.primary,
    borderWidth: 1,
    marginBottom: spacing.lg,
    padding: spacing.md,
  },
  ceilingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: 4,
  },
  ceilingBadgeTitle: {
    fontSize: typography.body,
    fontWeight: weights.bold,
    color: colors.primary,
  },
  ceilingDescription: {
    fontSize: typography.caption,
    color: colors.textMuted,
  },
  ceilingLoader: {
    marginTop: 4,
  },
  inputContainer: {
    marginBottom: spacing.md,
  },
  validPriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
    paddingHorizontal: 2,
  },
  validPriceText: {
    fontSize: typography.caption,
    color: colors.success,
    fontWeight: weights.medium,
  },
  actionSection: {
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  cancelButton: {
    marginTop: spacing.xs,
  },
});
