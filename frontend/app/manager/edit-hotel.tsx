import React, { useEffect, useMemo, useState } from 'react';
<<<<<<< HEAD
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
=======
>>>>>>> Destination-Management
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  Pressable,
  ActivityIndicator,
  Alert,
  Image,
<<<<<<< HEAD
  Platform,
} from 'react-native';
import { MapView, Marker, PROVIDER_GOOGLE } from '@/components/MapViewComponent';
import * as Location from 'expo-location';
=======
} from 'react-native';
>>>>>>> Destination-Management
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { IconSymbol } from '@/components/ui/icon-symbol';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '@/constants/api';
import { Colors } from '@/constants/theme';

const AUTH_USER_KEY = "auth:user";

type TouristPlace = {
  name: string;
  district: string;
  category: string;
  description: string;
};

const TOURIST_PLACES: TouristPlace[] = [
  {
    name: 'Sigiriya Rock Fortress',
    district: 'Matale',
    category: 'Historical',
    description: 'Ancient palace fortress with panoramic summit views.',
  },
  {
    name: 'Ella Nine Arch Bridge',
    district: 'Badulla',
    category: 'Scenic',
    description: 'Iconic stone bridge surrounded by tea country.',
  },
  {
    name: 'Yala National Park',
    district: 'Hambantota',
    category: 'Wildlife',
    description: 'Leopard safaris and rich biodiversity in dry-zone forests.',
  },
  {
    name: 'Galle Fort',
    district: 'Galle',
    category: 'Cultural',
    description: 'UNESCO colonial fort with museums, cafes, and sea walls.',
  },
  {
    name: 'Nuwara Eliya Tea Estates',
    district: 'Nuwara Eliya',
    category: 'Nature',
    description: 'Cool-climate highlands with tea factories and viewpoints.',
  },
  {
    name: 'Mirissa Beach',
    district: 'Matara',
    category: 'Beach',
    description: 'Golden coastline known for whale watching and sunsets.',
  },
];

export default function SearchPlacesScreen() {
<<<<<<< HEAD
  const { id } = useLocalSearchParams();
  const router = useRouter();
=======
>>>>>>> Destination-Management
  const [query, setQuery] = useState('');
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
<<<<<<< HEAD
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
=======
>>>>>>> Destination-Management

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
    const checkRole = async () => {
      try {
        const userData = await AsyncStorage.getItem(AUTH_USER_KEY);
        if (userData) {
          const user = JSON.parse(userData);
          setRole(user.role);
        }
      } catch (error) {
        console.error("Error checking role:", error);
<<<<<<< HEAD
      }
    };
    
    const fetchHotelData = async () => {
      if (!id) {
        setLoading(false);
        return;
      }
      try {
        const token = await AsyncStorage.getItem("auth:token");
        const res = await fetch(`${API_BASE_URL}/hotels/${id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const hotel = await res.json();
          setHotelName(hotel.hotelName);
          setLocation(hotel.location);
          setAddress(hotel.address);
          setDescription(hotel.description);
          setContactEmail(hotel.contactEmail);
          setContactPhone(hotel.contactPhone);
          setWebsiteLink(hotel.websiteLink || '');
          setRoomConfigs(hotel.roomConfigs || []);
          setFacilities(hotel.facilities || {
            freeWifi: false, swimmingPool: false, airConditioning: false,
            parking: false, restaurant: false, gym: false
          });
          setMainImage(hotel.mainImage ? (hotel.mainImage.startsWith('http') ? hotel.mainImage : `${API_BASE_URL}${hotel.mainImage}`) : null);
          setGalleryImages(hotel.galleryImages ? hotel.galleryImages.map((img: string) => img.startsWith('http') ? img : `${API_BASE_URL}${img}`) : []);
          
          if (hotel.latitude && hotel.longitude) {
            setSelectedLocation({ latitude: hotel.latitude, longitude: hotel.longitude });
            setMapRegion({
              latitude: hotel.latitude,
              longitude: hotel.longitude,
              latitudeDelta: 0.05,
              longitudeDelta: 0.05,
            });
          }
        }
      } catch (err) {
        console.error("Failed to fetch hotel", err);
=======
>>>>>>> Destination-Management
      } finally {
        setLoading(false);
      }
    };
<<<<<<< HEAD

    checkRole();
    fetchHotelData();
  }, [id]);
=======
    checkRole();
  }, []);
>>>>>>> Destination-Management

  const filteredPlaces = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return TOURIST_PLACES;

    return TOURIST_PLACES.filter((place) => {
      return (
        place.name.toLowerCase().includes(normalizedQuery) ||
        place.district.toLowerCase().includes(normalizedQuery) ||
        place.category.toLowerCase().includes(normalizedQuery)
      );
    });
  }, [query]);

  const toggleFacility = (key: keyof typeof facilities) => {
    setFacilities(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const addRoomConfig = () => {
    if (!tempPrice) {
      Alert.alert("Validation", "Please enter a price for the room.");
      return;
    }
<<<<<<< HEAD

    const cleanPrice = tempPrice.replace(/,/g, '');
    const priceVal = parseFloat(cleanPrice);
    if (isNaN(priceVal) || priceVal <= 0) {
      Alert.alert("Validation", "Price must be a positive number.");
      return;
    }
=======
>>>>>>> Destination-Management
    
    // Check if type already exists
    if (roomConfigs.some(r => r.type === tempType)) {
      Alert.alert("Validation", `You already added a ${tempType} room.`);
      return;
    }

    let calculatedDiscountPrice = '';
<<<<<<< HEAD
    if (tempDiscount) {
      const discountPercentage = parseFloat(tempDiscount);
      if (isNaN(discountPercentage) || discountPercentage < 0 || discountPercentage > 100) {
        Alert.alert("Validation", "Discount must be between 0% and 100%.");
        return;
      }
=======
    const cleanPrice = tempPrice.replace(/,/g, '');
    if (tempDiscount) {
      const priceVal = parseFloat(cleanPrice);
      const discountPercentage = parseFloat(tempDiscount);
>>>>>>> Destination-Management
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

<<<<<<< HEAD
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

=======
>>>>>>> Destination-Management
  const removeRoomConfig = (index: number) => {
    setRoomConfigs(prev => prev.filter((_, i) => i !== index));
  };

  const handleGalleryChange = (text: string, index: number) => {
    const newGallery = [...galleryImages];
    newGallery[index] = text;
    setGalleryImages(newGallery);
  };

  const handleAddHotel = async () => {
<<<<<<< HEAD
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

=======
>>>>>>> Destination-Management
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
<<<<<<< HEAD
      let uploadedMainImagePath = mainImage;
      if (mainImage && !mainImage.startsWith('http')) {
        uploadedMainImagePath = await uploadFile(mainImage);
      } else if (mainImage && mainImage.startsWith(API_BASE_URL)) {
        uploadedMainImagePath = mainImage.replace(API_BASE_URL, '');
      }

      // 2. Upload Gallery Images
      let uploadedGalleryPaths: string[] = [];
      const imagesToUpload = galleryImages.filter(img => !img.startsWith('http'));
      const existingImages = galleryImages.filter(img => img.startsWith(API_BASE_URL)).map(img => img.replace(API_BASE_URL, ''));
      
      if (imagesToUpload.length > 0) {
        const formData = new FormData();
        for (const uri of imagesToUpload) {
=======
      const uploadedMainImagePath = await uploadFile(mainImage);

      // 2. Upload Gallery Images
      let uploadedGalleryPaths: string[] = [];
      if (galleryImages.length > 0) {
        // Since our backend has a /multiple endpoint, we can use it, 
        // but it's simpler to upload them one by one or all at once.
        // Let's use the multiple endpoint logic.
        const formData = new FormData();
        for (const uri of galleryImages) {
>>>>>>> Destination-Management
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
<<<<<<< HEAD
      uploadedGalleryPaths = [...existingImages, ...uploadedGalleryPaths];

      // 3. Save Hotel
      const token = await AsyncStorage.getItem("auth:token");
      const url = id ? `${API_BASE_URL}/hotels/${id}` : `${API_BASE_URL}/hotels/add`;
      const method = id ? "PUT" : "POST";
      
      const response = await fetch(url, {
        method,
=======

      // 3. Save Hotel
      const token = await AsyncStorage.getItem("auth:token");
      const response = await fetch(`${API_BASE_URL}/hotels/add`, {
        method: "POST",
>>>>>>> Destination-Management
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
<<<<<<< HEAD
          latitude: selectedLocation?.latitude,
          longitude: selectedLocation?.longitude,
=======
>>>>>>> Destination-Management
        }),
      });

      const data = await response.json();

      if (!response.ok) {
<<<<<<< HEAD
        throw new Error(data.message || (id ? "Failed to update hotel" : "Failed to add hotel"));
      }

      Alert.alert("Success", id ? "Hotel updated successfully!" : "Hotel registered successfully!");
      if (id) {
         router.back();
         return;
      }
=======
        throw new Error(data.message || "Failed to add hotel");
      }

      Alert.alert("Success", "Hotel registered successfully!");
>>>>>>> Destination-Management
      
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
<<<<<<< HEAD
        <Stack.Screen options={{ headerShown: false }} />
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.headerRow}>
            <Text style={styles.title}>{id ? "Edit Hotel" : "Register Hotel"}</Text>
=======
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.headerRow}>
            <Text style={styles.title}>Register Hotel</Text>
>>>>>>> Destination-Management
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
<<<<<<< HEAD
                onChangeText={(t) => { setHotelName(t); markTouched('hotelName'); }}
                onBlur={() => markTouched('hotelName')}
                placeholder="e.g. Grand Heritage Resort"
                style={[styles.formInput, touched.hotelName && errors.hotelName && styles.errorInput]}
              />
              {touched.hotelName && errors.hotelName && (
                <Text style={styles.errorText}>{errors.hotelName}</Text>
              )}
=======
                onChangeText={setHotelName}
                placeholder="e.g. Grand Heritage Resort"
                style={styles.formInput}
              />
>>>>>>> Destination-Management
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Location (City / Area) *</Text>
              <TextInput
                value={location}
<<<<<<< HEAD
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
=======
                onChangeText={setLocation}
                placeholder="e.g. Galle Fort"
                style={styles.formInput}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Full Address *</Text>
              <TextInput
                value={address}
                onChangeText={setAddress}
                placeholder="Street address, City"
                style={styles.formInput}
              />
>>>>>>> Destination-Management
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Description *</Text>
              <TextInput
                value={description}
<<<<<<< HEAD
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
=======
                onChangeText={setDescription}
                placeholder="Tell guests what makes your hotel special..."
                multiline
                numberOfLines={4}
                style={[styles.formInput, styles.textArea]}
              />
>>>>>>> Destination-Management
            </View>

            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.label}>Contact Email *</Text>
                <TextInput
                  value={contactEmail}
<<<<<<< HEAD
                  onChangeText={(t) => { setContactEmail(t); markTouched('contactEmail'); }}
                  onBlur={() => markTouched('contactEmail')}
                  placeholder="hotel@example.com"
                  keyboardType="email-address"
                  style={[styles.formInput, touched.contactEmail && errors.contactEmail && styles.errorInput]}
                />
                {touched.contactEmail && errors.contactEmail && (
                  <Text style={styles.errorText}>{errors.contactEmail}</Text>
                )}
=======
                  onChangeText={setContactEmail}
                  placeholder="hotel@example.com"
                  keyboardType="email-address"
                  style={styles.formInput}
                />
>>>>>>> Destination-Management
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Contact Phone *</Text>
              <TextInput
                value={contactPhone}
<<<<<<< HEAD
                onChangeText={(t) => { setContactPhone(t); markTouched('contactPhone'); }}
                onBlur={() => markTouched('contactPhone')}
                placeholder="+94 77 123 4567"
                keyboardType="phone-pad"
                style={[styles.formInput, touched.contactPhone && errors.contactPhone && styles.errorInput]}
              />
              {touched.contactPhone && errors.contactPhone && (
                <Text style={styles.errorText}>{errors.contactPhone}</Text>
              )}
=======
                onChangeText={setContactPhone}
                placeholder="+94 77 123 4567"
                keyboardType="phone-pad"
                style={styles.formInput}
              />
>>>>>>> Destination-Management
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

            <View style={styles.row}>
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
<<<<<<< HEAD
              <Text style={styles.submitButtonText}>{id ? "Update Property" : "Register Property"}</Text>
=======
              <Text style={styles.submitButtonText}>Register Property</Text>
>>>>>>> Destination-Management
            )}
          </Pressable>

          <View style={{ height: 40 }} />
        </ScrollView>
      </SafeAreaView>
    );
  }






  return (
    <SafeAreaView style={styles.container}>
<<<<<<< HEAD
      <Stack.Screen options={{ headerShown: false }} />
=======
>>>>>>> Destination-Management
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>Search Tourist Places</Text>
          <IconSymbol name="magnifyingglass" size={22} color="#0b3a53" />
        </View>
        <Text style={styles.subtitle}>
          Find destinations by place name, district, or category.
        </Text>

        <View style={styles.searchWrapper}>
          <IconSymbol name="magnifyingglass" size={18} color="#64748b" />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search places like Sigiriya, Galle, Wildlife"
            placeholderTextColor="#94a3b8"
            style={styles.searchInput}
          />
        </View>

        <View style={styles.resultsHeader}>
          <Text style={styles.resultsText}>{filteredPlaces.length} places found</Text>
        </View>

        {filteredPlaces.length === 0 ? (
          <View style={styles.emptyState}>
            <IconSymbol name="magnifyingglass" size={36} color="#9ca3af" />
            <Text style={styles.emptyStateText}>No places found. Try another keyword.</Text>
          </View>
        ) : (
          filteredPlaces.map((place) => (
            <View key={place.name} style={styles.card}>
              <View style={styles.cardTopRow}>
                <Text style={styles.placeName}>{place.name}</Text>
                <Text style={styles.badge}>{place.category}</Text>
              </View>
              <Text style={styles.district}>{place.district}</Text>
              <Text style={styles.description}>{place.description}</Text>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f4f8fb',
  },
  content: {
    padding: 20,
    gap: 12,
  },
  headerRow: {
    marginTop: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#0b3a53',
  },
  subtitle: {
    color: '#475569',
    fontSize: 14,
    lineHeight: 20,
  },
  searchWrapper: {
    marginTop: 8,
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#d9e3ea',
    paddingHorizontal: 12,
    minHeight: 50,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  searchInput: {
    flex: 1,
    color: '#0f172a',
    fontSize: 15,
  },
  resultsHeader: {
    marginTop: 6,
  },
  resultsText: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '600',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 14,
    gap: 6,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
  },
  placeName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
  },
  badge: {
    backgroundColor: '#e2f3ff',
    color: '#075985',
    fontSize: 11,
    fontWeight: '700',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    textTransform: 'uppercase',
  },
  district: {
    color: '#334155',
    fontWeight: '700',
    fontSize: 13,
  },
  description: {
    color: '#475569',
    fontSize: 13,
    lineHeight: 18,
  },
  emptyState: {
    marginTop: 30,
    padding: 28,
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  emptyStateText: {
    color: '#64748b',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
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
  row: {
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
<<<<<<< HEAD
  mapContainer: {
    height: 200,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(26, 59, 47, 0.05)',
  },
  map: {
    width: '100%',
    height: '100%',
  },
  coordinatesText: {
    fontSize: 12,
    color: 'rgba(26, 59, 47, 0.6)',
    marginTop: 4,
    marginLeft: 4,
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
    marginTop: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
    maxHeight: 200,
    zIndex: 999,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(26, 59, 47, 0.05)',
    gap: 8,
  },
  suggestionText: {
    fontSize: 13,
    color: '#1A3B2F',
    flex: 1,
  },
  searchLoader: {
    position: 'absolute',
    right: 12,
    top: 16,
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
  webMapFallback: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F0FAF5',
    borderRadius: 12,
    gap: 12,
  },
  webMapText: {
    fontSize: 14,
    color: '#999',
    fontWeight: '600',
    textAlign: 'center',
  },
=======
>>>>>>> Destination-Management
});
