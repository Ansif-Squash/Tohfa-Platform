import React, { useState } from 'react';
import {
  Alert,
  Image,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Path, Circle, Rect, Line } from 'react-native-svg';
import { Icon } from '@tohfa/mobile-ui';
import { t } from '../../../../i18n/farmer';
import { authPalette as P } from '../../theme';

// ──────────────────────────────────────────────────────────────────────────
// SVG Icons
// ──────────────────────────────────────────────────────────────────────────

function ChevronLeft({ size = 20, color = P.ink }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M15 19L8 12L15 5" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function PencilIcon({ size = 18, color = P.primary }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function CameraIcon({ size = 16, color = P.white }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Circle cx="12" cy="13" r="4" stroke={color} strokeWidth="2" />
    </Svg>
  );
}

function UserIcon({ size = 18, color = P.twGray400 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="8" r="4" stroke={color} strokeWidth="2" />
      <Path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function CalendarIcon({ size = 18, color = P.twGray400 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="4" width="18" height="17" rx="3" stroke={color} strokeWidth="2" />
      <Line x1="3" y1="9" x2="21" y2="9" stroke={color} strokeWidth="2" />
      <Line x1="8" y1="2" x2="8" y2="5" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="16" y1="2" x2="16" y2="5" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function CardIcon({ size = 18, color = P.twGray400 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="2" y="5" width="20" height="14" rx="3" stroke={color} strokeWidth="2" />
      <Line x1="2" y1="10" x2="22" y2="10" stroke={color} strokeWidth="2" />
    </Svg>
  );
}

function PhoneIcon({ size = 18, color = P.twGray400 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 1.27h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.68 2.81a2 2 0 0 1-.45 2.11L7.91 9a16 16 0 0 0 6.09 6.09l1.09-1.09a2 2 0 0 1 2.11-.45c.91.32 1.85.55 2.81.68a2 2 0 0 1 1.72 2.03z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function PhonePlusIcon({ size = 18, color = P.twGray400 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 1.27h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.68 2.81a2 2 0 0 1-.45 2.11L7.91 9a16 16 0 0 0 6.09 6.09l1.09-1.09a2 2 0 0 1 2.11-.45c.91.32 1.85.55 2.81.68a2 2 0 0 1 1.72 2.03z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Line x1="19" y1="1" x2="19" y2="7" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="16" y1="4" x2="22" y2="4" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function MailIcon({ size = 18, color = P.twGray400 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="2" y="4" width="20" height="16" rx="3" stroke={color} strokeWidth="2" />
      <Path d="M2 8l10 7 10-7" stroke={color} strokeWidth="2" strokeLinejoin="round" />
    </Svg>
  );
}

function HomeIcon({ size = 18, color = P.twGray400 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z" stroke={color} strokeWidth="2" strokeLinejoin="round" />
      <Path d="M9 21V12h6v9" stroke={color} strokeWidth="2" strokeLinejoin="round" />
    </Svg>
  );
}

function TrendingUpIcon({ size = 18, color = P.twGray400 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M23 6l-9.5 9.5-5-5L1 18" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M17 6h6v6" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function LeafIcon({ size = 18, color = P.twGray400 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M17 8C8 10 5.9 16.17 3.82 19.34A1 1 0 0 0 5 21c3-.25 9-2 12-7 2.5-4 1-10 0-6z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M3.82 19.34C8 18 15 16 22 4" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

// ──────────────────────────────────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────────────────────────────────

interface PersonalData {
  fullName: string;
  dob: string;
  gender: string;
  aadhaar: string;
  mobile: string;
  altMobile: string;
  email: string;
  address: string;
  yearsInOrganic: string;
  farmingType: string;
}

export interface PersonalDetailsScreenProps {
  onBack: () => void;
  initialData?: Partial<PersonalData>;
}

// ──────────────────────────────────────────────────────────────────────────
// Main Screen
// ──────────────────────────────────────────────────────────────────────────

export function PersonalDetailsScreen({
  onBack,
  initialData,
}: PersonalDetailsScreenProps): React.JSX.Element {
  const [data, setData] = useState<PersonalData>({
    fullName: initialData?.fullName ?? 'Kumar',
    dob: initialData?.dob ?? '12 Jun 1985',
    gender: initialData?.gender ?? 'Male',
    aadhaar: initialData?.aadhaar ?? 'XXXX XXXX 4210',
    mobile: initialData?.mobile ?? '+91 98765 43210',
    altMobile: initialData?.altMobile ?? '+91 91234 56780',
    email: initialData?.email ?? 'kumar@example.com',
    address: initialData?.address ?? 'Kotagiri Village, Kotagiri Taluk, The Nilgiris',
    yearsInOrganic: initialData?.yearsInOrganic ?? '14 years',
    farmingType: initialData?.farmingType ?? 'Organic',
  });

  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState<PersonalData>(data);
  const [saving, setSaving] = useState(false);

  const startEdit = () => {
    setDraft({ ...data });
    setIsEditing(true);
  };

  const cancelEdit = () => setIsEditing(false);

  const saveEdit = async () => {
    setSaving(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 500));
      setData({ ...draft });
      setIsEditing(false);
    } catch {
      Alert.alert(t('farmer.profile.personal.saveErrorTitle'), t('error.generic'));
    } finally {
      setSaving(false);
    }
  };

  // ── Field helpers ──
  const field = (
    key: keyof PersonalData,
    placeholder: string,
    opts?: { keyboardType?: 'default' | 'email-address' | 'phone-pad' | 'numeric'; multiline?: boolean; autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters' },
  ) =>
    isEditing ? (
      <TextInput
        style={[styles.editInput, opts?.multiline && { minHeight: 52 }]}
        value={draft[key]}
        onChangeText={(v) => setDraft((d) => ({ ...d, [key]: v }))}
        placeholder={placeholder}
        keyboardType={opts?.keyboardType ?? 'default'}
        autoCapitalize={opts?.autoCapitalize ?? 'sentences'}
        multiline={opts?.multiline}
        textAlignVertical={opts?.multiline ? 'top' : 'center'}
      />
    ) : (
      <Text style={styles.detailValue}>{data[key]}</Text>
    );

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar barStyle="dark-content" backgroundColor={P.white} />

      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack} accessibilityRole="button" accessibilityLabel={t('farmer.profile.personal.a11yBack')} activeOpacity={0.7}>
          <ChevronLeft />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>{t('farmer.profile.personal.title')}</Text>
          <Text style={styles.headerSubtitle}>{t('farmer.profile.personal.subtitle')}</Text>
        </View>

        <TouchableOpacity style={styles.editBtn} onPress={isEditing ? saveEdit : startEdit} accessibilityRole="button" accessibilityLabel={isEditing ? t('farmer.common.save') : t('farmer.common.edit')} activeOpacity={0.7} disabled={saving}>
          {isEditing ? (
            <Text style={styles.editBtnSaveText}>{saving ? '…' : t('farmer.common.save')}</Text>
          ) : (
            <PencilIcon />
          )}
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {/* ── Profile Hero ── */}
        <View style={styles.profileHero}>
          <View style={styles.avatarWrap}>
            <Image source={require('../../assets/farmer-kumar.jpg')} style={styles.avatar} resizeMode="cover" />
            <TouchableOpacity style={styles.cameraBadge} activeOpacity={0.8} accessibilityLabel={t('farmer.profile.a11y.editPhoto')}>
              <CameraIcon />
            </TouchableOpacity>
          </View>
          <Text style={styles.heroName}>{data.fullName}</Text>
          <Text style={styles.heroSub}>{t('farmer.profile.personal.heroRole', { location: 'Kotagiri' })}</Text>
        </View>

        {/* ── IDENTITY ── */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionLabel}>{t('farmer.profile.personal.sectionIdentity')}</Text>

          {/* Full Name */}
          <View style={styles.detailRow}>
            <View style={styles.detailIcon}><UserIcon /></View>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>{t('farmer.profile.fullName')}</Text>
              {field('fullName', t('farmer.profile.fullName'), { autoCapitalize: 'words' })}
            </View>
          </View>

          <View style={styles.rowDivider} />

          {/* DOB + Gender (side by side) */}
          <View style={styles.detailRowSplit}>
            <View style={[styles.splitCell, { borderRightWidth: 1, borderRightColor: P.twGray100 }]}>
              <View style={styles.detailIcon}><CalendarIcon /></View>
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>{t('farmer.profile.dob')}</Text>
                {field('dob', t('farmer.profile.dobPlaceholder'))}
              </View>
            </View>
            <View style={styles.splitCell}>
              <View style={[styles.detailIcon, { marginLeft: 12 }]}>
                <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                  <Circle cx="8" cy="7" r="3.5" stroke={P.twGray400} strokeWidth="2" />
                  <Path d="M2 20c0-3.3 2.7-6 6-6s6 2.7 6 6" stroke={P.twGray400} strokeWidth="2" strokeLinecap="round" />
                  <Circle cx="17" cy="7" r="3.5" stroke={P.twGray400} strokeWidth="2" />
                  <Path d="M13 20c0-3.3 2.7-6 4-6" stroke={P.twGray400} strokeWidth="2" strokeLinecap="round" />
                </Svg>
              </View>
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>{t('farmer.profile.personal.genderLabel')}</Text>
                {field('gender', t('farmer.profile.personal.genderPlaceholder'))}
              </View>
            </View>
          </View>

          <View style={styles.rowDivider} />

          {/* Aadhaar – always locked */}
          <View style={[styles.detailRow, styles.detailRowLast]}>
            <View style={styles.detailIcon}><CardIcon /></View>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>{t('farmer.profile.aadhaar')}</Text>
              <Text style={styles.detailValue}>{data.aadhaar}</Text>
            </View>
            <View style={styles.lockedBadge}>
              <Icon name="lock" size={11} color={P.twGray500} style={styles.lockedBadgeIcon} />
              <Text style={styles.lockedBadgeText}>{t('farmer.profile.personal.locked')}</Text>
            </View>
          </View>
        </View>

        {/* ── CONTACT ── */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionLabel}>{t('farmer.profile.personal.sectionContact')}</Text>

          {/* Mobile – verified, not editable */}
          <View style={styles.detailRow}>
            <View style={styles.detailIcon}><PhoneIcon /></View>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>{t('farmer.profile.personal.mobileNumber')}</Text>
              <Text style={styles.detailValue}>{data.mobile}</Text>
            </View>
            <View style={styles.verifiedBadge}>
              <Text style={styles.verifiedBadgeText}>✓ {t('farmer.profile.personal.verified')}</Text>
            </View>
          </View>

          <View style={styles.rowDivider} />

          {/* Alternate Mobile */}
          <View style={styles.detailRow}>
            <View style={styles.detailIcon}><PhonePlusIcon /></View>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>{t('farmer.profile.personal.altMobile')}</Text>
              {field('altMobile', t('farmer.profile.personal.altMobilePlaceholder'), { keyboardType: 'phone-pad', autoCapitalize: 'none' })}
            </View>
          </View>

          <View style={styles.rowDivider} />

          {/* Email */}
          <View style={styles.detailRow}>
            <View style={styles.detailIcon}><MailIcon /></View>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>{t('farmer.profile.personal.email')}</Text>
              {field('email', t('farmer.profile.personal.emailPlaceholder'), { keyboardType: 'email-address', autoCapitalize: 'none' })}
            </View>
          </View>

          <View style={styles.rowDivider} />

          {/* Address */}
          <View style={[styles.detailRow, styles.detailRowLast]}>
            <View style={styles.detailIcon}><HomeIcon /></View>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>{t('farmer.profile.personal.addressLabel')}</Text>
              {field('address', t('farmer.profile.farmLocationPlaceholder'), { multiline: true })}
            </View>
          </View>
        </View>

        {/* ── FARMING BACKGROUND ── */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionLabel}>{t('farmer.profile.personal.sectionFarmingBackground')}</Text>

          <View style={styles.detailRow}>
            <View style={styles.detailIcon}><TrendingUpIcon /></View>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>{t('farmer.profile.yearsInOrganicLabel')}</Text>
              {field('yearsInOrganic', t('farmer.profile.personal.yearsInOrganicPlaceholder'), { keyboardType: 'numeric' })}
            </View>
          </View>

          <View style={styles.rowDivider} />

          <View style={[styles.detailRow, styles.detailRowLast]}>
            <View style={styles.detailIcon}><LeafIcon /></View>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>{t('farmer.profile.personal.typeOfFarming')}</Text>
              {field('farmingType', t('farmer.profile.personal.farmingTypePlaceholder'))}
            </View>
          </View>
        </View>

        {isEditing && (
          <Pressable style={styles.cancelBtn} onPress={cancelEdit}>
            <Text style={styles.cancelBtnText}>{t('farmer.common.cancel')}</Text>
          </Pressable>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ──────────────────────────────────────────────────────────────────────────
// Styles
// ──────────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: P.paleStoneBg },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: P.white,
    borderBottomWidth: 1,
    borderBottomColor: P.surfaceMuted,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    borderWidth: 1, borderColor: P.twGray200,
    backgroundColor: P.white,
    alignItems: 'center', justifyContent: 'center',
  },
  headerCenter: { flex: 1, paddingLeft: 12 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: P.ink, lineHeight: 22 },
  headerSubtitle: { fontSize: 12, color: P.twGray500, marginTop: 1 },
  editBtn: {
    width: 40, height: 40, borderRadius: 20,
    borderWidth: 1, borderColor: P.twEmerald100,
    backgroundColor: P.twGreen50,
    alignItems: 'center', justifyContent: 'center',
  },
  editBtnSaveText: { fontSize: 13, fontWeight: '700', color: P.primary },

  scrollContent: { paddingBottom: 32 },

  profileHero: {
    alignItems: 'center',
    paddingTop: 28, paddingBottom: 20,
    backgroundColor: P.white,
    borderBottomWidth: 1, borderBottomColor: P.surfaceMuted,
  },
  avatarWrap: { position: 'relative', marginBottom: 12 },
  avatar: {
    width: 88, height: 88, borderRadius: 44,
    borderWidth: 3, borderColor: P.white,
  },
  cameraBadge: {
    position: 'absolute', bottom: 2, right: 2,
    width: 26, height: 26, borderRadius: 13,
    backgroundColor: P.primary,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: P.white,
  },
  heroName: { fontSize: 22, fontWeight: '700', color: P.twGray900 },
  heroSub: { fontSize: 13, color: P.twGray500, marginTop: 2 },

  sectionCard: {
    backgroundColor: P.white,
    borderRadius: 16,
    marginHorizontal: 16, marginTop: 16,
    paddingBottom: 4,
    overflow: 'hidden',
    shadowColor: P.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  sectionLabel: {
    fontSize: 11, fontWeight: '700', color: P.stoneMuted,
    letterSpacing: 0.8,
    paddingHorizontal: 16, paddingTop: 14, paddingBottom: 10,
  },

  detailRow: {
    flexDirection: 'row', alignItems: 'flex-start',
    paddingHorizontal: 16, paddingVertical: 12,
  },
  detailRowLast: { paddingBottom: 14 },
  detailRowSplit: { flexDirection: 'row', paddingVertical: 4 },
  splitCell: {
    flex: 1, flexDirection: 'row', alignItems: 'flex-start',
    paddingHorizontal: 16, paddingVertical: 8,
  },
  detailIcon: { marginTop: 2, marginRight: 12 },
  detailContent: { flex: 1 },
  detailLabel: { fontSize: 12, color: P.twGray400, fontWeight: '500', marginBottom: 2 },
  detailValue: { fontSize: 15, fontWeight: '600', color: P.twGray900, lineHeight: 21 },
  rowDivider: { height: 1, backgroundColor: P.twGray100, marginHorizontal: 16 },

  editInput: {
    fontSize: 15, fontWeight: '600', color: P.twGray900,
    borderBottomWidth: 1.5, borderBottomColor: P.twGreen500,
    paddingVertical: 2, paddingHorizontal: 0,
    textAlignVertical: 'top',
  },

  lockedBadge: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: P.twGray100, borderRadius: 8,
    paddingHorizontal: 8, paddingVertical: 4,
    gap: 4, marginLeft: 8,
  },
  lockedBadgeIcon: { fontSize: 11 },
  lockedBadgeText: { fontSize: 11, fontWeight: '600', color: P.twGray500 },

  verifiedBadge: {
    backgroundColor: P.twGreen100, borderRadius: 10,
    paddingHorizontal: 10, paddingVertical: 4,
    marginLeft: 8,
  },
  verifiedBadgeText: { fontSize: 12, fontWeight: '700', color: P.twGreen600 },

  cancelBtn: {
    marginHorizontal: 16, marginTop: 16,
    paddingVertical: 14, borderRadius: 12,
    borderWidth: 1.5, borderColor: P.twGray200,
    alignItems: 'center', backgroundColor: P.white,
  },
  cancelBtnText: { fontSize: 15, fontWeight: '600', color: P.twGray500 },
});
