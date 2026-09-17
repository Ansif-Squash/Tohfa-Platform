import React from 'react';
import { SafeAreaView, StyleSheet, Text, View, ScrollView, TouchableOpacity, Image } from 'react-native';
import { Icon } from '@tohfa/mobile-ui';
import { authPalette as P, colors } from '../../theme';

interface ActiveCropsScreenProps {
  onNavigateBack: () => void;
}

export function ActiveCropsScreen({ onNavigateBack }: ActiveCropsScreenProps): React.JSX.Element {
  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onNavigateBack} style={styles.backButton}>
          <Icon name="arrow_back" size={24} color={P.grey900} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>All Active Crops</Text>
      </View>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.cropCard}>
          <Image 
            source={{ uri: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=400&q=80' }} 
            style={styles.cropImage}
            resizeMode="cover"
          />
          <View style={styles.cropInfo}>
            <Text style={styles.cropName}>Tomato</Text>
            <Text style={styles.cropDetail}>Zone A · 62 days</Text>
            <Text style={[styles.cropHarvest, { color: colors.brandGreen }]}>Harvest in 8d</Text>
            <View style={styles.progressBarBg}>
              <View style={[styles.progressBarFill, { width: '80%', backgroundColor: colors.brandGreen }]} />
            </View>
          </View>
        </View>

        <View style={styles.cropCard}>
          <Image 
            source={{ uri: 'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?w=400&q=80' }} 
            style={styles.cropImage}
            resizeMode="cover"
          />
          <View style={styles.cropInfo}>
            <Text style={styles.cropName}>Carrot</Text>
            <Text style={styles.cropDetail}>Zone B · 34 days</Text>
            <Text style={[styles.cropHarvest, { color: P.orange700 }]}>Harvest in 41d</Text>
            <View style={styles.progressBarBg}>
              <View style={[styles.progressBarFill, { width: '40%', backgroundColor: P.orange700 }]} />
            </View>
          </View>
        </View>
        
        {/* Mocking one more crop for demonstration */}
        <View style={styles.cropCard}>
          <Image 
            source={{ uri: 'https://images.unsplash.com/photo-1518977672851-f7eeaf69f4c8?w=400&q=80' }} 
            style={styles.cropImage}
            resizeMode="cover"
          />
          <View style={styles.cropInfo}>
            <Text style={styles.cropName}>Wheat</Text>
            <Text style={styles.cropDetail}>Zone C · 14 days</Text>
            <Text style={[styles.cropHarvest, { color: P.blue700 }]}>Harvest in 90d</Text>
            <View style={styles.progressBarBg}>
              <View style={[styles.progressBarFill, { width: '15%', backgroundColor: P.blue700 }]} />
            </View>
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: P.lightSurfaceAlt },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: P.grey100,
  },
  backButton: {
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: P.grey900,
  },
  scrollContent: {
    padding: 20,
    gap: 16,
  },
  cropCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    shadowColor: P.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
    overflow: 'hidden',
    flexDirection: 'row',
  },
  cropImage: {
    width: 100,
  },
  cropInfo: {
    flex: 1,
    padding: 16,
  },
  cropName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: P.grey900,
    marginBottom: 4,
  },
  cropDetail: {
    fontSize: 13,
    color: P.grey600,
    marginBottom: 12,
  },
  cropHarvest: {
    fontSize: 13,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  progressBarBg: {
    height: 6,
    backgroundColor: P.grey200,
    borderRadius: 3,
    width: '100%',
  },
  progressBarFill: {
    height: 6,
    borderRadius: 3,
  },
});
