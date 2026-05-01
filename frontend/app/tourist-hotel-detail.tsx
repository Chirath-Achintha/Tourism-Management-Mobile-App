import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, Pressable, ScrollView, ActivityIndicator, Image, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { API_BASE_URL } from '@/constants/api';

const COLORS = {
  bg: '#EBF5EA',
  accent: '#FFD166',
  text: '#1A2432',
  secondary: '#64748b',
};

export default function TouristHotelDetailScreen() {
  const params = useLocalSearchParams();
  const id = params.id;
  const [hotel, setHotel] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const fetchHotelDetails = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/hotels/${id}`);
      const data = await res.json();
      if (res.ok) {
        setHotel(data);
      } else {
        throw new Error(data.message || "Failed to load hotel details.");
      }
    } catch (error: any) {
      console.error("Fetch hotel details failed:", error);
      Alert.alert("API Error", error.message || "Could not load hotel.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchHotelDetails();
    }
  }, [id]);

  if (loading) {
    return (
      <View style={styles.center}>
        <StatusBar style="dark" />
        <ActivityIndicator size="large" color={COLORS.accent} />
        <Text style={styles.loadingText}>Loading hotel details...</Text>
      </View>
    );
  }

  if (!hotel) {
    return (
      <View style={styles.center}>
        <StatusBar style="dark" />
        <Ionicons name="alert-circle-outline" size={56} color="rgba(26, 36, 50, 0.4)" />
        <Text style={styles.emptyText}>Hotel not found.</Text>
        <Pressable onPress={() => router.back()} style={styles.backLink}>
          <Text style={styles.backLinkText}>Go Back</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton} hitSlop={15}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={styles.eyebrow}>Hotel Details</Text>
          <Text style={styles.headerTitle} numberOfLines={1}>{hotel.hotelName}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Main Cover Image */}
        {hotel.mainImage ? (
          <Image source={{ uri: `${API_BASE_URL}${hotel.mainImage}` }} style={styles.coverImage} />
        ) : (
          <View style={styles.coverImagePlaceholder}>
            <Ionicons name="business" size={64} color="rgba(26, 36, 50, 0.1)" />
          </View>
        )}

        {/* Basic Metadata */}
        <View style={styles.cardSection}>
          <Text style={styles.sectionTitle}>{hotel.hotelName}</Text>
          <Text style={styles.location}>
            <Ionicons name="location-outline" size={16} color="rgba(26, 36, 50, 0.6)" /> {hotel.location}
          </Text>
          <Text style={styles.description}>{hotel.description}</Text>
        </View>

        {/* Facilities Section */}
        <View style={styles.cardSection}>
          <Text style={styles.sectionTitle}>Facilities</Text>
          <View style={styles.facilitiesContainer}>
            {hotel.facilities?.wifi && (
              <View style={styles.facilityTag}>
                <Ionicons name="wifi" size={16} color="#1A2432" />
                <Text style={styles.facilityText}>Free High-Speed WiFi</Text>
              </View>
            )}
            {hotel.facilities?.airConditioning && (
              <View style={styles.facilityTag}>
                <Ionicons name="snow" size={16} color="#1A2432" />
                <Text style={styles.facilityText}>Air Conditioning</Text>
              </View>
            )}
            {hotel.facilities?.parking && (
              <View style={styles.facilityTag}>
                <Ionicons name="car" size={16} color="#1A2432" />
                <Text style={styles.facilityText}>Complimentary Parking</Text>
              </View>
            )}
          </View>
        </View>

        {/* Gallery Images Section */}
        {hotel.galleryImages && hotel.galleryImages.length > 0 && (
          <View style={styles.cardSection}>
            <Text style={styles.sectionTitle}>Gallery</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.galleryScroll}>
              {hotel.galleryImages.map((img: string, idx: number) => (
                <Image key={idx} source={{ uri: `${API_BASE_URL}${img}` }} style={styles.galleryImage} />
              ))}
            </ScrollView>
          </View>
        )}

        {/* Room Types & Pricing */}
        {hotel.rooms && hotel.rooms.length > 0 && (
          <View style={styles.cardSection}>
            <Text style={styles.sectionTitle}>Room Rates & Details</Text>
            <View style={styles.roomList}>
              {hotel.rooms.map((room: any, idx: number) => (
                <View key={idx} style={styles.roomCard}>
                  <View style={styles.roomHeaderRow}>
                    <Text style={styles.roomType}>{room.type} Room</Text>
                    <View style={styles.roomPriceBadge}>
                      <Text style={styles.roomPriceText}>{room.price} LKR</Text>
                    </View>
                  </View>
                  {room.discountPrice && room.discountPrice > 0 ? (
                    <Text style={styles.roomDiscount}>Special Discount: {room.discountPrice} LKR</Text>
                  ) : null}
                  {room.amenities && (
                    <Text style={styles.roomAmenities}>Amenities: {room.amenities}</Text>
                  )}
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Contact Info */}
        <View style={[styles.cardSection, { marginBottom: 30 }]}>
          <Text style={styles.sectionTitle}>Contact & Reservation</Text>
          <View style={styles.contactContainer}>
            <View style={styles.contactItem}>
              <Ionicons name="call-outline" size={18} color="#1A2432" />
              <Text style={styles.contactText}>{hotel.contactPhone}</Text>
            </View>
            <View style={styles.contactItem}>
              <Ionicons name="mail-outline" size={18} color="#1A2432" />
              <Text style={styles.contactText}>{hotel.contactEmail}</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: COLORS.bg,
  },
  loadingText: {
    fontSize: 14,
    color: COLORS.secondary,
    fontWeight: '600',
  },
  emptyText: {
    color: COLORS.secondary,
    fontSize: 15,
    fontWeight: '600',
  },
  backLink: {
    marginTop: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: COLORS.text,
    borderRadius: 12,
  },
  backLinkText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(26, 36, 50, 0.05)',
    backgroundColor: '#ffffff',
  },
  backButton: {
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
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.text,
    marginTop: 2,
  },
  scrollContent: {
    padding: 16,
    gap: 16,
  },
  coverImage: {
    width: '100%',
    height: 220,
    borderRadius: 24,
    resizeMode: 'cover',
  },
  coverImagePlaceholder: {
    width: '100%',
    height: 220,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(26, 36, 50, 0.08)',
  },
  cardSection: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(26, 36, 50, 0.08)',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.text,
  },
  location: {
    fontSize: 13,
    color: COLORS.secondary,
    fontWeight: '600',
    marginTop: 2,
  },
  description: {
    fontSize: 13,
    color: COLORS.secondary,
    lineHeight: 20,
    fontWeight: '500',
    marginTop: 4,
  },
  facilitiesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 6,
  },
  facilityTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(26, 36, 50, 0.05)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  facilityText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.text,
  },
  galleryScroll: {
    gap: 12,
    marginTop: 6,
  },
  galleryImage: {
    width: 140,
    height: 100,
    borderRadius: 16,
    resizeMode: 'cover',
  },
  roomList: {
    gap: 12,
    marginTop: 4,
  },
  roomCard: {
    backgroundColor: 'rgba(26, 36, 50, 0.03)',
    borderRadius: 16,
    padding: 14,
    gap: 6,
  },
  roomHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  roomType: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.text,
  },
  roomPriceBadge: {
    backgroundColor: COLORS.accent,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  roomPriceText: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.text,
  },
  roomDiscount: {
    fontSize: 12,
    fontWeight: '700',
    color: '#34d399',
  },
  roomAmenities: {
    fontSize: 12,
    color: COLORS.secondary,
    fontWeight: '500',
  },
  contactContainer: {
    gap: 10,
    marginTop: 4,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  contactText: {
    fontSize: 13,
    color: COLORS.text,
    fontWeight: '700',
  },
});
