// src/modules/users/delivery/components/RequestTransferModal.tsx
import React, { useState, useEffect } from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/constans/colors";
import { useAuth } from "@/providers/AuthProvider";
import { requestTransfer } from "@/services/transfers";
import { fetchDeliveries } from "@/services/users";

interface Delivery {
  id: string;
  name: string;
}

interface Props {
  visible: boolean;
  onClose: () => void;
  serviceId: string;
  currentDeliveryId: string;
  onSuccess?: () => void;
}

export default function RequestTransferModal({
  visible,
  onClose,
  serviceId,
  currentDeliveryId,
  onSuccess,
}: Props) {
  const { session } = useAuth();
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedDelivery, setSelectedDelivery] = useState<Delivery | null>(null);
  const [reason, setReason] = useState("");

  // Cargar lista de deliveries
  useEffect(() => {
    if (visible) {
      loadDeliveries();
    }
  }, [visible]);

  const loadDeliveries = async () => {
    try {
      setLoading(true);
      // Usar el servicio reutilizable
      const users = await fetchDeliveries(session?.access_token || "");
      
      // Filtrar el delivery actual
      const deliveryList = users
        .filter((u: any) => u.id !== currentDeliveryId)
        .map((u: any) => ({ id: u.id, name: u.name }));
      
      setDeliveries(deliveryList);
      console.log("✅ Deliveries cargados:", deliveryList);
    } catch (err) {
      console.error("❌ Error loading deliveries:", err);
      Alert.alert("Error", "No se pudieron cargar los compañeros");
    } finally {
      setLoading(false);
    }
  };

  const handleRequest = async () => {
    if (!selectedDelivery) {
      Alert.alert("Error", "Selecciona un compañero");
      return;
    }

    try {
      setLoading(true);
      await requestTransfer(
        serviceId,
        selectedDelivery.id,
        session?.access_token || "",
        reason || undefined
      );

      Alert.alert("Éxito", `Solicitud enviada a ${selectedDelivery.name}`);
      setSelectedDelivery(null);
      setReason("");
      onClose();
      onSuccess?.();
    } catch (err: any) {
      console.error("Error requesting transfer:", err);
      Alert.alert("Error", "No se pudo enviar la solicitud");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.modal}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Solicitar transferencia</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={Colors.normalText} />
            </TouchableOpacity>
          </View>

          {/* Content */}
          {loading && !deliveries.length ? (
            <View style={styles.center}>
              <ActivityIndicator size="large" color={Colors.gradientStart} />
            </View>
          ) : (
            <>
              <Text style={styles.subtitle}>Selecciona a quién solicitar:</Text>

              <FlatList
                data={deliveries}
                keyExtractor={(item) => item.id}
                scrollEnabled={false}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[
                      styles.deliveryItem,
                      selectedDelivery?.id === item.id && styles.selectedItem,
                    ]}
                    onPress={() => setSelectedDelivery(item)}
                  >
                    <View style={styles.itemLeft}>
                      <Ionicons
                        name="person-circle-outline"
                        size={24}
                        color={Colors.gradientStart}
                      />
                      <Text style={styles.itemName}>{item.name}</Text>
                    </View>
                    {selectedDelivery?.id === item.id && (
                      <Ionicons
                        name="checkmark-circle"
                        size={24}
                        color={Colors.gradientStart}
                      />
                    )}
                  </TouchableOpacity>
                )}
                ListEmptyComponent={
                  <Text style={styles.emptyText}>
                    No hay compañeros disponibles
                  </Text>
                }
              />

              {/* Actions */}
              <View style={styles.actions}>
                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={onClose}
                  disabled={loading}
                >
                  <Text style={styles.cancelText}>Cancelar</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.confirmBtn,
                    !selectedDelivery && styles.disabledBtn,
                  ]}
                  onPress={handleRequest}
                  disabled={!selectedDelivery || loading}
                >
                  {loading ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.confirmText}>Solicitar</Text>
                  )}
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "flex-end",
  },
  modal: {
    backgroundColor: Colors.activeMenuBackground,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "80%",
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
    fontSize: 14,
    color: Colors.menuText,
    marginBottom: 12,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    minHeight: 200,
  },
  deliveryItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: Colors.Background,
    borderWidth: 1,
    borderColor: "transparent",
  },
  selectedItem: {
    borderColor: Colors.gradientStart,
    backgroundColor: Colors.gradientStart + "10",
  },
  itemLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  itemName: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.normalText,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.menuText,
    textAlign: "center",
    marginVertical: 20,
  },
  actions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 16,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.Border,
    alignItems: "center",
  },
  cancelText: {
    color: Colors.normalText,
    fontWeight: "600",
    fontSize: 14,
  },
  confirmBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: Colors.gradientStart,
    alignItems: "center",
  },
  confirmText: {
    color: "#000",
    fontWeight: "600",
    fontSize: 14,
  },
  disabledBtn: {
    opacity: 0.5,
  },
});
