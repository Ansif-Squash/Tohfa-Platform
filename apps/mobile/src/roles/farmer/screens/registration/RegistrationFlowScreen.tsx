import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Text, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useTheme } from '../../theme';
import { Step1Personal } from './Step1Personal';
import { Step2FarmDetails } from './Step2FarmDetails';
import { Step3Location } from './Step3Location';
import { Step4Documents } from './Step4Documents';
import { Step5Review } from './Step5Review';
import {
  getRegistrationDraft,
  saveRegistrationDraft,
  type RegistrationDraft,
} from '../../storage/registrationDraft';
import {
  createFarmerApplication,
  saveFarmerApplicationStep,
} from '../../api/registration';

interface RegistrationFlowProps {
  onNavigate: (screen: 'ApplicationStatus' | 'Welcome', params?: Record<string, string | number | undefined>) => void;
}

const STEP_TITLES: Record<number, string> = {
  1: 'Personal Details',
  2: 'Farm Details',
  3: 'Location & Map',
  4: 'Documents & Certificates',
  5: 'Review & Submit',
};

export const RegistrationFlowScreen: React.FC<RegistrationFlowProps> = ({ onNavigate }) => {
  const theme = useTheme();
  const { colors } = theme;
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState<RegistrationDraft>({
    applicationId: 'draft-temp',
    currentStep: 1,
  });

  // Cold-start draft recovery
  useEffect(() => {
    let active = true;

    async function initOrRestoreDraft() {
      try {
        const savedDraft = await getRegistrationDraft();
        if (savedDraft && active) {
          setDraft(savedDraft);
          setLoading(false);
          return;
        }

        // Initialize new draft application
        const appRes = await createFarmerApplication({
          mobile: '+919876543210',
          fullName: 'New Farmer',
          preferredLocale: 'en',
        });

        const newDraft: RegistrationDraft = {
          applicationId: appRes.id,
          currentStep: 1,
        };
        await saveRegistrationDraft(newDraft);
        if (active) {
          setDraft(newDraft);
          setLoading(false);
        }
      } catch {
        // Fallback for offline or local preview
        const fallbackDraft: RegistrationDraft = {
          applicationId: `app-${Date.now().toString(36)}`,
          currentStep: 1,
        };
        await saveRegistrationDraft(fallbackDraft);
        if (active) {
          setDraft(fallbackDraft);
          setLoading(false);
        }
      }
    }

    initOrRestoreDraft();
    return () => {
      active = false;
    };
  }, []);

  async function updateStepAndAdvance(step: number, payload: unknown) {
    const nextStep = Math.min(5, step + 1);
    const updatedDraft: RegistrationDraft = {
      ...draft,
      currentStep: nextStep,
      [`step${step}` as keyof RegistrationDraft]: payload,
    };

    setDraft(updatedDraft);
    await saveRegistrationDraft(updatedDraft);

    // Persist to server in background
    try {
      await saveFarmerApplicationStep(draft.applicationId, step, payload);
    } catch {
      // Offline: changes safely saved to device draft
    }
  }

  function handleBack() {
    if (draft.currentStep <= 1) {
      onNavigate('Welcome');
      return;
    }
    const prevStep = draft.currentStep - 1;
    const updatedDraft = { ...draft, currentStep: prevStep };
    setDraft(updatedDraft);
    saveRegistrationDraft(updatedDraft);
  }

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.colors.surface }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  const stepTitle = STEP_TITLES[draft.currentStep] ?? 'Personal Details';

  return (
    <View style={[styles.container, { backgroundColor: colors.bgLight }]}>
      {/* Branding Spec Header */}
      {draft.currentStep < 3 && (
        <View
          style={[
            styles.header,
            {
              backgroundColor: colors.white,
              borderBottomColor: colors.borderSoft,
            },
          ]}
        >
          <View style={styles.headerTitleRow}>
            <TouchableOpacity
              activeOpacity={0.7}
              style={[
                styles.backButtonCircle,
                {
                  borderColor: colors.borderMedium,
                  backgroundColor: colors.white,
                },
              ]}
              onPress={handleBack}
            >
              <Text style={[styles.backButtonArrow, { color: colors.brandGreen }]}>‹</Text>
            </TouchableOpacity>
            <View>
              <Text style={[styles.headerTitle, { color: colors.textDark }]}>{stepTitle}</Text>
              <Text style={[styles.headerSubtitle, { color: colors.textSubtle }]}>
                Step {draft.currentStep} of 5
              </Text>
            </View>
          </View>

          {/* 5 Progress Bar Segments */}
          <View style={styles.progressRow}>
            {[1, 2, 3, 4, 5].map((s) => {
              const isActive = s <= draft.currentStep;
              return (
                <View
                  key={s}
                  style={[
                    styles.progressSegment,
                    { backgroundColor: isActive ? colors.brandGreen : colors.borderMedium },
                  ]}
                />
              );
            })}
          </View>
        </View>
      )}

      {/* Main Step Content */}
      <View style={styles.stepContent}>
        {draft.currentStep === 1 ? (
          <Step1Personal
            initialData={draft.step1}
            onSave={(data) => updateStepAndAdvance(1, data)}
            onBack={handleBack}
          />
        ) : draft.currentStep === 2 ? (
          <Step2FarmDetails
            initialData={draft.step2}
            onSave={(data) => updateStepAndAdvance(2, data)}
            onBack={handleBack}
          />
        ) : draft.currentStep === 3 ? (
          <Step3Location
            initialData={draft.step3}
            onSave={(data) => updateStepAndAdvance(3, data)}
            onBack={handleBack}
          />
        ) : draft.currentStep === 4 ? (
          <Step4Documents
            initialData={draft.step4}
            onSave={(data) => updateStepAndAdvance(4, data)}
            onBack={handleBack}
          />
        ) : (
          <Step5Review
            draft={draft}
            onSubmitSuccess={(appId) =>
              onNavigate('ApplicationStatus', { applicationId: appId })
            }
            onBack={handleBack}
          />
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 14,
    borderBottomWidth: 1,
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
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonArrow: {
    fontSize: 22,
    fontWeight: '700',
    marginTop: -2,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  headerSubtitle: {
    fontSize: 12,
  },
  progressRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 14,
  },
  progressSegment: {
    flex: 1,
    height: 5,
    borderRadius: 3,
  },
  stepContent: {
    flex: 1,
  },
});
