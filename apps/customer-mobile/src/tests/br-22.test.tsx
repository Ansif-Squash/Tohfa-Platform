import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('react-native', () => ({
  View: 'View',
  Text: 'Text',
  ScrollView: 'ScrollView',
  StyleSheet: { create: (s: any) => s },
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

const mockNavigate = vi.fn();
vi.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: mockNavigate }),
  useRoute: () => ({ params: {} })
}));

import { CartScreen } from '../screens/CartScreen';
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

describe('BR-22: Cart locking', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    queryClient.clear();
  });

  it('BR-22: Displays cart lock countdown', async () => {
    vi.useFakeTimers();
    const now = new Date('2026-09-08T10:00:00Z').getTime();
    vi.setSystemTime(now);

    const expiresAt = new Date(now + 2 * 60 * 60 * 1000 + 30 * 60 * 1000 + 15 * 1000).toISOString(); // 2h 30m 15s from now

    vi.spyOn(cartApi, 'useCart').mockReturnValue({
      data: { 
        id: 'cart-1',
        items: [{ id: 'item-1', name: 'Apples', qtyKg: '10', lineTotal: '500' }],
        subtotal: '500',
        lockExpiresAt: expiresAt 
      },
      isLoading: false,
    } as any);

    let component: any;
    await act(async () => {
      component = renderWithProviders(<CartScreen />);
    });

    // Fast-forward 1 second to trigger the interval
    await act(async () => {
      vi.advanceTimersByTime(1000);
    });

    // Check if the timer text is rendered correctly
    const texts = component.root.findAllByType('Text');
    const timerTexts = texts.filter((t: any) => {
      const children = Array.isArray(t.props.children) ? t.props.children.join('') : String(t.props.children);
      return children.includes('Reserved for:');
    });
    
    expect(timerTexts.length).toBeGreaterThan(0);
    const timerText = timerTexts[0];
    const joinedText = Array.isArray(timerText.props.children) ? timerText.props.children.join('') : String(timerText.props.children);
    expect(joinedText).toContain('2h 30m 14s');

    vi.useRealTimers();
  });
});

