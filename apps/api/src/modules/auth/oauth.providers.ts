/**
 * Google / Facebook token verification (BR-39).
 *
 * This is the ONLY place that talks to Google or Facebook. It is injected
 * into `auth.service.ts` the same way `repo` is, so `auth.test.ts` can swap
 * in a fake `OAuthProviderClient` and never make a real network call.
 *
 * Google: verify the ID token's signature/audience against our OAuth client
 * id via `google-auth-library`'s `OAuth2Client.verifyIdToken` — this is the
 * one call that actually authenticates the token; nothing here should ever
 * trust a `sub`/`email` pulled out of an unverified JWT payload.
 *
 * Facebook has no server-side verification SDK; the Graph API `/me` call
 * itself IS the verification; a forged or expired access token gets a Graph
 * API error instead of a profile.
 */
import crypto from 'node:crypto';
import { OAuth2Client } from 'google-auth-library';
import { config } from '../../config.js';
import { AppError } from '../../http/problem.js';

/** Whatever of these a provider actually returns — email and photoUrl are usually present, fullName usually is. */
export interface OAuthProfile {
  /** The provider's stable subject identifier: Google's `sub` claim, Facebook's numeric user id. */
  subjectId: string;
  // Explicit `| undefined` (not just `?:`) so this compiles cleanly under
  // `exactOptionalPropertyTypes`: Google/Facebook's own SDK/response types are
  // `string | undefined` for these fields, and that value flows straight
  // through into this return type.
  email?: string | undefined;
  fullName?: string | undefined;
  photoUrl?: string | undefined;
}

export interface OAuthProviderClient {
  verifyGoogleToken(idToken: string): Promise<OAuthProfile>;
  verifyFacebookToken(accessToken: string): Promise<OAuthProfile>;
}

let googleClient: OAuth2Client | null = null;
function getGoogleClient(): OAuth2Client {
  // Constructed lazily (not at module load) so a boot with an empty
  // GOOGLE_OAUTH_CLIENT_ID — expected until real console credentials exist —
  // does not itself throw; the empty-config check below does that instead,
  // scoped to the moment someone actually tries to sign in with Google.
  googleClient ??= new OAuth2Client(config.GOOGLE_OAUTH_CLIENT_ID);
  return googleClient;
}

/** Binds a Facebook Graph API call to OUR app secret (`appsecret_proof`) so a token minted for a different Facebook app cannot be replayed against ours. */
function facebookAppSecretProof(accessToken: string): string {
  return crypto.createHmac('sha256', config.FACEBOOK_APP_SECRET).update(accessToken).digest('hex');
}

interface FacebookMeResponse {
  id?: string;
  name?: string;
  email?: string;
  picture?: { data?: { url?: string } };
  error?: { message?: string; type?: string; code?: number };
}

export const oauthProviderClient: OAuthProviderClient = {
  async verifyGoogleToken(idToken) {
    if (config.GOOGLE_OAUTH_CLIENT_ID === '') {
      throw new AppError('OAUTH_TOKEN_INVALID', {
        detail: 'Google sign-in is not configured on this server.',
      });
    }

    try {
      const ticket = await getGoogleClient().verifyIdToken({
        idToken,
        audience: config.GOOGLE_OAUTH_CLIENT_ID,
      });
      const payload = ticket.getPayload();
      if (payload?.sub === undefined) {
        throw new Error('Google ID token verified but carried no `sub` claim.');
      }

      return {
        subjectId: payload.sub,
        email: payload.email,
        fullName: payload.name,
        photoUrl: payload.picture,
      };
    } catch (error) {
      throw new AppError('OAUTH_TOKEN_INVALID', {
        detail: 'Google rejected or could not verify the ID token.',
        cause: error,
      });
    }
  },

  async verifyFacebookToken(accessToken) {
    if (config.FACEBOOK_APP_ID === '' || config.FACEBOOK_APP_SECRET === '') {
      throw new AppError('OAUTH_TOKEN_INVALID', {
        detail: 'Facebook sign-in is not configured on this server.',
      });
    }

    try {
      const url = new URL('https://graph.facebook.com/me');
      url.searchParams.set('fields', 'id,name,email,picture');
      url.searchParams.set('access_token', accessToken);
      url.searchParams.set('appsecret_proof', facebookAppSecretProof(accessToken));

      const response = await fetch(url);
      const body = (await response.json()) as FacebookMeResponse;

      if (!response.ok || body.id === undefined) {
        throw new Error(body.error?.message ?? `Facebook Graph API returned HTTP ${response.status}`);
      }

      return {
        subjectId: body.id,
        email: body.email,
        fullName: body.name,
        photoUrl: body.picture?.data?.url,
      };
    } catch (error) {
      throw new AppError('OAUTH_TOKEN_INVALID', {
        detail: 'Facebook rejected or could not verify the access token.',
        cause: error,
      });
    }
  },
};
