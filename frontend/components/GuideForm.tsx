import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  Image,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

interface GuideFormProps {
  initialData?: {
    name: string;
    experience: string;
    language: string;
    contact: string;
    imageUrl: string;
  };
  onSubmit: (formData: FormData) => Promise<void>;
  onCancel: () => void;
  submitting: boolean;
}

export const GuideForm = ({ initialData, onSubmit, onCancel, submitting }: GuideFormProps) => {
  const [name, setName] = useState(initialData?.name || '');
  const [experience, setExperience] = useState(initialData?.experience || '');
  const [language, setLanguage] = useState(initialData?.language || '');
  const [contact, setContact] = useState(initialData?.contact || '');
  const [image, setImage] = useState<string | null>(initialData?.imageUrl || null);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  const isFormValid = useMemo(() => {
    return name.trim() !== '' &&
           experience.trim() !== '' &&
           language.trim() !== '' &&
           /^[0-9]{10}$/.test(contact.trim()) &&
           image !== null;
  }, [name, experience, language, contact, image]);

  const handleSubmit = () => {
    if (!isFormValid) return;

    const formData = new FormData();
    formData.append('name', name);
    formData.append('experience', experience);
    formData.append('language', language);
    formData.append('contact', contact);

    if (image && !image.startsWith('http')) {
      const filename = image.split('/').pop() || 'guide.jpg';
      const match = /\.(\w+)$/.exec(filename);
      let type = match ? `image/${match[1]}` : `image`;
      if (type === 'image/jpg') type = 'image/jpeg';

      if (Platform.OS === 'web') {
        fetch(image)
          .then(res => res.blob())
          .then(blob => {
            formData.append('image', blob, filename);
            onSubmit(formData);
          });
        return;
      } else {
        formData.append('image', {
          uri: image,
          name: filename,
          type,
        } as any);
      }
    } else if (image && image.startsWith('http')) {
      formData.append('existingImage', image);
    }

    onSubmit(formData);
  };

  return (
    <View style={styles.formContainer}>
      <Text style={styles.inputLabel}>Guide Image</Text>
      <Pressable style={styles.imagePicker} onPress={pickImage}>
        {image ? (
          <Image source={{ uri: image }} style={styles.previewImage} />
        ) : (
          <View style={styles.pickerPlaceholder}>
            <Ionicons name="camera-outline" size={32} color="rgba(26, 59, 47, 0.4)" />
            <Text style={styles.pickerText}>Tap to select</Text>
          </View>
        )}
      </Pressable>

      <Text style={styles.inputLabel}>Full Name</Text>
      <TextInput
        style={styles.input}
        value={name}
        onChangeText={setName}
        placeholder="e.g. John Doe"
      />

      <Text style={styles.inputLabel}>Experience</Text>
      <TextInput
        style={styles.input}
        value={experience}
        onChangeText={setExperience}
        placeholder="e.g. 5 Years"
      />

      <Text style={styles.inputLabel}>Languages Spoken</Text>
      <TextInput
        style={styles.input}
        value={language}
        onChangeText={setLanguage}
        placeholder="e.g. English, Spanish"
      />

      <Text style={styles.inputLabel}>Contact Number</Text>
      <TextInput
        style={styles.input}
        value={contact}
        onChangeText={setContact}
        placeholder="e.g. +1 234 567 8900"
        keyboardType="phone-pad"
      />

      <View style={styles.validationHint}>
        {!isFormValid && (
          <Text style={styles.hintText}>* Please fill all fields, select an image, and enter a valid 10-digit contact number.</Text>
        )}
      </View>

      <View style={styles.buttonRow}>
        <Pressable style={[styles.btn, styles.cancelBtn]} onPress={onCancel} disabled={submitting}>
          <Text style={styles.cancelBtnText}>Cancel</Text>
        </Pressable>
        <Pressable
          style={[styles.btn, styles.submitBtn, (submitting || !isFormValid) && styles.submitBtnDisabled]}
          onPress={handleSubmit}
          disabled={submitting || !isFormValid}
        >
          {submitting ? (
            <ActivityIndicator color="#1A3B2F" />
          ) : (
            <Text style={styles.submitBtnText}>{initialData ? 'Update Guide' : 'Add Guide'}</Text>
          )}
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  formContainer: {
    paddingBottom: 24,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1A3B2F',
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    backgroundColor: '#F0FAF5',
    borderRadius: 16,
    padding: 16,
    fontSize: 14,
    color: '#1A3B2F',
    borderWidth: 1,
    borderColor: 'rgba(26, 59, 47, 0.05)',
  },
  imagePicker: {
    width: 120,
    height: 120,
    backgroundColor: '#F0FAF5',
    borderRadius: 60,
    borderStyle: 'dashed',
    borderWidth: 2,
    borderColor: 'rgba(26, 59, 47, 0.1)',
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginTop: 8,
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  pickerPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  pickerText: {
    fontSize: 10,
    fontWeight: '700',
    color: 'rgba(26, 59, 47, 0.4)',
    marginTop: 4,
  },
  validationHint: {
    marginTop: 16,
    paddingHorizontal: 4,
  },
  hintText: {
    fontSize: 12,
    color: '#FF4D4D',
    fontWeight: '700',
    fontStyle: 'italic',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  btn: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtn: {
    backgroundColor: '#F0FAF5',
    borderWidth: 1,
    borderColor: 'rgba(26, 59, 47, 0.1)',
  },
  submitBtn: {
    backgroundColor: '#FFD166',
  },
  submitBtnDisabled: {
    opacity: 0.7,
  },
  cancelBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1A3B2F',
  },
  submitBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1A3B2F',
  },
});
