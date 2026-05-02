import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, SafeAreaView, Pressable, ActivityIndicator, Alert, Image, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { API_BASE_URL } from '@/constants/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function AdminHotelsScreen() {
  const [hotels, setHotels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();

  const fetchHotels = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('auth:token');
      
      if (!token) {
        Alert.alert("Session Expired", "Please log in again as an administrator.");
        router.replace("/login");
        return;
      }

      const response = await fetch(`${API_BASE_URL}/admin/hotels`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      
      if (response.ok) {
        setHotels(data);
      } else {
        throw new Error(data.message || "Failed to fetch hotels.");
      }
    } catch (error: any) {
      console.error("Fetch hotels failed:", error);
      Alert.alert("API Error", error.message || "Could not connect to the database.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHotels();
  }, []);

  const handleDelete = async (hotelId: string, hotelName: string) => {
    Alert.alert(
      "Confirm Delete",
      `Are you sure you want to delete "${hotelName}" from the system? This cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "DELETE", 
          style: "destructive",
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem('auth:token');
              const response = await fetch(`${API_BASE_URL}/admin/hotels/${hotelId}`, {
                method: 'DELETE',
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json'
                }
              });

              if (response.ok) {
                Alert.alert("Success", "Hotel deleted successfully!");
                setHotels(prev => prev.filter(h => h._id !== hotelId));
              } else {
                const data = await response.json();
                throw new Error(data.message || "Failed to delete hotel.");
              }
            } catch (err: any) {
              Alert.alert("Error", err.message);
            }
          }
        }
      ]
    );
  };

  const filteredHotels = useMemo(() => {
    let list = hotels;
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter(h => 
        h.hotelName.toLowerCase().includes(q) ||
        h.location.toLowerCase().includes(q)
      );
    }
    return list;
  }, [hotels, searchQuery]);

  const renderItem = ({ item }: any) => (
    <View style={styles.card}>
      {item.mainImage ? (
        <Image source={{ uri: item.mainImage.startsWith('http') ? item.mainImage : `${API_BASE_URL}${item.mainImage}` }} style={styles.hotelImage} />
      ) : (
        <View style={styles.imagePlaceholder}>
          <Ionicons name="business" size={40} color="rgba(26, 59, 47, 0.2)" />
        </View>
      )}
      <View style={styles.cardContent}>
        <View style={styles.headerRow}>
          <Text style={styles.hotelName} numberOfLines={1}>{item.hotelName}</Text>
          <View style={[styles.statusBadge, item.isVerified ? styles.verifiedBadge : styles.pendingBadge]}>
            <Text style={[styles.statusText, item.isVerified ? styles.verifiedText : styles.pendingText]}>
              {item.isVerified ? 'Verified' : 'Pending'}
            </Text>
          </View>
        </View>
        
        <Text style={styles.location}>
          <Ionicons name="location-outline" size={14} color="rgba(26, 59, 47, 0.6)" /> {item.location}
        </Text>
        <Text style={styles.contact} numberOfLines={1}>
          {item.contactEmail} | {item.contactPhone}
        </Text>

        <View style={styles.actions}>
          <Pressable style={styles.deleteBtn} onPress={() => handleDelete(item._id, item.hotelName)}>
            <Ionicons name="trash" size={16} color="#ffffff" />
            <Text style={styles.deleteBtnText}>Remove from System</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton} hitSlop={15}>
            <Ionicons name="chevron-back" size={24} color="#1A3B2F" />
          </Pressable>
          <Text style={styles.headerTitle}>Hotel Management</Text>
          <Pressable onPress={fetchHotels} style={styles.refreshButton} hitSlop={15}>
            <Ionicons name="refresh" size={20} color="#1A3B2F" />
          </Pressable>
        </View>

        {/* Search & Filters Area */}
        <View style={styles.filterSection}>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={18} color="rgba(26, 59, 47, 0.4)" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search by name or location..."
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <Pressable onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={18} color="rgba(26, 59, 47, 0.4)" />
              </Pressable>
            )}
          </View>
        </View>

        {loading ? (
          <View style={styles.loadingArea}>
            <ActivityIndicator size="large" color="#FFD166" />
            <Text style={styles.loadingText}>Fetching hotels...</Text>
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
                <Ionicons name="business-outline" size={48} color="rgba(26, 59, 47, 0.1)" />
                <Text style={styles.emptyText}>No hotels matched.</Text>
              </View>
            }
          />
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0FAF5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(26, 59, 47, 0.05)',
    backgroundColor: '#ffffff',
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0FAF5',
  },
  refreshButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#1A3B2F',
    letterSpacing: -0.5,
  },
  loadingArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: 'rgba(26, 59, 47, 0.6)',
    fontWeight: '600',
  },
  listContent: {
    padding: 20,
    gap: 16,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(26, 59, 47, 0.08)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 10,
    elevation: 2,
  },
  hotelImage: {
    width: '100%',
    height: 160,
    resizeMode: 'cover',
  },
  imagePlaceholder: {
    width: '100%',
    height: 160,
    backgroundColor: '#F0FAF5',
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
    fontWeight: '900',
    color: '#1A3B2F',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  verifiedBadge: {
    backgroundColor: '#E8F5E9',
  },
  pendingBadge: {
    backgroundColor: '#FFF8E1',
  },
  statusText: {
    fontSize: 10,
    fontWeight: '800',
  },
  verifiedText: {
    color: '#2E7D32',
  },
  pendingText: {
    color: '#F57F17',
  },
  location: {
    fontSize: 14,
    color: 'rgba(26, 59, 47, 0.7)',
    marginTop: 6,
    fontWeight: '600',
  },
  contact: {
    fontSize: 13,
    color: 'rgba(26, 59, 47, 0.45)',
    marginTop: 4,
    fontWeight: '600',
  },
  actions: {
    marginTop: 14,
  },
  deleteBtn: {
    backgroundColor: '#D32F2F',
    paddingVertical: 12,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  deleteBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },
  emptyState: {
    marginTop: 80,
    alignItems: 'center',
    gap: 16,
  },
  emptyText: {
    color: 'rgba(26, 59, 47, 0.4)',
    fontSize: 16,
    fontWeight: '700',
  },
  filterSection: {
    paddingHorizontal: 20,
    paddingTop: 16,
    gap: 12,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(26, 59, 47, 0.08)',
    paddingHorizontal: 16,
    height: 48,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#1A3B2F',
    fontWeight: '600',
  },
  filterContainer: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  filterPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: 'rgba(26, 59, 47, 0.08)',
  },
  filterPillActive: {
    backgroundColor: '#FFD166',
    borderColor: '#FFD166',
  },
  filterText: {
    fontSize: 12,
    fontWeight: '800',
    color: 'rgba(26, 59, 47, 0.6)',
  },
  filterTextActive: {
    color: '#1A3B2F',
  },
});
