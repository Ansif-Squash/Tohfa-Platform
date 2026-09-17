import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, Platform, Image } from 'react-native';
import Svg, { Path, Circle, Rect, Line, G } from 'react-native-svg';

// Simple SVG Icons to match design exactly
const ChevronLeft = () => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Path d="M15 18L9 12L15 6" stroke="#2e7d32" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const Beaker = () => (
  <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
    <Path d="M19 21H5C4.4 21 4 20.6 4 20C4 19.8 4.1 19.6 4.2 19.4L9 12V5H8C7.4 5 7 4.6 7 4C7 3.4 7.4 3 8 3H16C16.6 3 17 3.4 17 4C17 4.6 16.6 5 16 5H15V12L19.8 19.4C20.1 19.8 20 20.4 19.6 20.8C19.4 20.9 19.2 21 19 21ZM10 13L6.1 19H17.9L14 13V5H10V13Z" fill="#9e9e9e" />
  </Svg>
);

const BellAlert = () => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
    <Path d="M12 22C13.1 22 14 21.1 14 20H10C10 21.1 10.9 22 12 22ZM18 16V11C18 7.93 16.36 5.36 13.5 4.68V4C13.5 3.17 12.83 2.5 12 2.5C11.17 2.5 10.5 3.17 10.5 4V4.68C7.63 5.36 6 7.92 6 11V16L4 18V19H20V18L18 16ZM16 17H8V11C8 8.52 9.51 6.5 12 6.5C14.49 6.5 16 8.52 16 11V17Z" fill="#d84315"/>
  </Svg>
);

const ChevronRight = () => (
  <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
    <Path d="M9 18L15 12L9 6" stroke="#d84315" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const StoreIcon = () => (
  <Svg width={120} height={120} viewBox="0 0 24 24" fill="none">
    <Path d="M2 6L4 11V20C4 20.5523 4.44772 21 5 21H19C19.5523 21 20 20.5523 20 20V11L22 6V5C22 4.44772 21.5523 4 21 4H3C2.44772 4 2 4.44772 2 5V6Z" fill="#ffffff" opacity={0.2} />
    <Path d="M22 6L20 11V12C20 12.5523 19.5523 13 19 13C18.4477 13 18 12.5523 18 12V11C18 11.5523 17.5523 12 17 12C16.4477 12 16 11.5523 16 11V12C16 12.5523 15.5523 13 15 13C14.4477 13 14 12.5523 14 12V11L14 6H22Z" fill="#ffffff" opacity={0.3} />
  </Svg>
);

const CropTomato = () => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
    <Path d="M12 22C16.4183 22 20 18.4183 20 14C20 9.58172 16.4183 6 12 6C7.58172 6 4 9.58172 4 14C4 18.4183 7.58172 22 12 22Z" stroke="#388e3c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <Path d="M12 2V6M12 6L9 9M12 6L15 9" stroke="#388e3c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);

const CropCarrot = () => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
    <Path d="M17.414 4.586A2 2 0 0 0 16 4H8a2 2 0 0 0-1.414.586l-2 2a2 2 0 0 0 0 2.828l6 6a2 2 0 0 0 2.828 0l6-6a2 2 0 0 0 0-2.828l-2-2z" stroke="#f57c00" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <Path d="M12 2V4M9 2V4M15 2V4" stroke="#f57c00" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);

const CropBeans = () => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
    <Path d="M12 22S4 18 4 12V6L12 2L20 6V12C20 18 12 22 12 22Z" stroke="#388e3c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <Path d="M12 12V22" stroke="#388e3c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);

const Plus = () => (
  <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
    <Path d="M12 5V19M5 12H19" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

interface ListingsScreenProps {
  onNavigateToCreateListing?: () => void;
  onNavigateToCounterOffer?: (listing: any) => void;
  onNavigateBack?: () => void;
}

export function ListingsScreen({
  onNavigateToCreateListing,
  onNavigateToCounterOffer,
  onNavigateBack
}: ListingsScreenProps): React.JSX.Element {
  return (
    <SafeAreaView style={styles.container}>
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
            <Text style={styles.headerTitle}>Marketing</Text>
            <Text style={styles.headerSub}>List your harvest & get paid</Text>
          </View>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Prototype Banner */}
        <View style={styles.prototypeBanner}>
          <View style={styles.protoRow}>
            <Beaker />
            <Text style={styles.protoText}>Prototype only · market-day state</Text>
          </View>
          <View style={styles.protoToggle}>
            <View style={styles.protoToggleActive}>
              <Text style={styles.protoToggleActiveText}>Open</Text>
            </View>
            <View style={styles.protoToggleInactive}>
              <Text style={styles.protoToggleInactiveText}>Closed</Text>
            </View>
          </View>
        </View>

        {/* Alert Banner */}
        <TouchableOpacity style={styles.alertBanner} onPress={() => onNavigateToCounterOffer?.({})}>
          <View style={styles.alertIconBox}>
            <BellAlert />
          </View>
          <View style={styles.alertTextCol}>
            <Text style={styles.alertTitle}>1 listing needs your response</Text>
            <Text style={styles.alertSub}>Carrot · counter-offer expires in 22h 30m</Text>
          </View>
          <View style={styles.alertChevron}>
            <ChevronRight />
          </View>
        </TouchableOpacity>

        {/* Market Day Hero */}
        <View style={styles.heroCard}>
          <View style={{position:'absolute', right: -20, bottom: -10}}>
             <StoreIcon />
          </View>
          <View style={styles.heroChip}>
            <View style={styles.heroChipDot} />
            <Text style={styles.heroChipText}>MARKET DAY IS OPEN</Text>
          </View>
          <Text style={styles.heroTitle}>Today is a market day</Text>
          <Text style={styles.heroSub}>Listings are being accepted now. Add a harvest-ready crop to start selling.</Text>
        </View>

        {/* Metrics */}
        <View style={styles.metricsContainer}>
          <View style={styles.metricCard}>
            <Text style={styles.metricValueBlack}>3</Text>
            <Text style={styles.metricLabel}>Active{'\n'}listings</Text>
          </View>
          <View style={[styles.metricCard, { flex: 1.2 }]}>
            <Text style={styles.metricValueGreen}>₹13,440</Text>
            <Text style={styles.metricLabel}>Earned this{'\n'}month</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricValueRed}>1</Text>
            <Text style={styles.metricLabel}>Need{'\n'}reply</Text>
          </View>
        </View>

        {/* Recent Listings */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>RECENT LISTINGS</Text>
          <TouchableOpacity>
            <Text style={styles.viewAllBtn}>View all</Text>
          </TouchableOpacity>
        </View>

        {/* List items */}
        <View style={styles.listItem}>
          <View style={[styles.listIconBox, { backgroundColor: '#e8f5e9' }]}>
            <Image source={require('../../../../assets/images/real_tomato.jpg')} style={styles.realCropImg} />
          </View>
          <View style={styles.listTextCol}>
            <Text style={styles.listTitle}>Tomato · Hybrid</Text>
            <Text style={styles.listSub}>200 kg · ₹38/kg</Text>
          </View>
          <View style={[styles.badge, { backgroundColor: '#e8f5e9' }]}>
            <Text style={[styles.badgeText, { color: '#2e7d32' }]}>Approved</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.listItem} onPress={() => onNavigateToCounterOffer?.({})}>
          <View style={[styles.listIconBox, { backgroundColor: '#fff3e0' }]}>
            <Image source={require('../../../../assets/images/real_carrot.jpg')} style={styles.realCropImg} />
          </View>
          <View style={styles.listTextCol}>
            <Text style={styles.listTitle}>Carrot · Ooty</Text>
            <Text style={styles.listSub}>150 kg · ₹40/kg</Text>
          </View>
          <View style={[styles.badge, { backgroundColor: '#f3e5f5' }]}>
            <Text style={[styles.badgeText, { color: '#8e24aa' }]}>Counter-offer</Text>
          </View>
        </TouchableOpacity>

        <View style={styles.listItem}>
          <View style={[styles.listIconBox, { backgroundColor: '#e8f5e9' }]}>
            <Image source={require('../../../../assets/images/real_french_beans.jpg')} style={styles.realCropImg} />
          </View>
          <View style={styles.listTextCol}>
            <Text style={styles.listTitle}>French Beans</Text>
            <Text style={styles.listSub}>80 kg · ₹55/kg</Text>
          </View>
          <View style={[styles.badge, { backgroundColor: '#fff3e0' }]}>
            <Text style={[styles.badgeText, { color: '#e65100' }]}>Waiting</Text>
          </View>
        </View>
        
        <View style={{height: 100}} />
      </ScrollView>

      {/* Floating Action Button */}
      <View style={styles.fabContainer}>
        <TouchableOpacity style={styles.fab} onPress={onNavigateToCreateListing}>
          <Plus />
          <Text style={styles.fabText}>Create listing</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fafafa',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  headerTextCol: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#004d40',
  },
  headerSub: {
    fontSize: 14,
    color: '#78909c',
    marginTop: 2,
  },
  scrollContent: {
    padding: 20,
  },
  prototypeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f9f9f5',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 8,
    paddingHorizontal: 12,
    marginBottom: 16,
  },
  protoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  protoText: {
    fontSize: 12,
    color: '#757575',
    fontWeight: '600',
  },
  protoToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 2,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  protoToggleActive: {
    backgroundColor: '#2e7d32',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 14,
  },
  protoToggleActiveText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '700',
  },
  protoToggleInactive: {
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  protoToggleInactiveText: {
    color: '#9e9e9e',
    fontSize: 10,
    fontWeight: '700',
  },
  alertBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffebee',
    borderRadius: 16,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#d84315',
    marginBottom: 20,
  },
  alertIconBox: {
    marginRight: 12,
  },
  alertTextCol: {
    flex: 1,
  },
  alertTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#5d4037',
    marginBottom: 4,
  },
  alertSub: {
    fontSize: 13,
    color: '#d84315',
  },
  alertChevron: {
    marginLeft: 8,
  },
  heroCard: {
    backgroundColor: '#2e7d32',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    overflow: 'hidden',
  },
  heroChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    marginBottom: 16,
  },
  heroChipDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#ffffff',
    marginRight: 6,
  },
  heroChipText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  heroTitle: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 8,
  },
  heroSub: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 14,
    lineHeight: 20,
    paddingRight: 40,
  },
  metricsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 28,
  },
  metricCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  metricValueBlack: {
    fontSize: 22,
    fontWeight: '800',
    color: '#212121',
    marginBottom: 4,
  },
  metricValueGreen: {
    fontSize: 22,
    fontWeight: '800',
    color: '#2e7d32',
    marginBottom: 4,
  },
  metricValueRed: {
    fontSize: 22,
    fontWeight: '800',
    color: '#d84315',
    marginBottom: 4,
  },
  metricLabel: {
    fontSize: 12,
    color: '#9e9e9e',
    fontWeight: '500',
    lineHeight: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#9e9e9e',
    letterSpacing: 0.5,
  },
  viewAllBtn: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2e7d32',
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  listIconBox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    overflow: 'hidden',
  },
  realCropImg: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  listTextCol: {
    flex: 1,
  },
  listTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#212121',
    marginBottom: 4,
  },
  listSub: {
    fontSize: 13,
    color: '#9e9e9e',
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  fabContainer: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#2e7d32',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  fab: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2e7d32',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 28,
  },
  fabText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
    marginLeft: 8,
  },
});
