import React from 'react';
import { View, StyleSheet, ActivityIndicator, FlatList, Text } from 'react-native';
import { useCategories } from '../api/catalog';
import { Card } from '@tohfa/mobile-ui';

export function CategoriesScreen() {
  const { data, isLoading, isError } = useCategories();

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
        <Text>Error loading categories</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={data}
        keyExtractor={item => item.id}
        numColumns={2}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <Card style={styles.card}>
            <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 16 }}>Categories</Text>
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
  list: {
    padding: 16,
    gap: 8,
  },
  card: {
    flex: 1,
    margin: 4,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    height: 100,
  },
});
