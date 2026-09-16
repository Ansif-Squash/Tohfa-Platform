import React, { useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  ImageBackground,
} from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import { useTheme } from '../../theme';
import type { Step3LocationData } from '../../storage/registrationDraft';

interface Step3Props {
  initialData?: Step3LocationData | undefined;
  farmName?: string | undefined;
  totalAreaAcres?: number | undefined;
  onSave: (data: Step3LocationData) => void;
  onBack: () => void;
}

// Crisp Vector Icons matching screenshot exactly
const TargetCrosshairIcon: React.FC<{ color?: string; size?: number }> = ({
  color,
  size = 15,
}) => {
  const c = color || 'currentColor';
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="5" stroke={c} strokeWidth={2} />
      <Circle cx="12" cy="12" r="1.5" fill={c} />
      <Path
        d="M12 2v3M12 19v3M2 12h3M19 12h3"
        stroke={c}
        strokeWidth={2}
        strokeLinecap="round"
      />
    </Svg>
  );
};

const PenOutlineIcon: React.FC<{ color?: string; size?: number }> = ({
  color,
  size = 15,
}) => {
  const c = color || 'currentColor';
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 18.5 3 20l1.5-4L16.5 3.5z"
        stroke={c}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
};

const PlusIcon: React.FC<{ color?: string; size?: number }> = ({
  color,
  size = 15,
}) => {
  const c = color || 'currentColor';
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 5v14M5 12h14"
        stroke={c}
        strokeWidth={2.4}
        strokeLinecap="round"
      />
    </Svg>
  );
};

const LeafOutlineIcon: React.FC<{ color?: string; size?: number }> = ({
  color,
  size = 18,
}) => {
  const c = color || 'currentColor';
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M19.5 4.5c-4 0-9 2.5-12 7.5-1.5 2.5-1.5 5.5 0 8 2.5 1.5 5.5 1.5 8 0 5-3 7.5-8 7.5-12-.5-.5-1.5-.5-3.5-3.5Z"
        stroke={c}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M7.5 19.5l7-7"
        stroke={c}
        strokeWidth={1.8}
        strokeLinecap="round"
      />
    </Svg>
  );
};

const BackChevronIcon: React.FC<{ color?: string; size?: number }> = ({
  color,
  size = 18,
}) => {
  const c = color || 'currentColor';
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M15 19l-7-7 7-7"
        stroke={c}
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
};

const ZONE_LETTERS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

interface ZoneItem {
  id: string;
  label: string;
  crop: string;
  dotColorKey: 'zoneDotRed' | 'zoneDotOrange' | 'zoneDotGreen' | 'zoneDotPurple';
}

const DEFAULT_ZONES: ZoneItem[] = [
  { id: '1', label: 'Zone A', crop: 'Tomato', dotColorKey: 'zoneDotRed' },
  { id: '2', label: 'Zone B', crop: 'Carrot', dotColorKey: 'zoneDotOrange' },
  { id: '3', label: 'Zone C', crop: 'Cabbage', dotColorKey: 'zoneDotGreen' },
];

export const Step3Location: React.FC<Step3Props> = ({
  initialData,
  farmName,
  totalAreaAcres,
  onSave,
  onBack,
}) => {
  const theme = useTheme();
  const { colors } = theme;

  // Dynamic farm details
  const farmDisplayName = farmName || 'Great Earth Organic Farm';
  const initialAcres = totalAreaAcres || initialData?.totalAreaAcres || 2.45;
  const [acres, setAcres] = useState<number>(initialAcres);
  const [zonesList, setZonesList] = useState<ZoneItem[]>(DEFAULT_ZONES);
  const [coords, setCoords] = useState<{ lat: string; lng: string }>({
    lat: initialData?.latitude ? initialData.latitude.toFixed(4) : '11.4064',
    lng: initialData?.longitude ? initialData.longitude.toFixed(4) : '76.6932',
  });
  const [gpsAccuracy, setGpsAccuracy] = useState<string>('±8 m');
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [boundaryPreset, setBoundaryPreset] = useState<'standard' | 'expanded' | 'compact'>('standard');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Dynamic hectares calculation
  const hectares = (acres * 0.404686).toFixed(2);
  const zonesCount = zonesList.length;
  const zoneSubtitle = ZONE_LETTERS.slice(0, Math.min(zonesCount, ZONE_LETTERS.length)).join(' · ');

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2200);
  }, []);

  // Locate Me dynamic action
  const handleLocateMe = useCallback(() => {
    setCoords({ lat: '11.4064', lng: '76.6932' });
    setGpsAccuracy('±8 m');
    showToast('GPS Locked: 11.4064, 76.6932 (±8 m)');
  }, [showToast]);

  // Add Zone dynamic action
  const handleAddZone = useCallback(() => {
    setZonesList((prev) => {
      if (prev.length >= 4) {
        showToast('Maximum 4 preview zones on map');
        return prev;
      }
      const nextLetter = ZONE_LETTERS[prev.length] || 'D';
      const newZone: ZoneItem = {
        id: `${prev.length + 1}`,
        label: `Zone ${nextLetter}`,
        crop: 'Potato',
        dotColorKey: 'zoneDotPurple',
      };
      showToast(`Zone ${nextLetter} (Potato) added`);
      return [...prev, newZone];
    });
  }, [showToast]);

  // Boundary editing toggle and cycle handles
  const toggleEditing = useCallback(() => {
    setIsEditing((prev) => {
      const next = !prev;
      if (!next) {
        showToast('Boundary changes saved');
      } else {
        showToast('Tap handles to adjust boundary');
      }
      return next;
    });
  }, [showToast]);

  const cycleBoundarySize = useCallback(() => {
    if (boundaryPreset === 'standard') {
      setBoundaryPreset('expanded');
      setAcres(2.85);
      showToast('Boundary expanded (2.85 ac)');
    } else if (boundaryPreset === 'expanded') {
      setBoundaryPreset('compact');
      setAcres(2.15);
      showToast('Boundary adjusted (2.15 ac)');
    } else {
      setBoundaryPreset('standard');
      setAcres(initialAcres);
      showToast('Boundary reset to standard (2.45 ac)');
    }
  }, [boundaryPreset, initialAcres, showToast]);

  const handleNextOrSkip = useCallback(() => {
    const payload: Step3LocationData = {
      gpsCaptured: true,
      latitude: parseFloat(coords.lat),
      longitude: parseFloat(coords.lng),
      village: initialData?.village ?? 'Ooty Rural',
      taluk: initialData?.taluk ?? 'Ooty',
      district: initialData?.district ?? 'Nilgiris',
      zonesCount,
      totalAreaAcres: acres,
    };
    onSave(payload);
  }, [coords, initialData, zonesCount, acres, onSave]);

  const mapImageUri =
    'https://i.pinimg.com/1200x/3b/8d/6a/3b8d6a9fe84f73cd5bd9f7d86cb6556b.jpg';

  const styles = React.useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={[styles.container, { backgroundColor: colors.white }]}>
      {/* 1. HEADER matching exact screenshot design */}
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
                borderColor: colors.stepCardBorder,
                backgroundColor: colors.white,
              },
            ]}
            onPress={onBack}
          >
            <BackChevronIcon color={colors.buttonBorderGreen} />
          </TouchableOpacity>

          <View style={styles.headerTextCol}>
            <Text style={[styles.headerTitle, { color: colors.textDark }]}>
              Farm Location
            </Text>
            <Text style={[styles.headerSubtitle, { color: colors.statLabelColor }]}>
              Step 3 of 5
            </Text>
          </View>

          <TouchableOpacity onPress={handleNextOrSkip} activeOpacity={0.7}>
            <Text style={[styles.skipText, { color: colors.buttonBorderGreen }]}>
              Skip
            </Text>
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
                  {
                    backgroundColor: isActive
                      ? colors.buttonBgGreen
                      : colors.stepInactiveProgress,
                  },
                ]}
              />
            );
          })}
        </View>
      </View>

      {/* 2. MAP AREA WITH SATELLITE FIELD BACKGROUND */}
      <View style={styles.mapArea}>
        <ImageBackground
          source={{ uri: mapImageUri }}
          style={styles.mapBackground}
          resizeMode="cover"
        >
          {/* Subtle aerial darkening overlay */}
          <View
            style={[
              styles.mapOverlay,
              { backgroundColor: colors.mapDarkOverlay },
            ]}
          />

          {/* Top Controls: Left coordinate badge, Right stacked action pills */}
          <View style={styles.topMapControls}>
            <TouchableOpacity
              activeOpacity={0.8}
              style={[styles.coordsBadge, { backgroundColor: colors.mapBadgeBg }]}
              onPress={handleLocateMe}
            >
              <TargetCrosshairIcon color={colors.targetGreen} size={15} />
              <Text style={styles.coordsText}>
                {coords.lat}, {coords.lng}
              </Text>
            </TouchableOpacity>

            <View style={styles.rightControls}>
              <TouchableOpacity
                activeOpacity={0.85}
                style={styles.actionPill}
                onPress={handleLocateMe}
              >
                <TargetCrosshairIcon color={colors.targetGreen} size={15} />
                <Text style={[styles.actionPillText, { color: colors.charcoal }]}>
                  Locate Me
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.85}
                style={[
                  styles.actionPill,
                  isEditing && {
                    backgroundColor: colors.buttonBgGreen,
                  },
                ]}
                onPress={toggleEditing}
              >
                <PenOutlineIcon
                  color={isEditing ? colors.white : colors.buttonBorderGreen}
                  size={15}
                />
                <Text
                  style={[
                    styles.actionPillText,
                    { color: isEditing ? colors.white : colors.charcoal },
                  ]}
                >
                  Draw Boundary
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.85}
                style={styles.actionPill}
                onPress={handleAddZone}
              >
                <PlusIcon color={colors.buttonBorderGreen} size={15} />
                <Text style={[styles.actionPillText, { color: colors.charcoal }]}>
                  Add Zone
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Center Boundary Field Polygon Overlay with Trapezoidal Shape */}
          <View style={styles.fieldBoundaryContainer} pointerEvents="box-none">
            <View
              style={[
                styles.fieldPolygon,
                {
                  borderColor: isEditing
                    ? colors.mapPolygonEditingBorder
                    : colors.mapPolygonBorder,
                  backgroundColor: colors.polygonFillWarm,
                },
                boundaryPreset === 'expanded' && styles.fieldPolygonExpanded,
                boundaryPreset === 'compact' && styles.fieldPolygonCompact,
              ]}
            >
              {/* Internal Dotted Horizontal Divider Lines for Zones */}
              <View style={[styles.zoneDividerLine, { top: '33%' }]} />
              <View style={[styles.zoneDividerLine, { top: '66%' }]} />

              {/* Floating Zone A Pill */}
              <TouchableOpacity
                activeOpacity={0.85}
                style={[styles.zonePill, styles.zonePillA]}
                onPress={() => showToast('Zone A: Tomato')}
              >
                <View
                  style={[
                    styles.zoneDot,
                    { backgroundColor: colors.zoneDotRed },
                  ]}
                />
                <View>
                  <Text style={[styles.zonePillTitle, { color: colors.textDark }]}>
                    Zone A
                  </Text>
                  <Text style={[styles.zonePillSub, { color: colors.statLabelColor }]}>
                    Tomato
                  </Text>
                </View>
              </TouchableOpacity>

              {/* Floating Zone B Pill */}
              <TouchableOpacity
                activeOpacity={0.85}
                style={[styles.zonePill, styles.zonePillB]}
                onPress={() => showToast('Zone B: Carrot')}
              >
                <View
                  style={[
                    styles.zoneDot,
                    { backgroundColor: colors.zoneDotOrange },
                  ]}
                />
                <View>
                  <Text style={[styles.zonePillTitle, { color: colors.textDark }]}>
                    Zone B
                  </Text>
                  <Text style={[styles.zonePillSub, { color: colors.statLabelColor }]}>
                    Carrot
                  </Text>
                </View>
              </TouchableOpacity>

              {/* Center Acreage Badge on Field */}
              <TouchableOpacity
                activeOpacity={0.85}
                style={[
                  styles.centerAcreageBadge,
                  { backgroundColor: colors.mapCenterBadgeBg },
                ]}
                onPress={cycleBoundarySize}
              >
                <Text style={styles.centerAcreageTitle}>
                  {acres.toFixed(2)} Acres
                </Text>
                <Text
                  style={[
                    styles.centerAcreageSub,
                    { color: colors.mapCenterBadgeSub },
                  ]}
                >
                  {hectares} Hectares
                </Text>
              </TouchableOpacity>

              {/* Floating Zone C Pill */}
              <TouchableOpacity
                activeOpacity={0.85}
                style={[styles.zonePill, styles.zonePillC]}
                onPress={() => showToast('Zone C: Cabbage')}
              >
                <View
                  style={[
                    styles.zoneDot,
                    { backgroundColor: colors.zoneDotGreen },
                  ]}
                />
                <View>
                  <Text style={[styles.zonePillTitle, { color: colors.textDark }]}>
                    Zone C
                  </Text>
                  <Text style={[styles.zonePillSub, { color: colors.statLabelColor }]}>
                    Cabbage
                  </Text>
                </View>
              </TouchableOpacity>

              {/* Dynamic Zone D Pill if user tapped Add Zone */}
              {zonesCount >= 4 && (
                <TouchableOpacity
                  activeOpacity={0.85}
                  style={[styles.zonePill, styles.zonePillD]}
                  onPress={() => showToast('Zone D: Potato')}
                >
                  <View
                    style={[
                      styles.zoneDot,
                      { backgroundColor: colors.zoneDotPurple },
                    ]}
                  />
                  <View>
                    <Text style={[styles.zonePillTitle, { color: colors.textDark }]}>
                      Zone D
                    </Text>
                    <Text style={[styles.zonePillSub, { color: colors.statLabelColor }]}>
                      Potato
                    </Text>
                  </View>
                </TouchableOpacity>
              )}

              {/* Corner Vertices with White Solid Fill and Green Border */}
              <TouchableOpacity
                activeOpacity={0.8}
                style={[styles.vertexPoint, styles.vertexTL]}
                onPress={cycleBoundarySize}
              />
              <TouchableOpacity
                activeOpacity={0.8}
                style={[styles.vertexPoint, styles.vertexML]}
                onPress={cycleBoundarySize}
              />
              <TouchableOpacity
                activeOpacity={0.8}
                style={[styles.vertexPoint, styles.vertexBL]}
                onPress={cycleBoundarySize}
              />
              <TouchableOpacity
                activeOpacity={0.8}
                style={[styles.vertexPoint, styles.vertexMR]}
                onPress={cycleBoundarySize}
              />
              <TouchableOpacity
                activeOpacity={0.8}
                style={[styles.vertexPoint, styles.vertexBR]}
                onPress={cycleBoundarySize}
              />

              {/* Target White Ring near bottom right */}
              <View style={styles.targetRingHandle} />
            </View>
          </View>

          {/* Scale Indicator Bar on Bottom-Right of Map */}
          <View style={styles.scaleContainer} pointerEvents="none">
            <Text style={styles.scaleText}>50 m</Text>
            <View style={styles.scaleRuler} />
          </View>

          {/* Dynamic Toast Feedback Pill */}
          {toastMessage && (
            <View style={styles.toastContainer}>
              <Text style={styles.toastText}>{toastMessage}</Text>
            </View>
          )}

          {/* 3. BOTTOM FLOATING FARM DETAILS CARD */}
          <View style={styles.bottomCardContainer} pointerEvents="box-none">
            <View style={styles.farmCard}>
              {/* Card Header Row */}
              <View style={styles.farmCardHeader}>
                <View style={styles.farmTitleRow}>
                  <View
                    style={[
                      styles.farmIconBadge,
                      { backgroundColor: colors.farmIconBadgeBg },
                    ]}
                  >
                    <LeafOutlineIcon color={colors.accuracyGreen} size={18} />
                  </View>
                  <Text
                    style={[styles.farmName, { color: colors.textDark }]}
                    numberOfLines={1}
                  >
                    {farmDisplayName}
                  </Text>
                </View>

                <View
                  style={[
                    styles.badgeLive,
                    { backgroundColor: colors.liveBadgeBg },
                  ]}
                >
                  <Text style={[styles.badgeLiveDot, { color: colors.liveBadgeText }]}>
                    ●
                  </Text>
                  <Text style={[styles.badgeLiveText, { color: colors.liveBadgeText }]}>
                    Live GPS
                  </Text>
                </View>
              </View>

              {/* 3-Column Stats Row */}
              <View style={styles.statsRow}>
                <View style={styles.statCol}>
                  <Text style={[styles.statLabel, { color: colors.statLabelColor }]}>
                    TOTAL AREA
                  </Text>
                  <Text style={[styles.statValue, { color: colors.textDark }]}>
                    {acres.toFixed(2)} ac
                  </Text>
                  <Text style={[styles.statSub, { color: colors.statSubColor }]}>
                    {hectares} ha
                  </Text>
                </View>

                <View style={styles.statCol}>
                  <Text style={[styles.statLabel, { color: colors.statLabelColor }]}>
                    ZONES
                  </Text>
                  <Text style={[styles.statValue, { color: colors.textDark }]}>
                    {zonesCount}
                  </Text>
                  <Text style={[styles.statSub, { color: colors.statSubColor }]}>
                    {zoneSubtitle}
                  </Text>
                </View>

                <View style={styles.statCol}>
                  <Text style={[styles.statLabel, { color: colors.statLabelColor }]}>
                    GPS ACCURACY
                  </Text>
                  <Text style={[styles.statAccuracyValue, { color: colors.accuracyGreen }]}>
                    {gpsAccuracy}
                  </Text>
                  <Text style={[styles.statSub, { color: colors.statSubColor }]}>
                    High
                  </Text>
                </View>
              </View>

              {/* Card Button: Edit Boundary */}
              <TouchableOpacity
                activeOpacity={0.85}
                style={[
                  styles.editBtn,
                  { borderColor: colors.buttonBorderGreen },
                  isEditing && {
                    backgroundColor: colors.buttonBgGreen,
                    borderColor: colors.buttonBgGreen,
                  },
                ]}
                onPress={toggleEditing}
              >
                <PenOutlineIcon
                  color={isEditing ? colors.white : colors.buttonBorderGreen}
                  size={15}
                />
                <Text
                  style={[
                    styles.editBtnText,
                    { color: isEditing ? colors.white : colors.buttonBorderGreen },
                  ]}
                >
                  {isEditing ? 'Done Editing' : 'Edit Boundary'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ImageBackground>
      </View>

      {/* 4. CLEAN WHITE BOTTOM NAVIGATION FOOTER */}
      <View
        style={[
          styles.footer,
          {
            backgroundColor: colors.white,
            borderTopColor: colors.stepCardBorder,
          },
        ]}
      >
        <TouchableOpacity
          activeOpacity={0.85}
          style={[
            styles.footerBtn,
            styles.backBtn,
            {
              borderColor: colors.buttonBorderGreen,
              backgroundColor: colors.white,
            },
          ]}
          onPress={onBack}
        >
          <Text style={[styles.backBtnText, { color: colors.buttonBorderGreen }]}>
            Back
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.85}
          style={[
            styles.footerBtn,
            styles.nextBtn,
            { backgroundColor: colors.buttonBgGreen },
          ]}
          onPress={handleNextOrSkip}
        >
          <Text style={[styles.nextBtnText, { color: colors.white }]}>
            Next
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const createStyles = (colors: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    header: {
      paddingHorizontal: 20,
      paddingTop: 12,
      paddingBottom: 14,
      borderBottomWidth: 1,
      zIndex: 10,
    },
    headerTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    backButtonCircle: {
      width: 42,
      height: 42,
      borderRadius: 21,
      borderWidth: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerTextCol: {
      flex: 1,
      marginLeft: 14,
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: '700',
      letterSpacing: -0.2,
    },
    headerSubtitle: {
      fontSize: 12.5,
      fontWeight: '500',
      marginTop: 2,
    },
    skipText: {
      fontSize: 15,
      fontWeight: '700',
      paddingHorizontal: 4,
      paddingVertical: 6,
    },
    progressRow: {
      flexDirection: 'row',
      gap: 7,
      marginTop: 14,
    },
    progressSegment: {
      flex: 1,
      height: 4.5,
      borderRadius: 3,
    },
    mapArea: {
      flex: 1,
    },
    mapBackground: {
      flex: 1,
      width: '100%',
      position: 'relative',
      backgroundColor: colors.mapBackgroundFallback,
    },
    mapOverlay: {
      ...StyleSheet.absoluteFillObject,
    },
    topMapControls: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      paddingHorizontal: 16,
      paddingTop: 16,
      zIndex: 20,
    },
    coordsBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 20,
    },
    coordsText: {
      color: colors.white,
      fontSize: 12.5,
      fontWeight: '700',
      letterSpacing: 0.2,
    },
    rightControls: {
      alignItems: 'flex-end',
      gap: 10,
    },
    actionPill: {
      backgroundColor: colors.white,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 7,
      paddingHorizontal: 16,
      paddingVertical: 9,
      borderRadius: 22,
      shadowColor: colors.charcoal,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.14,
      shadowRadius: 4,
      elevation: 4,
    },
    actionPillText: {
      fontSize: 13.5,
      fontWeight: '700',
      letterSpacing: -0.1,
    },
    fieldBoundaryContainer: {
      position: 'absolute',
      top: 90,
      left: 20,
      right: 20,
      bottom: 235,
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 5,
    },
    fieldPolygon: {
      width: '88%',
      height: '84%',
      borderWidth: 2,
      borderRadius: 4,
      position: 'relative',
    },
    fieldPolygonExpanded: {
      width: '95%',
      height: '92%',
    },
    fieldPolygonCompact: {
      width: '78%',
      height: '74%',
    },
    zoneDividerLine: {
      position: 'absolute',
      left: 8,
      right: 8,
      borderBottomWidth: 1.5,
      borderBottomColor: colors.polygonDivider,
      borderStyle: 'dashed',
    },
    zonePill: {
      position: 'absolute',
      backgroundColor: colors.white,
      borderRadius: 14,
      paddingHorizontal: 12,
      paddingVertical: 6,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      shadowColor: colors.charcoal,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.15,
      shadowRadius: 3,
      elevation: 3,
    },
    zonePillA: {
      top: 16,
      left: 14,
    },
    zonePillB: {
      top: '38%',
      left: 12,
    },
    zonePillC: {
      bottom: 14,
      left: 18,
    },
    zonePillD: {
      bottom: 14,
      right: 18,
    },
    zoneDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
    },
    zonePillTitle: {
      fontSize: 12.5,
      fontWeight: '700',
      letterSpacing: -0.1,
    },
    zonePillSub: {
      fontSize: 10,
      fontWeight: '500',
    },
    centerAcreageBadge: {
      position: 'absolute',
      alignSelf: 'center',
      top: '46%',
      borderRadius: 14,
      paddingHorizontal: 18,
      paddingVertical: 9,
      alignItems: 'center',
      shadowColor: colors.charcoal,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 4,
      elevation: 4,
    },
    centerAcreageTitle: {
      color: colors.white,
      fontSize: 16,
      fontWeight: '800',
      letterSpacing: -0.2,
    },
    centerAcreageSub: {
      fontSize: 11,
      fontWeight: '600',
      marginTop: 2,
    },
    vertexPoint: {
      position: 'absolute',
      width: 14,
      height: 14,
      borderRadius: 7,
      backgroundColor: colors.white,
      borderWidth: 2,
      borderColor: colors.targetGreen,
      shadowColor: colors.charcoal,
      shadowOpacity: 0.25,
      shadowRadius: 2,
      elevation: 3,
    },
    vertexTL: { top: -7, left: -7 },
    vertexML: { top: '38%', left: -7 },
    vertexBL: { bottom: -7, left: -7 },
    vertexMR: { top: '35%', right: -7 },
    vertexBR: { bottom: -7, right: -7 },
    targetRingHandle: {
      position: 'absolute',
      bottom: 24,
      right: 36,
      width: 18,
      height: 18,
      borderRadius: 9,
      borderWidth: 2.5,
      borderColor: colors.white,
      backgroundColor: 'transparent',
    },
    scaleContainer: {
      position: 'absolute',
      bottom: 236,
      right: 34,
      alignItems: 'flex-end',
      zIndex: 15,
    },
    scaleText: {
      color: colors.white,
      fontSize: 11,
      fontWeight: '700',
      marginBottom: 3,
      letterSpacing: 0.2,
    },
    scaleRuler: {
      width: 55,
      height: 5,
      borderBottomWidth: 1.5,
      borderLeftWidth: 1.5,
      borderRightWidth: 1.5,
      borderColor: colors.white,
    },
    toastContainer: {
      position: 'absolute',
      top: 75,
      alignSelf: 'center',
      backgroundColor: colors.mapBadgeBg,
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
      zIndex: 30,
      shadowColor: colors.charcoal,
      shadowOpacity: 0.2,
      shadowRadius: 4,
      elevation: 5,
    },
    toastText: {
      color: colors.white,
      fontSize: 12.5,
      fontWeight: '700',
    },
    bottomCardContainer: {
      position: 'absolute',
      bottom: 12,
      left: 16,
      right: 16,
      zIndex: 25,
    },
    farmCard: {
      backgroundColor: colors.white,
      borderRadius: 22,
      padding: 18,
      shadowColor: colors.charcoal,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.12,
      shadowRadius: 10,
      elevation: 6,
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
      gap: 10,
      flex: 1,
      marginRight: 8,
    },
    farmIconBadge: {
      width: 36,
      height: 36,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
    },
    farmName: {
      fontSize: 16,
      fontWeight: '800',
      letterSpacing: -0.2,
      flexShrink: 1,
    },
    badgeLive: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      paddingHorizontal: 10,
      paddingVertical: 4.5,
      borderRadius: 12,
    },
    badgeLiveDot: {
      fontSize: 9,
    },
    badgeLiveText: {
      fontSize: 11.5,
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
      fontSize: 10.5,
      fontWeight: '700',
      letterSpacing: 0.4,
      marginBottom: 4,
    },
    statValue: {
      fontSize: 17.5,
      fontWeight: '800',
      letterSpacing: -0.3,
    },
    statAccuracyValue: {
      fontSize: 17.5,
      fontWeight: '800',
      letterSpacing: -0.3,
    },
    statSub: {
      fontSize: 11,
      fontWeight: '500',
      marginTop: 2,
    },
    editBtn: {
      borderWidth: 1.5,
      borderRadius: 12,
      height: 48,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      backgroundColor: colors.white,
    },
    editBtnText: {
      fontSize: 15,
      fontWeight: '700',
    },
    footer: {
      paddingHorizontal: 20,
      paddingTop: 12,
      paddingBottom: 24,
      borderTopWidth: 1,
      flexDirection: 'row',
      gap: 12,
    },
    footerBtn: {
      flex: 1,
      height: 50,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
    },
    backBtn: {
      borderWidth: 1.5,
    },
    nextBtn: {
      borderWidth: 0,
    },
    backBtnText: {
      fontSize: 16,
      fontWeight: '700',
    },
    nextBtnText: {
      fontSize: 16,
      fontWeight: '700',
    },
  });


