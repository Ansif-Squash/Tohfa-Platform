import React from 'react';
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

interface NPKContributionScreenProps {
  onBack: () => void;
}

export function NPKContributionScreen({ onBack }: NPKContributionScreenProps): React.JSX.Element {
  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.navCircleButton} onPress={onBack}>
          <Text style={styles.navBackIcon}>‹</Text>
        </TouchableOpacity>
        <View style={styles.headerTitleBox}>
          <Text style={styles.headerTitle}>NPK Contribution</Text>
          <Text style={styles.headerSubtitle}>Carrot — Nantes · Zone 1</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Top Info Card */}
        <View style={styles.infoCard}>
          <View style={styles.cropIconBox}>
            <Text style={styles.cropIconEmoji}>🥕</Text>
          </View>
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>Carrot — Nantes</Text>
            <Text style={styles.infoSubtitle}>Zone 1 — Upper Field · 0.4 ha · 88 days old</Text>
          </View>
        </View>

        {/* Warning Banner */}
        <View style={styles.warningBanner}>
          <View style={styles.warningHeader}>
            <Text style={styles.warningIcon}>⚠️</Text>
            <Text style={styles.warningTitle}>2 of 5 nutrients running low</Text>
          </View>
          <Text style={styles.warningText}>
            Nitrogen and Phosphorus are below 50% of requirement. Schedule a fertigation before the next growth stage.
          </Text>
        </View>

        {/* REQUIREMENT MET */}
        <Text style={styles.sectionHeading}>REQUIREMENT MET</Text>
        <View style={styles.requirementsCard}>
          {/* Nitrogen */}
          <View style={styles.nutrientRow}>
            <View style={styles.nutrientHeader}>
              <Text style={styles.nutrientName}>Nitrogen (N)</Text>
              <Text style={[styles.nutrientPercent, { color: '#DC2626' }]}>40%</Text>
            </View>
            <View style={styles.progressBarBg}>
              <View style={[styles.progressBarFill, { width: '40%', backgroundColor: '#DC2626' }]} />
            </View>
            <Text style={styles.nutrientDesc}>16 of 40 kg/ha</Text>
          </View>

          {/* Phosphorus */}
          <View style={styles.nutrientRow}>
            <View style={styles.nutrientHeader}>
              <Text style={styles.nutrientName}>Phosphorus (P₂O₅)</Text>
              <Text style={[styles.nutrientPercent, { color: '#DC2626' }]}>40%</Text>
            </View>
            <View style={styles.progressBarBg}>
              <View style={[styles.progressBarFill, { width: '40%', backgroundColor: '#DC2626' }]} />
            </View>
            <Text style={styles.nutrientDesc}>12 of 30 kg/ha</Text>
          </View>

          {/* Potassium */}
          <View style={styles.nutrientRow}>
            <View style={styles.nutrientHeader}>
              <Text style={styles.nutrientName}>Potassium (K₂O)</Text>
              <Text style={[styles.nutrientPercent, { color: '#16A34A' }]}>90%</Text>
            </View>
            <View style={styles.progressBarBg}>
              <View style={[styles.progressBarFill, { width: '90%', backgroundColor: '#16A34A' }]} />
            </View>
            <Text style={styles.nutrientDesc}>45 of 50 kg/ha</Text>
          </View>

          {/* Magnesium */}
          <View style={styles.nutrientRow}>
            <View style={styles.nutrientHeader}>
              <Text style={styles.nutrientName}>Magnesium (MgO)</Text>
              <Text style={[styles.nutrientPercent, { color: '#F59E0B' }]}>67%</Text>
            </View>
            <View style={styles.progressBarBg}>
              <View style={[styles.progressBarFill, { width: '67%', backgroundColor: '#F59E0B' }]} />
            </View>
            <Text style={styles.nutrientDesc}>8 of 12 kg/ha</Text>
          </View>

          {/* Sulphur */}
          <View style={styles.nutrientRow}>
            <View style={styles.nutrientHeader}>
              <Text style={styles.nutrientName}>Sulphur (SO₃)</Text>
              <Text style={[styles.nutrientPercent, { color: '#16A34A' }]}>87%</Text>
            </View>
            <View style={styles.progressBarBg}>
              <View style={[styles.progressBarFill, { width: '87%', backgroundColor: '#16A34A' }]} />
            </View>
            <Text style={styles.nutrientDesc}>13 of 15 kg/ha</Text>
          </View>
        </View>

        {/* CUMULATIVE INTAKE */}
        <Text style={styles.sectionHeading}>CUMULATIVE INTAKE · 0.4 HA</Text>
        <View style={styles.intakeCard}>
          <View style={styles.intakeRow}>
            <Text style={styles.intakeLabel}>Nitrogen (N)</Text>
            <Text style={styles.intakeValue}>6.4 kg</Text>
          </View>
          <View style={styles.divider} />
          
          <View style={styles.intakeRow}>
            <Text style={styles.intakeLabel}>Phosphorus (P₂O₅)</Text>
            <Text style={styles.intakeValue}>4.8 kg</Text>
          </View>
          <View style={styles.divider} />

          <View style={styles.intakeRow}>
            <Text style={styles.intakeLabel}>Potassium (K₂O)</Text>
            <Text style={styles.intakeValue}>18.0 kg</Text>
          </View>
          <View style={styles.divider} />

          <View style={styles.intakeRow}>
            <Text style={styles.intakeLabel}>Magnesium (MgO)</Text>
            <Text style={styles.intakeValue}>3.2 kg</Text>
          </View>
          <View style={styles.divider} />

          <View style={styles.intakeRow}>
            <Text style={styles.intakeLabel}>Sulphur (SO₃)</Text>
            <Text style={styles.intakeValue}>5.2 kg</Text>
          </View>
        </View>

        {/* CONTRIBUTING APPLICATIONS */}
        <Text style={styles.sectionHeading}>CONTRIBUTING APPLICATIONS</Text>
        <View style={styles.applicationsContainer}>
          
          {/* Vermicompost */}
          <View style={styles.appCard}>
            <View style={styles.appHeaderRow}>
              <View style={[styles.appIconBox, { backgroundColor: '#ECFDF5' }]}>
                <Text style={styles.appIcon}>🌱</Text>
              </View>
              <View style={styles.appInfo}>
                <Text style={styles.appTitle}>Vermicompost</Text>
                <Text style={styles.appSubtitle}>12 Jul · 60 kg</Text>
              </View>
            </View>
            <View style={styles.appPillsRow}>
              <View style={styles.nutrientPill}><Text style={styles.nutrientPillText}>N</Text></View>
              <View style={styles.nutrientPill}><Text style={styles.nutrientPillText}>P₂O₅</Text></View>
              <View style={styles.nutrientPill}><Text style={styles.nutrientPillText}>K₂O</Text></View>
            </View>
          </View>

          {/* Panchagavya */}
          <View style={styles.appCard}>
            <View style={styles.appHeaderRow}>
              <View style={[styles.appIconBox, { backgroundColor: '#EFF6FF' }]}>
                <Text style={styles.appIcon}>🧪</Text>
              </View>
              <View style={styles.appInfo}>
                <Text style={styles.appTitle}>Panchagavya foliar spray</Text>
                <Text style={styles.appSubtitle}>28 Jun · 8 L</Text>
              </View>
            </View>
            <View style={styles.appPillsRow}>
              <View style={styles.nutrientPill}><Text style={styles.nutrientPillText}>K₂O</Text></View>
              <View style={styles.nutrientPill}><Text style={styles.nutrientPillText}>MgO</Text></View>
              <View style={styles.nutrientPill}><Text style={styles.nutrientPillText}>SO₃</Text></View>
            </View>
          </View>

          {/* Bone meal */}
          <View style={styles.appCard}>
            <View style={styles.appHeaderRow}>
              <View style={[styles.appIconBox, { backgroundColor: '#ECFDF5' }]}>
                <Text style={styles.appIcon}>🌾</Text>
              </View>
              <View style={styles.appInfo}>
                <Text style={styles.appTitle}>Bone meal top-dress</Text>
                <Text style={styles.appSubtitle}>10 Jun · 25 kg</Text>
              </View>
            </View>
            <View style={styles.appPillsRow}>
              <View style={styles.nutrientPill}><Text style={styles.nutrientPillText}>P₂O₅</Text></View>
              <View style={styles.nutrientPill}><Text style={styles.nutrientPillText}>SO₃</Text></View>
            </View>
          </View>

        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F8FAFC' },
  
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  navCircleButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  navBackIcon: { color: '#2E7D32', fontSize: 24, lineHeight: 28, marginRight: 2 },
  headerTitleBox: { flex: 1, marginLeft: 16 },
  headerTitle: { color: '#0F172A', fontSize: 16, fontWeight: 'bold' },
  headerSubtitle: { color: '#94A3B8', fontSize: 13, marginTop: 2 },

  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },

  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  cropIconBox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#FFE0B2',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  cropIconEmoji: { fontSize: 24 },
  infoContent: { flex: 1 },
  infoTitle: { fontSize: 16, fontWeight: 'bold', color: '#1E293B', marginBottom: 4 },
  infoSubtitle: { fontSize: 12, color: '#64748B' },

  warningBanner: {
    backgroundColor: '#FFEDD5',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FB923C',
    padding: 16,
    marginBottom: 24,
  },
  warningHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  warningIcon: { fontSize: 16, marginRight: 8 },
  warningTitle: { fontSize: 14, fontWeight: 'bold', color: '#9A3412' },
  warningText: { fontSize: 13, color: '#9A3412', lineHeight: 18 },

  sectionHeading: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#94A3B8',
    marginBottom: 12,
    marginTop: 8,
    textTransform: 'uppercase',
  },

  requirementsCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  nutrientRow: { marginBottom: 20 },
  nutrientHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  nutrientName: { fontSize: 14, fontWeight: '700', color: '#1E293B' },
  nutrientPercent: { fontSize: 14, fontWeight: '700' },
  progressBarBg: { height: 8, backgroundColor: '#F1F5F9', borderRadius: 4, marginBottom: 8 },
  progressBarFill: { height: '100%', borderRadius: 4 },
  nutrientDesc: { fontSize: 12, color: '#94A3B8' },

  intakeCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 12,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  intakeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 14,
  },
  intakeLabel: { fontSize: 14, color: '#64748B' },
  intakeValue: { fontSize: 14, color: '#1E293B', fontWeight: '700' },
  divider: { height: 1, backgroundColor: '#F1F5F9' },

  applicationsContainer: { gap: 12 },
  appCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  appHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  appIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  appIcon: { fontSize: 18 },
  appInfo: { flex: 1 },
  appTitle: { fontSize: 15, fontWeight: 'bold', color: '#1E293B', marginBottom: 2 },
  appSubtitle: { fontSize: 12, color: '#64748B' },
  
  appPillsRow: { flexDirection: 'row', gap: 8 },
  nutrientPill: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  nutrientPillText: { fontSize: 11, fontWeight: '700', color: '#6B7280' },
});
