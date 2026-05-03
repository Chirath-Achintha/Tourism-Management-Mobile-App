import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Dimensions,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  FlatList,
  Linking,
  Platform,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { API_BASE_URL } from '@/constants/api';
import * as WebBrowser from 'expo-web-browser';
import { Animated } from 'react-native';

// Import Premium Components
import { ReviewCard } from '@/components/reviews/ReviewCard';
import { RatingSummary } from '@/components/reviews/RatingSummary';
import { AddReviewModal } from '@/components/reviews/AddReviewModal';


const { width, height } = Dimensions.get('window');

export default function DestinationDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [destination, setDestination] = useState<any>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [packages, setPackages] = useState<any[]>([]);
  const [isFavorite, setIsFavorite] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollY = React.useRef(new Animated.Value(0)).current;
  const HEADER_HEIGHT = height * 0.5;
  const [modalVisible, setModalVisible] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [editingReview, setEditingReview] = useState<any | null>(null);

  const FAVORITES_KEY = "wishlist:favorites";

  const fetchUserData = async () => {
    try {
      const [userData, favData] = await Promise.all([
        AsyncStorage.getItem('auth:user'),
        AsyncStorage.getItem(FAVORITES_KEY)
      ]);
      
      if (userData) {
        const user = JSON.parse(userData);
        setUserId(user._id || user.id);
      }

      if (favData) {
        const favs = JSON.parse(favData);
        setIsFavorite(favs.includes(id));
      }
    } catch (error) {
      console.error("Failed to load user data", error);
    }
  };

  const toggleFavorite = async () => {
    try {
      const stored = await AsyncStorage.getItem(FAVORITES_KEY);
      let favs = stored ? JSON.parse(stored) : [];
      
      if (favs.includes(id)) {
        favs = favs.filter((f: string) => f !== id);
        setIsFavorite(false);
      } else {
        favs.push(id);
        setIsFavorite(true);
      }
      
      await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(favs));
    } catch (error) {
      console.error("Failed to update favorite", error);
    }
  };

  const fetchDestination = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const [destRes, reviewsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/destinations/${id}`),
        fetch(`${API_BASE_URL}/reviews/destination/${id}`)
      ]);
      
      const destData = await destRes.json();
      const reviewsData = await reviewsRes.json();

      if (destRes.ok) setDestination(destData);
      if (reviewsRes.ok) setReviews(reviewsData);
    } catch (error) {
      console.error("Fetch destination details failed:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchDestination();
      fetchUserData();
    }
  }, [id]);

  const handleDeleteReview = async (reviewId: string) => {
    Alert.alert(
      "Delete Review",
      "Are you sure you want to remove your review?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive",
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem('auth:token');
              const response = await fetch(`${API_BASE_URL}/reviews/${reviewId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
              });
              if (response.ok) {
                fetchDestination(true);
              } else {
                const data = await response.json();
                Alert.alert("Error", data.message || "Failed to delete review");
              }
            } catch (error) {
              Alert.alert("Error", "Network error occurred");
            }
          }
        }
      ]
    );
  };

  const handleEditReview = (review: any) => {
    setEditingReview(review);
    setModalVisible(true);
  };



  // Calculate Stats
  const reviewStats = React.useMemo(() => {
    if (reviews.length === 0) return { average: 0, total: 0, happyTravelers: 0, satisfaction: 0 };
    const total = reviews.length;
    const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
    const average = sum / total;
    // Happy travelers = anyone who left a positive review (3+ stars)
    const happy = reviews.filter(r => r.rating >= 3).length;
    // Satisfaction rate = percentage of 3+ star reviews
    const satisfaction = Math.round((happy / total) * 100);
    
    return { 
      average, 
      total, 
      happyTravelers: happy, // Correctly show count of satisfied travelers (3+ stars)
      satisfaction 
    };
  }, [reviews]);



  useEffect(() => {
    const fetchPackages = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/tour-packages`);
        const data = await response.json();
        if (response.ok) {
          setPackages(Array.isArray(data) ? data : []);
        }
      } catch (error) {
        console.error('Fetch packages failed:', error);
      }
    };

    fetchPackages();
  }, []);

  const relatedPackages = useMemo(() => {
    if (!destination || !id) return [];

    const destinationId = String(id);
    const destinationName = String(destination.name || '').trim().toLowerCase();
    const normalize = (value: any) => String(value || '').trim().toLowerCase();

    return packages.filter((item) => {
      const itemDestinationId = String(item?.destinationId?._id || item?.destinationId || '').trim();
      const selectedDestinations = Array.isArray(item?.destinations) ? item.destinations : [];
      const matchedSelectedDestination = selectedDestinations.some((name: any) => normalize(name) === destinationName);
      const matchedDestinationName = normalize(item?.destination) === destinationName;
      return itemDestinationId === destinationId || matchedSelectedDestination || matchedDestinationName;
    });
  }, [destination, id, packages]);

  const handleScroll = (event: any) => {
    const slideSize = event.nativeEvent.layoutMeasurement.width;
    const index = event.nativeEvent.contentOffset.x / slideSize;
    setActiveIndex(Math.round(index));
  };

  const headerTranslate = scrollY.interpolate({
    inputRange: [0, HEADER_HEIGHT],
    outputRange: [0, -HEADER_HEIGHT / 3],
    extrapolate: 'clamp',
  });

  const headerScale = scrollY.interpolate({
    inputRange: [-HEADER_HEIGHT, 0],
    outputRange: [2, 1],
    extrapolate: 'clamp',
  });

  const headerOpacity = scrollY.interpolate({
    inputRange: [0, HEADER_HEIGHT / 2, HEADER_HEIGHT],
    outputRange: [1, 1, 0],
    extrapolate: 'clamp',
  });

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FFD166" />
      </View>
    );
  }

  if (!destination) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Destination not found</Text>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>Go Back</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      
      {/* Sticky Header Actions */}
      <SafeAreaView style={styles.headerActions} pointerEvents="box-none">
        <Pressable style={styles.iconCircle} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color="#1A3B2F" />
        </Pressable>
        <Pressable style={styles.iconCircle} onPress={toggleFavorite}>
          <Ionicons 
            name={isFavorite ? "heart" : "heart-outline"} 
            size={24} 
            color={isFavorite ? "#FF4D4D" : "#1A3B2F"} 
          />
        </Pressable>
      </SafeAreaView>
      
      <Animated.ScrollView 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={styles.scrollContent}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
      >
        {/* Parallax Header Carousel */}
        <Animated.View style={[
          styles.headerContainer, 
          { 
            height: HEADER_HEIGHT,
            transform: [
              { 
                translateY: scrollY.interpolate({
                  inputRange: [0, HEADER_HEIGHT],
                  outputRange: [0, HEADER_HEIGHT * 0.6],
                  extrapolate: 'clamp'
                }) 
              },
              { scale: headerScale }
            ],
            opacity: headerOpacity
          }
        ]}>
          <FlatList
            data={destination.images}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={handleScroll}
            scrollEventThrottle={16}
            keyExtractor={(item, index) => index.toString()}
            nestedScrollEnabled={true}
            renderItem={({ item }) => (
              <Image 
                source={{ uri: item.url }} 
                style={[styles.carouselImage, { height: HEADER_HEIGHT }]}
                contentFit="cover"
              />
            )}
          />
          <LinearGradient
            colors={['rgba(0,0,0,0.3)', 'transparent', 'rgba(0,0,0,0.6)']}
            style={styles.headerGradient}
            pointerEvents="none"
          />

          {/* Pagination Dots */}
          <View style={styles.pagination}>
            {destination.images.length > 1 && destination.images.map((_: any, i: number) => (
              <View 
                key={i} 
                style={[
                  styles.dot, 
                  activeIndex === i ? styles.activeDot : styles.inactiveDot
                ]} 
              />
            ))}
          </View>
        </Animated.View>

        {/* Floating Title Area (Consistently aligned to card top) */}
        <View style={styles.parallaxHeaderContent}>
          <View style={styles.floatingTitleContainer}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <Text 
                style={[
                  styles.parallaxName,
                  destination.name.length > 15 && { fontSize: 35, lineHeight: 40 },
                  destination.name.length > 25 && { fontSize: 32, lineHeight: 36 }
                ]}
                numberOfLines={3}
              >
                {destination.name}
              </Text>
            </View>
            <View style={styles.parallaxLocationRow}>
              <Ionicons name="location" size={16} color="#FFD166" />
              <Text style={styles.parallaxLocationText}>{destination.location}</Text>
            </View>
          </View>

          {/* Details Section (White Card) */}
          <View style={styles.detailsContainer}>
            <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <View style={[styles.statIcon, { backgroundColor: '#FFF9E6' }]}>
                <Ionicons name="star" size={20} color="#FFD166" />
              </View>
              <View>
                <Text style={styles.statValue}>{reviewStats.total > 0 ? reviewStats.average.toFixed(1) : "4.8"}</Text>
                <Text style={styles.statLabel}>Rating</Text>
              </View>

            </View>
            <View style={styles.statItem}>
              <View style={[styles.statIcon, { backgroundColor: '#F0F7FF' }]}>
                <Ionicons name="calendar-outline" size={20} color="#1565C0" />
              </View>
              <View>
                <Text style={styles.statValue}>{destination.bestTimeToVisit || "Year-round"}</Text>
                <Text style={styles.statLabel}>Best Time</Text>
              </View>
            </View>
            <View style={styles.statItem}>
              <View style={[styles.statIcon, { backgroundColor: '#FFF0F0' }]}>
                <Ionicons name="thermometer-outline" size={20} color="#FF4D4D" />
              </View>
              <View>
                <Text style={styles.statValue}>{destination.averageTemp || "24°C"}</Text>
                <Text style={styles.statLabel}>Temp</Text>
              </View>
            </View>
          </View>

          <View style={styles.aboutHeader}>
            <Text style={styles.sectionTitle}>About this place</Text>
            <Pressable 
              style={styles.locationBadge}
              onPress={async () => {
                const query = encodeURIComponent(`${destination.name}, ${destination.location}`);
                const url = `https://www.google.com/maps/search/?api=1&query=${query}`;
                try {
                  await WebBrowser.openBrowserAsync(url);
                } catch (error) {
                  console.error("Error opening map:", error);
                  Linking.openURL(url);
                }
              }}
            >
              <Ionicons name="location" size={14} color="#FFD166" />
              <Text style={styles.locationBadgeText}>VIEW ON MAP</Text>
            </Pressable>
          </View>
          <View style={styles.categoryInfo}>
            <View style={styles.categoryRowList}>
              {(destination.categories || []).map((cat: string, index: number) => (
                <View key={index} style={styles.categoryBadge}>
                  <Text style={styles.categoryText}>{cat}</Text>
                </View>
              ))}
            </View>
          </View>
          <Text style={styles.description}>{destination.description}</Text>


          <View style={styles.mapContainer}>
            <Pressable 
              style={styles.simpleMapBtn}
              onPress={() => router.push(`/tourist-hotels?district=${encodeURIComponent(destination.location)}` as any)}
            >
              <Ionicons name="bed-outline" size={24} color="#1A3B2F" />
              <View style={{ flex: 1 }}>
                <Text style={styles.mapBtnTitle}>Nearby Hotels</Text>
                <Text style={styles.mapBtnSub}>Explore stays in {destination.location}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#1A3B2F" />
            </Pressable>
          </View>

          {/* Reviews Section */}
          <View style={styles.reviewsContainer}>
            <View style={styles.reviewHeaderRow}>
              <Text style={styles.sectionTitle}>Reviews</Text>
              <Pressable 
                style={styles.addReviewBtn}
                onPress={() => setModalVisible(true)}
              >
                <Ionicons name="add" size={20} color="#1A3B2F" />
                <Text style={styles.addReviewText}>Write a Review</Text>
              </Pressable>
            </View>

            <RatingSummary 
              average={reviewStats.average} 
              total={reviewStats.total} 
              happyTravelers={reviewStats.happyTravelers}
              satisfactionRate={reviewStats.satisfaction}
            />

            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false} 
              contentContainerStyle={styles.reviewsHorizontalList}
              snapToInterval={Dimensions.get('window').width * 0.75 + 16}
              decelerationRate="fast"
              snapToAlignment="center"
              scrollEventThrottle={16}
            >
              {/* Spacer to center the first item */}
              <View style={{ width: Dimensions.get('window').width * 0.125 - 16 }} />
              
              {reviews.length > 0 ? (
                reviews.map((review) => (
                  <View key={review._id} style={styles.horizontalReviewWrapper}>
                    <ReviewCard 
                      review={review} 
                      currentUserId={userId}
                      onDelete={() => handleDeleteReview(review._id)}
                      onEdit={() => handleEditReview(review)}
                    />
                  </View>
                ))
              ) : (
                <View style={styles.emptyReviews}>
                  <Ionicons name="chatbox-outline" size={48} color="rgba(26, 59, 47, 0.1)" />
                  <Text style={styles.emptyReviewsText}>No reviews yet. Be the first to share your experience!</Text>
                </View>
              )}

              {/* Spacer to center the last item */}
              <View style={{ width: Dimensions.get('window').width * 0.125 - 16 }} />
            </ScrollView>
          </View>

          <View style={{ height: 120 }} />
        </View>
      </View>
      </Animated.ScrollView>

      {/* Submission Modal */}
      <AddReviewModal 
        visible={modalVisible}
        onClose={() => {
          setModalVisible(false);
          setEditingReview(null);
        }}
        onSuccess={() => fetchDestination(true)}
        targetId={id as string}
        targetType="destination"
        targetName={destination?.name}
        initialData={editingReview}
      />
      <BlurView intensity={90} tint="light" style={styles.footer}>
        <View style={styles.footerContent}>

          <Pressable
            style={styles.bookBtn}
            onPress={() =>
              router.push(
                `/tour-packages?destinationId=${encodeURIComponent(String(id))}&destinationName=${encodeURIComponent(destination?.name || '')}&location=${encodeURIComponent(destination?.location || '')}` as any
              )
            }
          >
            <Text style={styles.bookBtnText}>Explore Tour Packages</Text>
          </Pressable>
        </View>

      </BlurView>
    </View>
  );
}



const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  headerContainer: {
    width: '100%',
    overflow: 'hidden',
  },
  headerImage: {
    ...StyleSheet.absoluteFillObject,
  },
  carouselImage: {
    width: width,
    height: height * 0.55,
  },
  headerGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  headerActions: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginTop: 10,
    zIndex: 20,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  headerTitleContainer: {
    position: 'absolute',
    bottom: 45,
    left: 24,
    right: 24,
    zIndex: 15,
  },
  locationTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  locationText: {
    color: '#FFD166',
    fontSize: 14,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  parallaxHeaderContent: {
    marginTop: -160, // Adjust this to control how much title space you want on the image
    zIndex: 10,
  },
  floatingTitleContainer: {
    paddingHorizontal: 24,
    marginBottom: 24,
    minHeight: 100,
    justifyContent: 'flex-end',
  },
  parallaxName: {
    color: '#ffffff',
    fontSize: 38,
    fontWeight: '900',
    letterSpacing: -0.5,
    lineHeight: 44,
    textShadowColor: 'rgba(0, 0, 0, 0.4)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 12,
  },
  parallaxLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 4,
  },
  parallaxLocationText: {
    fontSize: 16,
    color: '#FFD166',
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  pagination: {
    position: 'absolute',
    bottom: 80,
    right: 24,
    flexDirection: 'row',
    gap: 6,
    zIndex: 15,
  },
  dot: {
    height: 6,
    borderRadius: 3,
  },
  activeDot: {
    width: 20,
    backgroundColor: '#FFD166',
  },
  inactiveDot: {
    width: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  detailsContainer: {
    padding: 24,
    paddingTop: 36,
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 32,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statValue: {
    fontSize: 14,
    fontWeight: '900',
    color: '#1A3B2F',
  },
  statLabel: {
    fontSize: 11,
    color: 'rgba(26, 59, 47, 0.4)',
    fontWeight: '700',
  },
  aboutHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  locationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 209, 102, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    gap: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 209, 102, 0.3)',
  },
  locationBadgeText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#1A3B2F',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#1A3B2F',
  },
  description: {
    fontSize: 15,
    color: 'rgba(26, 59, 47, 0.7)',
    lineHeight: 22,
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'justify',
  },
  packageSection: {
    marginBottom: 8,
  },
  packageScroll: {
    paddingTop: 6,
    paddingBottom: 4,
    gap: 12,
  },
  packageCard: {
    width: 180,
    borderRadius: 20,
    backgroundColor: '#F7F9F4',
    borderWidth: 1,
    borderColor: 'rgba(26, 59, 47, 0.08)',
    padding: 14,
  },
  packageCardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1A3B2F',
    marginBottom: 8,
  },
  packageCardMeta: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 2,
  },
  packageEmptyText: {
    color: '#64748b',
    fontSize: 14,
    marginTop: 4,
  },
  categoryInfo: {
    marginTop: 8,
    marginBottom: 20,
  },
  categoryRowList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  categoryLabel: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1A3B2F',
  },
  categoryBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#F0FAF5',
    borderWidth: 1,
    borderColor: 'rgba(26, 59, 47, 0.1)',
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#1A3B2F',
    textTransform: 'capitalize',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingBottom: 40,
    paddingTop: 20,
    paddingHorizontal: 24,
  },
  footerContent: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  priceLabel: {
    fontSize: 12,
    color: 'rgba(26, 59, 47, 0.5)',
    fontWeight: '700',
  },
  priceValue: {
    fontSize: 24,
    fontWeight: '900',
    color: '#1A3B2F',
  },
  perPerson: {
    fontSize: 14,
    color: 'rgba(26, 59, 47, 0.4)',
    fontWeight: '600',
  },
  bookBtn: {
    backgroundColor: '#1A3B2F',
    paddingHorizontal: 40,
    paddingVertical: 18,
    borderRadius: 24,
    shadowColor: '#1A3B2F',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
    width: '100%',
    alignItems: 'center',
  },
  bookBtnText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '900',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A3B2F',
    marginBottom: 20,
  },
  backBtn: {
    backgroundColor: '#FFD166',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  backBtnText: {
    fontWeight: '800',
    color: '#1A3B2F',
  },
  mapContainer: {
    marginTop: 32,
  },
  simpleMapBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 20,
    marginTop: 12,
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(26, 59, 47, 0.1)',
  },
  mapBtnTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A3B2F',
  },
  mapBtnSub: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  titleSection: {
    marginBottom: 24,
  },
  reviewsContainer: {
    marginTop: 32,
  },
  reviewHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  addReviewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFD166',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    gap: 4,
  },
  addReviewText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#1A3B2F',
  },
  reviewsHorizontalList: {
    marginTop: 16,
    gap: 16,
  },
  horizontalReviewWrapper: {
    // Width is handled by the ReviewCard component
  },
  emptyReviews: {
    alignItems: 'center',
    paddingVertical: 40,
    backgroundColor: '#F7F9F4',
    borderRadius: 24,
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(26, 59, 47, 0.05)',
  },
  emptyReviewsText: {
    fontSize: 14,
    color: 'rgba(26, 59, 47, 0.4)',
    fontWeight: '600',
    textAlign: 'center',
    paddingHorizontal: 40,
  },
});


