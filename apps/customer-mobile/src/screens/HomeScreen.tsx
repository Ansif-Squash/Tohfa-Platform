import React from 'react';
import { ScrollView, View, Text, Image, StyleSheet, ActivityIndicator } from 'react-native';
import { useCatalogHome, type Product } from '../api/catalog';
import { Card } from '@tohfa/mobile-ui';

export function HomeScreen() {
  const { data, isLoading, isError } = useCatalogHome();

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
        <Text>Error loading home</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Hero Banners */}
      <View style={styles.section}>
        <Text style={{ fontSize: 24, fontWeight: "bold" }}>Featured</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {data.heroBanners.map((banner: { id: string; imageUrl: string }) => (
            <Image 
              key={banner.id} 
              source={{ uri: banner.imageUrl }} 
              style={styles.bannerImage} 
            />
          ))}
        </ScrollView>
      </View>

      {/* Categories */}
      <View style={styles.section}>
        <Text style={{ fontSize: 24, fontWeight: "bold" }}>Categories</Text>
        <View style={styles.grid}>
          {data.categories.map((cat: { id: string; name: string; iconUrl?: string }) => (
            <Card key={cat.id} style={styles.card}>
              <Text style={{ fontSize: 16 }}>{cat.name}</Text>
            </Card>
          ))}
        </View>
      </View>

      {/* Featured Products */}
      <View style={styles.section}>
        <Text style={{ fontSize: 24, fontWeight: "bold" }}>Trending</Text>
        <View style={styles.grid}>
          {data.featured.map((product: Product) => (
            <Card key={product.id} style={styles.card}>
              <Text style={{ fontSize: 16 }}>{product.name}</Text>
              <Text style={{ fontSize: 14 }}>{product.pricePerKg}</Text>
            </Card>
          ))}
        </View>
      </View>
    </ScrollView>
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
  section: {
    padding: 16,
  },
  bannerImage: {
    width: 300,
    height: 150,
    borderRadius: 8,
    marginRight: 8,
    marginTop: 8,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  card: {
    padding: 16,
    width: '48%',
  },
});
