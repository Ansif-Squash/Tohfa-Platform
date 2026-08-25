import { z } from 'zod';

const mobileRegex = /^\+[1-9][0-9]{7,14}$/;
const otpCodeRegex = /^[0-9]{6}$/;

export const registerCustomerBody = z.object({
  mobile: z.string().regex(mobileRegex, { message: 'Must be a valid E.164 mobile number (+91...)' }),
  fullName: z.string().trim().min(2).max(120),
  email: z.string().email().optional(),
  password: z.string().min(10).max(128),
  preferredLocale: z.enum(['en', 'ta']).default('en'),
  preferredWarehouseId: z.string().uuid().optional(),
});
export type RegisterCustomerBody = z.infer<typeof registerCustomerBody>;

export const sendOtpBody = z.object({
  mobile: z.string().regex(mobileRegex, { message: 'Must be a valid E.164 mobile number (+91...)' }),
  purpose: z.enum(['REGISTRATION', 'LOGIN', 'PASSWORD_RESET', 'MOBILE_CHANGE', 'DELIVERY', 'PICKUP']),
});
export type SendOtpBody = z.infer<typeof sendOtpBody>;

export const verifyOtpBody = z.object({
  challengeId: z.string().uuid(),
  code: z.string().regex(otpCodeRegex, { message: 'Code must be 6 digits' }),
});
export type VerifyOtpBody = z.infer<typeof verifyOtpBody>;

export const loginBody = z.object({
  mobile: z.string().regex(mobileRegex, { message: 'Must be a valid E.164 mobile number (+91...)' }),
  password: z.string().min(1),
  deviceId: z.string().optional(),
  platform: z.enum(['ios', 'android', 'web']).optional(),
  roleCode: z.string().optional(),
});
export type LoginBody = z.infer<typeof loginBody>;

export const refreshTokenBody = z.object({
  refreshToken: z.string().min(1),
});
export type RefreshTokenBody = z.infer<typeof refreshTokenBody>;

export const forgotPasswordBody = z.object({
  mobile: z.string().regex(mobileRegex, { message: 'Must be a valid E.164 mobile number (+91...)' }),
});
export type ForgotPasswordBody = z.infer<typeof forgotPasswordBody>;

export const resetPasswordBody = z.object({
  challengeId: z.string().uuid(),
  code: z.string().regex(otpCodeRegex, { message: 'Code must be 6 digits' }),
  newPassword: z.string().min(10).max(128),
});
export type ResetPasswordBody = z.infer<typeof resetPasswordBody>;

export const terminateSessionParams = z.object({
  id: z.string().uuid(),
});
export type TerminateSessionParams = z.infer<typeof terminateSessionParams>;
