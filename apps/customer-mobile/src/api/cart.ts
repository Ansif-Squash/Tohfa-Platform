import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from './client';

export type CartItemInput = {
  productId: string;
  grade?: string;
  qtyKg: string;
  warehouseId?: string;
};

export const useCart = () => {
  return useQuery({
    queryKey: ['cart'],
    queryFn: async () => {
      const data = await api.get<any>('/cart');
      return data;
    },
  });
};

export const useAddToCart = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (item: CartItemInput) => {
      const data = await api.post<any>('/cart/items', item);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
  });
};

export const useUpdateCart = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { warehouseId?: string; items: CartItemInput[] }) => {
      const data = await api.put<any>('/cart', payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
  });
};

export const useClearCart = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      await api.delete('/cart');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
  });
};
