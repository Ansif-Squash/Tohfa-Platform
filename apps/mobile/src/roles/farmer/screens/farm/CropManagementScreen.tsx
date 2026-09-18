import React, { useEffect } from 'react';
import {
  Alert,
  BackHandler,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
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

function LeafEcoIcon({ size = 30, color = colors.brandGreen }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M11 20A7 7 0 0 1 4 13C4 7 11 3 20 3c0 9-4 16-9 17Z"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M4 13c5 0 9 4 9 7"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function TractorIcon({ size = 26, color = P.white }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="6.5" cy="17" r="2.5" stroke={color} strokeWidth="1.8" />
      <Circle cx="17.5" cy="15.5" r="4" stroke={color} strokeWidth="1.8" />
      <Circle cx="17.5" cy="15.5" r="1.2" fill={color} />
      <Path
        d="M4 17H2.5v-4H8l2.5-4H15v6.5"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M10.5 9V5.5H14v3.5"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Line x1="5.5" y1="13" x2="5.5" y2="9" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </Svg>
  );
}

function SoilTerrainIcon({ size = 26, color = P.white }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M2.5 18.5L8.5 7.5L13.5 14.5L16.5 10L21.5 18.5H2.5Z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function PestBugIcon({ size = 26, color = P.white }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M9 7.5a3 3 0 0 1 6 0v0.5H9V7.5z" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <Path d="M8 4L6.5 2M16 4l1.5-2" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <Rect x="7" y="8" width="10" height="11" rx="5" stroke={color} strokeWidth="1.8" />
      <Line x1="12" y1="11" x2="12" y2="19" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <Circle cx="12" cy="15" r="1.2" fill={color} />
      <Path
        d="M7 11.5H3.5M20.5 11.5H17M7 15H3.5M20.5 15H17M7 18.5l-3 1.5M20 20l-3-1.5"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </Svg>
  );
}

function ChevronRightIcon({ size = 18, color = P.twGray400 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M9 18l6-6-6-6"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// ── Types & Data ─────────────────────────────────────────────────────────────

interface ManagementModule {
  id: string;
  code: string;
  title: string;
  description: string;
  bgColor: string;
  icon: (color: string) => React.ReactNode;
}

const MODULES: ManagementModule[] = [
  {
    id: 'input_mgmt',
    code: 'FR-F05',
    title: 'Input Management',
    description: 'Fertilizers, fertigation schedule, approved inputs',
    bgColor: P.forestGreen,
    icon: (color) => <TractorIcon size={26} color={color} />,
  },
  {
    id: 'soil_mgmt',
    code: 'FR-F06',
    title: 'Soil Management',
    description: 'Soil tests, health tracker, amendments, rotation',
    bgColor: P.twAmber800,
    icon: (color) => <SoilTerrainIcon size={26} color={color} />,
  },
  {
    id: 'pest_mgmt',
    code: 'FR-F07',
    title: 'Pest Management',
    description: 'Detection log, pest library, treatment schedule',
    bgColor: P.red700,
    icon: (color) => <PestBugIcon size={26} color={color} />,
  },
];

export interface CropManagementScreenProps {
  onBack?: () => void;
  onNavigateToInputManagement?: () => void;
  onNavigateToSoilManagement?: () => void;
  onNavigateToPestManagement?: () => void;
}

export function CropManagementScreen({
  onBack,
  onNavigateToInputManagement,
  onNavigateToSoilManagement,
  onNavigateToPestManagement,
}: CropManagementScreenProps): React.JSX.Element {
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

  const handleModulePress = (module: ManagementModule) => {
    switch (module.id) {
      case 'input_mgmt':
        if (onNavigateToInputManagement) {
          onNavigateToInputManagement();
        } else {
          Alert.alert('Input Management', 'Fertilizers, fertigation schedule, and approved inputs coming soon.');
        }
        break;
      case 'soil_mgmt':
        if (onNavigateToSoilManagement) {
          onNavigateToSoilManagement();
        } else {
          Alert.alert('Soil Management', 'Soil tests, health tracker, amendments, and rotation coming soon.');
        }
        break;
      case 'pest_mgmt':
        if (onNavigateToPestManagement) {
          onNavigateToPestManagement();
        } else {
          Alert.alert('Pest Management', 'Detection log, pest library, and treatment schedule coming soon.');
        }
        break;
      default:
        break;
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={P.white} />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Top Back Button */}
        <View style={styles.topBar}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={onBack}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <ArrowBackIcon size={20} color={P.deepGreen} />
          </TouchableOpacity>
        </View>

        {/* Center Header Leaf & Title */}
        <View style={styles.headerContainer}>
          <View style={styles.leafCircle}>
            <LeafEcoIcon size={30} color={colors.brandGreen} />
          </View>
          <Text style={styles.title}>Crop Management</Text>
          <Text style={styles.subtitle}>
            Everything about what goes into your soil and onto your crops — in one place.
          </Text>
        </View>

        {/* Modules List */}
        <View style={styles.modulesList}>
          {MODULES.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.card}
              onPress={() => handleModulePress(item)}
              activeOpacity={0.75}
              accessibilityRole="button"
              accessibilityLabel={item.title}
            >
              <View style={[styles.iconBox, { backgroundColor: item.bgColor }]}>
                {item.icon(P.white)}
              </View>

              <View style={styles.cardContent}>
                <Text style={styles.cardCode}>{item.code}</Text>
                <Text style={styles.cardTitle}>{item.title}</Text>
                <Text style={styles.cardDesc}>{item.description}</Text>
              </View>

              <View style={styles.chevronBox}>
                <ChevronRightIcon size={18} color={P.twGray400} />
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: P.white,
  },
  scrollView: {
    flex: 1,
    backgroundColor: P.white,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  topBar: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 4,
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1,
    borderColor: P.twGray200,
    backgroundColor: P.white,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: P.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  headerContainer: {
    alignItems: 'center',
    paddingHorizontal: 24,
    marginTop: 16,
  },
  leafCircle: {
    width: 66,
    height: 66,
    borderRadius: 33,
    backgroundColor: colors.brandGreenLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: P.twGray900,
    marginTop: 18,
    textAlign: 'center',
    letterSpacing: -0.2,
  },
  subtitle: {
    fontSize: 13.5,
    lineHeight: 20,
    color: P.twGray500,
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 16,
  },
  modulesList: {
    marginTop: 28,
    paddingHorizontal: 20,
    gap: 14,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: P.white,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: P.twGray100,
    padding: 16,
    shadowColor: P.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  iconBox: {
    width: 50,
    height: 50,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  cardContent: {
    flex: 1,
    paddingRight: 6,
  },
  cardCode: {
    fontSize: 11,
    fontWeight: '700',
    color: P.slate400,
    letterSpacing: 0.6,
    marginBottom: 2,
  },
  cardTitle: {
    fontSize: 15.5,
    fontWeight: '700',
    color: P.nearBlack,
    letterSpacing: -0.1,
  },
  cardDesc: {
    fontSize: 12.5,
    lineHeight: 16.5,
    color: P.twGray500,
    marginTop: 2,
  },
  chevronBox: {
    paddingLeft: 4,
  },
});
