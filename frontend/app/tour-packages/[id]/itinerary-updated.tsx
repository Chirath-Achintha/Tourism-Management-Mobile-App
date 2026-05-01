import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, ActivityIndicator, Image, Pressable } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { API_BASE_URL } from '@/constants/api';

const COLORS = {
  bg: '#fcf9f8',
  accent: '#a93700',
  text: '#1c1b1b',
  secondary: '#3b5f92',
  tertiary: '#00677f',
  surface: '#fcf9f8',
  surfaceContainer: '#f0edec',
  onSurfaceVariant: '#594139',
};

export default function ItineraryScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [pkg, setPkg] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) fetchPackage();
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

  if (!pkg) return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ title: 'Itinerary' }} />
      <View style={styles.center}><Text style={{ color: COLORS.onSurfaceVariant }}>Itinerary not found.</Text></View>
    </SafeAreaView>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ title: `${pkg.name} — Itinerary` }} />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.header}>Daily Itinerary</Text>

        <View style={styles.timeline}>
          {pkg.timeline && pkg.timeline.length > 0 ? pkg.timeline.map((day: any, idx: number) => (
            <View key={idx} style={styles.dayItem}>
              <View style={styles.bulletRow}>
                <View style={styles.bullet}></View>
                <View style={styles.dayContent}>
                  <Text style={styles.dayTitle}>{`Day ${idx + 1}: ${day.title || ''}`}</Text>
                  <Text style={styles.dayDesc}>{day.notes || 'No description provided.'}</Text>

                  {day.places && day.places.length > 0 && (
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      style={styles.thumbsScroll}
                    >
                      {day.places.map((p: any, i: number) => (
                        <View key={i} style={styles.thumbWrap}>
                          {p.imageUrl ? (
                            <Image source={{ uri: p.imageUrl }} style={styles.thumb} />
                          ) : (
                            <View style={styles.thumbPlaceholder}><Ionicons name="location-outline" size={24} color={COLORS.accent} /></View>
                          )}
                        </View>
                      ))}
                    </ScrollView>
                  )}

                  {day.hotelName ? (
                    <View style={styles.hotelRow}>
                      <Ionicons name="bed-outline" size={18} color={COLORS.secondary} />
                      <View style={{ marginLeft: 8 }}>
                        <Text style={styles.hotelName}>{day.hotelName}</Text>
                        {day.hotelLocation ? <Text style={styles.hotelLoc}>{day.hotelLocation}</Text> : null}
                      </View>
                    </View>
                  ) : null}
                </View>
              </View>
            </View>
          )) : (
            <Text style={styles.noData}>No itinerary available.</Text>
          )}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { padding: 16, paddingBottom: 40 },
  header: { fontSize: 28, fontWeight: '600', color: COLORS.secondary, marginBottom: 24 },
  timeline: { marginTop: 8 },
  dayItem: { marginBottom: 24 },
  bulletRow: { flexDirection: 'row', gap: 12 },
  bullet: { width: 10, height: 10, borderRadius: 5, backgroundColor: COLORS.accent, marginTop: 6, flexShrink: 0 },
  dayContent: { flex: 1 },
  dayTitle: { fontSize: 18, fontWeight: '600', color: COLORS.text, marginBottom: 8 },
  dayDesc: { fontSize: 16, color: COLORS.onSurfaceVariant, lineHeight: 24, marginBottom: 16 },
  thumbsScroll: { marginBottom: 12 },
  thumbWrap: { width: 100, height: 80, borderRadius: 12, overflow: 'hidden', marginRight: 12 },
  thumb: { width: '100%', height: '100%' },
  thumbPlaceholder: { flex: 1, backgroundColor: COLORS.surfaceContainer, alignItems: 'center', justifyContent: 'center' },
  hotelRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginTop: 16 },
  hotelName: { fontWeight: '600', fontSize: 16, color: COLORS.text },
  hotelLoc: { color: COLORS.onSurfaceVariant, fontSize: 14, marginTop: 4 },
  noData: { color: COLORS.onSurfaceVariant, textAlign: 'center', paddingVertical: 20 },
});
