import type { DeepLinkMapping } from './deepLinks.js';

export interface SendPushParams {
  token: string;
  title: string;
  body: string;
  deepLink?: DeepLinkMapping | undefined;
  data?: Record<string, unknown> | undefined;
}

export interface PushSendResult {
  providerMessageId: string;
  status: 'SENT' | 'DELIVERED' | 'FAILED';
  error?: string | undefined;
  unregistered?: boolean | undefined;
}

export interface PushTransport {
  readonly provider: 'mock' | 'fcm';
  sendPush(params: SendPushParams): Promise<PushSendResult>;
}
