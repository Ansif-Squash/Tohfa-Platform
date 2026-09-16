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
  Platform,
} from 'react-native';
import Svg, { Path, Circle, Rect, Line } from 'react-native-svg';
import DateTimePicker from '@react-native-community/datetimepicker';

// ──────────────────────────────────────────────────────────────────────────
// SVG Icons
// ──────────────────────────────────────────────────────────────────────────

function ChevronLeft({ size = 20, color = '#1A2E1A' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M15 19L8 12L15 5" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function PencilIcon({ size = 18, color = '#2E7D32' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function CameraIcon({ size = 16, color = '#FFFFFF' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Circle cx="12" cy="13" r="4" stroke={color} strokeWidth="2" />
    </Svg>
  );
}

function UserIcon({ size = 18, color = '#9CA3AF' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="8" r="4" stroke={color} strokeWidth="2" />
      <Path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function CalendarIcon({ size = 18, color = '#9CA3AF' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="4" width="18" height="17" rx="3" stroke={color} strokeWidth="2" />
      <Line x1="3" y1="9" x2="21" y2="9" stroke={color} strokeWidth="2" />
      <Line x1="8" y1="2" x2="8" y2="5" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="16" y1="2" x2="16" y2="5" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function CardIcon({ size = 18, color = '#9CA3AF' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="2" y="5" width="20" height="14" rx="3" stroke={color} strokeWidth="2" />
      <Line x1="2" y1="10" x2="22" y2="10" stroke={color} strokeWidth="2" />
    </Svg>
  );
}

function PhoneIcon({ size = 18, color = '#9CA3AF' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 1.27h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.68 2.81a2 2 0 0 1-.45 2.11L7.91 9a16 16 0 0 0 6.09 6.09l1.09-1.09a2 2 0 0 1 2.11-.45c.91.32 1.85.55 2.81.68a2 2 0 0 1 1.72 2.03z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function PhonePlusIcon({ size = 18, color = '#9CA3AF' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 1.27h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.68 2.81a2 2 0 0 1-.45 2.11L7.91 9a16 16 0 0 0 6.09 6.09l1.09-1.09a2 2 0 0 1 2.11-.45c.91.32 1.85.55 2.81.68a2 2 0 0 1 1.72 2.03z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Line x1="19" y1="1" x2="19" y2="7" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="16" y1="4" x2="22" y2="4" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function MailIcon({ size = 18, color = '#9CA3AF' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="2" y="4" width="20" height="16" rx="3" stroke={color} strokeWidth="2" />
      <Path d="M2 8l10 7 10-7" stroke={color} strokeWidth="2" strokeLinejoin="round" />
    </Svg>
  );
}

function HomeIcon({ size = 18, color = '#9CA3AF' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z" stroke={color} strokeWidth="2" strokeLinejoin="round" />
      <Path d="M9 21V12h6v9" stroke={color} strokeWidth="2" strokeLinejoin="round" />
    </Svg>
  );
}

function TrendingUpIcon({ size = 18, color = '#9CA3AF' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M23 6l-9.5 9.5-5-5L1 18" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M17 6h6v6" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function LeafIcon({ size = 18, color = '#9CA3AF' }: { size?: number; color?: string }) {
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
  const [showDatePicker, setShowDatePicker] = useState(false);

  const parseDate = (dateString: string) => {
    const d = new Date(dateString);
    return isNaN(d.getTime()) ? new Date() : d;
  };

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
      Alert.alert('Error', 'Could not save. Please try again.');
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
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack} accessibilityRole="button" accessibilityLabel="Go back" activeOpacity={0.7}>
          <ChevronLeft />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Personal Details</Text>
          <Text style={styles.headerSubtitle}>Identity &amp; contact info</Text>
        </View>

        <TouchableOpacity style={styles.editBtn} onPress={isEditing ? saveEdit : startEdit} accessibilityRole="button" accessibilityLabel={isEditing ? 'Save' : 'Edit'} activeOpacity={0.7} disabled={saving}>
          {isEditing ? (
            <Text style={styles.editBtnSaveText}>{saving ? '…' : 'Save'}</Text>
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
            <TouchableOpacity style={styles.cameraBadge} activeOpacity={0.8} accessibilityLabel="Change photo">
              <CameraIcon />
            </TouchableOpacity>
          </View>
          <Text style={styles.heroName}>{data.fullName}</Text>
          <Text style={styles.heroSub}>TOFHA Farmer · Kotagiri</Text>
        </View>

        {/* ── IDENTITY ── */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionLabel}>IDENTITY</Text>

          {/* Full Name */}
          <View style={styles.detailRow}>
            <View style={styles.detailIcon}><UserIcon /></View>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Full Name</Text>
              {field('fullName', 'Full Name', { autoCapitalize: 'words' })}
            </View>
          </View>

          <View style={styles.rowDivider} />

          {/* DOB + Gender (side by side) */}
          <View style={styles.detailRowSplit}>
            <View style={[styles.splitCell, { borderRightWidth: 1, borderRightColor: '#F0F0F0' }]}>
              <View style={styles.detailIcon}><CalendarIcon /></View>
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Date of Birth</Text>
                {isEditing ? (
                  <TouchableOpacity onPress={() => setShowDatePicker(true)}>
                    <View pointerEvents="none">
                      <TextInput
                        style={styles.editInput}
                        value={draft.dob}
                        placeholder="DD Mon YYYY"
                        editable={false}
                      />
                    </View>
                  </TouchableOpacity>
                ) : (
                  <Text style={styles.detailValue}>{data.dob}</Text>
                )}
              </View>
            </View>
            <View style={styles.splitCell}>
              <View style={[styles.detailIcon, { marginLeft: 12 }]}>
                <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                  <Circle cx="8" cy="7" r="3.5" stroke="#9CA3AF" strokeWidth="2" />
                  <Path d="M2 20c0-3.3 2.7-6 6-6s6 2.7 6 6" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" />
                  <Circle cx="17" cy="7" r="3.5" stroke="#9CA3AF" strokeWidth="2" />
                  <Path d="M13 20c0-3.3 2.7-6 4-6" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" />
                </Svg>
              </View>
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Gender</Text>
                {field('gender', 'Male / Female')}
              </View>
            </View>
          </View>

          <View style={styles.rowDivider} />

          {/* Aadhaar – always locked */}
          <View style={[styles.detailRow, styles.detailRowLast]}>
            <View style={styles.detailIcon}><CardIcon /></View>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Aadhaar Number</Text>
              <Text style={styles.detailValue}>{data.aadhaar}</Text>
            </View>
            <View style={styles.lockedBadge}>
              <Text style={styles.lockedBadgeIcon}>🔒</Text>
              <Text style={styles.lockedBadgeText}>Locked</Text>
            </View>
          </View>
        </View>

        {/* ── CONTACT ── */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionLabel}>CONTACT</Text>

          {/* Mobile – verified, not editable */}
          <View style={styles.detailRow}>
            <View style={styles.detailIcon}><PhoneIcon /></View>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Mobile Number</Text>
              <Text style={styles.detailValue}>{data.mobile}</Text>
            </View>
            <View style={styles.verifiedBadge}>
              <Text style={styles.verifiedBadgeText}>✓ Verified</Text>
            </View>
          </View>

          <View style={styles.rowDivider} />

          {/* Alternate Mobile */}
          <View style={styles.detailRow}>
            <View style={styles.detailIcon}><PhonePlusIcon /></View>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Alternate Mobile</Text>
              {field('altMobile', '+91 XXXXX XXXXX', { keyboardType: 'phone-pad', autoCapitalize: 'none' })}
            </View>
          </View>

          <View style={styles.rowDivider} />

          {/* Email */}
          <View style={styles.detailRow}>
            <View style={styles.detailIcon}><MailIcon /></View>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Email</Text>
              {field('email', 'name@example.com', { keyboardType: 'email-address', autoCapitalize: 'none' })}
            </View>
          </View>

          <View style={styles.rowDivider} />

          {/* Address */}
          <View style={[styles.detailRow, styles.detailRowLast]}>
            <View style={styles.detailIcon}><HomeIcon /></View>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Address</Text>
              {field('address', 'Village, Taluk, District', { multiline: true })}
            </View>
          </View>
        </View>

        {/* ── FARMING BACKGROUND ── */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionLabel}>FARMING BACKGROUND</Text>

          <View style={styles.detailRow}>
            <View style={styles.detailIcon}><TrendingUpIcon /></View>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Years in Organic Farming</Text>
              {field('yearsInOrganic', 'e.g. 14 years', { keyboardType: 'numeric' })}
            </View>
          </View>

          <View style={styles.rowDivider} />

          <View style={[styles.detailRow, styles.detailRowLast]}>
            <View style={styles.detailIcon}><LeafIcon /></View>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Type of Farming</Text>
              {field('farmingType', 'Organic / Conventional')}
            </View>
          </View>
        </View>

        {isEditing && (
          <Pressable style={styles.cancelBtn} onPress={cancelEdit}>
            <Text style={styles.cancelBtnText}>Cancel</Text>
          </Pressable>
        )}

        {showDatePicker && (
          <DateTimePicker
            value={parseDate(draft.dob)}
            mode="date"
            display="default"
            onChange={(event, selectedDate) => {
              setShowDatePicker(Platform.OS === 'ios');
              if (selectedDate) {
                const day = selectedDate.getDate().toString().padStart(2, '0');
                const month = selectedDate.toLocaleString('default', { month: 'short' });
                const year = selectedDate.getFullYear();
                setDraft(d => ({ ...d, dob: `${day} ${month} ${year}` }));
              }
            }}
          />
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
  screen: { flex: 1, backgroundColor: '#F5F5F3' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    borderWidth: 1, borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    alignItems: 'center', justifyContent: 'center',
  },
  headerCenter: { flex: 1, paddingLeft: 12 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#1A2E1A', lineHeight: 22 },
  headerSubtitle: { fontSize: 12, color: '#6B7280', marginTop: 1 },
  editBtn: {
    width: 40, height: 40, borderRadius: 20,
    borderWidth: 1, borderColor: '#D1FAE5',
    backgroundColor: '#F0FDF4',
    alignItems: 'center', justifyContent: 'center',
  },
  editBtnSaveText: { fontSize: 13, fontWeight: '700', color: '#2E7D32' },

  scrollContent: { paddingBottom: 32 },

  profileHero: {
    alignItems: 'center',
    paddingTop: 28, paddingBottom: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1, borderBottomColor: '#F0F0F0',
  },
  avatarWrap: { position: 'relative', marginBottom: 12 },
  avatar: {
    width: 88, height: 88, borderRadius: 44,
    borderWidth: 3, borderColor: '#FFFFFF',
  },
  cameraBadge: {
    position: 'absolute', bottom: 2, right: 2,
    width: 26, height: 26, borderRadius: 13,
    backgroundColor: '#2E7D32',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: '#FFFFFF',
  },
  heroName: { fontSize: 22, fontWeight: '700', color: '#111827' },
  heroSub: { fontSize: 13, color: '#6B7280', marginTop: 2 },

  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginHorizontal: 16, marginTop: 16,
    paddingBottom: 4,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  sectionLabel: {
    fontSize: 11, fontWeight: '700', color: '#8A927F',
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
  detailLabel: { fontSize: 12, color: '#9CA3AF', fontWeight: '500', marginBottom: 2 },
  detailValue: { fontSize: 15, fontWeight: '600', color: '#111827', lineHeight: 21 },
  rowDivider: { height: 1, backgroundColor: '#F3F4F6', marginHorizontal: 16 },

  editInput: {
    fontSize: 15, fontWeight: '600', color: '#111827',
    borderBottomWidth: 1.5, borderBottomColor: '#22C55E',
    paddingVertical: 2, paddingHorizontal: 0,
    textAlignVertical: 'top',
  },

  lockedBadge: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#F3F4F6', borderRadius: 8,
    paddingHorizontal: 8, paddingVertical: 4,
    gap: 4, marginLeft: 8,
  },
  lockedBadgeIcon: { fontSize: 11 },
  lockedBadgeText: { fontSize: 11, fontWeight: '600', color: '#6B7280' },

  verifiedBadge: {
    backgroundColor: '#DCFCE7', borderRadius: 10,
    paddingHorizontal: 10, paddingVertical: 4,
    marginLeft: 8,
  },
  verifiedBadgeText: { fontSize: 12, fontWeight: '700', color: '#16A34A' },

  cancelBtn: {
    marginHorizontal: 16, marginTop: 16,
    paddingVertical: 14, borderRadius: 12,
    borderWidth: 1.5, borderColor: '#E5E7EB',
    alignItems: 'center', backgroundColor: '#FFFFFF',
  },
  cancelBtnText: { fontSize: 15, fontWeight: '600', color: '#6B7280' },
});
