import React from 'react';
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity } from 'react-native';
import { useAuth } from '@/providers/AuthProvider';
import Header from '@/components/Header';

export default function Profile() {
  const { session, logout } = useAuth();
  const user = session?.user;

  return (
    <View style={styles.container}>
      <Header />
      <ScrollView style={styles.content}>
        <View style={styles.header}>
          <Image
            source={{ uri: user?.user_metadata?.avatar_url || 'https://via.placeholder.com/150' }}
            style={styles.avatar}
          />
          <Text style={styles.name}>{user?.user_metadata?.full_name || user?.email}</Text>
          <Text style={styles.email}>{user?.email}</Text>
        </View>
        
        <View style={styles.infoSection}>
          <Text style={styles.sectionTitle}>Información Personal</Text>
          <View style={styles.infoItem}>
            <Text style={styles.label}>Rol:</Text>
            <Text style={styles.value}>{user?.user_metadata?.role || 'No especificado'}</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.label}>Teléfono:</Text>
            <Text style={styles.value}>{user?.user_metadata?.phone || 'No especificado'}</Text>
          </View>
        </View>

        <TouchableOpacity 
          style={styles.logoutButton}
          onPress={logout}
        >
          <Text style={styles.logoutText}>Cerrar Sesión</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 15,
    backgroundColor: '#f0f0f0',
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
  },
  email: {
    fontSize: 16,
    color: '#666',
    marginTop: 5,
  },
  infoSection: {
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 15,
    color: '#333',
  },
  infoItem: {
    flexDirection: 'row',
    marginBottom: 10,
    padding: 10,
    backgroundColor: '#fff',
    borderRadius: 8,
  },
  label: {
    width: 100,
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  value: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  logoutButton: {
    backgroundColor: '#FEE2E2',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 30,
  },
  logoutText: {
    color: '#DC2626',
    fontSize: 16,
    fontWeight: '600',
  },
});