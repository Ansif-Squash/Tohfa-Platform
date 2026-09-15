import React, { useState } from 'react';
import {
  Alert,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Circle, Line, Path, Rect } from 'react-native-svg';

// ─────────────────────────────────────────────
// SVG icons (inline, no extra dep)
// ─────────────────────────────────────────────

function ChevronLeft({ size = 20, color = '#1A2E1A' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M15 19L8 12L15 5" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function InfoCircle({ size = 18, color = '#0284C7' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2" />
      <Line x1="12" y1="8" x2="12" y2="8.5" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
      <Line x1="12" y1="12" x2="12" y2="16" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function Leaf({ size = 20, color = '#16A34A' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M17 8C8 10 5.9 16.17 3.82 19.34A1 1 0 0 0 5 21c3-.25 9-2 12-7 2.5-4 1-10 0-6z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M3.82 19.34C8 18 15 16 22 4" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function Gear({ size = 20, color = '#EA580C' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="3" stroke={color} strokeWidth="2" />
      <Path
        d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"
        stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      />
    </Svg>
  );
}

function CheckCircle({ size = 16, color = '#16A34A' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2" />
      <Path d="M7.5 12.5L10.5 15.5L16.5 9" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function Clock({ size = 16, color = '#EA580C' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2" />
      <Path d="M12 6v6l4 2" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function Doc({ size = 15, color = '#374151' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="4" y="2" width="16" height="20" rx="2.5" stroke={color} strokeWidth="2" />
      <Line x1="8" y1="8" x2="16" y2="8" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <Line x1="8" y1="12" x2="16" y2="12" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <Line x1="8" y1="16" x2="12" y2="16" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </Svg>
  );
}

function Pencil({ size = 15, color = '#374151' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function Refresh({ size = 16, color = '#FFFFFF' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M23 4v6h-6" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M1 20v-6h6" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function Trash({ size = 15, color = '#DC2626' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6h14z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function Plus({ size = 24, color = '#FFFFFF' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M12 5v14M5 12h14" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
    </Svg>
  );
}

// ─────────────────────────────────────────────
// Types & mock data
// ─────────────────────────────────────────────

type CertStatus = 'active' | 'expiring' | 'expired';

export interface CertItem {
  id: string;
  name: string;
  status: CertStatus;
  issuer: string;
  /** positive = days remaining, negative = overdue */
  daysLeft: number;
  certifiedOn: string;
  validUntil: string;
  validUntilRed?: boolean;
}

const MOCK: CertItem[] = [
  {
    id: '1',
    name: 'PGS Organic',
    status: 'active',
    issuer: 'PGS-India Green Council',
    daysLeft: 241,
    certifiedOn: '15 Mar 2024',
    validUntil: '14 Mar 2027',
  },
  {
    id: '2',
    name: 'NPOP',
    status: 'expiring',
    issuer: 'APEDA · Third-party accredited',
    daysLeft: 41,
    certifiedOn: '26 Aug 2023',
    validUntil: '26 Aug 2026',
    validUntilRed: true,
  },
  {
    id: '3',
    name: 'Soil Health Card',
    status: 'active',
    issuer: 'Dept. of Agriculture, Nilgiris',
    daysLeft: 177,
    certifiedOn: '10 Jan 2024',
    validUntil: '09 Jan 2027',
  },
  {
    id: '4',
    name: 'NPOP (2021 cycle)',
    status: 'expired',
    issuer: 'APEDA · Third-party accredited',
    daysLeft: -318,
    certifiedOn: '26 Aug 2021',
    validUntil: '25 Aug 2023',
  },
];

// ─────────────────────────────────────────────
// Status badge pill
// ─────────────────────────────────────────────

const BADGE_MAP = {
  active:   { bg: '#DCFCE7', fg: '#16A34A', label: 'ACTIVE' },
  expiring: { bg: '#FEF3C7', fg: '#D97706', label: 'EXPIRING SOON' },
  expired:  { bg: '#FEE2E2', fg: '#DC2626', label: 'EXPIRED' },
};

function StatusBadge({ status }: { status: CertStatus }) {
  const m = BADGE_MAP[status];
  return (
    <View style={{ backgroundColor: m.bg, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 }}>
      <Text style={{ fontSize: 11, fontWeight: '700', color: m.fg, letterSpacing: 0.4 }}>{m.label}</Text>
    </View>
  );
}

// ─────────────────────────────────────────────
// Cert card
// ─────────────────────────────────────────────

function CertCard({ item, onRemove }: { item: CertItem; onRemove: (id: string) => void }) {
  const active   = item.status === 'active';
  const expiring = item.status === 'expiring';
  const expired  = item.status === 'expired';

  const borderColor = expired ? '#FCA5A5' : expiring ? '#FCD34D' : '#E5E7EB';
  const iconBg      = expired ? '#FEE2E2' : expiring ? '#FEF3C7' : '#DCFCE7';
  const iconColor   = expired ? '#DC2626' : expiring ? '#EA580C' : '#16A34A';

  return (
    <View style={[C.card, { borderColor }]}>

      {/* ── Row 1: icon + name/issuer + badge ── */}
      <View style={C.topRow}>
        <View style={[C.iconCircle, { backgroundColor: iconBg }]}>
          {active ? <Leaf size={20} color={iconColor} /> : <Gear size={20} color={iconColor} />}
        </View>
        <View style={C.nameCol}>
          <Text style={C.certName}>{item.name}</Text>
          <Text style={C.issuer}>{item.issuer}</Text>
        </View>
        <StatusBadge status={item.status} />
      </View>

      {/* ── Row 2: days strip ── */}
      {active && (
        <View style={[C.strip, { backgroundColor: '#F0FDF4' }]}>
          <CheckCircle size={16} color="#16A34A" />
          <Text style={[C.stripTxt, { color: '#16A34A' }]}>{item.daysLeft} days left</Text>
        </View>
      )}
      {expiring && (
        <View style={[C.strip, { backgroundColor: '#FFF7ED' }]}>
          <Clock size={16} color="#EA580C" />
          <Text style={[C.stripTxt, { color: '#EA580C' }]}>
            {item.daysLeft} days left · <Text style={{ fontWeight: '700' }}>Renew now</Text>
          </Text>
        </View>
      )}
      {expired && (
        <View style={[C.strip, { backgroundColor: '#FEF2F2' }]}>
          <Clock size={16} color="#DC2626" />
          <Text style={[C.stripTxt, { color: '#DC2626' }]}>
            {Math.abs(item.daysLeft)} days overdue for renewal
          </Text>
        </View>
      )}

      {/* ── Row 3: dates ── */}
      <View style={C.datesRow}>
        <View>
          <Text style={C.dateLabel}>CERTIFIED ON</Text>
          <Text style={C.dateVal}>{item.certifiedOn}</Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={C.dateLabel}>VALID UNTIL</Text>
          <Text style={[C.dateVal, item.validUntilRed && { color: '#DC2626' }]}>{item.validUntil}</Text>
        </View>
      </View>

      {/* ── Row 4: action buttons ── */}
      <View style={C.actRow}>
        {active && (
          <>
            <TouchableOpacity style={C.outBtn} activeOpacity={0.75}>
              <Doc /><Text style={C.outTxt}>{'View\nDocument'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={C.outBtn} activeOpacity={0.75}>
              <Pencil /><Text style={C.outTxt}>Edit</Text>
            </TouchableOpacity>
          </>
        )}
        {expiring && (
          <>
            <TouchableOpacity style={C.primBtn} activeOpacity={0.85}>
              <Refresh /><Text style={C.primTxt}>Renew</Text>
            </TouchableOpacity>
            <TouchableOpacity style={C.outBtn} activeOpacity={0.75}>
              <Doc /><Text style={C.outTxt}>View</Text>
            </TouchableOpacity>
          </>
        )}
        {expired && (
          <>
            <TouchableOpacity style={C.outBtn} activeOpacity={0.75}>
              <Doc /><Text style={C.outTxt}>View</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[C.outBtn, { borderColor: '#FCA5A5' }]}
              activeOpacity={0.75}
              onPress={() =>
                Alert.alert('Remove Certificate', 'Remove this expired certificate?', [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Remove', style: 'destructive', onPress: () => onRemove(item.id) },
                ])
              }
            >
              <Trash /><Text style={[C.outTxt, { color: '#DC2626' }]}>Remove</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );
}

const C = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 16,
    marginBottom: 12,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  iconCircle: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
  nameCol: { flex: 1 },
  certName: { fontSize: 16, fontWeight: '700', color: '#111827' },
  issuer: { fontSize: 12, color: '#6B7280', marginTop: 1 },
  strip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8,
  },
  stripTxt: { fontSize: 13, fontWeight: '500', flex: 1 },
  datesRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 2 },
  dateLabel: { fontSize: 10, fontWeight: '700', color: '#9CA3AF', letterSpacing: 0.5, marginBottom: 2 },
  dateVal: { fontSize: 14, fontWeight: '600', color: '#111827' },
  actRow: { flexDirection: 'row', gap: 10, marginTop: 2 },
  outBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 10, borderRadius: 10,
    borderWidth: 1.5, borderColor: '#E5E7EB', backgroundColor: '#FAFAFA',
  },
  outTxt: { fontSize: 13, fontWeight: '600', color: '#374151', textAlign: 'center' },
  primBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 12, borderRadius: 10, backgroundColor: '#15803D',
  },
  primTxt: { fontSize: 14, fontWeight: '700', color: '#FFFFFF' },
});

// ─────────────────────────────────────────────
// Main screen
// ─────────────────────────────────────────────

interface CertificationsScreenProps {
  onNavigateToAddCertification?: () => void;
  onBack?: () => void;
}

export function CertificationsScreen({
  onNavigateToAddCertification,
  onBack,
}: CertificationsScreenProps): React.JSX.Element {
  const [certs, setCerts] = useState<CertItem[]>(MOCK);

  const handleRemove = (id: string) => setCerts((prev) => prev.filter((c) => c.id !== id));

  const activeCount   = certs.filter((c) => c.status === 'active').length;
  const expiringCount = certs.filter((c) => c.status === 'expiring').length;
  const expiredCount  = certs.filter((c) => c.status === 'expired').length;

  return (
    <SafeAreaView style={S.screen}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* ── Header ── */}
      <View style={S.header}>
        <TouchableOpacity
          style={S.backBtn}
          onPress={onBack}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Back"
        >
          <ChevronLeft />
        </TouchableOpacity>
        <View style={S.headerMid}>
          <Text style={S.headerTitle}>Certifications</Text>
          <Text style={S.headerSub}>PGS Organic, NPOP &amp; other approvals</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={S.scroll} showsVerticalScrollIndicator={false}>

        {/* ── Info banner ── */}
        <View style={S.infoBanner}>
          <InfoCircle size={18} color="#0284C7" />
          <Text style={S.infoTxt}>
            An expired certificate blocks new produce listings. Keep at least one certification active to sell on the marketplace.
          </Text>
        </View>

        {/* ── Stats row ── */}
        <View style={S.statsRow}>
          <View style={S.statCell}>
            <Text style={[S.statNum, { color: '#16A34A' }]}>{activeCount}</Text>
            <Text style={S.statLbl}>Active</Text>
          </View>
          <View style={S.statDiv} />
          <View style={S.statCell}>
            <Text style={[S.statNum, { color: '#D97706' }]}>{expiringCount}</Text>
            <Text style={S.statLbl}>Expiring</Text>
          </View>
          <View style={S.statDiv} />
          <View style={S.statCell}>
            <Text style={[S.statNum, { color: '#DC2626' }]}>{expiredCount}</Text>
            <Text style={S.statLbl}>Expired</Text>
          </View>
        </View>

        {/* ── Cert cards ── */}
        {certs.map((item) => (
          <CertCard key={item.id} item={item} onRemove={handleRemove} />
        ))}

        {/* ── Add another card ── */}
        <TouchableOpacity
          style={S.addCard}
          activeOpacity={0.75}
          onPress={onNavigateToAddCertification}
          accessibilityRole="button"
          accessibilityLabel="Add another certification"
        >
          <View style={S.addCircle}>
            <Plus size={20} color="#15803D" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={S.addTitle}>Add another certification</Text>
            <Text style={S.addSub}>Fair Trade, GlobalG.A.P. &amp; other approvals supported</Text>
          </View>
        </TouchableOpacity>

        <View style={{ height: 90 }} />
      </ScrollView>

      {/* ── FAB ── */}
      <TouchableOpacity
        style={S.fab}
        activeOpacity={0.85}
        onPress={onNavigateToAddCertification}
        accessibilityRole="button"
        accessibilityLabel="Add certification"
      >
        <Plus size={26} color="#FFFFFF" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

// ─────────────────────────────────────────────
// Screen styles
// ─────────────────────────────────────────────

const S = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F5F5F3' },

  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1, borderBottomColor: '#F0F0F0',
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    borderWidth: 1, borderColor: '#E5E7EB', backgroundColor: '#FFFFFF',
    alignItems: 'center', justifyContent: 'center',
  },
  headerMid: { flex: 1, paddingLeft: 12 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#1A2E1A' },
  headerSub: { fontSize: 12, color: '#6B7280', marginTop: 1 },

  scroll: { paddingHorizontal: 16, paddingTop: 16 },

  infoBanner: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
    backgroundColor: '#EFF6FF',
    borderRadius: 12, borderWidth: 1, borderColor: '#BAE0FD',
    padding: 14, marginBottom: 16,
  },
  infoTxt: { flex: 1, fontSize: 13, color: '#1E40AF', lineHeight: 19, fontWeight: '500' },

  statsRow: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 14, borderWidth: 1, borderColor: '#E5E7EB',
    marginBottom: 16, paddingVertical: 14,
  },
  statCell: { flex: 1, alignItems: 'center' },
  statNum: { fontSize: 26, fontWeight: '800', lineHeight: 30 },
  statLbl: { fontSize: 12, color: '#6B7280', fontWeight: '500', marginTop: 2 },
  statDiv: { width: 1, backgroundColor: '#E5E7EB', marginVertical: 4 },

  addCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#F0FDF4',
    borderRadius: 16, borderWidth: 1.5, borderColor: '#86EFAC',
    borderStyle: 'dashed',
    padding: 16, marginBottom: 12,
  },
  addCircle: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: '#DCFCE7', alignItems: 'center', justifyContent: 'center',
  },
  addTitle: { fontSize: 15, fontWeight: '700', color: '#15803D' },
  addSub: { fontSize: 12, color: '#4B9B63', marginTop: 2 },

  fab: {
    position: 'absolute', bottom: 24, right: 20,
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: '#15803D',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#15803D',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35, shadowRadius: 8, elevation: 6,
  },
});
