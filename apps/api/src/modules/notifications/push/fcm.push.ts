import { config } from '../../../config.js';
import { logger } from '../../../logger.js';
import type { PushSendResult, PushTransport, SendPushParams } from './push.transport.js';

export class FcmPushTransport implements PushTransport {
  readonly provider = 'fcm' as const;

  async sendPush(params: SendPushParams): Promise<PushSendResult> {
    const serverKey = config.FCM_SERVER_KEY;
    if (!serverKey) {
      logger.error('FCM_SERVER_KEY is not configured');
      return {
        providerMessageId: `fcm-err-${Date.now()}`,
        status: 'FAILED',
        error: 'FCM_SERVER_KEY is missing from configuration.',
      };
    }

    try {
      const payload = {
        to: params.token,
        notification: {
          title: params.title,
          body: params.body,
        },
        data: {
          ...(params.data ?? {}),
          ...(params.deepLink
            ? {
                app: params.deepLink.app,
                screen: params.deepLink.screen,
                url: params.deepLink.url,
              }
            : {}),
        },
      };

      const response = await fetch('https://fcm.googleapis.com/fcm/send', {
        method: 'POST',
        headers: {
          Authorization: `key=${serverKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const body = (await response.json().catch(() => ({}))) as Record<string, unknown>;

      if (!response.ok) {
        const errorMsg = String(body['error'] ?? response.statusText);
        logger.warn(
          { tokenPrefix: params.token.slice(0, 8), status: response.status, error: errorMsg },
          'FCM send rejected by provider',
        );
        return {
          providerMessageId: `fcm-err-${Date.now()}`,
          status: 'FAILED',
          error: `FCM HTTP ${response.status}: ${errorMsg}`,
        };
      }

      const results = (body['results'] as Array<Record<string, unknown>>) ?? [];
      const firstResult = results[0];
      if (firstResult && firstResult['error']) {
        const err = String(firstResult['error']);
        const isUnregistered = err === 'NotRegistered' || err === 'InvalidRegistration';
        logger.warn({ tokenPrefix: params.token.slice(0, 8), error: err }, 'FCM token error');
        return {
          providerMessageId: `fcm-${Date.now()}`,
          status: 'FAILED',
          error: err,
          unregistered: isUnregistered,
        };
      }

      const messageId = String(firstResult?.['message_id'] ?? body['multicast_id'] ?? `fcm-${Date.now()}`);
      logger.info(
        { tokenPrefix: params.token.slice(0, 8), providerMessageId: messageId },
        'FCM push notification sent successfully',
      );

      return {
        providerMessageId: messageId,
        status: 'SENT',
      };
    } catch (err: unknown) {
      const error = (err as Error).message;
      logger.error({ tokenPrefix: params.token.slice(0, 8), err }, 'FCM push dispatch network failure');
      return {
        providerMessageId: `fcm-err-${Date.now()}`,
        status: 'FAILED',
        error,
      };
    }
  }
}

export const fcmPushTransport = new FcmPushTransport();
