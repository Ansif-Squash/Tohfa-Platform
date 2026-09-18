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
import Svg, { Circle, Line, Polygon, Defs, Pattern, Rect } from 'react-native-svg';
import { Icon } from '@tohfa/mobile-ui';
import { authPalette as P, useTheme } from '../../theme';

interface AddZoneScreenProps {
  onNavigateBack: () => void;
  onSave: () => void;
}

export function AddZoneScreen({ onNavigateBack, onSave }: AddZoneScreenProps) {
  const { colors } = useTheme();

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: colors.bgLight }]}>
      <StatusBar barStyle="light-content" backgroundColor={P.oliveGreen} />

      {/* TOP MAP AREA */}
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
            
            {/* Farm Boundary (Dashed Yellow) */}
            <Polygon
              points="70,140 340,110 360,260 330,340 80,350 60,250"
              fill="none"
              stroke={P.yellow500}
              strokeWidth="4"
              strokeDasharray="10,8"
            />

            {/* New Zone Drawing (Dashed Purple) */}
            <Polygon
              points="80,180 300,160 310,280 90,300"
              fill="rgba(69, 39, 160, 0.4)"
              stroke={P.deepPurple400}
              strokeWidth="3"
              strokeDasharray="8,6"
            />
            {/* Corner Markers */}
            <Circle cx="80" cy="180" r="10" fill={colors.white} stroke={P.deepPurple400} strokeWidth="4" />
            <Circle cx="300" cy="160" r="10" fill={colors.white} stroke={P.deepPurple400} strokeWidth="4" />
          </Svg>
        </View>

        {/* Floating Drawing Notice */}
        <View style={styles.drawingNotice}>
          <Icon name="place" size={16} color={colors.white} style={styles.drawingNoticeIcon} />
          <Text style={styles.drawingNoticeText}>Drawing new zone — tap on map to add corners</Text>
        </View>
      </View>

      {/* BOTTOM SHEET FORM */}
      <View style={styles.bottomSheet}>
        <View style={styles.dragHandle} />
        
        <ScrollView style={styles.contentScroll} contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
          
          {/* Header */}
          <View style={styles.sheetHeader}>
            <Icon name="shield" size={24} color={colors.brandGreen} style={styles.sheetHeaderIcon} />
            <View>
              <Text style={[styles.sheetTitle, { color: colors.textDark }]}>Name this zone</Text>
              <Text style={[styles.sheetSub, { color: colors.textSubtle }]}>Zone has 4 corners · 0.55 acres</Text>
            </View>
          </View>

          {/* Zone Name Input */}
          <Text style={[styles.inputLabel, { color: colors.textDark }]}>
            # Zone Name <Text style={{ color: P.red500 }}>*</Text>
          </Text>
          <View style={[styles.inputBox, { borderColor: colors.borderLight }]}>
            <TextInput 
              style={[styles.inputField, { color: colors.textDark }]}
              value="Lower Bed"
            />
          </View>

          {/* Zone Color Picker */}
          <View style={styles.inputLabelRow}>
            <Icon name="palette" size={13} color={colors.textDark} />
            <Text style={[styles.inputLabel, { color: colors.textDark, marginBottom: 0 }]}>
              {' '}Zone Color <Text style={{ color: P.red500 }}>*</Text>
            </Text>
          </View>
          <View style={styles.colorPickerRow}>
            <View style={[styles.colorCircle, { backgroundColor: P.deepGreen }]} />
            <View style={[styles.colorCircle, { backgroundColor: P.orange900 }]} />
            {/* Active Color */}
            <View style={[styles.colorCircleActive, { borderColor: P.deepPurple400 }]}>
              <View style={[styles.colorCircle, { backgroundColor: P.deepPurple400, margin: 4 }]}>
                <Icon name="check" size={16} color={colors.white} />
              </View>
            </View>
            <View style={[styles.colorCircle, { backgroundColor: P.red600 }]} />
            <View style={[styles.colorCircle, { backgroundColor: P.brown400 }]} />
            <View style={[styles.colorCircle, { backgroundColor: P.blue700 }]} />
          </View>

          {/* Dropdowns Row 1 */}
          <View style={styles.dropdownRow}>
            <View style={styles.dropdownCol}>
              <View style={styles.inputLabelRow}>
                <Icon name="eco" size={13} color={colors.textDark} />
                <Text style={[styles.inputLabel, { color: colors.textDark, marginBottom: 0 }]}> Soil Type</Text>
              </View>
              <View style={[styles.dropdownBox, { borderColor: colors.borderLight }]}>
                <Text style={[styles.dropdownText, { color: colors.textDark }]}>Red soil</Text>
                <Icon name="expand_more" size={14} color={colors.textSubtle} />
              </View>
            </View>
            <View style={styles.dropdownCol}>
              <View style={styles.inputLabelRow}>
                <Icon name="wb_sunny" size={13} color={colors.textDark} />
                <Text style={[styles.inputLabel, { color: colors.textDark, marginBottom: 0 }]}> Sun Exposure</Text>
              </View>
              <View style={[styles.dropdownBox, { borderColor: colors.borderLight }]}>
                <Text style={[styles.dropdownText, { color: colors.textDark }]}>Full sun</Text>
                <Icon name="expand_more" size={14} color={colors.textSubtle} />
              </View>
            </View>
          </View>

          {/* Dropdowns Row 2 */}
          <View style={styles.inputLabelRow}>
            <Icon name="water_drop" size={13} color={colors.textDark} />
            <Text style={[styles.inputLabel, { color: colors.textDark, marginBottom: 0 }]}> Irrigation Method</Text>
          </View>
          <View style={[styles.dropdownBox, { borderColor: colors.borderLight, marginBottom: 24 }]}>
            <Text style={[styles.dropdownText, { color: colors.textDark }]}>Drip</Text>
            <Icon name="expand_more" size={14} color={colors.textSubtle} />
          </View>

        </ScrollView>
        
        {/* FOOTER */}
        <View style={[styles.footer, { borderTopColor: colors.borderDivider, backgroundColor: colors.bgLight }]}>
          <TouchableOpacity style={[styles.cancelBtn, { borderColor: colors.borderLight }]} onPress={onNavigateBack}>
            <Text style={[styles.cancelBtnText, { color: colors.textDark }]}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.saveBtn, styles.saveBtnRow, { backgroundColor: colors.brandGreen }]} onPress={onSave}>
            <Icon name="check" size={16} color={colors.white} style={styles.saveBtnIcon} />
            <Text style={styles.saveBtnText}>Save Zone</Text>
          </TouchableOpacity>
        </View>

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  mapBackground: {
    ...StyleSheet.absoluteFillObject,
  },
  drawingNotice: {
    position: 'absolute',
    top: 40,
    left: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: P.teal800,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    shadowColor: P.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  drawingNoticeIcon: { marginRight: 8 },
  drawingNoticeText: { color: P.white, fontSize: 13, fontWeight: '700' },

  bottomSheet: {
    flex: 1.2,
    backgroundColor: P.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: P.black,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 16,
    overflow: 'hidden',
    marginTop: -24, // Pull up over the map slightly
  },
  dragHandle: {
    width: 40,
    height: 4,
    backgroundColor: P.grey300,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 8,
  },

  contentScroll: { flex: 1 },
  contentContainer: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 40 },

  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  sheetHeaderIcon: { marginRight: 12 },
  sheetTitle: { fontSize: 18, fontWeight: '700', marginBottom: 2 },
  sheetSub: { fontSize: 12 },

  inputLabel: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 8,
  },
  inputLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  inputBox: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 52,
    justifyContent: 'center',
    marginBottom: 20,
  },
  inputField: { fontSize: 16, padding: 0 },

  colorPickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 24,
  },
  colorCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorCircleActive: {
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },

  dropdownRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 20,
  },
  dropdownCol: { flex: 1 },
  dropdownBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 52,
  },
  dropdownText: { fontSize: 15 },

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
  saveBtnRow: { flexDirection: 'row' },
  saveBtnIcon: { marginRight: 6 },
  saveBtnText: { color: P.white, fontSize: 16, fontWeight: '700' },
});
