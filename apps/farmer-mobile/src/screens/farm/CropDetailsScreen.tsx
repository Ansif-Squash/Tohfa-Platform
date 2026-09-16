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

interface CropDetailsScreenProps {
  onBack: () => void;
  onNavigateToNPKContribution?: () => void;
}

export function CropDetailsScreen({
  onBack,
  onNavigateToNPKContribution,
}: CropDetailsScreenProps): React.JSX.Element {
  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar barStyle="light-content" backgroundColor="#C2410C" />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Hero Section (Mock Image Background using solid color for now) */}
        <View style={styles.heroBackground}>
          {/* Header Controls */}
          <View style={styles.heroHeader}>
            <TouchableOpacity style={styles.circleBtn} onPress={onBack}>
              <Text style={styles.backIcon}>←</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.editBtn}>
              <Text style={styles.editIcon}>✏️</Text>
              <Text style={styles.editText}>Edit</Text>
            </TouchableOpacity>
          </View>

          {/* Title Area */}
          <View style={styles.titleRow}>
            <View style={styles.cropIconBox}>
              <Text style={styles.cropIconEmoji}>🥕</Text>
            </View>
            <View style={styles.titleInfo}>
              <Text style={styles.heroTitle}>Carrot — Nantes</Text>
              <Text style={styles.heroSubtitle}>Zone 1 — Upper Field · Nantes seed</Text>
            </View>
          </View>

          {/* 3 Stats Blocks */}
          <View style={styles.heroStatsRow}>
            <View style={styles.heroStatBlock}>
              <Text style={styles.heroStatValue}>88</Text>
              <Text style={styles.heroStatLabel}>Days old</Text>
            </View>
            <View style={styles.heroStatBlock}>
              <Text style={styles.heroStatValue}>3</Text>
              <Text style={styles.heroStatLabel}>Days to harvest</Text>
            </View>
            <View style={styles.heroStatBlock}>
              <Text style={styles.heroStatValue}>A</Text>
              <Text style={styles.heroStatLabel}>Expected grade</Text>
            </View>
          </View>
        </View>

        <View style={styles.bodyContent}>
          {/* Crop Details Section */}
          <Text style={styles.sectionHeading}>CROP DETAILS</Text>
          <View style={styles.detailsCard}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Zone · Area</Text>
              <Text style={styles.detailValue}>Zone 1 · 0.4 ha</Text>
            </View>
            <View style={styles.divider} />
            
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Variety · Company</Text>
              <Text style={styles.detailValue}>Nantes · Namdhari</Text>
            </View>
            <View style={styles.divider} />

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Seed used · Cost</Text>
              <Text style={styles.detailValue}>300 g · ₹ 420</Text>
            </View>
            <View style={styles.divider} />

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Planted on</Text>
              <Text style={styles.detailValue}>20 Apr 2026</Text>
            </View>
            <View style={styles.divider} />

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Expected harvest</Text>
              <Text style={styles.detailValue}>20 Jul 2026</Text>
            </View>
            <View style={styles.divider} />

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Expected quantity</Text>
              <Text style={styles.detailValue}>1,100 kg · Grade A</Text>
            </View>
          </View>

          {/* Linked Records Section */}
          <Text style={styles.sectionHeading}>LINKED RECORDS</Text>
          <View style={styles.linkedRecordsContainer}>
            
            <TouchableOpacity style={styles.linkedCard} activeOpacity={0.8}>
              <View style={[styles.linkedIconBox, { backgroundColor: '#ECFDF5' }]}>
                <Text style={styles.linkedIcon}>📅</Text>
              </View>
              <View style={styles.linkedInfo}>
                <Text style={styles.linkedTitle}>Diary entries</Text>
                <Text style={styles.linkedSubtitle}>14 logged · last 2 days ago</Text>
              </View>
              <Text style={styles.chevron}>›</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.linkedCard} activeOpacity={0.8}>
              <View style={[styles.linkedIconBox, { backgroundColor: '#FFF7ED' }]}>
                <Text style={styles.linkedIcon}>🧪</Text>
              </View>
              <View style={styles.linkedInfo}>
                <Text style={styles.linkedTitle}>Inputs applied</Text>
                <Text style={styles.linkedSubtitle}>6 fertigation · 2 pest treatments</Text>
              </View>
              <Text style={styles.chevron}>›</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.linkedCard} activeOpacity={0.8}>
              <View style={[styles.linkedIconBox, { backgroundColor: '#F0F9FF' }]}>
                <Text style={styles.linkedIcon}>👥</Text>
              </View>
              <View style={styles.linkedInfo}>
                <Text style={styles.linkedTitle}>Workforce hours</Text>
                <Text style={styles.linkedSubtitle}>38 h logged · ₹ 6,400 labour</Text>
              </View>
              <Text style={styles.chevron}>›</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.linkedCard, styles.linkedCardWarning]}
              activeOpacity={0.8}
              onPress={onNavigateToNPKContribution}
            >
              <View style={[styles.linkedIconBox, { backgroundColor: '#FFF7ED' }]}>
                <Text style={styles.linkedIcon}>📈</Text>
              </View>
              <View style={styles.linkedInfo}>
                <Text style={styles.linkedTitle}>NPK contribution</Text>
                <Text style={[styles.linkedSubtitle, { color: '#C2410C', fontWeight: '600' }]}>2 of 5 nutrients running low</Text>
              </View>
              <Text style={[styles.chevron, { color: '#C2410C' }]}>›</Text>
            </TouchableOpacity>

          </View>

          {/* Recent Diary Entries */}
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionHeading}>RECENT DIARY ENTRIES</Text>
            <TouchableOpacity>
              <Text style={styles.viewAllText}>View all</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.diaryList}>
            <View style={styles.diaryCard}>
              <View style={[styles.linkedIconBox, { backgroundColor: '#ECFDF5' }]}>
                <Text style={styles.linkedIcon}>🌱</Text>
              </View>
              <View style={styles.linkedInfo}>
                <Text style={styles.linkedTitle}>Weeding</Text>
                <Text style={styles.linkedSubtitle}>15 Jul · 06:45 AM</Text>
              </View>
              <Text style={styles.diaryTime}>50m</Text>
            </View>

            <View style={styles.diaryCard}>
              <View style={[styles.linkedIconBox, { backgroundColor: '#ECFDF5' }]}>
                <Text style={styles.linkedIcon}>💩</Text>
              </View>
              <View style={styles.linkedInfo}>
                <Text style={styles.linkedTitle}>Manure application</Text>
                <Text style={styles.linkedSubtitle}>15 Jul · 11:00 AM</Text>
              </View>
              <Text style={styles.diaryTime}>1h 15m</Text>
            </View>
          </View>
          
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F8FAFC' },
  scrollContent: { paddingBottom: 40 },
  
  heroBackground: {
    backgroundColor: '#9A3412', // Fallback for image
    paddingTop: 40,
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  heroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 32,
  },
  circleBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  backIcon: { color: '#FFF', fontSize: 22 },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  editIcon: { fontSize: 12, marginRight: 6 },
  editText: { color: '#FFF', fontSize: 14, fontWeight: 'bold' },

  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  cropIconBox: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: '#FFE0B2',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  cropIconEmoji: { fontSize: 32 },
  titleInfo: { flex: 1 },
  heroTitle: { fontSize: 24, fontWeight: 'bold', color: '#FFF', marginBottom: 4 },
  heroSubtitle: { fontSize: 13, color: '#FFEDD5' },

  heroStatsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  heroStatBlock: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  heroStatValue: { fontSize: 20, fontWeight: 'bold', color: '#FFF', marginBottom: 2 },
  heroStatLabel: { fontSize: 11, color: '#FFEDD5', fontWeight: '500' },

  bodyContent: {
    padding: 20,
  },
  
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 12,
    marginTop: 12,
  },
  sectionHeading: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#94A3B8',
    marginBottom: 12,
    marginTop: 12,
    textTransform: 'uppercase',
  },
  viewAllText: {
    fontSize: 13,
    color: '#2E7D32',
    fontWeight: 'bold',
    marginBottom: 12,
  },

  detailsCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 14,
  },
  detailLabel: { fontSize: 14, color: '#64748B' },
  detailValue: { fontSize: 14, color: '#1E293B', fontWeight: '600' },
  divider: { height: 1, backgroundColor: '#F1F5F9' },

  linkedRecordsContainer: {
    gap: 12,
  },
  linkedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  linkedCardWarning: {
    borderWidth: 1,
    borderColor: '#FED7AA',
  },
  linkedIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  linkedIcon: { fontSize: 18 },
  linkedInfo: { flex: 1 },
  linkedTitle: { fontSize: 15, fontWeight: 'bold', color: '#1E293B', marginBottom: 2 },
  linkedSubtitle: { fontSize: 13, color: '#64748B' },
  chevron: { fontSize: 20, color: '#CBD5E1', marginLeft: 8 },

  diaryList: { gap: 12 },
  diaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  diaryTime: { fontSize: 14, fontWeight: 'bold', color: '#2E7D32' },
});
