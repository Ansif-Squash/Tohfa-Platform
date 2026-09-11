import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  ImageBackground,
  Dimensions,
} from 'react-native';
import { useTheme } from '../../theme';
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
            <Text style={[styles.backButtonArrow, { color: colors.brandGreen }]}>‹</Text>
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
                ⌖ {lat}, {lng}
              </Text>
            </View>

            <View style={styles.rightControls}>
              {isEditing && (
                <View style={styles.editingBadge}>
                  <Text style={styles.editingText}>✎ Editing boundary</Text>
                </View>
              )}
              
              <TouchableOpacity activeOpacity={0.8} style={styles.actionPill}>
                <Text style={styles.actionPillText}>⌖ Locate Me</Text>
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
                  ✎ Draw Boundary
                </Text>
              </TouchableOpacity>

              <TouchableOpacity activeOpacity={0.8} style={styles.actionPill}>
                <Text style={styles.actionPillText}>+ Add Zone</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Simulated Polygon Overlay based on state */}
          <View style={styles.polygonSimulation}>
            <View
              style={[
                styles.mockPolygon,
                {
                  borderColor: isEditing ? '#FF9800' : colors.brandGreen,
                  backgroundColor: isEditing
                    ? 'rgba(255, 152, 0, 0.15)'
                    : 'rgba(46, 125, 50, 0.15)',
                  borderStyle: isEditing ? 'dashed' : 'solid',
                },
              ]}
            >
              {isEditing && (
                <>
                  <View style={[styles.dragPoint, { top: -6, left: -6 }]} />
                  <View style={[styles.dragPoint, { top: -6, right: -6 }]} />
                  <View style={[styles.dragPoint, { bottom: -6, left: -6 }]} />
                  <View style={[styles.dragPoint, { bottom: -6, right: -6 }]} />
                  <View style={[styles.dragPoint, { top: '50%', left: -6 }]} />
                  <View style={[styles.dragPoint, { top: '50%', right: -6 }]} />
                </>
              )}
            </View>
          </View>

          {/* Bottom Card */}
          <View style={styles.bottomCardContainer}>
            <View style={styles.farmCard}>
              <View style={styles.farmCardHeader}>
                <View style={styles.farmTitleRow}>
                  <Text style={styles.farmIcon}>{isEditing ? '✎' : '🍃'}</Text>
                  <Text style={styles.farmName}>Great Earth Organic Farm</Text>
                </View>
                {isEditing ? (
                  <View style={styles.badgeEditing}>
                    <Text style={styles.badgeEditingText}>● Editing</Text>
                  </View>
                ) : (
                  <View style={styles.badgeLive}>
                    <Text style={styles.badgeLiveText}>● Live GPS</Text>
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
                  <Text style={styles.doneBtnText}>✓ Done Editing</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  activeOpacity={0.8}
                  style={styles.editBtn}
                  onPress={() => setIsEditing(true)}
                >
                  <Text style={styles.editBtnText}>✎ Edit Boundary</Text>
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
  backButtonArrow: {
    fontSize: 22,
    fontWeight: '700',
    marginTop: -2,
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
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  rightControls: {
    gap: 8,
    alignItems: 'flex-end',
  },
  editingBadge: {
    backgroundColor: '#FFB300',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    height: 36,
    justifyContent: 'center',
    marginBottom: 4,
  },
  editingText: {
    color: '#000',
    fontSize: 13,
    fontWeight: '700',
  },
  actionPill: {
    backgroundColor: '#fff',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    height: 36,
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  actionPillText: {
    color: '#1a1a1a',
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
    backgroundColor: '#fff',
    borderWidth: 3,
    borderColor: '#FF9800',
  },
  bottomCardContainer: {
    position: 'absolute',
    bottom: 20,
    left: 16,
    right: 16,
  },
  farmCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 16,
    shadowColor: '#000',
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
  farmIcon: {
    fontSize: 18,
  },
  farmName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1a1a1a',
  },
  badgeLive: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeLiveText: {
    color: '#2E7D32',
    fontSize: 11,
    fontWeight: '700',
  },
  badgeEditing: {
    backgroundColor: '#FFF3E0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeEditingText: {
    color: '#E65100',
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
    color: '#757575',
    fontWeight: '700',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1a1a1a',
  },
  statSub: {
    fontSize: 10,
    color: '#757575',
    marginTop: 2,
  },
  editBtn: {
    borderWidth: 1.5,
    borderColor: '#2E7D32',
    borderRadius: 12,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editBtnText: {
    color: '#2E7D32',
    fontSize: 15,
    fontWeight: '700',
  },
  doneBtn: {
    backgroundColor: '#2E7D32',
    borderRadius: 12,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  doneBtnText: {
    color: '#fff',
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
