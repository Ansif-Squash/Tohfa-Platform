import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, Platform } from 'react-native';
import Svg, { Path, Circle, Rect, Line, Polyline } from 'react-native-svg';

// Custom Icons
const ChevronLeft = () => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Path d="M15 18L9 12L15 6" stroke="#2e7d32" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const PaidIcon = () => (
  <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="10" fill="#ffffff" opacity={0.2} />
    <Path d="M12 6V18M9 9H13.5C14.8807 9 16 10.1193 16 11.5C16 12.8807 14.8807 14 13.5 14H9V9Z" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M9 14H15" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const TimelineCheck = () => (
  <View style={styles.timelineIconBox}>
    <Svg width={12} height={12} viewBox="0 0 24 24" fill="none">
      <Path d="M5 13L9 17L19 7" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  </View>
);

const TimelinePaid = () => (
  <View style={styles.timelineIconBox}>
    <Svg width={12} height={12} viewBox="0 0 24 24" fill="none">
      <Rect x="2" y="6" width="20" height="12" rx="2" stroke="#ffffff" strokeWidth="2" />
      <Circle cx="12" cy="12" r="2" stroke="#ffffff" strokeWidth="2" />
    </Svg>
  </View>
);

const RemarksIcon = () => (
  <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
    <Path d="M21 15C21 15.5304 20.7893 16.0391 20.4142 16.4142C20.0391 16.7893 19.5304 17 19 17H7L3 21V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H19C19.5304 3 20.0391 3.21071 20.4142 3.58579C20.7893 3.96086 21 4.46957 21 5V15Z" stroke="#757575" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <Line x1="7" y1="8" x2="17" y2="8" stroke="#757575" strokeWidth="2" strokeLinecap="round" />
    <Line x1="7" y1="12" x2="13" y2="12" stroke="#757575" strokeWidth="2" strokeLinecap="round" />
  </Svg>
);

interface ListingDetailScreenProps {
  onBack?: () => void;
}

export function ListingDetailScreen({ onBack }: ListingDetailScreenProps): React.JSX.Element {
  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack}>
          <ChevronLeft />
        </TouchableOpacity>
        <View style={styles.headerTextCol}>
          <Text style={styles.headerTitle}>Listing Detail</Text>
          <Text style={styles.headerSub}>Tomato · Hybrid</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Top Green Box */}
        <View style={styles.greenBox}>
          <View style={styles.greenBoxTopRow}>
            <View style={styles.paidBadge}>
              <PaidIcon />
              <Text style={styles.paidBadgeText}>Paid</Text>
            </View>
            <Text style={styles.listingId}>Listing #TM-2211</Text>
          </View>
          <Text style={styles.totalValueLabel}>TOTAL SALE VALUE</Text>
          <Text style={styles.totalValueAmount}>₹7,600</Text>
        </View>

        {/* Details Table */}
        <View style={styles.detailsCard}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Zone</Text>
            <Text style={styles.detailValue}>Zone C</Text>
          </View>
          <View style={styles.divider} />
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Grade</Text>
            <Text style={styles.detailValue}>Grade 1</Text>
          </View>
          <View style={styles.divider} />
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Quantity</Text>
            <Text style={styles.detailValue}>200 kg</Text>
          </View>
          <View style={styles.divider} />
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Agreed price</Text>
            <Text style={styles.detailValue}>₹38/kg</Text>
          </View>
          <View style={styles.divider} />
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Fair price ceiling</Text>
            <Text style={styles.detailValueGreen}>₹40/kg</Text>
          </View>
        </View>

        {/* Timeline Section */}
        <Text style={styles.sectionTitle}>TIMELINE</Text>
        
        <View style={styles.timelineCard}>
          {/* Timeline connecting line */}
          <View style={styles.timelineLine} />
          
          <View style={styles.timelineItem}>
            <TimelineCheck />
            <View style={styles.timelineTextCol}>
              <Text style={styles.timelineTitle}>Submitted</Text>
              <Text style={styles.timelineSub}>09 Jul 2026</Text>
            </View>
          </View>

          <View style={styles.timelineItem}>
            <TimelineCheck />
            <View style={styles.timelineTextCol}>
              <Text style={styles.timelineTitle}>Reviewed</Text>
              <Text style={styles.timelineSub}>10 Jul 2026 · grade confirmed</Text>
            </View>
          </View>

          <View style={styles.timelineItem}>
            <TimelineCheck />
            <View style={styles.timelineTextCol}>
              <Text style={styles.timelineTitle}>Approved</Text>
              <Text style={styles.timelineSub}>10 Jul 2026</Text>
            </View>
          </View>

          <View style={[styles.timelineItem, { marginBottom: 0 }]}>
            <TimelinePaid />
            <View style={styles.timelineTextCol}>
              <Text style={styles.timelineTitle}>Paid</Text>
              <Text style={styles.timelineSub}>13 Jul 2026 · to bank · · 4821</Text>
            </View>
          </View>
        </View>

        {/* Admin Remarks Card */}
        <View style={styles.remarksCard}>
          <View style={styles.remarksHeader}>
            <RemarksIcon />
            <Text style={styles.remarksTitle}>Admin remarks</Text>
          </View>
          <Text style={styles.remarksText}>
            Grade 1 confirmed on inspection. Good uniform size. Cleared for immediate payout.
          </Text>
        </View>

        {/* Payment Section */}
        <Text style={[styles.sectionTitle, { marginTop: 24 }]}>PAYMENT</Text>
        
        <View style={styles.paymentCard}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Gross sale value</Text>
            <Text style={styles.detailValue}>₹7,600</Text>
          </View>
          <View style={styles.divider} />
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>TOHFA commission (10%)</Text>
            <Text style={styles.detailValueRed}>– ₹760</Text>
          </View>
          <View style={styles.divider} />
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabelBold}>Net payout</Text>
            <Text style={styles.detailValueGreenLarge}>₹6,840</Text>
          </View>
        </View>

        <Text style={styles.paymentFooter}>
          Commission % is a placeholder pending client confirmation
        </Text>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fafafa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
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
    color: '#757575',
    marginTop: 2,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  greenBox: {
    backgroundColor: '#2e7d32',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  greenBoxTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  paidBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  paidBadgeText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  listingId: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 13,
    fontWeight: '600',
  },
  totalValueLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 11,
    fontWeight: '800',
    marginBottom: 4,
  },
  totalValueAmount: {
    color: '#ffffff',
    fontSize: 32,
    fontWeight: '800',
  },
  detailsCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#eeeeee',
    marginBottom: 24,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  divider: {
    height: 1,
    backgroundColor: '#f5f5f5',
  },
  detailLabel: {
    fontSize: 14,
    color: '#757575',
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 14,
    color: '#212121',
    fontWeight: '700',
  },
  detailValueGreen: {
    fontSize: 14,
    color: '#2e7d32',
    fontWeight: '700',
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#9e9e9e',
    marginBottom: 12,
    marginLeft: 4,
  },
  timelineCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#eeeeee',
    marginBottom: 16,
    position: 'relative',
  },
  timelineLine: {
    position: 'absolute',
    top: 36,
    bottom: 36,
    left: 31,
    width: 2,
    backgroundColor: '#2e7d32',
  },
  timelineItem: {
    flexDirection: 'row',
    marginBottom: 24,
    position: 'relative',
    zIndex: 1,
  },
  timelineIconBox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#2e7d32',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  timelineTextCol: {
    flex: 1,
    justifyContent: 'center',
  },
  timelineTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#212121',
    marginBottom: 2,
  },
  timelineSub: {
    fontSize: 13,
    color: '#9e9e9e',
  },
  remarksCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#eeeeee',
  },
  remarksHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  remarksTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#424242',
  },
  remarksText: {
    fontSize: 14,
    color: '#616161',
    lineHeight: 22,
  },
  paymentCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#eeeeee',
    marginBottom: 12,
  },
  detailValueRed: {
    fontSize: 14,
    color: '#e53935',
    fontWeight: '700',
  },
  detailLabelBold: {
    fontSize: 14,
    color: '#212121',
    fontWeight: '800',
  },
  detailValueGreenLarge: {
    fontSize: 18,
    color: '#2e7d32',
    fontWeight: '800',
  },
  paymentFooter: {
    fontSize: 11,
    color: '#9e9e9e',
    textAlign: 'center',
    paddingHorizontal: 20,
  }
});
