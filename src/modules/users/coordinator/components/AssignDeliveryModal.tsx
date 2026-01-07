import React, { useEffect, useState } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/constans/colors";
import { fetchDeliveries } from "@/services/users";
import { updateServiceStatus } from "@/services/services";
import { useAuth } from "@/providers/AuthProvider";

export default function AssignDeliveryModal({ visible, onClose, service }) {
  const { session } = useAuth();
  const [loading, setLoading] = useState(false);
  const [deliveries, setDeliveries] = useState([]);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    if (!visible || !session) return;
    setLoading(true);
    fetchDeliveries(session.access_token)
      .then((res) => setDeliveries(res))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [visible]);

  const handleAssign = async () => {
    if (!selected) return;
    try {
      setLoading(true);
      await updateServiceStatus(service.id, "asignado", session.access_token, selected.id);
      onClose(true); // pasa true para recargar lista
    } catch (err) {
      console.error("❌ Error asignando:", err);
      alert("Error al asignar el domiciliario");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <View style={styles.header}>
            <Text style={styles.title}>Asignar domiciliario</Text>
            <TouchableOpacity onPress={() => onClose(false)}>
              <Ionicons name="close" size={22} color={Colors.normalText} />
            </TouchableOpacity>
          </View>

          {loading ? (
            <ActivityIndicator size="large" color={Colors.gradientStart} />
          ) : (
            <ScrollView style={{ maxHeight: 300 }}>
              {deliveries.length === 0 ? (
                <Text style={styles.emptyText}>No hay domiciliarios disponibles</Text>
              ) : (
                deliveries.map((d) => (
                  <TouchableOpacity
                    key={d.id}
                    style={[
                      styles.item,
                      selected?.id === d.id && styles.selectedItem,
                    ]}
                    onPress={() => setSelected(d)}
                  >
                    <Ionicons
                      name="bicycle-outline"
                      size={20}
                      color={
                        selected?.id === d.id
                          ? Colors.gradientStart
                          : Colors.menuText
                      }
                    />
                    <Text style={styles.itemText}>{d.name}</Text>
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
          )}

          <TouchableOpacity
            style={[
              styles.assignBtn,
              !selected && { opacity: 0.5 },
            ]}
            onPress={handleAssign}
            disabled={!selected || loading}
          >
            <Text style={styles.assignText}>Asignar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  modal: {
    width: "90%",
    backgroundColor: Colors.activeMenuBackground,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.Border,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.normalText,
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.Border,
    marginBottom: 8,
    backgroundColor: Colors.Background,
    gap: 8,
  },
  selectedItem: {
    backgroundColor: Colors.gradientEnd + "22",
    borderColor: Colors.gradientStart,
  },
  itemText: {
    color: Colors.normalText,
    fontSize: 15,
  },
  assignBtn: {
    marginTop: 16,
    backgroundColor: Colors.gradientStart,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
  },
  assignText: {
    color: "#000",
    fontWeight: "700",
  },
  emptyText: {
    textAlign: "center",
    color: Colors.menuText,
    marginTop: 20,
  },
});
