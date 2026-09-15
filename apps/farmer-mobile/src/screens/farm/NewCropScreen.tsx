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

interface NewCropScreenProps {
  onBack: () => void;
  onSave: () => void;
}

export function NewCropScreen({ onBack, onSave }: NewCropScreenProps): React.JSX.Element {
  const [step, setStep] = useState<1 | 2>(1);

  // Step 1 State
  const [cropName, setCropName] = useState('Tomato');
  const [subCategory, setSubCategory] = useState('Roma');
  const [seedVariety, setSeedVariety] = useState('Roma VF');
  const [seedCompany, setSeedCompany] = useState('Namdhari');
  const [quantity, setQuantity] = useState('250');
  const [unit, setUnit] = useState('grams');
  const [cost, setCost] = useState('₹ 480');

  // Step 2 State
  const [zone, setZone] = useState('Zone 2 — Lower Slope');
  const [area, setArea] = useState('0.6');
  const [expectedQty, setExpectedQty] = useState('1,800');
  const [expectedGrade, setExpectedGrade] = useState('Grade A');

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.navCircleButton} onPress={onBack}>
          <Text style={styles.navBackIcon}>‹</Text>
        </TouchableOpacity>
        <View style={styles.headerTitleBox}>
          <Text style={styles.headerTitle}>New Crop</Text>
          <Text style={styles.headerSubtitle}>
            Step {step} of 2 · {step === 1 ? 'Basic' : 'Dates & Grade'}
          </Text>
        </View>
        <TouchableOpacity onPress={onBack}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={[styles.progressSegment, { backgroundColor: '#2E7D32' }]} />
        <View style={[styles.progressSegment, { backgroundColor: step === 2 ? '#2E7D32' : '#E2E8F0' }]} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {step === 1 ? (
          <>
            <Text style={styles.introText}>
              What was planted and where the seed came from. Step 2 attaches it to a zone and timeline.
            </Text>

            {/* Crop Name */}
            <View style={styles.fieldContainer}>
              <Text style={styles.inputLabel}>🌱 Crop name <Text style={styles.requiredAsterisk}>*</Text></Text>
              <View style={[styles.dropdownBox, styles.dropdownActive]}>
                <Text style={styles.dropdownTextActive}>{cropName}</Text>
                <Text style={styles.dropdownIconActive}>▼</Text>
              </View>
              <Text style={styles.hintText}>
                From the master catalog · Carrot, Tomato, Cabbage, Radish, Beans, Potato.
              </Text>
            </View>

            {/* Sub-category */}
            <View style={styles.fieldContainer}>
              <Text style={styles.inputLabel}>⛬ Sub-category</Text>
              <View style={styles.dropdownBox}>
                <Text style={styles.dropdownText}>{subCategory}</Text>
                <Text style={styles.dropdownIcon}>▼</Text>
              </View>
              <Text style={styles.hintText}>
                Shown only for crops with sub-types · Tomato → Red / Cherry / Roma.
              </Text>
            </View>

            {/* Seed variety & company */}
            <View style={styles.row}>
              <View style={[styles.fieldContainer, { flex: 1 }]}>
                <Text style={styles.inputLabel}>Seed variety</Text>
                <TextInput
                  style={styles.textInput}
                  value={seedVariety}
                  onChangeText={setSeedVariety}
                />
              </View>
              <View style={[styles.fieldContainer, { flex: 1 }]}>
                <Text style={styles.inputLabel}>Seed company</Text>
                <TextInput
                  style={styles.textInput}
                  value={seedCompany}
                  onChangeText={setSeedCompany}
                />
              </View>
            </View>

            {/* Quantity used */}
            <View style={styles.row}>
              <View style={[styles.fieldContainer, { flex: 1 }]}>
                <Text style={styles.inputLabel}>Quantity used</Text>
                <TextInput
                  style={styles.textInput}
                  value={quantity}
                  onChangeText={setQuantity}
                  keyboardType="numeric"
                />
              </View>
              <View style={[styles.fieldContainer, { flex: 1 }]}>
                <Text style={[styles.inputLabel, { color: 'transparent' }]}>Unit</Text>
                <View style={styles.dropdownBox}>
                  <Text style={styles.dropdownText}>{unit}</Text>
                  <Text style={styles.dropdownIcon}>▼</Text>
                </View>
              </View>
            </View>

            {/* Cost */}
            <View style={styles.fieldContainer}>
              <Text style={styles.inputLabel}>Cost (Rs.)</Text>
              <TextInput
                style={styles.textInput}
                value={cost}
                onChangeText={setCost}
                keyboardType="default"
              />
            </View>
          </>
        ) : (
          <>
            {/* Zone */}
            <View style={styles.fieldContainer}>
              <Text style={styles.inputLabel}>🔲 Zone <Text style={styles.requiredAsterisk}>*</Text></Text>
              <View style={[styles.dropdownBox, styles.dropdownActive]}>
                <Text style={styles.dropdownTextActive}>{zone}</Text>
                <Text style={styles.dropdownIconActive}>▼</Text>
              </View>
            </View>

            {/* Area */}
            <View style={styles.fieldContainer}>
              <Text style={styles.inputLabel}>Area (ha)</Text>
              <View style={styles.inputWithPill}>
                <TextInput
                  style={styles.textInputNoBorder}
                  value={area}
                  onChangeText={setArea}
                  keyboardType="decimal-pad"
                />
                <View style={styles.pillBox}>
                  <Text style={styles.pillText}>FROM ZONE</Text>
                </View>
              </View>
              <Text style={styles.hintText}>
                Pre-filled from the zone size · editable for partial plantings.
              </Text>
            </View>

            {/* Dates */}
            <View style={styles.row}>
              <View style={[styles.fieldContainer, { flex: 1 }]}>
                <Text style={styles.inputLabel}>Plantation date <Text style={styles.requiredAsterisk}>*</Text></Text>
                <View style={styles.dropdownBox}>
                  <Text style={styles.dropdownText}>2 Jun 2026</Text>
                  <Text style={styles.dropdownIcon}>📅</Text>
                </View>
              </View>
              <View style={[styles.fieldContainer, { flex: 1 }]}>
                <Text style={styles.inputLabel}>Expected harvest</Text>
                <View style={styles.dropdownBox}>
                  <Text style={styles.dropdownText}>16 Aug 2026</Text>
                  <Text style={styles.dropdownIcon}>📅</Text>
                </View>
              </View>
            </View>
            <View style={styles.autoSuggestRow}>
              <Text style={styles.sparkleIcon}>✨</Text>
              <Text style={styles.autoSuggestText}>Auto-suggested: plantation + 75 days (Tomato) · editable.</Text>
            </View>

            {/* Expected quantity */}
            <View style={styles.fieldContainer}>
              <Text style={styles.inputLabel}>Expected total quantity (kg)</Text>
              <TextInput
                style={styles.textInput}
                value={expectedQty}
                onChangeText={setExpectedQty}
                keyboardType="numeric"
              />
            </View>

            {/* Expected grade */}
            <View style={styles.fieldContainer}>
              <Text style={styles.inputLabel}>Expected grade</Text>
              <View style={styles.chipRow}>
                {['Grade A', 'Grade B', 'Grade C'].map((grade) => (
                  <TouchableOpacity
                    key={grade}
                    style={[
                      styles.chip,
                      expectedGrade === grade && styles.chipActive
                    ]}
                    onPress={() => setExpectedGrade(grade)}
                    activeOpacity={0.8}
                  >
                    <Text style={[
                      styles.chipText,
                      expectedGrade === grade && styles.chipTextActive
                    ]}>
                      {grade}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </>
        )}
      </ScrollView>

      {/* Bottom Bar */}
      <View style={styles.bottomBar}>
        {step === 1 ? (
          <TouchableOpacity style={styles.primaryButtonFull} onPress={() => setStep(2)}>
            <Text style={styles.primaryButtonText}>Next · Dates & Grade →</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.row}>
            <TouchableOpacity style={styles.secondaryButton} onPress={() => setStep(1)}>
              <Text style={styles.secondaryButtonText}>Back</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.primaryButton} onPress={onSave}>
              <Text style={styles.primaryButtonText}>✓ Save crop</Text>
            </TouchableOpacity>
          </View>
        )}
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
    backgroundColor: '#FFFFFF',
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
  navBackIcon: { color: '#2E7D32', fontSize: 24, lineHeight: 28, marginRight: 2 },
  headerTitleBox: { flex: 1, marginLeft: 16 },
  headerTitle: { color: '#0F172A', fontSize: 18, fontWeight: 'bold' },
  headerSubtitle: { color: '#94A3B8', fontSize: 13, marginTop: 2 },
  cancelText: { color: '#64748B', fontSize: 15, fontWeight: '500' },

  progressContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 8,
    marginBottom: 4,
  },
  progressSegment: {
    flex: 1,
    height: 3,
    borderRadius: 1.5,
  },

  scrollContent: {
    padding: 20,
    paddingBottom: 100, // Bottom bar space
  },

  introText: {
    fontSize: 14,
    color: '#64748B',
    lineHeight: 20,
    marginBottom: 24,
  },

  row: {
    flexDirection: 'row',
    gap: 12,
  },

  fieldContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 8,
  },
  requiredAsterisk: { color: '#EF4444' },
  hintText: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 6,
    lineHeight: 16,
  },

  textInput: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 48,
    backgroundColor: '#FFF',
    fontSize: 15,
    color: '#1E293B',
    fontWeight: '600',
  },
  
  inputWithPill: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
    backgroundColor: '#FFF',
  },
  textInputNoBorder: {
    flex: 1,
    fontSize: 15,
    color: '#1E293B',
    fontWeight: '600',
    paddingVertical: 0,
  },
  pillBox: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  pillText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#94A3B8',
  },

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
  dropdownActive: {
    borderColor: '#2E7D32',
  },
  dropdownText: { fontSize: 15, color: '#1E293B', fontWeight: '600' },
  dropdownTextActive: { fontSize: 15, color: '#2E7D32', fontWeight: 'bold' },
  dropdownIcon: { fontSize: 12, color: '#94A3B8' },
  dropdownIconActive: { fontSize: 12, color: '#2E7D32' },

  autoSuggestRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: -8,
    marginBottom: 20,
    paddingHorizontal: 4,
  },
  sparkleIcon: { fontSize: 12, marginRight: 6 },
  autoSuggestText: { fontSize: 12, color: '#2E7D32', fontWeight: '500', flex: 1 },

  chipRow: { flexDirection: 'row', gap: 8 },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFF',
  },
  chipActive: {
    backgroundColor: '#ECFDF5',
    borderColor: '#059669',
  },
  chipText: { fontSize: 14, color: '#64748B', fontWeight: '500' },
  chipTextActive: { color: '#059669', fontWeight: 'bold' },

  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    padding: 16,
    paddingBottom: 24, // Safe area for newer devices
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  primaryButtonFull: {
    height: 48,
    backgroundColor: '#2E7D32',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButton: {
    flex: 2,
    height: 48,
    backgroundColor: '#2E7D32',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: { color: '#FFF', fontSize: 15, fontWeight: 'bold' },
  secondaryButton: {
    flex: 1,
    height: 48,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: { color: '#64748B', fontSize: 15, fontWeight: '600' },
});
