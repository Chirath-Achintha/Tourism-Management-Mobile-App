import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Pressable,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { API_BASE_URL } from '@/constants/api';

const COLORS = {
  bg: '#EBF5EA',
  accent: '#FFD166',
  text: '#1A2432',
  secondary: '#64748b',
  white: '#FFFFFF',
  blue: '#3152c5',
};

export default function TourPackageDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [pkg, setPkg] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    if (id) fetchPackageDetail();
  }, [id]);

  const fetchPackageDetail = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/tour-packages/${id}`);
      const data = await res.json();
      if (res.ok) setPkg(data);
    } catch (err) {
      console.warn('Failed to load package', err);
      Alert.alert('Error', 'Could not load package details');
    } finally {
      setLoading(false);
    }
  };

  const handleBookNow = () => {
    if (!pkg) return;
    
    router.push({
      pathname: "/reservation-form",
      params: { 
        packageId: pkg._id,
        packageName: pkg.name,
        packagePrice: pkg.price
      }
    });
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.accent} />
      </View>
    );
  }

  if (!pkg) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Package not found</Text>
          <Pressable
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonText}>Go Back</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header with Image */}
        <View style={styles.imageContainer}>
          {pkg.coverImageUri ? (
            <Image
              source={{ uri: pkg.coverImageUri }}
              style={styles.heroImage}
            />
          ) : (
            <View style={[styles.heroImage, styles.imagePlaceholder]} />
          )}

          {/* Header Overlay */}
          <View style={styles.headerOverlay}>
            <Pressable onPress={() => router.back()} style={styles.headerButton}>
              <Ionicons name="arrow-back" size={24} color={COLORS.white} />
            </Pressable>
            <Pressable
              onPress={() => setIsFavorite(!isFavorite)}
              style={styles.headerButton}
            >
              <Ionicons
                name={isFavorite ? 'heart' : 'heart-outline'}
                size={24}
                color={isFavorite ? '#FF6B6B' : COLORS.white}
              />
            </Pressable>
          </View>

          {/* Rating Badge */}
          <Pressable 
            style={styles.ratingBadge}
            onPress={() => router.push({ pathname: '/reviews', params: { destinationId: id } })}
          >
            <View style={styles.ratingBox}>
              <Text style={styles.ratingText}>4.8</Text>
              <View style={styles.starsRow}>
                {[...Array(5)].map((_, i) => (
                  <Ionicons
                    key={i}
                    name="star"
                    size={10}
                    color={COLORS.accent}
                  />
                ))}
              </View>
              <Text style={styles.reviewsText}>(231 reviews)</Text>
            </View>

            <Pressable
              style={styles.bookButtonSmall}
              onPress={handleBookNow}
            >
              <Text style={styles.bookButtonSmallText}>BOOK NOW</Text>
            </Pressable>
          </Pressable>
        </View>

        {/* Title */}
        <View style={styles.titleSection}>
          <Text style={styles.packageTitle}>{pkg.name}</Text>
          <View style={styles.locationRow}>
            <Ionicons name="location-outline" size={16} color={COLORS.secondary} />
            <Text style={styles.locationText}>{pkg.destination}</Text>
          </View>
        </View>

        {/* Key Stats */}
        <View style={styles.statsRow}>
          <StatCard
            icon="calendar-outline"
            label={`${pkg.duration || 'N/A'} Days`}
          />
          <StatCard
            icon="people-outline"
            label={`Max ${pkg.maxParticipants || 'N/A'}`}
          />
          <StatCard
            icon="bar-chart-outline"
            label={pkg.category || 'Tour'}
          />
        </View>

        {/* About This Trip */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About this trip</Text>
          <Text style={styles.description}>
            {pkg.description ||
              'Embark on a journey through the heart of adventure. Explore pristine landscapes and immerse yourself in local culture.'}
          </Text>
        </View>

        {/* What's Included */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>What's Included</Text>
          <View style={styles.includedGrid}>
            <IncludedItem icon="restaurant-outline" label="Meals" />
            <IncludedItem icon="car-outline" label="Transport" />
            <IncludedItem icon="bed-outline" label="Accommodation" />
            <IncludedItem icon="person-outline" label="Guide" />
          </View>
        </View>

        {/* Itinerary */}
        <View style={styles.section}>
          <View style={styles.itineraryHeader}>
            <Text style={styles.sectionTitle}>Itinerary</Text>
            {pkg.timeline && pkg.timeline.length > 0 && (
              <Pressable>
                <Text style={styles.viewAllLink}>VIEW ALL</Text>
              </Pressable>
            )}
          </View>

          {pkg.timeline && pkg.timeline.length > 0 ? (
            pkg.timeline.slice(0, 3).map((day: any, idx: number) => (
              <View key={idx} style={styles.dayCard}>
                <View style={styles.dayNumber}>
                  <Text style={styles.dayNumberText}>Day {idx + 1}</Text>
                </View>
                <View style={styles.dayContent}>
                  <Text style={styles.dayTitle}>{day.title || `Day ${idx + 1}`}</Text>
                  <Text style={styles.dayNotes} numberOfLines={2}>
                    {day.notes || 'Experience the highlights of this day'}
                  </Text>
                </View>
              </View>
            ))
          ) : (
            <Text style={styles.noDataText}>Itinerary not available</Text>
          )}
        </View>

        {/* Reviews Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Reviews & Ratings</Text>
            <Pressable 
              onPress={() => router.push({ pathname: '/reviews', params: { destinationId: id } })}
              style={styles.viewAllButton}
            >
              <Text style={styles.viewAllText}>VIEW ALL</Text>
              <Ionicons name="chevron-forward" size={14} color={COLORS.blue} />
            </Pressable>
          </View>
          <View style={styles.reviewSummary}>
            <View style={styles.ratingSummaryBox}>
              <Ionicons name="star" size={24} color={COLORS.accent} />
              <Text style={styles.ratingValue}>4.8</Text>
            </View>
            <Text style={styles.reviewCount}>Based on 231 guest reviews</Text>
          </View>
          <Pressable 
            style={styles.addReviewButton}
            onPress={() => router.push({ pathname: '/reviews', params: { destinationId: id } })}
          >
            <Text style={styles.addReviewText}>Write a Review</Text>
          </Pressable>
        </View>

        {/* Pricing Section */}
        <View style={styles.pricingSection}>
          <View>
            <Text style={styles.priceLabel}>Starting From</Text>
            <Text style={styles.priceAmount}>${pkg.price || 'N/A'}</Text>
            <Text style={styles.pricePerPerson}>per person</Text>
          </View>
          <Pressable
            style={styles.bookButton}
            onPress={handleBookNow}
          >
            <Text style={styles.bookButtonText}>Book Now</Text>
          </Pressable>
        </View>

        {/* Spacer */}
        <View style={{ height: 30 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const StatCard = ({ icon, label }: any) => (
  <View style={styles.statCard}>
    <Ionicons name={icon} size={20} color={COLORS.accent} />
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

const IncludedItem = ({ icon, label }: any) => (
  <View style={styles.includedItem}>
    <View style={styles.includedIconBox}>
      <Ionicons name={icon} size={18} color={COLORS.blue} />
    </View>
    <Text style={styles.includedLabel}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    fontSize: 16,
    color: COLORS.text,
    marginBottom: 16,
  },
  backButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: COLORS.accent,
    borderRadius: 8,
  },
  backButtonText: {
    color: COLORS.text,
    fontWeight: '700',
  },

  // Hero Image
  imageContainer: {
    position: 'relative',
    height: 320,
    marginBottom: 20,
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    backgroundColor: '#C0C0C0',
  },
  headerOverlay: {
    position: 'absolute',
    top: 12,
    left: 12,
    right: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ratingBadge: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    right: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  ratingBox: {
    backgroundColor: COLORS.white,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 16,
    fontWeight: '800',
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
  },
  bookButtonSmall: {
    backgroundColor: COLORS.blue,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  bookButtonSmallText: {
    color: COLORS.white,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },

  // Title Section
  titleSection: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  packageTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 6,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  locationText: {
    fontSize: 13,
    color: COLORS.secondary,
  },

  // Stats Row
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.white,
    paddingHorizontal: 12,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    gap: 6,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.text,
    textAlign: 'center',
  },

  // Section
  section: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 12,
  },
  description: {
    fontSize: 13,
    color: COLORS.secondary,
    lineHeight: 20,
  },

  // Included Items
  includedGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  includedItem: {
    width: '48%',
    backgroundColor: COLORS.white,
    paddingHorizontal: 12,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    gap: 8,
  },
  includedIconBox: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: 'rgba(49, 82, 197, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  includedLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.text,
  },

  // Itinerary
  itineraryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  viewAllLink: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.blue,
  },
  dayCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    gap: 12,
  },
  dayNumber: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: 'rgba(49, 82, 197, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayNumberText: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.blue,
  },
  dayContent: {
    flex: 1,
    justifyContent: 'center',
  },
  dayTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 4,
  },
  dayNotes: {
    fontSize: 12,
    color: COLORS.secondary,
    lineHeight: 16,
  },
  noDataText: {
    fontSize: 13,
    color: COLORS.secondary,
    textAlign: 'center',
    paddingVertical: 20,
  },

  // Pricing Section
  pricingSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: COLORS.white,
    borderRadius: 16,
  },
  priceLabel: {
    fontSize: 12,
    color: COLORS.secondary,
    marginBottom: 4,
  },
  priceAmount: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.text,
  },
  pricePerPerson: {
    fontSize: 11,
    color: COLORS.secondary,
    marginTop: 2,
  },
  bookButton: {
    backgroundColor: COLORS.blue,
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 12,
  },
  bookButtonText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '800',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  viewAllLink: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.blue,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viewAllText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.blue,
  },
  reviewSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginVertical: 4,
  },
  ratingSummaryBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.white,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 1,
  },
  ratingValue: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.text,
  },
  reviewCount: {
    fontSize: 13,
    color: COLORS.secondary,
    fontWeight: '600',
  },
  addReviewButton: {
    marginTop: 16,
    backgroundColor: 'rgba(49, 82, 197, 0.08)',
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(49, 82, 197, 0.2)',
  },
  addReviewText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.blue,
  },
});
