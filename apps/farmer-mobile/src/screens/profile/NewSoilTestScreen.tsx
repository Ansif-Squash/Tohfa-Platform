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
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.navCircleButton} onPress={onNavigateBack}>
          <Text style={styles.navCloseIcon}>✕</Text>
        </TouchableOpacity>
        <View style={styles.headerTitleBox}>
          <Text style={styles.headerTitle}>New Soil Test</Text>
          <Text style={styles.headerSubtitle}>Log your latest lab results</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Date Row */}
        <View style={styles.dateRow}>
          <View style={styles.dateInputContainer}>
            <Text style={styles.inputLabel}>🗓️ Test Date <Text style={styles.requiredAsterisk}>*</Text></Text>
            <View style={styles.inputBox}>
              <Text style={styles.inputText}>12/06/26</Text>
              <Text style={styles.inputIcon}>📅</Text>
            </View>
          </View>
          
          <View style={styles.dateInputContainer}>
            <Text style={styles.inputLabel}>🗓️ Next Due <Text style={styles.requiredAsterisk}>*</Text></Text>
            <View style={styles.inputBox}>
              <Text style={styles.inputText}>11/06/27</Text>
              <Text style={styles.inputIcon}>📅</Text>
            </View>
          </View>
        </View>
        <Text style={styles.dateHintText}>Auto-suggested as test date + 1 year — editable.</Text>

        <Text style={styles.sectionHeading}>MEASURED VALUES</Text>

        {/* Organic Carbon */}
        <View style={styles.fieldContainer}>
          <Text style={styles.inputLabel}>Organic Carbon (%) <Text style={styles.requiredAsterisk}>*</Text></Text>
          <TextInput
            style={styles.textInput}
            value={oc}
            onChangeText={setOc}
            keyboardType="decimal-pad"
          />
          <View style={styles.validationRow}>
            <Text style={styles.infoIcon}>ℹ️</Text>
            <Text style={styles.infoText}>Medium — within the 0.51-0.75% range</Text>
          </View>
        </View>

        {/* pH */}
        <View style={styles.fieldContainer}>
          <Text style={styles.inputLabel}>pH <Text style={styles.requiredAsterisk}>*</Text></Text>
          <TextInput
            style={[styles.textInput, styles.textInputError]}
            value={ph}
            onChangeText={setPh}
            keyboardType="decimal-pad"
          />
          <View style={styles.validationRow}>
            <Text style={styles.errorIcon}>⚠️</Text>
            <Text style={styles.errorText}>Acidic — below the 6.0-7.5 ideal range</Text>
          </View>
        </View>

        {/* EC */}
        <View style={styles.fieldContainer}>
          <Text style={styles.inputLabel}>EC (dS/m) <Text style={styles.requiredAsterisk}>*</Text></Text>
          <TextInput
            style={styles.textInput}
            value={ec}
            onChangeText={setEc}
            keyboardType="decimal-pad"
          />
          <View style={styles.validationRow}>
            <Text style={styles.successIcon}>✓</Text>
            <Text style={styles.successText}>Good — at or below 1.0 dS/m</Text>
          </View>
        </View>

        {/* TDS */}
        <View style={styles.fieldContainer}>
          <Text style={styles.inputLabel}>TDS (ppm) <Text style={styles.optionalText}>optional</Text></Text>
          <TextInput
            style={styles.textInput}
            value={tds}
            onChangeText={setTds}
            keyboardType="number-pad"
          />
          <View style={styles.validationRow}>
            <Text style={styles.successIcon}>✓</Text>
            <Text style={styles.successText}>Good — within 0-500 ppm</Text>
          </View>
        </View>

        {/* Lime Status */}
        <View style={styles.fieldContainer}>
          <Text style={styles.inputLabel}>Lime Status <Text style={styles.optionalText}>optional</Text></Text>
          <View style={styles.dropdownBox}>
            <Text style={styles.inputText}>Harmless</Text>
            <Text style={styles.dropdownIcon}>▼</Text>
          </View>
        </View>

        {/* Water Source Context */}
        <View style={styles.contextBox}>
          <View style={styles.contextIconBox}>
            <Text style={styles.contextIcon}>💧</Text>
          </View>
          <View style={styles.contextInfo}>
            <Text style={styles.contextLabel}>WATER SOURCE (FROM FIELD CONTEXT)</Text>
            <Text style={styles.contextValue}>Borewell · Rainwater harvesting</Text>
          </View>
          <TouchableOpacity>
            <Text style={styles.contextAction}>Edit</Text>
          </TouchableOpacity>
        </View>

        {/* Document Upload */}
        <View style={styles.fieldContainer}>
          <Text style={styles.inputLabel}>📄 Lab Report Document</Text>
          <TouchableOpacity style={styles.uploadBox} activeOpacity={0.7}>
            <Text style={styles.uploadIcon}>☁️</Text>
            <Text style={styles.uploadTitle}>Choose file</Text>
            <Text style={styles.uploadSubtitle}>PDF, JPG or PNG · max 10 MB</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Bottom Actions */}
      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.cancelButton} onPress={onNavigateBack}>
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.saveButton} onPress={onSave}>
          <Text style={styles.saveButtonText}>✓ Save Soil Test</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#FFFFFF' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  navCircleButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  navCloseIcon: { color: '#2E7D32', fontSize: 18, fontWeight: 'bold' },
  headerTitleBox: { flex: 1, marginLeft: 16 },
  headerTitle: { color: '#0F172A', fontSize: 18, fontWeight: 'bold' },
  headerSubtitle: { color: '#64748B', fontSize: 13, marginTop: 2 },

  scrollContent: {
    padding: 20,
    paddingBottom: 100, // For bottom bar
  },

  dateRow: { flexDirection: 'row', gap: 12, marginBottom: 8 },
  dateInputContainer: { flex: 1 },
  inputLabel: { fontSize: 14, fontWeight: '600', color: '#334155', marginBottom: 8 },
  requiredAsterisk: { color: '#EF4444' },
  optionalText: { color: '#94A3B8', fontWeight: 'normal', fontSize: 12 },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 48,
    backgroundColor: '#FFF',
  },
  inputText: { fontSize: 15, color: '#1E293B' },
  inputIcon: { fontSize: 16, color: '#64748B' },
  dateHintText: { fontSize: 12, color: '#94A3B8', marginBottom: 24 },

  sectionHeading: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#888',
    marginBottom: 16,
    textTransform: 'uppercase',
  },

  fieldContainer: { marginBottom: 20 },
  textInput: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 48,
    backgroundColor: '#FFF',
    fontSize: 15,
    color: '#1E293B',
  },
  textInputError: { borderColor: '#EF4444' },
  dropdownBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 48,
    backgroundColor: '#FFF',
  },
  dropdownIcon: { fontSize: 12, color: '#64748B' },

  validationRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  infoIcon: { fontSize: 12, marginRight: 6, color: '#1D4ED8' },
  infoText: { fontSize: 12, color: '#1D4ED8', fontWeight: '500' },
  errorIcon: { fontSize: 12, marginRight: 6, color: '#EF4444' },
  errorText: { fontSize: 12, color: '#EF4444', fontWeight: '500' },
  successIcon: { fontSize: 12, marginRight: 6, color: '#2E7D32' },
  successText: { fontSize: 12, color: '#2E7D32', fontWeight: '500' },

  contextBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 12,
    marginBottom: 24,
  },
  contextIconBox: { width: 32, alignItems: 'center' },
  contextIcon: { fontSize: 18 },
  contextInfo: { flex: 1, marginLeft: 8 },
  contextLabel: { fontSize: 10, fontWeight: 'bold', color: '#94A3B8', marginBottom: 2 },
  contextValue: { fontSize: 13, fontWeight: '600', color: '#1E293B' },
  contextAction: { fontSize: 13, fontWeight: '600', color: '#2E7D32' },

  uploadBox: {
    borderWidth: 1,
    borderColor: '#2E7D32',
    borderStyle: 'dashed',
    borderRadius: 12,
    backgroundColor: '#F0FDF4',
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadIcon: { fontSize: 24, marginBottom: 8, color: '#2E7D32' },
  uploadTitle: { fontSize: 15, fontWeight: 'bold', color: '#2E7D32', marginBottom: 4 },
  uploadSubtitle: { fontSize: 12, color: '#64748B' },

  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  cancelButton: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF',
  },
  cancelButtonText: { color: '#64748B', fontSize: 15, fontWeight: '600' },
  saveButton: {
    flex: 2,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#2E7D32',
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonText: { color: '#FFF', fontSize: 15, fontWeight: 'bold' },
});
