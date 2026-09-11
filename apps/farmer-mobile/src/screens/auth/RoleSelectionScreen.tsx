import React, { useState } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, ScrollView, Image } from 'react-native';
import { useTheme } from '../../theme';

interface RoleSelectionProps {
  onNavigate: (screen: 'Login' | 'Register') => void;
}

export const RoleSelectionScreen: React.FC<RoleSelectionProps> = ({ onNavigate }) => {
  const theme = useTheme();
  const { colors } = theme;
  const [locale, setLocale] = useState('EN');

  // We toggle EN/TA locally just for the UI visual match, 
  // though a real app would use the global i18n handler.
  const toggleLocale = () => {
    setLocale(locale === 'EN' ? 'TA' : 'EN');
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.bgLight }]}>
      {/* Custom Header matching the design */}
      <View style={styles.header}>
        <TouchableOpacity
          activeOpacity={0.7}
          style={[
            styles.backButtonCircle,
            {
              borderColor: colors.borderMedium,
              backgroundColor: colors.white,
            },
          ]}
          onPress={() => onNavigate('Login')}
        >
          <Text style={[styles.backButtonArrow, { color: colors.brandGreen }]}>‹</Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.7}
          style={[styles.localeSelect, { borderColor: colors.borderMedium, backgroundColor: colors.white }]}
          onPress={toggleLocale}
        >
          <Text style={[styles.localeText, { color: colors.brandGreen }]}>{locale}</Text>
          <Text style={[styles.localeArrow, { color: colors.brandGreen }]}> ▾</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollArea} contentContainerStyle={styles.scrollContent}>
        <Text style={[styles.title, { color: colors.textDark }]}>Join TOHFA</Text>
        <Text style={[styles.subtitle, { color: colors.textSubtle }]}>Pick how you want to join</Text>

        {/* Customer Card */}
        <TouchableOpacity
          activeOpacity={0.8}
          style={[styles.card, { borderColor: colors.borderMedium, backgroundColor: colors.white }]}
          onPress={() => {
            // No action for Customer in Farmer App for now
          }}
        >
          <Image
            source={{ uri: 'https://images.unsplash.com/photo-1595825833444-93b584d42898?auto=format&fit=crop&q=80&w=200&h=200' }}
            style={styles.cardImage}
          />
          <View style={styles.cardTextContainer}>
            <Text style={[styles.cardTitle, { color: colors.textDark }]}>Join as Customer</Text>
            <Text style={[styles.cardDesc, { color: colors.textSubtle }]}>
              Buy fresh organic produce directly from Nilgiris farmers
            </Text>
          </View>
        </TouchableOpacity>

        {/* Farmer Card */}
        <TouchableOpacity
          activeOpacity={0.8}
          style={[styles.card, { borderColor: colors.brandGreen, backgroundColor: colors.white }]}
          onPress={() => onNavigate('Register')}
        >
          <Image
            source={{ uri: 'https://images.unsplash.com/photo-1592419044706-39796d40f98c?auto=format&fit=crop&q=80&w=200&h=200' }}
            style={styles.cardImage}
          />
          <View style={styles.cardTextContainer}>
            <Text style={[styles.cardTitle, { color: colors.textDark }]}>Apply as Farmer</Text>
            <Text style={[styles.cardDesc, { color: colors.textSubtle }]}>
              Sell your organic produce through the TOHFA marketplace
            </Text>
          </View>
        </TouchableOpacity>

        {/* Info Box */}
        <View style={[styles.infoBox, { backgroundColor: '#F0F4F8', borderColor: '#D1E0EE' }]}>
          <Text style={[styles.infoText, { color: '#4A5B6D' }]}>
            Admin roles are assigned internally by TOHFA. They are never a self-registration option.
          </Text>
        </View>
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={[styles.footerText, { color: colors.textSubtle }]}>Already have an account? </Text>
        <TouchableOpacity onPress={() => onNavigate('Login')}>
          <Text style={[styles.footerLoginLink, { color: colors.brandGreen }]}>Login</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 24,
  },
  backButtonCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonArrow: {
    fontSize: 22,
    fontWeight: '700',
    marginTop: -2,
  },
  localeSelect: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    height: 40,
    borderRadius: 20,
    borderWidth: 1.5,
  },
  localeText: {
    fontSize: 14,
    fontWeight: '600',
  },
  localeArrow: {
    fontSize: 12,
    fontWeight: '600',
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    marginBottom: 32,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  cardImage: {
    width: 64,
    height: 64,
    borderRadius: 12,
    marginRight: 16,
  },
  cardTextContainer: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  cardDesc: {
    fontSize: 13,
    lineHeight: 18,
  },
  infoBox: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 16,
    marginTop: 16,
  },
  infoText: {
    fontSize: 13,
    lineHeight: 18,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingBottom: 32,
    paddingTop: 16,
  },
  footerText: {
    fontSize: 14,
  },
  footerLoginLink: {
    fontSize: 14,
    fontWeight: '700',
  },
});
