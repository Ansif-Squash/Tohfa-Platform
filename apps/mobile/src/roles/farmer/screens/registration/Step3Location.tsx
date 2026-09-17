import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  ImageBackground,
} from 'react-native';
import { Icon } from '@tohfa/mobile-ui';
import Svg, { Path, Circle as SvgCircle, Line } from 'react-native-svg';

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

const PlusIcon = ({ size = 24, color = "currentColor" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M5 12h14"/><Path d="M12 5v14"/>
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

interface Step3Props {
  initialData?: Step3LocationData | undefined;
  onSave: (data: Step3LocationData) => void;
  onBack: () => void;
}

export const Step3Location: React.FC<Step3Props> = ({ initialData, onSave, onBack }) => {
  const theme = useTheme();
  const { colors } = theme;

  const [isEditing, setIsEditing] = useState(false);

  // Use dummy coordinates matching the screenshot
  const lat = '11.4064';
  const lng = '76.6932';

  function handleNextOrSkip() {
    // Both Next and Skip move forward with the current or default payload
    const payload: Step3LocationData = {
      gpsCaptured: true,
      latitude: parseFloat(lat),
      longitude: parseFloat(lng),
      village: initialData?.village ?? 'Ooty Rural',
      taluk: initialData?.taluk ?? 'Ooty',
      district: initialData?.district ?? 'Nilgiris',
    };
    onSave(payload);
  }

  // The map image from the prototype
  const mapImageUri =
    'https://i.pinimg.com/1200x/3b/8d/6a/3b8d6a9fe84f73cd5bd9f7d86cb6556b.jpg';

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

      {/* MAP AREA */}
      <View style={styles.mapArea}>
        <ImageBackground
          source={{ uri: mapImageUri }}
          style={styles.mapBackground}
          resizeMode="cover"
        >
          {/* Overlay Darkening */}
          <View style={styles.mapOverlay} />

          {/* Top Floating Badges */}
          <View style={styles.topMapControls}>
            <View style={styles.coordsBadge}>
              <Text style={styles.coordsText}>
                <Crosshair size={12} color={colors.white} />  {lat}, {lng}
              </Text>
            </View>

            <View style={styles.rightControls}>
              {isEditing && (
                <View style={styles.editingBadge}>
                  <Text style={styles.editingText}>
                    <PenIcon size={13} color={P.black} /> Editing boundary
                  </Text>
                </View>
              )}

              <TouchableOpacity activeOpacity={0.8} style={styles.actionPill}>
                <Text style={styles.actionPillText}>
                  <Crosshair size={14} color={P.nearBlack} />  Locate Me
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.8}
                style={[
                  styles.actionPill,
                  isEditing && { backgroundColor: colors.brandGreen, borderWidth: 0 },
                ]}
              >
                <Text
                  style={[
                    styles.actionPillText,
                    isEditing && { color: colors.white },
                  ]}
                >
                  <PenIcon size={14} color={isEditing ? colors.white : P.nearBlack} />  Draw Boundary
                </Text>
              </TouchableOpacity>

              <TouchableOpacity activeOpacity={0.8} style={styles.actionPill}>
                <Text style={styles.actionPillText}>
                  <PlusIcon size={14} color={P.nearBlack} />  Add Zone
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Simulated Polygon Overlay based on state */}
          <View style={styles.polygonSimulation}>
            <View
              style={[
                styles.mockPolygon,
                {
                  borderColor: isEditing ? P.orange500 : colors.brandGreen,
                  backgroundColor: isEditing
                    ? 'rgba(255, 152, 0, 0.15)'
                    : 'rgba(46, 125, 50, 0.15)',
                  borderStyle: isEditing ? 'dashed' : 'solid',
                },
              ]}
            >
              <View style={[styles.dragPoint, { top: -6, left: -6 }]} />
              <View style={[styles.dragPoint, { top: 120, left: -6 }]} />
              <View style={[styles.dragPoint, { bottom: -6, left: 10 }]} />
              <View style={[styles.dragPoint, { bottom: -6, right: 30 }]} />
              <View style={[styles.dragPoint, { top: -6, right: -6 }]} />
              <View style={[styles.dragPoint, { top: 120, right: 10 }]} />

              {/* Zone Markers */}
              <View style={[styles.zoneBadge, { top: 20, left: 20 }]}>
                <SolidDot size={10} color="#F44336" />
                <View style={{ marginLeft: 6 }}>
                  <Text style={styles.zoneBadgeTitle}>Zone A</Text>
                  <Text style={styles.zoneBadgeSub}>Tomato</Text>
                </View>
              </View>

              <View style={[styles.zoneBadge, { top: 130, left: 15 }]}>
                <SolidDot size={10} color="#FF9800" />
                <View style={{ marginLeft: 6 }}>
                  <Text style={styles.zoneBadgeTitle}>Zone B</Text>
                  <Text style={styles.zoneBadgeSub}>Carrot</Text>
                </View>
              </View>

              <View style={[styles.zoneBadge, { bottom: 10, left: 25 }]}>
                <SolidDot size={10} color="#4CAF50" />
                <View style={{ marginLeft: 6 }}>
                  <Text style={styles.zoneBadgeTitle}>Zone C</Text>
                  <Text style={styles.zoneBadgeSub}>Cabbage</Text>
                </View>
              </View>

              {/* Area Badge in center */}
              <View style={styles.areaBadge}>
                <Text style={styles.areaBadgeTitle}>2.45 Acres</Text>
                <Text style={styles.areaBadgeSub}>1.02 Hectares</Text>
              </View>
            </View>
          </View>

          {/* Scale Bar */}
          <View style={styles.scaleBarContainer}>
            <Text style={styles.scaleBarText}>50 m</Text>
            <View style={styles.scaleBarLine} />
          </View>

          {/* Bottom Card */}
          <View style={styles.bottomCardContainer}>
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
                  <Text style={styles.farmName}>Great Earth Organic Farm</Text>
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
                  <Text style={styles.statValue}>2.45 ac</Text>
                  <Text style={styles.statSub}>1.02 ha</Text>
                </View>
                <View style={styles.statCol}>
                  <Text style={styles.statLabel}>ZONES</Text>
                  <Text style={styles.statValue}>3</Text>
                  <Text style={styles.statSub}>A · B · C</Text>
                </View>
                <View style={styles.statCol}>
                  <Text style={styles.statLabel}>GPS ACCURACY</Text>
                  <Text style={[styles.statValue, { color: colors.brandGreen }]}>±8 m</Text>
                  <Text style={styles.statSub}>High</Text>
                </View>
              </View>

              {isEditing ? (
                <TouchableOpacity
                  activeOpacity={0.8}
                  style={styles.doneBtn}
                  onPress={() => setIsEditing(false)}
                >
                  <Text style={styles.doneBtnText}>
                    <CheckIcon size={15} color={colors.white} />  Done Editing
                  </Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  activeOpacity={0.8}
                  style={styles.editBtn}
                  onPress={() => setIsEditing(true)}
                >
                  <Text style={styles.editBtnText}>
                    <PenIcon size={15} color={colors.brandGreen} />  Edit Boundary
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </ImageBackground>
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
  },
  mapBackground: {
    flex: 1,
    width: '100%',
    position: 'relative',
  },
  mapOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  topMapControls: {
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
  polygonSimulation: {
    position: 'absolute',
    top: 150,
    left: 40,
    right: 40,
    bottom: 240,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mockPolygon: {
    width: '100%',
    height: '100%',
    borderWidth: 3,
  },
  dragPoint: {
    position: 'absolute',
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: colors.white,
    borderWidth: 3,
    borderColor: P.orange500,
  },
  bottomCardContainer: {
    position: 'absolute',
    bottom: 20,
    left: 16,
    right: 16,
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
  zoneBadge: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    shadowColor: P.black,
    shadowOpacity: 0.15,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  zoneBadgeTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: P.nearBlack,
  },
  zoneBadgeSub: {
    fontSize: 9,
    color: P.grey600,
  },
  areaBadge: {
    position: 'absolute',
    top: '55%',
    left: '35%',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: 'center',
  },
  areaBadgeTitle: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '800',
  },
  areaBadgeSub: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 10,
    marginTop: 2,
  },
  scaleBarContainer: {
    position: 'absolute',
    bottom: 230,
    right: 20,
    alignItems: 'flex-end',
  },
  scaleBarText: {
    color: colors.white,
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 2,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  scaleBarLine: {
    width: 40,
    height: 4,
    borderBottomWidth: 1.5,
    borderLeftWidth: 1.5,
    borderRightWidth: 1.5,
    borderColor: colors.white,
  },
  farmIconWrapper: {
    backgroundColor: colors.brandGreenLight,
    padding: 8,
    borderRadius: 10,
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
