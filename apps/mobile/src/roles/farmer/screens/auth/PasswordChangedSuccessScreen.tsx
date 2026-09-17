import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Icon } from '@tohfa/mobile-ui';
import { authPalette as P } from '../../theme';

interface PasswordChangedSuccessScreenProps {
  onNavigate: (screen: 'Login') => void;
}

export const PasswordChangedSuccessScreen: React.FC<PasswordChangedSuccessScreenProps> = ({ onNavigate }) => {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.successView}>
        <View style={styles.iconCircle}>
          <Icon name="check" size={36} color={P.white} />
        </View>
        <Text style={styles.title}>Password Changed Successfully</Text>
        <Text style={styles.subtitle}>Your password has been changed successfully.</Text>
        <TouchableOpacity
          accessibilityRole="button"
          style={styles.ctaButton}
          onPress={() => onNavigate('Login')}
        >
          <Text style={styles.ctaText}>Back to Login</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: P.bg,
  },
  content: {
    flexGrow: 1,
    padding: 24,
    paddingBottom: 40,
  },
  successView: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: P.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 23,
    fontWeight: '800',
    color: P.ink,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 13.5,
    color: P.muted,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 40,
  },
  ctaButton: {
    backgroundColor: P.primary,
    borderRadius: 12,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  ctaText: {
    fontSize: 15,
    fontWeight: '700',
    color: P.white,
  },
});
