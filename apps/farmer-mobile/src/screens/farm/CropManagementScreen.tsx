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

interface CropManagementScreenProps {
  onBack: () => void;
}

export function CropManagementScreen({ onBack }: CropManagementScreenProps): React.JSX.Element {
  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar barStyle="dark-content" backgroundColor="#F9FAFB" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.navCircleButton} onPress={onBack}>
          <Text style={styles.navBackIcon}>←</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Title Area */}
        <View style={styles.titleContainer}>
          <View style={styles.headerIconBox}>
            <Text style={styles.headerIconEmoji}>🍃</Text>
          </View>
          <Text style={styles.titleText}>Crop Management</Text>
          <Text style={styles.subtitleText}>
            Everything about what goes into your soil and onto your crops — in one place.
          </Text>
        </View>

        {/* Cards */}
        <View style={styles.cardsContainer}>
          
          {/* Input Management */}
          <TouchableOpacity style={styles.card} activeOpacity={0.8}>
            <View style={[styles.cardIconBox, { backgroundColor: '#388E3C' }]}>
              <Text style={styles.cardIconEmoji}>🚜</Text>
            </View>
            <View style={styles.cardInfo}>
              <Text style={styles.cardCode}>FR-F05</Text>
              <Text style={styles.cardTitle}>Input Management</Text>
              <Text style={styles.cardSubtitle}>Fertilizers, fertigation schedule, approved inputs</Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>

          {/* Soil Management */}
          <TouchableOpacity style={styles.card} activeOpacity={0.8}>
            <View style={[styles.cardIconBox, { backgroundColor: '#8D6E63' }]}>
              <Text style={styles.cardIconEmoji}>⛰️</Text>
            </View>
            <View style={styles.cardInfo}>
              <Text style={styles.cardCode}>FR-F06</Text>
              <Text style={styles.cardTitle}>Soil Management</Text>
              <Text style={styles.cardSubtitle}>Soil tests, health tracker, amendments, rotation</Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>

          {/* Pest Management */}
          <TouchableOpacity style={styles.card} activeOpacity={0.8}>
            <View style={[styles.cardIconBox, { backgroundColor: '#E53935' }]}>
              <Text style={styles.cardIconEmoji}>🐞</Text>
            </View>
            <View style={styles.cardInfo}>
              <Text style={styles.cardCode}>FR-F07</Text>
              <Text style={styles.cardTitle}>Pest Management</Text>
              <Text style={styles.cardSubtitle}>Detection log, pest library, treatment schedule</Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>

        </View>

        {/* Info Banner */}
        <View style={styles.infoBanner}>
          <Text style={styles.infoIcon}>ⓘ</Text>
          <Text style={styles.infoText}>
            Each section below opens independently — your data in one doesn't require touching the others.
          </Text>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F9FAFB' },
  
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
    backgroundColor: '#F9FAFB',
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
  navBackIcon: { color: '#2E7D32', fontSize: 20 },

  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },

  titleContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  headerIconBox: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#E8F5E9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  headerIconEmoji: { fontSize: 32 },
  titleText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitleText: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 16,
  },

  cardsContainer: {
    gap: 16,
    marginBottom: 32,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  cardIconBox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  cardIconEmoji: { fontSize: 24 },
  cardInfo: { flex: 1 },
  cardCode: { fontSize: 10, fontWeight: 'bold', color: '#94A3B8', marginBottom: 2 },
  cardTitle: { fontSize: 16, fontWeight: 'bold', color: '#1E293B', marginBottom: 4 },
  cardSubtitle: { fontSize: 13, color: '#64748B', lineHeight: 18 },
  chevron: { fontSize: 20, color: '#CBD5E1', marginLeft: 8 },

  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    padding: 16,
  },
  infoIcon: {
    fontSize: 18,
    color: '#1D4ED8',
    marginRight: 12,
    fontWeight: 'bold',
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: '#1E3A8A',
    lineHeight: 18,
  },
});
