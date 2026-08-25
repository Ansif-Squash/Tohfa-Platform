import { Router } from 'express';
import { optionalAuth, requireActor, requireAuth } from '../../auth/requireAuth.js';
import { asyncHandler } from '../../http/asyncHandler.js';
import { getValidated, validate } from '../../http/validate.js';
import { requirePermission } from '../../rbac/requirePermission.js';
import {
  createFarmerApplicationBody,
  farmerApplicationIdParams,
  updateFarmerProfileBody,
  updateStepParams,
} from './farmer-applications.schema.js';
import { farmerApplicationsService } from './farmer-applications.service.js';

export const farmerApplicationsRouter: Router = Router();

// Draft creation (public)
farmerApplicationsRouter.post(
  '/applications',
  optionalAuth,
  validate({ body: createFarmerApplicationBody }),
  asyncHandler(async (req, res) => {
    const body = getValidated(req, 'body', createFarmerApplicationBody);
    const result = await farmerApplicationsService.createDraft(body, req.actor);
    res.status(201).json(result);
  }),
);

// Save individual step (1..5)
farmerApplicationsRouter.patch(
  '/applications/:id/steps/:step',
  optionalAuth,
  validate({ params: updateStepParams }),
  asyncHandler(async (req, res) => {
    const { id, step } = getValidated(req, 'params', updateStepParams);
    const result = await farmerApplicationsService.updateStep(req.actor, id, step, req.body);
    res.json(result);
  }),
);

// Submit application for review
farmerApplicationsRouter.post(
  '/applications/:id/submit',
  optionalAuth,
  validate({ params: farmerApplicationIdParams }),
  asyncHandler(async (req, res) => {
    const { id } = getValidated(req, 'params', farmerApplicationIdParams);
    const result = await farmerApplicationsService.submitApplication(req.actor, id);
    res.json(result);
  }),
);

// Status timeline
farmerApplicationsRouter.get(
  '/applications/:id/status',
  optionalAuth,
  validate({ params: farmerApplicationIdParams }),
  asyncHandler(async (req, res) => {
    const { id } = getValidated(req, 'params', farmerApplicationIdParams);
    const result = await farmerApplicationsService.getStatusTimeline(req.actor, id);
    res.json(result);
  }),
);

// Own farmer profile
farmerApplicationsRouter.get(
  '/me',
  requireAuth,
  requirePermission('farmer.profile.view_own'),
  asyncHandler(async (req, res) => {
    const actor = requireActor(req.actor);
    const result = await farmerApplicationsService.getMyProfile(actor);
    res.json(result);
  }),
);

farmerApplicationsRouter.patch(
  '/me',
  requireAuth,
  requirePermission('farmer.profile.edit_own'),
  validate({ body: updateFarmerProfileBody }),
  asyncHandler(async (req, res) => {
    const actor = requireActor(req.actor);
    const body = getValidated(req, 'body', updateFarmerProfileBody);
    const result = await farmerApplicationsService.updateMyProfile(actor, body);
    res.json(result);
  }),
);
