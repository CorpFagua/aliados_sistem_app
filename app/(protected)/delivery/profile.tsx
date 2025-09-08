// src/screens/ProfileScreen.tsx
import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useAuth } from "@/providers/AuthProvider";
import Header from "@/components/Header";
import { Colors } from "@/constans/colors";

export default function ProfileScreen() {
  const { session, logout } = useAuth();
  const user = session?.user;

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      {/* ✅ Header inteligente (logo o flecha según ruta) */}
      <Header />

      <ScrollView contentContainerStyle={styles.scrollContent}>
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

        {/* Botón cerrar sesión */}
        <TouchableOpacity style={styles.logoutButton} onPress={logout}>
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

  // Logout
  logoutButton: {
    backgroundColor: "#EF4444",
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
});
