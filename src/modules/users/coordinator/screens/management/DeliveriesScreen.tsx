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
  updateUserVIP,
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

  const handleToggleVIP = async (user: User) => {
    try {
      console.log("⭐ Actualizando VIP para:", user.name, "Nuevo valor:", !user.isVIP);
      const updated = await updateUserVIP(user.id, !user.isVIP, token);
      setDeliveries((prev) =>
        prev.map((u) => (u.id === user.id ? updated : u))
      );
      Toast.show({
        type: "success",
        text1: "Estado VIP actualizado",
        text2: `${user.name} ${updated.isVIP ? "es ahora VIP ⭐" : "ya no es VIP"}`,
        position: "top",
      });
    } catch (err) {
      console.error("❌ Error actualizando VIP:", err);
      Toast.show({
        type: "error",
        text1: "Error al actualizar VIP",
        text2: "No se pudo cambiar el estado VIP del domiciliario.",
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
          contentContainerStyle={{ paddingVertical: 16 }}
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
                    size={44} 
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
                    size={15} 
                    color={item.isActive ? "#4caf50" : "#f44336"} 
                  />
                  <Text style={[styles.statusText, { color: item.isActive ? "#4caf50" : "#f44336" }]}>
                    {item.isActive ? "Activo" : "Inactivo"}
                  </Text>
                </View>

                <View style={styles.phone}>
                  <Ionicons name="call" size={13} color={Colors.menuText} />
                  <Text style={styles.phoneText}>{item.phone || "Sin tel"}</Text>
                </View>
              </View>

              {/* Email */}
              {item.email && (
                <View style={styles.emailLine}>
                  <Ionicons name="mail" size={13} color={Colors.menuText} />
                  <Text style={styles.emailText} numberOfLines={1}>{item.email}</Text>
                </View>
              )}

              {/* Actions Row */}
              <View style={styles.actions}>
                <TouchableOpacity
                  onPress={() => handleToggleVIP(item)}
                  style={[styles.actionBtn, { backgroundColor: item.isVIP ? "#ffc107" : "#9e9e9e" }]}
                >
                  <Ionicons name="star" size={16} color="#fff" />
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => handleToggleActive(item)}
                  style={[styles.actionBtn, { backgroundColor: "#ff9800" }]}
                >
                  <Ionicons name={item.isActive ? "pause" : "play"} size={16} color="#fff" />
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => {
                    setEditingUser(item);
                    setShowForm(true);
                  }}
                  style={[styles.actionBtn, { backgroundColor: "#2196f3" }]}
                >
                  <Ionicons name="pencil" size={16} color="#fff" />
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => handleDelete(item)}
                  style={[styles.actionBtn, { backgroundColor: "#f44336" }]}
                >
                  <Ionicons name="trash" size={16} color="#fff" />
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
        <Ionicons name="add" size={32} color="#000" />
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
    paddingHorizontal: 16,
    maxWidth: 900,
    alignSelf: "center",
    width: "100%",
  },
  title: { 
    fontSize: 28, 
    fontWeight: "800", 
    color: Colors.normalText, 
    marginBottom: 6,
    marginTop: 16,
    letterSpacing: 0.3,
  },
  subtitle: { 
    fontSize: 15, 
    color: Colors.menuText, 
    marginBottom: 16,
    letterSpacing: 0.2,
  },
  card: {
    marginVertical: 8,
    marginHorizontal: 0,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: Colors.activeMenuBackground,
    borderRadius: 12,
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
    marginBottom: 8,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
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
    gap: 6,
  },
  name: {
    fontSize: 16,
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
    paddingLeft: 54,
  },
  status: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  statusText: {
    fontSize: 13,
    fontWeight: "600",
    letterSpacing: 0.2,
  },
  phone: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  phoneText: {
    fontSize: 13,
    color: Colors.menuText,
    fontWeight: "500",
  },
  emailLine: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 10,
    paddingLeft: 54,
    paddingRight: 12,
  },
  emailText: {
    fontSize: 12,
    color: Colors.menuText,
    fontWeight: "400",
    flex: 1,
  },
  actions: {
    flexDirection: "row",
    gap: 9,
    justifyContent: "flex-end",
    paddingLeft: 54,
    paddingTop: 4,
  },
  actionBtn: {
    width: 36,
    height: 36,
    borderRadius: 6,
    justifyContent: "center",
    alignItems: "center",
  },
  fab: {
    position: "absolute",
    right: 24,
    bottom: 24,
    backgroundColor: Colors.normalText,
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});
