import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

// ── SVG Icons ────────────────────────────────────────────────────────────────

function ArrowBackIcon({ size = 20, color = '#1E5E2B' }: { size?: number; color?: string }) {
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

function CheckCircleIcon({ size = 15, color = '#2E7D32' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2" />
      <Path
        d="M8 12l2.5 2.5L16 9.5"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function TimerIcon({ size = 15, color = '#718274' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="13" r="8" stroke={color} strokeWidth="1.8" />
      <Path d="M12 9v4l2.5 2.5M10 2h4M12 2v3" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </Svg>
  );
}

// ── Types & Props ────────────────────────────────────────────────────────────

interface ChangeMobileScreenProps {
  onBack: () => void;
  onNavigateToPassword?: (() => void) | undefined;
  onSuccess?: (() => void) | undefined;
}

export function ChangeMobileScreen({
  onBack,
  onNavigateToPassword,
  onSuccess,
}: ChangeMobileScreenProps): React.JSX.Element {
  const [mobileNumber, setMobileNumber] = useState('9003271845');
  const [otpDigits, setOtpDigits] = useState<string[]>(['4', '7', '1', '9', '', '']);
  const [focusedIndex, setFocusedIndex] = useState<number>(4);
  const [countdown, setCountdown] = useState<number>(24);

  const inputRefs = useRef<Array<TextInput | null>>([]);

  // Resend Timer Countdown
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  const cleanDigits = mobileNumber.replace(/\D/g, '');
  const is10Digits = cleanDigits.length === 10;

  const handleOtpChange = (text: string, index: number) => {
    const digit = text.slice(-1);
    const newOtp = [...otpDigits];
    newOtp[index] = digit;
    setOtpDigits(newOtp);

    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus();
      setFocusedIndex(index + 1);
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace') {
      if (!otpDigits[index] && index > 0) {
        const newOtp = [...otpDigits];
        newOtp[index - 1] = '';
        setOtpDigits(newOtp);
        inputRefs.current[index - 1]?.focus();
        setFocusedIndex(index - 1);
      } else {
        const newOtp = [...otpDigits];
        newOtp[index] = '';
        setOtpDigits(newOtp);
      }
    }
  };

  const handleResend = () => {
    if (countdown > 0) return;
    setCountdown(30);
    Alert.alert('OTP Sent', `A new verification code was sent to +91 ${cleanDigits || '9003271845'}.`);
  };

  const handleSaveChanges = () => {
    if (!is10Digits) {
      Alert.alert('Invalid Number', 'Please enter a valid 10-digit mobile number.');
      return;
    }
    const fullOtp = otpDigits.join('');
    if (fullOtp.length < 6) {
      Alert.alert('Incomplete OTP', 'Please enter the complete 6-digit verification code.');
      return;
    }

    Alert.alert('Success', `Mobile number has been successfully updated to +91 ${cleanDigits}.`, [
      {
        text: 'OK',
        onPress: () => {
          if (onSuccess) {
            onSuccess();
          } else {
            onBack();
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* ── Top Header ── */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backCircleBtn}
            onPress={onBack}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <ArrowBackIcon size={20} color="#1E5E2B" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Change mobile number</Text>
        </View>

        <ScrollView
          style={styles.scrollArea}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ── New Mobile Number Input Box ── */}
          <Text style={styles.fieldLabel}>New mobile number</Text>
          <View style={styles.mobileInputBox}>
            <TextInput
              style={styles.mobileTextInput}
              value={mobileNumber}
              onChangeText={setMobileNumber}
              keyboardType="phone-pad"
              maxLength={10}
              placeholder="Enter 10-digit number"
              placeholderTextColor="#9CA3AF"
            />
            {is10Digits && (
              <View style={styles.digitsBadge}>
                <CheckCircleIcon size={15} color="#2E7D32" />
                <Text style={styles.digitsBadgeText}>10 digits</Text>
              </View>
            )}
          </View>

          {/* ── 6-Digit OTP Card ── */}
          <View style={styles.otpCard}>
            <Text style={styles.otpInstructions}>
              Enter the 6-digit code sent to{' '}
              <Text style={styles.otpTargetNumber}>
                +91 {cleanDigits.length === 10 ? `${cleanDigits.slice(0, 5)} ${cleanDigits.slice(5)}` : '90032 71845'}
              </Text>
            </Text>

            {/* 6 Boxes */}
            <View style={styles.otpBoxesRow}>
              {otpDigits.map((digit, idx) => {
                const isFocused = focusedIndex === idx;
                return (
                  <TextInput
                    key={idx}
                    ref={(ref) => {
                      inputRefs.current[idx] = ref;
                    }}
                    style={[
                      styles.otpBox,
                      isFocused && styles.otpBoxFocused,
                      digit ? styles.otpBoxFilled : null,
                    ]}
                    keyboardType="number-pad"
                    maxLength={1}
                    value={digit}
                    onChangeText={(text) => handleOtpChange(text, idx)}
                    onKeyPress={(e) => handleKeyPress(e, idx)}
                    onFocus={() => setFocusedIndex(idx)}
                    selectTextOnFocus
                  />
                );
              })}
            </View>

            {/* Sub-row: Didn't get it? + Resend */}
            <View style={styles.otpFooterRow}>
              <Text style={styles.didntGetText}>Didn't get it?</Text>
              <TouchableOpacity
                onPress={handleResend}
                disabled={countdown > 0}
                style={styles.resendBtn}
                activeOpacity={0.7}
              >
                <TimerIcon size={15} color="#718274" />
                <Text style={styles.resendText}>
                  {countdown > 0
                    ? `Resend in 0:${countdown < 10 ? '0' : ''}${countdown}`
                    : 'Resend code'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>

        {/* ── Bottom Save Changes Button ── */}
        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={styles.saveBtn}
            onPress={handleSaveChanges}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel="Save changes"
          >
            <Text style={styles.saveBtnText}>Save changes</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  keyboardContainer: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 14 : 10,
    paddingBottom: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3EFE6',
  },
  backCircleBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  headerTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: '#162616',
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 24,
  },
  fieldLabel: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#1A2E1A',
    marginBottom: 8,
  },
  mobileInputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F1E8',
    borderWidth: 1,
    borderColor: '#EAE4D6',
    borderRadius: 14,
    height: 54,
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  mobileTextInput: {
    flex: 1,
    fontSize: 15.5,
    fontWeight: '700',
    color: '#1A2E1A',
    paddingVertical: 0,
  },
  digitsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  digitsBadgeText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#2E7D32',
  },
  otpCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E8E5DC',
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1.5,
  },
  otpInstructions: {
    fontSize: 13,
    lineHeight: 18.5,
    color: '#556557',
    marginBottom: 16,
  },
  otpTargetNumber: {
    fontWeight: '800',
    color: '#162616',
  },
  otpBoxesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 6,
    marginBottom: 18,
  },
  otpBox: {
    flex: 1,
    height: 52,
    borderRadius: 12,
    borderWidth: 1.2,
    borderColor: '#E5E7EB',
    backgroundColor: '#FAF9F6',
    textAlign: 'center',
    fontSize: 20,
    fontWeight: '800',
    color: '#162616',
  },
  otpBoxFocused: {
    borderColor: '#2E7D32',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.8,
  },
  otpBoxFilled: {
    backgroundColor: '#FFFFFF',
    borderColor: '#D1D5DB',
  },
  otpFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 4,
  },
  didntGetText: {
    fontSize: 12.5,
    color: '#8A988D',
    fontWeight: '500',
  },
  resendBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  resendText: {
    fontSize: 12.5,
    color: '#718274',
    fontWeight: '600',
  },
  bottomBar: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 16 : 20,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F3EFE6',
  },
  saveBtn: {
    backgroundColor: '#256F2B',
    borderRadius: 14,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnText: {
    fontSize: 15.5,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
