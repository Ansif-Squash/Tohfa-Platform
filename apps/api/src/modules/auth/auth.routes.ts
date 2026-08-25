import { Router } from 'express';
import { requireActor, requireAuth } from '../../auth/requireAuth.js';
import { asyncHandler } from '../../http/asyncHandler.js';
import { getValidated, validate } from '../../http/validate.js';
import { requirePermission } from '../../rbac/requirePermission.js';
import {
  forgotPasswordBody,
  loginBody,
  refreshTokenBody,
  registerCustomerBody,
  resetPasswordBody,
  sendOtpBody,
  terminateSessionParams,
  verifyOtpBody,
} from './auth.schema.js';
import { authService } from './auth.service.js';

export const authRouter: Router = Router();

authRouter.post(
  '/register/customer',
  validate({ body: registerCustomerBody }),
  asyncHandler(async (req, res) => {
    const body = getValidated(req, 'body', registerCustomerBody);
    const result = await authService.registerCustomer(body);
    res.status(201).json(result);
  }),
);

authRouter.post(
  '/otp/send',
  validate({ body: sendOtpBody }),
  asyncHandler(async (req, res) => {
    const body = getValidated(req, 'body', sendOtpBody);
    const result = await authService.sendOtp(body);
    res.status(202).json(result);
  }),
);

authRouter.post(
  '/otp/verify',
  validate({ body: verifyOtpBody }),
  asyncHandler(async (req, res) => {
    const body = getValidated(req, 'body', verifyOtpBody);
    const result = await authService.verifyOtp(body, req.ip, req.headers['user-agent']);
    res.json(result);
  }),
);

authRouter.post(
  '/login',
  validate({ body: loginBody }),
  asyncHandler(async (req, res) => {
    const body = getValidated(req, 'body', loginBody);
    const result = await authService.login(body, req.ip, req.headers['user-agent']);
    res.json(result);
  }),
);

authRouter.post(
  '/refresh',
  validate({ body: refreshTokenBody }),
  asyncHandler(async (req, res) => {
    const body = getValidated(req, 'body', refreshTokenBody);
    const result = await authService.refreshToken(body.refreshToken);
    res.json(result);
  }),
);

authRouter.post(
  '/logout',
  requireAuth,
  requirePermission('auth.session.revoke_own'),
  asyncHandler(async (req, res) => {
    const actor = requireActor(req.actor);
    await authService.logout(actor);
    res.status(204).send();
  }),
);

authRouter.post(
  '/forgot-password',
  validate({ body: forgotPasswordBody }),
  asyncHandler(async (req, res) => {
    const body = getValidated(req, 'body', forgotPasswordBody);
    const result = await authService.forgotPassword(body);
    res.status(202).json(result);
  }),
);

authRouter.post(
  '/reset-password',
  validate({ body: resetPasswordBody }),
  asyncHandler(async (req, res) => {
    const body = getValidated(req, 'body', resetPasswordBody);
    await authService.resetPassword(body);
    res.status(204).send();
  }),
);

authRouter.post(
  '/sessions/:id/terminate',
  requireAuth,
  requirePermission('auth.session.terminate_other'),
  validate({ params: terminateSessionParams }),
  asyncHandler(async (req, res) => {
    const actor = requireActor(req.actor);
    const { id } = getValidated(req, 'params', terminateSessionParams);
    await authService.terminateSession(actor, id);
    res.status(204).send();
  }),
);

authRouter.get(
  '/me',
  requireAuth,
  requirePermission('auth.principal.view_own'),
  asyncHandler(async (req, res) => {
    const actor = requireActor(req.actor);
    const result = await authService.getMe(actor);
    res.json(result);
  }),
);
