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
  Linking,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { API_BASE_URL } from '@/constants/api';

const SERVER_URL = API_BASE_URL.replace('/api', '');

const COLORS = {
  bg: '#EBF5EA',
  text: '#1A2432',
  secondary: '#64748b',
  white: '#FFFFFF',
  blue: '#3152c5',
  pending: '#F59E0B',
  approved: '#10B981',
  rejected: '#EF4444',
  cancelled: '#6B7280',
};

export default function MyBookingsScreen() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('auth:token');
      const response = await fetch(`${API_BASE_URL}/reservations/my`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await response.json();
      if (response.ok) {
        setBookings(data);
      }
    } catch (error) {
      console.error(error);
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

  async function handleCancel(id: string) {
    Alert.alert('Cancel', 'Cancel this booking?', [
      { text: 'No' },
      { text: 'Yes', style: 'destructive', onPress: async () => {
        try {
          const token = await AsyncStorage.getItem('auth:token');
          const res = await fetch(`${API_BASE_URL}/reservations/${id}/cancel`, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${token}` },
          });
          if (res.ok) {
            Alert.alert('Success', 'Cancelled');
            fetchBookings();
          }
        } catch (e) {
          Alert.alert('Error', 'Network error');
        }
      }}
    ]);
  }

  async function openDoc(path: string) {
    if (!path) return;
    try {
      const url = `${SERVER_URL}${path}`;
      const can = await Linking.canOpenURL(url);
      if (can) await Linking.openURL(url);
    } catch (e) {
      Alert.alert('Error', 'Could not open');
    }
  }

  function renderItem({ item }: { item: any }) {
    const statusColor = item.status === 'Pending' ? COLORS.pending : item.status === 'Approved' ? COLORS.approved : item.status === 'Rejected' ? COLORS.rejected : COLORS.cancelled;
    
    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.packageName} numberOfLines={1}>{item.packageId?.name || 'Package'}</Text>
          <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
            <Text style={[styles.statusText, { color: statusColor }]}>{item.status || 'Unknown'}</Text>
          </View>
        </View>

        <View style={styles.cardBody}>
          <InfoItem icon="calendar-outline" text={`Date: ${item.travelDate ? new Date(item.travelDate).toLocaleDateString() : 'N/A'}`} />
          <InfoItem icon="people-outline" text={`People: ${item.numberOfPeople || 0}`} />
          <InfoItem icon="cash-outline" text={`Total: $${item.totalPrice || 0}`} />
          <InfoItem icon="document-text-outline" text={`ID: ${item.documentType || 'N/A'}`} />
        </View>

        <View style={styles.actionRow}>
          {item.documentPath ? (
            <Pressable style={[styles.btn, styles.btnBlue]} onPress={() => openDoc(item.documentPath)}>
              <Ionicons name="eye-outline" size={16} color="white" />
              <Text style={styles.btnText}>View Doc</Text>
            </Pressable>
          ) : null}
          {item.status === 'Pending' && (
            <Pressable style={[styles.btn, styles.btnRed]} onPress={() => handleCancel(item._id)}>
              <Text style={styles.btnTextRed}>Cancel</Text>
            </Pressable>
          )}
        </View>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}><Text style={styles.headerTitle}>My Bookings</Text></View>
      {loading && !refreshing ? (
        <View style={styles.center}><ActivityIndicator size="large" color={COLORS.blue} /></View>
      ) : (
        <FlatList
          data={bookings}
          renderItem={renderItem}
          keyExtractor={(item) => item._id}
          contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={<View style={styles.center}><Text>No bookings found.</Text></View>}
        />
      )}
    </SafeAreaView>
  );
}

function InfoItem({ icon, text }: { icon: any, text: string }) {
  return (
    <View style={styles.infoRow}>
      <Ionicons name={icon} size={16} color={COLORS.secondary} />
      <Text style={styles.infoText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: { padding: 20, backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#eee' },
  headerTitle: { fontSize: 24, fontWeight: '800' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  card: { backgroundColor: 'white', borderRadius: 16, padding: 16, marginBottom: 16 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  packageName: { fontSize: 18, fontWeight: '700', flex: 1 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  statusText: { fontSize: 12, fontWeight: '800' },
  cardBody: { gap: 8, marginBottom: 16 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  infoText: { fontSize: 14, color: COLORS.secondary },
  actionRow: { flexDirection: 'row', gap: 10 },
  btn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: 10, gap: 6 },
  btnBlue: { backgroundColor: COLORS.blue },
  btnRed: { borderWidth: 1, borderColor: '#EF4444' },
  btnText: { color: 'white', fontSize: 13, fontWeight: '700' },
  btnTextRed: { color: '#EF4444', fontSize: 13, fontWeight: '700' },
});
