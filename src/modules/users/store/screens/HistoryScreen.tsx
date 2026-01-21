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
import { useAuth } from "../../../../providers/AuthProvider";
import { fetchServices } from "../../../../services/services";
import { Colors } from "../../../../constans/colors";
import { useRouter } from "expo-router";
import AntDesign from "@expo/vector-icons/AntDesign";
import { usePayments, useServicesDetail } from "../../../../hooks/usePayments";

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
  const { getStorePaymentSnapshots } = usePayments(session?.access_token || null);
  const { getServicesDetail, downloadServicesExcel, loading: loadingServicesDetail } = useServicesDetail(session?.access_token || null);
  
  const [allServices, setAllServices] = useState<any[]>([]);
  const [snapshots, setSnapshots] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingSnapshots, setLoadingSnapshots] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"deliveries" | "invoices" | "snapshots">("deliveries");
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [selectedSnapshot, setSelectedSnapshot] = useState<any | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showSnapshotModal, setShowSnapshotModal] = useState(false);
  
  // Estados para el modal de servicios detallados
  const [servicesDetail, setServicesDetail] = useState<any[]>([]);
  const [showServicesDetailModal, setShowServicesDetailModal] = useState(false);

  useEffect(() => {
    if (session?.access_token) {
      console.log("🏪 [StoreHistory] Iniciando carga de servicios...");
      loadServices();
    }
  }, [session?.access_token]);

  // Cargar snapshots cuando se cambia a esa tab
  useEffect(() => {
    if (activeTab === "snapshots" && session?.access_token) {
      console.log("📋 [StoreHistory] Tab snapshots activa, cargando...");
      loadSnapshots();
    }
  }, [activeTab, session?.access_token]);

  const loadServices = async () => {
    if (!session?.access_token) {
      setError("No hay sesión activa");
      setLoading(false);
      return;
    }

    setRefreshing(true);
    setError(null);
    try {
      const services = await fetchServices(session.access_token);
      console.log(`✅ [StoreHistory] Servicios obtenidos: ${services.length}`);
      setAllServices(services);
    } catch (err: any) {
      const message = err.response?.data?.message || err.response?.data?.error || err.message || "Error al cargar servicios";
      console.error("❌ Error en loadServices:", err);
      setError(message);
      setAllServices([]);
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  };

  const loadSnapshots = async () => {
    if (!session?.access_token) {
      setError("No hay sesión activa");
      return;
    }

    setLoadingSnapshots(true);
    try {
      console.log("📋 [StoreHistory] Llamando a getStorePaymentSnapshots...");
      // Sin parámetro storeId - el backend lo extrae del perfil
      const data = await getStorePaymentSnapshots();
      console.log(`✅ [StoreHistory] Snapshots recibidos: ${data.length}`);
      setSnapshots(data);
    } catch (err: any) {
      const message = err.response?.data?.message || err.response?.data?.error || err.message || "Error al cargar snapshots";
      console.error("❌ Error en loadSnapshots:", err);
      setError(message);
      setSnapshots([]);
    } finally {
      setLoadingSnapshots(false);
    }
  };

  // Filtrar servicios entregados
  const deliveredServices = allServices.filter(
    (service) => service.status === "entregado"
  );

  // Filtrar servicios con pedidos no pagados (facturas pendientes)
  const invoiceServices = allServices.filter(
    (service) => service.status === "entregado" && !service.isPaid
  );

  const renderOrderCard = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.orderCard}
      onPress={() => {
        setSelectedOrder(item);
        setShowModal(true);
      }}
      activeOpacity={0.7}
    >
      <View style={styles.orderHeader}>
        <View style={{ flex: 1 }}>
          <Text style={styles.orderNumber}>Pedido {item.id || "N/A"}</Text>
          <Text style={styles.orderDate}>
            {item.createdAt ? new Date(item.createdAt).toLocaleDateString("es-CO") : "N/A"}
          </Text>
        </View>
        <View style={styles.amountColumn}>
          <Text style={styles.amountLabel}>Total</Text>
          <Text style={styles.amountValue}>{formatCurrency(parseFloat(item.amount) || 0)}</Text>
        </View>
      </View>

      <View style={styles.orderBody}>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Cliente:</Text>
          <Text style={styles.infoValue} numberOfLines={1}>
            {item.clientName || "N/A"}
          </Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Dirección:</Text>
          <Text style={styles.infoValue} numberOfLines={2}>
            {item.destination || "N/A"}
          </Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Domiciliario:</Text>
          <Text style={styles.infoValue} numberOfLines={1}>
            {item.assignedDeliveryName || "Sin asignar"}
          </Text>
        </View>
      </View>

      <View style={styles.tapIndicator}>
        <Text style={styles.tapText}>Ver detalles  ›</Text>
      </View>
    </TouchableOpacity>
  );

  const handleViewServicesDetail = async (serviceIds: string[]) => {
    if (serviceIds.length === 0) {
      setError("No hay servicios para mostrar");
      return;
    }

    try {
      const details = await getServicesDetail(serviceIds);
      setServicesDetail(details);
      setShowServicesDetailModal(true);
    } catch (err: any) {
      setError("Error al cargar detalles de servicios");
      console.error(err);
    }
  };

  const handleDownloadExcel = async (serviceIds: string[]) => {
    if (serviceIds.length === 0) {
      setError("No hay servicios para descargar");
      return;
    }

    try {
      await downloadServicesExcel(serviceIds, `servicios-${Date.now()}.xlsx`);
    } catch (err: any) {
      setError("Error al descargar Excel");
      console.error(err);
    }
  };

  const renderSnapshotCard = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.orderCard}
      onPress={() => {
        setSelectedSnapshot(item);
        setShowSnapshotModal(true);
      }}
      activeOpacity={0.7}
    >
      <View style={styles.orderHeader}>
        <View style={{ flex: 1 }}>
          <Text style={styles.orderNumber}>Pre-factura {item.id?.slice(-8) || "N/A"}</Text>
          <Text style={styles.orderDate}>
            {item.period_start && item.period_end
              ? `${item.period_start} a ${item.period_end}`
              : new Date(item.created_at).toLocaleDateString("es-CO")}
          </Text>
        </View>
        <View style={styles.amountColumn}>
          <Text style={styles.amountLabel}>Total</Text>
          <Text style={styles.amountValue}>{formatCurrency(item.total_amount || 0)}</Text>
        </View>
      </View>

      <View style={styles.orderBody}>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Estado:</Text>
          <Text
            style={[
              styles.infoValue,
              { color: item.status === "paid" ? "#4caf50" : "#ff9800" },
            ]}
          >
            {item.status === "paid" ? "Pagada" : "Pendiente"}
          </Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Servicios:</Text>
          <Text style={styles.infoValue}>{item.services_count || 0}</Text>
        </View>
      </View>

      <View style={styles.tapIndicator}>
        <Text style={styles.tapText}>Ver detalles  ›</Text>
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = (message: string) => (
    <ScrollView
      contentContainerStyle={styles.emptyContent}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadServices} />}
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

  if (loading && allServices.length === 0) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.activeMenuText} />
        <Text style={styles.loadingText}>Cargando servicios...</Text>
      </SafeAreaView>
    );
  }

  const currentData = activeTab === "deliveries" ? deliveredServices : invoiceServices;

  return (
    <SafeAreaView style={styles.container}>
      {error ? (
        <View style={{ backgroundColor: "#fee2e2", padding: 12, marginBottom: 10, marginHorizontal: 12, borderRadius: 8, borderLeftWidth: 4, borderLeftColor: "#dc2626" }}>
          <Text style={{ color: "#7f1d1d", fontWeight: "700", marginBottom: 4, fontSize: 13 }}>Error al cargar servicios</Text>
          <Text style={{ color: "#991b1b", fontSize: 12, marginBottom: 8 }}>{String(error)}</Text>
          <TouchableOpacity style={{ paddingVertical: 6 }} onPress={loadServices}>
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
          style={[styles.tab, activeTab === "deliveries" && styles.activeTab]}
          onPress={() => setActiveTab("deliveries")}
        >
          <Text style={[styles.tabText, activeTab === "deliveries" && styles.activeTabText]}>
            Pedidos Entregados ({deliveredServices.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === "invoices" && styles.activeTab]}
          onPress={() => setActiveTab("invoices")}
        >
          <Text style={[styles.tabText, activeTab === "invoices" && styles.activeTabText]}>
            Facturas Pendientes ({invoiceServices.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === "snapshots" && styles.activeTab]}
          onPress={() => setActiveTab("snapshots")}
        >
          <Text style={[styles.tabText, activeTab === "snapshots" && styles.activeTabText]}>
            Pre-facturas {loadingSnapshots && "⏳"} ({snapshots.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      {activeTab === "snapshots" ? (
        loadingSnapshots ? (
          <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
            <ActivityIndicator size="large" color={Colors.activeMenuText} />
            <Text style={{ marginTop: 10, color: Colors.menuText }}>Cargando pre-facturas...</Text>
          </View>
        ) : snapshots.length === 0 ? (
          renderEmptyState("Sin pre-facturas")
        ) : (
          <FlatList
            data={snapshots}
            keyExtractor={(item) => item.id || Math.random().toString()}
            renderItem={renderSnapshotCard}
            contentContainerStyle={styles.listContainer}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadSnapshots} />}
          />
        )
      ) : currentData.length === 0 ? (
        renderEmptyState(
          activeTab === "deliveries" ? "Sin pedidos entregados" : "Sin facturas pendientes"
        )
      ) : (
        <FlatList
          data={currentData}
          keyExtractor={(item) => (item.id ? String(item.id) : Math.random().toString())}
          renderItem={renderOrderCard}
          contentContainerStyle={styles.listContainer}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadServices} />}
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
                {/* Sección de resumen */}
                <View style={styles.summarySection}>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Pedido</Text>
                    <Text style={styles.summaryValue}>{selectedOrder.id || "N/D"}</Text>
                  </View>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Total a Cobrar</Text>
                    <Text style={[styles.summaryValue, { color: Colors.activeMenuText, fontSize: 18, fontWeight: "700" }]}>
                      {formatCurrency(parseFloat(selectedOrder.amount) || 0)}
                    </Text>
                  </View>
                </View>

                <View style={styles.divider} />

                {/* Información del Cliente */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Cliente</Text>
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

                {/* Información de la entrega */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Detalles de Entrega</Text>
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Dirección</Text>
                    <Text style={styles.detailValue}>{selectedOrder.destination || "N/A"}</Text>
                  </View>
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Domiciliario</Text>
                    <Text style={styles.detailValue}>{selectedOrder.assignedDeliveryName || "Sin asignar"}</Text>
                  </View>
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Método de Pago</Text>
                    <Text style={styles.detailValue}>{selectedOrder.payment || "N/A"}</Text>
                  </View>
                  {selectedOrder.notes && (
                    <View style={styles.detailItem}>
                      <Text style={styles.detailLabel}>Notas</Text>
                      <Text style={styles.detailValue}>{selectedOrder.notes}</Text>
                    </View>
                  )}
                </View>

                <View style={styles.divider} />

                {/* Cronología */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Cronología</Text>

                  <View style={styles.timelineItem}>
                    <View style={styles.timelineDot} />
                    <View style={styles.timelineContent}>
                      <Text style={styles.timelineLabel}>Creado</Text>
                      <Text style={styles.timelineTime}>
                        {selectedOrder.createdAt
                          ? new Date(selectedOrder.createdAt).toLocaleString("es-CO")
                          : "N/A"}
                      </Text>
                    </View>
                  </View>

                  <View style={[styles.timelineItem, { opacity: selectedOrder.assignedDelivery ? 1 : 0.5 }]}>
                    <View style={styles.timelineDot} />
                    <View style={styles.timelineContent}>
                      <Text style={styles.timelineLabel}>Asignado</Text>
                      <Text style={styles.timelineTime}>
                        {selectedOrder.assignedAt
                          ? new Date(selectedOrder.assignedAt).toLocaleString("es-CO")
                          : "Pendiente"}
                      </Text>
                    </View>
                  </View>

                  <View style={[styles.timelineItem, { opacity: selectedOrder.completedAt ? 1 : 0.5 }]}>
                    <View style={styles.timelineDot} />
                    <View style={styles.timelineContent}>
                      <Text style={styles.timelineLabel}>Entregado</Text>
                      <Text style={styles.timelineTime}>
                        {selectedOrder.completedAt
                          ? new Date(selectedOrder.completedAt).toLocaleString("es-CO")
                          : "Pendiente"}
                      </Text>
                    </View>
                  </View>
                </View>

                <View style={styles.divider} />

                {/* Información de pagos */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Información de Pago</Text>
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Total a Cobrar</Text>
                    <Text style={[styles.detailValue, { color: Colors.activeMenuText, fontWeight: "700", fontSize: 15 }]}>
                      {formatCurrency(parseFloat(selectedOrder.amount) || 0)}
                    </Text>
                  </View>
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Precio Domiciliario</Text>
                    <Text style={styles.detailValue}>{formatCurrency(parseFloat(selectedOrder.priceDeliverySrv) || 0)}</Text>
                  </View>
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Estado de Pago</Text>
                    <Text style={[styles.detailValue, { color: selectedOrder.isPaid ? "#4caf50" : "#ff9800" }]}>
                      {selectedOrder.isPaid ? "Pagado" : "Pendiente"}
                    </Text>
                  </View>
                </View>
              </ScrollView>
            )}

            <TouchableOpacity style={styles.closeModalButton} onPress={() => setShowModal(false)}>
              <Text style={styles.closeModalButtonText}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal de detalles de Pre-factura */}
      <Modal
        visible={showSnapshotModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowSnapshotModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Detalles Pre-factura</Text>
              <TouchableOpacity onPress={() => setShowSnapshotModal(false)} style={{ padding: 8 }}>
                <Text style={styles.closeButton}>×</Text>
              </TouchableOpacity>
            </View>

            {selectedSnapshot && (
              <ScrollView style={styles.modalBody} contentContainerStyle={{ paddingBottom: 24 }}>
                {/* Resumen */}
                <View style={styles.summarySection}>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Pre-factura</Text>
                    <Text style={styles.summaryValue}>{selectedSnapshot.id?.slice(-8) || "N/D"}</Text>
                  </View>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Total</Text>
                    <Text style={[styles.summaryValue, { color: Colors.activeMenuText, fontSize: 18, fontWeight: "700" }]}>
                      {formatCurrency(selectedSnapshot.total_amount || 0)}
                    </Text>
                  </View>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Estado</Text>
                    <Text
                      style={[
                        styles.summaryValue,
                        { color: selectedSnapshot.status === "paid" ? "#4caf50" : "#ff9800" },
                      ]}
                    >
                      {selectedSnapshot.status === "paid" ? "Pagada" : "Pendiente"}
                    </Text>
                  </View>
                </View>

                <View style={styles.divider} />

                {/* Período */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Período de Facturación</Text>
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Desde</Text>
                    <Text style={styles.detailValue}>{selectedSnapshot.period_start || "N/A"}</Text>
                  </View>
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Hasta</Text>
                    <Text style={styles.detailValue}>{selectedSnapshot.period_end || "N/A"}</Text>
                  </View>
                </View>

                <View style={styles.divider} />

                {/* Información de Pago */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Información de Pago</Text>
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Total a Cobrar</Text>
                    <Text style={[styles.detailValue, { color: Colors.activeMenuText, fontWeight: "700", fontSize: 15 }]}>
                      {formatCurrency(selectedSnapshot.total_amount || 0)}
                    </Text>
                  </View>
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Estado</Text>
                    <Text
                      style={[
                        styles.detailValue,
                        { color: selectedSnapshot.status === "paid" ? "#4caf50" : "#ff9800" },
                      ]}
                    >
                      {selectedSnapshot.status === "paid" ? "Pagada" : "Pendiente"}
                    </Text>
                  </View>
                  {selectedSnapshot.notes && (
                    <View style={styles.detailItem}>
                      <Text style={styles.detailLabel}>Notas</Text>
                      <Text style={styles.detailValue}>{selectedSnapshot.notes}</Text>
                    </View>
                  )}
                </View>

                <View style={styles.divider} />

                {/* Servicios incluidos */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Servicios Incluidos ({selectedSnapshot.services_count || 0})</Text>
                  {selectedSnapshot.services && selectedSnapshot.services.length > 0 ? (
                    selectedSnapshot.services.map((service: any, idx: number) => (
                      <View key={idx} style={styles.detailItem}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.detailLabel}>Servicio {idx + 1}</Text>
                          <Text style={{ fontSize: 12, color: "#A8A8A8", marginTop: 2 }}>
                            ID: {service.service_id || "N/A"}
                          </Text>
                        </View>
                        <Text style={styles.detailValue}>{formatCurrency(service.store_charge || 0)}</Text>
                      </View>
                    ))
                  ) : (
                    <Text style={{ color: Colors.menuText, fontSize: 13 }}>Sin servicios asociados</Text>
                  )}
                </View>

                {selectedSnapshot.created_at && (
                  <>
                    <View style={styles.divider} />
                    <View style={styles.section}>
                      <Text style={styles.sectionTitle}>Información Adicional</Text>
                      <View style={styles.detailItem}>
                        <Text style={styles.detailLabel}>Creada el</Text>
                        <Text style={styles.detailValue}>
                          {new Date(selectedSnapshot.created_at).toLocaleString("es-CO")}
                        </Text>
                      </View>
                      {selectedSnapshot.paid_at && (
                        <View style={styles.detailItem}>
                          <Text style={styles.detailLabel}>Pagada el</Text>
                          <Text style={styles.detailValue}>
                            {new Date(selectedSnapshot.paid_at).toLocaleString("es-CO")}
                          </Text>
                        </View>
                      )}
                    </View>
                  </>
                )}
              </ScrollView>
            )}

            {selectedSnapshot && selectedSnapshot.services && selectedSnapshot.services.length > 0 && (
              <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
                <TouchableOpacity
                  style={[styles.closeModalButton, { flex: 1 }]}
                  onPress={() => {
                    const serviceIds = selectedSnapshot.services.map((s: any) => s.service_id).filter(Boolean);
                    handleViewServicesDetail(serviceIds);
                    setShowSnapshotModal(false);
                  }}
                >
                  <Text style={styles.closeModalButtonText}>Ver Detalles</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.closeModalButton, { flex: 1, backgroundColor: '#2196F3' }]}
                  onPress={() => {
                    const serviceIds = selectedSnapshot.services.map((s: any) => s.service_id).filter(Boolean);
                    handleDownloadExcel(serviceIds);
                  }}
                  disabled={loadingServicesDetail}
                >
                  <Text style={styles.closeModalButtonText}>
                    {loadingServicesDetail ? '⏳ Descargando...' : '📥 Descargar'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            <TouchableOpacity style={styles.closeModalButton} onPress={() => setShowSnapshotModal(false)}>
              <Text style={styles.closeModalButtonText}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal de Servicios Detallados */}
      <Modal
        visible={showServicesDetailModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowServicesDetailModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Detalles de Servicios</Text>
              <TouchableOpacity onPress={() => setShowServicesDetailModal(false)} style={{ padding: 8 }}>
                <Text style={styles.closeButton}>×</Text>
              </TouchableOpacity>
            </View>

            {loadingServicesDetail ? (
              <View style={{ justifyContent: 'center', alignItems: 'center', paddingVertical: 40 }}>
                <ActivityIndicator size="large" color={Colors.activeMenuText} />
                <Text style={{ marginTop: 10, color: Colors.menuText }}>Cargando detalles...</Text>
              </View>
            ) : servicesDetail.length > 0 ? (
              <FlatList
                data={servicesDetail}
                keyExtractor={(item, idx) => item.id || idx.toString()}
                renderItem={({ item }) => (
                  <View style={styles.serviceDetailCard}>
                    <View style={{ marginBottom: 8 }}>
                      <Text style={[styles.sectionTitle, { marginBottom: 4 }]}>
                        Servicio: {item.id?.slice(-8)}
                      </Text>
                      <Text style={{ fontSize: 12, color: Colors.menuText }}>
                        Estado: <Text style={{ color: Colors.activeMenuText, fontWeight: '600' }}>{item.status}</Text>
                      </Text>
                    </View>

                    <View style={styles.detailItem}>
                      <Text style={styles.detailLabel}>Cliente</Text>
                      <Text style={styles.detailValue}>{item.client_name || 'N/A'}</Text>
                    </View>
                    <View style={styles.detailItem}>
                      <Text style={styles.detailLabel}>Teléfono</Text>
                      <Text style={styles.detailValue}>{item.client_phone || 'N/A'}</Text>
                    </View>
                    <View style={styles.detailItem}>
                      <Text style={styles.detailLabel}>Dirección Entrega</Text>
                      <Text style={styles.detailValue}>{item.delivery_address || 'N/A'}</Text>
                    </View>
                    {item.pickup_address && (
                      <View style={styles.detailItem}>
                        <Text style={styles.detailLabel}>Dirección Recogida</Text>
                        <Text style={styles.detailValue}>{item.pickup_address}</Text>
                      </View>
                    )}
                    <View style={styles.detailItem}>
                      <Text style={styles.detailLabel}>Zona</Text>
                      <Text style={styles.detailValue}>{item.zone_name || 'N/A'}</Text>
                    </View>
                    <View style={styles.detailItem}>
                      <Text style={styles.detailLabel}>Domiciliario</Text>
                      <Text style={styles.detailValue}>{item.assigned_delivery_name || 'Sin asignar'}</Text>
                    </View>
                    <View style={styles.detailItem}>
                      <Text style={styles.detailLabel}>Precio Cliente</Text>
                      <Text style={styles.detailValue}>{formatCurrency(item.price || 0)}</Text>
                    </View>
                    <View style={styles.detailItem}>
                      <Text style={styles.detailLabel}>Total a Cobrar</Text>
                      <Text style={styles.detailValue}>{formatCurrency(item.total_to_collect || 0)}</Text>
                    </View>
                    {item.payment_method && (
                      <View style={styles.detailItem}>
                        <Text style={styles.detailLabel}>Método Pago</Text>
                        <Text style={styles.detailValue}>{item.payment_method}</Text>
                      </View>
                    )}
                    {item.notes && (
                      <View style={styles.detailItem}>
                        <Text style={styles.detailLabel}>Notas</Text>
                        <Text style={styles.detailValue}>{item.notes}</Text>
                      </View>
                    )}
                    <View style={styles.detailItem}>
                      <Text style={styles.detailLabel}>Creado</Text>
                      <Text style={styles.detailValue}>
                        {item.created_at ? new Date(item.created_at).toLocaleString('es-CO') : 'N/A'}
                      </Text>
                    </View>
                    {item.completed_at && (
                      <View style={styles.detailItem}>
                        <Text style={styles.detailLabel}>Entregado</Text>
                        <Text style={styles.detailValue}>
                          {new Date(item.completed_at).toLocaleString('es-CO')}
                        </Text>
                      </View>
                    )}
                  </View>
                )}
                contentContainerStyle={{ paddingBottom: 100 }}
              />
            ) : (
              <Text style={{ textAlign: 'center', color: Colors.menuText, marginVertical: 20 }}>
                No hay servicios disponibles
              </Text>
            )}

            <TouchableOpacity style={styles.closeModalButton} onPress={() => setShowServicesDetailModal(false)}>
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
  orderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  amountColumn: {
    alignItems: "flex-end",
  },
  amountLabel: {
    fontSize: 11,
    color: "#B0B0B0",
    fontWeight: "500",
    marginBottom: 4,
  },
  amountValue: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.activeMenuText,
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
  detailItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#3A3A3C",
    alignItems: "center",
  },
  detailLabel: {
    fontSize: 13,
    color: "#A8A8A8",
    fontWeight: "500",
    flex: 1,
  },
  detailValue: {
    fontSize: 13,
    color: "#FFFFFF",
    fontWeight: "600",
    textAlign: "right",
    flex: 1,
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
  serviceDetailCard: {
    backgroundColor: Colors.activeMenuBackground,
    marginHorizontal: 12,
    marginVertical: 8,
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: Colors.activeMenuText,
  },
});
