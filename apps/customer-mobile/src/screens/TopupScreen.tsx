import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, SafeAreaView } from 'react-native';
import { useWallet, useTopup } from '../api/wallet';
import { useCart } from '../api/cart';

export const TopupScreen = ({
  shortfall = '0',
  onNavigate,
}: {
  shortfall?: string | undefined;
  onNavigate?: ((screen: string, params?: any) => void) | undefined;
}) => {
  const { data: wallet, refetch: refetchWallet } = useWallet();
  const { data: cart } = useCart();
  const topupMutation = useTopup();

  const [isPolling, setIsPolling] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<string>('Pending');

  // Poll wallet until the balance covers the cart total
  useEffect(() => {
    let interval: any;
    if (isPolling) {
      interval = setInterval(async () => {
        const { data } = await refetchWallet();
        if (data && cart) {
          // Compare as numbers only for UI branching, NOT for DB mutations
          const balanceNum = parseFloat(data.balance);
          const cartTotalNum = parseFloat(cart.subtotal);
          
          if (balanceNum >= cartTotalNum) {
            setIsPolling(false);
            setPaymentStatus('Success');
            // Wait a moment then auto-return to Checkout with cart intact
            setTimeout(() => {
              onNavigate?.('Checkout');
            }, 1500);
          }
        }
      }, 2000);
    }
    return () => clearInterval(interval);
  }, [isPolling, refetchWallet, cart, onNavigate]);

  const handleTopup = () => {
    topupMutation.mutate(
      { amount: shortfall, mode: 'UPI' },
      {
        onSuccess: (data) => {
          // In a real app we'd open Razorpay with data.razorpayKeyId
          // For now, we simulate the payment success by waiting for the webhook
          // Webhook testing will be done via CLI or mock
          setIsPolling(true);
          setPaymentStatus('Waiting for confirmation...');
        },
        onError: (error) => {
          console.error(error);
          setPaymentStatus('Top-up failed');
        }
      }
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Insufficient Wallet Balance</Text>
      
      <View style={styles.card}>
        <Text style={styles.text}>Current Balance: ₹{wallet?.balance || '0'}</Text>
        <Text style={styles.text}>Cart Total: ₹{cart?.subtotal || '0'}</Text>
        <Text style={styles.shortfall}>Shortfall: ₹{shortfall}</Text>
      </View>

      <Text style={styles.status}>{paymentStatus}</Text>

      {isPolling && <ActivityIndicator style={styles.loader} size="large" color="#3b82f6" />}

      <TouchableOpacity 
        style={[styles.btn, (topupMutation.isPending || isPolling) && styles.btnDisabled]}
        onPress={handleTopup}
        disabled={topupMutation.isPending || isPolling}
      >
        <Text style={styles.btnText}>
          {topupMutation.isPending ? 'Initializing...' : `Top-up ₹${shortfall} via Razorpay`}
        </Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#f9fafb' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 24, color: '#ef4444' },
  card: { backgroundColor: '#fff', padding: 16, borderRadius: 8, marginBottom: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 2 },
  text: { fontSize: 16, marginBottom: 8 },
  shortfall: { fontSize: 18, fontWeight: 'bold', marginTop: 8, color: '#ef4444' },
  status: { fontSize: 16, textAlign: 'center', marginBottom: 16, fontStyle: 'italic' },
  loader: { marginBottom: 24 },
  btn: { backgroundColor: '#3b82f6', padding: 16, borderRadius: 8, alignItems: 'center', marginTop: 'auto' },
  btnDisabled: { backgroundColor: '#9ca3af' },
  btnText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
});
