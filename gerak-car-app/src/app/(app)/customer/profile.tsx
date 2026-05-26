import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { supabase } from '../../../../utils/supabase';
import { Ionicons } from '@expo/vector-icons';

export default function ProfileScreen() {
  const handleSignOut = () => {
    supabase.auth.signOut();
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatarPlaceholder}>
          <Ionicons name="person" size={40} color="#9ca3af" />
        </View>
        <Text style={styles.name}>Ahmad Faiz</Text>
        <Text style={styles.email}>ahmad.faiz@student.university.edu.my</Text>
      </View>
      
      <View style={styles.menu}>
        <TouchableOpacity style={styles.menuItem}>
          <Ionicons name="settings-outline" size={24} color="#4b5563" />
          <Text style={styles.menuText}>Settings</Text>
          <Ionicons name="chevron-forward" size={24} color="#d1d5db" style={{ marginLeft: 'auto' }} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuItem}>
          <Ionicons name="time-outline" size={24} color="#4b5563" />
          <Text style={styles.menuText}>Order History</Text>
          <Ionicons name="chevron-forward" size={24} color="#d1d5db" style={{ marginLeft: 'auto' }} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuItem} onPress={handleSignOut}>
          <Ionicons name="log-out-outline" size={24} color="#ef4444" />
          <Text style={[styles.menuText, { color: '#ef4444' }]}>Sign Out</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  header: { backgroundColor: '#fff', padding: 30, paddingTop: 60, alignItems: 'center', borderBottomWidth: 1, borderColor: '#f3f4f6' },
  avatarPlaceholder: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#f3f4f6', justifyContent: 'center', alignItems: 'center', marginBottom: 15 },
  name: { fontSize: 24, fontWeight: 'bold', color: '#1f2937', marginBottom: 4 },
  email: { fontSize: 14, color: '#6b7280' },
  menu: { marginTop: 20, backgroundColor: '#fff', borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#f3f4f6' },
  menuItem: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderColor: '#f3f4f6' },
  menuText: { fontSize: 16, color: '#1f2937', marginLeft: 15, fontWeight: '500' }
});
