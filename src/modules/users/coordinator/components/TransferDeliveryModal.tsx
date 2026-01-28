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
import { transferServiceImmediate } from "@/services/transfers";
import { useAuth } from "@/providers/AuthProvider";

interface Props {
  visible: boolean;
  onClose: () => void;
  service: any;
  currentDeliveryId: string | null; // ID del delivery actualmente asignado
  onSuccess?: () => void;
}

export default function TransferDeliveryModal({
  visible,
  onClose,
  service,
  currentDeliveryId,
  onSuccess,
}: Props) {
  const { session } = useAuth();
  const [loading, setLoading] = useState(false);
  const [deliveries, setDeliveries] = useState([]);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    if (!visible || !session) return;
    setLoading(true);
    fetchDeliveries(session.access_token)
      .then((res) => {
        // 🔴 Filtrar para excluir el delivery actualmente asignado
        const filtered = res.filter((d) => d.id !== currentDeliveryId);
        setDeliveries(filtered);
      })
      .catch((err) => {
        console.error("❌ Error fetching deliveries:", err);
        alert("Error al cargar domiciliarios");
      })
      .finally(() => setLoading(false));
  }, [visible, currentDeliveryId]);

  const handleTransfer = async () => {
    if (!selected) return;
    try {
      setLoading(true);
      await transferServiceImmediate(
        service.id,
        selected.id,
        session.access_token,
        `Transferencia desde coordinador`
      );
      alert("✅ Servicio transferido exitosamente");
      onClose();
      onSuccess?.();
    } catch (err: any) {
      console.error("❌ Error transferiendo:", err);
      alert(
        err.response?.data?.message ||
          "Error al transferir el servicio"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.modal}>
          {/* HEADER */}
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>Transferir servicio</Text>
              <Text style={styles.subtitle}>
                ID: {service?.id}
              </Text>
            </View>
            <TouchableOpacity onPress={() => onClose()}>
              <Ionicons name="close" size={22} color={Colors.normalText} />
            </TouchableOpacity>
          </View>

          {/* DELIVERY INFO */}
          {service && (
            <View style={styles.serviceInfo}>
              <View style={styles.infoRow}>
                <Ionicons
                  name="bicycle-outline"
                  size={16}
                  color={Colors.menuText}
                />
                <Text style={styles.infoLabel}>
                  Actual: <Text style={styles.infoBold}>{service.assignedDeliveryName || "Sin asignar"}</Text>
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Ionicons
                  name="map-outline"
                  size={16}
                  color={Colors.menuText}
                />
                <Text style={styles.infoLabel}>
                  Destino: <Text style={styles.infoBold}>{service.destination}</Text>
                </Text>
              </View>
            </View>
          )}

          {/* DELIVERIES LIST */}
          {loading ? (
            <ActivityIndicator
              size="large"
              color={Colors.gradientStart}
              style={{ marginVertical: 20 }}
            />
          ) : (
            <ScrollView
              style={styles.deliveriesList}
              showsVerticalScrollIndicator={false}
            >
              {deliveries.length === 0 ? (
                <Text style={styles.emptyText}>
                  No hay domiciliarios disponibles
                </Text>
              ) : (
                deliveries.map((d) => (
                  <TouchableOpacity
                    key={d.id}
                    style={[
                      styles.deliveryItem,
                      selected?.id === d.id && styles.selectedItem,
                    ]}
                    onPress={() => setSelected(d)}
                  >
                    <View
                      style={[
                        styles.avatar,
                        selected?.id === d.id && { backgroundColor: Colors.gradientStart },
                      ]}
                    >
                      <Ionicons
                        name="bicycle-outline"
                        size={18}
                        color={
                          selected?.id === d.id
                            ? "#000"
                            : Colors.menuText
                        }
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.deliveryName}>{d.name}</Text>
                      {d.phone && (
                        <Text style={styles.deliveryPhone}>{d.phone}</Text>
                      )}
                    </View>
                    {selected?.id === d.id && (
                      <Ionicons
                        name="checkmark-circle"
                        size={22}
                        color={Colors.gradientStart}
                      />
                    )}
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
          )}

          {/* ACTION BUTTON */}
          <TouchableOpacity
            style={[
              styles.transferBtn,
              (!selected || loading) && { opacity: 0.5 },
            ]}
            onPress={handleTransfer}
            disabled={!selected || loading}
          >
            <Ionicons
              name="swap-horizontal-outline"
              size={18}
              color="#000"
            />
            <Text style={styles.transferText}>Transferir</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

// --- ESTILOS ---
const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  modal: {
    width: "90%",
    maxHeight: "80%",
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
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.normalText,
  },
  subtitle: {
    fontSize: 12,
    color: Colors.menuText,
    marginTop: 4,
  },
  serviceInfo: {
    backgroundColor: Colors.Background,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.Border,
    marginBottom: 16,
    gap: 8,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  infoLabel: {
    color: Colors.menuText,
    fontSize: 13,
    flex: 1,
  },
  infoBold: {
    fontWeight: "600",
    color: Colors.normalText,
  },
  deliveriesList: {
    maxHeight: 300,
    marginBottom: 16,
  },
  deliveryItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.Border,
    marginBottom: 8,
    backgroundColor: Colors.Background,
    gap: 12,
  },
  selectedItem: {
    backgroundColor: Colors.gradientEnd + "22",
    borderColor: Colors.gradientStart,
    borderWidth: 2,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.Background + "99",
    justifyContent: "center",
    alignItems: "center",
  },
  deliveryName: {
    color: Colors.normalText,
    fontSize: 15,
    fontWeight: "600",
  },
  deliveryPhone: {
    color: Colors.menuText,
    fontSize: 12,
    marginTop: 2,
  },
  transferBtn: {
    marginTop: 12,
    backgroundColor: Colors.gradientStart,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
  },
  transferText: {
    color: "#000",
    fontWeight: "700",
    fontSize: 16,
  },
  emptyText: {
    textAlign: "center",
    color: Colors.menuText,
    marginTop: 20,
    fontSize: 14,
  },
});
