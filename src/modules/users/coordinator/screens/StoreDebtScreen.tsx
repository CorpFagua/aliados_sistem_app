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
  summaryContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    gap: 10,
  },
  summaryCard: {
    backgroundColor: Colors.activeMenuBackground,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
  },
  summaryLabel: {
    fontSize: 11,
    color: Colors.menuText,
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: Colors.activeMenuText,
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
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: Colors.warning,
  },
  recordHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  storeName: {
    fontSize: 14,
    fontWeight: "bold",
    color: Colors.normalText,
  },
  storeId: {
    fontSize: 12,
    color: Colors.menuText,
    marginTop: 2,
  },
  statusContainer: {
    alignItems: "flex-end",
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    color: "white",
    fontSize: 11,
    fontWeight: "bold",
  },
  recordBody: {
    marginBottom: 8,
  },
  amountRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  pendingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.Border,
  },
  label: {
    fontSize: 12,
    color: Colors.menuText,
  },
  period: {
    fontSize: 12,
    color: Colors.normalText,
  },
  amount: {
    fontSize: 12,
    fontWeight: "500",
    color: Colors.normalText,
  },
  pendingAmount: {
    fontSize: 13,
    fontWeight: "bold",
    color: Colors.error,
  },
  actionContainer: {
    borderTopWidth: 1,
    borderTopColor: Colors.Border,
    paddingTop: 12,
  },
  actionButton: {
    backgroundColor: Colors.success,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  actionButtonText: {
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingBottom: 100,
  },
  emptyStateIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyStateTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: Colors.normalText,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 13,
    color: Colors.menuText,
    textAlign: "center",
    paddingHorizontal: 32,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modal: {
    backgroundColor: Colors.activeMenuBackground,
    borderRadius: 12,
    padding: 20,
    width: "80%",
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: Colors.normalText,
    marginBottom: 12,
  },
  modalText: {
    fontSize: 13,
    color: Colors.menuText,
    textAlign: "center",
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
  },
  modalButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  cancelButton: {
    backgroundColor: Colors.Border,
  },
  cancelButtonText: {
    color: Colors.menuText,
    fontSize: 12,
    fontWeight: "bold",
  },
  confirmButton: {
    backgroundColor: Colors.success,
  },
  confirmButtonText: {
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
  },
  backButtonText: {
    color: Colors.activeMenuText,
    marginLeft: 8,
    fontWeight: '600',
  },
  tabRow: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    gap: 8,
    marginBottom: 8,
  },
  tabButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.activeMenuBackground,
  },
  tabActive: {
    backgroundColor: Colors.gradientStart,
  },
  tabText: {
    color: Colors.menuText,
  },
  tabTextActive: {
    color: Colors.Background,
    fontWeight: '700',
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    gap: 8,
    marginBottom: 8,
  },
  dateInputTouchable: {
    flex: 1,
    backgroundColor: Colors.activeMenuBackground,
    padding: 10,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateInputText: {
    color: Colors.menuText,
  },
  selectRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    marginBottom: 8,
    alignItems: 'center',
  },
  payBtn: {
    backgroundColor: Colors.warning,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  serviceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: Colors.activeMenuBackground,
    borderRadius: 10,
    marginBottom: 10,
  },
  serviceTitle: {
    color: Colors.normalText,
    fontWeight: '600',
  },
  serviceDetail: {
    color: Colors.menuText,
    fontSize: 12,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.Border,
  },
  methodBtn: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: Colors.activeMenuBackground,
    borderRadius: 8,
  },
  methodBtnActive: {
    backgroundColor: Colors.gradientStart,
  },
  input: {
    width: '100%',
    backgroundColor: Colors.activeMenuBackground,
    padding: 10,
    borderRadius: 8,
    color: Colors.menuText,
    marginBottom: 12,
  },
});
