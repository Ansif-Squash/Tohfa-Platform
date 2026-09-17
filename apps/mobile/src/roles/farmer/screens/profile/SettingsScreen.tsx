import React, { useState } from 'react';
import {
  Alert,
  Modal,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { setLocale, type Locale } from '../../../../i18n/farmer';

// ── SVG Icons ────────────────────────────────────────────────────────────────

function ArrowBackIcon({ size = 20, color = '#1E5E2B' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M19 12H5M5 12L12 19M5 12L12 5"
        stroke={color}
        strokeWidth="2.4"
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
        d="M9 18L15 12L9 6"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function TranslateIcon({ size = 22, color = '#2E7D32' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M5 8h10M10 5v3M8 8c0 4-2 7.5-5 9M13 17c-2-2.5-3.5-5.5-4-9"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M15 19l4-9 4 9M16.5 16h5"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function BellIcon({ size = 22, color = '#2E7D32' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M13.73 21a2 2 0 0 1-3.46 0"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function DataStorageIcon({ size = 22, color = '#0284C7' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 6c0-1.657 3.582-3 8-3s8 1.343 8 3M4 6v6c0 1.657 3.582 3 8 3s8-1.343 8-3V6M4 6c0 1.657 3.582 3 8 3s8-1.343 8-3"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M4 12v6c0 1.657 3.582 3 8 3s8-1.343 8-3v-6"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function LockPasswordIcon({ size = 22, color = '#2E7D32' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="5" y="11" width="14" height="10" rx="2.5" stroke={color} strokeWidth="2" />
      <Path
        d="M8 11V7a4 4 0 1 1 8 0v4"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle cx="12" cy="16" r="1.5" fill={color} />
    </Svg>
  );
}

function MobilePhoneIcon({ size = 22, color = '#2E7D32' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="6" y="2" width="12" height="20" rx="3" stroke={color} strokeWidth="2" />
      <Path d="M11 18h2" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function HelpSupportIcon({ size = 22, color = '#2E7D32' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2" />
      <Path
        d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle cx="12" cy="17" r="1" fill={color} />
    </Svg>
  );
}

function CloseIcon({ size = 20, color = '#374151' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M18 6L6 18M6 6l12 12" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
    </Svg>
  );
}

// ── Types & Props ────────────────────────────────────────────────────────────

interface SettingsScreenProps {
  onBack: () => void;
  onNavigateToProfile?: (() => void) | undefined;
}

export function SettingsScreen({ onBack, onNavigateToProfile }: SettingsScreenProps): React.JSX.Element {
  const [selectedLocale, setSelectedLocale] = useState<Locale>('en');

  // Interactive modal states
  const [activeModal, setActiveModal] = useState<
    'notifications' | 'data' | 'password' | 'mobile' | 'support' | null
  >(null);

  // Notifications State
  const [notifWeather, setNotifWeather] = useState(true);
  const [notifFarm, setNotifFarm] = useState(true);
  const [notifMarket, setNotifMarket] = useState(true);
  const [notifPayroll, setNotifPayroll] = useState(true);
  const [notifPromo, setNotifPromo] = useState(false);

  // Password State
  const [currentPass, setCurrentPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');

  // Mobile State
  const [newMobile, setNewMobile] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);

  const activeNotifCount = [
    notifWeather,
    notifFarm,
    notifMarket,
    notifPayroll,
    notifPromo,
  ].filter(Boolean).length;

  const handleSwitchLanguage = (lang: Locale) => {
    setSelectedLocale(lang);
    setLocale(lang);
  };

  const handleClearCache = () => {
    Alert.alert(
      'Clear Cache',
      'Local offline cached maps and media (24.6 MB) cleared successfully.',
      [{ text: 'OK', onPress: () => setActiveModal(null) }]
    );
  };

  const handleChangePassword = () => {
    if (!currentPass || !newPass || !confirmPass) {
      Alert.alert('Required Fields', 'Please fill in all password fields.');
      return;
    }
    if (newPass !== confirmPass) {
      Alert.alert('Password Mismatch', 'New password and confirmation do not match.');
      return;
    }
    Alert.alert('Success', 'Your password has been changed successfully.', [
      {
        text: 'OK',
        onPress: () => {
          setCurrentPass('');
          setNewPass('');
          setConfirmPass('');
          setActiveModal(null);
        },
      },
    ]);
  };

  const handleSendOtp = () => {
    if (newMobile.length < 10) {
      Alert.alert('Invalid Number', 'Please enter a valid 10-digit mobile number.');
      return;
    }
    setOtpSent(true);
    Alert.alert('OTP Sent', `A 6-digit verification code was sent to +91 ${newMobile}.`);
  };

  const handleVerifyOtp = () => {
    if (!otpCode || otpCode.length < 4) {
      Alert.alert('Invalid Code', 'Please enter the verification code.');
      return;
    }
    Alert.alert('Mobile Number Updated', `Your registered number is now +91 ${newMobile}.`, [
      {
        text: 'OK',
        onPress: () => {
          setNewMobile('');
          setOtpCode('');
          setOtpSent(false);
          setActiveModal(null);
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* ── Top Header ── */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={onBack}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <ArrowBackIcon size={18} color="#1E5E2B" />
        </TouchableOpacity>
        <View style={styles.headerTextWrap}>
          <Text style={styles.headerTitle}>Settings</Text>
          <Text style={styles.headerSubtitle}>Account, preferences & support</Text>
        </View>
      </View>
      <View style={styles.headerDivider} />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Farmer Profile Banner Card ── */}
        <TouchableOpacity
          style={styles.profileCard}
          activeOpacity={0.88}
          onPress={onNavigateToProfile}
          accessibilityRole="button"
          accessibilityLabel="View farmer profile"
        >
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>SR</Text>
          </View>

          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>Selvam R.</Text>
            <Text style={styles.profileFarm}>Green Terrace Farm · Kotagiri</Text>
            <Text style={styles.profileMeta}>TOHFA-04127 · +91 98420 55031</Text>
          </View>

          <ChevronRightIcon size={18} color="#9CA3AF" />
        </TouchableOpacity>

        {/* Profile Helper Caption */}
        <Text style={styles.profileCaption}>
          Opens your profile — details are edited in Farmer Profile.
        </Text>

        {/* ── SECTION 1: PREFERENCES ── */}
        <Text style={styles.sectionHeaderTitle}>PREFERENCES</Text>

        {/* Language Card */}
        <View style={styles.settingCard}>
          <View style={[styles.iconBox, { backgroundColor: '#EAF3DE' }]}>
            <TranslateIcon size={22} color="#2E7D32" />
          </View>

          <View style={styles.settingInfo}>
            <Text style={styles.settingTitle}>Language</Text>
            <Text style={styles.settingSubtitle}>Switches instantly</Text>
          </View>

          {/* Segmented Language Switcher */}
          <View style={styles.langSegmentedContainer}>
            <TouchableOpacity
              style={[
                styles.langSegment,
                selectedLocale === 'ta' && styles.langSegmentActive,
              ]}
              onPress={() => handleSwitchLanguage('ta')}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.langSegmentText,
                  selectedLocale === 'ta' && styles.langSegmentTextActive,
                ]}
              >
                தமிழ்
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.langSegment,
                selectedLocale === 'en' && styles.langSegmentActive,
              ]}
              onPress={() => handleSwitchLanguage('en')}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.langSegmentText,
                  selectedLocale === 'en' && styles.langSegmentTextActive,
                ]}
              >
                English
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Notifications Card */}
        <TouchableOpacity
          style={styles.settingCard}
          activeOpacity={0.85}
          onPress={() => setActiveModal('notifications')}
          accessibilityRole="button"
          accessibilityLabel="Notifications settings"
        >
          <View style={[styles.iconBox, { backgroundColor: '#EAF3DE' }]}>
            <BellIcon size={22} color="#2E7D32" />
          </View>

          <View style={styles.settingInfo}>
            <Text style={styles.settingTitle}>Notifications</Text>
            <Text style={styles.settingSubtitle}>
              Weather, farm, marketing, payroll on
            </Text>
          </View>

          <View style={styles.rightActionRow}>
            <Text style={styles.statusPillGreen}>{activeNotifCount} of 5</Text>
            <ChevronRightIcon size={18} color="#9CA3AF" />
          </View>
        </TouchableOpacity>

        {/* Data & Storage Card */}
        <TouchableOpacity
          style={styles.settingCard}
          activeOpacity={0.85}
          onPress={() => setActiveModal('data')}
          accessibilityRole="button"
          accessibilityLabel="Data and storage settings"
        >
          <View style={[styles.iconBox, { backgroundColor: '#E0F2FE' }]}>
            <DataStorageIcon size={22} color="#0284C7" />
          </View>

          <View style={styles.settingInfo}>
            <Text style={styles.settingTitle}>Data & storage</Text>
            <Text style={styles.settingSubtitle}>
              24.6 MB cached · synced 2h ago
            </Text>
          </View>

          <ChevronRightIcon size={18} color="#9CA3AF" />
        </TouchableOpacity>

        {/* ── SECTION 2: SECURITY ── */}
        <Text style={styles.sectionHeaderTitle}>SECURITY</Text>

        {/* Change Password */}
        <TouchableOpacity
          style={styles.settingCard}
          activeOpacity={0.85}
          onPress={() => setActiveModal('password')}
          accessibilityRole="button"
          accessibilityLabel="Change password"
        >
          <View style={[styles.iconBox, { backgroundColor: '#EAF3DE' }]}>
            <LockPasswordIcon size={22} color="#2E7D32" />
          </View>

          <View style={styles.settingInfo}>
            <Text style={styles.settingTitle}>Change password</Text>
          </View>

          <ChevronRightIcon size={18} color="#9CA3AF" />
        </TouchableOpacity>

        {/* Change Mobile Number */}
        <TouchableOpacity
          style={styles.settingCard}
          activeOpacity={0.85}
          onPress={() => setActiveModal('mobile')}
          accessibilityRole="button"
          accessibilityLabel="Change mobile number"
        >
          <View style={[styles.iconBox, { backgroundColor: '#EAF3DE' }]}>
            <MobilePhoneIcon size={22} color="#2E7D32" />
          </View>

          <View style={styles.settingInfo}>
            <Text style={styles.settingTitle}>Change mobile number</Text>
            <Text style={styles.settingSubtitle}>Verified by OTP</Text>
          </View>

          <ChevronRightIcon size={18} color="#9CA3AF" />
        </TouchableOpacity>

        {/* ── SECTION 3: SUPPORT ── */}
        <Text style={styles.sectionHeaderTitle}>SUPPORT</Text>

        {/* About & Support */}
        <TouchableOpacity
          style={styles.settingCard}
          activeOpacity={0.85}
          onPress={() => setActiveModal('support')}
          accessibilityRole="button"
          accessibilityLabel="About and support"
        >
          <View style={[styles.iconBox, { backgroundColor: '#EAF3DE' }]}>
            <HelpSupportIcon size={22} color="#2E7D32" />
          </View>

          <View style={styles.settingInfo}>
            <Text style={styles.settingTitle}>About & support</Text>
            <Text style={styles.settingSubtitle}>
              App info, help center, contact, feedback
            </Text>
          </View>

          <ChevronRightIcon size={18} color="#9CA3AF" />
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* ── NOTIFICATIONS MODAL ── */}
      <Modal visible={activeModal === 'notifications'} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Notification Channels</Text>
              <TouchableOpacity
                style={styles.modalCloseCircle}
                onPress={() => setActiveModal(null)}
              >
                <CloseIcon size={18} color="#374151" />
              </TouchableOpacity>
            </View>

            <View style={styles.switchRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.switchLabel}>Weather & Frost Alerts</Text>
                <Text style={styles.switchSub}>Rain, temperature dips, spraying windows</Text>
              </View>
              <Switch
                value={notifWeather}
                onValueChange={setNotifWeather}
                trackColor={{ false: '#E5E7EB', true: '#C8E6C9' }}
                thumbColor={notifWeather ? '#1E5E2B' : '#9CA3AF'}
              />
            </View>

            <View style={styles.switchRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.switchLabel}>Farm Diary & Input Reminders</Text>
                <Text style={styles.switchSub}>Daily logging due, fertigation checks</Text>
              </View>
              <Switch
                value={notifFarm}
                onValueChange={setNotifFarm}
                trackColor={{ false: '#E5E7EB', true: '#C8E6C9' }}
                thumbColor={notifFarm ? '#1E5E2B' : '#9CA3AF'}
              />
            </View>

            <View style={styles.switchRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.switchLabel}>Market Counter-Offers</Text>
                <Text style={styles.switchSub}>Admin counter-offers and batch inspections</Text>
              </View>
              <Switch
                value={notifMarket}
                onValueChange={setNotifMarket}
                trackColor={{ false: '#E5E7EB', true: '#C8E6C9' }}
                thumbColor={notifMarket ? '#1E5E2B' : '#9CA3AF'}
              />
            </View>

            <View style={styles.switchRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.switchLabel}>Worker Attendance & Payroll</Text>
                <Text style={styles.switchSub}>Daily check-in and weekly payout summaries</Text>
              </View>
              <Switch
                value={notifPayroll}
                onValueChange={setNotifPayroll}
                trackColor={{ false: '#E5E7EB', true: '#C8E6C9' }}
                thumbColor={notifPayroll ? '#1E5E2B' : '#9CA3AF'}
              />
            </View>

            <TouchableOpacity
              style={styles.modalPrimaryBtn}
              onPress={() => setActiveModal(null)}
            >
              <Text style={styles.modalPrimaryBtnText}>Save Preferences</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ── DATA & STORAGE MODAL ── */}
      <Modal visible={activeModal === 'data'} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Data & Offline Cache</Text>
              <TouchableOpacity
                style={styles.modalCloseCircle}
                onPress={() => setActiveModal(null)}
              >
                <CloseIcon size={18} color="#374151" />
              </TouchableOpacity>
            </View>

            <View style={styles.storageInfoBox}>
              <Text style={styles.storageValue}>24.6 MB</Text>
              <Text style={styles.storageLabel}>Cached Field Maps & Farm Diary Media</Text>
            </View>

            <TouchableOpacity
              style={styles.modalDangerBtn}
              onPress={handleClearCache}
            >
              <Text style={styles.modalDangerBtnText}>Clear Local Cache</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ── CHANGE PASSWORD MODAL ── */}
      <Modal visible={activeModal === 'password'} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Change Password</Text>
              <TouchableOpacity
                style={styles.modalCloseCircle}
                onPress={() => setActiveModal(null)}
              >
                <CloseIcon size={18} color="#374151" />
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>Current Password</Text>
            <TextInput
              style={styles.modalTextInput}
              secureTextEntry
              placeholder="Enter current password"
              placeholderTextColor="#9CA3AF"
              value={currentPass}
              onChangeText={setCurrentPass}
            />

            <Text style={styles.inputLabel}>New Password</Text>
            <TextInput
              style={styles.modalTextInput}
              secureTextEntry
              placeholder="Enter at least 6 characters"
              placeholderTextColor="#9CA3AF"
              value={newPass}
              onChangeText={setNewPass}
            />

            <Text style={styles.inputLabel}>Confirm New Password</Text>
            <TextInput
              style={styles.modalTextInput}
              secureTextEntry
              placeholder="Re-enter new password"
              placeholderTextColor="#9CA3AF"
              value={confirmPass}
              onChangeText={setConfirmPass}
            />

            <TouchableOpacity
              style={styles.modalPrimaryBtn}
              onPress={handleChangePassword}
            >
              <Text style={styles.modalPrimaryBtnText}>Update Password</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ── CHANGE MOBILE MODAL ── */}
      <Modal visible={activeModal === 'mobile'} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Change Mobile Number</Text>
              <TouchableOpacity
                style={styles.modalCloseCircle}
                onPress={() => {
                  setOtpSent(false);
                  setActiveModal(null);
                }}
              >
                <CloseIcon size={18} color="#374151" />
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>New Mobile Number (+91)</Text>
            <TextInput
              style={styles.modalTextInput}
              keyboardType="phone-pad"
              maxLength={10}
              placeholder="e.g. 9842055031"
              placeholderTextColor="#9CA3AF"
              value={newMobile}
              onChangeText={setNewMobile}
              editable={!otpSent}
            />

            {otpSent && (
              <>
                <Text style={styles.inputLabel}>6-Digit OTP Code</Text>
                <TextInput
                  style={styles.modalTextInput}
                  keyboardType="number-pad"
                  maxLength={6}
                  placeholder="Enter OTP code"
                  placeholderTextColor="#9CA3AF"
                  value={otpCode}
                  onChangeText={setOtpCode}
                />
              </>
            )}

            <TouchableOpacity
              style={styles.modalPrimaryBtn}
              onPress={otpSent ? handleVerifyOtp : handleSendOtp}
            >
              <Text style={styles.modalPrimaryBtnText}>
                {otpSent ? 'Verify & Update Number' : 'Send Verification OTP'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ── ABOUT & SUPPORT MODAL ── */}
      <Modal visible={activeModal === 'support'} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>About & Support</Text>
              <TouchableOpacity
                style={styles.modalCloseCircle}
                onPress={() => setActiveModal(null)}
              >
                <CloseIcon size={18} color="#374151" />
              </TouchableOpacity>
            </View>

            <View style={styles.supportRow}>
              <Text style={styles.supportLabel}>App Version</Text>
              <Text style={styles.supportValue}>v0.1.0-alpha (Build 2026.07)</Text>
            </View>
            <View style={styles.supportRow}>
              <Text style={styles.supportLabel}>Farmer Helpline</Text>
              <Text style={styles.supportValue}>+91 1800-425-TOHFA (Toll Free)</Text>
            </View>
            <View style={styles.supportRow}>
              <Text style={styles.supportLabel}>WhatsApp Field Desk</Text>
              <Text style={styles.supportValue}>+91 98420 55031</Text>
            </View>
            <View style={styles.supportRow}>
              <Text style={styles.supportLabel}>Support Email</Text>
              <Text style={styles.supportValue}>farmer.support@tohfa.org</Text>
            </View>

            <TouchableOpacity
              style={styles.modalPrimaryBtn}
              onPress={() => setActiveModal(null)}
            >
              <Text style={styles.modalPrimaryBtnText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  headerTextWrap: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: '#1A2E1A',
    letterSpacing: -0.2,
  },
  headerSubtitle: {
    fontSize: 12.5,
    fontWeight: '500',
    color: '#718274',
    marginTop: 1,
  },
  headerDivider: {
    height: 1,
    backgroundColor: '#F0ECE1',
  },

  // Scroll View
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 30,
  },

  // Farmer Profile Banner Card
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#ECE8DD',
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  avatarCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#1E5E2B',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1A2E1A',
    marginBottom: 2,
  },
  profileFarm: {
    fontSize: 12.5,
    fontWeight: '500',
    color: '#718274',
  },
  profileMeta: {
    fontSize: 11.5,
    color: '#8C9088',
    marginTop: 2,
  },
  profileCaption: {
    fontSize: 11.5,
    color: '#8C9088',
    marginTop: 8,
    marginBottom: 16,
    paddingHorizontal: 4,
  },

  // Section Headers
  sectionHeaderTitle: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#718274',
    letterSpacing: 0.8,
    marginTop: 6,
    marginBottom: 10,
  },

  // Setting Card Item
  settingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#ECE8DD',
    padding: 14,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  settingInfo: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#1A2E1A',
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: 12,
    color: '#718274',
  },

  // Language Segmented Switcher
  langSegmentedContainer: {
    flexDirection: 'row',
    backgroundColor: '#F3EFE6',
    borderRadius: 16,
    padding: 3,
  },
  langSegment: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 13,
  },
  langSegmentActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 1.5,
  },
  langSegmentText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#6B7280',
  },
  langSegmentTextActive: {
    color: '#1A2E1A',
    fontWeight: '800',
  },

  // Right Action Row
  rightActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusPillGreen: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1E5E2B',
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    padding: 20,
    paddingBottom: 32,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F0ECE1',
  },
  modalTitle: {
    fontSize: 16.5,
    fontWeight: '800',
    color: '#1A2E1A',
  },
  modalCloseCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F9F8F5',
  },
  switchLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1A2E1A',
  },
  switchSub: {
    fontSize: 12,
    color: '#718274',
    marginTop: 2,
  },
  modalPrimaryBtn: {
    backgroundColor: '#1E5E2B',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 18,
  },
  modalPrimaryBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  storageInfoBox: {
    backgroundColor: '#F0F9FF',
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  storageValue: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0284C7',
    marginBottom: 4,
  },
  storageLabel: {
    fontSize: 12.5,
    color: '#0369A1',
    fontWeight: '500',
  },
  modalDangerBtn: {
    backgroundColor: '#FEE2E2',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  modalDangerBtnText: {
    color: '#DC2626',
    fontSize: 14,
    fontWeight: '800',
  },
  inputLabel: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#1A2E1A',
    marginTop: 10,
    marginBottom: 4,
  },
  modalTextInput: {
    backgroundColor: '#F3EFE6',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: '#1A2E1A',
  },
  supportRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F0ECE1',
  },
  supportLabel: {
    fontSize: 13,
    color: '#718274',
    fontWeight: '500',
  },
  supportValue: {
    fontSize: 13,
    color: '#1A2E1A',
    fontWeight: '700',
  },
});
