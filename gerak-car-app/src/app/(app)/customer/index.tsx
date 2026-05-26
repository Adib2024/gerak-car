import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function CustomerDashboard() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <ScrollView style={styles.container} contentContainerStyle={{ padding: 20 }}>
        
        {/* Header Section */}
        <View style={styles.header}>
          <View>
            <Text style={styles.logoText}>GERAK</Text>
            <Text style={styles.logoSubText}>SMART</Text>
            <Text style={styles.logoSubText}>CAMPUS</Text>
          </View>
          <View style={styles.headerRight}>
            <View style={styles.balanceBadge}>
              <Ionicons name="wallet-outline" size={16} color="#4b5563" />
              <Text style={styles.balanceText}>RM55.50</Text>
              <Ionicons name="add-circle" size={18} color="#ef4444" />
            </View>
            <View style={styles.pointsBadge}>
              <Ionicons name="ribbon-outline" size={16} color="#ca8a04" />
              <Text style={styles.pointsText}>340 pts</Text>
            </View>
            <TouchableOpacity style={styles.bellIcon}>
              <Ionicons name="notifications-outline" size={24} color="#4b5563" />
              <View style={styles.notificationDot}>
                <Text style={styles.notificationDotText}>2</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Green Verified Card */}
        <View style={styles.verifiedCard}>
          <View style={styles.verifiedHeader}>
            <View style={styles.verifiedBadge}>
              <Ionicons name="checkmark-circle" size={14} color="#10b981" />
              <Text style={styles.verifiedBadgeText}>VERIFIED CAMPUS ACCOUNT</Text>
            </View>
            <Text style={styles.studentId}>WIF210045</Text>
          </View>
          <Text style={styles.greetingText}>Hello, Ahmad Faiz!</Text>
          <Text style={styles.greetingSubText}>Where would you like to gerak today?</Text>
          
          <View style={styles.cardStatsRow}>
            <View style={styles.cardStatBox}>
              <Text style={styles.cardStatLabel}>GERAKPAY CREDIT</Text>
              <Text style={styles.cardStatValue}>RM55.50</Text>
            </View>
            <View style={styles.cardStatBox}>
              <Text style={styles.cardStatLabel}>CAMPUS REWARDS</Text>
              <Text style={styles.cardStatValue}>340 pts</Text>
            </View>
          </View>
        </View>

        {/* Orange Food Deal Banner */}
        <View style={styles.foodBanner}>
          <View style={styles.foodBannerHeader}>
            <View style={styles.foodBannerBadge}>
              <Text style={styles.foodBannerBadgeText}>FOOD DEAL</Text>
            </View>
            <Ionicons name="megaphone-outline" size={20} color="#fff" />
          </View>
          <Text style={styles.foodBannerTitle}>Kampus Food Express</Text>
          <Text style={styles.foodBannerDesc}>Enjoy RM3.00 flat delivery fees across all college dormitories. Browse local stalls now.</Text>
        </View>

        {/* Campus Modules */}
        <Text style={styles.sectionTitle}>CAMPUS MODULES</Text>

        <TouchableOpacity style={styles.moduleCard} onPress={() => router.push('/(app)/customer/ride')}>
          <View style={[styles.moduleIconContainer, { backgroundColor: '#fee2e2' }]}>
             <Ionicons name="car" size={28} color="#ef4444" />
          </View>
          <View style={styles.moduleTextContainer}>
            <Text style={styles.moduleTitle}>Campus Shuttles</Text>
            <Text style={styles.moduleDesc}>Book point-to-point campus travel. Live path tracking.</Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color="#d1d5db" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.moduleCard} onPress={() => router.push('/(app)/customer/jubah')}>
          <View style={[styles.moduleIconContainer, { backgroundColor: '#dbeafe' }]}>
             <Ionicons name="school" size={28} color="#3b82f6" />
          </View>
          <View style={styles.moduleTextContainer}>
            <Text style={styles.moduleTitle}>Jubah Delivery</Text>
            <Text style={styles.moduleDesc}>Convocation robe size calculator, deliveries & returns.</Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color="#d1d5db" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.moduleCard} onPress={() => router.push('/(app)/customer/food')}>
          <View style={[styles.moduleIconContainer, { backgroundColor: '#fef3c7' }]}>
             <Ionicons name="fast-food" size={28} color="#f59e0b" />
          </View>
          <View style={styles.moduleTextContainer}>
            <Text style={styles.moduleTitle}>Campus Cafeteria</Text>
            <Text style={styles.moduleDesc}>Browse student cafe menus and order quick delivery.</Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color="#d1d5db" />
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f9fafb' },
  container: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 25, marginTop: 10 },
  logoText: { fontSize: 24, fontWeight: '900', color: '#111827', letterSpacing: 1 },
  logoSubText: { fontSize: 11, fontWeight: 'bold', color: '#ef4444', letterSpacing: 2, marginTop: -2 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  balanceBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20, gap: 4, elevation: 1, shadowColor: '#000', shadowOffset: {width: 0, height: 1}, shadowOpacity: 0.1, shadowRadius: 2 },
  balanceText: { fontWeight: 'bold', color: '#111827', fontSize: 13 },
  pointsBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fef3c7', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20, gap: 4 },
  pointsText: { fontWeight: 'bold', color: '#ca8a04', fontSize: 13 },
  bellIcon: { position: 'relative', marginLeft: 4 },
  notificationDot: { position: 'absolute', top: -4, right: -4, backgroundColor: '#ef4444', borderRadius: 10, width: 16, height: 16, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#f9fafb' },
  notificationDotText: { color: '#fff', fontSize: 9, fontWeight: 'bold' },
  
  verifiedCard: { backgroundColor: '#10b981', borderRadius: 24, padding: 20, marginBottom: 20, elevation: 4, shadowColor: '#10b981', shadowOffset: {width: 0, height: 4}, shadowOpacity: 0.3, shadowRadius: 8 },
  verifiedHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  verifiedBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12, gap: 4 },
  verifiedBadgeText: { color: '#fff', fontSize: 10, fontWeight: 'bold', letterSpacing: 0.5 },
  studentId: { color: 'rgba(255,255,255,0.9)', fontWeight: 'bold', fontSize: 12 },
  greetingText: { color: '#fff', fontSize: 26, fontWeight: 'bold', marginBottom: 4 },
  greetingSubText: { color: 'rgba(255,255,255,0.9)', fontSize: 14, marginBottom: 24 },
  cardStatsRow: { flexDirection: 'row', gap: 10 },
  cardStatBox: { flex: 1, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 16, padding: 16 },
  cardStatLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 10, fontWeight: 'bold', marginBottom: 4 },
  cardStatValue: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  
  foodBanner: { backgroundColor: '#f97316', borderRadius: 24, padding: 20, marginBottom: 30, elevation: 4, shadowColor: '#f97316', shadowOffset: {width: 0, height: 4}, shadowOpacity: 0.3, shadowRadius: 8 },
  foodBannerHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  foodBannerBadge: { backgroundColor: 'rgba(255,255,255,0.25)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  foodBannerBadgeText: { color: '#fff', fontSize: 11, fontWeight: 'bold' },
  foodBannerTitle: { color: '#fff', fontSize: 22, fontWeight: 'bold', marginBottom: 8 },
  foodBannerDesc: { color: 'rgba(255,255,255,0.95)', fontSize: 14, lineHeight: 20 },
  
  sectionTitle: { fontSize: 14, fontWeight: 'bold', color: '#9ca3af', letterSpacing: 1, marginBottom: 15, marginLeft: 5 },
  
  moduleCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 24, padding: 16, marginBottom: 15, elevation: 2, shadowColor: '#000', shadowOffset: {width: 0, height: 2}, shadowOpacity: 0.05, shadowRadius: 8 },
  moduleIconContainer: { width: 60, height: 60, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  moduleTextContainer: { flex: 1 },
  moduleTitle: { fontSize: 18, fontWeight: 'bold', color: '#1f2937', marginBottom: 4 },
  moduleDesc: { fontSize: 13, color: '#6b7280', lineHeight: 18 }
});
