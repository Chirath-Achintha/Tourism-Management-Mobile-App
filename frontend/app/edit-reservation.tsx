import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TextInput,
  Pressable,
  Alert,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { API_BASE_URL } from '@/constants/api';
import * as DocumentPicker from 'expo-document-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';

const { width } = Dimensions.get('window');

const COLORS = {
  primary: '#1A3B2F',
  primaryDark: '#0E241D',
  accent: '#FFD166',
  secondary: '#64748B',
  bg: '#F0FAF5',
  white: '#FFFFFF',
  green: '#10B981',
  error: '#EF4444',
  text: '#1A3B2F',
  border: '#D1EAD9',
};

export default function EditReservationScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  
  const [reservation, setReservation] = useState<any>(null);
  const [numberOfPeople, setNumberOfPeople] = useState('1');
  const [specialRequest, setSpecialRequest] = useState('');
  const [documentType, setDocumentType] = useState('NIC');
  const [documentFile, setDocumentFile] = useState<any>(null);
  const [totalPrice, setTotalPrice] = useState(0);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchReservation();
  }, [id]);

  useEffect(() => {
    if (reservation?.packageId?.price) {
      const people = parseInt(numberOfPeople) || 0;
      setTotalPrice(people * reservation.packageId.price);
    }
  }, [numberOfPeople, reservation]);

  const handlePeopleChange = (text: string) => {
    // Only allow numbers
    const numericValue = text.replace(/[^0-9]/g, '');
    setNumberOfPeople(numericValue);
  };

  const fetchReservation = async () => {
    try {
      const token = await AsyncStorage.getItem('auth:token');
      const res = await fetch(`${API_BASE_URL}/reservations/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        setReservation(data);
        setNumberOfPeople(data.numberOfPeople?.toString() || '1');
        setSpecialRequest(data.specialRequest || '');
        setDocumentType(data.documentType || 'NIC');
        setTotalPrice(data.totalPrice || 0);
      } else {
        Alert.alert('Error', data.message || 'Failed to fetch reservation');
      }
    } catch (err) {
      Alert.alert('Error', 'Network error');
    } finally {
      setLoading(false);
    }
  };

  async function pickDocument() {
    if (reservation.status !== 'Pending') return;
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['image/*', 'application/pdf'],
        copyToCacheDirectory: true,
      });
      if (!result.canceled) setDocumentFile(result.assets[0]);
    } catch (err) {
      Alert.alert('Error', 'Failed to pick document');
    }
  }

  async function handleUpdate() {
    if (!numberOfPeople) {
      Alert.alert('Missing Fields', 'Please provide people count.');
      return;
    }

    if (parseInt(numberOfPeople) <= 0) {
      Alert.alert('Invalid Input', 'Number of people must be at least 1.');
      return;
    }

    try {
      setUpdating(true);
      const token = await AsyncStorage.getItem('auth:token');
      const formData = new FormData();
      formData.append('numberOfPeople', numberOfPeople);
      formData.append('specialRequest', specialRequest);
      formData.append('documentType', documentType);
      
      if (documentFile) {
        formData.append('document', {
          uri: documentFile.uri,
          name: documentFile.name,
          type: documentFile.mimeType,
        } as any);
      }

      const res = await fetch(`${API_BASE_URL}/reservations/${id}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData,
      });

      if (res.ok) {
        Alert.alert('Success', 'Your changes have been saved!', [
          { text: 'Back to Bookings', onPress: () => router.replace('/(tabs)/bookings' as any) }
        ]);
      } else {
        const data = await res.json();
        Alert.alert('Error', data.message || 'Failed to update reservation');
      }
    } catch (error) {
      Alert.alert('Error', 'Network error. Please try again.');
    } finally {
      setUpdating(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  const isEditable = reservation.status === 'Pending';

  return (
    <View style={styles.container}>
      <StatusBar style="light" translucent />
      <LinearGradient
        colors={[COLORS.primary, COLORS.primaryDark]}
        style={styles.headerGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        <View style={styles.headerContent}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={28} color="white" />
          </Pressable>
          <Text style={styles.headerTitle}>Edit Reservation</Text>
        </View>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {!isEditable && (
          <View style={styles.lockedWarning}>
            <View style={styles.lockedWarningIcon}>
              <Ionicons name="lock-closed" size={20} color="white" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.lockedWarningTitle}>Reservation Locked</Text>
              <Text style={styles.lockedWarningText}>
                This booking is already {reservation.status.toLowerCase()} and cannot be modified.
              </Text>
            </View>
          </View>
        )}

        <View style={styles.packageCard}>
          <View style={styles.packageHeader}>
            <View>
              <Text style={styles.label}>Selected Package</Text>
              <Text style={styles.pkgName}>{reservation.packageId?.name || 'N/A'}</Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: (reservation.status === 'Pending' ? COLORS.accent : COLORS.green) + '15' }]}>
              <Text style={[styles.statusBadgeText, { color: reservation.status === 'Pending' ? COLORS.primary : COLORS.green }]}>
                {reservation.status}
              </Text>
            </View>
          </View>
        </View>

        <View style={[styles.formSection, !isEditable && { opacity: 0.7 }]}>
          <Text style={styles.sectionTitle}>Update Details</Text>
          
          <CustomInput 
            label="Number of People" 
            val={numberOfPeople} 
            setVal={handlePeopleChange} 
            placeholder="1" 
            keyboard="numeric" 
            icon="people-outline" 
            editable={isEditable} 
          />
          
          <CustomInput 
            label="Special Requests (Optional)" 
            val={specialRequest} 
            setVal={setSpecialRequest} 
            placeholder="Dietary needs, special assistance, etc." 
            multiline 
            icon="chatbubble-ellipses-outline" 
            editable={isEditable} 
          />
          
          <Text style={styles.inputLabel}>Update Identity Verification</Text>
          <View style={styles.typeGrid}>
            {['NIC', 'Driving License', 'Passport', 'Int. License'].map(t => (
              <Pressable 
                key={t} 
                onPress={() => isEditable && setDocumentType(t)} 
                style={[styles.typeBtn, documentType === t && styles.typeBtnActive]}
                disabled={!isEditable}
              >
                <Text style={[styles.typeBtnText, documentType === t && styles.typeBtnTextActive]}>{t}</Text>
              </Pressable>
            ))}
          </View>

          <Pressable 
            style={[styles.uploadBox, !isEditable && { opacity: 0.5 }]} 
            onPress={pickDocument}
            disabled={!isEditable}
          >
            <LinearGradient
              colors={documentFile ? [COLORS.green + '20', COLORS.green + '10'] : [COLORS.primary + '10', COLORS.primary + '05']}
              style={styles.uploadGradient}
            >
              <Ionicons 
                name={documentFile ? "checkmark-circle" : "cloud-upload-outline"} 
                size={40} 
                color={documentFile ? COLORS.green : COLORS.primary} 
              />
              <Text style={[styles.uploadText, documentFile && { color: COLORS.green }]}>
                {documentFile ? documentFile.name : "Tap to replace document"}
              </Text>
              {!documentFile && <Text style={styles.uploadSubText}>Keep existing if no changes needed</Text>}
            </LinearGradient>
          </Pressable>
        </View>

        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total Investment</Text>
            <Text style={styles.summaryPrice}>LKR {totalPrice}</Text>
          </View>
        </View>

        {isEditable && (
          <Pressable 
            style={({ pressed }) => [
              styles.mainBtnContainer,
              (updating || pressed) && { opacity: 0.8 }
            ]} 
            onPress={handleUpdate} 
            disabled={updating}
          >
            <LinearGradient
              colors={[COLORS.primary, COLORS.primaryDark]}
              style={styles.mainBtn}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              {updating ? (
                <ActivityIndicator color="white" />
              ) : (
                <View style={styles.btnContent}>
                  <Text style={styles.mainBtnText}>Save Changes</Text>
                  <Ionicons name="checkmark-done" size={20} color="white" />
                </View>
              )}
            </LinearGradient>
          </Pressable>
        )}
      </ScrollView>
    </View>
  );
}

function CustomInput({ label, val, setVal, placeholder, keyboard, multiline, icon, editable = true }: any) {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={styles.inputContainer}>
      <Text style={styles.inputLabel}>{label}</Text>
      <View style={[
        styles.inputWrapper, 
        isFocused && styles.inputWrapperFocused,
        !editable && { backgroundColor: '#F8FAF9' },
        multiline && { alignItems: 'flex-start', paddingTop: 12 }
      ]}>
        <Ionicons name={icon} size={20} color={isFocused ? COLORS.primary : COLORS.secondary} style={styles.inputIcon} />
        <TextInput
          style={[styles.input, multiline && { height: 100, textAlignVertical: 'top' }]}
          value={val}
          onChangeText={setVal}
          placeholder={placeholder}
          placeholderTextColor="rgba(26, 59, 47, 0.4)"
          keyboardType={keyboard || 'default'}
          multiline={multiline}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          editable={editable}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  headerGradient: {
    paddingTop: 60,
    paddingBottom: 24,
    paddingHorizontal: 16,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerContent: { flexDirection: 'row', alignItems: 'center' },
  backBtn: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginRight: 16,
  },
  headerTitle: { fontSize: 22, fontWeight: '800', color: 'white' },
  scrollContent: { padding: 20, paddingBottom: 40 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  lockedWarning: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: COLORS.error, 
    padding: 16, 
    borderRadius: 20, 
    marginBottom: 24,
    gap: 12,
  },
  lockedWarningIcon: { 
    width: 36, 
    height: 36, 
    borderRadius: 18, 
    backgroundColor: 'rgba(255,255,255,0.2)', 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  lockedWarningTitle: { color: 'white', fontWeight: '800', fontSize: 14 },
  lockedWarningText: { color: 'rgba(255,255,255,0.8)', fontSize: 13 },
  packageCard: {
    backgroundColor: COLORS.white,
    borderRadius: 24,
    padding: 24,
    marginBottom: 24,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  packageHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  label: { fontSize: 13, color: COLORS.secondary, marginBottom: 4, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1 },
  pkgName: { fontSize: 20, fontWeight: '800', color: COLORS.text, flex: 1, marginRight: 10 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10 },
  statusBadgeText: { fontSize: 12, fontWeight: '800' },
  formSection: { gap: 20, marginBottom: 24 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: COLORS.text, marginBottom: 4 },
  inputContainer: { gap: 8 },
  inputLabel: { fontSize: 15, fontWeight: '700', color: COLORS.text },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 16,
    paddingHorizontal: 16,
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },
  inputWrapperFocused: { borderColor: COLORS.primary, backgroundColor: COLORS.white },
  inputIcon: { marginRight: 12 },
  input: { flex: 1, paddingVertical: 14, fontSize: 16, color: COLORS.text },
  typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 4 },
  typeBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
  },
  typeBtnActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  typeBtnText: { fontSize: 14, fontWeight: '700', color: COLORS.secondary },
  typeBtnTextActive: { color: COLORS.white },
  uploadBox: { borderRadius: 20, marginTop: 8, overflow: 'hidden' },
  uploadGradient: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.border,
    borderStyle: 'dashed',
    borderRadius: 20,
    gap: 8,
  },
  uploadText: { fontSize: 14, fontWeight: '700', color: COLORS.primary, textAlign: 'center' },
  uploadSubText: { fontSize: 11, color: COLORS.secondary },
  summaryCard: { backgroundColor: COLORS.primary, padding: 24, borderRadius: 24, marginBottom: 24 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  summaryLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 14, fontWeight: '600' },
  summaryPrice: { color: COLORS.accent, fontSize: 32, fontWeight: '900' },
  mainBtnContainer: { borderRadius: 18, overflow: 'hidden', elevation: 8, shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 12 },
  mainBtn: { height: 60, alignItems: 'center', justifyContent: 'center' },
  btnContent: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  mainBtnText: { color: 'white', fontSize: 16, fontWeight: '800' },
});
