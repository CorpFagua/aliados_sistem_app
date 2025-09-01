import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import Header from '@/components/Header';

export default function PendingPickups() {
  return (
    <View style={styles.container}>
      <FlatList
        data={[]} // Aquí irán los pedidos pendientes
        contentContainerStyle={styles.content}
        renderItem={({ item }) => (
          <View style={styles.orderCard}>
            <Text style={styles.pickupTime}>Recoger a las: {item.pickupTime}</Text>
            <Text style={styles.storeTitle}>{item.store}</Text>
            <TouchableOpacity style={styles.pickupButton}>
              <Text style={styles.pickupButtonText}>Marcar como Recogido</Text>
            </TouchableOpacity>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    padding: 15,
  },
  orderCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  pickupTime: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  storeTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  pickupButton: {
    backgroundColor: '#FFD700',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  pickupButtonText: {
    color: '#000',
    fontWeight: '600',
  },
});