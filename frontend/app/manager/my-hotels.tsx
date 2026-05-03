import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, SafeAreaView, Pressable, Image, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '@/constants/api';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, Stack, useFocusEffect } from 'expo-router';

export default function MyHotelsScreen() {
  const [hotels, setHotels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'verified' | 'pending' | 'declined'>('all');
  const router = useRouter();

  useFocusEffect(
    useCallback(() => {
      fetchMyHotels();
    }, [])
  );

  const fetchMyHotels = async () => {
    try {
      const token = await AsyncStorage.getItem('auth:token');
      const response = await fetch(`${API_BASE_URL}/hotels/my-hotels`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (response.ok) {
        setHotels(data);
      } else {
        console.error('Failed to fetch hotels:', data.message);
      }
    } catch (error) {
      console.error('Error fetching hotels:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (id: string, name: string) => {
    Alert.alert(
      "Delete Hotel",
      `Are you sure you want to delete ${name}?`,
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive",
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem('auth:token');
              const response = await fetch(`${API_BASE_URL}/hotels/${id}`, {
                method: 'DELETE',
                headers: {
                  'Authorization': `Bearer ${token}`
                }
              });
              if (response.ok) {
                setHotels(prev => prev.filter(h => h._id !== id));
                Alert.alert("Success", "Hotel deleted successfully");
              } else {
                const data = await response.json();
                Alert.alert("Error", data.message || "Failed to delete hotel");
              }
            } catch (error) {
              console.error("Error deleting hotel:", error);
              Alert.alert("Error", "Server error deleting hotel");
            }
          }
        }
      ]
    );
  };

  const filteredHotels = React.useMemo(() => {
    let list = hotels;
    if (selectedFilter !== 'all') {
      list = list.filter(h => {
        if (selectedFilter === 'verified') return (h.isVerified === true || h.status === 'verified') && h.status !== 'declined';
        if (selectedFilter === 'declined') return h.status === 'declined';
        if (selectedFilter === 'pending') return h.isVerified !== true && h.status !== 'declined';
        return true;
      });
    }
    return list;
  }, [hotels, selectedFilter]);

  const renderHotelItem = ({ item }: { item: any }) => (
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
          <Text style={styles.hotelName}>{item.hotelName}</Text>
          <View style={[
            styles.statusBadge, 
            item.status === 'declined' ? styles.declinedBadge : (item.status === 'verified' || item.isVerified ? styles.verifiedBadge : styles.pendingBadge)
          ]}>
            <Text style={[
              styles.statusText, 
              item.status === 'declined' ? styles.declinedText : (item.status === 'verified' || item.isVerified ? styles.verifiedText : styles.pendingText)
            ]}>
              {item.status === 'declined' ? 'Declined' : (item.status === 'verified' || item.isVerified ? 'Verified' : 'Pending')}
            </Text>
          </View>
        </View>
        <Text style={styles.location}><Ionicons name="location-outline" size={14} /> {item.location}</Text>
        <Text style={styles.contact} numberOfLines={1}>{item.contactEmail} | {item.contactPhone}</Text>

        {item.status === 'declined' && item.declineReason ? (
          <View style={styles.declineReasonBox}>
            <Ionicons name="warning" size={14} color="#c62828" />
            <Text style={styles.declineReasonText}><Text style={{ fontWeight: '800' }}>Reason:</Text> {item.declineReason}</Text>
          </View>
        ) : null}

        <View style={styles.actions}>
          {item.status !== 'declined' && (
            <Pressable style={styles.actionBtn} onPress={() => router.push({ pathname: '/manager/edit-hotel' as any, params: { id: item._id } })}>
              <Ionicons name="pencil" size={16} color="#1A3B2F" />
              <Text style={styles.actionBtnText}>Edit</Text>
            </Pressable>
          )}
          <Pressable style={[styles.actionBtn, styles.deleteBtn, item.status === 'declined' && { flex: 1 }]} onPress={() => handleDelete(item._id, item.hotelName)}>
            <Ionicons name="trash" size={16} color="#ff4444" />
            <Text style={[styles.actionBtnText, { color: '#ff4444' }]}>Delete</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#1A3B2F" />
        </Pressable>
        <Text style={styles.headerTitle}>My Hotels</Text>
        <View style={{ width: 40 }} />
      </View>

      {!loading && hotels.length > 0 && (
        <View style={styles.filterContainer}>
          <Pressable 
            style={[styles.filterPill, selectedFilter === 'all' && styles.filterPillActive]} 
            onPress={() => setSelectedFilter('all')}
          >
            <Text style={[styles.filterText, selectedFilter === 'all' && styles.filterTextActive]}>All</Text>
          </Pressable>
          <Pressable 
            style={[styles.filterPill, selectedFilter === 'pending' && styles.filterPillActive]} 
            onPress={() => setSelectedFilter('pending')}
          >
            <Text style={[styles.filterText, selectedFilter === 'pending' && styles.filterTextActive]}>Pending</Text>
          </Pressable>
          <Pressable 
            style={[styles.filterPill, selectedFilter === 'verified' && styles.filterPillActive]} 
            onPress={() => setSelectedFilter('verified')}
          >
            <Text style={[styles.filterText, selectedFilter === 'verified' && styles.filterTextActive]}>Verified</Text>
          </Pressable>
          <Pressable 
            style={[styles.filterPill, selectedFilter === 'declined' && styles.filterPillActive]} 
            onPress={() => setSelectedFilter('declined')}
          >
            <Text style={[styles.filterText, selectedFilter === 'declined' && styles.filterTextActive]}>Declined</Text>
          </Pressable>
        </View>
      )}

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#FFD166" />
        </View>
      ) : hotels.length === 0 ? (
        <View style={styles.centerContainer}>
          <Ionicons name="business-outline" size={64} color="rgba(26, 59, 47, 0.2)" />
          <Text style={styles.emptyText}>You haven't added any hotels yet.</Text>
          <Pressable style={styles.addBtn} onPress={() => router.push('/(tabs)/explore' as any)}>
            <Text style={styles.addBtnText}>Add New Hotel</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={filteredHotels}
          keyExtractor={(item) => item._id}
          renderItem={renderHotelItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.centerContainer}>
              <Ionicons name="business-outline" size={64} color="rgba(26, 59, 47, 0.2)" />
              <Text style={styles.emptyText}>No hotels matched this filter.</Text>
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
    backgroundColor: '#F0FAF5',
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(26, 59, 47, 0.05)',
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    backgroundColor: '#F0FAF5',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1A3B2F',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  listContent: {
    padding: 20,
    gap: 16,
  },
  emptyText: {
    fontSize: 16,
    color: 'rgba(26, 59, 47, 0.6)',
    marginTop: 16,
    marginBottom: 24,
    fontWeight: '500',
  },
  addBtn: {
    backgroundColor: '#FFD166',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
  },
  addBtnText: {
    color: '#1A3B2F',
    fontWeight: '800',
    fontSize: 15,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(26, 59, 47, 0.08)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  hotelImage: {
    width: '100%',
    height: 160,
    backgroundColor: '#F0FAF5',
  },
  imagePlaceholder: {
    width: '100%',
    height: 160,
    backgroundColor: '#F0FAF5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardContent: {
    padding: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  hotelName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1A3B2F',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  verifiedBadge: {
    backgroundColor: '#e6f4ea',
  },
  pendingBadge: {
    backgroundColor: '#fff3cd',
  },
  declinedBadge: {
    backgroundColor: '#ffebee',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
  },
  verifiedText: {
    color: '#1e8e3e',
  },
  pendingText: {
    color: '#856404',
  },
  declinedText: {
    color: '#c62828',
  },
  filterContainer: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 4,
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
  location: {
    fontSize: 14,
    color: 'rgba(26, 59, 47, 0.7)',
    fontWeight: '600',
    marginBottom: 4,
  },
  contact: {
    fontSize: 13,
    color: 'rgba(26, 59, 47, 0.5)',
    marginBottom: 16,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(26, 59, 47, 0.05)',
    paddingTop: 16,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    gap: 6,
    paddingVertical: 10,
    backgroundColor: '#F0FAF5',
    borderRadius: 12,
  },
  deleteBtn: {
    backgroundColor: '#fff0f0',
  },
  actionBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1A3B2F',
  },
  declineReasonBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFEBEE',
    borderWidth: 1,
    borderColor: 'rgba(198, 40, 40, 0.1)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  declineReasonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#c62828',
    flex: 1,
  },
});
