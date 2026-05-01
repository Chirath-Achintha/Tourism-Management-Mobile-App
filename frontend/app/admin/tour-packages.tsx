import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { View, Text, StyleSheet, FlatList, SafeAreaView, Pressable, ActivityIndicator, Alert, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { API_BASE_URL } from '@/constants/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function TourPackagesScreen() {
  const [packages, setPackages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const fetchTourPackages = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('auth:token');
      
      if (!token) {
        Alert.alert("Session Expired", "Please log in again as an administrator.");
        router.replace("/login");
        return;
      }

      const response = await fetch(`${API_BASE_URL}/admin/tour-packages`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('Fetch response status:', response.status);
      console.log('API URL:', `${API_BASE_URL}/admin/tour-packages`);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response:', errorText);
        Alert.alert("API Error", `Status ${response.status}: ${errorText.slice(0, 100)}`);
        return;
      }

      const data = await response.json();
      console.log('Fetched packages:', data);
      setPackages(Array.isArray(data) ? data : []);
    } catch (error: any) {
      console.error("Fetch tour packages failed:", error.message);
      Alert.alert("Error", error.message || "Could not connect to the database.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTourPackages();
  }, []);

  // Also refresh when screen comes into focus (handles navigation back from add/edit)
  useFocusEffect(
    useCallback(() => {
      fetchTourPackages();
    }, [])
  );

  const handleAddPackage = () => {
    router.push('/admin/add-tour-package');
  };

  const handleEditPackage = (packageId: string) => {
    router.push(`/admin/edit-tour-package/${packageId}`);
  };

  const handleDeletePackage = async (packageId: string) => {
    Alert.alert(
      "Confirm Delete",
      "Are you sure you want to delete this tour package?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem('auth:token');
              const response = await fetch(`${API_BASE_URL}/admin/tour-packages/${packageId}`, {
                method: 'DELETE',
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json'
                }
              });

              console.log('Delete response status:', response.status);

              if (!response.ok) {
                const errorText = await response.text();
                console.error('Delete error response:', errorText);
                Alert.alert("Error", `Failed to delete: ${errorText.slice(0, 100)}`);
                return;
              }

              Alert.alert("Success", "Tour package deleted successfully");
              fetchTourPackages();
            } catch (error: any) {
              console.error("Delete error:", error.message);
              Alert.alert("Error", error.message || "An error occurred while deleting");
            }
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#1A3B2F" />
        </Pressable>
        <Text style={styles.title}>Tour Packages</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Add Package Button */}
      <Pressable 
        style={({ pressed }) => [
          styles.addButton,
          pressed && styles.addButtonPressed
        ]}
        onPress={handleAddPackage}
      >
        <Ionicons name="add" size={24} color="#FFFFFF" />
        <Text style={styles.addButtonText}>Add Tour Package</Text>
      </Pressable>

      {/* Content */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1A3B2F" />
          <Text style={styles.loadingText}>Loading tour packages...</Text>
        </View>
      ) : packages.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="briefcase-outline" size={64} color="#C0C0C0" />
          <Text style={styles.emptyText}>No tour packages found</Text>
          <Text style={styles.emptySubtext}>Create one by clicking the button above</Text>
        </View>
      ) : (
        <FlatList
          data={packages}
          renderItem={({ item }) => (
            <View style={styles.packageCard}>
              <View style={styles.packageInfo}>
                <Text style={styles.packageName}>{item.name || 'Unnamed Package'}</Text>
                <Text style={styles.packageDescription} numberOfLines={2}>
                  {item.description || 'No description'}
                </Text>
                <View style={styles.packageDetails}>
                  <View style={styles.detailBadge}>
                    <Text style={styles.badgeText}>
                      ${item.price || 'N/A'}
                    </Text>
                  </View>
                  <View style={styles.detailBadge}>
                    <Text style={styles.badgeText}>
                      {item.duration || 'N/A'} days
                    </Text>
                  </View>
                </View>
              </View>
              <View style={styles.packageActions}>
                <Pressable 
                  style={({ pressed }) => [
                    styles.actionButton,
                    styles.editButton,
                    pressed && styles.actionButtonPressed
                  ]}
                  onPress={() => handleEditPackage(item._id)}
                >
                  <Ionicons name="pencil" size={18} color="#FFFFFF" />
                </Pressable>
                <Pressable 
                  style={({ pressed }) => [
                    styles.actionButton,
                    styles.deleteButton,
                    pressed && styles.actionButtonPressed
                  ]}
                  onPress={() => handleDeletePackage(item._id)}
                >
                  <Ionicons name="trash" size={18} color="#FFFFFF" />
                </Pressable>
              </View>
            </View>
          )}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContent}
          scrollEnabled={true}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A3B2F',
  },
  addButton: {
    flexDirection: 'row',
    backgroundColor: '#1A8E5F',
    marginHorizontal: 20,
    marginVertical: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  addButtonPressed: {
    opacity: 0.8,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: '#666',
    fontSize: 14,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A3B2F',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  packageCard: {
    backgroundColor: '#F9F9F9',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderLeftWidth: 4,
    borderLeftColor: '#1A8E5F',
  },
  packageInfo: {
    flex: 1,
    marginRight: 12,
  },
  packageName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A3B2F',
    marginBottom: 4,
  },
  packageDescription: {
    fontSize: 13,
    color: '#666',
    marginBottom: 8,
  },
  packageDetails: {
    flexDirection: 'row',
    gap: 8,
  },
  detailBadge: {
    backgroundColor: '#E8F5F0',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#1A8E5F',
  },
  packageActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 44,
    height: 44,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionButtonPressed: {
    opacity: 0.7,
  },
  editButton: {
    backgroundColor: '#4A90E2',
  },
  deleteButton: {
    backgroundColor: '#E74C3C',
  },
});
