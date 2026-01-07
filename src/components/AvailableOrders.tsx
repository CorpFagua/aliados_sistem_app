import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import Header from '@/components/Header';

const mockOrders = [
  {
    id: '1',
    store: 'Tienda Centro',
    destination: 'Calle 123 #45-67',
    price: '15.000',
    distance: '2.5 km'
  },
  // Más pedidos de ejemplo...
];

export default function AvailableOrders() {
  return (
    <View style={styles.container}>
      <FlatList
        data={mockOrders}
        contentContainerStyle={styles.content}
        renderItem={({ item }) => (
          <View style={styles.orderCard}>
            <Text style={styles.storeTitle}>{item.store}</Text>
            <Text style={styles.orderDetail}>Destino: {item.destination}</Text>
            <View style={styles.orderFooter}>
              <Text style={styles.price}>$ {item.price}</Text>
              <Text style={styles.distance}>{item.distance}</Text>
            </View>
          </View>
        )}
        keyExtractor={item => item.id}
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
  storeTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  orderDetail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  price: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2563EB',
  },
  distance: {
    fontSize: 14,
    color: '#666',
  },
});