import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Pressable,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '@/constants/api';

const DASHBOARD_PRIMARY = '#1A3B2F';

type FormState = {
  name: string;
  description: string;
  category: string;
  destination: string;
  destinations: string[];
  duration: string;
  price: string;
  minParticipants: string;
  maxParticipants: string;
  meals: string[];
  guide: string;
  transport: string;
};

const MEAL_OPTIONS = ['Breakfast', 'Lunch', 'Dinner', 'All Inclusive'];
const GUIDE_OPTIONS = ['No guide', 'English-speaking guide', 'Multi-language guide'];
const TRANSPORT_OPTIONS = ['Car', 'Van', 'Bus', 'Private'];

export default function EditTourPackageScreen() {
  const router = useRouter();
  const { id: packageId } = useLocalSearchParams() as any;

  const [form, setForm] = useState<any>({
    name: '',
    description: '',
    category: '',
    destination: '',
    destinations: [],
    duration: '',
    price: '',
    minParticipants: '',
    maxParticipants: '',
    meals: [],
    guide: '',
    transport: '',
  });

  const [timeline, setTimeline] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hotelsLoading, setHotelsLoading] = useState(false);
  const [hotels, setHotels] = useState<any[]>([]);
  const [destinations, setDestinations] = useState<any[]>([]);
  const [destinationsLoading, setDestinationsLoading] = useState(false);
  const [lockedDestinations, setLockedDestinations] = useState<string[]>([]);
  const filteredHotels = useMemo(() => hotels, [hotels]);

  const isDateValid = (date: Date): { valid: boolean; message?: string } => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const selectedDate = new Date(date);
    selectedDate.setHours(0, 0, 0, 0);
    
    if (selectedDate < today) {
      return { valid: false, message: 'Cannot select a past date.' };
    }
    
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);
    
    if (selectedDate <= nextWeek) {
      return { valid: false, message: 'Departure date must be at least 8 days from today.' };
    }
    
    return { valid: true };
  };

  const formatDate = (date: Date) =>
    date.toLocaleDateString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric',
    });

  useEffect(() => {
    const loadPackage = async () => {
      try {
        const token = await AsyncStorage.getItem('auth:token');
        if (!token) {
          Alert.alert('Session expired', 'Please log in again.');
          router.replace('/login' as any);
          return;
        }

        const response = await fetch(`${API_BASE_URL}/admin/tour-packages/${packageId}`, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        const data = await response.json();
        if (!response.ok) {
          Alert.alert('Error', data?.message || 'Failed to load package details.');
          router.back();
          return;
        }

        const existingDestinations = Array.isArray(data?.destinations) && data.destinations.length
          ? data.destinations
          : (data?.destination ? [data.destination] : []);

        setForm({
          name: data?.name || '',
          description: data?.description || '',
          category: data?.category || '',
          destination: data?.destination || '',
          destinations: existingDestinations,
          duration: data?.duration ? String(data.duration) : '',
          price: data?.price ? String(data.price) : '',
          minParticipants: data?.minParticipants ? String(data.minParticipants) : '',
          maxParticipants: data?.maxParticipants ? String(data.maxParticipants) : '',
          meals: String(data?.meals || '')
            .split(',')
            .map((item) => item.trim())
            .filter(Boolean),
          guide: data?.guide || '',
          transport: data?.transport || '',
        });
        setLockedDestinations(existingDestinations.map((item: any) => String(item || '').trim()).filter(Boolean));

        setTimeline(Array.isArray(data?.timeline) ? data.timeline : []);
      } catch (error: any) {
        Alert.alert('Error', error?.message || 'Failed to load package details.');
      } finally {
        setLoading(false);
      }
    };

    loadPackage();
  }, [packageId, router]);

  const updateField = <K extends keyof FormState>(field: K, value: FormState[K]) => {
    setForm((prev: any) => ({ ...prev, [field]: value }));
  };

  const setPlaceMode = (dayIndex: number, placeIndex: number, mode: 'system' | 'custom') => {
    setTimeline((prev) =>
      prev.map((day, idx) => {
        if (idx !== dayIndex) return day;
        const places = Array.isArray(day.places) ? [...day.places] : [];
        const currentPlace = places[placeIndex] || { name: '', notes: '', location: '' };
        places[placeIndex] = {
          ...currentPlace,
          sourceType: mode,
        };
        return { ...day, places };
      })
    );
  };

  const applyDestinationToPlace = (dayIndex: number, placeIndex: number, destinationName: string) => {
    const selectedDestination = destinations.find((item) => item.name === destinationName);

    setTimeline((prev) =>
      prev.map((day, idx) => {
        if (idx !== dayIndex) return day;
        const places = Array.isArray(day.places) ? [...day.places] : [];
        const currentPlace = places[placeIndex] || { name: '', notes: '', location: '' };
        places[placeIndex] = {
          ...currentPlace,
          sourceType: 'system',
          name: selectedDestination?.name || destinationName,
          location: selectedDestination?.location || currentPlace.location || '',
        };
        return { ...day, places };
      })
    );
  };

  const validate = () => {
    if (!form.name.trim()) return 'Package name is required.';
    if ((!form.destination || !form.destination.trim()) && lockedDestinations.length === 0) return 'Destination is required and cannot be edited. Please recreate this package with a destination.';
    if (!form.category.trim()) return 'Category is required.';
    if (!form.duration.trim() || Number.isNaN(Number(form.duration))) return 'Duration must be a valid number.';
    if (!form.price.trim() || Number.isNaN(Number(form.price))) return 'Price must be a valid number.';
    if (!form.minParticipants.trim() || Number.isNaN(Number(form.minParticipants))) return 'Min participants must be a valid number.';
    if (!form.maxParticipants.trim() || Number.isNaN(Number(form.maxParticipants))) return 'Max participants must be a valid number.';

    const min = Number(form.minParticipants);
    const max = Number(form.maxParticipants);
    if (!Number.isInteger(min) || min < 1) return 'Min participants must be 1 or more.';
    if (!Number.isInteger(max) || max < 1) return 'Max participants must be 1 or more.';
    if (max <= min) return 'Max participants must be greater than min participants.';
    if (max > 500) return 'Max participants cannot exceed 500.';
    return null;
  };

  const handleSave = async () => {
    const error = validate();
    if (error) {
      Alert.alert('Invalid data', error);
      return;
    }

    try {
      setSaving(true);
      const token = await AsyncStorage.getItem('auth:token');
      if (!token) {
        Alert.alert('Session expired', 'Please log in again.');
        router.replace('/login' as any);
        return;
      }

      const payload = {
        name: form.name.trim(),
        description: form.description.trim(),
        category: form.category.trim().toLowerCase(),
        destination: lockedDestinations.length ? lockedDestinations[0] : form.destination.trim(),
        destinations: lockedDestinations,
        duration: Number(form.duration),
        minParticipants: Number(form.minParticipants),
        price: Number(form.price),
        maxParticipants: Number(form.maxParticipants),
        meals: form.meals.join(', '),

        guide: form.guide.trim(),
        transport: form.transport.trim(),
        timeline: JSON.stringify(timeline || []),
      };

      const response = await fetch(`${API_BASE_URL}/admin/tour-packages/${packageId}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok) {
        Alert.alert('Update failed', data?.message || 'Could not update package.');
        return;
      }

      Alert.alert('Success', 'Tour package updated successfully.', [
        {
          text: 'OK',
          onPress: () => router.replace('/admin/tour-packages' as any),
        },
      ]);
    } catch (error: any) {
      Alert.alert('Error', error?.message || 'Failed to update package.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.containerCenter}>
        <ActivityIndicator size="large" color={DASHBOARD_PRIMARY} />
        <Text style={styles.loadingText}>Loading package details...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={DASHBOARD_PRIMARY} />
        </Pressable>
        <Text style={styles.title}>Edit Tour Package</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Field label="Package Name" required>
          <TextInput
            style={styles.input}
            value={form.name}
            onChangeText={(value) => updateField('name', value)}
            placeholder="Package name"
            placeholderTextColor="#9CA3AF"
          />
        </Field>

        <Field label="Description">
          <TextInput
            style={[styles.input, styles.inputMultiline]}
            value={form.description}
            onChangeText={(value) => updateField('description', value)}
            placeholder="Package description"
            placeholderTextColor="#9CA3AF"
            multiline
            numberOfLines={4}
          />
        </Field>

        <Field label="Category" required>
          <TextInput
            style={styles.input}
            value={form.category}
            onChangeText={(value) => updateField('category', value)}
            placeholder="adventure, cultural, beach..."
            placeholderTextColor="#9CA3AF"
          />
        </Field>

        <Field label="Destination" required>
          <View style={styles.selectTrigger}>
            <Text style={styles.selectValueText}>Destination cannot be edited</Text>
            <Ionicons name="lock-closed-outline" size={16} color="#6B7280" />
          </View>
          <Text style={styles.helperText}>Selected destinations are locked for existing packages.</Text>

          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
            {lockedDestinations.length > 0 ? (
              lockedDestinations.map((d, i) => (
                <View key={`${d}-${i}`} style={{ backgroundColor: '#F3F4F6', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 16, marginRight: 8 }}>
                  <Text style={{ color: '#374151', fontWeight: '700' }}>{d}</Text>
                </View>
              ))
            ) : (
              <Text style={styles.helperText}>No destinations found for this package.</Text>
            )}
          </View>
        </Field>

        <View style={styles.twoColRow}>
          <Field label="Duration (days)" required style={styles.col}>
            <TextInput
              style={styles.input}
              value={form.duration}
              onChangeText={(value) => updateField('duration', value)}
              keyboardType="number-pad"
              placeholder="e.g. 5"
              placeholderTextColor="#9CA3AF"
            />
          </Field>

          <Field label="Price" required style={styles.col}>
            <TextInput
              style={styles.input}
              value={form.price}
              onChangeText={(value) => updateField('price', value)}
              keyboardType="decimal-pad"
              placeholder="e.g. 299"
              placeholderTextColor="#9CA3AF"
            />
          </Field>
        </View>

        <View style={styles.twoColRow}>
          <Field label="Min Participants" required style={styles.col}>
            <TextInput
              style={styles.input}
              value={form.minParticipants}
              onChangeText={(value) => updateField('minParticipants', value)}
              keyboardType="number-pad"
              placeholder="e.g. 2"
              placeholderTextColor="#9CA3AF"
            />
          </Field>

          <Field label="Max Participants" required style={styles.col}>
            <TextInput
              style={styles.input}
              value={form.maxParticipants}
              onChangeText={(value) => updateField('maxParticipants', value)}
              keyboardType="number-pad"
              placeholder="e.g. 12"
              placeholderTextColor="#9CA3AF"
            />
          </Field>
        </View>

        <Field label="Guide">
          <SelectField
            value={form.guide}
            options={GUIDE_OPTIONS}
            placeholder="Select guide"
            onChange={(value) => updateField('guide', value)}
          />
        </Field>

        <Field label="Itinerary (Days)">
          <View style={styles.itineraryWrap}>
            {timeline.map((day, dIdx) => {
              return (
                <View key={dIdx} style={styles.dayCard}>
                  <View style={styles.dayHeader}>
                    <Text style={styles.dayHeaderText}>{`Day ${dIdx + 1}`}</Text>
                    <Pressable onPress={() => setTimeline((prev) => prev.filter((_, i) => i !== dIdx))}>
                      <Ionicons name="trash-outline" size={18} color="#EF4444" />
                    </Pressable>
                  </View>

                  <TextInput
                    style={styles.input}
                    value={day.title || ''}
                    placeholder="Title"
                    onChangeText={(text) => setTimeline((prev) => prev.map((it, i) => (i === dIdx ? { ...it, title: text } : it)))}
                  />

                  <TextInput
                    style={[styles.input, styles.inputMultiline]}
                    value={day.notes || ''}
                    placeholder="Notes / Overview"
                    multiline
                    numberOfLines={3}
                    onChangeText={(text) => setTimeline((prev) => prev.map((it, i) => (i === dIdx ? { ...it, notes: text } : it)))}
                  />
                </View>
              );
            })}

            <Pressable style={styles.addDayBtn} onPress={() => setTimeline((prev) => [...prev, { title: '', notes: '', places: [] }])}>
              <Text style={{ color: '#064E3B', fontWeight: '800' }}>+ Add Day</Text>
            </Pressable>
          </View>
        </Field>

        <Pressable
          style={({ pressed }) => [styles.saveButton, pressed && styles.saveButtonPressed, saving && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Ionicons name="save-outline" size={18} color="#FFFFFF" />
              <Text style={styles.saveButtonText}>Save Changes</Text>
            </>
          )}
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

function Field({
  label,
  required,
  style,
  children,
}: {
  label: string;
  required?: boolean;
  style?: any;
  children: React.ReactNode;
}) {
  return (
    <View style={[styles.field, style]}>
      <Text style={styles.fieldLabel}>
        {label} {required ? <Text style={styles.required}>*</Text> : null}
      </Text>
      {children}
    </View>
  );
}

function SelectField({
  value,
  options,
  placeholder,
  onChange,
}: {
  value: string;
  options: string[];
  placeholder: string;
  onChange: (value: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <View>
      <Pressable style={[styles.selectTrigger, expanded && styles.selectTriggerExpanded]} onPress={() => setExpanded((prev) => !prev)}>
        <Text style={[styles.selectValueText, !value && styles.placeholderText]}>{value || placeholder}</Text>
        <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={16} color="#6B7280" />
      </Pressable>
      {expanded ? (
        <View style={styles.selectMenu}>
          {options.map((option) => {
            const selected = value === option;
            return (
              <Pressable
                key={option}
                style={[styles.selectOption, selected && styles.selectOptionSelected]}
                onPress={() => {
                  onChange(option);
                  setExpanded(false);
                }}
              >
                <Text style={[styles.selectOptionText, selected && styles.selectOptionTextSelected]}>{option}</Text>
                {selected ? <Ionicons name="checkmark-circle" size={16} color={DASHBOARD_PRIMARY} /> : null}
              </Pressable>
            );
          })}
        </View>
      ) : null}
    </View>
  );
}

function MultiSelectField({
  value,
  options,
  placeholder,
  onChange,
}: {
  value: string[];
  options: string[];
  placeholder: string;
  onChange: (value: string[]) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  const label = value.length ? value.join(', ') : placeholder;

  return (
    <View>
      <Pressable style={[styles.selectTrigger, expanded && styles.selectTriggerExpanded]} onPress={() => setExpanded((prev) => !prev)}>
        <Text style={[styles.selectValueText, value.length === 0 && styles.placeholderText]} numberOfLines={1}>
          {label}
        </Text>
        <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={16} color="#6B7280" />
      </Pressable>
      {expanded ? (
        <View style={styles.selectMenu}>
          {options.map((option) => {
            const selected = value.includes(option);
            return (
              <Pressable
                key={option}
                style={[styles.selectOption, selected && styles.selectOptionSelected]}
                onPress={() => {
                  onChange(selected ? value.filter((item) => item !== option) : [...value, option]);
                }}
              >
                <Text style={[styles.selectOptionText, selected && styles.selectOptionTextSelected]}>{option}</Text>
                {selected ? <Ionicons name="checkmark-circle" size={16} color={DASHBOARD_PRIMARY} /> : null}
              </Pressable>
            );
          })}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  containerCenter: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#6B7280',
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: DASHBOARD_PRIMARY,
  },
  content: {
    padding: 20,
    paddingBottom: 28,
  },
  field: {
    marginBottom: 14,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 7,
  },
  helperText: {
    marginTop: 8,
    fontSize: 12,
    lineHeight: 16,
    color: '#6B7280',
  },
  required: {
    color: '#EF4444',
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 11,
    fontSize: 14,
    color: '#111827',
    backgroundColor: '#FFFFFF',
  },
  inputMultiline: {
    minHeight: 96,
    textAlignVertical: 'top',
  },
  selectTrigger: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    minHeight: 44,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  selectTriggerExpanded: {
    borderColor: DASHBOARD_PRIMARY,
  },
  selectValueText: {
    flex: 1,
    color: '#111827',
    fontSize: 14,
  },
  placeholderText: {
    color: '#9CA3AF',
  },
  selectMenu: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
  },
  selectOption: {
    minHeight: 42,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  selectOptionSelected: {
    backgroundColor: '#ECFDF5',
  },
  selectOptionText: {
    color: '#111827',
    fontSize: 14,
  },
  selectOptionTextSelected: {
    color: DASHBOARD_PRIMARY,
    fontWeight: '700',
  },
  twoColRow: {
    flexDirection: 'row',
    gap: 10,
  },
  col: {
    flex: 1,
  },
  saveButton: {
    marginTop: 8,
    backgroundColor: DASHBOARD_PRIMARY,
    borderRadius: 12,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  saveButtonPressed: {
    opacity: 0.85,
  },
  saveButtonDisabled: {
    opacity: 0.7,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  placeCard: {
    borderWidth: 1,
    borderColor: '#E6E8EA',
    borderRadius: 12,
    padding: 10,
    marginBottom: 10,
    backgroundColor: '#FFFFFF',
  },
  placeModeRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  modeChip: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 999,
    paddingVertical: 8,
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  modeChipActive: {
    backgroundColor: '#ECFDF5',
    borderColor: '#10B981',
  },
  modeChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4B5563',
  },
  modeChipTextActive: {
    color: '#065F46',
  },
  dayCard: {
    borderWidth: 1,
    borderColor: '#E6E8EA',
    borderRadius: 12,
    padding: 10,
    marginBottom: 12,
    backgroundColor: '#FAFAFB',
  },
  dayHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  dayHeaderText: { fontWeight: '800', color: '#064E3B' },
  removePlaceButton: { alignSelf: 'flex-end', marginTop: 8 },
  addPlaceBtn: { marginTop: 6, marginBottom: 6 },
  addDayBtn: { paddingVertical: 8, alignItems: 'center', borderRadius: 10, borderWidth: 1, borderColor: '#D1FAE5', backgroundColor: '#ECFDF5' },
  selectWrap: { marginBottom: 10 },
  hotelListScroll: {
    maxHeight: 48,
    marginBottom: 6,
  },
  hotelChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginRight: 8,
  },
  hotelChipSelected: {
    backgroundColor: '#ECFDF5',
    borderColor: '#10B981',
  },
  hotelChipText: {
    color: '#374151',
    fontWeight: '700',
  },
  hotelChipTextSelected: {
    color: '#065F46',
  },
  noHotelsText: {
    color: '#6B7280',
    paddingVertical: 10,
    paddingHorizontal: 6,
  },
  itineraryWrap: {
    marginTop: 8,
  },
});
