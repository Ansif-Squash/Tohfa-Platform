import React, { useEffect, useState, useCallback } from 'react';
import { View, StyleSheet, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useTheme } from '../../theme';
import { fetchApplicationStatus, logout, type ApplicationStatusResponse } from '../../api/auth';
import { ErrorState, Skeleton } from '@tohfa/mobile-ui';

interface ApplicationStatusScreenProps {
  applicationId: string;
  onNavigate: (screen: 'Welcome' | 'MainTabs') => void;
}

const STEPS = [
  { key: 'SUBMITTED', title: 'Submitted', sub: 'Just now' },
  { key: 'DOCS_REVIEW', title: 'Documents Under Review', sub: 'In progress · 1-2 days' },
  { key: 'FARM_VERIFICATION', title: 'Farm Verification Visit', sub: 'Pending · 2-3 days' },
  { key: 'AUDIT', title: 'Audit Completed', sub: 'Pending' },
  { key: 'APPROVED', title: 'Approved', sub: 'Pending' },
] as const;

export const ApplicationStatusScreen: React.FC<ApplicationStatusScreenProps> = ({
  applicationId,
  onNavigate,
}) => {
  const theme = useTheme();
  const { colors } = theme;
  const [data, setData] = useState<ApplicationStatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown | null>(null);

  const loadStatus = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchApplicationStatus(applicationId);
      setData(res);
      // For this prototype, we'll just show the UI statically without auto-navigating away
    } catch (err: unknown) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [applicationId]);

  useEffect(() => {
    loadStatus();
  }, [loadStatus]);

  function handleBackToHome() {
    onNavigate('MainTabs');
  }
  async function handleSignOut() {
    await logout();
    onNavigate('Welcome');
  }

  // Hardcode active step to DOCS_REVIEW (index 1) to match the exact design screenshot
  const activeStep = 1;

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.bgLight, padding: 24, justifyContent: 'center' }]}>
        <Skeleton width="100%" height={200} borderRadius={16} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, { backgroundColor: colors.bgLight, padding: 24, justifyContent: 'center' }]}>
        <ErrorState error={error} onRetry={loadStatus} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.bgLight }]}>
      
      <ScrollView style={styles.scrollArea} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Top Check Icon */}
        <View style={styles.topIconContainer}>
          <View style={[styles.iconOuterCircle, { backgroundColor: colors.brandGreenLight }]}>
            <View style={[styles.iconInnerCircle, { backgroundColor: colors.brandGreen }]}>
              <Text style={styles.checkMark}>✓</Text>
            </View>
          </View>
        </View>

        <Text style={[styles.title, { color: colors.textDark }]}>
          Application{'\n'}Submitted!
        </Text>
        
        <Text style={[styles.subtitle, { color: colors.textSubtle }]}>
          Your farmer application has been received and{'\n'}is now under review.
        </Text>

        {/* App ID Card */}
        <View style={[styles.idCard, { borderColor: colors.borderMedium, backgroundColor: colors.white }]}>
          <Text style={[styles.idLabel, { color: colors.textSubtle }]}>APPLICATION ID</Text>
          <Text style={[styles.idValue, { color: colors.brandGreen }]}>{applicationId.toUpperCase()}</Text>
          <Text style={[styles.idExpected, { color: colors.textSubtle }]}>
            Expected review: <Text style={{ color: colors.textDark, fontWeight: '700' }}>3 to 5 working days</Text>
          </Text>
        </View>

        {/* Timeline */}
        <View style={styles.timeline}>
          {STEPS.map((step, idx) => {
            const isPassed = idx < activeStep;
            const isCurrent = idx === activeStep;
            
            return (
              <View key={step.key} style={styles.timelineItem}>
                <View style={styles.timelineIconCol}>
                  {isPassed ? (
                    <View style={[styles.stepPassedCircle, { backgroundColor: colors.brandGreen }]}>
                      <Text style={styles.stepPassedCheck}>✓</Text>
                    </View>
                  ) : isCurrent ? (
                    <View style={[styles.stepCurrentOuter, { backgroundColor: 'rgba(245, 166, 35, 0.2)' }]}>
                      <View style={[styles.stepCurrentInner, { backgroundColor: '#F5A623' }]} />
                    </View>
                  ) : (
                    <View style={[styles.stepPendingCircle, { backgroundColor: '#D8D8D8' }]} />
                  )}

                  {idx < STEPS.length - 1 && (
                    <View style={[styles.timelineLine, { backgroundColor: isPassed ? colors.brandGreen : '#E0E0E0' }]} />
                  )}
                </View>

                <View style={styles.timelineTextCol}>
                  <Text style={[
                    styles.stepTitle, 
                    { color: isPassed || isCurrent ? colors.textDark : '#B0B0B0', fontWeight: isPassed || isCurrent ? '700' : '600' }
                  ]}>
                    {step.title}
                  </Text>
                  <Text style={[
                    styles.stepSub, 
                    { color: isPassed || isCurrent ? colors.textSubtle : '#C0C0C0' }
                  ]}>
                    {step.sub}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>

        {/* Info Box */}
        <View style={styles.infoBox}>
          <Text style={styles.infoBoxText}>
            <Text style={{ fontWeight: '700' }}>What's next?</Text> A TOHFA representative will call you within 24 hours to confirm your details.
          </Text>
        </View>
        
      </ScrollView>

      {/* FOOTER */}
      <View style={[styles.footer, { borderTopColor: colors.borderDivider, backgroundColor: colors.white }]}>
        <TouchableOpacity activeOpacity={0.85} style={[styles.footerBtn, { backgroundColor: colors.brandGreen }]} onPress={handleBackToHome}>
          <Text style={[styles.footerBtnText, { color: colors.white }]}>Back to Home</Text>
        </TouchableOpacity>
      </View>

    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollArea: { flex: 1 },
  scrollContent: { paddingHorizontal: 24, paddingTop: 40, paddingBottom: 40, alignItems: 'center' },
  topIconContainer: { marginBottom: 20 },
  iconOuterCircle: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center' },
  iconInnerCircle: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  checkMark: { color: '#fff', fontSize: 32, fontWeight: '700' },
  title: { fontSize: 26, fontWeight: '800', textAlign: 'center', marginBottom: 12, lineHeight: 32 },
  subtitle: { fontSize: 14, textAlign: 'center', lineHeight: 22, marginBottom: 24 },
  idCard: { width: '100%', borderWidth: 1, borderRadius: 12, paddingVertical: 20, alignItems: 'center', marginBottom: 32 },
  idLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 0.5, marginBottom: 4 },
  idValue: { fontSize: 22, fontWeight: '800', marginBottom: 8 },
  idExpected: { fontSize: 13 },
  timeline: { width: '100%', paddingLeft: 10, marginBottom: 24 },
  timelineItem: { flexDirection: 'row', minHeight: 64 },
  timelineIconCol: { width: 36, alignItems: 'center' },
  stepPassedCircle: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginTop: 4 },
  stepPassedCheck: { color: '#fff', fontSize: 12, fontWeight: '900' },
  stepCurrentOuter: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginTop: 0 },
  stepCurrentInner: { width: 20, height: 20, borderRadius: 10 },
  stepPendingCircle: { width: 20, height: 20, borderRadius: 10, marginTop: 6 },
  timelineLine: { width: 2, flex: 1, marginVertical: 4 },
  timelineTextCol: { flex: 1, paddingLeft: 16, paddingTop: 6 },
  stepTitle: { fontSize: 15, marginBottom: 2 },
  stepSub: { fontSize: 13 },
  infoBox: { backgroundColor: '#F0F4F8', borderWidth: 1, borderColor: '#D0D9E0', borderRadius: 8, padding: 16, width: '100%', marginBottom: 16 },
  infoBoxText: { fontSize: 13, color: '#2A4A6A', lineHeight: 20 },
  footer: { paddingHorizontal: 24, paddingTop: 16, paddingBottom: 24, borderTopWidth: 1 },
  footerBtn: { width: '100%', height: 52, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  footerBtnText: { fontSize: 16, fontWeight: '700' }
});
