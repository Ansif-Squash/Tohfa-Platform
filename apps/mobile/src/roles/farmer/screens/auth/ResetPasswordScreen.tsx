import React, { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { t } from '../../../../i18n/farmer';
import { Icon, ErrorState } from '@tohfa/mobile-ui';
import { resetPassword } from '../../api/auth';
import { ApiError } from '../../api/client';
import { authPalette as P } from '../../theme';

interface ResetPasswordScreenProps {
  challengeId: string;
  code: string;
  onNavigate: (screen: 'Login' | 'PasswordChangedSuccess') => void;
}

export const ResetPasswordScreen: React.FC<ResetPasswordScreenProps> = ({ challengeId, code, onNavigate }) => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function handleReset() {
    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }
    setLoading(true);
    setErrorMsg(null);

    try {
      await resetPassword({ challengeId, code, newPassword: password });
      onNavigate('PasswordChangedSuccess');
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setErrorMsg(t(`error.${err.problem.code}` as unknown as Parameters<typeof t>[0]) || t('error.generic'));
      } else {
        setErrorMsg(t('error.generic'));
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.backRow}>
        <TouchableOpacity
          accessibilityRole="button"
          activeOpacity={0.7}
          style={styles.backButton}
          onPress={() => onNavigate('Login')}
        >
          <Text style={{ fontSize: 22, fontWeight: '700', color: P.primary, marginTop: -2 }}>{'‹'}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.iconCircle}>
        <Icon name="lock_reset" size={32} color={P.primary} />
      </View>

      <Text style={styles.title}>Create New Password</Text>
      <Text style={styles.subtitle}>Your new password must be different from previous used passwords.</Text>

      {errorMsg ? (
        <View style={{ marginTop: 24 }}>
          <ErrorState message={errorMsg} onRetry={() => setErrorMsg(null)} />
        </View>
      ) : null}

      <Text style={styles.fieldLabel}>New Password</Text>
      <View style={styles.fieldRow}>
        <Icon name="lock" size={16} color={P.muted} />
        <TextInput
          style={styles.fieldInput}
          value={password}
          onChangeText={setPassword}
          secureTextEntry={!showPassword}
          placeholder="........"
          placeholderTextColor={P.muted}
        />
        <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
          <Icon name={showPassword ? 'visibility_off' : 'visibility'} size={16} color={P.muted} />
        </TouchableOpacity>
      </View>

      <Text style={styles.fieldLabel}>Confirm Password</Text>
      <View style={styles.fieldRow}>
        <Icon name="lock" size={16} color={P.muted} />
        <TextInput
          style={styles.fieldInput}
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry={!showConfirmPassword}
          placeholder="........"
          placeholderTextColor={P.muted}
        />
        <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
          <Icon name={showConfirmPassword ? 'visibility_off' : 'visibility'} size={16} color={P.muted} />
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        accessibilityRole="button"
        style={[styles.ctaButton, (!password || !confirmPassword || loading) && styles.ctaDisabled]}
        onPress={handleReset}
        disabled={!password || !confirmPassword || loading}
      >
        <Text style={styles.ctaText}>Save Password</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: P.bg,
  },
  content: {
    padding: 24,
    paddingBottom: 40,
  },
  backRow: {
    flexDirection: 'row',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: P.progressInactive,
    backgroundColor: P.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: P.lightGreen,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginTop: 36,
  },
  title: {
    fontSize: 23,
    fontWeight: '800',
    color: P.ink,
    textAlign: 'center',
    marginTop: 24,
  },
  subtitle: {
    fontSize: 12.8,
    lineHeight: 19,
    color: P.muted,
    textAlign: 'center',
    marginTop: 8,
  },
  fieldLabel: {
    fontSize: 11.5,
    fontWeight: '700',
    color: P.ink,
    marginTop: 24,
    marginBottom: 6,
  },
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: P.white,
    borderWidth: 1.5,
    borderColor: P.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 48,
  },
  fieldInput: {
    flex: 1,
    fontSize: 15,
    color: P.ink,
    paddingVertical: 0,
  },
  ctaButton: {
    backgroundColor: P.primary,
    borderRadius: 12,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 40,
  },
  ctaDisabled: {
    opacity: 0.4,
  },
  ctaText: {
    fontSize: 14,
    fontWeight: '700',
    color: P.white,
  },
});
