import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Modal } from 'react-native';
import { useAuth } from '@/providers/AuthProvider';

interface HeaderProps {
  onProfilePress?: () => void;
}

export default function Header({ onProfilePress }: HeaderProps) {
  const [menuVisible, setMenuVisible] = useState(false);
  const { logout, session } = useAuth();
  
  return (
    <View style={styles.container}>
      <Image
        source={require('../../assets/images/logo.png')}
        style={styles.logo}
        resizeMode="contain"
      />
      
      <TouchableOpacity 
        onPress={onProfilePress}
        style={styles.profileButton}
      >
        <Image
          source={{ 
            uri: session?.user?.user_metadata?.avatar_url || 
                 'https://via.placeholder.com/40'
          }}
          style={styles.profileImage}
        />
      </TouchableOpacity>

      <Modal
        visible={menuVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setMenuVisible(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setMenuVisible(false)}
        >
          <View style={styles.menuContainer}>
            <TouchableOpacity 
              style={styles.menuItem}
              onPress={() => {
                setMenuVisible(false);
                // Aquí agregar navegación al perfil
              }}
            >
              <Text style={styles.menuItemText}>Mi Perfil</Text>
            </TouchableOpacity>
            
            <View style={styles.separator} />
            
            <TouchableOpacity 
              style={[styles.menuItem, styles.logoutItem]}
              onPress={logout}
            >
              <Text style={[styles.menuItemText, styles.logoutText]}>
                Cerrar Sesión
              </Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 80,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  logo: {
    width: 150,
    height: 40,
  },
  profileButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#FFD700',
  },
  profileImage: {
    width: '100%',
    height: '100%',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-start',
  },
  menuContainer: {
    position: 'absolute',
    top: 80,
    right: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 8,
    minWidth: 180,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  menuItem: {
    padding: 12,
    borderRadius: 4,
  },
  menuItemText: {
    fontSize: 16,
    color: '#333',
  },
  separator: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 4,
  },
  logoutItem: {
    backgroundColor: '#FEE2E2',
  },
  logoutText: {
    color: '#DC2626',
  },
});