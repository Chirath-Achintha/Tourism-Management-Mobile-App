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
  Modal,
} from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
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
  // New colors for badges and cards
  badgeBackground: '#EEF6FF',
  hotelCardBackground: '#F8FAFF',
};

const INCLUDED_OPTIONS = [
  { key: 'includeMeals', label: 'Meals', icon: 'restaurant-outline' },
  { key: 'includeTransport', label: 'Transport', icon: 'car-outline' },
  { key: 'includeHotels', label: 'Accommodation', icon: 'bed-outline' },
  { key: 'includeActivities', label: 'Activities', icon: 'bicycle-outline' },
];

export default function TourPackageDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [pkg, setPkg] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);
  const [selectedDay, setSelectedDay] = useState<any>(null);
  const [dayModalVisible, setDayModalVisible] = useState(false);

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

  const formatCategory = (value?: string) => {
    const raw = String(value || '').trim();
    if (!raw) return 'Tour';
    return raw
      .split('-')
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
  };

  const normalizeValue = (value?: string) => {
    const raw = String(value || '').trim();
    return raw || 'Not specified';
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
        <Stack.Screen options={{ title: 'Package Details' }} />
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
      <Stack.Screen options={{ title: pkg.name || 'Package Details' }} />
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
          <View style={styles.ratingBadge}>
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
          </View>
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
            label={formatCategory(pkg.category)}
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
            {INCLUDED_OPTIONS.map((item: any) => (
              <IncludedItem
                key={item.key}
                icon={item.icon}
                label={item.label}
                value={pkg[item.key] ? 'Included' : 'Not specified'}
              />
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Package Details</Text>
          <View style={styles.detailsCard}>
            <DetailRow label="Category" value={formatCategory(pkg.category)} />
            <DetailRow label="Start Date" value={normalizeValue(pkg.startDate)} />
            <DetailRow label="End Date" value={normalizeValue(pkg.endDate)} />
            <DetailRow label="Duration" value={`${pkg.duration || 'N/A'} day(s)`} />
            <DetailRow label="Max Participants" value={String(pkg.maxParticipants || 'N/A')} />
          </View>
        </View>

        {/* Itinerary */}
        <View style={styles.section}>
          <View style={styles.itineraryHeader}>
            <Text style={styles.sectionTitle}>Itinerary</Text>
            {pkg.timeline && pkg.timeline.length > 0 && (
              <Pressable onPress={() => router.push(`/tour-packages/${id}/itinerary` as any)}>
                <Text style={styles.viewAllLink}>VIEW ALL</Text>
              </Pressable>
            )}
          </View>

          {pkg.timeline && pkg.timeline.length > 0 ? (
            pkg.timeline.slice(0, 3).map((day: any, idx: number) => (
              <Pressable
                key={idx}
                style={styles.previewCard}
                onPress={() => { setSelectedDay({ ...day, index: idx }); setDayModalVisible(true); }}
              >
                <View style={styles.previewRow}>
                  <View style={styles.previewBulletWrap}>
                    <View style={styles.previewBulletOuter}>
                      <View style={styles.previewBulletInner} />
                    </View>
                  </View>

                  <View style={styles.previewBody}>
                    <Text style={styles.previewLabel}>{`Day ${idx + 1}`}</Text>
                    <Text style={styles.previewTitle}>{day.title || 'Untitled'}</Text>
                    <Text style={styles.previewText} numberOfLines={2}>{day.notes || 'Experience the highlights of this day'}</Text>

                    {day.places && day.places.length > 0 && (
                      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.previewThumbs}>
                        {day.places.slice(0,2).map((p: any, i:number) => (
                          <Image key={i} source={{ uri: p.imageUrl || '' }} style={styles.previewThumb} />
                        ))}
                      </ScrollView>
                    )}
                  </View>
                </View>
              </Pressable>
            ))
          ) : (
            <Text style={styles.noDataText}>Itinerary not available</Text>
          )}

          {/* Day Detail Modal */}
          <Modal
            visible={dayModalVisible}
            animationType="slide"
            transparent
            onRequestClose={() => setDayModalVisible(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.modalBox}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>{selectedDay?.title || `Day ${selectedDay ? selectedDay.index + 1 : ''}`}</Text>
                  <Pressable onPress={() => setDayModalVisible(false)} style={styles.modalClose}>
                    <Text style={{ fontSize: 16, color: '#64748b' }}>Close</Text>
                  </Pressable>
                </View>
                <ScrollView style={styles.modalContent}>
                  <View>
                    <Text style={styles.modalTitle}>{`Day ${selectedDay ? selectedDay.index + 1 : ''}`}</Text>
                    <Text style={styles.modalSubtitle}>{selectedDay?.title || ''}</Text>
                  </View>
                  <Text style={styles.modalSectionTitle}>Overview</Text>
                  <Text style={styles.modalText}>{selectedDay?.notes || 'No details provided.'}</Text>

                  {selectedDay?.hotelName ? (
                    <View style={styles.hotelCard}>
                      <Ionicons name="bed-outline" size={22} color={COLORS.blue} />
                      <View style={{ marginLeft: 12, flex: 1 }}>
                        <Text style={styles.hotelName}>{selectedDay.hotelName}</Text>
                        {selectedDay.hotelLocation ? <Text style={styles.hotelLocation}>{selectedDay.hotelLocation}</Text> : null}
                      </View>
                    </View>
                  ) : null}

                  {selectedDay?.places && selectedDay.places.length > 0 ? (
                    <>
                      <Text style={styles.modalSectionTitle}>Places You'll Visit</Text>
                      {selectedDay.places.map((p: any, i: number) => (
                        <View key={i} style={styles.placeRowAlt}>
                          <Ionicons name="location-outline" size={18} color={COLORS.accent} />
                          <View style={{ marginLeft: 10, flex: 1 }}>
                            <Text style={styles.placeName}>{p.name}</Text>
                            {p.notes ? <Text style={styles.placeNotes}>{p.notes}</Text> : null}
                          </View>
                        </View>
                      ))}
                    </>
                  ) : (
                    <Text style={[styles.modalSubText, { marginTop: 8 }]}>No places listed for this day.</Text>
                  )}
                </ScrollView>
              </View>
            </View>
          </Modal>
        </View>

        {/* Pricing Section */}
        <View style={styles.pricingSection}>
          <View>
            <Text style={styles.priceLabel}>Starting From</Text>
            <Text style={styles.priceAmount}>LKR {pkg.price ? Number(pkg.price).toLocaleString() : 'N/A'}</Text>
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

const IncludedItem = ({ icon, label, value }: any) => (
  <View style={styles.includedItem}>
    <View style={styles.includedIconBox}>
      <Ionicons name={icon} size={18} color={COLORS.blue} />
    </View>
    <Text style={styles.includedLabel}>{label}</Text>
    <Text style={styles.includedValue} numberOfLines={2}>{value}</Text>
  </View>
);

const DetailRow = ({ label, value }: { label: string; value: string }) => (
  <View style={styles.detailRow}>
    <Text style={styles.detailLabel}>{label}</Text>
    <Text style={styles.detailValue}>{value}</Text>
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalBox: {
    width: '100%',
    maxHeight: '80%',
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eef2f7',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  modalClose: {
  /* preview card styles */
  previewCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: 12,
    marginBottom: 14,
    shadowColor: COLORS.secondary,
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  previewRow: { flexDirection: 'row', alignItems: 'flex-start' },
  previewBulletWrap: { width: 44, alignItems: 'center', justifyContent: 'flex-start' },
  previewBulletOuter: { width: 18, height: 18, borderRadius: 9, borderWidth: 2, borderColor: COLORS.accent, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(169,55,0,0.06)' },
  previewBulletInner: { width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.accent },
  previewBody: { flex: 1 },
  previewLabel: { fontSize: 12, color: COLORS.muted, fontWeight: '600' },
  previewTitle: { fontSize: 15, color: COLORS.text, fontWeight: '700', marginTop: 2 },
  previewText: { fontSize: 13, color: COLORS.muted, marginTop: 6 },
  previewThumbs: { marginTop: 8 },
  previewThumb: { width: 84, height: 56, borderRadius: 8, marginRight: 10, backgroundColor: COLORS.surfaceDim },
    padding: 6,
  },
  modalContent: {
    padding: 16,
  },
  modalSectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    marginTop: 8,
    marginBottom: 6,
  },
  modalText: {
    fontSize: 14,
    color: COLORS.text,
    marginBottom: 8,
  },
  modalSubText: {
    fontSize: 12,
    color: COLORS.secondary,
  },
  placeRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 8,
  },
  placeIndex: {
    fontSize: 13,
    fontWeight: '800',
    width: 20,
  },
  placeName: {
    fontSize: 14,
    fontWeight: '700',
  },
  placeNotes: {
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
  includedValue: {
    fontSize: 11,
    color: COLORS.secondary,
    textAlign: 'center',
    lineHeight: 15,
  },

  detailsCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(100, 116, 139, 0.15)',
  },
  detailLabel: {
    fontSize: 12,
    color: COLORS.secondary,
    fontWeight: '600',
  },
  detailValue: {
    fontSize: 12,
    color: COLORS.text,
    fontWeight: '700',
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
  dayBadgeWrap: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 12,
  },
  dayBadge: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: COLORS.badgeBackground,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 6,
  },
  dayBadgeText: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.blue,
  },
  dayInfo: {
    flex: 1,
  },
  dayHotelRow: {
    marginTop: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dayHotelText: {
    fontSize: 12,
    color: COLORS.secondary,
    fontWeight: '700',
  },
  hotelCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    backgroundColor: COLORS.hotelCardBackground,
    marginTop: 10,
  },
  hotelName: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.text,
  },
  hotelLocation: {
    fontSize: 13,
    color: COLORS.secondary,
    marginTop: 4,
  },
  placeRowAlt: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 8,
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
});
