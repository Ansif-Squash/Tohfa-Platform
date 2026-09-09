import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, SafeAreaView } from 'react-native';
import { useOrders, useReorder } from '../api/orders';

export const OrderHistoryScreen = ({
  onNavigate,
}: {
  onNavigate?: ((screen: string, params?: Record<string, unknown>) => void) | undefined;
}) => {
  const { data: orders, isLoading } = useOrders();
  const reorderMutation = useReorder();

  const handleReorder = (orderId: string) => {
    reorderMutation.mutate(orderId, {
      onSuccess: () => {
        onNavigate?.('Cart');
      },
      onError: (error) => {
        console.error('Reorder failed', error);
      }
    });
  };

  if (isLoading) return <ActivityIndicator style={styles.centered} />;

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Order History</Text>
      <FlatList
        data={orders}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.header}>
              <Text style={styles.orderNumber}>#{item.orderNumber}</Text>
              <Text style={styles.status}>{item.status}</Text>
            </View>
            <Text style={styles.text}>Total: ₹{item.totalAmount}</Text>
            <Text style={styles.text}>{new Date(item.placedAt).toLocaleDateString()}</Text>
            
            <TouchableOpacity 
              style={styles.reorderBtn} 
              onPress={() => handleReorder(item.id)}
              disabled={reorderMutation.isPending}
            >
              <Text style={styles.reorderBtnText}>Reorder</Text>
            </TouchableOpacity>
          </View>
        )}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#f9fafb' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 16 },
  card: { backgroundColor: '#fff', padding: 16, borderRadius: 8, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 2 },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  orderNumber: { fontSize: 18, fontWeight: 'bold' },
  status: { fontSize: 16, color: '#10b981' },
  text: { fontSize: 16, marginBottom: 4 },
  reorderBtn: { backgroundColor: '#3b82f6', padding: 12, borderRadius: 8, alignItems: 'center', marginTop: 12 },
  reorderBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});
