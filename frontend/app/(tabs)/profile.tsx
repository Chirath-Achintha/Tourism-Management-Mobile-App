import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Pressable,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { API_BASE_URL } from '@/constants/api';

const AUTH_USER_KEY = 'auth:user';
const AUTH_STATUS_KEY = 'auth:isSignedIn';
const AUTH_TOKEN_KEY = 'auth:token';
const ONBOARDING_SEEN_KEY = 'onboarding:seen';

export default function ProfileScreen() {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const router = useRouter();

  const phonePattern = /^\+?[0-9]{7,15}$/;

  useEffect(() => {
    const loadUser = async () => {
      const userData = await AsyncStorage.getItem(AUTH_USER_KEY);
      if (userData) {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
        setFullName(parsedUser.fullName || '');
        setPhoneNumber(parsedUser.phoneNumber || '');
      }
    };

    loadUser();
  }, []);

  const handleLogout = async () => {
    try {
      await AsyncStorage.multiRemove([
        AUTH_USER_KEY,
        AUTH_STATUS_KEY,
        AUTH_TOKEN_KEY,
        ONBOARDING_SEEN_KEY,
      ]);
    } catch (error) {
      console.warn('Logout cleanup failed:', error);
    } finally {
      router.dismissAll();
      router.replace('/');
    }
  };

  const handleCancelEdit = () => {
    setFullName(user?.fullName || '');
    setPhoneNumber(user?.phoneNumber || '');
    setIsEditing(false);
  };

  const handleSaveProfile = async () => {
    const normalizedName = fullName.trim();
    const normalizedPhone = phoneNumber.trim();

    if (!normalizedName || !normalizedPhone) {
      Alert.alert('Validation', 'Full name and phone number are required.');
      return;
    }

    if (!phonePattern.test(normalizedPhone)) {
      Alert.alert('Validation', 'Enter a valid phone number with 7-15 digits.');
      return;
    }

    if (!user?.id) {
      Alert.alert('Error', 'User ID is missing. Please log in again.');
      return;
    }

    try {
      setIsSaving(true);

      const token = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
      const response = await fetch(`${API_BASE_URL}/auth/profile/${user.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          fullName: normalizedName,
          phoneNumber: normalizedPhone,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        Alert.alert('Update Failed', data.message || 'Could not update profile.');
        return;
      }

      setUser(data.user);
      await AsyncStorage.setItem(AUTH_USER_KEY, JSON.stringify(data.user));
      setIsEditing(false);
      Alert.alert('Success', 'Your profile has been updated.');
    } catch {
      Alert.alert('Network Error', 'Could not connect to backend. Check your server and IP.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.profileCard}>
          <View style={styles.avatarWrap}>
            <IconSymbol name="person.crop.circle.fill" size={74} color="#f2a978" />
          </View>
          <Text style={styles.name}>{user?.fullName || 'Tourist'}</Text>
          <Text style={styles.role}>{(user?.role || 'tourist').toUpperCase()}</Text>
        </View>

        <View style={styles.infoCard}>
          <View style={styles.infoHeader}>
            <Text style={styles.sectionTitle}>Account Details</Text>
            {!isEditing ? (
              <Pressable style={styles.editButton} onPress={() => setIsEditing(true)} hitSlop={10}>
                <IconSymbol name="square.and.pencil" size={16} color="#1f2937" />
                <Text style={styles.editText}>Edit</Text>
              </Pressable>
            ) : null}
          </View>

          {isEditing ? (
            <>
              <View style={styles.detailRow}>
                <Text style={styles.label}>Full Name</Text>
                <TextInput
                  style={styles.input}
                  value={fullName}
                  onChangeText={setFullName}
                  placeholder="Enter full name"
                  placeholderTextColor="#9ca3af"
                />
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.label}>Email</Text>
                <View style={styles.readonlyField}>
                  <Text style={styles.readonlyValue}>{user?.email || 'Not available'}</Text>
                </View>
                <Text style={styles.readonlyHint}>Email cannot be edited.</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.label}>Phone</Text>
                <TextInput
                  style={styles.input}
                  value={phoneNumber}
                  onChangeText={setPhoneNumber}
                  keyboardType="phone-pad"
                  placeholder="Enter phone number"
                  placeholderTextColor="#9ca3af"
                />
              </View>
              <View style={styles.editActions}>
                <Pressable style={styles.cancelButton} onPress={handleCancelEdit} disabled={isSaving}>
                  <Text style={styles.cancelText}>Cancel</Text>
                </Pressable>
                <Pressable
                  style={[styles.saveButton, isSaving && styles.disabledButton]}
                  onPress={() => void handleSaveProfile()}
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.saveText}>Save Changes</Text>
                  )}
                </Pressable>
              </View>
            </>
          ) : (
            <>
              <View style={styles.detailRow}>
                <Text style={styles.label}>Email</Text>
                <Text style={styles.value}>{user?.email || 'Not available'}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.label}>Phone</Text>
                <Text style={styles.value}>{user?.phoneNumber || 'Not available'}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.label}>Role</Text>
                <Text style={styles.value}>{user?.role || 'tourist'}</Text>
              </View>
            </>
          )}
        </View>

        <Pressable style={styles.logoutButton} onPress={() => void handleLogout()} hitSlop={10}>
          <IconSymbol name="rectangle.portrait.and.arrow.right" size={18} color="#fff" />
          <Text style={styles.logoutText}>Logout</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7f5ef',
  },
  content: {
    padding: 24,
    gap: 18,
  },
  profileCard: {
    backgroundColor: '#111827',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
  },
  avatarWrap: {
    marginBottom: 12,
  },
  name: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '800',
  },
  role: {
    marginTop: 6,
    color: '#f2a978',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
  },
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    gap: 14,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1f2937',
    marginBottom: 2,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#f3f4f6',
    borderRadius: 999,
    paddingVertical: 7,
    paddingHorizontal: 12,
  },
  editText: {
    color: '#1f2937',
    fontWeight: '700',
    fontSize: 13,
  },
  detailRow: {
    gap: 4,
  },
  label: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  value: {
    fontSize: 16,
    color: '#111827',
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    backgroundColor: '#f9fafb',
    color: '#111827',
    paddingHorizontal: 12,
    paddingVertical: 11,
    fontSize: 15,
    fontWeight: '500',
  },
  readonlyField: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 12,
    paddingVertical: 11,
  },
  readonlyValue: {
    color: '#6b7280',
    fontSize: 15,
    fontWeight: '600',
  },
  readonlyHint: {
    color: '#6b7280',
    fontSize: 12,
    fontWeight: '500',
  },
  editActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
  },
  cancelButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  cancelText: {
    color: '#374151',
    fontWeight: '700',
    fontSize: 14,
  },
  saveButton: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#111827',
  },
  saveText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 14,
  },
  disabledButton: {
    opacity: 0.8,
  },
  logoutButton: {
    marginTop: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#f2a978',
    paddingVertical: 14,
    borderRadius: 16,
  },
  logoutText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '800',
  },
});