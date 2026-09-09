import { config } from '../../../config.js';
import { logger } from '../../../logger.js';
import { maskMobile } from './mock.sms.js';
import type { SendSmsParams, SmsSendResult, SmsTransport } from './sms.transport.js';

export class TwilioSmsTransport implements SmsTransport {
  readonly provider = 'twilio' as const;

  async sendSms(params: SendSmsParams): Promise<SmsSendResult> {
    const accountSid = config.TWILIO_ACCOUNT_SID;
    const authToken = config.TWILIO_AUTH_TOKEN;
    const fromNumber = config.TWILIO_FROM_NUMBER;

    if (!accountSid || !authToken || !fromNumber) {
      logger.error('Twilio credentials or FROM number missing from configuration');
      return {
        providerMessageId: `twilio-err-${Date.now()}`,
        status: 'FAILED',
        error: 'Twilio configuration (TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM_NUMBER) is incomplete.',
      };
    }

    try {
      const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
      const authHeader = `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString('base64')}`;

      const formData = new URLSearchParams();
      formData.append('To', params.to);
      formData.append('From', fromNumber);
      formData.append('Body', params.message);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: authHeader,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString(),
      });

      const body = (await response.json().catch(() => ({}))) as Record<string, unknown>;

      if (!response.ok) {
        const errorMsg = String(body['message'] ?? response.statusText);
        logger.warn(
          { to: maskMobile(params.to), status: response.status, error: errorMsg },
          'Twilio SMS send rejected by provider',
        );
        return {
          providerMessageId: `twilio-err-${Date.now()}`,
          status: 'FAILED',
          error: `Twilio HTTP ${response.status}: ${errorMsg}`,
        };
      }

      const sid = String(body['sid'] ?? `twilio-${Date.now()}`);
      logger.info(
        { to: maskMobile(params.to), providerMessageId: sid },
        'Twilio SMS sent successfully',
      );

      return {
        providerMessageId: sid,
        status: 'SENT',
      };
    } catch (err: unknown) {
      const error = (err as Error).message;
      logger.error({ to: maskMobile(params.to), err }, 'Twilio SMS dispatch network failure');
      return {
        providerMessageId: `twilio-err-${Date.now()}`,
        status: 'FAILED',
        error,
      };
    }
  }
}

export const twilioSmsTransport = new TwilioSmsTransport();
