import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  SafeAreaView,
  Pressable,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
  ScrollView,
  Image,
  Dimensions,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import * as ImagePicker from 'expo-image-picker';
import { API_BASE_URL } from '@/constants/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

type Category = 'Beach' | 'Mountain' | 'City' | 'Cultural';
const CATEGORIES: Category[] = ['Beach', 'Mountain', 'City', 'Cultural'];

export default function DestinationsManagementScreen() {
  const [destinations, setDestinations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [category, setCategory] = useState<Category>('Beach');
  const [description, setDescription] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [startingPrice, setStartingPrice] = useState('');
  const [averageTemp, setAverageTemp] = useState('25°C');
  const [bestTimeToVisit, setBestTimeToVisit] = useState('Year-round');
  const [isFeatured, setIsFeatured] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const router = useRouter();

  const fetchDestinations = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/destinations`);
      const data = await response.json();
      if (response.ok) {
        setDestinations(data);
      } else {
        throw new Error(data.message || "Failed to fetch destinations.");
      }
    } catch (error: any) {
      Alert.alert("Error", error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDestinations();
  }, []);

  const pickImages = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      selectionLimit: 5,
      allowsEditing: false, // Multiple selection doesn't support editing on some platforms
      quality: 0.8,
    });

    if (!result.canceled) {
      const selectedUris = result.assets.map(asset => asset.uri);
      setImages(prev => [...prev, ...selectedUris].slice(0, 5));
    }
  };

  const removeImage = (uri: string) => {
    setImages(prev => prev.filter(img => img !== uri));
  };

  const resetForm = () => {
    setName('');
    setLocation('');
    setCategory('Beach');
    setDescription('');
    setImages([]);
    setStartingPrice('');
    setAverageTemp('25°C');
    setBestTimeToVisit('Year-round');
    setIsFeatured(false);
    setEditingId(null);
  };

  const isFormValid = useMemo(() => {
    return name.trim() !== '' && 
           location.trim() !== '' && 
           description.trim() !== '' && 
           images.length > 0;
  }, [name, location, description, images]);

  const handleCreateOrUpdate = async () => {
    if (!isFormValid) {
      Alert.alert("Required Fields", "Please ensure all fields are filled and at least one image is selected.");
      return;
    }

    try {
      setSubmitting(true);
      const token = await AsyncStorage.getItem('auth:token');
      
      const formData = new FormData();
      formData.append('name', name);
      formData.append('location', location);
      formData.append('category', category);
      formData.append('description', description);
      formData.append('startingPrice', startingPrice);
      formData.append('averageTemp', averageTemp);
      formData.append('bestTimeToVisit', bestTimeToVisit);
      formData.append('isFeatured', String(isFeatured));
      
      const existingImages = [];
      
      for (let i = 0; i < images.length; i++) {
        const imgUri = images[i];
        if (imgUri.startsWith('http')) {
          existingImages.push(imgUri);
        } else {
          const filename = imgUri.split('/').pop() || `image-${i}`;
          const match = /\.(\w+)$/.exec(filename);
          let type = match ? `image/${match[1]}` : `image`;
          if (type === 'image/jpg') type = 'image/jpeg';

          if (Platform.OS === 'web') {
            const response = await fetch(imgUri);
            const blob = await response.blob();
            formData.append('images', blob, filename);
          } else {
            formData.append('images', {
              uri: imgUri,
              name: filename,
              type,
            } as any);
          }
        }
      }

      if (existingImages.length > 0) {
        formData.append('existingImages', JSON.stringify(existingImages));
      }

      const url = editingId ? `${API_BASE_URL}/destinations/${editingId}` : `${API_BASE_URL}/destinations`;
      const method = editingId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
        body: formData,
      });

      const data = await response.json();
      if (response.ok) {
        Alert.alert("Success", data.message);
        setModalVisible(false);
        resetForm();
        fetchDestinations();
      } else {
        const errorMessage = data.message || data.error?.message || JSON.stringify(data.error) || "Operation failed.";
        throw new Error(errorMessage);
      }
    } catch (error: any) {
      Alert.alert("Error", error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (item: any) => {
    setEditingId(item._id);
    setName(item.name);
    setLocation(item.location);
    setCategory(item.category);
    setDescription(item.description);
    setStartingPrice(item.startingPrice?.toString() || '');
    setAverageTemp(item.averageTemp || '25°C');
    setBestTimeToVisit(item.bestTimeToVisit || 'Year-round');
    setIsFeatured(item.isFeatured || false);
    setImages(item.images.map((img: any) => img.url));
    setModalVisible(true);
  };

  const handleDelete = async (id: string) => {
    Alert.alert(
      "Confirm Delete",
      "Are you sure you want to remove this destination?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive",
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem('auth:token');
              const response = await fetch(`${API_BASE_URL}/destinations/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
              });
              if (response.ok) {
                Alert.alert("Deleted", "Destination removed successfully.");
                fetchDestinations();
              } else {
                const data = await response.json();
                throw new Error(data.message || "Delete failed.");
              }
            } catch (error: any) {
              Alert.alert("Error", error.message);
            }
          }
        }
      ]
    );
  };

  const filteredDestinations = destinations.filter(dest => 
    dest.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    dest.location.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderDestinationItem = ({ item }: { item: any }) => (
    <View style={styles.card}>
      <Image source={{ uri: item.images[0]?.url }} style={styles.cardImage} />
      <View style={styles.cardContent}>
        <View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={styles.cardName}>{item.name}</Text>
            {item.isFeatured && (
              <View style={styles.featuredBadge}>
                <Ionicons name="star" size={10} color="#1A3B2F" />
                <Text style={styles.featuredText}>Featured</Text>
              </View>
            )}
          </View>
          <Text style={styles.cardLocation}>{item.location}</Text>
        </View>
        <View style={styles.categoryBadge}>
          <Text style={styles.categoryBadgeText}>{item.category.toUpperCase()}</Text>
        </View>
        <Text style={styles.cardDesc} numberOfLines={2}>{item.description}</Text>
        
        <View style={styles.actionRow}>
          <Pressable style={styles.actionBtn} onPress={() => handleEdit(item)}>
            <Ionicons name="create-outline" size={18} color="#1A3B2F" />
            <Text style={styles.actionBtnText}>Edit</Text>
          </Pressable>
          <Pressable style={[styles.actionBtn, { borderColor: '#FF4D4D' }]} onPress={() => handleDelete(item._id)}>
            <Ionicons name="trash-outline" size={18} color="#FF4D4D" />
            <Text style={[styles.actionBtnText, { color: '#FF4D4D' }]}>Delete</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={24} color="#1A3B2F" />
          </Pressable>
          <Text style={styles.headerTitle}>Destinations</Text>
          <Pressable 
            onPress={() => { resetForm(); setModalVisible(true); }} 
            style={styles.addButton}
          >
            <Ionicons name="add" size={24} color="#1A3B2F" />
          </Pressable>
        </View>

        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="rgba(26, 59, 47, 0.4)" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name or location..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={18} color="rgba(26, 59, 47, 0.4)" />
            </Pressable>
          )}
        </View>

        {loading ? (
          <View style={styles.centerArea}>
            <ActivityIndicator size="large" color="#FFD166" />
          </View>
        ) : (
          <FlatList
            data={filteredDestinations}
            keyExtractor={(item) => item._id}
            renderItem={renderDestinationItem}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Ionicons name="map-outline" size={64} color="rgba(26, 59, 47, 0.1)" />
                <Text style={styles.emptyText}>No destinations found.</Text>
              </View>
            }
          />
        )}

        <Modal
          visible={modalVisible}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setModalVisible(false)}
        >
          <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.modalOverlay}
          >
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>{editingId ? 'Edit Destination' : 'Add Destination'}</Text>
                <Pressable onPress={() => setModalVisible(false)}>
                  <Ionicons name="close" size={24} color="#1A3B2F" />
                </Pressable>
              </View>

              <ScrollView showsVerticalScrollIndicator={false}>
                <Text style={styles.inputLabel}>Destination Name</Text>
                <TextInput
                  style={styles.input}
                  value={name}
                  onChangeText={setName}
                  placeholder="e.g. Sigiriya Rock"
                />

                <Text style={styles.inputLabel}>Location</Text>
                <TextInput
                  style={styles.input}
                  value={location}
                  onChangeText={setLocation}
                  placeholder="e.g. Matale District"
                />

                <Text style={styles.inputLabel}>Category</Text>
                <View style={styles.categoryGrid}>
                  {CATEGORIES.map(cat => (
                    <Pressable
                      key={cat}
                      style={[styles.catPill, category === cat && styles.catPillActive]}
                      onPress={() => setCategory(cat)}
                    >
                      <Text style={[styles.catText, category === cat && styles.catTextActive]}>{cat}</Text>
                    </Pressable>
                  ))}
                </View>

                <Text style={styles.inputLabel}>Description</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={description}
                  onChangeText={setDescription}
                  placeholder="Describe the beauty of this place..."
                  multiline
                  numberOfLines={4}
                />

                <View style={{ flexDirection: 'row', gap: 12 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.inputLabel}>Starting Price ($)</Text>
                    <TextInput
                      style={styles.input}
                      value={startingPrice}
                      onChangeText={setStartingPrice}
                      placeholder="e.g. 150"
                      keyboardType="numeric"
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.inputLabel}>Temp</Text>
                    <TextInput
                      style={styles.input}
                      value={averageTemp}
                      onChangeText={setAverageTemp}
                      placeholder="e.g. 24°C"
                    />
                  </View>
                </View>

                <Text style={styles.inputLabel}>Best Time to Visit</Text>
                <TextInput
                  style={styles.input}
                  value={bestTimeToVisit}
                  onChangeText={setBestTimeToVisit}
                  placeholder="e.g. Dec - April"
                />

                <Pressable 
                  style={styles.featuredToggle} 
                  onPress={() => setIsFeatured(!isFeatured)}
                >
                  <View style={[styles.toggleCircle, isFeatured && styles.toggleCircleActive]}>
                    {isFeatured && <Ionicons name="checkmark" size={12} color="#FFFFFF" />}
                  </View>
                  <Text style={styles.featuredLabel}>Featured Destination (Show on Home Screen)</Text>
                </Pressable>

                <Text style={styles.inputLabel}>Images (Max 5)</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imageList}>
                  {images.map((uri, index) => (
                    <View key={index} style={styles.imageWrapper}>
                      <Image source={{ uri }} style={styles.thumbnail} />
                      <Pressable style={styles.removeImageBtn} onPress={() => removeImage(uri)}>
                        <Ionicons name="close-circle" size={20} color="#FF4D4D" />
                      </Pressable>
                    </View>
                  ))}
                  {images.length < 5 && (
                    <Pressable style={styles.imagePickerSmall} onPress={pickImages}>
                      <Ionicons name="add" size={24} color="rgba(26, 59, 47, 0.3)" />
                    </Pressable>
                  )}
                </ScrollView>

                <View style={styles.validationHint}>
                  {!isFormValid && (
                    <Text style={styles.hintText}>* Please fill all fields and add at least one image.</Text>
                  )}
                </View>

                <Pressable
                  style={[
                    styles.submitBtn, 
                    (submitting || !isFormValid) && styles.submitBtnDisabled
                  ]}
                  onPress={handleCreateOrUpdate}
                  disabled={submitting || !isFormValid}
                >
                  {submitting ? (
                    <ActivityIndicator color="#1A3B2F" />
                  ) : (
                    <Text style={styles.submitBtnText}>{editingId ? 'Update Destination' : 'Create Destination'}</Text>
                  )}
                </Pressable>
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </Modal>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0FAF5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0FAF5',
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFD166',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#1A3B2F',
  },
  centerArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 20,
    gap: 16,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(26, 59, 47, 0.08)',
  },
  cardImage: {
    width: '100%',
    height: 180,
  },
  cardContent: {
    padding: 16,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  cardName: {
    fontSize: 18,
    fontWeight: '900',
    color: '#1A3B2F',
  },
  categoryBadge: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  categoryBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#1565C0',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 8,
  },
  cardLocation: {
    fontSize: 13,
    color: '#1A3B2F',
    fontWeight: '600',
  },
  cardDesc: {
    fontSize: 14,
    color: 'rgba(26, 59, 47, 0.6)',
    marginTop: 12,
    lineHeight: 18,
  },
  featuredBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFD166',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    gap: 3,
  },
  featuredText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#1A3B2F',
    textTransform: 'uppercase',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginBottom: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 16,
    gap: 10,
    borderWidth: 1,
    borderColor: 'rgba(26, 59, 47, 0.1)',
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#1A3B2F',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(26, 59, 47, 0.1)',
    gap: 8,
  },
  actionBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1A3B2F',
  },
  emptyState: {
    marginTop: 100,
    alignItems: 'center',
    gap: 16,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '700',
    color: 'rgba(26, 59, 47, 0.3)',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 24,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#1A3B2F',
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1A3B2F',
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    backgroundColor: '#F0FAF5',
    borderRadius: 16,
    padding: 16,
    fontSize: 14,
    color: '#1A3B2F',
    borderWidth: 1,
    borderColor: 'rgba(26, 59, 47, 0.05)',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 4,
  },
  catPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#F0FAF5',
    borderWidth: 1,
    borderColor: 'rgba(26, 59, 47, 0.08)',
  },
  catPillActive: {
    backgroundColor: '#FFD166',
    borderColor: '#FFD166',
  },
  catText: {
    fontSize: 12,
    fontWeight: '700',
    color: 'rgba(26, 59, 47, 0.6)',
  },
  catTextActive: {
    color: '#1A3B2F',
  },
  imagePicker: {
    width: '100%',
    height: 180,
    backgroundColor: '#F0FAF5',
    borderRadius: 24,
    borderStyle: 'dashed',
    borderWidth: 2,
    borderColor: 'rgba(26, 59, 47, 0.1)',
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageList: {
    flexDirection: 'row',
    marginTop: 8,
  },
  imageWrapper: {
    width: 100,
    height: 100,
    marginRight: 12,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1,
    borderColor: 'rgba(26, 59, 47, 0.1)',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  removeImageBtn: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#ffffff',
    borderRadius: 12,
  },
  imagePickerSmall: {
    width: 100,
    height: 100,
    backgroundColor: '#F0FAF5',
    borderRadius: 16,
    borderStyle: 'dashed',
    borderWidth: 2,
    borderColor: 'rgba(26, 59, 47, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  validationHint: {
    marginTop: 16,
    paddingHorizontal: 4,
  },
  hintText: {
    fontSize: 12,
    color: '#FF4D4D',
    fontWeight: '700',
    fontStyle: 'italic',
  },
  pickerPlaceholder: {
    alignItems: 'center',
    gap: 8,
  },
  pickerText: {
    fontSize: 13,
    fontWeight: '700',
    color: 'rgba(26, 59, 47, 0.4)',
  },
  submitBtn: {
    backgroundColor: '#FFD166',
    paddingVertical: 18,
    borderRadius: 20,
    alignItems: 'center',
    marginTop: 32,
    marginBottom: 10,
  },
  submitBtnDisabled: {
    opacity: 0.7,
  },
  submitBtnText: {
    fontSize: 16,
    fontWeight: '900',
    color: '#1A3B2F',
  },
  featuredBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFD166',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    gap: 3,
  },
  featuredText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#1A3B2F',
    textTransform: 'uppercase',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginBottom: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 16,
    gap: 10,
    borderWidth: 1,
    borderColor: 'rgba(26, 59, 47, 0.1)',
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#1A3B2F',
  },
  featuredToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    gap: 12,
    backgroundColor: 'rgba(255, 209, 102, 0.1)',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 209, 102, 0.3)',
  },
  toggleCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#FFD166',
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleCircleActive: {
    backgroundColor: '#FFD166',
  },
  featuredLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1A3B2F',
  },
});
