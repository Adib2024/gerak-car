import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { supabase } from '../../../../utils/supabase';

export default function RideScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Campus Shuttles</Text>
      <Text style={styles.subtitle}>Where do you want to go?</Text>
      
      <View style={styles.mapPlaceholder}>
         <Text style={styles.mapText}>[ Map Component Will Load Here ]</Text>
      </View>

      <TouchableOpacity style={styles.button}>
        <Text style={styles.buttonText}>Book Ride</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 20, paddingTop: 60 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#111' },
  subtitle: { fontSize: 16, color: '#666', marginBottom: 20 },
  mapPlaceholder: { flex: 1, backgroundColor: '#fee2e2', borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 20, borderWidth: 2, borderColor: '#fca5a5' },
  mapText: { color: '#ef4444', fontWeight: 'bold' },
  button: { backgroundColor: '#ef4444', padding: 15, borderRadius: 12, alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 }
});
