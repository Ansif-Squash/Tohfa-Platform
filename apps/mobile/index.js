/**
 * React Native entry point — single app for every role.
 *
 * There is exactly one binary now: farmer, customer and admin screens all
 * ship in it, and which ones a signed-in user sees is decided at runtime by
 * their account's actual role (src/roles/farmer/App.tsx's login flow calls
 * /auth/me and routes accordingly — see resolveRouteAfterAuth in
 * src/roles/farmer/api/auth.ts). This matches how the backend has always
 * worked: one /auth/login endpoint, one JWT shape, role-based permissions
 * via docs/rbac.json — the three-separate-binary split this app used to
 * have was an extra client-side isolation layer, not what the backend or
 * the product designs assumed.
 *
 * farmer/App.tsx is the mounted root because it already owns the real,
 * working Splash → Welcome → Login → OTP → Register flow shared by every
 * role; it hands off to customer/CustomerMainApp.tsx or its own MainTabs
 * once a role is known.
 */
import { AppRegistry } from 'react-native';
import App from './src/roles/farmer/App';

AppRegistry.registerComponent('TohfaMobile', () => App);
