# Mobile Application Store Release Checklist & Distribution Record

**Story Reference:** S-52  
**Target Tracks:** Google Play Internal Testing & Apple TestFlight  
**Status:** Ready for Internal Track Distribution  

---

## 1. Release Identification & Build Numbers

| Application | Platform | Package / Bundle ID | Version Name | Build Number (VersionCode) | Release Target |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **TOHFA Farmer** | Android | `in.tohfa.farmer` | `1.0.0` | `1001` | Google Play Internal Testing |
| **TOHFA Farmer** | iOS | `in.tohfa.farmer` | `1.0.0` | `1001` | Apple TestFlight (Internal Group) |
| **TOHFA Customer** | Android | `in.tohfa.customer` | `1.0.0` | `2001` | Google Play Internal Testing |
| **TOHFA Customer** | iOS | `in.tohfa.customer` | `1.0.0` | `2001` | Apple TestFlight (Internal Group) |

*Note: Build numbers are deliberately partitioned (`1001` for Farmer, `2001` for Customer) to prevent version collision in shared monitoring surfaces.*

---

## 2. Signing Credentials & Key Storage References

> **Security Rule:** No keystore files, private `.p12` certificates, provisioning profiles, or service-account JSONs may EVER be committed to source control.

| Platform / App | Credential Type | Secure Vault Reference | Local Environment Variable |
| :--- | :--- | :--- | :--- |
| **Farmer Android** | Release Keystore (JKS) | `azure-keyvault://tohfa-prod-vault/secrets/farmer-release-keystore-base64` | `FARMER_ANDROID_KEYSTORE_PATH` |
| **Farmer Android** | Key Alias / Passwords | `azure-keyvault://tohfa-prod-vault/secrets/farmer-keystore-password` | `FARMER_KEYSTORE_PASSWORD`, `FARMER_KEY_PASSWORD` |
| **Customer Android** | Release Keystore (JKS) | `azure-keyvault://tohfa-prod-vault/secrets/customer-release-keystore-base64` | `CUSTOMER_ANDROID_KEYSTORE_PATH` |
| **Customer Android** | Key Alias / Passwords | `azure-keyvault://tohfa-prod-vault/secrets/customer-keystore-password` | `CUSTOMER_KEYSTORE_PASSWORD`, `CUSTOMER_KEY_PASSWORD` |
| **iOS Apps (Both)** | App Store Connect API Key | `azure-keyvault://tohfa-prod-vault/secrets/appstore-connect-api-key-p8` | `APP_STORE_CONNECT_API_KEY_BASE64` |
| **iOS Distribution** | Apple Distribution Cert & Profile | Fastlane Match / Azure Blob Secret Container | `MATCH_PASSWORD`, `FASTLANE_APPLE_APPLICATION_SPECIFIC_PASSWORD` |

---

## 3. Test Tracks & Distribution Groups

### A. Google Play Internal Testing
- **Track Name:** `internal`
- **Farmer Tester Group:** `tohfa-field-farmers@googlegroups.com` (25 pilot farmers across Madurai and Dindigul)
- **Customer Tester Group:** `tohfa-qa-internal@tohfa.in` & `tohfa-early-access@googlegroups.com`
- **Feedback Channel:** In-app feedback form routing to Sentry & Jira Service Management.

### B. Apple TestFlight
- **Internal Testing Group:** `TOHFA Core Engineering & Operations` (Builds available immediately upon automated processing)
- **External Testing Group:** `Tamil Nadu Agricultural Pilot Group` (Requires initial beta review, valid for 90 days)
- **Export Compliance:** Configured with Standard Encryption exemption (`ITSAppUsesNonExemptEncryption = false` for standard HTTPS/TLS operations).

---

## 4. Pre-Submission Verification Commands

Execute the following verification suite prior to tagging release builds:

```bash
# 1. Typecheck and lint
pnpm typecheck
pnpm lint

# 2. Verify all launch documents exist
ls docs/launch/store-listing-farmer.md docs/launch/store-listing-customer.md docs/launch/privacy-policy.md docs/launch/release-checklist.md

# 3. Security Audit: verify zero secrets or keystores staged
git status --porcelain | grep -Ei '\.(keystore|jks|p12|mobileprovision)$|service-account' || echo 'no secrets staged'

# 4. Manifest permissions audit
grep -n 'permission' apps/farmer-mobile/android/app/src/main/AndroidManifest.xml
grep -n 'permission' apps/customer-mobile/android/app/src/main/AndroidManifest.xml
```
