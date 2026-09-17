import React from 'react';
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { Icon } from '@tohfa/mobile-ui';

interface FarmManagementScreenProps {
  onBack?: () => void;
  onNavigateToAudits?: () => void;
  onNavigateToDiary?: () => void;
}

function TractorIcon({ color = '#fff' }) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Circle cx={7} cy={16} r={3} />
      <Circle cx={17} cy={16} r={2} />
      <Path d="M10 16h5" />
      <Path d="M7 13V9h4v4" />
      <Path d="M11 9l4-1v6h3l1 2v2" />
    </Svg>
  );
}

function TerrainIcon({ color = '#fff' }) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M22 18L14 6l-4 6-3-4-5 10h20z" />
    </Svg>
  );
}

function BugIcon({ color = '#fff' }) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M12 18V6" />
      <Path d="M8 10a4 4 0 0 1 8 0v4a4 4 0 0 1-8 0z" />
      <Path d="M10 6h4" />
      <Path d="M18 10h2" />
      <Path d="M4 10h2" />
      <Path d="M18 14h2" />
      <Path d="M4 14h2" />
      <Path d="M16 18l2 2" />
      <Path d="M8 18l-2 2" />
      <Path d="M16 6l2-2" />
      <Path d="M8 6L6 4" />
    </Svg>
  );
}

export function FarmManagementScreen({
  onBack,
}: FarmManagementScreenProps): React.JSX.Element {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable style={styles.backButton} onPress={onBack}>
            <Icon name="arrow_back" size={20} color="#2e7d32" />
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          
          <View style={styles.heroSection}>
            <View style={styles.logoCircle}>
              <Icon name="eco" size={32} color="#2e7d32" />
            </View>
            <Text style={styles.title}>Crop Management</Text>
            <Text style={styles.subtitle}>
              Everything about what goes into your soil and onto your crops — in one place.
            </Text>
          </View>

          <View style={styles.cardsContainer}>
            
            {/* Card 1 */}
            <Pressable style={styles.card}>
              <View style={[styles.cardIconBox, { backgroundColor: '#388e3c' }]}>
                <TractorIcon />
              </View>
              <View style={styles.cardTextCol}>
                <Text style={styles.cardCode}>FR-F05</Text>
                <Text style={styles.cardTitle}>Input Management</Text>
                <Text style={styles.cardSubtitle}>Fertilizers, fertigation schedule, approved inputs</Text>
              </View>
              <Icon name="chevron_right" size={24} color="#bdbdbd" />
            </Pressable>

            {/* Card 2 */}
            <Pressable style={styles.card}>
              <View style={[styles.cardIconBox, { backgroundColor: '#8a5a21' }]}>
                <TerrainIcon />
              </View>
              <View style={styles.cardTextCol}>
                <Text style={styles.cardCode}>FR-F06</Text>
                <Text style={styles.cardTitle}>Soil Management</Text>
                <Text style={styles.cardSubtitle}>Soil tests, health tracker, amendments, rotation</Text>
              </View>
              <Icon name="chevron_right" size={24} color="#bdbdbd" />
            </Pressable>

            {/* Card 3 */}
            <Pressable style={styles.card}>
              <View style={[styles.cardIconBox, { backgroundColor: '#e53935' }]}>
                <BugIcon />
              </View>
              <View style={styles.cardTextCol}>
                <Text style={styles.cardCode}>FR-F07</Text>
                <Text style={styles.cardTitle}>Pest Management</Text>
                <Text style={styles.cardSubtitle}>Detection log, pest library, treatment schedule</Text>
              </View>
              <Icon name="chevron_right" size={24} color="#bdbdbd" />
            </Pressable>

            {/* Banner */}
            <View style={styles.infoBanner}>
              <Icon name="info" size={20} color="#1976d2" />
              <Text style={styles.infoBannerText}>
                Each section below opens independently — your data in one doesn't require touching the others.
              </Text>
            </View>

          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#faf8f5',
  },
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#d5ebd5',
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  heroSection: {
    alignItems: 'center',
    paddingHorizontal: 30,
    marginTop: 20,
    marginBottom: 30,
  },
  logoCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#e8f5e9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#212121',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#757575',
    textAlign: 'center',
    lineHeight: 20,
  },
  cardsContainer: {
    paddingHorizontal: 20,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  cardIconBox: {
    width: 56,
    height: 56,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardTextCol: {
    flex: 1,
    marginLeft: 16,
    marginRight: 8,
  },
  cardCode: {
    fontSize: 11,
    fontWeight: '800',
    color: '#9e9e9e',
    marginBottom: 2,
    letterSpacing: 0.5,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#212121',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 13,
    color: '#9e9e9e',
    lineHeight: 18,
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e3f2fd',
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
  },
  infoBannerText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 13,
    color: '#1565c0',
    lineHeight: 18,
    fontWeight: '500',
  },
});
