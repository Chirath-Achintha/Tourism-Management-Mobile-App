import React, { useEffect, useMemo, useState } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
  ActivityIndicator,
  Image,
  Pressable,
  Dimensions,
  FlatList,
} from 'react-native';
import { API_BASE_URL } from '@/constants/api';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48 - 16) / 2;

const CATEGORIES = ['All', 'Beach', 'Mountain', 'City', 'Cultural'];

export default function SearchPlacesScreen() {
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [places, setPlaces] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [favorites, setFavorites] = useState<string[]>([]);
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

  const toggleFavorite = (id: string) => {
    setFavorites(prev => 
      prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]
    );
  };

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

  const renderHeader = () => (
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

      <BlurView intensity={80} tint="light" style={styles.searchBlur}>
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
      </BlurView>

      <BlurView intensity={60} tint="light" style={styles.categoryBlur}>
        <FlatList 
          horizontal 
          data={CATEGORIES}
          showsHorizontalScrollIndicator={false} 
          contentContainerStyle={styles.categoryScroll}
          keyExtractor={(item) => item}
          renderItem={({ item: cat }) => (
            <Pressable
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
          )}
        />
      </BlurView>
    </View>
  );

  const renderDestinationCard = ({ item: place }: { item: any }) => (
    <Pressable 
      style={styles.card}
      onPress={() => router.push(`/destination/${place._id}` as any)}
    >
      <View style={styles.cardImageWrapper}>
        <Image source={{ uri: place.images[0]?.url }} style={styles.cardImage} />
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.8)']}
          style={styles.gradient}
        />
        
        <Pressable 
          style={styles.heartIcon} 
          onPress={() => toggleFavorite(place._id)}
        >
          <Ionicons 
            name={favorites.includes(place._id) ? "heart" : "heart-outline"} 
            size={20} 
            color={favorites.includes(place._id) ? "#FF4D4D" : "#ffffff"} 
          />
        </Pressable>

        <View style={styles.cardOverlayContent}>
          <View style={styles.locationTag}>
            <Ionicons name="location" size={10} color="#FFD166" />
            <Text style={styles.locationText}>{place.location}</Text>
          </View>
          <Text style={styles.placeName} numberOfLines={1}>{place.name}</Text>
          
          <View style={styles.ratingRow}>
            <Ionicons name="star" size={12} color="#FFD166" />
            <Text style={styles.ratingText}>{"4.8"}</Text>
            <Text style={styles.reviewsText}>{" (1.2k)"}</Text>
          </View>
        </View>
      </View>
    </Pressable>
  );

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        ListHeaderComponent={renderHeader()}
        data={filteredPlaces}
        keyExtractor={(item) => item._id}
        renderItem={renderDestinationCard}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          loading ? (
            <View style={styles.loadingState}>
              <ActivityIndicator size="large" color="#FFD166" />
              <Text style={styles.loadingText}>Loading gorgeous places...</Text>
            </View>
          ) : (
            <View style={styles.emptyState}>
              <View style={styles.emptyIconCircle}>
                <Ionicons name="map-outline" size={40} color="rgba(26, 59, 47, 0.2)" />
              </View>
              <Text style={styles.emptyStateTitle}>No results found</Text>
              <Text style={styles.emptyStateSubtitle}>
                Try adjusting your search or category filters.
              </Text>
            </View>
          )
        }
      />
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
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: '900',
    color: '#1A3B2F',
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(26, 59, 47, 0.4)',
    fontWeight: '700',
  },
  notificationBtn: {
    width: 44,
    height: 44,
    borderRadius: 15,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  searchBlur: {
    marginHorizontal: 24,
    borderRadius: 22,
    overflow: 'hidden',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  searchWrapper: {
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    paddingHorizontal: 16,
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1A3B2F',
    fontWeight: '700',
  },
  categoryBlur: {
    marginBottom: 8,
  },
  categoryScroll: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    gap: 12,
  },
  categoryPill: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.8)',
  },
  categoryPillActive: {
    backgroundColor: '#1A3B2F',
    borderColor: '#1A3B2F',
  },
  categoryText: {
    fontSize: 13,
    fontWeight: '800',
    color: 'rgba(26, 59, 47, 0.5)',
  },
  categoryTextActive: {
    color: '#ffffff',
  },
  content: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  row: {
    justifyContent: 'space-between',
  },
  card: {
    width: CARD_WIDTH,
    height: CARD_WIDTH * 1.4,
    marginBottom: 16,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: '#ffffff',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  cardImageWrapper: {
    flex: 1,
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  gradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '60%',
  },
  heartIcon: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardOverlayContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 14,
  },
  locationTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  locationText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#FFD166',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  placeName: {
    fontSize: 18,
    fontWeight: '900',
    color: '#ffffff',
    marginBottom: 4,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#ffffff',
    marginLeft: 4,
  },
  reviewsText: {
    fontSize: 10,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.7)',
  },
  loadingState: {
    width: width - 48,
    paddingVertical: 100,
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 14,
    fontWeight: '700',
    color: 'rgba(26, 59, 47, 0.3)',
  },
  emptyState: {
    width: width - 48,
    paddingVertical: 100,
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
});

