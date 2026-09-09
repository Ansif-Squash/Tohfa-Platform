import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { api } from './client';

export interface CatalogHomeResponse {
  heroBanners: { id: string; imageUrl: string; }[];
  categories: { id: string; name: string; iconUrl?: string; }[];
  featured: Product[];
}

export interface Category {
  id: string;
  name: string;
  imageUrl?: string;
  parentId?: string | null;
}

export interface Product {
  id: string;
  categoryId: string;
  name: string;
  description?: string;
  pricePerKg: string; // Money
  grade: 'A' | 'B' | 'REJECT';
  warehouseId: string;
  quantityAvailableKg: string;
  images: { id: string; url: string; }[];
  certifications?: { code: string; name: string; }[];
}

export interface ProductDetail extends Product {
  photos: { id: string; url: string; }[];
}

export interface ListProductsResponse {
  items: Product[];
  total: number;
}

export interface ListProductsQuery {
  categoryId?: string;
  grade?: string;
  warehouseId?: string;
  sortBy?: 'PRICE_ASC' | 'PRICE_DESC' | 'NAME_ASC' | 'NEWEST';
  page?: number;
  limit?: number;
}

export function useCatalogHome(): UseQueryResult<CatalogHomeResponse, Error> {
  return useQuery({
    queryKey: ['catalog', 'home'],
    queryFn: () => api.get<CatalogHomeResponse>('/catalog/home'),
  });
}

export function useCategories(): UseQueryResult<Category[], Error> {
  return useQuery({
    queryKey: ['catalog', 'categories'],
    queryFn: () => api.get<Category[]>('/catalog/categories'),
  });
}

export function useProducts(params: ListProductsQuery): UseQueryResult<ListProductsResponse, Error> {
  return useQuery({
    queryKey: ['catalog', 'products', params],
    queryFn: () => {
      const searchParams = new URLSearchParams();
      if (params.categoryId) searchParams.append('categoryId', params.categoryId);
      if (params.grade) searchParams.append('grade', params.grade);
      if (params.warehouseId) searchParams.append('warehouseId', params.warehouseId);
      if (params.sortBy) searchParams.append('sortBy', params.sortBy);
      if (params.page) searchParams.append('page', params.page.toString());
      if (params.limit) searchParams.append('limit', params.limit.toString());
      
      const queryStr = searchParams.toString();
      const path = `/catalog/products${queryStr ? '?' + queryStr : ''}`;
      return api.get<ListProductsResponse>(path);
    },
  });
}

export function useProductDetail(id: string): UseQueryResult<ProductDetail, Error> {
  return useQuery({
    queryKey: ['catalog', 'products', id],
    queryFn: () => api.get<ProductDetail>(`/catalog/products/${id}`),
    enabled: !!id,
  });
}

export function useSearch(query: string): UseQueryResult<ListProductsResponse, Error> {
  return useQuery({
    queryKey: ['catalog', 'search', query],
    queryFn: () => api.get<ListProductsResponse>(`/catalog/search?q=${encodeURIComponent(query)}`),
    enabled: query.length > 0,
  });
}
import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { api } from './client';

export interface CatalogHomeResponse {
  heroBanners: { id: string; imageUrl: string; }[];
  categories: { id: string; name: string; iconUrl?: string; }[];
  featured: Product[];
}

export interface Category {
  id: string;
  name: string;
  imageUrl?: string;
  parentId?: string | null;
}

export interface Product {
  id: string;
  categoryId: string;
  name: string;
  description?: string;
  pricePerKg: string; // Money
  grade: 'A' | 'B' | 'REJECT';
  warehouseId: string;
  quantityAvailableKg: string;
  images: { id: string; url: string; }[];
  certifications?: { code: string; name: string; }[];
}

export interface ProductDetail extends Product {
  photos: { id: string; url: string; }[];
}

export interface ListProductsResponse {
  items: Product[];
  total: number;
}

export interface ListProductsQuery {
  categoryId?: string;
  grade?: string;
  warehouseId?: string;
  sortBy?: 'PRICE_ASC' | 'PRICE_DESC' | 'NAME_ASC' | 'NEWEST';
  page?: number;
  limit?: number;
}

export function useCatalogHome(): UseQueryResult<CatalogHomeResponse, Error> {
  return useQuery({
    queryKey: ['catalog', 'home'],
    queryFn: () => api.get<CatalogHomeResponse>('/catalog/home'),
  });
}

export function useCategories(): UseQueryResult<Category[], Error> {
  return useQuery({
    queryKey: ['catalog', 'categories'],
    queryFn: () => api.get<Category[]>('/catalog/categories'),
  });
}

export function useProducts(params: ListProductsQuery): UseQueryResult<ListProductsResponse, Error> {
  return useQuery({
    queryKey: ['catalog', 'products', params],
    queryFn: () => {
      const searchParams = new URLSearchParams();
      if (params.categoryId) searchParams.append('categoryId', params.categoryId);
      if (params.grade) searchParams.append('grade', params.grade);
      if (params.warehouseId) searchParams.append('warehouseId', params.warehouseId);
      if (params.sortBy) searchParams.append('sortBy', params.sortBy);
      if (params.page) searchParams.append('page', params.page.toString());
      if (params.limit) searchParams.append('limit', params.limit.toString());
      
      const queryStr = searchParams.toString();
      const path = `/catalog/products${queryStr ? '?' + queryStr : ''}`;
      return api.get<ListProductsResponse>(path);
    },
  });
}

export function useProductDetail(id: string): UseQueryResult<ProductDetail, Error> {
  return useQuery({
    queryKey: ['catalog', 'products', id],
    queryFn: () => api.get<ProductDetail>(`/catalog/products/${id}`),
    enabled: !!id,
  });
}

export function useSearch(query: string): UseQueryResult<ListProductsResponse, Error> {
  return useQuery({
    queryKey: ['catalog', 'search', query],
    queryFn: () => api.get<ListProductsResponse>(`/catalog/search?q=${encodeURIComponent(query)}`),
    enabled: query.length > 0,
  });
}
