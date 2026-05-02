import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, SafeAreaView, Pressable, ActivityIndicator, Alert, Image, TextInput, ScrollView } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { API_BASE_URL } from '@/constants/api';

const COLORS = {
  bg: '#EBF5EA',
  accent: '#FFD166',
  text: '#1A2432',
  secondary: '#64748b',
};

const DISTRICTS = [
  'All',
  'Colombo',
  'Kandy',
  'Galle',
  'Matale',
  'Badulla',
  'Anuradhapura',
  'Jaffna',
  'Nuwara Eliya'
];

export default function TouristHotelsScreen() {
  const { district } = useLocalSearchParams();
  const [hotels, setHotels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState(district ? String(district) : 'All');
  const [showDistrictDropdown, setShowDistrictDropdown] = useState(false);
  const [selectedRating, setSelectedRating] = useState('All');
  const [showRatingDropdown, setShowRatingDropdown] = useState(false);
  const router = useRouter();

  const fetchHotels = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/hotels/all`);
      const data = await response.json();
      if (response.ok) {
        // Only show verified hotels to tourists
        setHotels(data.filter((h: any) => h.isVerified !== false));
      } else {
        throw new Error(data.message || "Failed to fetch hotels.");
      }
    } catch (error: any) {
      console.error("Fetch hotels failed:", error);
      Alert.alert("API Error", error.message || "Could not load hotels.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHotels();
  }, []);

  useEffect(() => {
    if (district) {
      setSelectedDistrict(String(district));
    }
  }, [district]);

  const filteredHotels = useMemo(() => {
    let list = hotels;

    if (selectedDistrict !== 'All') {
      list = list.filter(h => 
        h.location?.toLowerCase().includes(selectedDistrict.toLowerCase())
      );
    }

    if (selectedRating !== 'All') {
      const minRating = parseFloat(selectedRating);
      list = list.filter(h => {
        const rating = h.googleRating ? parseFloat(h.googleRating) : 4.8;
        return rating >= minRating;
      });
    }

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter(h => 
        h.hotelName.toLowerCase().includes(q) ||
        h.location.toLowerCase().includes(q)
      );
    }
    return list;
  }, [hotels, selectedDistrict, selectedRating, searchQuery]);

  const renderItem = ({ item }: any) => {
    // Get lowest room price
    const rooms = item.roomConfigs || item.rooms || [];
    const lowestPrice = rooms.length > 0
      ? Math.min(...rooms.map((r: any) => r.price))
      : 0;

    return (
      <Pressable 
        style={styles.card} 
        onPress={() => router.push(`/tourist-hotel-detail?id=${item._id}` as any)}
      >
        {item.mainImage ? (
          <Image source={{ uri: item.mainImage.startsWith('http') ? item.mainImage : `${API_BASE_URL}${item.mainImage}` }} style={styles.hotelImage} />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Ionicons name="business" size={40} color="rgba(26, 36, 50, 0.2)" />
          </View>
        )}
        <View style={styles.cardContent}>
          <View style={styles.headerRow}>
            <Text style={styles.hotelName} numberOfLines={1}>{item.hotelName}</Text>
          </View>
          
          <Text style={styles.location}>
            <Ionicons name="location-outline" size={14} color="rgba(26, 36, 50, 0.6)" /> {item.location}
          </Text>

          <View style={styles.facilitiesRow}>
            {item.facilities?.wifi && (
              <View style={styles.facilityTag}>
                <Ionicons name="wifi" size={12} color="#1A2432" />
                <Text style={styles.facilityText}>WiFi</Text>
              </View>
            )}
            {item.facilities?.airConditioning && (
              <View style={styles.facilityTag}>
                <Ionicons name="snow" size={12} color="#1A2432" />
                <Text style={styles.facilityText}>A/C</Text>
              </View>
            )}
            {item.facilities?.parking && (
              <View style={styles.facilityTag}>
                <Ionicons name="car" size={12} color="#1A2432" />
                <Text style={styles.facilityText}>Parking</Text>
              </View>
            )}
          </View>

          <Text style={styles.description} numberOfLines={2}>{item.description}</Text>

          <View style={styles.actions}>
            <View style={styles.contactRow}>
              <Ionicons name="star" size={16} color={COLORS.accent} />
              <Text style={[styles.contactText, { fontWeight: '700', fontSize: 13, color: COLORS.text }]}>
                {item.googleRating ? Number(item.googleRating).toFixed(1) : '4.8'}
              </Text>
            </View>
          </View>
        </View>
      </Pressable>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton} hitSlop={15}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={styles.eyebrow}>Hotels</Text>
          <Text style={styles.headerTitle}>Find the Perfect Stay</Text>
        </View>
        <Pressable onPress={fetchHotels} style={styles.refreshButton} hitSlop={15}>
          <Ionicons name="refresh" size={20} color={COLORS.text} />
        </Pressable>
      </View>

      <View style={styles.searchSection}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color="rgba(26, 36, 50, 0.4)" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search hotels by name or location..."
            placeholderTextColor="#64748b"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={18} color="rgba(26, 36, 50, 0.4)" />
            </Pressable>
          )}
        </View>

        {/* District Select box */}
        <Pressable 
          style={styles.selectBox} 
          onPress={() => setShowDistrictDropdown(!showDistrictDropdown)}
        >
          <Ionicons name="location" size={16} color="rgba(26, 36, 50, 0.5)" />
          <Text style={styles.selectText}>
            {selectedDistrict === 'All' ? 'Select District: All' : `District: ${selectedDistrict}`}
          </Text>
          <Ionicons 
            name={showDistrictDropdown ? "chevron-up" : "chevron-down"} 
            size={18} 
            color="rgba(26, 36, 50, 0.5)" 
          />
        </Pressable>

        {showDistrictDropdown && (
          <ScrollView 
            style={styles.dropdownContainer}
            nestedScrollEnabled={true}
          >
            {DISTRICTS.map((district) => (
              <Pressable
                key={district}
                style={[
                  styles.dropdownOption,
                  selectedDistrict === district && styles.dropdownOptionActive,
                ]}
                onPress={() => {
                  setSelectedDistrict(district);
                  setShowDistrictDropdown(false);
                }}
              >
                <Text
                  style={[
                    styles.dropdownOptionText,
                    selectedDistrict === district && styles.dropdownOptionTextActive,
                  ]}
                >
                  {district}
                </Text>
                {selectedDistrict === district && (
                  <Ionicons name="checkmark" size={16} color="#1A2432" />
                )}
              </Pressable>
            ))}
          </ScrollView>
        )}

        {/* Rating Select box */}
        <Pressable 
          style={[styles.selectBox, { marginTop: 12 }]} 
          onPress={() => setShowRatingDropdown(!showRatingDropdown)}
        >
          <Ionicons name="star" size={16} color="rgba(26, 36, 50, 0.5)" />
          <Text style={styles.selectText}>
            {selectedRating === 'All' ? 'Select Rating: All' : `Rating: ${selectedRating} & up`}
          </Text>
          <Ionicons 
            name={showRatingDropdown ? "chevron-up" : "chevron-down"} 
            size={18} 
            color="rgba(26, 36, 50, 0.5)" 
          />
        </Pressable>

        {showRatingDropdown && (
          <ScrollView 
            style={styles.dropdownContainer}
            nestedScrollEnabled={true}
          >
            {['All', '4.5', '4.0', '3.5', '3.0'].map((rating) => (
              <Pressable
                key={rating}
                style={[
                  styles.dropdownOption,
                  selectedRating === rating && styles.dropdownOptionActive,
                ]}
                onPress={() => {
                  setSelectedRating(rating);
                  setShowRatingDropdown(false);
                }}
              >
                <Text
                  style={[
                    styles.dropdownOptionText,
                    selectedRating === rating && styles.dropdownOptionTextActive,
                  ]}
                >
                  {rating === 'All' ? 'All' : `${rating} & up`}
                </Text>
                {selectedRating === rating && (
                  <Ionicons name="checkmark" size={16} color="#1A2432" />
                )}
              </Pressable>
            ))}
          </ScrollView>
        )}
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.accent} />
          <Text style={styles.loadingText}>Searching hotels...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredHotels}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="business-outline" size={56} color="rgba(26, 36, 50, 0.15)" />
              <Text style={styles.emptyText}>No hotels matched.</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(26, 36, 50, 0.05)',
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  refreshButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eyebrow: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.accent,
    letterSpacing: 0.5,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.text,
    marginTop: 2,
  },
  searchSection: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 4,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(26, 36, 50, 0.08)',
    paddingHorizontal: 16,
    height: 48,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: COLORS.text,
    fontWeight: '600',
  },
  listContent: {
    padding: 16,
    gap: 16,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: COLORS.secondary,
    fontWeight: '600',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(26, 36, 50, 0.08)',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.02,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  hotelImage: {
    width: '100%',
    height: 180,
    resizeMode: 'cover',
  },
  imagePlaceholder: {
    width: '100%',
    height: 180,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardContent: {
    padding: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  hotelName: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.text,
    flex: 1,
  },
  priceBadge: {
    backgroundColor: COLORS.accent,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  priceText: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.text,
  },
  location: {
    fontSize: 13,
    color: COLORS.secondary,
    marginTop: 6,
    fontWeight: '600',
  },
  facilitiesRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 10,
    flexWrap: 'wrap',
  },
  facilityTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(26, 36, 50, 0.05)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  facilityText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.text,
  },
  description: {
    fontSize: 13,
    color: COLORS.secondary,
    marginTop: 10,
    fontWeight: '500',
    lineHeight: 18,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: 'rgba(26, 36, 50, 0.05)',
    paddingTop: 12,
    marginTop: 12,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  contactText: {
    fontSize: 12,
    color: COLORS.text,
    fontWeight: '600',
  },
  emptyState: {
    paddingVertical: 80,
    alignItems: 'center',
    gap: 14,
  },
  emptyText: {
    color: COLORS.secondary,
    fontSize: 15,
    fontWeight: '600',
  },
  selectBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(26, 36, 50, 0.08)',
    paddingHorizontal: 16,
    height: 48,
    marginTop: 12,
  },
  selectText: {
    flex: 1,
    fontSize: 14,
    color: COLORS.text,
    fontWeight: '700',
    marginLeft: 8,
  },
  dropdownContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(26, 36, 50, 0.08)',
    marginTop: 8,
    overflow: 'hidden',
    maxHeight: 250,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  dropdownOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(26, 36, 50, 0.03)',
  },
  dropdownOptionActive: {
    backgroundColor: 'rgba(26, 36, 50, 0.03)',
  },
  dropdownOptionText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.secondary,
  },
  dropdownOptionTextActive: {
    color: COLORS.text,
    fontWeight: '800',
  },
});
