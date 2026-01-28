import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "@/providers/AuthProvider";
import { Colors } from "@/constans/colors";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import AntDesign from "@expo/vector-icons/AntDesign";

export default function StoreProfileScreen() {
  const { session, logout } = useAuth();
  const { push, back } = useRouter();
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
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      {/* Back Button */}
      <TouchableOpacity style={styles.backButton} onPress={() => back()}>
        <AntDesign name="arrow-left" size={24} color={Colors.normalText} />
      </TouchableOpacity>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <LinearGradient
            colors={[Colors.gradientStart, Colors.gradientEnd]}
            start={[0, 0]}
            end={[1, 1]}
            style={styles.avatarWrapper}
          >
            <Image
              source={{
                uri:
                  user?.user_metadata?.avatar_url ||
                  "https://via.placeholder.com/150",
              }}
              style={styles.avatar}
            />
          </LinearGradient>

          <Text style={styles.name}>
            {user?.user_metadata?.full_name || user?.email}
          </Text>
          <Text style={styles.email}>{user?.email}</Text>
        </View>

        {/* Información Personal */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Información Personal</Text>

          <View style={styles.infoItem}>
            <Text style={styles.label}>Rol</Text>
            <Text style={styles.value}>
              {user?.user_metadata?.role || "No especificado"}
            </Text>
          </View>

          <View style={styles.infoItem}>
            <Text style={styles.label}>Teléfono</Text>
            <Text style={styles.value}>
              {user?.user_metadata?.phone || "No especificado"}
            </Text>
          </View>
        </View>

        {/* Opciones de Menú */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Mis Opciones</Text>

          <TouchableOpacity style={styles.menuItem} onPress={() => push("/store/history")}>
            <View style={styles.menuItemLeft}>
              <Text style={styles.menuItemIcon}>📊</Text>
              <View>
                <Text style={styles.menuItemTitle}>Historial</Text>
                <Text style={styles.menuItemSubtitle}>Pedidos y facturas</Text>
              </View>
            </View>
            <Text style={styles.menuItemArrow}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Botón cerrar sesión */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.Background, // ✅ Fondo más oscuro
  },
  backButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    justifyContent: "center",
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 40,
  },

  // Header
  header: {
    alignItems: "center",
    marginTop: 30,
    marginBottom: 25,
  },
  avatarWrapper: {
    width: 134,
    height: 134,
    borderRadius: 67,
    padding: 3,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  avatar: {
    width: "100%",
    height: "100%",
    borderRadius: 65,
    backgroundColor: Colors.activeMenuBackground, // ✅ gris neutro para el contenedor
  },
  name: {
    fontSize: 24,
    fontWeight: "700",
    color: Colors.normalText, // ✅ blanco puro para nombre
    marginTop: 15,
  },
  email: {
    fontSize: 14,
    color: Colors.menuText, // ✅ gris medio para texto secundario
    marginTop: 4,
  },

  // Cards
  card: {
    backgroundColor: Colors.activeMenuBackground, // ✅ contraste frente al fondo
    borderRadius: 16,
    marginHorizontal: 20,
    padding: 16,
    marginTop: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.normalText,
    marginBottom: 10,
  },
  infoItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.Border,
  },
  label: {
    fontSize: 14,
    color: Colors.menuText, // ✅ gris medio
  },
  value: {
    fontSize: 14,
    color: Colors.normalText, // ✅ blanco
    fontWeight: "600",
  },

  // Menu Items
  menuItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.Border,
  },
  menuItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  menuItemIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  menuItemTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: Colors.normalText,
  },
  menuItemSubtitle: {
    fontSize: 12,
    color: Colors.menuText,
    marginTop: 2,
  },
  menuItemArrow: {
    fontSize: 20,
    color: Colors.activeMenuText,
    marginLeft: 8,
  },

  // Logout
  logoutButton: {
    backgroundColor: "#EF4444", // 🔴 rojo fuerte para cerrar sesión
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 30,
    marginHorizontal: 20,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 3,
    elevation: 3,
  },
  logoutText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: Colors.activeMenuBackground,
    borderRadius: 16,
    padding: 24,
    width: "80%",
    maxWidth: 400,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.normalText,
    marginBottom: 12,
  },
  modalMessage: {
    fontSize: 16,
    color: Colors.menuText,
    marginBottom: 24,
    lineHeight: 24,
  },
  modalButtons: {
    flexDirection: "row",
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  cancelButton: {
    backgroundColor: Colors.Border,
  },
  cancelButtonText: {
    color: Colors.normalText,
    fontSize: 14,
    fontWeight: "600",
  },
  confirmButton: {
    backgroundColor: "#EF4444",
  },
  confirmButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
});
