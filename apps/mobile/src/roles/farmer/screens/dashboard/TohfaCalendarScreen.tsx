import React, { useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Image,
} from 'react-native';
import Svg, { Path, Circle, Rect, Line, G, Polyline } from 'react-native-svg';
import { Icon } from '@tohfa/mobile-ui';
import { authPalette as P, colors } from '../../theme';

// ── SVG Icons ────────────────────────────────────────────────────────────────

const ChevronLeft = () => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Path d="M15 18L9 12L15 6" stroke="#2e7d32" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const CommunityIcon = () => (
  <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
    <Circle cx="9" cy="7" r="3" stroke="#2e7d32" strokeWidth="2" />
    <Circle cx="17" cy="7" r="2.5" stroke="#2e7d32" strokeWidth="1.8" />
    <Path d="M3 20C3 16.6863 5.68629 14 9 14C12.3137 14 15 16.6863 15 20" stroke="#2e7d32" strokeWidth="2" strokeLinecap="round" />
    <Path d="M15 14.5C16.3807 14.5 17.7 15.3 18.5 16.5" stroke="#2e7d32" strokeWidth="1.8" strokeLinecap="round" />
  </Svg>
);

const ChevronDown = ({ size = 14, color = '#4B5563' }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M6 9L12 15L18 9" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const HeartIcon = () => (
  <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
    <Path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" stroke="#C2410C" strokeWidth="2" fill="#FFEDD5" />
  </Svg>
);

const SeedlingIcon = () => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Path d="M12 22V12" stroke="#2e7d32" strokeWidth="2" strokeLinecap="round" />
    <Path d="M7 12C7 9.23858 9.23858 7 12 7C14.7614 7 17 9.23858 17 12" stroke="#2e7d32" strokeWidth="2" strokeLinecap="round" />
    <Path d="M4 8C4 5 7 2 12 2C17 2 20 5 20 8" stroke="#2e7d32" strokeWidth="2" strokeLinecap="round" />
  </Svg>
);

// ── Crop image URLs (same ones used across the app) ─────────────────────────

const CROP_IMAGES: Record<string, string> = {
  Potato: 'https://images.unsplash.com/photo-1518977676601-b53f82ber630?w=100&q=80',
  Carrot: 'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?w=100&q=80',
  Cabbage: 'https://images.unsplash.com/photo-1594282486552-05b4d80fbb9f?w=100&q=80',
  Tomato: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=100&q=80',
  'French Beans': 'https://images.unsplash.com/photo-1567375698348-5d9d5ae10c3a?w=100&q=80',
  Beetroot: 'https://images.unsplash.com/photo-1593105544559-ecb03bf76f82?w=100&q=80',
  Cauliflower: 'https://images.unsplash.com/photo-1568702846914-96b305d2aaeb?w=100&q=80',
};

// ── Data ─────────────────────────────────────────────────────────────────────

const CROP_DATA = [
  { name: 'Potato',        farmers: 46, quantity: 12800 },
  { name: 'Carrot',        farmers: 38, quantity: 9400  },
  { name: 'Cabbage',       farmers: 32, quantity: 7800  },
  { name: 'Tomato',        farmers: 29, quantity: 6200  },
  { name: 'French Beans',  farmers: 21, quantity: 3900  },
  { name: 'Beetroot',      farmers: 14, quantity: 1800  },
  { name: 'Cauliflower',   farmers: 9,  quantity: 600   },
];

const WISHLIST_DATA = [
  { rank: 1, name: 'Carrot',       customers: 62, quantity: '8,400 kg' },
  { rank: 2, name: 'Tomato',       customers: 54, quantity: '7,200 kg' },
  { rank: 3, name: 'Cabbage',      customers: 28, quantity: '4,100 kg' },
  { rank: 4, name: 'Beetroot',     customers: 41, quantity: '3,600 kg' },
  { rank: 5, name: 'French Beans', customers: 33, quantity: '2,900 kg' },
];

// Rank number colors (earthy warm tones)
const RANK_COLORS = ['#2E7D32', '#388E3C', '#43A047', '#558B2F', '#6D8B2F'];

interface TohfaCalendarScreenProps {
  onNavigateBack: () => void;
  onNavigateToCropInsight?: () => void;
}

export function TohfaCalendarScreen({ onNavigateBack, onNavigateToCropInsight }: TohfaCalendarScreenProps): React.JSX.Element {
  const [activeTab, setActiveTab] = useState<'Farmers' | 'Quantity'>('Farmers');
  const maxFarmers = Math.max(...CROP_DATA.map(c => c.farmers));
  const maxQuantity = Math.max(...CROP_DATA.map(c => c.quantity));

  return (
    <SafeAreaView style={styles.screen}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onNavigateBack} activeOpacity={0.7}>
          <ChevronLeft />
        </TouchableOpacity>
        <View style={styles.headerTextWrap}>
          <Text style={styles.headerTitle}>TOHFA Calendar</Text>
          <Text style={styles.headerSubtitle}>What the community is growing</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Community View Info Banner */}
        <View style={styles.infoBanner}>
          <View style={styles.infoBannerIcon}>
            <CommunityIcon />
          </View>
          <Text style={styles.infoBannerText}>
            <Text style={styles.infoBannerBold}>Community view.</Text> This spans all TOHFA farmers — not just your farm — to help you plan what to plant next.
          </Text>
        </View>

        {/* Filter Chips Row */}
        <View style={styles.filterRow}>
          <TouchableOpacity style={styles.filterChip} activeOpacity={0.7}>
            <Text style={styles.filterChipText}>All crops</Text>
            <ChevronDown size={12} color="#4B5563" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.filterChip} activeOpacity={0.7}>
            <Text style={styles.filterChipText}>Month</Text>
            <ChevronDown size={12} color="#4B5563" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.filterChip} activeOpacity={0.7}>
            <Text style={styles.filterChipText}>Region</Text>
            <ChevronDown size={12} color="#4B5563" />
          </TouchableOpacity>
        </View>

        {/* Stat Cards */}
        <View style={styles.statRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>128</Text>
            <Text style={styles.statLabel}>Farmers</Text>
          </View>
          <View style={[styles.statCard, styles.statCardHighlight]}>
            <Text style={styles.statValueHighlight}>
              42,600<Text style={styles.statUnit}>kg</Text>
            </Text>
            <Text style={styles.statLabelHighlight}>Total planted</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>7</Text>
            <Text style={styles.statLabel}>Crops</Text>
          </View>
        </View>

        {/* BY CROP Section */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionLabel}>BY CROP</Text>
          <View style={styles.tabPills}>
            <TouchableOpacity
              style={[styles.tabPill, activeTab === 'Farmers' && styles.tabPillActive]}
              onPress={() => setActiveTab('Farmers')}
              activeOpacity={0.7}
            >
              <Text style={[styles.tabPillText, activeTab === 'Farmers' && styles.tabPillTextActive]}>Farmers</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tabPill, activeTab === 'Quantity' && styles.tabPillActive]}
              onPress={() => setActiveTab('Quantity')}
              activeOpacity={0.7}
            >
              <Text style={[styles.tabPillText, activeTab === 'Quantity' && styles.tabPillTextActive]}>Quantity</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Crop Bars Card */}
        <View style={styles.cropBarsCard}>
          {CROP_DATA.map((crop, idx) => {
            const value = activeTab === 'Farmers' ? crop.farmers : crop.quantity;
            const max = activeTab === 'Farmers' ? maxFarmers : maxQuantity;
            const barPercent = (value / max) * 100;
            // Gradient-like greens for each bar
            const barColor = idx === 0 ? '#2E7D32' : idx === 1 ? '#388E3C' : idx === 2 ? '#43A047' : idx === 3 ? '#4CAF50' : idx === 4 ? '#66BB6A' : idx === 5 ? '#81C784' : '#A5D6A7';

            return (
              <View key={crop.name} style={[styles.cropBarRow, idx < CROP_DATA.length - 1 && styles.cropBarBorder]}>
                <View style={styles.cropBarTop}>
                  <Text style={styles.cropBarName}>{crop.name}</Text>
                  <Text style={styles.cropBarValue}>
                    {activeTab === 'Farmers' ? value : value.toLocaleString()}
                  </Text>
                </View>
                <View style={styles.cropBarTrack}>
                  <View style={[styles.cropBarFill, { width: `${barPercent}%`, backgroundColor: barColor }]} />
                </View>
              </View>
            );
          })}
        </View>

        {/* Customer Wishlist Demand */}
        <View style={styles.wishlistHeader}>
          <HeartIcon />
          <Text style={styles.wishlistTitle}>CUSTOMER WISHLIST DEMAND</Text>
        </View>

        <View style={styles.wishlistCard}>
          {WISHLIST_DATA.map((item, idx) => (
            <View key={item.rank} style={[styles.wishlistRow, idx < WISHLIST_DATA.length - 1 && styles.wishlistRowBorder]}>
              <Text style={[styles.wishlistRank, { color: RANK_COLORS[idx] || '#2E7D32' }]}>{item.rank}</Text>
              <View style={styles.wishlistCropWrap}>
                <Image
                  source={{ uri: CROP_IMAGES[item.name] }}
                  style={styles.wishlistCropImage}
                  resizeMode="cover"
                />
                <Text style={styles.wishlistCropName}>{item.name}</Text>
              </View>
              <Text style={styles.wishlistCustomers}>{item.customers} customers</Text>
              <Text style={styles.wishlistQty}>{item.quantity}</Text>
            </View>
          ))}
          <Text style={styles.wishlistFootnote}>
            Wishlist is a global demand snapshot — not sliced by the filters above.
          </Text>
        </View>

        {/* Bottom spacer for sticky button */}
        <View style={{ height: 80 }} />
      </ScrollView>

      {/* Sticky Bottom Button */}
      <View style={styles.stickyBottom}>
        <TouchableOpacity style={styles.ctaButton} activeOpacity={0.8} onPress={onNavigateToCropInsight}>
          <SeedlingIcon />
          <Text style={styles.ctaButtonText}>See crop planning insight</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#FAFAF7',
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0EEE6',
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F0FFF0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerTextWrap: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A2E1A',
    letterSpacing: 0.3,
  },
  headerSubtitle: {
    fontSize: 13,
    fontWeight: '400',
    color: '#6B7566',
    marginTop: 1,
  },

  // Scroll
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
  },

  // Info Banner
  infoBanner: {
    flexDirection: 'row',
    backgroundColor: '#EAF3DE',
    borderRadius: 12,
    padding: 14,
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  infoBannerIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#D4EED8',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  infoBannerText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 19,
    color: '#3A5A3A',
  },
  infoBannerBold: {
    fontWeight: '700',
    color: '#1A2E1A',
  },

  // Filters
  filterRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#E8E6DD',
    gap: 6,
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#374151',
  },

  // Stat Cards
  statRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F0EEE6',
  },
  statCardHighlight: {
    backgroundColor: '#F0FFF0',
    borderColor: '#C8E6C9',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1A2E1A',
  },
  statValueHighlight: {
    fontSize: 22,
    fontWeight: '700',
    color: '#2E7D32',
  },
  statUnit: {
    fontSize: 13,
    fontWeight: '500',
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: '#6B7566',
    marginTop: 2,
  },
  statLabelHighlight: {
    fontSize: 11,
    fontWeight: '500',
    color: '#388E3C',
    marginTop: 2,
  },

  // Section Header
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7566',
    letterSpacing: 1,
  },
  tabPills: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderRadius: 20,
    padding: 2,
  },
  tabPill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 18,
  },
  tabPillActive: {
    backgroundColor: '#2E7D32',
  },
  tabPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  tabPillTextActive: {
    color: '#FFFFFF',
  },

  // Crop Bars Card
  cropBarsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F0EEE6',
    marginBottom: 24,
  },
  cropBarRow: {
    paddingVertical: 12,
  },
  cropBarBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F2',
  },
  cropBarTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  cropBarImage: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 8,
    backgroundColor: '#F0F0F0',
  },
  cropBarName: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#1A2E1A',
  },
  cropBarValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginLeft: 8,
  },
  cropBarTrack: {
    height: 6,
    backgroundColor: '#F0EEE6',
    borderRadius: 3,
    overflow: 'hidden',
  },
  cropBarFill: {
    height: 6,
    borderRadius: 3,
  },

  // Wishlist Section
  wishlistHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  wishlistTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7566',
    letterSpacing: 1,
  },

  // Wishlist Card
  wishlistCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F0EEE6',
  },
  wishlistRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  wishlistRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F2',
  },
  wishlistRank: {
    width: 22,
    fontSize: 15,
    fontWeight: '700',
  },
  wishlistCropWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  wishlistCropImage: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#F0F0F0',
  },
  wishlistCropName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A2E1A',
  },
  wishlistCustomers: {
    fontSize: 12,
    fontWeight: '400',
    color: '#9CA3AF',
    marginRight: 8,
  },
  wishlistQty: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1A2E1A',
    minWidth: 62,
    textAlign: 'right',
  },
  wishlistFootnote: {
    fontSize: 11,
    fontWeight: '400',
    color: '#B8B6AA',
    marginTop: 12,
    fontStyle: 'italic',
  },

  // Sticky Bottom
  stickyBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FAFAF7',
  },
  ctaButton: {
    backgroundColor: '#2E7D32',
    borderRadius: 14,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    shadowColor: '#2E7D32',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
  },
  ctaButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
});
