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
            branch_id: profile?.branch_id,
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
            <View style={styles.card}>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>{item.name}</Text>
                <Text style={styles.cardSubtitle}>Tel: {item.phone || "—"}</Text>
                <Text style={styles.cardSubtitle}>
                  Estado: {item.isActive ? "🟢 Activo" : "🔴 Inactivo"}
                </Text>
              </View>

              <View style={styles.actions}>
                <TouchableOpacity
                  onPress={() => handleToggleActive(item)}
                  style={{ padding: 6 }}
                >
                  <Ionicons
                    name={item.isActive ? "pause-outline" : "play-outline"}
                    size={22}
                    color={item.isActive ? "orange" : "green"}
                  />
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => {
                    setEditingUser(item);
                    setShowForm(true);
                  }}
                  style={{ padding: 6 }}
                >
                  <Ionicons name="pencil-outline" size={22} color="#007bff" />
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => handleDelete(item)}
                  style={{ padding: 6 }}
                >
                  <Ionicons name="trash-outline" size={22} color="red" />
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
  container: { flex: 1, backgroundColor: Colors.Background, padding: 16 },
  title: { fontSize: 22, fontWeight: "700", color: Colors.normalText, marginBottom: 6 },
  subtitle: { fontSize: 14, color: Colors.menuText, marginBottom: 12 },
  card: {
    backgroundColor: Colors.activeMenuBackground,
    borderRadius: 14,
    padding: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.Border,
  },
  cardTitle: { fontSize: 16, color: Colors.normalText, fontWeight: "600" },
  cardSubtitle: { fontSize: 13, color: Colors.menuText, marginTop: 2 },
  actions: { flexDirection: "row", alignItems: "center" },
  fab: {
    position: "absolute",
    right: 20,
    bottom: 20,
    backgroundColor: Colors.normalText,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 6,
  },
});
