import React, { useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Icon } from '@tohfa/mobile-ui';
import { t } from '../../../../i18n/farmer';
import { authPalette as P } from '../../theme';

interface NewSoilTestScreenProps {
  onNavigateBack: () => void;
  onSave: () => void;
}

export function NewSoilTestScreen({ onNavigateBack, onSave }: NewSoilTestScreenProps): React.JSX.Element {
  const [oc, setOc] = useState('0.62');
  const [ph, setPh] = useState('5.8');
  const [ec, setEc] = useState('0.7');
  const [tds, setTds] = useState('312');

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar barStyle="dark-content" backgroundColor={P.white} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.navCircleButton} onPress={onNavigateBack}>
          <Text style={styles.navCloseIcon}>✕</Text>
        </TouchableOpacity>
        <View style={styles.headerTitleBox}>
          <Text style={styles.headerTitle}>{t('farmer.profile.soil.newTestTitle')}</Text>
          <Text style={styles.headerSubtitle}>{t('farmer.profile.soil.newTestSubtitle')}</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Date Row */}
        <View style={styles.dateRow}>
          <View style={styles.dateInputContainer}>
            <Text style={styles.inputLabel}>
              <Icon name="calendar_today" size={13} color={P.slate700} /> {t('farmer.profile.soil.testDateLabel')} <Text style={styles.requiredAsterisk}>*</Text>
            </Text>
            <View style={styles.inputBox}>
              <Text style={styles.inputText}>12/06/26</Text>
              <Icon name="calendar_today" size={16} color={P.slate500} />
            </View>
          </View>

          <View style={styles.dateInputContainer}>
            <Text style={styles.inputLabel}>
              <Icon name="calendar_today" size={13} color={P.slate700} /> {t('farmer.profile.soil.nextDue')} <Text style={styles.requiredAsterisk}>*</Text>
            </Text>
            <View style={styles.inputBox}>
              <Text style={styles.inputText}>11/06/27</Text>
              <Icon name="calendar_today" size={16} color={P.slate500} />
            </View>
          </View>
        </View>
        <Text style={styles.dateHintText}>{t('farmer.profile.soil.dateHint')}</Text>

        <Text style={styles.sectionHeading}>{t('farmer.profile.soil.measuredValues')}</Text>

        {/* Organic Carbon */}
        <View style={styles.fieldContainer}>
          <Text style={styles.inputLabel}>{t('farmer.profile.soil.organicCarbonUnit')} <Text style={styles.requiredAsterisk}>*</Text></Text>
          <TextInput
            style={styles.textInput}
            value={oc}
            onChangeText={setOc}
            keyboardType="decimal-pad"
          />
          <View style={styles.validationRow}>
            <Text style={styles.infoIcon}>ℹ️</Text>
            <Text style={styles.infoText}>{t('farmer.profile.soil.ocInfo')}</Text>
          </View>
        </View>

        {/* pH */}
        <View style={styles.fieldContainer}>
          <Text style={styles.inputLabel}>{t('farmer.profile.soil.phShort')} <Text style={styles.requiredAsterisk}>*</Text></Text>
          <TextInput
            style={[styles.textInput, styles.textInputError]}
            value={ph}
            onChangeText={setPh}
            keyboardType="decimal-pad"
          />
          <View style={styles.validationRow}>
            <Icon name="warning" size={12} color={P.twRed500} style={styles.errorIcon} />
            <Text style={styles.errorText}>{t('farmer.profile.soil.phError')}</Text>
          </View>
        </View>

        {/* EC */}
        <View style={styles.fieldContainer}>
          <Text style={styles.inputLabel}>{t('farmer.profile.soil.ec')} <Text style={styles.requiredAsterisk}>*</Text></Text>
          <TextInput
            style={styles.textInput}
            value={ec}
            onChangeText={setEc}
            keyboardType="decimal-pad"
          />
          <View style={styles.validationRow}>
            <Text style={styles.successIcon}>✓</Text>
            <Text style={styles.successText}>{t('farmer.profile.soil.ecSuccess')}</Text>
          </View>
        </View>

        {/* TDS */}
        <View style={styles.fieldContainer}>
          <Text style={styles.inputLabel}>{t('farmer.profile.soil.tds')} <Text style={styles.optionalText}>{t('farmer.profile.soil.optional')}</Text></Text>
          <TextInput
            style={styles.textInput}
            value={tds}
            onChangeText={setTds}
            keyboardType="number-pad"
          />
          <View style={styles.validationRow}>
            <Text style={styles.successIcon}>✓</Text>
            <Text style={styles.successText}>{t('farmer.profile.soil.tdsSuccess')}</Text>
          </View>
        </View>

        {/* Lime Status */}
        <View style={styles.fieldContainer}>
          <Text style={styles.inputLabel}>{t('farmer.profile.soil.limeStatus')} <Text style={styles.optionalText}>{t('farmer.profile.soil.optional')}</Text></Text>
          <View style={styles.dropdownBox}>
            <Text style={styles.inputText}>{t('farmer.profile.soil.limeStatusHarmless')}</Text>
            <Text style={styles.dropdownIcon}>▼</Text>
          </View>
        </View>

        {/* Water Source Context */}
        <View style={styles.contextBox}>
          <View style={styles.contextIconBox}>
            <Icon name="water_drop" size={18} color={P.lightBlue700} />
          </View>
          <View style={styles.contextInfo}>
            <Text style={styles.contextLabel}>{t('farmer.profile.soil.waterSourceContext')}</Text>
            <Text style={styles.contextValue}>Borewell · Rainwater harvesting</Text>
          </View>
          <TouchableOpacity>
            <Text style={styles.contextAction}>{t('farmer.common.edit')}</Text>
          </TouchableOpacity>
        </View>

        {/* Document Upload */}
        <View style={styles.fieldContainer}>
          <Text style={styles.inputLabel}>
            <Icon name="description" size={13} color={P.slate700} /> {t('farmer.profile.soil.labReportDoc')}
          </Text>
          <TouchableOpacity style={styles.uploadBox} activeOpacity={0.7}>
            <Icon name="upload" size={24} color={P.primary} style={styles.uploadIcon} />
            <Text style={styles.uploadTitle}>{t('farmer.profile.soil.uploadChooseFile')}</Text>
            <Text style={styles.uploadSubtitle}>{t('farmer.profile.soil.uploadHint')}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Bottom Actions */}
      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.cancelButton} onPress={onNavigateBack}>
          <Text style={styles.cancelButtonText}>{t('farmer.common.cancel')}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.saveButton} onPress={onSave}>
          <Text style={styles.saveButtonText}>✓ {t('farmer.profile.soil.saveSoilTest')}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: P.white },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: P.slate100,
  },
  navCircleButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: P.white,
    borderWidth: 1,
    borderColor: P.slate200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navCloseIcon: { color: P.primary, fontSize: 18, fontWeight: 'bold' },
  headerTitleBox: { flex: 1, marginLeft: 16 },
  headerTitle: { color: P.slate900, fontSize: 18, fontWeight: 'bold' },
  headerSubtitle: { color: P.slate500, fontSize: 13, marginTop: 2 },

  scrollContent: {
    padding: 20,
    paddingBottom: 100, // For bottom bar
  },

  dateRow: { flexDirection: 'row', gap: 12, marginBottom: 8 },
  dateInputContainer: { flex: 1 },
  inputLabel: { fontSize: 14, fontWeight: '600', color: P.slate700, marginBottom: 8 },
  requiredAsterisk: { color: P.twRed500 },
  optionalText: { color: P.slate400, fontWeight: 'normal', fontSize: 12 },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: P.slate200,
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 48,
    backgroundColor: P.white,
  },
  inputText: { fontSize: 15, color: P.slate800 },
  inputIcon: { fontSize: 16, color: P.slate500 },
  dateHintText: { fontSize: 12, color: P.slate400, marginBottom: 24 },

  sectionHeading: {
    fontSize: 12,
    fontWeight: 'bold',
    color: P.placeholderGrey,
    marginBottom: 16,
    textTransform: 'uppercase',
  },

  fieldContainer: { marginBottom: 20 },
  textInput: {
    borderWidth: 1,
    borderColor: P.slate200,
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 48,
    backgroundColor: P.white,
    fontSize: 15,
    color: P.slate800,
  },
  textInputError: { borderColor: P.twRed500 },
  dropdownBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: P.slate200,
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 48,
    backgroundColor: P.white,
  },
  dropdownIcon: { fontSize: 12, color: P.slate500 },

  validationRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  infoIcon: { fontSize: 12, marginRight: 6, color: P.twBlue700 },
  infoText: { fontSize: 12, color: P.twBlue700, fontWeight: '500' },
  errorIcon: { fontSize: 12, marginRight: 6, color: P.twRed500 },
  errorText: { fontSize: 12, color: P.twRed500, fontWeight: '500' },
  successIcon: { fontSize: 12, marginRight: 6, color: P.primary },
  successText: { fontSize: 12, color: P.primary, fontWeight: '500' },

  contextBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: P.slate50,
    borderWidth: 1,
    borderColor: P.slate200,
    borderRadius: 12,
    padding: 12,
    marginBottom: 24,
  },
  contextIconBox: { width: 32, alignItems: 'center' },
  contextIcon: { fontSize: 18 },
  contextInfo: { flex: 1, marginLeft: 8 },
  contextLabel: { fontSize: 10, fontWeight: 'bold', color: P.slate400, marginBottom: 2 },
  contextValue: { fontSize: 13, fontWeight: '600', color: P.slate800 },
  contextAction: { fontSize: 13, fontWeight: '600', color: P.primary },

  uploadBox: {
    borderWidth: 1,
    borderColor: P.primary,
    borderStyle: 'dashed',
    borderRadius: 12,
    backgroundColor: P.twGreen50,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadIcon: { fontSize: 24, marginBottom: 8, color: P.primary },
  uploadTitle: { fontSize: 15, fontWeight: 'bold', color: P.primary, marginBottom: 4 },
  uploadSubtitle: { fontSize: 12, color: P.slate500 },

  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: P.white,
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: P.slate100,
  },
  cancelButton: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: P.slate200,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: P.white,
  },
  cancelButtonText: { color: P.slate500, fontSize: 15, fontWeight: '600' },
  saveButton: {
    flex: 2,
    height: 48,
    borderRadius: 12,
    backgroundColor: P.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonText: { color: P.white, fontSize: 15, fontWeight: 'bold' },
});
