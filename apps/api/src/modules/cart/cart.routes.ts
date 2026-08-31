import { Router } from 'express';
import { requireActor, requireAuth } from '../../auth/requireAuth.js';
import { asyncHandler } from '../../http/asyncHandler.js';
import { getValidated, validate } from '../../http/validate.js';
import { requirePermission } from '../../rbac/requirePermission.js';
import {
  cartItemCreateSchema,
  cartReplaceSchema,
} from './cart.schema.js';
import { cartService } from './cart.service.js';

export const cartRouter: Router = Router();

cartRouter.get(
  '/',
  requireAuth,
  requirePermission('cart.view_own'),
  asyncHandler(async (req, res) => {
    const actor = requireActor(req.actor);
    const cart = await cartService.getCart(actor, req.scope!);
    res.status(200).json(cart);
  }),
);

cartRouter.put(
  '/',
  requireAuth,
  requirePermission('cart.manage_own'),
  validate({ body: cartReplaceSchema }),
  asyncHandler(async (req, res) => {
    const actor = requireActor(req.actor);
    const body = getValidated(req, 'body', cartReplaceSchema);
    const cart = await cartService.replaceCart(actor, req.scope!, body);
    res.status(200).json(cart);
  }),
);

cartRouter.delete(
  '/',
  requireAuth,
  requirePermission('cart.manage_own'),
  asyncHandler(async (req, res) => {
    const actor = requireActor(req.actor);
    await cartService.clearCart(actor, req.scope!);
    res.status(204).end();
  }),
);

cartRouter.post(
  '/items',
  requireAuth,
  requirePermission('cart.manage_own'),
  validate({ body: cartItemCreateSchema }),
  asyncHandler(async (req, res) => {
    const actor = requireActor(req.actor);
    const body = getValidated(req, 'body', cartItemCreateSchema);
    const cart = await cartService.addItem(actor, req.scope!, body);
    res.status(201).json(cart);
  }),
);
