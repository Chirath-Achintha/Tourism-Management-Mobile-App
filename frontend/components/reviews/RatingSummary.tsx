import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface RatingSummaryProps {
  average: number;
  total: number;
  happyTravelers: number;
  satisfactionRate: number;
}

export const RatingSummary: React.FC<RatingSummaryProps> = ({ 
  average, 
  total, 
  happyTravelers, 
  satisfactionRate 
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.statItem}>
        <Text style={styles.statValue}>{average.toFixed(1)}/5</Text>
        <Text style={styles.statLabel}>AVERAGE{"\n"}RATING</Text>
      </View>

      <View style={styles.divider} />

      <View style={styles.statItem}>
        <Text style={styles.statValue}>{happyTravelers}+</Text>
        <Text style={styles.statLabel}>HAPPY{"\n"}TRAVELERS</Text>
      </View>

      <View style={styles.divider} />

      <View style={styles.statItem}>
        <Text style={styles.statValue}>{satisfactionRate}%</Text>
        <Text style={styles.statLabel}>SATISFACTION{"\n"}RATE</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 24,
    marginBottom: 20,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 26,
    fontWeight: '900',
    color: '#1A3B2F',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 10,
    color: '#769440',
    fontWeight: '900',
    textAlign: 'center',
    lineHeight: 12,
    letterSpacing: 0.5,
  },
  divider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
});
