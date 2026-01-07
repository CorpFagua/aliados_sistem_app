import { useEffect, useState } from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/constans/colors";
import {
  fetchStoreZonePrices,
  deleteStoreZonePrice,
} from "@/services/storeZonePrices";
import { Store } from "@/models/store";
import { StoreZonePrice } from "@/models/storeZonePrice";
import ZonePriceForm from "./ZonePriceForm";

const { width } = Dimensions.get("window");
const isLargeScreen = width > 768;

interface Props {
  visible: boolean;
  store: Store;
  token: string;
  onClose: () => void;
}

export default function StoreZonePricesModal({
  visible,
  store,
  token,
  onClose,
}: Props) {
  const [prices, setPrices] = useState<StoreZonePrice[]>([]);
  const [showForm, setShowForm] = useState<{
    visible: boolean;
    editing?: StoreZonePrice;
  }>({ visible: false });

  const loadPrices = async () => {
    try {
      const data = await fetchStoreZonePrices(store.id, token);
      setPrices(data);
    } catch (err) {
      console.error("Error cargando precios:", err);
    }
  };

  useEffect(() => {
    if (visible) loadPrices();
  }, [visible]);

  const handleDelete = async (id: string) => {
    await deleteStoreZonePrice(id, token);
    loadPrices();
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View
          style={[styles.cardWrapper, isLargeScreen && styles.cardWrapperLarge]}
        >
          <View style={styles.card}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title}>Precios de {store.name}</Text>
              <View style={styles.headerActions}>
                <TouchableOpacity
                  onPress={() => setShowForm({ visible: true })}
                >
                  <Ionicons
                    name="add-circle"
                    size={26}
                    color={Colors.activeMenuText}
                  />
                </TouchableOpacity>
                <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                  <Ionicons name="close" size={24} color={Colors.normalText} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Encabezado tipo tabla */}
            <View style={styles.tableHeader}>
              <Text style={[styles.headerCell, { flex: 1.8 }]}>Zona</Text>
              <Text
                style={[styles.headerCell, { flex: 1.2, textAlign: "center" }]}
              >
                Tienda
              </Text>
              <Text
                style={[styles.headerCell, { flex: 1.2, textAlign: "center" }]}
              >
                Domicilio
              </Text>
              <Text
                style={[styles.headerCell, { flex: 0.8, textAlign: "center" }]}
              >
                Acciones
              </Text>
            </View>

            {/* Lista */}
            <FlatList
              data={prices}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <View style={styles.tableRow}>
                  {/* Zona */}
                  <View style={[styles.cell, { flex: 1.8 }]}>
                    <Text style={styles.zoneName}>
                      {item.zone?.name ?? "Zona desconocida"}
                    </Text>
                  </View>

                  {/* Precio tienda */}
                  <View style={[styles.cell, { flex: 1.2 }]}>
                    <Text
                      style={[
                        styles.priceValue,
                        { color: "#FFD43B", textAlign: "center" },
                      ]}
                    >
                      ${item.price.toFixed(2)}
                    </Text>
                  </View>

                  {/* Precio domiciliario */}
                  <View style={[styles.cell, { flex: 1.2 }]}>
                    <Text
                      style={[
                        styles.priceValue,
                        { color: "#3B82F6", textAlign: "center" },
                      ]}
                    >
                      ${item.price_delivery?.toFixed(2) ?? "0.00"}
                    </Text>
                  </View>

                  {/* Acciones */}
                  <View
                    style={[styles.cell, styles.actionsCell, { flex: 0.8 }]}
                  >
                    <TouchableOpacity
                      style={[
                        styles.iconButton,
                        { backgroundColor: "#FFD43B20" },
                      ]}
                      onPress={() =>
                        setShowForm({ visible: true, editing: item })
                      }
                    >
                      <Ionicons
                        name="create-outline"
                        size={18}
                        color="#FFD43B"
                      />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.iconButton,
                        { backgroundColor: "#EF444420" },
                      ]}
                      onPress={() => handleDelete(item.id)}
                    >
                      <Ionicons
                        name="trash-outline"
                        size={18}
                        color="#EF4444"
                      />
                    </TouchableOpacity>
                  </View>
                </View>
              )}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Ionicons
                    name="pricetag-outline"
                    size={40}
                    color={Colors.menuText}
                  />
                  <Text style={styles.emptyTitle}>
                    No hay precios configurados
                  </Text>
                  <Text style={styles.emptySubtitle}>
                    Agrega un precio con el botón{" "}
                    <Ionicons
                      name="add-circle"
                      size={14}
                      color={Colors.activeMenuText}
                    />
                  </Text>
                </View>
              }
              contentContainerStyle={{ paddingBottom: 20 }}
              style={{ maxHeight: "70%" }}
              showsVerticalScrollIndicator={false}
            />

            {/* Formulario */}
            {showForm.visible && (
              <ZonePriceForm
                store={store}
                token={token}
                editing={showForm.editing}
                onClose={() => {
                  setShowForm({ visible: false });
                  loadPrices();
                }}
              />
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.85)",
    justifyContent: "center",
    alignItems: "center",
  },
  cardWrapper: {
    borderWidth: 1.5,
    borderColor: "#FFFFFF25",
    borderRadius: 20,
    width: "90%",
    maxHeight: "85%",
  },
  cardWrapperLarge: {
    width: 550,
  },
  card: {
    backgroundColor: Colors.activeMenuBackground,
    borderRadius: 18,
    padding: 20,
    flexGrow: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  closeButton: {
    marginLeft: 8,
    padding: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: Colors.normalText,
    flex: 1,
  },

  /** ---- TABLA DE ZONA ---- **/
  tableHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderColor: "#2A2A2A",
    backgroundColor: "#1E1E1E",
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
  },
  headerCell: {
    color: Colors.menuText,
    fontSize: 13,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  tableRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#1A1A1A",
    borderBottomWidth: 1,
    borderColor: "#2A2A2A",
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  cell: {
    justifyContent: "center",
  },
  zoneName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#fff",
  },
  priceValue: {
    fontSize: 14,
    fontWeight: "700",
  },
  actionsCell: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
  },
  iconButton: {
    padding: 6,
    borderRadius: 8,
  },

  /** ---- Vacío ---- **/
  emptyContainer: {
    marginTop: 40,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  emptyTitle: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: "600",
    color: Colors.normalText,
  },
  emptySubtitle: {
    marginTop: 6,
    fontSize: 13,
    color: Colors.menuText,
    textAlign: "center",
  },
});
