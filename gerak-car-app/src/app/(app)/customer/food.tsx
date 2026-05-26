import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function FoodScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Campus Food Express</Text>
        <Text style={styles.subtitle}>Order from local campus stalls</Text>
      </View>
      
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.emptyState}>
          <Ionicons name="fast-food-outline" size={64} color="#fca5a5" />
          <Text style={styles.emptyStateTitle}>No Restaurants Yet</Text>
          <Text style={styles.emptyStateDesc}>Restaurants will appear here once they are added to the database.</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  header: { backgroundColor: '#f97316', padding: 20, paddingTop: 60, paddingBottom: 30, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#fff' },
  subtitle: { fontSize: 16, color: 'rgba(255,255,255,0.9)', marginTop: 4 },
  scrollContent: { padding: 20, flexGrow: 1, justifyContent: 'center' },
  emptyState: { alignItems: 'center', backgroundColor: '#fff', padding: 30, borderRadius: 20, borderWidth: 1, borderColor: '#f3f4f6' },
  emptyStateTitle: { fontSize: 20, fontWeight: 'bold', color: '#1f2937', marginTop: 15, marginBottom: 8 },
  emptyStateDesc: { fontSize: 14, color: '#6b7280', textAlign: 'center', lineHeight: 20 }
});
