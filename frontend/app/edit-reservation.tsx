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
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { API_BASE_URL } from '@/constants/api';
import * as DocumentPicker from 'expo-document-picker';

const COLORS = {
  bg: '#EBF5EA',
  accent: '#FFD166',
  text: '#1A2432',
  secondary: '#64748b',
  white: '#FFFFFF',
  blue: '#3152c5',
  green: '#10B981',
  red: '#EF4444',
};

export default function EditReservationScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  
  const [reservation, setReservation] = useState<any>(null);
  const [travelDate, setTravelDate] = useState('');
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

  const fetchReservation = async () => {
    try {
      const token = await AsyncStorage.getItem('auth:token');
      const res = await fetch(`${API_BASE_URL}/reservations/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        setReservation(data);
        setTravelDate(data.travelDate ? new Date(data.travelDate).toISOString().split('T')[0] : '');
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
      Alert.alert('Error', 'Failed to pick');
    }
  }

  async function handleUpdate() {
    if (!travelDate || !numberOfPeople) {
      Alert.alert('Missing Fields', 'Please provide travel date and people count.');
      return;
    }

    try {
      setUpdating(true);
      const token = await AsyncStorage.getItem('auth:token');
      const formData = new FormData();
      formData.append('travelDate', travelDate);
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
        Alert.alert('Success', 'Reservation updated!', [
          { text: 'Back to Bookings', onPress: () => router.replace('/(tabs)/bookings') }
        ]);
      } else {
        const data = await res.json();
        Alert.alert('Error', data.message || 'Failed to update');
      }
    } catch (error) {
      Alert.alert('Error', 'Network error');
    } finally {
      setUpdating(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.blue} />
      </View>
    );
  }

  const isEditable = reservation.status === 'Pending';

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} />
        </Pressable>
        <Text style={styles.headerTitle}>Edit Reservation</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20 }}>
        {/* Status Warning */}
        {!isEditable && (
          <View style={styles.lockedWarning}>
            <Ionicons name="lock-closed" size={20} color="white" />
            <Text style={styles.lockedWarningText}>
              {reservation.status} reservations cannot be edited.
            </Text>
          </View>
        )}

        <View style={styles.card}>
          <Text style={styles.label}>Package</Text>
          <Text style={styles.pkgName}>{reservation.packageId?.name || 'N/A'}</Text>
          <Text style={[styles.statusText, { color: reservation.status === 'Pending' ? COLORS.accent : COLORS.green }]}>
            Status: {reservation.status}
          </Text>
        </View>

        <View style={[styles.form, !isEditable && { opacity: 0.6 }]}>
          <Input 
            label="Travel Date" 
            val={travelDate} 
            setVal={setTravelDate} 
            placeholder="YYYY-MM-DD" 
            editable={isEditable} 
          />
          <Input 
            label="Number of People" 
            val={numberOfPeople} 
            setVal={setNumberOfPeople} 
            placeholder="1" 
            keyboard="numeric" 
            editable={isEditable} 
          />
          <Input 
            label="Special Request" 
            val={specialRequest} 
            setVal={setSpecialRequest} 
            placeholder="Optional..." 
            multiline 
            editable={isEditable} 
          />
          
          <Text style={styles.inputLabel}>ID Document Type</Text>
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

          <Text style={styles.inputLabel}>Update ID Document (Optional)</Text>
          <Pressable 
            style={[styles.uploadBox, !isEditable && { backgroundColor: '#f0f0f0' }]} 
            onPress={pickDocument}
            disabled={!isEditable}
          >
            <Ionicons 
              name={documentFile ? "checkmark-circle" : "cloud-upload-outline"} 
              size={32} 
              color={documentFile ? COLORS.green : COLORS.blue} 
            />
            <Text style={{ textAlign: 'center', fontSize: 12 }}>
              {documentFile ? documentFile.name : "Tap to replace existing document"}
            </Text>
          </Pressable>
        </View>

        <View style={styles.totalCard}>
          <Text style={{ fontWeight: '700' }}>Total Price: <Text style={{ color: COLORS.blue, fontSize: 24 }}>${totalPrice}</Text></Text>
        </View>

        {isEditable && (
          <Pressable 
            style={[styles.mainBtn, updating && { opacity: 0.5 }]} 
            onPress={handleUpdate} 
            disabled={updating}
          >
            {updating ? <ActivityIndicator color="white" /> : <Text style={styles.mainBtnText}>Save Changes</Text>}
          </Pressable>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function Input({ label, val, setVal, placeholder, keyboard, multiline, editable }: any) {
  return (
    <View style={{ gap: 4 }}>
      <Text style={styles.inputLabel}>{label}</Text>
      <TextInput
        style={[styles.input, multiline && { height: 80, textAlignVertical: 'top' }, !editable && { backgroundColor: '#f0f0f0' }]}
        value={val}
        onChangeText={setVal}
        placeholder={placeholder}
        keyboardType={keyboard || 'default'}
        multiline={multiline}
        editable={editable}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: { flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#eee' },
  backBtn: { marginRight: 16 },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  card: { backgroundColor: 'white', padding: 16, borderRadius: 16, marginBottom: 20 },
  label: { fontSize: 12, color: COLORS.secondary },
  pkgName: { fontSize: 20, fontWeight: '800' },
  statusText: { fontSize: 14, fontWeight: '700', marginTop: 4 },
  form: { gap: 16, marginBottom: 24 },
  inputLabel: { fontSize: 14, fontWeight: '600' },
  input: { backgroundColor: 'white', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#eee' },
  typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  typeBtn: { padding: 10, borderRadius: 10, borderWidth: 1, borderColor: '#eee', backgroundColor: 'white' },
  typeBtnActive: { backgroundColor: COLORS.blue, borderColor: COLORS.blue },
  typeBtnText: { fontSize: 12, fontWeight: '700' },
  typeBtnTextActive: { color: 'white' },
  uploadBox: { backgroundColor: 'white', padding: 20, borderRadius: 12, borderWidth: 2, borderColor: '#eee', borderStyle: 'dashed', alignItems: 'center', gap: 8 },
  totalCard: { backgroundColor: 'white', padding: 20, borderRadius: 16, marginBottom: 24 },
  mainBtn: { backgroundColor: COLORS.blue, height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  mainBtnText: { color: 'white', fontSize: 16, fontWeight: '800' },
  lockedWarning: { backgroundColor: COLORS.red, flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderRadius: 12, marginBottom: 20 },
  lockedWarningText: { color: 'white', fontWeight: '700', fontSize: 14, flex: 1 },
});
