export interface SendSmsParams {
  /** E.164 or national phone number */
  to: string;
  message: string;
  templateId?: string | undefined;
}

export interface SmsSendResult {
  providerMessageId: string;
  status: 'SENT' | 'DELIVERED' | 'FAILED';
  error?: string | undefined;
}

export interface SmsTransport {
  readonly provider: 'mock' | 'msg91' | 'twilio';
  sendSms(params: SendSmsParams): Promise<SmsSendResult>;
}
