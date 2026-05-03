import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, ActivityIndicator, Image } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocalSearchParams, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { API_BASE_URL } from '@/constants/api';

const COLORS = {
  bg: '#fcf9f8',
  accent: '#a93700',
  text: '#1c1b1b',
  secondary: '#3b5f92',
  surface: '#ffffff',
  surfaceDim: '#f6f3f2',
  muted: '#7a6a62',
  locationColor: '#FFD166',
};

export default function ItineraryScreen() {
  const { id } = useLocalSearchParams();
  const [pkg, setPkg] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (id) fetchPackage();
    const checkRole = async () => {
      try {
        const userData = await AsyncStorage.getItem('auth:user');
        if (userData) {
          const user = JSON.parse(userData);
          setIsAdmin(user?.role === 'admin');
        }
      } catch (err) {
        console.warn('Role check failed', err);
      }
    };
    checkRole();
  }, [id]);

  const fetchPackage = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/tour-packages/${id}`);
      const data = await res.json();
      if (res.ok) setPkg(data);
    } catch (err) {
      console.warn('Failed to load package itinerary', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <View style={styles.center}><ActivityIndicator size="large" color={COLORS.accent} /></View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ title: `${pkg?.name || 'Itinerary'}` }} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.header}>Daily Itinerary</Text>

        {(pkg?.timeline && pkg.timeline.length > 0) ? (
          pkg.timeline.map((day: any, idx: number) => (
            <View key={idx} style={styles.card}>
              <View style={styles.row}>
                <View style={styles.bulletWrap}>
                  <View style={styles.bulletOuter}>
                    <View style={styles.bulletInner} />
                  </View>
                </View>

                <View style={styles.body}>
                  <Text style={styles.dayLabel}>{`Day ${idx + 1}:`}</Text>
                  <Text style={styles.dayTitle}>{day.title || 'Untitled'}</Text>
                  <Text style={styles.dayText}>{day.notes || 'No description provided.'}</Text>

                  {/* Display Hotel if available (admin only) */}
                  {isAdmin && day.hotelName && (
                    <View style={styles.hotelSection}>
                      <View style={styles.hotelRow}>
                        <Ionicons name="bed-outline" size={16} color={COLORS.accent} />
                        <View style={{ marginLeft: 10, flex: 1 }}>
                          <Text style={styles.hotelLabel}>Accommodation</Text>
                          <Text style={styles.hotelName}>{day.hotelName}</Text>
                          {day.hotelLocation && <Text style={styles.hotelLocation}>{day.hotelLocation}</Text>}
                        </View>
                      </View>
                    </View>
                  )}

                  {/* Display Places (admin only) */}
                  {isAdmin && day.places && day.places.length > 0 && (
                    <View style={styles.placesSection}>
                      <Text style={styles.placesTitle}>Places to Visit</Text>
                      {day.places.map((place: any, pidx: number) => (
                        <View key={pidx} style={styles.placeItem}>
                          <View style={styles.placeIndex}>
                            <Text style={styles.placeIndexText}>{pidx + 1}</Text>
                          </View>
                          <View style={{ flex: 1 }}>
                            <View style={styles.placeNameRow}>
                              <Ionicons name="location-outline" size={14} color={COLORS.locationColor} />
                              <Text style={styles.placeName}>{place.name || 'Unknown Place'}</Text>
                            </View>
                            {place.location && (
                              <Text style={styles.placeLocation}>{place.location}</Text>
                            )}
                            {place.notes && (
                              <Text style={styles.placeNotes}>{place.notes}</Text>
                            )}
                          </View>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              </View>
            </View>
          ))
        ) : (
          <Text style={styles.empty}>No itinerary available.</Text>
        )}

        <View style={{ height: 48 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { padding: 20, paddingBottom: 40 },
  header: { fontSize: 20, fontWeight: '700', color: COLORS.secondary, marginBottom: 16 },

  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: COLORS.secondary,
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },

  row: { flexDirection: 'row', alignItems: 'flex-start' },

  bulletWrap: { width: 48, alignItems: 'center', justifyContent: 'flex-start' },
  bulletOuter: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: COLORS.accent, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(169,55,0,0.06)' },
  bulletInner: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.accent },

  body: { flex: 1, paddingLeft: 4 },
  dayLabel: { fontSize: 13, color: COLORS.muted, fontWeight: '600' },
  dayTitle: { fontSize: 16, color: COLORS.text, fontWeight: '700', marginTop: 4 },
  dayText: { fontSize: 14, color: COLORS.muted, marginTop: 8, lineHeight: 20 },

  // Hotel Section
  hotelSection: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.surfaceDim,
  },
  hotelRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  hotelLabel: {
    fontSize: 12,
    color: COLORS.muted,
    fontWeight: '600',
  },
  hotelName: {
    fontSize: 14,
    color: COLORS.text,
    fontWeight: '600',
    marginTop: 2,
  },
  hotelLocation: {
    fontSize: 12,
    color: COLORS.muted,
    marginTop: 2,
  },

  // Places Section
  placesSection: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.surfaceDim,
  },
  placesTitle: {
    fontSize: 14,
    color: COLORS.secondary,
    fontWeight: '700',
    marginBottom: 10,
  },
  placeItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.surfaceDim,
  },
  placeIndex: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.locationColor,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    marginTop: 2,
  },
  placeIndexText: {
    fontSize: 12,
    color: COLORS.text,
    fontWeight: '700',
  },
  placeNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  placeName: {
    fontSize: 13,
    color: COLORS.text,
    fontWeight: '600',
    marginLeft: 6,
    flex: 1,
  },
  placeLocation: {
    fontSize: 12,
    color: COLORS.muted,
    marginTop: 4,
    marginLeft: 20,
  },
  placeNotes: {
    fontSize: 12,
    color: COLORS.muted,
    marginTop: 4,
    marginLeft: 20,
    fontStyle: 'italic',
    lineHeight: 16,
  },

  thumbRow: { marginTop: 10 },
  thumb: { width: 100, height: 68, borderRadius: 10, marginRight: 12, backgroundColor: COLORS.surfaceDim },

  empty: { textAlign: 'center', color: COLORS.muted, marginTop: 24 },
});
