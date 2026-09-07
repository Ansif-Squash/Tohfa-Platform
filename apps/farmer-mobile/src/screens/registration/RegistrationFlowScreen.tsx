import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Text, ScrollView, ActivityIndicator } from 'react-native';
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
  onNavigate: (screen: 'ApplicationStatus' | 'Login', params?: Record<string, string | number | undefined>) => void;
}

export const RegistrationFlowScreen: React.FC<RegistrationFlowProps> = ({ onNavigate }) => {
  const theme = useTheme();
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
      onNavigate('Login');
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

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.surface }]} contentContainerStyle={styles.content}>
      {/* Visual Stepper Header */}
      <View style={styles.stepperHeader}>
        {[1, 2, 3, 4, 5].map((s) => {
          const isCurrent = s === draft.currentStep;
          const isCompleted = s < draft.currentStep;

          return (
            <View key={s} style={styles.stepBubbleContainer}>
              <View
                style={[
                  styles.stepBubble,
                  {
                    backgroundColor: isCompleted
                      ? theme.colors.primary
                      : isCurrent
                      ? theme.colors.primaryPressed
                      : theme.colors.grey100,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.stepNumber,
                    {
                      color: isCompleted || isCurrent
                        ? theme.colors.surface
                        : theme.colors.grey500,
                    },
                  ]}
                >
                  {s}
                </Text>
              </View>
              {s < 5 ? (
                <View
                  style={[
                    styles.stepConnector,
                    {
                      backgroundColor: isCompleted
                        ? theme.colors.primary
                        : theme.colors.grey100,
                    },
                  ]}
                />
              ) : null}
            </View>
          );
        })}
      </View>

      {/* Render Current Step */}
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
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  stepBubbleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepBubble: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumber: {
    fontSize: 14,
    fontWeight: '700',
  },
  stepConnector: {
    width: 32,
    height: 3,
  },
});
