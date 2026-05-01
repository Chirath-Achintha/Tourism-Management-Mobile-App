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
} from "react-native";

const API_URL = "http://192.168.8.121:5000/api/reviews"; // change this IP

export default function ReviewsScreen() {
  const [userId, setUserId] = useState("user001");
  const [destinationId, setDestinationId] = useState("destination001");
  const [rating, setRating] = useState("");
  const [comment, setComment] = useState("");
  const [reviews, setReviews] = useState([]);
  const [editingId, setEditingId] = useState(null);

  const getReviews = async () => {
    try {
      const response = await fetch(API_URL);
      const data = await response.json();
      setReviews(data);
    } catch (error) {
      Alert.alert("Error", "Failed to load reviews");
    }
  };

  useEffect(() => {
    getReviews();
  }, []);

  const handleSubmit = async () => {
    if (!userId || !destinationId || !rating || !comment) {
      Alert.alert("Validation Error", "Please fill all fields");
      return;
    }

    if (Number(rating) < 1 || Number(rating) > 5) {
      Alert.alert("Validation Error", "Rating must be between 1 and 5");
      return;
    }

    const reviewData = {
      userId,
      destinationId,
      rating: Number(rating),
      comment,
    };

    try {
      const url = editingId ? `${API_URL}/${editingId}` : API_URL;
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

      setRating("");
      setComment("");
      setEditingId(null);
      getReviews();
    } catch (error) {
      Alert.alert("Error", "Failed to save review");
    }
  };

  const handleEdit = (review) => {
    setEditingId(review._id);
    setUserId(review.userId);
    setDestinationId(review.destinationId);
    setRating(String(review.rating));
    setComment(review.comment);
  };

  const handleDelete = async (id) => {
    try {
      const response = await fetch(`${API_URL}/${id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        Alert.alert("Error", data.message || "Delete failed");
        return;
      }

      Alert.alert("Success", "Review deleted successfully");
      getReviews();
    } catch (error) {
      Alert.alert("Error", "Failed to delete review");
    }
  };

return (
  <SafeAreaView style={styles.safeArea}>
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.title}>Review & Rating Management</Text>

      <View style={styles.card}>
        <Text style={styles.label}>User ID</Text>
        <TextInput
          style={styles.input}
          value={userId}
          onChangeText={setUserId}
          placeholder="Enter user ID"
        />

        <Text style={styles.label}>Destination ID</Text>
        <TextInput
          style={styles.input}
          value={destinationId}
          onChangeText={setDestinationId}
          placeholder="Enter destination ID"
        />

        <Text style={styles.label}>Rating 1 - 5</Text>
        <TextInput
          style={styles.input}
          value={rating}
          onChangeText={setRating}
          placeholder="Enter rating"
          keyboardType="numeric"
        />

        <Text style={styles.label}>Comment</Text>
        <TextInput
          style={[styles.input, styles.commentBox]}
          value={comment}
          onChangeText={setComment}
          placeholder="Enter your review"
          multiline
        />

        <TouchableOpacity style={styles.button} onPress={handleSubmit}>
          <Text style={styles.buttonText}>
            {editingId ? "Update Review" : "Add Review"}
          </Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.subTitle}>All Reviews</Text>

      <FlatList
        data={reviews}
        keyExtractor={(item) => item._id}
        scrollEnabled={false}
        renderItem={({ item }) => (
          <View style={styles.reviewCard}>
            <Text style={styles.reviewText}>User: {item.userId}</Text>
            <Text style={styles.reviewText}>
              Destination: {item.destinationId}
            </Text>
            <Text style={styles.reviewText}>Rating: ⭐ {item.rating}/5</Text>
            <Text style={styles.reviewText}>Comment: {item.comment}</Text>

            <View style={styles.actionRow}>
              <TouchableOpacity
                style={styles.editButton}
                onPress={() => handleEdit(item)}
              >
                <Text style={styles.actionText}>Edit</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => handleDelete(item._id)}
              >
                <Text style={styles.actionText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />
      </ScrollView>
  </SafeAreaView>
  );
}

const styles = StyleSheet.create({

  safeArea: {
    flex: 1,
    backgroundColor: "#f4f6f8",
  },

  container: {
    flex: 1,
    backgroundColor: "#f4f6f8",
  },

  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 28,
    paddingBottom: 90,
  },

  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 18,
    textAlign: "center",
    color: "#111",
  },
  card: {
    backgroundColor: "#ffffff",
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: "#cccccc",
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
    backgroundColor: "#ffffff",
  },
  commentBox: {
    height: 80,
    textAlignVertical: "top",
  },
  button: {
    backgroundColor: "#1e88e5",
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
  },
  buttonText: {
    color: "#ffffff",
    fontWeight: "bold",
    fontSize: 16,
  },
  subTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 10,
  },
  reviewCard: {
    backgroundColor: "#ffffff",
    padding: 14,
    borderRadius: 10,
    marginBottom: 12,
  },
  reviewText: {
    fontSize: 14,
    marginBottom: 4,
  },
  actionRow: {
    flexDirection: "row",
    marginTop: 10,
  },
  editButton: {
    backgroundColor: "#43a047",
    padding: 10,
    borderRadius: 8,
    marginRight: 10,
  },
  deleteButton: {
    backgroundColor: "#e53935",
    padding: 10,
    borderRadius: 8,
  },
  actionText: {
    color: "#ffffff",
    fontWeight: "bold",
  },
});