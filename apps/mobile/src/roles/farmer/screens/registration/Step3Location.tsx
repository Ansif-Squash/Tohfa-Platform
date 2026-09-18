import React, { useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
} from 'react-native';
import Svg, { Path, Circle as SvgCircle, Line } from 'react-native-svg';
import {
  FarmBoundaryMap,
  type FarmBoundaryMapHandle,
  type FarmBoundaryMapMode,
} from '@tohfa/mobile-ui';

const ChevronLeft = ({ size = 24, color = "currentColor" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <Path d="m15 18-6-6 6-6"/>
  </Svg>
);

const Crosshair = ({ size = 24, color = "currentColor" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <SvgCircle cx="12" cy="12" r="10"/>
    <Line x1="12" y1="2" x2="12" y2="6"/>
    <Line x1="12" y1="18" x2="12" y2="22"/>
    <Line x1="4" y1="12" x2="2" y2="12"/>
    <Line x1="22" y1="12" x2="20" y2="12"/>
  </Svg>
);

const PenIcon = ({ size = 24, color = "currentColor" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M12 20h9"/>
    <Path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/>
  </Svg>
);

const LeafIcon = ({ size = 24, color = "currentColor" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2v1c0 5.6-4.5 11.2-11 11.2V20Z"/>
  </Svg>
);

const CheckIcon = ({ size = 24, color = "currentColor" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M20 6 9 17l-5-5"/>
  </Svg>
);

const SolidDot = ({ size = 10, color = "currentColor" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
    <SvgCircle cx="12" cy="12" r="10"/>
  </Svg>
);
import { colors, useTheme } from '../../theme';
import { authPalette as P } from '../../theme';
import type { Step3LocationData } from '../../storage/registrationDraft';
import { calculatePolygonMetrics } from '../../utils/geo';
import { t } from '../../../../i18n/farmer';

interface Step3Props {
  initialData?: Step3LocationData | undefined;
  onSave: (data: Step3LocationData) => void;
  onBack: () => void;
}

export const Step3Location: React.FC<Step3Props> = ({ initialData, onSave, onBack }) => {
  const theme = useTheme();
  const { colors } = theme;

  const mapRef = useRef<FarmBoundaryMapHandle>(null);
  const [mode, setMode] = useState<FarmBoundaryMapMode>('view');
  const isEditing = mode !== 'view';

  const initialRing = initialData?.fmbPolygon?.coordinates?.[0];
  const [coords, setCoords] = useState<number[][]>(initialRing ?? []);

  const metrics = calculatePolygonMetrics(coords);
  const lat = (metrics.centroid.latitude || 11.4064).toFixed(4);
  const lng = (metrics.centroid.longitude || 76.6932).toFixed(4);

  // Real GPS-grounded center: reuse the farm's already-saved boundary centroid
  // if one exists, otherwise let FarmBoundaryMap fall back to the device's
  // current location (see its own `initialCenter` docs) — never the old
  // hardcoded "somewhere in the Nilgiris" DEFAULT_RING this screen used to ship.
  const [mapInitialCenter] = useState<[number, number] | null>(
    initialRing && initialRing.length >= 3
      ? [metrics.centroid.longitude, metrics.centroid.latitude]
      : null,
  );
  const [mapInitialPolygon] = useState<[number, number][] | null>(
    initialRing && initialRing.length >= 3 ? (initialRing as [number, number][]) : null,
  );

  function handlePolygonChange(next: [number, number][]) {
    setCoords(next);
  }

  function handleLocateMe() {
    void mapRef.current?.locateMe();
  }

  /** Top pill: (re)draws the boundary from scratch. */
  function handleDrawBoundary() {
    if (mode === 'draw') {
      mapRef.current?.finish();
      return;
    }
    mapRef.current?.clear();
    mapRef.current?.startDrawing();
  }

  /** Bottom card: adjusts the existing boundary's vertices — only meaningful once one exists. */
  function handleEditBoundary() {
    if (mode === 'edit') {
      mapRef.current?.finish();
      return;
    }
    mapRef.current?.startEditing();
  }

  function handleNextOrSkip() {
    const payload: Step3LocationData = {
      gpsCaptured: true,
      latitude: metrics.centroid.latitude || parseFloat(lat),
      longitude: metrics.centroid.longitude || parseFloat(lng),
      areaAcres: metrics.areaAcres || 0,
      calculatedAreaAcres: metrics.areaAcres || 0,
      calculatedAreaHectares: metrics.areaHectares || 0,
      fmbPolygon: {
        type: 'Polygon',
        coordinates: [coords],
      },
      village: initialData?.village ?? '',
      taluk: initialData?.taluk ?? '',
      district: initialData?.district ?? '',
    };
    onSave(payload);
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.bgLight }]}>

      {/* HEADER OVERRIDE for this specific screen to match the exact design */}
      <View
        style={[
          styles.header,
          {
            backgroundColor: colors.white,
            borderBottomColor: colors.borderSoft,
          },
        ]}
      >
        <View style={styles.headerTitleRow}>
          <TouchableOpacity
            activeOpacity={0.7}
            style={[
              styles.backButtonCircle,
              {
                borderColor: colors.borderMedium,
                backgroundColor: colors.white,
              },
            ]}
            onPress={onBack}
          >
            <ChevronLeft size={22} color={colors.brandGreen} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={[styles.headerTitle, { color: colors.textDark }]}>
              {isEditing ? 'Edit Boundary' : 'Farm Location'}
            </Text>
            <Text style={[styles.headerSubtitle, { color: colors.textSubtle }]}>
              Step 3 of 5 {isEditing && '· Drag points to adjust'}
            </Text>
          </View>
          <TouchableOpacity onPress={handleNextOrSkip}>
            <Text style={[styles.skipText, { color: colors.brandGreen }]}>Skip</Text>
          </TouchableOpacity>
        </View>

        {/* 5 Progress Bar Segments */}
        <View style={styles.progressRow}>
          {[1, 2, 3, 4, 5].map((s) => {
            const isActive = s <= 3;
            return (
              <View
                key={s}
                style={[
                  styles.progressSegment,
                  { backgroundColor: isActive ? colors.brandGreen : colors.borderMedium },
                ]}
              />
            );
          })}
        </View>
      </View>

      {/* MAP AREA — real satellite map + polygon boundary editor (see
          packages/mobile-ui/src/FarmBoundaryMap.tsx). Replaces the fake
          ESRI-static-image + react-native-svg hand-drawn canvas this screen
          used to render. */}
      <View style={styles.mapArea}>
        <FarmBoundaryMap
          ref={mapRef}
          initialCenter={mapInitialCenter}
          initialPolygon={mapInitialPolygon}
          onPolygonChange={handlePolygonChange}
          onModeChange={setMode}
          searchPlaceholder={t('farmer.map.searchPlaceholder')}
          testID="step3-farm-boundary-map"
        />

        {/* Top Floating Badges */}
        <View style={styles.topMapControls} pointerEvents="box-none">
          <View style={styles.coordsBadge} pointerEvents="none">
            <Text style={styles.coordsText}>
              <Crosshair size={12} color={colors.white} />  {lat}, {lng}
            </Text>
          </View>

          <View style={styles.rightControls}>
            {isEditing && (
              <View style={styles.editingBadge} pointerEvents="none">
                <Text style={styles.editingText}>
                  <PenIcon size={13} color={P.black} /> {t('farmer.map.editingBadge')}
                </Text>
              </View>
            )}

            <TouchableOpacity activeOpacity={0.8} style={styles.actionPill} onPress={handleLocateMe}>
              <Text style={styles.actionPillText}>
                <Crosshair size={14} color={P.nearBlack} />  {t('farmer.map.locateMe')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleDrawBoundary}
              style={[
                styles.actionPill,
                mode === 'draw' && { backgroundColor: colors.brandGreen, borderWidth: 0 },
              ]}
            >
              <Text
                style={[
                  styles.actionPillText,
                  mode === 'draw' && { color: colors.white },
                ]}
              >
                <PenIcon size={14} color={mode === 'draw' ? colors.white : P.nearBlack} />
                {'  '}
                {mode === 'draw' ? t('farmer.map.doneDrawing') : t('farmer.map.drawBoundary')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Bottom Card */}
        <View style={styles.bottomCardContainer} pointerEvents="box-none">
          <View style={styles.farmCard}>
            <View style={styles.farmCardHeader}>
              <View style={styles.farmTitleRow}>
                <View style={styles.farmIconWrapper}>
                  {isEditing ? (
                    <PenIcon size={18} color={colors.brandGreen} />
                  ) : (
                    <LeafIcon size={18} color={colors.brandGreen} />
                  )}
                </View>
                <Text style={styles.farmName}>{initialData?.village ? `${initialData.village} Farm` : 'Your Farm'}</Text>
              </View>
              {isEditing ? (
                <View style={styles.badgeEditing}>
                  <Text style={styles.badgeEditingText}>
                    <SolidDot size={9} color={P.orange900} />  Editing
                  </Text>
                </View>
              ) : (
                <View style={styles.badgeLive}>
                  <Text style={styles.badgeLiveText}>
                    <SolidDot size={9} color={colors.brandGreen} />  Live GPS
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.statsRow}>
              <View style={styles.statCol}>
                <Text style={styles.statLabel}>TOTAL AREA</Text>
                <Text style={styles.statValue}>
                  {metrics.areaAcres > 0 ? `${metrics.areaAcres.toFixed(2)} ac` : '—'}
                </Text>
                <Text style={styles.statSub}>
                  {metrics.areaHectares > 0 ? `${metrics.areaHectares.toFixed(2)} ha` : ''}
                </Text>
              </View>
              <View style={styles.statCol}>
                <Text style={styles.statLabel}>FMB PTS</Text>
                <Text style={styles.statValue}>
                  {coords.length > 1 ? coords.length - 1 : coords.length}
                </Text>
                <Text style={styles.statSub}>boundary pts</Text>
              </View>
              <View style={styles.statCol}>
                <Text style={styles.statLabel}>GPS ACCURACY</Text>
                <Text style={[styles.statValue, { color: colors.brandGreen }]}>±8 m</Text>
                <Text style={styles.statSub}>High</Text>
              </View>
            </View>

            <TouchableOpacity
              activeOpacity={0.8}
              style={mode === 'edit' ? styles.doneBtn : styles.editBtn}
              onPress={handleEditBoundary}
              disabled={mode === 'view' && coords.length < 3}
            >
              {mode === 'edit' ? (
                <Text style={styles.doneBtnText}>
                  <CheckIcon size={15} color={colors.white} />  {t('farmer.map.doneEditing')}
                </Text>
              ) : (
                <Text
                  style={[
                    styles.editBtnText,
                    mode === 'view' && coords.length < 3 && { opacity: 0.5 },
                  ]}
                >
                  <PenIcon size={15} color={colors.brandGreen} />  {t('farmer.map.editBoundary')}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Sticky Bottom Footer */}
      <View
        style={[
          styles.footer,
          {
            borderTopColor: colors.borderDivider,
            backgroundColor: colors.white,
          },
        ]}
      >
        <TouchableOpacity
          activeOpacity={0.85}
          style={[
            styles.footerBtn,
            styles.backButton,
            { borderColor: colors.brandGreen, backgroundColor: colors.white },
          ]}
          onPress={onBack}
        >
          <Text style={[styles.footerBtnText, { color: colors.brandGreen }]}>Back</Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.85}
          style={[
            styles.footerBtn,
            styles.nextButton,
            { backgroundColor: colors.brandGreen },
          ]}
          onPress={handleNextOrSkip}
        >
          <Text style={[styles.footerBtnText, { color: colors.white }]}>Next</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 14,
    borderBottomWidth: 1,
    zIndex: 10,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  backButtonCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  headerSubtitle: {
    fontSize: 12,
  },
  skipText: {
    fontSize: 14,
    fontWeight: '600',
  },
  progressRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 14,
  },
  progressSegment: {
    flex: 1,
    height: 5,
    borderRadius: 3,
  },
  mapArea: {
    flex: 1,
    position: 'relative',
  },
  topMapControls: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    zIndex: 10,
  },
  coordsBadge: {
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    height: 36,
    justifyContent: 'center',
  },
  coordsText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '700',
  },
  rightControls: {
    gap: 8,
    alignItems: 'flex-end',
  },
  editingBadge: {
    backgroundColor: P.amber600,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    height: 36,
    justifyContent: 'center',
    marginBottom: 4,
  },
  editingText: {
    color: P.black,
    fontSize: 13,
    fontWeight: '700',
  },
  actionPill: {
    backgroundColor: colors.white,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    height: 36,
    justifyContent: 'center',
    shadowColor: P.black,
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  actionPillText: {
    color: P.nearBlack,
    fontSize: 13,
    fontWeight: '700',
  },
  bottomCardContainer: {
    position: 'absolute',
    bottom: 20,
    left: 16,
    right: 16,
    zIndex: 10,
  },
  farmCard: {
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: 16,
    shadowColor: P.black,
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  farmCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  farmTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  farmName: {
    fontSize: 16,
    fontWeight: '800',
    color: P.nearBlack,
  },
  farmIconWrapper: {
    backgroundColor: colors.brandGreenLight,
    padding: 8,
    borderRadius: 10,
  },
  badgeLive: {
    backgroundColor: colors.brandGreenLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeLiveText: {
    color: colors.brandGreen,
    fontSize: 11,
    fontWeight: '700',
  },
  badgeEditing: {
    backgroundColor: P.orange50,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeEditingText: {
    color: P.orange900,
    fontSize: 11,
    fontWeight: '700',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statCol: {
    flex: 1,
  },
  statLabel: {
    fontSize: 10,
    color: P.grey600,
    fontWeight: '700',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '800',
    color: P.nearBlack,
  },
  statSub: {
    fontSize: 10,
    color: P.grey600,
    marginTop: 2,
  },
  editBtn: {
    borderWidth: 1.5,
    borderColor: colors.brandGreen,
    borderRadius: 12,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editBtnText: {
    color: colors.brandGreen,
    fontSize: 15,
    fontWeight: '700',
  },
  doneBtn: {
    backgroundColor: colors.brandGreen,
    borderRadius: 12,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  doneBtnText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: '700',
  },
  footer: {
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 24,
    borderTopWidth: 1,
    flexDirection: 'row',
    gap: 12,
  },
  footerBtn: {
    flex: 1,
    height: 52,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButton: {
    borderWidth: 1.5,
  },
  nextButton: {
    borderWidth: 0,
  },
  footerBtnText: {
    fontSize: 16,
    fontWeight: '700',
  },
});
