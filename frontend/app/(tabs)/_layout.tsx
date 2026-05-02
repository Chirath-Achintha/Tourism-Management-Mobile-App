import { Tabs } from 'expo-router';
import React, { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { View, ActivityIndicator, Platform } from 'react-native';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

const AUTH_USER_KEY = "auth:user";

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isHotelManager, setIsHotelManager] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkRole = async () => {
      try {
        const userData = await AsyncStorage.getItem(AUTH_USER_KEY);
        if (userData) {
          const user = JSON.parse(userData);
          setIsAdmin(user?.role === 'admin');
          setIsHotelManager(user?.role === 'hotel_manager');
        }
      } catch (error) {
        console.error("Layout role check failed:", error);
      } finally {
        setLoading(false);
      }
    };
    checkRole();
  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F0FAF5' }}>
        <ActivityIndicator size="small" color="#FFD166" />
      </View>
    );
  }

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#1A3B2F', // Dark forest green tint for active tab
        tabBarInactiveTintColor: 'rgba(26, 59, 47, 0.4)',
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopWidth: 1,
          borderTopColor: 'rgba(26, 59, 47, 0.05)',
          paddingTop: 5,
          height: Platform.OS === 'ios' ? 88 : 64,
        }
      }}>
      
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <IconSymbol size={26} name="house.fill" color={color} />,
        }}
      />
      
      <Tabs.Screen
        name="explore"
        options={{
          title: isHotelManager ? 'Add Hotel' : 'Search',
          tabBarIcon: ({ color }) => (
            <IconSymbol 
              size={26} 
              name={isHotelManager ? "plus.circle.fill" : "magnifyingglass"} 
              color={color} 
            />
          ),
        }}
      />
      
      <Tabs.Screen
        name="bookings"
        options={{
          title: 'Bookings',
          tabBarIcon: ({ color }) => <IconSymbol size={26} name="calendar.fill" color={color} />,
          href: isHotelManager ? null : undefined,
        }}
      />
      
      <Tabs.Screen
        name="profile"

        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => <IconSymbol size={26} name="person.crop.circle.fill" color={color} />,
        }}
      />
    </Tabs>
  );
}

