// src/screens/deliveries/DeliveriesScreen.tsx
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/constans/colors";
import { useAuth } from "@/providers/AuthProvider";
import Toast from "react-native-toast-message";
import {
  fetchDeliveries,
  deleteUser,
  updateUser,
  createUser,
} from "@/services/users";
import { User } from "@/models/user";
import DeliveryFormModal from "../../components/DeliveryFormModal";

export default function DeliveriesScreen() {
  const [deliveries, setDeliveries] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const { session, profile } = useAuth();
  const token = session?.access_token || "";

  useEffect(() => {
    if (token) loadDeliveries();
  }, [token]);

  const loadDeliveries = async () => {
    try {
      setLoading(true);
      const data = await fetchDeliveries(token);
      setDeliveries(data);
    } catch (err) {
      console.error("❌ Error cargando domiciliarios:", err);
      Toast.show({
        type: "error",
        text1: "Error al cargar",
        text2: "No se pudieron obtener los domiciliarios.",
        position: "top",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (user: User) => {
    Toast.show({
      type: "info",
      text1: "Eliminando domiciliario...",
      text2: `"${user.name}"`,
      position: "top",
    });

    try {
      await deleteUser(user.id, token);
      setDeliveries((prev) => prev.filter((u) => u.id !== user.id));
      Toast.show({
        type: "success",
        text1: "Domiciliario eliminado",
        text2: `"${user.name}" fue eliminado correctamente.`,
        position: "top",
      });
    } catch (err) {
      console.error("❌ Error eliminando domiciliario:", err);
      Toast.show({
        type: "error",
        text1: "Error al eliminar",
        text2: "No se pudo eliminar el domiciliario.",
        position: "top",
      });
    }
  };

  const handleToggleActive = async (user: User) => {
    try {
      const updated = await updateUser(
        user.id,
        { isActive: !user.isActive },
        token
      );
      setDeliveries((prev) =>
        prev.map((u) => (u.id === user.id ? updated : u))
      );
      Toast.show({
        type: "success",
        text1: "Estado actualizado",
        text2: `El domiciliario "${user.name}" ahora está ${
          updated.isActive ? "activo" : "inactivo"
        }.`,
        position: "top",
      });
    } catch (err) {
      console.error("❌ Error cambiando estado:", err);
      Toast.show({
        type: "error",
        text1: "Error al actualizar",
        text2: "No se pudo cambiar el estado del domiciliario.",
        position: "top",
      });
    }
  };

  const handleSave = async (values: any) => {
    try {
      if (editingUser) {
        await updateUser(editingUser.id, values, token);
        Toast.show({
          type: "success",
          text1: "Domiciliario actualizado",
          text2: `"${values.name}" actualizado correctamente.`,
          position: "top",
        });
      } else {
        await createUser(
          {
            ...values,
            role: "delivery",
            branch_id: profile?.branchId,
            isActive: true,
          },
          token
        );
        Toast.show({
          type: "success",
          text1: "Domiciliario creado",
          text2: `"${values.name}" agregado correctamente.`,
          position: "top",
        });
      }

      setShowForm(false);
      setEditingUser(null);
      loadDeliveries();
    } catch (err) {
      console.error("❌ Error guardando domiciliario:", err);
      Toast.show({
        type: "error",
        text1: "Error al guardar",
        text2: "No se pudo guardar el domiciliario.",
        position: "top",
      });
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Domiciliarios</Text>
      <Text style={styles.subtitle}>Gestiona los domiciliarios de tu sucursal</Text>

      {loading ? (
        <ActivityIndicator size="large" color={Colors.normalText} />
      ) : (
        <FlatList
          data={deliveries}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingVertical: 12 }}
          renderItem={({ item }) => (
            <View style={[styles.card, item.isVIP && styles.cardVIP]}>
              {/* VIP Bar Left */}
              {item.isVIP && <View style={styles.vipBar} />}

              {/* VIP Badge Top Right */}
              {item.isVIP && (
                <View style={styles.vipBadge}>
                  <Ionicons name="star" size={12} color="#fff" />
                  <Text style={styles.vipBadgeText}>VIP</Text>
                </View>
              )}

              {/* Header: Avatar + Name */}
              <View style={styles.cardHeader}>
                <View style={[styles.avatar, item.isVIP && styles.avatarVIP]}>
                  <Ionicons 
                    name="person-circle" 
                    size={40} 
                    color={item.isVIP ? "#ffc107" : Colors.normalText} 
                  />
                </View>
                
                <View style={styles.nameContainer}>
                  <View style={styles.nameRow}>
                    <Text style={styles.name}>{item.name}</Text>
                    {item.isVIP && (
                      <View style={styles.vipStarBadge}>
                        <Ionicons name="star-sharp" size={10} color="#ffc107" />
                      </View>
                    )}
                  </View>
                </View>
              </View>

              {/* Status + Phone */}
              <View style={styles.statusLine}>
                <View style={styles.status}>
                  <Ionicons 
                    name={item.isActive ? "checkmark-circle" : "close-circle"} 
                    size={13} 
                    color={item.isActive ? "#4caf50" : "#f44336"} 
                  />
                  <Text style={[styles.statusText, { color: item.isActive ? "#4caf50" : "#f44336" }]}>
                    {item.isActive ? "Activo" : "Inactivo"}
                  </Text>
                </View>

                <View style={styles.phone}>
                  <Ionicons name="call" size={11} color={Colors.menuText} />
                  <Text style={styles.phoneText}>{item.phone || "Sin tel"}</Text>
                </View>
              </View>

              {/* Actions Row */}
              <View style={styles.actions}>
                <TouchableOpacity
                  onPress={() => handleToggleActive(item)}
                  style={[styles.actionBtn, { backgroundColor: "#ff9800" }]}
                >
                  <Ionicons name={item.isActive ? "pause" : "play"} size={14} color="#fff" />
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => {
                    setEditingUser(item);
                    setShowForm(true);
                  }}
                  style={[styles.actionBtn, { backgroundColor: "#2196f3" }]}
                >
                  <Ionicons name="pencil" size={14} color="#fff" />
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => handleDelete(item)}
                  style={[styles.actionBtn, { backgroundColor: "#f44336" }]}
                >
                  <Ionicons name="trash" size={14} color="#fff" />
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      )}

      {/* 🟢 Botón flotante */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => {
          setEditingUser(null);
          setShowForm(true);
        }}
        activeOpacity={0.8}
      >
        <Ionicons name="add" size={28} color="#000" />
      </TouchableOpacity>

      {/* Modal para crear/editar */}
      <DeliveryFormModal
        visible={showForm}
        onClose={() => {
          setShowForm(false);
          setEditingUser(null);
        }}
        onSave={handleSave}
        initialData={editingUser}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: Colors.Background, 
    paddingHorizontal: 12,
  },
  title: { 
    fontSize: 24, 
    fontWeight: "800", 
    color: Colors.normalText, 
    marginBottom: 4,
    marginTop: 12,
  },
  subtitle: { 
    fontSize: 13, 
    color: Colors.menuText, 
    marginBottom: 12,
  },
  card: {
    marginVertical: 6,
    marginHorizontal: 0,
    paddingHorizontal: 11,
    paddingVertical: 10,
    backgroundColor: Colors.activeMenuBackground,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: Colors.Border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 2,
    position: "relative",
  },
  cardVIP: {
    borderColor: "#d4af37",
    borderWidth: 2,
    backgroundColor: "rgba(212, 175, 55, 0.08)",
  },
  vipBar: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    backgroundColor: "#d4af37",
    borderTopLeftRadius: 11,
    borderBottomLeftRadius: 11,
  },
  vipBadge: {
    position: "absolute",
    top: 6,
    right: 8,
    backgroundColor: "#d4af37",
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 4,
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    shadowColor: "#d4af37",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 3,
    elevation: 3,
  },
  vipBadgeText: {
    fontSize: 8,
    fontWeight: "700",
    color: "#000",
    letterSpacing: 0.2,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 7,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
    backgroundColor: "transparent",
  },
  avatarVIP: {
    backgroundColor: "rgba(212, 175, 55, 0.2)",
    borderWidth: 2,
    borderColor: "#d4af37",
  },
  nameContainer: {
    flex: 1,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  name: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.normalText,
    flex: 1,
  },
  vipStarBadge: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#d4af37",
    justifyContent: "center",
    alignItems: "center",
  },
  statusLine: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 7,
    paddingLeft: 48,
  },
  status: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "600",
  },
  phone: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  phoneText: {
    fontSize: 11,
    color: Colors.menuText,
    fontWeight: "500",
  },
  actions: {
    flexDirection: "row",
    gap: 7,
    justifyContent: "flex-end",
    paddingLeft: 48,
  },
  actionBtn: {
    width: 30,
    height: 30,
    borderRadius: 5,
    justifyContent: "center",
    alignItems: "center",
  },
  fab: {
    position: "absolute",
    right: 20,
    bottom: 20,
    backgroundColor: Colors.normalText,
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});
