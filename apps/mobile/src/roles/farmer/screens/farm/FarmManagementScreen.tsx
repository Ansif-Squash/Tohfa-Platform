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
import { t } from '../../../../i18n/farmer';
import { authPalette as P, colors } from '../../theme';

// ─────────────────────────────────────────────
// Inline SVG Icons
// ─────────────────────────────────────────────

function ArrowBackIcon({ size = 20, color = P.white }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M19 12H5M5 12L12 19M5 12L12 5" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function ChevronRightIcon({ size = 18, color = P.twGray400 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M9 18l6-6-6-6" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function ExclamationCircleIcon({ size = 24 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" fill={P.twOrange600} />
      <Line x1="12" y1="7" x2="12" y2="13" stroke={P.white} strokeWidth="2" strokeLinecap="round" />
      <Circle cx="12" cy="17" r="1.2" fill={P.white} />
    </Svg>
  );
}

function PencilEditIcon({ size = 20, color = P.twOrange600 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function CloudWeatherIcon({ size = 22, color = P.sky600 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function SnowflakeIcon({ size = 12, color = P.sky600 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Line x1="12" y1="2" x2="12" y2="22" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="2" y1="12" x2="22" y2="12" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="4.93" y1="4.93" x2="19.07" y2="19.07" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="19.07" y1="4.93" x2="4.93" y2="19.07" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function PlantSproutIcon({ size = 20, color = P.twGreen700 }: { size?: number; color?: string }) {
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

function CalendarMiniIcon({ size = 12, color = P.deepGreen }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="4" width="18" height="18" rx="2" stroke={color} strokeWidth="2" />
      <Line x1="16" y1="2" x2="16" y2="6" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="8" y1="2" x2="8" y2="6" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="3" y1="10" x2="21" y2="10" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function FlaskBeakerIcon({ size = 20, color = P.twOrange600 }: { size?: number; color?: string }) {
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

function WorkforceUsersIcon({ size = 20, color = P.twGreen700 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Circle cx="9" cy="7" r="4" stroke={color} strokeWidth="2" />
      <Path d="M23 21v-2a4 4 0 0 0-3-3.87" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Path d="M16 3.13a4 4 0 0 1 0 7.75" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function CheckmarkCircleIcon({ size = 16, color = P.twGreen700 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2" />
      <Path d="M8 12l2.5 2.5L16 9" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function PawPrintIcon({ size = 20, color = P.twOrange600 }: { size?: number; color?: string }) {
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

function GraduationCapIcon({ size = 22, color = P.sky600 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M22 10v6M2 10l10-5 10 5-10 5z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M6 12v5c0 2 3 4 6 4s6-2 6-4v-5" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function CheckmarkMiniIcon({ size = 14, color = P.twGreen700 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M20 6L9 17l-5-5" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

// ─────────────────────────────────────────────
// Component Implementation
//
// Specification gap: none of this module's data (diary entries, fertigation
// status, livestock checks, learning-hub posts) has a backing endpoint in
// `../../api/farmer` or `docs/openapi.yaml` yet -- every module tile below is
// local state seeded with the same mock content farm-rating shipped.
// ─────────────────────────────────────────────

interface FarmManagementScreenProps {
  onBack?: () => void;
  onNavigateToAudits?: () => void;
  onNavigateToDiary?: () => void;
}

export function FarmManagementScreen({
  onBack,
  onNavigateToAudits,
  onNavigateToDiary,
}: FarmManagementScreenProps): React.JSX.Element {
  const [isDiaryModalOpen, setIsDiaryModalOpen] = useState(false);
  const [diaryNote, setDiaryNote] = useState('');
  const [isFertigationLogged, setIsFertigationLogged] = useState(false);

  const handleSaveDiary = () => {
    if (!diaryNote.trim()) {
      Alert.alert(t('farmer.farmManagement.diary.requiredTitle'), t('farmer.farmManagement.diary.requiredBody'));
      return;
    }
    Alert.alert(t('farmer.farmManagement.diary.successTitle'), t('farmer.farmManagement.diary.successBody'));
    setIsDiaryModalOpen(false);
    setDiaryNote('');
  };

  const handleToggleFertigation = () => {
    setIsFertigationLogged(!isFertigationLogged);
    Alert.alert(
      !isFertigationLogged ? t('farmer.farmManagement.fertigation.loggedTitle') : t('farmer.farmManagement.fertigation.pendingTitle'),
      !isFertigationLogged
        ? t('farmer.farmManagement.fertigation.loggedBody')
        : t('farmer.farmManagement.fertigation.pendingBody'),
    );
  };

  const handleLivestockReview = () => {
    Alert.alert(t('farmer.farmManagement.livestock.alertTitle'), t('farmer.farmManagement.livestock.alertBody'));
  };

  const handleLearningHub = () => {
    Alert.alert(t('farmer.farmManagement.learningHub.alertTitle'), t('farmer.farmManagement.learningHub.alertBody'));
  };

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar barStyle="light-content" backgroundColor={P.deepGreen} />

      {/* ── Dark Green Header with Summary Stats ── */}
      <View style={styles.topHeader}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={onBack}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel={t('farmer.common.back')}
          >
            <ArrowBackIcon size={20} color={P.white} />
          </TouchableOpacity>
          <View style={styles.headerTitleCol}>
            <Text style={styles.headerTitle}>{t('farmer.farmManagement.title')}</Text>
            <Text style={styles.headerSubtitle}>{t('farmer.farmManagement.headerSubtitle', { date: 'Wed, 16 Jul 2026' })}</Text>
          </View>
        </View>

        {/* 3 Summary Stats Cards */}
        <View style={styles.summaryStatsRow}>
          <View style={styles.summaryStatCard}>
            <Text style={styles.summaryStatNumber}>3</Text>
            <Text style={styles.summaryStatLabel}>{t('farmer.farmManagement.stat.activeCrops')}</Text>
          </View>

          <View style={styles.summaryStatCard}>
            <Text style={styles.summaryStatNumber}>3</Text>
            <Text style={styles.summaryStatLabel}>{t('farmer.farmManagement.stat.workersToday')}</Text>
          </View>

          <TouchableOpacity style={styles.summaryStatCard} activeOpacity={0.8} onPress={onNavigateToAudits}>
            <Text style={styles.summaryStatNumber}>2</Text>
            <Text style={styles.summaryStatLabel}>{t('farmer.farmManagement.stat.certsValid')}</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* ── Attention Banner ── */}
        <TouchableOpacity style={styles.attentionBanner} activeOpacity={0.85} onPress={() => setIsDiaryModalOpen(true)}>
          <ExclamationCircleIcon size={24} />
          <View style={styles.attentionContent}>
            <Text style={styles.attentionTitle}>{t('farmer.farmManagement.attention.title', { count: 3 })}</Text>
            <Text style={styles.attentionSubtitle}>{t('farmer.farmManagement.attention.subtitle')}</Text>
          </View>
          <ChevronRightIcon size={18} color={P.twAmber800} />
        </TouchableOpacity>

        {/* ── Grid of Modules (2 Columns) ── */}
        <View style={styles.modulesGrid}>
          {/* 1. Farm Diary */}
          <View style={styles.moduleCard}>
            <View style={styles.moduleCardTop}>
              <View style={[styles.iconBadge, { backgroundColor: P.twOrange100 }]}>
                <PencilEditIcon size={20} color={P.twOrange600} />
              </View>
              <View style={[styles.statusIndicatorDot, { backgroundColor: P.twRed500 }]} />
            </View>

            <View style={styles.moduleTextSection}>
              <Text style={styles.moduleTitle}>{t('farmer.farmManagement.module.diary.title')}</Text>
              <Text style={styles.moduleDesc}>{t('farmer.farmManagement.module.diary.desc')}</Text>
            </View>

            <TouchableOpacity style={styles.logEntryBtn} activeOpacity={0.85} onPress={onNavigateToDiary}>
              <Text style={styles.logEntryBtnText}>{t('farmer.farmManagement.module.diary.title')}</Text>
            </TouchableOpacity>
          </View>

          {/* 2. Weather */}
          <View style={styles.moduleCard}>
            <View style={styles.moduleCardTop}>
              <View style={[styles.iconBadge, { backgroundColor: P.sky100 }]}>
                <CloudWeatherIcon size={22} color={P.sky600} />
              </View>
              <View style={[styles.statusIndicatorDot, { backgroundColor: P.twBlue500 }]} />
            </View>

            <View style={styles.moduleTextSection}>
              <Text style={styles.moduleTitle}>{t('farmer.weather.title')}</Text>
              <Text style={styles.moduleDesc}>18°C · {t('farmer.weather.cloudy')} · Kotagiri</Text>
            </View>

            <View style={styles.weatherRiskPill}>
              <SnowflakeIcon size={12} color={P.sky600} />
              <Text style={styles.weatherRiskText}>{t('farmer.farmManagement.module.weather.frostRisk')}</Text>
            </View>
          </View>

          {/* 3. Produce Calendar */}
          <View style={styles.moduleCard}>
            <View style={styles.moduleCardTop}>
              <View style={[styles.iconBadge, { backgroundColor: P.twGreen100 }]}>
                <PlantSproutIcon size={20} color={P.twGreen700} />
              </View>
              <View style={[styles.statusIndicatorDot, { backgroundColor: P.twBlue500 }]} />
            </View>

            <View style={styles.moduleTextSection}>
              <Text style={styles.moduleTitle}>{t('farmer.farmManagement.module.calendar.title')}</Text>
              <Text style={styles.moduleDesc}>{t('farmer.farmManagement.module.calendar.desc', { count: 3 })}</Text>
            </View>

            <View style={styles.producePill}>
              <CalendarMiniIcon size={12} color={P.deepGreen} />
              <Text style={styles.producePillText}>{t('farmer.farmManagement.module.calendar.harvestIn', { days: 8 })}</Text>
            </View>
          </View>

          {/* 4. Input Management */}
          <View style={styles.moduleCard}>
            <View style={styles.moduleCardTop}>
              <View style={[styles.iconBadge, { backgroundColor: P.twOrange100 }]}>
                <FlaskBeakerIcon size={20} color={P.twOrange600} />
              </View>
              <View style={[styles.statusIndicatorDot, { backgroundColor: isFertigationLogged ? P.twGreen500 : P.twRed500 }]} />
            </View>

            <View style={styles.moduleTextSection}>
              <Text style={styles.moduleTitle}>{t('farmer.farmManagement.module.input.title')}</Text>
              <Text style={styles.moduleDesc}>
                {isFertigationLogged
                  ? t('farmer.farmManagement.module.input.completed')
                  : t('farmer.farmManagement.module.input.due')}
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.markLoggedBtn, isFertigationLogged && { backgroundColor: P.twGreen50 }]}
              activeOpacity={0.8}
              onPress={handleToggleFertigation}
            >
              <CheckmarkMiniIcon size={14} color={P.twGreen700} />
              <Text style={styles.markLoggedBtnText}>
                {isFertigationLogged ? t('farmer.farmManagement.fertigation.loggedTitle') : t('farmer.farmManagement.module.input.markLogged')}
              </Text>
            </TouchableOpacity>
          </View>

          {/* 5. Workforce */}
          <View style={styles.moduleCard}>
            <View style={styles.moduleCardTop}>
              <View style={[styles.iconBadge, { backgroundColor: P.twGreen100 }]}>
                <WorkforceUsersIcon size={20} color={P.twGreen700} />
              </View>
              <View style={[styles.statusIndicatorDot, { backgroundColor: P.twGreen500 }]} />
            </View>

            <View style={styles.moduleTextSection}>
              <Text style={styles.moduleTitle}>{t('farmer.farmManagement.module.workforce.title')}</Text>
              <Text style={styles.moduleDesc}>{t('farmer.farmManagement.module.workforce.desc', { checkedIn: 3, total: 3 })}</Text>
            </View>

            <View style={styles.statusRowGreen}>
              <CheckmarkCircleIcon size={16} color={P.twGreen700} />
              <Text style={styles.statusRowGreenText}>{t('farmer.farmManagement.module.workforce.upToDate')}</Text>
            </View>
          </View>

          {/* 6. Livestock */}
          <View style={styles.moduleCard}>
            <View style={styles.moduleCardTop}>
              <View style={[styles.iconBadge, { backgroundColor: P.twOrange100 }]}>
                <PawPrintIcon size={20} color={P.twOrange600} />
              </View>
              <View style={[styles.statusIndicatorDot, { backgroundColor: P.twRed500 }]} />
            </View>

            <View style={styles.moduleTextSection}>
              <Text style={styles.moduleTitle}>{t('farmer.farmManagement.module.livestock.title')}</Text>
              <Text style={styles.moduleDesc}>{t('farmer.farmManagement.module.livestock.desc', { count: 2 })}</Text>
            </View>

            <TouchableOpacity style={styles.reviewNeededRow} activeOpacity={0.7} onPress={handleLivestockReview}>
              <Text style={styles.reviewNeededText}>{t('farmer.farmManagement.module.livestock.reviewNeeded')}</Text>
              <ChevronRightIcon size={14} color={P.twOrange600} />
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Full Width Card: Learning Hub ── */}
        <TouchableOpacity style={styles.learningHubCard} activeOpacity={0.8} onPress={handleLearningHub}>
          <View style={styles.learningHubIconBox}>
            <GraduationCapIcon size={22} color={P.sky600} />
          </View>

          <View style={styles.learningHubTextCol}>
            <View style={styles.learningHubTitleRow}>
              <Text style={styles.learningHubTitle}>{t('farmer.farmManagement.learningHub.title')}</Text>
              <View style={styles.learningHubDot} />
            </View>
            <Text style={styles.learningHubSubtitle}>{t('farmer.farmManagement.learningHub.subtitle', { count: 3 })}</Text>
          </View>

          <ChevronRightIcon size={18} color={P.twGray400} />
        </TouchableOpacity>
      </ScrollView>

      {/* ── Modal: Log Farm Diary Entry ── */}
      <Modal visible={isDiaryModalOpen} transparent={true} animationType="slide" onRequestClose={() => setIsDiaryModalOpen(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>{t('farmer.farmManagement.diary.modalTitle')}</Text>
                <Text style={styles.modalSub}>{t('farmer.farmManagement.diary.modalSub', { date: '16 Jul 2026' })}</Text>
              </View>
              <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setIsDiaryModalOpen(false)}>
                <Text style={styles.modalCloseBtnText}>✕</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.fieldLabel}>{t('farmer.farmManagement.diary.fieldLabel')}</Text>
            <TextInput
              style={styles.diaryTextInput}
              multiline
              numberOfLines={4}
              placeholder={t('farmer.farmManagement.diary.placeholder')}
              placeholderTextColor={P.twGray400}
              value={diaryNote}
              onChangeText={setDiaryNote}
            />

            <View style={styles.modalActionRow}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setIsDiaryModalOpen(false)}>
                <Text style={styles.cancelBtnText}>{t('farmer.common.cancel')}</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.saveBtn} onPress={handleSaveDiary}>
                <Text style={styles.saveBtnText}>{t('farmer.farmManagement.diary.saveEntry')}</Text>
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
    backgroundColor: P.lightSurfaceAlt,
  },
  topHeader: {
    backgroundColor: P.deepGreen,
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
    color: P.white,
  },
  headerSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    color: P.green100,
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
    color: P.white,
  },
  summaryStatLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.brandGreenLight,
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
    backgroundColor: P.twAmber50,
    borderWidth: 1,
    borderColor: P.twAmber200,
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
    color: P.twAmber900,
  },
  attentionSubtitle: {
    fontSize: 12,
    color: P.twAmber800,
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
    backgroundColor: P.white,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: P.twGray200,
    padding: 14,
    minHeight: 180,
    justifyContent: 'space-between',
    shadowColor: P.black,
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
    color: P.twGray900,
  },
  moduleDesc: {
    fontSize: 12,
    color: P.twGray500,
    lineHeight: 16,
    marginTop: 4,
  },

  /* Card Bottom Actions */
  logEntryBtn: {
    backgroundColor: P.twGreen700,
    borderRadius: 10,
    paddingVertical: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logEntryBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: P.white,
  },
  weatherRiskPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: P.twBlue50,
    borderRadius: 10,
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  weatherRiskText: {
    fontSize: 11,
    fontWeight: '700',
    color: P.twBlue700,
  },
  producePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.brandGreenLight,
    borderRadius: 10,
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  producePillText: {
    fontSize: 11,
    fontWeight: '700',
    color: P.deepGreen,
  },
  markLoggedBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1.5,
    borderColor: P.twGreen700,
    borderRadius: 10,
    paddingVertical: 8,
  },
  markLoggedBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: P.twGreen700,
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
    color: P.twGreen700,
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
    color: P.twOrange600,
  },

  /* Learning Hub Card */
  learningHubCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: P.white,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: P.twGray200,
    padding: 16,
    gap: 12,
    marginTop: 14,
    shadowColor: P.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  learningHubIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: P.sky100,
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
    color: P.twGray900,
  },
  learningHubDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: P.twBlue500,
  },
  learningHubSubtitle: {
    fontSize: 12,
    color: P.twGray500,
    marginTop: 2,
  },

  /* Modal */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: P.white,
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
    borderBottomColor: P.surfaceMuted,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: P.twGray900,
  },
  modalSub: {
    fontSize: 12,
    color: P.twGray500,
    marginTop: 2,
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: P.twGray100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCloseBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: P.twGray500,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: P.twGray700,
    marginBottom: 8,
  },
  diaryTextInput: {
    borderWidth: 1,
    borderColor: P.twGray300,
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    color: P.twGray900,
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
    borderColor: P.twGray300,
    alignItems: 'center',
  },
  cancelBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: P.twGray700,
  },
  saveBtn: {
    flex: 1.4,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: P.twGreen700,
    alignItems: 'center',
  },
  saveBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: P.white,
  },
});
