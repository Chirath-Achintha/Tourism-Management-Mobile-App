import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Pressable,
  Image,
  ActivityIndicator,
  Alert,
  TextInput,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '@/constants/api';
import DateTimePicker from '@react-native-community/datetimepicker';

export default function TouristGuideDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  
  const [guide, setGuide] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Booking Form State
  const [travelDate, setTravelDate] = useState<Date>(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [numberOfPeople, setNumberOfPeople] = useState('1');
  const [specialRequest, setSpecialRequest] = useState('');
  const [bookingLoading, setBookingLoading] = useState(false);

  useEffect(() => {
    fetchGuideDetail();
  }, [id]);

  const fetchGuideDetail = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('auth:token');
      const response = await fetch(`${API_BASE_URL}/guides/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (response.ok) {
        setGuide(data);
      } else {
        throw new Error(data.message || "Failed to fetch guide.");
      }
    } catch (error: any) {
      Alert.alert("Error", error.message);
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handleBooking = async () => {
    if (parseInt(numberOfPeople) <= 0 || isNaN(parseInt(numberOfPeople))) {
      Alert.alert("Invalid Input", "Please enter a valid number of people.");
      return;
    }

    try {
      setBookingLoading(true);
      const token = await AsyncStorage.getItem('auth:token');
      
      const payload = {
        guideId: guide._id,
        travelDate: travelDate.toISOString(),
        numberOfPeople: parseInt(numberOfPeople),
        specialRequest,
      };

      const response = await fetch(`${API_BASE_URL}/guide-reservations`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      
      const data = await response.json();
      if (response.ok) {
        Alert.alert("Success", "Tour guide booked successfully!", [
          { text: "OK", onPress: () => router.replace('/bookings') }
        ]);
      } else {
        throw new Error(data.message || "Failed to book guide.");
      }
    } catch (error: any) {
      Alert.alert("Error", error.message);
    } finally {
      setBookingLoading(false);
    }
  };

  const onDateChange = (event: any, selectedDate?: Date) => {
    const currentDate = selectedDate || travelDate;
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    setTravelDate(currentDate);
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centerArea]}>
        <ActivityIndicator size="large" color="#FFD166" />
      </View>
    );
  }

  if (!guide) return null;

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={24} color="#1A3B2F" />
          </Pressable>
          <Text style={styles.headerTitle}>Guide Details</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          <View style={styles.guideCard}>
            <Image source={{ uri: guide.imageUrl }} style={styles.guideImage} />
            <Text style={styles.guideName}>{guide.name}</Text>
            
            <View style={styles.infoContainer}>
              <View style={styles.infoRow}>
                <View style={styles.iconBox}>
                  <Ionicons name="time" size={20} color="#1A3B2F" />
                </View>
                <View>
                  <Text style={styles.infoLabel}>Experience</Text>
                  <Text style={styles.infoValue}>{guide.experience}</Text>
                </View>
              </View>

              <View style={styles.infoRow}>
                <View style={styles.iconBox}>
                  <Ionicons name="language" size={20} color="#1A3B2F" />
                </View>
                <View>
                  <Text style={styles.infoLabel}>Languages</Text>
                  <Text style={styles.infoValue}>{guide.language}</Text>
                </View>
              </View>

              <View style={styles.infoRow}>
                <View style={styles.iconBox}>
                  <Ionicons name="call" size={20} color="#1A3B2F" />
                </View>
                <View>
                  <Text style={styles.infoLabel}>Contact</Text>
                  <Text style={styles.infoValue}>{guide.contact}</Text>
                </View>
              </View>
            </View>
          </View>

          <View style={styles.bookingSection}>
            <Text style={styles.sectionTitle}>Book this Guide</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Tour Date</Text>
              {Platform.OS === 'android' ? (
                <Pressable style={styles.datePickerBtn} onPress={() => setShowDatePicker(true)}>
                  <Ionicons name="calendar-outline" size={20} color="#1A3B2F" />
                  <Text style={styles.datePickerText}>{travelDate.toLocaleDateString()}</Text>
                </Pressable>
              ) : (
                <DateTimePicker
                  value={travelDate}
                  mode="date"
                  display="default"
                  onChange={onDateChange}
                  minimumDate={new Date()}
                  style={{ alignSelf: 'flex-start' }}
                />
              )}
              {showDatePicker && Platform.OS === 'android' && (
                <DateTimePicker
                  value={travelDate}
                  mode="date"
                  display="default"
                  onChange={onDateChange}
                  minimumDate={new Date()}
                />
              )}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Number of People</Text>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                value={numberOfPeople}
                onChangeText={setNumberOfPeople}
                placeholder="e.g. 2"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Special Request (Optional)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                multiline
                numberOfLines={4}
                value={specialRequest}
                onChangeText={setSpecialRequest}
                placeholder="Any special requests or instructions?"
                textAlignVertical="top"
              />
            </View>

            <Pressable 
              style={[styles.submitButton, bookingLoading && styles.submitButtonDisabled]} 
              onPress={handleBooking}
              disabled={bookingLoading}
            >
              {bookingLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.submitButtonText}>Confirm Booking</Text>
              )}
            </Pressable>
          </View>

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
  centerArea: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'transparent',
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0FAF5',
  },
  placeholder: {
    width: 44,
    height: 44,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#1A3B2F',
  },
  scrollContent: {
    padding: 20,
    gap: 24,
  },
  guideCard: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#1A3B2F',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
  },
  guideImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 16,
  },
  guideName: {
    fontSize: 24,
    fontWeight: '900',
    color: '#1A3B2F',
    marginBottom: 20,
  },
  infoContainer: {
    width: '100%',
    gap: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#F0FAF5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(26, 59, 47, 0.5)',
  },
  infoValue: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1A3B2F',
    marginTop: 2,
  },
  bookingSection: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#1A3B2F',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#1A3B2F',
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1A3B2F',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: 'rgba(26, 59, 47, 0.1)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: '#1A3B2F',
  },
  textArea: {
    minHeight: 100,
  },
  datePickerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: 'rgba(26, 59, 47, 0.1)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  datePickerText: {
    fontSize: 15,
    color: '#1A3B2F',
    fontWeight: '500',
  },
  submitButton: {
    backgroundColor: '#1A3B2F',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 10,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: '#FFD166',
    fontSize: 16,
    fontWeight: '800',
  },
});
