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
    destinationId?: string;
    hotelId?: string;
  };
  onEdit?: () => void;
  onDelete?: () => void;
  currentUserId?: string | null;
}

import { Modal } from 'react-native';

import { MaterialCommunityIcons } from '@expo/vector-icons';

export const ReviewCard: React.FC<ReviewCardProps> = ({ review, onEdit, onDelete, currentUserId }) => {
  const [isImageVisible, setIsImageVisible] = React.useState(false);
  const cleanBaseUrl = API_BASE_URL.replace('/api', '');
  
  const isOwnReview = review.userId?._id === currentUserId;

  const userAvatar = review.userId?.profileImage 
    ? { uri: review.userId.profileImage.startsWith('http') ? review.userId.profileImage : `${cleanBaseUrl}${review.userId.profileImage}` }
    : null;

  const reviewPhoto = review.image 
    ? { uri: review.image.startsWith('http') ? review.image : `${cleanBaseUrl}${review.image}` }
    : null;

  const initials = review.userId?.fullName?.charAt(0).toUpperCase() || 'U';

  return (
    <View style={styles.container}>
      <View style={styles.quoteTop}>
        <MaterialCommunityIcons name="format-quote-open" size={32} color="#E3F2FD" />
      </View>

      {(isOwnReview && (onEdit || onDelete)) && (
        <View style={styles.actionButtons}>
          {onEdit && (
            <Pressable onPress={onEdit} style={styles.actionBtn}>
              <Ionicons name="pencil" size={14} color="rgba(26, 59, 47, 0.4)" />
            </Pressable>
          )}
          {onDelete && (
            <Pressable onPress={onDelete} style={styles.actionBtn}>
              <Ionicons name="trash-outline" size={14} color="#FF5252" />
            </Pressable>
          )}
        </View>
      )}

      <View style={styles.contentArea}>
        <Text style={styles.comment} numberOfLines={3}>
          {review.comment || "An absolutely wonderful experience!"}
        </Text>

        {(reviewPhoto && !review.destinationId) && (
          <View style={styles.thumbnailRow}>
            <Pressable onPress={() => setIsImageVisible(true)} style={styles.thumbnailWrapper}>
              <Image source={reviewPhoto} style={styles.thumbnail} />
            </Pressable>
          </View>
        )}
      </View>

      <View style={styles.userInfo}>
        <View style={styles.avatar}>
          {userAvatar ? (
            <Image source={userAvatar} style={styles.avatarImage} />
          ) : (
            <View style={styles.initialsCircle}>
               <Text style={styles.avatarText}>{initials}</Text>
            </View>
          )}
        </View>
        <Text style={styles.userName} numberOfLines={1}>{review.userId?.fullName || 'Anonymous'}</Text>
        <View style={styles.metaInfo}>
          <View style={styles.starsRow}>
            {[1, 2, 3, 4, 5].map((star) => (
              <Ionicons 
                key={star} 
                name={star <= review.rating ? "star" : "star-outline"} 
                size={10} 
                color="#FFD166" 
              />
            ))}
          </View>
          <Text style={styles.dot}>•</Text>
          <Text style={styles.date}>{new Date(review.createdAt).toLocaleDateString().replace(/\//g, '-')}</Text>
        </View>
      </View>

      <View style={styles.quoteBottom}>
        <MaterialCommunityIcons name="format-quote-close" size={32} color="#E3F2FD" />
      </View>

      {/* Full Image Viewer Modal */}
      <Modal visible={isImageVisible} transparent={true} animationType="fade">
        <View style={styles.modalOverlay}>
          <Pressable style={styles.modalClose} onPress={() => setIsImageVisible(false)}>
            <Ionicons name="close" size={32} color="#FFFFFF" />
          </Pressable>
          <Image source={reviewPhoto!} style={styles.fullImage} resizeMode="contain" />
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    width: width * 0.75,
    height: 280,
    alignItems: 'center',
    shadowColor: '#1A3B2F',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
    borderWidth: 1.5,
    borderColor: 'rgba(26, 59, 47, 0.08)',
    position: 'relative',
    justifyContent: 'space-between',
  },
  quoteTop: {
    position: 'absolute',
    top: 12,
    left: 12,
    opacity: 0.8,
  },
  quoteBottom: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    opacity: 0.8,
  },
  contentArea: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  comment: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1A3B2F',
    textAlign: 'center',
    lineHeight: 22,
    fontStyle: 'italic',
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  thumbnailRow: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
  },
  thumbnailWrapper: {
    width: 60,
    height: 60,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#E3F2FD',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  userInfo: {
    alignItems: 'center',
    paddingBottom: 4,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 22,
  },
  initialsCircle: {
    width: '100%',
    height: '100%',
    borderRadius: 22,
    backgroundColor: '#1A3B2F',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
  },
  userName: {
    fontSize: 14,
    fontWeight: '900',
    color: '#1A3B2F',
    marginBottom: 2,
  },
  metaInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  starsRow: {
    flexDirection: 'row',
    gap: 2,
  },
  dot: {
    fontSize: 12,
    color: 'rgba(26, 59, 47, 0.2)',
  },
  date: {
    fontSize: 9,
    color: 'rgba(26, 59, 47, 0.4)',
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  actionButtons: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    gap: 8,
    zIndex: 10,
  },
  actionBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalClose: {
    position: 'absolute',
    top: 60,
    right: 20,
    zIndex: 20,
  },
  fullImage: {
    width: width,
    height: width * 1.5,
  },
});

