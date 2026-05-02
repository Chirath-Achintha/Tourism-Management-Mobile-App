import React, { useEffect, useMemo, useState } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
  Pressable,
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  Dimensions,
  FlatList,
  ScrollView,
} from 'react-native';
import { MapView, Marker, PROVIDER_GOOGLE } from '@/components/MapViewComponent';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import * as ImagePicker from 'expo-image-picker';
import { IconSymbol } from '@/components/ui/icon-symbol';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '@/constants/api';
import { Colors } from '@/constants/theme';
const AUTH_USER_KEY = "auth:user";

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48 - 16) / 2;

const CATEGORIES = ['All', 'Beach', 'Mountain', 'City', 'Cultural', 'Nature', 'Landmark', 'Adventure', 'Wildlife', 'Religious', 'Historical'];

const CATEGORY_ICONS: any = {
  'All': 'grid-outline',
  'Beach': 'sunny-outline',
  'Mountain': 'trail-sign-outline',
  'City': 'business-outline',
  'Cultural': 'color-palette-outline',
  'Nature': 'leaf-outline',
  'Landmark': 'map-outline',
  'Adventure': 'bicycle-outline',
  'Wildlife': 'paw-outline',
  'Religious': 'partly-sunny-outline',
  'Historical': 'library-outline'
};

export default function SearchPlacesScreen() {
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [places, setPlaces] = useState<any[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const router = useRouter();

  // Shared State
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Add Hotel Form State
  const [hotelName, setHotelName] = useState('');
  const [location, setLocation] = useState('');
  const [address, setAddress] = useState('');
  const [description, setDescription] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [websiteLink, setWebsiteLink] = useState('');
  
  // Dynamic Room Pricing State
  const [roomConfigs, setRoomConfigs] = useState<{type: string, price: string, discountPrice: string}[]>([]);
  const [tempType, setTempType] = useState('Single');
  const [tempPrice, setTempPrice] = useState('');
  const [tempDiscount, setTempDiscount] = useState('');

  const [facilities, setFacilities] = useState({
    freeWifi: false,
    swimmingPool: false,
    airConditioning: false,
    parking: false,
    restaurant: false,
    gym: false,
  });
  const [mainImage, setMainImage] = useState<string | null>(null);
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [addressSuggestions, setAddressSuggestions] = useState<any[]>([]);
  const [isSearchingAddress, setIsSearchingAddress] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<{latitude: number, longitude: number} | null>(null);
  const [mapRegion, setMapRegion] = useState({
    latitude: 7.8731, // Sri Lanka Center
    longitude: 80.7718,
    latitudeDelta: 3.5,
    longitudeDelta: 3.5,
  });

  const [touched, setTouched] = useState({
    hotelName: false,
    location: false,
    address: false,
    description: false,
    contactEmail: false,
    contactPhone: false,
  });

  const errors = useMemo(() => {
    return {
      hotelName: !hotelName ? "Hotel Name is required" : hotelName.length < 3 ? "Minimum 3 characters" : null,
      location: !location ? "Location is required" : null,
      address: !address ? "Full Address is required" : null,
      description: !description ? "Description is required" : description.length < 10 ? "Minimum 10 characters" : null,
      contactEmail: !contactEmail ? "Contact Email is required" : !/^\S+@\S+\.\S+$/.test(contactEmail) ? "Invalid email format" : null,
      contactPhone: !contactPhone ? "Contact Phone is required" : !/^0\d{9}$/.test(contactPhone) ? "Must start with 0 and be exactly 10 digits" : null,
    };
  }, [hotelName, location, address, description, contactEmail, contactPhone]);

  const markTouched = (field: keyof typeof touched) => {
    setTouched(prev => ({ ...prev, [field]: true }));
  };

  const pickMainImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    });

    if (!result.canceled) {
      setMainImage(result.assets[0].uri);
    }
  };

  const pickGalleryImages = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      selectionLimit: 6 - galleryImages.length,
      quality: 0.7,
    });

    if (!result.canceled) {
      const newUris = result.assets.map(asset => asset.uri);
      setGalleryImages(prev => [...prev, ...newUris].slice(0, 6));
    }
  };

  const removeGalleryImage = (index: number) => {
    setGalleryImages(prev => prev.filter((_, i) => i !== index));
  };

  const uploadFile = async (uri: string, isMultiple = false) => {
    const formData = new FormData();
    const filename = uri.split('/').pop() || 'image.jpg';
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1]}` : `image`;

    formData.append(isMultiple ? 'images' : 'image', {
      uri,
      name: filename,
      type,
    } as any);

    const token = await AsyncStorage.getItem("auth:token");
    const response = await fetch(`${API_BASE_URL}/upload/${isMultiple ? 'multiple' : 'single'}`, {
      method: "POST",
      body: formData,
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "multipart/form-data",
      },
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "Upload failed");
    return isMultiple ? data.filePaths : data.filePath;
  };

  useEffect(() => {
    const initialize = async () => {
      try {
        setLoading(true);
        const userData = await AsyncStorage.getItem(AUTH_USER_KEY);
        if (userData) {
          const user = JSON.parse(userData);
          setRole(user.role);
        }
        const response = await fetch(`${API_BASE_URL}/destinations`);
        const data = await response.json();
        if (response.ok) {
          setPlaces(data);
        }
      } catch (error) {
        console.error("Initialization failed:", error);
      } finally {
        setLoading(false);
      }
    };
    initialize();
  }, []);

  const toggleFavorite = (id: string) => {
    setFavorites(prev => 
      prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]
    );
  };

  const filteredPlaces = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    
    return places.filter((place) => {
      const matchesQuery = !normalizedQuery || (
        place.name.toLowerCase().includes(normalizedQuery) ||
        place.location.toLowerCase().includes(normalizedQuery) ||
        place.category.toLowerCase().includes(normalizedQuery)
      );

      const matchesCategory = selectedCategory === 'All' || (place.categories && place.categories.includes(selectedCategory));

      return matchesQuery && matchesCategory;
    });
  }, [query, places, selectedCategory]);
  
  const featuredPlaces = useMemo(() => {
    return places.filter(place => place.isFeatured);
  }, [places]);

  const toggleFacility = (key: keyof typeof facilities) => {
    setFacilities(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const addRoomConfig = () => {
    if (!tempPrice) {
      Alert.alert("Validation", "Please enter a price for the room.");
      return;
    }
    const cleanPrice = tempPrice.replace(/,/g, '');
    const priceVal = parseFloat(cleanPrice);
    if (isNaN(priceVal) || priceVal <= 0) {
      Alert.alert("Validation", "Price must be a positive number.");
      return;
    }
    
    // Check if type already exists
    if (roomConfigs.some(r => r.type === tempType)) {
      Alert.alert("Validation", `You already added a ${tempType} room.`);
      return;
    }

    let calculatedDiscountPrice = '';
    if (tempDiscount) {
      const discountPercentage = parseFloat(tempDiscount);
      if (isNaN(discountPercentage) || discountPercentage < 0 || discountPercentage > 100) {
        Alert.alert("Validation", "Discount must be between 0% and 100%.");
        return;
      }
      if (!isNaN(priceVal) && !isNaN(discountPercentage)) {
        const finalPrice = priceVal - (priceVal * (discountPercentage / 100));
        calculatedDiscountPrice = finalPrice.toFixed(2); // Store the calculated LKR price
      }
    }

    setRoomConfigs(prev => [...prev, {
      type: tempType,
      price: cleanPrice, // save clean numeric string
      discountPrice: calculatedDiscountPrice || ''
    }]);
    
    // Reset temp inputs
    setTempPrice('');
    setTempDiscount('');
  };

  const handleAddressSearch = async (text: string) => {
    setAddress(text);
    if (text.length > 2) {
      setIsSearchingAddress(true);
      try {
        const response = await fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(text)}&limit=5`);
        const data = await response.json();
        if (data && data.features) {
          setAddressSuggestions(data.features);
        } else {
          setAddressSuggestions([]);
        }
      } catch (error) {
        console.error("Address search error", error);
      } finally {
        setIsSearchingAddress(false);
      }
    } else {
      setAddressSuggestions([]);
    }
  };

  const handleSelectAddress = (feature: any) => {
    const props = feature.properties;
    const name = props.name || '';
    const city = props.city || props.state || '';
    const country = props.country || '';
    const displayName = [name, city, country].filter(Boolean).join(', ');

    setAddress(displayName);
    const [lon, lat] = feature.geometry.coordinates;
    setSelectedLocation({ latitude: lat, longitude: lon });
    setMapRegion({
      latitude: lat,
      longitude: lon,
      latitudeDelta: 0.05,
      longitudeDelta: 0.05,
    });
    setAddressSuggestions([]);
  };

  const removeRoomConfig = (index: number) => {
    setRoomConfigs(prev => prev.filter((_, i) => i !== index));
  };

  const handleGalleryChange = (text: string, index: number) => {
    const newGallery = [...galleryImages];
    newGallery[index] = text;
    setGalleryImages(newGallery);
  };

  const handleAddHotel = async () => {
    setTouched({
      hotelName: true,
      location: true,
      address: true,
      description: true,
      contactEmail: true,
      contactPhone: true,
    });

    const hasErrors = Object.values(errors).some(e => e !== null);
    if (hasErrors) {
      Alert.alert("Validation Error", "Please correct all highlighted errors.");
      return;
    }

    if (!hotelName || !location || !address || !description || !contactEmail || !contactPhone || !mainImage) {
      Alert.alert("Validation", "Please fill in all essential details.");
      return;
    }

    if (roomConfigs.length === 0) {
      Alert.alert("Validation", "Please add at least one room type and price.");
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. Upload Main Image
      const uploadedMainImagePath = await uploadFile(mainImage);

      // 2. Upload Gallery Images
      let uploadedGalleryPaths: string[] = [];
      if (galleryImages.length > 0) {
        // Since our backend has a /multiple endpoint, we can use it, 
        // but it's simpler to upload them one by one or all at once.
        // Let's use the multiple endpoint logic.
        const formData = new FormData();
        for (const uri of galleryImages) {
          const filename = uri.split('/').pop() || 'image.jpg';
          const match = /\.(\w+)$/.exec(filename);
          const type = match ? `image/${match[1]}` : `image`;
          formData.append('images', { uri, name: filename, type } as any);
        }
        
        const token = await AsyncStorage.getItem("auth:token");
        const galleryRes = await fetch(`${API_BASE_URL}/upload/multiple`, {
          method: "POST",
          body: formData,
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        });
        const galleryData = await galleryRes.json();
        if (galleryRes.ok) uploadedGalleryPaths = galleryData.filePaths;
      }

      // 3. Save Hotel
      const token = await AsyncStorage.getItem("auth:token");
      const response = await fetch(`${API_BASE_URL}/hotels/add`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          hotelName,
          location,
          address,
          description,
          contactEmail,
          contactPhone,
          websiteLink,
          roomConfigs: roomConfigs.map(r => ({
            type: r.type,
            price: Number(r.price),
            discountPrice: r.discountPrice ? Number(r.discountPrice) : undefined
          })),
          facilities,
          mainImage: uploadedMainImagePath,
          galleryImages: uploadedGalleryPaths,
          latitude: selectedLocation?.latitude,
          longitude: selectedLocation?.longitude,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to add hotel");
      }

      Alert.alert("Success", "Hotel registered successfully!");
      
      // Reset form
      setHotelName('');
      setLocation('');
      setAddress('');
      setDescription('');
      setContactEmail('');
      setContactPhone('');
      setWebsiteLink('');
      setRoomConfigs([]);
      setFacilities({
        freeWifi: false,
        swimmingPool: false,
        airConditioning: false,
        parking: false,
        restaurant: false,
        gym: false,
      });
      setMainImage(null);
      setGalleryImages([]);
    } catch (error: any) {
      Alert.alert("Error", error.message || "Could not register hotel.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return null;

  if (role === 'hotel_manager') {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.headerRow}>
            <Text style={styles.title}>Register Hotel</Text>
            <IconSymbol name="plus.circle.fill" size={30} color="#1A3B2F" />
          </View>
          <Text style={styles.subtitle}>
            Fill in your property details to join our network.
          </Text>

          {/* Essential Details Section */}
          <View style={styles.sectionHeader}>
            <Ionicons name="information-circle-outline" size={20} color="#1A3B2F" />
            <Text style={styles.sectionTitleText}>Essential Details</Text>
          </View>

          <View style={styles.formContainer}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Hotel Name *</Text>
              <TextInput
                value={hotelName}
                onChangeText={(t) => { setHotelName(t); markTouched('hotelName'); }}
                onBlur={() => markTouched('hotelName')}
                placeholder="e.g. Grand Heritage Resort"
                style={[styles.formInput, touched.hotelName && errors.hotelName && styles.errorInput]}
              />
              {touched.hotelName && errors.hotelName && (
                <Text style={styles.errorText}>{errors.hotelName}</Text>
              )}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Location (City / Area) *</Text>
              <TextInput
                value={location}
                onChangeText={(t) => { setLocation(t); markTouched('location'); }}
                onBlur={() => markTouched('location')}
                placeholder="e.g. Galle Fort"
                style={[styles.formInput, touched.location && errors.location && styles.errorInput]}
              />
              {touched.location && errors.location && (
                <Text style={styles.errorText}>{errors.location}</Text>
              )}
            </View>

            <View style={[styles.inputGroup, { zIndex: 10 }]}>
              <Text style={styles.label}>Full Address (Search to Pin) *</Text>
              <View style={{ position: 'relative' }}>
                <TextInput
                  value={address}
                  onChangeText={(t) => { handleAddressSearch(t); markTouched('address'); }}
                  onBlur={() => markTouched('address')}
                  placeholder="Type address to search..."
                  style={[styles.formInput, touched.address && errors.address && styles.errorInput]}
                />
                {isSearchingAddress && (
                  <ActivityIndicator style={styles.searchLoader} color="#1A3B2F" size="small" />
                )}
                {addressSuggestions.length > 0 && (
                  <View style={styles.suggestionsContainer}>
                    {addressSuggestions.map((item, index) => {
                      const props = item.properties;
                      const displayName = [props.name, props.city || props.state, props.country].filter(Boolean).join(', ');
                      return (
                        <Pressable 
                          key={item.id || index} 
                          style={styles.suggestionItem}
                          onPress={() => handleSelectAddress(item)}
                        >
                          <Ionicons name="location-outline" size={16} color="#1A3B2F" />
                          <Text style={styles.suggestionText} numberOfLines={2}>
                            {displayName}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                )}
              </View>
              {touched.address && errors.address && (
                <Text style={styles.errorText}>{errors.address}</Text>
              )}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Map Location (Tap to pin)</Text>
              <View style={styles.mapContainer}>
                {Platform.OS !== 'web' ? (
                  <MapView
                    provider={PROVIDER_GOOGLE}
                    style={styles.map}
                    region={mapRegion}
                    onRegionChangeComplete={(region: any) => setMapRegion(region)}
                    onPress={(e: any) => setSelectedLocation(e.nativeEvent.coordinate)}
                  >
                    {selectedLocation && (
                      <Marker 
                        draggable
                        coordinate={selectedLocation} 
                          onDragEnd={(e: any) => setSelectedLocation(e.nativeEvent.coordinate)}
                      />
                    )}
                  </MapView>
                ) : (
                  <View style={styles.webMapFallback}>
                    <Ionicons name="map" size={40} color="#999" />
                    <Text style={styles.webMapText}>Map view is available on mobile</Text>
                    {selectedLocation && (
                      <Text style={styles.coordinatesText}>
                        Pinned: {selectedLocation.latitude.toFixed(4)}, {selectedLocation.longitude.toFixed(4)}
                      </Text>
                    )}
                  </View>
                )}
              </View>
              {selectedLocation && (
                <Text style={styles.coordinatesText}>
                  Pinned: {selectedLocation.latitude.toFixed(4)}, {selectedLocation.longitude.toFixed(4)}
                </Text>
              )}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Description *</Text>
              <TextInput
                value={description}
                onChangeText={(t) => { setDescription(t); markTouched('description'); }}
                onBlur={() => markTouched('description')}
                placeholder="Tell guests what makes your hotel special..."
                multiline
                numberOfLines={4}
                style={[styles.formInput, styles.textArea, touched.description && errors.description && styles.errorInput]}
              />
              {touched.description && errors.description && (
                <Text style={styles.errorText}>{errors.description}</Text>
              )}
            </View>

            <View style={styles.formRow}>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.label}>Contact Email *</Text>
                <TextInput
                  value={contactEmail}
                  onChangeText={(t) => { setContactEmail(t); markTouched('contactEmail'); }}
                  onBlur={() => markTouched('contactEmail')}
                  placeholder="hotel@example.com"
                  keyboardType="email-address"
                  style={[styles.formInput, touched.contactEmail && errors.contactEmail && styles.errorInput]}
                />
                {touched.contactEmail && errors.contactEmail && (
                  <Text style={styles.errorText}>{errors.contactEmail}</Text>
                )}
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Contact Phone *</Text>
              <TextInput
                value={contactPhone}
                onChangeText={(t) => { setContactPhone(t); markTouched('contactPhone'); }}
                onBlur={() => markTouched('contactPhone')}
                placeholder="+94 77 123 4567"
                keyboardType="phone-pad"
                style={[styles.formInput, touched.contactPhone && errors.contactPhone && styles.errorInput]}
              />
              {touched.contactPhone && errors.contactPhone && (
                <Text style={styles.errorText}>{errors.contactPhone}</Text>
              )}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Hotel Website (Optional)</Text>
              <TextInput
                value={websiteLink}
                onChangeText={setWebsiteLink}
                placeholder="e.g. https://www.grandresort.com"
                autoCapitalize="none"
                style={styles.formInput}
              />
            </View>
          </View>

          {/* Pricing Section */}
          <View style={styles.sectionHeader}>
            <Ionicons name="cash-outline" size={20} color="#1A3B2F" />
            <Text style={styles.sectionTitleText}>Pricing & Room Types</Text>
          </View>

          <View style={styles.formContainer}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Select Room Type</Text>
              <View style={styles.chipContainer}>
                {['Single', 'Double', 'Deluxe', 'Suite'].map(type => (
                  <Pressable
                    key={type}
                    onPress={() => setTempType(type)}
                    style={[
                      styles.chip,
                      tempType === type && styles.chipActive
                    ]}
                  >
                    <Text style={[
                      styles.chipText,
                      tempType === type && styles.chipTextActive
                    ]}>{type}</Text>
                  </Pressable>
                ))}
              </View>
            </View>

            <View style={styles.formRow}>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.label}>Price (LKR) *</Text>
                <TextInput
                  value={tempPrice}
                  onChangeText={setTempPrice}
                  placeholder="15,000"
                  keyboardType="numeric"
                  style={styles.formInput}
                />
              </View>
              <View style={[styles.inputGroup, { flex: 1, marginLeft: 12 }]}>
                <Text style={styles.label}>Discount (%)</Text>
                <TextInput
                  value={tempDiscount}
                  onChangeText={setTempDiscount}
                  placeholder="e.g. 10"
                  keyboardType="numeric"
                  style={styles.formInput}
                />
              </View>
              <Pressable style={styles.addRoomButton} onPress={addRoomConfig}>
                <Ionicons name="add" size={24} color="#1A3B2F" />
              </Pressable>
            </View>

            {roomConfigs.length > 0 && (
              <View style={styles.roomList}>
                {roomConfigs.map((config, index) => (
                  <View key={index} style={styles.roomListItem}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.roomListType}>{config.type} Room</Text>
                      <Text style={styles.roomListPrice}>
                        {config.price} LKR {config.discountPrice ? `(Disc: ${config.discountPrice})` : ''}
                      </Text>
                    </View>
                    <Pressable onPress={() => removeRoomConfig(index)}>
                      <Ionicons name="trash-outline" size={20} color="#ff4444" />
                    </Pressable>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* Facilities Section */}
          <View style={styles.sectionHeader}>
            <Ionicons name="list-outline" size={20} color="#1A3B2F" />
            <Text style={styles.sectionTitleText}>Facilities</Text>
          </View>

          <View style={styles.formContainer}>
            <View style={styles.facilitiesGrid}>
              {[
                { key: 'freeWifi', label: 'Free WiFi', icon: 'wifi-outline' },
                { key: 'swimmingPool', label: 'Swimming Pool', icon: 'water-outline' },
                { key: 'airConditioning', label: 'Air Conditioning', icon: 'snow-outline' },
                { key: 'parking', label: 'Parking', icon: 'car-outline' },
                { key: 'restaurant', label: 'Restaurant', icon: 'restaurant-outline' },
                { key: 'gym', label: 'Gym', icon: 'fitness-outline' },
              ].map((item) => (
                <Pressable 
                  key={item.key}
                  style={styles.checkboxContainer}
                  onPress={() => toggleFacility(item.key as any)}
                >
                  <View style={[
                    styles.checkbox,
                    facilities[item.key as keyof typeof facilities] && styles.checkboxChecked
                  ]}>
                    {facilities[item.key as keyof typeof facilities] && (
                      <Ionicons name="checkmark" size={14} color="#1A3B2F" />
                    )}
                  </View>
                  <Ionicons name={item.icon as any} size={18} color="#1A3B2F" style={{marginLeft: 8}} />
                  <Text style={styles.checkboxLabel}>{item.label}</Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Images Section */}
          <View style={styles.sectionHeader}>
            <Ionicons name="images-outline" size={20} color="#1A3B2F" />
            <Text style={styles.sectionTitleText}>Images</Text>
          </View>

          <View style={styles.formContainer}>
            <Text style={styles.label}>Main Image (Thumbnail) *</Text>
            <Pressable style={styles.imagePickerMain} onPress={pickMainImage}>
              {mainImage ? (
                <Image source={{ uri: mainImage }} style={styles.previewMain} />
              ) : (
                <View style={styles.pickerPlaceholder}>
                  <Ionicons name="camera-outline" size={32} color="rgba(26, 59, 47, 0.4)" />
                  <Text style={styles.pickerText}>Upload Main Image</Text>
                </View>
              )}
            </Pressable>

            <Text style={[styles.label, { marginTop: 16 }]}>Gallery Images (Up to 6)</Text>
            <View style={styles.galleryContainer}>
              {galleryImages.map((uri, index) => (
                <View key={index} style={styles.galleryItem}>
                  <Image source={{ uri }} style={styles.previewGallery} />
                  <Pressable style={styles.removeImage} onPress={() => removeGalleryImage(index)}>
                    <Ionicons name="close-circle" size={20} color="#FFD166" />
                  </Pressable>
                </View>
              ))}
              {galleryImages.length < 6 && (
                <Pressable style={styles.imagePickerGallery} onPress={pickGalleryImages}>
                  <Ionicons name="add" size={24} color="rgba(26, 59, 47, 0.4)" />
                </Pressable>
              )}
            </View>
          </View>

          <Pressable 
            style={({ pressed }) => [
              styles.submitButton,
              pressed && { opacity: 0.8 },
              isSubmitting && { opacity: 0.7 }
            ]} 
            onPress={handleAddHotel}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#1A3B2F" />
            ) : (
              <Text style={styles.submitButtonText}>Register Property</Text>
            )}
          </Pressable>

          <View style={{ height: 40 }} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  const renderHeader = () => (
    <View style={styles.fixedHeader}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.title}>Explore</Text>
          <Text style={styles.subtitle}>Discover the beauty of Sri Lanka</Text>
        </View>
        <Pressable style={styles.notificationBtn}>
          <Ionicons name="notifications-outline" size={22} color="#1A3B2F" />
        </Pressable>
      </View>

      <BlurView intensity={80} tint="light" style={styles.searchBlur}>
        <View style={styles.searchWrapper}>
          <Ionicons name="search-outline" size={20} color="rgba(26, 59, 47, 0.4)" />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search destinations..."
            placeholderTextColor="rgba(26, 59, 47, 0.3)"
            style={styles.searchInput}
          />
          {query !== '' && (
            <Pressable onPress={() => setQuery('')}>
              <Ionicons name="close-circle" size={18} color="rgba(26, 59, 47, 0.2)" />
            </Pressable>
          )}
        </View>
      </BlurView>

      {featuredPlaces.length > 0 && (
        <View style={styles.featuredSection}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.featuredSectionTitle}>Featured Destinations</Text>
            <View style={styles.featuredDot} />
          </View>
          <FlatList
            horizontal
            data={featuredPlaces}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.featuredList}
            keyExtractor={(item) => `featured-${item._id}`}
            snapToInterval={width * 0.75 + 16}
            decelerationRate="fast"
            snapToAlignment="start"
            renderItem={({ item: place }) => (
              <Pressable 
                style={styles.featuredCard}
                onPress={() => router.push(`/destination/${place._id}` as any)}
              >
                <Image source={{ uri: place.images[0]?.url }} style={styles.featuredCardImage} />
                <LinearGradient
                  colors={['transparent', 'rgba(0,0,0,0.9)']}
                  style={styles.featuredGradient}
                />
                <View style={styles.featuredInfo}>
                  <View style={styles.featuredTag}>
                    <Ionicons name="sparkles" size={12} color="#1A3B2F" />
                    <Text style={styles.featuredTagText}>Must Visit</Text>
                  </View>
                  <Text style={styles.featuredName}>{place.name}</Text>
                  <View style={styles.featuredLocationRow}>
                    <Ionicons name="location" size={14} color="#FFD166" />
                    <Text style={styles.featuredLocationText}>{place.location}</Text>
                  </View>
                </View>
              </Pressable>
            )}
          />
        </View>
      )}

      <BlurView intensity={60} tint="light" style={styles.categoryBlur}>
        <FlatList 
          horizontal 
          data={CATEGORIES}
          showsHorizontalScrollIndicator={false} 
          contentContainerStyle={styles.categoryScroll}
          keyExtractor={(item) => item}
          renderItem={({ item: cat }) => {
            const isActive = selectedCategory === cat;
            return (
              <Pressable
                onPress={() => setSelectedCategory(cat)}
                style={[
                  styles.categoryPill,
                  isActive && styles.categoryPillActive
                ]}
              >
                <Ionicons 
                  name={CATEGORY_ICONS[cat] || 'pin-outline'} 
                  size={18} 
                  color={isActive ? '#ffffff' : 'rgba(26, 59, 47, 0.4)'} 
                />
                <Text style={[
                  styles.categoryText,
                  isActive && styles.categoryTextActive
                ]}>
                  {cat}
                </Text>
              </Pressable>
            );
          }}
        />
      </BlurView>
    </View>
  );

  const renderDestinationCard = ({ item: place }: { item: any }) => (
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
        
        {place.isFeatured && (
          <View style={styles.featuredBadge}>
            <Ionicons name="star" size={12} color="#1A3B2F" />
            <Text style={styles.featuredBadgeText}>Featured</Text>
          </View>
        )}
        
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
            <Text style={styles.ratingText}>{"4.8"}</Text>
            <Text style={styles.reviewsText}>{" (1.2k)"}</Text>
          </View>
        </View>
      </View>
    </Pressable>
  );

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        ListHeaderComponent={renderHeader()}
        data={filteredPlaces}
        keyExtractor={(item) => item._id}
        renderItem={renderDestinationCard}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          loading ? (
            <View style={styles.loadingState}>
              <ActivityIndicator size="large" color="#FFD166" />
              <Text style={styles.loadingText}>Loading gorgeous places...</Text>
            </View>
          ) : (
            <View style={styles.emptyState}>
              <View style={styles.emptyIconCircle}>
                <Ionicons name="map-outline" size={40} color="rgba(26, 59, 47, 0.2)" />
              </View>
              <Text style={styles.emptyStateTitle}>No results found</Text>
              <Text style={styles.emptyStateSubtitle}>
                Try adjusting your search or category filters.
              </Text>
            </View>
          )
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
  fixedHeader: {
    paddingTop: 12,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 20,
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
  notificationBtn: {
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
  searchBlur: {
    marginHorizontal: 24,
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 24,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: 'rgba(26, 59, 47, 0.05)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 3,
  },
  searchWrapper: {
    paddingHorizontal: 18,
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1A3B2F',
    fontWeight: '700',
  },
  categoryBlur: {
    marginBottom: 8,
  },
  categoryScroll: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    gap: 12,
  },
  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 18,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: 'rgba(26, 59, 47, 0.05)',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 8,
    elevation: 1,
  },
  categoryPillActive: {
    backgroundColor: '#1A3B2F',
    borderColor: '#1A3B2F',
  },
  categoryText: {
    fontSize: 13,
    fontWeight: '800',
    color: 'rgba(26, 59, 47, 0.5)',
  },
  categoryTextActive: {
    color: '#ffffff',
  },
  content: {
    paddingHorizontal: 24,
    paddingBottom: 24,
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
  loadingState: {
    width: width - 48,
    paddingVertical: 100,
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 14,
    fontWeight: '700',
    color: 'rgba(26, 59, 47, 0.3)',
  },
  emptyState: {
    width: width - 48,
    paddingVertical: 100,
    alignItems: 'center',
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(26, 59, 47, 0.03)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1A3B2F',
    marginBottom: 4,
  },
  emptyStateSubtitle: {
    fontSize: 14,
    color: 'rgba(26, 59, 47, 0.4)',
    fontWeight: '600',
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  formContainer: {
    marginTop: 20,
    gap: 20,
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(26, 59, 47, 0.08)',
  },
  errorText: {
    color: '#ff4444',
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
    fontWeight: '600',
  },
  errorInput: {
    borderColor: '#ff4444',
    backgroundColor: '#fffcfc',
  },
  coordinatesText: {
    fontSize: 12,
    color: 'rgba(26, 59, 47, 0.6)',
    marginTop: 4,
    marginLeft: 4,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1A3B2F',
    marginLeft: 4,
  },
  formInput: {
    backgroundColor: '#F0FAF5',
    borderRadius: 12,
    padding: 16,
    fontSize: 15,
    color: '#1A3B2F',
    borderWidth: 1,
    borderColor: 'rgba(26, 59, 47, 0.05)',
  },
  textArea: {
    height: 120,
    textAlignVertical: 'top',
  },
  submitButton: {
    backgroundColor: '#FFD166',
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1A3B2F',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 8,
    marginLeft: 4,
    gap: 8,
  },
  sectionTitleText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1A3B2F',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  formRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F0FAF5',
    borderWidth: 1,
    borderColor: 'rgba(26, 59, 47, 0.1)',
  },
  chipActive: {
    backgroundColor: '#FFD166',
    borderColor: '#FFD166',
  },
  chipText: {
    fontSize: 13,
    fontWeight: '700',
    color: 'rgba(26, 59, 47, 0.6)',
  },
  chipTextActive: {
    color: '#1A3B2F',
  },
  facilitiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '45%',
    marginBottom: 8,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#FFD166',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  checkboxChecked: {
    backgroundColor: '#FFD166',
  },
  checkboxLabel: {
    fontSize: 14,
    color: '#1A3B2F',
    fontWeight: '600',
    marginLeft: 8,
  },
  featuredBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFD166',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  featuredBadgeText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#1A3B2F',
    textTransform: 'uppercase',
  },
  imagePickerMain: {
    height: 180,
    backgroundColor: '#F0FAF5',
    borderRadius: 16,
    marginTop: 8,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: 'rgba(26, 59, 47, 0.2)',
    overflow: 'hidden',
  },
  previewMain: {
    width: '100%',
    height: '100%',
  },
  pickerPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  pickerText: {
    fontSize: 14,
    color: 'rgba(26, 59, 47, 0.4)',
    fontWeight: '600',
  },
  galleryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 8,
  },
  galleryItem: {
    width: '30%',
    aspectRatio: 1,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  previewGallery: {
    width: '100%',
    height: '100%',
  },
  removeImage: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#fff',
    borderRadius: 10,
  },
  imagePickerGallery: {
    width: '30%',
    aspectRatio: 1,
    backgroundColor: '#F0FAF5',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: 'rgba(26, 59, 47, 0.2)',
  },
  addRoomButton: {
    backgroundColor: '#FFD166',
    width: 50,
    height: 50,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 22,
    marginLeft: 10,
  },
  roomList: {
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(26, 59, 47, 0.05)',
    paddingTop: 10,
  },
  roomListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FAF5',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
  },
  roomListType: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1A3B2F',
  },
  roomListPrice: {
    fontSize: 12,
    color: 'rgba(26, 59, 47, 0.6)',
    fontWeight: '600',
  },
  featuredSection: {
    marginTop: 8,
    marginBottom: 16,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 12,
    gap: 8,
  },
  featuredSectionTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#1A3B2F',
  },
  featuredDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFD166',
    marginLeft: -2,
  },
  featuredList: {
    paddingLeft: 24,
    paddingRight: 12,
  },
  featuredCard: {
    width: width * 0.75,
    height: 200,
    marginRight: 16,
    borderRadius: 28,
    overflow: 'hidden',
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 15,
    elevation: 8,
  },
  featuredCardImage: {
    width: '100%',
    height: '100%',
  },
  featuredGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '60%',
  },
  featuredInfo: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
  },
  featuredTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFD166',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    alignSelf: 'flex-start',
    marginBottom: 8,
    gap: 4,
  },
  featuredTagText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#1A3B2F',
    textTransform: 'uppercase',
  },
  featuredName: {
    fontSize: 22,
    fontWeight: '900',
    color: '#ffffff',
    marginBottom: 4,
  },
  featuredLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  featuredLocationText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '600',
  },
  webMapFallback: {
    width: '100%',
    height: 200,
    backgroundColor: '#F0FAF5',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
  },
  webMapText: {
    fontSize: 14,
    color: '#1A3B2F',
    fontWeight: '600',
  },
  mapContainer: {
    height: 200,
    borderRadius: 12,
    overflow: 'hidden',
  },
  map: {
    width: '100%',
    height: '100%',
  },
  suggestionItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(26, 59, 47, 0.05)',
  },
  suggestionText: {
    fontSize: 13,
    color: '#1A3B2F',
  },
  searchLoader: {
    position: 'absolute',
    right: 12,
    top: 16,
  },
  suggestionsContainer: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(26, 59, 47, 0.1)',
  },
});

