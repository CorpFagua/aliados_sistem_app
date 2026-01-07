// src/screens/management/StorePricesScreen.tsx
import { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/constans/colors";
import { fetchStores } from "@/services/stores";
import StoreZonePricesModal from "../../components/StoreZonePricesModal";
import { Store } from "@/models/store";

export default function StorePricesScreen({ token }: { token: string }) {
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStore, setSelectedStore] = useState<Store | null>(null);

  useEffect(() => {
    const loadStores = async () => {
      console.log("🔑 Token recibido:", token);

      try {
        const data = await fetchStores(token);
        setStores(data);
      } catch (error) {
        console.error("Error cargando tiendas:", error);
      } finally {
        setLoading(false);
      }
    };
    loadStores();
  }, [token]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.activeMenuText} />
        <Text style={styles.loadingText}>Cargando tiendas...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Tiendas</Text>

      <FlatList
        data={stores}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 40 }}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            activeOpacity={0.9}
            onPress={() => setSelectedStore(item)}
          >
            <View style={styles.iconBox}>
              <Ionicons
                name="storefront-outline"
                size={28}
                color={Colors.activeMenuText}
              />
            </View>

            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>{item.name}</Text>
              <Text style={styles.cardSubtitle}>
                {item.branch?.name} •{" "}
                <Text style={{ color: Colors.activeMenuText }}>
                  {item.type.toUpperCase()}
                </Text>
              </Text>
            </View>

            <Ionicons
              name="pricetag-outline"
              size={22}
              color={Colors.menuText}
            />
          </TouchableOpacity>
        )}
      />

      {/* Modal de precios */}
      {selectedStore && (
        <StoreZonePricesModal
          visible={!!selectedStore}
          store={selectedStore}
          token={token}
          onClose={() => setSelectedStore(null)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: Colors.Background },

  title: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 20,
    color: Colors.normalText,
    letterSpacing: 0.5,
  },

  card: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    marginBottom: 14,
    backgroundColor: Colors.activeMenuBackground,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.Border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },

  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: Colors.Border,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },

  cardContent: { flex: 1 },

  cardTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.normalText,
    marginBottom: 4,
  },

  cardSubtitle: {
    fontSize: 13,
    color: Colors.menuText,
  },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.Background,
  },

  loadingText: {
    marginTop: 10,
    fontSize: 14,
    color: Colors.menuText,
  },
});
