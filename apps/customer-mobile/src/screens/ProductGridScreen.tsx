import React, { useState } from 'react';
import { View, StyleSheet, ActivityIndicator, FlatList, Text, TouchableOpacity } from 'react-native';
import { useProducts, type ListProductsQuery } from '../api/catalog';
import { Card } from '@tohfa/mobile-ui';

export function ProductGridScreen({ categoryId }: { categoryId?: string }) {
  const [query, setQuery] = useState<ListProductsQuery>(categoryId ? { categoryId } : {});

  const { data, isLoading, isError } = useProducts(query);

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator testID="loading-indicator" />
      </View>
    );
  }

  if (isError || !data) {
    return (
      <View style={styles.center}>
        <Text>Error loading products</Text>
      </View>
    );
  }

  // BR-16 and S-48: REJECT grade products must never render.
  const validItems = data.items.filter(item => item.grade !== 'REJECT');

  return (
    <View style={styles.container}>
      {/* Filter and Sort Chips could go here */}
      <View style={styles.chipsContainer}>
        {/* Placeholder for actual chips UI */}
        <TouchableOpacity style={styles.chip} onPress={() => setQuery({ ...query, sortBy: 'PRICE_ASC' })}>
          <Text style={styles.chipText}>Price: Low to High</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={validItems}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <Card style={styles.card}>
            <Text style={{ fontSize: 16 }}>{item.name}</Text>
            <Text style={{ fontSize: 14 }}>{item.pricePerKg}</Text>
            <Text style={{ fontSize: 12 }}>Grade: {item.grade}</Text>
          </Card>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chipsContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 8,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#EEE',
  },
  chipText: {
    fontSize: 12,
  },
  list: {
    padding: 16,
    gap: 8,
  },
  card: {
    padding: 16,
    marginBottom: 8,
  },
});
