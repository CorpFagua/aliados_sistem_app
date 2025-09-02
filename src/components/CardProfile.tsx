import React from "react";
import { View, Text, Image, StyleSheet, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "@/providers/AuthProvider";
import { Ionicons } from "@expo/vector-icons";

type CardProfileProps = {
  onClose: () => void;
};

export default function CardProfile({ onClose }: CardProfileProps) {
  const { session, logout } = useAuth();
  const router = useRouter();

  const user = session?.user;

  return (
    <View style={styles.card}>
      <Image
        source={{
          uri: user?.user_metadata?.avatar_url || "https://via.placeholder.com/150",
        }}
        style={styles.avatar}
      />
      <Text style={styles.name}>
        {user?.user_metadata?.full_name || user?.email}
      </Text>
      <Text style={styles.email}>{user?.email}</Text>

      <TouchableOpacity
        style={[styles.button, styles.profileButton]}
        onPress={() => {
          router.push("/shared/profile");
          onClose();
        }}
      >
        <Ionicons name="person-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
        <Text style={styles.buttonText}>Ir al Perfil</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, styles.logoutButton]}
        onPress={() => {
          logout();
          onClose();
        }}
      >
        <Ionicons name="exit-outline" size={20} color="#DC2626" style={{ marginRight: 8 }} />
        <Text style={[styles.buttonText, { color: "#DC2626" }]}>Cerrar Sesión</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 250,
    backgroundColor: "#1A1A1A",
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 5,
    alignItems: "center",
  },
  avatar: { width: 60, height: 60, borderRadius: 30, marginBottom: 12, backgroundColor: "#333" },
  name: { fontSize: 16, fontWeight: "bold", color: "#fff", marginBottom: 4 },
  email: { fontSize: 14, color: "#aaa", marginBottom: 16 },
  button: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderRadius: 8,
    marginBottom: 8,
    justifyContent: "center",
    width: "100%",
  },
  profileButton: { backgroundColor: "#2563EB" },
  logoutButton: { backgroundColor: "#222" },
  buttonText: { color: "#fff", fontWeight: "600", fontSize: 14 },
});
