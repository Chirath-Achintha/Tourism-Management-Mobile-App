import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, ActivityIndicator, Image } from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import { API_BASE_URL } from '@/constants/api';

const COLORS = {
  bg: '#fcf9f8',
  accent: '#a93700',
  text: '#1c1b1b',
  secondary: '#3b5f92',
  surface: '#ffffff',
  surfaceDim: '#f6f3f2',
  muted: '#7a6a62',
};

export default function ItineraryScreen() {
  const { id } = useLocalSearchParams();
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

                  {day.places && day.places.length > 0 && (
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.thumbRow}>
                      {day.places.map((p:any, i:number) => (
                        <Image key={i} source={{ uri: p.imageUrl || '' }} style={styles.thumb} />
                      ))}
                    </ScrollView>
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

  thumbRow: { marginTop: 10 },
  thumb: { width: 100, height: 68, borderRadius: 10, marginRight: 12, backgroundColor: COLORS.surfaceDim },

  empty: { textAlign: 'center', color: COLORS.muted, marginTop: 24 },
});
