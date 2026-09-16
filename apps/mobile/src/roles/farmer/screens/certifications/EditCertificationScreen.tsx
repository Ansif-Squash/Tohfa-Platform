import React, { useState } from 'react';
import {
  Alert,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Line, Path, Rect, Circle } from 'react-native-svg';
import { t } from '../../../../i18n/farmer';
import { authPalette as P } from '../../theme';
import type { Certification } from '../../api/farmer';

// ─────────────────────────────────────────────
// SVG icons (inline, no extra dep)
// ─────────────────────────────────────────────

function CloseIcon({ size = 18, color = P.twGreen700 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M6 6L18 18M18 6L6 18" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
    </Svg>
  );
}

function ChevronDown({ size = 18, color = P.twGray500 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M6 9L12 15L18 9" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function LabelAward({ size = 14, color = P.twGray500 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="9" r="6" stroke={color} strokeWidth="2" />
      <Path d="M8.5 14L7 21L12 18.5L17 21L15.5 14" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function LabelBuilding({ size = 14, color = P.twGray500 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="4" y="3" width="16" height="18" rx="2" stroke={color} strokeWidth="2" />
      <Line x1="12" y1="7" x2="12" y2="7.01" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
      <Line x1="12" y1="11" x2="12" y2="11.01" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
      <Line x1="12" y1="15" x2="12" y2="15.01" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
    </Svg>
  );
}

function LabelCalendar({ size = 14, color = P.twGray500 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="5" width="18" height="16" rx="2" stroke={color} strokeWidth="2" />
      <Line x1="8" y1="3" x2="8" y2="7" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="16" y1="3" x2="16" y2="7" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function LabelDoc({ size = 14, color = P.twGray500 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="4" y="2" width="16" height="20" rx="2" stroke={color} strokeWidth="2" />
      <Line x1="8" y1="8" x2="16" y2="8" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="8" y1="12" x2="16" y2="12" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function LabelNotes({ size = 14, color = P.twGray500 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Line x1="4" y1="6" x2="20" y2="6" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="4" y1="10" x2="20" y2="10" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="4" y1="14" x2="20" y2="14" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function PdfGlyph({ size = 22, color = P.white }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M14 2H7a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7l-5-5z"
        stroke={color} strokeWidth="2" strokeLinejoin="round"
      />
      <Path d="M14 2v5h5" stroke={color} strokeWidth="2" strokeLinejoin="round" />
      <Path d="M9.5 15.5h5" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function TrashIcon({ size = 15, color = P.twRed600 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6h14z"
        stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      />
    </Svg>
  );
}

function CheckIcon({ size = 16, color = P.white }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M5 12.5L10 17.5L19 7" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function UploadIcon({ size = 20, color = P.twGreen700 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M12 16V5" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
      <Path d="M7 9L12 4L17 9" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M4 15v4a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-4" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
    </Svg>
  );
}

// ─────────────────────────────────────────────
// Screen
// ─────────────────────────────────────────────

const TYPE_OPTIONS: Array<Certification['certType']> = ['PGS', 'NPOP', 'OTHER'];

function typeLabel(type: Certification['certType']): string {
  switch (type) {
    case 'PGS':
      return t('farmer.profile.cert.pgs');
    case 'NPOP':
      return t('farmer.profile.cert.npop');
    default:
      return t('farmer.certifications.add.type.OTHER');
  }
}

interface EditCertificationScreenProps {
  certification: Certification;
  onCancel?: () => void;
  onSave?: (updated: Certification) => void;
  onDelete?: (id: string) => void;
}

export function EditCertificationScreen({
  certification,
  onCancel,
  onSave,
  onDelete,
}: EditCertificationScreenProps): React.JSX.Element {
  const [certType, setCertType] = useState<Certification['certType']>(certification.certType);
  const [showTypeMenu, setShowTypeMenu] = useState<boolean>(false);
  const [certNumber, setCertNumber] = useState<string>(certification.certNumber);
  const [issuer, setIssuer] = useState<string>(certification.issuingBody);
  const [issuedOn, setIssuedOn] = useState<string>(certification.issuedOn);
  const [expiresOn, setExpiresOn] = useState<string>(certification.expiresOn);
  const [documentUrl, setDocumentUrl] = useState<string | null>(certification.documentUrl ?? null);
  // Internal note for TOHFA admin -- there is no `notes` field on the real
  // Certification model (docs/openapi.yaml), so this is UI-only for now and
  // is not sent anywhere. Flagged as a specification gap in the port report.
  const [notes, setNotes] = useState<string>('');

  const handleDelete = () => {
    Alert.alert(
      t('farmer.certifications.edit.deleteConfirmTitle'),
      t('farmer.certifications.edit.deleteConfirmBody', { number: certification.certNumber }),
      [
        { text: t('farmer.common.cancel'), style: 'cancel' },
        {
          text: t('farmer.certifications.edit.delete'),
          style: 'destructive',
          onPress: () => onDelete?.(certification.id),
        },
      ],
    );
  };

  const handleSave = () => {
    if (!certNumber.trim() || !issuedOn.trim() || !expiresOn.trim()) {
      Alert.alert(t('farmer.certifications.edit.missingTitle'), t('farmer.certifications.edit.missingBody'));
      return;
    }
    onSave?.({
      ...certification,
      certType,
      certNumber: certNumber.trim(),
      issuingBody: issuer.trim() || certification.issuingBody,
      issuedOn: issuedOn.trim(),
      expiresOn: expiresOn.trim(),
      documentUrl,
    });
  };

  return (
    <SafeAreaView style={E.screen}>
      <StatusBar barStyle="dark-content" backgroundColor={P.white} />

      {/* ── Header ── */}
      <View style={E.header}>
        <TouchableOpacity
          style={E.closeBtn}
          onPress={onCancel}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel={t('farmer.certifications.edit.closeA11y')}
        >
          <CloseIcon />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={E.headerTitle}>{t('farmer.certifications.edit.title')}</Text>
          <Text style={E.headerSub} numberOfLines={1}>
            {t('farmer.certifications.edit.headerSub', { type: typeLabel(certification.certType), date: certification.issuedOn })}
          </Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={E.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Certification Type ── */}
        <View style={E.labelRow}>
          <LabelAward />
          <Text style={E.label}>{t('farmer.certifications.add.type')}</Text>
          <Text style={E.required}>*</Text>
        </View>
        <View style={{ position: 'relative' }}>
          <TouchableOpacity
            style={E.input}
            activeOpacity={0.8}
            onPress={() => setShowTypeMenu((v) => !v)}
            accessibilityRole="button"
            accessibilityLabel={t('farmer.certifications.edit.selectTypeA11y')}
          >
            <Text style={E.inputText}>{typeLabel(certType)}</Text>
            <ChevronDown />
          </TouchableOpacity>
          {showTypeMenu ? (
            <View style={E.typeMenu}>
              {TYPE_OPTIONS.map((opt) => (
                <TouchableOpacity
                  key={opt}
                  style={E.typeMenuItem}
                  activeOpacity={0.7}
                  onPress={() => {
                    setCertType(opt);
                    setShowTypeMenu(false);
                  }}
                >
                  <Text style={[E.typeMenuText, certType === opt && { color: P.twGreen700, fontWeight: '700' }]}>
                    {typeLabel(opt)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          ) : null}
        </View>

        {/* ── Certificate Number ── */}
        <View style={E.labelRow}>
          <LabelDoc />
          <Text style={E.label}>{t('farmer.certifications.add.number')}</Text>
          <Text style={E.required}>*</Text>
        </View>
        <TextInput
          style={E.input}
          value={certNumber}
          onChangeText={setCertNumber}
          placeholder={t('farmer.certifications.add.number')}
          placeholderTextColor={P.twGray400}
        />

        {/* ── Certifying Body ── */}
        <View style={E.labelRow}>
          <LabelBuilding />
          <Text style={E.label}>{t('farmer.certifications.add.issuer')}</Text>
        </View>
        <TextInput
          style={E.input}
          value={issuer}
          onChangeText={setIssuer}
          placeholder={t('farmer.certifications.add.issuer')}
          placeholderTextColor={P.twGray400}
        />
        <Text style={E.helper}>{t('farmer.certifications.edit.issuerHelper')}</Text>

        {/* ── Issued On / Expires On ── */}
        <View style={E.datesRow}>
          <View style={{ flex: 1 }}>
            <View style={E.labelRow}>
              <LabelCalendar />
              <Text style={E.label}>{t('farmer.certifications.add.issueDate')}</Text>
              <Text style={E.required}>*</Text>
            </View>
            <View style={[E.input, E.dateInput]}>
              <TextInput
                style={E.dateTextInput}
                value={issuedOn}
                onChangeText={setIssuedOn}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={P.twGray400}
              />
              <LabelCalendar size={16} color={P.twGreen600} />
            </View>
          </View>
          <View style={{ flex: 1 }}>
            <View style={E.labelRow}>
              <LabelCalendar />
              <Text style={E.label}>{t('farmer.certifications.add.expiryDate')}</Text>
              <Text style={E.required}>*</Text>
            </View>
            <View style={[E.input, E.dateInput]}>
              <TextInput
                style={E.dateTextInput}
                value={expiresOn}
                onChangeText={setExpiresOn}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={P.twGray400}
              />
              <LabelCalendar size={16} color={P.twGreen600} />
            </View>
          </View>
        </View>

        {/* ── Certificate Document ── */}
        <View style={E.labelRow}>
          <LabelDoc />
          <Text style={E.label}>{t('farmer.certifications.add.doc')}</Text>
        </View>
        {documentUrl ? (
          <View style={E.docCard}>
            <View style={E.docIconBox}>
              <PdfGlyph size={20} color={P.white} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={E.docName} numberOfLines={1}>
                {documentUrl}
              </Text>
            </View>
            <TouchableOpacity
              style={E.docRemoveBtn}
              onPress={() => setDocumentUrl(null)}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel={t('farmer.certifications.edit.removeDocA11y')}
            >
              <CloseIcon size={14} color={P.twRed600} />
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            style={E.uploadBox}
            activeOpacity={0.75}
            // No document picker/upload endpoint is wired for edit yet -- see
            // AddCertificationScreen for the pattern once one exists here too.
            accessibilityRole="button"
            accessibilityLabel={t('farmer.certifications.add.doc')}
          >
            <UploadIcon />
            <Text style={E.uploadTxt}>{t('farmer.certifications.edit.uploadPrompt')}</Text>
          </TouchableOpacity>
        )}
        <Text style={E.helper}>{t('farmer.certifications.edit.uploadHelper')}</Text>

        {/* ── Notes (local only -- not part of the Certification API model) ── */}
        <View style={E.labelRow}>
          <LabelNotes />
          <Text style={E.label}>{t('farmer.certifications.edit.notes')}</Text>
          <Text style={E.labelMuted}>{t('farmer.certifications.edit.notesInternal')}</Text>
        </View>
        <TextInput
          style={[E.input, E.notesInput]}
          value={notes}
          onChangeText={setNotes}
          placeholder={t('farmer.certifications.edit.notesPlaceholder')}
          placeholderTextColor={P.twGray400}
          multiline
          textAlignVertical="top"
        />

        {/* ── Delete ── */}
        <TouchableOpacity
          style={E.deleteBtn}
          activeOpacity={0.75}
          onPress={handleDelete}
          accessibilityRole="button"
          accessibilityLabel={t('farmer.certifications.edit.delete')}
        >
          <TrashIcon />
          <Text style={E.deleteTxt}>{t('farmer.certifications.edit.delete')}</Text>
        </TouchableOpacity>

        <View style={{ height: 12 }} />
      </ScrollView>

      {/* ── Footer ── */}
      <View style={E.footer}>
        <TouchableOpacity style={E.cancelBtn} activeOpacity={0.8} onPress={onCancel}>
          <Text style={E.cancelTxt}>{t('farmer.common.cancel')}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={E.saveBtn} activeOpacity={0.85} onPress={handleSave}>
          <CheckIcon />
          <Text style={E.saveTxt}>{t('farmer.certifications.edit.save')}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// ─────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────

const E = StyleSheet.create({
  screen: { flex: 1, backgroundColor: P.paleStoneBg },

  header: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: P.white,
    borderBottomWidth: 1, borderBottomColor: P.surfaceMuted,
  },
  closeBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: P.mintTintBg,
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: P.ink },
  headerSub: { fontSize: 12, color: P.twGray500, marginTop: 1 },

  scroll: { paddingHorizontal: 16, paddingTop: 18 },

  labelRow: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    marginBottom: 7, marginTop: 4,
  },
  label: { fontSize: 13, fontWeight: '700', color: P.twGray700 },
  labelMuted: { fontSize: 11, fontWeight: '500', color: P.twGray400 },
  required: { fontSize: 13, fontWeight: '700', color: P.twRed600 },

  input: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1.5, borderColor: P.twGray200,
    backgroundColor: P.white,
    borderRadius: 10,
    paddingHorizontal: 14,
    minHeight: 48,
  },
  inputText: { fontSize: 14, color: P.twGray900, flex: 1 },
  helper: { fontSize: 11, color: P.twGray400, marginTop: 6, lineHeight: 15 },

  typeMenu: {
    position: 'absolute', top: 52, left: 0, right: 0,
    backgroundColor: P.white,
    borderRadius: 12,
    borderWidth: 1, borderColor: P.twGray200,
    shadowColor: P.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12, shadowRadius: 10, elevation: 6,
    zIndex: 50,
    overflow: 'hidden',
  },
  typeMenuItem: {
    paddingHorizontal: 14, paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: P.surfaceMuted,
  },
  typeMenuText: { fontSize: 14, color: P.twGray900 },

  datesRow: { flexDirection: 'row', gap: 12 },

  dateInput: { gap: 8 },
  dateTextInput: { flex: 1, fontSize: 14, color: P.twGray900, paddingVertical: 0 },

  docCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: P.twGreen50,
    borderRadius: 14,
    borderWidth: 1.5, borderColor: P.twGreen300,
    padding: 12,
  },
  docIconBox: {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: P.twGreen600,
    alignItems: 'center', justifyContent: 'center',
  },
  docName: { fontSize: 14, fontWeight: '700', color: P.twGray900 },
  docMeta: { fontSize: 11, color: P.twGray500, marginTop: 2 },
  docRemoveBtn: {
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: P.twRed100,
    alignItems: 'center', justifyContent: 'center',
  },

  uploadBox: {
    alignItems: 'center', justifyContent: 'center', gap: 8,
    borderWidth: 1.5, borderColor: P.twGreen300,
    borderStyle: 'dashed',
    borderRadius: 14,
    backgroundColor: P.twGreen50,
    paddingVertical: 24,
  },
  uploadTxt: { fontSize: 13, fontWeight: '600', color: P.twGreen700 },

  notesInput: {
    height: 96,
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
    paddingTop: 12,
  },

  deleteBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    borderWidth: 1.5, borderColor: P.twRed300,
    backgroundColor: P.white,
    borderRadius: 12,
    paddingVertical: 13,
    marginTop: 20,
  },
  deleteTxt: { fontSize: 14, fontWeight: '600', color: P.twRed600 },

  footer: {
    flexDirection: 'row', gap: 12,
    paddingHorizontal: 16, paddingVertical: 14,
    backgroundColor: P.white,
    borderTopWidth: 1, borderTopColor: P.surfaceMuted,
  },
  cancelBtn: {
    flex: 1,
    borderWidth: 1.5, borderColor: P.twGray200,
    backgroundColor: P.white,
    paddingVertical: 14, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  cancelTxt: { fontSize: 15, fontWeight: '600', color: P.twGray700 },
  saveBtn: {
    flex: 1.4,
    flexDirection: 'row',
    backgroundColor: P.twGreen700,
    paddingVertical: 14, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  saveTxt: { fontSize: 15, fontWeight: '700', color: P.white },
});
