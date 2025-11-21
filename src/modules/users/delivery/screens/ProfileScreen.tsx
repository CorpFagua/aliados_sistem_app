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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useAuth } from "../../../../providers/AuthProvider";
import { Colors } from "../../../../constans/colors";

export default function DeliveryProfileScreen() {
  const { session, logout } = useAuth();
  const { width } = useWindowDimensions();
  const router = useRouter();
  const user = session?.user;
  const [isOnline, setIsOnline] = useState(false);

  const handleToggleOnline = (value: boolean) => {
    setIsOnline(value);
    if (value) {
      Alert.alert("Conexión", "¡Estás en línea! Listo para recibir pedidos.");
    } else {
      Alert.alert("Conexión", "Has salido de línea. No recibirás pedidos.");
    }
  };

  const handleLogout = () => {
    Alert.alert("Cerrar Sesión", "¿Estás seguro que deseas cerrar sesión?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Cerrar Sesión",
        style: "destructive",
        onPress: logout,
      },
    ]);
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
          <Text style={styles.cardTitle}>Información Personal</Text>

          <View style={styles.infoItem}>
            <Text style={styles.label}>Rol</Text>
            <Text style={styles.value}>
              {user?.user_metadata?.role === "delivery" ? "Domiciliario" : "No especificado"}
            </Text>
          </View>

          <View style={styles.infoItem}>
            <Text style={styles.label}>Teléfono</Text>
            <Text style={styles.value}>
              {user?.user_metadata?.phone || "No especificado"}
            </Text>
          </View>

          <View style={styles.infoItem}>
            <Text style={styles.label}>Email</Text>
            <Text style={styles.value}>{user?.email || "No especificado"}</Text>
          </View>
        </View>

        {/* Estado de Conexión */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Estado de Conexión</Text>

          <View style={styles.connectionItem}>
            <View style={styles.connectionInfo}>
              <View
                style={[
                  styles.statusDot,
                  { backgroundColor: isOnline ? Colors.success : Colors.error },
                ]}
              />
              <View style={{ flex: 1 }}>
                <Text style={styles.connectionLabel}>
                  {isOnline ? "En línea" : "Fuera de línea"}
                </Text>
                <Text style={styles.connectionSubtitle}>
                  {isOnline
                    ? "Recibiendo pedidos"
                    : "No recibirás pedidos"}
                </Text>
              </View>
            </View>
            <Switch
              value={isOnline}
              onValueChange={handleToggleOnline}
              trackColor={{ false: Colors.Border, true: Colors.success }}
              thumbColor={isOnline ? Colors.activeMenuText : Colors.menuText}
            />
          </View>

          <View style={styles.connectionStats}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Estado</Text>
              <Text
                style={[
                  styles.statValue,
                  { color: isOnline ? Colors.success : Colors.error },
                ]}
              >
                {isOnline ? "● Activo" : "● Inactivo"}
              </Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Disponibilidad</Text>
              <Text style={styles.statValue}>
                {isOnline ? "24/7" : "Pausado"}
              </Text>
            </View>
          </View>
        </View>

        {/* Información Útil */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>💡 Información Útil</Text>
          <Text style={styles.infoText}>
            • Activa tu conexión para recibir pedidos{"\n"}
            • Tu estado se actualiza en tiempo real{"\n"}
            • Puedes cambiar tu estado desde aquí en cualquier momento{"\n"}
            • Se requiere conexión activa para cobros
          </Text>
        </View>

        {/* Opciones de Menú */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>📋 Mis Opciones</Text>

          <TouchableOpacity style={styles.menuItem} onPress={() => router.push("/delivery/earnings")}>
            <View style={styles.menuItemLeft}>
              <Text style={styles.menuItemIcon}>💰</Text>
              <View>
                <Text style={styles.menuItemTitle}>Ganancias</Text>
                <Text style={styles.menuItemSubtitle}>Ver tus ganancias</Text>
              </View>
            </View>
            <Text style={styles.menuItemArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={() => router.push("/delivery/requests")}>
            <View style={styles.menuItemLeft}>
              <Text style={styles.menuItemIcon}>📄</Text>
              <View>
                <Text style={styles.menuItemTitle}>Solicitudes</Text>
                <Text style={styles.menuItemSubtitle}>Tus cortes solicitados</Text>
              </View>
            </View>
            <Text style={styles.menuItemArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={() => router.push("/delivery/history")}>
            <View style={styles.menuItemLeft}>
              <Text style={styles.menuItemIcon}>📊</Text>
              <View>
                <Text style={styles.menuItemTitle}>Historial</Text>
                <Text style={styles.menuItemSubtitle}>Pedidos sin pagar</Text>
              </View>
            </View>
            <Text style={styles.menuItemArrow}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Botón cerrar sesión */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>Cerrar Sesión</Text>
        </TouchableOpacity>
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
    color: Colors.menuText,
  },
  value: {
    fontSize: 14,
    color: Colors.normalText,
    fontWeight: "600",
  },

  // Conexión
  connectionItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.Border,
  },
  connectionInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  connectionLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.normalText,
  },
  connectionSubtitle: {
    fontSize: 12,
    color: Colors.menuText,
    marginTop: 4,
  },

  // Stats
  connectionStats: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingTop: 16,
  },
  statItem: {
    alignItems: "center",
  },
  statLabel: {
    fontSize: 12,
    color: Colors.menuText,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.normalText,
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
});
