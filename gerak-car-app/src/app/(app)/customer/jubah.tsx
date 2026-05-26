import React from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function JubahScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Jubah Delivery</Text>
        <Text style={styles.subtitle}>Convocation Robe Services</Text>
      </View>
      
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Order Details</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Student ID</Text>
            <TextInput style={styles.input} placeholder="e.g. WIF210045" placeholderTextColor="#9ca3af" />
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Jubah Size</Text>
            <View style={styles.sizeRow}>
              {['S', 'M', 'L', 'XL'].map(size => (
                <TouchableOpacity key={size} style={styles.sizeButton}>
                  <Text style={styles.sizeButtonText}>{size}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Delivery Address</Text>
            <TextInput style={[styles.input, styles.textArea]} placeholder="Enter full delivery address" multiline numberOfLines={3} placeholderTextColor="#9ca3af" />
          </View>

          <TouchableOpacity style={styles.submitButton}>
            <Text style={styles.submitButtonText}>Request Delivery (RM10.00)</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  header: { backgroundColor: '#3b82f6', padding: 20, paddingTop: 60, paddingBottom: 30, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#fff' },
  subtitle: { fontSize: 16, color: 'rgba(255,255,255,0.9)', marginTop: 4 },
  scrollContent: { padding: 20 },
  card: { backgroundColor: '#fff', borderRadius: 20, padding: 20, elevation: 2, shadowColor: '#000', shadowOffset: {width: 0, height: 2}, shadowOpacity: 0.05, shadowRadius: 8 },
  cardTitle: { fontSize: 18, fontWeight: 'bold', color: '#1f2937', marginBottom: 20 },
  inputGroup: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: 'bold', color: '#4b5563', marginBottom: 8 },
  input: { backgroundColor: '#f3f4f6', borderRadius: 12, padding: 15, fontSize: 16, color: '#1f2937' },
  textArea: { height: 100, textAlignVertical: 'top' },
  sizeRow: { flexDirection: 'row', gap: 10 },
  sizeButton: { flex: 1, backgroundColor: '#f3f4f6', paddingVertical: 12, borderRadius: 12, alignItems: 'center' },
  sizeButtonText: { fontWeight: 'bold', color: '#4b5563', fontSize: 16 },
  submitButton: { backgroundColor: '#3b82f6', padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 10 },
  submitButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 }
});
