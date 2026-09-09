import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from './client';

export const useWallet = () => {
  return useQuery({
    queryKey: ['wallet'],
    queryFn: async () => {
      const data = await api.get<any>('/wallets/me');
      return data;
    },
    refetchInterval: (query) => {
      // Allow components to override this, but provide a default for polling
      return false;
    }
  });
};

export const useTopup = () => {
  return useMutation({
    mutationFn: async ({ amount, mode }: { amount: string; mode: string }) => {
      const data = await api.post<any>('/wallets/me/topups', { amount, mode });
      return data;
    },
  });
};
