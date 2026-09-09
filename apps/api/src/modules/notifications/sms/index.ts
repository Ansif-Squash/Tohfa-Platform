import { config } from '../../../config.js';
import { mockSmsTransport } from './mock.sms.js';
import { msg91SmsTransport } from './msg91.sms.js';
import type { SmsTransport } from './sms.transport.js';
import { twilioSmsTransport } from './twilio.sms.js';

export * from './sms.transport.js';
export * from './mock.sms.js';
export * from './msg91.sms.js';
export * from './twilio.sms.js';

export function getSmsTransport(): SmsTransport {
  if (config.SMS_PROVIDER === 'msg91') {
    return msg91SmsTransport;
  }
  if (config.SMS_PROVIDER === 'twilio') {
    return twilioSmsTransport;
  }
  return mockSmsTransport;
}

export const smsTransport = getSmsTransport();
