import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Alert,
  Dimensions,
  SafeAreaView,
  StatusBar,
  TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '@/constants/api';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

const COLORS = {
  primary: '#1E88E5',
  bg: '#F8FAFF',
  white: '#FFFFFF',
  text: '#1A3B2F',
  secondary: 'rgba(26, 59, 47, 0.6)',
  danger: '#FF5252',
  star: '#FFD166',
  cardBg: '#FFFFFF',
};

export default function AdminReviewModeration() {
  const router = useRouter();
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRating, setSelectedRating] = useState<number | null>(null);

  const fetchAllReviews = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/reviews`);
      const data = await res.json();
      if (res.ok) {
        setReviews(data);
      }
    } catch (error) {
      console.error("Fetch all reviews failed:", error);
      Alert.alert("Error", "Could not load reviews for moderation.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllReviews();
  }, []);

  const handleDeleteReview = async (reviewId: string) => {
    Alert.alert(
      "Confirm Deletion",
      "Are you sure you want to permanently delete this review? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive",
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem('auth:token');
              const res = await fetch(`${API_BASE_URL}/reviews/${reviewId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
              });
              if (res.ok) {
                setReviews(prev => prev.filter(r => r._id !== reviewId));
                Alert.alert("Success", "Review deleted successfully.");
              } else {
                const data = await res.json();
                Alert.alert("Error", data.message || "Failed to delete review.");
              }
            } catch (error) {
              Alert.alert("Error", "Network error occurred.");
            }
          }
        }
      ]
    );
  };

  const filteredReviews = useMemo(() => {
    return reviews.filter(r => {
      const matchesSearch = 
        r.comment.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.userId?.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (r.hotelId?.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (r.destinationId?.name || '').toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesRating = selectedRating ? r.rating === selectedRating : true;
      
      return matchesSearch && matchesRating;
    });
  }, [reviews, searchQuery, selectedRating]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </Pressable>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Moderation</Text>
          <Text style={styles.headerSubtitle}>Community Reviews & Ratings</Text>
        </View>
        <Pressable onPress={fetchAllReviews} style={styles.refreshBtn}>
          <Ionicons name="refresh" size={20} color={COLORS.primary} />
        </Pressable>
      </View>

      {/* Search & Filters */}
      <View style={styles.filterSection}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color={COLORS.secondary} />
          <TextInput
            placeholder="Search by user, place or content..."
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery !== '' && (
            <Pressable onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={18} color={COLORS.secondary} />
            </Pressable>
          )}
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.ratingFilters}>
          <Pressable 
            style={[styles.filterTab, !selectedRating && styles.activeFilterTab]}
            onPress={() => setSelectedRating(null)}
          >
            <Text style={[styles.filterTabText, !selectedRating && styles.activeFilterTabText]}>All</Text>
          </Pressable>
          {[5, 4, 3, 2, 1].map(star => (
            <Pressable 
              key={star}
              style={[styles.filterTab, selectedRating === star && styles.activeFilterTab]}
              onPress={() => setSelectedRating(star)}
            >
              <Ionicons name="star" size={12} color={selectedRating === star ? '#FFF' : COLORS.star} />
              <Text style={[styles.filterTabText, selectedRating === star && styles.activeFilterTabText]}>{star}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Analyzing feedback...</Text>
        </View>
      ) : (
        <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statVal}>{reviews.length}</Text>
              <Text style={styles.statLabel}>Total Reviews</Text>
            </View>
            <View style={[styles.statBox, { borderLeftWidth: 1, borderRightWidth: 1, borderColor: '#E0E0E0' }]}>
              <Text style={[styles.statVal, { color: '#4CAF50' }]}>
                {(reviews.filter(r => r.rating >= 4).length / (reviews.length || 1) * 100).toFixed(0)}%
              </Text>
              <Text style={styles.statLabel}>Positive</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={[styles.statVal, { color: COLORS.danger }]}>
                {reviews.filter(r => r.rating <= 2).length}
              </Text>
              <Text style={styles.statLabel}>Critical</Text>
            </View>
          </View>

          {filteredReviews.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="shield-checkmark-outline" size={64} color="rgba(26, 59, 47, 0.05)" />
              <Text style={styles.emptyTitle}>Clear Horizon</Text>
              <Text style={styles.emptySubtitle}>No reviews match your current filters.</Text>
            </View>

          ) : (
            filteredReviews.map((item) => (
              <View key={item._id} style={styles.reviewCard}>
                <View style={styles.cardHeader}>
                  <View style={styles.userRow}>
                    <View style={styles.avatar}>
                      {item.userId?.profileImage ? (
                        <Image source={{ uri: item.userId.profileImage }} style={styles.avatarImg} />
                      ) : (
                        <Text style={styles.avatarText}>{item.userId?.fullName.charAt(0).toUpperCase()}</Text>
                      )}
                    </View>
                    <View>
                      <Text style={styles.userName}>{item.userId?.fullName || 'Anonymous'}</Text>
                      <Text style={styles.date}>{new Date(item.createdAt).toLocaleDateString()}</Text>
                    </View>
                  </View>
                  <Pressable onPress={() => handleDeleteReview(item._id)} style={styles.deleteBtn}>
                    <Ionicons name="trash-outline" size={20} color={COLORS.danger} />
                  </Pressable>
                </View>

                <View style={styles.targetBadge}>
                  <Ionicons 
                    name={item.hotelId ? "bed-outline" : "map-outline"} 
                    size={14} 
                    color={COLORS.primary} 
                  />
                  <Text style={styles.targetName}>
                    {item.hotelId?.name || item.destinationId?.name || 'Unknown Target'}
                  </Text>
                </View>

                <View style={styles.ratingRow}>
                  {[1, 2, 3, 4, 5].map(s => (
                    <Ionicons 
                      key={s} 
                      name={s <= item.rating ? "star" : "star-outline"} 
                      size={14} 
                      color={COLORS.star} 
                    />
                  ))}
                </View>

                <Text style={styles.comment}>{item.comment}</Text>

                {item.image && (
                  <Image source={{ uri: item.image }} style={styles.reviewImg} />
                )}
              </View>
            ))
          )}
          <View style={{ height: 40 }} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  backBtn: {
    padding: 8,
  },
  headerTitleContainer: {
    flex: 1,
    marginLeft: 10,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: COLORS.text,
  },
  headerSubtitle: {
    fontSize: 12,
    color: COLORS.secondary,
    fontWeight: '600',
  },
  refreshBtn: {
    padding: 8,
  },
  filterSection: {
    padding: 20,
    backgroundColor: COLORS.white,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F2F5',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
    marginBottom: 15,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 14,
    color: COLORS.text,
  },
  ratingFilters: {
    gap: 8,
  },
  filterTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F0F2F5',
    gap: 4,
  },
  activeFilterTab: {
    backgroundColor: COLORS.primary,
  },
  filterTabText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.secondary,
  },
  activeFilterTabText: {
    color: '#FFF',
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderRadius: 16,
    paddingVertical: 15,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statVal: {
    fontSize: 18,
    fontWeight: '900',
    color: COLORS.text,
  },
  statLabel: {
    fontSize: 10,
    color: COLORS.secondary,
    fontWeight: '700',
    marginTop: 2,
    textTransform: 'uppercase',
  },
  reviewCard: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.02)',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.text,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarImg: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  avatarText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '800',
  },
  userName: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.text,
  },
  date: {
    fontSize: 11,
    color: COLORS.secondary,
    fontWeight: '600',
  },
  deleteBtn: {
    padding: 4,
  },
  targetBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(30, 136, 229, 0.08)',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 10,
    gap: 4,
  },
  targetName: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
  },
  ratingRow: {
    flexDirection: 'row',
    gap: 2,
    marginBottom: 8,
  },
  comment: {
    fontSize: 14,
    color: COLORS.text,
    lineHeight: 20,
    fontWeight: '500',
  },
  reviewImg: {
    width: '100%',
    height: 150,
    borderRadius: 12,
    marginTop: 15,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
    color: COLORS.secondary,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.text,
    marginTop: 15,
  },
  emptySubtitle: {
    fontSize: 14,
    color: COLORS.secondary,
    textAlign: 'center',
    marginTop: 5,
  },
});
