import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
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
          <View style={{ position: 'relative', zIndex: 10 }}>
            <TouchableOpacity
              activeOpacity={0.7}
              style={[
                styles.dropdownSelect,
                {
                  borderColor: colors.borderLight,
                  backgroundColor: colors.white,
                },
              ]}
              onPress={() => setShowFarmsMenu(!showFarmsMenu)}
            >
              <Text style={[styles.dropdownText, { color: colors.onSurface }]}>
                {numberOfFarms}
              </Text>
              <Text style={[styles.dropdownArrow, { color: colors.textSubtle }]}>▾</Text>
            </TouchableOpacity>

            {showFarmsMenu ? (
              <View
                style={[
                  styles.dropdownMenu,
                  {
                    backgroundColor: colors.white,
                    borderColor: colors.borderLight,
                  },
                ]}
              >
                {numFarmsOptions.map((opt) => (
                  <TouchableOpacity
                    key={opt}
                    style={[styles.dropdownOption, { borderBottomColor: colors.borderSoft }]}
                    onPress={() => {
                      setNumberOfFarms(opt);
                      setShowFarmsMenu(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.dropdownOptionText,
                        { color: colors.onSurface },
                        opt === numberOfFarms && { fontWeight: '700', color: colors.brandGreen },
                      ]}
                    >
                      {opt}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            ) : null}
          </View>
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
    paddingBottom: 24,
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
  dropdownMenu: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    borderWidth: 1.5,
    borderRadius: 12,
    elevation: 4,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    zIndex: 100,
  },
  dropdownOption: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
  },
  dropdownOptionText: {
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
});
