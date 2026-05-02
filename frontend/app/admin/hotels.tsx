import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, SafeAreaView, Pressable, ActivityIndicator, Alert, Image, TextInput, Modal, ScrollView, Linking } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { API_BASE_URL } from '@/constants/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function AdminHotelsScreen() {
  const [hotels, setHotels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedHotel, setSelectedHotel] = useState<any>(null);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'verified' | 'pending' | 'declined'>('all');
  const [declineReason, setDeclineReason] = useState('');
  const [declineHotelId, setDeclineHotelId] = useState<string | null>(null);
  const [declineHotelName, setDeclineHotelName] = useState('');
  const router = useRouter();

  const handleCall = (phoneNumber: string) => {
    if (!phoneNumber) return;
    Linking.openURL(`tel:${phoneNumber}`).catch(() => Alert.alert("Error", "Unable to open phone dialer."));
  };

  const handleEmail = (email: string) => {
    if (!email) return;
    Linking.openURL(`mailto:${email}`).catch(() => Alert.alert("Error", "Unable to open email client."));
  };

  const handleWebsite = (url: string) => {
    if (!url) return;
    let fullUrl = url;
    if (!/^https?:\/\//i.test(fullUrl)) {
      fullUrl = 'https://' + fullUrl;
    }
    Linking.openURL(fullUrl).catch(() => Alert.alert("Error", "Unable to open website link."));
  };

  const fetchHotels = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('auth:token');
      
      if (!token) {
        Alert.alert("Session Expired", "Please log in again as an administrator.");
        router.replace("/login" as any);
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

  const handleVerify = async (hotelId: string, hotelName: string) => {
    Alert.alert(
      "Verify Hotel",
      `Are you sure you want to approve "${hotelName}"? It will become visible to all tourists.`,
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "VERIFY", 
          style: "default",
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem('auth:token');
              const response = await fetch(`${API_BASE_URL}/admin/hotels/${hotelId}/verify`, {
                method: 'PUT',
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json'
                }
              });

              if (response.ok) {
                Alert.alert("Success", "Hotel verified successfully!");
                setHotels(prev => prev.map(h => h._id === hotelId ? { ...h, isVerified: true } : h));
              } else {
                const data = await response.json();
                throw new Error(data.message || "Failed to verify hotel.");
              }
            } catch (err: any) {
              Alert.alert("Error", err.message);
            }
          }
        }
      ]
    );
  };

  const handleDelete = async (hotelId: string, hotelName: string, isDecline = false) => {
    Alert.alert(
      isDecline ? "Decline Hotel" : "Confirm Delete",
      `Are you sure you want to ${isDecline ? 'decline' : 'delete'} "${hotelName}"?`,
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: isDecline ? "DECLINE" : "DELETE", 
          style: "destructive",
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem('auth:token');
              const url = isDecline 
                ? `${API_BASE_URL}/admin/hotels/${hotelId}/decline` 
                : `${API_BASE_URL}/admin/hotels/${hotelId}`;
              const method = isDecline ? 'PUT' : 'DELETE';

              const response = await fetch(url, {
                method: method,
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json'
                }
              });

              if (response.ok) {
                Alert.alert("Success", isDecline ? "Hotel listing declined!" : "Hotel deleted successfully!");
                if (isDecline) {
                  setHotels(prev => prev.map(h => h._id === hotelId ? { ...h, status: 'declined', isVerified: false } : h));
                } else {
                  setHotels(prev => prev.filter(h => h._id !== hotelId));
                }
              } else {
                const data = await response.json();
                throw new Error(data.message || (isDecline ? "Failed to decline hotel." : "Failed to delete hotel."));
              }
            } catch (err: any) {
              Alert.alert("Error", err.message);
            }
          }
        }
      ]
    );
  };
  const handleDeclineConfirm = async () => {
    if (!declineHotelId) return;
    try {
      const token = await AsyncStorage.getItem('auth:token');
      const url = `${API_BASE_URL}/admin/hotels/${declineHotelId}/decline`;
      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ reason: declineReason })
      });

      if (response.ok) {
        Alert.alert("Success", "Hotel listing declined successfully!");
        setHotels(prev => prev.map(h => h._id === declineHotelId ? { ...h, status: 'declined', isVerified: false, declineReason } : h));
        setDeclineHotelId(null);
        setDeclineReason('');
        setTimeout(() => {
          setSelectedHotel(null);
        }, 300);
      } else {
        const data = await response.json();
        throw new Error(data.message || "Failed to decline hotel.");
      }
    } catch (err: any) {
      Alert.alert("Error", err.message);
    }
  };

  const filteredHotels = useMemo(() => {
    let list = hotels;
    if (selectedFilter !== 'all') {
      list = list.filter(h => {
        if (selectedFilter === 'verified') return (h.isVerified === true || h.status === 'verified') && h.status !== 'declined';
        if (selectedFilter === 'declined') return h.status === 'declined';
        if (selectedFilter === 'pending') return h.isVerified !== true && h.status !== 'declined';
        return true;
      });
    }
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter(h => 
        h.hotelName.toLowerCase().includes(q) ||
        h.location.toLowerCase().includes(q)
      );
    }
    return list;
  }, [hotels, searchQuery, selectedFilter]);

  const renderItem = ({ item }: any) => (
    <View style={styles.card}>
      <Pressable onPress={() => setSelectedHotel(item)}>
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
          
          <Text style={styles.location}>
            <Ionicons name="location-outline" size={14} color="rgba(26, 59, 47, 0.6)" /> {item.location}
          </Text>
          <Text style={styles.contact} numberOfLines={1}>
            {item.contactEmail} | {item.contactPhone}
          </Text>
        </View>
      </Pressable>
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
        {/* Detailed Modal to view hotel & manager details */}
        <Modal
          animationType="slide"
          visible={selectedHotel !== null}
          onRequestClose={() => setSelectedHotel(null)}
        >
          <SafeAreaView style={{ flex: 1, backgroundColor: '#ffffff' }}>
            <View style={styles.modalHeader}>
              <Pressable onPress={() => setSelectedHotel(null)} style={styles.backButton}>
                <Ionicons name="chevron-back" size={24} color="#1A3B2F" />
              </Pressable>
              <Text style={styles.modalTitle}>Hotel Details</Text>
              <View style={{ width: 44 }} />
            </View>

            {selectedHotel && (
              <ScrollView contentContainerStyle={styles.modalScrollContent} showsVerticalScrollIndicator={false}>
                {selectedHotel.mainImage ? (
                  <Image source={{ uri: selectedHotel.mainImage.startsWith('http') ? selectedHotel.mainImage : `${API_BASE_URL}${selectedHotel.mainImage}` }} style={styles.modalImage} />
                ) : (
                  <View style={styles.modalImagePlaceholder}>
                    <Ionicons name="business" size={48} color="rgba(26, 59, 47, 0.2)" />
                  </View>
                )}

                <View style={styles.modalSection}>
                  <Text style={styles.modalHotelName}>{selectedHotel.hotelName}</Text>
                  <View style={[
                    styles.statusBadge, 
                    selectedHotel.status === 'verified' || selectedHotel.isVerified ? styles.verifiedBadge : (selectedHotel.status === 'declined' ? styles.declinedBadge : styles.pendingBadge),
                    { alignSelf: 'flex-start', marginTop: 6 }
                  ]}>
                    <Text style={[
                      styles.statusText, 
                      selectedHotel.status === 'verified' || selectedHotel.isVerified ? styles.verifiedText : (selectedHotel.status === 'declined' ? styles.declinedText : styles.pendingText)
                    ]}>
                      {selectedHotel.status === 'verified' || selectedHotel.isVerified ? 'Verified' : (selectedHotel.status === 'declined' ? 'Declined' : 'Pending')}
                    </Text>
                  </View>
                  <Text style={styles.modalLocation}>
                    <Ionicons name="location" size={16} color="#1A3B2F" /> {selectedHotel.location}
                  </Text>
                  <Text style={styles.modalAddress}>{selectedHotel.address}</Text>
                  <Text style={styles.modalDescription}>{selectedHotel.description}</Text>
                </View>

                {/* Manager Details Section */}
                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionTitle}>Manager Information</Text>
                  <View style={styles.managerInfoCard}>
                    <Ionicons name="person" size={28} color="#1A3B2F" />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.managerName}>{selectedHotel.managerId?.fullName || "Listing Manager"}</Text>
                      <Pressable onPress={() => handleEmail(selectedHotel.managerId?.email || selectedHotel.contactEmail)}>
                        <Text style={styles.managerContact}>
                          <Ionicons name="mail" size={13} color="#2A9D8F" /> {selectedHotel.managerId?.email || selectedHotel.contactEmail}
                        </Text>
                      </Pressable>
                      <Pressable onPress={() => handleCall(selectedHotel.managerId?.phoneNumber || selectedHotel.contactPhone)}>
                        <Text style={styles.managerContact}>
                          <Ionicons name="call" size={13} color="#2A9D8F" /> {selectedHotel.managerId?.phoneNumber || selectedHotel.contactPhone}
                        </Text>
                      </Pressable>
                    </View>
                  </View>
                </View>

                {/* Facilities & Pricing */}
                {selectedHotel.roomConfigs && selectedHotel.roomConfigs.length > 0 && (
                  <View style={styles.modalSection}>
                    <Text style={styles.modalSectionTitle}>Room Pricing</Text>
                    {selectedHotel.roomConfigs.map((room: any, idx: number) => (
                      <View key={idx} style={styles.modalPriceRow}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.roomType}>{room.type} Room</Text>
                        </View>
                        <Text style={styles.roomPrice}>
                          {room.price} LKR {room.discountPrice ? `(Disc: ${room.discountPrice} LKR)` : ''}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}

                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionTitle}>Facilities & Features</Text>
                  <View style={styles.facilitiesGrid}>
                    {selectedHotel.facilities && Object.entries(selectedHotel.facilities).map(([key, value]) => {
                      if (!value) return null;
                      const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase());
                      return (
                        <View key={key} style={styles.facilityPill}>
                          <Ionicons name="checkmark-circle" size={14} color="#2E7D32" />
                          <Text style={styles.facilityText}>{label}</Text>
                        </View>
                      );
                    })}
                  </View>
                </View>

                <View style={[styles.modalSection, { borderBottomWidth: 0, marginBottom: 40 }]}>
                  <Text style={styles.modalSectionTitle}>Contact Details</Text>
                  <Pressable onPress={() => handleEmail(selectedHotel.contactEmail)}>
                    <Text style={styles.modalContactText}>Email: <Text style={{ color: '#2A9D8F', textDecorationLine: 'underline' }}>{selectedHotel.contactEmail}</Text></Text>
                  </Pressable>
                  <Pressable onPress={() => handleCall(selectedHotel.contactPhone)} style={{ marginTop: 6 }}>
                    <Text style={styles.modalContactText}>Phone: <Text style={{ color: '#2A9D8F', textDecorationLine: 'underline' }}>{selectedHotel.contactPhone}</Text></Text>
                  </Pressable>
                  {selectedHotel.websiteLink ? (
                    <Pressable onPress={() => handleWebsite(selectedHotel.websiteLink)} style={{ marginTop: 6 }}>
                      <Text style={styles.modalContactText}>Website: <Text style={{ color: '#2A9D8F', textDecorationLine: 'underline' }}>{selectedHotel.websiteLink}</Text></Text>
                    </Pressable>
                  ) : null}
                </View>
              </ScrollView>
            )}

            {selectedHotel && (
              <View style={styles.modalActions}>
                {selectedHotel.isVerified || selectedHotel.status === 'declined' ? (
                  <Pressable style={styles.deleteBtn} onPress={() => { handleDelete(selectedHotel._id, selectedHotel.hotelName, false); setSelectedHotel(null); }}>
                    <Ionicons name="trash" size={20} color="#ffffff" />
                    <Text style={styles.deleteBtnText}>Remove from System</Text>
                  </Pressable>
                ) : (
                  <View style={styles.rowActions}>
                    <Pressable style={[styles.actionBtnHalf, { backgroundColor: '#2E7D32' }]} onPress={() => { handleVerify(selectedHotel._id, selectedHotel.hotelName); setSelectedHotel(null); }}>
                      <Ionicons name="checkmark-circle" size={20} color="#ffffff" />
                      <Text style={styles.verifyBtnText}>Accept</Text>
                    </Pressable>
                    <Pressable style={[styles.actionBtnHalf, { backgroundColor: '#D32F2F' }]} onPress={() => { setDeclineHotelId(selectedHotel._id); setDeclineHotelName(selectedHotel.hotelName); }}>
                      <Ionicons name="close-circle" size={20} color="#ffffff" />
                      <Text style={styles.deleteBtnText}>Decline</Text>
                    </Pressable>
                  </View>
                )}
              </View>
            )}
            {/* Custom Prompt Modal for Decline Reason */}
            <Modal
              animationType="fade"
              transparent={true}
              visible={declineHotelId !== null}
              onRequestClose={() => setDeclineHotelId(null)}
            >
              <View style={styles.promptOverlay}>
                <View style={styles.promptContainer}>
                  <Text style={styles.promptTitle}>Decline Reason</Text>
                  <Text style={styles.promptSubtitle}>Why are you declining "{declineHotelName}"?</Text>
                  <TextInput
                    style={styles.promptInput}
                    placeholder="Type your message here..."
                    placeholderTextColor="rgba(26, 59, 47, 0.4)"
                    multiline
                    numberOfLines={3}
                    value={declineReason}
                    onChangeText={setDeclineReason}
                  />
                  <View style={styles.promptButtons}>
                    <Pressable 
                      style={[styles.promptBtn, styles.promptCancelBtn]} 
                      onPress={() => { setDeclineHotelId(null); setDeclineReason(''); }}
                    >
                      <Text style={styles.promptCancelText}>Cancel</Text>
                    </Pressable>
                    <Pressable 
                      style={[styles.promptBtn, styles.promptSubmitBtn]} 
                      onPress={handleDeclineConfirm}
                    >
                      <Text style={styles.promptSubmitText}>Submit</Text>
                    </Pressable>
                  </View>
                </View>
              </View>
            </Modal>
          </SafeAreaView>
        </Modal>
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
  declinedBadge: {
    backgroundColor: '#FFEBEE',
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
  declinedText: {
    color: '#C62828',
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
    gap: 12,
  },
  rowActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  actionBtnHalf: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  verifyBtn: {
    backgroundColor: '#2E7D32',
    paddingVertical: 12,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  verifyBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
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
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(26, 59, 47, 0.08)',
    backgroundColor: '#ffffff',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1A3B2F',
    flex: 1,
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  modalScrollContent: {
    padding: 20,
    gap: 16,
    backgroundColor: '#F5F9F7',
  },
  modalImage: {
    width: '100%',
    height: 220,
    borderRadius: 16,
    resizeMode: 'cover',
  },
  modalImagePlaceholder: {
    width: '100%',
    height: 220,
    borderRadius: 16,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(26, 59, 47, 0.08)',
  },
  modalSection: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(26, 59, 47, 0.05)',
    gap: 8,
  },
  modalSectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: 'rgba(26, 59, 47, 0.45)',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  modalHotelName: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1A3B2F',
  },
  modalLocation: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1A3B2F',
    marginTop: 2,
  },
  modalAddress: {
    fontSize: 13,
    color: 'rgba(26, 59, 47, 0.7)',
    fontWeight: '500',
  },
  modalDescription: {
    fontSize: 14,
    color: 'rgba(26, 59, 47, 0.8)',
    lineHeight: 22,
    marginTop: 4,
  },
  managerInfoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#F5F9F7',
    padding: 12,
    borderRadius: 12,
  },
  managerName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1A3B2F',
  },
  managerContact: {
    fontSize: 13,
    color: 'rgba(26, 59, 47, 0.65)',
    fontWeight: '500',
    marginTop: 2,
  },
  modalPriceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(26, 59, 47, 0.05)',
  },
  roomType: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1A3B2F',
  },
  roomPrice: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1A3B2F',
  },
  facilitiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  facilityPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  facilityText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2E7D32',
  },
  modalContactText: {
    fontSize: 13,
    color: 'rgba(26, 59, 47, 0.8)',
    fontWeight: '600',
    lineHeight: 20,
  },
  modalActions: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: 'rgba(26, 59, 47, 0.05)',
  },
  promptOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  promptContainer: {
    width: '100%',
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 24,
    gap: 16,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  promptTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#1A3B2F',
    letterSpacing: -0.5,
  },
  promptSubtitle: {
    fontSize: 14,
    color: 'rgba(26, 59, 47, 0.6)',
    fontWeight: '600',
  },
  promptInput: {
    backgroundColor: '#F5F9F7',
    borderWidth: 1,
    borderColor: 'rgba(26, 59, 47, 0.08)',
    borderRadius: 12,
    padding: 14,
    fontSize: 14,
    color: '#1A3B2F',
    minHeight: 80,
    textAlignVertical: 'top',
  },
  promptButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  promptBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  promptCancelBtn: {
    backgroundColor: '#F5F9F7',
    borderWidth: 1,
    borderColor: 'rgba(26, 59, 47, 0.05)',
  },
  promptSubmitBtn: {
    backgroundColor: '#D32F2F',
  },
  promptCancelText: {
    fontSize: 14,
    fontWeight: '800',
    color: 'rgba(26, 59, 47, 0.6)',
  },
  promptSubmitText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#ffffff',
  },
});
