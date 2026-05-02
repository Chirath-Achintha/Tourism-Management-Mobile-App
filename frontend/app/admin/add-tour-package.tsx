import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Pressable,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
  Image,
  Animated,
  Easing,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { API_BASE_URL } from '@/constants/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

type DestinationItem = {
  _id?: string;
  name: string;
  location?: string;
};

const CATEGORY_OPTIONS = [
  { key: 'adventure', label: 'Adventure', icon: 'compass-outline', color: '#3152c5' },
  { key: 'cultural', label: 'Cultural', icon: 'business-outline', color: '#7c4dff' },
  { key: 'beach', label: 'Beach', icon: 'water-outline', color: '#0f766e' },
  { key: 'mountain', label: 'Mountain', icon: 'trail-sign-outline', color: '#166534' },
  { key: 'city', label: 'City Tour', icon: 'apps-outline', color: '#0f4c81' },
  { key: 'wildlife', label: 'Wildlife', icon: 'paw-outline', color: '#a16207' },
  { key: 'forest', label: 'Forest', icon: 'leaf-outline', color: '#15803d' },
];

const DURATION_PRESETS = [1, 3, 5, 7, 10, 14];
const PRICE_PRESETS = [10000, 25000, 50000, 100000, 200000];
const MEAL_OPTIONS = ['Breakfast', 'Lunch', 'Dinner', 'All Inclusive'];
const GUIDE_OPTIONS = ['No guide', 'English-speaking guide', 'Multi-language guide'];
const PARTICIPANT_PRESETS = [5, 8, 10, 12, 15, 20, 25];

// Color palette (user-specified)
const COLOR_BG = '#EBF5EA'; // soft mint green canvas
const ACCENT = '#FFD166'; // dark yellow accent for CTAs, progress
const TEXT_DARK = '#1A2432'; // dark charcoal primary text
const SELECTED_BG = '#1A2432'; // selected pill background
const SELECTED_TEXT = ACCENT; // selected pill text
const STEP_LABEL_COLOR = '#7aad00'; // deep olive-green for step labels
const TIMELINE_BG_RGBA = 'rgba(255,209,102,0.12)';

type FormData = {
  name: string;
  location: string;
  locations?: string[];
  meals: string[];
  included: string[];
  guide: string;
  category: string;
  duration: string;
  startDate: string;
  endDate: string;
  price: string;
  minParticipants: string;
  maxParticipants: string;
  timeline: Array<{
    title: string;
    notes: string;
    hotel: string;
    hotelName: string;
    hotelLocation: string;
    places: Array<{ name: string; notes: string; location: string }>;
  }>;
};

const INITIAL_STATE: FormData = {
  name: '',
  location: '',
  locations: [],
  meals: [],
  included: [],
  guide: '',
  category: 'adventure',
  duration: '',
  startDate: '',
  endDate: '',
  price: '',
  minParticipants: '',
  maxParticipants: '',
  timeline: [],
};

const INCLUDED_OPTIONS = [
  { key: 'hotels', label: 'Hotels', icon: 'bed-outline' },
  { key: 'meals', label: 'Meals', icon: 'restaurant-outline' },
  { key: 'transport', label: 'Transport', icon: 'car-outline' },
  { key: 'activities', label: 'Activities', icon: 'sparkles-outline' },
  { key: 'insurance', label: 'Insurance', icon: 'shield-checkmark-outline' },
];
type Step = 0 | 1 | 2;

export default function AddTourPackageScreen() {
  const router = useRouter();
  const scrollRef = useRef<ScrollView>(null);
  const progressAnim = useRef(new Animated.Value(0)).current;
  const stepFadeAnim = useRef(new Animated.Value(1)).current;

  const [step, setStep] = useState<Step>(0);
  const [loading, setLoading] = useState(false);
  const [publishingSuccess, setPublishingSuccess] = useState(false);
  const [coverImageUri, setCoverImageUri] = useState<string | null>(null);
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [formData, setFormData] = useState(INITIAL_STATE);
  const [hotels, setHotels] = useState<any[]>([]);
  const [hotelsLoading, setHotelsLoading] = useState(false);
  const [destinations, setDestinations] = useState<DestinationItem[]>([]);
  const [destinationsLoading, setDestinationsLoading] = useState(false);
  const [destinationSearch, setDestinationSearch] = useState('');
  const [durationError, setDurationError] = useState<string | null>(null);
  const [dateError, setDateError] = useState<string | null>(null);
  const [participantsError, setParticipantsError] = useState<string | null>(null);

  const progressValue = useMemo(() => {
    return step === 0 ? 0.16 : step === 1 ? 0.58 : 1;
  }, [step]);

  // Fetch hotels on component mount
  useEffect(() => {
    const fetchHotels = async () => {
      try {
        setHotelsLoading(true);
        const token = await AsyncStorage.getItem('auth:token');
        if (!token) return;
        
        const response = await fetch(`${API_BASE_URL}/admin/hotels`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        setHotels(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Failed to fetch hotels:', err);
      } finally {
        setHotelsLoading(false);
      }
    };
    fetchHotels();
  }, []);

  // Filter hotels by selected package locations (if provided)
  const filteredHotels = useMemo(() => {
    const targets = Array.isArray(formData.locations) && formData.locations.length ? formData.locations.map((t) => t.trim().toLowerCase()) : [];
    if (targets.length === 0) return hotels;
    return hotels.filter((h) => {
      const loc = String(h.location || h.address || h.city || h.name || '').toLowerCase();
      return targets.some((t) => loc.includes(t) || (h.city && String(h.city).toLowerCase() === t));
    });
  }, [hotels, formData.locations]);

  useEffect(() => {
    const fetchDestinations = async () => {
      try {
        setDestinationsLoading(true);
        const response = await fetch(`${API_BASE_URL}/destinations`);
        const data = await response.json();
        setDestinations(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Failed to fetch destinations:', err);
      } finally {
        setDestinationsLoading(false);
      }
    };

    fetchDestinations();
  }, []);
  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: progressValue,
      duration: 360,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();

    Animated.sequence([
      Animated.timing(stepFadeAnim, {
        toValue: 0.25,
        duration: 120,
        useNativeDriver: true,
      }),
      Animated.timing(stepFadeAnim, {
        toValue: 1,
        duration: 180,
        useNativeDriver: true,
      }),
    ]).start();

    scrollRef.current?.scrollTo({ y: 0, animated: true });
  }, [progressAnim, progressValue, step, stepFadeAnim]);

  const parseMMDDYYYY = (s: string) => {
    const parts = s.split('/');
    if (parts.length !== 3) return null;
    const [m, d, y] = parts.map(Number);
    return new Date(y, m - 1, d);
  };

  const updateField = <K extends keyof FormData>(field: K, value: FormData[K]) => {
    setFormData(prev => {
      const next = { ...prev, [field]: value } as FormData;

      // when duration changes and we have a start date, recompute endDate
      if (field === 'duration') {
        const raw = String(value || '').trim();
        const dur = Number(raw);
        if (!raw || Number.isNaN(dur) || !Number.isInteger(dur) || dur < 1) {
          setDurationError('Enter a valid number of days (1 or more).');
        } else if (dur > 365) {
          setDurationError('Please choose a duration less than or equal to 365 days.');
        } else {
          setDurationError(null);
          // sync timeline length to duration
          next.timeline = syncTimelineToDuration(next.timeline || [], dur);

          // if we have a startDate, recompute endDate
          if (prev.startDate) {
            const start = parseMMDDYYYY(prev.startDate);
            if (start) {
              const end = new Date(start);
              end.setDate(end.getDate() + (dur - 1));
              next.endDate = formatDate(end);
              setDateError(null);
            }
          }
        }
      }

      // validate minParticipants or maxParticipants if updated
      if (field === 'minParticipants' || field === 'maxParticipants') {
        const minRaw = field === 'minParticipants' ? String(value || '').trim() : String(next.minParticipants || '').trim();
        const maxRaw = field === 'maxParticipants' ? String(value || '').trim() : String(next.maxParticipants || '').trim();
        const minNum = Number(minRaw);
        const maxNum = Number(maxRaw);

        if (!minRaw || Number.isNaN(minNum) || !Number.isInteger(minNum) || minNum < 1) {
          setParticipantsError('Min participants must be 1 or more.');
        } else if (!maxRaw || Number.isNaN(maxNum) || !Number.isInteger(maxNum) || maxNum < 1) {
          setParticipantsError('Max participants must be 1 or more.');
        } else if (maxNum > 500) {
          setParticipantsError('Max participants cannot exceed 500.');
        } else if (maxNum <= minNum) {
          setParticipantsError('Max participants must be greater than min participants.');
        } else {
          setParticipantsError(null);
        }
      }

      return next;
    });
  };

  const syncTimelineToDuration = (timeline: FormData['timeline'], duration: number) => {
    const next = Array.isArray(timeline) ? [...timeline] : [];
    // expand
    while (next.length < duration) {
      const newIndex = next.length + 1;
      next.push({ title: `Day ${newIndex}`, notes: '', hotel: '', hotelName: '', hotelLocation: '', places: [] });
    }
    // trim
    if (next.length > duration) {
      return next.slice(0, duration);
    }
    return next;
  };

  const toggleMeal = (meal: string) => {
    setFormData(prev => {
      const isSelected = prev.meals.includes(meal);
      return {
        ...prev,
        meals: isSelected ? prev.meals.filter(item => item !== meal) : [...prev.meals, meal],
      };
    });
  };

  const toggleIncluded = (key: string) => {
    setFormData(prev => {
      const has = prev.included.includes(key);
      return { ...prev, included: has ? prev.included.filter(i => i !== key) : [...prev.included, key] } as FormData;
    });
  };
  const selectPreset = (field: 'duration' | 'price' | 'maxParticipants', value: number) => {
    updateField(field, String(value));
  };

  const selectDestination = (destination: DestinationItem) => {
    const label = destination.location || destination.name;
    setFormData(prev => {
      const next = { ...prev } as FormData;
      const existing = Array.isArray(next.locations) ? [...next.locations] : [];
      if (existing.includes(label)) {
        next.locations = existing.filter((l) => l !== label);
      } else {
        next.locations = [...existing, label];
      }
      return next;
    });
  };

  const filteredDestinations = destinations.filter((destination) => {
    const query = destinationSearch.trim().toLowerCase();
    if (!query) return true;

    const name = destination.name.toLowerCase();
    const location = (destination.location || '').toLowerCase();
    return name.includes(query) || location.includes(query);
  });

  const formatDate = (date: Date) =>
    date.toLocaleDateString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric',
    });

  const handleStartDateSelected = (date?: Date) => {
    setShowStartDatePicker(false);
    if (!date) return;
    const start = formatDate(date);
    setFormData(prev => {
      const next = { ...prev, startDate: start } as typeof prev;
      const dur = Number(prev.duration);
      if (!Number.isNaN(dur) && dur > 0) {
        const end = new Date(date);
        end.setDate(end.getDate() + (dur - 1));
        next.endDate = formatDate(end);
      }
      setDateError(null);
      return next;
    });
  };

  const pickCoverPhoto = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission needed', 'Please allow access to your photo library to upload a cover image.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.9,
    });

    if (!result.canceled && result.assets[0]?.uri) {
      setCoverImageUri(result.assets[0].uri);
    }
  };

  const clearCoverPhoto = () => {
    setCoverImageUri(null);
  };

  // Timeline helpers
  const addTimelineDay = () => {
    setFormData(prev => {
      const nextTimeline = prev.timeline ? [...prev.timeline] : [];
      const newIndex = nextTimeline.length + 1;
      nextTimeline.push({ title: `Day ${newIndex}`, notes: '', hotel: '', hotelName: '', hotelLocation: '', places: [] });
      return { ...prev, timeline: nextTimeline } as typeof prev;
    });
    // scroll to bottom so user sees the new day
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 120);
  };

  const updateTimelineDay = (index: number, field: 'title' | 'notes' | 'hotel' | 'hotelName' | 'hotelLocation', value: string) => {
    setFormData(prev => {
      const nextTimeline = prev.timeline ? [...prev.timeline] : [];
      if (!nextTimeline[index]) return prev;
      nextTimeline[index] = { ...nextTimeline[index], [field]: value };
      return { ...prev, timeline: nextTimeline } as typeof prev;
    });
  };

  // Places helpers (per-day)
  const addPlaceToDay = (dayIndex: number) => {
    setFormData(prev => {
      const nextTimeline = prev.timeline ? [...prev.timeline] : [];
      if (!nextTimeline[dayIndex]) return prev;
      const nextPlaces = nextTimeline[dayIndex].places ? [...nextTimeline[dayIndex].places] : [];
      nextPlaces.push({ name: '', notes: '', location: '' });
      nextTimeline[dayIndex] = { ...nextTimeline[dayIndex], places: nextPlaces };
      return { ...prev, timeline: nextTimeline } as typeof prev;
    });
  };

  const updatePlaceField = (dayIndex: number, placeIndex: number, field: 'name' | 'notes' | 'location', value: string) => {
    setFormData(prev => {
      const nextTimeline = prev.timeline ? [...prev.timeline] : [];
      if (!nextTimeline[dayIndex]) return prev;
      const nextPlaces = nextTimeline[dayIndex].places ? [...nextTimeline[dayIndex].places] : [];
      if (!nextPlaces[placeIndex]) return prev;
      nextPlaces[placeIndex] = { ...nextPlaces[placeIndex], [field]: value };
      nextTimeline[dayIndex] = { ...nextTimeline[dayIndex], places: nextPlaces };
      return { ...prev, timeline: nextTimeline } as typeof prev;
    });
  };

  const removePlaceFromDay = (dayIndex: number, placeIndex: number) => {
    setFormData(prev => {
      const nextTimeline = prev.timeline ? [...prev.timeline] : [];
      if (!nextTimeline[dayIndex]) return prev;
      const nextPlaces = nextTimeline[dayIndex].places ? nextTimeline[dayIndex].places.filter((_, i) => i !== placeIndex) : [];
      nextTimeline[dayIndex] = { ...nextTimeline[dayIndex], places: nextPlaces };
      return { ...prev, timeline: nextTimeline } as typeof prev;
    });
  };

  const removeTimelineDay = (index: number) => {
    setFormData(prev => {
      const nextTimeline = prev.timeline ? prev.timeline.filter((_, i) => i !== index) : [];
      return { ...prev, timeline: nextTimeline } as typeof prev;
    });
  };

  const validateStep = (currentStep: Step) => {
    if (currentStep === 0) {
      if (!formData.name.trim()) return 'Please enter a package name.';
      if (!formData.location.trim()) return 'Please enter a destination location.';
      if (!formData.guide) return 'Please choose a guide option.';
      return null;
    }

    if (currentStep === 1) {
      if (durationError) return durationError;
      if (!formData.duration.trim() || Number.isNaN(Number(formData.duration)) || !Number.isInteger(Number(formData.duration)) || Number(formData.duration) < 1) return 'Please choose a valid duration.';
      if (!formData.startDate.trim()) {
        setDateError('Please select a departure date.');
        return 'Please select a departure date.';
      }
      return null;
    }

    if (currentStep === 2) {
      if (!formData.price.trim() || Number.isNaN(Number(formData.price))) return 'Please select a valid price.';
      if (participantsError) return participantsError;
      const minVal = Number(formData.minParticipants);
      const maxVal = Number(formData.maxParticipants);
      if (!formData.minParticipants.trim() || Number.isNaN(minVal) || minVal < 1) return 'Please enter min participants.';
      if (!formData.maxParticipants.trim() || Number.isNaN(maxVal) || maxVal < 1) return 'Please enter max participants.';
      if (minVal > maxVal) return 'Min participants cannot exceed max participants.';
      if (maxVal > 500) return 'Max participants cannot exceed 500.';
      return null;
    }

    return null;
  };

  const nextStep = () => {
    const error = validateStep(step);
    if (error) {
      Alert.alert('Incomplete step', error);
      return;
    }

    if (step < 2) {
      setStep((prev) => (prev + 1) as Step);
    }
  };

  const previousStep = () => {
    if (step > 0) {
      setStep((prev) => (prev - 1) as Step);
    }
  };

  const publishPackage = async () => {
    const error = validateStep(2) || validateStep(1) || validateStep(0);
    if (error) {
      Alert.alert('Missing information', error);
      return;
    }

    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('auth:token');

      const payload = {
        name: formData.name,
        description: `A curated ${formData.category} experience in ${(Array.isArray(formData.locations) && formData.locations.length) ? formData.locations.join(', ') : formData.location}.`,
        category: formData.category,

        // Keep `destination` for backwards compatibility (first selected), and include `destinations` array
        destination: Array.isArray(formData.locations) && formData.locations.length ? formData.locations[0] : formData.location,
        destinations: Array.isArray(formData.locations) ? formData.locations : [],
        duration: Number(formData.duration),
        startDate: formData.startDate,
        endDate: formData.endDate,
        price: Number(formData.price),
        minParticipants: Number(formData.minParticipants),
        maxParticipants: Number(formData.maxParticipants),
        timeline: formData.timeline || [],
        meals: formData.meals.join(', '),
        guide: formData.guide || '',
        included: formData.included || [],
      };
      let response;
      // If a cover image is selected, upload as multipart/form-data so server can handle Cloudinary upload
      if (coverImageUri) {
        const form = new FormData();
        // append fields
        Object.entries({ ...payload }).forEach(([k, v]) => {
          if (v !== undefined && v !== null) {
            if (k === 'timeline' || k === 'included') {
              form.append(k, JSON.stringify(v));
            } else {
              form.append(k, String(v));
            }
          }
        });

        // append image
        if (Platform.OS === 'web') {
          const res = await fetch(coverImageUri);
          const blob = await res.blob();
          form.append('cover', blob, 'cover.jpg');
        } else {
          // react native: provide file object with uri
          const uriParts = coverImageUri.split('.');
          const fileType = uriParts[uriParts.length - 1] || 'jpg';
          form.append('cover', {
            uri: coverImageUri,
            name: `cover.${fileType}`,
            type: `image/${fileType}`,
          } as any);
        }

        response = await fetch(`${API_BASE_URL}/admin/tour-packages`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            // NOTE: Let fetch set Content-Type with boundary
          },
          body: form,
        });
      } else {
        response = await fetch(`${API_BASE_URL}/admin/tour-packages`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });
      }

      const data = await response.json();

      if (response.ok) {
        setPublishingSuccess(true);
      } else {
        Alert.alert('Error', data.message || 'Failed to publish tour package.');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'An error occurred while publishing the package.');
    } finally {
      setLoading(false);
    }
  };

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['16%', '100%'],
  });

  const stepTitles = ['Basic Info', 'Schedule', 'Pricing'];
  const activeSummary = {
    category: CATEGORY_OPTIONS.find(item => item.key === formData.category)?.label || 'Adventure',
    duration: formData.duration ? `${formData.duration} days` : '—',
    participants: formData.minParticipants && formData.maxParticipants ? `${formData.minParticipants}-${formData.maxParticipants}` : '—',
    price: formData.price ? `LKR ${formData.price}` : '—',
  };
  const includedSummary = {
    meals: formData.meals.length ? formData.meals.join(', ') : '—',
    guide: formData.guide || '—',
  };

  if (publishingSuccess) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="light" backgroundColor={ACCENT} />
        <LinearGradient colors={[ACCENT, '#f7facd', '#ffffff']} style={styles.successHero}>
          <View style={styles.successBadge}>
            <Ionicons name="checkmark-circle" size={42} color={ACCENT} />
          </View>
          <Text style={styles.successEyebrow}>PUBLISHED</Text>
          <Text style={styles.successTitle}>Package is live</Text>
          <Text style={styles.successSubtitle}>
            The tour package has been published and is ready for review in the inventory.
          </Text>
        </LinearGradient>

        <View style={styles.successCard}>
          <Text style={styles.successCardLabel}>Package Summary</Text>
          <Text style={styles.successCardTitle}>{formData.name}</Text>
          <View style={styles.successMetaRow}>
            <MetaPill icon="location-outline" text={formData.location} />
            <MetaPill icon="time-outline" text={activeSummary.duration} />
            <MetaPill icon="people-outline" text={`${activeSummary.participants} pax`} />
          </View>
          <Pressable style={styles.successPrimaryButton} onPress={() => router.replace('/admin/tour-packages')}>
            <Text style={styles.successPrimaryButtonText}>View Tour Packages</Text>
          </Pressable>
          <Pressable
            style={styles.successSecondaryButton}
            onPress={() => {
              setPublishingSuccess(false);
              setStep(0);
              setCoverImageUri(null);
              setFormData(INITIAL_STATE);
            }}
          >
            <Text style={styles.successSecondaryButtonText}>Create Another Package</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" backgroundColor={ACCENT} />
      <LinearGradient colors={[ACCENT, '#f7facd', '#ffffff']} style={styles.header}>
        <View style={styles.headerTopRow}>
          <Pressable onPress={() => router.back()} style={styles.headerIconButton}>
            <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
          </Pressable>
          <View style={styles.adminBadge}>
            <View style={styles.adminDot} />
            <Text style={styles.adminBadgeText}>ADMIN</Text>
          </View>
          <Pressable style={styles.headerIconButton}>
            <Ionicons name="information-circle-outline" size={22} color="#FFFFFF" />
          </Pressable>
        </View>

        <View style={styles.heroCopy}>
          <Text style={styles.heroTitle}>New Tour Package</Text>
          <Text style={styles.heroSubtitle}>Fill in all details to publish your tour</Text>
        </View>

        <View style={styles.stepRail}>
          <View style={styles.stepLabelsRow}>
            {stepTitles.map((title, index) => {
              const active = step === index;
              const completed = step > index;
              return (
                <Pressable
                  key={title}
                  onPress={() => {
                    // only allow navigating to current or previous steps
                    if (index <= step) setStep(index as Step);
                  }}
                  style={styles.stepLabelItem}
                >
                  <Text style={[styles.stepLabelText, active && styles.stepLabelActive, completed && styles.stepLabelCompleted]}>
                    {completed ? `✓ ${title}` : title}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          <View style={styles.stepTrack}>
            <Animated.View style={[styles.stepProgress, { width: progressWidth }]} />
          </View>
        </View>
      </LinearGradient>

      <ScrollView ref={scrollRef} style={styles.content} contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
        <Animated.View style={{ opacity: stepFadeAnim }}>
          {step === 0 && (
            <View style={styles.stepCard}>
              <Text style={styles.sectionKicker}>BASIC INFO</Text>
              <Text style={styles.sectionTitle}>Create the package identity</Text>
              <Text style={styles.sectionCopy}>Start with the destination story, then add a visual hook and a category people can scan quickly.</Text>

              <Pressable style={styles.coverUploadCard} onPress={pickCoverPhoto}>
                {coverImageUri ? (
                  <>
                    <Image source={{ uri: coverImageUri }} style={styles.coverPreview} />
                    <LinearGradient colors={['rgba(11,47,83,0.15)', 'rgba(11,47,83,0.45)']} style={styles.coverOverlay}>
                      <Pressable style={styles.removeCoverButton} onPress={clearCoverPhoto}>
                        <Ionicons name="close" size={16} color="#FFFFFF" />
                        <Text style={styles.removeCoverText}>Remove</Text>
                      </Pressable>
                    </LinearGradient>
                  </>
                ) : (
                  <View style={styles.uploadPlaceholder}>
                    <View style={styles.uploadIconWrap}>
                      <Ionicons name="image-outline" size={30} color={ACCENT} />
                    </View>
                    <Text style={styles.uploadTitle}>Upload Cover Photo</Text>
                    <Text style={styles.uploadSubtitle}>JPG, PNG or WebP · Max 10 MB</Text>
                  </View>
                )}
              </Pressable>

              <Field label="Package Name" required>
                <TextInput
                  style={styles.input}
                  placeholder="e.g., Bali Sunrise Adventure"
                  placeholderTextColor="#94a3b8"
                  value={formData.name}
                  onChangeText={(value) => updateField('name', value)}
                />
              </Field>

              <Field label="Category" required>
                <View style={styles.categoryGrid}>
                  {CATEGORY_OPTIONS.map(option => {
                    const selected = formData.category === option.key;
                    return (
                      <Pressable
                        key={option.key}
                        onPress={() => updateField('category', option.key)}
                        style={({ pressed }) => [
                          styles.categoryChip,
                          selected && styles.categoryChipSelected,
                          { borderColor: selected ? option.color : 'rgba(15, 23, 42, 0.08)' },
                          pressed && styles.pressedOpacity,
                        ]}
                      >
                        <Ionicons name={option.icon as any} size={18} color={selected ? option.color : '#64748b'} />
                        <Text style={[styles.categoryText, selected && { color: option.color }]}>{option.label}</Text>
                      </Pressable>
                    );
                  })}
                </View>
              </Field>

              <Field label="Destination" required>
                <Text style={styles.destinationHint}>Search the destination table by location and pick one, or type a custom location for this package.</Text>
                <View style={styles.iconInputWrap}>
                  <Ionicons name="search-outline" size={18} color="#64748b" />
                  <TextInput
                    style={styles.iconInput}
                    placeholder="Search destination locations"
                    placeholderTextColor="#94a3b8"
                    value={destinationSearch}
                    onChangeText={setDestinationSearch}
                  />
                </View>
                {destinationsLoading ? (
                  <View style={styles.destinationLoadingPill}>
                    <ActivityIndicator size="small" color={ACCENT} />
                    <Text style={styles.destinationLoadingText}>Loading destinations...</Text>
                  </View>
                ) : filteredDestinations.length > 0 ? (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.destinationScroll} contentContainerStyle={styles.destinationScrollContent}>
                    {filteredDestinations.map((destination) => {
                      const locationLabel = destination.location || destination.name;
                      const selected = Array.isArray(formData.locations) && formData.locations.includes(locationLabel);

                      return (
                        <Pressable
                          key={destination._id || destination.name}
                          onPress={() => selectDestination(destination)}
                          style={[styles.destinationChip, selected && styles.destinationChipSelected]}
                        >
                          <Text style={[styles.destinationChipTitle, selected && styles.destinationChipTitleSelected]} numberOfLines={2}>
                            {locationLabel}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </ScrollView>
                ) : (
                  <View style={styles.destinationLoadingPill}>
                    <Ionicons name="alert-circle-outline" size={18} color={ACCENT} />
                    <Text style={styles.destinationLoadingText}>No matching destination locations found.</Text>
                  </View>
                )}
                <View style={[styles.iconInputWrap, { marginTop: 10 }]}>
                  <Ionicons name="location-outline" size={18} color="#64748b" />
                  <TextInput
                    style={styles.iconInput}
                    placeholder="Or enter custom location"
                    placeholderTextColor="#94a3b8"
                    value={formData.location}
                    onChangeText={(value) => updateField('location', value)}
                  />
                </View>
                <View style={{ flexDirection: 'row', marginTop: 8, gap: 8, alignItems: 'center' }}>
                  <Pressable
                    style={[styles.addDayButton]}
                    onPress={() => {
                      const val = (formData.location || '').trim();
                      if (!val) return;
                      setFormData(prev => ({ ...prev, locations: [...(prev.locations || []), val], location: '' } as FormData));
                    }}
                  >
                    <Text style={{ color: SELECTED_TEXT, fontWeight: '700' }}>+ Add Location</Text>
                  </Pressable>
                  <Text style={{ color: '#6B7280', fontSize: 13 }}>{Array.isArray(formData.locations) && formData.locations.length ? `${formData.locations.length} selected` : 'No extra locations'}</Text>
                </View>
              </Field>
              <Text style={[styles.sectionTitle, { marginTop: 8 }]}>What's Included</Text>
              <Text style={styles.sectionCopy}>Use quick selectors to define exactly what is included in this package.</Text>

              <View style={styles.includedPanel}>
                <Text style={[styles.sectionCopy, { marginBottom: 8 }]}>Choose what the package includes (will appear on public listing)</Text>
                <View style={styles.includedGrid}>
                  {INCLUDED_OPTIONS.map((opt) => {
                    const active = formData.included.includes(opt.key);
                    return (
                      <Pressable
                        key={opt.key}
                        onPress={() => toggleIncluded(opt.key)}
                        style={[styles.includeItem, active && styles.includeItemActive]}
                      >
                        <View style={[styles.includeIconWrap, active && styles.includeIconWrapActive]}>
                          <Ionicons name={opt.icon as any} size={20} color={active ? '#0f172a' : '#3152c5'} />
                        </View>
                        <Text style={[styles.includeLabel, active && styles.includeLabelActive]} numberOfLines={1}>{opt.label}</Text>
                      </Pressable>
                    );
                  })}
                </View>

                <SelectField
                  label="Guide"
                  value={formData.guide}
                  placeholder="Select guide option"
                  options={GUIDE_OPTIONS}
                  onSelect={(value) => updateField('guide', value)}
                  required
                />
              </View>
            </View>
          )}

          {step === 1 && (
            <View style={styles.stepCard}>
              <Text style={styles.sectionKicker}>SCHEDULE</Text>
              <Text style={styles.sectionTitle}>Set the trip timing</Text>
              <Text style={styles.sectionCopy}>Use the quick pills for the common package lengths and keep departure dates aligned with the return date.</Text>

              <Field label="Tour Duration" required>
                <View style={styles.pillRowWrap}>
                  {DURATION_PRESETS.map(duration => {
                    const selected = formData.duration === String(duration);
                    return (
                      <Pressable
                        key={duration}
                        onPress={() => selectPreset('duration', duration)}
                        style={[styles.pill, selected && styles.pillSelected]}
                      >
                        <Text style={[styles.pillText, selected && styles.pillTextSelected]}>{duration}d</Text>
                      </Pressable>
                    );
                  })}
                </View>
                <View style={styles.iconInputWrap}>
                  <Ionicons name="time-outline" size={18} color="#64748b" />
                  <TextInput
                    style={styles.iconInput}
                    placeholder="Custom days"
                    placeholderTextColor="#94a3b8"
                    value={formData.duration}
                    onChangeText={(value) => updateField('duration', value)}
                    keyboardType="number-pad"
                  />
                </View>
                  {durationError ? <Text style={{ color: '#ef4444', marginTop: 6 }}>{durationError}</Text> : null}
              </Field>

              <View style={styles.dateGrid}>
                <Field label="Departure Date" required style={styles.halfField}>
                  <Pressable style={styles.dateInput} onPress={() => setShowStartDatePicker(true)}>
                    <Ionicons name="calendar-outline" size={18} color={ACCENT} />
                    <Text style={[styles.dateInputText, !formData.startDate && styles.placeholderText]}>{formData.startDate || 'mm/dd/yyyy'}</Text>
                  </Pressable>
                  {!formData.startDate && durationError == null ? (
                    <Text style={{ color: '#ef4444', marginTop: 6 }}>{dateError || ''}</Text>
                  ) : null}
                </Field>

                <Field label="Return Date" required style={styles.halfField}>
                  <View style={styles.dateInput}>
                    <Ionicons name="calendar-outline" size={18} color="#f59e0b" />
                    <Text style={[styles.dateInputText, !formData.endDate && styles.placeholderText]}>{formData.endDate || 'mm/dd/yyyy'}</Text>
                  </View>
                </Field>
              </View>

              <View style={styles.schedulePreviewCard}>
                <Ionicons name="sparkles-outline" size={18} color={ACCENT} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.schedulePreviewTitle}>{formData.duration ? `${formData.duration}-Day Tour` : '5-Day Tour'}</Text>
                  <Text style={styles.schedulePreviewSubtitle}>
                    {formData.startDate && formData.endDate ? `${formData.startDate} → ${formData.endDate}` : 'A clean preview of the travel timeline will appear here.'}
                  </Text>
                </View>
              </View>

              <View style={styles.timelineSection}>
                <View style={styles.timelineHeader}>
                  <Text style={styles.timelineHeading}>The Journey Timeline</Text>
                  <Pressable style={styles.addDayButton} onPress={addTimelineDay}>
                    <Ionicons name="add" size={16} color="#FFFFFF" />
                    <Text style={styles.addDayButtonText}>Add Day</Text>
                  </Pressable>
                </View>

                {(!formData.timeline || formData.timeline.length === 0) ? (
                  <Text style={styles.timelineEmpty}>No days yet. Use "Add Day" to build the itinerary.</Text>
                ) : (
                  formData.timeline.map((day, idx) => (
                    <View key={`day-${idx}`} style={styles.dayCard}>
                      <View style={styles.dayIndexWrap}>
                        <Text style={styles.dayIndex}>{String(idx + 1).padStart(2, '0')}</Text>
                      </View>
                      <View style={styles.dayCardContent}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                          <TextInput
                            value={day.title}
                            onChangeText={(val) => updateTimelineDay(idx, 'title', val)}
                            style={styles.dayTitleInput}
                            placeholder={`Arrival & S (Day ${idx + 1})`}
                            placeholderTextColor="#94a3b8"
                          />
                          <Pressable onPress={() => removeTimelineDay(idx)} style={styles.dayDeleteButton}>
                            <Ionicons name="trash-outline" size={18} color="#9aa4b2" />
                          </Pressable>
                        </View>

                        <TextInput
                          value={day.notes}
                          onChangeText={(val) => updateTimelineDay(idx, 'notes', val)}
                          style={styles.dayNotesInput}
                          placeholder="Outline logistics, key highlights..."
                          placeholderTextColor="#94a3b8"
                          multiline
                          numberOfLines={3}
                        />
                        <View style={styles.hotelSelectorWrap}>
                          <Text style={styles.hotelLabel}>Select Hotel</Text>
                          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.hotelListScroll}>
                            {hotelsLoading ? (
                              <Text style={styles.noHotelsText}>Loading hotels...</Text>
                            ) : filteredHotels.length === 0 ? (
                              formData.location ? (
                                <Text style={styles.noHotelsText}>No hotels found for this location.</Text>
                              ) : (
                                <Text style={styles.noHotelsText}>No hotels available</Text>
                              )
                            ) : (
                              filteredHotels.map((hotel) => (
                                <Pressable
                                  key={hotel._id}
                                  style={[
                                    styles.hotelChip,
                                    day.hotel === hotel._id && styles.hotelChipSelected,
                                  ]}
                                  onPress={() => {
                                    updateTimelineDay(idx, 'hotel', hotel._id);
                                    updateTimelineDay(idx, 'hotelName', hotel.hotelName || hotel.name || '');
                                    updateTimelineDay(idx, 'hotelLocation', hotel.location || hotel.address || '');
                                  }}
                                >
                                  <Text style={[
                                    styles.hotelChipText,
                                    day.hotel === hotel._id && styles.hotelChipTextSelected,
                                  ]}>{hotel.hotelName || hotel.name}</Text>
                                </Pressable>
                              ))
                            )}
                          </ScrollView>
                        </View>
                        <View style={{ marginTop: 8 }}>
                          <TextInput
                            placeholder="Hotel name (type to override or enter new)"
                            placeholderTextColor="#94a3b8"
                            value={day.hotelName || ''}
                            onChangeText={(val) => updateTimelineDay(idx, 'hotelName', val)}
                            style={styles.formInput}
                          />
                          <TextInput
                            placeholder="Hotel location (city/address)"
                            placeholderTextColor="#94a3b8"
                            value={day.hotelLocation || ''}
                            onChangeText={(val) => updateTimelineDay(idx, 'hotelLocation', val)}
                            style={[styles.formInput, { marginTop: 8 }]}
                          />

                          {/* Places (visited locations) */}
                          <View style={{ marginTop: 10 }}>
                            <Text style={[styles.hotelLabel, { marginBottom: 6 }]}>Places to visit this day</Text>
                            {Array.isArray(day.places) && day.places.length > 0 ? (
                              day.places.map((place, pIdx) => (
                                <View key={pIdx} style={styles.placeRow}>
                                  <View style={{ flex: 1 }}>
                                    <TextInput
                                      placeholder="Place name"
                                      placeholderTextColor="#94a3b8"
                                      value={place.name || ''}
                                      onChangeText={(val) => updatePlaceField(idx, pIdx, 'name', val)}
                                      style={styles.placeInput}
                                    />
                                  </View>
                                  <Pressable onPress={() => removePlaceFromDay(idx, pIdx)} style={styles.placeRemoveButton}>
                                    <Ionicons name="trash-outline" size={18} color="#ef4444" />
                                  </Pressable>
                                </View>
                              ))
                            ) : (
                              <Text style={styles.noHotelsText}>No places added yet</Text>
                            )}

                            <Pressable onPress={() => addPlaceToDay(idx)} style={[styles.addDayButton, { marginTop: 8 }]}>
                              <Ionicons name="add" size={14} color={SELECTED_TEXT} />
                              <Text style={styles.addDayButtonText}>Add Place</Text>
                            </Pressable>
                          </View>
                        </View>
                      </View>
                    </View>
                  ))
                )}
              </View>
            </View>
          )}

          {step === 2 && (
            <View style={styles.stepCard}>
              <Text style={styles.sectionKicker}>PRICING</Text>
              <Text style={styles.sectionTitle}>Set the value and capacity</Text>
              <Text style={styles.sectionCopy}>The final step combines quick pricing presets with participants, then shows a summary before publishing.</Text>

              <Field label="Price per Person" required>
                <View style={styles.priceInputBox}>
                  <View style={styles.pricePrefix}>
                    <Text style={styles.pricePrefixText}>$</Text>
                  </View>
                  <TextInput
                    style={styles.priceInput}
                    placeholder="0.00"
                    placeholderTextColor="#94a3b8"
                    value={formData.price}
                    onChangeText={(value) => updateField('price', value)}
                    keyboardType="decimal-pad"
                  />
                  <Text style={styles.priceSuffix}>LKR</Text>
                </View>
              </Field>

              <View style={styles.twoColRow}>
                <Field label="Min Participants" required style={styles.col}>
                  <View style={styles.iconInputWrap}>
                    <Ionicons name="people-outline" size={18} color="#64748b" />
                    <TextInput
                      style={styles.iconInput}
                      placeholder="e.g., 5"
                      placeholderTextColor="#94a3b8"
                      value={formData.minParticipants}
                      onChangeText={(value) => updateField('minParticipants', value)}
                      keyboardType="number-pad"
                    />
                  </View>
                </Field>

                <Field label="Max Participants" required style={styles.col}>
                  <View style={styles.iconInputWrap}>
                    <Ionicons name="people-outline" size={18} color="#64748b" />
                    <TextInput
                      style={styles.iconInput}
                      placeholder="e.g., 20"
                      placeholderTextColor="#94a3b8"
                      value={formData.maxParticipants}
                      onChangeText={(value) => updateField('maxParticipants', value)}
                      keyboardType="number-pad"
                    />
                  </View>
                </Field>
              </View>
              {participantsError ? <Text style={{ color: '#ef4444', marginTop: 6 }}>{participantsError}</Text> : null}

              <View style={styles.summaryCard}>
                <View style={styles.summaryHeader}>
                  <Ionicons name="analytics-outline" size={18} color="#FFFFFF" />
                  <Text style={styles.summaryHeaderText}>Package Summary</Text>
                </View>
                <SummaryRow label="Destination" value={formData.location || '—'} />
                <SummaryRow label="Category" value={activeSummary.category} />
                <SummaryRow label="Meals" value={includedSummary.meals} />
                <SummaryRow label="Guide" value={includedSummary.guide} />
                <SummaryRow label="Duration" value={activeSummary.duration} />
                <SummaryRow label="Price" value={activeSummary.price} />
                <SummaryRow label="Group Size" value={formData.minParticipants && formData.maxParticipants ? `${formData.minParticipants}-${formData.maxParticipants} guests` : '—'} />
              </View>
            </View>
          )}

          <View style={styles.actionRow}>
            <Pressable style={styles.backAction} onPress={previousStep} disabled={step === 0 || loading}>
                    <Ionicons name="arrow-back" size={18} color={step === 0 ? '#94a3b8' : TEXT_DARK} />
            </Pressable>

            {step < 2 ? (
              <Pressable style={styles.primaryAction} onPress={nextStep}>
                <Text style={styles.primaryActionText}>Continue to {step === 0 ? 'Schedule' : 'Pricing'}</Text>
                <Ionicons name="arrow-forward" size={18} color={TEXT_DARK} />
              </Pressable>
            ) : (
              <Pressable style={[styles.publishAction, loading && styles.publishActionDisabled]} onPress={publishPackage} disabled={loading}>
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <>
                    <Ionicons name="checkmark-circle" size={18} color={TEXT_DARK} />
                    <Text style={styles.publishActionText}>Publish Package</Text>
                  </>
                )}
              </Pressable>
            )}
          </View>
        </Animated.View>
      </ScrollView>

      {showStartDatePicker && (
        <DateTimePicker
          value={new Date()}
          mode="date"
          display="default"
          onChange={(event, date) => handleStartDateSelected(date)}
        />
      )}
    </SafeAreaView>
  );
}

function Field({ label, required, children, style }: any) {
  return (
    <View style={[styles.field, style]}>
      <Text style={styles.fieldLabel}>
        {label} {required ? <Text style={styles.requiredMark}>*</Text> : null}
      </Text>
      {children}
    </View>
  );
}

function SelectField({
  label,
  value,
  placeholder,
  options,
  onSelect,
  required,
}: {
  label: string;
  value: string;
  placeholder: string;
  options: string[];
  onSelect: (value: string) => void;
  required?: boolean;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <Field label={label} required={required}>
      <Pressable style={[styles.selectTrigger, expanded && styles.selectTriggerExpanded]} onPress={() => setExpanded((prev) => !prev)}>
        <Text style={[styles.selectTriggerText, !value && styles.placeholderText]}>{value || placeholder}</Text>
        <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={16} color="#64748b" />
      </Pressable>

      {expanded ? (
        <View style={styles.selectMenu}>
          {options.map((option) => {
            const selected = value === option;
            return (
              <Pressable
                key={option}
                onPress={() => {
                  onSelect(option);
                  setExpanded(false);
                }}
                style={[styles.selectOption, selected && styles.selectOptionSelected]}
              >
                <Text style={[styles.selectOptionText, selected && styles.selectOptionTextSelected]}>{option}</Text>
                {selected ? <Ionicons name="checkmark-circle" size={16} color={ACCENT} /> : null}
              </Pressable>
            );
          })}
        </View>
      ) : null}
    </Field>
  );
}
function MetaPill({ icon, text }: { icon: any; text: string }) {
  return (
    <View style={styles.metaPill}>
      <Ionicons name={icon} size={14} color={ACCENT} />
      <Text style={styles.metaPillText} numberOfLines={1}>{text}</Text>
    </View>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.summaryRow}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={styles.summaryValue} numberOfLines={1}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLOR_BG,
  },
  header: {
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 18,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  headerIconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  adminBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  adminDot: {
    width: 7,
    height: 7,
    borderRadius: 999,
    backgroundColor: ACCENT,
  },
  adminBadgeText: {
    color: '#cfe2ff',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.2,
  },
  heroCopy: {
    marginBottom: 18,
  },
  heroTitle: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  heroSubtitle: {
    color: '#d4e4f7',
    marginTop: 4,
    fontSize: 13,
    fontWeight: '500',
  },
  stepRail: {
    gap: 10,
  },
  stepLabelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  stepLabelItem: {
    flex: 1,
  },
  stepLabelText: {
    color: '#9eb8d9',
    fontSize: 12,
    fontWeight: '600',
  },
  stepLabelActive: {
    color: STEP_LABEL_COLOR,
  },
  stepLabelCompleted: {
    color: STEP_LABEL_COLOR,
  },
  stepTrack: {
    height: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.22)',
    overflow: 'hidden',
  },
  stepProgress: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: ACCENT,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 24,
  },
  stepCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 16,
    shadowColor: '#0f172a',
    shadowOpacity: 0.07,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 4,
  },
  sectionKicker: {
    color: '#3152c5',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.3,
    marginBottom: 6,
  },
  sectionTitle: {
    color: '#0f172a',
    fontSize: 23,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  sectionCopy: {
    color: '#64748b',
    fontSize: 13,
    lineHeight: 19,
    marginTop: 8,
    marginBottom: 16,
  },
  coverUploadCard: {
    height: 176,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(49,82,197,0.14)',
    borderStyle: 'dashed',
    marginBottom: 16,
    backgroundColor: '#eef4ff',
  },
  uploadPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  uploadIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: TIMELINE_BG_RGBA,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  uploadTitle: {
    color: '#0f172a',
    fontSize: 16,
    fontWeight: '700',
  },
  uploadSubtitle: {
    color: '#64748b',
    fontSize: 12,
    marginTop: 4,
  },
  coverPreview: {
    width: '100%',
    height: '100%',
  },
  coverOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    padding: 12,
  },
  removeCoverButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(15, 23, 42, 0.62)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
  },
  removeCoverText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  field: {
    marginBottom: 16,
  },
  fieldLabel: {
    color: '#0f172a',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 8,
  },
  requiredMark: {
    color: '#dc2626',
  },
  input: {
    backgroundColor: '#f8fbff',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: '#0f172a',
    borderWidth: 1,
    borderColor: 'rgba(15, 23, 42, 0.06)',
  },
  includedPanel: {
    backgroundColor: '#f6f9ff',
    borderRadius: 18,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(49,82,197,0.12)',
  },
  includedGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  includeItem: {
    width: '30%',
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(15,23,42,0.06)',
    backgroundColor: '#ffffff',
    marginBottom: 8,
  },
  includeItemActive: {
    backgroundColor: ACCENT,
    borderColor: ACCENT,
  },
  includeIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#eef4ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  includeIconWrapActive: {
    backgroundColor: '#ffd966',
  },
  includeLabel: {
    fontSize: 12,
    color: '#0f172a',
    fontWeight: '700',
    textAlign: 'center',
  },
  includeLabelActive: {
    color: '#0f172a',
  },
  checkboxGrid: {
    gap: 8,
  },
  checkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#eef4ff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(15, 23, 42, 0.06)',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  checkItemSelected: {
    backgroundColor: '#fff3c9',
    borderColor: 'rgba(255,209,102,0.8)',
  },
  checkBox: {
    width: 18,
    height: 18,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#9fb0c8',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  checkBoxSelected: {
    borderColor: ACCENT,
    backgroundColor: ACCENT,
  },
  checkItemText: {
    color: '#1f2937',
    fontSize: 14,
    fontWeight: '600',
  },
  checkItemTextSelected: {
    color: '#0f172a',
    fontWeight: '800',
  },
  selectTrigger: {
    backgroundColor: '#f8fbff',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 13,
    borderWidth: 1,
    borderColor: 'rgba(15, 23, 42, 0.08)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectTriggerExpanded: {
    borderColor: 'rgba(49,82,197,0.5)',
  },
  selectTriggerText: {
    color: '#0f172a',
    fontSize: 14,
    fontWeight: '600',
  },
  selectMenu: {
    marginTop: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(15, 23, 42, 0.08)',
    overflow: 'hidden',
  },
  selectOption: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: 'rgba(15, 23, 42, 0.05)',
  },
  selectOptionSelected: {
    backgroundColor: '#fff9e8',
  },
  selectOptionText: {
    color: '#334155',
    fontSize: 14,
    fontWeight: '600',
  },
  selectOptionTextSelected: {
    color: '#0f172a',
    fontWeight: '800',
  },
  iconInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#f8fbff',
    borderRadius: 16,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: 'rgba(15, 23, 42, 0.06)',
  },
  iconInput: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 15,
    color: '#0f172a',
  },
  destinationHint: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 10,
    lineHeight: 18,
  },
  destinationScroll: {
    marginBottom: 0,
  },
  destinationScrollContent: {
    gap: 10,
    paddingRight: 4,
  },
  destinationLoadingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 16,
    backgroundColor: '#f8fbff',
    borderWidth: 1,
    borderColor: 'rgba(15, 23, 42, 0.06)',
  },
  destinationLoadingText: {
    color: '#64748b',
    fontSize: 13,
    fontWeight: '600',
  },
  destinationChip: {
    width: 170,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: '#f8fbff',
    borderWidth: 1,
    borderColor: 'rgba(15, 23, 42, 0.06)',
  },
  destinationChipSelected: {
    backgroundColor: '#fff7df',
    borderColor: ACCENT,
  },
  destinationChipTitle: {
    color: '#0f172a',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 4,
  },
  destinationChipTitleSelected: {
    color: TEXT_DARK,
  },
  destinationChipSubtitle: {
    color: '#64748b',
    fontSize: 12,
    fontWeight: '600',
  },
  destinationChipSubtitleSelected: {
    color: '#7c5b00',
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  categoryChip: {
    width: '31.5%',
    minHeight: 58,
    borderRadius: 16,
    backgroundColor: '#f8fbff',
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 8,
  },
  categoryChipSelected: {
    backgroundColor: '#f5efff',
  },
  categoryText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748b',
    textAlign: 'center',
  },
  pressedOpacity: {
    opacity: 0.85,
  },
  pillRowWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
  },
  pill: {
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 999,
    backgroundColor: '#eef4ff',
  },
  pillSelected: {
    backgroundColor: SELECTED_BG,
  },
  pillText: {
    color: '#4b6280',
    fontSize: 13,
    fontWeight: '700',
  },
  pillTextSelected: {
    color: SELECTED_TEXT,
  },
  pricePill: {
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 999,
    backgroundColor: '#eef4ff',
  },
  pricePillText: {
    color: '#4b6280',
    fontSize: 13,
    fontWeight: '700',
  },
  smallPill: {
    minWidth: 34,
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 999,
    backgroundColor: '#eef4ff',
  },
  smallPillText: {
    color: '#4b6280',
    fontSize: 13,
    fontWeight: '700',
  },
  dateGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  halfField: {
    flex: 1,
  },
  dateInput: {
    backgroundColor: '#f8fbff',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: 'rgba(15, 23, 42, 0.06)',
  },
  dateInputText: {
    color: '#0f172a',
    fontSize: 15,
    fontWeight: '600',
  },
  placeholderText: {
    color: '#94a3b8',
    fontWeight: '500',
  },
  schedulePreviewCard: {
    marginTop: 12,
    backgroundColor: TIMELINE_BG_RGBA,
    borderRadius: 18,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  schedulePreviewTitle: {
    color: '#0f172a',
    fontWeight: '800',
    fontSize: 15,
  },
  schedulePreviewSubtitle: {
    color: '#64748b',
    fontSize: 12,
    marginTop: 2,
  },
  priceInputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fbff',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(15, 23, 42, 0.06)',
    overflow: 'hidden',
    marginBottom: 10,
  },
  pricePrefix: {
    width: 48,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: ACCENT,
  },
  pricePrefixText: {
    color: TEXT_DARK,
    fontSize: 20,
    fontWeight: '800',
  },
  priceInput: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 15,
    color: '#0f172a',
  },
  priceSuffix: {
    paddingRight: 14,
    color: '#64748b',
    fontWeight: '700',
  },
  summaryCard: {
    backgroundColor: TEXT_DARK,
    borderRadius: 20,
    overflow: 'hidden',
    marginTop: 6,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: TEXT_DARK,
  },
  summaryHeaderText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 13,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
  },
  summaryLabel: {
    color: '#c9daef',
    fontSize: 13,
    fontWeight: '600',
  },
  summaryValue: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    maxWidth: '55%',
    textAlign: 'right',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 18,
    alignItems: 'center',
  },
  backAction: {
    width: 54,
    height: 54,
    borderRadius: 18,
    backgroundColor: '#e6edf7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryAction: {
    flex: 1,
    height: 54,
    borderRadius: 18,
    backgroundColor: ACCENT,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  primaryActionText: {
    color: TEXT_DARK,
    fontSize: 15,
    fontWeight: '800',
  },
  publishAction: {
    flex: 1,
    height: 54,
    borderRadius: 18,
    backgroundColor: ACCENT,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  publishActionDisabled: {
    opacity: 0.7,
  },
  publishActionText: {
    color: TEXT_DARK,
    fontSize: 15,
    fontWeight: '800',
  },
  successHero: {
    paddingHorizontal: 20,
    paddingTop: 30,
    paddingBottom: 28,
    alignItems: 'center',
  },
  successBadge: {
    width: 74,
    height: 74,
    borderRadius: 37,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  successEyebrow: {
    color: '#cfe2ff',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.4,
  },
  successTitle: {
    color: '#FFFFFF',
    fontSize: 30,
    fontWeight: '900',
    marginTop: 8,
  },
  successSubtitle: {
    color: '#d4e4f7',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 20,
    marginTop: 10,
    maxWidth: 320,
  },
  successCard: {
    margin: 16,
    marginTop: -18,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    padding: 18,
    shadowColor: '#0f172a',
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
  successCardLabel: {
    color: '#3152c5',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.1,
    marginBottom: 6,
  },
  successCardTitle: {
    color: '#0f172a',
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  successMetaRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
    marginTop: 14,
    marginBottom: 16,
  },
  metaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: TIMELINE_BG_RGBA,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 999,
    maxWidth: '100%',
  },
  metaPillText: {
    color: TEXT_DARK,
    fontSize: 12,
    fontWeight: '700',
    maxWidth: 110,
  },
  timelineSection: {
    marginTop: 14,
  },
  timelineHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  timelineHeading: {
    color: '#0f172a',
    fontSize: 16,
    fontWeight: '800',
  },
  addDayButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: SELECTED_BG,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  addDayButtonText: {
    color: SELECTED_TEXT,
    fontSize: 13,
    fontWeight: '800',
    marginLeft: 6,
  },
  timelineEmpty: {
    color: '#64748b',
    fontSize: 13,
    paddingVertical: 10,
  },
  dayCard: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(15,23,42,0.04)',
    marginBottom: 10,
  },
  dayIndexWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: TIMELINE_BG_RGBA,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayIndex: {
    color: TEXT_DARK,
    fontWeight: '800',
  },
  dayCardContent: {
    flex: 1,
  },
  dayTitleInput: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 8,
  },
  dayNotesInput: {
    backgroundColor: '#f8fbff',
    borderRadius: 10,
    padding: 10,
    fontSize: 13,
    color: '#0f172a',
  },
  formInput: {
    backgroundColor: '#f8fbff',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#0f172a',
    borderWidth: 1,
    borderColor: 'rgba(15,23,42,0.06)',
  },
  dayDeleteButton: {
    marginLeft: 8,
    padding: 6,
  },
  hotelSelectorWrap: {
    marginTop: 12,
    gap: 8,
  },
  hotelLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748b',
    marginLeft: 4,
  },
  hotelListScroll: {
    flexGrow: 0,
  },
  hotelChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f0f4f8',
    borderWidth: 1,
    borderColor: '#d1d5db',
    marginRight: 8,
  },
  hotelChipSelected: {
    backgroundColor: ACCENT,
    borderColor: ACCENT,
  },
  hotelChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  hotelChipTextSelected: {
    color: TEXT_DARK,
  },
  noHotelsText: {
    fontSize: 12,
    color: '#94a3b8',
    fontStyle: 'italic',
    marginLeft: 4,
  },
  placeRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  placeInput: {
    backgroundColor: '#f8fbff',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 13,
    color: '#0f172a',
    borderWidth: 1,
    borderColor: 'rgba(15,23,42,0.06)'
  },
  placeRemoveButton: {
    marginLeft: 8,
    padding: 8,
  },
  successPrimaryButton: {
    height: 52,
    borderRadius: 16,
    backgroundColor: ACCENT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successPrimaryButtonText: {
    color: TEXT_DARK,
    fontSize: 15,
    fontWeight: '800',
  },
  successSecondaryButton: {
    height: 52,
    borderRadius: 16,
    backgroundColor: '#eef4ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  successSecondaryButtonText: {
    color: TEXT_DARK,
    fontSize: 15,
    fontWeight: '800',
  },
  twoColRow: {
    flexDirection: 'row',
    gap: 12,
  },
  col: {
    flex: 1,
  },
});
