import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  Pressable,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { API_BASE_URL } from '@/constants/api';

const COLORS = {
  bg: '#EBF5EA',
  text: '#1A2432',
  secondary: '#64748b',
  white: '#FFFFFF',
  blue: '#3152c5',
  pending: '#F59E0B', // Yellow
  approved: '#10B981', // Green
  rejected: '#EF4444', // Red
  cancelled: '#6B7280', // Gray
};

export default function MyBookingsScreen() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('auth:token');
      const response = await fetch(`${API_BASE_URL}/reservations/my`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (response.ok) {
        setBookings(data);
      } else {
        console.warn('Failed to fetch bookings', data.message);
      }
    } catch (error) {
      console.error('Fetch bookings error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchBookings();
  }, []);

  const handleCancel = async (id: string) => {
    Alert.alert(
      'Cancel Reservation',
      'Are you sure you want to cancel this booking?',
      [
        { text: 'No', style: 'cancel' },
        { 
          text: 'Yes, Cancel', 
          style: 'destructive',
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem('auth:token');
              const response = await fetch(`${API_BASE_URL}/reservations/${id}/cancel`, {
                method: 'PUT',
                headers: {
                  'Authorization': `Bearer ${token}`,
                },
              });
              if (response.ok) {
                Alert.alert('Success', 'Reservation cancelled successfully');
                fetchBookings(); // Refresh list
              } else {
                const data = await response.json();
                Alert.alert('Error', data.message || 'Failed to cancel');
              }
            } catch (err) {
              Alert.alert('Error', 'Network error');
            }
          }
        }
      ]
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pending': return COLORS.pending;
      case 'Approved': return COLORS.approved;
      case 'Rejected': return COLORS.rejected;
      case 'Cancelled': return COLORS.cancelled;
      default: return COLORS.secondary;
    }
  };

  const renderBookingItem = ({ item }: { item: any }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.packageName}>{item.packageId?.name || 'Package Deleted'}</Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
          <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>{item.status}</Text>
        </View>
      </View>

      <View style={styles.cardBody}>
        <View style={styles.infoRow}>
          <Ionicons name="calendar-outline" size={16} color={COLORS.secondary} />
          <Text style={styles.infoText}>Date: {new Date(item.travelDate).toLocaleDateString()}</Text>
        </View>
        <View style={styles.infoRow}>
          <Ionicons name="people-outline" size={16} color={COLORS.secondary} />
          <Text style={styles.infoText}>People: {item.numberOfPeople}</Text>
        </View>
        <View style={styles.infoRow}>
          <Ionicons name="cash-outline" size={16} color={COLORS.secondary} />
          <Text style={styles.infoText}>Total: ${item.totalPrice}</Text>
        </View>
      </View>

      {item.status === 'Pending' && (
        <Pressable 
          style={styles.cancelButton} 
          onPress={() => handleCancel(item._id)}
        >
          <Text style={styles.cancelButtonText}>Cancel Reservation</Text>
        </Pressable>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Bookings</Text>
      </View>

      {loading && !refreshing ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.blue} />
        </View>
      ) : (
        <FlatList
          data={bookings}
          renderItem={renderBookingItem}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="calendar-clear-outline" size={64} color={COLORS.secondary} />
              <Text style={styles.emptyText}>No bookings found yet.</Text>
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
    backgroundColor: COLORS.bg,
  },
  header: {
    padding: 20,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.text,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  packageName: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    flex: 1,
    marginRight: 8,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  cardBody: {
    gap: 8,
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoText: {
    fontSize: 14,
    color: COLORS.secondary,
  },
  cancelButton: {
    borderWidth: 1,
    borderColor: '#EF4444',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#EF4444',
    fontSize: 13,
    fontWeight: '700',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 100,
    opacity: 0.5,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: COLORS.secondary,
  },
});
