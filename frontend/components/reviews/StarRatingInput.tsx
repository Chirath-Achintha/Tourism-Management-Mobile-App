import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface StarRatingInputProps {
  rating: number;
  onRatingChange: (rating: number) => void;
  size?: number;
}

export const StarRatingInput: React.FC<StarRatingInputProps> = ({ 
  rating, 
  onRatingChange,
  size = 40 
}) => {
  return (
    <View style={styles.container}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Pressable 
          key={star} 
          onPress={() => onRatingChange(star)}
          style={styles.star}
        >
          <Ionicons 
            name={star <= rating ? "star" : "star-outline"} 
            size={size} 
            color={star <= rating ? "#FFD166" : "rgba(26, 59, 47, 0.1)"} 
          />
        </Pressable>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginVertical: 12,
  },
  star: {
    padding: 4,
  },
});
