import React, { useEffect, useState, useMemo } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  SafeAreaView, 
  Pressable, 
  Dimensions, 
  ActivityIndicator,
  RefreshControl
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { API_BASE_URL } from '@/constants/api';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48 - 16) / 2;
const FAVORITES_KEY = "wishlist:favorites";

export default function FavoritesScreen() {
  const [places, setPlaces] = useState<any[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  const fetchFavorites = async () => {
    try {
      const stored = await AsyncStorage.getItem(FAVORITES_KEY);
      if (stored) {
        setFavorites(JSON.parse(stored));
      }
    } catch (error) {
      console.error("Failed to load favorites", error);
    }
  };

  const fetchPlaces = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/destinations`);
      const data = await response.json();
      if (response.ok) {
        setPlaces(data);
      }
    } catch (error) {
      console.error("Failed to fetch places", error);
    }
  };

  const loadData = async (silent = false) => {
    if (!silent) setLoading(true);
    await Promise.all([fetchFavorites(), fetchPlaces()]);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const { useFocusEffect } = require('expo-router');
  useFocusEffect(
    React.useCallback(() => {
      loadData(true);
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData(true);
    setRefreshing(false);
  };

  const favoritePlaces = useMemo(() => {
    return places.filter(place => favorites.includes(place._id));
  }, [places, favorites]);

  const toggleFavorite = async (id: string) => {
    try {
      const newFavorites = favorites.includes(id)
        ? favorites.filter(f => f !== id)
        : [...favorites, id];
      
      setFavorites(newFavorites);
      await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(newFavorites));
    } catch (error) {
      console.error("Failed to update favorites", error);
    }
  };

  const renderItem = ({ item: place }: { item: any }) => (
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
            <Text style={styles.ratingText}>
              {place.averageRating > 0 ? place.averageRating.toFixed(1) : "4.8"}
            </Text>
            <Text style={styles.reviewsText}>
              {place.totalReviews > 0 ? ` (${place.totalReviews})` : " (1.2k)"}
            </Text>
          </View>
        </View>
      </View>
    </Pressable>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FFD166" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Wishlist</Text>
          <Text style={styles.subtitle}>{favoritePlaces.length} destinations saved</Text>
        </View>
        <View style={styles.wishlistIcon}>
          <Ionicons name="heart" size={24} color="#1A3B2F" />
        </View>
      </View>

      <FlatList
        data={favoritePlaces}
        keyExtractor={(item) => item._id}
        renderItem={renderItem}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FFD166" />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <View style={styles.emptyIconCircle}>
              <Ionicons name="heart-outline" size={40} color="rgba(26, 59, 47, 0.2)" />
            </View>
            <Text style={styles.emptyStateTitle}>Your wishlist is empty</Text>
            <Text style={styles.emptyStateSubtitle}>
              Tap the heart icon on any destination to save it here for your next adventure.
            </Text>
            <Pressable 
              style={styles.exploreBtn}
              onPress={() => router.push('/(tabs)/explore' as any)}
            >
              <Text style={styles.exploreBtnText}>Explore Destinations</Text>
            </Pressable>
          </View>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F0FAF5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 24,
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
    fontWeight: '700',
  },
  wishlistIcon: {
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
  listContent: {
    paddingHorizontal: 24,
    paddingBottom: 40,
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
  emptyState: {
    alignItems: 'center',
    paddingVertical: 100,
  },
  emptyIconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(26, 59, 47, 0.03)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#1A3B2F',
    marginBottom: 8,
  },
  emptyStateSubtitle: {
    fontSize: 15,
    color: 'rgba(26, 59, 47, 0.4)',
    fontWeight: '600',
    textAlign: 'center',
    paddingHorizontal: 40,
    lineHeight: 22,
    marginBottom: 32,
  },
  exploreBtn: {
    backgroundColor: '#1A3B2F',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 20,
    shadowColor: '#1A3B2F',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  exploreBtnText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
  }
});
