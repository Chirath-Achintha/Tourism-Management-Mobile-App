import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { View, Text, StyleSheet, FlatList, SafeAreaView, Pressable, ActivityIndicator, Alert, ScrollView, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { API_BASE_URL } from '@/constants/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

const DASHBOARD_PRIMARY = '#1A3B2F';
const DASHBOARD_SECONDARY = '#2D5C4D';

const DEFAULT_CATEGORY_FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'adventure', label: 'Adventure' },
  { key: 'cultural', label: 'Cultural' },
  { key: 'beach', label: 'Beach' },
  { key: 'mountain', label: 'Mountain' },
  { key: 'city', label: 'City Tour' },
  { key: 'wildlife', label: 'Wildlife' },
  { key: 'forest', label: 'Forest' },
];

export default function TourPackagesScreen() {
  const [packages, setPackages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedPriceFilter, setSelectedPriceFilter] = useState<'all' | 'under1000' | '1500to2500' | '2500to5000' | '5000plus'>('all');
  const [selectedDurationFilter, setSelectedDurationFilter] = useState<'all' | '1to3' | '4to7' | '8plus'>('all');
  const router = useRouter();

  const publishedPackages = useMemo(() => {
    // Treat missing `published` as published for backward compatibility with existing records.
    return packages.filter((item) => item?.published !== false);
  }, [packages]);

  const categoryFilters = useMemo(() => {
    const predefined = new Map(DEFAULT_CATEGORY_FILTERS.map((item) => [item.key, item]));

    publishedPackages.forEach((item) => {
      const key = String(item?.category || '').trim().toLowerCase();
      if (!key || predefined.has(key)) return;
      const label = key
        .split('-')
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ');
      predefined.set(key, { key, label });
    });

    return Array.from(predefined.values());
  }, [publishedPackages]);

  const filteredPackages = useMemo(() => {
    const normalizedSearch = searchQuery.trim().toLowerCase();

    return publishedPackages.filter((item) => {
      const searchable = `${item?.name || ''} ${item?.description || ''} ${item?.category || ''}`.toLowerCase();

      if (normalizedSearch && !searchable.includes(normalizedSearch)) {
        return false;
      }

      if (selectedCategory !== 'all') {
        const itemCategory = String(item?.category || '').toLowerCase();
        if (itemCategory !== selectedCategory) {
          return false;
        }
      }

      const price = Number(item?.price);
      // Price filters are in LKR ranges
      if (selectedPriceFilter === 'under1000' && !(price < 1000)) return false;
      if (selectedPriceFilter === '1500to2500' && !(price >= 1500 && price <= 2500)) return false;
      if (selectedPriceFilter === '2500to5000' && !(price > 2500 && price <= 5000)) return false;
      if (selectedPriceFilter === '5000plus' && !(price > 5000)) return false;

      const duration = Number(item?.duration);
      if (selectedDurationFilter === '1to3' && !(duration >= 1 && duration <= 3)) return false;
      if (selectedDurationFilter === '4to7' && !(duration >= 4 && duration <= 7)) return false;
      if (selectedDurationFilter === '8plus' && !(duration >= 8)) return false;

      return true;
    });
  }, [publishedPackages, searchQuery, selectedCategory, selectedPriceFilter, selectedDurationFilter]);
  const fetchTourPackages = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('auth:token');
      
      if (!token) {
        Alert.alert("Session Expired", "Please log in again as an administrator.");
        router.replace("/login" as any);
        return;
      }

      const response = await fetch(`${API_BASE_URL}/admin/tour-packages`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('Fetch response status:', response.status);
      console.log('API URL:', `${API_BASE_URL}/admin/tour-packages`);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response:', errorText);
        Alert.alert("API Error", `Status ${response.status}: ${errorText.slice(0, 100)}`);
        return;
      }

      const data = await response.json();
      console.log('Fetched packages:', data);
      setPackages(Array.isArray(data) ? data : []);
    } catch (error: any) {
      console.error("Fetch tour packages failed:", error.message);
      Alert.alert("Error", error.message || "Could not connect to the database.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTourPackages();
  }, []);

  // Also refresh when screen comes into focus (handles navigation back from add/edit)
  useFocusEffect(
    useCallback(() => {
      fetchTourPackages();
    }, [])
  );

  const handleAddPackage = () => {
    router.push('/admin/add-tour-package' as any);
  };

  const handleEditPackage = (packageId: string) => {
    router.push(`/admin/edit-tour-package/${packageId}` as any);
  };

  const handleViewPackage = (packageId: string) => {
    router.push(`/tour-packages/${packageId}` as any);
  };
  const handleDeletePackage = async (packageId: string) => {
    Alert.alert(
      "Confirm Delete",
      "Are you sure you want to delete this tour package?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem('auth:token');
              const response = await fetch(`${API_BASE_URL}/admin/tour-packages/${packageId}`, {
                method: 'DELETE',
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json'
                }
              });

              console.log('Delete response status:', response.status);

              if (!response.ok) {
                const errorText = await response.text();
                console.error('Delete error response:', errorText);
                Alert.alert("Error", `Failed to delete: ${errorText.slice(0, 100)}`);
                return;
              }

              Alert.alert("Success", "Tour package deleted successfully");
              fetchTourPackages();
            } catch (error: any) {
              console.error("Delete error:", error.message);
              Alert.alert("Error", error.message || "An error occurred while deleting");
            }
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" backgroundColor="#FFFFFF" />
      
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#1A3B2F" />
        </Pressable>
        <Text style={styles.title}>Tour Packages</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Add Package Button */}
      <Pressable 
        style={({ pressed }) => [
          styles.addButton,
          pressed && styles.addButtonPressed
        ]}
        onPress={handleAddPackage}
      >
        <Ionicons name="add" size={24} color="#FFFFFF" />
        <Text style={styles.addButtonText}>Add Tour Package</Text>
      </Pressable>

      <View style={styles.filtersPanel}>
        <View style={styles.searchInputWrap}>
          <Ionicons name="search" size={18} color="#6B7280" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search packages, destination, category..."
            placeholderTextColor="#9CA3AF"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery ? (
            <Pressable onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={18} color="#9CA3AF" />
            </Pressable>
          ) : null}
        </View>

        <Text style={styles.filterHeading}>Category</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
          {categoryFilters.map((category) => (
            <FilterChip
              key={category.key}
              label={category.label}
              selected={selectedCategory === category.key}
              onPress={() => setSelectedCategory(category.key)}
            />
          ))}
        </ScrollView>

        <Text style={styles.filterHeading}>Price</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
          <FilterChip label="All" selected={selectedPriceFilter === 'all'} onPress={() => setSelectedPriceFilter('all')} />
          <FilterChip label="Under LKR 1,000" selected={selectedPriceFilter === 'under1000'} onPress={() => setSelectedPriceFilter('under1000')} />
          <FilterChip label="LKR 1,500 - 2,500" selected={selectedPriceFilter === '1500to2500'} onPress={() => setSelectedPriceFilter('1500to2500')} />
          <FilterChip label="LKR 2,500 - 5,000" selected={selectedPriceFilter === '2500to5000'} onPress={() => setSelectedPriceFilter('2500to5000')} />
          <FilterChip label="LKR 5,000+" selected={selectedPriceFilter === '5000plus'} onPress={() => setSelectedPriceFilter('5000plus')} />
        </ScrollView>

        <Text style={styles.filterHeading}>Duration</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
          <FilterChip label="Any" selected={selectedDurationFilter === 'all'} onPress={() => setSelectedDurationFilter('all')} />
          <FilterChip label="1-3 days" selected={selectedDurationFilter === '1to3'} onPress={() => setSelectedDurationFilter('1to3')} />
          <FilterChip label="4-7 days" selected={selectedDurationFilter === '4to7'} onPress={() => setSelectedDurationFilter('4to7')} />
          <FilterChip label="8+ days" selected={selectedDurationFilter === '8plus'} onPress={() => setSelectedDurationFilter('8plus')} />
        </ScrollView>
      </View>
      {/* Content */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1A3B2F" />
          <Text style={styles.loadingText}>Loading tour packages...</Text>
        </View>
      ) : publishedPackages.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="briefcase-outline" size={64} color="#C0C0C0" />
          <Text style={styles.emptyText}>No published tour packages found</Text>
          <Text style={styles.emptySubtext}>Publish packages to manage them here.</Text>
        </View>
      ) : filteredPackages.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="filter-outline" size={64} color="#C0C0C0" />
          <Text style={styles.emptyText}>No packages match your filters</Text>
          <Text style={styles.emptySubtext}>Try adjusting search text or filter chips.</Text>
        </View>
      ) : (
        <FlatList
          data={filteredPackages}
          renderItem={({ item }) => {
            const packageId = String(item?._id || item?.id || '').trim();
            return (
            <View style={styles.packageCard}>
              <Pressable style={styles.packageInfo} onPress={() => packageId && handleViewPackage(packageId)}>
                <Text style={styles.packageName}>{item.name || 'Unnamed Package'}</Text>
                <Text style={styles.packageDescription} numberOfLines={2}>
                  {item.description || 'No description'}
                </Text>
                <View style={styles.packageDetails}>
                  <View style={styles.detailBadge}>
                    <Text style={styles.badgeText}>
                      LKR {item.price ? Number(item.price).toLocaleString() : 'N/A'}
                    </Text>
                  </View>
                  <View style={styles.detailBadge}>
                    <Text style={styles.badgeText}>
                      {item.duration || 'N/A'} days
                    </Text>
                  </View>
                </View>
              </Pressable>
              <View style={styles.packageActions}>
                <Pressable 
                  style={({ pressed }) => [
                    styles.actionButton,
                    styles.editButton,
                    pressed && styles.actionButtonPressed
                  ]}
                  onPress={() => {
                    if (!packageId) {
                      Alert.alert('Error', 'Package ID is missing. Please refresh and try again.');
                      return;
                    }
                    handleEditPackage(packageId);
                  }}
                >
                  <Ionicons name="pencil" size={18} color="#FFFFFF" />
                </Pressable>
                <Pressable 
                  style={({ pressed }) => [
                    styles.actionButton,
                    styles.deleteButton,
                    pressed && styles.actionButtonPressed
                  ]}
                  onPress={() => {
                    if (!packageId) {
                      Alert.alert('Error', 'Package ID is missing. Please refresh and try again.');
                      return;
                    }
                    handleDeletePackage(packageId);
                  }}
                >
                  <Ionicons name="trash" size={18} color="#FFFFFF" />
                </Pressable>
              </View>
            </View>
          );
          }}
          keyExtractor={(item, index) => String(item?._id || item?.id || `pkg-${index}`)}
          contentContainerStyle={styles.listContent}
          scrollEnabled={true}
        />
      )}
    </SafeAreaView>
  );
}

function FilterChip({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.filterChip,
        selected && styles.filterChipSelected,
        pressed && styles.filterChipPressed,
      ]}
      onPress={onPress}
    >
      <Text style={[styles.filterChipText, selected && styles.filterChipTextSelected]}>{label}</Text>
    </Pressable>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A3B2F',
  },
  addButton: {
    flexDirection: 'row',
    backgroundColor: DASHBOARD_PRIMARY,
    marginHorizontal: 20,
    marginVertical: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  addButtonPressed: {
    opacity: 0.8,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
  },
  filtersPanel: {
    marginHorizontal: 20,
    marginBottom: 8,
  },
  searchInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 12,
    gap: 8,
    height: 44,
    marginBottom: 10,
  },
  searchInput: {
    flex: 1,
    color: '#111827',
    fontSize: 14,
  },
  filterHeading: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '700',
    marginBottom: 6,
    marginTop: 2,
  },
  filterRow: {
    paddingBottom: 8,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
  },
  filterChipSelected: {
    backgroundColor: DASHBOARD_PRIMARY,
    borderColor: DASHBOARD_PRIMARY,
  },
  filterChipPressed: {
    opacity: 0.8,
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
    textTransform: 'capitalize',
  },
  filterChipTextSelected: {
    color: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: '#666',
    fontSize: 14,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A3B2F',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  packageCard: {
    backgroundColor: '#F9F9F9',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderLeftWidth: 4,
    borderLeftColor: '#1A8E5F',
  },
  packageInfo: {
    flex: 1,
    marginRight: 12,
  },
  packageName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A3B2F',
    marginBottom: 4,
  },
  packageDescription: {
    fontSize: 13,
    color: '#666',
    marginBottom: 8,
  },
  packageDetails: {
    flexDirection: 'row',
    gap: 8,
  },
  detailBadge: {
    backgroundColor: '#E8F5F0',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#1A8E5F',
  },
  packageActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 44,
    height: 44,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionButtonPressed: {
    opacity: 0.7,
  },
  editButton: {
    backgroundColor: DASHBOARD_PRIMARY,
  },
  deleteButton: {
    backgroundColor: DASHBOARD_SECONDARY,
  },
});
