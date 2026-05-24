import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { supabase } from '../../../utils/supabase';

export default function CustomerDashboard() {
  const handleSignOut = () => {
    supabase.auth.signOut();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Customer Map</Text>
      <Text style={styles.subtitle}>Where do you want to go?</Text>
      
      <View style={styles.mapPlaceholder}>
         <Text style={styles.mapText}>[ Map Component Will Load Here ]</Text>
      </View>

      <TouchableOpacity style={styles.button} onPress={handleSignOut}>
        <Text style={styles.buttonText}>Sign Out</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 20, paddingTop: 60 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#111' },
  subtitle: { fontSize: 16, color: '#666', marginBottom: 20 },
  mapPlaceholder: { flex: 1, backgroundColor: '#e5e7eb', borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  mapText: { color: '#9ca3af', fontWeight: 'bold' },
  button: { backgroundColor: '#ef4444', padding: 15, borderRadius: 8, alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: 'bold' }
});
