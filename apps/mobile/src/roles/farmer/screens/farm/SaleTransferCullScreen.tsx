import React, { useState } from 'react';
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
import Svg, { Circle, Line, Path, Rect } from 'react-native-svg';
import { authPalette as P, colors } from '../../theme';

// ── SVG Icons ────────────────────────────────────────────────────────────────

function ArrowBackIcon({ size = 20, color = P.deepGreen }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M19 12H5M5 12L12 19M5 12L12 5"
        stroke={color}
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function WarningTriangleIcon({ size = 18, color = P.twRed600 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Line x1="12" y1="9" x2="12" y2="13" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="12" y1="17" x2="12.01" y2="17" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function TagIcon({ size = 16, color = P.white }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle cx="7" cy="7" r="1.5" fill={color} />
    </Svg>
  );
}

function TransferArrowsIcon({ size = 16, color = P.twGray700 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M4 17h16M16 13l4 4-4 4" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M20 7H4M8 11L4 7l4-4" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function CalendarIcon({ size = 18, color = P.twGray400 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="4" width="18" height="18" rx="2" stroke={color} strokeWidth="2" />
      <Line x1="16" y1="2" x2="16" y2="6" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="8" y1="2" x2="8" y2="6" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="3" y1="10" x2="21" y2="10" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function TraceabilityIdCardIcon({ size = 18, color = P.twBlue700 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="4" width="18" height="16" rx="2" stroke={color} strokeWidth="2" />
      <Circle cx="8.5" cy="10" r="2" stroke={color} strokeWidth="1.8" />
      <Path d="M14 9h4M14 13h4M6 16h12" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </Svg>
  );
}

// ── Types ────────────────────────────────────────────────────────────────────

export interface SaleTransferCullScreenProps {
  animalId?: string;
  animalName?: string;
  animalCode?: string;
  onBack?: () => void;
  onSuccess?: () => void;
}

type EventType = 'sale' | 'transfer' | 'cull';

export function SaleTransferCullScreen({
  animalId = 'a1',
  animalName = 'Lakshmi',
  animalCode = 'C-014',
  onBack,
  onSuccess,
}: SaleTransferCullScreenProps): React.JSX.Element {
  const [eventType, setEventType] = useState<EventType>('sale');
  const [date, setDate] = useState('16 Jul 2026');
  const [buyer, setBuyer] = useState('');
  const [salePrice, setSalePrice] = useState('');
  const [destinationFarm, setDestinationFarm] = useState('');
  const [cullReason, setCullReason] = useState('Old age / low yield');

  const handleSubmit = () => {
    const actionName =
      eventType === 'sale' ? 'Sale recorded' : eventType === 'transfer' ? 'Transfer recorded' : 'Cull recorded';

    Alert.alert(
      actionName,
      `Terminal event successfully saved for ${animalName} (${animalCode}). Animal is archived for organic audit trails.`,
      [
        {
          text: 'OK',
          onPress: () => {
            if (onSuccess) onSuccess();
            else if (onBack) onBack();
          },
        },
      ],
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={P.white} />
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* ── Top Header ── */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={onBack}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Back"
          >
            <ArrowBackIcon size={20} color={P.deepGreen} />
          </TouchableOpacity>

          <View style={styles.headerTitles}>
            <Text style={styles.headerTitle}>Sale / Transfer / Cull</Text>
            <Text style={styles.headerSubtitle}>
              {animalName} · {animalCode}
            </Text>
          </View>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* ── Terminal Event Warning Card ── */}
          <View style={styles.warningAlertCard}>
            <View style={styles.warningAccentBar} />
            <View style={styles.warningCardContent}>
              <View style={styles.warningHeaderRow}>
                <WarningTriangleIcon size={18} color={P.twOrange700} />
                <Text style={styles.warningTitle}>This is a terminal event</Text>
              </View>
              <Text style={styles.warningBody}>
                {animalName} will leave the active livestock list once saved. The record is kept for
                the audit trail.
              </Text>
            </View>
          </View>

          {/* ── 3-Way Segmented Toggle: Sale | Transfer | Cull ── */}
          <View style={styles.segmentedContainer}>
            {/* Sale */}
            <TouchableOpacity
              style={[
                styles.segmentBtn,
                eventType === 'sale' && styles.segmentBtnActiveSale,
              ]}
              onPress={() => setEventType('sale')}
              activeOpacity={0.8}
            >
              <TagIcon size={15} color={eventType === 'sale' ? P.white : P.twGray700} />
              <Text
                style={[
                  styles.segmentText,
                  eventType === 'sale' && styles.segmentTextActive,
                ]}
              >
                Sale
              </Text>
            </TouchableOpacity>

            {/* Transfer */}
            <TouchableOpacity
              style={[
                styles.segmentBtn,
                eventType === 'transfer' && styles.segmentBtnActiveSale,
              ]}
              onPress={() => setEventType('transfer')}
              activeOpacity={0.8}
            >
              <TransferArrowsIcon
                size={15}
                color={eventType === 'transfer' ? P.white : P.twGray700}
              />
              <Text
                style={[
                  styles.segmentText,
                  eventType === 'transfer' && styles.segmentTextActive,
                ]}
              >
                Transfer
              </Text>
            </TouchableOpacity>

            {/* Cull */}
            <TouchableOpacity
              style={[
                styles.segmentBtn,
                eventType === 'cull' && styles.segmentBtnActiveSale,
              ]}
              onPress={() => setEventType('cull')}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.segmentText,
                  eventType === 'cull' && styles.segmentTextActive,
                ]}
              >
                Cull
              </Text>
            </TouchableOpacity>
          </View>

          {/* ── Form Fields ── */}
          <View style={styles.formContainer}>
            {/* Date * */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>
                Date <Text style={styles.requiredAsterisk}>*</Text>
              </Text>
              <TouchableOpacity
                style={styles.datePickerInput}
                activeOpacity={0.8}
                onPress={() => {
                  Alert.prompt
                    ? Alert.prompt('Date', 'Enter event date (DD Mon YYYY):', (val) => {
                        if (val) setDate(val);
                      })
                    : null;
                }}
              >
                <Text style={styles.datePickerValText}>{date}</Text>
                <CalendarIcon size={18} color={P.twGray400} />
              </TouchableOpacity>
            </View>

            {/* Sale specific fields */}
            {eventType === 'sale' && (
              <>
                {/* Buyer */}
                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>Buyer</Text>
                  <TextInput
                    style={styles.textInput}
                    value={buyer}
                    onChangeText={setBuyer}
                    placeholder="Buyer name or farm"
                    placeholderTextColor={P.twGray400}
                  />
                </View>

                {/* Sale price */}
                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>Sale price</Text>
                  <TextInput
                    style={styles.textInput}
                    value={salePrice}
                    onChangeText={setSalePrice}
                    placeholder="₹ 0"
                    placeholderTextColor={P.twGray400}
                    keyboardType="numeric"
                  />
                </View>
              </>
            )}

            {/* Transfer specific fields */}
            {eventType === 'transfer' && (
              <>
                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>Destination Farm / Holding</Text>
                  <TextInput
                    style={styles.textInput}
                    value={destinationFarm}
                    onChangeText={setDestinationFarm}
                    placeholder="e.g. Ooty Dairy Collective"
                    placeholderTextColor={P.twGray400}
                  />
                </View>
              </>
            )}

            {/* Cull specific fields */}
            {eventType === 'cull' && (
              <>
                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>Reason for Culling</Text>
                  <TextInput
                    style={styles.textInput}
                    value={cullReason}
                    onChangeText={setCullReason}
                    placeholder="e.g. Chronic mastitis / Old age"
                    placeholderTextColor={P.twGray400}
                  />
                </View>
              </>
            )}

            {/* Traceability Audit Notice */}
            <View style={styles.traceabilityNoticeCard}>
              <TraceabilityIdCardIcon size={19} color={P.twBlue700} />
              <Text style={styles.traceabilityNoticeText}>
                A traceability record links {animalName}&apos;s full history to the buyer — required
                for organic audit.
              </Text>
            </View>
          </View>
        </ScrollView>

        {/* ── Bottom Submit Button (Coral/Orange for Terminal Event) ── */}
        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={styles.recordSaleButton}
            onPress={handleSubmit}
            activeOpacity={0.88}
            accessibilityRole="button"
            accessibilityLabel={
              eventType === 'sale'
                ? 'Record sale'
                : eventType === 'transfer'
                  ? 'Record transfer'
                  : 'Record cull'
            }
          >
            <TagIcon size={18} color={P.white} />
            <Text style={styles.recordSaleButtonText}>
              {eventType === 'sale'
                ? 'Record sale'
                : eventType === 'transfer'
                  ? 'Record transfer'
                  : 'Record cull'}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: P.white,
  },
  container: {
    flex: 1,
    backgroundColor: P.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: P.twGray100,
    backgroundColor: P.white,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: P.twGray200,
    backgroundColor: P.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
    shadowColor: P.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  headerTitles: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: P.nearBlack,
    letterSpacing: -0.2,
  },
  headerSubtitle: {
    fontSize: 12.5,
    color: P.twGray400,
    marginTop: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 110,
  },

  // Warning Banner
  warningAlertCard: {
    flexDirection: 'row',
    backgroundColor: P.twOrange50,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: P.twOrange200,
    marginBottom: 18,
  },
  warningAccentBar: {
    width: 4,
    backgroundColor: P.twOrange600,
  },
  warningCardContent: {
    flex: 1,
    padding: 14,
    gap: 4,
  },
  warningHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  warningTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    color: P.twOrange700,
  },
  warningBody: {
    fontSize: 12.5,
    color: P.twGray600,
    lineHeight: 18,
  },

  // 3-Way Segmented Control
  segmentedContainer: {
    flexDirection: 'row',
    backgroundColor: P.twGray100,
    borderRadius: 14,
    padding: 4,
    gap: 4,
    marginBottom: 20,
  },
  segmentBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
  },
  segmentBtnActiveSale: {
    backgroundColor: colors.brandGreen,
    shadowColor: P.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  segmentText: {
    fontSize: 13.5,
    fontWeight: '600',
    color: P.twGray600,
  },
  segmentTextActive: {
    color: P.white,
    fontWeight: '700',
  },

  // Form Fields
  formContainer: {
    gap: 16,
  },
  fieldGroup: {
    gap: 6,
  },
  fieldLabel: {
    fontSize: 13.5,
    fontWeight: '600',
    color: P.twGray700,
    marginBottom: 2,
  },
  requiredAsterisk: {
    color: P.twRed500,
  },
  textInput: {
    height: 48,
    backgroundColor: P.white,
    borderWidth: 1,
    borderColor: P.twGray200,
    borderRadius: 12,
    paddingHorizontal: 14,
    fontSize: 14.5,
    color: P.nearBlack,
  },
  datePickerInput: {
    height: 48,
    backgroundColor: P.white,
    borderWidth: 1,
    borderColor: P.twGray200,
    borderRadius: 12,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  datePickerValText: {
    fontSize: 14.5,
    color: P.nearBlack,
    fontWeight: '500',
  },

  // Traceability Notice
  traceabilityNoticeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: P.paleBlueBg,
    borderRadius: 14,
    padding: 14,
    gap: 12,
    borderWidth: 1,
    borderColor: P.sky100,
    marginTop: 4,
  },
  traceabilityNoticeText: {
    flex: 1,
    fontSize: 12.5,
    lineHeight: 18,
    color: P.slate700,
  },

  // Bottom Floating Button
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: P.white,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 28 : 16,
    borderTopWidth: 1,
    borderTopColor: P.twGray100,
  },
  recordSaleButton: {
    height: 50,
    backgroundColor: P.twOrange600,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: P.twOrange600,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  recordSaleButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: P.white,
  },
});
