import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  FlatList,
  RefreshControl,
} from "react-native";
import { useAuth } from "../../../../providers/AuthProvider";
import { Colors } from "../../../../constans/colors";
import { fetchStores } from "../../../../services/stores";
import { Ionicons } from "@expo/vector-icons";
import StorePaymentSummaryScreen from "./StorePaymentSummaryScreen";

/**
 * CoordinatorStoreDebtScreen - Pantalla de deuda de tiendas
 */
export default function CoordinatorStoreDebtScreen() {
  const { session } = useAuth();

  const [stores, setStores] = useState<any[]>([]);
  const [loadingStores, setLoadingStores] = useState(true);
  const [refreshingStores, setRefreshingStores] = useState(false);

  const [selectedStore, setSelectedStore] = useState<any | null>(null);

  useEffect(() => { loadStores(); }, [session]);

  const loadStores = async () => {
    if (!session?.access_token) return;
    setLoadingStores(true);
    try {
      const data = await fetchStores(session.access_token);
      setStores(Array.isArray(data) ? data : []);
    } catch (err) {
      setStores([]);
    } finally {
      setLoadingStores(false);
      setRefreshingStores(false);
    }
  };

  

  const renderStoreItem = ({ item }: { item: any }) => (
    <TouchableOpacity style={styles.recordCard} onPress={() => { setSelectedStore(item); }}>
      <View style={styles.recordHeader}>
        <View>
          <Text style={styles.storeName}>{item.name}</Text>
          <Text style={styles.storeId}>{item.id}</Text>
        </View>
        <View style={styles.statusContainer}>
          <Ionicons name="chevron-forward" size={18} color={Colors.menuText} />
        </View>
      </View>
      <View style={styles.recordBody}>
        <Text style={styles.label}>{item.address || ''}</Text>
      </View>
    </TouchableOpacity>
  );

  if (loadingStores) return (
    <View style={styles.loadingContainer}><ActivityIndicator size="large" color={Colors.activeMenuText} /><Text style={styles.loadingText}>Cargando tiendas...</Text></View>
  );

  return (
    <View style={styles.container}>
      {selectedStore ? (
        <>
          <StorePaymentSummaryScreen store={selectedStore} onClose={() => setSelectedStore(null)} />
        </>
      ) : (
        <>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Tiendas</Text>
            <Text style={styles.headerSubtitle}>{stores.length} tienda{stores.length !== 1 ? 's' : ''}</Text>
          </View>

          <FlatList data={stores} renderItem={renderStoreItem} keyExtractor={(i)=>i.id} contentContainerStyle={styles.listContent} refreshControl={<RefreshControl refreshing={refreshingStores} onRefresh={()=>{ setRefreshingStores(true); loadStores(); }} />} ListEmptyComponent={<Text style={styles.emptyStateText}>No hay tiendas.</Text>} />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.Background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: Colors.menuText,
  },
  header: {
    backgroundColor: Colors.gradientStart,
    paddingHorizontal: 16,
    paddingVertical: 20,
    paddingTop: 30,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: Colors.Background,
  },
  headerSubtitle: {
    fontSize: 12,
    color: Colors.Background,
    marginTop: 4,
    opacity: 0.8,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 20,
  },
  recordCard: {
    backgroundColor: Colors.activeMenuBackground,
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: Colors.warning,
  },
  recordHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  storeName: {
    fontSize: 14,
    fontWeight: "bold",
    color: Colors.normalText,
  },
  storeId: {
    fontSize: 11,
    color: Colors.menuText,
    marginTop: 2,
  },
  statusContainer: {
    alignItems: "flex-end",
  },
  recordBody: {
    marginBottom: 0,
  },
  label: {
    fontSize: 12,
    color: Colors.menuText,
  },
  emptyStateText: {
    fontSize: 13,
    color: Colors.menuText,
    textAlign: "center",
    paddingHorizontal: 32,
    marginTop: 50,
  },
});
