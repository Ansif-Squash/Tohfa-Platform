import { logger } from '../../../logger.js';
import type { SendSmsParams, SmsSendResult, SmsTransport } from './sms.transport.js';

export function maskMobile(mobile: string): string {
  if (mobile.length <= 4) return '****';
  return `${mobile.slice(0, 4)}****${mobile.slice(-2)}`;
}

export class MockSmsTransport implements SmsTransport {
  readonly provider = 'mock' as const;
  public sentMessages: Array<SendSmsParams & { id: string; timestamp: Date }> = [];
  public shouldFail = false;
  public failureError = 'Mock SMS provider simulated network failure';

  async sendSms(params: SendSmsParams): Promise<SmsSendResult> {
    if (this.shouldFail) {
      logger.warn(
        { to: maskMobile(params.to), error: this.failureError },
        'Mock SMS dispatch simulated failure',
      );
      return {
        providerMessageId: `mock-fail-${Date.now()}`,
        status: 'FAILED',
        error: this.failureError,
      };
    }

    const providerMessageId = `mock-sms-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    this.sentMessages.push({
      ...params,
      id: providerMessageId,
      timestamp: new Date(),
    });

    logger.info(
      {
        to: maskMobile(params.to),
        providerMessageId,
        messageLength: params.message.length,
      },
      'Mock SMS dispatched successfully',
    );

    return {
      providerMessageId,
      status: 'DELIVERED',
    };
  }

  clear(): void {
    this.sentMessages = [];
    this.shouldFail = false;
  }
}

export const mockSmsTransport = new MockSmsTransport();
