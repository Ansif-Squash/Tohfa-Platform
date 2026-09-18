import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  StatusBar,
  TextInput,
} from 'react-native';
import { Icon } from '@tohfa/mobile-ui';
import { useTheme, colors, authPalette as P } from '../../theme';

interface FieldContextScreenProps {
  onNavigateBack: () => void;
  onNavigateToZones: () => void;
}

export function FieldContextScreen({ onNavigateBack, onNavigateToZones }: FieldContextScreenProps) {
  const { colors } = useTheme();

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: colors.bgLight }]}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.bgLight} />

      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onNavigateBack} style={styles.backBtn}>
          <Icon name="arrow_back" size={24} color={colors.brandGreen} />
        </TouchableOpacity>
        <View style={styles.headerTitleBox}>
          <Text style={[styles.headerTitle, { color: colors.textDark }]}>Field Context</Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSubtle }]}>Land boundary & water source</Text>
        </View>
      </View>

      <ScrollView style={styles.contentScroll} contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>

        {/* INFO NOTICE */}
        <View style={styles.infoNoticeBox}>
          <Icon name="info" size={18} color={P.black} style={styles.infoNoticeIcon} />
          <Text style={styles.infoNoticeText}>
            This context helps TOHFA auditors assess organic-certification compliance. Water source and land boundaries determine buffer and audit requirements.
          </Text>
        </View>

        {/* WATER SOURCE SECTION */}
        <Text style={[styles.sectionTitle, { color: colors.textSubtle }]}>WATER SOURCE</Text>

        <TouchableOpacity style={[styles.dropdownBtn, { borderColor: colors.borderLight }]}>
          <Text style={[styles.dropdownBtnText, { color: colors.textSubtle }]}>+ Add a water source</Text>
          <Icon name="expand_more" size={16} color={colors.textSubtle} />
        </TouchableOpacity>

        <View style={styles.pillsRow}>
          <View style={[styles.pill, { borderColor: colors.brandGreen, backgroundColor: colors.brandGreenLight }]}>
            <View style={styles.pillTextRow}>
              <Icon name="water_drop" size={14} color={colors.brandGreen} style={styles.pillIcon} />
              <Text style={[styles.pillText, { color: colors.brandGreen }]}>Borewell</Text>
            </View>
            <TouchableOpacity style={styles.pillClose}>
              <Icon name="close" size={14} color={colors.brandGreen} />
            </TouchableOpacity>
          </View>
          <View style={[styles.pill, { borderColor: colors.brandGreen, backgroundColor: colors.brandGreenLight }]}>
            <View style={styles.pillTextRow}>
              <Icon name="water_drop" size={14} color={colors.brandGreen} style={styles.pillIcon} />
              <Text style={[styles.pillText, { color: colors.brandGreen }]}>Rainwater harvesting</Text>
            </View>
            <TouchableOpacity style={styles.pillClose}>
              <Icon name="close" size={14} color={colors.brandGreen} />
            </TouchableOpacity>
          </View>
        </View>

        {/* WATER TDS */}
        <View style={styles.tdsHeaderRow}>
          <View style={styles.tdsLabelRow}>
            <Icon name="science" size={14} color={P.blueGrey700} style={styles.tdsLabelIcon} />
            <Text style={styles.tdsLabel}>Water TDS</Text>
          </View>
          <View style={styles.tdsLockedBadge}>
            <View style={styles.tdsLockedBadgeRow}>
              <Icon name="lock" size={11} color={P.brown400} style={styles.tdsLockedBadgeIcon} />
              <Text style={styles.tdsLockedBadgeText}>From soil test</Text>
            </View>
          </View>
        </View>

        <View style={styles.tdsInputRow}>
          <View style={[styles.tdsInputContainer, { backgroundColor: P.grey100 }]}>
            <TextInput
              style={[styles.tdsInput, { color: colors.textSubtle }]}
              value="312"
              editable={false}
            />
          </View>
          <View style={[styles.tdsUnitContainer, { backgroundColor: P.grey100 }]}>
            <Text style={[styles.tdsUnit, { color: colors.textDark }]}>ppm</Text>
          </View>
        </View>

        {/* LAND BOUNDARIES SECTION */}
        <Text style={[styles.sectionTitle, { color: colors.textSubtle, marginTop: 24 }]}>LAND BOUNDARIES</Text>

        <TouchableOpacity style={[styles.cardOption, styles.cardOptionActive, { backgroundColor: P.lightGreen50, borderColor: colors.brandGreen }]}>
          <View style={styles.cardOptionLeft}>
            <Icon name="crop_free" size={20} color={colors.brandGreen} style={styles.cardOptionIcon} />
            <View style={styles.cardOptionTextCol}>
              <Text style={[styles.cardOptionTitle, { color: colors.textDark }]}>Stand alone</Text>
              <Text style={[styles.cardOptionSub, { color: colors.textSubtle }]}>Farm is isolated with no adjacent farming activity</Text>
            </View>
          </View>
          <View style={[styles.cardOptionCheck, { backgroundColor: colors.brandGreen }]}>
            <Icon name="check" size={12} color={colors.white} />
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.cardOption, { borderColor: colors.borderLight }]}>
          <View style={styles.cardOptionLeft}>
            <Icon name="arrow_downward" size={20} color={colors.textSubtle} style={styles.cardOptionIcon} />
            <View style={styles.cardOptionTextCol}>
              <Text style={[styles.cardOptionTitle, { color: colors.textDark }]}>Lower part of hill</Text>
              <Text style={[styles.cardOptionSub, { color: colors.textSubtle }]}>Located at the base or foothill area</Text>
            </View>
          </View>
          <View style={[styles.cardOptionCircle, { borderColor: colors.borderLight }]} />
        </TouchableOpacity>

        <TouchableOpacity style={[styles.cardOption, { borderColor: colors.borderLight, marginBottom: 8 }]}>
          <View style={styles.cardOptionLeft}>
            <Icon name="park" size={20} color={colors.textSubtle} style={styles.cardOptionIcon} />
            <View style={styles.cardOptionTextCol}>
              <Text style={[styles.cardOptionTitle, { color: colors.textDark }]}>Forest boundaries</Text>
              <Text style={[styles.cardOptionSub, { color: colors.textSubtle }]}>Adjacent to reserve forest or wildlife zone</Text>
            </View>
          </View>
          <View style={[styles.cardOptionCircle, { borderColor: colors.borderLight }]} />
        </TouchableOpacity>

      </ScrollView>

      {/* FOOTER */}
      <View style={[styles.footer, { borderTopColor: colors.borderDivider, backgroundColor: colors.bgLight }]}>
        <TouchableOpacity style={[styles.cancelBtn, { borderColor: colors.borderLight }]} onPress={onNavigateBack}>
          <Text style={[styles.cancelBtnText, { color: colors.textDark }]}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.saveBtn, { backgroundColor: colors.brandGreen }]} onPress={onNavigateToZones}>
          <View style={styles.saveBtnRow}>
            <Icon name="check" size={16} color={colors.white} style={styles.saveBtnIcon} />
            <Text style={styles.saveBtnText}>Save Changes</Text>
          </View>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: P.surfaceMuted,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: P.grey300,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerTitleBox: { flex: 1 },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  headerSubtitle: { fontSize: 13, marginTop: 2 },

  contentScroll: { flex: 1 },
  contentContainer: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 40 },

  infoNoticeBox: {
    flexDirection: 'row',
    backgroundColor: P.coolTintBg,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  infoNoticeIcon: { marginRight: 12, marginTop: 2 },
  infoNoticeText: { flex: 1, fontSize: 13, color: P.darkSlateText, lineHeight: 20 },

  sectionTitle: { fontSize: 12, fontWeight: '800', letterSpacing: 0.5, marginBottom: 12 },

  dropdownBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 16,
  },
  dropdownBtnText: { fontSize: 15, fontWeight: '500' },

  pillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 24,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  pillTextRow: { flexDirection: 'row', alignItems: 'center', marginRight: 8 },
  pillIcon: { marginRight: 4 },
  pillText: { fontSize: 14, fontWeight: '700' },
  pillClose: { paddingHorizontal: 4 },

  tdsHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  tdsLabelRow: { flexDirection: 'row', alignItems: 'center', marginRight: 12 },
  tdsLabelIcon: { marginRight: 4 },
  tdsLabel: { fontSize: 14, fontWeight: '700', color: P.blueGrey700 },
  tdsLockedBadge: {
    backgroundColor: P.blushBg,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  tdsLockedBadgeRow: { flexDirection: 'row', alignItems: 'center' },
  tdsLockedBadgeIcon: { marginRight: 4 },
  tdsLockedBadgeText: { fontSize: 11, fontWeight: '700', color: P.brown400 },

  tdsInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  tdsInputContainer: {
    flex: 2,
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 52,
    justifyContent: 'center',
  },
  tdsInput: { fontSize: 16, fontWeight: '600', padding: 0 },
  tdsUnitContainer: {
    flex: 1,
    borderRadius: 12,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tdsUnit: { fontSize: 15, fontWeight: '700' },

  cardOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    backgroundColor: colors.white,
  },
  cardOptionActive: {
    borderWidth: 1.5,
  },
  cardOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  cardOptionIcon: {
    marginRight: 16,
  },
  cardOptionTextCol: {
    flex: 1,
    paddingRight: 16,
  },
  cardOptionTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
  },
  cardOptionSub: {
    fontSize: 13,
    lineHeight: 18,
  },
  cardOptionCheck: {
    width: 24,
    height: 24,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardOptionCircle: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 1,
  },

  footer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    gap: 12,
  },
  cancelBtn: {
    flex: 1,
    height: 52,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: { fontSize: 16, fontWeight: '700' },
  saveBtn: {
    flex: 1.5,
    height: 52,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnRow: { flexDirection: 'row', alignItems: 'center' },
  saveBtnIcon: { marginRight: 6 },
  saveBtnText: { color: colors.white, fontSize: 16, fontWeight: '700' },
});
