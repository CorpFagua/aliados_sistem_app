import React from 'react';
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity, Modal } from 'react-native';
import { useAuth } from '@/providers/AuthProvider';
import Header from '@/components/Header';

export default function Profile() {
  const { session, logout } = useAuth();
  const user = session?.user;
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const handleLogout = () => {
    setShowLogoutModal(true);
  };

  const confirmLogout = () => {
    setShowLogoutModal(false);
    logout();
  };

  const cancelLogout = () => {
    setShowLogoutModal(false);
  };

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
          onPress={handleLogout}
        >
          <Text style={styles.logoutText}>Cerrar Sesión</Text>
        </TouchableOpacity>

        {/* Modal de confirmación */}
        <Modal visible={showLogoutModal} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Cerrar Sesión</Text>
              <Text style={styles.modalMessage}>
                ¿Estás seguro que deseas cerrar sesión?
              </Text>
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={cancelLogout}
                >
                  <Text style={styles.cancelButtonText}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.confirmButton]}
                  onPress={confirmLogout}
                >
                  <Text style={styles.confirmButtonText}>Cerrar Sesión</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    width: '80%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 10,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
    marginBottom: 12,
  },
  modalMessage: {
    fontSize: 16,
    color: '#666',
    marginBottom: 24,
    lineHeight: 24,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#e5e5e5',
  },
  cancelButtonText: {
    color: '#000',
    fontSize: 14,
    fontWeight: '600',
  },
  confirmButton: {
    backgroundColor: '#DC2626',
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});