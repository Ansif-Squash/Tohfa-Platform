import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Image,
  Modal,
  Pressable,
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
import {
  getMyFarmerProfile,
  maskAadhaar,
  maskMobile,
  updateMyFarmerProfile,
  type FarmerProfile,
} from '../../api/farmer';
import { LOCALES, setLocale, t, type Locale } from '../../i18n';

interface ProfileScreenProps {
  onNavigateToHome?: () => void;
  onNavigateToCertifications?: () => void;
  onNavigateToMarket?: () => void;
  onNavigateToFMBSketch?: () => void;
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
      <StatusBar barStyle="light-content" backgroundColor="#1B5E20" />

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
              <Text style={styles.navBackIcon}>‹</Text>
            </TouchableOpacity>

            <Text style={styles.navTitle}>Profile</Text>

            <View style={styles.navRightActions}>
              <TouchableOpacity
                style={styles.navCircleButton}
                onPress={handleShareProfile}
                accessibilityLabel="Share profile"
                activeOpacity={0.7}
              >
                <Text style={styles.navActionIcon}>↗</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.navCircleButton}
                onPress={() => setIsSettingsModalVisible(true)}
                accessibilityLabel="Settings"
                activeOpacity={0.7}
              >
                <Text style={styles.navActionIcon}>⚙</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Farmer Avatar & Basic Info */}
          <View style={styles.profileHero}>
            <View style={styles.avatarContainer}>
              <Image
                source={require('../../assets/farmer-kumar.jpg')}
                style={styles.avatarImage}
                resizeMode="cover"
              />
              <TouchableOpacity
                style={styles.avatarEditBadge}
                onPress={openPersonalEdit}
                activeOpacity={0.8}
                accessibilityLabel="Edit profile picture"
              >
                <Text style={styles.avatarEditIcon}>✎</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.farmerName}>{personalDetails.fullName}</Text>

            <View style={styles.idBadgePill}>
              <Text style={styles.idBadgeText}>{farmerId}</Text>
            </View>

            <Text style={styles.farmNameText}>{personalDetails.farmName}</Text>
            <Text style={styles.locationText}>📍 {personalDetails.location}</Text>
          </View>

          {/* 4 Quick Stat Cards Overlapping Header */}
          <View style={styles.quickStatsRow}>
            <View style={styles.quickStatCard}>
              <Text style={styles.statEmoji}>🛡️</Text>
              <Text style={[styles.statValue, { color: '#2E7D32' }]}>Valid</Text>
              <Text style={styles.statLabel}>CERT</Text>
            </View>

            <TouchableOpacity
              style={styles.quickStatCard}
              onPress={() => setIsRatingModalVisible(true)}
              activeOpacity={0.8}
            >
              <Text style={styles.statEmoji}>⭐</Text>
              <Text style={[styles.statValue, { color: '#1B5E20' }]}>82</Text>
              <Text style={styles.statLabel}>RATING</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickStatCard}
              onPress={() => setIsAuditsModalVisible(true)}
              activeOpacity={0.8}
            >
              <Text style={styles.statEmoji}>📅</Text>
              <Text style={[styles.statValue, { color: '#E65100' }]}>12d</Text>
              <Text style={styles.statLabel}>AUDIT</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickStatCard}
              onPress={openFarmEdit}
              activeOpacity={0.8}
            >
              <Text style={styles.statEmoji}>🌿</Text>
              <Text style={[styles.statValue, { color: '#1B5E20' }]}>{farmDetails.acres}</Text>
              <Text style={styles.statLabel}>ACRES</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Success Toast */}
        {saveSuccessMsg ? (
          <View style={styles.toastSuccess}>
            <Text style={styles.toastSuccessText}>✓ {saveSuccessMsg}</Text>
          </View>
        ) : null}

        {/* ================= CARD 1: PERSONAL DETAILS ================= */}
        <View style={styles.cardContainer}>
          <View style={styles.cardHeaderRow}>
            <View style={[styles.cardIconBox, { backgroundColor: '#F0EDFF' }]}>
              <Text style={[styles.cardIconEmoji, { color: '#7C5CFC' }]}>👤</Text>
            </View>
            <View style={styles.cardHeaderTitleBox}>
              <Text style={styles.cardTitle}>Personal Details</Text>
              <Text style={styles.cardSubtitle}>Identity & contact info</Text>
            </View>
            <TouchableOpacity onPress={openPersonalEdit} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
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
            <Text style={[styles.detailValue, { color: '#2E7D32' }]}>
              🌿 {personalDetails.farmingType}
            </Text>
          </View>
        </View>

        {/* ================= CARD 2: FARM & FMB ================= */}
        <View style={styles.cardContainer}>
          <View style={styles.cardHeaderRow}>
            <View style={[styles.cardIconBox, { backgroundColor: '#E8F5E9' }]}>
              <Text style={[styles.cardIconEmoji, { color: '#2E7D32' }]}>🛡️</Text>
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
              <Line x1="0" y1="67" x2="320" y2="67" stroke="#E2E8F0" strokeWidth="1" strokeDasharray="4,4" />
              <Line x1="160" y1="0" x2="160" y2="135" stroke="#E2E8F0" strokeWidth="1" strokeDasharray="4,4" />

              {/* FMB Cadastral Boundary Polygon */}
              <Polygon
                points="45,40 270,30 250,110 65,115"
                fill="rgba(165, 214, 167, 0.55)"
                stroke="#2E7D32"
                strokeWidth="2.5"
                strokeLinejoin="round"
              />

              {/* Inner Center Plot Marker */}
              <Circle cx="158" cy="68" r="7" fill="#FB8C00" stroke="#FFFFFF" strokeWidth="2.5" />
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
            <View style={[styles.tagPill, { backgroundColor: '#E8F5E9' }]}>
              <Text style={[styles.tagPillText, { color: '#2E7D32' }]}>🌲 Forest boundary</Text>
            </View>
            <View style={[styles.tagPill, { backgroundColor: '#E8F5E9' }]}>
              <Text style={[styles.tagPillText, { color: '#2E7D32' }]}>⛰️ Upper hill</Text>
            </View>
            <View style={[styles.tagPill, { backgroundColor: '#FFEBEE' }]}>
              <Text style={[styles.tagPillText, { color: '#C62828' }]}>🪶 Wildlife zone</Text>
            </View>
          </View>
        </View>

        {/* ================= CARD 3: CERTIFICATIONS ================= */}
        <View style={styles.cardContainer}>
          <View style={styles.cardHeaderRow}>
            <View style={[styles.cardIconBox, { backgroundColor: '#E3F2FD' }]}>
              <Text style={[styles.cardIconEmoji, { color: '#1976D2' }]}>🏅</Text>
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
            <View style={[styles.certSubCard, { backgroundColor: '#F8FAF6', borderColor: '#E8F0E6' }]}>
              <View style={styles.certCardTop}>
                <Text style={styles.certIconEmoji}>🌱</Text>
                <View style={styles.greenCheckmarkCircle}>
                  <Text style={styles.greenCheckmarkText}>✓</Text>
                </View>
              </View>
              <Text style={styles.certTitle}>PGS Organic</Text>
              <Text style={[styles.certStatusText, { color: '#2E7D32' }]}>Valid</Text>
              <Text style={styles.certRenewText}>Renews in 214 days</Text>
            </View>

            {/* NPOP Card */}
            <View style={[styles.certSubCard, { backgroundColor: '#FFF8F0', borderColor: '#FFE8D6' }]}>
              <View style={styles.certCardTop}>
                <Text style={styles.certIconEmoji}>🏪</Text>
                <View style={styles.orangeExclamationCircle}>
                  <Text style={styles.orangeExclamationText}>!</Text>
                </View>
              </View>
              <Text style={styles.certTitle}>NPOP</Text>
              <Text style={[styles.certStatusText, { color: '#E65100' }]}>Expiring</Text>
              <Text style={styles.certRenewText}>Renews in 24 days</Text>
            </View>
          </View>

          {/* Expiry Warning Notice */}
          <View style={styles.warningNoticeBox}>
            <Text style={styles.warningNoticeIcon}>⚠️</Text>
            <Text style={styles.warningNoticeText}>
              NPOP certificate expires soon. Renew to keep market listings active.
            </Text>
          </View>
        </View>

        {/* ================= CARD 4: AUDITS ================= */}
        <View style={styles.cardContainer}>
          <View style={styles.cardHeaderRow}>
            <View style={[styles.cardIconBox, { backgroundColor: '#E1F5FE' }]}>
              <Text style={[styles.cardIconEmoji, { color: '#0288D1' }]}>📋</Text>
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
              <View style={[styles.statusDot, { backgroundColor: '#2E7D32' }]} />
              <View style={styles.auditItemInfo}>
                <Text style={styles.auditItemDate}>Apr 20, 2026 · External</Text>
                <Text style={styles.auditItemSubtext}>0 major · 1 minor · Passed</Text>
              </View>
              <Text style={[styles.auditScore, { color: '#2E7D32' }]}>88</Text>
            </View>

            <View style={styles.auditItemRow}>
              <View style={[styles.statusDot, { backgroundColor: '#EF6C00' }]} />
              <View style={styles.auditItemInfo}>
                <Text style={styles.auditItemDate}>Jan 18, 2026 · Internal</Text>
                <Text style={styles.auditItemSubtext}>0 major · 3 minor · Passed w/ issues</Text>
              </View>
              <Text style={[styles.auditScore, { color: '#EF6C00' }]}>74</Text>
            </View>

            <View style={[styles.auditItemRow, { borderBottomWidth: 0 }]}>
              <View style={[styles.statusDot, { backgroundColor: '#2E7D32' }]} />
              <View style={styles.auditItemInfo}>
                <Text style={styles.auditItemDate}>Oct 12, 2025 · External</Text>
                <Text style={styles.auditItemSubtext}>0 major · 0 minor · Passed</Text>
              </View>
              <Text style={[styles.auditScore, { color: '#2E7D32' }]}>91</Text>
            </View>
          </View>
        </View>

        {/* ================= CARD 5: FARM RATING ================= */}
        <View style={styles.cardContainer}>
          <View style={styles.cardHeaderRow}>
            <View style={[styles.cardIconBox, { backgroundColor: '#E8F5E9' }]}>
              <Text style={[styles.cardIconEmoji, { color: '#2E7D32' }]}>⭐</Text>
            </View>
            <View style={styles.cardHeaderTitleBox}>
              <Text style={styles.cardTitle}>Farm Rating</Text>
              <Text style={styles.cardSubtitle}>10-category framework</Text>
            </View>
            <TouchableOpacity onPress={() => setIsRatingModalVisible(true)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Text style={styles.cardActionLink}>Details</Text>
            </TouchableOpacity>
          </View>

          {/* Rating Circle and Status */}
          <View style={styles.ratingHeroRow}>
            <View style={styles.ratingGaugeContainer}>
              <Svg width="86" height="86" viewBox="0 0 100 100">
                <Circle cx="50" cy="50" r="40" stroke="#E8F5E9" strokeWidth="8" fill="none" />
                <Circle
                  cx="50"
                  cy="50"
                  r="40"
                  stroke="#2E7D32"
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
              <View style={styles.ratingDeltaPill}>
                <Text style={styles.ratingDeltaText}>▲ +4 this month</Text>
              </View>
            </View>
          </View>

          {/* Rating Category Progress Bars */}
          <View style={styles.ratingBarsList}>
            <View style={styles.barItem}>
              <View style={styles.barHeader}>
                <Text style={styles.barTitle}>Certification & Compliance</Text>
                <Text style={[styles.barScore, { color: '#2E7D32' }]}>9/10</Text>
              </View>
              <View style={styles.barTrack}>
                <View style={[styles.barFill, { width: '90%', backgroundColor: '#2E7D32' }]} />
              </View>
            </View>

            <View style={styles.barItem}>
              <View style={styles.barHeader}>
                <Text style={styles.barTitle}>Environmental Sustainability</Text>
                <Text style={[styles.barScore, { color: '#2E7D32' }]}>9/10</Text>
              </View>
              <View style={styles.barTrack}>
                <View style={[styles.barFill, { width: '90%', backgroundColor: '#2E7D32' }]} />
              </View>
            </View>

            <View style={styles.barItem}>
              <View style={styles.barHeader}>
                <Text style={styles.barTitle}>Farming Practices</Text>
                <Text style={[styles.barScore, { color: '#2E7D32' }]}>8/10</Text>
              </View>
              <View style={styles.barTrack}>
                <View style={[styles.barFill, { width: '80%', backgroundColor: '#388E3C' }]} />
              </View>
            </View>

            <View style={styles.barItem}>
              <View style={styles.barHeader}>
                <Text style={styles.barTitle}>Market & Buyer Relations</Text>
                <Text style={[styles.barScore, { color: '#E65100' }]}>6/10</Text>
              </View>
              <View style={styles.barTrack}>
                <View style={[styles.barFill, { width: '60%', backgroundColor: '#F57C00' }]} />
              </View>
            </View>

            <View style={styles.barItem}>
              <View style={styles.barHeader}>
                <Text style={styles.barTitle}>Innovation & Improvement</Text>
                <Text style={[styles.barScore, { color: '#D32F2F' }]}>5/10</Text>
              </View>
              <View style={styles.barTrack}>
                <View style={[styles.barFill, { width: '50%', backgroundColor: '#E53935' }]} />
              </View>
            </View>
          </View>
        </View>

        {/* ================= CARD 6: SOIL TEST ================= */}
        <View style={styles.cardContainer}>
          <View style={styles.cardHeaderRow}>
            <View style={[styles.cardIconBox, { backgroundColor: '#FFF8E1' }]}>
              <Text style={[styles.cardIconEmoji, { color: '#F57F17' }]}>🧪</Text>
            </View>
            <View style={styles.cardHeaderTitleBox}>
              <Text style={styles.cardTitle}>Soil Test</Text>
              <Text style={styles.cardSubtitle}>Annual analysis</Text>
            </View>
            <TouchableOpacity onPress={() => setIsSoilModalVisible(true)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
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
              <View style={[styles.soilBadge, { backgroundColor: '#E8F5E9' }]}>
                <Text style={[styles.soilBadgeText, { color: '#2E7D32' }]}>Good</Text>
              </View>
            </View>

            <View style={styles.soilGridTile}>
              <Text style={styles.soilTileLabel}>pH Value</Text>
              <Text style={styles.soilTileValue}>5.6</Text>
              <View style={[styles.soilBadge, { backgroundColor: '#FFEBEE' }]}>
                <Text style={[styles.soilBadgeText, { color: '#C62828' }]}>Acidic</Text>
              </View>
            </View>

            <View style={styles.soilGridTile}>
              <Text style={styles.soilTileLabel}>EC (dS/m)</Text>
              <Text style={styles.soilTileValue}>0.42</Text>
              <View style={[styles.soilBadge, { backgroundColor: '#E8F5E9' }]}>
                <Text style={[styles.soilBadgeText, { color: '#2E7D32' }]}>Good</Text>
              </View>
            </View>

            <View style={styles.soilGridTile}>
              <Text style={styles.soilTileLabel}>Water TDS (ppm)</Text>
              <Text style={styles.soilTileValue}>610</Text>
              <View style={[styles.soilBadge, { backgroundColor: '#FFF3E0' }]}>
                <Text style={[styles.soilBadgeText, { color: '#E65100' }]}>High</Text>
              </View>
            </View>
          </View>

          {/* Soil Advisory Recommendation */}
          <View style={styles.soilAdvisoryBox}>
            <Text style={styles.soilAdvisoryIcon}>⚠️</Text>
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
            <View style={[styles.menuIconBox, { backgroundColor: '#F0EDFF' }]}>
              <Text style={[styles.menuIconEmoji, { color: '#7C5CFC' }]}>📄</Text>
            </View>
            <View style={styles.menuTitleBox}>
              <Text style={styles.menuTitle}>My Documents</Text>
              <Text style={styles.menuSubtitle}>ID proof, farm docs, certificates</Text>
            </View>
            <View style={styles.menuRedBadge}>
              <Text style={styles.menuRedBadgeText}>1</Text>
            </View>
            <Text style={styles.menuChevron}>›</Text>
          </TouchableOpacity>

          <View style={styles.menuDivider} />

          <TouchableOpacity
            style={styles.menuItemRow}
            onPress={() => setIsBankModalVisible(true)}
            activeOpacity={0.7}
          >
            <View style={[styles.menuIconBox, { backgroundColor: '#E8F5E9' }]}>
              <Text style={[styles.menuIconEmoji, { color: '#2E7D32' }]}>💳</Text>
            </View>
            <View style={styles.menuTitleBox}>
              <Text style={styles.menuTitle}>Bank & Payment</Text>
              <Text style={styles.menuSubtitle}>Bank account · UPI ID · payout history</Text>
            </View>
            <Text style={styles.menuChevron}>›</Text>
          </TouchableOpacity>

          <View style={styles.menuDivider} />

          <TouchableOpacity
            style={styles.menuItemRow}
            onPress={() => setIsSettingsModalVisible(true)}
            activeOpacity={0.7}
          >
            <View style={[styles.menuIconBox, { backgroundColor: '#E0F2FE' }]}>
              <Text style={[styles.menuIconEmoji, { color: '#0284C7' }]}>⚙️</Text>
            </View>
            <View style={styles.menuTitleBox}>
              <Text style={styles.menuTitle}>Settings</Text>
              <Text style={styles.menuSubtitle}>Language, notifications, privacy</Text>
            </View>
            <Text style={styles.menuChevron}>›</Text>
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
            <View style={[styles.menuIconBox, { backgroundColor: '#FFF7ED' }]}>
              <Text style={[styles.menuIconEmoji, { color: '#EA580C' }]}>❓</Text>
            </View>
            <View style={styles.menuTitleBox}>
              <Text style={styles.menuTitle}>Help & Support</Text>
              <Text style={styles.menuSubtitle}>FAQs, contact TOHFA, feedback</Text>
            </View>
            <Text style={styles.menuChevron}>›</Text>
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
                <Text style={styles.modalCloseText}>✕</Text>
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
                <Text style={styles.lockedSectionTitle}>🔒 Verified KYC Details (Protected)</Text>
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
                <Text style={styles.modalCloseText}>✕</Text>
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
                <Text style={styles.lockedSectionTitle}>📍 Cadastral Survey FMB</Text>
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
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={styles.modalBody}>
              <View style={styles.docItemCard}>
                <Text style={styles.docEmoji}>🪪</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.docTitle}>Aadhaar Card</Text>
                  <Text style={styles.docStatusGreen}>✓ Verified</Text>
                </View>
                <Text style={styles.docActionText}>View</Text>
              </View>

              <View style={styles.docItemCard}>
                <Text style={styles.docEmoji}>📜</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.docTitle}>Land Patta / FMB Map</Text>
                  <Text style={styles.docStatusGreen}>✓ Verified</Text>
                </View>
                <Text style={styles.docActionText}>View</Text>
              </View>

              <View style={styles.docItemCard}>
                <Text style={styles.docEmoji}>🏅</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.docTitle}>PGS Scope Certificate</Text>
                  <Text style={styles.docStatusGreen}>✓ Valid</Text>
                </View>
                <Text style={styles.docActionText}>Download</Text>
              </View>

              <View style={[styles.docItemCard, { borderColor: '#FFA726', backgroundColor: '#FFFDF9' }]}>
                <Text style={styles.docEmoji}>💧</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.docTitle}>Annual Soil & Water Health Card</Text>
                  <Text style={[styles.docStatusGreen, { color: '#E65100' }]}>⚠️ Action needed (Expiring)</Text>
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
                <Text style={styles.modalCloseText}>✕</Text>
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
                <Text style={[styles.detailValue, { color: '#2E7D32' }]}>Instant Direct Credit (T+1)</Text>
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
                <Text style={styles.modalCloseText}>✕</Text>
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
                <Text style={[styles.detailValue, { color: '#2E7D32' }]}>Enabled ✓</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>FMB Boundary Geofence Alerts</Text>
                <Text style={[styles.detailValue, { color: '#2E7D32' }]}>Enabled ✓</Text>
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
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={styles.modalBody}>
              <View style={styles.auditItemRow}>
                <View style={[styles.statusDot, { backgroundColor: '#2E7D32' }]} />
                <View style={styles.auditItemInfo}>
                  <Text style={styles.auditItemDate}>Apr 20, 2026 · External Certification</Text>
                  <Text style={styles.auditItemSubtext}>Auditor: Dr. S. Ramanathan · 0 major · 1 minor</Text>
                </View>
                <Text style={[styles.auditScore, { color: '#2E7D32' }]}>88/100</Text>
              </View>

              <View style={styles.auditItemRow}>
                <View style={[styles.statusDot, { backgroundColor: '#EF6C00' }]} />
                <View style={styles.auditItemInfo}>
                  <Text style={styles.auditItemDate}>Jan 18, 2026 · Internal Peer Audit</Text>
                  <Text style={styles.auditItemSubtext}>Auditor: Nilgiris Organic Local Group</Text>
                </View>
                <Text style={[styles.auditScore, { color: '#EF6C00' }]}>74/100</Text>
              </View>

              <View style={styles.auditItemRow}>
                <View style={[styles.statusDot, { backgroundColor: '#2E7D32' }]} />
                <View style={styles.auditItemInfo}>
                  <Text style={styles.auditItemDate}>Oct 12, 2025 · Annual NPOP Audit</Text>
                  <Text style={styles.auditItemSubtext}>Indocert Inspection Agency · 0 findings</Text>
                </View>
                <Text style={[styles.auditScore, { color: '#2E7D32' }]}>91/100</Text>
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.saveBtn, { width: '100%' }]}
                onPress={() => setIsAuditsModalVisible(false)}
              >
                <Text style={styles.saveBtnText}>Close</Text>
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
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={styles.modalBody}>
              <Text style={{ fontSize: 13, color: '#64748B', marginBottom: 14 }}>
                The TOHFA 10-category framework ranks organic purity, land management, and fair marketplace behavior.
              </Text>

              <View style={styles.barItem}>
                <View style={styles.barHeader}>
                  <Text style={styles.barTitle}>Certification & Compliance</Text>
                  <Text style={[styles.barScore, { color: '#2E7D32' }]}>9/10</Text>
                </View>
                <View style={styles.barTrack}>
                  <View style={[styles.barFill, { width: '90%', backgroundColor: '#2E7D32' }]} />
                </View>
              </View>

              <View style={styles.barItem}>
                <View style={styles.barHeader}>
                  <Text style={styles.barTitle}>Environmental Sustainability</Text>
                  <Text style={[styles.barScore, { color: '#2E7D32' }]}>9/10</Text>
                </View>
                <View style={styles.barTrack}>
                  <View style={[styles.barFill, { width: '90%', backgroundColor: '#2E7D32' }]} />
                </View>
              </View>

              <View style={styles.barItem}>
                <View style={styles.barHeader}>
                  <Text style={styles.barTitle}>Farming Practices & Soil Health</Text>
                  <Text style={[styles.barScore, { color: '#2E7D32' }]}>8/10</Text>
                </View>
                <View style={styles.barTrack}>
                  <View style={[styles.barFill, { width: '80%', backgroundColor: '#388E3C' }]} />
                </View>
              </View>

              <View style={styles.barItem}>
                <View style={styles.barHeader}>
                  <Text style={styles.barTitle}>Market & Buyer Relations</Text>
                  <Text style={[styles.barScore, { color: '#E65100' }]}>6/10</Text>
                </View>
                <View style={styles.barTrack}>
                  <View style={[styles.barFill, { width: '60%', backgroundColor: '#F57C00' }]} />
                </View>
              </View>

              <View style={styles.barItem}>
                <View style={styles.barHeader}>
                  <Text style={styles.barTitle}>Innovation & Water Conservation</Text>
                  <Text style={[styles.barScore, { color: '#D32F2F' }]}>5/10</Text>
                </View>
                <View style={styles.barTrack}>
                  <View style={[styles.barFill, { width: '50%', backgroundColor: '#E53935' }]} />
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
                <Text style={styles.modalCloseText}>✕</Text>
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
                  <Text style={{ fontSize: 11, color: '#2E7D32', marginTop: 4 }}>Ideal range: 0.5–0.75%</Text>
                </View>

                <View style={styles.soilGridTile}>
                  <Text style={styles.soilTileLabel}>pH Value</Text>
                  <Text style={styles.soilTileValue}>5.6</Text>
                  <Text style={{ fontSize: 11, color: '#C62828', marginTop: 4 }}>Acidic (Ideal: 6.0–7.5)</Text>
                </View>

                <View style={styles.soilGridTile}>
                  <Text style={styles.soilTileLabel}>EC (dS/m)</Text>
                  <Text style={styles.soilTileValue}>0.42</Text>
                  <Text style={{ fontSize: 11, color: '#2E7D32', marginTop: 4 }}>Normal electrical cond.</Text>
                </View>

                <View style={styles.soilGridTile}>
                  <Text style={styles.soilTileLabel}>Water TDS</Text>
                  <Text style={styles.soilTileValue}>610 ppm</Text>
                  <Text style={{ fontSize: 11, color: '#E65100', marginTop: 4 }}>High mineral hardness</Text>
                </View>
              </View>

              <View style={styles.soilAdvisoryBox}>
                <Text style={styles.soilAdvisoryIcon}>💡</Text>
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
    backgroundColor: '#F3F5F2',
  },
  scrollContainer: {
    paddingBottom: 40,
  },

  // --- HEADER SECTION ---
  headerBanner: {
    backgroundColor: '#1B5E20',
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
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: '300',
    marginTop: -2,
  },
  navTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  navRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  navActionIcon: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
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
    borderColor: '#FFFFFF',
    backgroundColor: '#E2E8F0',
  },
  avatarEditBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    backgroundColor: '#FFFFFF',
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
  },
  avatarEditIcon: {
    fontSize: 14,
    color: '#2E7D32',
    fontWeight: '700',
  },
  farmerName: {
    color: '#FFFFFF',
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
    color: '#D4EED8',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  farmNameText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 3,
  },
  locationText: {
    color: '#C8E6C9',
    fontSize: 12,
    fontWeight: '400',
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
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statEmoji: {
    fontSize: 18,
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
    color: '#94A3B8',
    letterSpacing: 0.5,
  },

  toastSuccess: {
    backgroundColor: '#E8F5E9',
    borderWidth: 1,
    borderColor: '#A5D6A7',
    marginHorizontal: 16,
    marginTop: 12,
    padding: 10,
    borderRadius: 10,
  },
  toastSuccessText: {
    color: '#1B5E20',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },

  // --- CARDS ---
  cardContainer: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 14,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
    borderWidth: 1,
    borderColor: '#F1F5F9',
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
  cardIconEmoji: {
    fontSize: 18,
  },
  cardHeaderTitleBox: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
  },
  cardSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 1,
  },
  cardActionLink: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2E7D32',
  },

  // Details row
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#F1F5F9',
  },
  detailLabel: {
    fontSize: 13,
    color: '#64748B',
  },
  detailValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1E293B',
    textAlign: 'right',
  },

  // --- FMB MAP PREVIEW ---
  fmbMapContainer: {
    height: 135,
    backgroundColor: '#F8FAF6',
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
    marginVertical: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
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
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  fmbMetricsStrip: {
    flexDirection: 'row',
    backgroundColor: '#F8FAF7',
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
    color: '#1E293B',
  },
  fmbMetricLabel: {
    fontSize: 9,
    fontWeight: '600',
    color: '#94A3B8',
    marginTop: 2,
  },
  fmbMetricDivider: {
    width: 1,
    height: 18,
    backgroundColor: '#E2E8F0',
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
  certIconEmoji: {
    fontSize: 22,
  },
  greenCheckmarkCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#2E7D32',
    alignItems: 'center',
    justifyContent: 'center',
  },
  greenCheckmarkText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  orangeExclamationCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#E65100',
    alignItems: 'center',
    justifyContent: 'center',
  },
  orangeExclamationText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  certTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
  },
  certStatusText: {
    fontSize: 12,
    fontWeight: '700',
    marginTop: 2,
  },
  certRenewText: {
    fontSize: 10,
    color: '#94A3B8',
    marginTop: 2,
  },
  warningNoticeBox: {
    backgroundColor: '#FFF8E1',
    borderColor: '#FFE082',
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  warningNoticeIcon: {
    fontSize: 16,
  },
  warningNoticeText: {
    fontSize: 11,
    color: '#B76E00',
    flex: 1,
    lineHeight: 16,
  },

  // --- AUDITS ---
  nextAuditBanner: {
    backgroundColor: '#EBF4FF',
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  auditProgressSquare: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 6,
    alignItems: 'center',
    marginRight: 10,
  },
  auditProgressFraction: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0284C7',
  },
  auditProgressDone: {
    fontSize: 8,
    fontWeight: '700',
    color: '#64748B',
  },
  nextAuditDetails: {
    flex: 1,
  },
  nextAuditSubLabel: {
    fontSize: 10,
    color: '#64748B',
  },
  nextAuditDateText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
    marginTop: 1,
  },
  auditDueRedPill: {
    backgroundColor: '#F4511E',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  auditDueRedText: {
    color: '#FFFFFF',
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
    borderBottomColor: '#F1F5F9',
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
    color: '#1E293B',
  },
  auditItemSubtext: {
    fontSize: 11,
    color: '#94A3B8',
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
    color: '#1E293B',
  },
  ratingGaugeMax: {
    fontSize: 9,
    fontWeight: '600',
    color: '#94A3B8',
  },
  ratingStatusDetails: {
    flex: 1,
  },
  ratingStatusTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1B5E20',
  },
  ratingDeltaPill: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  ratingDeltaText: {
    color: '#2E7D32',
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
    color: '#475569',
  },
  barScore: {
    fontSize: 12,
    fontWeight: '700',
  },
  barTrack: {
    height: 6,
    backgroundColor: '#F1F5F9',
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
    backgroundColor: '#FFF3D6',
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
  },
  soilDateLabel: {
    fontSize: 10,
    color: '#78350F',
  },
  soilDateValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#78350F',
    marginTop: 1,
  },
  soilGridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  soilGridTile: {
    width: '48%',
    backgroundColor: '#F8FAF7',
    borderRadius: 10,
    padding: 10,
  },
  soilTileLabel: {
    fontSize: 11,
    color: '#64748B',
    marginBottom: 2,
  },
  soilTileValue: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E293B',
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
    backgroundColor: '#FFEBEE',
    borderColor: '#FFCDD2',
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  soilAdvisoryIcon: {
    fontSize: 16,
  },
  soilAdvisoryText: {
    fontSize: 11,
    color: '#C62828',
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
  menuIconEmoji: {
    fontSize: 18,
  },
  menuTitleBox: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
  },
  menuSubtitle: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 1,
  },
  menuRedBadge: {
    backgroundColor: '#EF4444',
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  menuRedBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
  menuChevron: {
    fontSize: 18,
    color: '#94A3B8',
    fontWeight: '600',
  },
  menuDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#F1F5F9',
    marginLeft: 54,
  },

  // --- MODALS ---
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
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
    borderBottomColor: '#F1F5F9',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
  },
  modalCloseText: {
    fontSize: 18,
    color: '#94A3B8',
    padding: 4,
  },
  modalBody: {
    marginVertical: 14,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 6,
    marginTop: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 14,
    color: '#1E293B',
    backgroundColor: '#F8FAFC',
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
    borderColor: '#CBD5E1',
    backgroundColor: '#FFFFFF',
  },
  choiceChipActive: {
    backgroundColor: '#1B5E20',
    borderColor: '#1B5E20',
  },
  choiceChipText: {
    fontSize: 13,
    color: '#475569',
    fontWeight: '500',
  },
  choiceChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  lockedSection: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 12,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  lockedSectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 4,
  },
  lockedSectionSubtitle: {
    fontSize: 11,
    color: '#64748B',
    lineHeight: 16,
  },
  modalFooter: {
    flexDirection: 'row',
    gap: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  saveBtn: {
    flex: 1,
    backgroundColor: '#1B5E20',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // Document modal items
  docItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    marginBottom: 10,
    gap: 12,
  },
  docEmoji: {
    fontSize: 24,
  },
  docTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
  },
  docStatusGreen: {
    fontSize: 11,
    color: '#2E7D32',
    fontWeight: '600',
    marginTop: 2,
  },
  docActionText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0284C7',
  },
  docUploadBtn: {
    backgroundColor: '#E65100',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  docUploadBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },

  // Bank preview card
  bankCardPreview: {
    backgroundColor: '#0F5132',
    borderRadius: 14,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 4,
  },
  bankName: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  bankBranch: {
    color: '#C8E6C9',
    fontSize: 11,
    marginTop: 2,
  },
  bankAccountNum: {
    color: '#FFFFFF',
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
    color: '#C8E6C9',
    fontSize: 11,
  },
  bankHolder: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
});
