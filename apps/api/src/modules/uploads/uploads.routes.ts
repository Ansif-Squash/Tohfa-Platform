import { Router } from 'express';
import { requireActor, requireAuth } from '../../auth/requireAuth.js';
import { asyncHandler } from '../../http/asyncHandler.js';
import { getValidated, validate } from '../../http/validate.js';
import { requirePermission } from '../../rbac/requirePermission.js';
import { signUploadBody } from './uploads.schema.js';
import { uploadsService } from './uploads.service.js';

export const uploadsRouter: Router = Router();

uploadsRouter.post(
  '/sign',
  requireAuth,
  requirePermission('upload.signed_url.create'),
  validate({ body: signUploadBody }),
  asyncHandler(async (req, res) => {
    const actor = requireActor(req.actor);
    const body = getValidated(req, 'body', signUploadBody);
    const result = await uploadsService.signUpload(actor, body);
    res.status(201).json(result);
  }),
);
