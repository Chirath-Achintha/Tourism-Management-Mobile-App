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
  Dimensions,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useFocusEffect } from 'expo-router';
import { API_BASE_URL } from '@/constants/api';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';


const SERVER_URL = API_BASE_URL.replace('/api', '');
const { width } = Dimensions.get('window');

const COLORS = {
  primary: '#1A3B2F',
  primaryDark: '#0D211A',
  accent: '#FFD166',
  secondary: '#64748B',
  bg: '#F0FAF5',
  white: '#FFFFFF',
  pending: '#F59E0B',
  approved: '#10B981',
  rejected: '#EF4444',
  cancelled: '#6B7280',
  border: '#D1EADF',
  text: '#1A3B2F',
};

export default function MyBookingsScreen() {
  const router = useRouter();
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchBookings = async () => {
    try {
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

  useFocusEffect(
    useCallback(() => {
      fetchBookings();
    }, [])
  );

  async function handleCancel(id: string) {
    Alert.alert('Cancel Reservation', 'Are you sure you want to cancel this booking?', [
      { text: 'No, Keep it', style: 'cancel' },
      { 
        text: 'Yes, Cancel', 
        style: 'destructive', 
        onPress: async () => {
          try {
            const token = await AsyncStorage.getItem('auth:token');
            const res = await fetch(`${API_BASE_URL}/reservations/${id}/cancel`, {
              method: 'PUT',
              headers: { 'Authorization': `Bearer ${token}` },
            });
            if (res.ok) {
              Alert.alert('Cancelled', 'Your reservation has been cancelled.');
              fetchBookings();
            }
          } catch (e) {
            Alert.alert('Error', 'Network error. Please try again.');
          }
        }
      }
    ]);
  }

  async function openDoc(path: string) {
    if (!path) return;
    try {
      const url = `${SERVER_URL}${path}`;
      const can = await Linking.canOpenURL(url);
      if (can) await Linking.openURL(url);
    } catch (e) {
      Alert.alert('Error', 'Could not open document.');
    }
  }

  function renderItem({ item }: { item: any }) {
    const statusColor = 
      item.status === 'Pending' ? COLORS.pending : 
      item.status === 'Approved' ? COLORS.approved : 
      item.status === 'Rejected' ? COLORS.rejected : 
      COLORS.cancelled;
    
    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.packageName} numberOfLines={1}>
              {item.packageId?.name || 'Package Details'}
            </Text>
            <Text style={styles.bookingId}>ID: {item._id.substring(item._id.length - 8).toUpperCase()}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusColor + '15' }]}>
            <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
            <Text style={[styles.statusText, { color: statusColor }]}>{item.status || 'Unknown'}</Text>
          </View>
        </View>

        <View style={styles.cardBody}>
          <View style={styles.infoGrid}>
            <InfoItem icon="people-outline" label="Travelers" text={`${item.numberOfPeople || 0} People`} />
            <InfoItem icon="cash-outline" label="Investment" text={`LKR ${item.totalPrice || 0}`} />
            <InfoItem icon="document-text-outline" label="ID Verified" text={item.documentType || 'N/A'} />
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.actionRow}>
          {item.documentPath ? (
            <Pressable style={styles.viewDocBtn} onPress={() => openDoc(item.documentPath)}>
              <Ionicons name="eye-outline" size={18} color={COLORS.primary} />
              <Text style={styles.viewDocText}>View ID</Text>
            </Pressable>
          ) : null}
          
          <View style={styles.rightActions}>
            {item.status === 'Pending' ? (
              <>
                <Pressable 
                  style={styles.editBtn} 
                  onPress={() => router.push({ pathname: '/edit-reservation', params: { id: item._id } } as any)}
                >
                  <Ionicons name="pencil" size={16} color={COLORS.primary} />
                  <Text style={styles.editBtnText}>Edit</Text>
                </Pressable>
                
                <Pressable style={styles.cancelBtn} onPress={() => handleCancel(item._id)}>
                  <Ionicons name="close-circle-outline" size={16} color={COLORS.rejected} />
                </Pressable>
              </>
            ) : (
              <View style={styles.lockedContainer}>
                <Ionicons name="lock-closed-outline" size={14} color={COLORS.secondary} />
                <Text style={styles.lockedText}>Verified</Text>
              </View>
            )}
          </View>
        </View>
      </View>
    );
  }

  if (loading && !refreshing) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Fetching your trips...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" translucent />
      <LinearGradient
        colors={[COLORS.primary, COLORS.primaryDark]}
        style={styles.headerGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        <Text style={styles.headerTitle}>My Bookings</Text>
        <Text style={styles.headerSubtitle}>Manage your upcoming adventures</Text>
      </LinearGradient>

      <FlatList
        data={bookings}
        renderItem={renderItem}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh} 
            colors={[COLORS.primary]}
            tintColor={COLORS.primary}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconCircle}>
              <Ionicons name="airplane-outline" size={48} color={COLORS.secondary} />
            </View>
            <Text style={styles.emptyTitle}>No Bookings Yet</Text>
            <Text style={styles.emptySubtitle}>Your future adventures will appear here once you book a package.</Text>
            <Pressable style={styles.exploreBtn} onPress={() => router.push('/(tabs)/explore' as any)}>
              <Text style={styles.exploreBtnText}>Explore Packages</Text>
            </Pressable>
          </View>
        }
      />
    </View>
  );
}

function InfoItem({ icon, label, text }: { icon: any, label: string, text: string }) {
  return (
    <View style={styles.infoItem}>
      <View style={styles.infoIconWrapper}>
        <Ionicons name={icon} size={14} color={COLORS.primary} />
      </View>
      <View>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoText}>{text}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  headerGradient: {
    paddingTop: 70,
    paddingBottom: 36,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
  },
  headerTitle: { fontSize: 32, fontWeight: '900', color: 'white', letterSpacing: -0.5 },
  headerSubtitle: { fontSize: 16, color: 'rgba(255,255,255,0.7)', marginTop: 4, fontWeight: '600' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingText: { color: COLORS.secondary, fontSize: 14, fontWeight: '600' },
  listContent: { padding: 20, paddingBottom: 100 },
  card: { 
    backgroundColor: COLORS.white, 
    borderRadius: 28, 
    padding: 24, 
    marginBottom: 20,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(26, 59, 47, 0.05)',
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  packageName: { fontSize: 20, fontWeight: '800', color: COLORS.text, marginBottom: 4 },
  bookingId: { fontSize: 12, color: COLORS.secondary, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, gap: 6 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 12, fontWeight: '800', textTransform: 'capitalize' },
  cardBody: { marginBottom: 20 },
  infoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  infoItem: { flexDirection: 'row', alignItems: 'center', gap: 10, width: (width - 100) / 2 },
  infoIconWrapper: { width: 28, height: 28, borderRadius: 8, backgroundColor: COLORS.accent + '20', alignItems: 'center', justifyContent: 'center' },
  infoLabel: { fontSize: 11, color: COLORS.secondary, fontWeight: '700', textTransform: 'uppercase' },
  infoText: { fontSize: 13, fontWeight: '800', color: COLORS.text },
  divider: { height: 1, backgroundColor: COLORS.border, marginBottom: 16 },
  actionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  viewDocBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 8 },
  viewDocText: { fontSize: 14, fontWeight: '700', color: COLORS.primary },
  rightActions: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  editBtn: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: COLORS.accent, 
    paddingHorizontal: 20, 
    paddingVertical: 10, 
    borderRadius: 14, 
    gap: 6,
    shadowColor: COLORS.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  editBtnText: { color: COLORS.primary, fontSize: 14, fontWeight: '800' },
  cancelBtn: { 
    width: 44, 
    height: 44, 
    borderRadius: 14, 
    borderWidth: 1.5, 
    borderColor: COLORS.border, 
    alignItems: 'center', 
    justifyContent: 'center',
    backgroundColor: COLORS.white,
  },
  lockedContainer: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 4, 
    backgroundColor: COLORS.bg,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  lockedText: { 
    fontSize: 12, 
    color: COLORS.secondary, 
    fontWeight: '700'
  },
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 60, paddingHorizontal: 40 },
  emptyIconCircle: { width: 100, height: 100, borderRadius: 50, backgroundColor: COLORS.border + '50', alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  emptyTitle: { fontSize: 24, fontWeight: '900', color: COLORS.text, marginBottom: 12 },
  emptySubtitle: { fontSize: 15, color: COLORS.secondary, textAlign: 'center', lineHeight: 22, marginBottom: 32 },
  exploreBtn: { backgroundColor: COLORS.primary, paddingHorizontal: 32, paddingVertical: 16, borderRadius: 20 },
  exploreBtnText: { color: 'white', fontSize: 16, fontWeight: '800' },
});


