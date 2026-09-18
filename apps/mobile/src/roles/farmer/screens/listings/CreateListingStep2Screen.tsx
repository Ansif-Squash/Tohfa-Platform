import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, TextInput, Platform } from 'react-native';
import Svg, { Path, Circle, Rect, Line, Polyline } from 'react-native-svg';

// Custom Icons
const ChevronLeft = () => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Path d="M15 18L9 12L15 6" stroke="#2e7d32" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const LockIcon = () => (
  <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
    <Rect x="5" y="11" width="14" height="10" rx="2" stroke="#9e9e9e" strokeWidth="2" />
    <Path d="M8 11V7C8 4.79086 9.79086 3 12 3C14.2091 3 16 4.79086 16 7V11" stroke="#9e9e9e" strokeWidth="2" />
  </Svg>
);

const PhotoIcon = () => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
    <Rect x="3" y="3" width="18" height="18" rx="2" stroke="#bdbdbd" strokeWidth="1.5" />
    <Circle cx="8.5" cy="8.5" r="1.5" fill="#bdbdbd" />
    <Path d="M21 15L16 10L5 21" stroke="#bdbdbd" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const ShieldCheckOrange = () => (
  <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
    <Path d="M12 22S4 18 4 12V6L12 2L20 6V12C20 18 12 22 12 22Z" stroke="#d84315" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <Path d="M9 12L11 14L15 10" stroke="#d84315" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);

const ShieldCheckGreen = () => (
  <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
    <Path d="M12 22S4 18 4 12V6L12 2L20 6V12C20 18 12 22 12 22Z" stroke="#2e7d32" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <Path d="M9 12L11 14L15 10" stroke="#2e7d32" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);

const PlusCircle = () => (
  <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="10" stroke="#9e9e9e" strokeWidth="2" />
    <Path d="M12 8V16M8 12H16" stroke="#9e9e9e" strokeWidth="2" strokeLinecap="round" />
  </Svg>
);

const CheckCircleGreen = () => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="10" stroke="#2e7d32" strokeWidth="1.5" />
    <Path d="M8 12L11 15L16 9" stroke="#2e7d32" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const CheckIconSmall = () => (
  <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
    <Path d="M5 12L10 17L19 7" stroke="#2e7d32" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const TagIcon = () => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Path d="M20.59 13.41L13.42 20.58A2 2 0 0 1 12 21A2 2 0 0 1 10.59 20.58L2 12V2H12L20.59 10.59A2 2 0 0 0 20.59 13.41Z" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <Circle cx="7" cy="7" r="1" fill="#ffffff" />
  </Svg>
);

interface CreateListingStep2ScreenProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  onBack?: () => void;
}

export function CreateListingStep2Screen({
  onSuccess,
  onCancel,
  onBack,
}: CreateListingStep2ScreenProps): React.JSX.Element {
  
  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.backBtn} onPress={onBack}>
            <ChevronLeft />
          </TouchableOpacity>
          <View style={styles.headerTextCol}>
            <Text style={styles.headerTitle}>Create Listing</Text>
            <Text style={styles.headerSub}>Step 2 of 2 · Quantity & price</Text>
          </View>
          <TouchableOpacity onPress={onCancel}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>

        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          <View style={styles.progressActive} />
          <View style={styles.progressActive} />
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Crop Card */}
        <View style={styles.cropCard}>
          <View style={styles.photoBox}>
            <PhotoIcon />
            <Text style={styles.photoText}>PHOTO</Text>
          </View>
          <View style={styles.cropTextCol}>
            <View style={styles.cropTitleRow}>
              <Text style={styles.cropTitle}>Carrot · Ooty</Text>
              <View style={styles.gradeBadge}>
                <Text style={styles.gradeBadgeText}>Grade 1</Text>
              </View>
            </View>
            <View style={styles.cropSubRow}>
              <LockIcon />
              <Text style={styles.cropSubText}>Locked from your harvest record</Text>
            </View>
          </View>
        </View>

        {/* Alert Box */}
        <View style={styles.alertBox}>
          <View style={{ marginTop: 2, marginRight: 12 }}>
            <ShieldCheckOrange />
          </View>
          <Text style={styles.alertText}>
            Grade 1 is <Text style={{fontWeight: '700'}}>your claim.</Text> TOHFA verifies grade on inspection — a counter-offer on grade is normal, not a rejection.
          </Text>
        </View>

        {/* Quantity Input */}
        <View style={styles.inputSection}>
          <View style={styles.labelRow}>
            <Text style={styles.inputLabel}>Quantity to sell (kg) <Text style={{color: '#d32f2f'}}>*</Text></Text>
            <Text style={styles.inputLabelRight}>180 kg available</Text>
          </View>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              value="120"
              keyboardType="numeric"
              editable={false}
            />
          </View>
        </View>

        {/* Pricing Info Row */}
        <View style={styles.pricingRow}>
          <View style={[styles.pricingBox, { backgroundColor: '#f1f8e9', borderColor: '#dcedc8', borderWidth: 1 }]}>
            <View style={styles.pricingBoxHeaderRow}>
              <ShieldCheckGreen />
              <Text style={styles.pricingBoxTitleGreen}>FAIR PRICE CEILING</Text>
            </View>
            <Text style={styles.pricingBoxValueGreen}>₹42<Text style={styles.pricingBoxUnit}>/kg</Text></Text>
            <Text style={styles.pricingBoxSub}>Grade 1 - set by admin</Text>
          </View>

          <View style={[styles.pricingBox, { backgroundColor: '#f5f5f5', borderColor: '#eeeeee', borderWidth: 1 }]}>
            <View style={styles.pricingBoxHeaderRow}>
              <PlusCircle />
              <Text style={styles.pricingBoxTitleGray}>TOHFA MARKUP</Text>
            </View>
            <Text style={styles.pricingBoxValueGray}>+10%</Text>
            <Text style={styles.pricingBoxSub}>added for customer, not deducted</Text>
          </View>
        </View>

        {/* Asking Price Input */}
        <View style={styles.inputSection}>
          <Text style={styles.inputLabel}>Your asking price (₹/kg) <Text style={{color: '#d32f2f'}}>*</Text></Text>
          <View style={[styles.inputWrapper, { borderColor: '#2e7d32' }]}>
            <Text style={styles.currencySymbol}>₹</Text>
            <TextInput
              style={styles.inputWithSymbol}
              value="38"
              keyboardType="numeric"
              editable={false}
            />
            <CheckCircleGreen />
          </View>
          <View style={styles.validationRow}>
            <CheckIconSmall />
            <Text style={styles.validationText}>Within the ₹42/kg ceiling</Text>
          </View>
        </View>

        {/* Sale Value Box */}
        <View style={styles.saleValueBox}>
          <View style={styles.saleValueCol}>
            <Text style={styles.saleValueTitle}>ESTIMATED SALE VALUE</Text>
            <Text style={styles.saleValueSub}>120 kg × ₹38/kg</Text>
          </View>
          <Text style={styles.saleValueAmount}>₹4,560</Text>
        </View>

        <View style={{height: 40}} />
      </ScrollView>

      {/* Footer / Submit Button */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.submitBtn} onPress={onSuccess}>
          <TagIcon />
          <Text style={styles.submitBtnText}>Submit listing</Text>
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
    backgroundColor: '#ffffff',
    paddingTop: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
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
  cancelText: {
    fontSize: 15,
    color: '#607d8b',
    fontWeight: '600',
  },
  progressContainer: {
    flexDirection: 'row',
    height: 3,
    paddingHorizontal: 20,
    gap: 8,
  },
  progressActive: {
    flex: 1,
    backgroundColor: '#2e7d32',
    borderRadius: 1.5,
  },
  scrollContent: {
    padding: 20,
  },
  cropCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#eeeeee',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 1,
  },
  photoBox: {
    width: 64,
    height: 64,
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderStyle: 'dashed',
  },
  photoText: {
    fontSize: 11,
    lineHeight: 15,
    color: '#9e9e9e',
    fontWeight: '700',
    marginTop: 4,
  },
  cropTextCol: {
    flex: 1,
  },
  cropTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: 8,
  },
  cropTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#212121',
  },
  gradeBadge: {
    backgroundColor: '#e8f5e9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  gradeBadgeText: {
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '800',
    color: '#2e7d32',
  },
  cropSubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  cropSubText: {
    fontSize: 13,
    color: '#9e9e9e',
    fontWeight: '500',
  },
  alertBox: {
    flexDirection: 'row',
    backgroundColor: '#fff3e0',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#ffe0b2',
  },
  alertText: {
    flex: 1,
    fontSize: 13,
    color: '#d84315',
    lineHeight: 20,
  },
  inputSection: {
    marginBottom: 20,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: '#424242',
    marginBottom: 8,
  },
  inputLabelRight: {
    fontSize: 12,
    fontWeight: '600',
    color: '#757575',
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#4caf50', // Based on screenshot the quantity input has green border as well
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 56,
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: '#212121',
  },
  inputWithSymbol: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: '#212121',
    marginLeft: 8,
  },
  currencySymbol: {
    fontSize: 16,
    fontWeight: '700',
    color: '#757575',
  },
  pricingRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  pricingBox: {
    flex: 1,
    borderRadius: 12,
    padding: 16,
  },
  pricingBoxHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  pricingBoxTitleGreen: {
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '800',
    color: '#2e7d32',
  },
  pricingBoxTitleGray: {
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '800',
    color: '#757575',
  },
  pricingBoxValueGreen: {
    fontSize: 20,
    fontWeight: '800',
    color: '#2e7d32',
    marginBottom: 4,
  },
  pricingBoxValueGray: {
    fontSize: 20,
    fontWeight: '800',
    color: '#424242',
    marginBottom: 4,
  },
  pricingBoxUnit: {
    fontSize: 12,
  },
  pricingBoxSub: {
    fontSize: 11,
    color: '#757575',
    lineHeight: 14,
  },
  validationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    paddingHorizontal: 4,
  },
  validationText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2e7d32',
  },
  saleValueBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#2e7d32',
    borderRadius: 16,
    padding: 20,
    marginTop: 8,
  },
  saleValueCol: {
    flex: 1,
  },
  saleValueTitle: {
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '800',
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 4,
  },
  saleValueSub: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.9)',
  },
  saleValueAmount: {
    fontSize: 24,
    fontWeight: '800',
    color: '#ffffff',
  },
  footer: {
    padding: 20,
    backgroundColor: '#fafafa',
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2e7d32',
    borderRadius: 16,
    paddingVertical: 16,
  },
  submitBtnText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
    marginLeft: 8,
  },
});
