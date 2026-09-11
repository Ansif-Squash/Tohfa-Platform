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
import { useTheme } from '../../theme';

interface ZonesScreenProps {
  onNavigateBack: () => void;
  onNavigateToAddZone: () => void;
  onSave: () => void;
}

export function ZonesScreen({ onNavigateBack, onNavigateToAddZone, onSave }: ZonesScreenProps) {
  const { colors, spacing, typography, weights } = useTheme();

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: colors.bgLight }]}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.bgLight} />

      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onNavigateBack} style={styles.backBtn}>
          <Text style={styles.backIcon}>←</Text>
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
          <View style={[styles.farmIconBox, { backgroundColor: '#E8F5E9' }]}>
            <Text style={{ color: colors.brandGreen, fontSize: 16 }}>⛰️</Text>
          </View>
          <View style={styles.farmSelectorText}>
            <Text style={{ fontSize: 10, fontWeight: '800', color: colors.textSubtle, marginBottom: 2 }}>MARKING ZONES FOR</Text>
            <Text style={{ fontSize: 14, fontWeight: '700', color: colors.textDark }}>Great Earth Organic Farm · 2.5 ac</Text>
          </View>
          <Text style={{ color: colors.textSubtle }}>▼</Text>
        </View>

        {/* INFO NOTICE */}
        <View style={styles.infoNoticeBox}>
          <Text style={styles.infoNoticeIcon}>💡</Text>
          <Text style={styles.infoNoticeText}>
            Zones let you plant different crops in different parts of the farm. Each zone gets its own produce calendar, fertigation schedule, and pest tracking.
          </Text>
        </View>

        {/* MAP VIEW */}
        <View style={styles.mapContainer}>
          <View style={[styles.mapBackground, { backgroundColor: '#3e5c26' }]}>
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
                stroke="#FFEB3B"
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
              <Circle cx="155" cy="65" r="12" fill="#1B5E20" stroke="#FFF" strokeWidth="2" />
              <Text style={{position: 'absolute', top: 56, left: 150, color: '#FFF', fontWeight: '800', fontSize: 12}}>A</Text>

              {/* Zone B (Orange) */}
              <Polygon
                points="65,100 245,100 255,180 75,180"
                fill="rgba(230, 81, 0, 0.6)"
                stroke="rgba(230, 81, 0, 0.8)"
                strokeWidth="2"
              />
              <Circle cx="160" cy="140" r="12" fill="#E65100" stroke="#FFF" strokeWidth="2" />
              <Text style={{position: 'absolute', top: 131, left: 155, color: '#FFF', fontWeight: '800', fontSize: 12}}>B</Text>

              {/* Zone C (Purple) */}
              <Polygon
                points="75,180 255,180 230,240 80,250"
                fill="rgba(69, 39, 160, 0.6)"
                stroke="rgba(69, 39, 160, 0.8)"
                strokeWidth="2"
              />
              <Circle cx="155" cy="215" r="12" fill="#4527A0" stroke="#FFF" strokeWidth="2" />
              <Text style={{position: 'absolute', top: 206, left: 150, color: '#FFF', fontWeight: '800', fontSize: 12}}>C</Text>
            </Svg>
          </View>

          {/* Farm boundary tag */}
          <View style={styles.boundaryTag}>
            <Text style={{ color: '#FFEB3B', fontWeight: '800', marginRight: 4 }}>- -</Text>
            <Text style={{ color: '#FFF', fontSize: 12, fontWeight: '700' }}>Farm boundary</Text>
          </View>

          {/* Floating Action Buttons */}
          <View style={styles.floatingActions}>
            <TouchableOpacity style={styles.fabWhite}>
              <Text style={[styles.fabIcon, { color: colors.brandGreen }]}>⛶</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.fabTeal}>
              <Text style={[styles.fabIcon, { color: '#FFF' }]}>📍</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.fabWhite, { opacity: 0.6 }]}>
              <Text style={[styles.fabIcon, { color: colors.textSubtle }]}>↩</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.fabWhite, { opacity: 0.6 }]}>
              <Text style={[styles.fabIcon, { color: colors.textSubtle }]}>✓</Text>
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
          <Text style={[styles.listHeaderTitle, { color: colors.brandGreen }]}>🗂️ ALL ZONES</Text>
          <TouchableOpacity onPress={onNavigateToAddZone}>
            <Text style={[styles.addZoneBtnText, { color: colors.brandGreen }]}>+ Add Zone</Text>
          </TouchableOpacity>
        </View>

        {/* ZONE A CARD */}
        <View style={[styles.zoneCard, { borderColor: '#1B5E20' }]}>
          <View style={styles.zoneCardTop}>
            <View style={[styles.zoneIcon, { backgroundColor: '#1B5E20' }]}>
              <Text style={styles.zoneIconText}>A</Text>
            </View>
            <View style={styles.zoneTitleCol}>
              <Text style={[styles.zoneTitle, { color: colors.textDark }]}>Zone A · North Plot</Text>
              <Text style={[styles.zoneSub, { color: colors.textSubtle }]}>⛶ 0.90 ac · 5 pts</Text>
            </View>
            <View style={styles.zoneActions}>
              <TouchableOpacity style={styles.actionBtn}><Text>✎</Text></TouchableOpacity>
              <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#FFEBEE' }]}><Text style={{ color: '#F44336' }}>🗑</Text></TouchableOpacity>
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
          <View style={[styles.cropPill, { backgroundColor: '#E8F5E9' }]}>
            <Text style={[styles.cropPillText, { color: '#1B5E20' }]}>🍅 Currently: Tomato · Day 62</Text>
          </View>
        </View>

        {/* ZONE B CARD */}
        <View style={[styles.zoneCard, { borderColor: '#E65100' }]}>
          <View style={styles.zoneCardTop}>
            <View style={[styles.zoneIcon, { backgroundColor: '#E65100' }]}>
              <Text style={styles.zoneIconText}>B</Text>
            </View>
            <View style={styles.zoneTitleCol}>
              <Text style={[styles.zoneTitle, { color: colors.textDark }]}>Zone B · Middle Terrace</Text>
              <Text style={[styles.zoneSub, { color: colors.textSubtle }]}>⛶ 0.85 ac · 4 pts</Text>
            </View>
            <View style={styles.zoneActions}>
              <TouchableOpacity style={styles.actionBtn}><Text>✎</Text></TouchableOpacity>
              <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#FFEBEE' }]}><Text style={{ color: '#F44336' }}>🗑</Text></TouchableOpacity>
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
          <View style={[styles.cropPill, { backgroundColor: '#F1F8E9' }]}>
            <Text style={[styles.cropPillText, { color: '#33691E' }]}>🥕 Currently: Carrot · Day 34</Text>
          </View>
        </View>

        {/* ZONE C CARD */}
        <View style={[styles.zoneCard, { borderColor: '#5E35B1', marginBottom: 24 }]}>
          <View style={styles.zoneCardTop}>
            <View style={[styles.zoneIcon, { backgroundColor: '#5E35B1' }]}>
              <Text style={styles.zoneIconText}>C</Text>
            </View>
            <View style={styles.zoneTitleCol}>
              <Text style={[styles.zoneTitle, { color: colors.textDark }]}>Zone C · Lower Bed</Text>
              <Text style={[styles.zoneSub, { color: colors.textSubtle }]}>⛶ 0.55 ac · 4 pts</Text>
            </View>
            <View style={styles.zoneActions}>
              <TouchableOpacity style={styles.actionBtn}><Text>✎</Text></TouchableOpacity>
              <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#FFEBEE' }]}><Text style={{ color: '#F44336' }}>🗑</Text></TouchableOpacity>
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
          <Text style={styles.saveBtnText}>💾 Save Zones</Text>
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
    borderBottomColor: '#F0F0F0',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  backIcon: { fontSize: 24, color: '#2E7D32', lineHeight: 28 },
  headerTitleBox: { flex: 1 },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  headerSubtitle: { fontSize: 13, marginTop: 2 },
  helpBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  helpIcon: { fontSize: 16, color: '#546E7A', fontWeight: '700' },
  
  contentScroll: { flex: 1 },
  contentContainer: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 40 },

  farmSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    backgroundColor: '#FFF',
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
    backgroundColor: '#EBF4FA',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  infoNoticeIcon: { fontSize: 18, marginRight: 12, marginTop: 2 },
  infoNoticeText: { flex: 1, fontSize: 13, color: '#2C3E50', lineHeight: 20 },

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
    backgroundColor: '#FFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  fabTeal: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#1B5E20',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  fabIcon: { fontSize: 18, fontWeight: '700' },

  metricsRow: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
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
  metricLabel: { fontSize: 11, fontWeight: '600', color: '#78909C', marginTop: 4 },

  listHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  listHeaderTitle: { fontSize: 12, fontWeight: '800', letterSpacing: 0.5 },
  addZoneBtnText: { fontSize: 14, fontWeight: '700' },

  zoneCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    backgroundColor: '#FFF',
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
  zoneIconText: { color: '#FFF', fontSize: 16, fontWeight: '800' },
  zoneTitleCol: { flex: 1 },
  zoneTitle: { fontSize: 14, fontWeight: '700', marginBottom: 2 },
  zoneSub: { fontSize: 12 },
  zoneActions: { flexDirection: 'row', gap: 8 },
  actionBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
  },

  zoneCardDetails: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    paddingTop: 12,
    marginBottom: 12,
  },
  detailCol: { flex: 1 },
  detailLabel: { fontSize: 10, fontWeight: '800', color: '#9E9E9E', marginBottom: 4 },
  detailValue: { fontSize: 13, fontWeight: '600', color: '#424242' },

  cropPill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
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
  saveBtnText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
});
