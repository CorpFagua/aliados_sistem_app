import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  useWindowDimensions,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useAuth } from "../../../../providers/AuthProvider";
import { Colors } from "../../../../constans/colors";

export default function DeliveryProfileScreen() {
  const { session, logout } = useAuth();
  const { width } = useWindowDimensions();
  const router = useRouter();
  const user = session?.user;
  const [isOnline, setIsOnline] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const handleToggleOnline = (value: boolean) => {
    setIsOnline(value);
    if (value) {
      Alert.alert("Conexión", "¡Estás en línea! Listo para recibir pedidos.");
    } else {
      Alert.alert("Conexión", "Has salido de línea. No recibirás pedidos.");
    }
  };

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
    <SafeAreaView style={styles.safeArea} edges={["bottom"]}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header de usuario */}
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
          <View style={styles.sectionHeaderRow}>
            <MaterialCommunityIcons name="account-details" size={20} color={Colors.activeMenuText} />
            <Text style={styles.cardTitle}>Información Personal</Text>
          </View>

          <View style={styles.infoItem}>
            <View style={styles.infoItemLeft}>
              <MaterialCommunityIcons name="badge-account" size={18} color={Colors.menuText} />
              <Text style={styles.label}>Rol</Text>
            </View>
            <Text style={styles.value}>
              {user?.user_metadata?.role === "delivery" ? "Domiciliario" : "No especificado"}
            </Text>
          </View>

          <View style={styles.infoItem}>
            <View style={styles.infoItemLeft}>
              <MaterialCommunityIcons name="phone" size={18} color={Colors.menuText} />
              <Text style={styles.label}>Celular</Text>
            </View>
            <Text style={styles.value}>
              {user?.user_metadata?.phone || "No registrado"}
            </Text>
          </View>

          <View style={styles.infoItem}>
            <View style={styles.infoItemLeft}>
              <MaterialCommunityIcons name="email" size={18} color={Colors.menuText} />
              <Text style={styles.label}>Email</Text>
            </View>
            <Text style={styles.value}>{user?.email || "No especificado"}</Text>
          </View>
        </View>



        {/* Información Útil */}
        <View style={styles.card}>
          <View style={styles.sectionHeaderRow}>
            <MaterialCommunityIcons name="information" size={20} color={Colors.activeMenuText} />
            <Text style={styles.cardTitle}>Información Útil</Text>
          </View>
          <Text style={styles.infoText}>
            • Completa tu información para mejores resultados{"\n"}
            • Tu teléfono se usa para contactos importantes{"\n"}
            • Verifica tus ganancias y pedidos regularmente{"\n"}
            • Contacta soporte si tienes dudas
          </Text>
        </View>

        {/* Opciones de Menú */}
        <View style={styles.card}>
          <View style={styles.sectionHeaderRow}>
            <MaterialCommunityIcons name="menu" size={20} color={Colors.activeMenuText} />
            <Text style={styles.cardTitle}>Mis Opciones</Text>
          </View>

          <TouchableOpacity style={styles.menuItem} onPress={() => router.push("/delivery/earnings")}>
            <View style={styles.menuItemLeft}>
              <MaterialCommunityIcons name="wallet" size={24} color={Colors.activeMenuText} />
              <View>
                <Text style={styles.menuItemTitle}>Ganancias</Text>
                <Text style={styles.menuItemSubtitle}>Ver tus ganancias</Text>
              </View>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={24} color={Colors.activeMenuText} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem} onPress={() => router.push("/delivery/history")}>
            <View style={styles.menuItemLeft}>
              <MaterialCommunityIcons name="chart-line" size={24} color={Colors.activeMenuText} />
              <View>
                <Text style={styles.menuItemTitle}>Historial</Text>
                <Text style={styles.menuItemSubtitle}>Pedidos entregados / Prefacturas</Text>
              </View>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={24} color={Colors.activeMenuText} />
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
    backgroundColor: Colors.Background,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 40,
  },

  // Header de usuario
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
    backgroundColor: Colors.activeMenuBackground,
  },
  name: {
    fontSize: 24,
    fontWeight: "700",
    color: Colors.normalText,
    marginTop: 15,
  },
  email: {
    fontSize: 14,
    color: Colors.menuText,
    marginTop: 4,
  },

  // Card de info
  card: {
    backgroundColor: Colors.activeMenuBackground,
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
  },
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 12,
  },
  infoItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.Border,
  },
  infoItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  label: {
    fontSize: 14,
    color: Colors.menuText,
    fontWeight: "500",
  },
  value: {
    fontSize: 14,
    color: Colors.normalText,
    fontWeight: "600",
    textAlign: "right",
    flex: 1,
  },

  // Info text
  infoText: {
    fontSize: 13,
    color: Colors.menuText,
    lineHeight: 20,
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
    gap: 12,
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

  // Logout
  logoutButton: {
    backgroundColor: "#EF4444",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 30,
    marginHorizontal: 20,
    marginBottom: 20,
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
