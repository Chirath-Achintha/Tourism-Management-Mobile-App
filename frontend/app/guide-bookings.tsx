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
import { useFocusEffect } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { API_BASE_URL } from '@/constants/api';

const COLORS = {
  bg: '#F0FAF5',
  forest: '#1A3B2F',
  white: '#FFFFFF',
  secondary: 'rgba(26, 59, 47, 0.5)',
  pending: '#F59E0B',
  approved: '#10B981',
  rejected: '#EF4444',
  cancelled: '#6B7280',
};

export default function GuideBookingsScreen() {
  const router = useRouter();
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('auth:token');
      const response = await fetch(`${API_BASE_URL}/guide-reservations/my-assignments`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await response.json();
      if (response.ok) {
        setBookings(data);
      } else {
        Alert.alert('Error', data.message || 'Failed to fetch bookings.');
      }
    } catch (error) {
      Alert.alert('Error', 'Network error. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchBookings(); }, []);

  useFocusEffect(
    useCallback(() => { fetchBookings(); }, [])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchBookings();
  }, []);

  const handleRespond = async (id: string, status: 'Approved' | 'Rejected') => {
    Alert.alert(
      status === 'Approved' ? 'Approve Booking' : 'Reject Booking',
      `Are you sure you want to ${status.toLowerCase()} this booking?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: status === 'Approved' ? 'Yes, Approve' : 'Yes, Reject',
          style: status === 'Rejected' ? 'destructive' : 'default',
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem('auth:token');
              const res = await fetch(`${API_BASE_URL}/guide-reservations/${id}/respond`, {
                method: 'PUT',
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({ status }),
              });
              const data = await res.json();
              if (res.ok) {
                Alert.alert('Success', `Booking ${status.toLowerCase()} successfully.`);
                fetchBookings();
              } else {
                Alert.alert('Error', data.message || 'Failed to update booking.');
              }
            } catch (e) {
              Alert.alert('Error', 'Network error.');
            }
          },
        },
      ]
    );
  };

  function renderItem({ item }: { item: any }) {
    const statusColor =
      item.status === 'Pending' ? COLORS.pending :
      item.status === 'Approved' ? COLORS.approved :
      item.status === 'Rejected' ? COLORS.rejected : COLORS.cancelled;

    return (
      <View style={styles.card}>
        {/* Tourist info */}
        <View style={styles.touristRow}>
          <View style={styles.avatarCircle}>
            <Ionicons name="person" size={22} color={COLORS.forest} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.touristName}>{item.userId?.fullName || 'Tourist'}</Text>
            <Text style={styles.touristEmail}>{item.userId?.email || ''}</Text>
            {item.userId?.phoneNumber ? (
              <Text style={styles.touristPhone}>📞 {item.userId.phoneNumber}</Text>
            ) : null}
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
            <Text style={[styles.statusText, { color: statusColor }]}>{item.status}</Text>
          </View>
        </View>

        <View style={styles.divider} />

        {/* Booking info */}
        <View style={styles.infoGrid}>
          <InfoRow icon="calendar-outline" label="Tour Date" value={item.travelDate ? new Date(item.travelDate).toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' }) : 'N/A'} />
          <InfoRow icon="people-outline" label="People" value={`${item.numberOfPeople || 0} person${item.numberOfPeople > 1 ? 's' : ''}`} />
          {item.specialRequest ? (
            <InfoRow icon="chatbubble-ellipses-outline" label="Special Request" value={item.specialRequest} />
          ) : null}
        </View>

        {/* Booked on */}
        <Text style={styles.bookingDate}>
          Booked on {new Date(item.createdAt).toLocaleDateString()}
        </Text>

        {item.status === 'Pending' && (
          <View style={styles.actionRow}>
            <Pressable
              style={[styles.actionBtn, styles.approveBtn]}
              onPress={() => handleRespond(item._id, 'Approved')}
            >
              <Ionicons name="checkmark-circle-outline" size={18} color="#fff" />
              <Text style={styles.actionBtnText}>Approve</Text>
            </Pressable>
            <Pressable
              style={[styles.actionBtn, styles.rejectBtn]}
              onPress={() => handleRespond(item._id, 'Rejected')}
            >
              <Ionicons name="close-circle-outline" size={18} color="#fff" />
              <Text style={styles.actionBtnText}>Reject</Text>
            </Pressable>
          </View>
        )}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={24} color={COLORS.forest} />
          </Pressable>
          <Text style={styles.headerTitle}>My Bookings</Text>
          <View style={styles.placeholder} />
        </View>

        {loading && !refreshing ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color="#FFD166" />
          </View>
        ) : (
          <FlatList
            data={bookings}
            renderItem={renderItem}
            keyExtractor={(item) => item._id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            ListHeaderComponent={
              <View style={styles.summaryRow}>
                <SummaryChip label="Total" count={bookings.length} color={COLORS.forest} />
                <SummaryChip label="Pending" count={bookings.filter(b => b.status === 'Pending').length} color={COLORS.pending} />
                <SummaryChip label="Approved" count={bookings.filter(b => b.status === 'Approved').length} color={COLORS.approved} />
              </View>
            }
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Ionicons name="calendar-outline" size={64} color="rgba(26, 59, 47, 0.1)" />
                <Text style={styles.emptyText}>No bookings received yet.</Text>
                <Text style={styles.emptySubText}>Tourists who book you will appear here.</Text>
              </View>
            }
          />
        )}
      </SafeAreaView>
    </View>
  );
}

function InfoRow({ icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Ionicons name={icon} size={16} color={COLORS.secondary} />
      <View style={{ flex: 1 }}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
      </View>
    </View>
  );
}

function SummaryChip({ label, count, color }: { label: string; count: number; color: string }) {
  return (
    <View style={[styles.summaryChip, { borderColor: color + '40', backgroundColor: color + '10' }]}>
      <Text style={[styles.summaryCount, { color }]}>{count}</Text>
      <Text style={[styles.summaryLabel, { color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'transparent',
  },
  backButton: {
    width: 44, height: 44, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: COLORS.bg,
  },
  placeholder: { width: 44, height: 44 },
  headerTitle: { fontSize: 18, fontWeight: '900', color: COLORS.forest },
  listContent: { padding: 16, gap: 16, paddingBottom: 40 },
  summaryRow: { flexDirection: 'row', gap: 10, marginBottom: 8 },
  summaryChip: {
    flex: 1, alignItems: 'center', paddingVertical: 12,
    borderRadius: 16, borderWidth: 1,
  },
  summaryCount: { fontSize: 22, fontWeight: '900' },
  summaryLabel: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', marginTop: 2 },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  touristRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatarCircle: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: '#F0FAF5',
    alignItems: 'center', justifyContent: 'center',
  },
  touristName: { fontSize: 16, fontWeight: '800', color: COLORS.forest },
  touristEmail: { fontSize: 12, color: COLORS.secondary, marginTop: 2 },
  touristPhone: { fontSize: 12, color: COLORS.secondary, marginTop: 2 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  statusText: { fontSize: 11, fontWeight: '800', textTransform: 'uppercase' },
  divider: { height: 1, backgroundColor: 'rgba(26, 59, 47, 0.06)', marginVertical: 14 },
  infoGrid: { gap: 10 },
  infoRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  infoLabel: { fontSize: 11, fontWeight: '700', color: COLORS.secondary, textTransform: 'uppercase' },
  infoValue: { fontSize: 14, fontWeight: '600', color: COLORS.forest, marginTop: 2 },
  bookingDate: { fontSize: 11, color: COLORS.secondary, marginTop: 12, textAlign: 'right' },
  emptyState: { marginTop: 80, alignItems: 'center', gap: 12 },
  emptyText: { fontSize: 16, fontWeight: '800', color: 'rgba(26, 59, 47, 0.3)' },
  emptySubText: { fontSize: 13, color: 'rgba(26, 59, 47, 0.2)', textAlign: 'center' },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 12,
  },
  approveBtn: { backgroundColor: '#10B981' },
  rejectBtn: { backgroundColor: '#EF4444' },
  actionBtnText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 14,
  },
});
