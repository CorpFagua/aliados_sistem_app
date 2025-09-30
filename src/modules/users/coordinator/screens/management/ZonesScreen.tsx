import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  Switch,
  TouchableOpacity,
  StyleSheet,
  Pressable,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/constans/colors";
import { fetchZones, updateZone } from "@/services/zones";
import { Zone } from "@/models/zone";
import { useAuth } from "@/providers/AuthProvider";
import ZoneFormModal from "../../components/ZoneFormModal";

export default function ZonesScreen() {
  const [zones, setZones] = useState<Zone[]>([]);
  const [loading, setLoading] = useState(true);

  // 🔹 estado para modal
  const [showForm, setShowForm] = useState(false);
  const [editingZone, setEditingZone] = useState<Zone | null>(null);

  const { session } = useAuth();
  const token = session?.access_token || "";

  useEffect(() => {
    if (token) loadZones();
  }, [token]);

  const loadZones = async () => {
    try {
      setLoading(true);
      const data = await fetchZones(token);
      setZones(data);
    } catch (err) {
      console.error("❌ Error cargando zonas:", err);
    } finally {
      setLoading(false);
    }
  };

  const toggleZone = async (zone: Zone) => {
    try {
      const updated = await updateZone(
        zone.id,
        { is_active: !zone.isActive },
        token
      );
      setZones((prev) => prev.map((z) => (z.id === updated.id ? updated : z)));
    } catch (err) {
      console.error("❌ Error actualizando zona:", err);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <Text style={styles.title}>Zonas</Text>
      <Text style={styles.subtitle}>
        Administra las zonas activas para tus pedidos
      </Text>

      {/* Lista */}
      {loading ? (
        <Text style={styles.loading}>Cargando...</Text>
      ) : (
        <FlatList
          data={zones}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingVertical: 12 }}
          renderItem={({ item }) => (
            <Pressable
              style={styles.card}
              onPress={() => {
                setEditingZone(item); // 👈 activar edición
                setShowForm(true);
              }}
            >
              <Text style={styles.cardTitle}>{item.name}</Text>
              <Switch
                value={item.isActive}
                onValueChange={() => toggleZone(item)}
                thumbColor={item.isActive ? Colors.normalText : Colors.menuText}
              />
            </Pressable>
          )}
        />
      )}

      {/* Botón flotante para crear */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => {
          setEditingZone(null); // 👈 crear nueva
          setShowForm(true);
        }}
        activeOpacity={0.8}
      >
        <Ionicons name="add" size={28} color="#000" />
      </TouchableOpacity>

      {/* Modal Formulario (crear/editar) */}
      <ZoneFormModal
        visible={showForm}
        zone={editingZone} // 👈 pasar zona en edición
        onClose={() => {
          setShowForm(false);
          setEditingZone(null);
        }}
        onSuccess={(savedZone) => {
          if (editingZone) {
            // actualizar en lista
            setZones((prev) =>
              prev.map((z) => (z.id === savedZone.id ? savedZone : z))
            );
          } else {
            // insertar al inicio
            setZones((prev) => [savedZone, ...prev]);
          }
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.Background,
    padding: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: Colors.normalText,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.menuText,
    marginBottom: 12,
  },
  loading: {
    color: Colors.menuText,
    textAlign: "center",
    marginTop: 20,
  },
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
  cardTitle: {
    fontSize: 16,
    color: Colors.normalText,
    fontWeight: "600",
  },
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
