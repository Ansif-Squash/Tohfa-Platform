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

interface ProduceCalendarScreenProps {
  onBack: () => void;
  onNavigateToNewCrop?: () => void;
  onNavigateToCropDetails?: () => void;
}

export function ProduceCalendarScreen({ onBack, onNavigateToNewCrop, onNavigateToCropDetails }: ProduceCalendarScreenProps): React.JSX.Element {
  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.navCircleButton} onPress={onBack}>
          <Text style={styles.navBackIcon}>‹</Text>
        </TouchableOpacity>
        <View style={styles.headerTitleBox}>
          <Text style={styles.headerTitle}>Produce Calendar</Text>
          <Text style={styles.headerSubtitle}>3 crops actively growing</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Filters */}
        <View style={styles.filtersRow}>
          <View style={styles.filterBox}>
            <Text style={styles.filterText}>All zones</Text>
            <Text style={styles.filterIcon}>▼</Text>
          </View>
          <View style={styles.filterBox}>
            <Text style={styles.filterText}>Any status</Text>
            <Text style={styles.filterIcon}>▼</Text>
          </View>
        </View>

        <Text style={styles.sectionHeading}>ACTIVE CROPS</Text>

        <View style={styles.cardsList}>
          {/* Carrot Card */}
          <TouchableOpacity style={styles.cropCard} activeOpacity={0.8} onPress={onNavigateToCropDetails}>
            <View style={[styles.cardLeftBorder, { backgroundColor: '#E65100' }]} />
            <View style={styles.cardContent}>
              <View style={styles.cardTopRow}>
                <View style={[styles.cropImagePlaceholder, { backgroundColor: '#FFE0B2' }]}>
                  <Text style={styles.cropEmoji}>🥕</Text>
                </View>
                <View style={styles.cropInfoBox}>
                  <Text style={styles.cropTitle}>Carrot — Nantes</Text>
                  <Text style={styles.cropSubtitle}>Zone 1 — Upper Field · 0.4 ha</Text>
                </View>
                <Text style={styles.chevron}>›</Text>
              </View>
              <View style={styles.badgesRow}>
                <View style={styles.badgeGrey}>
                  <Text style={styles.badgeIcon}>🕒</Text>
                  <Text style={styles.badgeGreyText}>88 days old</Text>
                </View>
                <View style={styles.badgeGreen}>
                  <Text style={styles.badgeIconGreen}>📅</Text>
                  <Text style={styles.badgeGreenText}>Ready in 3 days</Text>
                </View>
                <View style={styles.badgeOrange}>
                  <Text style={styles.badgeIconOrange}>💧</Text>
                  <Text style={styles.badgeOrangeText}>Fert due</Text>
                </View>
              </View>
            </View>
          </TouchableOpacity>

          {/* Tomato Card */}
          <TouchableOpacity style={styles.cropCard} activeOpacity={0.8} onPress={onNavigateToCropDetails}>
            <View style={[styles.cardLeftBorder, { backgroundColor: '#F57C00' }]} />
            <View style={styles.cardContent}>
              <View style={styles.cardTopRow}>
                <View style={[styles.cropImagePlaceholder, { backgroundColor: '#FFCCBC' }]}>
                  <Text style={styles.cropEmoji}>🍅</Text>
                </View>
                <View style={styles.cropInfoBox}>
                  <Text style={styles.cropTitle}>Tomato — Roma</Text>
                  <Text style={styles.cropSubtitle}>Zone 2 — Lower Slope · 0.6 ha</Text>
                </View>
                <Text style={styles.chevron}>›</Text>
              </View>
              <View style={styles.badgesRow}>
                <View style={styles.badgeGrey}>
                  <Text style={styles.badgeIcon}>🕒</Text>
                  <Text style={styles.badgeGreyText}>45 days old</Text>
                </View>
                <View style={styles.badgeGreyOutline}>
                  <Text style={styles.badgeIconGrey}>📅</Text>
                  <Text style={styles.badgeGreyOutlineText}>Harvest in 30 days</Text>
                </View>
                <View style={styles.badgePurple}>
                  <Text style={styles.badgeIconPurple}>🐛</Text>
                  <Text style={styles.badgePurpleText}>Pest check due</Text>
                </View>
              </View>
            </View>
          </TouchableOpacity>

          {/* Cabbage Card */}
          <TouchableOpacity style={styles.cropCard} activeOpacity={0.8} onPress={onNavigateToCropDetails}>
            <View style={[styles.cardLeftBorder, { backgroundColor: '#2E7D32' }]} />
            <View style={styles.cardContent}>
              <View style={styles.cardTopRow}>
                <View style={[styles.cropImagePlaceholder, { backgroundColor: '#C8E6C9' }]}>
                  <Text style={styles.cropEmoji}>🥬</Text>
                </View>
                <View style={styles.cropInfoBox}>
                  <Text style={styles.cropTitle}>Cabbage — Green Coronet</Text>
                  <Text style={styles.cropSubtitle}>Zone 3 — Terrace · 0.5 ha</Text>
                </View>
                <Text style={styles.chevron}>›</Text>
              </View>
              <View style={styles.badgesRow}>
                <View style={styles.badgeGrey}>
                  <Text style={styles.badgeIcon}>🕒</Text>
                  <Text style={styles.badgeGreyText}>21 days old</Text>
                </View>
                <View style={styles.badgeGreyOutline}>
                  <Text style={styles.badgeIconGrey}>📅</Text>
                  <Text style={styles.badgeGreyOutlineText}>Harvest in 69 days</Text>
                </View>
              </View>
            </View>
          </TouchableOpacity>
        </View>

      </ScrollView>

      {/* FAB */}
      <TouchableOpacity style={styles.fab} activeOpacity={0.9} onPress={onNavigateToNewCrop}>
        <Text style={styles.fabIcon}>+</Text>
        <Text style={styles.fabText}>New crop</Text>
      </TouchableOpacity>
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
  headerTitle: { color: '#0F172A', fontSize: 18, fontWeight: 'bold' },
  headerSubtitle: { color: '#64748B', fontSize: 13, marginTop: 2 },

  scrollContent: {
    padding: 20,
    paddingBottom: 100, // Space for FAB
  },

  filtersRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  filterBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  filterText: { fontSize: 14, color: '#334155' },
  filterIcon: { fontSize: 10, color: '#64748B' },

  sectionHeading: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#94A3B8',
    marginBottom: 12,
    textTransform: 'uppercase',
  },

  cardsList: { gap: 16 },
  cropCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    flexDirection: 'row',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  cardLeftBorder: { width: 6 },
  cardContent: { flex: 1, padding: 16 },
  
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  cropImagePlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  cropEmoji: { fontSize: 24 },
  cropInfoBox: { flex: 1 },
  cropTitle: { fontSize: 15, fontWeight: 'bold', color: '#1E293B', marginBottom: 4 },
  cropSubtitle: { fontSize: 12, color: '#64748B' },
  chevron: { fontSize: 20, color: '#CBD5E1', marginLeft: 8 },

  badgesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  
  badgeGrey: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F1F5F9', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  badgeIcon: { fontSize: 10, marginRight: 4 },
  badgeGreyText: { fontSize: 11, color: '#475569', fontWeight: '500' },

  badgeGreyOutline: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  badgeIconGrey: { fontSize: 10, marginRight: 4, color: '#64748B' },
  badgeGreyOutlineText: { fontSize: 11, color: '#64748B', fontWeight: '500' },

  badgeGreen: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#ECFDF5', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  badgeIconGreen: { fontSize: 10, marginRight: 4, color: '#059669' },
  badgeGreenText: { fontSize: 11, color: '#059669', fontWeight: 'bold' },

  badgeOrange: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF7ED', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  badgeIconOrange: { fontSize: 10, marginRight: 4, color: '#D97706' },
  badgeOrangeText: { fontSize: 11, color: '#D97706', fontWeight: 'bold' },

  badgePurple: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F3E8FF', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  badgeIconPurple: { fontSize: 10, marginRight: 4, color: '#7E22CE' },
  badgePurpleText: { fontSize: 11, color: '#7E22CE', fontWeight: 'bold' },

  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    backgroundColor: '#2E7D32',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 5,
  },
  fabIcon: { color: '#FFF', fontSize: 20, marginRight: 8, lineHeight: 22, fontWeight: '500' },
  fabText: { color: '#FFF', fontSize: 15, fontWeight: 'bold' },
});
