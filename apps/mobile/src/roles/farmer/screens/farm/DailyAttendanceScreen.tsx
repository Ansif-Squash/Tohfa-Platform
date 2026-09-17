import React, { useState } from 'react';
import { SafeAreaView, StyleSheet, Text, View, ScrollView, TouchableOpacity, TextInput, Switch, Image } from 'react-native';
import { Icon } from '@tohfa/mobile-ui';

interface DailyAttendanceScreenProps {
  onNavigateBack: () => void;
}

export function DailyAttendanceScreen({ onNavigateBack }: DailyAttendanceScreenProps): React.JSX.Element {
  const [muruganPresent, setMuruganPresent] = useState(true);
  const [lakshmiPresent, setLakshmiPresent] = useState(true);
  const [selviPresent, setSelviPresent] = useState(false);

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onNavigateBack}>
          <Icon name="arrow_back" size={20} color="#064E3B" />
        </TouchableOpacity>
        <View style={styles.headerTextContainer}>
          <Text style={styles.headerTitle}>Daily Attendance</Text>
          <Text style={styles.headerSubtitle}>Thu · 16 July 2026</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>WHO WORKED TODAY</Text>
          <Text style={styles.presentCount}>2 present</Text>
        </View>

        {/* Card 1: Murugan R. */}
        <View style={[styles.card, muruganPresent && styles.cardActive]}>
          <View style={styles.cardHeaderRow}>
            <View style={styles.workerInfo}>
              <View style={[styles.avatar, { backgroundColor: '#DCFCE7' }]}>
                <Text style={[styles.avatarText, { color: '#166534' }]}>MR</Text>
              </View>
              <View>
                <Text style={[styles.workerName, !muruganPresent && styles.textMuted]}>Murugan R.</Text>
                <Text style={styles.workerRole}>Field Worker · ₹450/day</Text>
              </View>
            </View>
            <View style={styles.cardActions}>
              <TouchableOpacity style={styles.micButton}>
                <Image source={require('../../../../assets/images/mic.png')} style={{width: 18, height: 18, tintColor: '#4B5563'}} />
              </TouchableOpacity>
              <Switch
                value={muruganPresent}
                onValueChange={setMuruganPresent}
                trackColor={{ false: '#E5E7EB', true: '#166534' }}
                thumbColor="#FFFFFF"
              />
            </View>
          </View>
          {muruganPresent && (
            <View style={styles.formGrid}>
              <View style={styles.formGroup}>
                <Text style={styles.label}>Crop</Text>
                <View style={styles.selectInput}>
                  <Text style={styles.selectText}>Carrot</Text>
                  <Icon name="expand_more" size={16} color="#6B7280" />
                </View>
              </View>
              <View style={styles.formGroup}>
                <Text style={styles.label}>Activity</Text>
                <View style={styles.selectInput}>
                  <Text style={styles.selectText}>Irrigation</Text>
                  <Icon name="expand_more" size={16} color="#6B7280" />
                </View>
              </View>
              <View style={[styles.formGroup, { flex: 0.5 }]}>
                <Text style={styles.label}>Hours</Text>
                <TextInput style={styles.textInput} value="7" editable={false} />
              </View>
            </View>
          )}
        </View>

        {/* Card 2: Lakshmi D. */}
        <View style={[styles.card, lakshmiPresent && styles.cardActive]}>
          <View style={styles.cardHeaderRow}>
            <View style={styles.workerInfo}>
              <View style={[styles.avatar, { backgroundColor: '#F3E8FF' }]}>
                <Text style={[styles.avatarText, { color: '#7E22CE' }]}>LD</Text>
              </View>
              <View>
                <Text style={[styles.workerName, !lakshmiPresent && styles.textMuted]}>Lakshmi D.</Text>
                <Text style={styles.workerRole}>General Hand · ₹400/day</Text>
              </View>
            </View>
            <View style={styles.cardActions}>
              <TouchableOpacity style={styles.micButton}>
                <Image source={require('../../../../assets/images/mic.png')} style={{width: 18, height: 18, tintColor: '#4B5563'}} />
              </TouchableOpacity>
              <Switch
                value={lakshmiPresent}
                onValueChange={setLakshmiPresent}
                trackColor={{ false: '#E5E7EB', true: '#166534' }}
                thumbColor="#FFFFFF"
              />
            </View>
          </View>
          {lakshmiPresent && (
            <View style={styles.formGrid}>
              <View style={styles.formGroup}>
                <Text style={styles.label}>Crop</Text>
                <View style={styles.selectInput}>
                  <Text style={styles.selectText}>Cabbage</Text>
                  <Icon name="expand_more" size={16} color="#6B7280" />
                </View>
              </View>
              <View style={styles.formGroup}>
                <Text style={styles.label}>Activity</Text>
                <View style={styles.selectInput}>
                  <Text style={styles.selectText}>Weeding</Text>
                  <Icon name="expand_more" size={16} color="#6B7280" />
                </View>
              </View>
              <View style={[styles.formGroup, { flex: 0.5 }]}>
                <Text style={styles.label}>Hours</Text>
                <TextInput style={styles.textInput} value="7" editable={false} />
              </View>
            </View>
          )}
        </View>

        {/* Card 3: Selvi K. */}
        <View style={[styles.card, selviPresent && styles.cardActive]}>
          <View style={styles.cardHeaderRow}>
            <View style={styles.workerInfo}>
              <View style={[styles.avatar, { backgroundColor: '#F3F4F6' }]}>
                <Text style={[styles.avatarText, { color: '#9CA3AF' }]}>SK</Text>
              </View>
              <View>
                <Text style={[styles.workerName, !selviPresent && styles.textMuted]}>Selvi K.</Text>
                <Text style={styles.workerRole}>Farm Supervisor · Monthly</Text>
              </View>
            </View>
            <View style={styles.cardActions}>
              <TouchableOpacity style={styles.micButton}>
                <Image source={require('../../../../assets/images/mic.png')} style={{width: 18, height: 18, tintColor: '#9CA3AF', opacity: 0.5}} />
              </TouchableOpacity>
              <Switch
                value={selviPresent}
                onValueChange={setSelviPresent}
                trackColor={{ false: '#E5E7EB', true: '#166534' }}
                thumbColor="#FFFFFF"
              />
            </View>
          </View>
          {selviPresent && (
            <View style={styles.formGrid}>
              <View style={styles.formGroup}>
                <Text style={styles.label}>Crop</Text>
                <View style={styles.selectInput}>
                  <Text style={styles.selectText}>Select</Text>
                  <Icon name="expand_more" size={16} color="#6B7280" />
                </View>
              </View>
              <View style={styles.formGroup}>
                <Text style={styles.label}>Activity</Text>
                <View style={styles.selectInput}>
                  <Text style={styles.selectText}>Select</Text>
                  <Icon name="expand_more" size={16} color="#6B7280" />
                </View>
              </View>
              <View style={[styles.formGroup, { flex: 0.5 }]}>
                <Text style={styles.label}>Hours</Text>
                <TextInput style={styles.textInput} value="0" editable={false} />
              </View>
            </View>
          )}
        </View>

        <View style={styles.infoBanner}>
          <Image source={require('../../../../assets/images/mic.png')} style={{width: 18, height: 18, tintColor: '#B45309'}} />
          <Text style={styles.infoBannerText}>
            Tap the mic to mark a worker present by voice — hands-free while out in the field.
          </Text>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.saveButton} onPress={onNavigateBack}>
          <Icon name="check_circle" size={20} color="#FFFFFF" />
          <Text style={styles.saveButtonText}>Save today's attendance</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#FFFFFF' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
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
    color: '#064E3B',
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#9CA3AF',
    marginTop: 2,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
    gap: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#9CA3AF',
    letterSpacing: 0.5,
  },
  presentCount: {
    fontSize: 13,
    fontWeight: '700',
    color: '#166534',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  cardActive: {
    borderColor: '#DCFCE7',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  workerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '700',
  },
  workerName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  workerRole: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
  },
  textMuted: {
    color: '#9CA3AF',
  },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  micButton: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#F3EFE9',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  formGrid: {
    flexDirection: 'row',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    gap: 8,
  },
  formGroup: {
    flex: 1,
    gap: 6,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: '#9CA3AF',
  },
  selectInput: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 40,
    backgroundColor: '#FFFFFF',
  },
  selectText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 40,
    backgroundColor: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  infoBanner: {
    flexDirection: 'row',
    backgroundColor: '#FEF3C7',
    padding: 16,
    borderRadius: 12,
    gap: 12,
    marginTop: 8,
  },
  infoBannerText: {
    flex: 1,
    fontSize: 13,
    color: '#92400E',
    lineHeight: 18,
  },
  footer: {
    padding: 20,
    paddingBottom: 30,
    backgroundColor: '#FFFFFF',
  },
  saveButton: {
    flexDirection: 'row',
    backgroundColor: '#166534',
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
