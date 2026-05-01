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

const COLORS = {
  bg: '#EBF5EA',
  accent: '#FFD166',
  text: '#1A2432',
  secondary: '#64748b',
  white: '#FFFFFF',
  blue: '#3152c5',
};

export default function ReservationFormScreen() {
  const router = useRouter();
  const { packageId, packageName, packagePrice } = useLocalSearchParams();
  
  const [travelDate, setTravelDate] = useState('');
  const [numberOfPeople, setNumberOfPeople] = useState('1');
  const [specialRequest, setSpecialRequest] = useState('');
  const [totalPrice, setTotalPrice] = useState(Number(packagePrice) || 0);
  const [loading, setLoading] = useState(false);

  // Auto-calculate total price whenever the number of people changes
  useEffect(() => {
    const people = parseInt(numberOfPeople) || 0;
    const price = Number(packagePrice) || 0;
    setTotalPrice(people * price);
  }, [numberOfPeople, packagePrice]);

  const handleConfirmReservation = async () => {
    // Basic validation
    if (!travelDate || !numberOfPeople) {
      Alert.alert('Required Fields', 'Please provide a travel date and number of people.');
      return;
    }

    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('auth:token');
      
      const response = await fetch(`${API_BASE_URL}/reservations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          packageId,
          travelDate,
          numberOfPeople: parseInt(numberOfPeople),
          specialRequest,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        Alert.alert('Success', 'Your reservation request has been submitted!', [
          { text: 'View My Bookings', onPress: () => router.push('/(tabs)/bookings') }
        ]);
      } else {
        Alert.alert('Booking Failed', data.message || 'Something went wrong.');
      }
    } catch (error) {
      Alert.alert('Network Error', 'Could not connect to the server. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Book Your Trip</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Package Summary */}
        <View style={styles.card}>
          <Text style={styles.label}>Selected Package</Text>
          <Text style={styles.packageName}>{packageName}</Text>
          <Text style={styles.packagePrice}>${packagePrice} per person</Text>
        </View>

        {/* Input Form */}
        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Travel Date</Text>
            <TextInput
              style={styles.input}
              placeholder="YYYY-MM-DD"
              value={travelDate}
              onChangeText={setTravelDate}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Number of People</Text>
            <TextInput
              style={styles.input}
              placeholder="1"
              keyboardType="numeric"
              value={numberOfPeople}
              onChangeText={setNumberOfPeople}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Special Requests (Optional)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="E.g. Food allergies, wheelchair access..."
              multiline
              numberOfLines={4}
              value={specialRequest}
              onChangeText={setSpecialRequest}
            />
          </View>
        </View>

        {/* Price Breakdown */}
        <View style={styles.totalCard}>
          <View style={styles.row}>
            <Text style={styles.totalLabel}>Total Amount</Text>
            <Text style={styles.totalAmount}>${totalPrice}</Text>
          </View>
          <Text style={styles.taxNote}>Includes all applicable taxes</Text>
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <Pressable 
            style={[styles.confirmButton, loading && styles.disabledButton]} 
            onPress={handleConfirmReservation}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <Text style={styles.confirmButtonText}>Confirm Reservation</Text>
            )}
          </Pressable>
          
          <Pressable style={styles.cancelButton} onPress={() => router.back()}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backButton: {
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  scrollContent: {
    padding: 20,
  },
  card: {
    backgroundColor: COLORS.white,
    padding: 16,
    borderRadius: 16,
    marginBottom: 20,
  },
  label: {
    fontSize: 12,
    color: COLORS.secondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 6,
  },
  packageName: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 4,
  },
  packagePrice: {
    fontSize: 14,
    color: COLORS.blue,
    fontWeight: '600',
  },
  form: {
    gap: 16,
    marginBottom: 24,
  },
  inputGroup: {
    gap: 8,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  input: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  totalCard: {
    backgroundColor: COLORS.white,
    padding: 20,
    borderRadius: 16,
    marginBottom: 30,
    borderLeftWidth: 6,
    borderLeftColor: COLORS.accent,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
  },
  totalAmount: {
    fontSize: 28,
    fontWeight: '900',
    color: COLORS.blue,
  },
  taxNote: {
    fontSize: 12,
    color: COLORS.secondary,
    marginTop: 4,
  },
  actions: {
    gap: 12,
  },
  confirmButton: {
    backgroundColor: COLORS.blue,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.blue,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  confirmButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '800',
  },
  disabledButton: {
    opacity: 0.6,
  },
  cancelButton: {
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    color: COLORS.secondary,
    fontSize: 15,
    fontWeight: '600',
  },
});
