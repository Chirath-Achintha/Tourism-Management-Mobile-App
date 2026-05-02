import React, { useEffect, useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Alert,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Platform,
  Pressable,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_BASE_URL } from "@/constants/api";
import { StatusBar } from "expo-status-bar";

const AUTH_USER_KEY = "auth:user";

const COLORS = {
  bg: '#f4f6f8',
  accent: '#FFD166',
  text: '#1A2432',
  secondary: '#64748b',
  white: '#ffffff',
  primary: '#1e88e5',
  success: '#43a047',
  danger: '#e53935',
  star: '#FFD166',
};

export default function ReviewsScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  
  const [userId, setUserId] = useState("");
  const [destinationId, setDestinationId] = useState((params.destinationId as string) || "");
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [reviews, setReviews] = useState<any[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const fetchUserData = async () => {
    try {
      const userData = await AsyncStorage.getItem(AUTH_USER_KEY);
      if (userData) {
        const user = JSON.parse(userData);
        setUserId(user._id || user.id || "guest");
      }
    } catch (error) {
      console.error("Failed to load user data", error);
    }
  };

  const getReviews = async () => {
    try {
      setLoading(true);
      const url = destinationId 
        ? `${API_BASE_URL}/reviews/destination/${destinationId}`
        : `${API_BASE_URL}/reviews`;
        
      const response = await fetch(url);
      const data = await response.json();
      if (response.ok) {
        setReviews(data);
      } else {
        throw new Error(data.message || "Failed to fetch reviews");
      }
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to load reviews");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserData();
    getReviews();
  }, [destinationId]);

  const handleSubmit = async () => {
    if (!rating || !comment.trim()) {
      Alert.alert("Validation Error", "Please provide a rating and a comment");
      return;
    }

    setSubmitting(true);
    const reviewData = {
      userId,
      destinationId,
      rating,
      comment: comment.trim(),
    };

    try {
      const url = editingId ? `${API_BASE_URL}/reviews/${editingId}` : `${API_BASE_URL}/reviews`;
      const method = editingId ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(reviewData),
      });

      const data = await response.json();

      if (!response.ok) {
        Alert.alert("Error", data.message || "Something went wrong");
        return;
      }

      Alert.alert(
        "Success",
        editingId ? "Review updated successfully" : "Review added successfully"
      );

      setRating(0);
      setComment("");
      setEditingId(null);
      getReviews();
    } catch (error) {
      Alert.alert("Error", "Failed to save review");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (review: any) => {
    setEditingId(review._id);
    setRating(review.rating);
    setComment(review.comment);
    // Scroll to top or show modal if needed, for now just set states
  };

  const handleDelete = (id: string) => {
    Alert.alert(
      "Delete Review",
      "Are you sure you want to delete this review?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive",
          onPress: async () => {
            try {
              const response = await fetch(`${API_BASE_URL}/reviews/${id}`, {
                method: "DELETE",
              });
              if (response.ok) {
                Alert.alert("Success", "Review deleted successfully");
                getReviews();
              } else {
                const data = await response.json();
                Alert.alert("Error", data.message || "Delete failed");
              }
            } catch (error) {
              Alert.alert("Error", "Failed to delete review");
            }
          }
        }
      ]
    );
  };

  const renderStarPicker = () => (
    <View style={styles.starContainer}>
      {[1, 2, 3, 4, 5].map((star) => (
        <TouchableOpacity key={star} onPress={() => setRating(star)}>
          <Ionicons
            name={star <= rating ? "star" : "star-outline"}
            size={32}
            color={star <= rating ? COLORS.star : COLORS.secondary}
            style={styles.starIcon}
          />
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderReviewItem = ({ item }: { item: any }) => (
    <View style={styles.reviewCard}>
      <View style={styles.reviewHeader}>
        <View style={styles.userInfo}>
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarText}>{item.userId?.substring(0, 2).toUpperCase()}</Text>
          </View>
          <View>
            <Text style={styles.userName}>User {item.userId?.substring(0, 6)}</Text>
            <Text style={styles.dateText}>{new Date(item.createdAt).toLocaleDateString()}</Text>
          </View>
        </View>
        <View style={styles.ratingBadge}>
          <Ionicons name="star" size={14} color={COLORS.star} />
          <Text style={styles.ratingValue}>{item.rating}</Text>
        </View>
      </View>
      
      <Text style={styles.commentText}>{item.comment}</Text>

      {item.userId === userId && (
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => handleEdit(item)}
          >
            <Ionicons name="pencil" size={16} color={COLORS.white} />
            <Text style={styles.actionText}>Edit</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => handleDelete(item._id)}
          >
            <Ionicons name="trash" size={16} color={COLORS.white} />
            <Text style={styles.actionText}>Delete</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </Pressable>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Reviews & Ratings</Text>
          {destinationId && (
            <Text style={styles.headerSubtitle}>For Destination: {destinationId.substring(0, 8)}</Text>
          )}
        </View>
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.inputCard}>
          <Text style={styles.inputTitle}>
            {editingId ? "Update your experience" : "Share your experience"}
          </Text>
          
          <Text style={styles.label}>Your Rating</Text>
          {renderStarPicker()}

          <Text style={styles.label}>Your Comment</Text>
          <TextInput
            style={[styles.input, styles.commentBox]}
            value={comment}
            onChangeText={setComment}
            placeholder="What did you think of this place?"
            placeholderTextColor={COLORS.secondary}
            multiline
          />

          <TouchableOpacity 
            style={[styles.submitButton, submitting && styles.disabledButton]} 
            onPress={handleSubmit}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <Text style={styles.submitButtonText}>
                {editingId ? "Update Review" : "Post Review"}
              </Text>
            )}
          </TouchableOpacity>
          
          {editingId && (
            <TouchableOpacity 
              style={styles.cancelButton} 
              onPress={() => {
                setEditingId(null);
                setRating(0);
                setComment("");
              }}
            >
              <Text style={styles.cancelButtonText}>Cancel Edit</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.reviewsSection}>
          <Text style={styles.sectionTitle}>Guest Reviews</Text>
          
          {loading ? (
            <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 20 }} />
          ) : reviews.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="chatbubbles-outline" size={48} color={COLORS.secondary} />
              <Text style={styles.emptyText}>No reviews yet. Be the first!</Text>
            </View>
          ) : (
            <FlatList
              data={reviews}
              keyExtractor={(item) => item._id}
              scrollEnabled={false}
              renderItem={renderReviewItem}
              contentContainerStyle={styles.reviewsList}
            />
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
    backgroundColor: COLORS.white,
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  headerTitleContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: COLORS.text,
  },
  headerSubtitle: {
    fontSize: 12,
    color: COLORS.secondary,
    fontWeight: "600",
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  inputCard: {
    backgroundColor: COLORS.white,
    padding: 20,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
    marginBottom: 24,
  },
  inputTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: COLORS.text,
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: 8,
    marginTop: 8,
  },
  starContainer: {
    flexDirection: "row",
    marginBottom: 16,
  },
  starIcon: {
    marginRight: 8,
  },
  input: {
    backgroundColor: COLORS.bg,
    borderRadius: 12,
    padding: 12,
    fontSize: 15,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  commentBox: {
    height: 100,
    textAlignVertical: "top",
    marginBottom: 20,
  },
  submitButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  disabledButton: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: COLORS.white,
    fontWeight: "800",
    fontSize: 16,
  },
  cancelButton: {
    marginTop: 12,
    alignItems: "center",
  },
  cancelButtonText: {
    color: COLORS.danger,
    fontWeight: "600",
  },
  reviewsSection: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: COLORS.text,
    marginBottom: 16,
  },
  reviewsList: {
    gap: 16,
  },
  reviewCard: {
    backgroundColor: COLORS.white,
    padding: 16,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 5,
    elevation: 1,
  },
  reviewHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  avatarPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: "700",
  },
  userName: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.text,
  },
  dateText: {
    fontSize: 11,
    color: COLORS.secondary,
  },
  ratingBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: 'rgba(255, 209, 102, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  ratingValue: {
    fontSize: 12,
    fontWeight: "800",
    color: '#d4a017',
  },
  commentText: {
    fontSize: 14,
    color: COLORS.text,
    lineHeight: 20,
    marginBottom: 12,
  },
  actionRow: {
    flexDirection: "row",
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
    paddingTop: 12,
  },
  editButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: COLORS.success,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  deleteButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: COLORS.danger,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  actionText: {
    color: COLORS.white,
    fontWeight: "700",
    fontSize: 12,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
    gap: 12,
  },
  emptyText: {
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.secondary,
  },
});