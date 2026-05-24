import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { supabase } from '../../../utils/supabase';

export default function DriverDashboard() {
  const [isOnline, setIsOnline] = useState(false);

  const handleSignOut = () => {
    supabase.auth.signOut();
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Driver Map</Text>
        <TouchableOpacity 
          style={[styles.toggleBtn, isOnline ? styles.online : styles.offline]}
          onPress={() => setIsOnline(!isOnline)}
        >
          <Text style={styles.toggleText}>{isOnline ? 'GO OFFLINE' : 'GO ONLINE'}</Text>
        </TouchableOpacity>
      </View>
      
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
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#111' },
  toggleBtn: { paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20 },
  online: { backgroundColor: '#10b981' },
  offline: { backgroundColor: '#6b7280' },
  toggleText: { color: '#fff', fontWeight: 'bold', fontSize: 12 },
  mapPlaceholder: { flex: 1, backgroundColor: '#e5e7eb', borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  mapText: { color: '#9ca3af', fontWeight: 'bold' },
  button: { backgroundColor: '#ef4444', padding: 15, borderRadius: 8, alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: 'bold' }
});
