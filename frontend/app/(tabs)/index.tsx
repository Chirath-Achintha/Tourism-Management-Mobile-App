import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, Pressable, ActivityIndicator, Platform, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { Sidebar } from '@/components/Sidebar';

const AUTH_USER_KEY = "auth:user";
const AUTH_STATUS_KEY = "auth:isSignedIn";
const AUTH_TOKEN_KEY = "auth:token";
const ONBOARDING_SEEN_KEY = "onboarding:seen";

// --- Components ---

const TouristDashboardContent = ({ user, onLogout, onExplore, onOpenSidebar }: any) => (
  <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
    <View style={styles.header}>
      <View style={styles.headerLeft}>
        <Pressable onPress={onOpenSidebar} style={styles.menuButton} hitSlop={15}>
          <Ionicons name="menu-outline" size={28} color="#1A3B2F" />
        </Pressable>
        <View>
          <Text style={styles.welcomeText}>Welcome back,</Text>
          <Text style={styles.userName}>{user?.fullName || 'Tourist'}</Text>
        </View>
      </View>
      <Pressable style={styles.logoutButton} onPress={onLogout} hitSlop={10}>
        <Ionicons name="log-out-outline" size={18} color="#1A3B2F" />
        <Text style={styles.logoutButtonText}>Logout</Text>
      </Pressable>
    </View>

    <View style={styles.roleBadge}>
      <Text style={styles.roleText}>TOURIST</Text>
    </View>

    <View style={styles.statsContainer}>
      <View style={styles.statCard}>
        <Text style={styles.statNumber}>12</Text>
        <Text style={styles.statLabel}>Trips</Text>
      </View>
      <View style={styles.statCard}>
        <Text style={styles.statNumber}>05</Text>
        <Text style={styles.statLabel}>Places</Text>
      </View>
      <View style={styles.statCard}>
        <Text style={styles.statNumber}>08</Text>
        <Text style={styles.statLabel}>Reviews</Text>
      </View>
    </View>

    <Text style={styles.sectionTitle}>Upcoming Journeys</Text>
    <View style={styles.emptyState}>
      <View style={styles.emptyIconContainer}>
        <Ionicons name="airplane-outline" size={40} color="#FFD166" />
      </View>
      <Text style={styles.emptyStateTitle}>No trips planned yet</Text>
      <Text style={styles.emptyStateSub}>Start exploring Sri Lanka's magic to book your first adventure.</Text>
      <Pressable style={styles.actionButton} onPress={onExplore}>
        <Text style={styles.actionButtonText}>Explore Options</Text>
      </Pressable>
    </View>
  </ScrollView>
);

const HotelManagerDashboardContent = ({ user, onLogout, onOpenSidebar }: any) => (
  <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
    <View style={styles.header}>
      <View style={styles.headerLeft}>
        <Pressable onPress={onOpenSidebar} style={styles.menuButton} hitSlop={15}>
          <Ionicons name="menu-outline" size={28} color="#1A3B2F" />
        </Pressable>
        <View>
          <Text style={styles.welcomeText}>Manager Portal,</Text>
          <Text style={styles.userName}>{user?.fullName || 'Manager'}</Text>
        </View>
      </View>
      <Pressable style={styles.logoutButton} onPress={onLogout} hitSlop={10}>
        <Ionicons name="log-out-outline" size={18} color="#1A3B2F" />
        <Text style={styles.logoutButtonText}>Logout</Text>
      </Pressable>
    </View>

    <View style={styles.roleBadge}>
      <Text style={styles.roleText}>HOTEL MANAGER</Text>
    </View>

    <View style={styles.statsContainer}>
      <View style={styles.statCard}>
        <Text style={styles.statNumber}>24</Text>
        <Text style={styles.statLabel}>Bookings</Text>
      </View>
      <View style={styles.statCard}>
        <Text style={styles.statNumber}>08</Text>
        <Text style={styles.statLabel}>Pending</Text>
      </View>
      <View style={styles.statCard}>
        <Text style={styles.statNumber}>45k</Text>
        <Text style={styles.statLabel}>Revenue</Text>
      </View>
    </View>

    <Text style={styles.sectionTitle}>Quick Actions</Text>
    <View style={styles.quickActionsGrid}>
      <Pressable style={styles.quickActionItem}>
        <View style={[styles.actionIcon, { backgroundColor: 'rgba(46, 125, 50, 0.2)' }]}>
          <Ionicons name="add-outline" size={24} color="#81C784" />
        </View>
        <Text style={styles.actionLabel}>Add Room</Text>
      </Pressable>
      <Pressable style={styles.quickActionItem}>
        <View style={[styles.actionIcon, { backgroundColor: 'rgba(21, 101, 192, 0.2)' }]}>
          <Ionicons name="calendar-outline" size={24} color="#64B5F6" />
        </View>
        <Text style={styles.actionLabel}>Schedule</Text>
      </Pressable>
      <Pressable style={styles.quickActionItem}>
        <View style={[styles.actionIcon, { backgroundColor: 'rgba(239, 108, 0, 0.2)' }]}>
          <Ionicons name="star-outline" size={24} color="#FFB74D" />
        </View>
        <Text style={styles.actionLabel}>Reviews</Text>
      </Pressable>
    </View>

    <View style={styles.managerCard}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>Recent Activity</Text>
        <Pressable><Text style={styles.viewAllText}>View All</Text></Pressable>
      </View>
      <View style={styles.activityItem}>
        <View style={styles.activityDot} />
        <View>
          <Text style={styles.activityText}>New booking from John Doe</Text>
          <Text style={styles.activityTime}>2 mins ago</Text>
        </View>
      </View>
      <View style={styles.activityItem}>
        <View style={[styles.activityDot, { backgroundColor: '#FFD166' }]} />
        <View>
          <Text style={styles.activityText}>Payment received for #BK-204</Text>
          <Text style={styles.activityTime}>1 hour ago</Text>
        </View>
      </View>
    </View>
  </ScrollView>
);

const AdminDashboardContent = ({ user, onLogout, onOpenSidebar }: any) => (
  <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
    <View style={styles.header}>
      <View style={styles.headerLeft}>
        <Pressable onPress={onOpenSidebar} style={styles.menuButton} hitSlop={15}>
          <Ionicons name="menu-outline" size={28} color="#1A3B2F" />
        </Pressable>
        <View>
          <Text style={styles.welcomeText}>System Admin,</Text>
          <Text style={styles.userName}>{user?.fullName || 'Admin'}</Text>
        </View>
      </View>
      <Pressable style={styles.logoutButton} onPress={onLogout} hitSlop={10}>
        <Ionicons name="log-out-outline" size={18} color="#1A3B2F" />
        <Text style={styles.logoutButtonText}>Logout</Text>
      </Pressable>
    </View>

    <View style={[styles.roleBadge, { backgroundColor: 'rgba(211, 47, 47, 0.1)' }]}>
      <Text style={[styles.roleText, { color: '#D32F2F' }]}>ADMINISTRATOR</Text>
    </View>

    <View style={styles.statsContainer}>
      <View style={styles.statCard}>
        <Text style={styles.statNumber}>1.2k</Text>
        <Text style={styles.statLabel}>Users</Text>
      </View>
      <View style={styles.statCard}>
        <Text style={styles.statNumber}>85</Text>
        <Text style={styles.statLabel}>Hotels</Text>
      </View>
      <View style={styles.statCard}>
        <Text style={styles.statNumber}>312</Text>
        <Text style={styles.statLabel}>Active</Text>
      </View>
    </View>

    <View style={styles.managerCard}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>Recent Notifications</Text>
        <Pressable><Text style={styles.viewAllText}>View All</Text></Pressable>
      </View>
      <View style={styles.activityItem}>
        <View style={[styles.activityDot, { backgroundColor: '#FFD166' }]} />
        <View>
          <Text style={styles.activityText}>New hotel verification request</Text>
          <Text style={styles.activityTime}>Blue Water Villa</Text>
        </View>
      </View>
      <View style={styles.activityItem}>
        <View style={[styles.activityDot, { backgroundColor: '#FFD166' }]} />
        <View>
          <Text style={styles.activityText}>Security alert: Unusual login</Text>
          <Text style={styles.activityTime}>Review required</Text>
        </View>
      </View>
    </View>
  </ScrollView>
);

// --- Main Screen ---

export default function DashboardScreen() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isSidebarVisible, setSidebarVisible] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const userData = await AsyncStorage.getItem(AUTH_USER_KEY);
        if (userData) {
          setUser(JSON.parse(userData));
        }
      } catch (error) {
        console.error("Fetch user failed:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, []);

  const handleLogout = async () => {
    Alert.alert(
      "Logout",
      "Are you sure you want to logout?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Logout", 
          style: "destructive",
          onPress: async () => {
            try {
              await AsyncStorage.multiRemove([
                AUTH_USER_KEY,
                AUTH_STATUS_KEY,
                AUTH_TOKEN_KEY,
                ONBOARDING_SEEN_KEY,
              ]);
              setUser(null);
              router.dismissAll();
              router.replace("/");
            } catch (error) {
              console.warn("Logout cleanup failed:", error);
              router.dismissAll();
              router.replace("/");
            }
          }
        }
      ]
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color="#FFD166" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <SafeAreaView style={{ flex: 1 }}>
        {user?.role === 'admin' ? (
          <AdminDashboardContent 
            user={user} 
            onLogout={handleLogout} 
            onOpenSidebar={() => setSidebarVisible(true)}
          />
        ) : user?.role === 'hotel_manager' ? (
          <HotelManagerDashboardContent 
            user={user} 
            onLogout={handleLogout} 
            onOpenSidebar={() => setSidebarVisible(true)}
          />
        ) : (
          <TouristDashboardContent 
            user={user} 
            onLogout={handleLogout} 
            onExplore={() => router.push('/(tabs)/explore')} 
            onOpenSidebar={() => setSidebarVisible(true)}
          />
        )}
      </SafeAreaView>
      <Sidebar isVisible={isSidebarVisible} onClose={() => setSidebarVisible(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0FAF5', 
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'ios' ? 10 : 30,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  menuButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(26, 59, 47, 0.05)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  welcomeText: {
    fontSize: 15,
    color: 'rgba(26, 59, 47, 0.6)',
    fontWeight: '500',
  },
  userName: {
    fontSize: 26,
    fontWeight: '900',
    color: '#1A3B2F',
    letterSpacing: -0.5,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFD166',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 999,
  },
  logoutButtonText: {
    color: '#1A3B2F',
    fontSize: 12,
    fontWeight: '800',
  },
  roleBadge: {
    backgroundColor: 'rgba(26, 59, 47, 0.08)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    alignSelf: 'flex-start',
    marginBottom: 28,
  },
  roleText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#1A3B2F',
    letterSpacing: 1.2,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 32,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    padding: 18,
    borderRadius: 22,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(26, 59, 47, 0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  statNumber: {
    fontSize: 22,
    fontWeight: '900',
    color: '#1A3B2F',
  },
  statLabel: {
    fontSize: 11,
    color: 'rgba(26, 59, 47, 0.4)',
    marginTop: 4,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#1A3B2F',
    marginBottom: 18,
    letterSpacing: -0.3,
  },
  emptyState: {
    backgroundColor: '#ffffff',
    borderRadius: 28,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(26, 59, 47, 0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  emptyIconContainer: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(255, 209, 102, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1A3B2F',
    marginBottom: 8,
  },
  emptyStateSub: {
    fontSize: 14,
    color: 'rgba(26, 59, 47, 0.5)',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 26,
  },
  actionButton: {
    backgroundColor: '#FFD166',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 18,
    width: '100%',
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#1A3B2F',
    fontWeight: '900',
    fontSize: 16,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 32,
  },
  quickActionItem: {
    alignItems: 'center',
    gap: 8,
    width: '30%',
  },
  actionIcon: {
    width: 60,
    height: 60,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 1,
  },
  actionLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: 'rgba(26, 59, 47, 0.7)',
  },
  managerCard: {
    backgroundColor: '#ffffff',
    borderRadius: 28,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(26, 59, 47, 0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#1A3B2F',
  },
  viewAllText: {
    fontSize: 13,
    color: '#FFD166',
    fontWeight: '800',
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  activityDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#81C784',
  },
  activityText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1A3B2F',
  },
  activityTime: {
    fontSize: 11,
    color: 'rgba(26, 59, 47, 0.4)',
    marginTop: 2,
  },
});
