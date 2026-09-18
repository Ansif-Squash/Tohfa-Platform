import React, { useState } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  StatusBar,
} from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import { authPalette as P, colors } from '../../theme';

// SVG Icons using Theme Colors
const ChevronLeft = () => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Path d="M15 18L9 12L15 6" stroke={colors.brandGreen} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const SearchIcon = () => (
  <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
    <Circle cx="11" cy="11" r="8" stroke={P.twGray400} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M21 21L16.65 16.65" stroke={P.twGray400} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const ChevronRight = () => (
  <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
    <Path d="M9 18L15 12L9 6" stroke={P.twGray400} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const ClockAlertIcon = () => (
  <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="10" stroke={P.orange800} strokeWidth="2" />
    <Path d="M12 6V12L16 14" stroke={P.orange800} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const PlusIcon = () => (
  <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
    <Path d="M12 5V19M5 12H19" stroke={colors.white} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

export interface ListingItem {
  id: string;
  listingNumber: string;
  cropName: string;
  cropVariety: string;
  quantityKg: string;
  askingPricePerKg: string;
  grade: string;
  status: 'Approved' | 'Counter-offer' | 'Waiting' | 'Rejected';
  statusBadgeBg: string;
  statusBadgeText: string;
  date: string;
  image: any;
  hasAlert?: boolean;
  alertText?: string;
  note?: string;
}

const RECENT_LISTINGS_DATA: ListingItem[] = [
  {
    id: '1',
    listingNumber: 'L-9820',
    cropName: 'Tomato',
    cropVariety: 'Hybrid',
    quantityKg: '200',
    askingPricePerKg: '38',
    grade: 'Grade 1',
    status: 'Approved',
    statusBadgeBg: colors.brandGreenLight,
    statusBadgeText: colors.brandGreen,
    date: '16 Jul 2026',
    image: require('../../../../assets/images/real_tomato.jpg'),
    note: 'Paid · Scheduled for transport',
  },
  {
    id: '2',
    listingNumber: 'L-9821',
    cropName: 'Carrot',
    cropVariety: 'Ooty',
    quantityKg: '150',
    askingPricePerKg: '40',
    grade: 'Grade 1',
    status: 'Counter-offer',
    statusBadgeBg: P.twPurple100,
    statusBadgeText: P.twPurple700,
    date: '14 Jul 2026',
    image: require('../../../../assets/images/real_carrot.jpg'),
    hasAlert: true,
    alertText: 'Your reply needed · 22h 30m left',
  },
  {
    id: '3',
    listingNumber: 'L-9822',
    cropName: 'French Beans',
    cropVariety: 'Standard',
    quantityKg: '80',
    askingPricePerKg: '55',
    grade: 'Grade 2',
    status: 'Waiting',
    statusBadgeBg: P.orange50,
    statusBadgeText: P.orange900,
    date: '16 Jul 2026',
    image: require('../../../../assets/images/real_french_beans.jpg'),
    note: 'Under buyer quality review',
  },
  {
    id: '4',
    listingNumber: 'L-9823',
    cropName: 'Beetroot',
    cropVariety: 'Crimson Globe',
    quantityKg: '90',
    askingPricePerKg: '32',
    grade: 'Grade 1',
    status: 'Approved',
    statusBadgeBg: colors.brandGreenLight,
    statusBadgeText: colors.brandGreen,
    date: '15 Jul 2026',
    image: require('../../../../assets/images/real_beetroot.jpg'),
    note: 'Accepted at ₹32/kg · ₹2,880 net',
  },
  {
    id: '5',
    listingNumber: 'L-9824',
    cropName: 'Cabbage',
    cropVariety: 'Drumhead',
    quantityKg: '120',
    askingPricePerKg: '18',
    grade: 'Grade 2',
    status: 'Rejected',
    statusBadgeBg: P.red50,
    statusBadgeText: P.red700,
    date: '02 Jul 2026',
    image: require('../../../../assets/images/real_cabbage.jpg'),
    note: 'Grade 2 quality variance',
  },
  {
    id: '6',
    listingNumber: 'L-9825',
    cropName: 'French Beans',
    cropVariety: 'Ooty Gold',
    quantityKg: '110',
    askingPricePerKg: '58',
    grade: 'Grade 1',
    status: 'Waiting',
    statusBadgeBg: P.orange50,
    statusBadgeText: P.orange900,
    date: '13 Jul 2026',
    image: require('../../../../assets/images/real_french_beans.jpg'),
    note: 'Waiting for market opening batch',
  },
];

const STATUS_FILTERS = ['All', 'Approved', 'Counter-offer', 'Waiting', 'Rejected'] as const;

export interface RecentListingsScreenProps {
  onNavigateBack: () => void;
  onNavigateToListingDetail?: (item: ListingItem) => void;
  onNavigateToCounterOffer?: (item: ListingItem) => void;
  onNavigateToCreateListing?: () => void;
}

export function RecentListingsScreen({
  onNavigateBack,
  onNavigateToListingDetail,
  onNavigateToCounterOffer,
  onNavigateToCreateListing,
}: RecentListingsScreenProps): React.JSX.Element {
  const [selectedFilter, setSelectedFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filteredListings = RECENT_LISTINGS_DATA.filter((item) => {
    const matchesFilter = selectedFilter === 'All' || item.status === selectedFilter;
    const matchesSearch =
      searchQuery.trim() === '' ||
      item.cropName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.cropVariety.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.listingNumber.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.white} />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={onNavigateBack}
            accessibilityRole="button"
            accessibilityLabel="Back"
          >
            <ChevronLeft />
          </TouchableOpacity>
          <View style={styles.headerTextCol}>
            <Text style={styles.headerTitle}>Recent Listings</Text>
            <Text style={styles.headerSub}>
              {RECENT_LISTINGS_DATA.length} listings · all recent harvests
            </Text>
          </View>
        </View>

        {/* Search Bar */}
        <View style={styles.searchBar}>
          <SearchIcon />
          <TextInput
            style={styles.searchInput}
            placeholder="Search crop, variety or listing ID..."
            placeholderTextColor={P.twGray400}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Status Filter Chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterChipsRow}
        >
          {STATUS_FILTERS.map((status) => {
            const isSelected = selectedFilter === status;
            const count =
              status === 'All'
                ? RECENT_LISTINGS_DATA.length
                : RECENT_LISTINGS_DATA.filter((l) => l.status === status).length;

            return (
              <TouchableOpacity
                key={status}
                style={[
                  styles.filterChip,
                  isSelected ? styles.filterChipActive : styles.filterChipInactive,
                ]}
                onPress={() => setSelectedFilter(status)}
                activeOpacity={0.75}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    isSelected ? styles.filterChipTextActive : styles.filterChipTextInactive,
                  ]}
                >
                  {status} ({count})
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Listings List */}
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {filteredListings.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No listings found</Text>
            <Text style={styles.emptySub}>Try searching for a different crop name or change status filter.</Text>
          </View>
        ) : (
          filteredListings.map((item) => {
            const isCounterOffer = item.status === 'Counter-offer';

            return (
              <TouchableOpacity
                key={item.id}
                style={styles.card}
                activeOpacity={0.85}
                onPress={() => {
                  if (isCounterOffer && onNavigateToCounterOffer) {
                    onNavigateToCounterOffer(item);
                  } else {
                    onNavigateToListingDetail?.(item);
                  }
                }}
              >
                <View style={styles.cardMainRow}>
                  <View style={[styles.cropImgBox, { backgroundColor: item.statusBadgeBg }]}>
                    <Image source={item.image} style={styles.cropImg} />
                  </View>

                  <View style={styles.cardTextCol}>
                    <View style={styles.cardTitleRow}>
                      <Text style={styles.cropTitle}>
                        {item.cropName} · {item.cropVariety}
                      </Text>
                      <View style={[styles.badge, { backgroundColor: item.statusBadgeBg }]}>
                        <Text style={[styles.badgeText, { color: item.statusBadgeText }]}>
                          {item.status}
                        </Text>
                      </View>
                    </View>

                    <Text style={styles.cropSub}>
                      {item.grade} · {item.quantityKg} kg · ₹{item.askingPricePerKg}/kg
                    </Text>

                    <Text style={styles.listingMeta}>
                      {item.listingNumber} · Listed on {item.date}
                    </Text>
                  </View>

                  <View style={styles.chevronCol}>
                    <ChevronRight />
                  </View>
                </View>

                {/* Counter Offer Alert Strip */}
                {item.hasAlert && (
                  <View style={styles.alertStrip}>
                    <ClockAlertIcon />
                    <Text style={styles.alertStripText}>{item.alertText}</Text>
                  </View>
                )}

                {/* Additional status note */}
                {item.note && !item.hasAlert && (
                  <View style={styles.noteStrip}>
                    <Text style={styles.noteStripText}>• {item.note}</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })
        )}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Floating Action Button */}
      <View style={styles.fabContainer}>
        <TouchableOpacity
          style={styles.fab}
          onPress={onNavigateToCreateListing}
          activeOpacity={0.85}
        >
          <PlusIcon />
          <Text style={styles.fabText}>Create listing</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: P.lightSurfaceAlt,
  },
  header: {
    backgroundColor: colors.white,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: P.twGray100,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: P.twGray200,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
    backgroundColor: colors.white,
  },
  headerTextCol: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.brandGreen,
  },
  headerSub: {
    fontSize: 12,
    color: P.twGray500,
    marginTop: 2,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: P.twGray100,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 12,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: P.twGray900,
    padding: 0,
  },
  filterChipsRow: {
    flexDirection: 'row',
    gap: 8,
    paddingBottom: 2,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
  },
  filterChipActive: {
    backgroundColor: colors.brandGreen,
  },
  filterChipInactive: {
    backgroundColor: P.twGray100,
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '600',
  },
  filterChipTextActive: {
    color: colors.white,
    fontWeight: '700',
  },
  filterChipTextInactive: {
    color: P.twGray600,
  },
  scrollContent: {
    padding: 16,
    gap: 12,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: P.twGray100,
    shadowColor: P.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  cardMainRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cropImgBox: {
    width: 54,
    height: 54,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    overflow: 'hidden',
  },
  cropImg: {
    width: 44,
    height: 44,
    resizeMode: 'contain',
  },
  cardTextCol: {
    flex: 1,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  cropTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: P.twGray900,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  cropSub: {
    fontSize: 13,
    fontWeight: '600',
    color: P.twGray600,
  },
  listingMeta: {
    fontSize: 11,
    color: P.twGray400,
    marginTop: 3,
  },
  chevronCol: {
    marginLeft: 8,
  },
  alertStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: P.twOrange50,
    borderWidth: 1,
    borderColor: P.orange100,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginTop: 10,
    gap: 6,
  },
  alertStripText: {
    fontSize: 12,
    fontWeight: '700',
    color: P.orange800,
  },
  noteStrip: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: P.twGray100,
  },
  noteStripText: {
    fontSize: 12,
    color: P.twGray500,
    fontWeight: '500',
  },
  emptyState: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 40,
    borderWidth: 1,
    borderColor: P.twGray100,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: P.twGray900,
    marginBottom: 6,
  },
  emptySub: {
    fontSize: 13,
    color: P.twGray500,
    textAlign: 'center',
    lineHeight: 18,
  },
  fabContainer: {
    position: 'absolute',
    bottom: 24,
    right: 20,
  },
  fab: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.brandGreen,
    paddingVertical: 14,
    paddingHorizontal: 22,
    borderRadius: 28,
    shadowColor: colors.brandGreen,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
    gap: 8,
  },
  fabText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.white,
  },
});
