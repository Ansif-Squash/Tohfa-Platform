import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  StatusBar,
} from 'react-native';
import {
  FarmBoundaryMap,
  Icon,
  type FarmBoundaryMapHandle,
  type FarmBoundaryMapMode,
} from '@tohfa/mobile-ui';
import { colors, useTheme } from '../../theme';
import { authPalette as P } from '../../theme';
import { calculatePolygonMetrics } from '../../utils/geo';
import { t } from '../../../../i18n/farmer';

interface FMBSketchScreenProps {
  onNavigateBack: () => void;
  onNavigateToFieldContext: () => void;
}

type TabType = 'Draw' | 'Upload';

export function FMBSketchScreen({ onNavigateBack, onNavigateToFieldContext }: FMBSketchScreenProps) {
  const { colors } = useTheme();
  const [activeTab, setActiveTab] = useState<TabType>('Draw');

  const mapRef = useRef<FarmBoundaryMapHandle>(null);
  const [mode, setMode] = useState<FarmBoundaryMapMode>('view');
  const [coords, setCoords] = useState<[number, number][]>([]);
  const metrics = calculatePolygonMetrics(coords);
  const pointCount = coords.length > 1 ? coords.length - 1 : coords.length;

  function handlePolygonChange(next: [number, number][]) {
    setCoords(next);
  }

  function handleLocateMe() {
    void mapRef.current?.locateMe();
  }

  /** Teal FAB: the one draw/edit toggle this screen has (see Screen 17's FAB stack). */
  function handleToggleDraw() {
    if (mode !== 'view') {
      mapRef.current?.finish();
      return;
    }
    if (coords.length >= 3) {
      mapRef.current?.startEditing();
    } else {
      mapRef.current?.startDrawing();
    }
  }

  function handleUndo() {
    mapRef.current?.undo();
  }

  function handleClear() {
    mapRef.current?.clear();
  }

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
            {/* MAP — real satellite map + polygon boundary editor (see
                packages/mobile-ui/src/FarmBoundaryMap.tsx). Replaces the fake
                ESRI-static-image + permanently-drawn react-native-svg
                polygon this screen used to render. */}
            <View style={styles.mapContainer}>
              <FarmBoundaryMap
                initialCenter={null}
                initialPolygon={null}
                onPolygonChange={handlePolygonChange}
                onModeChange={setMode}
                searchPlaceholder={t('farmer.map.searchPlaceholder')}
                ref={mapRef}
                testID="fmb-sketch-farm-boundary-map"
              />

              {/* Floating Action Buttons */}
              <View style={styles.floatingActions} pointerEvents="box-none">
                <TouchableOpacity
                  style={styles.fabWhite}
                  onPress={handleLocateMe}
                  accessibilityLabel={t('farmer.map.locateMe')}
                >
                  <Icon name="gps_fixed" size={20} color={colors.brandGreen} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.fabTeal}
                  onPress={handleToggleDraw}
                  accessibilityLabel={
                    mode !== 'view'
                      ? t('farmer.map.doneDrawing')
                      : coords.length >= 3
                        ? t('farmer.map.editBoundary')
                        : t('farmer.map.drawBoundary')
                  }
                >
                  <Icon name={mode !== 'view' ? 'check' : 'edit'} size={20} color={colors.white} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.fabWhite}
                  onPress={handleUndo}
                  accessibilityLabel={t('farmer.map.undo')}
                >
                  <Icon name="undo" size={20} color={colors.brandGreen} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.fabWhite}
                  onPress={handleClear}
                  accessibilityLabel={t('farmer.map.clear')}
                >
                  <Icon name="delete" size={20} color={P.red500} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Metrics Row */}
            <View style={styles.metricsRow}>
              <View style={[styles.metricBox, { borderColor: colors.borderLight }]}>
                <Text style={[styles.metricVal, { color: colors.textDark }]}>
                  {coords.length > 0 ? pointCount : '—'}
                </Text>
                <Text style={[styles.metricLabel, { color: colors.textSubtle }]}>Points</Text>
              </View>
              <View style={[styles.metricBox, { borderColor: colors.borderLight }]}>
                <Text style={[styles.metricVal, { color: colors.textDark }]}>
                  {metrics.areaAcres > 0 ? metrics.areaAcres.toFixed(2) : '—'}
                  <Text style={styles.metricValUnit}> ac</Text>
                </Text>
                <Text style={[styles.metricLabel, { color: colors.textSubtle }]}>Area</Text>
              </View>
              <View style={[styles.metricBox, { borderColor: colors.borderLight }]}>
                <Text style={[styles.metricVal, { color: colors.textDark }]}>—</Text>
                <Text style={[styles.metricLabel, { color: colors.textSubtle }]}>Zones</Text>
              </View>
            </View>
          </>
        ) : (
          <>
            {/* UPLOAD FMB TAB */}
            <View style={[styles.uploadCard, { borderColor: colors.borderLight, backgroundColor: P.lightGreen50 }]}>
              <View style={styles.uploadCardLeft}>
                <View style={[styles.uploadDocIcon, { backgroundColor: colors.textSubtle }]}>
                  <Icon name="description" size={20} color={colors.white} />
                </View>
                <View style={styles.uploadDocInfo}>
                  <Text style={[styles.uploadDocName, { color: colors.textSubtle }]}>No document uploaded yet</Text>
                  <Text style={[styles.uploadDocSize, { color: colors.textSubtle }]}>Tap below to upload your FMB document</Text>
                </View>
              </View>
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
              <Text style={[styles.farmName, { color: colors.textDark }]}>Your Farm</Text>
              <Text style={[styles.farmSub, { color: colors.textSubtle }]}>
                <Icon name="place" size={12} color={colors.textSubtle} />{' '}
                {activeTab === 'Upload'
                  ? 'Upload FMB document'
                  : metrics.areaAcres > 0
                    ? `${metrics.areaAcres.toFixed(2)} ac · ${pointCount} pts`
                    : 'Draw boundary to get area'}
              </Text>
            </View>
          </View>
        </View>

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
