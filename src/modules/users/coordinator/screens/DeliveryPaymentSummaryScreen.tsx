import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ActivityIndicator, FlatList, RefreshControl, ScrollView } from "react-native";
import { Colors } from "../../../../constans/colors";
import { useAuth } from "../../../../providers/AuthProvider";
import { fetchDeliveryServices, updateServiceData } from "../../../../services/services";
import { formatCurrency } from "../../../../services/payments";
import { TextInput, TouchableOpacity, Modal, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { usePayments,useServicesDetail } from "../../../../hooks/usePayments";
import ServiceDetailModal from "../../../../components/ServiceDetailModal";


export default function DeliveryPaymentSummaryScreen({ delivery }) {
  const { session } = useAuth();
  const { coordinatorPayServices, getDeliveryPaymentSnapshots, createSnapshotFromServices, createPaymentRequest } = usePayments(session?.access_token || null);
  const { downloadServicesExcel } = useServicesDetail(session?.access_token || null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [unpaid, setUnpaid] = useState([]);
  const [snapshots, setSnapshots] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<"due" | "history">("due");
  const [startDate, setStartDate] = useState(""); // YYYY-MM-DD
  const [endDate, setEndDate] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  const [showPayModal, setShowPayModal] = useState(false);
  const [paymentMode, setPaymentMode] = useState<"immediate" | "request" | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<"efectivo" | "transferencia" | "cheque" | "otro">("efectivo");
  const [reference, setReference] = useState("");
  const [showCalendar, setShowCalendar] = useState<null | { field: "start" | "end" }>(null);
  const [calendarMonth, setCalendarMonth] = useState(() => new Date());
  const [processing, setProcessing] = useState(false);
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [duplicateServicesInfo, setDuplicateServicesInfo] = useState<{
    duplicateServiceIds: string[];
    duplicateServiceNames: string[];
    duplicateDetails?: any[];
    isPending?: boolean;
    isPaid?: boolean;
    snapshotStatus?: string;
  } | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successData, setSuccessData] = useState<{
    snapshotId: string;
    servicesCount: number;
    totalAmount: number;
    type?: 'immediate' | 'request';
  } | null>(null);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [selectedService, setSelectedService] = useState<any | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [serviceLoading, setServiceLoading] = useState(false);

  // Estados para descarga de Excel
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [downloadModalServiceIds, setDownloadModalServiceIds] = useState<string[]>([]);
  const [downloadModalFilename, setDownloadModalFilename] = useState('');
  const [downloadingExcel, setDownloadingExcel] = useState(false);

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [delivery, session]);

  const loadData = async () => {
    if (!session?.access_token || !delivery?.id) return;
    setLoading(true);
    try {
      console.log(`🔍 [COORDINATOR] Cargando servicios del delivery: ${delivery.id}`);
      const allServices = await fetchDeliveryServices(session.access_token, delivery.id);
      console.log(`📦 [SERVICES] Servicios obtenidos para delivery ${delivery.id}:`, allServices);
      const unpaidData = allServices.filter(
        s => s.assignedDelivery === delivery.id && (s.status === "entregado" || s.status === "pago") && !s.isPaid
      );
      setUnpaid(unpaidData);

      // Cargar snapshots pagados (historial de facturas)
      console.log(`📋 [SNAPSHOTS] Cargando snapshots para delivery: ${delivery.id}`);
      const snapshotsData = await getDeliveryPaymentSnapshots(delivery.id);
      // Filtrar solo los snapshots pagados
      const paidSnapshots = snapshotsData.filter((s: any) => s.status === 'paid');
      setSnapshots(paidSnapshots);
      console.log(`✅ ${paidSnapshots.length} snapshots pagados encontrados`);
    } catch (err) {
      console.error("❌ Error cargando datos:", err);
      setUnpaid([]);
      setSnapshots([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleDownloadSnapshotExcel = async (snapshot: any) => {
    if (!snapshot.services || snapshot.services.length === 0) {
      Alert.alert('Error', 'Esta factura no tiene servicios para descargar');
      return;
    }

    try {
      // Extraer service_ids del snapshot
      const serviceIds = snapshot.services
        .map((s: any) => s.service_id || s.id)
        .filter(Boolean);

      if (serviceIds.length === 0) {
        Alert.alert('Error', 'No hay servicios válidos para descargar');
        return;
      }

      console.log(`📥 [DELIVERY] Descargando ${serviceIds.length} servicios del snapshot ${snapshot.id}`);
      setDownloadModalServiceIds(serviceIds);
      setDownloadModalFilename(`prefactura-delivery-${snapshot.id.slice(-8)}.xlsx`);
      setShowDownloadModal(true);
    } catch (err: any) {
      Alert.alert('Error', 'Error al preparar descarga');
      console.error(err);
    }
  };

  const handleDownloadWithFormat = async (excelType: 'coordinator' | 'delivery') => {
    if (downloadModalServiceIds.length === 0) return;

    setDownloadingExcel(true);
    try {
      await downloadServicesExcel(downloadModalServiceIds, downloadModalFilename, excelType);
      Alert.alert('Éxito', `Excel descargado en formato ${excelType === 'delivery' ? 'Domiciliario' : 'Completo'}`);
      setShowDownloadModal(false);
    } catch (err: any) {
      Alert.alert('Error', 'Error al descargar Excel');
      console.error(err);
    } finally {
      setDownloadingExcel(false);
    }
  };

  const renderService = ({ item }) => (
    <TouchableOpacity 
      style={styles.serviceCardRow}
      onPress={() => handleOpenServiceDetail(item)}
      activeOpacity={0.7}
    >
      <TouchableOpacity
        style={{marginRight: 12}}
        onPress={(e) => {
          e.stopPropagation();
          if (selectedIds.includes(item.id)) {
            setSelectedIds(selectedIds.filter((id) => id !== item.id));
          } else {
            setSelectedIds([...selectedIds, item.id]);
          }
        }}
      >
        <Ionicons
          name={selectedIds.includes(item.id) ? "checkmark-circle" : "ellipse-outline"}
          size={22}
          color={selectedIds.includes(item.id) ? Colors.activeMenuText : Colors.menuText}
        />
      </TouchableOpacity>
      <View style={{ flex: 1 }}>
        <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8}}>
          <Text style={styles.serviceTitle}>#{String(item.id).slice(-6)}</Text>
          <View style={{flexDirection: 'row', alignItems: 'center'}}>
            <Ionicons name="calendar" size={13} color={Colors.activeMenuText} style={{marginRight: 4}} />
            <Text style={styles.serviceDate}>{formatDateColombia(item.createdAt)}</Text>
          </View>
        </View>
        
        <View style={{marginBottom: 8}}>
          <View style={{flexDirection: 'row', alignItems: 'center', marginBottom: 4}}>
            <Ionicons name="location" size={13} color={Colors.menuText} style={{marginRight: 6}} />
            <Text style={[styles.serviceDetail, {flex: 1}]} numberOfLines={1}>{item.zoneName || 'Zona sin asignar'}</Text>
          </View>
          <View style={{flexDirection: 'row', alignItems: 'center'}}>
            <Ionicons name="pin" size={13} color={Colors.menuText} style={{marginRight: 6}} />
            <Text style={[styles.serviceDetail, {flex: 1}]} numberOfLines={1}>{item.destination || 'Sin dirección'}</Text>
          </View>
        </View>

        <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 8, backgroundColor: 'rgba(244,197,66,0.08)', borderRadius: 6}}>
          <View style={{flex: 1}}>
            <View style={{flexDirection: 'row', alignItems: 'center', marginBottom: 4}}>
              <Ionicons name="pricetag" size={12} color={Colors.menuText} style={{marginRight: 4}} />
              <Text style={{fontSize: 10, color: Colors.menuText}}>Precio</Text>
            </View>
            <Text style={{fontSize: 14, fontWeight: '700', color: Colors.activeMenuText}}>{formatCurrency(item.price ?? item.amount ?? 0)}</Text>
          </View>
          <View style={{width: 1, height: 30, backgroundColor: Colors.Border, marginHorizontal: 12}} />
          <View style={{flex: 1}}>
            <View style={{flexDirection: 'row', alignItems: 'center', marginBottom: 4}}>
              <Ionicons name="bicycle" size={12} color={Colors.success} style={{marginRight: 4}} />
              <Text style={{fontSize: 10, color: Colors.menuText}}>Domiciliario</Text>
            </View>
            <Text style={{fontSize: 14, fontWeight: '700', color: Colors.success}}>{formatCurrency(item.priceDeliverySrv ?? 0)}</Text>
          </View>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={20} color={Colors.menuText} style={{marginLeft: 8}} />
    </TouchableOpacity>
  );

  const renderSnapshot = ({ item }) => (
    <View style={[styles.snapshotCard, styles.snapshotCardPaid]}>
      <View style={styles.snapshotHeader}>
        <View style={{ flex: 1 }}>
          <Text style={styles.snapshotId}>Factura #{item.id.slice(-8)}</Text>
          <Text style={styles.snapshotPeriod}>
            {item.period_start} - {item.period_end}
          </Text>
        </View>
        <View style={[styles.statusBadge, styles.statusBadgePaid]}>
          <Ionicons name="checkmark-circle" size={14} color="#4CAF50" />
          <Text style={[styles.statusBadgeText, { color: '#4CAF50', marginLeft: 4 }]}>Pagado</Text>
        </View>
      </View>

      <View style={styles.snapshotDetails}>
        <Text style={styles.snapshotAmount}>${item.total_amount?.toFixed(2)}</Text>
        <Text style={styles.snapshotServices}>
          {item.services_count || 0} viaje{item.services_count !== 1 ? 's' : ''}
        </Text>
        {item.paid_at && (
          <Text style={styles.snapshotPeriod}>
            Pagado: {new Date(item.paid_at).toLocaleDateString()} {new Date(item.paid_at).toLocaleTimeString()}
          </Text>
        )}
      </View>

      {/* Botón de descarga */}
      {item.services && item.services.length > 0 && (
        <TouchableOpacity
          style={[styles.chargeButton, styles.chargeButtonSecondary]}
          onPress={() => handleDownloadSnapshotExcel(item)}
        >
          <Ionicons name="download" size={14} color={Colors.activeMenuText} style={{ marginRight: 6 }} />
          <Text style={[styles.chargeButtonText, { color: Colors.activeMenuText }]}>Descargar</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  // Calendar helpers
  const startOfMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth(), 1);
  const daysInMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  const formatISO = (d: Date) => d.toISOString().slice(0, 10);
  const onPickDate = (d: Date) => {
    const iso = formatISO(d);
    if (showCalendar?.field === "start") setStartDate(iso);
    if (showCalendar?.field === "end") setEndDate(iso);
    setShowCalendar(null);
  };

  const isBetween = (iso: string) => {
    if (!startDate || !endDate) return false;
    return iso > startDate && iso < endDate;
  };

  const parseDate = (s: string) => {
    if (!s) return null;
    const parts = s.split("-");
    if (parts.length !== 3) return null;
    const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    return isNaN(d.getTime()) ? null : d;
  };

  const applyDateFilter = (list: any[]) => {
    const sd = parseDate(startDate);
    const ed = parseDate(endDate);
    if (!sd && !ed) return list;
    return list.filter((item) => {
      // Para snapshots, usar period_start o period_end
      // Para servicios, usar completedAt o createdAt
      let dt: Date;
      if (item.period_start) {
        // Es un snapshot
        dt = new Date(item.period_start);
      } else {
        // Es un servicio
        dt = item.completedAt ? new Date(item.completedAt) : new Date(item.createdAt);
      }
      
      if (sd && dt < sd) return false;
      if (ed) {
        const edEnd = new Date(ed);
        edEnd.setHours(23, 59, 59, 999);
        if (dt > edEnd) return false;
      }
      return true;
    });
  };

  // Desseleccionar todo cuando cambian los filtros de fecha
  useEffect(() => {
    setSelectedIds([]);
    setSelectAll(false);
  }, [startDate, endDate]);

  const totalSelectedAmount = () => {
    const list = unpaid.filter((s) => selectedIds.includes(s.id));
    return list.reduce((sum, s) => sum + (s.priceDeliverySrv || 0), 0);
  };

  // Función para formatear fecha UTC a hora local Colombia
  const formatDateColombia = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('es-CO', { 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateStr;
    }
  };

  // Función para abrir el modal con los detalles del servicio
  const handleOpenServiceDetail = (service: any) => {
    // Asegurar que price_delivery_srv existe, si no usar 0
    const priceDelivery = service.priceDeliverySrv || service.price_delivery_srv || 0;
    
    // Adaptar servicio a formato de ServiceDetailModal
    const adaptedService = {
      ...service,
      id: service.id,
      deliveryAddress: service.destination || 'Sin dirección',
      pickupAddress: service.pickup || null,
      clientName: service.clientName || 'Cliente desconocido',
      clientPhone: service.phone || 'Sin teléfono',
      priceDelivery: priceDelivery,
      price: service.price || 0,
      paymentMethod: service.payment || 'efectivo',
      totalToCollect: service.amount || 0,
      isPaid: service.isPaid || false,
      status: service.status || 'disponible',
      type: { name: service.typeId || 'Domicilio' },
      zone: { name: service.zoneName || 'Sin zona', id: service.zoneId || null },
      profileStore: { name: service.profileStoreName || 'Sucursal', id: service.profileStoreId || null },
      store: { name: service.storeName || 'Tienda', type: service.storeType },
      delivery: service.assignedDelivery ? { 
        name: service.assignedDeliveryName || 'Sin nombre', 
        id: service.assignedDelivery,
        phone: service.deliveryPhone || null 
      } : null,
      timeline: [],
      timeAnalysis: {
        totalTime: 0,
        performanceScore: 0,
        timeToRoute: 0,
        timeToDelivery: 0,
        averageTimeToRouteInZone: 0,
        averageTimeToDeliveryInZone: 0,
        comparisonToZoneAverage: { timeToRoutePercent: 0, timeToDeliveryPercent: 0 }
      },
    };
    
    console.log('📋 [DETAIL-MODAL] Service adapted:', { 
      id: adaptedService.id,
      priceDelivery: adaptedService.priceDelivery,
      price: adaptedService.price,
      zone: adaptedService.zone.name 
    });
    
    setSelectedService(adaptedService);
    setShowDetailModal(true);
  };

  const getFilteredServices = () => applyDateFilter(unpaid);

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedIds([]);
      setSelectAll(false);
    } else {
      const filteredServices = getFilteredServices();
      setSelectedIds(filteredServices.map((s) => s.id));
      setSelectAll(true);
    }
  };

  const handleCreatePaymentRequest = async () => {
    if (!session?.access_token) return Alert.alert("Error", "No hay sesión");
    if (selectedIds.length === 0) return Alert.alert("Selecciona viajes", "Debes seleccionar al menos un viaje.");
    
    setProcessing(true);
    try {
      console.log('\n🟦 [COORDINATOR] === handleCreatePaymentRequest (SOLICITUD DE PREFACTURA) ===');
      console.log(`📦 Service IDs: ${JSON.stringify(selectedIds)}`);
      console.log(`👤 Delivery ID: ${delivery.id}`);

      // Paso 1: Crear snapshot a partir de los servicios
      console.log('📤 Paso 1: Creando snapshot...');
      const snapshotResult = await createSnapshotFromServices(selectedIds, delivery.id);
      
      // 🔍 Verificar si hay duplicados (en otro snapshot)
      if (snapshotResult.restricted && snapshotResult.reason === 'SERVICES_ALREADY_IN_DELIVERY_SNAPSHOT') {
        console.warn(`⚠️ Servicios duplicados encontrados`);
        
        // Obtener información detallada de servicios duplicados
        const duplicateIds = snapshotResult.data?.duplicateServiceIds || [];
        const duplicateDetails = duplicateIds
          .map((id: string) => {
            const service = unpaid.find(s => s.id === id);
            return {
              id: id,
              name: `Viaje #${id.slice(-4)}`,
              status: service?.status || 'N/A',
              amount: service?.priceDeliverySrv || 0,
            };
          });
        
        setDuplicateServicesInfo({
          duplicateServiceIds: duplicateIds || [],
          duplicateServiceNames: duplicateDetails.map(d => d.name),
          duplicateDetails: duplicateDetails,
          isPending: snapshotResult.data?.isPending || false,
          isPaid: snapshotResult.data?.isPaid || false,
          snapshotStatus: snapshotResult.data?.duplicateSnapshotStatus || 'unknown',
        });
        setShowDuplicateModal(true);
        setProcessing(false);
        return;
      }
      
      // 🔍 Verificar restricción por solicitud pendiente en el período
      if (snapshotResult.restricted) {
        console.warn(`⏳ Restricción: ${snapshotResult.reason}`);
        Alert.alert(
          '⏳ Solicitud Pendiente',
          `${snapshotResult.message}\n\nTiene una solicitud de corte pendiente en este período.`
        );
        setProcessing(false);
        return;
      }
      
      // 🔍 Error al crear snapshot
      if (!snapshotResult.success || !snapshotResult.data?.id) {
        const errorMsg = snapshotResult.error?.message || 'No se pudo crear el snapshot';
        console.error('❌ Error creando snapshot:', errorMsg);
        Alert.alert('⚠️ Error', errorMsg);
        setProcessing(false);
        return;
      }
      
      const snapshot = snapshotResult.data;
      console.log(`✅ Snapshot creado: ${snapshot.id}`);


      
      // ✅ ÉXITO
      console.log(`\n✅ === SOLICITUD DE PREFACTURA CREADA ===`);
      setShowPayModal(false);
      setPaymentMode(null);
      const processedCount = selectedIds.length;
      setSelectedIds([]);
      setSelectAll(false);
      
      // Mostrar modal de éxito
      setSuccessData({
        snapshotId: snapshot.id,
        servicesCount: processedCount,
        totalAmount: snapshot.total_amount || 0,
        type: 'request',
      });
      setShowSuccessModal(true);
      
      // Recargar datos
      setTimeout(() => {
        loadData();
      }, 2000);
    } catch (err: any) {
      console.error('❌ Error:', err);
      setErrorMessage(err.message || "No se pudo crear la solicitud de prefactura");
      setShowErrorModal(true);
    } finally {
      setProcessing(false);
    }
  };

  const handleConfirmPayment = async () => {
    if (!session?.access_token) return Alert.alert("Error", "No hay sesión");
    if (selectedIds.length === 0) return Alert.alert("Selecciona viajes", "Debes seleccionar al menos un viaje para generar el pago.");
    
    setProcessing(true);
    try {
      console.log('\n� [COORDINATOR] === handleConfirmPayment (PAGO DIRECTO) ===');
      console.log(`📦 Service IDs: ${JSON.stringify(selectedIds)}`);
      console.log(`💳 Método: ${paymentMethod}`);
      console.log(`📌 Referencia: ${reference}`);

      // Usar la nueva función de pago directo que hace TODO en una sola operación
      const result = await coordinatorPayServices(selectedIds, delivery.id, paymentMethod, reference);

      // 🔍 Verificar si la respuesta es un error de duplicados
      if (result && result.ok === false && result.reason === 'SERVICES_ALREADY_IN_DELIVERY_SNAPSHOT') {
        console.warn(`⚠️ [COORDINATOR] Servicios ya en otro snapshot DELIVERY:`, result.duplicateServiceIds);
        
        // Obtener información detallada de servicios duplicados
        const duplicateDetails = result.duplicateServiceIds
          .map((id: string) => {
            const service = unpaid.find(s => s.id === id);
            return {
              id: id,
              name: `Viaje #${id.slice(-4)}`,
              status: service?.status || 'N/A',
              amount: service?.priceDeliverySrv || 0,
            };
          });
        
        setDuplicateServicesInfo({
          duplicateServiceIds: result.duplicateServiceIds || [],
          duplicateServiceNames: duplicateDetails.map(d => d.name),
          duplicateDetails: duplicateDetails,
          isPending: result.isPending || false,
          isPaid: result.isPaid || false,
          snapshotStatus: result.duplicateSnapshotStatus || 'unknown',
        });
        setShowDuplicateModal(true);
        setProcessing(false);
        return;
      }

      if (!result || !result.snapshot) {
        throw new Error('No se pudo procesar el pago');
      }

      console.log(`✅ Pago directo procesado exitosamente`);
      
      // Mostrar modal de éxito en lugar de Alert
      setSuccessData({
        snapshotId: result.snapshot.id,
        servicesCount: selectedIds.length,
        totalAmount: result.snapshot.total_amount,
        type: 'immediate',
      });
      setShowSuccessModal(true);
      
      setShowPayModal(false);
      setSelectedIds([]);
      setSelectAll(false);
      setReference("");
      
      // Recargar datos después de 1.5 segundos
      setTimeout(() => {
        loadData();
      }, 1500);
    } catch (err: any) {
      console.error('❌ Error:', err);
      setErrorMessage(err.message || "No se pudo procesar el pago directo");
      setShowErrorModal(true);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Resumen de pagos de {delivery?.name}</Text>
      {loading ? (
        <ActivityIndicator size="large" color={Colors.activeMenuText} />
      ) : (
        <>
          {/* Tabs */}
          <View style={styles.tabRow}>
            <TouchableOpacity onPress={() => setActiveTab("due")} style={[styles.tabButton, activeTab === "due" && styles.tabActive]}>
              <Text numberOfLines={1} ellipsizeMode="tail" style={[styles.tabText, activeTab === "due" && styles.tabTextActive]}>Por pagar</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setActiveTab("history")} style={[styles.tabButton, activeTab === "history" && styles.tabActive]}>
              <Text numberOfLines={1} ellipsizeMode="tail" style={[styles.tabText, activeTab === "history" && styles.tabTextActive]}>Historial</Text>
            </TouchableOpacity>
          </View>

          {/* Date filters: click to open calendar */}
          <View style={styles.filterRow}>
            <TouchableOpacity style={styles.dateInputTouchable} onPress={() => { setShowCalendar({ field: 'start' }); setCalendarMonth(new Date(startDate || Date.now())); }}>
              <Text style={styles.dateInputText}>{startDate || 'Desde'}</Text>
              <Ionicons name="calendar-outline" size={18} color={Colors.menuText} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.dateInputTouchable} onPress={() => { setShowCalendar({ field: 'end' }); setCalendarMonth(new Date(endDate || Date.now())); }}>
              <Text style={styles.dateInputText}>{endDate || 'Hasta'}</Text>
              <Ionicons name="calendar-outline" size={18} color={Colors.menuText} />
            </TouchableOpacity>
          </View>

          {activeTab === "due" ? (
            <>
              <View style={styles.selectAllRow}>
                <TouchableOpacity onPress={handleSelectAll}>
                  <Text style={{ color: Colors.menuText }}>{selectAll ? "Deseleccionar todo" : "Seleccionar todo"}</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setShowPayModal(true)} style={styles.payButtonSmall}>
                  <Text style={{ color: Colors.activeMenuText, fontWeight: "bold" }}>Pagar seleccionado</Text>
                </TouchableOpacity>
              </View>

              <FlatList
                data={applyDateFilter(unpaid)}
                renderItem={renderService}
                keyExtractor={item => item.id}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadData(); }} />}
                ListEmptyComponent={<Text style={styles.emptyText}>No hay viajes pendientes de pago.</Text>}
              />

              {/* Footer: total */}
              <View style={styles.footerRow}>
                <Text style={{ color: Colors.menuText }}>Total seleccionado:</Text>
                <Text style={{ color: Colors.activeMenuText, fontWeight: "bold" }}>{formatCurrency(totalSelectedAmount())}</Text>
              </View>
            </>
          ) : (
            <FlatList
              data={applyDateFilter(snapshots)}
              renderItem={renderSnapshot}
              keyExtractor={item => item.id}
              ListEmptyComponent={<Text style={styles.emptyText}>No hay historial de pagos.</Text>}
            />
          )}
        </>
      )}

      {/* Modal pago - Selecciona tipo de pago */}
      <Modal visible={showPayModal && paymentMode === null} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Tipo de pago</Text>
            <Text style={styles.modalSubtitle}>¿Cómo deseas procesar el pago?</Text>
            <Text style={styles.modalSubtitle}>Se procesarán {selectedIds.length} viaje{selectedIds.length !== 1 ? 's' : ''}</Text>
            <Text style={styles.modalSubtitle}>Total: {formatCurrency(totalSelectedAmount())}</Text>

            <View style={{ marginVertical: 16, gap: 12 }}>
              {/* Opción 1: Pago Inmediato */}
              <TouchableOpacity 
                style={[styles.paymentOptionCard, { borderColor: Colors.activeMenuText }]}
                onPress={() => setPaymentMode("immediate")}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                  <Ionicons name="flash" size={20} color={Colors.activeMenuText} style={{ marginRight: 8 }} />
                  <Text style={styles.paymentOptionTitle}>Pago Inmediato</Text>
                </View>
                <Text style={styles.paymentOptionDescription}>
                  Registra el pago directamente. El domiciliario recibirá confirmación inmediata.
                </Text>
              </TouchableOpacity>

              {/* Opción 2: Solicitud de Prefactura */}
              <TouchableOpacity 
                style={[styles.paymentOptionCard, { borderColor: '#FF9800' }]}
                onPress={() => setPaymentMode("request")}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                  <Ionicons name="document-text" size={20} color="#FF9800" style={{ marginRight: 8 }} />
                  <Text style={[styles.paymentOptionTitle, { color: '#FF9800' }]}>Crear Solicitud de Prefactura</Text>
                </View>
                <Text style={styles.paymentOptionDescription}>
                  Genera una solicitud que el domiciliario debe aprobar. Disponible por 7 días.
                </Text>
              </TouchableOpacity>
            </View>

            <View style={{ flexDirection: "row", gap: 12 }}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]} 
                onPress={() => {
                  setShowPayModal(false);
                  setPaymentMode(null);
                }}
                disabled={processing}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal pago - Detalles pago inmediato */}
      <Modal visible={showPayModal && paymentMode === "immediate"} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <TouchableOpacity 
              onPress={() => setPaymentMode(null)}
              style={{ marginBottom: 12 }}
            >
              <Ionicons name="chevron-back" size={24} color={Colors.menuText} />
            </TouchableOpacity>
            
            <Text style={styles.modalTitle}>Pago Inmediato</Text>
            <Text style={styles.modalSubtitle}>Se creará una factura con {selectedIds.length} viaje{selectedIds.length !== 1 ? 's' : ''}</Text>
            <Text style={styles.modalSubtitle}>Total: {formatCurrency(totalSelectedAmount())}</Text>

            <Text style={styles.label}>Método de pago (referencia)</Text>
            <View style={{ flexDirection: "row", gap: 8, marginBottom: 12 }}>
              {(["efectivo", "transferencia", "cheque", "otro"] as any).map((m: any) => (
                <TouchableOpacity key={m} onPress={() => setPaymentMethod(m)} style={[styles.methodBtn, paymentMethod === m && styles.methodBtnActive]}>
                  <Text style={{ color: paymentMethod === m ? "white" : Colors.menuText, fontSize: 12 }}>{m}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TextInput placeholder="Referencia (opcional)" style={styles.input} value={reference} onChangeText={setReference} placeholderTextColor={Colors.menuText} />

            <View style={{ flexDirection: "row", gap: 12 }}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]} 
                onPress={() => {
                  setShowPayModal(false);
                  setPaymentMode(null);
                  setReference("");
                }}
                disabled={processing}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, styles.confirmButton, processing && { opacity: 0.6 }]} 
                onPress={handleConfirmPayment}
                disabled={processing}
              >
                {processing ? (
                  <ActivityIndicator color="white" size="small" />
                ) : (
                  <Text style={styles.confirmButtonText}>Confirmar pago</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal solicitud prefactura - Confirmación */}
      <Modal visible={showPayModal && paymentMode === "request"} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <TouchableOpacity 
              onPress={() => setPaymentMode(null)}
              style={{ marginBottom: 12 }}
            >
              <Ionicons name="chevron-back" size={24} color={Colors.menuText} />
            </TouchableOpacity>
            
            <Text style={styles.modalTitle}>Solicitud de Prefactura</Text>
            <Text style={styles.modalSubtitle}>Se enviará una solicitud al domiciliario</Text>
            <Text style={styles.modalSubtitle}>{selectedIds.length} viaje{selectedIds.length !== 1 ? 's' : ''}</Text>
            <Text style={styles.modalSubtitle}>Total: {formatCurrency(totalSelectedAmount())}</Text>

            <View style={{ backgroundColor: 'rgba(255, 152, 0, 0.1)', padding: 12, borderRadius: 8, marginVertical: 12 }}>
              <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                <Ionicons name="information-circle" size={18} color="#FF9800" style={{ marginRight: 8, marginTop: 2 }} />
                <Text style={{ color: '#FF9800', fontSize: 12, flex: 1, lineHeight: 18 }}>
                  El domiciliario tendrá 7 días para revisar y aprobar esta solicitud de pago. Una vez aprobada, se procesará el pago automáticamente.
                </Text>
              </View>
            </View>

            <View style={{ flexDirection: "row", gap: 12 }}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]} 
                onPress={() => {
                  setShowPayModal(false);
                  setPaymentMode(null);
                }}
                disabled={processing}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, styles.confirmButton, processing && { opacity: 0.6 }]} 
                onPress={handleCreatePaymentRequest}
                disabled={processing}
              >
                {processing ? (
                  <ActivityIndicator color="white" size="small" />
                ) : (
                  <Text style={styles.confirmButtonText}>Crear solicitud</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Calendar modal */}
      <Modal visible={!!showCalendar} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modal, { width: '92%', maxWidth: 420 }]}>
            <View style={{ marginBottom: 8 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <TouchableOpacity onPress={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1))}>
                  <Ionicons name="chevron-back" size={22} color={Colors.menuText} />
                </TouchableOpacity>
                <Text style={{ color: Colors.normalText, fontWeight: 'bold' }}>{calendarMonth.toLocaleString(undefined, { month: 'long', year: 'numeric' })}</Text>
                <TouchableOpacity onPress={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1))}>
                  <Ionicons name="chevron-forward" size={22} color={Colors.menuText} />
                </TouchableOpacity>
              </View>

              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8, alignItems: 'center' }}>
                <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
                  <Text style={{ color: Colors.menuText, fontSize: 12 }}>Inicio:</Text>
                  <Text style={{ color: Colors.normalText, fontWeight: '700' }}>{startDate || '-'}</Text>
                </View>
                <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
                  <Text style={{ color: Colors.menuText, fontSize: 12 }}>Fin:</Text>
                  <Text style={{ color: Colors.normalText, fontWeight: '700' }}>{endDate || '-'}</Text>
                </View>
              </View>

              <View style={{ marginTop: 8 }}>
                <Text style={{ color: Colors.menuText, fontSize: 12 }}>Seleccionando: {showCalendar?.field === 'start' ? 'Desde' : 'Hasta'}</Text>
              </View>
            </View>

            {/* Weekday labels */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
              {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map((w) => (
                <View key={w} style={{ flex: 1, alignItems: 'center' }}>
                  <Text style={{ color: Colors.activeMenuText, fontWeight: '700', fontSize: 11 }}>{w}</Text>
                </View>
              ))}
            </View>

            {/* Days grid */}
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 4 }}>
              {(() => {
                const first = startOfMonth(calendarMonth);
                const startDay = first.getDay();
                const total = daysInMonth(calendarMonth);
                const cellSize = 48;
                const containerWidth = 420 - 32;
                const cellWidth = containerWidth / 7;
                
                const weeks = [];
                let currentWeek = [];
                
                // Agregar días vacíos al inicio
                for (let i = 0; i < startDay; i++) {
                  currentWeek.push(null);
                }
                
                // Agregar días del mes
                for (let d = 1; d <= total; d++) {
                  if (currentWeek.length === 7) {
                    weeks.push([...currentWeek]);
                    currentWeek = [];
                  }
                  currentWeek.push(d);
                }
                
                // Completar última semana
                while (currentWeek.length < 7) {
                  currentWeek.push(null);
                }
                if (currentWeek.length > 0) {
                  weeks.push(currentWeek);
                }
                
                return weeks.map((week, weekIdx) => (
                  <View key={`week-${weekIdx}`} style={{ flexDirection: 'row', width: '100%', justifyContent: 'space-between', marginBottom: 4 }}>
                    {week.map((d, dayIdx) => {
                      if (!d) {
                        return <View key={`empty-${dayIdx}`} style={{ flex: 1, height: cellSize, marginHorizontal: 2 }} />;
                      }
                      
                      const cur = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), d);
                      const iso = formatISO(cur);
                      const isStart = iso === startDate;
                      const isEnd = iso === endDate;
                      const inRange = isBetween(iso);

                      const dayStyle: any = { 
                        flex: 1,
                        height: cellSize, 
                        marginHorizontal: 2,
                        borderRadius: 8, 
                        justifyContent: 'center', 
                        alignItems: 'center',
                        backgroundColor: 'transparent'
                      };
                      const textStyle: any = { color: Colors.normalText, fontWeight: '600', fontSize: 14 };

                      if (isStart) { 
                        dayStyle.backgroundColor = Colors.activeMenuText; 
                        textStyle.color = Colors.Background; 
                      } else if (isEnd) { 
                        dayStyle.backgroundColor = Colors.activeMenuText; 
                        textStyle.color = Colors.Background; 
                      } else if (inRange) { 
                        dayStyle.backgroundColor = 'rgba(244, 197, 66, 0.2)'; 
                        textStyle.color = Colors.activeMenuText;
                      }

                      return (
                        <TouchableOpacity key={iso} onPress={() => onPickDate(cur)} style={dayStyle}>
                          <Text style={textStyle}>{d}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                ));
              })()}
            </View>

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 }}>
              <TouchableOpacity style={[styles.modalButton, styles.cancelButton]} onPress={() => setShowCalendar(null)}>
                <Text style={styles.cancelButtonText}>Cerrar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalButton, styles.confirmButton]} onPress={() => { if (showCalendar?.field === 'start') setStartDate(''); else setEndDate(''); }}>
                <Text style={styles.confirmButtonText}>Limpiar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal de duplicados - MEJORADO */}
      <Modal visible={showDuplicateModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modal, styles.scrollableModal, { maxWidth: 420 }]}>
            <ScrollView
              style={{ flex: 1 }}
              contentContainerStyle={{ paddingBottom: 16 }}
              showsVerticalScrollIndicator={true}
              scrollIndicatorInsets={{ right: 1 }}
            >
              {/* Header */}
              <View style={styles.duplicateModalHeader}>
                <View style={styles.duplicateIconContainer}>
                  <Ionicons name="warning" size={32} color="#FF9800" />
                </View>
                <Text style={styles.duplicateModalTitle}>Viajes Duplicados</Text>
              </View>

              {/* Info Box */}
              <View style={styles.duplicateInfoBox}>
                {duplicateServicesInfo?.isPending && (
                  <View style={{ marginBottom: 12 }}>
                    <Text style={styles.duplicateModalSubtitle}>
                      ⏳ {duplicateServicesInfo?.duplicateServiceIds.length || 0} viaje(s) está(n) en una solicitud de pago pendiente de aprobación
                    </Text>
                  </View>
                )}
                {duplicateServicesInfo?.isPaid && (
                  <View style={{ marginBottom: 12 }}>
                    <Text style={styles.duplicateModalSubtitle}>
                      ✓ {duplicateServicesInfo?.duplicateServiceIds.length || 0} viaje(s) ya ha(n) sido pagado(s)
                    </Text>
                  </View>
                )}
                {!duplicateServicesInfo?.isPending && !duplicateServicesInfo?.isPaid && (
                  <View style={{ marginBottom: 12 }}>
                    <Text style={styles.duplicateModalSubtitle}>
                      {duplicateServicesInfo?.duplicateServiceIds.length || 0} viaje(s) ya está(n) en otra factura de domiciliario
                    </Text>
                  </View>
                )}
              </View>

              {/* Lista de servicios duplicados */}
              {duplicateServicesInfo && duplicateServicesInfo.duplicateDetails && duplicateServicesInfo.duplicateDetails.length > 0 && (
                <View style={styles.duplicateServicesList}>
                  {duplicateServicesInfo.duplicateDetails.map((detail: any, idx: number) => (
                    <View key={idx} style={styles.duplicateServiceItemContainer}>
                      <View style={styles.duplicateServiceItemLeft}>
                        <Ionicons name="alert-circle" size={18} color="#FF9800" />
                        <View style={{ marginLeft: 12, flex: 1 }}>
                          <Text style={styles.duplicateServiceName}>{detail.name}</Text>
                          <Text style={styles.duplicateServiceDetail}>
                            Estado: {detail.status}
                          </Text>
                          <Text style={styles.duplicateServiceAmount}>
                            {formatCurrency(detail.amount)}
                          </Text>
                        </View>
                      </View>
                    </View>
                  ))}
                </View>
              )}

              {/* Explicación */}
              <View style={styles.duplicateWarningBox}>
                <Ionicons name="information-circle" size={20} color={Colors.activeMenuText} />
                <Text style={styles.duplicateWarningText}>
                  {duplicateServicesInfo?.isPending
                    ? 'Deselecciona estos viajes para continuar. O espera a que se apruebe la solicitud pendiente.'
                    : duplicateServicesInfo?.isPaid
                    ? 'Estos viajes ya fueron pagados y no se pueden cobrar nuevamente.'
                    : 'Deselecciona estos viajes para continuar con el pago.'}
                </Text>
              </View>
            </ScrollView>

            {/* Botones */}
            <View style={{ flexDirection: "row", gap: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)' }}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton, { flex: 1 }]} 
                onPress={() => setShowDuplicateModal(false)}
              >
                <Text style={styles.cancelButtonText}>Descartar</Text>
              </TouchableOpacity>
              {duplicateServicesInfo?.isPending && (
                <TouchableOpacity 
                  style={[styles.modalButton, styles.confirmButton, { flex: 1 }]} 
                  onPress={() => {
                    // Deseleccionar los duplicados
                    const newSelection = selectedIds.filter(
                      id => !duplicateServicesInfo.duplicateServiceIds.includes(id)
                    );
                    setSelectedIds(newSelection);
                    setSelectAll(false);
                    setShowDuplicateModal(false);
                  }}
                >
                  <Text style={styles.confirmButtonText}>Deseleccionar</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal de Éxito - NUEVO */}
      <Modal visible={showSuccessModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modal, styles.successModal]}>
            {/* Ícono de éxito con animación */}
            <View style={styles.successIconContainer}>
              <View style={styles.successCheckmark}>
                <Ionicons name="checkmark" size={48} color="#4CAF50" />
              </View>
            </View>

            {/* Título */}
            <Text style={styles.successTitle}>
              {successData?.type === 'request' ? '¡Solicitud Creada!' : '¡Pago Realizado!'}
            </Text>

            {/* Información del pago */}
            {successData && (
              <View style={styles.successDetailsBox}>
                <View style={styles.successDetailRow}>
                  <Text style={styles.successDetailLabel}>
                    {successData.type === 'request' ? 'Prefactura #' : 'Factura #'}
                  </Text>
                  <Text style={styles.successDetailValue}>{successData.snapshotId.slice(-8)}</Text>
                </View>
                <View style={[styles.successDetailRow, { marginTop: 12 }]}>
                  <Text style={styles.successDetailLabel}>Viajes</Text>
                  <Text style={styles.successDetailValue}>{successData.servicesCount}</Text>
                </View>
                <View style={[styles.successDetailRow, { marginTop: 12 }]}>
                  <Text style={styles.successDetailLabel}>Monto total</Text>
                  <Text style={styles.successDetailValueAmount}>{formatCurrency(successData.totalAmount)}</Text>
                </View>
              </View>
            )}

            {/* Mensaje */}
            <Text style={styles.successMessage}>
              {successData?.type === 'request'
                ? 'La solicitud de prefactura ha sido creada exitosamente. Los viajes seleccionados quedaran pendientes para pago hasta que el admin lo apruebe'
                : 'El pago ha sido procesado correctamente. Los viajes están marcados como pagados.'}
            </Text>

            {/* Botón de cierre */}
            <TouchableOpacity 
              style={[styles.modalButton, styles.confirmButton, { width: '100%', marginTop: 20 }]} 
              onPress={() => setShowSuccessModal(false)}
            >
              <Text style={styles.confirmButtonText}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal de Error - MEJORADO */}
      <Modal visible={showErrorModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modal, styles.errorModal]}>
            {/* Header */}
            <View style={styles.errorModalHeader}>
              <View style={styles.errorIconContainer}>
                <Ionicons name="close-circle" size={32} color="#D32F2F" />
              </View>
              <Text style={styles.errorModalTitle}>Error en el Pago</Text>
            </View>

            {/* Mensaje de error */}
            <View style={styles.errorMessageBox}>
              <Text style={styles.errorMessageText}>{errorMessage}</Text>
            </View>

            {/* Botón */}
            <TouchableOpacity 
              style={[styles.modalButton, styles.cancelButton, { width: '100%' }]} 
              onPress={() => setShowErrorModal(false)}
            >
              <Text style={styles.confirmButtonText}>Entendido</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal de descarga de Excel */}
      <Modal visible={showDownloadModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modal, styles.downloadModal]}>
            <View style={styles.modalHeaderDownload}>
              <Ionicons name="download" size={24} color={Colors.activeMenuText} />
              <Text style={styles.modalTitle}>Descargar Excel</Text>
            </View>
            
            <View style={styles.downloadInfoBox}>
              <Ionicons name="information-circle" size={18} color="#2196F3" style={{marginRight: 10}} />
              <Text style={{color: Colors.normalText, fontSize: 13, lineHeight: 18, flex: 1}}>
                Selecciona el formato en el que deseas descargar los servicios. El formato "Domiciliario" incluye solo el monto para domiciliario.
              </Text>
            </View>

            <View style={styles.downloadOptionsContainer}>
              <TouchableOpacity 
                style={[styles.downloadOptionButton, styles.downloadOptionComlete, {flex: 1}]}
                onPress={() => handleDownloadWithFormat('coordinator')}
                disabled={downloadingExcel}
                activeOpacity={0.7}
              >
                <View style={styles.downloadOptionIconContainer}>
                  <Ionicons name="document-text" size={28} color="#FF9800" />
                </View>
                <View style={{flex: 1}}>
                  <Text style={styles.downloadOptionTitle}>Completo</Text>
                  <Text style={styles.downloadOptionSubtitle}>24 columnas con IDs</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#FF9800" />
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.downloadOptionButton, styles.downloadOptionDelivery, {flex: 1}]}
                onPress={() => handleDownloadWithFormat('delivery')}
                disabled={downloadingExcel}
                activeOpacity={0.7}
              >
                <View style={styles.downloadOptionIconContainer}>
                  <Ionicons name="car" size={28} color="#1967D2" />
                </View>
                <View style={{flex: 1}}>
                  <Text style={styles.downloadOptionTitle}>Como Domiciliario</Text>
                  <Text style={styles.downloadOptionSubtitle}>12 columnas simplificadas</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#1967D2" />
              </TouchableOpacity>
            </View>

            <TouchableOpacity 
              style={[styles.modalButton, styles.cancelButton]}
              onPress={() => setShowDownloadModal(false)}
              disabled={downloadingExcel}
            >
              {downloadingExcel ? (
                <ActivityIndicator color={Colors.normalText} size="small" />
              ) : (
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal de detalles del servicio */}
      <ServiceDetailModal
        visible={showDetailModal}
        service={selectedService}
        loading={serviceLoading}
        onClose={() => {
          setShowDetailModal(false);
          setSelectedService(null);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.Background,
    padding: 16,
  },
  header: {
    fontSize: 20,
    fontWeight: "bold",
    color: Colors.activeMenuText,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: Colors.normalText,
    marginTop: 18,
    marginBottom: 8,
  },
  serviceCard: {
    backgroundColor: Colors.activeMenuBackground,
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
  },
  serviceTitle: {
    fontSize: 15,
    fontWeight: "bold",
    color: Colors.activeMenuText,
  },
  serviceDetail: {
    fontSize: 13,
    color: Colors.menuText,
  },
  serviceDate: {
    fontSize: 11,
    color: Colors.activeMenuText,
    fontWeight: '600',
  },
  emptyText: {
    color: Colors.menuText,
    fontStyle: "italic",
    textAlign: "center",
    marginVertical: 10,
  },
  serviceCardRow: {
    backgroundColor: Colors.activeMenuBackground,
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.04)',
  },
  tabRow: {
    flexDirection: "row",
    backgroundColor: 'transparent',
    borderRadius: 12,
    paddingHorizontal: 2,
    paddingVertical: 2,
    marginBottom: 12,
    alignItems: 'center',
    justifyContent: 'flex-start'
  },
  tabButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: 'center',
    marginRight: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.03)'
  },
  tabActive: {
    backgroundColor: 'rgba(244,197,66,0.14)',
    borderColor: 'rgba(244,197,66,0.28)'
  },
  tabText: {
    color: Colors.menuText,
    fontWeight: "600",
    fontSize: 14,
    includeFontPadding: false,
  },
  tabTextActive: {
    color: Colors.activeMenuText,
  },
  filterRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 12,
  },
  dateInput: {
    flex: 1,
    backgroundColor: Colors.Border,
    paddingHorizontal: 10,
    paddingVertical: 8,
    color: Colors.normalText,
    borderRadius: 8,
  },
  dateInputTouchable: {
    flex: 1,
    backgroundColor: Colors.Border,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dateInputText: {
    color: Colors.normalText,
    fontSize: 14,
  },
  selectAllRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  payButtonSmall: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: Colors.activeMenuText,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  footerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.03)',
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
    padding: 16,
    width: "90%",
  },
  scrollableModal: {
    maxHeight: '85%',
    display: 'flex',
    flexDirection: 'column',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: Colors.normalText,
    marginBottom: 6,
  },
  modalSubtitle: {
    color: Colors.menuText,
    marginBottom: 12,
  },
  methodBtn: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: Colors.Border,
  },
  methodBtnActive: {
    backgroundColor: 'rgba(244,197,66,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(244,197,66,0.22)'
  },
  input: {
    backgroundColor: Colors.Border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: Colors.normalText,
    fontSize: 13,
    marginBottom: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  cancelButton: {
    backgroundColor: Colors.Border,
  },
  cancelButtonText: {
    color: Colors.menuText,
    fontWeight: "bold",
  },
  confirmButton: {
    backgroundColor: Colors.activeMenuText,
  },
  confirmButtonText: {
    color: Colors.Background,
    fontWeight: "bold",
  },
  label: {
    color: Colors.menuText,
    marginBottom: 6,
    fontSize: 13,
  },
  snapshotCard: {
    backgroundColor: '#1C1C1E',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  snapshotCardPaid: {
    borderLeftColor: '#4CAF50',
    backgroundColor: 'rgba(76, 175, 80, 0.04)',
  },
  snapshotHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  snapshotId: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.normalText,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: 'transparent',
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  statusBadgePaid: {
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(76, 175, 80, 0.3)',
  },
  snapshotDetails: {
    marginBottom: 12,
  },
  snapshotAmount: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.activeMenuText,
  },
  snapshotPeriod: {
    fontSize: 11,
    color: Colors.menuText,
    marginTop: 2,
  },
  snapshotServices: {
    fontSize: 11,
    color: Colors.normalText,
    fontWeight: '500',
  },
  chargeButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 36,
    flexDirection: 'row',
  },
  chargeButtonSecondary: {
    backgroundColor: 'rgba(244, 197, 66, 0.1)',
    borderWidth: 1.5,
    borderColor: 'rgba(244, 197, 66, 0.3)',
    marginTop: 12,
  },
  chargeButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  duplicateModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    justifyContent: 'center',
  },
  duplicateModalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FF9800',
    marginLeft: 8,
  },
  duplicateModalSubtitle: {
    fontSize: 14,
    color: Colors.normalText,
    fontWeight: '600',
    marginBottom: 12,
  },
  duplicateServicesList: {
    backgroundColor: 'rgba(255, 152, 0, 0.08)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#FF9800',
  },
  duplicateServiceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  duplicateServiceName: {
    color: Colors.normalText,
    fontSize: 14,
    fontWeight: '500',
  },
  duplicateModalText: {
    color: Colors.menuText,
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
  },
  // ========== ESTILOS NUEVOS PARA MODALES MEJORADOS ==========
  duplicateIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 152, 0, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  duplicateInfoBox: {
    backgroundColor: 'rgba(255, 152, 0, 0.08)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#FF9800',
  },
  duplicateServiceItemContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 152, 0, 0.1)',
  },
  duplicateServiceItemLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
  },
  duplicateServiceDetail: {
    fontSize: 12,
    color: Colors.menuText,
    marginTop: 2,
  },
  duplicateServiceAmount: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FF9800',
    marginTop: 4,
  },
  duplicateWarningBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(76, 175, 80, 0.08)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: Colors.activeMenuText,
  },
  duplicateWarningText: {
    color: Colors.normalText,
    fontSize: 12,
    lineHeight: 16,
    marginLeft: 10,
    flex: 1,
  },
  // Modal de éxito
  successModal: {
    backgroundColor: 'rgba(24, 24, 26, 0.95)',
    maxWidth: 380,
  },
  successIconContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  successCheckmark: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(76, 175, 80, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#4CAF50',
  },
  successTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#4CAF50',
    textAlign: 'center',
    marginBottom: 16,
  },
  successDetailsBox: {
    backgroundColor: Colors.Border,
    borderRadius: 10,
    padding: 14,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  successDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  successDetailLabel: {
    fontSize: 12,
    color: Colors.menuText,
    fontWeight: '500',
  },
  successDetailValue: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.normalText,
  },
  successDetailValueAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: '#4CAF50',
  },
  successMessage: {
    fontSize: 13,
    color: Colors.menuText,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 12,
  },
  // Modal de error
  errorModal: {
    maxWidth: 380,
  },
  errorModalHeader: {
    alignItems: 'center',
    marginBottom: 16,
  },
  errorIconContainer: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(211, 47, 47, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#D32F2F',
  },
  errorModalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#D32F2F',
  },
  errorMessageBox: {
    backgroundColor: 'rgba(211, 47, 47, 0.08)',
    borderRadius: 8,
    padding: 14,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#D32F2F',
  },
  errorMessageText: {
    fontSize: 13,
    color: Colors.normalText,
    lineHeight: 18,
  },
  downloadModal: {
    maxHeight: '75%',
  },
  modalHeaderDownload: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(25, 103, 210, 0.1)',
  },
  downloadInfoBox: {
    flexDirection: 'row',
    backgroundColor: 'rgba(33, 150, 243, 0.08)',
    borderRadius: 10,
    padding: 12,
    marginBottom: 18,
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
  },
  downloadOptionsContainer: {
    gap: 12,
    marginBottom: 16,
  },
  downloadOptionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1.5,
  },
  downloadOptionIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  downloadOptionComlete: {
    backgroundColor: 'rgba(255, 152, 0, 0.08)',
    borderColor: 'rgba(255, 152, 0, 0.2)',
  },
  downloadOptionDelivery: {
    backgroundColor: 'rgba(25, 103, 210, 0.08)',
    borderColor: 'rgba(25, 103, 210, 0.2)',
  },
  downloadOptionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.normalText,
    marginBottom: 2,
  },
  downloadOptionSubtitle: {
    fontSize: 12,
    color: Colors.menuText,
  },
  // Estilos para opciones de pago
  paymentOptionCard: {
    backgroundColor: Colors.Border,
    borderRadius: 10,
    padding: 14,
    borderWidth: 2,
    flexDirection: 'column',
  },
  paymentOptionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.normalText,
  },
  paymentOptionDescription: {
    fontSize: 12,
    color: Colors.menuText,
    lineHeight: 16,
  },
});
