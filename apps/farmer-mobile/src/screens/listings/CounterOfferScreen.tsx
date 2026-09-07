import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
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
  acceptCounterOffer,
  canCounterBack,
  computeRemainingTime,
  counterBackOffer,
  evalListingCeiling,
  formatCountdown,
  rejectCounterOffer,
  type CounterOffer,
  type Listing,
} from '../../api/listings';
import { Badge } from '../../components/Badge';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { Icon } from '../../components/Icon';
import { Input } from '../../components/Input';
import { t } from '../../i18n';
import { MIN_TOUCH_TARGET, colors, radius, spacing, typography, weights } from '../../theme';

interface CounterOfferScreenProps {
  listing: Listing;
  offer?: CounterOffer | null;
  onSuccess?: () => void;
  onCancel?: () => void;
  onRefreshListing?: () => Promise<void>;
}

export function CounterOfferScreen({
  listing,
  offer: initialOffer,
  onSuccess,
  onCancel,
  onRefreshListing,
}: CounterOfferScreenProps): React.JSX.Element {
  const offer = initialOffer ?? listing.activeCounterOffer;

  // Real-time monotonic ticker for BR-10 (24-hour countdown)
  const clientBasePerfMsRef = useRef<number>(performance.now());
  const clientBaseDateMsRef = useRef<number>(Date.now());
  const [currentPerfMs, setCurrentPerfMs] = useState<number>(performance.now());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentPerfMs(performance.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const timeState = useMemo(() => {
    if (!offer?.expiresAt) {
      return { remainingMs: 0, remainingSeconds: 0, isExpired: true };
    }
    return computeRemainingTime(
      offer.expiresAt,
      clientBaseDateMsRef.current,
      clientBasePerfMsRef.current,
      currentPerfMs,
    );
  }, [offer?.expiresAt, currentPerfMs]);

  // BR-11: Counter round limit check (max 3 rounds)
  const roundsUsed = listing.counterRoundsUsed ?? (offer?.round ? offer.round - 1 : 0);
  const eligibleToCounter = canCounterBack(roundsUsed);

  // Form mode: none | counterBack | rejectConfirm
  const [mode, setMode] = useState<'VIEW' | 'COUNTER_BACK' | 'REJECT_CONFIRM'>('VIEW');
  const [counterPrice, setCounterPrice] = useState<string>('');
  const [counterQty, setCounterQty] = useState<string>(listing.quantityKg);
  const [farmerMessage, setFarmerMessage] = useState<string>('');
  const [rejectionReason, setRejectionReason] = useState<string>('');

  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [conflictWarning, setConflictWarning] = useState<boolean>(false);

  // Inline ceiling validation for counter-back price (BR-07)
  const counterPriceEval = useMemo(() => {
    if (!counterPrice.trim()) {
      return { isValid: false, error: null, message: null };
    }
    return evalListingCeiling(counterPrice, listing.ceilingPricePerKg);
  }, [counterPrice, listing.ceilingPricePerKg]);

  const counterQtyValid = useMemo(() => {
    if (!counterQty.trim()) return false;
    const num = Number(counterQty);
    return !isNaN(num) && num > 0 && /^\d+(\.\d{1,3})?$/.test(counterQty.trim());
  }, [counterQty]);

  const canSubmitCounterBack =
    counterPriceEval.isValid && counterQtyValid && !submitting && !timeState.isExpired;

  const handleAccept = useCallback(async () => {
    if (!offer || timeState.isExpired || submitting) return;
    setSubmitting(true);
    setErrorMessage(null);
    try {
      await acceptCounterOffer(listing.id, offer.id);
      onSuccess?.();
    } catch (err: unknown) {
      const anyErr = err as { status?: number; detail?: string; message?: string };
      if (anyErr.status === 409) {
        setConflictWarning(true);
        void onRefreshListing?.();
      } else {
        setErrorMessage(anyErr.detail || anyErr.message || 'Failed to accept counter-offer.');
      }
    } finally {
      setSubmitting(false);
    }
  }, [listing.id, offer, timeState.isExpired, submitting, onSuccess, onRefreshListing]);

  const handleReject = useCallback(async () => {
    if (!offer || timeState.isExpired || submitting) return;
    setSubmitting(true);
    setErrorMessage(null);
    try {
      await rejectCounterOffer(listing.id, offer.id, rejectionReason.trim() || undefined);
      onSuccess?.();
    } catch (err: unknown) {
      const anyErr = err as { status?: number; detail?: string; message?: string };
      if (anyErr.status === 409) {
        setConflictWarning(true);
        void onRefreshListing?.();
      } else {
        setErrorMessage(anyErr.detail || anyErr.message || 'Failed to reject counter-offer.');
      }
    } finally {
      setSubmitting(false);
    }
  }, [listing.id, offer, timeState.isExpired, submitting, rejectionReason, onSuccess, onRefreshListing]);

  const handleCounterBack = useCallback(async () => {
    if (!offer || !canSubmitCounterBack) return;
    setSubmitting(true);
    setErrorMessage(null);
    try {
      await counterBackOffer(listing.id, offer.id, {
        pricePerKg: counterPrice.trim(),
        quantityKg: counterQty.trim(),
        message: farmerMessage.trim() || undefined,
      });
      onSuccess?.();
    } catch (err: unknown) {
      const anyErr = err as { status?: number; code?: string; detail?: string; message?: string };
      if (anyErr.status === 409) {
        setConflictWarning(true);
        void onRefreshListing?.();
      } else if (anyErr.code === 'PRICE_ABOVE_CEILING') {
        setErrorMessage(
          anyErr.detail ||
            `Counter-price exceeds the fair-price ceiling of ₹${listing.ceilingPricePerKg}/kg (BR-07).`,
        );
      } else {
        setErrorMessage(anyErr.detail || anyErr.message || 'Failed to submit counter-offer.');
      }
    } finally {
      setSubmitting(false);
    }
  }, [
    listing.id,
    listing.ceilingPricePerKg,
    offer,
    canSubmitCounterBack,
    counterPrice,
    counterQty,
    farmerMessage,
    onSuccess,
    onRefreshListing,
  ]);

  if (!offer) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <Pressable style={styles.backButton} onPress={onCancel}>
            <Icon name="arrow_back" size={24} color={colors.onSurface} />
          </Pressable>
          <Text style={styles.headerTitle}>{t('counterOffer.title') || 'Counter-Offer'}</Text>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No active counter-offer found for this listing.</Text>
          <Button title="Return to Listings" variant="outline" onPress={() => onCancel?.()} />
        </View>
      </SafeAreaView>
    );
  }

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
            {t('counterOffer.title') || 'Counter-Offer Review'}
          </Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Conflict Warning banner */}
          {conflictWarning ? (
            <View style={styles.conflictBanner} accessibilityRole="alert">
              <Icon name="info" size={20} color={colors.info} />
              <Text style={styles.conflictText}>
                {t('counterOffer.conflictError') ||
                  'The offer state was updated. Please review the updated details.'}
              </Text>
            </View>
          ) : null}

          {/* General Error Banner */}
          {errorMessage ? (
            <View style={styles.errorBanner} accessibilityRole="alert">
              <Icon name="error" size={20} color={colors.danger} />
              <Text style={styles.errorBannerText}>{errorMessage}</Text>
            </View>
          ) : null}

          {/* Listing Header Info */}
          <Card style={styles.produceCard}>
            <View style={styles.produceHeaderRow}>
              <Text style={styles.cropTitle}>{listing.cropName}</Text>
              <Badge label={listing.grade.replace('_', ' ')} variant="info" />
            </View>
            <Text style={styles.listingNumberText}>Listing #{listing.listingNumber}</Text>
          </Card>

          {/* BR-10: 24-Hour Countdown Timer Card */}
          <Card
            style={[
              styles.timerCard,
              timeState.isExpired ? styles.timerCardExpired : styles.timerCardActive,
            ]}
          >
            <View style={styles.timerHeaderRow}>
              <Icon
                name="schedule"
                size={22}
                color={timeState.isExpired ? colors.danger : colors.primary}
              />
              <Text
                style={[
                  styles.timerTitle,
                  timeState.isExpired ? styles.timerTitleExpired : styles.timerTitleActive,
                ]}
              >
                {t('counterOffer.timer.title') || '24-Hour Response Window (BR-10)'}
              </Text>
            </View>
            <Text
              style={[
                styles.timerCountdown,
                timeState.isExpired ? styles.timerCountdownExpired : styles.timerCountdownActive,
              ]}
            >
              {timeState.isExpired
                ? t('counterOffer.timer.expired') || 'Response window lapsed — offer expired'
                : `${t('counterOffer.timer.remaining') || 'Time Remaining:'} ${formatCountdown(timeState.remainingMs)}`}
            </Text>
          </Card>

          {/* BR-11: Counter-Offer Negotiation Round Indicator */}
          <Card style={styles.roundsCard}>
            <View style={styles.roundHeaderRow}>
              <Icon name="swap_horiz" size={20} color={colors.secondary} />
              <Text style={styles.roundTitle}>
                {t('counterOffer.rounds.title') || 'Negotiation Rounds (BR-11)'}
              </Text>
            </View>
            <Text style={styles.roundSubtitle}>
              Round {offer.round} • {roundsUsed} of 3 farmer counter-offers used
            </Text>
            {!eligibleToCounter ? (
              <View style={styles.roundLimitNotice}>
                <Icon name="info" size={16} color={colors.danger} />
                <Text style={styles.roundLimitNoticeText}>
                  {t('counterOffer.rounds.limitReached') ||
                    'Maximum 3 counter rounds reached. You can only Accept or Reject this offer.'}
                </Text>
              </View>
            ) : null}
          </Card>

          {/* Comparison Cards: Original Asking vs Admin Counter */}
          <View style={styles.comparisonContainer}>
            {/* Original Farmer Terms */}
            <Card style={styles.termCard}>
              <Text style={styles.termHeader}>
                {t('counterOffer.terms.original') || 'Your Original Price'}
              </Text>
              <Text style={styles.termPrice}>₹{listing.askingPricePerKg}/kg</Text>
              <Text style={styles.termQty}>{listing.quantityKg} kg</Text>
              <Text style={styles.termCeiling}>
                Ceiling: ₹{listing.ceilingPricePerKg}/kg
              </Text>
            </Card>

            {/* Admin Counter-Offer Terms */}
            <Card style={[styles.termCard, styles.counterTermCard]}>
              <Text style={[styles.termHeader, styles.counterTermHeader]}>
                {t('counterOffer.terms.counter') || 'Admin Counter-Offer'}
              </Text>
              <Text style={[styles.termPrice, styles.counterPriceText]}>
                ₹{offer.pricePerKg}/kg
              </Text>
              <Text style={styles.termQty}>{offer.quantityKg} kg</Text>
              <Text style={styles.termDifference}>
                {Number(offer.pricePerKg) < Number(listing.askingPricePerKg)
                  ? `-₹${(Number(listing.askingPricePerKg) - Number(offer.pricePerKg)).toFixed(2)}/kg`
                  : `+₹${(Number(offer.pricePerKg) - Number(listing.askingPricePerKg)).toFixed(2)}/kg`}
              </Text>
            </Card>
          </View>

          {/* Admin Note if provided */}
          {offer.message ? (
            <Card style={styles.adminNoteCard}>
              <Text style={styles.adminNoteLabel}>
                {t('counterOffer.adminNote') || 'Admin Note'}:
              </Text>
              <Text style={styles.adminNoteText}>"{offer.message}"</Text>
            </Card>
          ) : null}

          {/* Mode-specific forms */}
          {mode === 'COUNTER_BACK' && eligibleToCounter && !timeState.isExpired ? (
            <Card style={styles.counterBackCard}>
              <Text style={styles.counterBackTitle}>
                {t('counterOffer.button.counterBack') || 'Counter Back'} (Round {offer.round + 1} of 3)
              </Text>
              <View style={styles.inputContainer}>
                <Input
                  label={t('counterOffer.input.price') || 'Your Counter Price (₹/kg)'}
                  value={counterPrice}
                  onChangeText={setCounterPrice}
                  placeholder={`Max ₹${listing.ceilingPricePerKg}`}
                  keyboardType="decimal-pad"
                  error={
                    counterPriceEval.error ? counterPriceEval.message ?? 'Invalid price' : undefined
                  }
                />
              </View>
              <View style={styles.inputContainer}>
                <Input
                  label={t('counterOffer.input.qty') || 'Quantity (kg)'}
                  value={counterQty}
                  onChangeText={setCounterQty}
                  placeholder="Quantity in kg"
                  keyboardType="decimal-pad"
                  error={
                    counterQty.trim() !== '' && !counterQtyValid
                      ? 'Enter valid quantity in kg'
                      : undefined
                  }
                />
              </View>
              <View style={styles.inputContainer}>
                <Input
                  label={t('counterOffer.input.message') || 'Message to Admin (optional)'}
                  value={farmerMessage}
                  onChangeText={setFarmerMessage}
                  placeholder="e.g. Best price for high organic grade"
                />
              </View>
              <View style={styles.actionRow}>
                <Button
                  title={t('counterOffer.button.submitCounter') || 'Submit Counter-Offer'}
                  variant="primary"
                  disabled={!canSubmitCounterBack}
                  loading={submitting}
                  onPress={() => void handleCounterBack()}
                  style={styles.flexButton}
                />
                <Button
                  title={t('common.cancel') || 'Cancel'}
                  variant="outline"
                  onPress={() => setMode('VIEW')}
                />
              </View>
            </Card>
          ) : null}

          {mode === 'REJECT_CONFIRM' && !timeState.isExpired ? (
            <Card style={styles.rejectCard}>
              <Text style={styles.rejectTitle}>
                {t('counterOffer.button.reject') || 'Reject Offer'}
              </Text>
              <Text style={styles.rejectSubtitle}>
                Are you sure you want to reject this offer? The listing may remain unsold or close.
              </Text>
              <View style={styles.inputContainer}>
                <Input
                  label="Reason for Rejection (optional)"
                  value={rejectionReason}
                  onChangeText={setRejectionReason}
                  placeholder="e.g. Price below cost of production"
                />
              </View>
              <View style={styles.actionRow}>
                <Button
                  title="Confirm Rejection"
                  variant="danger"
                  loading={submitting}
                  onPress={() => void handleReject()}
                  style={styles.flexButton}
                />
                <Button
                  title={t('common.cancel') || 'Cancel'}
                  variant="outline"
                  onPress={() => setMode('VIEW')}
                />
              </View>
            </Card>
          ) : null}

          {/* Action Buttons: Accept / Reject / Counter-Back */}
          {mode === 'VIEW' ? (
            <View style={styles.actionStack}>
              <Button
                title={t('counterOffer.button.accept') || 'Accept Offer'}
                variant="primary"
                disabled={timeState.isExpired || submitting}
                loading={submitting}
                onPress={() => void handleAccept()}
              />

              <View style={styles.secondaryActionRow}>
                {eligibleToCounter ? (
                  <Button
                    title={t('counterOffer.button.counterBack') || 'Counter Back'}
                    variant="outline"
                    disabled={timeState.isExpired || submitting}
                    onPress={() => setMode('COUNTER_BACK')}
                    style={styles.halfButton}
                  />
                ) : null}

                <Button
                  title={t('counterOffer.button.reject') || 'Reject Offer'}
                  variant="outline"
                  disabled={timeState.isExpired || submitting}
                  onPress={() => setMode('REJECT_CONFIRM')}
                  style={eligibleToCounter ? styles.halfButton : styles.fullWidthButton}
                />
              </View>
            </View>
          ) : null}
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
    gap: spacing.md,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
    gap: spacing.md,
  },
  emptyText: {
    fontSize: typography.bodyLarge,
    color: colors.onSurfaceVariant,
    textAlign: 'center',
  },
  conflictBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surfacePressed,
    padding: spacing.md,
    borderRadius: radius.md,
  },
  conflictText: {
    flex: 1,
    fontSize: typography.bodySmall,
    color: colors.info,
    fontWeight: weights.medium,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surfacePressed,
    padding: spacing.md,
    borderRadius: radius.md,
  },
  errorBannerText: {
    flex: 1,
    fontSize: typography.bodySmall,
    color: colors.danger,
    fontWeight: weights.medium,
  },
  produceCard: {
    padding: spacing.md,
  },
  produceHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  cropTitle: {
    fontSize: typography.headline,
    fontWeight: weights.bold,
    color: colors.onSurface,
  },
  listingNumberText: {
    fontSize: typography.caption,
    color: colors.onSurfaceVariant,
  },
  timerCard: {
    padding: spacing.md,
    borderWidth: 1.5,
  },
  timerCardActive: {
    borderColor: colors.primary,
    backgroundColor: colors.surfaceVariant,
  },
  timerCardExpired: {
    borderColor: colors.danger,
    backgroundColor: colors.surfacePressed,
  },
  timerHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: 4,
  },
  timerTitle: {
    fontSize: typography.body,
    fontWeight: weights.bold,
  },
  timerTitleActive: {
    color: colors.primary,
  },
  timerTitleExpired: {
    color: colors.danger,
  },
  timerCountdown: {
    fontSize: typography.bodyLarge,
    fontWeight: weights.bold,
    marginTop: 2,
  },
  timerCountdownActive: {
    color: colors.onSurface,
  },
  timerCountdownExpired: {
    color: colors.danger,
  },
  roundsCard: {
    padding: spacing.md,
  },
  roundHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: 2,
  },
  roundTitle: {
    fontSize: typography.body,
    fontWeight: weights.bold,
    color: colors.onSurface,
  },
  roundSubtitle: {
    fontSize: typography.caption,
    color: colors.onSurfaceVariant,
  },
  roundLimitNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: spacing.sm,
    backgroundColor: colors.surfacePressed,
    padding: spacing.xs,
    borderRadius: radius.sm,
  },
  roundLimitNoticeText: {
    fontSize: typography.caption,
    color: colors.danger,
    fontWeight: weights.medium,
  },
  comparisonContainer: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  termCard: {
    flex: 1,
    padding: spacing.md,
    alignItems: 'center',
  },
  counterTermCard: {
    borderColor: colors.secondary,
    borderWidth: 1.5,
  },
  termHeader: {
    fontSize: typography.caption,
    color: colors.onSurfaceVariant,
    fontWeight: weights.medium,
    marginBottom: 4,
    textAlign: 'center',
  },
  counterTermHeader: {
    color: colors.secondary,
    fontWeight: weights.bold,
  },
  termPrice: {
    fontSize: typography.headline,
    fontWeight: weights.bold,
    color: colors.onSurface,
  },
  counterPriceText: {
    color: colors.secondary,
  },
  termQty: {
    fontSize: typography.bodySmall,
    color: colors.onSurfaceVariant,
    marginTop: 2,
  },
  termCeiling: {
    fontSize: typography.caption,
    color: colors.textMuted,
    marginTop: 4,
  },
  termDifference: {
    fontSize: typography.caption,
    fontWeight: weights.bold,
    color: colors.secondary,
    marginTop: 4,
  },
  adminNoteCard: {
    padding: spacing.md,
    backgroundColor: colors.surfaceVariant,
  },
  adminNoteLabel: {
    fontSize: typography.caption,
    fontWeight: weights.bold,
    color: colors.onSurfaceVariant,
    marginBottom: 2,
  },
  adminNoteText: {
    fontSize: typography.body,
    fontStyle: 'italic',
    color: colors.onSurface,
  },
  counterBackCard: {
    padding: spacing.md,
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  counterBackTitle: {
    fontSize: typography.bodyLarge,
    fontWeight: weights.bold,
    color: colors.primary,
    marginBottom: spacing.sm,
  },
  inputContainer: {
    marginBottom: spacing.sm,
  },
  actionRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  flexButton: {
    flex: 1,
  },
  rejectCard: {
    padding: spacing.md,
    borderWidth: 1.5,
    borderColor: colors.danger,
  },
  rejectTitle: {
    fontSize: typography.bodyLarge,
    fontWeight: weights.bold,
    color: colors.danger,
    marginBottom: 4,
  },
  rejectSubtitle: {
    fontSize: typography.bodySmall,
    color: colors.onSurfaceVariant,
    marginBottom: spacing.sm,
  },
  actionStack: {
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  secondaryActionRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  halfButton: {
    flex: 1,
  },
  fullWidthButton: {
    flex: 1,
  },
});
