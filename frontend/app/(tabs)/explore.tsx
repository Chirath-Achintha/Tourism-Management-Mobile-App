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
  Pressable,
  Dimensions,
} from 'react-native';
import { API_BASE_URL } from '@/constants/api';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const { width } = Dimensions.get('window');

const CATEGORIES = ['All', 'Beach', 'Mountain', 'City', 'Cultural'];

export default function SearchPlacesScreen() {
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [places, setPlaces] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

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
    
    return places.filter((place) => {
      const matchesQuery = !normalizedQuery || (
        place.name.toLowerCase().includes(normalizedQuery) ||
        place.location.toLowerCase().includes(normalizedQuery) ||
        place.category.toLowerCase().includes(normalizedQuery)
      );

      const matchesCategory = selectedCategory === 'All' || place.category === selectedCategory;

      return matchesQuery && matchesCategory;
    });
  }, [query, places, selectedCategory]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.fixedHeader}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.title}>Explore</Text>
            <Text style={styles.subtitle}>Discover the beauty of Sri Lanka</Text>
          </View>
          <Pressable style={styles.notificationBtn}>
            <Ionicons name="notifications-outline" size={22} color="#1A3B2F" />
          </Pressable>
        </View>

        <View style={styles.searchWrapper}>
          <Ionicons name="search-outline" size={20} color="rgba(26, 59, 47, 0.4)" />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search destinations..."
            placeholderTextColor="rgba(26, 59, 47, 0.3)"
            style={styles.searchInput}
          />
          {query !== '' && (
            <Pressable onPress={() => setQuery('')}>
              <Ionicons name="close-circle" size={18} color="rgba(26, 59, 47, 0.2)" />
            </Pressable>
          )}
        </View>

        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          contentContainerStyle={styles.categoryScroll}
        >
          {CATEGORIES.map((cat) => (
            <Pressable
              key={cat}
              onPress={() => setSelectedCategory(cat)}
              style={[
                styles.categoryPill,
                selectedCategory === cat && styles.categoryPillActive
              ]}
            >
              <Text style={[
                styles.categoryText,
                selectedCategory === cat && styles.categoryTextActive
              ]}>
                {cat}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.resultsHeader}>
          <Text style={styles.resultsText}>{filteredPlaces.length} Destinations Found</Text>
        </View>

        {loading ? (
          <View style={styles.loadingState}>
            <ActivityIndicator size="large" color="#FFD166" />
            <Text style={styles.loadingText}>Loading gorgeous places...</Text>
          </View>
        ) : filteredPlaces.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconCircle}>
              <Ionicons name="map-outline" size={40} color="rgba(26, 59, 47, 0.2)" />
            </View>
            <Text style={styles.emptyStateTitle}>No results found</Text>
            <Text style={styles.emptyStateSubtitle}>
              Try adjusting your search or category filters.
            </Text>
          </View>
        ) : (
          filteredPlaces.map((place) => (
            <Pressable 
              key={place._id} 
              style={styles.card}
              onPress={() => router.push(`/destination/${place._id}` as any)}
            >
              <Image source={{ uri: place.images[0]?.url }} style={styles.cardImage} />
              <View style={styles.cardContent}>
                <View style={styles.cardTopRow}>
                  <View style={styles.locationTag}>
                    <Ionicons name="location" size={12} color="#FFD166" />
                    <Text style={styles.locationText}>{place.location}</Text>
                  </View>
                  <View style={styles.categoryBadge}>
                    <Text style={styles.badgeText}>{place.category}</Text>
                  </View>
                </View>
                <Text style={styles.placeName}>{place.name}</Text>
                <Text style={styles.description} numberOfLines={2}>{place.description}</Text>
                
                <View style={styles.cardFooter}>
                  <View style={styles.ratingRow}>
                    <Ionicons name="star" size={14} color="#FFD166" />
                    <Text style={styles.ratingText}>4.8 (1.2k reviews)</Text>
                  </View>
                  <View style={styles.arrowCircle}>
                    <Ionicons name="arrow-forward" size={16} color="#ffffff" />
                  </View>
                </View>
              </View>
            </Pressable>
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
  fixedHeader: {
    paddingTop: 12,
    backgroundColor: '#F0FAF5',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: '#1A3B2F',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(26, 59, 47, 0.4)',
    fontWeight: '600',
  },
  notificationBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(26, 59, 47, 0.05)',
  },
  searchWrapper: {
    marginHorizontal: 24,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    paddingHorizontal: 16,
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(26, 59, 47, 0.06)',
    marginBottom: 16,
    shadowColor: '#1A3B2F',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#1A3B2F',
    fontWeight: '600',
  },
  categoryScroll: {
    paddingHorizontal: 24,
    paddingBottom: 16,
    gap: 10,
  },
  categoryPill: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: 'rgba(26, 59, 47, 0.05)',
  },
  categoryPillActive: {
    backgroundColor: '#1A3B2F',
    borderColor: '#1A3B2F',
  },
  categoryText: {
    fontSize: 13,
    fontWeight: '700',
    color: 'rgba(26, 59, 47, 0.6)',
  },
  categoryTextActive: {
    color: '#ffffff',
  },
  content: {
    padding: 24,
    paddingTop: 8,
  },
  resultsHeader: {
    marginBottom: 16,
  },
  resultsText: {
    fontSize: 12,
    color: 'rgba(26, 59, 47, 0.4)',
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  loadingState: {
    paddingVertical: 80,
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 14,
    fontWeight: '700',
    color: 'rgba(26, 59, 47, 0.3)',
  },
  emptyState: {
    paddingVertical: 80,
    alignItems: 'center',
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(26, 59, 47, 0.03)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1A3B2F',
    marginBottom: 4,
  },
  emptyStateSubtitle: {
    fontSize: 14,
    color: 'rgba(26, 59, 47, 0.4)',
    fontWeight: '600',
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 30,
    marginBottom: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(26, 59, 47, 0.04)',
    shadowColor: '#1A3B2F',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 3,
  },
  cardImage: {
    width: '100%',
    height: 220,
  },
  cardContent: {
    padding: 20,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  locationTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(26, 59, 47, 0.03)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    gap: 4,
  },
  locationText: {
    fontSize: 11,
    fontWeight: '800',
    color: 'rgba(26, 59, 47, 0.7)',
    textTransform: 'uppercase',
  },
  categoryBadge: {
    backgroundColor: '#FFD166',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#1A3B2F',
    textTransform: 'uppercase',
  },
  placeName: {
    fontSize: 22,
    fontWeight: '900',
    color: '#1A3B2F',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: 'rgba(26, 59, 47, 0.5)',
    lineHeight: 20,
    fontWeight: '500',
    marginBottom: 20,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(26, 59, 47, 0.05)',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  ratingText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1A3B2F',
  },
  arrowCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#1A3B2F',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

