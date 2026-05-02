import React from 'react';
import { View, Text, StyleSheet, Image, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface GuideCardProps {
  guide: {
    _id: string;
    name: string;
    experience: string;
    language: string;
    contact: string;
    imageUrl: string;
  };
  onEdit?: (guide: any) => void;
  onDelete?: (id: string) => void;
}

export const GuideCard = ({ guide, onEdit, onDelete }: GuideCardProps) => {
  return (
    <View style={styles.card}>
      <Image source={{ uri: guide.imageUrl }} style={styles.cardImage} />
      <View style={styles.cardContent}>
        <Text style={styles.cardName}>{guide.name}</Text>
        
        <View style={styles.infoRow}>
          <Ionicons name="time-outline" size={16} color="rgba(26, 59, 47, 0.6)" />
          <Text style={styles.infoText}>{guide.experience}</Text>
        </View>

        <View style={styles.infoRow}>
          <Ionicons name="language-outline" size={16} color="rgba(26, 59, 47, 0.6)" />
          <Text style={styles.infoText}>{guide.language}</Text>
        </View>

        <View style={styles.infoRow}>
          <Ionicons name="call-outline" size={16} color="rgba(26, 59, 47, 0.6)" />
          <Text style={styles.infoText}>{guide.contact}</Text>
        </View>

        {(onEdit || onDelete) && (
          <View style={styles.actionRow}>
            {onEdit && (
              <Pressable style={styles.actionBtn} onPress={() => onEdit(guide)}>
                <Ionicons name="create-outline" size={18} color="#1A3B2F" />
                <Text style={styles.actionBtnText}>Edit</Text>
              </Pressable>
            )}
            {onDelete && (
              <Pressable style={[styles.actionBtn, { borderColor: '#FF4D4D' }]} onPress={() => onDelete(guide._id)}>
                <Ionicons name="trash-outline" size={18} color="#FF4D4D" />
                <Text style={[styles.actionBtnText, { color: '#FF4D4D' }]}>Delete</Text>
              </Pressable>
            )}
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(26, 59, 47, 0.08)',
    flexDirection: 'row',
    minHeight: 140,
  },
  cardImage: {
    width: 130,
    height: '100%',
    backgroundColor: '#F0FAF5',
  },
  cardContent: {
    flex: 1,
    padding: 16,
    gap: 6,
    justifyContent: 'center',
  },
  cardName: {
    fontSize: 18,
    fontWeight: '900',
    color: '#1A3B2F',
    marginBottom: 4,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoText: {
    fontSize: 14,
    color: 'rgba(26, 59, 47, 0.8)',
    fontWeight: '500',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(26, 59, 47, 0.1)',
    gap: 6,
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1A3B2F',
  },
});
