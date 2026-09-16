import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Modal,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useTheme } from '../../theme';
import { ErrorState } from '@tohfa/mobile-ui';
import { validateStep } from './validation';
import type { Step2FarmData, FarmItemData } from '../../storage/registrationDraft';

interface Step2Props {
  initialData?: Step2FarmData | undefined;
  onSave: (data: Step2FarmData) => void;
  onBack: () => void;
}

export const Step2FarmDetails: React.FC<Step2Props> = ({ initialData, onSave, onBack }) => {
  const theme = useTheme();
  const { colors } = theme;

  const existingFarm = initialData?.farms[0];
  const [farmName, setFarmName] = useState(existingFarm?.name ?? '');
  const [typeOfFarming, setTypeOfFarming] = useState(existingFarm?.typeOfFarming ?? 'Organic');
  const [experienceYears, setExperienceYears] = useState(
    existingFarm?.experienceYears ? String(existingFarm.experienceYears) : ''
  );
  const [acres, setAcres] = useState(
    existingFarm?.totalAreaAcres ? String(existingFarm.totalAreaAcres) : ''
  );
  
  const [numberOfFarms, setNumberOfFarms] = useState(
    existingFarm?.numberOfFarms ? String(existingFarm.numberOfFarms) : '2'
  );
  const [showFarmsMenu, setShowFarmsMenu] = useState(false);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const farmingTypes = ['Natural', 'Organic', 'Bio-dynamic', 'Others'];
  const numFarmsOptions = ['1', '2', '3', '4', '5', 'More than 5'];

  function handleContinue() {
    const parsedAcres = parseFloat(acres);
    const parsedExp = parseInt(experienceYears, 10);
    const parsedFarms = parseInt(numberOfFarms, 10);

    const payload: Step2FarmData = {
      farms: [
        {
          name: farmName.trim(),
          totalAreaAcres: isNaN(parsedAcres) ? 0 : parsedAcres,
          typeOfFarming: typeOfFarming.trim(),
          experienceYears: isNaN(parsedExp) ? 0 : parsedExp,
          numberOfFarms: isNaN(parsedFarms) ? 1 : parsedFarms,
        },
      ],
    };

    const validation = validateStep(2, payload);
    if (!validation.valid) {
      const firstError = Object.values(validation.errors)[0] ?? 'Validation failed';
      setErrorMsg(firstError);
      return;
    }

    setErrorMsg(null);
    onSave(payload);
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.bgLight }]}>
      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {errorMsg ? (
          <View style={styles.errorContainer}>
            <ErrorState message={errorMsg} onRetry={() => setErrorMsg(null)} />
          </View>
        ) : null}

        {/* Farm Name */}
        <View style={styles.fieldGroup}>
          <Text style={[styles.label, { color: colors.textBody }]}>
            Farm Name <Text style={{ color: colors.requiredRed }}>*</Text>
          </Text>
          <TextInput
            style={[
              styles.input,
              {
                borderColor: colors.borderLight,
                color: colors.textDark,
                backgroundColor: colors.white,
              },
            ]}
            value={farmName}
            onChangeText={setFarmName}
            placeholder="e.g. Great Earth Organic Farm"
            placeholderTextColor={colors.textPlaceholder}
          />
        </View>

        {/* Type of Farming */}
        <View style={styles.fieldGroup}>
          <Text style={[styles.label, { color: colors.textBody, marginBottom: 8 }]}>
            Type of Farming <Text style={{ color: colors.requiredRed }}>*</Text>
          </Text>
          <View style={styles.gridContainer}>
            {farmingTypes.map((type) => {
              const isSelected = typeOfFarming === type;
              return (
                <TouchableOpacity
                  key={type}
                  activeOpacity={0.8}
                  style={[
                    styles.gridItem,
                    {
                      backgroundColor: isSelected ? colors.brandGreenLight : colors.white,
                      borderColor: isSelected ? colors.brandGreen : colors.borderLight,
                      borderWidth: isSelected ? 2 : 1.5,
                    },
                  ]}
                  onPress={() => setTypeOfFarming(type)}
                >
                  <Text
                    style={[
                      styles.gridItemText,
                      {
                        color: isSelected ? colors.brandGreen : colors.textBody,
                        fontWeight: isSelected ? '700' : '600',
                      },
                    ]}
                  >
                    {type}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Experience & Area Side-by-Side */}
        <View style={styles.rowGrid}>
          <View style={styles.gridCol}>
            <Text style={[styles.label, { color: colors.textBody }]}>
              Years of Experience <Text style={{ color: colors.requiredRed }}>*</Text>
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  borderColor: colors.borderLight,
                  color: colors.textDark,
                  backgroundColor: colors.white,
                },
              ]}
              value={experienceYears}
              onChangeText={setExperienceYears}
              keyboardType="number-pad"
              placeholder="14"
              placeholderTextColor={colors.textPlaceholder}
            />
          </View>

          <View style={styles.gridCol}>
            <Text style={[styles.label, { color: colors.textBody }]}>
              Total Area (acres) <Text style={{ color: colors.requiredRed }}>*</Text>
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  borderColor: colors.borderLight,
                  color: colors.textDark,
                  backgroundColor: colors.white,
                },
              ]}
              value={acres}
              onChangeText={setAcres}
              keyboardType="decimal-pad"
              placeholder="2.5"
              placeholderTextColor={colors.textPlaceholder}
            />
          </View>
        </View>

        {/* Number of Separate Farms */}
        <View style={styles.fieldGroup}>
          <Text style={[styles.label, { color: colors.textBody }]}>
            Number of Separate Farms <Text style={{ color: colors.requiredRed }}>*</Text>
          </Text>
          <TouchableOpacity
            activeOpacity={0.7}
            style={[
              styles.dropdownSelect,
              {
                borderColor: colors.borderLight,
                backgroundColor: colors.white,
              },
            ]}
            onPress={() => setShowFarmsMenu(true)}
          >
            <Text style={[styles.dropdownText, { color: colors.onSurface }]}>
              {numberOfFarms}
            </Text>
            <Text style={[styles.dropdownArrow, { color: colors.textSubtle }]}>▾</Text>
          </TouchableOpacity>
          <Text style={[styles.helperText, { color: colors.textSubtle }]}>
            You'll mark each farm's location on the map next
          </Text>
        </View>
      </ScrollView>

      {/* Sticky Bottom Footer */}
      <View
        style={[
          styles.footer,
          {
            borderTopColor: colors.borderDivider,
            backgroundColor: colors.white,
          },
        ]}
      >
        <TouchableOpacity
          activeOpacity={0.85}
          style={[
            styles.footerBtn,
            styles.backButton,
            { borderColor: colors.brandGreen, backgroundColor: colors.white },
          ]}
          onPress={onBack}
        >
          <Text style={[styles.footerBtnText, { color: colors.brandGreen }]}>Back</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          activeOpacity={0.85}
          style={[
            styles.footerBtn,
            styles.nextButton,
            { backgroundColor: colors.brandGreen },
          ]}
          onPress={handleContinue}
        >
          <Text style={[styles.footerBtnText, { color: colors.white }]}>Next</Text>
        </TouchableOpacity>
      </View>

      {/* Number of Separate Farms Picker Modal */}
      <Modal
        visible={showFarmsMenu}
        transparent
        animationType="fade"
        onRequestClose={() => setShowFarmsMenu(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowFarmsMenu(false)}
        >
          <View style={styles.modalSheet} onStartShouldSetResponder={() => true}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Number of Separate Farms</Text>
              <TouchableOpacity
                onPress={() => setShowFarmsMenu(false)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.modalList}>
              {numFarmsOptions.map((opt) => {
                const isSelected = opt === numberOfFarms;
                return (
                  <TouchableOpacity
                    key={opt}
                    style={[
                      styles.modalOptionRow,
                      isSelected && styles.modalOptionSelected,
                    ]}
                    activeOpacity={0.7}
                    onPress={() => {
                      setNumberOfFarms(opt);
                      setShowFarmsMenu(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.modalOptionText,
                        isSelected && styles.modalOptionTextSelected,
                      ]}
                    >
                      {opt} {opt === '1' ? 'Farm' : 'Farms'}
                    </Text>
                    {isSelected && (
                      <View style={styles.checkmarkWrap}>
                        <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
                          <Path
                            d="M5 13l4 4L19 7"
                            stroke="#FFFFFF"
                            strokeWidth={3}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </Svg>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 32,
  },
  errorContainer: {
    marginBottom: 16,
  },
  fieldGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
  },
  input: {
    width: '100%',
    height: 46,
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 14,
    fontSize: 15,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  gridItem: {
    width: '48%',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gridItemText: {
    fontSize: 14,
  },
  rowGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  gridCol: {
    flex: 1,
  },
  dropdownSelect: {
    height: 46,
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dropdownText: {
    fontSize: 15,
  },
  dropdownArrow: {
    fontSize: 14,
  },
  helperText: {
    fontSize: 11,
    marginTop: 5,
  },
  footer: {
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 24,
    borderTopWidth: 1,
    flexDirection: 'row',
    gap: 12,
  },
  footerBtn: {
    flex: 1,
    height: 52,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButton: {
    borderWidth: 1.5,
  },
  nextButton: {
    borderWidth: 0,
  },
  footerBtnText: {
    fontSize: 16,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 36,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  modalCloseText: {
    fontSize: 18,
    color: '#6B7280',
    padding: 4,
  },
  modalList: {
    gap: 8,
  },
  modalOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  modalOptionSelected: {
    backgroundColor: '#F0FDF4',
    borderColor: '#266E2B',
  },
  modalOptionText: {
    fontSize: 15,
    color: '#374151',
    fontWeight: '500',
  },
  modalOptionTextSelected: {
    color: '#266E2B',
    fontWeight: '700',
  },
  checkmarkWrap: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#266E2B',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
