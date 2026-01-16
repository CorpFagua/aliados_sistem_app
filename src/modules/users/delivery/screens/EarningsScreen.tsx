import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StyleSheet,
  RefreshControl,
  FlatList,
  Modal,
} from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from "../../../../providers/AuthProvider";
import { usePayments } from "../../../../hooks/usePayments";
import { fetchDeliveryServices } from "../../../../services/services";
import {
  getNextCutDate,
  getCurrentCutType,
} from "../../../../models/payment";
import { Colors } from "../../../../constans/colors";

// Funciones auxiliares
const formatCurrency = (amount: number | undefined | null): string => {
  // Fallback para valores inválidos
  if (amount === undefined || amount === null || isNaN(amount)) {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
    }).format(0);
  }
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
  }).format(amount);
};

/**
 * DeliveryEarningsScreen - Pantalla de ganancias del domiciliario
 */
export default function DeliveryEarningsScreen() {
  const { session } = useAuth();
  const { getDeliveryEarnings, getPaymentHistory, createSnapshotFromServices, createPaymentRequest, loading, error } = usePayments(session?.access_token || null);

  const [earnings, setEarnings] = useState<any>({
    delivery_id: "",
    current_period_earnings: 0,
    total_earnings: 0,
    total_paid: 0,
    total_pending: 0,
    last_updated: new Date().toISOString(),
  });
  const [refreshing, setRefreshing] = useState(false);
  const [pendingServices, setPendingServices] = useState<any[]>([]);
  const [requesting, setRequesting] = useState(false);
  const [showCutModal, setShowCutModal] = useState(false);

  useEffect(() => {
    if (session?.access_token) {
      loadEarnings();
      loadPendingServices();
    }
  }, [session?.access_token]);

  const loadEarnings = async () => {
    if (!session?.access_token) return;

    setRefreshing(true);
    try {
      console.log("🔄 Cargando ganancias...");
      const data = await getDeliveryEarnings();
      if (data) {
        console.log("✅ Datos de ganancias recibidos:", {
          current_period_earnings: data.current_period_earnings,
          total_earnings: data.total_earnings,
          total_paid: data.total_paid,
          total_pending: data.total_pending,
        });
        setEarnings(data);
      } else {
        console.warn("⚠️ No se recibieron datos de ganancias");
        setEarnings({
          delivery_id: session?.user?.id || "",
          current_period_earnings: 0,
          total_earnings: 0,
          total_paid: 0,
          total_pending: 0,
          last_updated: new Date().toISOString(),
        });
      }
    } catch (err) {
      console.error("❌ Error al cargar ganancias:", err);
      Alert.alert("Error", "No se pudieron cargar las ganancias");
      setEarnings({
        delivery_id: session?.user?.id || "",
        current_period_earnings: 0,
        total_earnings: 0,
        total_paid: 0,
        total_pending: 0,
        last_updated: new Date().toISOString(),
      });
    } finally {
      setRefreshing(false);
    }
  };

  const loadPendingServices = async () => {
    if (!session?.access_token) return;
    try {
      console.log("\n🟦 [EARNINGS] === loadPendingServices ===");
      console.log("🔄 Cargando servicios entregados sin pagar...");
      
      // Usar fetchDeliveryServices en lugar de getPaymentHistory
      const services = await fetchDeliveryServices(session.access_token);
      console.log(`📦 Total servicios obtenidos: ${services.length}`);
      
      const unpaid = services.filter((s: any) => {
        // Verificar si el servicio está entregado
        const delivered = 
          s.status === "entregado" || 
          s.status === "delivered" || 
          s.status === "completed" ||
          s.completedAt !== undefined && s.completedAt !== null;
        
        // Verificar si NO está pagado
        const notPaid = 
          s.is_paid !== true && 
          s.is_paid !== 'true' && 
          s.paid !== true && 
          s.paid !== 'true';
        
        // Verificar que tenga monto a pagar
        const hasEarnings = (s.earnedByDelivery || s.price_delivery_srv || s.priceDeliverySrv || s.amount || 0) > 0;
        
        if (delivered && notPaid && hasEarnings) {
          console.log(`✅ Servicio válido: ${s.id} - $${s.earnedByDelivery || s.price_delivery_srv || s.priceDeliverySrv || s.amount}`);
          return true;
        }
        
        if (delivered) {
          console.log(`⚠️ Servicio entregado pero: pagado=${!notPaid} | has_earnings=${hasEarnings}`);
        }
        
        return false;
      });
      
      console.log(`\n📋 Servicios sin pagar encontrados: ${unpaid.length}`);
      unpaid.forEach((s: any, idx: number) => {
        console.log(`  ${idx + 1}. ID: ${s.id}`);
        console.log(`     - Monto: $${s.earnedByDelivery || s.price_delivery_srv || s.priceDeliverySrv || s.amount || 0}`);
        console.log(`     - Estado: ${s.status}`);
        console.log(`     - Entregado: ${s.completedAt || 'N/A'}`);
      });
      
      setPendingServices(unpaid);
    } catch (err: any) {
      console.error("\n❌ [EARNINGS] Error cargando servicios:", err);
      console.error("   Message:", err.message);
      setPendingServices([]);
    }
  };

  const handleRequestPayment = async () => {
    if (pendingServices.length === 0) {
      Alert.alert('Sin servicios', 'No hay servicios pendientes para cobrar');
      return;
    }

    setRequesting(true);
    try {
      console.log('\n🟦 [EARNINGS] === handleRequestCut ===');
      console.log(`📦 Servicios a solicitar: ${pendingServices.length}`);
      
      const serviceIds = pendingServices.map(s => s.id);
      console.log(`📌 IDs: ${JSON.stringify(serviceIds)}`);
      
      console.log('\n📸 [EARNINGS] Creando snapshot...');
      const snapshot = await createSnapshotFromServices(serviceIds);
      console.log(`📌 Snapshot retornado:`, snapshot);

      if (!snapshot || !snapshot.id) {
        console.error('❌ [EARNINGS] Snapshot sin ID válido');
        throw new Error('No se pudo crear snapshot');
      }

      console.log(`\n📤 [EARNINGS] Creando payment request con snapshot ID: ${snapshot.id}`);
      await createPaymentRequest({ snapshot_id: snapshot.id });
      
      console.log(`\n✅ [EARNINGS] Corte solicitado exitosamente`);
      Alert.alert(
        'Éxito',
        `Solicitud de corte enviada con ${serviceIds.length} servicio${serviceIds.length !== 1 ? 's' : ''}. Espera la aprobación del coordinador.`
      );
      setShowCutModal(false);
      loadPendingServices();
      loadEarnings();
    } catch (err: any) {
      console.error('\n❌ [EARNINGS] Error:', err);
      console.error('   Message:', err.message);
      Alert.alert('Error', err.message || 'No se pudo solicitar el corte');
    } finally {
      setRequesting(false);
    }
  };

  const isCutoffOpen = () => {
    const now = new Date();
    const day = now.getDate();
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const hour = now.getHours();
    return ( (day === 15 || day === lastDay) && hour >= 22 );
  };

  if (loading && earnings.current_period_earnings === 0 && earnings.total_earnings === 0) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.activeMenuText} />
        <Text style={styles.loadingText}>Cargando ganancias...</Text>
      </SafeAreaView>
    );
  }

  const cutType = getCurrentCutType();
  const nextCut = cutType === "quincena_1" ? "15" : "1";
  const canRequestCut = new Date().getDate() >= (cutType === "quincena_1" ? 15 : 1);

  return (
    <SafeAreaView style={styles.container}>
      {error ? (
        <View style={{ backgroundColor: '#ffe6e6', padding: 10 }}>
          <Text style={{ color: '#b30000' }}>Error: {String(error)}</Text>
        </View>
      ) : null}

      <ScrollView
        style={styles.container}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadEarnings} />}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Mis Ganancias</Text>
        <Text style={styles.headerSubtitle}>
          Período: {cutType === "quincena_1" ? "1-15" : "16-31"}
        </Text>
      </View>

      {/* Tarjeta de período actual */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Ganancias Período Actual</Text>
          <Text style={styles.cardValue}>
            {formatCurrency(earnings.current_period_earnings)}
          </Text>
        </View>
        <Text style={styles.cardDescription}>
          Desde el {cutType === "quincena_1" ? "1" : "16"} hasta hoy
        </Text>
      </View>

      {/* Grid de estadísticas */}
      <View style={styles.statsGrid}>
        <View style={[styles.statCard, { borderLeftColor: Colors.activeMenuText }]}>
          <Text style={styles.statLabel}>Total Acumulado</Text>
          <Text style={styles.statValue}>{formatCurrency(earnings.total_earnings)}</Text>
        </View>

        <View style={[styles.statCard, { borderLeftColor: Colors.success }]}>
          <Text style={styles.statLabel}>Total Pagado</Text>
          <Text style={styles.statValue}>{formatCurrency(earnings.total_paid)}</Text>
        </View>

        <View style={[styles.statCard, { borderLeftColor: Colors.warning }]}>
          <Text style={styles.statLabel}>Pendiente</Text>
          <Text style={styles.statValue}>{formatCurrency(earnings.total_pending)}</Text>
        </View>
      </View>

      {/* Información de corte */}
      <View style={styles.cutInfo}>
        <Text style={styles.cutInfoTitle}>📅 Próximo Corte</Text>
        <View style={styles.cutInfoContent}>
          <Text style={styles.cutInfoText}>
            El próximo corte es el <Text style={styles.bold}>{nextCut} del mes</Text>
          </Text>
          <Text style={styles.cutInfoDescription}>
            {canRequestCut ? "Ya puedes solicitar tu corte" : `Espera hasta el ${nextCut} para solicitar`}
          </Text>
        </View>
      </View>

      {/* Botón solicitar corte */}
      <TouchableOpacity
        style={[styles.button, pendingServices.length === 0 && styles.buttonDisabled]}
        disabled={pendingServices.length === 0}
        onPress={() => setShowCutModal(true)}
      >
        <Text style={styles.buttonText}>
          {pendingServices.length === 0 ? "No hay servicios" : `Solicitar Corte (${pendingServices.length})`}
        </Text>
      </TouchableOpacity>

      {/* Información adicional */}
      <View style={styles.infoBox}>
        <Text style={styles.infoTitle}>ℹ️ Sobre tus ganancias</Text>
        <Text style={styles.infoText}>
          • Cada servicio completado suma a tus ganancias{"\n"}
          • Puedes solicitar corte los días 15 y 1{"\n"}
          • El coordinador tiene 7 días para aprobar{"\n"}
          • Una vez pagado, aparecerá en tu historial
        </Text>
      </View>

      {/* Servicios entregados sin pagar */}
      <View style={[styles.header, { marginTop: 6 }] }>
        <Text style={styles.headerTitle}>Servicios del período</Text>
        <Text style={styles.headerSubtitle}>{pendingServices.length} servicio{pendingServices.length !== 1 ? 's' : ''} entregado{pendingServices.length !== 1 ? 's' : ''}</Text>
      </View>

      {pendingServices.length === 0 ? (
        <View style={{ paddingHorizontal: 20, paddingVertical: 20 }}>
          <Text style={{ color: Colors.menuText }}>No tienes servicios entregados en este período.</Text>
        </View>
      ) : (
        <FlatList
          data={pendingServices}
          keyExtractor={(item) => (item.id ? String(item.id) : Math.random().toString())}
          contentContainerStyle={{ paddingHorizontal: 12, paddingBottom: 20 }}
          scrollEnabled={false}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.orderNumber}>Pedido {item.id || "N/A"}</Text>
                  <Text style={styles.orderDate}>
                    {item.completedAt
                      ? new Date(item.completedAt).toLocaleDateString("es-CO")
                      : item.createdAt
                      ? new Date(item.createdAt).toLocaleDateString("es-CO")
                      : "Pendiente"}
                  </Text>
                </View>
                <View style={styles.amountColumn}>
                  <Text style={styles.amountLabel}>Tu Ganancia</Text>
                  <Text style={styles.amountValue}>
                    {formatCurrency(
                      parseFloat(item.priceDeliverySrv || item.price_delivery_srv || item.earnedByDelivery || item.amount || 0)
                    )}
                  </Text>
                </View>
              </View>

              <View style={styles.cardBody}>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Tienda:</Text>
                  <Text style={styles.infoValue} numberOfLines={1}>
                    {item.storeName || item.store_name || "N/A"}
                  </Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Dirección:</Text>
                  <Text style={styles.infoValue} numberOfLines={2}>
                    {item.destination || item.deliveryAddress || item.delivery_address || "N/A"}
                  </Text>
                </View>
              </View>
            </View>
          )}
        />
      )}

      {/* Modal para solicitar corte de todos los servicios */}
      <Modal
        visible={showCutModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCutModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Confirmar Solicitud de Corte</Text>
              <TouchableOpacity onPress={() => setShowCutModal(false)}>
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalBody} contentContainerStyle={{ paddingBottom: 24 }}>
              <Text style={styles.infoTitle}>Servicios a incluir:</Text>
              <Text style={styles.infoText}>Total: {pendingServices.length}</Text>

              <View style={{ marginVertical: 16 }}>
                {pendingServices.map((service, idx) => (
                  <View key={service.id} style={styles.cutServiceItem}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.cutServiceId}>
                        {idx + 1}. Servicio #{String(service.id).slice(-6)}
                      </Text>
                      <Text style={styles.cutServiceDate}>
                        {service.completedAt ? new Date(service.completedAt).toLocaleDateString('es-CO') : ''}
                      </Text>
                    </View>
                    <Text style={styles.cutServiceAmount}>
                      {formatCurrency(
                        service.priceDeliverySrv ??
                          service.price_delivery_srv ??
                          service.earnedByDelivery ??
                          service.amount ??
                          0
                      )}
                    </Text>
                  </View>
                ))}
              </View>

              <View style={[styles.infoBox, { marginTop: 20 }]}>
                <Text style={styles.infoTitle}>ℹ️ Total a solicitar:</Text>
                <Text style={styles.cutTotalAmount}>
                  {formatCurrency(
                    pendingServices.reduce((sum, s) => {
                      return (
                        sum +
                        (s.priceDeliverySrv ??
                          s.price_delivery_srv ??
                          s.earnedByDelivery ??
                          s.amount ??
                          0)
                      );
                    }, 0)
                  )}
                </Text>
                <Text style={[styles.infoText, { marginTop: 12 }]}>
                  El coordinador revisará tu solicitud y realizará el pago en los próximos días.
                </Text>
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowCutModal(false)}
                disabled={requesting}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.confirmButton,
                  requesting && styles.disabledButton,
                ]}
                onPress={handleRequestPayment}
                disabled={requesting}
              >
                {requesting ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.confirmButtonText}>
                    Solicitar Corte
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      </ScrollView>
    </SafeAreaView>
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
    backgroundColor: Colors.Background,
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
  card: {
    backgroundColor: Colors.activeMenuBackground,
    marginHorizontal: 12,
    marginVertical: 8,
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: Colors.activeMenuText,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 14,
    color: Colors.menuText,
    marginBottom: 8,
  },
  cardValue: {
    fontSize: 28,
    fontWeight: "bold",
    color: Colors.activeMenuText,
  },
  cardDescription: {
    fontSize: 12,
    color: Colors.menuText,
  },
  cardBody: {
    marginVertical: 8,
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
  statCard: {
    backgroundColor: Colors.activeMenuBackground,
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.menuText,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: Colors.normalText,
  },
  cutInfo: {
    backgroundColor: Colors.activeMenuBackground,
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: Colors.warning,
  },
  cutInfoTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: Colors.normalText,
    marginBottom: 8,
  },
  cutInfoContent: {
    backgroundColor: "rgba(255, 214, 10, 0.1)",
    padding: 12,
    borderRadius: 8,
  },
  cutInfoText: {
    fontSize: 14,
    color: Colors.normalText,
    marginBottom: 4,
  },
  bold: {
    fontWeight: "bold",
    color: Colors.warning,
  },
  cutInfoDescription: {
    fontSize: 12,
    color: Colors.menuText,
  },
  button: {
    backgroundColor: Colors.activeMenuText,
    marginHorizontal: 16,
    marginTop: 16,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: Colors.Background,
    fontSize: 16,
    fontWeight: "bold",
  },
  infoBox: {
    backgroundColor: "rgba(0, 255, 117, 0.1)",
    marginHorizontal: 0,
    marginTop: 16,
    marginBottom: 24,
    padding: 12,
    borderRadius: 8,
  },
  infoTitle: {
    fontSize: 12,
    fontWeight: "bold",
    color: Colors.success,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 11,
    color: Colors.success,
    lineHeight: 18,
  },
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
    paddingVertical: 24,
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: Colors.normalText,
  },
  closeButton: {
    fontSize: 24,
    color: Colors.menuText,
  },
  modalBody: {
    marginBottom: 20,
  },
  modalFooter: {
    flexDirection: "row",
    gap: 10,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.Border,
    alignItems: "center",
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.menuText,
  },
  confirmButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: Colors.activeMenuText,
    alignItems: "center",
    justifyContent: "center",
  },
  confirmButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.Background,
  },
  disabledButton: {
    opacity: 0.6,
  },
  cutServiceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    marginBottom: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.Border,
    backgroundColor: Colors.activeMenuBackground,
  },
  cutServiceId: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.normalText,
  },
  cutServiceDate: {
    fontSize: 11,
    color: Colors.menuText,
    marginTop: 2,
  },
  cutServiceAmount: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.activeMenuText,
  },
  cutTotalAmount: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.activeMenuText,
    marginTop: 8,
  },
  statsGrid: {
    marginHorizontal: 16,
    marginTop: 16,
    gap: 12,
  },
});
