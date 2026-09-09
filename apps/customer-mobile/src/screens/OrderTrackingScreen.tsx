import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, SafeAreaView } from 'react-native';
import { useOrderTracking } from '../api/orders';

export const OrderTrackingScreen = ({
  orderId,
  _onNavigate,
}: {
  orderId?: string | undefined;
  _onNavigate?: ((screen: string, params?: Record<string, unknown>) => void) | undefined;
}) => {
  const { data: tracking, isLoading } = useOrderTracking(orderId || '');
  const [events, setEvents] = useState<Array<{ id?: string; status?: string; timestamp: string }>>([]);

  useEffect(() => {
    // Attempt SSE connection
    // In React Native, EventSource might need a polyfill (e.g. react-native-sse)
    // For now we simulate it or rely on the fallback polling configured in useOrderTracking
    let eventSource: EventSource | null = null;
    
    try {
      if (typeof EventSource !== 'undefined') {
        eventSource = new EventSource(`http://localhost:3000/v1/orders/${orderId}/events`);
        eventSource.onmessage = (event) => {
          const data = JSON.parse(event.data);
          setEvents((prev) => [...prev, data]);
        };
      }
    } catch {
      // EventSource not available in environment, relying on polling
    }

    return () => {
      if (eventSource) {
        eventSource.close();
      }
    };
  }, [orderId]);

  if (isLoading && !events.length) return <ActivityIndicator style={styles.centered} />;

  // Prefer SSE events if available, otherwise use polling data
  const displayStatus = events.length > 0 ? events[events.length - 1].status : tracking?.status;

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Order #{tracking?.orderNumber || orderId}</Text>
      
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Status</Text>
        <Text style={styles.statusText}>{displayStatus || 'Loading...'}</Text>
      </View>
      
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Timeline</Text>
        <FlatList
          data={events.length > 0 ? events : [{ id: '1', status: tracking?.status, timestamp: new Date().toISOString() }]}
          keyExtractor={(_item, index) => String(index)}
          renderItem={({ item }) => (
            <View style={styles.timelineItem}>
              <Text>{item.status}</Text>
              <Text style={styles.timeText}>{new Date(item.timestamp).toLocaleTimeString()}</Text>
            </View>
          )}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#f9fafb' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 24 },
  card: { backgroundColor: '#fff', padding: 16, borderRadius: 8, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 2 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 8 },
  statusText: { fontSize: 20, color: '#10b981', fontWeight: 'bold' },
  timelineItem: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#eee' },
  timeText: { color: '#6b7280' },
});
