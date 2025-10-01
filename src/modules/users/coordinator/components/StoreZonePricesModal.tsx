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
                <TouchableOpacity onPress={() => setShowForm({ visible: true })}>
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

            {/* Lista */}
            <FlatList
              data={prices}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <View style={styles.row}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.zoneName}>
                      {item.zone?.name ?? "Zona desconocida"}
                    </Text>
                    <Text style={styles.zoneSubtext}>ID: {item.zone?.id}</Text>
                  </View>
                  <Text style={styles.rowPrice}>${item.price}</Text>
                  <TouchableOpacity
                    style={styles.iconButton}
                    onPress={() =>
                      setShowForm({ visible: true, editing: item })
                    }
                  >
                    <Ionicons
                      name="create-outline"
                      size={20}
                      color={Colors.activeMenuText}
                    />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.iconButton}
                    onPress={() => handleDelete(item.id)}
                  >
                    <Ionicons
                      name="trash-outline"
                      size={20}
                      color={Colors.error}
                    />
                  </TouchableOpacity>
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
    backgroundColor: "rgba(0,0,0,0.8)",
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
    maxWidth: "92%",
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
    marginBottom: 12,
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
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: Colors.Border,
  },
  zoneName: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.normalText,
  },
  zoneSubtext: {
    fontSize: 12,
    color: Colors.menuText,
  },
  rowPrice: {
    width: 80,
    textAlign: "right",
    color: Colors.activeMenuText,
    fontWeight: "700",
    fontSize: 15,
  },
  iconButton: {
    marginLeft: 8,
    padding: 6,
    borderRadius: 8,
    backgroundColor: Colors.Background,
  },
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
