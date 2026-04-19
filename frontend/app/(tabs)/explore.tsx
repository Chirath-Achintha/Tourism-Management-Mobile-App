import React, { useEffect, useMemo, useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  ActivityIndicator,
  Image,
} from 'react-native';
import { API_BASE_URL } from '@/constants/api';
import { Ionicons } from '@expo/vector-icons';

export default function SearchPlacesScreen() {
  const [query, setQuery] = useState('');
  const [places, setPlaces] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPlaces = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${API_BASE_URL}/destinations`);
        const data = await response.json();
        if (response.ok) {
          setPlaces(data);
        }
      } catch (error) {
        console.error("Fetch places failed:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchPlaces();
  }, []);

  const filteredPlaces = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return places;

    return places.filter((place) => {
      return (
        place.name.toLowerCase().includes(normalizedQuery) ||
        place.location.toLowerCase().includes(normalizedQuery) ||
        place.category.toLowerCase().includes(normalizedQuery)
      );
    });
  }, [query, places]);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>Search Places</Text>
          <Ionicons name="search" size={24} color="#1A3B2F" />
        </View>
        <Text style={styles.subtitle}>
          Find destinations by place name, district, or category.
        </Text>

        <View style={styles.searchWrapper}>
          <Ionicons name="search-outline" size={20} color="#64748b" />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search places like Sigiriya, Galle..."
            placeholderTextColor="#94a3b8"
            style={styles.searchInput}
          />
        </View>

        <View style={styles.resultsHeader}>
          <Text style={styles.resultsText}>{filteredPlaces.length} places found</Text>
        </View>

        {loading ? (
          <View style={styles.loadingState}>
            <ActivityIndicator size="large" color="#FFD166" />
          </View>
        ) : filteredPlaces.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="map-outline" size={48} color="#9ca3af" />
            <Text style={styles.emptyStateText}>No places found. Try another keyword.</Text>
          </View>
        ) : (
          filteredPlaces.map((place) => (
            <View key={place._id} style={styles.card}>
              <Image source={{ uri: place.imageUrl }} style={styles.cardImage} />
              <View style={styles.cardContent}>
                <View style={styles.cardTopRow}>
                  <Text style={styles.placeName}>{place.name}</Text>
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{place.category}</Text>
                  </View>
                </View>
                <View style={styles.locationRow}>
                    <Ionicons name="location-outline" size={14} color="#334155" />
                    <Text style={styles.location}>{place.location}</Text>
                </View>
                <Text style={styles.description} numberOfLines={3}>{place.description}</Text>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0FAF5',
  },
  content: {
    padding: 24,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: '#1A3B2F',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(26, 59, 47, 0.6)',
    lineHeight: 20,
    marginBottom: 20,
  },
  searchWrapper: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(26, 59, 47, 0.1)',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#1A3B2F',
    fontWeight: '600',
  },
  resultsHeader: {
    marginBottom: 16,
  },
  resultsText: {
    fontSize: 12,
    color: 'rgba(26, 59, 47, 0.4)',
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  loadingState: {
    paddingVertical: 50,
  },
  emptyState: {
    paddingVertical: 80,
    alignItems: 'center',
    gap: 12,
  },
  emptyStateText: {
    fontSize: 15,
    color: 'rgba(26, 59, 47, 0.4)',
    fontWeight: '700',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    marginBottom: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(26, 59, 47, 0.08)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  cardImage: {
    width: '100%',
    height: 200,
  },
  cardContent: {
    padding: 16,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  placeName: {
    fontSize: 18,
    fontWeight: '900',
    color: '#1A3B2F',
  },
  badge: {
    backgroundColor: '#FFD166',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#1A3B2F',
    textTransform: 'uppercase',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 8,
  },
  location: {
    fontSize: 13,
    color: 'rgba(26, 59, 47, 0.6)',
    fontWeight: '700',
  },
  description: {
    fontSize: 13,
    color: 'rgba(26, 59, 47, 0.5)',
    lineHeight: 18,
    fontWeight: '500',
  },
});
