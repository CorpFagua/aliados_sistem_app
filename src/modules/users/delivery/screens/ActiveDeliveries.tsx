import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import Header from '@/components/Header';

const mockDeliveries = [
  {
    id: '1',
    status: 'En Camino',
    store: 'Restaurante El Sabor',
    address: 'Calle 123 #45-67, Apto 502',
    customerName: 'Juan Pérez',
    phone: '300-123-4567',
    orderDetails: 'Pedido #A123',
    estimatedTime: '15 min'
  },
  {
    id: '2',
    status: 'Recogido',
    store: 'Farmacia Central',
    address: 'Carrera 78 #90-12',
    customerName: 'María López',
    phone: '310-987-6543',
    orderDetails: 'Pedido #B456',
    estimatedTime: '20 min'
  }
];

export default function ActiveDeliveries() {
  return (
    <View style={styles.container}>
      <Header />
      <FlatList
        data={mockDeliveries}
        contentContainerStyle={styles.content}
        renderItem={({ item }) => (
          <View style={styles.deliveryCard}>
            <View style={styles.statusBar}>
              <Text style={styles.statusText}>{item.status}</Text>
              <Text style={styles.estimatedTime}>Tiempo est.: {item.estimatedTime}</Text>
            </View>
            
            <Text style={styles.storeTitle}>{item.store}</Text>
            <Text style={styles.orderDetails}>{item.orderDetails}</Text>
            
            <View style={styles.divider} />
            
            <Text style={styles.destinationTitle}>Destino:</Text>
            <Text style={styles.address}>{item.address}</Text>
            
            <View style={styles.customerInfo}>
              <Text style={styles.customerName}>{item.customerName}</Text>
              <Text style={styles.customerPhone}>{item.phone}</Text>
            </View>

            <TouchableOpacity style={styles.completeButton}>
              <Text style={styles.completeButtonText}>Marcar como Entregado</Text>
            </TouchableOpacity>
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
  deliveryCard: {
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
  statusBar: {
    backgroundColor: '#FFD700',
    padding: 8,
    borderRadius: 6,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusText: {
    textAlign: 'center',
    fontWeight: '600',
  },
  estimatedTime: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  storeTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#333',
  },
  orderDetails: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 10,
  },
  destinationTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 5,
  },
  address: {
    fontSize: 14,
    color: '#666',
    marginBottom: 15,
  },
  customerInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
    backgroundColor: '#f8fafc',
    padding: 10,
    borderRadius: 6,
  },
  customerName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  customerPhone: {
    fontSize: 14,
    color: '#2563EB',
    fontWeight: '500',
  },
  completeButton: {
    backgroundColor: '#2563EB',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  completeButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
});