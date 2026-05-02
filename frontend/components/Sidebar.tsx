import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Animated,
  Dimensions,
  SafeAreaView,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');
const SIDEBAR_WIDTH = width * 0.75;

const AUTH_USER_KEY = 'auth:user';
const AUTH_STATUS_KEY = 'auth:isSignedIn';
const AUTH_TOKEN_KEY = 'auth:token';
const ONBOARDING_SEEN_KEY = 'onboarding:seen';

interface SidebarProps {
  isVisible: boolean;
  onClose: () => void;
}

export const Sidebar = ({ isVisible, onClose }: SidebarProps) => {
  const [user, setUser] = useState<any>(null);
  const [shouldRender, setShouldRender] = useState(isVisible);
  const router = useRouter();
  
  const slideAnim = useRef(new Animated.Value(-SIDEBAR_WIDTH)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loadUser = async () => {
      const userData = await AsyncStorage.getItem(AUTH_USER_KEY);
      if (userData) setUser(JSON.parse(userData));
    };
    loadUser();
  }, [isVisible]);

  useEffect(() => {
    if (isVisible) {
      setShouldRender(true);
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: -SIDEBAR_WIDTH,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start(({ finished }) => {
        if (finished) setShouldRender(false);
      });
    }
  }, [isVisible]);

  const handleNavigate = (path: string) => {
    onClose();
    router.push(path as any);
  };

  const handleLogout = async () => {
    Alert.alert(
      "Logout",
      "Are you sure you want to end your session?",
      [
        { text: "Stay", style: "cancel" },
        { 
          text: "Logout", 
          style: "destructive",
          onPress: async () => {
            try {
              onClose();
              await AsyncStorage.multiRemove([
                AUTH_USER_KEY,
                AUTH_STATUS_KEY,
                AUTH_TOKEN_KEY,
                ONBOARDING_SEEN_KEY,
              ]);
              router.replace('/');
            } catch (error) {
              console.error('Logout failed:', error);
              router.replace('/');
            }
          }
        }
      ]
    );
  };

  if (!shouldRender) return null;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents={isVisible ? 'auto' : 'none'}>
      {/* Backdrop */}
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Animated.View style={[styles.backdropTint, { opacity: opacityAnim }]} />
      </Pressable>

      {/* Sidebar Panel */}
      <Animated.View
        style={[
          styles.panel,
          { transform: [{ translateX: slideAnim }] },
        ]}
      >
        <SafeAreaView style={styles.safeContent}>
          <View style={styles.sidebarHeader}>
            <View style={styles.avatarCircle}>
              <Ionicons name="person" size={40} color="#1A3B2F" />
            </View>
            <View>
              <Text style={styles.sidebarName}>{user?.fullName || 'Guest'}</Text>
              <Text style={styles.sidebarRole}>{(user?.role || 'tourist').toUpperCase()}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <ScrollView 
            style={styles.menuList} 
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 20 }}
          >
            <SidebarItem
              icon="home-outline"
              label="Home"
              onPress={() => handleNavigate('/(tabs)')}
            />
            <SidebarItem
              icon="search-outline"
              label="Explore"
              onPress={() => handleNavigate('/(tabs)/explore')}
            />
            {user?.role !== 'admin' && user?.role !== 'hotel_manager' && (
              <>
                <SidebarItem
                  icon="airplane-outline"
                  label="Upcoming Tour Packages"
                  onPress={() => handleNavigate('/tour-packages')}
                />
                <SidebarItem
                  icon="business-outline"
                  label="Hotels"
                  onPress={() => handleNavigate('/tourist-hotels')}
                />
                <SidebarItem
                  icon="people-outline"
                  label="Tour Guides"
                  onPress={() => handleNavigate('/tourist-guides')}
                />
                <SidebarItem
                  icon="bookmark-outline"
                  label="My Bookings"
                  onPress={() => handleNavigate('/(tabs)/bookings')}
                />
              </>
            )}
            <SidebarItem
              icon="notifications-outline"
              label="Notifications"
              onPress={() => {}}
            />
            {user?.role === 'admin' && (
              <>
                <View style={styles.divider} />
                <Text style={styles.sectionLabel}>ADMIN TOOLS</Text>
                <SidebarItem
                  icon="people-outline"
                  label="User Management"
                  onPress={() => handleNavigate('/admin/users')}
                />
                <SidebarItem
                  icon="airplane-outline"
                  label="Tour Packages"
                  onPress={() => handleNavigate('/admin/tour-packages')}
                />
                <SidebarItem
                  icon="business-outline"
                  label="Hotel Management"
                  onPress={() => handleNavigate('/admin/hotels')}
                />
                <SidebarItem
                  icon="id-card-outline"
                  label="Tour Guide Management"
                  onPress={() => handleNavigate('/admin/tour-guides')}
                />
                <SidebarItem
                  icon="list-outline"
                  label="Reservation Management"
                  onPress={() => handleNavigate('/admin/reservations')}
                />
              </>
            )}
            {user?.role === 'hotel_manager' && (
              <>
                <View style={styles.divider} />
                <Text style={styles.sectionLabel}>MANAGER TOOLS</Text>
                <SidebarItem
                  icon="business-outline"
                  label="My Hotels"
                  onPress={() => handleNavigate('/manager/my-hotels')}
                />
              </>
            )}
            <View style={styles.divider} />
            <SidebarItem
              icon="settings-outline"
              label="Settings"
              onPress={() => {}}
            />
            <SidebarItem
              icon="help-circle-outline"
              label="Help Center"
              onPress={() => {}}
            />
          </ScrollView>

          <View style={styles.footer}>
            <Pressable style={styles.logoutBtn} onPress={handleLogout}>
              <Ionicons name="log-out-outline" size={20} color="#1A3B2F" />
              <Text style={styles.logoutBtnText}>Logout</Text>
            </Pressable>
            <Text style={styles.versionText}>Version 1.0.0</Text>
          </View>
        </SafeAreaView>
      </Animated.View>
    </View>
  );
};

const SidebarItem = ({ icon, label, onPress }: any) => (
  <Pressable
    style={({ pressed }) => [styles.menuItem, pressed && styles.menuItemPressed]}
    onPress={onPress}
  >
    <Ionicons name={icon} size={22} color="#1A3B2F" />
    <Text style={styles.menuLabel}>{label}</Text>
  </Pressable>
);

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  backdropTint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  panel: {
    width: SIDEBAR_WIDTH,
    height: '100%',
    backgroundColor: '#F0FAF5',
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 10,
  },
  safeContent: {
    flex: 1,
  },
  sidebarHeader: {
    padding: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingTop: 40,
  },
  avatarCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(26, 59, 47, 0.1)',
  },
  sidebarName: {
    fontSize: 18,
    fontWeight: '900',
    color: '#1A3B2F',
  },
  sidebarRole: {
    fontSize: 11,
    fontWeight: '700',
    color: 'rgba(26, 59, 47, 0.5)',
    marginTop: 2,
    letterSpacing: 0.5,
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: '900',
    color: 'rgba(26, 59, 47, 0.4)',
    marginLeft: 14,
    marginBottom: 8,
    marginTop: 4,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(26, 59, 47, 0.05)',
    marginHorizontal: 24,
    marginVertical: 12,
  },
  menuList: {
    flex: 1,
    paddingHorizontal: 12,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    paddingHorizontal: 12,
    borderRadius: 14,
    gap: 14,
  },
  menuItemPressed: {
    backgroundColor: 'rgba(26, 59, 47, 0.05)',
  },
  menuLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1A3B2F',
  },
  footer: {
    padding: 24,
    borderTopWidth: 1,
    borderTopColor: 'rgba(26, 59, 47, 0.05)',
    gap: 16,
  },
  logoutBtn: {
    backgroundColor: '#FFD166',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 16,
    gap: 10,
    shadowColor: '#FFD166',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 2,
  },
  logoutBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1A3B2F',
  },
  versionText: {
    fontSize: 12,
    color: 'rgba(26, 59, 47, 0.4)',
    fontWeight: '600',
    textAlign: 'center',
  },
});

