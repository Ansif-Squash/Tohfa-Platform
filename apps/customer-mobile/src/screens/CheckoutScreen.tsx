import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, SafeAreaView } from 'react-native';
import { useCart } from '../api/cart';
import { useCheckout } from '../api/orders';

// @ts-expect-error Optional navigation package in non-router contexts
import { useNavigation } from '@react-navigation/native';

export const CheckoutScreen = ({
  onNavigate,
}: {
  onNavigate?: ((screen: string, params?: Record<string, unknown>) => void) | undefined;
}) => {
  const { data: cart, isLoading: isCartLoading } = useCart();
  const checkoutMutation = useCheckout();
  
  // Generate idempotency key once per component mount (BR-21, Traps section)
  const idempotencyKey = useMemo(() => {
    return 'id-' + Date.now() + '-' + Math.random().toString(36).substring(2, 15);
  }, []);

  let navigation: { navigate?: (screen: string, params?: Record<string, unknown>) => void } | undefined;
  try {
    navigation = useNavigation();
  } catch {
    // Navigation not available in isolated test environments
  }

  const navigate = (screen: string, params?: Record<string, unknown>) => {
    if (onNavigate) {
      onNavigate(screen, params);
    } else if (navigation?.navigate) {
      navigation.navigate(screen, params);
    }
  };

  const handleCheckout = () => {
    if (!cart?.warehouseId) return;
    
    checkoutMutation.mutate(
      {
        payload: {
          fulfillmentType: 'WAREHOUSE_PICKUP', // Default track 1
          warehouseId: cart.warehouseId,
          paymentMethod: 'WALLET',
        },
        idempotencyKey
      },
      {
        onSuccess: (data) => {
          navigate('OrderTracking', { orderId: data.id });
        },
        onError: (error: unknown) => {
          const response = (error as { response?: { status?: number; data?: { code?: string; shortfall?: string } } })?.response;
          if (response?.status === 422 && response?.data?.code === 'WALLET_INSUFFICIENT') {
            const shortfall = response.data.shortfall || '0';
            navigate('Topup', { shortfall });
          } else {
            console.error('Checkout failed', error);
          }
        }
      }
    );
  };

  if (isCartLoading) return <ActivityIndicator style={styles.centered} />;
  
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Checkout Review</Text>
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Fulfillment</Text>
        <Text>Warehouse Pickup</Text>
      </View>
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Payment</Text>
        <Text>Wallet-first checkout</Text>
        <Text style={styles.total}>Total: ₹{cart?.subtotal || '0'}</Text>
      </View>
      
      {checkoutMutation.isError && (
        <Text style={styles.errorText}>
          {checkoutMutation.error?.message || 'Checkout failed'}
        </Text>
      )}

      <TouchableOpacity 
        style={[styles.payBtn, checkoutMutation.isPending && styles.payBtnDisabled]}
        onPress={handleCheckout}
        disabled={checkoutMutation.isPending}
      >
        <Text style={styles.payBtnText}>
          {checkoutMutation.isPending ? 'Processing...' : `Pay ₹${cart?.subtotal || '0'}`}
        </Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#f9fafb' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 24 },
  card: { backgroundColor: '#fff', padding: 16, borderRadius: 8, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 2 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 8 },
  total: { fontSize: 18, fontWeight: 'bold', marginTop: 16 },
  payBtn: { backgroundColor: '#10b981', padding: 16, borderRadius: 8, alignItems: 'center', marginTop: 'auto' },
  payBtnDisabled: { backgroundColor: '#9ca3af' },
  payBtnText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  errorText: { color: '#ef4444', marginBottom: 16, textAlign: 'center' },
});
