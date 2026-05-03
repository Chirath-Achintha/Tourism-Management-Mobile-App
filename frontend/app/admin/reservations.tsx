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
import { useRouter } from 'expo-router';
import { API_BASE_URL } from '@/constants/api';

const SERVER_URL = API_BASE_URL.replace('/api', '');

const COLORS = {
  bg: '#F8FAFC',
  text: '#1E293B',
  secondary: '#64748B',
  white: '#FFFFFF',
  blue: '#3B82F6',
  green: '#10B981',
  red: '#EF4444',
  amber: '#F59E0B',
  forest: '#1A3B2F',
};

export default function AdminReservationsScreen() {
  const router = useRouter();
  const [reservations, setReservations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAll = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('auth:token');
      const res = await fetch(`${API_BASE_URL}/reservations`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (res.ok) setReservations(await res.json());
    } catch (error) {
      Alert.alert('Error', 'Network error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchAll();
  }, []);

  async function updateStatus(id: string, status: string) {
    try {
      const token = await AsyncStorage.getItem('auth:token');
      const res = await fetch(`${API_BASE_URL}/reservations/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        Alert.alert('Success', `Booking ${status}`);
        fetchAll();
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to update');
    }
  }

  async function openDoc(path: string) {
    if (!path) return;
    try {
      const url = `${SERVER_URL}${path}`;
      const can = await Linking.canOpenURL(url);
      if (can) await Linking.openURL(url);
    } catch (e) {
      Alert.alert('Error', 'Could not open doc');
    }
  }

  function renderItem({ item }: { item: any }) {
    const statusColor = item.status === 'Pending' ? COLORS.amber : item.status === 'Approved' ? COLORS.green : item.status === 'Rejected' ? COLORS.red : COLORS.secondary;

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.packageName} numberOfLines={1}>{item.packageId?.name || 'Package'}</Text>
            <Text style={styles.userName}>By: {item.userId?.fullName || 'User'}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
            <Text style={[styles.statusText, { color: statusColor }]}>{item.status}</Text>
          </View>
        </View>

        <View style={styles.grid}>
          <GridItem icon="people-outline" label="People" val={item.numberOfPeople || 0} />
          <GridItem icon="cash-outline" label="Total" val={`$${item.totalPrice || 0}`} />
          <GridItem icon="document-text-outline" label="ID" val={item.documentType || 'N/A'} />
        </View>

        {item.documentPath ? (
          <Pressable style={styles.docLink} onPress={() => openDoc(item.documentPath)}>
            <Ionicons name="eye-outline" size={16} color={COLORS.blue} />
            <Text style={styles.docLinkText}>View Identity Document</Text>
          </Pressable>
        ) : null}

        {item.specialRequest ? (
          <View style={styles.requestBox}>
            <Text style={styles.requestTitle}>Request:</Text>
            <Text style={styles.requestText}>{item.specialRequest}</Text>
          </View>
        ) : null}

        {item.status === 'Pending' && (
          <View style={styles.actions}>
            <Pressable style={[styles.actionBtn, styles.approveBtn]} onPress={() => updateStatus(item._id, 'Approved')}>
              <Text style={styles.actionBtnText}>Approve</Text>
            </Pressable>
            <Pressable style={[styles.actionBtn, styles.rejectBtn]} onPress={() => updateStatus(item._id, 'Rejected')}>
              <Text style={styles.actionBtnText}>Reject</Text>
            </Pressable>
          </View>
        )}
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} />
        </Pressable>
        <Text style={styles.headerTitle}>Package Reservations</Text>
      </View>

      {loading && !refreshing ? (
        <View style={styles.center}><ActivityIndicator size="large" color={COLORS.blue} /></View>
      ) : (
        <FlatList
          data={reservations}
          renderItem={renderItem}
          keyExtractor={(item) => item._id}
          contentContainerStyle={{ padding: 16 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={<View style={styles.center}><Text>No reservations found.</Text></View>}
        />
      )}
    </SafeAreaView>
  );
}

function GridItem({ icon, label, val }: { icon: any, label: string, val: any }) {
  return (
    <View style={styles.gridItem}>
      <Ionicons name={icon} size={14} color={COLORS.secondary} />
      <Text style={styles.gridLabel}>{label}:</Text>
      <Text style={styles.gridVal}>{val}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: { flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: 'white' },
  backBtn: { marginRight: 16 },
  headerTitle: { fontSize: 20, fontWeight: '700' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  card: { backgroundColor: 'white', borderRadius: 12, padding: 16, marginBottom: 16 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  packageName: { fontSize: 16, fontWeight: '700' },
  userName: { fontSize: 13, color: COLORS.secondary },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  statusText: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 12, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#eee' },
  gridItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  gridLabel: { fontSize: 12, color: COLORS.secondary },
  gridVal: { fontSize: 12, fontWeight: '600' },
  docLink: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 10 },
  docLinkText: { color: COLORS.blue, fontSize: 13, textDecorationLine: 'underline' },
  requestBox: { backgroundColor: '#f9f9f9', padding: 10, borderRadius: 8, marginBottom: 12 },
  requestTitle: { fontSize: 11, fontWeight: '700', color: COLORS.secondary },
  requestText: { fontSize: 12, fontStyle: 'italic' },
  actions: { flexDirection: 'row', gap: 10 },
  actionBtn: { flex: 1, height: 40, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  approveBtn: { backgroundColor: COLORS.green },
  rejectBtn: { backgroundColor: COLORS.red },
  actionBtnText: { color: 'white', fontWeight: '700' },
});

