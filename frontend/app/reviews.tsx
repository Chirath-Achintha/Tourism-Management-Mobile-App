import React, { useEffect, useState, useMemo } from "react";
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Pressable,
  Alert,
  Dimensions,
} from "react-native";
import { useLocalSearchParams, useRouter, Stack } from "expo-router";

import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_BASE_URL } from "@/constants/api";
import { StatusBar } from "expo-status-bar";

// Import Premium Components
import { ReviewCard } from "@/components/reviews/ReviewCard";
import { RatingSummary } from "@/components/reviews/RatingSummary";
import { AddReviewModal } from "@/components/reviews/AddReviewModal";

const { width } = Dimensions.get('window');

const COLORS = {
  bg: '#F8FAFF',
  white: '#FFFFFF',
  text: '#1A3B2F',
  secondary: 'rgba(26, 59, 47, 0.5)',
  primary: '#1E88E5',
  accent: '#FFD166',
};

export default function ReviewsScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  
  const isManager = params.manager === 'true';
  const hotelId = params.hotelId as string;
  const destinationId = params.destinationId as string;

  const [userId, setUserId] = useState<string | null>(null);
  const [managerHotels, setManagerHotels] = useState<any[]>([]);
  const [selectedHotelId, setSelectedHotelId] = useState<string | null>(hotelId || null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingReview, setEditingReview] = useState<any | null>(null);
  const [isDropdownOpen, setDropdownOpen] = useState(false);


  const targetId = selectedHotelId || hotelId || destinationId;
  const targetType = selectedHotelId || hotelId ? 'hotel' : 'destination';

  const fetchUserData = async () => {
    try {
      const userData = await AsyncStorage.getItem('auth:user');

      if (userData) {
        const user = JSON.parse(userData);
        setUserId(user._id || user.id);
      }
    } catch (error) {
      console.error("Failed to load user data", error);
    }
  };

  const fetchManagerHotels = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('auth:token');
      const response = await fetch(`${API_BASE_URL}/hotels/my-hotels`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (response.ok && Array.isArray(data)) {
        setManagerHotels(data);
        if (data.length > 0 && !selectedHotelId) {
          setSelectedHotelId(data[0]._id);
        }
      }
    } catch (error) {
      console.error("Error fetching manager hotels:", error);
    } finally {
      setLoading(false);
    }
  };

  const getReviews = async () => {
    if (!targetId) return;
    try {
      setLoading(true);
      const url = `${API_BASE_URL}/reviews/${targetType}/${targetId}`;
      const response = await fetch(url);
      const data = await response.json();
      if (response.ok) {
        setReviews(data);
      } else {
        throw new Error(data.message || "Failed to fetch reviews");
      }
    } catch (error: any) {
      console.error("Fetch reviews error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserData();
    if (isManager) {
      fetchManagerHotels();
    }
  }, []);

  useEffect(() => {
    if (targetId) {
      getReviews();
    }
  }, [targetId]);


  // Calculate Statistics
  const stats = useMemo(() => {
    if (reviews.length === 0) return { average: 0, total: 0, happyTravelers: 0, satisfaction: 0 };
    
    const total = reviews.length;
    const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
    const average = sum / total;
    // Positive reviews = 3 stars or more
    const positiveCount = reviews.filter(r => r.rating >= 3).length;
    const satisfaction = Math.round((positiveCount / total) * 100);

    return { 
      average, 
      total, 
      happyTravelers: total, 
      satisfaction 
    };
  }, [reviews]);


  // Check if user has already reviewed
  const hasReviewed = useMemo(() => {
    if (!userId) return false;
    return reviews.some(r => (r.userId?._id || r.userId) === userId);
  }, [reviews, userId]);

  const handleDelete = async (reviewId: string) => {
    Alert.alert(
      "Delete Review",
      "Are you sure you want to remove your review? This action cannot be undone.",
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
                Alert.alert("Deleted", "Your review has been removed.");
                getReviews();
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

  const handleEdit = (review: any) => {
    setEditingReview(review);
    setModalVisible(true);
  };


  return (
    <SafeAreaView style={[styles.safeArea, isManager && { backgroundColor: '#F0FAF5' }]}>
      <Stack.Screen options={{ headerShown: false }} />

      <StatusBar style="dark" />
      
      {/* Header */}

      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color={COLORS.text} />
        </Pressable>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>Guest Experience</Text>
          <Text style={styles.subtitle}>Verified Reviews & Ratings</Text>
        </View>
      </View>

      <ScrollView 
        style={styles.container} 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {isManager && managerHotels.length > 0 && (
          <View style={styles.managerHotelsContainer}>
            <Text style={styles.managerHotelsTitle}>My Hotels</Text>
            <Pressable 
              style={styles.dropdownTrigger}
              onPress={() => setDropdownOpen(!isDropdownOpen)}
            >
              <Ionicons name="business-outline" size={18} color={COLORS.text} />
              <Text style={styles.dropdownValue}>
                {managerHotels.find(h => h._id === selectedHotelId)?.hotelName || "Select Hotel"}
              </Text>
              <Ionicons name={isDropdownOpen ? "chevron-up" : "chevron-down"} size={18} color={COLORS.text} />
            </Pressable>

            {isDropdownOpen && (
              <View style={styles.dropdownMenu}>
                {managerHotels.map((h: any) => {
                  const isSelected = h._id === selectedHotelId;
                  return (
                    <Pressable 
                      key={h._id} 
                      style={[styles.dropdownItem, isSelected && styles.dropdownItemActive]} 
                      onPress={() => {
                        setSelectedHotelId(h._id);
                        setDropdownOpen(false);
                      }}
                    >
                      <Ionicons name="business" size={16} color={isSelected ? COLORS.primary : COLORS.text} />
                      <Text style={[styles.dropdownItemText, isSelected && styles.dropdownItemTextActive]}>
                        {h.hotelName}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            )}
          </View>
        )}


        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={COLORS.primary} />
          </View>
        ) : (
          <>
            {/* Rating Summary Dashboard */}
            <RatingSummary 
              average={stats.average}
              total={stats.total}
              happyTravelers={stats.happyTravelers}
              satisfactionRate={stats.satisfaction}
            />


            {/* Write a Review Button (Conditional) */}
            {!isManager && !hasReviewed && userId && (
              <Pressable 

                style={styles.addReviewBtn} 
                onPress={() => setModalVisible(true)}
              >
                <LinearGradient
                  colors={['#1E88E5', '#1565C0']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.gradientBtn}
                >
                  <Ionicons name="create-outline" size={20} color="#FFF" />
                  <Text style={styles.addReviewText}>Write a Review</Text>
                </LinearGradient>
              </Pressable>
            )}

            {/* Reviews List */}
            <View style={styles.listHeader}>
              <Text style={styles.listTitle}>Recent Feedback</Text>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{reviews.length} Total</Text>
              </View>
            </View>

            {reviews.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="chatbubbles-outline" size={64} color="rgba(30, 136, 229, 0.1)" />
                <Text style={styles.emptyTitle}>No reviews yet</Text>
                <Text style={styles.emptySubtitle}>Be the first to share your experience!</Text>
              </View>
            ) : (
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false} 
                snapToInterval={width * 0.85 + 16}
                decelerationRate="fast"
                contentContainerStyle={styles.horizontalList}
              >
                {reviews.map((item) => {
                  const isOwner = (item.userId?._id || item.userId) === userId;
                  return (
                    <ReviewCard 
                      key={item._id} 
                      review={item} 
                      onEdit={isOwner ? () => handleEdit(item) : undefined}
                      onDelete={isOwner ? () => handleDelete(item._id) : undefined}
                    />
                  );
                })}

              </ScrollView>
            )}

            {/* Detailed Vertical List for SEO/Accessibility */}
            {reviews.length > 0 && (
              <View style={styles.verticalSection}>
                <Text style={styles.verticalTitle}>All Reviews</Text>
                {reviews.map((item) => {
                  const isOwner = (item.userId?._id || item.userId) === userId;
                  return (
                    <View key={`v-${item._id}`} style={styles.verticalItem}>
                      <ReviewCard 
                        review={item} 
                        onEdit={isOwner ? () => handleEdit(item) : undefined}
                        onDelete={isOwner ? () => handleDelete(item._id) : undefined}
                      />
                    </View>
                  );
                })}

              </View>
            )}
          </>
        )}
      </ScrollView>

      {/* Submission Modal */}
      <AddReviewModal 
        visible={modalVisible}
        onClose={() => {
          setModalVisible(false);
          setEditingReview(null);
        }}
        onSuccess={getReviews}
        targetId={targetId}
        targetType={targetType}
        initialData={editingReview}
      />

    </SafeAreaView>
  );
}

// Minimalistic Gradient shim since expo-linear-gradient is preferred
import { LinearGradient } from 'expo-linear-gradient';

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.03)',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F8FAFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: '900',
    color: COLORS.text,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 12,
    color: COLORS.secondary,
    fontWeight: '600',
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 100,
  },
  addReviewBtn: {
    marginBottom: 32,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#1E88E5',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
    elevation: 10,
  },
  gradientBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    gap: 10,
  },
  addReviewText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  listHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  listTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.text,
  },
  badge: {
    backgroundColor: 'rgba(30, 136, 229, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 10,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
  },
  horizontalList: {
    paddingBottom: 24,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    backgroundColor: COLORS.white,
    borderRadius: 32,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.03)',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.text,
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: COLORS.secondary,
    marginTop: 4,
  },
  verticalSection: {
    marginTop: 32,
  },
  verticalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 20,
  },
  verticalItem: {
    marginBottom: 16,
    width: '100%',
  },
  managerHotelsContainer: {
    marginBottom: 24,
    position: 'relative',
    zIndex: 100,
  },
  managerHotelsTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  dropdownTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 16,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: 'rgba(26, 59, 47, 0.08)',
    shadowColor: 'rgba(0,0,0,0.03)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 2,
  },
  dropdownValue: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
    marginLeft: 10,
  },
  dropdownMenu: {
    marginTop: 6,
    backgroundColor: COLORS.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(26, 59, 47, 0.08)',
    overflow: 'hidden',
    shadowColor: 'rgba(0,0,0,0.05)',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 20,
    elevation: 4,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.03)',
  },
  dropdownItemActive: {
    backgroundColor: 'rgba(30, 136, 229, 0.05)',
  },
  dropdownItemText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  dropdownItemTextActive: {
    fontWeight: '800',
    color: COLORS.primary,
  },
});
