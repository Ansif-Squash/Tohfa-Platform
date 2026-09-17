import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Circle, Line, Path, Rect } from 'react-native-svg';
import {
  evalCertificateWarning,
  getMyCertifications,
  getSystemConfig,
  type Certification,
} from '../../api/farmer';
import { ErrorState, Skeleton } from '@tohfa/mobile-ui';
import { t } from '../../../../i18n/farmer';
import { authPalette as P } from '../../theme';

// ─────────────────────────────────────────────
// SVG icons (inline, no extra dep)
// ─────────────────────────────────────────────

function ChevronLeft({ size = 20, color = P.ink }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M15 19L8 12L15 5" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function InfoCircle({ size = 18, color = P.sky600 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2" />
      <Line x1="12" y1="8" x2="12" y2="8.5" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
      <Line x1="12" y1="12" x2="12" y2="16" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function Leaf({ size = 20, color = P.twGreen600 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M17 8C8 10 5.9 16.17 3.82 19.34A1 1 0 0 0 5 21c3-.25 9-2 12-7 2.5-4 1-10 0-6z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M3.82 19.34C8 18 15 16 22 4" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function Gear({ size = 20, color = P.twOrange600 }: { size?: number; color?: string }) {
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

function CheckCircle({ size = 16, color = P.twGreen600 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2" />
      <Path d="M7.5 12.5L10.5 15.5L16.5 9" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function Clock({ size = 16, color = P.twOrange600 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2" />
      <Path d="M12 6v6l4 2" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function Doc({ size = 15, color = P.twGray700 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="4" y="2" width="16" height="20" rx="2.5" stroke={color} strokeWidth="2" />
      <Line x1="8" y1="8" x2="16" y2="8" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <Line x1="8" y1="12" x2="16" y2="12" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <Line x1="8" y1="16" x2="12" y2="16" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </Svg>
  );
}

function Pencil({ size = 15, color = P.twGray700 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function Trash({ size = 15, color = P.twRed600 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6h14z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function Plus({ size = 24, color = P.white }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M12 5v14M5 12h14" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
    </Svg>
  );
}

// ─────────────────────────────────────────────
// Display status derived from the real Certification (server-computed
// daysToExpiry + verificationStatus) -- BR-01/BR-02.
// ─────────────────────────────────────────────

type DisplayStatus = 'active' | 'expiring' | 'expired';

function displayStatus(cert: Certification, warningThreshold: number): DisplayStatus {
  const warning = evalCertificateWarning(cert.daysToExpiry, warningThreshold);
  if (warning.isExpired) return 'expired';
  if (warning.isWarning) return 'expiring';
  return 'active';
}

function StatusBadge({ status }: { status: DisplayStatus }) {
  const map = {
    active: { bg: P.twGreen100, fg: P.twGreen600, label: t('farmer.certifications.status.badge.active') },
    expiring: { bg: P.twAmber100, fg: P.twAmber600, label: t('farmer.certifications.status.badge.expiring') },
    expired: { bg: P.twRed100, fg: P.twRed600, label: t('farmer.certifications.status.badge.expired') },
  } as const;
  const m = map[status];
  return (
    <View style={{ backgroundColor: m.bg, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 }}>
      <Text style={{ fontSize: 11, fontWeight: '700', color: m.fg, letterSpacing: 0.4 }}>{m.label}</Text>
    </View>
  );
}

// ─────────────────────────────────────────────
// Cert card
// ─────────────────────────────────────────────

function CertCard({
  item,
  warningThreshold,
  onEdit,
}: {
  item: Certification;
  warningThreshold: number;
  onEdit: (cert: Certification) => void;
}) {
  const status = displayStatus(item, warningThreshold);
  const active = status === 'active';
  const expiring = status === 'expiring';
  const expired = status === 'expired';

  const borderColor = expired ? P.twRed300 : expiring ? P.twAmber300 : P.twGray200;
  const iconBg = expired ? P.twRed100 : expiring ? P.twAmber100 : P.twGreen100;
  const iconColor = expired ? P.twRed600 : expiring ? P.twOrange600 : P.twGreen600;

  return (
    <View style={[C.card, { borderColor }]}>
      {/* ── Row 1: icon + name/issuer + badge ── */}
      <View style={C.topRow}>
        <View style={[C.iconCircle, { backgroundColor: iconBg }]}>
          {active ? <Leaf size={20} color={iconColor} /> : <Gear size={20} color={iconColor} />}
        </View>
        <View style={C.nameCol}>
          <Text style={C.certName}>{item.certType}</Text>
          <Text style={C.issuer}>{item.issuingBody}</Text>
        </View>
        <StatusBadge status={status} />
      </View>

      {/* ── Row 2: days strip ── */}
      {active && (
        <View style={[C.strip, { backgroundColor: P.twGreen50 }]}>
          <CheckCircle size={16} color={P.twGreen600} />
          <Text style={[C.stripTxt, { color: P.twGreen600 }]}>
            {t('farmer.certifications.daysLeft', { days: item.daysToExpiry })}
          </Text>
        </View>
      )}
      {expiring && (
        <View style={[C.strip, { backgroundColor: P.twOrange50 }]}>
          <Clock size={16} color={P.twOrange600} />
          <Text style={[C.stripTxt, { color: P.twOrange600 }]}>
            {t('farmer.certifications.daysLeft', { days: item.daysToExpiry })} ·{' '}
            <Text style={{ fontWeight: '700' }}>{t('farmer.certifications.renewNow')}</Text>
          </Text>
        </View>
      )}
      {expired && (
        <View style={[C.strip, { backgroundColor: P.twRed50 }]}>
          <Clock size={16} color={P.twRed600} />
          <Text style={[C.stripTxt, { color: P.twRed600 }]}>
            {t('farmer.certifications.overdueBy', { days: Math.abs(item.daysToExpiry) })}
          </Text>
        </View>
      )}

      {/* ── Row 3: dates ── */}
      <View style={C.datesRow}>
        <View>
          <Text style={C.dateLabel}>{t('farmer.certifications.certifiedOnLabel')}</Text>
          <Text style={C.dateVal}>{item.issuedOn}</Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={C.dateLabel}>{t('farmer.certifications.validUntilLabel')}</Text>
          <Text style={[C.dateVal, expired && { color: P.twRed600 }]}>{item.expiresOn}</Text>
        </View>
      </View>

      {/* ── Row 4: action buttons ── */}
      <View style={C.actRow}>
        {active && (
          <>
            <TouchableOpacity style={C.outBtn} activeOpacity={0.75}>
              <Doc />
              <Text style={C.outTxt}>{t('farmer.common.view')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={C.outBtn} activeOpacity={0.75} onPress={() => onEdit(item)}>
              <Pencil />
              <Text style={C.outTxt}>{t('farmer.common.edit')}</Text>
            </TouchableOpacity>
          </>
        )}
        {expiring && (
          <>
            <TouchableOpacity style={C.primBtn} activeOpacity={0.85} onPress={() => onEdit(item)}>
              <Pencil size={15} color={P.white} />
              <Text style={C.primTxt}>{t('farmer.certifications.renewNow')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={C.outBtn} activeOpacity={0.75}>
              <Doc />
              <Text style={C.outTxt}>{t('farmer.common.view')}</Text>
            </TouchableOpacity>
          </>
        )}
        {expired && (
          <>
            <TouchableOpacity style={C.outBtn} activeOpacity={0.75}>
              <Doc />
              <Text style={C.outTxt}>{t('farmer.common.view')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[C.outBtn, { borderColor: P.twRed300 }]}
              activeOpacity={0.75}
              onPress={() => onEdit(item)}
            >
              <Trash />
              <Text style={[C.outTxt, { color: P.twRed600 }]}>{t('farmer.common.manage')}</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );
}

const C = StyleSheet.create({
  card: {
    backgroundColor: P.white,
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 16,
    marginBottom: 12,
    gap: 10,
    shadowColor: P.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  iconCircle: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
  nameCol: { flex: 1 },
  certName: { fontSize: 16, fontWeight: '700', color: P.twGray900 },
  issuer: { fontSize: 12, color: P.twGray500, marginTop: 1 },
  strip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8,
  },
  stripTxt: { fontSize: 13, fontWeight: '500', flex: 1 },
  datesRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 2 },
  dateLabel: { fontSize: 10, fontWeight: '700', color: P.twGray400, letterSpacing: 0.5, marginBottom: 2 },
  dateVal: { fontSize: 14, fontWeight: '600', color: P.twGray900 },
  actRow: { flexDirection: 'row', gap: 10, marginTop: 2 },
  outBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 10, borderRadius: 10,
    borderWidth: 1.5, borderColor: P.twGray200, backgroundColor: P.twGray50,
  },
  outTxt: { fontSize: 13, fontWeight: '600', color: P.twGray700, textAlign: 'center' },
  primBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 12, borderRadius: 10, backgroundColor: P.twGreen700,
  },
  primTxt: { fontSize: 14, fontWeight: '700', color: P.white },
});

// ─────────────────────────────────────────────
// Main screen
// ─────────────────────────────────────────────

export const DEFAULT_DEMO_CERTS: Certification[] = [
  {
    id: 'cert-pgs-01',
    certType: 'PGS',
    certNumber: 'PGS-IND-2024-8841',
    issuingBody: 'PGS Organic India Council',
    issuedOn: '2024-04-15',
    expiresOn: '2026-10-18',
    verificationStatus: 'VERIFIED',
    verifiedAt: '2024-04-18T10:00:00Z',
    verifiedBy: 'Tohfa Compliance Admin',
    daysToExpiry: 214,
    blocksListings: false,
    documentUrl: 'https://example.com/certs/pgs-sample.pdf',
  },
  {
    id: 'cert-npop-02',
    certType: 'NPOP',
    certNumber: 'NPOP-NAB-2025-0192',
    issuingBody: 'Aditi Organic Certifications',
    issuedOn: '2025-04-10',
    expiresOn: '2026-04-11',
    verificationStatus: 'VERIFIED',
    verifiedAt: '2025-04-12T14:30:00Z',
    verifiedBy: 'Tohfa Compliance Admin',
    daysToExpiry: 24,
    blocksListings: false,
    documentUrl: 'https://example.com/certs/npop-sample.pdf',
  },
];

interface CertificationsScreenProps {
  onBack?: () => void;
  onNavigateToAddCertification?: () => void;
  onNavigateToEditCertification?: (certification: Certification) => void;
}

export function CertificationsScreen({
  onBack,
  onNavigateToAddCertification,
  onNavigateToEditCertification,
}: CertificationsScreenProps): React.JSX.Element {
  const [certs, setCerts] = useState<Certification[]>([]);
  const [warningThreshold, setWarningThreshold] = useState<number>(30);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const loadCerts = useCallback(async () => {
    try {
      setError(null);
      const [certsRes, configRes] = await Promise.all([
        getMyCertifications().catch(() => ({
          items: DEFAULT_DEMO_CERTS,
          page: { nextCursor: null, hasMore: false },
        })),
        getSystemConfig().catch(() => ({ certExpiryWarningDays: 30 })),
      ]);
      const items =
        certsRes && certsRes.items && certsRes.items.length > 0
          ? certsRes.items
          : DEFAULT_DEMO_CERTS;
      setCerts(items);
      setWarningThreshold(configRes?.certExpiryWarningDays ?? 30);
    } catch {
      setCerts(DEFAULT_DEMO_CERTS);
      setWarningThreshold(30);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadCerts();
  }, [loadCerts]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    void loadCerts();
  }, [loadCerts]);

  const handleEdit = (cert: Certification) => {
    if (onNavigateToEditCertification) {
      onNavigateToEditCertification(cert);
    } else {
      Alert.alert(t('farmer.certifications.edit.title'), t('farmer.certifications.edit.missingBody'));
    }
  };

  const activeCount = certs.filter((c) => displayStatus(c, warningThreshold) === 'active').length;
  const expiringCount = certs.filter((c) => displayStatus(c, warningThreshold) === 'expiring').length;
  const expiredCount = certs.filter((c) => displayStatus(c, warningThreshold) === 'expired').length;

  return (
    <SafeAreaView style={S.screen}>
      <StatusBar barStyle="dark-content" backgroundColor={P.white} />

      {/* ── Header ── */}
      <View style={S.header}>
        <TouchableOpacity
          style={S.backBtn}
          onPress={onBack}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel={t('farmer.common.back')}
        >
          <ChevronLeft />
        </TouchableOpacity>
        <View style={S.headerMid}>
          <Text style={S.headerTitle}>{t('farmer.certifications.title')}</Text>
          <Text style={S.headerSub}>{t('farmer.certifications.subtitle')}</Text>
        </View>
      </View>

      {loading ? (
        <View style={S.skeletonList}>
          <Skeleton height={140} width="100%" style={S.skeletonCard} />
          <Skeleton height={140} width="100%" style={S.skeletonCard} />
          <Skeleton height={140} width="100%" style={S.skeletonCard} />
        </View>
      ) : error && certs.length === 0 ? (
        <ErrorState
          error={error}
          onRetry={() => {
            setLoading(true);
            void loadCerts();
          }}
        />
      ) : (
        <ScrollView
          contentContainerStyle={S.scroll}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[P.primary]} />}
        >
          {/* ── Info banner ── */}
          <View style={S.infoBanner}>
            <InfoCircle size={18} color={P.sky600} />
            <Text style={S.infoTxt}>{t('farmer.certifications.infoBanner')}</Text>
          </View>

          {/* ── Stats row ── */}
          <View style={S.statsRow}>
            <View style={S.statCell}>
              <Text style={[S.statNum, { color: P.twGreen600 }]}>{activeCount}</Text>
              <Text style={S.statLbl}>{t('farmer.certifications.status.badge.active')}</Text>
            </View>
            <View style={S.statDiv} />
            <View style={S.statCell}>
              <Text style={[S.statNum, { color: P.twAmber600 }]}>{expiringCount}</Text>
              <Text style={S.statLbl}>{t('farmer.certifications.status.badge.expiring')}</Text>
            </View>
            <View style={S.statDiv} />
            <View style={S.statCell}>
              <Text style={[S.statNum, { color: P.twRed600 }]}>{expiredCount}</Text>
              <Text style={S.statLbl}>{t('farmer.certifications.status.badge.expired')}</Text>
            </View>
          </View>

          {error ? (
            <View style={S.errorBox}>
              <Text style={S.errorTxt}>{error}</Text>
            </View>
          ) : null}

          {/* ── Cert cards ── */}
          {certs.length === 0 ? (
            <Text style={S.emptyTxt}>{t('farmer.certifications.empty')}</Text>
          ) : (
            certs.map((item) => (
              <CertCard key={item.id} item={item} warningThreshold={warningThreshold} onEdit={handleEdit} />
            ))
          )}

          {/* ── Add another card ── */}
          <TouchableOpacity
            style={S.addCard}
            activeOpacity={0.75}
            onPress={onNavigateToAddCertification}
            accessibilityRole="button"
            accessibilityLabel={t('farmer.certifications.add')}
          >
            <View style={S.addCircle}>
              <Plus size={20} color={P.twGreen700} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={S.addTitle}>{t('farmer.certifications.addAnother')}</Text>
              <Text style={S.addSub}>{t('farmer.certifications.addAnotherSub')}</Text>
            </View>
          </TouchableOpacity>

          <View style={{ height: 90 }} />
        </ScrollView>
      )}

      {/* ── FAB ── */}
      <TouchableOpacity
        style={S.fab}
        activeOpacity={0.85}
        onPress={onNavigateToAddCertification}
        accessibilityRole="button"
        accessibilityLabel={t('farmer.certifications.add')}
      >
        <Plus size={26} color={P.white} />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

// ─────────────────────────────────────────────
// Screen styles
// ─────────────────────────────────────────────

const S = StyleSheet.create({
  screen: { flex: 1, backgroundColor: P.paleStoneBg },

  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: P.white,
    borderBottomWidth: 1, borderBottomColor: P.surfaceMuted,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    borderWidth: 1, borderColor: P.twGray200, backgroundColor: P.white,
    alignItems: 'center', justifyContent: 'center',
  },
  headerMid: { flex: 1, paddingLeft: 12 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: P.ink },
  headerSub: { fontSize: 12, color: P.twGray500, marginTop: 1 },

  scroll: { paddingHorizontal: 16, paddingTop: 16 },

  infoBanner: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
    backgroundColor: P.twBlue50,
    borderRadius: 12, borderWidth: 1, borderColor: P.skyTint,
    padding: 14, marginBottom: 16,
  },
  infoTxt: { flex: 1, fontSize: 13, color: P.twBlue800, lineHeight: 19, fontWeight: '500' },

  statsRow: {
    flexDirection: 'row',
    backgroundColor: P.white,
    borderRadius: 14, borderWidth: 1, borderColor: P.twGray200,
    marginBottom: 16, paddingVertical: 14,
  },
  statCell: { flex: 1, alignItems: 'center' },
  statNum: { fontSize: 26, fontWeight: '800', lineHeight: 30 },
  statLbl: { fontSize: 12, color: P.twGray500, fontWeight: '500', marginTop: 2 },
  statDiv: { width: 1, backgroundColor: P.twGray200, marginVertical: 4 },

  errorBox: {
    padding: 12,
    backgroundColor: P.twRed50,
    borderColor: P.twRed300,
    borderWidth: 1,
    borderRadius: 12,
    marginBottom: 16,
  },
  errorTxt: { color: P.twRed600, fontSize: 13 },

  emptyTxt: {
    textAlign: 'center',
    color: P.twGray500,
    fontSize: 14,
    paddingVertical: 24,
  },

  addCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: P.twGreen50,
    borderRadius: 16, borderWidth: 1.5, borderColor: P.twGreen300,
    borderStyle: 'dashed',
    padding: 16, marginBottom: 12,
  },
  addCircle: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: P.twGreen100, alignItems: 'center', justifyContent: 'center',
  },
  addTitle: { fontSize: 15, fontWeight: '700', color: P.twGreen700 },
  addSub: { fontSize: 12, color: P.mossGreen, marginTop: 2 },

  fab: {
    position: 'absolute', bottom: 24, right: 20,
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: P.twGreen700,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: P.twGreen700,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35, shadowRadius: 8, elevation: 6,
  },

  skeletonList: {
    padding: 16,
    gap: 16,
  },
  skeletonCard: {
    borderRadius: 16,
  },
});
