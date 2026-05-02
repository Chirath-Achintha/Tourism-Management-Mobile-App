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
};

export default function ReservationFormScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const packageId = params.packageId as string;
  const packageName = params.packageName as string;
  const packagePrice = Number(params.packagePrice) || 0;
  
  const [travelDate, setTravelDate] = useState('');
  const [numberOfPeople, setNumberOfPeople] = useState('1');
  const [specialRequest, setSpecialRequest] = useState('');
  const [totalPrice, setTotalPrice] = useState(packagePrice);
  const [documentType, setDocumentType] = useState('NIC');
  const [documentFile, setDocumentFile] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const people = parseInt(numberOfPeople) || 0;
    setTotalPrice(people * packagePrice);
  }, [numberOfPeople, packagePrice]);

  async function pickDocument() {
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

  async function handleConfirm() {
    if (!travelDate || !numberOfPeople || !documentFile) {
      Alert.alert('Missing Fields', 'Please provide travel date, people count, and identity document.');
      return;
    }

    if (parseInt(numberOfPeople) <= 0) {
      Alert.alert('Invalid Input', 'Number of people must be at least 1.');
      return;
    }

    const selectedDate = new Date(travelDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (isNaN(selectedDate.getTime()) || selectedDate < today) {
      Alert.alert('Invalid Date', 'Please enter a valid future travel date (YYYY-MM-DD).');
      return;
    }

    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('auth:token');
      const formData = new FormData();
      formData.append('packageId', packageId);
      formData.append('travelDate', travelDate);
      formData.append('numberOfPeople', numberOfPeople);
      formData.append('specialRequest', specialRequest);
      formData.append('documentType', documentType);
      formData.append('document', {
        uri: documentFile.uri,
        name: documentFile.name,
        type: documentFile.mimeType,
      } as any);

      const res = await fetch(`${API_BASE_URL}/reservations`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData,
      });

      if (res.ok) {
        Alert.alert('Success', 'Submitted!', [
          { text: 'My Bookings', onPress: () => router.push('/(tabs)/bookings' as any) }
        ]);
      } else {
        const data = await res.json();
        Alert.alert('Error', data.message || 'Failed to submit');
      }
    } catch (error) {
      Alert.alert('Error', 'Network error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}><Ionicons name="arrow-back" size={24} /></Pressable>
        <Text style={styles.headerTitle}>Book Your Trip</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <View style={styles.card}>
          <Text style={styles.label}>Selected Package</Text>
          <Text style={styles.pkgName}>{packageName}</Text>
          <Text style={styles.pkgPrice}>${packagePrice} / person</Text>
        </View>

        <View style={styles.form}>
          <Input label="Travel Date" val={travelDate} setVal={setTravelDate} placeholder="YYYY-MM-DD" />
          <Input label="People" val={numberOfPeople} setVal={setNumberOfPeople} placeholder="1" keyboard="numeric" />
          <Input label="Special Request" val={specialRequest} setVal={setSpecialRequest} placeholder="Optional..." multiline />
          
          <Text style={styles.inputLabel}>ID Type</Text>
          <View style={styles.typeGrid}>
            {['NIC', 'Driving License', 'Passport', 'Int. License'].map(t => (
              <Pressable key={t} onPress={() => setDocumentType(t)} style={[styles.typeBtn, documentType === t && styles.typeBtnActive]}>
                <Text style={[styles.typeBtnText, documentType === t && styles.typeBtnTextActive]}>{t}</Text>
              </Pressable>
            ))}
          </View>

          <Text style={styles.inputLabel}>Upload ID</Text>
          <Pressable style={styles.uploadBox} onPress={pickDocument}>
            <Ionicons name={documentFile ? "checkmark-circle" : "cloud-upload-outline"} size={32} color={documentFile ? COLORS.green : COLORS.blue} />
            <Text style={{ textAlign: 'center', fontSize: 12 }}>{documentFile ? documentFile.name : "Tap to upload document"}</Text>
          </Pressable>
        </View>

        <View style={styles.totalCard}>
          <Text style={{ fontWeight: '700' }}>Total: <Text style={{ color: COLORS.blue, fontSize: 24 }}>${totalPrice}</Text></Text>
        </View>

        <Pressable style={[styles.mainBtn, loading && { opacity: 0.5 }]} onPress={handleConfirm} disabled={loading}>
          {loading ? <ActivityIndicator color="white" /> : <Text style={styles.mainBtnText}>Confirm Reservation</Text>}
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

function Input({ label, val, setVal, placeholder, keyboard, multiline }: any) {
  return (
    <View style={{ gap: 4 }}>
      <Text style={styles.inputLabel}>{label}</Text>
      <TextInput
        style={[styles.input, multiline && { height: 80, textAlignVertical: 'top' }]}
        value={val}
        onChangeText={setVal}
        placeholder={placeholder}
        keyboardType={keyboard || 'default'}
        multiline={multiline}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: { flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: 'white' },
  backBtn: { marginRight: 16 },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  card: { backgroundColor: 'white', padding: 16, borderRadius: 16, marginBottom: 20 },
  label: { fontSize: 12, color: COLORS.secondary },
  pkgName: { fontSize: 20, fontWeight: '800' },
  pkgPrice: { color: COLORS.blue, fontWeight: '600' },
  form: { gap: 16, marginBottom: 24 },
  inputLabel: { fontSize: 14, fontWeight: '600' },
  input: { backgroundColor: 'white', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#eee' },
  typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  typeBtn: { padding: 8, borderRadius: 8, borderWidth: 1, borderColor: '#eee' },
  typeBtnActive: { backgroundColor: COLORS.blue, borderColor: COLORS.blue },
  typeBtnText: { fontSize: 12, fontWeight: '600' },
  typeBtnTextActive: { color: 'white' },
  uploadBox: { backgroundColor: 'white', padding: 20, borderRadius: 12, borderWidth: 2, borderColor: '#eee', borderStyle: 'dashed', alignItems: 'center', gap: 8 },
  totalCard: { backgroundColor: 'white', padding: 20, borderRadius: 16, marginBottom: 20 },
  mainBtn: { backgroundColor: COLORS.blue, height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  mainBtnText: { color: 'white', fontSize: 16, fontWeight: '800' },
});
