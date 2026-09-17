import React, { useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Image,
} from 'react-native';
import Svg, { Path, Circle, Rect, Polyline } from 'react-native-svg';
import { authPalette as P, colors } from '../../theme';

// --- Icons ---
function ArrowBackIcon({ size = 20, color = P.twGreen700 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M19 12H5M5 12L12 19M5 12L12 5" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function WaterDropIcon({ size = 20, color = '#1E40AF' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 21a7 7 0 007-7c0-2-3-7.5-7-11-4 3.5-7 9-7 11a7 7 0 007 7z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function CheckIcon({ size = 18, color = P.white }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M20 6L9 17l-5-5" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function CameraAddIcon({ size = 24, color = P.twGreen700 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Circle cx="12" cy="13" r="4" stroke={color} strokeWidth="2" />
      <Path d="M12 9v2M10 10h4" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M20 5v4M18 7h4" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function CameraIcon({ size = 18, color = P.twGray500 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Circle cx="12" cy="13" r="4" stroke={color} strokeWidth="2" />
    </Svg>
  );
}

function CloseIcon({ size = 12, color = P.white }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M18 6L6 18M6 6l12 12" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function MicIcon({ size = 18, color = P.twGray500 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v4M8 23h8" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function PlayIcon({ size = 14, color = P.twGreen700 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M5 3l14 9-14 9V3z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function NotesIcon({ size = 18, color = P.twGray500 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M4 6h16M4 12h16M4 18h7" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

// --- Component ---
interface NewFarmDiaryEntryStep3ScreenProps {
  onBack?: () => void;
  onSave?: () => void;
}

export function NewFarmDiaryEntryStep3Screen({
  onBack,
  onSave,
}: NewFarmDiaryEntryStep3ScreenProps): React.JSX.Element {
  const [method, setMethod] = useState('Drip');
  const [labour, setLabour] = useState(2);
  const [time, setTime] = useState('45');
  const [notes, setNotes] = useState('Morning drip cycle on the lower beds; cleared two clogged emitters on rows 4-7.');

  const updateLabour = (delta: number) => {
    setLabour((prev) => Math.max(0, prev + delta));
  };

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar barStyle="dark-content" backgroundColor={P.white} />

      {/* --- Header --- */}
      <View style={styles.header}>
        <View style={styles.headerTopRow}>
          <TouchableOpacity style={styles.backBtn} onPress={onBack} activeOpacity={0.7}>
            <ArrowBackIcon size={20} color={P.twGreen700} />
          </TouchableOpacity>
          <View style={styles.headerTitleCol}>
            <Text style={styles.headerTitle}>New Entry</Text>
            <Text style={styles.headerSubtitle}>Step 3 of 3 · Details</Text>
          </View>
          <TouchableOpacity onPress={onBack} activeOpacity={0.7}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>

        {/* Progress Bar */}
        <View style={styles.progressRow}>
          <View style={[styles.progressSegment, styles.progressSegmentActive]} />
          <View style={[styles.progressSegment, styles.progressSegmentActive]} />
          <View style={[styles.progressSegment, styles.progressSegmentActive]} />
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Context Banner */}
        <View style={styles.contextBanner}>
          <View style={styles.contextIconBox}>
            <WaterDropIcon size={20} />
          </View>
          <View style={styles.contextTextCol}>
            <Text style={styles.contextTitle}>Irrigation · Tomato</Text>
            <Text style={styles.contextSubtitle}>Water Management · Zone 2 — Lower Slope</Text>
          </View>
        </View>

        {/* Details Section */}
        <Text style={styles.sectionTitle}>IRRIGATION DETAILS</Text>

        <View style={styles.formGroup}>
          <View style={styles.labelRow}>
            <Text style={styles.labelText}>Irrigation method</Text>
            <Text style={styles.requiredAsterisk}> *</Text>
          </View>
          <View style={styles.pillsRow}>
            {['Drip', 'Sprinkler', 'Flood'].map((item) => {
              const isSelected = method === item;
              return (
                <TouchableOpacity
                  key={item}
                  style={[styles.pill, isSelected && styles.pillSelected]}
                  onPress={() => setMethod(item)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.pillText, isSelected && styles.pillTextSelected]}>{item}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={styles.rowInputs}>
          <View style={styles.flexHalf}>
            <Text style={styles.labelText}>Labour count</Text>
            <View style={styles.stepperContainer}>
              <Text style={styles.stepperValue}>{labour}</Text>
              <View style={styles.stepperActions}>
                <TouchableOpacity style={styles.stepperBtn} onPress={() => updateLabour(-1)}>
                  <Text style={styles.stepperBtnText}>-</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.stepperBtnGreen} onPress={() => updateLabour(1)}>
                  <Text style={styles.stepperBtnGreenText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          <View style={styles.flexHalf}>
            <View style={styles.labelRow}>
              <Text style={styles.labelText}>Time spent</Text>
              <Text style={styles.requiredAsterisk}> *</Text>
            </View>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.timeInput}
                value={time}
                onChangeText={setTime}
                keyboardType="numeric"
              />
              <Text style={styles.inputSuffix}>minutes</Text>
            </View>
          </View>
        </View>

        {/* Photos */}
        <View style={styles.formGroup}>
          <View style={styles.labelRow}>
            <CameraIcon size={16} color={P.twGray500} />
            <Text style={[styles.labelText, { marginLeft: 8 }]}>Photos</Text>
          </View>
          <View style={styles.photosRow}>
            <View style={styles.photoBox}>
              <Image 
                source={{ uri: 'https://images.unsplash.com/photo-1592982537447-6f233486df81?auto=format&fit=crop&q=80&w=200&h=200' }} 
                style={styles.photoImg} 
              />
              <TouchableOpacity style={styles.deletePhotoBtn}>
                <CloseIcon size={12} color={P.white} />
              </TouchableOpacity>
            </View>
            <View style={styles.photoBox}>
              <Image 
                source={{ uri: 'https://images.unsplash.com/photo-1589255243171-cb8f6a98fba0?auto=format&fit=crop&q=80&w=200&h=200' }} 
                style={styles.photoImg} 
              />
              <TouchableOpacity style={styles.deletePhotoBtn}>
                <CloseIcon size={12} color={P.white} />
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={styles.addPhotoBtn}>
              <CameraAddIcon size={24} color={P.twGreen700} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Voice Note */}
        <View style={styles.formGroup}>
          <View style={styles.labelRow}>
            <MicIcon size={16} color={P.twGray500} />
            <Text style={[styles.labelText, { marginLeft: 8 }]}>Voice note</Text>
          </View>
          <View style={styles.voiceNoteCard}>
            <TouchableOpacity style={styles.playBtn}>
              <PlayIcon size={14} color={P.twGreen700} />
            </TouchableOpacity>
            
            {/* Fake Waveform */}
            <View style={styles.waveform}>
              <View style={[styles.waveBar, { height: 8 }]} />
              <View style={[styles.waveBar, { height: 16 }]} />
              <View style={[styles.waveBar, { height: 12 }]} />
              <View style={[styles.waveBar, { height: 20 }]} />
              <View style={[styles.waveBar, { height: 6 }]} />
              <View style={[styles.waveBar, { height: 14 }]} />
              <View style={[styles.waveBar, { height: 10 }]} />
              <View style={[styles.waveBar, { height: 18 }]} />
            </View>
            
            <Text style={styles.voiceDuration}>0:14</Text>
          </View>
        </View>

        {/* Notes */}
        <View style={styles.formGroup}>
          <View style={styles.labelRow}>
            <NotesIcon size={16} color={P.twGray500} />
            <Text style={[styles.labelText, { marginLeft: 8 }]}>Notes</Text>
          </View>
          <TextInput
            style={styles.notesInput}
            multiline
            value={notes}
            onChangeText={setNotes}
            textAlignVertical="top"
          />
        </View>

      </ScrollView>

      {/* --- Bottom Action --- */}
      <View style={styles.bottomBar}>
        <View style={styles.bottomBarRow}>
          <TouchableOpacity style={styles.backBottomBtn} onPress={onBack} activeOpacity={0.8}>
            <Text style={styles.backBottomBtnText}>Back</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.saveBtn} onPress={onSave} activeOpacity={0.85}>
            <CheckIcon size={20} color={P.white} />
            <Text style={styles.saveBtnText}>Save entry</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

// --- Styles ---
const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: P.lightSurfaceAlt, // #F8F9F3
  },
  header: {
    backgroundColor: P.white,
    paddingTop: 16,
    borderBottomWidth: 1,
    borderBottomColor: P.twGray200,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: P.twGray200,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerTitleCol: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: P.twGray900,
  },
  headerSubtitle: {
    fontSize: 12,
    color: P.twGray500,
    marginTop: 2,
  },
  cancelText: {
    fontSize: 15,
    fontWeight: '600',
    color: P.twGray500,
  },
  progressRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 6,
    marginBottom: -1,
  },
  progressSegment: {
    flex: 1,
    height: 3,
    backgroundColor: P.twGray200,
    borderRadius: 1.5,
  },
  progressSegmentActive: {
    backgroundColor: P.twGreen700,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 40,
  },
  contextBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EBF4EC',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
  },
  contextIconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: P.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  contextTextCol: {
    flex: 1,
  },
  contextTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: P.twGray900,
  },
  contextSubtitle: {
    fontSize: 12,
    color: P.twGray500,
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: P.twGray500,
    letterSpacing: 0.5,
    marginBottom: 16,
  },
  formGroup: {
    marginBottom: 24,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  labelText: {
    fontSize: 14,
    fontWeight: '700',
    color: P.twGray800,
  },
  requiredAsterisk: {
    fontSize: 14,
    fontWeight: '700',
    color: P.twRed600,
  },
  pillsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  pill: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderWidth: 1.5,
    borderColor: P.twGray200,
    borderRadius: 12,
    backgroundColor: P.white,
  },
  pillSelected: {
    backgroundColor: '#EBF4EC',
    borderColor: P.twGreen700,
  },
  pillText: {
    fontSize: 14,
    fontWeight: '700',
    color: P.twGray600,
  },
  pillTextSelected: {
    color: P.twGreen900,
  },
  rowInputs: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 24,
  },
  flexHalf: {
    flex: 1,
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: P.white,
    borderWidth: 1.5,
    borderColor: P.twGray200,
    borderRadius: 12,
    paddingLeft: 16,
    paddingRight: 6,
    paddingVertical: 6,
  },
  stepperValue: {
    fontSize: 16,
    fontWeight: '800',
    color: P.twGray900,
  },
  stepperActions: {
    flexDirection: 'row',
    gap: 6,
  },
  stepperBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: P.twGray100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperBtnText: {
    fontSize: 20,
    color: P.twGray600,
    lineHeight: 24,
  },
  stepperBtnGreen: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#EBF4EC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperBtnGreenText: {
    fontSize: 20,
    color: P.twGreen700,
    lineHeight: 24,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: P.white,
    borderWidth: 1.5,
    borderColor: P.twGreen700,
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 47, // match stepper height approx
  },
  timeInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: '800',
    color: P.twGray900,
    padding: 0,
  },
  inputSuffix: {
    fontSize: 14,
    color: P.twGray500,
    marginLeft: 4,
  },
  photosRow: {
    flexDirection: 'row',
    gap: 12,
  },
  photoBox: {
    width: 72,
    height: 72,
    borderRadius: 12,
    position: 'relative',
  },
  photoImg: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
  },
  deletePhotoBtn: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addPhotoBtn: {
    width: 72,
    height: 72,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: P.twGreen700,
    borderStyle: 'dashed',
    backgroundColor: '#EBF4EC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  voiceNoteCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: P.white,
    borderWidth: 1.5,
    borderColor: P.twGray200,
    borderRadius: 16,
    padding: 12,
  },
  playBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EBF4EC',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  waveform: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  waveBar: {
    flex: 1,
    backgroundColor: '#C5DCC9', // light grayish green
    borderRadius: 2,
    minHeight: 4,
  },
  voiceDuration: {
    fontSize: 12,
    fontWeight: '700',
    color: P.twGray500,
    marginLeft: 16,
  },
  notesInput: {
    backgroundColor: P.white,
    borderWidth: 1.5,
    borderColor: P.twGray200,
    borderRadius: 12,
    padding: 16,
    fontSize: 14,
    color: P.twGray700,
    lineHeight: 22,
    minHeight: 100,
  },
  bottomBar: {
    backgroundColor: P.white,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: P.twGray200,
  },
  bottomBarRow: {
    flexDirection: 'row',
    gap: 12,
  },
  backBottomBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: P.white,
    borderWidth: 1.5,
    borderColor: P.twGray200,
    borderRadius: 12,
    paddingVertical: 16,
  },
  backBottomBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: P.twGray700,
  },
  saveBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: P.twGreen700,
    borderRadius: 12,
    paddingVertical: 16,
    gap: 8,
  },
  saveBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: P.white,
  },
});
