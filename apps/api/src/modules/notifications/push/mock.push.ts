import { logger } from '../../../logger.js';
import type { PushSendResult, PushTransport, SendPushParams } from './push.transport.js';

export class MockPushTransport implements PushTransport {
  readonly provider = 'mock' as const;
  public sentPushes: Array<SendPushParams & { id: string; timestamp: Date }> = [];
  public shouldFail = false;
  public failureError = 'Mock Push provider simulated failure';

  async sendPush(params: SendPushParams): Promise<PushSendResult> {
    if (this.shouldFail) {
      logger.warn(
        { tokenPrefix: params.token.slice(0, 8), error: this.failureError },
        'Mock Push dispatch simulated failure',
      );
      return {
        providerMessageId: `mock-push-fail-${Date.now()}`,
        status: 'FAILED',
        error: this.failureError,
      };
    }

    const providerMessageId = `projects/tohfa-app/messages/mock-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    this.sentPushes.push({
      ...params,
      id: providerMessageId,
      timestamp: new Date(),
    });

    logger.info(
      {
        tokenPrefix: params.token.slice(0, 8),
        providerMessageId,
        title: params.title,
        deepLink: params.deepLink?.url,
      },
      'Mock Push dispatched successfully',
    );

    return {
      providerMessageId,
      status: 'DELIVERED',
    };
  }

  clear(): void {
    this.sentPushes = [];
    this.shouldFail = false;
  }
}

export const mockPushTransport = new MockPushTransport();
