import React from 'react';
import { SafeAreaView, StyleSheet, Text, View, ScrollView, TouchableOpacity } from 'react-native';
import { Icon } from '@tohfa/mobile-ui';

interface MyListingsScreenProps {
  onNavigateBack: () => void;
  onNavigateToListingDetail?: () => void;
}

export function MyListingsScreen({ onNavigateBack, onNavigateToListingDetail }: MyListingsScreenProps): React.JSX.Element {
  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onNavigateBack}>
          <Icon name="arrow_back" size={20} color="#1F2937" />
        </TouchableOpacity>
        <View style={styles.headerTextContainer}>
          <Text style={styles.headerTitle}>My Listings</Text>
          <Text style={styles.headerSubtitle}>5 listings · all time</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <TouchableOpacity style={styles.filterDropdown}>
          <Text style={[styles.filterText, { marginLeft: 0 }]}>All statuses</Text>
          <Icon name="expand_more" size={18} color="#4B5563" style={styles.filterCaret} />
        </TouchableOpacity>

        {/* Card 1: Carrot */}
        <TouchableOpacity style={[styles.card, styles.cardCarrot]} onPress={onNavigateToListingDetail} activeOpacity={0.8}>
          <View style={styles.cardHeader}>
            <Text style={styles.cropTitle}>Carrot · Ooty</Text>
            <View style={[styles.statusBadge, { backgroundColor: '#F3E8FF' }]}>
              <Text style={[styles.statusText, { color: '#7E22CE' }]}>Counter-offer</Text>
            </View>
          </View>
          <Text style={styles.cropSub}>Grade 1 · 150 kg · ₹40/kg · 14 Jul</Text>
          <View style={[styles.alertStrip, { backgroundColor: '#FFEDD5' }]}>
            <Icon name="schedule" size={14} color="#C2410C" />
            <Text style={[styles.alertText, { color: '#C2410C' }]}>Your reply needed · 22h 30m left</Text>
          </View>
        </TouchableOpacity>

        {/* Card 2: French Beans */}
        <TouchableOpacity style={[styles.card, styles.cardFrenchBeans]} onPress={onNavigateToListingDetail} activeOpacity={0.8}>
          <View style={styles.cardHeader}>
            <Text style={styles.cropTitle}>French Beans</Text>
            <View style={[styles.statusBadge, { backgroundColor: '#FFEDD5' }]}>
              <Text style={[styles.statusText, { color: '#C2410C' }]}>Waiting</Text>
            </View>
          </View>
          <Text style={styles.cropSub}>Grade 2 · 80 kg · ₹55/kg · 16 Jul</Text>
        </TouchableOpacity>

        {/* Card 3: Tomato */}
        <TouchableOpacity style={[styles.card, styles.cardTomato]} onPress={onNavigateToListingDetail} activeOpacity={0.8}>
          <View style={styles.cardHeader}>
            <Text style={styles.cropTitle}>Tomato · Hybrid</Text>
            <View style={[styles.statusBadge, { backgroundColor: '#DCFCE7' }]}>
              <Text style={[styles.statusText, { color: '#15803D' }]}>Approved</Text>
            </View>
          </View>
          <Text style={styles.cropSub}>Grade 1 · 200 kg · ₹38/kg · 09 Jul</Text>
          <View style={[styles.alertStrip, { backgroundColor: '#ECFCCB' }]}>
            <Icon name="account_balance_wallet" size={14} color="#15803D" />
            <Text style={[styles.alertText, { color: '#15803D' }]}>Paid · ₹7,600 net</Text>
          </View>
        </TouchableOpacity>

        {/* Card 4: Cabbage */}
        <TouchableOpacity style={[styles.card, styles.cardCabbage]} onPress={onNavigateToListingDetail} activeOpacity={0.8}>
          <View style={styles.cardHeader}>
            <Text style={styles.cropTitle}>Cabbage</Text>
            <View style={[styles.statusBadge, { backgroundColor: '#FEE2E2' }]}>
              <Text style={[styles.statusText, { color: '#B91C1C' }]}>Rejected</Text>
            </View>
          </View>
          <Text style={styles.cropSub}>Grade 2 · 120 kg · ₹18/kg · 02 Jul</Text>
        </TouchableOpacity>

        {/* Card 5: Potato */}
        <TouchableOpacity style={[styles.card, styles.cardPotato]} onPress={onNavigateToListingDetail} activeOpacity={0.8}>
          <View style={styles.cardHeader}>
            <Text style={styles.cropTitle}>Potato · Kufri</Text>
            <View style={[styles.statusBadge, { backgroundColor: '#F3F4F6' }]}>
              <Text style={[styles.statusText, { color: '#4B5563' }]}>Withdrawn</Text>
            </View>
          </View>
          <Text style={styles.cropSub}>Grade 1 · 300 kg · ₹22/kg · 28 Jun</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#FAFAFA' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  headerTextContainer: {
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
    gap: 16,
  },
  filterDropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignSelf: 'stretch',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  filterText: {
    fontSize: 15,
    color: '#1F2937',
    fontWeight: '600',
    marginLeft: 8,
    flex: 1,
  },
  filterCaret: {
    marginLeft: 'auto',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardCarrot: {
    borderColor: '#E9D5FF',
    borderLeftWidth: 4,
    borderLeftColor: '#9333EA',
  },
  cardFrenchBeans: {
    borderColor: '#FFEDD5',
    borderLeftWidth: 4,
    borderLeftColor: '#F97316',
  },
  cardTomato: {
    borderColor: '#DCFCE7',
    borderLeftWidth: 4,
    borderLeftColor: '#22C55E',
  },
  cardCabbage: {
    borderColor: '#FEE2E2',
    borderLeftWidth: 4,
    borderLeftColor: '#EF4444',
  },
  cardPotato: {
    borderColor: '#F3F4F6',
    borderLeftWidth: 4,
    borderLeftColor: '#9CA3AF',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  cropTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
  },
  cropSub: {
    fontSize: 13,
    color: '#64748B',
  },
  alertStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  alertText: {
    fontSize: 13,
    fontWeight: '600',
  },
});
