import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, Platform, Image } from 'react-native';
import Svg, { Path, Circle, Rect, Line, Polyline } from 'react-native-svg';

// Custom Icons
const ChevronLeft = () => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Path d="M15 18L9 12L15 6" stroke="#2e7d32" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const ArrowRight = () => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const InfoCircle = () => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="10" stroke="#1976d2" strokeWidth="1.5" />
    <Path d="M12 16V12M12 8H12.01" stroke="#1976d2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const CheckCircle = () => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="11" fill="#2e7d32" />
    <Path d="M7 12L10 15L17 8" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const EmptyCircle = () => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="11" stroke="#e0e0e0" strokeWidth="1" fill="#ffffff" />
  </Svg>
);

// Crop Icons
const CropCarrot = () => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
    <Path d="M17.414 4.586A2 2 0 0 0 16 4H8a2 2 0 0 0-1.414.586l-2 2a2 2 0 0 0 0 2.828l6 6a2 2 0 0 0 2.828 0l6-6a2 2 0 0 0 0-2.828l-2-2z" stroke="#f57c00" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <Path d="M12 2V4M9 2V4M15 2V4" stroke="#f57c00" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);

const CropCabbage = () => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
    <Path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="#388e3c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <Path d="M12 12C12 12 8 16 6 12C4 8 12 6 12 6" stroke="#388e3c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <Path d="M12 12C12 12 16 16 18 12C20 8 12 6 12 6" stroke="#388e3c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <Path d="M12 12V22" stroke="#388e3c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);

const CropBeetroot = () => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="14" r="6" stroke="#ad1457" strokeWidth="2" />
    <Circle cx="12" cy="14" r="2" fill="#ad1457" />
    <Path d="M12 8V2M9 4L12 8M15 4L12 8" stroke="#ad1457" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

interface CreateListingScreenProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  onNext?: () => void;
}

export function CreateListingScreen({
  onSuccess,
  onCancel,
  onNext,
}: CreateListingScreenProps): React.JSX.Element {
  const [selectedId, setSelectedId] = useState<string>('carrot');

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.backBtn} onPress={onCancel}>
            <ChevronLeft />
          </TouchableOpacity>
          <View style={styles.headerTextCol}>
            <Text style={styles.headerTitle}>Create Listing</Text>
            <Text style={styles.headerSub}>Step 1 of 2 · Pick crop</Text>
          </View>
          <TouchableOpacity onPress={onCancel}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>

        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          <View style={styles.progressActive} />
          <View style={styles.progressInactive} />
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Info Banner */}
        <View style={styles.infoBanner}>
          <View style={styles.infoIconBox}>
            <InfoCircle />
          </View>
          <Text style={styles.infoText}>
            Only crops you marked <Text style={{fontWeight: '700'}}>harvest-ready</Text> in Produce Calendar can be listed. One listing sells one harvest batch.
          </Text>
        </View>

        {/* List Header */}
        <Text style={styles.sectionTitle}>HARVEST-READY CROPS</Text>

        {/* Crop Selection Cards */}
        <TouchableOpacity 
          style={[styles.cropCard, selectedId === 'carrot' ? styles.cropCardSelected : null]}
          onPress={() => setSelectedId('carrot')}
          activeOpacity={0.8}
        >
          <View style={[styles.cropIconBox, { backgroundColor: '#fff3e0' }]}>
            <Image source={require('../../../../assets/images/real_carrot.jpg')} style={styles.realCropImg} />
          </View>
          <View style={styles.cropTextCol}>
            <View style={styles.cropTitleRow}>
              <Text style={styles.cropTitle}>Carrot · Ooty</Text>
              <View style={styles.gradeBadge}>
                <Text style={styles.gradeBadgeText}>Grade 1</Text>
              </View>
            </View>
            <Text style={styles.cropSub}>Zone A · 180 kg available</Text>
          </View>
          <View style={styles.radioBox}>
            {selectedId === 'carrot' ? <CheckCircle /> : <EmptyCircle />}
          </View>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.cropCard, selectedId === 'cabbage' ? styles.cropCardSelected : null]}
          onPress={() => setSelectedId('cabbage')}
          activeOpacity={0.8}
        >
          <View style={[styles.cropIconBox, { backgroundColor: '#e8f5e9' }]}>
            <Image source={require('../../../../assets/images/real_cabbage.jpg')} style={styles.realCropImg} />
          </View>
          <View style={styles.cropTextCol}>
            <View style={styles.cropTitleRow}>
              <Text style={styles.cropTitle}>Cabbage</Text>
              <View style={styles.gradeBadge}>
                <Text style={styles.gradeBadgeText}>Grade 2</Text>
              </View>
            </View>
            <Text style={styles.cropSub}>Zone B · 260 kg available</Text>
          </View>
          <View style={styles.radioBox}>
            {selectedId === 'cabbage' ? <CheckCircle /> : <EmptyCircle />}
          </View>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.cropCard, selectedId === 'beetroot' ? styles.cropCardSelected : null]}
          onPress={() => setSelectedId('beetroot')}
          activeOpacity={0.8}
        >
          <View style={[styles.cropIconBox, { backgroundColor: '#fce4ec' }]}>
            <Image source={require('../../../../assets/images/real_beetroot.jpg')} style={styles.realCropImg} />
          </View>
          <View style={styles.cropTextCol}>
            <View style={styles.cropTitleRow}>
              <Text style={styles.cropTitle}>Beetroot</Text>
              <View style={styles.gradeBadge}>
                <Text style={styles.gradeBadgeText}>Grade 1</Text>
              </View>
            </View>
            <Text style={styles.cropSub}>Zone A · 90 kg available</Text>
          </View>
          <View style={styles.radioBox}>
            {selectedId === 'beetroot' ? <CheckCircle /> : <EmptyCircle />}
          </View>
        </TouchableOpacity>

        <View style={{height: 100}} />
      </ScrollView>

      {/* Footer / Next Button */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.nextBtn} onPress={onNext}>
          <Text style={styles.nextBtnText}>Next</Text>
          <ArrowRight />
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
  progressInactive: {
    flex: 1,
    backgroundColor: '#e0e0e0',
    borderRadius: 1.5,
  },
  scrollContent: {
    padding: 20,
  },
  infoBanner: {
    flexDirection: 'row',
    backgroundColor: '#e3f2fd', // light blue
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#bbdefb',
  },
  infoIconBox: {
    marginRight: 12,
    marginTop: 2,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: '#455a64',
    lineHeight: 20,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#9e9e9e',
    letterSpacing: 0.5,
    marginBottom: 16,
  },
  cropCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: '#f5f5f5',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 1,
  },
  cropCardSelected: {
    borderColor: '#2e7d32',
  },
  cropIconBox: {
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
  cropTextCol: {
    flex: 1,
  },
  cropTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    flexWrap: 'wrap',
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
    fontSize: 10,
    fontWeight: '800',
    color: '#2e7d32',
  },
  cropSub: {
    fontSize: 13,
    color: '#757575',
  },
  radioBox: {
    marginLeft: 12,
  },
  footer: {
    padding: 20,
    backgroundColor: '#fafafa',
    borderTopWidth: 1,
    borderTopColor: '#f5f5f5',
  },
  nextBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2e7d32',
    borderRadius: 16,
    paddingVertical: 16,
  },
  nextBtnText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
    marginRight: 8,
  },
});
