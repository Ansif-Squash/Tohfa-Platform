import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  StatusBar,
} from 'react-native';
import Svg, { Circle, Line, Polygon, Defs, Pattern, Rect } from 'react-native-svg';
import { Icon } from '@tohfa/mobile-ui';
import { useTheme, colors, authPalette as P } from '../../theme';

interface ZonesScreenProps {
  onNavigateBack: () => void;
  onNavigateToAddZone: () => void;
  onSave: () => void;
}

export function ZonesScreen({ onNavigateBack, onNavigateToAddZone, onSave }: ZonesScreenProps) {
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
          <Text style={[styles.headerTitle, { color: colors.textDark }]}>Zones</Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSubtle }]}>Divide your farm into zones</Text>
        </View>
        <TouchableOpacity style={styles.helpBtn}>
          <Text style={styles.helpIcon}>?</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.contentScroll} contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>

        {/* FARM SELECTOR */}
        <View style={[styles.farmSelector, { borderColor: colors.borderLight }]}>
          <View style={[styles.farmIconBox, { backgroundColor: colors.brandGreenLight }]}>
            <Icon name="place" size={16} color={colors.brandGreen} />
          </View>
          <View style={styles.farmSelectorText}>
            <Text style={{ fontSize: 10, fontWeight: '800', color: colors.textSubtle, marginBottom: 2 }}>MARKING ZONES FOR</Text>
            <Text style={{ fontSize: 14, fontWeight: '700', color: colors.textDark }}>Your Farm</Text>
          </View>
          <Icon name="expand_more" size={16} color={colors.textSubtle} />
        </View>

        {/* INFO NOTICE */}
        <View style={styles.infoNoticeBox}>
          <Icon name="lightbulb" size={18} color={P.black} style={styles.infoNoticeIcon} />
          <Text style={styles.infoNoticeText}>
            Zones let you plant different crops in different parts of the farm. Each zone gets its own produce calendar, fertigation schedule, and pest tracking.
          </Text>
        </View>

        {/* MAP VIEW */}
        <View style={styles.mapContainer}>
          <View style={[styles.mapBackground, { backgroundColor: P.oliveGreen }]}>
            {/* Simulated map texture */}
            <Svg height="100%" width="100%" style={StyleSheet.absoluteFill}>
              <Defs>
                <Pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <Rect width="40" height="40" fill="none" />
                  <Circle cx="20" cy="20" r="1" fill="rgba(0,0,0,0.1)" />
                  <Line x1="0" y1="0" x2="40" y2="40" stroke="rgba(0,0,0,0.05)" strokeWidth="1" />
                </Pattern>
              </Defs>
              <Rect width="100%" height="100%" fill="url(#grid)" />

              {/* Farm Boundary (Dashed) */}
              <Polygon
                points="70,40 240,30 260,160 230,240 80,250 60,150"
                fill="none"
                stroke={P.yellow500}
                strokeWidth="3"
                strokeDasharray="8,6"
              />

              {/* Zone A (Green) */}
              <Polygon
                points="70,40 240,30 245,100 65,100"
                fill="rgba(27, 94, 32, 0.6)"
                stroke="rgba(27, 94, 32, 0.8)"
                strokeWidth="2"
              />
              <Circle cx="155" cy="65" r="12" fill={P.deepGreen} stroke={colors.white} strokeWidth="2" />
              <Text style={{position: 'absolute', top: 56, left: 150, color: colors.white, fontWeight: '800', fontSize: 12}}>A</Text>

              {/* Zone B (Orange) */}
              <Polygon
                points="65,100 245,100 255,180 75,180"
                fill="rgba(230, 81, 0, 0.6)"
                stroke="rgba(230, 81, 0, 0.8)"
                strokeWidth="2"
              />
              <Circle cx="160" cy="140" r="12" fill={P.orange900} stroke={colors.white} strokeWidth="2" />
              <Text style={{position: 'absolute', top: 131, left: 155, color: colors.white, fontWeight: '800', fontSize: 12}}>B</Text>

              {/* Zone C (Purple) */}
              <Polygon
                points="75,180 255,180 230,240 80,250"
                fill="rgba(69, 39, 160, 0.6)"
                stroke="rgba(69, 39, 160, 0.8)"
                strokeWidth="2"
              />
              <Circle cx="155" cy="215" r="12" fill={P.deepPurple800} stroke={colors.white} strokeWidth="2" />
              <Text style={{position: 'absolute', top: 206, left: 150, color: colors.white, fontWeight: '800', fontSize: 12}}>C</Text>
            </Svg>
          </View>

          {/* Farm boundary tag */}
          <View style={styles.boundaryTag}>
            <Text style={{ color: P.yellow500, fontWeight: '800', marginRight: 4 }}>- -</Text>
            <Text style={{ color: colors.white, fontSize: 12, fontWeight: '700' }}>Farm boundary</Text>
          </View>

          {/* Floating Action Buttons */}
          <View style={styles.floatingActions}>
            <TouchableOpacity style={styles.fabWhite}>
              <Icon name="crop_free" size={18} color={colors.brandGreen} style={styles.fabIcon} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.fabTeal}>
              <Icon name="place" size={18} color={colors.white} style={styles.fabIcon} />
            </TouchableOpacity>
            <TouchableOpacity style={[styles.fabWhite, { opacity: 0.6 }]}>
              <Icon name="undo" size={18} color={colors.textSubtle} style={styles.fabIcon} />
            </TouchableOpacity>
            <TouchableOpacity style={[styles.fabWhite, { opacity: 0.6 }]}>
              <Icon name="check" size={18} color={colors.textSubtle} style={styles.fabIcon} />
            </TouchableOpacity>
          </View>
        </View>

        {/* METRICS ROW */}
        <View style={[styles.metricsRow, { borderColor: colors.borderLight }]}>
          <View style={[styles.metricCol, { borderRightWidth: 1, borderRightColor: colors.borderLight }]}>
            <Text style={[styles.metricVal, { color: colors.textDark }]}>3</Text>
            <Text style={styles.metricLabel}>Total Zones</Text>
          </View>
          <View style={[styles.metricCol, { borderRightWidth: 1, borderRightColor: colors.borderLight }]}>
            <Text style={[styles.metricVal, { color: colors.brandGreen }]}>2.30</Text>
            <Text style={styles.metricLabel}>Marked ac</Text>
          </View>
          <View style={styles.metricCol}>
            <Text style={[styles.metricVal, { color: colors.textSubtle }]}>0.20</Text>
            <Text style={styles.metricLabel}>Unmarked ac</Text>
          </View>
        </View>

        {/* ALL ZONES LIST */}
        <View style={styles.listHeaderRow}>
          <View style={styles.listHeaderTitleRow}>
            <Icon name="folder" size={12} color={colors.brandGreen} style={styles.listHeaderIcon} />
            <Text style={[styles.listHeaderTitle, { color: colors.brandGreen }]}>ALL ZONES</Text>
          </View>
          <TouchableOpacity onPress={onNavigateToAddZone}>
            <Text style={[styles.addZoneBtnText, { color: colors.brandGreen }]}>+ Add Zone</Text>
          </TouchableOpacity>
        </View>

        {/* ZONE A CARD */}
        <View style={[styles.zoneCard, { borderColor: P.deepGreen }]}>
          <View style={styles.zoneCardTop}>
            <View style={[styles.zoneIcon, { backgroundColor: P.deepGreen }]}>
              <Text style={styles.zoneIconText}>A</Text>
            </View>
            <View style={styles.zoneTitleCol}>
              <Text style={[styles.zoneTitle, { color: colors.textDark }]}>Zone A · North Plot</Text>
              <View style={styles.zoneSubRow}>
                <Icon name="crop_free" size={12} color={colors.textSubtle} style={styles.zoneSubIcon} />
                <Text style={[styles.zoneSub, { color: colors.textSubtle }]}>0.90 ac · 5 pts</Text>
              </View>
            </View>
            <View style={styles.zoneActions}>
              <TouchableOpacity style={styles.actionBtn}><Icon name="edit" size={16} color={P.black} /></TouchableOpacity>
              <TouchableOpacity style={[styles.actionBtn, { backgroundColor: P.red50 }]}><Icon name="delete" size={16} color={P.red500} /></TouchableOpacity>
            </View>
          </View>
          <View style={styles.zoneCardDetails}>
            <View style={styles.detailCol}>
              <Text style={styles.detailLabel}>SOIL</Text>
              <Text style={styles.detailValue}>Loamy</Text>
            </View>
            <View style={styles.detailCol}>
              <Text style={styles.detailLabel}>EXPOSURE</Text>
              <Text style={styles.detailValue}>Full sun</Text>
            </View>
            <View style={styles.detailCol}>
              <Text style={styles.detailLabel}>IRRIGATION</Text>
              <Text style={styles.detailValue}>Drip</Text>
            </View>
          </View>
          <View style={[styles.cropPill, { backgroundColor: colors.brandGreenLight }]}>
            <View style={styles.cropPillRow}>
              <Icon name="nutrition" size={12} color={P.deepGreen} style={styles.cropPillIcon} />
              <Text style={[styles.cropPillText, { color: P.deepGreen }]}>Currently: Tomato · Day 62</Text>
            </View>
          </View>
        </View>

        {/* ZONE B CARD */}
        <View style={[styles.zoneCard, { borderColor: P.orange900 }]}>
          <View style={styles.zoneCardTop}>
            <View style={[styles.zoneIcon, { backgroundColor: P.orange900 }]}>
              <Text style={styles.zoneIconText}>B</Text>
            </View>
            <View style={styles.zoneTitleCol}>
              <Text style={[styles.zoneTitle, { color: colors.textDark }]}>Zone B · Middle Terrace</Text>
              <View style={styles.zoneSubRow}>
                <Icon name="crop_free" size={12} color={colors.textSubtle} style={styles.zoneSubIcon} />
                <Text style={[styles.zoneSub, { color: colors.textSubtle }]}>0.85 ac · 4 pts</Text>
              </View>
            </View>
            <View style={styles.zoneActions}>
              <TouchableOpacity style={styles.actionBtn}><Icon name="edit" size={16} color={P.black} /></TouchableOpacity>
              <TouchableOpacity style={[styles.actionBtn, { backgroundColor: P.red50 }]}><Icon name="delete" size={16} color={P.red500} /></TouchableOpacity>
            </View>
          </View>
          <View style={styles.zoneCardDetails}>
            <View style={styles.detailCol}>
              <Text style={styles.detailLabel}>SOIL</Text>
              <Text style={styles.detailValue}>Sandy</Text>
            </View>
            <View style={styles.detailCol}>
              <Text style={styles.detailLabel}>EXPOSURE</Text>
              <Text style={styles.detailValue}>Partial</Text>
            </View>
            <View style={styles.detailCol}>
              <Text style={styles.detailLabel}>IRRIGATION</Text>
              <Text style={styles.detailValue}>Sprinkler</Text>
            </View>
          </View>
          <View style={[styles.cropPill, { backgroundColor: P.lightGreen50 }]}>
            <View style={styles.cropPillRow}>
              <Icon name="nutrition" size={12} color={P.lightGreen900} style={styles.cropPillIcon} />
              <Text style={[styles.cropPillText, { color: P.lightGreen900 }]}>Currently: Carrot · Day 34</Text>
            </View>
          </View>
        </View>

        {/* ZONE C CARD */}
        <View style={[styles.zoneCard, { borderColor: P.deepPurple600, marginBottom: 24 }]}>
          <View style={styles.zoneCardTop}>
            <View style={[styles.zoneIcon, { backgroundColor: P.deepPurple600 }]}>
              <Text style={styles.zoneIconText}>C</Text>
            </View>
            <View style={styles.zoneTitleCol}>
              <Text style={[styles.zoneTitle, { color: colors.textDark }]}>Zone C · Lower Bed</Text>
              <View style={styles.zoneSubRow}>
                <Icon name="crop_free" size={12} color={colors.textSubtle} style={styles.zoneSubIcon} />
                <Text style={[styles.zoneSub, { color: colors.textSubtle }]}>0.55 ac · 4 pts</Text>
              </View>
            </View>
            <View style={styles.zoneActions}>
              <TouchableOpacity style={styles.actionBtn}><Icon name="edit" size={16} color={P.black} /></TouchableOpacity>
              <TouchableOpacity style={[styles.actionBtn, { backgroundColor: P.red50 }]}><Icon name="delete" size={16} color={P.red500} /></TouchableOpacity>
            </View>
          </View>
          <View style={styles.zoneCardDetails}>
            <View style={styles.detailCol}>
              <Text style={styles.detailLabel}>SOIL</Text>
              <Text style={styles.detailValue}>Red soil</Text>
            </View>
            <View style={styles.detailCol}>
              <Text style={styles.detailLabel}>EXPOSURE</Text>
              <Text style={styles.detailValue}>Full sun</Text>
            </View>
            <View style={styles.detailCol}>
              <Text style={styles.detailLabel}>IRRIGATION</Text>
              <Text style={styles.detailValue}>Drip</Text>
            </View>
          </View>
        </View>

      </ScrollView>

      {/* FOOTER */}
      <View style={[styles.footer, { borderTopColor: colors.borderDivider, backgroundColor: colors.bgLight }]}>
        <TouchableOpacity style={[styles.cancelBtn, { borderColor: colors.borderLight }]} onPress={onNavigateBack}>
          <Text style={[styles.cancelBtnText, { color: colors.textDark }]}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.saveBtn, { backgroundColor: colors.brandGreen }]} onPress={onSave}>
          <View style={styles.saveBtnRow}>
            <Icon name="save" size={16} color={colors.white} style={styles.saveBtnIcon} />
            <Text style={styles.saveBtnText}>Save Zones</Text>
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
  helpBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: P.grey300,
    alignItems: 'center',
    justifyContent: 'center',
  },
  helpIcon: { fontSize: 16, color: P.blueGrey600, fontWeight: '700' },

  contentScroll: { flex: 1 },
  contentContainer: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 40 },

  farmSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    backgroundColor: colors.white,
  },
  farmIconBox: {
    width: 40,
    height: 40,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  farmSelectorText: { flex: 1 },

  infoNoticeBox: {
    flexDirection: 'row',
    backgroundColor: P.coolTintBg,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  infoNoticeIcon: { marginRight: 12, marginTop: 2 },
  infoNoticeText: { flex: 1, fontSize: 13, color: P.darkSlateText, lineHeight: 20 },

  mapContainer: {
    width: '100%',
    height: 320,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
    marginBottom: 16,
  },
  mapBackground: {
    ...StyleSheet.absoluteFillObject,
  },
  boundaryTag: {
    position: 'absolute',
    top: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(27, 46, 17, 0.8)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  floatingActions: {
    position: 'absolute',
    bottom: 12,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
  },
  fabWhite: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: P.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  fabTeal: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: P.deepGreen,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: P.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  fabIcon: { fontWeight: '700' },

  metricsRow: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 16,
    marginBottom: 24,
  },
  metricCol: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricVal: { fontSize: 20, fontWeight: '800' },
  metricLabel: { fontSize: 11, fontWeight: '600', color: P.blueGrey400, marginTop: 4 },

  listHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  listHeaderTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  listHeaderIcon: { marginRight: 4 },
  listHeaderTitle: { fontSize: 12, fontWeight: '800', letterSpacing: 0.5 },
  addZoneBtnText: { fontSize: 14, fontWeight: '700' },

  zoneCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    backgroundColor: colors.white,
    marginBottom: 12,
  },
  zoneCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  zoneIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  zoneIconText: { color: colors.white, fontSize: 16, fontWeight: '800' },
  zoneTitleCol: { flex: 1 },
  zoneTitle: { fontSize: 14, fontWeight: '700', marginBottom: 2 },
  zoneSubRow: { flexDirection: 'row', alignItems: 'center' },
  zoneSubIcon: { marginRight: 4 },
  zoneSub: { fontSize: 12 },
  zoneActions: { flexDirection: 'row', gap: 8 },
  actionBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: P.grey100,
    alignItems: 'center',
    justifyContent: 'center',
  },

  zoneCardDetails: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: P.surfaceMuted,
    paddingTop: 12,
    marginBottom: 12,
  },
  detailCol: { flex: 1 },
  detailLabel: { fontSize: 10, fontWeight: '800', color: P.grey500, marginBottom: 4 },
  detailValue: { fontSize: 13, fontWeight: '600', color: P.grey800 },

  cropPill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  cropPillRow: { flexDirection: 'row', alignItems: 'center' },
  cropPillIcon: { marginRight: 4 },
  cropPillText: { fontSize: 12, fontWeight: '700' },

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
