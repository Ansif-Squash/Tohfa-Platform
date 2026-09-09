import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TextInput, FlatList, ActivityIndicator, Text } from 'react-native';
import { useSearch, useCatalogHome } from '../api/catalog';
import { Card } from '@tohfa/mobile-ui';
import AsyncStorage from '@react-native-async-storage/async-storage';

const RECENT_SEARCH_KEY = '@customer_recent_searches';

export function SearchScreen() {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  
  // Trending derived from catalog home featured
  const { data: homeData, isLoading: isHomeLoading } = useCatalogHome();
  const { data: searchResults, isLoading: isSearchLoading } = useSearch(debouncedQuery);

  useEffect(() => {
    AsyncStorage.getItem(RECENT_SEARCH_KEY).then((val: string | null) => {
      if (val) setRecentSearches(JSON.parse(val));
    });
  }, []);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(query);
      if (query.trim().length > 0) {
        saveRecentSearch(query.trim());
      }
    }, 500);
    return () => clearTimeout(handler);
  }, [query]);

  const saveRecentSearch = async (term: string) => {
    const newRecent = [term, ...recentSearches.filter(s => s !== term)].slice(0, 5);
    setRecentSearches(newRecent);
    await AsyncStorage.setItem(RECENT_SEARCH_KEY, JSON.stringify(newRecent));
  };

  const renderContent = () => {
    if (debouncedQuery.length > 0) {
      if (isSearchLoading) return <ActivityIndicator style={styles.center} testID="loading-indicator" />;
      if (!searchResults || searchResults.items.length === 0) return <Text style={styles.center}>No results found</Text>;
      
      const validItems = searchResults.items.filter(item => item.grade !== 'REJECT');
      
      return (
        <FlatList
          data={validItems}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <Card style={styles.card}>
              <Text style={{ fontSize: 16 }}>{item.name}</Text>
              <Text style={{ fontSize: 14 }}>{item.pricePerKg}</Text>
            </Card>
          )}
        />
      );
    }

    return (
      <View style={styles.list}>
        {recentSearches.length > 0 && (
          <View style={styles.section}>
            <Text style={{ fontSize: 20, fontWeight: "bold" }}>Recent Searches</Text>
            {recentSearches.map(term => (
              <Text key={term} style={styles.recentItem} onPress={() => setQuery(term)}>{term}</Text>
            ))}
          </View>
        )}

        <View style={styles.section}>
          <Text style={{ fontSize: 20, fontWeight: "bold" }}>Trending Searches (Derived)</Text>
          {isHomeLoading ? (
            <ActivityIndicator />
          ) : (
            homeData?.featured?.slice(0, 5).map(prod => (
              <Text key={prod.id} style={styles.recentItem} onPress={() => setQuery(prod.name)}>{prod.name}</Text>
            ))
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.searchBar}>
        <TextInput 
          style={styles.input} 
          value={query}
          onChangeText={setQuery}
          placeholder="Search products..."
          testID="search-input"
        />
      </View>
      {renderContent()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  center: {
    marginTop: 20,
    alignSelf: 'center',
  },
  searchBar: {
    padding: 16,
    backgroundColor: '#F5F5F5',
  },
  input: {
    height: 40,
    backgroundColor: '#FFF',
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  list: {
    padding: 16,
  },
  card: {
    padding: 16,
    marginBottom: 8,
  },
  section: {
    marginBottom: 16,
  },
  recentItem: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
});
