import { Router } from 'express';
import { asyncHandler } from '../../http/asyncHandler.js';
import { getValidated, validate } from '../../http/validate.js';
import {
  getCatalogHomeQuery,
  listProductsQuery,
  productIdParam,
  searchCatalogQuery,
} from './catalog.schema.js';
import { catalogService } from './catalog.service.js';

export const catalogRouter: Router = Router();

/**
 * GET /v1/catalog/home
 * Public/anonymous customer home surface (BR-16).
 */
catalogRouter.get(
  '/home',
  validate({ query: getCatalogHomeQuery }),
  asyncHandler(async (req, res) => {
    const query = getValidated(req, 'query', getCatalogHomeQuery);
    const result = await catalogService.getCatalogHome(query.warehouseId);
    res.json(result);
  }),
);

/**
 * GET /v1/catalog/categories
 * Product categories tree.
 */
catalogRouter.get(
  '/categories',
  asyncHandler(async (_req, res) => {
    const result = await catalogService.listCategories();
    res.json(result);
  }),
);

/**
 * GET /v1/catalog/products
 * Browse products list over consolidated sellable inventory.
 */
catalogRouter.get(
  '/products',
  validate({ query: listProductsQuery }),
  asyncHandler(async (req, res) => {
    const query = getValidated(req, 'query', listProductsQuery);
    const result = await catalogService.listProducts(query);
    res.json(result);
  }),
);

/**
 * GET /v1/catalog/products/:id
 * Single product detail.
 */
catalogRouter.get(
  '/products/:id',
  validate({ params: productIdParam }),
  asyncHandler(async (req, res) => {
    const { id } = getValidated(req, 'params', productIdParam);
    const result = await catalogService.getProductById(id);
    res.json(result);
  }),
);

/**
 * GET /v1/catalog/search
 * Full-text search products in the sellable catalog.
 */
catalogRouter.get(
  '/search',
  validate({ query: searchCatalogQuery }),
  asyncHandler(async (req, res) => {
    const query = getValidated(req, 'query', searchCatalogQuery);
    const result = await catalogService.searchCatalog(query);
    res.json(result);
  }),
);
