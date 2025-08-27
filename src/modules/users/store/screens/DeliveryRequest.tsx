import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  ScrollView 
} from 'react-native';
import Header from '@/components/Header';
import { useAuth } from '@/providers/AuthProvider';

export default function DeliveryRequest() {
  const [deliveryData, setDeliveryData] = useState({
    destinationAddress: '',
    recipientName: '',
    recipientPhone: '',
    packageDescription: '',
  });

  const handleSubmit = () => {
    // Aquí irá la lógica para enviar la solicitud
    console.log('Solicitud de domicilio:', deliveryData);
  };

  return (
    <View style={styles.container}>
      <Header />
      <ScrollView style={styles.content}>
        <Text style={styles.title}>Solicitar Domicilio</Text>

        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Dirección de Destino</Text>
            <TextInput
              style={styles.input}
              value={deliveryData.destinationAddress}
              onChangeText={(text) => setDeliveryData({...deliveryData, destinationAddress: text})}
              placeholder="Ingresa la dirección de entrega"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Nombre del Destinatario</Text>
            <TextInput
              style={styles.input}
              value={deliveryData.recipientName}
              onChangeText={(text) => setDeliveryData({...deliveryData, recipientName: text})}
              placeholder="Nombre de quien recibe"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Teléfono del Destinatario</Text>
            <TextInput
              style={styles.input}
              value={deliveryData.recipientPhone}
              onChangeText={(text) => setDeliveryData({...deliveryData, recipientPhone: text})}
              keyboardType="phone-pad"
              placeholder="Número de contacto"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Descripción del Paquete</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={deliveryData.packageDescription}
              onChangeText={(text) => setDeliveryData({...deliveryData, packageDescription: text})}
              placeholder="Describe el contenido del envío"
              multiline
              numberOfLines={4}
            />
          </View>

          <TouchableOpacity 
            style={styles.submitButton}
            onPress={handleSubmit}
          >
            <Text style={styles.submitButtonText}>Solicitar Domicilio</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
  },
  form: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    color: '#333',
    marginBottom: 8,
    fontWeight: '500',
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#F9FAFB',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  submitButton: {
    backgroundColor: '#FFD700',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  submitButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '600',
  },
});