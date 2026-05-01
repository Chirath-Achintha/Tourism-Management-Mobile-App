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
const MEAL_OPTIONS = ['Breakfast', 'Lunch', 'Dinner', 'All Inclusive'];
const ACCOMMODATION_OPTIONS = ['No accommodation', '3-star hotel', '4-star hotel', '5-star hotel', 'Resort', 'Villa'];
const GUIDE_OPTIONS = ['No guide', 'English-speaking guide', 'Multi-language guide'];
const TRANSPORT_OPTIONS = [
  'Car (Sedan/Hatchback)',
  'Van',
  'Mini bus / Coach',
  'Luxury SUV',
  'Three-wheeler (Tuk-tuk)',
  'Tourist bus',
  'Local bus',
  'Air-conditioned coach',
  'Luxury bus',
];

type FormState = {
  name: string;
  description: string;
  category: string;
  destination: string;
  duration: string;
  price: string;
  maxParticipants: string;
  meals: string[];
  accommodation: string;
  guide: string;
  transport: string;
};

const INITIAL_FORM: FormState = {
  name: '',
  description: '',
  category: '',
  destination: '',
  duration: '',
  price: '',
  maxParticipants: '',
  meals: [],
  accommodation: '',
  guide: '',
  transport: '',
};

export default function EditTourPackageScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const packageId = useMemo(() => String(id || '').trim(), [id]);

  useEffect(() => {
    const loadPackage = async () => {
      try {
        if (!packageId) {
          Alert.alert('Invalid package', 'Package ID is missing.');
          router.back();
          return;
        }

        const token = await AsyncStorage.getItem('auth:token');
        if (!token) {
          Alert.alert('Session expired', 'Please log in again.');
          router.replace('/login');
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

        setForm({
          name: data?.name || '',
          description: data?.description || '',
          category: data?.category || '',
          destination: data?.destination || '',
          duration: data?.duration ? String(data.duration) : '',
          price: data?.price ? String(data.price) : '',
          maxParticipants: data?.maxParticipants ? String(data.maxParticipants) : '',
          meals: String(data?.meals || '')
            .split(',')
            .map((item) => item.trim())
            .filter(Boolean),
          accommodation: data?.accommodation || '',
          guide: data?.guide || '',
          transport: data?.transport || '',
        });
      } catch (error: any) {
        Alert.alert('Error', error?.message || 'Failed to load package details.');
      } finally {
        setLoading(false);
      }
    };

    loadPackage();
  }, [packageId, router]);

  const updateField = <K extends keyof FormState>(field: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const validate = () => {
    if (!form.name.trim()) return 'Package name is required.';
    if (!form.destination.trim()) return 'Destination is required.';
    if (!form.category.trim()) return 'Category is required.';
    if (!form.duration.trim() || Number.isNaN(Number(form.duration))) return 'Duration must be a valid number.';
    if (!form.price.trim() || Number.isNaN(Number(form.price))) return 'Price must be a valid number.';
    if (!form.maxParticipants.trim() || Number.isNaN(Number(form.maxParticipants))) return 'Max participants must be a valid number.';
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
        router.replace('/login');
        return;
      }

      const payload = {
        name: form.name.trim(),
        description: form.description.trim(),
        category: form.category.trim().toLowerCase(),
        destination: form.destination.trim(),
        duration: Number(form.duration),
        price: Number(form.price),
        maxParticipants: Number(form.maxParticipants),
        meals: form.meals.join(', '),
        accommodation: form.accommodation.trim(),
        guide: form.guide.trim(),
        transport: form.transport.trim(),
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
          onPress: () => router.replace('/admin/tour-packages'),
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
          <TextInput
            style={styles.input}
            value={form.destination}
            onChangeText={(value) => updateField('destination', value)}
            placeholder="Destination"
            placeholderTextColor="#9CA3AF"
          />
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

        <Field label="Max Participants" required>
          <TextInput
            style={styles.input}
            value={form.maxParticipants}
            onChangeText={(value) => updateField('maxParticipants', value)}
            keyboardType="number-pad"
            placeholder="e.g. 12"
            placeholderTextColor="#9CA3AF"
          />
        </Field>

        <Field label="Meals">
          <MultiSelectField
            value={form.meals}
            options={MEAL_OPTIONS}
            placeholder="Select meals"
            onChange={(value) => updateField('meals', value)}
          />
        </Field>

        <Field label="Accommodation">
          <SelectField
            value={form.accommodation}
            options={ACCOMMODATION_OPTIONS}
            placeholder="Select accommodation"
            onChange={(value) => updateField('accommodation', value)}
          />
        </Field>

        <Field label="Guide">
          <SelectField
            value={form.guide}
            options={GUIDE_OPTIONS}
            placeholder="Select guide"
            onChange={(value) => updateField('guide', value)}
          />
        </Field>

        <Field label="Transport">
          <SelectField
            value={form.transport}
            options={TRANSPORT_OPTIONS}
            placeholder="Select transport"
            onChange={(value) => updateField('transport', value)}
          />
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
});
