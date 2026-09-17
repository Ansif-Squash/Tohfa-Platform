import React, { useEffect, useState } from 'react';
import {
  Alert,
  Image,
  Modal,
  SafeAreaView,
  ScrollView,
  Share,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Circle, Line, Polygon } from 'react-native-svg';
import { Icon } from '@tohfa/mobile-ui';
import {
  getMyFarmerProfile,
  maskAadhaar,
  maskMobile,
  updateMyFarmerProfile,
} from '../../api/farmer';
import { LOCALES, setLocale, type Locale } from '../../../../i18n/farmer';
import { colors, authPalette as P } from '../../theme';
import farmerAvatar from '../../assets/farmer-kumar.jpg';

interface ProfileScreenProps {
  onNavigateToHome?: () => void;
  onNavigateToCertifications?: () => void;
  onNavigateToMarket?: () => void;
  onNavigateToFMBSketch?: () => void;
  onNavigateToPersonalDetails?: () => void;
  onNavigateToAudits?: () => void;
  onNavigateToFarmRatings?: () => void;
  onNavigateToSoilTest?: () => void;
  onNavigateToSettings?: () => void;
}

interface PersonalDetailsData {
  fullName: string;
  dob: string;
  mobile: string;
  aadhaar: string;
  yearsInOrganic: string;
  farmingType: string;
  farmName: string;
  location: string;
}

interface FarmDetailsData {
  acres: string;
  zones: string;
  farms: string;
  fmbPts: string;
  waterSource: string;
  tags: string[];
}

export function ProfileScreen({
  onNavigateToHome,
  onNavigateToCertifications,
  onNavigateToFMBSketch,
  onNavigateToPersonalDetails,
  onNavigateToAudits,
  onNavigateToFarmRatings,
  onNavigateToSoilTest,
  onNavigateToSettings,
}: ProfileScreenProps): React.JSX.Element {
  // --- Profile State ---
  const [personalDetails, setPersonalDetails] = useState<PersonalDetailsData>({
    fullName: 'Kumar',
    dob: '15 Mar 1985',
    mobile: '+91 98765 43210',
    aadhaar: 'XXXX XXXX 4210',
    yearsInOrganic: '14 years',
    farmingType: 'Organic',
    farmName: 'Great Earth Organic Farm',
    location: 'Kolapatti, Ooty, Nilgiris',
  });

  const [farmDetails, setFarmDetails] = useState<FarmDetailsData>({
    acres: '2.5',
    zones: '3',
    farms: '1',
    fmbPts: '8',
    waterSource: 'Borewell + Rainwater',
    tags: ['Forest boundary', 'Upper hill', 'Wildlife zone'],
  });

  const farmerId = 'TOFHA-F-2024-0417';

  // --- Modal States ---
  const [isEditPersonalModalVisible, setIsEditPersonalModalVisible] = useState(false);
  const [isEditFarmModalVisible, setIsEditFarmModalVisible] = useState(false);
  const [isSettingsModalVisible, setIsSettingsModalVisible] = useState(false);
  const [isDocumentsModalVisible, setIsDocumentsModalVisible] = useState(false);
  const [isBankModalVisible, setIsBankModalVisible] = useState(false);
  const [isAuditsModalVisible, setIsAuditsModalVisible] = useState(false);
  const [isRatingModalVisible, setIsRatingModalVisible] = useState(false);
  const [isSoilModalVisible, setIsSoilModalVisible] = useState(false);

  // Form edit temporary states
  const [tempFullName, setTempFullName] = useState(personalDetails.fullName);
  const [tempDob, setTempDob] = useState(personalDetails.dob);
  const [tempYearsInOrganic, setTempYearsInOrganic] = useState('14');
  const [tempFarmingType, setTempFarmingType] = useState(personalDetails.farmingType);
  const [tempFarmName, setTempFarmName] = useState(personalDetails.farmName);
  const [tempLocation, setTempLocation] = useState(personalDetails.location);

  const [tempAcres, setTempAcres] = useState(farmDetails.acres);
  const [tempZones, setTempZones] = useState(farmDetails.zones);
  const [tempWaterSource, setTempWaterSource] = useState(farmDetails.waterSource);

  const [selectedLocale, setSelectedLocale] = useState<Locale>('en');
  const [saving, setSaving] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  // Attempt to load from API in background, maintaining rich defaults if mock
  useEffect(() => {
    async function fetchProfile() {
      try {
        const res = await getMyFarmerProfile();
        if (res) {
          setPersonalDetails((prev) => ({
            ...prev,
            fullName: res.fullName || prev.fullName,
            mobile: res.mobile ? maskMobile(res.mobile) : prev.mobile,
            aadhaar: res.aadhaarLast4 ? maskAadhaar(res.aadhaarLast4) : prev.aadhaar,
            yearsInOrganic: res.farmingExperienceYears
              ? `${res.farmingExperienceYears} years`
              : prev.yearsInOrganic,
            location: res.address || prev.location,
          }));
          if (res.preferredLocale) {
            setSelectedLocale(res.preferredLocale as Locale);
          }
        }
      } catch {
        // Fallback gracefully to default rich data
      }
    }
    void fetchProfile();
  }, []);

  const handleShareProfile = async () => {
    try {
      await Share.share({
        message: `TOHFA Farmer Profile: ${personalDetails.fullName} (${farmerId})\n${personalDetails.farmName}, ${personalDetails.location}\nPGS Certified Organic Producer.`,
      });
    } catch {
      // Ignored
    }
  };

  const openPersonalEdit = () => {
    setTempFullName(personalDetails.fullName);
    setTempDob(personalDetails.dob);
    setTempYearsInOrganic(personalDetails.yearsInOrganic.replace(/\D/g, '') || '14');
    setTempFarmingType(personalDetails.farmingType);
    setTempFarmName(personalDetails.farmName);
    setTempLocation(personalDetails.location);
    setIsEditPersonalModalVisible(true);
  };

  const handleSavePersonalDetails = async () => {
    setSaving(true);
    try {
      const expNumber = parseInt(tempYearsInOrganic, 10) || 14;
      await updateMyFarmerProfile({
        fullName: tempFullName.trim(),
        farmingExperienceYears: expNumber,
        address: tempLocation.trim(),
      }).catch(() => {
        // If mock backend fails, proceed with local update
      });

      setPersonalDetails({
        ...personalDetails,
        fullName: tempFullName.trim() || 'Kumar',
        dob: tempDob.trim() || '15 Mar 1985',
        yearsInOrganic: `${expNumber} years`,
        farmingType: tempFarmingType,
        farmName: tempFarmName.trim() || 'Great Earth Organic Farm',
        location: tempLocation.trim() || 'Kolapatti, Ooty, Nilgiris',
      });

      setIsEditPersonalModalVisible(false);
      setSaveSuccessMsg('Personal details updated successfully!');
      setTimeout(() => setSaveSuccessMsg(null), 3000);
    } finally {
      setSaving(false);
    }
  };

  const openFarmEdit = () => {
    if (onNavigateToFMBSketch) {
      onNavigateToFMBSketch();
    } else {
      setTempAcres(farmDetails.acres);
      setTempZones(farmDetails.zones);
      setTempWaterSource(farmDetails.waterSource);
      setIsEditFarmModalVisible(true);
    }
  };

  const handleSaveFarmDetails = () => {
    setFarmDetails((prev) => ({
      ...prev,
      acres: tempAcres.trim() || '2.5',
      zones: tempZones.trim() || '3',
      waterSource: tempWaterSource.trim() || 'Borewell + Rainwater',
    }));
    setIsEditFarmModalVisible(false);
    setSaveSuccessMsg('Farm & FMB details updated!');
    setTimeout(() => setSaveSuccessMsg(null), 3000);
  };

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar barStyle="light-content" backgroundColor={P.deepGreen} />

      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* ================= HEADER SECTION ================= */}
        <View style={styles.headerBanner}>
          {/* Top Bar Navigation */}
          <View style={styles.headerNavRow}>
            <TouchableOpacity
              style={styles.navCircleButton}
              onPress={onNavigateToHome}
              accessibilityLabel="Back to home"
              activeOpacity={0.7}
            >
              <Icon name="arrow_back" size={26} color={colors.white} style={styles.navBackIcon} />
            </TouchableOpacity>

            <Text style={styles.navTitle}>Profile</Text>

            <View style={styles.navRightActions}>
              <TouchableOpacity
                style={styles.navCircleButton}
                onPress={handleShareProfile}
                accessibilityLabel="Share profile"
                activeOpacity={0.7}
              >
                <Icon name="share" size={16} color={colors.white} />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.navCircleButton}
                onPress={() => {
                  if (onNavigateToSettings) {
                    onNavigateToSettings();
                  } else {
                    setIsSettingsModalVisible(true);
                  }
                }}
                accessibilityLabel="Settings"
                activeOpacity={0.7}
              >
                <Icon name="settings" size={16} color={colors.white} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Farmer Avatar & Basic Info */}
          <View style={styles.profileHero}>
            <View style={styles.avatarContainer}>
              <Image
                source={farmerAvatar}
                style={styles.avatarImage}
                resizeMode="cover"
              />
              <TouchableOpacity
                style={styles.avatarEditBadge}
                onPress={() => (onNavigateToPersonalDetails ? onNavigateToPersonalDetails() : openPersonalEdit())}
                activeOpacity={0.8}
                accessibilityLabel="Edit profile picture"
              >
                <Icon name="edit" size={14} color={colors.brandGreen} />
              </TouchableOpacity>
            </View>

            <Text style={styles.farmerName}>{personalDetails.fullName}</Text>

            <View style={styles.idBadgePill}>
              <Text style={styles.idBadgeText}>{farmerId}</Text>
            </View>

            <Text style={styles.farmNameText}>{personalDetails.farmName}</Text>
            <View style={styles.iconTextRow}>
              <Icon name="place" size={12} color={P.green100} />
              <Text style={styles.locationText}>{personalDetails.location}</Text>
            </View>
          </View>

          {/* 4 Quick Stat Cards Overlapping Header */}
          <View style={styles.quickStatsRow}>
            <View style={styles.quickStatCard}>
              <Icon name="shield" size={18} color={colors.brandGreen} style={styles.statEmoji} />
              <Text style={[styles.statValue, { color: colors.brandGreen }]}>Valid</Text>
              <Text style={styles.statLabel}>CERT</Text>
            </View>

            <TouchableOpacity
              style={styles.quickStatCard}
              onPress={() => (onNavigateToFarmRatings ? onNavigateToFarmRatings() : setIsRatingModalVisible(true))}
              activeOpacity={0.8}
            >
              <Icon name="star" size={18} color={P.deepGreen} style={styles.statEmoji} />
              <Text style={[styles.statValue, { color: P.deepGreen }]}>82</Text>
              <Text style={styles.statLabel}>RATING</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickStatCard}
              onPress={() => setIsAuditsModalVisible(true)}
              activeOpacity={0.8}
            >
              <Icon name="calendar_today" size={18} color={P.orange900} style={styles.statEmoji} />
              <Text style={[styles.statValue, { color: P.orange900 }]}>12d</Text>
              <Text style={styles.statLabel}>AUDIT</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickStatCard}
              onPress={openFarmEdit}
              activeOpacity={0.8}
            >
              <Icon name="eco" size={18} color={P.deepGreen} style={styles.statEmoji} />
              <Text style={[styles.statValue, { color: P.deepGreen }]}>{farmDetails.acres}</Text>
              <Text style={styles.statLabel}>ACRES</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Success Toast */}
        {saveSuccessMsg ? (
          <View style={[styles.toastSuccess, styles.toastSuccessRow]}>
            <Icon name="check_circle" size={14} color={P.deepGreen} />
            <Text style={styles.toastSuccessText}>{saveSuccessMsg}</Text>
          </View>
        ) : null}

        {/* ================= CARD 1: PERSONAL DETAILS ================= */}
        <View style={styles.cardContainer}>
          <View style={styles.cardHeaderRow}>
            <View style={[styles.cardIconBox, { backgroundColor: P.violetTint }]}>
              <Icon name="person" size={18} color={P.violetAccent} />
            </View>
            <View style={styles.cardHeaderTitleBox}>
              <Text style={styles.cardTitle}>Personal Details</Text>
              <Text style={styles.cardSubtitle}>Identity & contact info</Text>
            </View>
            <TouchableOpacity onPress={() => (onNavigateToPersonalDetails ? onNavigateToPersonalDetails() : openPersonalEdit())} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Text style={styles.cardActionLink}>Edit</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Full Name</Text>
            <Text style={styles.detailValue}>{personalDetails.fullName}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Date of Birth</Text>
            <Text style={styles.detailValue}>{personalDetails.dob}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Mobile</Text>
            <Text style={styles.detailValue}>{personalDetails.mobile}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Aadhaar</Text>
            <Text style={styles.detailValue}>{personalDetails.aadhaar}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Years in Organic</Text>
            <Text style={styles.detailValue}>{personalDetails.yearsInOrganic}</Text>
          </View>

          <View style={[styles.detailRow, { borderBottomWidth: 0 }]}>
            <Text style={styles.detailLabel}>Farming Type</Text>
            <View style={styles.iconTextRow}>
              <Icon name="eco" size={13} color={colors.brandGreen} />
              <Text style={[styles.detailValue, { color: colors.brandGreen }]}>
                {personalDetails.farmingType}
              </Text>
            </View>
          </View>
        </View>

        {/* ================= CARD 2: FARM & FMB ================= */}
        <View style={styles.cardContainer}>
          <View style={styles.cardHeaderRow}>
            <View style={[styles.cardIconBox, { backgroundColor: colors.brandGreenLight }]}>
              <Icon name="shield" size={18} color={colors.brandGreen} />
            </View>
            <View style={styles.cardHeaderTitleBox}>
              <Text style={styles.cardTitle}>Farm & FMB</Text>
              <Text style={styles.cardSubtitle}>Boundary & land context</Text>
            </View>
            <TouchableOpacity onPress={openFarmEdit} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Text style={styles.cardActionLink}>Edit</Text>
            </TouchableOpacity>
          </View>

          {/* FMB Interactive / Vector Map Preview */}
          <View style={styles.fmbMapContainer}>
            <Svg width="100%" height="135" viewBox="0 0 320 135">
              {/* Background Grid Lines */}
              <Line x1="0" y1="67" x2="320" y2="67" stroke={P.slate200} strokeWidth="1" strokeDasharray="4,4" />
              <Line x1="160" y1="0" x2="160" y2="135" stroke={P.slate200} strokeWidth="1" strokeDasharray="4,4" />

              {/* FMB Cadastral Boundary Polygon */}
              <Polygon
                points="45,40 270,30 250,110 65,115"
                fill="rgba(165, 214, 167, 0.55)"
                stroke={colors.brandGreen}
                strokeWidth="2.5"
                strokeLinejoin="round"
              />

              {/* Inner Center Plot Marker */}
              <Circle cx="158" cy="68" r="7" fill={P.orange600} stroke={colors.white} strokeWidth="2.5" />
            </Svg>

            {/* GPS Tag */}
            <View style={styles.gpsCoordinatesBadge}>
              <Text style={styles.gpsCoordinatesText}>11.4064° N, 76.6932° E</Text>
            </View>
          </View>

          {/* 4 Metrics Strip */}
          <View style={styles.fmbMetricsStrip}>
            <View style={styles.fmbMetricItem}>
              <Text style={styles.fmbMetricValue}>{farmDetails.acres}</Text>
              <Text style={styles.fmbMetricLabel}>ACRES</Text>
            </View>
            <View style={styles.fmbMetricDivider} />
            <View style={styles.fmbMetricItem}>
              <Text style={styles.fmbMetricValue}>{farmDetails.zones}</Text>
              <Text style={styles.fmbMetricLabel}>ZONES</Text>
            </View>
            <View style={styles.fmbMetricDivider} />
            <View style={styles.fmbMetricItem}>
              <Text style={styles.fmbMetricValue}>{farmDetails.farms}</Text>
              <Text style={styles.fmbMetricLabel}>FARMS</Text>
            </View>
            <View style={styles.fmbMetricDivider} />
            <View style={styles.fmbMetricItem}>
              <Text style={styles.fmbMetricValue}>{farmDetails.fmbPts}</Text>
              <Text style={styles.fmbMetricLabel}>FMB PTS</Text>
            </View>
          </View>

          {/* Water Source Row */}
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Water Source</Text>
            <Text style={styles.detailValue}>{farmDetails.waterSource}</Text>
          </View>

          {/* Land Context Pills */}
          <View style={styles.tagPillContainer}>
            <View style={[styles.tagPill, styles.iconTextRow, { backgroundColor: colors.brandGreenLight }]}>
              <Icon name="park" size={11} color={colors.brandGreen} />
              <Text style={[styles.tagPillText, { color: colors.brandGreen }]}>Forest boundary</Text>
            </View>
            <View style={[styles.tagPill, styles.iconTextRow, { backgroundColor: colors.brandGreenLight }]}>
              <Icon name="terrain" size={11} color={colors.brandGreen} />
              <Text style={[styles.tagPillText, { color: colors.brandGreen }]}>Upper hill</Text>
            </View>
            <View style={[styles.tagPill, styles.iconTextRow, { backgroundColor: P.red50 }]}>
              <Icon name="eco" size={11} color={P.red800} />
              <Text style={[styles.tagPillText, { color: P.red800 }]}>Wildlife zone</Text>
            </View>
          </View>
        </View>

        {/* ================= CARD 3: CERTIFICATIONS ================= */}
        <View style={styles.cardContainer}>
          <View style={styles.cardHeaderRow}>
            <View style={[styles.cardIconBox, { backgroundColor: P.blue50 }]}>
              <Icon name="military_tech" size={18} color={P.blue700} />
            </View>
            <View style={styles.cardHeaderTitleBox}>
              <Text style={styles.cardTitle}>Certifications</Text>
              <Text style={styles.cardSubtitle}>PGS & NPOP status</Text>
            </View>
            <TouchableOpacity
              onPress={() => onNavigateToCertifications?.()}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text style={styles.cardActionLink}>Manage</Text>
            </TouchableOpacity>
          </View>

          {/* 2 Certification Badges side-by-side */}
          <View style={styles.certCardsRow}>
            {/* PGS Card */}
            <TouchableOpacity
              style={[styles.certSubCard, { backgroundColor: P.certCardBg, borderColor: P.sageTintBg }]}
              onPress={() => onNavigateToCertifications?.()}
              activeOpacity={0.8}
            >
              <View style={styles.certCardTop}>
                <Icon name="eco" size={22} color={colors.brandGreen} />
                <View style={styles.greenCheckmarkCircle}>
                  <Icon name="check" size={11} color={colors.white} />
                </View>
              </View>
              <Text style={styles.certTitle}>PGS Organic</Text>
              <Text style={[styles.certStatusText, { color: colors.brandGreen }]}>Valid</Text>
              <Text style={styles.certRenewText}>Renews in 214 days</Text>
            </TouchableOpacity>

            {/* NPOP Card */}
            <TouchableOpacity
              style={[styles.certSubCard, { backgroundColor: P.warnCardBg, borderColor: P.warnCardBorder }]}
              onPress={() => onNavigateToCertifications?.()}
              activeOpacity={0.8}
            >
              <View style={styles.certCardTop}>
                <Icon name="storefront" size={22} color={P.orange900} />
                <View style={styles.orangeExclamationCircle}>
                  <Text style={styles.orangeExclamationText}>!</Text>
                </View>
              </View>
              <Text style={styles.certTitle}>NPOP</Text>
              <Text style={[styles.certStatusText, { color: P.orange900 }]}>Expiring</Text>
              <Text style={styles.certRenewText}>Renews in 24 days</Text>
            </TouchableOpacity>
          </View>

          {/* Expiry Warning Notice */}
          <View style={styles.warningNoticeBox}>
            <Icon name="warning" size={16} color={P.amberDeep} />
            <Text style={styles.warningNoticeText}>
              NPOP certificate expires soon. Renew to keep market listings active.
            </Text>
          </View>
        </View>

        {/* ================= CARD 4: AUDITS ================= */}
        <View style={styles.cardContainer}>
          <View style={styles.cardHeaderRow}>
            <View style={[styles.cardIconBox, { backgroundColor: P.lightBlue50 }]}>
              <Icon name="assignment" size={18} color={P.lightBlue700} />
            </View>
            <View style={styles.cardHeaderTitleBox}>
              <Text style={styles.cardTitle}>Audits</Text>
              <Text style={styles.cardSubtitle}>Quarterly inspections</Text>
            </View>
            <TouchableOpacity onPress={() => setIsAuditsModalVisible(true)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Text style={styles.cardActionLink}>View All</Text>
            </TouchableOpacity>
          </View>

          {/* Next Audit Banner */}
          <View style={styles.nextAuditBanner}>
            <View style={styles.auditProgressSquare}>
              <Text style={styles.auditProgressFraction}>3/4</Text>
              <Text style={styles.auditProgressDone}>DONE</Text>
            </View>
            <View style={styles.nextAuditDetails}>
              <Text style={styles.nextAuditSubLabel}>Next audit</Text>
              <Text style={styles.nextAuditDateText}>May 26, 2026 · External</Text>
            </View>
            <View style={styles.auditDueRedPill}>
              <Text style={styles.auditDueRedText}>12d</Text>
            </View>
          </View>

          {/* Past Audits List */}
          <View style={styles.auditList}>
            <View style={styles.auditItemRow}>
              <View style={[styles.statusDot, { backgroundColor: colors.brandGreen }]} />
              <View style={styles.auditItemInfo}>
                <Text style={styles.auditItemDate}>Apr 20, 2026 · External</Text>
                <Text style={styles.auditItemSubtext}>0 major · 1 minor · Passed</Text>
              </View>
              <Text style={[styles.auditScore, { color: colors.brandGreen }]}>88</Text>
            </View>

            <View style={styles.auditItemRow}>
              <View style={[styles.statusDot, { backgroundColor: P.orange800 }]} />
              <View style={styles.auditItemInfo}>
                <Text style={styles.auditItemDate}>Jan 18, 2026 · Internal</Text>
                <Text style={styles.auditItemSubtext}>0 major · 3 minor · Passed w/ issues</Text>
              </View>
              <Text style={[styles.auditScore, { color: P.orange800 }]}>74</Text>
            </View>

            <View style={[styles.auditItemRow, { borderBottomWidth: 0 }]}>
              <View style={[styles.statusDot, { backgroundColor: colors.brandGreen }]} />
              <View style={styles.auditItemInfo}>
                <Text style={styles.auditItemDate}>Oct 12, 2025 · External</Text>
                <Text style={styles.auditItemSubtext}>0 major · 0 minor · Passed</Text>
              </View>
              <Text style={[styles.auditScore, { color: colors.brandGreen }]}>91</Text>
            </View>
          </View>
        </View>

        {/* ================= CARD 5: FARM RATING ================= */}
        <View style={styles.cardContainer}>
          <View style={styles.cardHeaderRow}>
            <View style={[styles.cardIconBox, { backgroundColor: colors.brandGreenLight }]}>
              <Icon name="star" size={18} color={colors.brandGreen} />
            </View>
            <View style={styles.cardHeaderTitleBox}>
              <Text style={styles.cardTitle}>Farm Rating</Text>
              <Text style={styles.cardSubtitle}>10-category framework</Text>
            </View>
            <TouchableOpacity onPress={() => (onNavigateToFarmRatings ? onNavigateToFarmRatings() : setIsRatingModalVisible(true))} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Text style={styles.cardActionLink}>Details</Text>
            </TouchableOpacity>
          </View>

          {/* Rating Circle and Status */}
          <View style={styles.ratingHeroRow}>
            <View style={styles.ratingGaugeContainer}>
              <Svg width="86" height="86" viewBox="0 0 100 100">
                <Circle cx="50" cy="50" r="40" stroke={colors.brandGreenLight} strokeWidth="8" fill="none" />
                <Circle
                  cx="50"
                  cy="50"
                  r="40"
                  stroke={colors.brandGreen}
                  strokeWidth="8"
                  fill="none"
                  strokeDasharray={2 * Math.PI * 40}
                  strokeDashoffset={2 * Math.PI * 40 * (1 - 0.82)}
                  strokeLinecap="round"
                  transform="rotate(-90 50 50)"
                />
              </Svg>
              <View style={styles.ratingGaugeCenterText}>
                <Text style={styles.ratingGaugeScore}>82</Text>
                <Text style={styles.ratingGaugeMax}>/100</Text>
              </View>
            </View>

            <View style={styles.ratingStatusDetails}>
              <Text style={styles.ratingStatusTitle}>Excellent</Text>
              <View style={[styles.ratingDeltaPill, styles.iconTextRow]}>
                <Icon name="trending_up" size={11} color={colors.brandGreen} />
                <Text style={styles.ratingDeltaText}>+4 this month</Text>
              </View>
            </View>
          </View>

          {/* Rating Category Progress Bars */}
          <View style={styles.ratingBarsList}>
            <View style={styles.barItem}>
              <View style={styles.barHeader}>
                <Text style={styles.barTitle}>Certification & Compliance</Text>
                <Text style={[styles.barScore, { color: colors.brandGreen }]}>9/10</Text>
              </View>
              <View style={styles.barTrack}>
                <View style={[styles.barFill, { width: '90%', backgroundColor: colors.brandGreen }]} />
              </View>
            </View>

            <View style={styles.barItem}>
              <View style={styles.barHeader}>
                <Text style={styles.barTitle}>Environmental Sustainability</Text>
                <Text style={[styles.barScore, { color: colors.brandGreen }]}>9/10</Text>
              </View>
              <View style={styles.barTrack}>
                <View style={[styles.barFill, { width: '90%', backgroundColor: colors.brandGreen }]} />
              </View>
            </View>

            <View style={styles.barItem}>
              <View style={styles.barHeader}>
                <Text style={styles.barTitle}>Farming Practices</Text>
                <Text style={[styles.barScore, { color: colors.brandGreen }]}>8/10</Text>
              </View>
              <View style={styles.barTrack}>
                <View style={[styles.barFill, { width: '80%', backgroundColor: P.green700 }]} />
              </View>
            </View>

            <View style={styles.barItem}>
              <View style={styles.barHeader}>
                <Text style={styles.barTitle}>Market & Buyer Relations</Text>
                <Text style={[styles.barScore, { color: P.orange900 }]}>6/10</Text>
              </View>
              <View style={styles.barTrack}>
                <View style={[styles.barFill, { width: '60%', backgroundColor: P.orange700 }]} />
              </View>
            </View>

            <View style={styles.barItem}>
              <View style={styles.barHeader}>
                <Text style={styles.barTitle}>Innovation & Improvement</Text>
                <Text style={[styles.barScore, { color: P.red700 }]}>5/10</Text>
              </View>
              <View style={styles.barTrack}>
                <View style={[styles.barFill, { width: '50%', backgroundColor: P.red600 }]} />
              </View>
            </View>
          </View>
        </View>

        {/* ================= CARD 6: SOIL TEST ================= */}
        <View style={styles.cardContainer}>
          <View style={styles.cardHeaderRow}>
            <View style={[styles.cardIconBox, { backgroundColor: P.amber50 }]}>
              <Icon name="science" size={18} color={P.yellow900} />
            </View>
            <View style={styles.cardHeaderTitleBox}>
              <Text style={styles.cardTitle}>Soil Test</Text>
              <Text style={styles.cardSubtitle}>Annual analysis</Text>
            </View>
            <TouchableOpacity onPress={() => (onNavigateToSoilTest ? onNavigateToSoilTest() : setIsSoilModalVisible(true))} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Text style={styles.cardActionLink}>History</Text>
            </TouchableOpacity>
          </View>

          {/* Test Dates Strip */}
          <View style={styles.soilDateStrip}>
            <View>
              <Text style={styles.soilDateLabel}>Last tested</Text>
              <Text style={styles.soilDateValue}>08 Jan 2026</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.soilDateLabel}>Next due</Text>
              <Text style={styles.soilDateValue}>Jan 2027</Text>
            </View>
          </View>

          {/* 4 Soil Metric Tiles (2x2) */}
          <View style={styles.soilGridContainer}>
            <View style={styles.soilGridTile}>
              <Text style={styles.soilTileLabel}>Organic Carbon</Text>
              <Text style={styles.soilTileValue}>0.68%</Text>
              <View style={[styles.soilBadge, { backgroundColor: colors.brandGreenLight }]}>
                <Text style={[styles.soilBadgeText, { color: colors.brandGreen }]}>Good</Text>
              </View>
            </View>

            <View style={styles.soilGridTile}>
              <Text style={styles.soilTileLabel}>pH Value</Text>
              <Text style={styles.soilTileValue}>5.6</Text>
              <View style={[styles.soilBadge, { backgroundColor: P.red50 }]}>
                <Text style={[styles.soilBadgeText, { color: P.red800 }]}>Acidic</Text>
              </View>
            </View>

            <View style={styles.soilGridTile}>
              <Text style={styles.soilTileLabel}>EC (dS/m)</Text>
              <Text style={styles.soilTileValue}>0.42</Text>
              <View style={[styles.soilBadge, { backgroundColor: colors.brandGreenLight }]}>
                <Text style={[styles.soilBadgeText, { color: colors.brandGreen }]}>Good</Text>
              </View>
            </View>

            <View style={styles.soilGridTile}>
              <Text style={styles.soilTileLabel}>Water TDS (ppm)</Text>
              <Text style={styles.soilTileValue}>610</Text>
              <View style={[styles.soilBadge, { backgroundColor: P.orange50 }]}>
                <Text style={[styles.soilBadgeText, { color: P.orange900 }]}>High</Text>
              </View>
            </View>
          </View>

          {/* Soil Advisory Recommendation */}
          <View style={styles.soilAdvisoryBox}>
            <Icon name="warning" size={16} color={P.red800} />
            <Text style={styles.soilAdvisoryText}>
              Soil pH is acidic. Consider lime application to bring pH between 6.0–7.5.
            </Text>
          </View>
        </View>

        {/* ================= CARD 7: MENU / ACTION LIST ================= */}
        <View style={[styles.cardContainer, { paddingVertical: 6 }]}>
          <TouchableOpacity
            style={styles.menuItemRow}
            onPress={() => setIsDocumentsModalVisible(true)}
            activeOpacity={0.7}
          >
            <View style={[styles.menuIconBox, { backgroundColor: P.violetTint }]}>
              <Icon name="description" size={18} color={P.violetAccent} />
            </View>
            <View style={styles.menuTitleBox}>
              <Text style={styles.menuTitle}>My Documents</Text>
              <Text style={styles.menuSubtitle}>ID proof, farm docs, certificates</Text>
            </View>
            <View style={styles.menuRedBadge}>
              <Text style={styles.menuRedBadgeText}>1</Text>
            </View>
            <Icon name="chevron_right" size={18} color={P.slate400} />
          </TouchableOpacity>

          <View style={styles.menuDivider} />

          <TouchableOpacity
            style={styles.menuItemRow}
            onPress={() => setIsBankModalVisible(true)}
            activeOpacity={0.7}
          >
            <View style={[styles.menuIconBox, { backgroundColor: colors.brandGreenLight }]}>
              <Icon name="credit_card" size={18} color={colors.brandGreen} />
            </View>
            <View style={styles.menuTitleBox}>
              <Text style={styles.menuTitle}>Bank & Payment</Text>
              <Text style={styles.menuSubtitle}>Bank account · UPI ID · payout history</Text>
            </View>
            <Icon name="chevron_right" size={18} color={P.slate400} />
          </TouchableOpacity>

          <View style={styles.menuDivider} />

          <TouchableOpacity
            style={styles.menuItemRow}
            onPress={() => {
              if (onNavigateToSettings) {
                onNavigateToSettings();
              } else {
                setIsSettingsModalVisible(true);
              }
            }}
            activeOpacity={0.7}
          >
            <View style={[styles.menuIconBox, { backgroundColor: P.sky100 }]}>
              <Icon name="settings" size={18} color={P.sky600} />
            </View>
            <View style={styles.menuTitleBox}>
              <Text style={styles.menuTitle}>Settings</Text>
              <Text style={styles.menuSubtitle}>Language, notifications, privacy</Text>
            </View>
            <Icon name="chevron_right" size={18} color={P.slate400} />
          </TouchableOpacity>

          <View style={styles.menuDivider} />

          <TouchableOpacity
            style={styles.menuItemRow}
            onPress={() => {
              Alert.alert(
                'TOHFA Help & Support',
                'Toll-Free Support: 1800-425-8643\nWhatsApp: +91 94432 12345\nEmail: support@tohfa.in',
                [{ text: 'OK' }]
              );
            }}
            activeOpacity={0.7}
          >
            <View style={[styles.menuIconBox, { backgroundColor: P.twOrange50 }]}>
              <Icon name="help" size={18} color={P.twOrange600} />
            </View>
            <View style={styles.menuTitleBox}>
              <Text style={styles.menuTitle}>Help & Support</Text>
              <Text style={styles.menuSubtitle}>FAQs, contact TOHFA, feedback</Text>
            </View>
            <Icon name="chevron_right" size={18} color={P.slate400} />
          </TouchableOpacity>
        </View>

        <View style={{ height: 36 }} />
      </ScrollView>

      {/* ================= MODAL: EDIT PERSONAL DETAILS ================= */}
      <Modal
        visible={isEditPersonalModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsEditPersonalModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Personal Details</Text>
              <TouchableOpacity onPress={() => setIsEditPersonalModalVisible(false)}>
                <Icon name="close" size={18} color={P.slate400} style={styles.modalCloseText} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={styles.modalBody}>
              <Text style={styles.inputLabel}>Full Name</Text>
              <TextInput
                style={styles.textInput}
                value={tempFullName}
                onChangeText={setTempFullName}
                placeholder="Full Name"
              />

              <Text style={styles.inputLabel}>Date of Birth</Text>
              <TextInput
                style={styles.textInput}
                value={tempDob}
                onChangeText={setTempDob}
                placeholder="DD Mon YYYY"
              />

              <Text style={styles.inputLabel}>Years in Organic Farming</Text>
              <TextInput
                style={styles.textInput}
                value={tempYearsInOrganic}
                onChangeText={setTempYearsInOrganic}
                keyboardType="numeric"
                placeholder="e.g. 14"
              />

              <Text style={styles.inputLabel}>Farming Type</Text>
              <View style={styles.chipsRow}>
                {['Organic', 'Natural', 'Biodynamic'].map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.choiceChip,
                      tempFarmingType === type && styles.choiceChipActive,
                    ]}
                    onPress={() => setTempFarmingType(type)}
                  >
                    <Text
                      style={[
                        styles.choiceChipText,
                        tempFarmingType === type && styles.choiceChipTextActive,
                      ]}
                    >
                      {type}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.inputLabel}>Farm Name</Text>
              <TextInput
                style={styles.textInput}
                value={tempFarmName}
                onChangeText={setTempFarmName}
                placeholder="Farm Name"
              />

              <Text style={styles.inputLabel}>Farm Location / Village</Text>
              <TextInput
                style={styles.textInput}
                value={tempLocation}
                onChangeText={setTempLocation}
                placeholder="Village, Taluk, District"
              />

              <View style={styles.lockedSection}>
                <View style={[styles.iconTextRow, { marginBottom: 4 }]}>
                  <Icon name="lock" size={12} color={P.slate800} />
                  <Text style={[styles.lockedSectionTitle, { marginBottom: 0 }]}>Verified KYC Details (Protected)</Text>
                </View>
                <Text style={styles.lockedSectionSubtitle}>
                  Mobile ({personalDetails.mobile}) & Aadhaar ({personalDetails.aadhaar}) are locked by TOHFA verification.
                  Contact field support to request updates.
                </Text>
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setIsEditPersonalModalVisible(false)}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.saveBtn}
                onPress={handleSavePersonalDetails}
                disabled={saving}
              >
                <Text style={styles.saveBtnText}>{saving ? 'Saving...' : 'Save Changes'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ================= MODAL: EDIT FARM & FMB ================= */}
      <Modal
        visible={isEditFarmModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsEditFarmModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Farm & Land Details</Text>
              <TouchableOpacity onPress={() => setIsEditFarmModalVisible(false)}>
                <Icon name="close" size={18} color={P.slate400} style={styles.modalCloseText} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={styles.modalBody}>
              <Text style={styles.inputLabel}>Total Land Area (Acres)</Text>
              <TextInput
                style={styles.textInput}
                value={tempAcres}
                onChangeText={setTempAcres}
                keyboardType="decimal-pad"
                placeholder="e.g. 2.5"
              />

              <Text style={styles.inputLabel}>Cultivation Zones Count</Text>
              <TextInput
                style={styles.textInput}
                value={tempZones}
                onChangeText={setTempZones}
                keyboardType="numeric"
                placeholder="e.g. 3"
              />

              <Text style={styles.inputLabel}>Water Source</Text>
              <TextInput
                style={styles.textInput}
                value={tempWaterSource}
                onChangeText={setTempWaterSource}
                placeholder="e.g. Borewell + Rainwater"
              />

              <View style={styles.lockedSection}>
                <View style={[styles.iconTextRow, { marginBottom: 4 }]}>
                  <Icon name="place" size={12} color={P.slate800} />
                  <Text style={[styles.lockedSectionTitle, { marginBottom: 0 }]}>Cadastral Survey FMB</Text>
                </View>
                <Text style={styles.lockedSectionSubtitle}>
                  FMB boundary points (8 points) verified by Department of Land Survey, Ooty. Coordinates: 11.4064° N, 76.6932° E.
                </Text>
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setIsEditFarmModalVisible(false)}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleSaveFarmDetails}>
                <Text style={styles.saveBtnText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ================= MODAL: MY DOCUMENTS ================= */}
      <Modal
        visible={isDocumentsModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsDocumentsModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>My Documents</Text>
              <TouchableOpacity onPress={() => setIsDocumentsModalVisible(false)}>
                <Icon name="close" size={18} color={P.slate400} style={styles.modalCloseText} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={styles.modalBody}>
              <View style={styles.docItemCard}>
                <Icon name="badge" size={24} color={P.slate600} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.docTitle}>Aadhaar Card</Text>
                  <View style={[styles.iconTextRow, { marginTop: 2 }]}>
                    <Icon name="check_circle" size={11} color={colors.brandGreen} />
                    <Text style={[styles.docStatusGreen, { marginTop: 0 }]}>Verified</Text>
                  </View>
                </View>
                <Text style={styles.docActionText}>View</Text>
              </View>

              <View style={styles.docItemCard}>
                <Icon name="description" size={24} color={P.slate600} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.docTitle}>Land Patta / FMB Map</Text>
                  <View style={[styles.iconTextRow, { marginTop: 2 }]}>
                    <Icon name="check_circle" size={11} color={colors.brandGreen} />
                    <Text style={[styles.docStatusGreen, { marginTop: 0 }]}>Verified</Text>
                  </View>
                </View>
                <Text style={styles.docActionText}>View</Text>
              </View>

              <View style={styles.docItemCard}>
                <Icon name="military_tech" size={24} color={P.blue700} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.docTitle}>PGS Scope Certificate</Text>
                  <View style={[styles.iconTextRow, { marginTop: 2 }]}>
                    <Icon name="check_circle" size={11} color={colors.brandGreen} />
                    <Text style={[styles.docStatusGreen, { marginTop: 0 }]}>Valid</Text>
                  </View>
                </View>
                <Text style={styles.docActionText}>Download</Text>
              </View>

              <View style={[styles.docItemCard, { borderColor: P.orange400, backgroundColor: P.alertBgCream }]}>
                <Icon name="water_drop" size={24} color={P.lightBlue700} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.docTitle}>Annual Soil & Water Health Card</Text>
                  <View style={[styles.iconTextRow, { marginTop: 2 }]}>
                    <Icon name="warning" size={11} color={P.orange900} />
                    <Text style={[styles.docStatusGreen, { color: P.orange900, marginTop: 0 }]}>Action needed (Expiring)</Text>
                  </View>
                </View>
                <TouchableOpacity style={styles.docUploadBtn}>
                  <Text style={styles.docUploadBtnText}>Upload</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.saveBtn, { width: '100%' }]}
                onPress={() => setIsDocumentsModalVisible(false)}
              >
                <Text style={styles.saveBtnText}>Done</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ================= MODAL: BANK & PAYMENTS ================= */}
      <Modal
        visible={isBankModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsBankModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Bank & Payout Details</Text>
              <TouchableOpacity onPress={() => setIsBankModalVisible(false)}>
                <Icon name="close" size={18} color={P.slate400} style={styles.modalCloseText} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <View style={styles.bankCardPreview}>
                <Text style={styles.bankName}>State Bank of India</Text>
                <Text style={styles.bankBranch}>Ooty Main Branch</Text>
                <Text style={styles.bankAccountNum}>•••• •••• •••• 5821</Text>
                <View style={styles.bankFooterRow}>
                  <Text style={styles.bankIfsc}>IFSC: SBIN0000843</Text>
                  <Text style={styles.bankHolder}>Kumar</Text>
                </View>
              </View>

              <View style={[styles.detailRow, { marginTop: 16 }]}>
                <Text style={styles.detailLabel}>Registered UPI ID</Text>
                <Text style={styles.detailValue}>kumar.farmer@sbi</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Payout Schedule</Text>
                <Text style={[styles.detailValue, { color: colors.brandGreen }]}>Instant Direct Credit (T+1)</Text>
              </View>
              <View style={[styles.detailRow, { borderBottomWidth: 0 }]}>
                <Text style={styles.detailLabel}>Last Payout</Text>
                <Text style={styles.detailValue}>₹18,400 on 02 Sep 2026</Text>
              </View>
            </View>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.saveBtn, { width: '100%' }]}
                onPress={() => setIsBankModalVisible(false)}
              >
                <Text style={styles.saveBtnText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ================= MODAL: SETTINGS ================= */}
      <Modal
        visible={isSettingsModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsSettingsModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Settings</Text>
              <TouchableOpacity onPress={() => setIsSettingsModalVisible(false)}>
                <Icon name="close" size={18} color={P.slate400} style={styles.modalCloseText} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <Text style={styles.inputLabel}>App Language</Text>
              <View style={styles.chipsRow}>
                {LOCALES.map((code) => (
                  <TouchableOpacity
                    key={code}
                    style={[
                      styles.choiceChip,
                      selectedLocale === code && styles.choiceChipActive,
                    ]}
                    onPress={() => {
                      setSelectedLocale(code);
                      setLocale(code);
                    }}
                  >
                    <Text
                      style={[
                        styles.choiceChipText,
                        selectedLocale === code && styles.choiceChipTextActive,
                      ]}
                    >
                      {code === 'ta' ? 'தமிழ் (Tamil)' : 'English'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={[styles.detailRow, { marginTop: 20 }]}>
                <Text style={styles.detailLabel}>SMS Market Notifications</Text>
                <View style={styles.iconTextRow}>
                  <Text style={[styles.detailValue, { color: colors.brandGreen }]}>Enabled</Text>
                  <Icon name="check_circle" size={13} color={colors.brandGreen} />
                </View>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>FMB Boundary Geofence Alerts</Text>
                <View style={styles.iconTextRow}>
                  <Text style={[styles.detailValue, { color: colors.brandGreen }]}>Enabled</Text>
                  <Icon name="check_circle" size={13} color={colors.brandGreen} />
                </View>
              </View>
              <View style={[styles.detailRow, { borderBottomWidth: 0 }]}>
                <Text style={styles.detailLabel}>App Version</Text>
                <Text style={styles.detailValue}>v0.1.0 (Production)</Text>
              </View>
            </View>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.saveBtn, { width: '100%' }]}
                onPress={() => setIsSettingsModalVisible(false)}
              >
                <Text style={styles.saveBtnText}>Done</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ================= MODAL: AUDITS ================= */}
      <Modal
        visible={isAuditsModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsAuditsModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Audit Inspection History</Text>
              <TouchableOpacity onPress={() => setIsAuditsModalVisible(false)}>
                <Icon name="close" size={18} color={P.slate400} style={styles.modalCloseText} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={styles.modalBody}>
              <View style={styles.auditItemRow}>
                <View style={[styles.statusDot, { backgroundColor: colors.brandGreen }]} />
                <View style={styles.auditItemInfo}>
                  <Text style={styles.auditItemDate}>Apr 20, 2026 · External Certification</Text>
                  <Text style={styles.auditItemSubtext}>Auditor: Dr. S. Ramanathan · 0 major · 1 minor</Text>
                </View>
                <Text style={[styles.auditScore, { color: colors.brandGreen }]}>88/100</Text>
              </View>

              <View style={styles.auditItemRow}>
                <View style={[styles.statusDot, { backgroundColor: P.orange800 }]} />
                <View style={styles.auditItemInfo}>
                  <Text style={styles.auditItemDate}>Jan 18, 2026 · Internal Peer Audit</Text>
                  <Text style={styles.auditItemSubtext}>Auditor: Nilgiris Organic Local Group</Text>
                </View>
                <Text style={[styles.auditScore, { color: P.orange800 }]}>74/100</Text>
              </View>

              <View style={styles.auditItemRow}>
                <View style={[styles.statusDot, { backgroundColor: colors.brandGreen }]} />
                <View style={styles.auditItemInfo}>
                  <Text style={styles.auditItemDate}>Oct 12, 2025 · Annual NPOP Audit</Text>
                  <Text style={styles.auditItemSubtext}>Indocert Inspection Agency · 0 findings</Text>
                </View>
                <Text style={[styles.auditScore, { color: colors.brandGreen }]}>91/100</Text>
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.saveBtn, { width: '100%' }]}
                onPress={() => {
                  setIsAuditsModalVisible(false);
                  onNavigateToAudits?.();
                }}
              >
                <Text style={styles.saveBtnText}>View Details</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ================= MODAL: FARM RATING ================= */}
      <Modal
        visible={isRatingModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsRatingModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Farm Rating Framework</Text>
              <TouchableOpacity onPress={() => setIsRatingModalVisible(false)}>
                <Icon name="close" size={18} color={P.slate400} style={styles.modalCloseText} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={styles.modalBody}>
              <Text style={{ fontSize: 13, color: P.slate500, marginBottom: 14 }}>
                The TOHFA 10-category framework ranks organic purity, land management, and fair marketplace behavior.
              </Text>

              <View style={styles.barItem}>
                <View style={styles.barHeader}>
                  <Text style={styles.barTitle}>Certification & Compliance</Text>
                  <Text style={[styles.barScore, { color: colors.brandGreen }]}>9/10</Text>
                </View>
                <View style={styles.barTrack}>
                  <View style={[styles.barFill, { width: '90%', backgroundColor: colors.brandGreen }]} />
                </View>
              </View>

              <View style={styles.barItem}>
                <View style={styles.barHeader}>
                  <Text style={styles.barTitle}>Environmental Sustainability</Text>
                  <Text style={[styles.barScore, { color: colors.brandGreen }]}>9/10</Text>
                </View>
                <View style={styles.barTrack}>
                  <View style={[styles.barFill, { width: '90%', backgroundColor: colors.brandGreen }]} />
                </View>
              </View>

              <View style={styles.barItem}>
                <View style={styles.barHeader}>
                  <Text style={styles.barTitle}>Farming Practices & Soil Health</Text>
                  <Text style={[styles.barScore, { color: colors.brandGreen }]}>8/10</Text>
                </View>
                <View style={styles.barTrack}>
                  <View style={[styles.barFill, { width: '80%', backgroundColor: P.green700 }]} />
                </View>
              </View>

              <View style={styles.barItem}>
                <View style={styles.barHeader}>
                  <Text style={styles.barTitle}>Market & Buyer Relations</Text>
                  <Text style={[styles.barScore, { color: P.orange900 }]}>6/10</Text>
                </View>
                <View style={styles.barTrack}>
                  <View style={[styles.barFill, { width: '60%', backgroundColor: P.orange700 }]} />
                </View>
              </View>

              <View style={styles.barItem}>
                <View style={styles.barHeader}>
                  <Text style={styles.barTitle}>Innovation & Water Conservation</Text>
                  <Text style={[styles.barScore, { color: P.red700 }]}>5/10</Text>
                </View>
                <View style={styles.barTrack}>
                  <View style={[styles.barFill, { width: '50%', backgroundColor: P.red600 }]} />
                </View>
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.saveBtn, { width: '100%' }]}
                onPress={() => setIsRatingModalVisible(false)}
              >
                <Text style={styles.saveBtnText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ================= MODAL: SOIL TEST ================= */}
      <Modal
        visible={isSoilModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsSoilModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Soil Health Card Analysis</Text>
              <TouchableOpacity onPress={() => setIsSoilModalVisible(false)}>
                <Icon name="close" size={18} color={P.slate400} style={styles.modalCloseText} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={styles.modalBody}>
              <View style={styles.soilDateStrip}>
                <View>
                  <Text style={styles.soilDateLabel}>Sample ID</Text>
                  <Text style={styles.soilDateValue}>SHC-2026-0814</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.soilDateLabel}>Testing Lab</Text>
                  <Text style={styles.soilDateValue}>TNAU Ooty Research Lab</Text>
                </View>
              </View>

              <View style={styles.soilGridContainer}>
                <View style={styles.soilGridTile}>
                  <Text style={styles.soilTileLabel}>Organic Carbon</Text>
                  <Text style={styles.soilTileValue}>0.68%</Text>
                  <Text style={{ fontSize: 11, color: colors.brandGreen, marginTop: 4 }}>Ideal range: 0.5–0.75%</Text>
                </View>

                <View style={styles.soilGridTile}>
                  <Text style={styles.soilTileLabel}>pH Value</Text>
                  <Text style={styles.soilTileValue}>5.6</Text>
                  <Text style={{ fontSize: 11, color: P.red800, marginTop: 4 }}>Acidic (Ideal: 6.0–7.5)</Text>
                </View>

                <View style={styles.soilGridTile}>
                  <Text style={styles.soilTileLabel}>EC (dS/m)</Text>
                  <Text style={styles.soilTileValue}>0.42</Text>
                  <Text style={{ fontSize: 11, color: colors.brandGreen, marginTop: 4 }}>Normal electrical cond.</Text>
                </View>

                <View style={styles.soilGridTile}>
                  <Text style={styles.soilTileLabel}>Water TDS</Text>
                  <Text style={styles.soilTileValue}>610 ppm</Text>
                  <Text style={{ fontSize: 11, color: P.orange900, marginTop: 4 }}>High mineral hardness</Text>
                </View>
              </View>

              <View style={styles.soilAdvisoryBox}>
                <Icon name="lightbulb" size={16} color={P.red800} />
                <Text style={styles.soilAdvisoryText}>
                  Recommendation: Apply 150 kg/acre agricultural dolomite or slaked lime prior to pre-monsoon planting to balance soil acidity.
                </Text>
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.saveBtn, { width: '100%' }]}
                onPress={() => setIsSoilModalVisible(false)}
              >
                <Text style={styles.saveBtnText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: P.paleSurface,
  },
  scrollContainer: {
    paddingBottom: 40,
  },

  // --- HEADER SECTION ---
  headerBanner: {
    backgroundColor: P.deepGreen,
    paddingTop: 12,
    paddingBottom: 28,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  navCircleButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  navBackIcon: {
    marginTop: -2,
  },
  navTitle: {
    color: colors.white,
    fontSize: 18,
    fontWeight: '700',
  },
  navRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },

  profileHero: {
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  avatarContainer: {
    position: 'relative',
    marginTop: 4,
    marginBottom: 8,
  },
  avatarImage: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 3,
    borderColor: colors.white,
    backgroundColor: P.slate200,
  },
  avatarEditBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    backgroundColor: colors.white,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: P.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
  },
  farmerName: {
    color: colors.white,
    fontSize: 23,
    fontWeight: '700',
    marginBottom: 6,
  },
  idBadgePill: {
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    paddingHorizontal: 14,
    paddingVertical: 4,
    borderRadius: 14,
    marginBottom: 8,
  },
  idBadgeText: {
    color: P.greenPaleBg,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  farmNameText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 3,
  },
  locationText: {
    color: P.green100,
    fontSize: 12,
    fontWeight: '400',
  },

  // Shared row layout for an Icon placed immediately before/after a text label.
  iconTextRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },

  // --- QUICK STATS ROW ---
  quickStatsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginTop: 20,
    gap: 8,
  },
  quickStatCard: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: 14,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: P.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statEmoji: {
    marginBottom: 2,
  },
  statValue: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 9,
    fontWeight: '600',
    color: P.slate400,
    letterSpacing: 0.5,
  },

  toastSuccess: {
    backgroundColor: colors.brandGreenLight,
    borderWidth: 1,
    borderColor: P.green200,
    marginHorizontal: 16,
    marginTop: 12,
    padding: 10,
    borderRadius: 10,
  },
  toastSuccessRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  toastSuccessText: {
    color: P.deepGreen,
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },

  // --- CARDS ---
  cardContainer: {
    backgroundColor: colors.white,
    marginHorizontal: 16,
    marginTop: 14,
    borderRadius: 16,
    padding: 16,
    shadowColor: P.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
    borderWidth: 1,
    borderColor: P.slate100,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  cardHeaderTitleBox: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: P.slate800,
  },
  cardSubtitle: {
    fontSize: 12,
    color: P.slate500,
    marginTop: 1,
  },
  cardActionLink: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.brandGreen,
  },

  // Details row
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: P.slate100,
  },
  detailLabel: {
    fontSize: 13,
    color: P.slate500,
  },
  detailValue: {
    fontSize: 13,
    fontWeight: '600',
    color: P.slate800,
    textAlign: 'right',
  },

  // --- FMB MAP PREVIEW ---
  fmbMapContainer: {
    height: 135,
    backgroundColor: P.certCardBg,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
    marginVertical: 10,
    borderWidth: 1,
    borderColor: P.slate200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gpsCoordinatesBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: 'rgba(30, 41, 59, 0.85)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  gpsCoordinatesText: {
    color: colors.white,
    fontSize: 10,
    fontWeight: '700',
  },
  fmbMetricsStrip: {
    flexDirection: 'row',
    backgroundColor: P.certCardBgAlt,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'space-around',
    marginVertical: 8,
  },
  fmbMetricItem: {
    alignItems: 'center',
    flex: 1,
  },
  fmbMetricValue: {
    fontSize: 14,
    fontWeight: '700',
    color: P.slate800,
  },
  fmbMetricLabel: {
    fontSize: 9,
    fontWeight: '600',
    color: P.slate400,
    marginTop: 2,
  },
  fmbMetricDivider: {
    width: 1,
    height: 18,
    backgroundColor: P.slate200,
  },
  tagPillContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10,
  },
  tagPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
  },
  tagPillText: {
    fontSize: 11,
    fontWeight: '600',
  },

  // --- CERTIFICATIONS ---
  certCardsRow: {
    flexDirection: 'row',
    gap: 10,
    marginVertical: 6,
  },
  certSubCard: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
  },
  certCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  greenCheckmarkCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.brandGreen,
    alignItems: 'center',
    justifyContent: 'center',
  },
  greenCheckmarkText: {
    color: colors.white,
    fontSize: 11,
    fontWeight: '700',
  },
  orangeExclamationCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: P.orange900,
    alignItems: 'center',
    justifyContent: 'center',
  },
  orangeExclamationText: {
    color: colors.white,
    fontSize: 11,
    fontWeight: '700',
  },
  certTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: P.slate800,
  },
  certStatusText: {
    fontSize: 12,
    fontWeight: '700',
    marginTop: 2,
  },
  certRenewText: {
    fontSize: 10,
    color: P.slate400,
    marginTop: 2,
  },
  warningNoticeBox: {
    backgroundColor: P.amber50,
    borderColor: P.amber200,
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  warningNoticeText: {
    fontSize: 11,
    color: P.amberDeep,
    flex: 1,
    lineHeight: 16,
  },

  // --- AUDITS ---
  nextAuditBanner: {
    backgroundColor: P.paleBlueBg,
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  auditProgressSquare: {
    backgroundColor: colors.white,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 6,
    alignItems: 'center',
    marginRight: 10,
  },
  auditProgressFraction: {
    fontSize: 13,
    fontWeight: '800',
    color: P.sky600,
  },
  auditProgressDone: {
    fontSize: 8,
    fontWeight: '700',
    color: P.slate500,
  },
  nextAuditDetails: {
    flex: 1,
  },
  nextAuditSubLabel: {
    fontSize: 10,
    color: P.slate500,
  },
  nextAuditDateText: {
    fontSize: 13,
    fontWeight: '700',
    color: P.slate800,
    marginTop: 1,
  },
  auditDueRedPill: {
    backgroundColor: P.deepOrange600,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  auditDueRedText: {
    color: colors.white,
    fontSize: 11,
    fontWeight: '800',
  },
  auditList: {
    marginTop: 4,
  },
  auditItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: P.slate100,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 10,
  },
  auditItemInfo: {
    flex: 1,
  },
  auditItemDate: {
    fontSize: 13,
    fontWeight: '600',
    color: P.slate800,
  },
  auditItemSubtext: {
    fontSize: 11,
    color: P.slate400,
    marginTop: 2,
  },
  auditScore: {
    fontSize: 14,
    fontWeight: '700',
  },

  // --- FARM RATING ---
  ratingHeroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  ratingGaugeContainer: {
    width: 86,
    height: 86,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  ratingGaugeCenterText: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ratingGaugeScore: {
    fontSize: 20,
    fontWeight: '800',
    color: P.slate800,
  },
  ratingGaugeMax: {
    fontSize: 9,
    fontWeight: '600',
    color: P.slate400,
  },
  ratingStatusDetails: {
    flex: 1,
  },
  ratingStatusTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: P.deepGreen,
  },
  ratingDeltaPill: {
    backgroundColor: colors.brandGreenLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  ratingDeltaText: {
    color: colors.brandGreen,
    fontSize: 11,
    fontWeight: '700',
  },
  ratingBarsList: {
    marginTop: 6,
    gap: 10,
  },
  barItem: {
    marginBottom: 4,
  },
  barHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  barTitle: {
    fontSize: 12,
    fontWeight: '500',
    color: P.slate600,
  },
  barScore: {
    fontSize: 12,
    fontWeight: '700',
  },
  barTrack: {
    height: 6,
    backgroundColor: P.slate100,
    borderRadius: 3,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 3,
  },

  // --- SOIL TEST ---
  soilDateStrip: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: P.paleAmberBg2,
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
  },
  soilDateLabel: {
    fontSize: 10,
    color: P.twAmber900,
  },
  soilDateValue: {
    fontSize: 13,
    fontWeight: '700',
    color: P.twAmber900,
    marginTop: 1,
  },
  soilGridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  soilGridTile: {
    width: '48%',
    backgroundColor: P.certCardBgAlt,
    borderRadius: 10,
    padding: 10,
  },
  soilTileLabel: {
    fontSize: 11,
    color: P.slate500,
    marginBottom: 2,
  },
  soilTileValue: {
    fontSize: 15,
    fontWeight: '700',
    color: P.slate800,
    marginBottom: 4,
  },
  soilBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  soilBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  soilAdvisoryBox: {
    backgroundColor: P.red50,
    borderColor: P.red100,
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  soilAdvisoryText: {
    fontSize: 11,
    color: P.red800,
    flex: 1,
    lineHeight: 16,
  },

  // --- MENU / ACTION LIST ---
  menuItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 6,
  },
  menuIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  menuTitleBox: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: P.slate800,
  },
  menuSubtitle: {
    fontSize: 11,
    color: P.slate400,
    marginTop: 1,
  },
  menuRedBadge: {
    backgroundColor: P.twRed500,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  menuRedBadgeText: {
    color: colors.white,
    fontSize: 10,
    fontWeight: '800',
  },
  menuDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: P.slate100,
    marginLeft: 54,
  },

  // --- MODALS ---
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: P.slate100,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: P.slate800,
  },
  modalCloseText: {
    padding: 4,
  },
  modalBody: {
    marginVertical: 14,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: P.slate600,
    marginBottom: 6,
    marginTop: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: P.slate300,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 14,
    color: P.slate800,
    backgroundColor: P.slate50,
    marginBottom: 6,
  },
  chipsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  choiceChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: P.slate300,
    backgroundColor: colors.white,
  },
  choiceChipActive: {
    backgroundColor: P.deepGreen,
    borderColor: P.deepGreen,
  },
  choiceChipText: {
    fontSize: 13,
    color: P.slate600,
    fontWeight: '500',
  },
  choiceChipTextActive: {
    color: colors.white,
    fontWeight: '700',
  },
  lockedSection: {
    backgroundColor: P.slate50,
    borderRadius: 10,
    padding: 12,
    marginTop: 10,
    borderWidth: 1,
    borderColor: P.slate200,
  },
  lockedSectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: P.slate800,
    marginBottom: 4,
  },
  lockedSectionSubtitle: {
    fontSize: 11,
    color: P.slate500,
    lineHeight: 16,
  },
  modalFooter: {
    flexDirection: 'row',
    gap: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: P.slate100,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: P.slate300,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: P.slate500,
  },
  saveBtn: {
    flex: 1,
    backgroundColor: P.deepGreen,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.white,
  },

  // Document modal items
  docItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: P.slate200,
    backgroundColor: colors.white,
    marginBottom: 10,
    gap: 12,
  },
  docTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: P.slate800,
  },
  docStatusGreen: {
    fontSize: 11,
    color: colors.brandGreen,
    fontWeight: '600',
    marginTop: 2,
  },
  docActionText: {
    fontSize: 12,
    fontWeight: '600',
    color: P.sky600,
  },
  docUploadBtn: {
    backgroundColor: P.orange900,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  docUploadBtnText: {
    color: colors.white,
    fontSize: 11,
    fontWeight: '700',
  },

  // Bank preview card
  bankCardPreview: {
    backgroundColor: P.successDark,
    borderRadius: 14,
    padding: 16,
    shadowColor: P.black,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 4,
  },
  bankName: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '700',
  },
  bankBranch: {
    color: P.green100,
    fontSize: 11,
    marginTop: 2,
  },
  bankAccountNum: {
    color: colors.white,
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 2,
    marginVertical: 16,
  },
  bankFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  bankIfsc: {
    color: P.green100,
    fontSize: 11,
  },
  bankHolder: {
    color: colors.white,
    fontSize: 13,
    fontWeight: '700',
  },
});
