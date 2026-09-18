import React from 'react';
import {
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

function CloseIcon({ size = 18, color = P.nearBlack }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M18 6L6 18M6 6l12 12" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function BigTrashIcon({ size = 32, color = P.twOrange600 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M3 6h18" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="10" y1="11" x2="10" y2="17" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="14" y1="11" x2="14" y2="17" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function SmallTrashIcon({ size = 16, color = P.white }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M3 6h18" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="10" y1="11" x2="10" y2="17" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="14" y1="11" x2="14" y2="17" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function WarningTriangleIcon({ size = 18, color = P.twOrange700 }: { size?: number; color?: string }) {
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
      <Circle cx="12" cy="17" r="1" fill={color} />
    </Svg>
  );
}

// Category badges
function TractorBadgeIcon({ size = 20, color = P.twAmber800 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="6" cy="17" r="3" stroke={color} strokeWidth="1.8" />
      <Circle cx="18" cy="15" r="5" stroke={color} strokeWidth="1.8" />
      <Path d="M6 14h6l2-6h4v7" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <Line x1="14" y1="8" x2="14" y2="14" stroke={color} strokeWidth="1.5" />
      <Line x1="11" y1="5" x2="11" y2="8" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </Svg>
  );
}

function WrenchBadgeIcon({ size = 20, color = P.primary }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function EquipmentBadgeIcon({ size = 20, color = P.blue700 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M7 4h10v3H7z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M10 7v9l-2 4h8l-2-4V7" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Line x1="12" y1="11" x2="12" y2="15" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function TreeBadgeIcon({ size = 20, color = colors.brandGreen }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 3L6 13h4l-3 8h10l-3-8h4L12 3z"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Line x1="12" y1="21" x2="12" y2="23" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

// ── Types ────────────────────────────────────────────────────────────────────

export type RemoveCategoryType = 'Tools' | 'Equipment' | 'Trees' | 'Machinery';

export interface RemoveItemData {
  id?: string | undefined;
  name: string;
  category: RemoveCategoryType;
  dateInfo: string;
  serviceEntriesCount?: number | undefined;
  recordedCost?: number | undefined;
}

export interface RemoveItemScreenProps {
  item?: RemoveItemData | undefined;
  onNavigateBack: () => void;
  onConfirmRemove: () => void;
}

export function RemoveItemScreen({
  item,
  onNavigateBack,
  onConfirmRemove,
}: RemoveItemScreenProps): React.JSX.Element {
  const category = item?.category || 'Machinery';
  const name = item?.name || 'Power Tiller';
  const dateInfo = item?.dateInfo || 'Machinery · Purchased 08 Feb 2023';
  const serviceEntriesCount = item?.serviceEntriesCount ?? 3;
  const recordedCost = item?.recordedCost ?? 450;

  function renderCategoryBadgeIcon() {
    switch (category) {
      case 'Machinery':
        return (
          <View style={[styles.itemIconBox, { backgroundColor: P.paleCreamBg }]}>
            <TractorBadgeIcon size={20} color={P.twAmber800} />
          </View>
        );
      case 'Tools':
        return (
          <View style={[styles.itemIconBox, { backgroundColor: P.twGreen100 }]}>
            <WrenchBadgeIcon size={20} color={P.primary} />
          </View>
        );
      case 'Equipment':
        return (
          <View style={[styles.itemIconBox, { backgroundColor: P.paleBlueBg }]}>
            <EquipmentBadgeIcon size={20} color={P.blue700} />
          </View>
        );
      case 'Trees':
        return (
          <View style={[styles.itemIconBox, { backgroundColor: P.paleMintBg }]}>
            <TreeBadgeIcon size={20} color={colors.brandGreen} />
          </View>
        );
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={P.white} />
      <View style={styles.container}>
        {/* ── Header ── */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={onNavigateBack}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Close"
          >
            <CloseIcon size={18} color={P.nearBlack} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Remove Item</Text>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* ── Large Circular Trash Illustration ── */}
          <View style={styles.illustrationWrapper}>
            <View style={styles.bigTrashCircle}>
              <BigTrashIcon size={36} color={P.twOrange600} />
            </View>
          </View>

          {/* ── Heading & Warning Text ── */}
          <Text style={styles.mainHeading}>Remove this item permanently?</Text>
          <Text style={styles.subHeading}>
            This cannot be undone. All service history linked to this item will also be deleted.
          </Text>

          {/* ── Item Summary Card ── */}
          <View style={styles.itemSummaryCard}>
            {renderCategoryBadgeIcon()}
            <View style={styles.itemTextWrap}>
              <Text style={styles.itemNameText}>{name}</Text>
              <Text style={styles.itemDateText}>{dateInfo}</Text>
            </View>
          </View>

          {/* ── Warning Alert Banner ── */}
          <View style={styles.warningAlertBanner}>
            <View style={styles.warningIconWrap}>
              <WarningTriangleIcon size={18} color={P.twOrange700} />
            </View>
            <Text style={styles.warningAlertText}>
              {serviceEntriesCount} service log entries (₹{recordedCost} total recorded cost) will be permanently deleted along with this item.
            </Text>
          </View>

          {/* ── Action Buttons ── */}
          <View style={styles.actionButtonsContainer}>
            {/* Red Remove Permanently Button */}
            <TouchableOpacity
              style={styles.removePermanentlyButton}
              onPress={onConfirmRemove}
              activeOpacity={0.88}
              accessibilityRole="button"
              accessibilityLabel="Yes, Remove Permanently"
            >
              <SmallTrashIcon size={18} color={P.white} />
              <Text style={styles.removePermanentlyText}>Yes, Remove Permanently</Text>
            </TouchableOpacity>

            {/* Cancel Button */}
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={onNavigateBack}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel="Cancel"
            >
              <CloseIcon size={16} color={P.twGray700} />
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
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

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 14,
    backgroundColor: P.white,
    borderBottomWidth: 1,
    borderBottomColor: P.twGray100,
  },
  closeButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    borderColor: P.twGray200,
    backgroundColor: P.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: P.nearBlack,
    letterSpacing: -0.2,
  },

  // Scroll Content
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 36,
    paddingBottom: 40,
    alignItems: 'center',
  },

  // Illustration
  illustrationWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  bigTrashCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: P.palePeachBg,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Headings
  mainHeading: {
    fontSize: 20,
    fontWeight: '700',
    color: P.nearBlack,
    textAlign: 'center',
    marginBottom: 10,
    letterSpacing: -0.2,
  },
  subHeading: {
    fontSize: 13.5,
    color: P.twGray500,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 12,
    marginBottom: 28,
  },

  // Item Summary Card
  itemSummaryCard: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: P.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: P.twGray200,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 16,
  },
  itemIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  itemTextWrap: {
    flex: 1,
  },
  itemNameText: {
    fontSize: 15.5,
    fontWeight: '700',
    color: P.nearBlack,
    marginBottom: 3,
  },
  itemDateText: {
    fontSize: 12.5,
    color: P.twGray500,
  },

  // Warning Alert Banner
  warningAlertBanner: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: P.warnCardBg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: P.warnCardBorder,
    paddingHorizontal: 14,
    paddingVertical: 13,
    marginBottom: 28,
    gap: 10,
  },
  warningIconWrap: {
    marginTop: 1,
  },
  warningAlertText: {
    flex: 1,
    fontSize: 12.5,
    fontWeight: '500',
    color: P.twOrange700,
    lineHeight: 18,
  },

  // Action Buttons
  actionButtonsContainer: {
    width: '100%',
    gap: 12,
  },
  removePermanentlyButton: {
    width: '100%',
    height: 52,
    backgroundColor: P.twRed600,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: P.twRed600,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 3,
  },
  removePermanentlyText: {
    fontSize: 15.5,
    fontWeight: '700',
    color: P.white,
  },
  cancelButton: {
    width: '100%',
    height: 50,
    backgroundColor: P.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: P.twGray200,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  cancelButtonText: {
    fontSize: 15.5,
    fontWeight: '700',
    color: P.twGray700,
  },
});
