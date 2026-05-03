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
  const isEditMode = !!initialData;

  const [name, setName] = useState(initialData?.name || '');
  const [experience, setExperience] = useState(initialData?.experience || '');
  const [language, setLanguage] = useState(initialData?.language || '');
  const [contact, setContact] = useState(initialData?.contact || '');
  const [image, setImage] = useState<string | null>(initialData?.imageUrl || null);
  // Account fields — only for create mode
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

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

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const passwordValid = password.length >= 6;

  const isFormValid = useMemo(() => {
    const base =
      name.trim() !== '' &&
      experience.trim() !== '' &&
      language.trim() !== '' &&
      /^[0-9]{10}$/.test(contact.trim()) &&
      image !== null;
    if (isEditMode) return base;
    return base && emailValid && passwordValid;
  }, [name, experience, language, contact, image, email, password, isEditMode]);

  const handleSubmit = () => {
    if (!isFormValid) return;

    const formData = new FormData();
    formData.append('name', name);
    formData.append('experience', experience);
    formData.append('language', language);
    formData.append('contact', contact);

    // Only append account fields in create mode
    if (!isEditMode) {
      formData.append('email', email.trim().toLowerCase());
      formData.append('password', password);
    }

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
      <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="e.g. John Doe" />

      <Text style={styles.inputLabel}>Experience</Text>
      <TextInput style={styles.input} value={experience} onChangeText={setExperience} placeholder="e.g. 5 Years" />

      <Text style={styles.inputLabel}>Languages Spoken</Text>
      <TextInput style={styles.input} value={language} onChangeText={setLanguage} placeholder="e.g. English, Spanish" />

      <Text style={styles.inputLabel}>Contact Number (10 digits)</Text>
      <TextInput
        style={styles.input}
        value={contact}
        onChangeText={setContact}
        placeholder="e.g. 0771234567"
        keyboardType="phone-pad"
      />

      {/* Account credentials — create mode only */}
      {!isEditMode && (
        <>
          <View style={styles.sectionDivider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerLabel}>Login Account</Text>
            <View style={styles.dividerLine} />
          </View>

          <Text style={styles.inputLabel}>Email Address</Text>
          <TextInput
            style={[styles.input, email.length > 0 && !emailValid && styles.inputError]}
            value={email}
            onChangeText={setEmail}
            placeholder="e.g. guide@email.com"
            keyboardType="email-address"
            autoCapitalize="none"
          />
          {email.length > 0 && !emailValid && (
            <Text style={styles.fieldError}>Enter a valid email address</Text>
          )}

          <Text style={styles.inputLabel}>Password</Text>
          <View style={styles.passwordRow}>
            <TextInput
              style={[styles.input, styles.passwordInput, password.length > 0 && !passwordValid && styles.inputError]}
              value={password}
              onChangeText={setPassword}
              placeholder="Min 6 characters"
              secureTextEntry={!showPassword}
            />
            <Pressable style={styles.eyeBtn} onPress={() => setShowPassword(!showPassword)}>
              <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color="rgba(26,59,47,0.5)" />
            </Pressable>
          </View>
          {password.length > 0 && !passwordValid && (
            <Text style={styles.fieldError}>Password must be at least 6 characters</Text>
          )}
        </>
      )}

      <View style={styles.validationHint}>
        {!isFormValid && (
          <Text style={styles.hintText}>
            {isEditMode
              ? '* Please fill all fields, select an image, and enter a valid 10-digit contact number.'
              : '* Please fill all fields including a valid email and password (min 6 chars).'}
          </Text>
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
  formContainer: { paddingBottom: 24 },
  inputLabel: {
    fontSize: 14, fontWeight: '800', color: '#1A3B2F',
    marginBottom: 8, marginTop: 16,
  },
  input: {
    backgroundColor: '#F0FAF5', borderRadius: 16, padding: 16,
    fontSize: 14, color: '#1A3B2F',
    borderWidth: 1, borderColor: 'rgba(26, 59, 47, 0.05)',
  },
  inputError: {
    borderColor: '#EF4444',
    borderWidth: 1.5,
  },
  fieldError: {
    fontSize: 12, color: '#EF4444', fontWeight: '600', marginTop: 4, paddingLeft: 4,
  },
  imagePicker: {
    width: 120, height: 120, backgroundColor: '#F0FAF5',
    borderRadius: 60, borderStyle: 'dashed', borderWidth: 2,
    borderColor: 'rgba(26, 59, 47, 0.1)', overflow: 'hidden',
    justifyContent: 'center', alignItems: 'center',
    alignSelf: 'center', marginTop: 8,
  },
  previewImage: { width: '100%', height: '100%' },
  pickerPlaceholder: { alignItems: 'center', justifyContent: 'center' },
  pickerText: {
    fontSize: 10, fontWeight: '700',
    color: 'rgba(26, 59, 47, 0.4)', marginTop: 4,
  },
  sectionDivider: {
    flexDirection: 'row', alignItems: 'center',
    marginTop: 24, marginBottom: 4, gap: 10,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: 'rgba(26,59,47,0.1)' },
  dividerLabel: {
    fontSize: 12, fontWeight: '800', color: 'rgba(26,59,47,0.4)',
    textTransform: 'uppercase', letterSpacing: 1,
  },
  passwordRow: { position: 'relative' },
  passwordInput: { paddingRight: 50 },
  eyeBtn: {
    position: 'absolute', right: 14, top: 0, bottom: 0,
    justifyContent: 'center', alignItems: 'center',
  },
  validationHint: { marginTop: 16, paddingHorizontal: 4 },
  hintText: {
    fontSize: 12, color: '#FF4D4D',
    fontWeight: '700', fontStyle: 'italic',
  },
  buttonRow: { flexDirection: 'row', gap: 12, marginTop: 24 },
  btn: {
    flex: 1, paddingVertical: 16, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center',
  },
  cancelBtn: {
    backgroundColor: '#F0FAF5', borderWidth: 1,
    borderColor: 'rgba(26, 59, 47, 0.1)',
  },
  submitBtn: { backgroundColor: '#FFD166' },
  submitBtnDisabled: { opacity: 0.7 },
  cancelBtnText: { fontSize: 15, fontWeight: '800', color: '#1A3B2F' },
  submitBtnText: { fontSize: 15, fontWeight: '800', color: '#1A3B2F' },
});



