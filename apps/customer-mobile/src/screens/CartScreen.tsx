import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, SafeAreaView } from 'react-native';
import { useCart } from '../api/cart';

export const CartScreen = ({
  onNavigate,
}: {
  onNavigate?: ((screen: string, params?: Record<string, unknown>) => void) | undefined;
}) => {
  const { data: cart, isLoading, error, refetch } = useCart();
  const [timeLeft, setTimeLeft] = useState<string>('');

  useEffect(() => {
    if (!cart?.lockExpiresAt) {
      setTimeLeft('');
      return;
    }
    const timer = setInterval(() => {
      const now = new Date().getTime();
      const expiresAt = new Date(cart.lockExpiresAt).getTime();
      const diff = expiresAt - now;
      if (diff <= 0) {
        setTimeLeft('Expired');
        clearInterval(timer);
      } else {
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        setTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [cart?.lockExpiresAt]);

  if (isLoading) return <ActivityIndicator style={styles.centered} />;
  if (error) return (
    <View style={styles.centered}>
      <Text style={styles.errorText}>Error loading cart. The lock might be expired.</Text>
      <TouchableOpacity onPress={() => refetch()} style={styles.button}>
        <Text style={styles.buttonText}>Refresh Cart</Text>
      </TouchableOpacity>
    </View>
  );

  if (!cart || cart.items.length === 0) {
    return (
      <View style={styles.centered}>
        <Text style={styles.emptyText}>Your cart is empty.</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>Cart</Text>
        {timeLeft ? <Text style={styles.timerText}>Reserved for: {timeLeft}</Text> : null}
      </View>
      <FlatList
        data={cart.items}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <View style={styles.itemRow}>
            <Text style={styles.itemName}>{item.name} ({item.qtyKg} kg)</Text>
            <Text style={styles.itemPrice}>₹{item.lineTotal}</Text>
          </View>
        )}
      />
      <View style={styles.footer}>
        <Text style={styles.totalText}>Subtotal: ₹{cart.subtotal}</Text>
        <TouchableOpacity 
          style={styles.checkoutBtn} 
          onPress={() => onNavigate?.('Checkout')}
        >
          <Text style={styles.checkoutBtnText}>Proceed to Checkout</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { padding: 16, borderBottomWidth: 1, borderBottomColor: '#eee', flexDirection: 'row', justifyContent: 'space-between' },
  headerText: { fontSize: 24, fontWeight: 'bold' },
  timerText: { fontSize: 14, color: '#f59e0b', alignSelf: 'center' },
  itemRow: { padding: 16, borderBottomWidth: 1, borderBottomColor: '#eee', flexDirection: 'row', justifyContent: 'space-between' },
  itemName: { fontSize: 16 },
  itemPrice: { fontSize: 16, fontWeight: 'bold' },
  footer: { padding: 16, borderTopWidth: 1, borderTopColor: '#eee' },
  totalText: { fontSize: 18, fontWeight: 'bold', marginBottom: 16 },
  checkoutBtn: { backgroundColor: '#10b981', padding: 16, borderRadius: 8, alignItems: 'center' },
  checkoutBtnText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  errorText: { color: '#ef4444', marginBottom: 16 },
  emptyText: { fontSize: 18, color: '#666' },
  button: { backgroundColor: '#3b82f6', padding: 12, borderRadius: 8 },
  buttonText: { color: '#fff', fontSize: 16 },
});
