import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Modal, 
  TextInput, 
  TouchableOpacity, 
  Image, 
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Pressable
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { StarRatingInput } from './StarRatingInput';
import { API_BASE_URL } from '@/constants/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AddReviewModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
  targetId: string;
  targetType: 'hotel' | 'destination';
  targetName?: string;
  initialData?: {
    _id: string;
    rating: number;
    comment: string;
    image?: string;
  } | null;
}


export const AddReviewModal: React.FC<AddReviewModalProps> = ({ 
  visible, 
  onClose, 
  onSuccess,
  targetId,
  targetType,
  targetName = "this place",
  initialData = null
}) => {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Pre-fill if editing
  React.useEffect(() => {
    if (initialData && visible) {
      setRating(initialData.rating);
      setComment(initialData.comment);
      // If it's a remote image, we keep it as is. If it's a new local URI, it's also handled.
      setImage(initialData.image || null);
    } else if (!initialData && visible) {
      setRating(0);
      setComment('');
      setImage(null);
    }
  }, [initialData, visible]);


  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'We need access to your photos to upload a review image.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.7,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  const uploadImage = async (uri: string): Promise<string> => {
    const formData = new FormData();
    const filename = uri.split('/').pop() || 'upload.jpg';
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1]}` : `image/jpeg`;

    formData.append('image', { uri, name: filename, type } as any);

    const token = await AsyncStorage.getItem('auth:token');

    // Add a timeout to the fetch call
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout

    try {
      const response = await fetch(`${API_BASE_URL}/upload/single`, {
        method: 'POST',
        body: formData,
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Image upload failed');
      return data.filePath;
    } catch (err: any) {
      clearTimeout(timeoutId);
      if (err.name === 'AbortError') throw new Error('Upload timed out. Please try a smaller image or better connection.');
      throw err;
    }
  };


  const handleSubmit = async () => {
    if (rating === 0) {
      Alert.alert('Incomplete', 'Please provide a star rating.');
      return;
    }

    try {
      setLoading(true);
      const userData = await AsyncStorage.getItem('auth:user');
      if (!userData) {
        Alert.alert('Authentication Required', 'Please login to share your experience.');
        setLoading(false);
        return;
      }
      const user = JSON.parse(userData);
      const uid = user.id || user._id;
      
      if (!uid) {
        Alert.alert('Data Error', 'User ID not found in session. Please logout and login again.');
        setLoading(false);
        return;
      }



      if (!targetId) {
        Alert.alert('Error', 'Missing target ID. Please close and reopen the review form.');
        setLoading(false);
        return;
      }

      let uploadedImageUrl = '';
      if (image) {

        uploadedImageUrl = await uploadImage(image);
      }

      const payload = {
        userId: uid,
        rating,
        comment,
        image: uploadedImageUrl,
        [targetType === 'hotel' ? 'hotelId' : 'destinationId']: targetId
      };




      const token = await AsyncStorage.getItem('auth:token');
      const isEditing = !!initialData;
      const url = isEditing ? `${API_BASE_URL}/reviews/${initialData?._id}` : `${API_BASE_URL}/reviews`;
      const method = isEditing ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });


      if (response.ok) {
        Alert.alert('Success', `Your review has been ${isEditing ? 'updated' : 'submitted'} successfully.`);

        setRating(0);
        setComment('');
        setImage(null);
        onSuccess();
        onClose();
      } else {
        const errorData = await response.json().catch(() => ({}));
        Alert.alert('Submission Failed', errorData.message || 'Something went wrong.');
      }

    } catch (error: any) {
      console.error('Review submission error:', error);
      let errorMsg = error.message || 'Something went wrong';
      if (errorMsg.includes('Network request failed')) {
        errorMsg = "Could not connect to the server. Please check your internet or if the backend is running.";
      }
      Alert.alert('Error during submission', errorMsg);
    } finally {
      setLoading(false);
    }

  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalBox}
        >
          <View style={styles.header}>
            <Text style={styles.title}>Share Your Experience</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#1A3B2F" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            <Text style={styles.questionText}>
              How was your time at <Text style={styles.targetName}>{targetName || "this place"}</Text>?
            </Text>

            
            <View style={styles.ratingSection}>
              <StarRatingInput rating={rating} onRatingChange={setRating} size={44} />
              <Text style={styles.tapToRate}>TAP A STAR TO RATE</Text>
            </View>

            <Text style={styles.label}>Your Review</Text>
            <TextInput
              style={styles.input}
              placeholder="Tell us what you liked (or didn't like)..."
              placeholderTextColor="rgba(26, 59, 47, 0.3)"
              multiline
              numberOfLines={4}
              value={comment}
              onChangeText={setComment}
            />

            <Text style={styles.label}>Add a Photo (Optional)</Text>
            <TouchableOpacity onPress={pickImage} style={styles.imagePicker}>
              {image ? (
                <View style={styles.imageWrapper}>
                  <Image source={{ uri: image }} style={styles.previewImage} />
                  <Pressable style={styles.removeImage} onPress={() => setImage(null)}>
                    <Ionicons name="close-circle" size={24} color="#FF4A4A" />
                  </Pressable>
                </View>
              ) : (
                <View style={styles.pickerPlaceholder}>
                  <Ionicons name="camera-outline" size={32} color="rgba(26, 59, 47, 0.4)" />
                  <Text style={styles.pickerText}>Capture your moment</Text>
                </View>
              )}
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.submitButton, loading && styles.disabledButton]} 
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <ActivityIndicator color="#1A3B2F" />
                  <Text style={[styles.submitButtonText, { fontSize: 14 }]}>SUBMITTING...</Text>
                </View>
              ) : (
                <Text style={styles.submitButtonText}>SUBMIT REVIEW</Text>
              )}
            </TouchableOpacity>

          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(26, 59, 47, 0.6)',
    justifyContent: 'flex-end',
  },
  modalBox: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    height: '90%',
    padding: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    color: '#1A3B2F',
    letterSpacing: -0.5,
  },
  closeButton: {
    padding: 4,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  questionText: {
    fontSize: 16,
    color: 'rgba(26, 59, 47, 0.7)',
    fontWeight: '600',
    marginBottom: 32,
  },
  targetName: {
    color: '#769440',
    fontWeight: '800',
  },
  ratingSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  tapToRate: {
    fontSize: 12,
    fontWeight: '900',
    color: '#1A3B2F',
    letterSpacing: 1,
    marginTop: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: '900',
    color: '#1A3B2F',
    marginTop: 16,
    marginBottom: 12,
  },
  input: {
    backgroundColor: '#F0FAF5',
    borderRadius: 20,
    padding: 20,
    height: 140,
    textAlignVertical: 'top',
    fontSize: 15,
    color: '#1A3B2F',
    fontWeight: '500',
  },
  imagePicker: {
    height: 160,
    borderRadius: 24,
    backgroundColor: '#F0FAF5',
    borderWidth: 2,
    borderColor: 'rgba(26, 59, 47, 0.1)',
    borderStyle: 'dashed',
    overflow: 'hidden',
    marginBottom: 32,
  },
  pickerPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  pickerText: {
    fontSize: 13,
    color: 'rgba(26, 59, 47, 0.4)',
    fontWeight: '700',
  },
  imageWrapper: {
    flex: 1,
    position: 'relative',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  removeImage: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
  },
  submitButton: {
    backgroundColor: '#FFD166',
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  disabledButton: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: '#1A3B2F',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 1,
  },
});
