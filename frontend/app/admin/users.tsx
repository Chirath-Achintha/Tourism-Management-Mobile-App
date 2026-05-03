import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, SafeAreaView, Pressable, ActivityIndicator, Alert, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { API_BASE_URL } from '@/constants/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

type RoleFilter = 'all' | 'tourist' | 'hotel_manager' | 'admin' | 'tour_guide';

export default function UserManagementScreen() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRole, setSelectedRole] = useState<RoleFilter>('all');
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const router = useRouter();

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('auth:token');
      
      if (!token) {
        Alert.alert("Session Expired", "Please log in again as an administrator.");
        router.replace("/login" as any);
        return;
      }

      const response = await fetch(`${API_BASE_URL}/admin/users`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      
      if (response.ok) {
        setUsers(data);
      } else {
        throw new Error(data.message || "Failed to fetch users.");
      }
    } catch (error: any) {
      console.error("Fetch users failed:", error);
      Alert.alert("API Error", error.message || "Could not connect to the database.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleToggleStatus = async (userId: string, currentStatus: boolean, name: string) => {
    const action = currentStatus ? "deactivate" : "activate";
    
    Alert.alert(
      "Confirm Action",
      `Are you sure you want to ${action} ${name}'s account?`,
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: action.toUpperCase(), 
          style: currentStatus ? "destructive" : "default",
          onPress: async () => {
            try {
              setTogglingId(userId);
              const token = await AsyncStorage.getItem('auth:token');
              const response = await fetch(`${API_BASE_URL}/admin/users/${userId}/toggle`, {
                method: 'PUT',
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json'
                }
              });

              const data = await response.json();
              if (response.ok) {
                setUsers(prev => prev.map(u => 
                  u.id === userId ? { ...u, isActive: data.isActive } : u
                ));
              } else {
                throw new Error(data.message || `Failed to ${action} account.`);
              }
            } catch (err: any) {
              Alert.alert("Error", err.message);
            } finally {
              setTogglingId(null);
            }
          }
        }
      ]
    );
  };

  const filteredUsers = useMemo(() => {
    if (selectedRole === 'all') return users;
    return users.filter(u => u.role === selectedRole);
  }, [users, selectedRole]);

  const renderItem = ({ item }: any) => (
    <View style={[styles.userCard, !item.isActive && styles.userCardInactive]}>
      <View style={styles.userAvatar}>
        <Text style={styles.avatarInitial}>{(item.fullName || "U")[0].toUpperCase()}</Text>
        {!item.isActive && (
          <View style={styles.inactiveAvatarOverlay}>
            <Ionicons name="lock-closed" size={12} color="#ffffff" />
          </View>
        )}
      </View>
      <View style={styles.userInfo}>
        <View style={styles.nameRow}>
          <Text style={styles.userName}>{item.fullName}</Text>
          {item.isActive === false && (
            <View style={styles.statusBadge}>
              <Text style={styles.statusText}>INACTIVE</Text>
            </View>
          )}
        </View>
        <Text style={styles.userEmail}>{item.email}</Text>
        <View style={[
          styles.roleBadge, 
          { backgroundColor: item.role === 'admin' ? '#FFD166' : item.role === 'tour_guide' ? '#D1FAE5' : item.role === 'hotel_manager' ? '#E3F2FD' : 'rgba(26, 59, 47, 0.05)' }
        ]}>
          <Text style={styles.roleText}>{item.role.replace('_', ' ').toUpperCase()}</Text>
        </View>
      </View>
      
      {item.role !== 'admin' && (
        <Pressable 
          disabled={togglingId === item.id}
          onPress={() => handleToggleStatus(item.id, item.isActive, item.fullName)}
          style={[styles.toggleBtn, item.isActive ? styles.btnDeactivate : styles.btnActivate]}
        >
          {togglingId === item.id ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <Ionicons 
              name={item.isActive ? "power" : "checkmark-circle"} 
              size={18} 
              color="#ffffff" 
            />
          )}
        </Pressable>
      )}
    </View>
  );

  const FilterPills = () => (
    <View style={styles.filterContainer}>
      <Pressable 
        style={[styles.filterPill, selectedRole === 'all' && styles.filterPillActive]} 
        onPress={() => setSelectedRole('all')}
      >
        <Text style={[styles.filterText, selectedRole === 'all' && styles.filterTextActive]}>All Users</Text>
      </Pressable>
      <Pressable 
        style={[styles.filterPill, selectedRole === 'tourist' && styles.filterPillActive]} 
        onPress={() => setSelectedRole('tourist')}
      >
        <Text style={[styles.filterText, selectedRole === 'tourist' && styles.filterTextActive]}>Tourists</Text>
      </Pressable>
      <Pressable 
        style={[styles.filterPill, selectedRole === 'hotel_manager' && styles.filterPillActive]} 
        onPress={() => setSelectedRole('hotel_manager')}
      >
        <Text style={[styles.filterText, selectedRole === 'hotel_manager' && styles.filterTextActive]}>Managers</Text>
      </Pressable>
      <Pressable 
        style={[styles.filterPill, selectedRole === 'admin' && styles.filterPillActive]} 
        onPress={() => setSelectedRole('admin')}
      >
        <Text style={[styles.filterText, selectedRole === 'admin' && styles.filterTextActive]}>Admins</Text>
      </Pressable>
      <Pressable 
        style={[styles.filterPill, selectedRole === 'tour_guide' && styles.filterPillActive]} 
        onPress={() => setSelectedRole('tour_guide')}
      >
        <Text style={[styles.filterText, selectedRole === 'tour_guide' && styles.filterTextActive]}>Guides</Text>
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
          <Text style={styles.headerTitle}>User Management</Text>
          <Pressable onPress={fetchUsers} style={styles.refreshButton} hitSlop={15}>
            <Ionicons name="refresh" size={20} color="#1A3B2F" />
          </Pressable>
        </View>

        <FilterPills />

        {loading ? (
          <View style={styles.loadingArea}>
            <ActivityIndicator size="large" color="#FFD166" />
            <Text style={styles.loadingText}>Connecting to database...</Text>
          </View>
        ) : (
          <FlatList
            data={filteredUsers}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Ionicons name="people-outline" size={48} color="rgba(26, 59, 47, 0.1)" />
                <Text style={styles.emptyText}>No users found in this category.</Text>
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
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 8,
    flexWrap: 'wrap',
  },
  filterPill: {
    paddingHorizontal: 12,
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
    paddingTop: 0,
    gap: 12,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(26, 59, 47, 0.08)',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 10,
    elevation: 2,
  },
  userCardInactive: {
    backgroundColor: 'rgba(239, 239, 239, 0.5)',
    borderColor: 'rgba(211, 47, 47, 0.1)',
  },
  userAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#F0FAF5',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(26, 59, 47, 0.1)',
    position: 'relative',
  },
  inactiveAvatarOverlay: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: '#D32F2F',
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  avatarInitial: {
    fontSize: 22,
    fontWeight: '900',
    color: '#1A3B2F',
  },
  userInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  userName: {
    fontSize: 17,
    fontWeight: '900',
    color: '#1A3B2F',
  },
  statusBadge: {
    backgroundColor: 'rgba(211, 47, 47, 0.1)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#D32F2F',
  },
  userEmail: {
    fontSize: 13,
    color: 'rgba(26, 59, 47, 0.5)',
    fontWeight: '600',
    marginTop: 2,
  },
  roleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginTop: 6,
  },
  roleText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#1A3B2F',
    letterSpacing: 0.5,
  },
  toggleBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
  },
  btnDeactivate: {
    backgroundColor: '#1A3B2F',
  },
  btnActivate: {
    backgroundColor: '#81C784',
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
});
