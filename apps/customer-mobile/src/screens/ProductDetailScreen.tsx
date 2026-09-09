import React from 'react';
import { View, StyleSheet, ActivityIndicator, Text, ScrollView, Image } from 'react-native';
import { useProductDetail } from '../api/catalog';


export function ProductDetailScreen({ productId }: { productId: string }) {
  const { data, isLoading, isError } = useProductDetail(productId);

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
        <Text>Error loading product details</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Photos */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.photoContainer}>
        {data.photos?.map((photo: { id: string; url: string }) => (
          <Image key={photo.id} source={{ uri: photo.url }} style={styles.photo} />
        ))}
      </ScrollView>

      <View style={styles.content}>
        <Text style={{ fontSize: 32, fontWeight: "bold" }}>{data.name}</Text>
        <Text style={{ fontSize: 24, fontWeight: "bold" }}>{data.pricePerKg}</Text>
        
        <View style={styles.meta}>
          <Text style={{ fontSize: 16 }}>Grade: {data.grade}</Text>
          <Text style={{ fontSize: 16 }}>Available: {data.quantityAvailableKg} kg</Text>
        </View>
        
        {data.description && (
          <View style={styles.section}>
            <Text style={{ fontSize: 14 }}>{data.description}</Text>
          </View>
        )}

        {/* Certifications */}
        {data.certifications && data.certifications.length > 0 && (
          <View style={styles.section}>
            <Text style={{ fontSize: 20, fontWeight: "bold" }}>Certifications</Text>
            {data.certifications.map((cert: { code: string; name: string }) => (
              <Text key={cert.code} style={{ fontSize: 14 }}>• {cert.name}</Text>
            ))}
          </View>
        )}

        {/* Quantity Picker (placeholder) */}
        <View style={styles.section}>
          <Text style={{ fontSize: 16 }}>Quantity Picker UI Here</Text>
        </View>

        {/* BR-16: No farmer info rendered anywhere */}
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
  photoContainer: {
    height: 250,
  },
  photo: {
    width: 300,
    height: 250,
    marginRight: 2,
  },
  content: {
    padding: 16,
  },
  meta: {
    marginVertical: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  section: {
    marginTop: 16,
  },
});
