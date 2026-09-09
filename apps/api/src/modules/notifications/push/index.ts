import { config } from '../../../config.js';
import { fcmPushTransport } from './fcm.push.js';
import { mockPushTransport } from './mock.push.js';
import type { PushTransport } from './push.transport.js';

export * from './deepLinks.js';
export * from './push.transport.js';
export * from './mock.push.js';
export * from './fcm.push.js';

export function getPushTransport(): PushTransport {
  if (config.FCM_SERVER_KEY && config.FCM_SERVER_KEY.trim().length > 0) {
    return fcmPushTransport;
  }
  return mockPushTransport;
}

export const pushTransport = getPushTransport();
