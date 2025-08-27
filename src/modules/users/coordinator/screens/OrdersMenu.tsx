import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';

export default function OrdersMenu() {
  const [activeTab, setActiveTab] = useState('pending');

  return (
    <View style={styles.container}>
      <ScrollView style={styles.ordersContainer}>
        {activeTab === 'pending' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Pedidos Pendientes (3)</Text>
            {/* Aquí el contenido de pedidos pendientes */}
          </View>
        )}

        {activeTab === 'inProcess' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Pedidos en Proceso (2)</Text>
            {/* Aquí el contenido de pedidos en proceso */}
          </View>
        )}

        {activeTab === 'completed' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Pedidos Completados (5)</Text>
            {/* Aquí el contenido de pedidos completados */}
          </View>
        )}
      </ScrollView>

      <View style={styles.bottomNav}>
        <TouchableOpacity 
          style={[styles.navButton, activeTab === 'pending' && styles.activeTab]}
          onPress={() => setActiveTab('pending')}
        >
          <Text style={[styles.navItem, activeTab === 'pending' && styles.activeText]}>
            Pendientes
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.navButton, activeTab === 'inProcess' && styles.activeTab]}
          onPress={() => setActiveTab('inProcess')}
        >
          <Text style={[styles.navItem, activeTab === 'inProcess' && styles.activeText]}>
            En Proceso
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.navButton, activeTab === 'completed' && styles.activeTab]}
          onPress={() => setActiveTab('completed')}
        >
          <Text style={[styles.navItem, activeTab === 'completed' && styles.activeText]}>
            Completados
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  ordersContainer: {
    flex: 1,
    padding: 15,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
  },
  section: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2563EB',
    marginBottom: 15,
  },
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  navButton: {
    flex: 1,
    padding: 15,
    alignItems: 'center',
  },
  navItem: {
    fontSize: 16,
    color: '#666',
  },
  activeTab: {
    borderTopWidth: 2,
    borderTopColor: '#2563EB',
    backgroundColor: '#f8fafc',
  },
  activeText: {
    color: '#2563EB',
    fontWeight: '600',
  },
});