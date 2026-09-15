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
import type { CertItem } from './CertificationsScreen';

// ─────────────────────────────────────────────
// SVG icons (inline, no extra dep)
// ─────────────────────────────────────────────

function CloseIcon({ size = 18, color = '#15803D' }: { size?: number; color?: string }) {
    return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
            <Path d="M6 6L18 18M18 6L6 18" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
        </Svg>
    );
}

function ChevronDown({ size = 18, color = '#6B7280' }: { size?: number; color?: string }) {
    return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
            <Path d="M6 9L12 15L18 9" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
    );
}

function LabelAward({ size = 14, color = '#6B7280' }: { size?: number; color?: string }) {
    return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
            <Circle cx="12" cy="9" r="6" stroke={color} strokeWidth="2" />
            <Path d="M8.5 14L7 21L12 18.5L17 21L15.5 14" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
    );
}

function LabelBuilding({ size = 14, color = '#6B7280' }: { size?: number; color?: string }) {
    return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
            <Rect x="4" y="3" width="16" height="18" rx="2" stroke={color} strokeWidth="2" />
            <Line x1="12" y1="7" x2="12" y2="7.01" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
            <Line x1="12" y1="11" x2="12" y2="11.01" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
            <Line x1="12" y1="15" x2="12" y2="15.01" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
        </Svg>
    );
}

function LabelCalendar({ size = 14, color = '#6B7280' }: { size?: number; color?: string }) {
    return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
            <Rect x="3" y="5" width="18" height="16" rx="2" stroke={color} strokeWidth="2" />
            <Line x1="8" y1="3" x2="8" y2="7" stroke={color} strokeWidth="2" strokeLinecap="round" />
            <Line x1="16" y1="3" x2="16" y2="7" stroke={color} strokeWidth="2" strokeLinecap="round" />
        </Svg>
    );
}

function LabelDoc({ size = 14, color = '#6B7280' }: { size?: number; color?: string }) {
    return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
            <Rect x="4" y="2" width="16" height="20" rx="2" stroke={color} strokeWidth="2" />
            <Line x1="8" y1="8" x2="16" y2="8" stroke={color} strokeWidth="2" strokeLinecap="round" />
            <Line x1="8" y1="12" x2="16" y2="12" stroke={color} strokeWidth="2" strokeLinecap="round" />
        </Svg>
    );
}

function LabelNotes({ size = 14, color = '#6B7280' }: { size?: number; color?: string }) {
    return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
            <Line x1="4" y1="6" x2="20" y2="6" stroke={color} strokeWidth="2" strokeLinecap="round" />
            <Line x1="4" y1="10" x2="20" y2="10" stroke={color} strokeWidth="2" strokeLinecap="round" />
            <Line x1="4" y1="14" x2="14" y2="10" stroke={color} strokeWidth="0" />
            <Line x1="4" y1="14" x2="20" y2="14" stroke={color} strokeWidth="2" strokeLinecap="round" />
        </Svg>
    );
}

function PdfGlyph({ size = 22, color = '#FFFFFF' }: { size?: number; color?: string }) {
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

function TrashIcon({ size = 15, color = '#DC2626' }: { size?: number; color?: string }) {
    return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
            <Path
                d="M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6h14z"
                stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            />
        </Svg>
    );
}

function CheckIcon({ size = 16, color = '#FFFFFF' }: { size?: number; color?: string }) {
    return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
            <Path d="M5 12.5L10 17.5L19 7" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
    );
}

function UploadIcon({ size = 20, color = '#15803D' }: { size?: number; color?: string }) {
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

const TYPE_OPTIONS = ['PGS Organic', 'NPOP', 'GlobalG.A.P.', 'Fair Trade', 'Other'];
const KNOWN_TYPES = TYPE_OPTIONS.filter((o) => o !== 'Other');

interface UploadedDoc {
    name: string;
    meta: string;
}

interface EditCertificationScreenProps {
    cert: CertItem;
    onClose?: () => void;
    onSave?: (updated: CertItem) => void;
    onDelete?: (id: string) => void;
}

export function EditCertificationScreen({
    cert,
    onClose,
    onSave,
    onDelete,
}: EditCertificationScreenProps): React.JSX.Element {
    const [name, setName] = useState<string>(KNOWN_TYPES.includes(cert.name) ? cert.name : 'Other');
    const [customName, setCustomName] = useState<string>(
        KNOWN_TYPES.includes(cert.name) ? '' : cert.name
    );
    const [showTypeMenu, setShowTypeMenu] = useState<boolean>(false);
    const [issuer, setIssuer] = useState<string>(cert.issuer.replace(' · Third-party accredited', ''));
    const [certifiedOn, setCertifiedOn] = useState<string>(cert.certifiedOn);
    const [validUntil, setValidUntil] = useState<string>(cert.validUntil);
    const [doc, setDoc] = useState<UploadedDoc | null>({
        name: 'pgs_certificate_2024.pdf',
        meta: '1.4 MB · PDF',
    });
    const [notes, setNotes] = useState<string>(
        'Renewal application already submitted to regional council on 02 Feb.'
    );

    const displayName = name === 'Other' ? customName.trim() : name;

    const handleDelete = () => {
        Alert.alert(
            'Delete Certification',
            `Remove "${cert.name}"? This cannot be undone.`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: () => onDelete?.(cert.id),
                },
            ]
        );
    };

    const handleSave = () => {
        if (!displayName || !certifiedOn.trim() || !validUntil.trim()) {
            Alert.alert('Missing details', 'Please fill all required fields marked with *.');
            return;
        }
        onSave?.({
            ...cert,
            name: displayName,
            issuer: issuer.trim() || cert.issuer,
            certifiedOn: certifiedOn.trim(),
            validUntil: validUntil.trim(),
        });
    };

    return (
        <SafeAreaView style={E.screen}>
            <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

            {/* ── Header ── */}
            <View style={E.header}>
                <TouchableOpacity
                    style={E.closeBtn}
                    onPress={onClose}
                    activeOpacity={0.7}
                    accessibilityRole="button"
                    accessibilityLabel="Close edit certification"
                >
                    <CloseIcon />
                </TouchableOpacity>
                <View style={{ flex: 1 }}>
                    <Text style={E.headerTitle}>Edit Certification</Text>
                    <Text style={E.headerSub} numberOfLines={1}>
                        {cert.name} · added {cert.certifiedOn}
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
                    <Text style={E.label}>Certification Type</Text>
                    <Text style={E.required}>*</Text>
                </View>
                <View style={{ position: 'relative' }}>
                    <TouchableOpacity
                        style={E.input}
                        activeOpacity={0.8}
                        onPress={() => setShowTypeMenu((v) => !v)}
                        accessibilityRole="button"
                        accessibilityLabel="Select certification type"
                    >
                        <Text style={[E.inputTxt, !displayName && { color: '#9CA3AF' }]}>
                            {name === 'Other' ? (customName || 'Other (custom)') : name}
                        </Text>
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
                                        setName(opt);
                                        setShowTypeMenu(false);
                                    }}
                                >
                                    <Text style={[E.typeMenuTxt, name === opt && { color: '#15803D', fontWeight: '700' }]}>
                                        {opt}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    ) : null}
                </View>
                {name === 'Other' ? (
                    <TextInput
                        style={[E.input, { marginTop: 8 }]}
                        value={customName}
                        onChangeText={setCustomName}
                        placeholder="Custom certification name"
                        placeholderTextColor="#9CA3AF"
                    />
                ) : null}
                <Text style={E.helper}>Choose "Other" to enter a custom certification name.</Text>

                {/* ── Certifying Body ── */}
                <View style={E.labelRow}>
                    <LabelBuilding />
                    <Text style={E.label}>Certifying Body</Text>
                </View>
                <TextInput
                    style={E.input}
                    value={issuer}
                    onChangeText={setIssuer}
                    placeholder="e.g. PGS-India Green Council"
                    placeholderTextColor="#9CA3AF"
                />
                <Text style={E.helper}>Helps TOHFA admin verify faster during audit prep.</Text>

                {/* ── Certified On / Valid Until ── */}
                <View style={E.datesRow}>
                    <View style={{ flex: 1 }}>
                        <View style={E.labelRow}>
                            <LabelCalendar />
                            <Text style={E.label}>Certified On</Text>
                            <Text style={E.required}>*</Text>
                        </View>
                        <View style={[E.input, E.dateInput]}>
                            <TextInput
                                style={E.dateTextInput}
                                value={certifiedOn}
                                onChangeText={setCertifiedOn}
                                placeholder="15/03/24"
                                placeholderTextColor="#9CA3AF"
                            />
                            <LabelCalendar size={16} color="#16A34A" />
                        </View>
                    </View>
                    <View style={{ flex: 1 }}>
                        <View style={E.labelRow}>
                            <LabelCalendar />
                            <Text style={E.label}>Valid Until</Text>
                            <Text style={E.required}>*</Text>
                        </View>
                        <View style={[E.input, E.dateInput]}>
                            <TextInput
                                style={E.dateTextInput}
                                value={validUntil}
                                onChangeText={setValidUntil}
                                placeholder="14/03/27"
                                placeholderTextColor="#9CA3AF"
                            />
                            <LabelCalendar size={16} color="#16A34A" />
                        </View>
                    </View>
                </View>
                <Text style={E.helper}>
                    Auto-suggested as +3 years — edit if your body uses a different validity period.
                </Text>

                {/* ── Certificate Document ── */}
                <View style={E.labelRow}>
                    <LabelDoc />
                    <Text style={E.label}>Certificate Document</Text>
                </View>
                {doc ? (
                    <View style={E.docCard}>
                        <View style={E.docIconBox}>
                            <PdfGlyph size={20} color="#FFFFFF" />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={E.docName} numberOfLines={1}>{doc.name}</Text>
                            <Text style={E.docMeta}>{doc.meta}</Text>
                        </View>
                        <TouchableOpacity
                            style={E.docRemoveBtn}
                            onPress={() => setDoc(null)}
                            activeOpacity={0.8}
                            accessibilityRole="button"
                            accessibilityLabel="Remove document"
                        >
                            <CloseIcon size={14} color="#DC2626" />
                        </TouchableOpacity>
                    </View>
                ) : (
                    <TouchableOpacity
                        style={E.uploadBox}
                        activeOpacity={0.75}
                        onPress={() =>
                            setDoc({ name: 'pgs_certificate_2024.pdf', meta: '1.4 MB · PDF' })
                        }
                        accessibilityRole="button"
                        accessibilityLabel="Upload certificate document"
                    >
                        <UploadIcon />
                        <Text style={E.uploadTxt}>Upload certificate document</Text>
                    </TouchableOpacity>
                )}
                <Text style={E.helper}>PDF, JPG or PNG · max 10 MB · one document per certification.</Text>

                {/* ── Notes ── */}
                <View style={E.labelRow}>
                    <LabelNotes />
                    <Text style={E.label}>Notes</Text>
                    <Text style={E.labelMuted}>(internal — for TOHFA admin)</Text>
                </View>
                <TextInput
                    style={[E.input, E.notesInput]}
                    value={notes}
                    onChangeText={setNotes}
                    placeholder="Add an internal note for the TOHFA admin team…"
                    placeholderTextColor="#9CA3AF"
                    multiline
                    textAlignVertical="top"
                />

                {/* ── Delete ── */}
                <TouchableOpacity
                    style={E.deleteBtn}
                    activeOpacity={0.75}
                    onPress={handleDelete}
                    accessibilityRole="button"
                    accessibilityLabel="Delete this certification"
                >
                    <TrashIcon />
                    <Text style={E.deleteTxt}>Delete this certification</Text>
                </TouchableOpacity>

                <View style={{ height: 12 }} />
            </ScrollView>

            {/* ── Footer ── */}
            <View style={E.footer}>
                <TouchableOpacity style={E.cancelBtn} activeOpacity={0.8} onPress={onClose}>
                    <Text style={E.cancelTxt}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={E.saveBtn} activeOpacity={0.85} onPress={handleSave}>
                    <CheckIcon />
                    <Text style={E.saveTxt}>Save Certification</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const KNOWN_TYPES = ['PGS Organic', 'NPOP', 'GlobalG.A.P.', 'Fair Trade'];

// ─────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────

const E = StyleSheet.create({
    screen: { flex: 1, backgroundColor: '#F5F5F3' },

    header: {
        flexDirection: 'row', alignItems: 'center', gap: 12,
        paddingHorizontal: 16, paddingVertical: 12,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1, borderBottomColor: '#F0F0F0',
    },
    closeBtn: {
        width: 40, height: 40, borderRadius: 20,
        backgroundColor: '#EAF6EC',
        alignItems: 'center', justifyContent: 'center',
    },
    headerTitle: { fontSize: 18, fontWeight: '700', color: '#1A2E1A' },
    headerSub: { fontSize: 12, color: '#6B7280', marginTop: 1 },

    scroll: { paddingHorizontal: 16, paddingTop: 18 },

    labelRow: {
        flexDirection: 'row', alignItems: 'center', gap: 6,
        marginBottom: 7, marginTop: 4,
    },
    label: { fontSize: 13, fontWeight: '700', color: '#374151' },
    labelMuted: { fontSize: 11, fontWeight: '500', color: '#9CA3AF' },
    required: { fontSize: 13, fontWeight: '700', color: '#DC2626' },

    input: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderWidth: 1.5, borderColor: '#E5E7EB',
        backgroundColor: '#FFFFFF',
        borderRadius: 10,
        paddingHorizontal: 14,
        minHeight: 48,
    },
    inputText: { fontSize: 14, color: '#111827', flex: 1 },
    helper: { fontSize: 11, color: '#9CA3AF', marginTop: 6, lineHeight: 15 },

    typeMenu: {
        position: 'absolute', top: 52, left: 0, right: 0,
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        borderWidth: 1, borderColor: '#E5E7EB',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.12, shadowRadius: 10, elevation: 6,
        zIndex: 50,
        overflow: 'hidden',
    },
    typeMenuItem: {
        paddingHorizontal: 14, paddingVertical: 12,
        borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#F0F0F0',
    },
    typeMenuText: { fontSize: 14, color: '#111827' },

    datesRow: { flexDirection: 'row', gap: 12 },

    dateInput: { gap: 8 },
    dateTextInput: { flex: 1, fontSize: 14, color: '#111827', paddingVertical: 0 },

    docCard: {
        flexDirection: 'row', alignItems: 'center', gap: 12,
        backgroundColor: '#F0FDF4',
        borderRadius: 14,
        borderWidth: 1.5, borderColor: '#86EFAC',
        padding: 12,
    },
    docIconBox: {
        width: 44, height: 44, borderRadius: 12,
        backgroundColor: '#16A34A',
        alignItems: 'center', justifyContent: 'center',
    },
    docName: { fontSize: 14, fontWeight: '700', color: '#111827' },
    docMeta: { fontSize: 11, color: '#6B7280', marginTop: 2 },
    docRemoveBtn: {
        width: 30, height: 30, borderRadius: 15,
        backgroundColor: '#FEE2E2',
        alignItems: 'center', justifyContent: 'center',
    },

    uploadBox: {
        alignItems: 'center', justifyContent: 'center', gap: 8,
        borderWidth: 1.5, borderColor: '#86EFAC',
        borderStyle: 'dashed',
        borderRadius: 14,
        backgroundColor: '#F0FDF4',
        paddingVertical: 24,
    },
    uploadTxt: { fontSize: 13, fontWeight: '600', color: '#15803D' },

    notesInput: {
        height: 96,
        alignItems: 'flex-start',
        justifyContent: 'flex-start',
        paddingTop: 12,
    },

    deleteBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
        borderWidth: 1.5, borderColor: '#FCA5A5',
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        paddingVertical: 13,
        marginTop: 20,
    },
    deleteTxt: { fontSize: 14, fontWeight: '600', color: '#DC2626' },

    footer: {
        flexDirection: 'row', gap: 12,
        paddingHorizontal: 16, paddingVertical: 14,
        backgroundColor: '#FFFFFF',
        borderTopWidth: 1, borderTopColor: '#F0F0F0',
    },
    cancelBtn: {
        flex: 1,
        borderWidth: 1.5, borderColor: '#E5E7EB',
        backgroundColor: '#FFFFFF',
        paddingVertical: 14, borderRadius: 12,
        alignItems: 'center', justifyContent: 'center',
    },
    cancelTxt: { fontSize: 15, fontWeight: '600', color: '#374151' },
    saveBtn: {
        flex: 1.4,
        flexDirection: 'row',
        backgroundColor: '#15803D',
        paddingVertical: 14, borderRadius: 12,
        alignItems: 'center', justifyContent: 'center', gap: 8,
    },
    saveTxt: { fontSize: 15, fontWeight: '700', color: '#FFFFFF' },
});