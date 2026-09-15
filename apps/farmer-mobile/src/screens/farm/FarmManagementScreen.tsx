import React, { useState } from 'react';
import {
  Alert,
  Modal,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Circle, Line, Path, Rect } from 'react-native-svg';

// ─────────────────────────────────────────────
// Inline SVG Icons
// ─────────────────────────────────────────────

function ArrowBackIcon({ size = 20, color = '#FFFFFF' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M19 12H5M5 12L12 19M5 12L12 5"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function ChevronRightIcon({ size = 18, color = '#9CA3AF' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M9 18l6-6-6-6"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function ExclamationCircleIcon({ size = 24, color = '#EA580C' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" fill="#EA580C" />
      <Line x1="12" y1="7" x2="12" y2="13" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" />
      <Circle cx="12" cy="17" r="1.2" fill="#FFFFFF" />
    </Svg>
  );
}

function PencilEditIcon({ size = 20, color = '#EA580C' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function CloudWeatherIcon({ size = 22, color = '#0284C7' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function SnowflakeIcon({ size = 12, color = '#0284C7' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Line x1="12" y1="2" x2="12" y2="22" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="2" y1="12" x2="22" y2="12" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="4.93" y1="4.93" x2="19.07" y2="19.07" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="19.07" y1="4.93" x2="4.93" y2="19.07" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function PlantSproutIcon({ size = 20, color = '#15803D' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M7 20h10M12 20v-8M12 12a5 5 0 0 1 5-5h2v2a5 5 0 0 1-5 5h-2zM12 14a5 5 0 0 0-5-5H5v2a5 5 0 0 0 5 5h2z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function CalendarMiniIcon({ size = 12, color = '#1B5E20' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="4" width="18" height="18" rx="2" stroke={color} strokeWidth="2" />
      <Line x1="16" y1="2" x2="16" y2="6" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="8" y1="2" x2="8" y2="6" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="3" y1="10" x2="21" y2="10" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function FlaskBeakerIcon({ size = 20, color = '#EA580C' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M10 2v5.5L4.5 19.5A2 2 0 0 0 6.2 22h11.6a2 2 0 0 0 1.7-2.5L14 7.5V2"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Line x1="8.5" y1="2" x2="15.5" y2="2" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="6" y1="17" x2="18" y2="17" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </Svg>
  );
}

function WorkforceUsersIcon({ size = 20, color = '#15803D' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle cx="9" cy="7" r="4" stroke={color} strokeWidth="2" />
      <Path
        d="M23 21v-2a4 4 0 0 0-3-3.87"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
      />
      <Path
        d="M16 3.13a4 4 0 0 1 0 7.75"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
      />
    </Svg>
  );
}

function CheckmarkCircleIcon({ size = 16, color = '#15803D' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2" />
      <Path
        d="M8 12l2.5 2.5L16 9"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function PawPrintIcon({ size = 20, color = '#EA580C' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="15" r="4.5" fill={color} />
      <Circle cx="6.5" cy="10" r="2.2" fill={color} />
      <Circle cx="10" cy="5.5" r="2.2" fill={color} />
      <Circle cx="14" cy="5.5" r="2.2" fill={color} />
      <Circle cx="17.5" cy="10" r="2.2" fill={color} />
    </Svg>
  );
}

function GraduationCapIcon({ size = 22, color = '#0284C7' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M22 10v6M2 10l10-5 10 5-10 5z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M6 12v5c0 2 3 4 6 4s6-2 6-4v-5"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function CheckmarkMiniIcon({ size = 14, color = '#15803D' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M20 6L9 17l-5-5"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// ─────────────────────────────────────────────
// Component Implementation
// ─────────────────────────────────────────────

interface FarmManagementScreenProps {
  onBack?: () => void;
  onNavigateToAudits?: () => void;
  onNavigateToProduceCalendar?: () => void;
  onNavigateToCropManagement?: () => void;
  onNavigateToWeather?: () => void;
}

export function FarmManagementScreen({
  onBack,
  onNavigateToAudits,
  onNavigateToProduceCalendar,
  onNavigateToCropManagement,
  onNavigateToWeather,
}: FarmManagementScreenProps): React.JSX.Element {
  const [isDiaryModalOpen, setIsDiaryModalOpen] = useState(false);
  const [diaryNote, setDiaryNote] = useState('');
  const [isFertigationLogged, setIsFertigationLogged] = useState(false);

  const handleSaveDiary = () => {
    if (!diaryNote.trim()) {
      Alert.alert('Required', 'Please enter a diary note for today.');
      return;
    }
    Alert.alert('Success', 'Farm diary entry recorded for Great Earth Farm.');
    setIsDiaryModalOpen(false);
    setDiaryNote('');
  };

  const handleToggleFertigation = () => {
    setIsFertigationLogged(!isFertigationLogged);
    Alert.alert(
      !isFertigationLogged ? 'Logged' : 'Pending',
      !isFertigationLogged
        ? 'Fertigation for Carrot (Zone 2) marked as completed.'
        : 'Fertigation reset to scheduled status.'
    );
  };

  const handleLivestockReview = () => {
    Alert.alert(
      'Livestock Health Checks',
      '2 health inspections due this week: Cow #04 (deworming) & Calf #07 (vaccination booster).'
    );
  };

  const handleLearningHub = () => {
    Alert.alert(
      'Learning Hub',
      'Opening Tomato Growers discussion group. 3 new posts regarding blight mitigation and organic foliar spray recipes.'
    );
  };

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar barStyle="light-content" backgroundColor="#1B5E20" />

      {/* ── Dark Green Header with Summary Stats ── */}
      <View style={styles.topHeader}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={onBack}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Back"
          >
            <ArrowBackIcon size={20} color="#FFFFFF" />
          </TouchableOpacity>
          <View style={styles.headerTitleCol}>
            <Text style={styles.headerTitle}>Farm Management</Text>
            <Text style={styles.headerSubtitle}>Great Earth Farm · Wed, 16 Jul 2026</Text>
          </View>
        </View>

        {/* 3 Summary Stats Cards */}
        <View style={styles.summaryStatsRow}>
          <View style={styles.summaryStatCard}>
            <Text style={styles.summaryStatNumber}>3</Text>
            <Text style={styles.summaryStatLabel}>Active crops</Text>
          </View>

          <View style={styles.summaryStatCard}>
            <Text style={styles.summaryStatNumber}>3</Text>
            <Text style={styles.summaryStatLabel}>Workers today</Text>
          </View>

          <TouchableOpacity
            style={styles.summaryStatCard}
            activeOpacity={0.8}
            onPress={onNavigateToAudits}
          >
            <Text style={styles.summaryStatNumber}>2</Text>
            <Text style={styles.summaryStatLabel}>Certs valid</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Attention Banner ── */}
        <TouchableOpacity
          style={styles.attentionBanner}
          activeOpacity={0.85}
          onPress={() => setIsDiaryModalOpen(true)}
        >
          <ExclamationCircleIcon size={24} color="#EA580C" />
          <View style={styles.attentionContent}>
            <Text style={styles.attentionTitle}>3 modules need your attention today</Text>
            <Text style={styles.attentionSubtitle}>Tap to jump to the first one</Text>
          </View>
          <ChevronRightIcon size={18} color="#92400E" />
        </TouchableOpacity>

        {/* ── Grid of Modules (2 Columns) ── */}
        <View style={styles.modulesGrid}>
          {/* 1. Farm Diary */}
          <View style={styles.moduleCard}>
            <View style={styles.moduleCardTop}>
              <View style={[styles.iconBadge, { backgroundColor: '#FFEDD5' }]}>
                <PencilEditIcon size={20} color="#EA580C" />
              </View>
              <View style={[styles.statusIndicatorDot, { backgroundColor: '#EF4444' }]} />
            </View>

            <View style={styles.moduleTextSection}>
              <Text style={styles.moduleTitle}>Farm Diary</Text>
              <Text style={styles.moduleDesc}>No diary entries logged yet today.</Text>
            </View>

            <TouchableOpacity
              style={styles.logEntryBtn}
              activeOpacity={0.85}
              onPress={() => setIsDiaryModalOpen(true)}
            >
              <Text style={styles.logEntryBtnText}>+ Log entry</Text>
            </TouchableOpacity>
          </View>

          {/* 2. Weather */}
          <TouchableOpacity 
            style={styles.moduleCard}
            activeOpacity={0.8}
            onPress={onNavigateToWeather}
          >
            <View style={styles.moduleCardTop}>
              <View style={[styles.iconBadge, { backgroundColor: '#E0F2FE' }]}>
                <CloudWeatherIcon size={22} color="#0284C7" />
              </View>
              <View style={[styles.statusIndicatorDot, { backgroundColor: '#3B82F6' }]} />
            </View>

            <View style={styles.moduleTextSection}>
              <Text style={styles.moduleTitle}>Weather</Text>
              <Text style={styles.moduleDesc}>18°C · Cloudy · Kotagiri</Text>
            </View>

            <View style={styles.weatherRiskPill}>
              <SnowflakeIcon size={12} color="#0284C7" />
              <Text style={styles.weatherRiskText}>Frost risk tonight</Text>
            </View>
          </TouchableOpacity>

          {/* 3. Produce Calendar */}
          <TouchableOpacity 
            style={styles.moduleCard} 
            activeOpacity={0.8}
            onPress={onNavigateToProduceCalendar}
          >
            <View style={styles.moduleCardTop}>
              <View style={[styles.iconBadge, { backgroundColor: '#DCFCE7' }]}>
                <PlantSproutIcon size={20} color="#15803D" />
              </View>
              <View style={[styles.statusIndicatorDot, { backgroundColor: '#3B82F6' }]} />
            </View>

            <View style={styles.moduleTextSection}>
              <Text style={styles.moduleTitle}>Produce Calendar</Text>
              <Text style={styles.moduleDesc}>3 active crops growing</Text>
            </View>

            <View style={styles.producePill}>
              <CalendarMiniIcon size={12} color="#1B5E20" />
              <Text style={styles.producePillText}>Tomato harvest · 8 days</Text>
            </View>
          </TouchableOpacity>

          {/* 4. Crop Management */}
          <TouchableOpacity 
            style={styles.moduleCard}
            activeOpacity={0.8}
            onPress={onNavigateToCropManagement}
          >
            <View style={styles.moduleCardTop}>
              <View style={[styles.iconBadge, { backgroundColor: '#FFEDD5' }]}>
                <FlaskBeakerIcon size={20} color="#EA580C" />
              </View>
              <View
                style={[
                  styles.statusIndicatorDot,
                  { backgroundColor: isFertigationLogged ? '#22C55E' : '#EF4444' },
                ]}
              />
            </View>

            <View style={styles.moduleTextSection}>
              <Text style={styles.moduleTitle}>Crop Management</Text>
              <Text style={styles.moduleDesc}>
                {isFertigationLogged
                  ? 'Carrot Zone 2 fertigation completed.'
                  : 'Fertigation due tomorrow — Carrot, Zone 2.'}
              </Text>
            </View>

            <View
              style={[
                styles.markLoggedBtn,
                isFertigationLogged && { backgroundColor: '#F0FDF4' },
              ]}
            >
              <CheckmarkMiniIcon size={14} color="#15803D" />
              <Text style={styles.markLoggedBtnText}>
                {isFertigationLogged ? 'Logged' : 'Mark logged'}
              </Text>
            </View>
          </TouchableOpacity>

          {/* 5. Workforce */}
          <View style={styles.moduleCard}>
            <View style={styles.moduleCardTop}>
              <View style={[styles.iconBadge, { backgroundColor: '#DCFCE7' }]}>
                <WorkforceUsersIcon size={20} color="#15803D" />
              </View>
              <View style={[styles.statusIndicatorDot, { backgroundColor: '#22C55E' }]} />
            </View>

            <View style={styles.moduleTextSection}>
              <Text style={styles.moduleTitle}>Workforce</Text>
              <Text style={styles.moduleDesc}>3 of 3 workers checked in today</Text>
            </View>

            <View style={styles.statusRowGreen}>
              <CheckmarkCircleIcon size={16} color="#15803D" />
              <Text style={styles.statusRowGreenText}>Up to date</Text>
            </View>
          </View>

          {/* 6. Livestock */}
          <View style={styles.moduleCard}>
            <View style={styles.moduleCardTop}>
              <View style={[styles.iconBadge, { backgroundColor: '#FFEDD5' }]}>
                <PawPrintIcon size={20} color="#EA580C" />
              </View>
              <View style={[styles.statusIndicatorDot, { backgroundColor: '#EF4444' }]} />
            </View>

            <View style={styles.moduleTextSection}>
              <Text style={styles.moduleTitle}>Livestock</Text>
              <Text style={styles.moduleDesc}>2 health checks due this week.</Text>
            </View>

            <TouchableOpacity
              style={styles.reviewNeededRow}
              activeOpacity={0.7}
              onPress={handleLivestockReview}
            >
              <Text style={styles.reviewNeededText}>Review needed</Text>
              <ChevronRightIcon size={14} color="#EA580C" />
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Full Width Card: Learning Hub ── */}
        <TouchableOpacity
          style={styles.learningHubCard}
          activeOpacity={0.8}
          onPress={handleLearningHub}
        >
          <View style={styles.learningHubIconBox}>
            <GraduationCapIcon size={22} color="#0284C7" />
          </View>

          <View style={styles.learningHubTextCol}>
            <View style={styles.learningHubTitleRow}>
              <Text style={styles.learningHubTitle}>Learning Hub</Text>
              <View style={styles.learningHubDot} />
            </View>
            <Text style={styles.learningHubSubtitle}>
              3 new posts in Tomato Growers group
            </Text>
          </View>

          <ChevronRightIcon size={18} color="#9CA3AF" />
        </TouchableOpacity>
      </ScrollView>

      {/* ── Modal: Log Farm Diary Entry ── */}
      <Modal
        visible={isDiaryModalOpen}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setIsDiaryModalOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>New Farm Diary Entry</Text>
                <Text style={styles.modalSub}>Great Earth Farm · 16 Jul 2026</Text>
              </View>
              <TouchableOpacity
                style={styles.modalCloseBtn}
                onPress={() => setIsDiaryModalOpen(false)}
              >
                <Text style={styles.modalCloseBtnText}>✕</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.fieldLabel}>Activity details or observation</Text>
            <TextInput
              style={styles.diaryTextInput}
              multiline
              numberOfLines={4}
              placeholder="E.g. Weeding completed in Zone 1. Soil moisture optimal after morning drip..."
              placeholderTextColor="#9CA3AF"
              value={diaryNote}
              onChangeText={setDiaryNote}
            />

            <View style={styles.modalActionRow}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setIsDiaryModalOpen(false)}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.saveBtn} onPress={handleSaveDiary}>
                <Text style={styles.saveBtnText}>Save Entry</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// ─────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  topHeader: {
    backgroundColor: '#1B5E20',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 18,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleCol: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    color: '#C8E6C9',
    marginTop: 2,
  },
  summaryStatsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  summaryStatCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  summaryStatNumber: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  summaryStatLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#E8F5E9',
    marginTop: 2,
  },

  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 40,
  },

  /* Attention Banner */
  attentionBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 16,
    padding: 14,
    gap: 12,
    marginBottom: 16,
  },
  attentionContent: {
    flex: 1,
  },
  attentionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#78350F',
  },
  attentionSubtitle: {
    fontSize: 12,
    color: '#92400E',
    marginTop: 2,
  },

  /* 2-Column Modules Grid */
  modulesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  moduleCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 14,
    minHeight: 180,
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  moduleCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  iconBadge: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusIndicatorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 4,
  },
  moduleTextSection: {
    marginVertical: 10,
  },
  moduleTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
  },
  moduleDesc: {
    fontSize: 12,
    color: '#6B7280',
    lineHeight: 16,
    marginTop: 4,
  },

  /* Card Bottom Actions */
  logEntryBtn: {
    backgroundColor: '#15803D',
    borderRadius: 10,
    paddingVertical: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logEntryBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  weatherRiskPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#EFF6FF',
    borderRadius: 10,
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  weatherRiskText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1D4ED8',
  },
  producePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#E8F5E9',
    borderRadius: 10,
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  producePillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1B5E20',
  },
  markLoggedBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1.5,
    borderColor: '#15803D',
    borderRadius: 10,
    paddingVertical: 8,
  },
  markLoggedBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#15803D',
  },
  statusRowGreen: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
  },
  statusRowGreenText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#15803D',
  },
  reviewNeededRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
  },
  reviewNeededText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#EA580C',
  },

  /* Learning Hub Card */
  learningHubCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 16,
    gap: 12,
    marginTop: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  learningHubIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#E0F2FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  learningHubTextCol: {
    flex: 1,
  },
  learningHubTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  learningHubTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
  },
  learningHubDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#3B82F6',
  },
  learningHubSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },

  /* Modal */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 28,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  modalSub: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCloseBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#6B7280',
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 8,
  },
  diaryTextInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    color: '#111827',
    minHeight: 100,
    textAlignVertical: 'top',
    marginBottom: 16,
  },
  modalActionRow: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    alignItems: 'center',
  },
  cancelBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#374151',
  },
  saveBtn: {
    flex: 1.4,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#15803D',
    alignItems: 'center',
  },
  saveBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
