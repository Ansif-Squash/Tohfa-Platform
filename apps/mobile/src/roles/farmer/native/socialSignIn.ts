/**
 * Thin wrappers around the native Google / Facebook SDKs.
 *
 * Kept out of `api/auth.ts` on purpose: that file is a pure HTTP client
 * (request/response shapes only), while this file talks to native modules
 * and has real side effects (a native sign-in sheet, a stored FB access
 * token). `LoginScreen.tsx` composes the two: get a provider token here,
 * then hand it to `loginWithOAuth()`.
 *
 * PLACEHOLDER CREDENTIALS: `GOOGLE_WEB_CLIENT_ID` below, plus the Facebook
 * App ID / client token in `android/app/src/main/res/values/strings.xml` and
 * `ios/TohfaMobile/Info.plist`, are obviously-fake values. Neither provider
 * can complete a real sign-in until a human replaces them with TOHFA's real
 * credentials from the Google Cloud Console and Facebook Developer Console.
 * That is a known follow-up, not a bug in this change.
 */
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import { AccessToken, LoginManager } from 'react-native-fbsdk-next';

export type SocialProvider = 'GOOGLE' | 'FACEBOOK';

/** The user closed the native sign-in sheet without completing it. Not an error. */
export class SocialSignInCancelledError extends Error {
  constructor(readonly provider: SocialProvider) {
    super(`${provider} sign-in was cancelled.`);
    this.name = 'SocialSignInCancelledError';
  }
}

/** The native SDK failed for a reason other than user cancellation. */
export class SocialSignInError extends Error {
  constructor(readonly provider: SocialProvider, cause: unknown) {
    super(`${provider} sign-in failed.`);
    this.name = 'SocialSignInError';
    Object.defineProperty(this, 'cause', { value: cause, enumerable: false });
  }
}

// PLACEHOLDER — the Google Cloud Console *Web* application's OAuth client ID
// (not the Android/iOS client ID). Required so the ID token GoogleSignin
// returns carries an audience the API's Google token verifier (BR-39) can
// check. See docs/rules.md BR-39 and apps/api/src/modules/auth/oauth.providers.ts.
const GOOGLE_WEB_CLIENT_ID = 'YOUR_GOOGLE_WEB_CLIENT_ID.apps.googleusercontent.com';

let googleConfigured = false;

function ensureGoogleConfigured(): void {
  if (googleConfigured) return;
  GoogleSignin.configure({ webClientId: GOOGLE_WEB_CLIENT_ID });
  googleConfigured = true;
}

/**
 * Runs the native Google sign-in sheet and returns the Google ID token to
 * send to `POST /auth/oauth/google` (BR-39). Throws
 * `SocialSignInCancelledError` if the farmer dismisses the sheet.
 */
export async function signInWithGoogle(): Promise<string> {
  ensureGoogleConfigured();
  try {
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    const result = await GoogleSignin.signIn();
    if (result.type !== 'success') {
      throw new SocialSignInCancelledError('GOOGLE');
    }
    if (!result.data.idToken) {
      throw new SocialSignInError('GOOGLE', new Error('GoogleSignin returned no idToken'));
    }
    return result.data.idToken;
  } catch (error) {
    if (error instanceof SocialSignInCancelledError || error instanceof SocialSignInError) {
      throw error;
    }
    const code = (error as { code?: string } | null)?.code;
    if (code === statusCodes.SIGN_IN_CANCELLED) {
      throw new SocialSignInCancelledError('GOOGLE');
    }
    throw new SocialSignInError('GOOGLE', error);
  }
}

/**
 * Runs the native Facebook login flow and returns the Facebook access token
 * to send to `POST /auth/oauth/facebook` (BR-39). Throws
 * `SocialSignInCancelledError` if the farmer dismisses the flow.
 */
export async function signInWithFacebook(): Promise<string> {
  try {
    const result = await LoginManager.logInWithPermissions(['public_profile', 'email']);
    if (result.isCancelled) {
      throw new SocialSignInCancelledError('FACEBOOK');
    }
    const token = await AccessToken.getCurrentAccessToken();
    if (!token) {
      throw new SocialSignInError('FACEBOOK', new Error('No AccessToken after Facebook login'));
    }
    return token.accessToken;
  } catch (error) {
    if (error instanceof SocialSignInCancelledError || error instanceof SocialSignInError) {
      throw error;
    }
    throw new SocialSignInError('FACEBOOK', error);
  }
}
