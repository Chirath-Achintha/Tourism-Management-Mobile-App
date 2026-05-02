import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, Pressable, ScrollView, ActivityIndicator, Image, Alert, Linking, Dimensions, Modal } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { API_BASE_URL } from '@/constants/api';

const { width } = Dimensions.get('window');

const COLORS = {
  bg: '#F0FAF5',
  accent: '#FFD166',
  text: '#1A3B2F',
  secondary: 'rgba(26, 59, 47, 0.65)',
  white: '#FFFFFF',
  blue: '#3152c5',
  cardBg: '#FFFFFF',
};

export default function TouristHotelDetailScreen() {
  const params = useLocalSearchParams();
  const id = params.id;
  const [hotel, setHotel] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
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

  const handleCall = () => {
    if (hotel.contactPhone) {
      Linking.openURL(`tel:${hotel.contactPhone}`).catch(() => {
        Alert.alert("Error", "Could not initiate call.");
      });
    }
  };

  const handleEmail = () => {
    if (hotel.contactEmail) {
      Linking.openURL(`mailto:${hotel.contactEmail}`).catch(() => {
        Alert.alert("Error", "Could not open email application.");
      });
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 30 }}>
        
        {/* Cover Hero Image & Overlays */}
        <View style={styles.imageContainer}>
          {hotel.mainImage ? (
            <Image 
              source={{ uri: hotel.mainImage.startsWith('http') ? hotel.mainImage : `${API_BASE_URL}${hotel.mainImage}` }} 
              style={styles.heroImage} 
            />
          ) : (
            <View style={[styles.heroImage, styles.imagePlaceholder]}>
              <Ionicons name="business" size={64} color="rgba(26, 36, 50, 0.15)" />
            </View>
          )}

          {/* Gradient for clear readability */}
          <LinearGradient
            colors={['rgba(0,0,0,0.4)', 'transparent', 'rgba(26,59,47,0.85)']}
            style={StyleSheet.absoluteFillObject}
          />

          {/* Top Actions overlay */}
          <View style={styles.headerOverlay}>
            <Pressable onPress={() => router.back()} style={styles.headerButton}>
              <Ionicons name="chevron-back" size={24} color={COLORS.white} />
            </Pressable>
            <Pressable onPress={() => setIsFavorite(!isFavorite)} style={styles.headerButton}>
              <Ionicons name={isFavorite ? "heart" : "heart-outline"} size={22} color={isFavorite ? "#FF4A4A" : COLORS.white} />
            </Pressable>
          </View>

          {/* Hotel Basic Title Overlay */}
          <View style={styles.titleOverlay}>
            <Text style={styles.overlayEyebrow}>LUXURY STAY</Text>
            <View style={styles.titleRow}>
              <Text style={styles.overlayTitle}>{hotel.hotelName}</Text>
              <View style={styles.ratingInline}>
                <Ionicons name="star" size={16} color={COLORS.accent} />
                <Text style={styles.ratingInlineText}>
                  {hotel.googleRating ? Number(hotel.googleRating).toFixed(1) : '4.8'}
                </Text>
              </View>
            </View>
            <View style={styles.overlayLocationRow}>
              <Ionicons name="location" size={14} color={COLORS.accent} />
              <Text style={styles.overlayLocationText}>{hotel.location}</Text>
            </View>
          </View>
        </View>

        {/* Gallery Section */}
        {hotel.galleryImages && hotel.galleryImages.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Photo Gallery</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.galleryScroll}>
              {hotel.galleryImages.map((img: string, idx: number) => {
                const imgUri = img.startsWith('http') ? img : `${API_BASE_URL}${img}`;
                return (
                  <Pressable key={idx} onPress={() => setSelectedImage(imgUri)}>
                    <Image source={{ uri: imgUri }} style={styles.galleryImage} />
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        )}

        {/* About the Hotel */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About this hotel</Text>
          <Text style={styles.description}>{hotel.description}</Text>
        </View>

        {/* Room Types & Special Rates */}
        {(hotel.roomConfigs || hotel.rooms) && (hotel.roomConfigs || hotel.rooms).length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Rates & Room Types</Text>
            <View style={styles.roomList}>
              {(hotel.roomConfigs || hotel.rooms).map((room: any, idx: number) => (
                <View key={idx} style={styles.roomCard}>
                  <View style={styles.roomHeaderRow}>
                    <Text style={styles.roomType}>{room.type} Room</Text>
                    <View style={styles.roomPriceBadge}>
                      <Text style={styles.roomPriceText}>LKR {room.price}</Text>
                    </View>
                  </View>
                  {room.discountPrice && room.discountPrice > 0 ? (
                    <Text style={styles.roomDiscount}>
                      <Ionicons name="pricetag" size={12} color="#34d399" /> Current Offer: LKR {room.discountPrice}
                    </Text>
                  ) : null}
                  {room.amenities ? (
                    <Text style={styles.roomAmenities}>
                      <Ionicons name="information-circle-outline" size={12} color={COLORS.secondary} /> Amenities: {room.amenities}
                    </Text>
                  ) : null}
                </View>
              ))}
            </View>
          </View>
        )}

        {/* What's Included / Facilities */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Facilities Offered</Text>
          <View style={styles.facilitiesGrid}>
            {hotel.facilities?.wifi && (
              <View style={styles.includedItem}>
                <View style={styles.includedIconBox}>
                  <Ionicons name="wifi" size={18} color="#1A3B2F" />
                </View>
                <Text style={styles.includedLabel}>High-Speed WiFi</Text>
                <Text style={styles.includedValue}>Complimentary</Text>
              </View>
            )}
            {hotel.facilities?.airConditioning && (
              <View style={styles.includedItem}>
                <View style={styles.includedIconBox}>
                  <Ionicons name="snow" size={18} color="#1A3B2F" />
                </View>
                <Text style={styles.includedLabel}>Air Conditioning</Text>
                <Text style={styles.includedValue}>In all rooms</Text>
              </View>
            )}
            {hotel.facilities?.parking && (
              <View style={styles.includedItem}>
                <View style={styles.includedIconBox}>
                  <Ionicons name="car" size={18} color="#1A3B2F" />
                </View>
                <Text style={styles.includedLabel}>Secure Parking</Text>
                <Text style={styles.includedValue}>Complimentary</Text>
              </View>
            )}
            {hotel.facilities?.swimmingPool && (
              <View style={styles.includedItem}>
                <View style={styles.includedIconBox}>
                  <Ionicons name="water" size={18} color="#1A3B2F" />
                </View>
                <Text style={styles.includedLabel}>Swimming Pool</Text>
                <Text style={styles.includedValue}>Full access</Text>
              </View>
            )}
          </View>
        </View>

        {/* Contact info with interactive links */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact Support & Enquiries</Text>
          <View style={styles.contactGrid}>
            <Pressable style={styles.contactOption} onPress={handleCall}>
              <View style={styles.contactIconBox}>
                <Ionicons name="call" size={16} color={COLORS.white} />
              </View>
              <Text style={styles.contactLabel}>Phone Number</Text>
              <Text style={styles.contactValue} numberOfLines={1}>{hotel.contactPhone}</Text>
            </Pressable>

            <Pressable style={styles.contactOption} onPress={handleEmail}>
              <View style={[styles.contactIconBox, { backgroundColor: '#44B681' }]}>
                <Ionicons name="mail" size={16} color={COLORS.white} />
              </View>
              <Text style={styles.contactLabel}>Email Address</Text>
              <Text style={styles.contactValue} numberOfLines={1}>{hotel.contactEmail}</Text>
            </Pressable>

            {hotel.websiteLink ? (
              <Pressable 
                style={[styles.contactOption, { width: '100%' }]} 
                onPress={() => {
                  if (hotel.websiteLink) {
                    Linking.openURL(hotel.websiteLink).catch(() => {
                      Alert.alert("Error", "Could not open the website.");
                    });
                  }
                }}
              >
                <View style={[styles.contactIconBox, { backgroundColor: '#3b82f6' }]}>
                  <Ionicons name="globe" size={16} color={COLORS.white} />
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={[styles.contactLabel, { textAlign: 'left' }]}>Official Website</Text>
                  <Text style={[styles.contactValue, { textAlign: 'left', textDecorationLine: 'underline', color: '#1d4ed8' }]} numberOfLines={1}>
                    {hotel.websiteLink}
                  </Text>
                </View>
              </Pressable>
            ) : null}
          </View>
        </View>

      </ScrollView>

      {selectedImage && (
        <Modal visible={true} transparent={true} animationType="fade" onRequestClose={() => setSelectedImage(null)}>
          <View style={styles.modalBackground}>
            <Pressable style={styles.modalCloseButton} onPress={() => setSelectedImage(null)}>
              <Ionicons name="close" size={28} color="#fff" />
            </Pressable>
            <Image source={{ uri: selectedImage }} style={styles.modalFullImage} />
          </View>
        </Modal>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  modalBackground: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  modalCloseButton: {
    position: 'absolute',
    top: 60,
    right: 25,
    zIndex: 10,
    backgroundColor: 'rgba(0,0,0,0.5)',
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalFullImage: {
    width: '92%',
    height: '75%',
    resizeMode: 'contain',
    borderRadius: 12,
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

  // Cover Hero Section
  imageContainer: {
    position: 'relative',
    height: 340,
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerOverlay: {
    position: 'absolute',
    top: 50,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    zIndex: 10,
  },
  headerButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(26,59,47,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleOverlay: {
    position: 'absolute',
    bottom: 24,
    left: 20,
    right: 20,
  },
  overlayEyebrow: {
    fontSize: 11,
    fontWeight: '900',
    color: COLORS.accent,
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  ratingInline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.3)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  ratingInlineText: {
    fontSize: 14,
    fontWeight: '900',
    color: COLORS.white,
  },
  overlayTitle: {
    fontSize: 26,
    fontWeight: '900',
    color: COLORS.white,
    letterSpacing: -0.5,
    flex: 1,
    marginRight: 10,
  },
  overlayLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  overlayLocationText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.85)',
    fontWeight: '600',
  },

  // Rating Badge right underneath hero image
  ratingBadge: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: 20,
    marginTop: 16,
    zIndex: 15,
  },
  ratingBox: {
    backgroundColor: COLORS.white,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(26, 59, 47, 0.08)',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 3,
  },
  ratingText: {
    fontSize: 18,
    fontWeight: '900',
    color: COLORS.text,
  },
  starsRow: {
    flexDirection: 'row',
    gap: 2,
    marginTop: 2,
  },
  reviewsText: {
    fontSize: 10,
    color: COLORS.secondary,
    marginTop: 2,
    fontWeight: '600',
  },
  bookButtonSmall: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 6,
  },
  bookButtonSmallText: {
    color: COLORS.white,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.5,
  },

  // Sections
  section: {
    paddingHorizontal: 20,
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.text,
    letterSpacing: -0.3,
    marginBottom: 10,
  },
  description: {
    fontSize: 13.5,
    color: COLORS.secondary,
    lineHeight: 21,
    fontWeight: '500',
  },

  // Included Items Grid
  facilitiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  includedItem: {
    width: '48%',
    backgroundColor: COLORS.white,
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(26, 59, 47, 0.06)',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.02,
    shadowRadius: 5,
  },
  includedIconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(26, 59, 47, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  includedLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.text,
  },
  includedValue: {
    fontSize: 11,
    color: COLORS.secondary,
    textAlign: 'center',
    lineHeight: 15,
  },

  // Gallery Images
  galleryScroll: {
    gap: 12,
  },
  galleryImage: {
    width: 150,
    height: 110,
    borderRadius: 18,
    resizeMode: 'cover',
  },

  // Rooms and Rate Details
  roomList: {
    gap: 12,
  },
  roomCard: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 16,
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(26, 59, 47, 0.06)',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.02,
    shadowRadius: 4,
  },
  roomHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  roomType: {
    fontSize: 15,
    fontWeight: '900',
    color: COLORS.text,
  },
  roomPriceBadge: {
    backgroundColor: 'rgba(255, 209, 102, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  roomPriceText: {
    fontSize: 13,
    fontWeight: '900',
    color: COLORS.text,
  },
  roomDiscount: {
    fontSize: 13,
    fontWeight: '800',
    color: '#2e7d32',
    marginTop: 2,
  },
  roomAmenities: {
    fontSize: 12.5,
    color: COLORS.secondary,
    fontWeight: '600',
    marginTop: 4,
  },

  // Contacts
  contactGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  contactOption: {
    width: '48%',
    backgroundColor: COLORS.white,
    padding: 14,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(26, 59, 47, 0.06)',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.02,
    shadowRadius: 4,
    flexDirection: 'column',
    justifyContent: 'center',
  },
  contactIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#3b82f6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  contactLabel: {
    fontSize: 11,
    color: COLORS.secondary,
    fontWeight: '700',
    textAlign: 'center',
  },
  contactValue: {
    fontSize: 13,
    color: COLORS.text,
    fontWeight: '800',
    textAlign: 'center',
    marginTop: 2,
  },

  // Sticky Bottom Control Bar
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 94,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: 'rgba(26, 59, 47, 0.06)',
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 24,
    elevation: 12,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 10,
  },
  pricingLeft: {
    flex: 1,
  },
  pricingLabel: {
    fontSize: 11,
    color: COLORS.secondary,
    fontWeight: '700',
  },
  pricingValue: {
    fontSize: 20,
    fontWeight: '900',
    color: COLORS.text,
    letterSpacing: -0.5,
  },
  pricingSubtitle: {
    fontSize: 10,
    color: COLORS.secondary,
    fontWeight: '600',
  },
  primaryActionBtn: {
    flex: 1,
    backgroundColor: '#1A3B2F',
    height: 52,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  primaryActionText: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: -0.2,
  },
});
