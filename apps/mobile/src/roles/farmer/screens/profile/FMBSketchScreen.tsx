import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  StatusBar,
} from 'react-native';
import Svg, { Circle, Line, Polygon } from 'react-native-svg';
import { Icon } from '@tohfa/mobile-ui';
import { colors, useTheme } from '../../theme';
import { authPalette as P } from '../../theme';

interface FMBSketchScreenProps {
  onNavigateBack: () => void;
  onNavigateToFieldContext: () => void;
}

type TabType = 'Draw' | 'Upload';

export function FMBSketchScreen({ onNavigateBack, onNavigateToFieldContext }: FMBSketchScreenProps) {
  const { colors } = useTheme();
  const [activeTab, setActiveTab] = useState<TabType>('Draw');

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: colors.bgLight }]}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.bgLight} />

      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onNavigateBack} style={styles.backBtn}>
          <Icon name="arrow_back" size={24} color={colors.brandGreen} />
        </TouchableOpacity>
        <View style={styles.headerTitleBox}>
          <Text style={[styles.headerTitle, { color: colors.textDark }]}>FMB Sketch</Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSubtle }]}>Farm map boundary</Text>
        </View>
        <TouchableOpacity style={[styles.addBtn, { backgroundColor: colors.brandGreen }]}>
          <Text style={styles.addBtnIcon}>+</Text>
        </TouchableOpacity>
      </View>

      {/* TABS */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[
            styles.tabButton,
            activeTab === 'Draw'
              ? { backgroundColor: colors.brandGreen }
              : { backgroundColor: P.surfaceMuted },
          ]}
          onPress={() => setActiveTab('Draw')}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'Draw' ? { color: colors.white } : { color: colors.textSubtle },
            ]}
          >
            <Icon name="place" size={14} color={activeTab === 'Draw' ? colors.white : colors.textSubtle} /> Draw on Map
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.tabButton,
            activeTab === 'Upload'
              ? { backgroundColor: colors.brandGreen }
              : { backgroundColor: P.surfaceMuted },
          ]}
          onPress={() => setActiveTab('Upload')}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'Upload' ? { color: colors.white } : { color: colors.textSubtle },
            ]}
          >
            <Icon name="description" size={14} color={activeTab === 'Upload' ? colors.white : colors.textSubtle} /> Upload FMB
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.contentScroll} contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
        {activeTab === 'Draw' ? (
          <>
            {/* MAP MOCKUP */}
            <View style={styles.mapContainer}>
              <View style={[styles.mapBackground, { backgroundColor: P.oliveGreen }]}>
                {/* Simulated grid lines to look like map tiles */}
                <Svg height="100%" width="100%" style={StyleSheet.absoluteFill}>
                  <Line x1="0" y1="50" x2="400" y2="50" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
                  <Line x1="0" y1="150" x2="400" y2="150" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
                  <Line x1="0" y1="250" x2="400" y2="250" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
                  <Line x1="100" y1="0" x2="100" y2="400" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
                  <Line x1="200" y1="0" x2="200" y2="400" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />

                  {/* FMB Polygon */}
                  <Polygon
                    points="80,50 250,40 300,150 240,240 90,250 50,140"
                    fill="rgba(38, 166, 154, 0.2)"
                    stroke={P.teal400}
                    strokeWidth="3"
                  />
                  <Circle cx="80" cy="50" r="6" fill={colors.white} stroke={P.orange500} strokeWidth="3" />
                  <Circle cx="250" cy="40" r="6" fill={colors.white} stroke={P.orange500} strokeWidth="3" />
                  <Circle cx="300" cy="150" r="6" fill={colors.white} stroke={P.orange500} strokeWidth="3" />
                  <Circle cx="240" cy="240" r="6" fill={colors.white} stroke={P.orange500} strokeWidth="3" />
                  <Circle cx="90" cy="250" r="6" fill={colors.white} stroke={P.orange500} strokeWidth="3" />
                  <Circle cx="50" cy="140" r="6" fill={colors.white} stroke={P.orange500} strokeWidth="3" />

                  {/* Center pin */}
                  <Circle cx="160" cy="140" r="4" fill={colors.white} stroke={P.red500} strokeWidth="2" />
                </Svg>
              </View>

              {/* Floating map tags */}
              <View style={styles.coordTag}>
                <Text style={styles.coordText}>
                  <Icon name="gps_fixed" size={12} color={colors.white} /> 11.4064, 76.6932
                </Text>
              </View>
              <View style={styles.accuracyTag}>
                <Text style={styles.accuracyText}>
                  <Icon name="gps_fixed" size={12} color={colors.brandGreen} /> ±8 m
                </Text>
              </View>
              <View style={styles.scaleTag}>
                <Text style={styles.scaleText}>50 m</Text>
                <View style={styles.scaleLine} />
              </View>

              {/* Floating Action Buttons */}
              <View style={styles.floatingActions}>
                <TouchableOpacity style={styles.fabWhite}>
                  <Icon name="gps_fixed" size={20} color={colors.brandGreen} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.fabTeal}>
                  <Icon name="edit" size={20} color={colors.white} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.fabWhite}>
                  <Icon name="undo" size={20} color={colors.brandGreen} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.fabWhite}>
                  <Icon name="delete" size={20} color={P.red500} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Metrics Row */}
            <View style={styles.metricsRow}>
              <View style={[styles.metricBox, { borderColor: colors.borderLight }]}>
                <Text style={[styles.metricVal, { color: colors.textDark }]}>6</Text>
                <Text style={[styles.metricLabel, { color: colors.textSubtle }]}>Points</Text>
              </View>
              <View style={[styles.metricBox, { borderColor: colors.borderLight }]}>
                <Text style={[styles.metricVal, { color: colors.textDark }]}>
                  2.45<Text style={styles.metricValUnit}> ac</Text>
                </Text>
                <Text style={[styles.metricLabel, { color: colors.textSubtle }]}>Area</Text>
              </View>
              <View style={[styles.metricBox, { borderColor: colors.borderLight }]}>
                <Text style={[styles.metricVal, { color: colors.textDark }]}>3</Text>
                <Text style={[styles.metricLabel, { color: colors.textSubtle }]}>Zones</Text>
              </View>
            </View>
          </>
        ) : (
          <>
            {/* UPLOAD FMB TAB */}
            <View style={[styles.uploadCard, { borderColor: colors.brandGreen, backgroundColor: P.lightGreen50 }]}>
              <View style={styles.uploadCardLeft}>
                <View style={[styles.uploadDocIcon, { backgroundColor: colors.brandGreen }]}>
                  <Icon name="description" size={20} color={colors.white} />
                </View>
                <View style={styles.uploadDocInfo}>
                  <Text style={[styles.uploadDocName, { color: colors.textDark }]}>FMB_survey_142B.pdf</Text>
                  <Text style={[styles.uploadDocSize, { color: colors.textSubtle }]}>2.1 MB · uploaded from VAO records</Text>
                </View>
              </View>
              <TouchableOpacity style={styles.uploadDocTrash}>
                <Icon name="delete" size={18} color={P.red500} />
              </TouchableOpacity>
            </View>

            <View style={styles.attachedNotice}>
              <Text style={{ color: colors.brandGreen, fontWeight: '700', fontSize: 14 }}>
                <Icon name="check" size={14} color={colors.brandGreen} /> Document attached
              </Text>
            </View>

            <View style={styles.infoNoticeBox}>
              <Text style={styles.infoNoticeText}>
                <Text style={{ fontWeight: '700' }}>Don't have an FMB document?</Text> Upload is optional — you can draw the boundary directly on the map. A TOHFA field officer will verify during the audit visit. Useful if you already have survey papers from the VAO or Revenue Department.
              </Text>
            </View>
          </>
        )}

        {/* YOUR FARMS LIST */}
        <Text style={[styles.sectionTitle, { color: colors.textSubtle }]}>YOUR FARMS</Text>

        <View style={[styles.farmCard, { borderColor: colors.borderLight }]}>
          <View style={styles.farmCardLeft}>
            <View style={[styles.farmIndexCircle, { backgroundColor: colors.brandGreen }]}>
              <Text style={styles.farmIndexText}>1</Text>
            </View>
            <View style={styles.farmInfo}>
              <Text style={[styles.farmName, { color: colors.textDark }]}>Great Earth Organic Farm</Text>
              <Text style={[styles.farmSub, { color: colors.textSubtle }]}>
                <Icon name="place" size={12} color={colors.textSubtle} /> Kotagiri · 2.45 ac · {activeTab === 'Draw' ? '6 pts' : 'FMB attached'}
              </Text>
            </View>
          </View>
          <View style={styles.farmCardActions}>
            <TouchableOpacity style={styles.actionBtn}>
              <Icon name="edit" size={16} color={P.black} />
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionBtn, { backgroundColor: P.red50 }]}>
              <Icon name="delete" size={16} color={P.red500} />
            </TouchableOpacity>
          </View>
        </View>

        {activeTab === 'Upload' && (
          <TouchableOpacity style={[styles.dashedBtn, { borderColor: colors.brandGreen, backgroundColor: P.lightGreen50 }]}>
            <Text style={[styles.dashedBtnText, { color: colors.brandGreen }]}>+ Add another farm</Text>
          </TouchableOpacity>
        )}

      </ScrollView>

      {/* FOOTER */}
      <View style={[styles.footer, { borderTopColor: colors.borderDivider, backgroundColor: colors.bgLight }]}>
        <TouchableOpacity style={[styles.saveBtn, { backgroundColor: colors.brandGreen }]} onPress={onNavigateToFieldContext}>
          <Text style={styles.saveBtnText}>
            <Icon name="description" size={16} color={colors.white} /> Save FMB
          </Text>
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
  addBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtnIcon: { color: colors.white, fontSize: 24, lineHeight: 26 },

  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 16,
    gap: 12,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  tabText: { fontSize: 14, fontWeight: '700' },

  contentScroll: { flex: 1 },
  contentContainer: { paddingHorizontal: 20, paddingBottom: 40 },

  mapContainer: {
    width: '100%',
    height: 350,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
    marginBottom: 16,
  },
  mapBackground: {
    ...StyleSheet.absoluteFillObject,
  },
  coordTag: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
  },
  coordText: { color: colors.white, fontSize: 12, fontWeight: '600' },
  accuracyTag: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: colors.white,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
  },
  accuracyText: { color: colors.brandGreen, fontSize: 12, fontWeight: '700' },
  scaleTag: {
    position: 'absolute',
    bottom: 16,
    left: 16,
  },
  scaleText: { color: colors.white, fontSize: 11, fontWeight: '600', marginBottom: 2 },
  scaleLine: { width: 40, height: 2, backgroundColor: colors.white },

  floatingActions: {
    position: 'absolute',
    right: 12,
    top: '30%',
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
    backgroundColor: P.tealAccent,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: P.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },

  metricsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  metricBox: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
  },
  metricVal: { fontSize: 22, fontWeight: '800' },
  metricValUnit: { fontSize: 14, fontWeight: '600' },
  metricLabel: { fontSize: 12, marginTop: 4 },

  uploadCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  uploadCardLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  uploadDocIcon: {
    width: 40,
    height: 48,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  uploadDocInfo: { flex: 1 },
  uploadDocName: { fontSize: 15, fontWeight: '700', marginBottom: 4 },
  uploadDocSize: { fontSize: 12 },
  uploadDocTrash: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: P.red50,
    alignItems: 'center',
    justifyContent: 'center',
  },

  attachedNotice: {
    alignItems: 'center',
    marginBottom: 16,
  },

  infoNoticeBox: {
    backgroundColor: P.coolSurfaceBg,
    borderWidth: 1,
    borderColor: P.blueGrey100,
    borderRadius: 8,
    padding: 16,
    marginBottom: 24,
  },
  infoNoticeText: { fontSize: 13, color: P.blueGrey800, lineHeight: 20 },

  sectionTitle: { fontSize: 12, fontWeight: '700', letterSpacing: 0.5, marginBottom: 12 },

  farmCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    backgroundColor: colors.white,
    marginBottom: 12,
  },
  farmCardLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  farmIndexCircle: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  farmIndexText: { color: colors.white, fontSize: 16, fontWeight: '700' },
  farmInfo: { flex: 1 },
  farmName: { fontSize: 15, fontWeight: '700', marginBottom: 4 },
  farmSub: { fontSize: 12 },
  farmCardActions: { flexDirection: 'row', gap: 8 },
  actionBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: P.grey100,
    alignItems: 'center',
    justifyContent: 'center',
  },

  dashedBtn: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  dashedBtnText: { fontSize: 15, fontWeight: '700' },

  footer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
  },
  saveBtn: {
    width: '100%',
    height: 52,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnText: { color: colors.white, fontSize: 16, fontWeight: '700' },
});
