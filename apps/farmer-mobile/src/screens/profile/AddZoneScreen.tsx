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
import { useTheme } from '../../theme';

interface AddZoneScreenProps {
  onNavigateBack: () => void;
  onSave: () => void;
}

export function AddZoneScreen({ onNavigateBack, onSave }: AddZoneScreenProps) {
  const { colors, spacing, typography, weights } = useTheme();

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: colors.bgLight }]}>
      <StatusBar barStyle="light-content" backgroundColor="#3e5c26" />

      {/* TOP MAP AREA */}
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
            
            {/* Farm Boundary (Dashed Yellow) */}
            <Polygon
              points="70,140 340,110 360,260 330,340 80,350 60,250"
              fill="none"
              stroke="#FFEB3B"
              strokeWidth="4"
              strokeDasharray="10,8"
            />

            {/* New Zone Drawing (Dashed Purple) */}
            <Polygon
              points="80,180 300,160 310,280 90,300"
              fill="rgba(69, 39, 160, 0.4)"
              stroke="#7E57C2"
              strokeWidth="3"
              strokeDasharray="8,6"
            />
            {/* Corner Markers */}
            <Circle cx="80" cy="180" r="10" fill="#FFF" stroke="#7E57C2" strokeWidth="4" />
            <Circle cx="300" cy="160" r="10" fill="#FFF" stroke="#7E57C2" strokeWidth="4" />
          </Svg>
        </View>

        {/* Floating Drawing Notice */}
        <View style={styles.drawingNotice}>
          <Text style={{ fontSize: 16, marginRight: 8 }}>📍</Text>
          <Text style={styles.drawingNoticeText}>Drawing new zone — tap on map to add corners</Text>
        </View>
      </View>

      {/* BOTTOM SHEET FORM */}
      <View style={styles.bottomSheet}>
        <View style={styles.dragHandle} />
        
        <ScrollView style={styles.contentScroll} contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
          
          {/* Header */}
          <View style={styles.sheetHeader}>
            <Text style={{ fontSize: 24, marginRight: 12 }}>🛡️</Text>
            <View>
              <Text style={[styles.sheetTitle, { color: colors.textDark }]}>Name this zone</Text>
              <Text style={[styles.sheetSub, { color: colors.textSubtle }]}>Zone has 4 corners · 0.55 acres</Text>
            </View>
          </View>

          {/* Zone Name Input */}
          <Text style={[styles.inputLabel, { color: colors.textDark }]}>
            # Zone Name <Text style={{ color: '#F44336' }}>*</Text>
          </Text>
          <View style={[styles.inputBox, { borderColor: colors.borderLight }]}>
            <TextInput 
              style={[styles.inputField, { color: colors.textDark }]}
              value="Lower Bed"
            />
          </View>

          {/* Zone Color Picker */}
          <Text style={[styles.inputLabel, { color: colors.textDark }]}>
            🎨 Zone Color <Text style={{ color: '#F44336' }}>*</Text>
          </Text>
          <View style={styles.colorPickerRow}>
            <View style={[styles.colorCircle, { backgroundColor: '#1B5E20' }]} />
            <View style={[styles.colorCircle, { backgroundColor: '#E65100' }]} />
            {/* Active Color */}
            <View style={[styles.colorCircleActive, { borderColor: '#7E57C2' }]}>
              <View style={[styles.colorCircle, { backgroundColor: '#7E57C2', margin: 4 }]}>
                <Text style={{ color: '#FFF', fontWeight: '800' }}>✓</Text>
              </View>
            </View>
            <View style={[styles.colorCircle, { backgroundColor: '#E53935' }]} />
            <View style={[styles.colorCircle, { backgroundColor: '#8D6E63' }]} />
            <View style={[styles.colorCircle, { backgroundColor: '#1976D2' }]} />
          </View>

          {/* Dropdowns Row 1 */}
          <View style={styles.dropdownRow}>
            <View style={styles.dropdownCol}>
              <Text style={[styles.inputLabel, { color: colors.textDark }]}>⛰️ Soil Type</Text>
              <View style={[styles.dropdownBox, { borderColor: colors.borderLight }]}>
                <Text style={[styles.dropdownText, { color: colors.textDark }]}>Red soil</Text>
                <Text style={{ color: colors.textSubtle }}>▼</Text>
              </View>
            </View>
            <View style={styles.dropdownCol}>
              <Text style={[styles.inputLabel, { color: colors.textDark }]}>☀️ Sun Exposure</Text>
              <View style={[styles.dropdownBox, { borderColor: colors.borderLight }]}>
                <Text style={[styles.dropdownText, { color: colors.textDark }]}>Full sun</Text>
                <Text style={{ color: colors.textSubtle }}>▼</Text>
              </View>
            </View>
          </View>

          {/* Dropdowns Row 2 */}
          <Text style={[styles.inputLabel, { color: colors.textDark }]}>💧 Irrigation Method</Text>
          <View style={[styles.dropdownBox, { borderColor: colors.borderLight, marginBottom: 24 }]}>
            <Text style={[styles.dropdownText, { color: colors.textDark }]}>Drip</Text>
            <Text style={{ color: colors.textSubtle }}>▼</Text>
          </View>

        </ScrollView>
        
        {/* FOOTER */}
        <View style={[styles.footer, { borderTopColor: colors.borderDivider, backgroundColor: colors.bgLight }]}>
          <TouchableOpacity style={[styles.cancelBtn, { borderColor: colors.borderLight }]} onPress={onNavigateBack}>
            <Text style={[styles.cancelBtnText, { color: colors.textDark }]}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.saveBtn, { backgroundColor: colors.brandGreen }]} onPress={onSave}>
            <Text style={styles.saveBtnText}>✓ Save Zone</Text>
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
    backgroundColor: '#00695C',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  drawingNoticeText: { color: '#FFF', fontSize: 13, fontWeight: '700' },

  bottomSheet: {
    flex: 1.2,
    backgroundColor: '#FFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: '#000',
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
    backgroundColor: '#E0E0E0',
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
  sheetTitle: { fontSize: 18, fontWeight: '700', marginBottom: 2 },
  sheetSub: { fontSize: 12 },

  inputLabel: {
    fontSize: 13,
    fontWeight: '700',
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
  saveBtnText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
});
