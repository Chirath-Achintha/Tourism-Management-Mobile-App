import React, { useEffect, useState } from 'react';
<<<<<<< HEAD
import { View, Text, StyleSheet, FlatList, ActivityIndicator, SafeAreaView, Pressable, Image, Alert } from 'react-native';
=======
import { View, Text, StyleSheet, FlatList, ActivityIndicator, SafeAreaView, Pressable, Image } from 'react-native';
>>>>>>> Destination-Management
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '@/constants/api';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, Stack } from 'expo-router';

export default function MyHotelsScreen() {
  const [hotels, setHotels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchMyHotels();
  }, []);

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

<<<<<<< HEAD
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

=======
>>>>>>> Destination-Management
  const renderHotelItem = ({ item }: { item: any }) => (
    <View style={styles.card}>
      {item.mainImage ? (
        <Image source={{ uri: `${API_BASE_URL}${item.mainImage}` }} style={styles.hotelImage} />
      ) : (
        <View style={styles.imagePlaceholder}>
          <Ionicons name="business" size={40} color="rgba(26, 59, 47, 0.2)" />
        </View>
      )}
      <View style={styles.cardContent}>
        <View style={styles.headerRow}>
          <Text style={styles.hotelName}>{item.hotelName}</Text>
          <View style={[styles.statusBadge, item.isVerified ? styles.verifiedBadge : styles.pendingBadge]}>
            <Text style={[styles.statusText, item.isVerified ? styles.verifiedText : styles.pendingText]}>
              {item.isVerified ? 'Verified' : 'Pending'}
            </Text>
          </View>
        </View>
        <Text style={styles.location}><Ionicons name="location-outline" size={14} /> {item.location}</Text>
        <Text style={styles.contact} numberOfLines={1}>{item.contactEmail} | {item.contactPhone}</Text>
        
        <View style={styles.actions}>
<<<<<<< HEAD
          <Pressable style={styles.actionBtn} onPress={() => router.push({ pathname: '/manager/edit-hotel', params: { id: item._id } })}>
            <Ionicons name="pencil" size={16} color="#1A3B2F" />
            <Text style={styles.actionBtnText}>Edit</Text>
          </Pressable>
          <Pressable style={[styles.actionBtn, styles.deleteBtn]} onPress={() => handleDelete(item._id, item.hotelName)}>
=======
          <Pressable style={styles.actionBtn}>
            <Ionicons name="pencil" size={16} color="#1A3B2F" />
            <Text style={styles.actionBtnText}>Edit</Text>
          </Pressable>
          <Pressable style={[styles.actionBtn, styles.deleteBtn]}>
>>>>>>> Destination-Management
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

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#FFD166" />
        </View>
      ) : hotels.length === 0 ? (
        <View style={styles.centerContainer}>
          <Ionicons name="business-outline" size={64} color="rgba(26, 59, 47, 0.2)" />
          <Text style={styles.emptyText}>You haven't added any hotels yet.</Text>
          <Pressable style={styles.addBtn} onPress={() => router.push('/(tabs)/explore')}>
            <Text style={styles.addBtnText}>Add New Hotel</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={hotels}
          keyExtractor={(item) => item._id}
          renderItem={renderHotelItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f4f8fb',
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
});
