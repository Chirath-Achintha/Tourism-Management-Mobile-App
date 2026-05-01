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
import { useRouter } from 'expo-router';
import { API_BASE_URL } from '@/constants/api';

const COLORS = {
  bg: '#F8FAFC',
  text: '#1E293B',
  secondary: '#64748B',
  white: '#FFFFFF',
  blue: '#3B82F6',
  green: '#10B981',
  red: '#EF4444',
  amber: '#F59E0B',
};

export default function AdminReservationsScreen() {
  const router = useRouter();
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAllReservations = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('auth:token');
      const response = await fetch(`${API_BASE_URL}/reservations`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (response.ok) {
        setReservations(data);
      } else {
        Alert.alert('Error', data.message || 'Failed to fetch reservations');
      }
    } catch (error) {
      Alert.alert('Error', 'Network error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAllReservations();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchAllReservations();
  }, []);

  const updateStatus = async (id: string, status: string) => {
    try {
      const token = await AsyncStorage.getItem('auth:token');
      const response = await fetch(`${API_BASE_URL}/reservations/${id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });

      if (response.ok) {
        Alert.alert('Success', `Reservation ${status.toLowerCase()} successfully`);
        fetchAllReservations();
      } else {
        const data = await response.json();
        Alert.alert('Error', data.message || 'Failed to update status');
      }
    } catch (err) {
      Alert.alert('Error', 'Network error');
    }
  };

  const renderReservationItem = ({ item }: { item: any }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={{ flex: 1 }}>
          <Text style={styles.packageName}>{item.packageId?.name || 'Unknown Package'}</Text>
          <Text style={styles.userName}>By: {item.userId?.fullName || 'Unknown User'}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
          <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>{item.status}</Text>
        </View>
      </View>

      <View style={styles.detailsGrid}>
        <DetailItem icon="calendar" label="Date" value={new Date(item.travelDate).toLocaleDateString()} />
        <DetailItem icon="people" label="People" value={item.numberOfPeople} />
        <DetailItem icon="cash" label="Total" value={`$${item.totalPrice}`} />
      </View>

      {item.specialRequest ? (
        <View style={styles.requestBox}>
          <Text style={styles.requestTitle}>Special Request:</Text>
          <Text style={styles.requestText}>{item.specialRequest}</Text>
        </View>
      ) : null}

      {item.status === 'Pending' && (
        <View style={styles.actions}>
          <Pressable 
            style={[styles.actionButton, styles.approveButton]} 
            onPress={() => updateStatus(item._id, 'Approved')}
          >
            <Text style={styles.actionButtonText}>Approve</Text>
          </Pressable>
          <Pressable 
            style={[styles.actionButton, styles.rejectButton]} 
            onPress={() => updateStatus(item._id, 'Rejected')}
          >
            <Text style={styles.actionButtonText}>Reject</Text>
          </Pressable>
        </View>
      )}
    </View>
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pending': return COLORS.amber;
      case 'Approved': return COLORS.green;
      case 'Rejected': return COLORS.red;
      case 'Cancelled': return COLORS.secondary;
      default: return COLORS.secondary;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Manage Reservations</Text>
      </View>

      {loading && !refreshing ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.blue} />
        </View>
      ) : (
        <FlatList
          data={reservations}
          renderItem={renderReservationItem}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyText}>No reservations found.</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const DetailItem = ({ icon, label, value }: any) => (
  <View style={styles.detailItem}>
    <Ionicons name={icon + '-outline' as any} size={14} color={COLORS.secondary} />
    <Text style={styles.detailLabel}>{label}:</Text>
    <Text style={styles.detailValue}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: COLORS.white,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  backButton: {
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  list: {
    padding: 16,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  packageName: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 2,
  },
  userName: {
    fontSize: 13,
    color: COLORS.secondary,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detailLabel: {
    fontSize: 12,
    color: COLORS.secondary,
  },
  detailValue: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.text,
  },
  requestBox: {
    backgroundColor: '#F8FAFC',
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
  },
  requestTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.secondary,
    marginBottom: 2,
  },
  requestText: {
    fontSize: 12,
    color: COLORS.text,
    fontStyle: 'italic',
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
  },
  actionButton: {
    flex: 1,
    height: 40,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  approveButton: {
    backgroundColor: COLORS.green,
  },
  rejectButton: {
    backgroundColor: COLORS.red,
  },
  actionButtonText: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '700',
  },
  empty: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    color: COLORS.secondary,
    fontSize: 14,
  },
});
