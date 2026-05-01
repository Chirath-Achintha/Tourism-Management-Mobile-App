import React from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';

export default function EditTourPackageScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.text}>Edit Tour Package (Coming Soon)</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  text: {
    fontSize: 16,
    color: '#1A3B2F',
  },
});
