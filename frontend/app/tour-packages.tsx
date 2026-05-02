import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  Pressable,
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  TextInput,
} from 'react-native';
import { API_BASE_URL } from '@/constants/api';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const COLORS = {
  bg: '#EBF5EA',
  accent: '#FFD166',
  text: '#1A2432',
  secondary: '#64748b',
  olive: '#7aad00',
};

const CATEGORIES = [
  { key: 'all', label: 'All Tours' },
  { key: 'adventure', label: 'Adventure' },
  { key: 'cultural', label: 'Cultural' },
  { key: 'beach', label: 'Beach' },
  { key: 'mountain', label: 'Mountain' },
];

export default function TourPackagesScreen() {
  const [packages, setPackages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [locationQuery, setLocationQuery] = useState('');
  const router = useRouter();

  useEffect(() => {
    fetchPackages();
  }, []);

  const fetchPackages = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/tour-packages`);
      const data = await res.json();
      if (res.ok) setPackages(data);
    } catch (err) {
      console.warn('Failed to load packages', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredPackages = useMemo(() => {
    let list = packages;
    if (selectedCategory !== 'all') {
      list = list.filter((p) => p.category === selectedCategory);
    }
    if (locationQuery && locationQuery.trim()) {
      const q = locationQuery.trim().toLowerCase();
      list = list.filter((p) => (p.destination || '').toLowerCase().includes(q));
    }
    return list;
  }, [packages, selectedCategory, locationQuery]);

  const renderCategoryPill = ({ item }: any) => {
    const isSelected = selectedCategory === item.key;
    return (
      <Pressable
        onPress={() => setSelectedCategory(item.key)}
        style={[
          styles.categoryPill,
          isSelected && styles.categoryPillActive,
        ]}
      >
        <Text
          style={[
            styles.categoryPillText,
            isSelected && styles.categoryPillTextActive,
          ]}
        >
          {item.label}
        </Text>
      </Pressable>
    );
  };

  const renderPackageCard = ({ item }: any) => (
    <Pressable
      style={styles.packageCard}
      onPress={() => router.push(`/tour-packages/${item._id}` as any)}
    >
      {item.coverImageUri ? (
        <Image source={{ uri: item.coverImageUri }} style={styles.cardImage} />
      ) : (
        <View style={styles.cardImagePlaceholder} />
      )}

      <LinearGradient
        colors={['transparent', 'rgba(26, 36, 50, 0.7)', 'rgba(26, 36, 50, 0.95)']}
        style={styles.cardGradient}
      >
        <View style={styles.cardContent}>
          <Text style={styles.packageName} numberOfLines={2}>
            {item.name}
          </Text>

          <View style={styles.cardMeta}>
            <View style={styles.priceTag}>
              <Text style={styles.priceText}>LKR {item.price ? Number(item.price).toLocaleString() : 'N/A'}</Text>
            </View>

            <View style={styles.metaInfo}>
              {item.duration && (
                <View style={styles.metaItem}>
                  <Ionicons name="calendar-outline" size={14} color={COLORS.accent} />
                  <Text style={styles.metaText}>{item.duration} days</Text>
                </View>
              )}
              {item.maxParticipants && (
                <View style={styles.metaItem}>
                  <Ionicons name="people-outline" size={14} color={COLORS.accent} />
                  <Text style={styles.metaText}>{item.maxParticipants} pax</Text>
                </View>
              )}
            </View>
          </View>

          <Text style={styles.destination} numberOfLines={1}>
            📍 {item.destination || 'Destination TBA'}
          </Text>
        </View>
      </LinearGradient>
    </Pressable>
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.accent} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={styles.eyebrow}>Explore</Text>
          <Text style={styles.headerTitle}>Discover Your Next Adventure</Text>
        </View>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Curated Experiences Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Curated Experiences</Text>

          {/* Category Filter */}
          <FlatList
            data={CATEGORIES}
            keyExtractor={(i) => i.key}
            renderItem={renderCategoryPill}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryList}
          />

          {/* Location Search */}
          <View style={styles.searchRow}>
            <View style={styles.searchInputWrap}>
              <Ionicons name="search-outline" size={18} color={COLORS.secondary} />
              <TextInput
                placeholder="Search by location"
                placeholderTextColor="#94a3b8"
                value={locationQuery}
                onChangeText={setLocationQuery}
                style={styles.searchInput}
              />
            </View>
            <Pressable onPress={() => setLocationQuery('')} style={styles.clearButton}>
              <Ionicons name="close-circle" size={20} color={COLORS.secondary} />
            </Pressable>
          </View>
          {/* Package Cards */}
          {filteredPackages.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="briefcase-outline" size={56} color={COLORS.secondary} />
              <Text style={styles.emptyText}>No packages in this category</Text>
            </View>
          ) : (
            <FlatList
              data={filteredPackages}
              keyExtractor={(i) => i._id}
              renderItem={renderPackageCard}
              scrollEnabled={false}
              contentContainerStyle={styles.cardList}
            />
          )}
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
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  section: {
    marginVertical: 8,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 16,
  },
  categoryList: {
    gap: 8,
    marginBottom: 12,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  searchInputWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#f8fbff',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: COLORS.text,
  },
  clearButton: {
    padding: 8,
  },
  categoryPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(26, 36, 50, 0.1)',
  },
  categoryPillActive: {
    backgroundColor: COLORS.text,
    borderColor: COLORS.text,
  },
  categoryPillText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.secondary,
  },
  categoryPillTextActive: {
    color: COLORS.accent,
  },
  cardList: {
    gap: 14,
    paddingBottom: 20,
  },
  packageCard: {
    height: 280,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: COLORS.text,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  cardImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  cardImagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#C0C0C0',
  },
  cardGradient: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: 16,
  },
  cardContent: {
    gap: 10,
  },
  packageName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    lineHeight: 24,
  },
  cardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  priceTag: {
    backgroundColor: COLORS.accent,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  priceText: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.text,
  },
  metaInfo: {
    flexDirection: 'row',
    gap: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.accent,
  },
  destination: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
    marginTop: 4,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    gap: 12,
  },
  emptyText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.secondary,
  },
});
