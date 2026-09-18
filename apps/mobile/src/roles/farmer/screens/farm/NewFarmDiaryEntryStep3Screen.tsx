import React from 'react';
import {
  Platform,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { authPalette as P } from '../../theme';
import type { CropItem } from './ProduceCalendarScreen';

// ─────────────────────────────────────────────
// Success Checkmark Icon
// ─────────────────────────────────────────────

function SuccessCheckmarkIcon({ size = 88 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 88 88" fill="none">
      {/* Light mint outer circle */}
      <Circle cx="44" cy="44" r="44" fill={P.mintTintBg} />
      {/* Green ring */}
      <Circle cx="44" cy="44" r="22" stroke={P.deepGreen} strokeWidth="2.5" />
      {/* Checkmark */}
      <Path
        d="M36 44.5L41.5 50L52 38"
        stroke={P.deepGreen}
        strokeWidth="2.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// ─────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────

export interface NewFarmDiaryEntryStep3ScreenProps {
  crop?: CropItem | null;
  onBack?: () => void;
  onDone?: () => void;
  onSave?: () => void;
}

export function NewFarmDiaryEntryStep3Screen({
  crop,
  onBack: _onBack,
  onDone,
  onSave,
}: NewFarmDiaryEntryStep3ScreenProps): React.JSX.Element {
  const cropName = crop?.name ?? 'Carrot';
  const cropVariety = crop?.variety ?? 'Nantes';
  const cropZone = crop?.zoneShort ?? 'Zone 1';

  const handleFinish = () => {
    if (onDone) {
      onDone();
    } else if (onSave) {
      onSave();
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={P.white} />

      <View style={styles.container}>
        {/* ── Centered Content ── */}
        <View style={styles.centerContent}>
          <SuccessCheckmarkIcon size={96} />

          <Text style={styles.title}>Entry Saved</Text>

          <Text style={styles.subtitle}>
            Your entry has been added to the log for {cropName} — {cropVariety}, {cropZone}.
          </Text>
        </View>

        {/* ── Bottom Done Button ── */}
        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={styles.doneButton}
            onPress={handleFinish}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel="Done"
          >
            <Text style={styles.doneButtonText}>Done</Text>
          </TouchableOpacity>
        </View>
      </View>
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
  container: {
    flex: 1,
    backgroundColor: P.white,
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 24,
  },
  centerContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: P.twGray900,
    letterSpacing: -0.3,
    marginTop: 24,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '500',
    color: P.twGray600,
    lineHeight: 22,
    marginTop: 10,
    textAlign: 'center',
    maxWidth: 290,
  },
  bottomBar: {
    width: '100%',
  },
  doneButton: {
    width: '100%',
    height: 52,
    borderRadius: 14,
    backgroundColor: P.deepGreen,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: P.deepGreen,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  doneButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: P.white,
  },
});
