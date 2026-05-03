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
  Platform,
  Dimensions,
} from 'react-native';

const { width } = Dimensions.get('window');

import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { API_BASE_URL } from '@/constants/api';
import { StatusBar } from 'expo-status-bar';

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
  const phonePattern = /^\+?[0-9]{7,15}$/;
  const router = useRouter();

  const [touched, setTouched] = useState({ fullName: false, phoneNumber: false });

  const errors = React.useMemo(() => {
    const nameErr = !fullName.trim() ? "Full name is required" : fullName.trim().length < 3 ? "Minimum 3 characters" : null;
    const phoneErr = !phoneNumber.trim() ? "Phone number is required" : !/^[0-9]{10}$/.test(phoneNumber.trim()) ? "Must be exactly 10 digits" : null;
    return { fullName: nameErr, phoneNumber: phoneErr };
  }, [fullName, phoneNumber]);

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
              router.replace('/' as any);
            } catch (error) {
              console.warn('Logout cleanup failed:', error);
              router.replace('/' as any);
            }
          }
        }
      ]
    );
  };

  const handleCancelEdit = () => {
    setFullName(user?.fullName || '');
    setPhoneNumber(user?.phoneNumber || '');
    setIsEditing(false);
  };

  const handleSaveProfile = async () => {
    setTouched({ fullName: true, phoneNumber: true });

    const hasErrors = Object.values(errors).some(err => err !== null);
    if (hasErrors) {
      Alert.alert('Validation Error', 'Please correct the highlighted errors.');
      return;
    }

    const normalizedName = fullName.trim();
    const normalizedPhone = phoneNumber.trim();

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
      Alert.alert('Network Error', 'Could not connect to backend.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.headerRow}>
            <Text style={styles.headerTitle}>My Profile</Text>
            {!isEditing && (
              <Pressable style={styles.logoutPill} onPress={handleLogout}>
                <Ionicons name="log-out-outline" size={18} color="#1A3B2F" />
                <Text style={styles.logoutPillText}>Logout</Text>
              </Pressable>
            )}
          </View>

          <View style={styles.profileCard}>
            <View style={styles.avatarWrap}>
              <View style={styles.avatarPlaceholder}>
                <Ionicons name="person" size={50} color="#1A3B2F" />
              </View>
              <Pressable style={styles.editAvatarButton}>
                <Ionicons name="camera" size={16} color="#ffffff" />
              </Pressable>
            </View>
            <Text style={styles.name}>{user?.fullName || 'User'}</Text>
            <View style={styles.roleBadge}>
              <Text style={styles.roleText}>{(user?.role || 'tourist').toUpperCase()}</Text>
            </View>
          </View>

          <View style={styles.infoCard}>
            <View style={styles.infoHeader}>
              <Text style={styles.sectionTitle}>Account Information</Text>
              {!isEditing && (
                <Pressable style={styles.editButton} onPress={() => setIsEditing(true)}>
                  <Ionicons name="pencil" size={14} color="#FFD166" />
                  <Text style={styles.editText}>Edit</Text>
                </Pressable>
              )}
            </View>

            {isEditing ? (
              <View style={styles.editForm}>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Full Name</Text>
                  <TextInput
                    style={[styles.input, touched.fullName && errors.fullName && styles.errorInput]}
                    value={fullName}
                    onChangeText={(t) => { setFullName(t); setTouched(prev => ({ ...prev, fullName: true })); }}
                    onBlur={() => setTouched(prev => ({ ...prev, fullName: true }))}
                    placeholder="Enter full name"
                  />
                  {touched.fullName && errors.fullName && (
                    <Text style={styles.errorText}>{errors.fullName}</Text>
                  )}
                </View>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Phone Number</Text>
                  <TextInput
                    style={[styles.input, touched.phoneNumber && errors.phoneNumber && styles.errorInput]}
                    value={phoneNumber}
                    onChangeText={(t) => { setPhoneNumber(t); setTouched(prev => ({ ...prev, phoneNumber: true })); }}
                    onBlur={() => setTouched(prev => ({ ...prev, phoneNumber: true }))}
                    keyboardType="phone-pad"
                    maxLength={10}
                    placeholder="Enter phone number"
                  />
                  {touched.phoneNumber && errors.phoneNumber && (
                    <Text style={styles.errorText}>{errors.phoneNumber}</Text>
                  )}
                </View>

                <View style={styles.actionRow}>
                  <Pressable style={styles.cancelBtn} onPress={handleCancelEdit}>
                    <Text style={styles.cancelBtnText}>Cancel</Text>
                  </Pressable>
                  <Pressable style={styles.saveBtn} onPress={handleSaveProfile} disabled={isSaving}>
                    {isSaving ? (
                      <ActivityIndicator size="small" color="#1A3B2F" />
                    ) : (
                      <Text style={styles.saveBtnText}>Save Changes</Text>
                    )}
                  </Pressable>
                </View>
              </View>
            ) : (
              <View style={styles.detailsGrid}>
                <View style={styles.detailItem}>
                  <Text style={styles.label}>Email Address</Text>
                  <Text style={styles.value}>{user?.email || 'N/A'}</Text>
                </View>
                <View style={styles.detailItem}>
                  <Text style={styles.label}>Contact Number</Text>
                  <Text style={styles.value}>{user?.phoneNumber || 'N/A'}</Text>
                </View>
                <View style={styles.detailItem}>
                  <Text style={styles.label}>Account Type</Text>
                  <Text style={styles.value}>{user?.role || 'tourist'}</Text>
                </View>
              </View>
            )}
          </View>
          
          {user?.role === 'admin' && (

            <View style={styles.infoCard}>
              <Text style={[styles.sectionTitle, { marginBottom: 20 }]}>Admin Control Panel</Text>
              <View style={styles.adminGrid}>
                <Pressable style={styles.adminTool} onPress={() => router.push('/admin/users' as any)}>
                  <View style={[styles.toolIcon, { backgroundColor: '#E3F2FD' }]}>
                    <Ionicons name="people" size={24} color="#1E88E5" />
                  </View>
                  <Text style={styles.toolLabel}>Users</Text>
                </Pressable>
                
                <Pressable style={styles.adminTool} onPress={() => router.push('/admin/hotels' as any)}>
                  <View style={[styles.toolIcon, { backgroundColor: '#F3E5F5' }]}>
                    <Ionicons name="business" size={24} color="#8E24AA" />
                  </View>
                  <Text style={styles.toolLabel}>Hotels</Text>
                </Pressable>

                <Pressable style={styles.adminTool} onPress={() => router.push('/admin/reviews' as any)}>
                  <View style={[styles.toolIcon, { backgroundColor: '#FFF3E0' }]}>
                    <Ionicons name="star" size={24} color="#FB8C00" />
                  </View>
                  <Text style={styles.toolLabel}>Reviews</Text>
                </Pressable>

                <Pressable style={styles.adminTool} onPress={() => router.push('/admin/destinations' as any)}>
                  <View style={[styles.toolIcon, { backgroundColor: '#E8F5E9' }]}>
                    <Ionicons name="map" size={24} color="#43A047" />
                  </View>
                  <Text style={styles.toolLabel}>Places</Text>
                </Pressable>
              </View>
            </View>
          )}

          <Pressable style={styles.supportCard}>

            <View style={styles.supportIcon}>
              <Ionicons name="help-circle" size={24} color="#1A3B2F" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.supportTitle}>Need Help?</Text>
              <Text style={styles.supportSub}>Contact our support team 24/7</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="rgba(26, 59, 47, 0.3)" />
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0FAF5',
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'ios' ? 10 : 30,
    paddingBottom: 40,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '900',
    color: '#1A3B2F',
    letterSpacing: -0.5,
  },
  logoutPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFD166',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  logoutPillText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#1A3B2F',
  },
  profileCard: {
    backgroundColor: '#ffffff',
    borderRadius: 30,
    padding: 30,
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(26, 59, 47, 0.08)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 4,
  },
  avatarWrap: {
    position: 'relative',
    marginBottom: 16,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#F0FAF5',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFD166',
  },
  editAvatarButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#1A3B2F',
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#ffffff',
  },
  name: {
    fontSize: 22,
    fontWeight: '900',
    color: '#1A3B2F',
    marginBottom: 6,
  },
  roleBadge: {
    backgroundColor: 'rgba(26, 59, 47, 0.05)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
  },
  roleText: {
    fontSize: 11,
    fontWeight: '800',
    color: 'rgba(26, 59, 47, 0.6)',
    letterSpacing: 1,
  },
  infoCard: {
    backgroundColor: '#ffffff',
    borderRadius: 30,
    padding: 24,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(26, 59, 47, 0.08)',
  },
  infoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1A3B2F',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  editText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFD166',
  },
  detailsGrid: {
    gap: 16,
  },
  detailItem: {
    gap: 4,
  },
  label: {
    fontSize: 12,
    fontWeight: '800',
    color: 'rgba(26, 59, 47, 0.4)',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  value: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1A3B2F',
  },
  editForm: {
    gap: 16,
  },
  inputGroup: {
    gap: 8,
  },
  input: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 12,
    color: '#1A3B2F',
    fontWeight: '600',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 10,
  },
  cancelBtn: {
    flex: 1,
    height: 50,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  cancelBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: 'rgba(26, 59, 47, 0.6)',
  },
  saveBtn: {
    flex: 1,
    height: 50,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFD166',
  },
  saveBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1A3B2F',
  },
  supportCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 24,
    gap: 16,
    borderWidth: 1,
    borderColor: 'rgba(26, 59, 47, 0.05)',
  },
  adminGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 15,
  },
  adminTool: {
    width: (width - 48 - 48 - 30) / 3, // Adjust based on padding
    alignItems: 'center',
    gap: 8,
  },
  toolIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toolLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1A3B2F',
  },
  supportIcon: {

    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#F0FAF5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  supportTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1A3B2F',
  },
  supportSub: {
    fontSize: 13,
    color: 'rgba(26, 59, 47, 0.5)',
    fontWeight: '500',
  },
  errorInput: {
    borderColor: '#ff4444',
  },
  errorText: {
    color: '#ff4444',
    fontSize: 12,
    marginTop: 2,
    marginLeft: 4,
    fontWeight: '600',
  },
});