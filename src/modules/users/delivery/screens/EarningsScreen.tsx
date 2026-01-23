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
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useAuth } from "../../../../providers/AuthProvider";
import { usePayments } from "../../../../hooks/usePayments";
import { fetchDeliveryServices } from "../../../../services/services";
import {
  getNextCutDate,
  getCurrentCutType,
} from "../../../../models/payment";
import { Colors } from "../../../../constans/colors";

// ================================================================
//  FUNCIONES AUXILIARES
// ================================================================

const formatCurrency = (amount: number | undefined | null): string => {
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
 * Obtener información del corte disponible
 * Retorna si está disponible y el próximo horario
 */
const getCutoffStatus = () => {
  const now = new Date();
  const day = now.getDate();
  const hour = now.getHours();
  const minute = now.getMinutes();
  const month = now.getMonth();
  const year = now.getFullYear();

  const lastDayOfMonth = new Date(year, month + 1, 0).getDate();
  const isValidDay = day === 15 || day === lastDayOfMonth;
  const isValidHour = hour >= 22;

  // Generar clave única para hoy (YYYY-MM-DD)
  const todayKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

  if (!isValidDay) {
    const nextDay = day < 15 ? 15 : lastDayOfMonth;
    return {
      available: false,
      isValidDay: false,
      isValidHour: false,
      reason: `Cortes disponibles el ${nextDay}`,
      message: `Próximo corte: ${nextDay}/${month + 1}/${year}`,
      todayKey,
    };
  }

  if (!isValidHour) {
    return {
      available: false,
      isValidDay: true,
      isValidHour: false,
      reason: `Disponible a partir de las 22:00`,
      message: `Hora actual: ${hour}:${String(minute).padStart(2, '0')}`,
      todayKey,
    };
  }

  return {
    available: true,
    isValidDay: true,
    isValidHour: true,
    reason: `✅ Corte disponible`,
    message: `${hour}:${String(minute).padStart(2, '0')} - Horario permitido`,
    todayKey,
  };
};

/**
 * Guardar que se hizo una petición de corte hoy
 */
const saveTodaysCutRequest = async (todayKey: string) => {
  try {
    await AsyncStorage.setItem(
      `cutRequest_${todayKey}`,
      JSON.stringify({ timestamp: new Date().toISOString() })
    );
    console.log(`✅ [STORAGE] Petición de corte guardada para: ${todayKey}`);
  } catch (err) {
    console.error('❌ [STORAGE] Error guardando petición:', err);
  }
};

/**
 * Verificar si ya se hizo una petición hoy
 */
const checkTodaysCutRequest = async (todayKey: string): Promise<boolean> => {
  try {
    const stored = await AsyncStorage.getItem(`cutRequest_${todayKey}`);
    const alreadyRequested = !!stored;
    console.log(`🔍 [STORAGE] ¿Ya se hizo petición hoy? ${alreadyRequested}`);
    return alreadyRequested;
  } catch (err) {
    console.error('❌ [STORAGE] Error verificando petición:', err);
    return false;
  }
};

/**
 * Calcular ganancias del día de hoy
 */
const calculateTodayEarnings = (services: any[]): number => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  return services
    .filter((s) => {
      if (!s.completedAt) return false;
      const completedDate = new Date(s.completedAt);
      completedDate.setHours(0, 0, 0, 0);
      return completedDate.getTime() === today.getTime();
    })
    .reduce((sum, s) => 
      sum + (parseFloat(s.priceDeliverySrv || s.price_delivery_srv || s.earnedByDelivery || s.amount || 0)), 
      0
    );
};

// ================================================================
//  COMPONENTE PRINCIPAL
// ================================================================

/**
 * EarningsScreen - Pantalla de ganancias del domiciliario (MEJORADA)
 * 
 * ✅ Cambios principales:
 * - Solo muestra servicios NO PAGADOS en el período actual
 * - Ganancias separadas por período (actual vs histórico)
 * - Validación de horario de corte (15 y último día 22:00+)
 * - Mejor UI/UX con información clara
 * - Integración con backend mejorado
 */
export default function DeliveryEarningsScreen() {
  const { session } = useAuth();
  const { 
    getDeliveryEarnings, 
    createSnapshotFromServices, 
    createPaymentRequest, 
    loading, 
    error 
  } = usePayments(session?.access_token || null);

  // Estados
  const [earnings, setEarnings] = useState<any>({
    delivery_id: "",
    current_period_earnings: 0,
    total_unpaid_earnings: 0,
    total_paid: 0,
    total_pending: 0,
    last_updated: new Date().toISOString(),
  });

  const [refreshing, setRefreshing] = useState(false);
  const [pendingServices, setPendingServices] = useState<any[]>([]);
  const [requesting, setRequesting] = useState(false);
  const [showCutModal, setShowCutModal] = useState(false);
  const [cutoffInfo, setCutoffInfo] = useState<any>(getCutoffStatus());
  const [alreadyRequestedToday, setAlreadyRequestedToday] = useState(false);
  const [todayEarnings, setTodayEarnings] = useState(0);

  useEffect(() => {
    if (session?.access_token) {
      loadEarnings();
      loadPendingServices();
      checkCutRequestStatus();
      // Actualizar estado de corte cada minuto
      const interval = setInterval(() => {
        setCutoffInfo(getCutoffStatus());
      }, 60000);
      return () => clearInterval(interval);
    }
  }, [session?.access_token]);

  /**
   * Verificar si ya se hizo una petición de corte hoy
   */
  const checkCutRequestStatus = async () => {
    const cutoffStatus = getCutoffStatus();
    const alreadyRequested = await checkTodaysCutRequest(cutoffStatus.todayKey);
    setAlreadyRequestedToday(alreadyRequested);
  };

  const loadEarnings = async () => {
    if (!session?.access_token) return;

    setRefreshing(true);
    try {
      console.log("🔄 Cargando ganancias...");
      const data = await getDeliveryEarnings();
      if (data) {
        console.log("✅ Datos de ganancias recibidos:", {
          current_period_earnings: data.current_period_earnings,
          total_unpaid_earnings: data.total_unpaid_earnings,
          total_paid: data.total_paid,
          total_pending: data.total_pending,
        });
        setEarnings(data);
      } else {
        console.warn("⚠️ No se recibieron datos de ganancias");
        setEarnings({
          delivery_id: session?.user?.id || "",
          current_period_earnings: 0,
          total_unpaid_earnings: 0,
          total_paid: 0,
          total_pending: 0,
          last_updated: new Date().toISOString(),
        });
      }
    } catch (err) {
      console.error("❌ Error al cargar ganancias:", err);
      Alert.alert("Error", "No se pudieron cargar las ganancias");
    } finally {
      setRefreshing(false);
    }
  };

  const loadPendingServices = async () => {
    if (!session?.access_token) return;
    try {
      console.log("\n🟦 [EARNINGS] === loadPendingServices ===");
      console.log("🔄 Cargando servicios entregados sin pagar...");

      const services = await fetchDeliveryServices(session.access_token);
      console.log(`📦 Total servicios obtenidos: ${services.length}`);

      // Mostrar todos los servicios para debugging
      console.log("\n🔍 TODOS LOS SERVICIOS OBTENIDOS:");
      services.forEach((s: any, idx: number) => {
        console.log(`  ${idx + 1}. ID: ${s.id}`);
        console.log(`     - Estado: ${s.status}`);
        console.log(`     - isPaid: ${s.isPaid} (tipo: ${typeof s.isPaid})`);
        console.log(`     - Monto: $${s.earnedByDelivery || s.price_delivery_srv || s.priceDeliverySrv || s.amount || 0}`);
      });

      // Filtrar servicios: estado "entregado" o "pago" AND no pagados
      // NO importa si no hay ganancias
      const unpaid = services.filter((s: any) => {
        // Estados válidos: entregado o pago
        const isDelivered = s.status === "entregado" || s.status === "pago";

        // No pagado: cualquier cosa que no sea true (includes false and undefined)
        const notPaid = s.isPaid !== true;

        return isDelivered && notPaid;
      });

      console.log(`\n📋 Servicios sin pagar encontrados: ${unpaid.length}`);
      unpaid.forEach((s: any, idx: number) => {
        console.log(`  ${idx + 1}. ID: ${s.id}`);
        console.log(`     - Monto: $${s.earnedByDelivery || s.price_delivery_srv || s.priceDeliverySrv || s.amount || 0}`);
        console.log(`     - Estado: ${s.status}`);
        console.log(`     - isPaid: ${s.isPaid}`);
        console.log(`     - Completado: ${s.completedAt || 'N/A'}`);
      });

      setPendingServices(unpaid);
      // Calcular ganancias de hoy
      const today = calculateTodayEarnings(unpaid);
      setTodayEarnings(today);
    } catch (err: any) {
      console.error("\n❌ [EARNINGS] Error cargando servicios:", err);
      setPendingServices([]);
      setTodayEarnings(0);
    }
  };

  const handleRequestPayment = async () => {
    if (pendingServices.length === 0) {
      Alert.alert('Sin servicios', 'No hay servicios pendientes para cobrar');
      return;
    }

    // Verificar si ya se hizo una petición hoy
    if (alreadyRequestedToday) {
      Alert.alert(
        '⏳ Ya se solicitó hoy',
        'Ya has hecho una solicitud de corte hoy. Solo se permite una petición por día.'
      );
      return;
    }

    setRequesting(true);
    
    try {
      console.log('\n🟦 [SCREEN] handleRequestPayment iniciado');
      const serviceIds = pendingServices.map(s => s.id);
      
      // ✅ Llamar hook - Devuelve resultado (nunca lanza excepciones)
      const result = await createSnapshotFromServices(serviceIds);
      console.log(`📦 [SCREEN] Resultado:`, JSON.stringify(result));
      
      // ⏳ RESTRICCIÓN: No se puede procesar (snapshot duplicado, etc)
      if (result.restricted) {
        console.log(`⏳ [SCREEN] Restricción: ${result.reason}`);
        
        const dateMatch = result.message.match(/\((\d{4}-\d{2}-\d{2}) a (\d{4}-\d{2}-\d{2})\)/);
        let periodText = '';
        if (dateMatch) {
          const startDate = new Date(dateMatch[1]);
          const endDate = new Date(dateMatch[2]);
          periodText = ` (${startDate.getDate()} al ${endDate.getDate()} de ${startDate.toLocaleString('es-CO', { month: 'long' })})`;
        }
        
        Alert.alert(
          '⏳ Corte Pendiente',
          `Ya tienes una solicitud de corte activa en este período${periodText}.\n\nNo puedes crear otra factura hasta que el coordinador la revise y procese.`
        );
        setRequesting(false);
        return;
      }
      
      // ❌ ERROR: Algo salió mal
      if (!result.success) {
        console.log(`❌ [SCREEN] Error:`, result.error);
        const { status, message } = result.error || {};
        
        // Mostrar mensaje de error
        Alert.alert('⚠️ Error', message || 'No se pudo procesar la solicitud');
        setRequesting(false);
        return;
      }

      // ✅ ÉXITO: Snapshot creado correctamente
      console.log(`✅ [SCREEN] Snapshot creado: ${result.data?.id}`);
      
      const snapshot = result.data;
      if (!snapshot?.id) {
        Alert.alert('⚠️ Error', 'Snapshot sin ID válido. Intenta de nuevo.');
        setRequesting(false);
        return;
      }

      // Crear payment request
      await createPaymentRequest({ snapshot_id: snapshot.id });

      // ✅ GUARDAR EN STORAGE QUE SE HIZO LA PETICIÓN HOY
      const cutoffStatus = getCutoffStatus();
      await saveTodaysCutRequest(cutoffStatus.todayKey);
      setAlreadyRequestedToday(true);

      Alert.alert(
        '✅ Éxito',
        `Solicitud de corte enviada con ${serviceIds.length} servicio${serviceIds.length !== 1 ? 's' : ''}.\n\nEl coordinador tiene 7 días para revisar y procesar tu pago.`
      );
      
      setShowCutModal(false);
      loadPendingServices();
      loadEarnings();
      setRequesting(false);
      
    } catch (err: any) {
      console.error('❌ [SCREEN] Error no esperado:', err);
      Alert.alert('⚠️ Error Inesperado', 'Por favor, intenta más tarde.');
      setRequesting(false);
    }
  };

  const cutType = getCurrentCutType();
  const lastDay = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();

  if (loading && earnings.current_period_earnings === 0 && earnings.total_unpaid_earnings === 0) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.activeMenuText} />
        <Text style={styles.loadingText}>Cargando ganancias...</Text>
      </SafeAreaView>
    );
  }

  const totalMonthServices = pendingServices.length;
  const totalMonthAmount = pendingServices.reduce((sum, s) => 
    sum + (parseFloat(s.priceDeliverySrv || s.price_delivery_srv || s.earnedByDelivery || s.amount || 0)), 
    0
  );

  return (
    <SafeAreaView style={styles.container}>
      {error && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>⚠️ {String(error)}</Text>
        </View>
      )}

      <ScrollView
        style={styles.scrollContainer}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadEarnings} />}
        contentContainerStyle={{ paddingBottom: 20 }}
      >
        {/* HEADER */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <MaterialCommunityIcons name="wallet" size={32} color={Colors.Background} />
            <View style={{ marginLeft: 12 }}>
              <Text style={styles.headerTitle}>Mis Ganancias</Text>
              <Text style={styles.headerSubtitle}>
                Período: {cutType === "quincena_1" ? "1-15" : "16"}-{lastDay}
              </Text>
            </View>
          </View>
        </View>

        {/* ⭐ SECCIÓN: DASHBOARD PRINCIPAL - 3 MÉTRICAS CLAVE */}
        <View style={styles.dashboardSection}>
          {/* TARJETA 1: HOY (ANCHO COMPLETO) */}
          <View style={[styles.dashboardCard, styles.dashboardCardLarge, styles.dashboardCardToday, styles.dashboardTopRow]}>
            <View>
              <View style={styles.dashboardCardHeader}>
                <View style={[styles.dashboardCardIcon, styles.dashboardCardIconToday]}>
                  <MaterialCommunityIcons name="calendar-today" size={20} color="#4A90E2" />
                </View>
                <View style={styles.dashboardCardHeaderText}>
                  <Text style={styles.dashboardCardLabel}>Hoy</Text>
                  <Text style={styles.dashboardCardSubLabel}>Ganancias de hoy</Text>
                </View>
              </View>
              <Text style={styles.dashboardCardValue}>
                {formatCurrency(todayEarnings)}
              </Text>
            </View>
            <Text style={styles.dashboardCardSubtext}>
              {pendingServices.filter(s => {
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const completed = s.completedAt ? new Date(s.completedAt) : null;
                if (!completed) return false;
                completed.setHours(0, 0, 0, 0);
                return completed.getTime() === today.getTime();
              }).length} servicio(s) completado(s)
            </Text>
          </View>

          {/* FILA CON DOS TARJETAS */}
          <View style={styles.dashboardBottomRow}>
            {/* TARJETA 2: SIN COBRAR (50% ANCHO) */}
            <View style={[styles.dashboardCard, styles.dashboardCardSmall, styles.dashboardCardPending]}>
              <View>
                <View style={styles.dashboardCardHeader}>
                  <View style={[styles.dashboardCardIcon, styles.dashboardCardIconPending]}>
                    <MaterialCommunityIcons name="cash-multiple" size={20} color="#F5A623" />
                  </View>
                  <View style={styles.dashboardCardHeaderText}>
                    <Text style={styles.dashboardCardLabel}>Sin Cobrar</Text>
                    <Text style={styles.dashboardCardSubLabel}>Adeudado</Text>
                  </View>
                </View>
                <Text style={styles.dashboardCardValue}>
                  {formatCurrency(totalMonthAmount)}
                </Text>
              </View>
              <Text style={styles.dashboardCardSubtext}>
                {totalMonthServices} servicio(s)
              </Text>
            </View>

            {/* TARJETA 3: YA COBRADO (50% ANCHO) */}
            <View style={[styles.dashboardCard, styles.dashboardCardSmall, styles.dashboardCardPaid]}>
              <View>
                <View style={styles.dashboardCardHeader}>
                  <View style={[styles.dashboardCardIcon, styles.dashboardCardIconPaid]}>
                    <MaterialCommunityIcons name="check-circle" size={20} color="#7ED321" />
                  </View>
                  <View style={styles.dashboardCardHeaderText}>
                    <Text style={styles.dashboardCardLabel}>Pagado</Text>
                    <Text style={styles.dashboardCardSubLabel}>Total cobrado</Text>
                  </View>
                </View>
                <Text style={styles.dashboardCardValue}>
                  {formatCurrency(earnings.total_paid)}
                </Text>
              </View>
              <Text style={styles.dashboardCardSubtext}>
                Acumulado
              </Text>
            </View>
          </View>
        </View>

        {/* SECCIÓN: DETALLES ADICIONALES */}
        <View style={styles.section}>
          <View style={styles.sectionTitleRow}>
            <MaterialCommunityIcons name="chart-line" size={20} color={Colors.activeMenuText} />
            <Text style={styles.sectionTitle}>Resumen del Período</Text>
          </View>

          {/* GRID: Información Acumulada */}
          <View style={styles.statsGrid}>
            <View style={[styles.statCard, { borderLeftColor: Colors.activeMenuText }]}>
              <View style={styles.statLabelRow}>
                <MaterialCommunityIcons name="wallet-plus" size={16} color={Colors.activeMenuText} />
                <Text style={styles.statLabel}>Total Acumulado</Text>
              </View>
              <Text style={styles.statValue}>
                {formatCurrency(earnings.total_unpaid_earnings + earnings.total_paid)}
              </Text>
            </View>

            <View style={[styles.statCard, { borderLeftColor: Colors.warning }]}>
              <View style={styles.statLabelRow}>
                <MaterialCommunityIcons name="clock-outline" size={16} color={Colors.warning} />
                <Text style={styles.statLabel}>Pendiente Cobro</Text>
              </View>
              <Text style={styles.statValue}>{formatCurrency(earnings.total_pending)}</Text>
            </View>
          </View>
        </View>

        {/* SECCIÓN: INFORMACIÓN DE CORTE */}
        <View style={styles.section}>
          <View style={styles.sectionTitleRow}>
            <MaterialCommunityIcons name="calendar-check" size={20} color={Colors.activeMenuText} />
            <Text style={styles.sectionTitle}>Información de Cortes</Text>
          </View>

          <View style={[
            styles.cutInfoCard,
            { borderLeftColor: cutoffInfo.available ? Colors.success : Colors.warning }
          ]}>
            <View style={styles.cutInfoHeader}>
              <View style={styles.cutStatusRow}>
                <MaterialCommunityIcons 
                  name={cutoffInfo.available ? "check-circle" : "clock-outline"} 
                  size={20} 
                  color={cutoffInfo.available ? Colors.success : Colors.warning} 
                />
                <Text style={styles.cutInfoTitle}>
                  {cutoffInfo.available ? 'Corte Disponible Ahora' : cutoffInfo.reason}
                </Text>
              </View>
              <Text style={styles.cutInfoTime}>{cutoffInfo.message}</Text>
            </View>

            <View style={styles.cutInfoDetails}>
              <View style={styles.cutDetailItem}>
                <MaterialCommunityIcons name="calendar" size={16} color={Colors.activeMenuText} />
                <Text style={styles.cutInfoDetailText}>
                  Puedes solicitar cortes el <Text style={{ fontWeight: 'bold' }}>15</Text> y el <Text style={{ fontWeight: 'bold' }}>{lastDay}</Text> (último día)
                </Text>
              </View>
              <View style={styles.cutDetailItem}>
                <MaterialCommunityIcons name="clock" size={16} color={Colors.activeMenuText} />
                <Text style={styles.cutInfoDetailText}>
                  Horario: <Text style={{ fontWeight: 'bold' }}>22:00 a 23:59</Text> (10 PM a 11 PM)
                </Text>
              </View>
              <View style={styles.cutDetailItem}>
                <MaterialCommunityIcons name="account-check" size={16} color={Colors.activeMenuText} />
                <Text style={styles.cutInfoDetailText}>
                  El coordinador tiene <Text style={{ fontWeight: 'bold' }}>7 días</Text> para revisar y pagar
                </Text>
              </View>
            </View>
          </View>

              {/* BOTÓN SOLICITAR CORTE */}
        <TouchableOpacity 
          style={[
            styles.requestButton,
            !cutoffInfo.available && styles.requestButtonDisabled,
            alreadyRequestedToday && styles.requestButtonDisabled,
            (totalMonthServices === 0) && styles.requestButtonDisabled,
          ]} 
          onPress={() => setShowCutModal(true)}
          disabled={!cutoffInfo.available || alreadyRequestedToday || totalMonthServices === 0}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <MaterialCommunityIcons 
              name={alreadyRequestedToday ? "check-circle" : "cash-check"} 
              size={20} 
              color={Colors.Background} 
            />
            <Text style={styles.requestButtonText}>
              {alreadyRequestedToday 
                ? '✅ Corte solicitado hoy' 
                : requesting 
                  ? "Procesando..." 
                  : `Solicitar Corte${totalMonthServices > 0 ? ` (${totalMonthServices})` : ' - Sin servicios'}`
              }
            </Text>
          </View>
        </TouchableOpacity>
        </View>

        {/* SECCIÓN: SERVICIOS DEL PERÍODO */}
        <View style={styles.section}>
          <View style={styles.sectionTitleRow}>
            <MaterialCommunityIcons name="package-variant" size={20} color={Colors.activeMenuText} />
            <Text style={styles.sectionTitle}>Servicios Sin Pagar ({totalMonthServices})</Text>
          </View>

          {pendingServices.length === 0 ? (
            <View style={styles.emptyState}>
              <MaterialCommunityIcons name="check-all" size={48} color={Colors.success} />
              <Text style={styles.emptyStateTitle}>Sin servicios pendientes</Text>
              <Text style={styles.emptyStateText}>
                Todos tus servicios de este período han sido pagados. ¡Bien hecho!
              </Text>
            </View>
          ) : (
            <FlatList
              data={pendingServices}
              keyExtractor={(item) => String(item.id || Math.random())}
              scrollEnabled={false}
              contentContainerStyle={{ gap: 8 }}
              renderItem={({ item, index }) => (
                <View style={styles.serviceCard}>
                  <View style={styles.serviceHeader}>
                    <View style={styles.serviceNumberBadge}>
                      <Text style={styles.serviceNumber}>{index + 1}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.serviceId}>Pedido #{String(item.id).slice(-6)}</Text>
                      <Text style={styles.serviceDate}>
                        {item.completedAt
                          ? new Date(item.completedAt).toLocaleDateString("es-CO", {
                              weekday: 'short',
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            })
                          : 'Pendiente'}
                      </Text>
                    </View>
                    <View style={styles.serviceEarning}>
                      <Text style={styles.earningLabel}>Tu Ganancia</Text>
                      <Text style={styles.earningValue}>
                        {formatCurrency(
                          parseFloat(item.priceDeliverySrv )
                        )}
                      </Text>
                    </View>
                  </View>

                  {item.storeName && (
                    <View style={styles.serviceDetail}>
                      <Text style={styles.detailLabel}>🏪 Tienda:</Text>
                      <Text style={styles.detailValue}>{item.storeName || item.store_name || 'N/A'}</Text>
                    </View>
                  )}

                  {(item.destination || item.deliveryAddress) && (
                    <View style={styles.serviceDetail}>
                      <Text style={styles.detailLabel}>📍 Destino:</Text>
                      <Text style={styles.detailValue} numberOfLines={2}>
                        {item.destination || item.deliveryAddress || 'N/A'}
                      </Text>
                    </View>
                  )}
                </View>
              )}
            />
          )}
        </View>

  

        {/* INFORMACIÓN ADICIONAL */}
        <View style={styles.infoBox}>
          <View style={styles.infoTitleRow}>
            <MaterialCommunityIcons name="information" size={16} color={Colors.success} />
            <Text style={styles.infoTitle}>Cómo funciona</Text>
          </View>
          <Text style={styles.infoText}>
            • Cada servicio completado se suma a tus ganancias{"\n"}
            • Solicita corte los días 15 y último día (22:00+){"\n"}
            • El coordinador revisa y procesa en 7 días{"\n"}
            • Una vez pagado, aparece en "Ya Pagado"
          </Text>
        </View>
      </ScrollView>

      {/* MODAL: CONFIRMAR CORTE */}
      <Modal
        visible={showCutModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCutModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Header Modal */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Solicitar Corte de Pago</Text>
              <TouchableOpacity onPress={() => setShowCutModal(false)}>
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Body Modal */}
            <ScrollView style={styles.modalBody} contentContainerStyle={{ paddingBottom: 24 }}>
              <View style={styles.modalSummary}>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Servicios a incluir:</Text>
                  <Text style={styles.summaryValue}>{totalMonthServices}</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Monto total:</Text>
                  <Text style={styles.summaryValue}>{formatCurrency(totalMonthAmount)}</Text>
                </View>
              </View>

              <Text style={styles.modalListTitle}>Detalle de servicios:</Text>

              {pendingServices.map((service, idx) => (
                <View key={service.id} style={styles.modalServiceItem}>
                  <View style={styles.modalServiceNumber}>
                    <Text style={{ color: Colors.Background, fontWeight: '700', fontSize: 13 }}>
                      {idx + 1}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.modalServiceId}>
                      Servicio #{String(service.id).slice(-6)}
                    </Text>
                    <Text style={styles.modalServiceDate}>
                      {service.completedAt ? new Date(service.completedAt).toLocaleDateString('es-CO') : ''}
                    </Text>
                  </View>
                  <Text style={styles.modalServiceAmount}>
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

              <View style={styles.modalWarning}>
                <Text style={styles.warningTitle}>⏳ Próximos pasos:</Text>
                <Text style={styles.warningText}>
                  1. Se enviará una notificación al coordinador{"\n"}
                  2. Revisará tu solicitud en los próximos 7 días{"\n"}
                  3. Recibirás tu pago según el método elegido{"\n"}
                  4. Se actualizará tu estado a "Pagado"
                </Text>
              </View>
            </ScrollView>

            {/* Footer Modal */}
            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowCutModal(false)}
                disabled={requesting}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.confirmButton, requesting && styles.confirmButtonDisabled]}
                onPress={handleRequestPayment}
                disabled={requesting}
              >
                {requesting ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.confirmButtonText}>Confirmar Solicitud</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// ================================================================
//  ESTILOS
// ================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.Background,
  },
  scrollContainer: {
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
  errorBanner: {
    backgroundColor: '#ffe6e6',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#ffcccc',
  },
  errorText: {
    color: '#b30000',
    fontSize: 13,
    fontWeight: '500',
  },
  header: {
    backgroundColor: Colors.gradientStart,
    paddingHorizontal: 16,
    paddingVertical: 24,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: Colors.Background,
  },
  headerSubtitle: {
    fontSize: 13,
    color: Colors.Background,
    marginTop: 6,
    opacity: 0.9,
  },
  section: {
    paddingHorizontal: 16,
    marginTop: 20,
    marginBottom: 8,
  },
  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.normalText,
    marginLeft: 8,
  },
  mainCard: {
    backgroundColor: Colors.activeMenuBackground,
    borderRadius: 16,
    padding: 20,
    borderLeftWidth: 5,
    borderLeftColor: Colors.activeMenuText,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  cardContent: {
    alignItems: "center",
  },
  cardLabel: {
    fontSize: 13,
    color: Colors.menuText,
    marginBottom: 8,
    textTransform: 'uppercase',
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  cardMainValue: {
    fontSize: 36,
    fontWeight: "700",
    color: Colors.activeMenuText,
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: 12,
    color: Colors.menuText,
    marginTop: 8,
  },
  statsGrid: {
    gap: 10,
  },
  statCard: {
    backgroundColor: Colors.activeMenuBackground,
    padding: 14,
    borderRadius: 12,
    borderLeftWidth: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  statLabel: {
    fontSize: 11,
    color: Colors.menuText,
    marginBottom: 6,
    fontWeight: '500',
  },
  statLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.normalText,
  },
  cutInfoCard: {
    backgroundColor: Colors.activeMenuBackground,
    borderRadius: 12,
    borderLeftWidth: 5,
    padding: 14,
    marginBottom: 8,
  },
  cutInfoHeader: {
    marginBottom: 12,
  },
  cutStatusRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  cutInfoTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.normalText,
    marginLeft: 8,
  },
  cutInfoTime: {
    fontSize: 12,
    color: Colors.menuText,
    marginTop: 4,
  },
  cutInfoDetails: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 8,
    padding: 10,
    gap: 8,
  },
  cutDetailItem: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  cutInfoDetailText: {
    fontSize: 11,
    color: Colors.normalText,
    lineHeight: 16,
    marginLeft: 8,
    flex: 1,
  },
  serviceCard: {
    backgroundColor: Colors.activeMenuBackground,
    borderRadius: 12,
    padding: 12,
    borderLeftWidth: 3,
    borderLeftColor: Colors.activeMenuText,
    marginBottom: 8,
  },
  serviceHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 10,
  },
  serviceNumberBadge: {
    backgroundColor: Colors.activeMenuText,
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  serviceNumber: {
    color: Colors.Background,
    fontWeight: "700",
    fontSize: 13,
  },
  serviceId: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.normalText,
  },
  serviceDate: {
    fontSize: 11,
    color: Colors.menuText,
    marginTop: 2,
  },
  serviceEarning: {
    alignItems: "flex-end",
  },
  earningLabel: {
    fontSize: 10,
    color: Colors.menuText,
    marginBottom: 4,
  },
  earningValue: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.activeMenuText,
  },
  serviceDetail: {
    flexDirection: "row",
    marginBottom: 8,
    alignItems: "flex-start",
  },
  detailLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: Colors.menuText,
    marginRight: 8,
    minWidth: 60,
  },
  detailValue: {
    fontSize: 12,
    color: "#E8E8E8",
    fontWeight: "500",
    flex: 1,
  },
  emptyState: {
    backgroundColor: Colors.activeMenuBackground,
    borderRadius: 12,
    padding: 32,
    alignItems: "center",
  },
  emptyStateIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyStateTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.normalText,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 12,
    color: Colors.menuText,
    textAlign: "center",
  },
  requestButton: {
    backgroundColor: Colors.activeMenuText,
    marginHorizontal: 16,
    marginTop: 16,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    shadowColor: Colors.activeMenuText,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  requestButtonDisabled: {
    opacity: 0.5,
  },
  requestButtonText: {
    color: Colors.Background,
    fontSize: 15,
    fontWeight: "700",
  },
  sectionRequestButton: {
    backgroundColor: Colors.activeMenuText,
    marginTop: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    alignItems: "center",
    shadowColor: Colors.activeMenuText,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 3,
  },
  sectionRequestButtonDisabled: {
    opacity: 0.5,
  },
  sectionButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  sectionRequestButtonText: {
    color: Colors.Background,
    fontSize: 14,
    fontWeight: "700",
  },
  badgeNotification: {
    backgroundColor: Colors.warning,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginLeft: 4,
  },
  badgeText: {
    color: Colors.Background,
    fontSize: 12,
    fontWeight: "700",
  },
  infoBox: {
    backgroundColor: "rgba(0, 255, 117, 0.1)",
    marginHorizontal: 16,
    marginTop: 20,
    marginBottom: 24,
    padding: 12,
    borderRadius: 10,
    borderLeftWidth: 4,
    borderLeftColor: Colors.success,
  },
  infoTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  infoTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: Colors.success,
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
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingVertical: 20,
    maxHeight: "85%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.Border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.normalText,
  },
  closeButton: {
    fontSize: 24,
    color: Colors.menuText,
  },
  modalBody: {
    marginBottom: 16,
  },
  modalSummary: {
    backgroundColor: Colors.activeMenuBackground,
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: Colors.activeMenuText,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 12,
    color: Colors.menuText,
    fontWeight: '500',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.activeMenuText,
  },
  modalListTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: Colors.normalText,
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  modalServiceItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 10,
    marginBottom: 8,
    borderRadius: 8,
    backgroundColor: Colors.activeMenuBackground,
    borderLeftWidth: 3,
    borderLeftColor: Colors.activeMenuText,
  },
  modalServiceNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.activeMenuText,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
    fontWeight: '700',
    color: Colors.Background,
  },
  modalServiceId: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.normalText,
  },
  modalServiceDate: {
    fontSize: 10,
    color: Colors.menuText,
    marginTop: 2,
  },
  modalServiceAmount: {
    fontSize: 13,
    fontWeight: "700",
    color: Colors.activeMenuText,
  },
  modalWarning: {
    backgroundColor: "rgba(255, 214, 10, 0.1)",
    borderRadius: 10,
    borderLeftWidth: 4,
    borderLeftColor: Colors.warning,
    padding: 12,
    marginTop: 16,
  },
  warningTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: Colors.normalText,
    marginBottom: 8,
  },
  warningText: {
    fontSize: 11,
    color: Colors.menuText,
    lineHeight: 16,
  },
  modalFooter: {
    flexDirection: "row",
    gap: 10,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: Colors.Border,
    alignItems: "center",
  },
  cancelButtonText: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.menuText,
  },
  confirmButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: Colors.activeMenuText,
    alignItems: "center",
    justifyContent: "center",
  },
  confirmButtonDisabled: {
    opacity: 0.6,
  },
  confirmButtonText: {
    fontSize: 13,
    fontWeight: "700",
    color: Colors.Background,
  },
  // ============ NUEVOS ESTILOS PARA DASHBOARD ============
  dashboardSection: {
    paddingHorizontal: 16,
    marginTop: 16,
    marginBottom: 16,
    gap: 12,
  },
  dashboardTopRow: {
    width: "100%",
  },
  dashboardBottomRow: {
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between",
  },
  dashboardCard: {
    backgroundColor: Colors.activeMenuBackground,
    borderRadius: 16,
    padding: 16,
    borderBottomWidth: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
    justifyContent: "space-between",
    minHeight: 100,
  },
  dashboardCardLarge: {
    minHeight: 140,
    borderBottomWidth: 5,
  },
  dashboardCardSmall: {
    flex: 1,
    minHeight: 140,
    borderBottomWidth: 5,
  },
  dashboardCardToday: {
    borderBottomColor: "#4A90E2",
  },
  dashboardCardPending: {
    borderBottomColor: "#F5A623",
  },
  dashboardCardPaid: {
    borderBottomColor: "#7ED321",
  },
  dashboardCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  dashboardCardIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  dashboardCardIconToday: {
    backgroundColor: "rgba(74, 144, 226, 0.15)",
  },
  dashboardCardIconPending: {
    backgroundColor: "rgba(245, 166, 35, 0.15)",
  },
  dashboardCardIconPaid: {
    backgroundColor: "rgba(126, 211, 33, 0.15)",
  },
  dashboardCardHeaderText: {
    flex: 1,
  },
  dashboardCardLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.menuText,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  dashboardCardSubLabel: {
    fontSize: 10,
    color: Colors.menuText,
    opacity: 0.7,
  },
  dashboardCardValue: {
    fontSize: 28,
    fontWeight: "700",
    color: Colors.normalText,
    marginBottom: 8,
    marginTop: 8,
  },
  dashboardCardSubtext: {
    fontSize: 11,
    color: Colors.menuText,
    fontWeight: "500",
  },
});
