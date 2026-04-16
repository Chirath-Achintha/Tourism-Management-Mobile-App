import React, { useMemo, useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { IconSymbol } from '@/components/ui/icon-symbol';

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
  const [query, setQuery] = useState('');

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

  return (
    <SafeAreaView style={styles.container}>
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
});
