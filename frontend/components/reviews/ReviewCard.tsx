import React from 'react';
import { View, Text, StyleSheet, Image, Dimensions, Pressable } from 'react-native';

import { Ionicons } from '@expo/vector-icons';
import { API_BASE_URL } from '@/constants/api';

const { width } = Dimensions.get('window');

interface ReviewCardProps {
  review: {
    _id?: string;
    userId: {
      _id?: string;
      fullName: string;
      profileImage?: string;
    };
    rating: number;
    comment: string;
    image?: string;
    createdAt: string;
  };
  onEdit?: () => void;
  onDelete?: () => void;
}

export const ReviewCard: React.FC<ReviewCardProps> = ({ review, onEdit, onDelete }) => {

  const cleanBaseUrl = API_BASE_URL.replace('/api', '');
  
  const userAvatar = review.userId?.profileImage 
    ? { uri: review.userId.profileImage.startsWith('http') ? review.userId.profileImage : `${cleanBaseUrl}${review.userId.profileImage}` }
    : null;

  const reviewPhoto = review.image 
    ? { uri: review.image.startsWith('http') ? review.image : `${cleanBaseUrl}${review.image}` }
    : null;

  const initials = review.userId?.fullName?.charAt(0).toUpperCase() || 'U';

  return (
    <View style={styles.container}>


      {(onEdit || onDelete) && (
        <View style={styles.actionButtons}>
          {onEdit && (
            <Pressable onPress={onEdit} style={styles.actionBtn}>
              <Ionicons name="pencil" size={18} color="rgba(26, 59, 47, 0.4)" />
            </Pressable>
          )}
          {onDelete && (
            <Pressable onPress={onDelete} style={styles.actionBtn}>
              <Ionicons name="trash-outline" size={18} color="#FF5252" />
            </Pressable>
          )}
        </View>
      )}


      <Text style={styles.comment}>{review.comment || "nice 👍"}</Text>

      {reviewPhoto && (
        <Image source={reviewPhoto} style={styles.reviewImage} />
      )}

      <View style={styles.userInfo}>
        <View style={styles.avatar}>
          {userAvatar ? (
            <Image source={userAvatar} style={styles.avatarImage} />
          ) : (
            <Text style={styles.avatarText}>{initials}</Text>
          )}
        </View>
        <Text style={styles.userName}>{review.userId?.fullName || 'Anonymous'}</Text>
        <View style={styles.starsRow}>
          {[1, 2, 3, 4, 5].map((star) => (
            <Ionicons 
              key={star} 
              name={star <= review.rating ? "star" : "star-outline"} 
              size={12} 
              color="#FFD166" 
            />
          ))}
        </View>
        <Text style={styles.date}>{new Date(review.createdAt).toLocaleDateString().replace(/\//g, '-')}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 32,
    padding: 24,
    width: width * 0.85,
    marginRight: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 5,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.02)',
    position: 'relative',
    overflow: 'hidden',
  },
  comment: {

    fontSize: 18,
    fontWeight: '800',
    color: '#1A3B2F',
    textAlign: 'center',
    marginVertical: 16,
    fontStyle: 'italic',
  },
  reviewImage: {
    width: '100%',
    height: 180,
    borderRadius: 20,
    marginBottom: 20,
  },
  userInfo: {
    alignItems: 'center',
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#1A3B2F',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 28,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '900',
  },
  userName: {
    fontSize: 16,
    fontWeight: '900',
    color: '#1A3B2F',
    marginBottom: 4,
  },
  starsRow: {
    flexDirection: 'row',
    gap: 2,
    marginBottom: 4,
  },
  date: {
    fontSize: 12,
    color: 'rgba(26, 59, 47, 0.4)',
    fontWeight: '600',
  },
  actionButtons: {
    position: 'absolute',
    top: 20,
    right: 20,
    flexDirection: 'row',
    gap: 12,
  },
  actionBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F8FAFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.03)',
  },
});

