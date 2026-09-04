import React, { useEffect, useState, useCallback } from 'react';
import { View, StyleSheet, Text, ScrollView, ActivityIndicator } from 'react-native';
import { useTheme } from '../../theme';
import { t } from '../../i18n';
import { Card } from '../../components/Card';
import { Badge } from '../../components/Badge';
import { Button } from '../../components/Button';
import { Icon } from '../../components/Icon';
import { ErrorState } from '../../components/ErrorState';
import { fetchApplicationStatus, logout, type ApplicationStatusResponse } from '../../api/auth';

interface ApplicationStatusScreenProps {
  applicationId: string;
  onNavigate: (screen: 'Login' | 'MainTabs') => void;
}

const STEPS = [
  { key: 'SUBMITTED', labelKey: 'status.step.SUBMITTED', icon: 'send' },
  { key: 'DOCS_REVIEW', labelKey: 'status.step.DOCS_REVIEW', icon: 'description' },
  { key: 'FARM_VERIFICATION', labelKey: 'status.step.FARM_VERIFICATION', icon: 'location_on' },
  { key: 'AUDIT', labelKey: 'status.step.AUDIT', icon: 'fact_check' },
  { key: 'APPROVED', labelKey: 'status.step.APPROVED', icon: 'verified' },
] as const;

export const ApplicationStatusScreen: React.FC<ApplicationStatusScreenProps> = ({
  applicationId,
  onNavigate,
}) => {
  const theme = useTheme();
  const [data, setData] = useState<ApplicationStatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const loadStatus = useCallback(async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetchApplicationStatus(applicationId);
      setData(res);
      if (res.status === 'APPROVED') {
        onNavigate('MainTabs');
      }
    } catch {
      setErrorMsg(t('error.generic'));
    } finally {
      setLoading(false);
    }
  }, [applicationId, onNavigate]);

  useEffect(() => {
    loadStatus();
  }, [loadStatus]);

  async function handleSignOut() {
    await logout();
    onNavigate('Login');
  }

  function getStepIndex(status: string): number {
    switch (status) {
      case 'SUBMITTED': return 0;
      case 'DOCS_REVIEW': return 1;
      case 'FARM_VERIFICATION': return 2;
      case 'AUDIT': return 3;
      case 'APPROVED': return 4;
      case 'REJECTED': return -1;
      default: return 0;
    }
  }

  const activeStep = data ? getStepIndex(data.status) : 0;
  const isRejected = data?.status === 'REJECTED';

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.surface }]} contentContainerStyle={styles.content}>
      <Card style={styles.card}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.colors.onSurface }]}>
            {t('status.title')}
          </Text>
          <Badge
            label={t(`status.step.${data?.status || 'SUBMITTED'}` as unknown as Parameters<typeof t>[0])}
            variant={isRejected ? 'danger' : data?.status === 'APPROVED' ? 'success' : 'info'}
          />
        </View>

        <Text style={[styles.subtitle, { color: theme.colors.grey700 }]}>
          {t('status.subtitle', { id: applicationId })}
        </Text>

        {loading ? (
          <ActivityIndicator size="large" color={theme.colors.primary} style={styles.loader} />
        ) : errorMsg ? (
          <ErrorState message={errorMsg} onRetry={loadStatus} />
        ) : (
          <>
            <Text style={[styles.infoText, { color: theme.colors.grey700 }]}>
              {t('status.underReview')}
            </Text>

            {/* Stepper Timeline */}
            <View style={styles.timeline}>
              {STEPS.map((step, idx) => {
                const isPassed = !isRejected && idx <= activeStep;
                const isCurrent = !isRejected && idx === activeStep;

                return (
                  <View key={step.key} style={styles.timelineItem}>
                    <View style={styles.timelineIconCol}>
                      <View
                        style={[
                          styles.iconBubble,
                          {
                            backgroundColor: isPassed
                              ? theme.colors.primary
                              : theme.colors.grey100,
                          },
                        ]}
                      >
                        <Icon
                          name={step.icon}
                          size={20}
                          color={isPassed ? theme.colors.surface : theme.colors.grey500}
                        />
                      </View>
                      {idx < STEPS.length - 1 ? (
                        <View
                          style={[
                            styles.line,
                            {
                              backgroundColor: idx < activeStep
                                ? theme.colors.primary
                                : theme.colors.grey100,
                            },
                          ]}
                        />
                      ) : null}
                    </View>

                    <View style={styles.timelineTextCol}>
                      <Text
                        style={[
                          styles.stepLabel,
                          {
                            color: isPassed
                              ? theme.colors.onSurface
                              : theme.colors.grey500,
                            fontWeight: isCurrent ? '700' : '500',
                          },
                        ]}
                      >
                        {t(step.labelKey as unknown as Parameters<typeof t>[0])}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>

            {data?.notes ? (
              <View style={[styles.notesCard, { backgroundColor: theme.colors.grey100 }]}>
                <Text style={[styles.notesTitle, { color: theme.colors.onSurface }]}>Notes:</Text>
                <Text style={[styles.notesBody, { color: theme.colors.grey700 }]}>{data.notes}</Text>
              </View>
            ) : null}

            <View style={styles.buttonRow}>
              <Button
                title={t('common.refresh')}
                onPress={loadStatus}
                variant="outline"
                style={styles.flexBtn}
              />
              <Button
                title={t('common.signOut')}
                onPress={handleSignOut}
                variant="danger"
                style={styles.flexBtn}
              />
            </View>
          </>
        )}
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  card: {
    padding: 24,
    gap: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 14,
  },
  infoText: {
    fontSize: 14,
    marginVertical: 4,
  },
  loader: {
    marginVertical: 24,
  },
  timeline: {
    marginVertical: 12,
    gap: 8,
  },
  timelineItem: {
    flexDirection: 'row',
    minHeight: 52,
  },
  timelineIconCol: {
    alignItems: 'center',
    width: 36,
  },
  iconBubble: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  line: {
    width: 2,
    flex: 1,
    marginVertical: 4,
  },
  timelineTextCol: {
    paddingLeft: 12,
    justifyContent: 'center',
  },
  stepLabel: {
    fontSize: 15,
  },
  notesCard: {
    padding: 12,
    borderRadius: 8,
    gap: 4,
  },
  notesTitle: {
    fontWeight: '600',
    fontSize: 13,
  },
  notesBody: {
    fontSize: 13,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  flexBtn: {
    flex: 1,
  },
});
