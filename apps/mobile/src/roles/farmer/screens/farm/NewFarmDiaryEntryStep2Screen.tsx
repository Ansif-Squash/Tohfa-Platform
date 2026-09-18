import React, { useState } from 'react';
import {
  Modal,
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
import { authPalette as P } from '../../theme';
import type { CropItem } from './ProduceCalendarScreen';

// ─────────────────────────────────────────────
// Inline Vector Icons (strictly no emoji, no raw hex)
// ─────────────────────────────────────────────

function ArrowBackIcon({ size = 20, color = P.twGray800 }: { size?: number; color?: string }) {
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

function ChevronDownIcon({ size = 18, color = P.twGray500 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M6 9l6 6 6-6"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function LeafIcon({ size = 18, color = P.deepGreen }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 22C6 22 4 17 4 12 4 6.5 8.5 2 12 2c3.5 0 8 4.5 8 10 0 5-2 10-8 10z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M12 22V10M12 14c3-1.5 5-1.5 5-1.5"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// ─────────────────────────────────────────────
// Activity Types Mapping by Category
// ─────────────────────────────────────────────

const ACTIVITY_MAP: Record<string, string[]> = {
  'Crop Care': ['Watering', 'Weeding', 'Staking / Training', 'Pruning', 'Mulching'],
  'Land Prep': ['Ploughing', 'Tilling', 'Bed Preparation', 'Basal Application'],
  Sowing: ['Direct Seeding', 'Transplanting', 'Nursery Sowing'],
  Nutrients: ['Fertilizer', 'Foliar Spray', 'Organic Manure', 'Compost'],
  Monitoring: ['Pest Scouting', 'Growth Check', 'Soil Moisture'],
  Harvesting: ['Primary Harvest', 'Sorting / Grading', 'Packing'],
  Maintenance: ['Fence Repair', 'Irrigation Maintenance', 'Tool Servicing'],
  Other: ['General Inspection', 'Weather Note'],
};

const METHODS = ['Drip', 'Sprinkler', 'Flood', 'Manual'];

// ─────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────

export interface NewFarmDiaryEntryStep2ScreenProps {
  crop?: CropItem | null;
  category?: string;
  onChangeCategory?: () => void;
  onBack?: () => void;
  onNext?: (entryData?: any) => void;
}

export function NewFarmDiaryEntryStep2Screen({
  crop,
  category = 'Crop Care',
  onChangeCategory,
  onBack,
  onNext,
}: NewFarmDiaryEntryStep2ScreenProps): React.JSX.Element {
  const cropName = crop?.name ?? 'Carrot';
  const cropVariety = crop?.variety ?? 'Nantes';
  const cropZone = crop?.zoneShort ?? 'Zone 1';
  const subtitle = `${cropName} — ${cropVariety} · ${cropZone}`;

  const availableActivities: string[] = ACTIVITY_MAP[category] || ACTIVITY_MAP['Crop Care'] || ['Watering', 'Weeding'];
  const [selectedActivity, setSelectedActivity] = useState<string>(availableActivities[0] ?? 'Watering');
  const [dateTimeText, setDateTimeText] = useState('17 Sep 2026, 09:15 AM');
  const [zoneText, setZoneText] = useState(`${cropZone} — ${cropName} (${cropVariety})`);
  const [method, setMethod] = useState('Drip');
  const [durationMinutes, setDurationMinutes] = useState('30');
  const [notes, setNotes] = useState('');

  // Dropdown Modals
  const [showMethodModal, setShowMethodModal] = useState(false);
  const [showZoneModal, setShowZoneModal] = useState(false);

  const zoneOptions = [
    `${cropZone} — ${cropName} (${cropVariety})`,
    'Zone 1 — Upper Field',
    'Zone 2 — Lower Slope',
    'Zone 3 — Terrace Field',
  ];

  const handleSave = () => {
    onNext?.({
      category,
      activity: selectedActivity,
      dateTime: dateTimeText,
      zone: zoneText,
      method,
      duration: durationMinutes,
      notes,
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={P.white} />

      {/* ── Top Header ── */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={onBack}
            activeOpacity={0.7}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            accessibilityRole="button"
            accessibilityLabel="Back"
          >
            <ArrowBackIcon size={18} color={P.twGray800} />
          </TouchableOpacity>

          <View style={styles.headerTitleGroup}>
            <Text style={styles.headerTitle}>Add Diary Entry</Text>
            <Text style={styles.headerSubtitle}>{subtitle}</Text>
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Category Pill Banner ── */}
        <View style={styles.categoryBanner}>
          <View style={styles.categoryBannerLeft}>
            <View style={styles.categoryIconBadge}>
              <LeafIcon size={18} color={P.deepGreen} />
            </View>
            <Text style={styles.categoryBannerTitle}>{category}</Text>
          </View>

          <TouchableOpacity
            onPress={onChangeCategory ?? onBack}
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            accessibilityRole="button"
            accessibilityLabel="Change category"
          >
            <Text style={styles.changeBtnText}>Change</Text>
          </TouchableOpacity>
        </View>

        {/* ── 1. Activity Type ── */}
        <View style={styles.fieldSection}>
          <View style={styles.fieldLabelRow}>
            <Text style={styles.fieldLabel}>ACTIVITY TYPE</Text>
            <Text style={styles.asterisk}> *</Text>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.activityPillsRow}
          >
            {availableActivities.map((act) => {
              const isActive = selectedActivity === act;
              return (
                <TouchableOpacity
                  key={act}
                  style={[
                    styles.activityPill,
                    isActive ? styles.activityPillActive : styles.activityPillInactive,
                  ]}
                  onPress={() => setSelectedActivity(act)}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.activityPillText,
                      isActive ? styles.activityPillTextActive : styles.activityPillTextInactive,
                    ]}
                  >
                    {act}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* ── 2. Date & Time ── */}
        <View style={styles.fieldSection}>
          <View style={styles.fieldLabelRow}>
            <Text style={styles.fieldLabel}>DATE & TIME</Text>
            <Text style={styles.asterisk}> *</Text>
          </View>

          <View style={styles.inputBox}>
            <TextInput
              style={styles.textInput}
              value={dateTimeText}
              onChangeText={setDateTimeText}
              placeholder="e.g. 17 Sep 2026, 09:15 AM"
              placeholderTextColor={P.twGray400}
            />
          </View>
          <Text style={styles.helperText}>Entered manually — no auto-timestamping</Text>
        </View>

        {/* ── 3. Zone / Plot ── */}
        <View style={styles.fieldSection}>
          <View style={styles.fieldLabelRow}>
            <Text style={styles.fieldLabel}>ZONE / PLOT</Text>
            <Text style={styles.asterisk}> *</Text>
          </View>

          <TouchableOpacity
            style={styles.dropdownBox}
            onPress={() => setShowZoneModal(true)}
            activeOpacity={0.8}
          >
            <Text style={styles.dropdownText} numberOfLines={1}>
              {zoneText}
            </Text>
            <ChevronDownIcon size={18} color={P.twGray500} />
          </TouchableOpacity>
        </View>

        {/* ── 4. Method ── */}
        <View style={styles.fieldSection}>
          <Text style={styles.fieldLabel}>METHOD</Text>

          <TouchableOpacity
            style={styles.dropdownBox}
            onPress={() => setShowMethodModal(true)}
            activeOpacity={0.8}
          >
            <Text style={styles.dropdownText}>{method}</Text>
            <ChevronDownIcon size={18} color={P.twGray500} />
          </TouchableOpacity>
        </View>

        {/* ── 5. Duration (Minutes) ── */}
        <View style={styles.fieldSection}>
          <View style={styles.fieldLabelRow}>
            <Text style={styles.fieldLabel}>DURATION (MINUTES)</Text>
            <Text style={styles.asterisk}> *</Text>
          </View>

          <View style={styles.inputBox}>
            <TextInput
              style={styles.textInput}
              value={durationMinutes}
              onChangeText={setDurationMinutes}
              keyboardType="numeric"
              placeholder="30"
              placeholderTextColor={P.twGray400}
            />
          </View>
        </View>

        {/* ── 6. Notes ── */}
        <View style={styles.fieldSection}>
          <Text style={styles.fieldLabel}>NOTES</Text>

          <TextInput
            style={styles.notesInput}
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={3}
            placeholder="Optional notes for this entry"
            placeholderTextColor={P.twGray400}
            textAlignVertical="top"
          />
        </View>

        {/* ── Bottom Action Buttons ── */}
        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={onBack}
            activeOpacity={0.7}
            accessibilityRole="button"
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.saveButton}
            onPress={handleSave}
            activeOpacity={0.85}
            accessibilityRole="button"
          >
            <Text style={styles.saveButtonText}>Save Entry</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* ── Zone Selection Modal ── */}
      <Modal visible={showZoneModal} transparent animationType="fade">
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => setShowZoneModal(false)}
        >
          <View style={styles.pickerModalContent}>
            <Text style={styles.pickerModalTitle}>Select Zone / Plot</Text>
            {zoneOptions.map((opt) => (
              <TouchableOpacity
                key={opt}
                style={[
                  styles.pickerOption,
                  zoneText === opt && styles.pickerOptionSelected,
                ]}
                onPress={() => {
                  setZoneText(opt);
                  setShowZoneModal(false);
                }}
              >
                <Text
                  style={[
                    styles.pickerOptionText,
                    zoneText === opt && styles.pickerOptionTextSelected,
                  ]}
                >
                  {opt}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* ── Method Selection Modal ── */}
      <Modal visible={showMethodModal} transparent animationType="fade">
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => setShowMethodModal(false)}
        >
          <View style={styles.pickerModalContent}>
            <Text style={styles.pickerModalTitle}>Select Method</Text>
            {METHODS.map((m) => (
              <TouchableOpacity
                key={m}
                style={[
                  styles.pickerOption,
                  method === m && styles.pickerOptionSelected,
                ]}
                onPress={() => {
                  setMethod(m);
                  setShowMethodModal(false);
                }}
              >
                <Text
                  style={[
                    styles.pickerOptionText,
                    method === m && styles.pickerOptionTextSelected,
                  ]}
                >
                  {m}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

// ─────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: P.white,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 10,
    backgroundColor: P.white,
    borderBottomWidth: 1,
    borderBottomColor: P.twGray100,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: P.twGray50,
    borderWidth: 1,
    borderColor: P.twGray200,
  },
  headerTitleGroup: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: P.twGray900,
    letterSpacing: -0.2,
  },
  headerSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    color: P.twGray500,
    marginTop: 1,
  },
  scrollContainer: {
    flex: 1,
    backgroundColor: P.white,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 32,
  },
  categoryBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: P.mintTintBg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: P.twGreen100,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginBottom: 16,
  },
  categoryBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  categoryIconBadge: {
    width: 28,
    height: 28,
    borderRadius: 7,
    backgroundColor: P.twGreen100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryBannerTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: P.twGreen900,
  },
  changeBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: P.deepGreen,
  },
  fieldSection: {
    marginBottom: 20,
  },
  fieldLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: P.twGray700,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  asterisk: {
    fontSize: 12,
    fontWeight: '700',
    color: P.red600,
  },
  activityPillsRow: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 2,
  },
  activityPill: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activityPillActive: {
    backgroundColor: P.deepGreen,
  },
  activityPillInactive: {
    backgroundColor: P.white,
    borderWidth: 1,
    borderColor: P.twGray200,
  },
  activityPillText: {
    fontSize: 13,
  },
  activityPillTextActive: {
    fontWeight: '700',
    color: P.white,
  },
  activityPillTextInactive: {
    fontWeight: '500',
    color: P.twGray700,
  },
  inputBox: {
    backgroundColor: P.white,
    borderWidth: 1,
    borderColor: P.twGray200,
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 48,
    justifyContent: 'center',
  },
  textInput: {
    fontSize: 14,
    fontWeight: '500',
    color: P.twGray900,
    padding: 0,
  },
  helperText: {
    fontSize: 11,
    fontWeight: '400',
    color: P.twGray500,
    marginTop: 6,
  },
  dropdownBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: P.white,
    borderWidth: 1,
    borderColor: P.twGray200,
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 48,
  },
  dropdownText: {
    fontSize: 14,
    fontWeight: '500',
    color: P.twGray900,
    flex: 1,
    marginRight: 8,
  },
  notesInput: {
    backgroundColor: P.white,
    borderWidth: 1,
    borderColor: P.twGray200,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: P.twGray900,
    minHeight: 80,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 14,
  },
  cancelButton: {
    flex: 1,
    height: 50,
    borderRadius: 12,
    backgroundColor: P.white,
    borderWidth: 1,
    borderColor: P.twGray300,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: P.twGray800,
  },
  saveButton: {
    flex: 1.5,
    height: 50,
    borderRadius: 12,
    backgroundColor: P.deepGreen,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: P.white,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  pickerModalContent: {
    backgroundColor: P.white,
    borderRadius: 18,
    paddingVertical: 20,
    paddingHorizontal: 18,
    elevation: 5,
  },
  pickerModalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: P.twGray900,
    marginBottom: 14,
  },
  pickerOption: {
    paddingVertical: 13,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  pickerOptionSelected: {
    backgroundColor: P.mintTintBg,
  },
  pickerOptionText: {
    fontSize: 14,
    color: P.twGray800,
    fontWeight: '500',
  },
  pickerOptionTextSelected: {
    color: P.deepGreen,
    fontWeight: '700',
  },
});
