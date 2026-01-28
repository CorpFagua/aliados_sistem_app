import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  FlatList,
  RefreshControl,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import AntDesign from "@expo/vector-icons/AntDesign";
import Ionicons from "@expo/vector-icons/Ionicons";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useAuth } from "../../../../providers/AuthProvider";
import { fetchServices } from "../../../../services/services";
import { Colors } from "../../../../constans/colors";

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
  }).format(amount);
};

export default function StoreHistoryScreen() {
  const { session } = useAuth();
  const { back } = useRouter();
  
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [activeTab, setActiveTab] = useState<"delivered" | "history">("delivered");
  const [error, setError] = useState<string | null>(null);

  // Estados independientes para cada tab
  const [deliveredData, setDeliveredData] = useState({
    items: [] as any[],
    page: 1,
    hasMore: true,
    loading: true,
    refreshing: false,
  });

  const [historyData, setHistoryData] = useState({
    items: [] as any[],
    page: 1,
    hasMore: true,
    loading: true,
    refreshing: false,
  });

  const ITEMS_PER_PAGE = 15;

  // Helper para obtener datos de tab activa
  const getCurrentTabData = () => (activeTab === "delivered" ? deliveredData : historyData);
  const setCurrentTabData = (data: any) => {
    if (activeTab === "delivered") {
      setDeliveredData(data);
    } else {
      setHistoryData(data);
    }
  };

  useEffect(() => {
    if (session?.access_token) {
      const currentData = getCurrentTabData();
      // Solo cargar si no tiene datos
      if (currentData.items.length === 0 && currentData.loading) {
        console.log(`🏪 [StoreHistory] Iniciando carga de ${activeTab}...`);
        loadServices(1, true);
      }
    }
  }, [session?.access_token, activeTab]);

  const loadServices = async (pageNum: number = 1, isRefresh: boolean = false) => {
    if (!session?.access_token) {
      setError("No hay sesión activa");
      setCurrentTabData({ ...getCurrentTabData(), loading: false });
      return;
    }

    const currentData = getCurrentTabData();
    
    if (isRefresh) {
      setCurrentTabData({ ...currentData, refreshing: true, page: 1 });
    } else {
      setCurrentTabData({ ...currentData, loading: true });
    }
    
    setError(null);
    try {
      const allData = await fetchServices(session.access_token);
      console.log(`✅ [StoreHistory] Servicios obtenidos: ${allData.length}`);
      

      
      // Filtrar según la tab activa
      let filteredServices = allData;
      if (activeTab === "delivered") {
        filteredServices = allData.filter((service) => service.status === "entregado");
      } else if (activeTab === "history") {
        filteredServices = allData.filter(
          (service) => service.status === "cancelado" || service.status === "pago"
        );
      }
      
      const newData = isRefresh 
        ? filteredServices 
        : [...currentData.items, ...filteredServices];
      
      setCurrentTabData({
        items: newData,
        page: pageNum + 1,
        hasMore: filteredServices.length === ITEMS_PER_PAGE,
        loading: false,
        refreshing: false,
      });
      
      console.log(`📊 [${activeTab}] Items actuales: ${newData.length}, hasMore: ${filteredServices.length === ITEMS_PER_PAGE}`);
    } catch (err: any) {
      const message = err.response?.data?.message || err.response?.data?.error || err.message || "Error al cargar servicios";
      console.error("❌ Error en loadServices:", err);
      setError(message);
      
      if (isRefresh) {
        setCurrentTabData({ ...currentData, items: [], loading: false, refreshing: false });
      } else {
        setCurrentTabData({ ...currentData, loading: false });
      }
    }
  };

  const handleLoadMore = () => {
    const currentData = getCurrentTabData();
    if (!currentData.loading && currentData.hasMore) {
      loadServices(currentData.page, false);
    }
  };

  const handleTabChange = (tab: "delivered" | "history") => {
    setActiveTab(tab);
  };

  const renderOrderCard = ({ item }: { item: any }) => {
    const statusColor = item.status === "entregado" ? "#4caf50" : item.status === "pago" ? "#2196F3" : "#ff3d00";
    const statusLabel = item.status === "entregado" ? "Entregado" : item.status === "pago" ? "Pago" : "Cancelado";
    
    return (
      <TouchableOpacity
        style={[styles.orderCard, item.status === "cancelado" && styles.orderCardCancelled]}
        onPress={() => {
          setSelectedOrder(item);
          setShowModal(true);
        }}
        activeOpacity={0.7}
      >
        {/* Header: Número de pedido + Status Badge */}
        <View style={styles.cardHeader}>
          <View>
            <Text style={styles.cardTitle}>Pedido #{item.id?.slice(-6) || "N/A"}</Text>
            <Text style={styles.cardDate}>
              {item.createdAt ? new Date(item.createdAt).toLocaleDateString("es-CO", { 
                day: "2-digit", 
                month: "short", 
                year: "numeric" 
              }) : "N/A"}
            </Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
            <Ionicons 
              name={item.status === "entregado" ? "checkmark-circle" : item.status === "pago" ? "checkmark-circle" : "close-circle"}
              size={18}
              color="#FFFFFF"
            />
            <Text style={styles.statusText}>{statusLabel}</Text>
          </View>
        </View>

        {/* Detalles principales */}
        <View style={styles.cardDetailsSection}>
          <View style={styles.detailRow}>
            <View style={styles.detailItem}>
              <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 4 }}>
                <AntDesign name="user" size={14} color="#2196F3" style={{ marginRight: 6 }} />
                <Text style={styles.detailLabel}>Cliente</Text>
              </View>
              <Text style={styles.detailValue}>{item.clientName || "N/A"}</Text>
            </View>
            <View style={styles.detailItem}>
              <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 4 }}>
                <MaterialCommunityIcons name="truck-fast" size={14} color="#9C27B0" style={{ marginRight: 6 }} />
                <Text style={styles.detailLabel}>Domiciliario</Text>
              </View>
              <Text style={styles.detailValue}>{item.assignedDeliveryName || "Pendiente"}</Text>
            </View>
          </View>

          <View style={styles.detailRow}>
            <View style={styles.detailItem}>
              <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 4 }}>
                <MaterialCommunityIcons name="map-marker" size={14} color="#FF9800" style={{ marginRight: 6 }} />
                <Text style={styles.detailLabel}>Dirección</Text>
              </View>
              <Text style={styles.detailValue} numberOfLines={2}>{item.destination || "N/A"}</Text>
            </View>
          </View>
        </View>

        {/* Total y Método */}
        <View style={styles.cardFooterSection}>
          <View style={styles.amountBox}>
            <Text style={styles.amountLabel}>Total Cobrado</Text>
            <Text style={styles.amountValue}>{formatCurrency(parseFloat(item.amount) || 0)}</Text>
          </View>
          <View style={styles.methodBox}>
            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 4 }}>
              <MaterialCommunityIcons name="credit-card" size={14} color="#2196F3" style={{ marginRight: 6 }} />
              <Text style={styles.detailLabel}>Método</Text>
            </View>
            <Text style={styles.detailValue}>{item.payment || "N/A"}</Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.cardTapIndicator}>
          <Text style={styles.cardTapText}>Ver más detalles →</Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = (message: string) => (
    <ScrollView
      contentContainerStyle={styles.emptyContent}
      refreshControl={<RefreshControl refreshing={getCurrentTabData().refreshing} onRefresh={() => loadServices(1, true)} />}
    >
      <View style={styles.emptyState}>
        <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: "#e8f5e9", justifyContent: "center", alignItems: "center", marginBottom: 16, borderWidth: 2, borderColor: "#4caf50" }}>
          <Text style={{ fontSize: 44, fontWeight: "300", color: "#4caf50" }}>✓</Text>
        </View>
        <Text style={styles.emptyStateTitle}>{message}</Text>
        <Text style={styles.emptyStateText}>
          Aquí aparecerán los pedidos cuando haya actividad
        </Text>
      </View>
    </ScrollView>
  );

  if (deliveredData.loading && deliveredData.items.length === 0 && historyData.loading && historyData.items.length === 0) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.activeMenuText} />
        <Text style={styles.loadingText}>Cargando servicios...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {error ? (
        <View style={{ backgroundColor: "#fee2e2", padding: 12, marginBottom: 10, marginHorizontal: 12, borderRadius: 8, borderLeftWidth: 4, borderLeftColor: "#dc2626" }}>
          <Text style={{ color: "#7f1d1d", fontWeight: "700", marginBottom: 4, fontSize: 13 }}>Error al cargar servicios</Text>
          <Text style={{ color: "#991b1b", fontSize: 12, marginBottom: 8 }}>{String(error)}</Text>
          <TouchableOpacity style={{ paddingVertical: 6 }} onPress={() => loadServices(1, true)}>
            <Text style={{ color: Colors.activeMenuText, fontWeight: "600", fontSize: 12 }}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      <View style={styles.header}>
        <TouchableOpacity style={{ flexDirection: "row", alignItems: "center" }} onPress={() => back()}>
          <AntDesign name="arrow-left" size={24} color={Colors.normalText} />
          <Text style={styles.headerTitle}>Historial</Text>
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "delivered" && styles.activeTab]}
          onPress={() => handleTabChange("delivered")}
        >
          <Text style={[styles.tabText, activeTab === "delivered" && styles.activeTabText]}>
            Entregados ({deliveredData.items.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === "history" && styles.activeTab]}
          onPress={() => handleTabChange("history")}
        >
          <Text style={[styles.tabText, activeTab === "history" && styles.activeTabText]}>
            Historial ({historyData.items.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      {getCurrentTabData().loading && getCurrentTabData().items.length === 0 ? (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator size="large" color={Colors.activeMenuText} />
          <Text style={{ marginTop: 10, color: Colors.menuText }}>Cargando historial...</Text>
        </View>
      ) : getCurrentTabData().items.length === 0 ? (
        renderEmptyState("Sin historial")
      ) : (
        <FlatList
          data={getCurrentTabData().items}
          keyExtractor={(item) => (item.id ? String(item.id) : Math.random().toString())}
          renderItem={renderOrderCard}
          contentContainerStyle={styles.listContainer}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          refreshControl={<RefreshControl refreshing={getCurrentTabData().refreshing} onRefresh={() => loadServices(1, true)} />}
          ListFooterComponent={
            getCurrentTabData().loading && getCurrentTabData().items.length > 0 ? (
              <View style={{ paddingVertical: 16 }}>
                <ActivityIndicator size="small" color={Colors.activeMenuText} />
              </View>
            ) : null
          }
        />
      )}

      {/* Modal de detalles */}
      <Modal
        visible={showModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Detalles del Pedido</Text>
              <TouchableOpacity onPress={() => setShowModal(false)} style={{ padding: 8 }}>
                <Text style={styles.closeButton}>×</Text>
              </TouchableOpacity>
            </View>

            {selectedOrder && (
              <ScrollView style={styles.modalBody} contentContainerStyle={{ paddingBottom: 24 }}>
                {/* Status Header */}
                <View style={styles.statusHeader}>
                  <View style={styles.statusHeaderContent}>
                    <Text style={styles.modalOrderId}>Pedido #{selectedOrder.id?.slice(-6)}</Text>
                    <Text style={styles.statusHeaderLabel}>
                      {selectedOrder.status === "entregado" ? "Entregado" : selectedOrder.status === "pago" ? "Pago" : "Cancelado"}
                    </Text>
                  </View>
                  <View style={[styles.largeStatusBadge, { 
                    backgroundColor: selectedOrder.status === "entregado" ? "#4caf50" : selectedOrder.status === "pago" ? "#2196F3" : "#ff3d00" 
                  }]}>
                    <Ionicons 
                      name={selectedOrder.status === "entregado" ? "checkmark-circle" : selectedOrder.status === "pago" ? "checkmark-circle" : "close-circle"}
                      size={32}
                      color="#FFFFFF"
                    />
                  </View>
                </View>

                <View style={styles.divider} />

                {/* Total Cobrado - Destacado */}
                <View style={styles.highlightSection}>
                  <Text style={styles.highlightLabel}>Total Cobrado</Text>
                  <Text style={styles.highlightAmount}>
                    {formatCurrency(parseFloat(selectedOrder.amount) || 0)}
                  </Text>
                </View>

                <View style={styles.divider} />

                {/* Información del Cliente */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>
                    <AntDesign name="user" size={16} color={Colors.activeMenuText} /> Cliente
                  </Text>
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Nombre</Text>
                    <Text style={styles.detailValue}>{selectedOrder.clientName || "N/A"}</Text>
                  </View>
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Teléfono</Text>
                    <Text style={styles.detailValue}>{selectedOrder.phone || "N/A"}</Text>
                  </View>
                </View>

                <View style={styles.divider} />

                {/* Entrega */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>
                    <MaterialCommunityIcons name="map-marker" size={16} color={Colors.activeMenuText} /> Entrega
                  </Text>
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Dirección</Text>
                    <Text style={styles.detailValue}>{selectedOrder.destination || "N/A"}</Text>
                  </View>
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Domiciliario</Text>
                    <Text style={styles.detailValue}>
                      {selectedOrder.assignedDeliveryName || "Pendiente"}
                    </Text>
                  </View>
                </View>

                <View style={styles.divider} />

                {/* Pago */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>
                    <MaterialCommunityIcons name="cash-check" size={16} color={Colors.activeMenuText} /> Información de Pago
                  </Text>
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Método</Text>
                    <Text style={styles.detailValue}>{selectedOrder.payment || "N/A"}</Text>
                  </View>
                </View>

                <View style={styles.divider} />

                {/* Cronología */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>
                    <Ionicons name="calendar" size={16} color={Colors.activeMenuText} /> Cronología
                  </Text>

                  <View style={styles.timelineItem}>
                    <View style={[styles.timelineDot, { backgroundColor: "#2196F3" }]} />
                    <View style={styles.timelineContent}>
                      <Text style={styles.timelineLabel}>Creado</Text>
                      <Text style={styles.timelineTime}>
                        {selectedOrder.createdAt
                          ? new Date(selectedOrder.createdAt).toLocaleString("es-CO")
                          : "N/A"}
                      </Text>
                    </View>
                  </View>

                  {selectedOrder.assignedAt && (
                    <View style={styles.timelineItem}>
                      <View style={[styles.timelineDot, { backgroundColor: "#FF9800" }]} />
                      <View style={styles.timelineContent}>
                        <Text style={styles.timelineLabel}>Asignado</Text>
                        <Text style={styles.timelineTime}>
                          {new Date(selectedOrder.assignedAt).toLocaleString("es-CO")}
                        </Text>
                      </View>
                    </View>
                  )}

                  {selectedOrder.completedAt && (
                    <View style={styles.timelineItem}>
                      <View style={[styles.timelineDot, { backgroundColor: "#4caf50" }]} />
                      <View style={styles.timelineContent}>
                        <Text style={styles.timelineLabel}>Entregado</Text>
                        <Text style={styles.timelineTime}>
                          {new Date(selectedOrder.completedAt).toLocaleString("es-CO")}
                        </Text>
                      </View>
                    </View>
                  )}
                </View>

                {selectedOrder.notes && (
                  <>
                    <View style={styles.divider} />
                    <View style={styles.section}>
                      <Text style={styles.sectionTitle}>
                        <Ionicons name="document-text" size={16} color={Colors.activeMenuText} /> Notas
                      </Text>
                      <View style={styles.notesBox}>
                        <Text style={styles.notesText}>{selectedOrder.notes}</Text>
                      </View>
                    </View>
                  </>
                )}
              </ScrollView>
            )}

            <TouchableOpacity style={styles.closeModalButton} onPress={() => setShowModal(false)}>
              <Text style={styles.closeModalButtonText}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.Background,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: Colors.normalText,
    marginLeft: 12,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    color: Colors.menuText,
    fontSize: 14,
  },
  emptyContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingBottom: 60,
  },
  emptyState: {
    alignItems: "center",
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.normalText,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: Colors.menuText,
    textAlign: "center",
    maxWidth: 300,
  },

  // Tabs
  tabContainer: {
    flexDirection: "row",
    paddingHorizontal: 12,
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.Border,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: "center",
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  activeTab: {
    borderBottomColor: Colors.activeMenuText,
  },
  tabText: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.menuText,
  },
  activeTabText: {
    color: Colors.activeMenuText,
  },

  // List
  listContainer: {
    paddingHorizontal: 4,
    paddingTop: 10,
    paddingBottom: 30,
  },
  orderCard: {
    backgroundColor: Colors.activeMenuBackground,
    marginHorizontal: 12,
    marginVertical: 8,
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: Colors.activeMenuText,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  orderCardCancelled: {
    opacity: 0.65,
    borderLeftColor: "#ff3d00",
  },
  orderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  amountColumn: {
    alignItems: "flex-end",
  },
  orderNumber: {
    fontSize: 15,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  orderDate: {
    fontSize: 12,
    color: "#A0A0A0",
    marginTop: 4,
  },
  orderBody: {
    marginVertical: 8,
  },
  infoRow: {
    flexDirection: "row",
    marginBottom: 10,
    alignItems: "flex-start",
  },
  infoLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#B0B0B0",
    marginRight: 12,
    minWidth: 70,
  },
  infoValue: {
    fontSize: 13,
    color: "#E8E8E8",
    fontWeight: "500",
    flex: 1,
  },
  tapIndicator: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#3A3A3C",
  },
  tapText: {
    fontSize: 11,
    color: "#FFD700",
    fontWeight: "700",
    textAlign: "right",
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: Colors.Background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 16,
    maxHeight: "90%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.Border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.normalText,
  },
  closeButton: {
    fontSize: 28,
    color: Colors.menuText,
    fontWeight: "300",
    lineHeight: 28,
  },
  modalBody: {
    marginBottom: 20,
  },
  summarySection: {
    backgroundColor: "#252527",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: Colors.activeMenuText,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
    alignItems: "center",
  },
  summaryLabel: {
    fontSize: 14,
    color: "#A8A8A8",
    fontWeight: "500",
  },
  summaryValue: {
    fontSize: 14,
    color: "#FFFFFF",
    fontWeight: "700",
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.normalText,
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 2,
    borderBottomColor: Colors.activeMenuText,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.Border,
    marginVertical: 16,
  },
  timelineItem: {
    flexDirection: "row",
    marginBottom: 20,
    paddingLeft: 12,
  },
  timelineDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: Colors.activeMenuText,
    marginRight: 16,
    marginTop: 3,
  },
  timelineContent: {
    flex: 1,
  },
  timelineLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#FFFFFF",
    marginBottom: 4,
  },
  timelineTime: {
    fontSize: 12,
    color: "#A0A0A0",
    lineHeight: 18,
  },
  closeModalButton: {
    marginHorizontal: 0,
    marginBottom: 0,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: Colors.activeMenuText,
    alignItems: "center",
  },
  closeModalButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#fff",
  },

  // Nuevos estilos para modal mejorado
  statusHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#252527",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  statusHeaderContent: {
    flex: 1,
  },
  modalOrderId: {
    fontSize: 12,
    color: "#A8A8A8",
    fontWeight: "500",
    marginBottom: 4,
  },
  statusHeaderLabel: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  largeStatusBadge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
  },
  largeStatusText: {
    fontSize: 28,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  highlightSection: {
    backgroundColor: "#252527",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: Colors.activeMenuText,
    alignItems: "center",
  },
  highlightLabel: {
    fontSize: 12,
    color: "#A8A8A8",
    fontWeight: "500",
    marginBottom: 8,
  },
  highlightAmount: {
    fontSize: 32,
    fontWeight: "700",
    color: Colors.activeMenuText,
  },
  notesBox: {
    backgroundColor: "#2A2A2C",
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
    borderLeftWidth: 3,
    borderLeftColor: Colors.activeMenuText,
  },
  notesText: {
    fontSize: 13,
    color: "#E8E8E8",
    lineHeight: 19,
    fontWeight: "500",
  },

  // Estilos para la tarjeta (renderOrderCard)
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.normalText,
  },
  cardDate: {
    fontSize: 11,
    color: "#A8A8A8",
    marginTop: 4,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  cardDetailsSection: {
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 12,
  },
  detailItem: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 11,
    color: "#A8A8A8",
    fontWeight: "600",
  },
  detailValue: {
    fontSize: 13,
    color: "#FFFFFF",
    fontWeight: "600",
    marginTop: 4,
  },
  cardFooterSection: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 12,
  },
  amountBox: {
    flex: 1,
    backgroundColor: "#252527",
    borderRadius: 8,
    padding: 12,
  },
  amountLabel: {
    fontSize: 11,
    color: "#A8A8A8",
    fontWeight: "600",
  },
  amountValue: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.activeMenuText,
    marginTop: 4,
  },
  methodBox: {
    flex: 1,
    backgroundColor: "#252527",
    borderRadius: 8,
    padding: 12,
  },
  cardTapIndicator: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#3A3A3C",
    alignItems: "flex-end",
  },
  cardTapText: {
    fontSize: 11,
    color: Colors.activeMenuText,
    fontWeight: "700",
  },
  twoColumnRow: {
    flexDirection: "row",
    gap: 16,
    marginVertical: 12,
  },
  halfWidth: {
    flex: 1,
  },
  totalSection: {
    backgroundColor: "#252527",
    borderRadius: 8,
    padding: 12,
    marginVertical: 12,
    alignItems: "center",
  },
  totalAmount: {
    fontSize: 20,
    fontWeight: "700",
    color: Colors.activeMenuText,
  },
  paymentMethod: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },
  paymentLabel: {
    fontSize: 12,
    color: "#A8A8A8",
    fontWeight: "500",
  },
  paymentValue: {
    fontSize: 12,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  cardFooter: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#3A3A3C",
    alignItems: "flex-end",
  },
});
