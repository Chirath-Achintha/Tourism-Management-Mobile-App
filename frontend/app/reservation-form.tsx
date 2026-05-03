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
  Platform,
  Modal,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { API_BASE_URL } from '@/constants/api';
import * as DocumentPicker from 'expo-document-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import DateTimePicker from '@react-native-community/datetimepicker';


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

export default function ReservationFormScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const packageId = params.packageId as string;
  const packageName = params.packageName as string;
  const packagePrice = Number(params.packagePrice) || 0;
  
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
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

  const onDateChange = (event: any, selectedDate?: Date) => {
    // On Android, the picker is closed immediately after selection
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    
    if (event.type === 'set' && selectedDate) {
      const currentDate = selectedDate;
      setDate(currentDate);
      
      // Format date as YYYY-MM-DD
      const year = currentDate.getFullYear();
      const month = String(currentDate.getMonth() + 1).padStart(2, '0');
      const day = String(currentDate.getDate()).padStart(2, '0');
      setTravelDate(`${year}-${month}-${day}`);
      
      // On iOS, we might want to keep it open until they hit done, 
      // but for a simple "click then open" feel, we close it after selection.
      if (Platform.OS === 'ios') {
        setShowDatePicker(false);
      }
    } else if (event.type === 'dismissed') {
      setShowDatePicker(false);
    }
  };

  const handlePeopleChange = (text: string) => {
    // Only allow numbers
    const numericValue = text.replace(/[^0-9]/g, '');
    setNumberOfPeople(numericValue);
  };

  async function pickDocument() {
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

  async function handleConfirm() {
    if (!travelDate || !numberOfPeople || !documentFile) {
      Alert.alert('Missing Information', 'Please fill in all required fields and upload your identity document.');
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
        Alert.alert('Booking Successful!', 'Your reservation has been submitted for review.', [
          { text: 'View My Bookings', onPress: () => router.push('/(tabs)/bookings' as any) }
        ]);
      } else {
        const data = await res.json();
        Alert.alert('Submission Failed', data.message || 'Something went wrong. Please try again.');
      }
    } catch (error) {
      Alert.alert('Network Error', 'Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }

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
          <Text style={styles.headerTitle}>Complete Reservation</Text>
        </View>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.packageCard}>
          <View style={styles.packageHeader}>
            <View>
              <Text style={styles.label}>Selected Package</Text>
              <Text style={styles.pkgName}>{packageName}</Text>
            </View>
            <View style={styles.priceBadge}>
              <Text style={styles.priceBadgeText}>LKR {packagePrice}/p</Text>
            </View>
          </View>
        </View>

        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Travel Details</Text>
          
          <Pressable onPress={() => setShowDatePicker(true)}>
            <View pointerEvents="none">
              <CustomInput 
                label="Planned Travel Date" 
                val={travelDate} 
                placeholder="Select Date" 
                icon="calendar-outline" 
                editable={false}
              />
            </View>
          </Pressable>

          {showDatePicker && (
            Platform.OS === 'ios' ? (
              <Modal transparent animationType="fade" visible={showDatePicker}>
                <View style={styles.modalOverlay}>
                  <View style={styles.modalContent}>
                    <View style={styles.modalHeader}>
                      <Text style={styles.modalTitle}>Select Travel Date</Text>
                      <Pressable onPress={() => setShowDatePicker(false)}>
                        <Text style={styles.doneBtn}>Done</Text>
                      </Pressable>
                    </View>
                    <DateTimePicker
                      value={date}
                      mode="date"
                      display="inline"
                      onChange={onDateChange}
                      minimumDate={new Date()}
                      accentColor={COLORS.primary}
                      themeVariant="light"
                    />
                  </View>
                </View>
              </Modal>
            ) : (
              <DateTimePicker
                value={date}
                mode="date"
                display="default"
                onChange={onDateChange}
                minimumDate={new Date()}
              />
            )
          )}
          
          <CustomInput 
            label="Number of People" 
            val={numberOfPeople} 
            setVal={handlePeopleChange} 
            placeholder="1" 
            keyboard="numeric" 
            icon="people-outline" 
          />
          
          <CustomInput 
            label="Special Requests (Optional)" 
            val={specialRequest} 
            setVal={setSpecialRequest} 
            placeholder="Tell us about dietary needs, accessibility, etc." 
            multiline 
            icon="chatbubble-ellipses-outline" 
          />
          
          <Text style={styles.inputLabel}>Identity Verification</Text>
          <Text style={styles.inputSubLabel}>Please select document type and upload a clear photo</Text>
          
          <View style={styles.typeGrid}>
            {['NIC', 'Driving License', 'Passport', 'Int. License'].map(t => (
              <Pressable 
                key={t} 
                onPress={() => setDocumentType(t)} 
                style={[styles.typeBtn, documentType === t && styles.typeBtnActive]}
              >
                <Text style={[styles.typeBtnText, documentType === t && styles.typeBtnTextActive]}>{t}</Text>
              </Pressable>
            ))}
          </View>

          <Pressable 
            style={[styles.uploadBox, documentFile && styles.uploadBoxActive]} 
            onPress={pickDocument}
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
                {documentFile ? documentFile.name : "Tap to upload identity document"}
              </Text>
              {!documentFile && <Text style={styles.uploadSubText}>PDF or Images allowed</Text>}
            </LinearGradient>
          </Pressable>
        </View>

        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total Investment</Text>
            <Text style={styles.summaryPrice}>LKR {totalPrice}</Text>
          </View>
          <Text style={styles.summaryNote}>Final price including all taxes and fees</Text>
        </View>

        <Pressable 
          style={({ pressed }) => [
            styles.mainBtnContainer,
            (loading || pressed) && { opacity: 0.8 }
          ]} 
          onPress={handleConfirm} 
          disabled={loading}
        >
          <LinearGradient
            colors={[COLORS.primary, COLORS.primaryDark]}
            style={styles.mainBtn}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <View style={styles.btnContent}>
                <Text style={styles.mainBtnText}>Confirm My Reservation</Text>
                <Ionicons name="arrow-forward" size={20} color="white" />
              </View>
            )}
          </LinearGradient>
        </Pressable>
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
  pkgName: { fontSize: 24, fontWeight: '800', color: COLORS.text, flex: 1, marginRight: 10 },
  priceBadge: { backgroundColor: COLORS.accent + '30', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12 },
  priceBadgeText: { color: COLORS.primary, fontWeight: '700', fontSize: 16 },
  formSection: { gap: 20, marginBottom: 24 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: COLORS.text, marginBottom: 4 },
  inputContainer: { gap: 8 },
  inputLabel: { fontSize: 15, fontWeight: '700', color: COLORS.text },
  inputSubLabel: { fontSize: 13, color: COLORS.secondary, marginTop: -4 },
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
  uploadBox: {
    borderRadius: 20,
    marginTop: 8,
    overflow: 'hidden',
  },
  uploadBoxActive: { borderColor: COLORS.green },
  uploadGradient: {
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.border,
    borderStyle: 'dashed',
    borderRadius: 20,
    gap: 8,
  },
  uploadText: { fontSize: 15, fontWeight: '700', color: COLORS.primary, textAlign: 'center' },
  uploadSubText: { fontSize: 12, color: COLORS.secondary },
  summaryCard: {
    backgroundColor: COLORS.primary,
    padding: 24,
    borderRadius: 24,
    marginBottom: 24,
  },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  summaryLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 14, fontWeight: '600' },
  summaryPrice: { color: COLORS.accent, fontSize: 32, fontWeight: '900' },
  summaryNote: { color: 'rgba(255,255,255,0.5)', fontSize: 12 },
  mainBtnContainer: { borderRadius: 18, overflow: 'hidden', elevation: 8, shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 12 },
  mainBtn: { height: 64, alignItems: 'center', justifyContent: 'center' },
  btnContent: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  mainBtnText: { color: 'white', fontSize: 18, fontWeight: '800' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 24,
    padding: 20,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.text,
  },
  doneBtn: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: '700',
  },
});


