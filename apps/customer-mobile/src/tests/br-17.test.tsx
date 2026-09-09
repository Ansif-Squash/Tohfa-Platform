import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('react-native', () => ({
  View: 'View',
  Text: 'Text',
  ScrollView: 'ScrollView',
  StyleSheet: { create: (s: Record<string, unknown>) => s },
  ActivityIndicator: 'ActivityIndicator',
  FlatList: 'FlatList',
  TextInput: 'TextInput',
  Image: 'Image',
  SafeAreaView: 'SafeAreaView',
  StatusBar: 'StatusBar',
  TouchableOpacity: 'TouchableOpacity',
}));

vi.mock('@tohfa/mobile-ui', () => ({
  Card: 'Card',
  Button: 'Button',
  Badge: 'Badge',
  Icon: 'Icon',
}));

vi.mock('react-native-safe-area-context', () => ({
  SafeAreaView: 'SafeAreaView'
}));

vi.mock('@react-native-async-storage/async-storage', () => ({
  default: {
    getItem: vi.fn(() => Promise.resolve(null)),
    setItem: vi.fn(() => Promise.resolve()),
  }
}));

// Mock React Navigation
const mockNavigate = vi.fn();
vi.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: mockNavigate }),
  useRoute: () => ({ params: { shortfall: '500' } })
}));

import { CheckoutScreen } from '../screens/CheckoutScreen';
import * as ordersApi from '../api/orders';
import * as cartApi from '../api/cart';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

function renderWithProviders(ui: React.ReactElement) {
  return renderer.create(
    <QueryClientProvider client={queryClient}>
      {ui}
    </QueryClientProvider>
  );
}

describe('BR-17: Wallet-first checkout recovery', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    queryClient.clear();
  });

  it('BR-17: Returns to checkout after insufficient funds top-up recovery', async () => {
    const mockMutate = vi.fn((_opts, callbacks) => {
      // Simulate 422 WALLET_INSUFFICIENT
      callbacks.onError({
        response: {
          status: 422,
          data: { code: 'WALLET_INSUFFICIENT', shortfall: '500' }
        }
      });
    });

    vi.spyOn(ordersApi, 'useCheckout').mockReturnValue({
      mutate: mockMutate,
      isPending: false,
      isError: false,
      error: null,
    } as unknown as ReturnType<typeof ordersApi.useCheckout>);

    vi.spyOn(cartApi, 'useCart').mockReturnValue({
      data: { warehouseId: 'wh-1', subtotal: '1000' },
      isLoading: false,
    } as unknown as ReturnType<typeof cartApi.useCart>);

    let component!: renderer.ReactTestRenderer;
    await act(async () => {
      component = renderWithProviders(<CheckoutScreen />);
    });

    // Find the checkout button and press it
    const texts = component.root.findAllByType('Text');
    const payText = texts.find((t: renderer.ReactTestInstance) => t.props.children?.includes('Pay ₹1000'));
    const payBtn = payText?.parent;
    await act(async () => {
      payBtn?.props.onPress();
    });

    // Expect navigation to Topup with shortfall
    expect(mockNavigate).toHaveBeenCalledWith('Topup', { shortfall: '500' });
  });
});