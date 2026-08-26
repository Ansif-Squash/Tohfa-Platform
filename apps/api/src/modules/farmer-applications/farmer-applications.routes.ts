import { Router } from 'express';
import { optionalAuth, requireActor, requireAuth } from '../../auth/requireAuth.js';
import { asyncHandler } from '../../http/asyncHandler.js';
import { getValidated, validate } from '../../http/validate.js';
import { requirePermission } from '../../rbac/requirePermission.js';
import {
  approveApplicationBody,
  createFarmerApplicationBody,
  farmerApplicationIdParams,
  listAdminApplicationsQuery,
  rejectApplicationBody,
  requestInfoApplicationBody,
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

// Admin farmer applications router (mounted at /v1/admin/farmer-applications)
export const adminFarmerApplicationsRouter: Router = Router();

adminFarmerApplicationsRouter.get(
  '/',
  requireAuth,
  requirePermission('farmer.application.list_pending'),
  validate({ query: listAdminApplicationsQuery }),
  asyncHandler(async (req, res) => {
    const actor = requireActor(req.actor);
    const query = getValidated(req, 'query', listAdminApplicationsQuery);
    const result = await farmerApplicationsService.listAdminApplications(actor, query);
    res.json(result);
  }),
);

adminFarmerApplicationsRouter.get(
  '/:id',
  requireAuth,
  requirePermission('farmer.application.view'),
  validate({ params: farmerApplicationIdParams }),
  asyncHandler(async (req, res) => {
    const actor = requireActor(req.actor);
    const { id } = getValidated(req, 'params', farmerApplicationIdParams);
    const result = await farmerApplicationsService.getAdminApplication(actor, id);
    res.json(result);
  }),
);

adminFarmerApplicationsRouter.post(
  '/:id/approve',
  requireAuth,
  requirePermission('farmer.application.approve'),
  validate({ params: farmerApplicationIdParams, body: approveApplicationBody }),
  asyncHandler(async (req, res) => {
    const actor = requireActor(req.actor);
    const { id } = getValidated(req, 'params', farmerApplicationIdParams);
    const body = getValidated(req, 'body', approveApplicationBody);
    const result = await farmerApplicationsService.approveApplication(actor, id, body);
    res.json(result);
  }),
);

adminFarmerApplicationsRouter.post(
  '/:id/reject',
  requireAuth,
  requirePermission('farmer.application.reject'),
  validate({ params: farmerApplicationIdParams, body: rejectApplicationBody }),
  asyncHandler(async (req, res) => {
    const actor = requireActor(req.actor);
    const { id } = getValidated(req, 'params', farmerApplicationIdParams);
    const body = getValidated(req, 'body', rejectApplicationBody);
    const result = await farmerApplicationsService.rejectApplication(actor, id, body);
    res.json(result);
  }),
);

adminFarmerApplicationsRouter.post(
  '/:id/request-info',
  requireAuth,
  requirePermission('farmer.application.request_info'),
  validate({ params: farmerApplicationIdParams, body: requestInfoApplicationBody }),
  asyncHandler(async (req, res) => {
    const actor = requireActor(req.actor);
    const { id } = getValidated(req, 'params', farmerApplicationIdParams);
    const body = getValidated(req, 'body', requestInfoApplicationBody);
    const result = await farmerApplicationsService.requestInfoApplication(actor, id, body);
    res.json(result);
  }),
);
