import React, { useEffect } from 'react';
import {
  Alert,
  BackHandler,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Circle, Line, Path } from 'react-native-svg';
import { authPalette as P } from '../../theme';

// ─────────────────────────────────────────────
// Inline Vector Icons (strictly no emojis, no raw hex)
// ─────────────────────────────────────────────

function ArrowBackIcon({ size = 20, color = P.twGreen800 }: { size?: number; color?: string }) {
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

function LightbulbIcon({ size = 20, color = P.forestGreen }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M9 18h6M10 22h4M12 2a7 7 0 00-7 7c0 2.6 1.4 4.8 3.5 6h7c2.1-1.2 3.5-3.4 3.5-6a7 7 0 00-7-7z"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Line x1="12" y1="2" x2="12" y2="4" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </Svg>
  );
}

function LeafSproutIcon({ size = 20, color = P.forestGreen }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 21v-7M12 14c-2.5-3-6-2.5-7-2 0 4 3 6 7 2zM12 12c2.5-3 6-2.5 7-2 0 4-3 6-7 2z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle cx="12" cy="18" r="1.5" fill={color} />
    </Svg>
  );
}

function PlusIcon({ size = 18, color = P.white }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 5v14M5 12h14"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// ─────────────────────────────────────────────
// Types & Sample Data
// ─────────────────────────────────────────────

export interface AmendmentItem {
  id: string;
  name: string;
  zoneInfo: string;
  quantity: string;
}

const AMENDMENT_LIST: AmendmentItem[] = [
  {
    id: 'a1',
    name: 'FYM (Farmyard Manure)',
    zoneInfo: 'Zone 1 · 5 days ago',
    quantity: '80 kg',
  },
  {
    id: 'a2',
    name: 'Vermicompost',
    zoneInfo: 'Zone 2 · 3 weeks ago',
    quantity: '45 kg',
  },
  {
    id: 'a3',
    name: 'Neem Cake',
    zoneInfo: 'Zone 1 · 6 weeks ago',
    quantity: '20 kg',
  },
];

export interface SoilAmendmentsLogScreenProps {
  onBack?: (() => void) | undefined;
  onLogAmendment?: (() => void) | undefined;
}

// ─────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────

export function SoilAmendmentsLogScreen({
  onBack,
  onLogAmendment,
}: SoilAmendmentsLogScreenProps): React.JSX.Element {
  // Android hardware back handler
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (onBack) {
        onBack();
        return true;
      }
      return false;
    });
    return () => sub.remove();
  }, [onBack]);

  const handleAdd = () => {
    if (onLogAmendment) {
      onLogAmendment();
    } else {
      Alert.alert('Log Amendment', 'Add a new FYM, compost, or organic amendment entry.');
    }
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
            accessibilityLabel="Go back"
          >
            <ArrowBackIcon size={20} color={P.twGreen800} />
          </TouchableOpacity>

          <View style={styles.headerTitleGroup}>
            <Text style={styles.headerTag}>FR-F06</Text>
            <Text style={styles.headerTitle}>Soil Amendments Log</Text>
            <Text style={styles.headerSubtitle}>FYM, compost & recommendations</Text>
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Recommendation Banner ── */}
        <View style={styles.recommendationBanner}>
          <View style={styles.recommendationIconBox}>
            <LightbulbIcon size={20} color={P.forestGreen} />
          </View>
          <Text style={styles.recommendationText}>
            <Text style={styles.recommendationBold}>Recommended: </Text>
            Zone 3 organic carbon is low — consider adding vermicompost before next sowing.
          </Text>
        </View>

        {/* ── Section Heading ── */}
        <Text style={styles.sectionHeading}>Recent amendments</Text>

        {/* ── Amendments List ── */}
        <View style={styles.amendmentsList}>
          {AMENDMENT_LIST.map((item) => (
            <View key={item.id} style={styles.amendmentCard}>
              <View style={styles.iconBadge}>
                <LeafSproutIcon size={22} color={P.forestGreen} />
              </View>

              <View style={styles.amendmentInfo}>
                <Text style={styles.amendmentName}>{item.name}</Text>
                <Text style={styles.amendmentZone}>{item.zoneInfo}</Text>
              </View>

              <Text style={styles.quantityText}>{item.quantity}</Text>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* ── Bottom Fixed Button ── */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.logBtn}
          onPress={handleAdd}
          activeOpacity={0.88}
          accessibilityRole="button"
          accessibilityLabel="Log Amendment"
        >
          <PlusIcon size={18} color={P.white} />
          <Text style={styles.logBtnText}>Log Amendment</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// ─────────────────────────────────────────────
// Stylesheet
// ─────────────────────────────────────────────

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: P.white,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? 6 : 4,
    paddingBottom: 12,
    backgroundColor: P.white,
    borderBottomWidth: 1,
    borderBottomColor: P.twGray200,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: P.twGray200,
    backgroundColor: P.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    shadowColor: P.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  headerTitleGroup: {
    flex: 1,
  },
  headerTag: {
    fontSize: 11,
    fontWeight: '700',
    color: P.twGray500,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: P.twGray900,
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 12.5,
    fontWeight: '500',
    color: P.twGray500,
    marginTop: 2,
  },
  scrollContainer: {
    flex: 1,
    backgroundColor: P.twGray50,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 32,
  },
  recommendationBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: P.mintTintBg,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: P.twGreen100,
    marginBottom: 20,
    gap: 12,
  },
  recommendationIconBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: P.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  recommendationText: {
    flex: 1,
    fontSize: 12.5,
    color: P.forestGreen,
    lineHeight: 18,
  },
  recommendationBold: {
    fontWeight: '700',
    color: P.twGreen900,
  },
  sectionHeading: {
    fontSize: 13,
    fontWeight: '700',
    color: P.twGray700,
    marginBottom: 12,
  },
  amendmentsList: {
    gap: 10,
  },
  amendmentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: P.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: P.twGray200,
    paddingHorizontal: 14,
    paddingVertical: 14,
    shadowColor: P.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  iconBadge: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: P.mintTintBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  amendmentInfo: {
    flex: 1,
    marginRight: 10,
  },
  amendmentName: {
    fontSize: 15,
    fontWeight: '700',
    color: P.twGray900,
    letterSpacing: -0.2,
  },
  amendmentZone: {
    fontSize: 12,
    color: P.twGray500,
    marginTop: 3,
  },
  quantityText: {
    fontSize: 15,
    fontWeight: '800',
    color: P.twGray900,
  },
  bottomBar: {
    backgroundColor: P.white,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: Platform.OS === 'android' ? 14 : 10,
    borderTopWidth: 1,
    borderTopColor: P.twGray100,
  },
  logBtn: {
    backgroundColor: P.forestGreen,
    height: 48,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: P.forestGreen,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
    gap: 8,
  },
  logBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: P.white,
  },
});
