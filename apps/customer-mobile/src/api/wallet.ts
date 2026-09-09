import { useQuery, useMutation } from '@tanstack/react-query';
import { api } from './client';

export interface WalletResponse {
  id: string;
  balance: string;
  status: string;
  currency?: string;
}

export interface TopupResponse {
  id: string;
  amount: string;
  status: string;
  razorpayKeyId?: string;
}

export const useWallet = () => {
  return useQuery({
    queryKey: ['wallet'],
    queryFn: async () => {
      const data = await api.get<WalletResponse>('/wallets/me');
      return data;
    },
    refetchInterval: (_query) => {
      // Allow components to override this, but provide a default for polling
      return false;
    }
  });
};

export const useTopup = () => {
  return useMutation({
    mutationFn: async ({ amount, mode }: { amount: string; mode: string }) => {
      const data = await api.post<TopupResponse>('/wallets/me/topups', { amount, mode });
      return data;
    },
  });
};
