import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from './client';

export type CheckoutInput = {
  fulfillmentType: 'PICKUP' | 'HOME_DELIVERY' | 'WAREHOUSE_PICKUP';
  warehouseId: string;
  deliveryAddressId?: string | null;
  deliveryDate?: string;
  deliverySlot?: string;
  paymentMethod: 'WALLET';
  notes?: string;
};

export interface OrderResponse {
  id: string;
  orderNumber: string;
  status: string;
  totalAmount: string;
  placedAt: string;
}

export interface OrderTrackingResponse {
  orderId: string;
  orderNumber?: string;
  status: string;
}

export const useCheckout = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ payload, idempotencyKey }: { payload: CheckoutInput; idempotencyKey: string }) => {
      const data = await api.post<OrderResponse>('/orders', payload, idempotencyKey);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      queryClient.invalidateQueries({ queryKey: ['wallet'] });
    },
  });
};

export const useOrders = () => {
  return useQuery({
    queryKey: ['orders'],
    queryFn: async () => {
      const data = await api.get<OrderResponse[]>('/orders');
      return data;
    },
  });
};

export const useReorder = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (orderId: string) => {
      const data = await api.post<OrderResponse>(`/orders/${orderId}/reorder`, {});
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
  });
};

export const useOrderTracking = (orderId: string) => {
  return useQuery({
    queryKey: ['order', orderId, 'tracking'],
    queryFn: async () => {
      const data = await api.get<OrderTrackingResponse>(`/orders/${orderId}/tracking`);
      return data;
    },
    refetchInterval: 5000, // Fallback polling every 5s if SSE is not active
  });
};