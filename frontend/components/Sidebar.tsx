import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Animated,
  Dimensions,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');
const SIDEBAR_WIDTH = width * 0.75;

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
      const userData = await AsyncStorage.getItem('auth:user');
      if (userData) setUser(JSON.parse(userData));
    };
    loadUser();
  }, []);

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

          <View style={styles.menuList}>
            <SidebarItem
              icon="house-outline"
              label="Home"
              onPress={() => handleNavigate('/(tabs)')}
            />
            <SidebarItem
              icon="search-outline"
              label="Explore"
              onPress={() => handleNavigate('/(tabs)/explore')}
            />
            <SidebarItem
              icon="bookmark-outline"
              label="My Bookings"
              onPress={() => {}}
            />
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
                  icon="business-outline"
                  label="Hotel Management"
                  onPress={() => {}}
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
          </View>

          <View style={styles.footer}>
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
  },
  versionText: {
    fontSize: 12,
    color: 'rgba(26, 59, 47, 0.4)',
    fontWeight: '600',
  },
});
