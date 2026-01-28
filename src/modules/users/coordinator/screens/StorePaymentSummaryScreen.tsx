import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, FlatList, TouchableOpacity, RefreshControl, Modal, TextInput, Alert, Animated } from 'react-native';
import { useAuth } from '../../../../providers/AuthProvider';
import { fetchServices, updateServiceData } from '../../../../services/services';
import { formatCurrency } from '../../../../services/payments';
import { Colors } from '../../../../constans/colors';
import { Ionicons } from '@expo/vector-icons';
import { RouteProp, useRoute, useNavigation } from '@react-navigation/native';
import { usePayments, useServicesDetail } from '../../../../hooks/usePayments';

type Params = {
  StorePaymentSummary: {
    storeId: string;
    storeName?: string;
  };
};

interface Snapshot {
  id: string;
  type: 'store';
  store_id: string;
  period_start: string;
  period_end: string;
  total_amount: number;
  status: 'pending' | 'paid';
  notes?: string;
  created_at: string;
  paid_at?: string;
  services_count: number;
  services: any[];
}

export default function StorePaymentSummaryScreen({ store, onClose }: { store?: any; onClose?: ()=>void }){
  const route = useRoute<RouteProp<Params,'StorePaymentSummary'>>();
  const navigation = useNavigation();
  const { session } = useAuth();
  const { getStorePaymentSnapshots, createStoreSnapshot, chargeStoreSnapshot, deleteSnapshot, sendStoreSnapshotEmail } = usePayments(session?.access_token || null);
  const { getServicesDetail, downloadServicesExcel, loading: loadingServicesDetail } = useServicesDetail(session?.access_token || null);
  
  const routeParams = (route && (route.params as any)) || {};
  const storeId = store?.id ?? routeParams.storeId;
  const storeName = store?.name ?? routeParams.storeName;

  const [loadingUnpaid, setLoadingUnpaid] = useState(false);
  const [loadingSnapshots, setLoadingSnapshots] = useState(false);
  const [unpaid, setUnpaid] = useState<any[]>([]);
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showPayModal, setShowPayModal] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'efectivo'|'transferencia'|'cheque'|'otro'>('efectivo');
  const [reference, setReference] = useState('');
  const [activeTab, setActiveTab] = useState<'due'|'history'>('due');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showCalendar, setShowCalendar] = useState<null | { field: 'start' | 'end' }>(null);
  const [calendarMonth, setCalendarMonth] = useState(()=> new Date());
  const [selectAll, setSelectAll] = useState(false);
  const [selectedSnapshot, setSelectedSnapshot] = useState<Snapshot | null>(null);
  const [chargingSnapshotId, setChargingSnapshotId] = useState<string | null>(null);
  const [showChargeModal, setShowChargeModal] = useState(false);
  const [chargeModalSnapshot, setChargeModalSnapshot] = useState<Snapshot | null>(null);
  const [chargeNotes, setChargeNotes] = useState('');
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [duplicateServicesInfo, setDuplicateServicesInfo] = useState<{
    duplicateServiceIds: string[];
    duplicateServiceNames: string[];
    duplicateDetails?: any[];
    isPending?: boolean;
    isPaid?: boolean;
    snapshotStatus?: string;
  } | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [snapshotToDelete, setSnapshotToDelete] = useState<Snapshot | null>(null);
  const [deleteConfirmationCode, setDeleteConfirmationCode] = useState('');
  const [deletingSnapshotId, setDeletingSnapshotId] = useState<string | null>(null);
  const [loadedTabs, setLoadedTabs] = useState<{ due: boolean; history: boolean }>({ due: false, history: false });
  
  // Estados para servicios detallados
  const [servicesDetail, setServicesDetail] = useState<any[]>([]);
  const [showServicesDetailModal, setShowServicesDetailModal] = useState(false);

  // Estados para envío de email
  const [sendingEmailSnapshotId, setSendingEmailSnapshotId] = useState<string | null>(null);
  const [showSendEmailModal, setShowSendEmailModal] = useState(false);
  const [emailModalSnapshot, setEmailModalSnapshot] = useState<Snapshot | null>(null);

  // Estados para notificaciones
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const notificationOpacity = React.useRef(new Animated.Value(0)).current;
  const notificationTranslate = React.useRef(new Animated.Value(-100)).current;
  
  // Función para mostrar notificación
  const showNotification = (type: 'success' | 'error', message: string) => {
    // Animar entrada
    Animated.parallel([
      Animated.timing(notificationOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.spring(notificationTranslate, {
        toValue: 0,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();

    setNotification({ type, message });
    
    // Animar salida después de 4 segundos
    setTimeout(() => {
      Animated.parallel([
        Animated.timing(notificationOpacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(notificationTranslate, {
          toValue: -100,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setNotification(null);
      });
    }, 4000);
  };

  // Cargar datos cuando cambia el tab activo
  useEffect(() => {
    if (!session?.access_token || !storeId) return;
    
    if (activeTab === 'due' && !loadedTabs.due) {
      loadUnpaid();
    } else if (activeTab === 'history' && !loadedTabs.history) {
      loadSnapshots();
    }
  }, [activeTab, session, storeId]);

  async function loadUnpaid(){
    if (!session?.access_token || !storeId) return;
    setLoadingUnpaid(true);
    try{
      console.log(`\n🛒 [STORE-PAYMENT] Cargando servicios en estado entregado para tienda: ${storeId}`);
      
      const all = await fetchServices(session.access_token);
      const sUnpaid = all.filter((s)=> {
        const belongs = (s.storeId === storeId || s.profileStoreId === storeId);
        const status = (s.status || '').toString().toLowerCase();
        const isDelivered = status === 'entregado';
        return belongs && isDelivered;
      });
      console.log(`✅ [STORE-PAYMENT] ${sUnpaid.length} servicios en estado entregado encontrados`);
      setUnpaid(sUnpaid);
      setLoadedTabs(prev => ({ ...prev, due: true }));
    }catch(e){
      console.error('❌ [STORE-PAYMENT] Error en loadUnpaid:', e);
      setUnpaid([]);
    }finally{ 
      setLoadingUnpaid(false); 
      setRefreshing(false); 
    }
  }

  async function loadSnapshots(){
    if (!session?.access_token || !storeId) return;
    setLoadingSnapshots(true);
    try{
      console.log(`\n📋 [STORE-PAYMENT] Cargando snapshots para tienda: ${storeId}`);
      
      const snapshotsData = await getStorePaymentSnapshots(storeId);
      console.log(`✅ [STORE-PAYMENT] ${snapshotsData?.length || 0} snapshots obtenidos`);
      
      if (snapshotsData && snapshotsData.length > 0) {
        snapshotsData.forEach((snap: any, idx: number) => {
          console.log(`  [Snapshot ${idx}]: ID=${snap.id}, Status=${snap.status}, Services=${snap.services_count}`);
        });
      }
      
      setSnapshots(snapshotsData || []);
      setLoadedTabs(prev => ({ ...prev, history: true }));
    }catch(e){
      console.error('❌ [STORE-PAYMENT] Error en loadSnapshots:', e);
      setSnapshots([]);
    }finally{ 
      setLoadingSnapshots(false); 
      setRefreshing(false); 
    }
  }

  const handleViewServicesDetail = async (serviceIds: string[]) => {
    if (serviceIds.length === 0) {
      Alert.alert('Error', 'No hay servicios para mostrar');
      return;
    }

    try {
      const details = await getServicesDetail(serviceIds);
      setServicesDetail(details);
      setShowServicesDetailModal(true);
    } catch (err: any) {
      Alert.alert('Error', 'Error al cargar detalles de servicios');
      console.error(err);
    }
  };

  const handleDownloadExcel = async (serviceIds: string[]) => {
    if (serviceIds.length === 0) {
      Alert.alert('Error', 'No hay servicios para descargar');
      return;
    }

    try {
      await downloadServicesExcel(serviceIds, `servicios-tienda-${Date.now()}.xlsx`);
    } catch (err: any) {
      Alert.alert('Error', 'Error al descargar Excel');
      console.error(err);
    }
  };

  async function load(){
    if (!session?.access_token || !storeId) return;
    setLoadingUnpaid(true);
    setLoadingSnapshots(true);
    try{
      console.log(`\n🛒 [STORE-PAYMENT] Cargando todos los datos de tienda: ${storeId}`);
      
      // Cargar servicios
      console.log('📦 [STORE-PAYMENT] Cargando servicios en estado entregado...');
      const all = await fetchServices(session.access_token);
      const sUnpaid = all.filter((s)=> {
        const belongs = (s.storeId === storeId || s.profileStoreId === storeId);
        const status = (s.status || '').toString().toLowerCase();
        const isDelivered = status === 'entregado';
        return belongs && isDelivered;
      });
      console.log(`✅ [STORE-PAYMENT] ${sUnpaid.length} servicios en estado entregado encontrados`);
      setUnpaid(sUnpaid);
      setLoadingUnpaid(false);

      // Cargar snapshots de tienda usando el hook
      console.log('📋 [STORE-PAYMENT] Cargando snapshots del hook...');
      try {
        const snapshotsData = await getStorePaymentSnapshots(storeId);
        console.log(`✅ [STORE-PAYMENT] ${snapshotsData?.length || 0} snapshots obtenidos`);
        setSnapshots(snapshotsData || []);
      } catch (snapErr) {
        console.error('❌ [STORE-PAYMENT] Error loading snapshots:', snapErr);
        setSnapshots([]);
      }
      setLoadingSnapshots(false);
    }catch(e){
      console.error('❌ [STORE-PAYMENT] Error en load:', e);
      setUnpaid([]); 
      setSnapshots([]);
      setLoadingUnpaid(false);
      setLoadingSnapshots(false);
    }finally{ 
      setRefreshing(false); 
    }
  }

  function totalSelectedAmount(){
    return selectedIds.reduce((s,id)=>{
      const it = unpaid.find(u=>u.id===id);
      return s + (it ? (it.price ?? it.amount ?? 0) : 0);
    },0);
  }

  async function handleCreateSnapshot(){
    if (!session?.access_token) return Alert.alert('Error','No hay sesión');
    if (selectedIds.length === 0) return Alert.alert('Selecciona viajes', 'Debes seleccionar al menos un servicio.');

    setProcessingPayment(true);
    try{
      const totalAmount = totalSelectedAmount();
      
      console.log(`\n📝 [SCREEN] Creando snapshot de tienda usando hook`);
      
      const newSnapshot = await createStoreSnapshot(storeId, selectedIds, totalAmount);
      
      // 🔍 Verificar si la respuesta es un error de duplicados
      if (newSnapshot && newSnapshot.ok === false && newSnapshot.reason === 'SERVICES_ALREADY_IN_STORE_SNAPSHOT') {
        console.warn('⚠️ [SCREEN] Servicios duplicados detectados:', newSnapshot.duplicateServiceIds);
        
        // Preparar información detallada de servicios duplicados
        const duplicateDetails = newSnapshot.duplicateServiceIds
          .map((id: string) => {
            const service = unpaid.find(s => s.id === id);
            return {
              id: id,
              name: `Viaje #${id.slice(-4)}`,
              status: service?.status || 'N/A',
              amount: service?.price || service?.total_to_collect || 0,
            };
          });
        
        // Mostrar modal de duplicados
        setDuplicateServicesInfo({
          duplicateServiceIds: newSnapshot.duplicateServiceIds,
          duplicateServiceNames: duplicateDetails.map(d => d.name),
          duplicateDetails: duplicateDetails,
          isPending: newSnapshot.isPending || false,
          isPaid: newSnapshot.isPaid || false,
          snapshotStatus: newSnapshot.duplicateSnapshotStatus || 'unknown',
        });
        setShowDuplicateModal(true);
        setShowPayModal(false);
        setProcessingPayment(false);
        return;
      }

      if (!newSnapshot) {
        throw new Error('No se pudo crear el snapshot');
      }

      console.log(`✅ [SCREEN] Snapshot creado exitosamente`);
      setShowPayModal(false);
      showNotification('success', `Prefactura #${newSnapshot.id.slice(-8)} creada\nTotal: ${formatCurrency(totalSelectedAmount())} • ${selectedIds.length} servicio${selectedIds.length !== 1 ? 's' : ''}`);
      setSelectedIds([]);
      setSelectAll(false);
      await load();
    }catch(e: any){
      console.error('❌ [SCREEN] Error:', e);
      const errorMsg = e?.response?.data?.message || e.message || 'No se pudo crear la prefactura';
      showNotification('error', `No se pudo crear la prefactura\n${errorMsg}`);
    }finally{ 
      setProcessingPayment(false); 
    }
  }

  async function handleChargeSnapshot(snapshot: Snapshot){
    if (!session?.access_token) return Alert.alert('Error','No hay sesión');
    
    // Validar que el snapshot tenga servicios
    console.log(`\n🔍 [SCREEN] === Validando snapshot antes de cobrar ===`);
    console.log(`📌 Snapshot completo:`, JSON.stringify(snapshot, null, 2));
    console.log(`📦 snapshot.services:`, snapshot.services);
    console.log(`📦 Type of services:`, typeof snapshot.services);
    console.log(`📦 Is Array:`, Array.isArray(snapshot.services));
    
    if (!snapshot.services || !Array.isArray(snapshot.services) || snapshot.services.length === 0) {
      Alert.alert(
        'Error',
        'Esta prefactura no tiene servicios asociados. No se puede cobrar.',
        [{ text: 'OK' }]
      );
      return;
    }

    // Abrir modal en lugar de Alert
    setChargeModalSnapshot(snapshot);
    setShowChargeModal(true);
  }

  async function executeChargeSnapshot() {
    if (!chargeModalSnapshot || !session?.access_token) {
      Alert.alert('Error', 'No hay información del snapshot o sesión expirada');
      return;
    }

    const snapshot = chargeModalSnapshot;
    
    // Validar servicios
    if (!snapshot.services || snapshot.services.length === 0) {
      Alert.alert('Error', 'El snapshot no tiene servicios asociados');
      return;
    }

    setChargingSnapshotId(snapshot.id);
    
    try {
      console.log(`\n💳 [SCREEN] === INICIANDO COBRO DE PREFACTURA ===`);
      console.log(`📌 Snapshot ID: ${snapshot.id}`);
      console.log(`💰 Monto total: $${snapshot.total_amount.toFixed(2)}`);
      console.log(`📦 Cantidad de servicios: ${snapshot.services_count}`);
      console.log(`� Notas: ${chargeNotes || 'ninguna'}`);
      
      // Extraer service_ids del array de servicios
      console.log(`\n🔍 [SCREEN] Analizando estructura de servicios:`);
      console.log(`   Snapshot.services:`, JSON.stringify(snapshot.services, null, 2));
      
      const serviceIds = snapshot.services
        .map((s: any) => {
          console.log(`   Procesando servicio:`, s);
          const id = s.service_id || s.id;
          console.log(`   - ID extraído: ${id} (type: ${typeof id})`);
          console.log(`   - service_id field: ${s.service_id}`);
          console.log(`   - id field: ${s.id}`);
          return id;
        })
        .filter((id: any) => {
          const isValid = Boolean(id) && typeof id === 'string' && id.trim() !== '';
          console.log(`   Validando ID ${id}: ${isValid}`);
          return isValid;
        });
      
      console.log(`📤 [SCREEN] Service IDs extraídos (${serviceIds.length}):`, serviceIds);
      
      if (!serviceIds || serviceIds.length === 0) {
        throw new Error('No se encontraron service_ids válidos en esta prefactura');
      }
      
      console.log(`⏳ [SCREEN] Enviando solicitud de cobro al servidor...`);
      const result = await chargeStoreSnapshot(snapshot.id, serviceIds, chargeNotes);
      
      if (!result) {
        throw new Error('No se recibió respuesta del servidor');
      }

      console.log(`✅ [SCREEN] === COBRO EXITOSO ===`);
      console.log(`📊 Resultado:`, JSON.stringify(result, null, 2));
      
      // Validar que los servicios fueron actualizados
      if (result.services_count !== serviceIds.length) {
        console.warn(`⚠️ [SCREEN] Servicios actualizados (${result.services_count}) != solicitados (${serviceIds.length})`);
      }
      
      // ✅ Actualizar el snapshot en el estado local a 'paid' INMEDIATAMENTE
      console.log(`🔄 [SCREEN] Actualizando snapshot en estado local...`);
      const updatedSnapshots = snapshots.map(snap => 
        snap.id === snapshot.id 
          ? { ...snap, status: 'paid' as const, paid_at: new Date().toISOString() }
          : snap
      );
      setSnapshots(updatedSnapshots);
      
      // Limpiar también de la lista de "Por Cobrar" si la hay
      const revertedIds = snapshot.services?.map((s: any) => s.service_id) || [];
      const cleanedUnpaid = unpaid.filter(u => !revertedIds.includes(u.id));
      setUnpaid(cleanedUnpaid);
      
      console.log(`✅ [SCREEN] Estado local actualizado: snapshots=${updatedSnapshots.length}, unpaid=${cleanedUnpaid.length}`);
      
      // Cerrar modal
      setShowChargeModal(false);
      setChargeModalSnapshot(null);
      setChargingSnapshotId(null);
      setChargeNotes('');
      
      // Mostrar éxito - NO recargar automáticamente
      showNotification('success', `Prefactura #${snapshot.id.slice(-8)} cobrada exitosamente\n${formatCurrency(snapshot.total_amount)} • ${snapshot.services_count} servicio${snapshot.services_count !== 1 ? 's' : ''}`);
    } catch (error: any) {
      console.error(`\n❌ [SCREEN] === ERROR EN COBRO ===`);
      console.error(`Error completo:`, error);
      
      setChargingSnapshotId(null);
      
      const errorMsg = error?.response?.data?.message 
        || error?.response?.data?.error
        || error?.message 
        || 'Error desconocido al cobrar prefactura';
      
      console.error(`📝 Mensaje de error: ${errorMsg}`);
      showNotification('error', `No se pudo cobrar la prefactura\n${errorMsg}`);
    }
  }

  function handleChargeCancel() {
    setShowChargeModal(false);
    setChargeModalSnapshot(null);
  }

  function openDeleteModal(snapshot: Snapshot) {
    console.log(`🗑️ [SCREEN] Abriendo modal de eliminación para snapshot: ${snapshot.id}`);
    setSnapshotToDelete(snapshot);
    setDeleteConfirmationCode('');
    setShowDeleteModal(true);
  }

  async function executeDeleteSnapshot() {
    if (!snapshotToDelete || !session?.access_token) {
      Alert.alert('Error', 'No hay información del snapshot o sesión expirada');
      return;
    }

    const snapshot = snapshotToDelete;
    const last6Digits = snapshot.id.slice(-6);

    // Validar código de confirmación
    if (snapshot.status === 'paid' && deleteConfirmationCode !== last6Digits) {
      Alert.alert(
        'Código Incorrecto',
        `Debes ingresar los últimos 6 dígitos del snapshot: ${last6Digits}`,
        [{ text: 'OK' }]
      );
      return;
    }

    setDeletingSnapshotId(snapshot.id);

    try {
      console.log(`\n🗑️ [SCREEN] === ELIMINANDO SNAPSHOT ===`);
      console.log(`📌 Snapshot ID: ${snapshot.id}`);
      console.log(`💾 Status: ${snapshot.status}`);

      const result = await deleteSnapshot(snapshot.id);

      if (!result) {
        throw new Error('No se recibió respuesta del servidor');
      }

      console.log(`✅ [SCREEN] === SNAPSHOT ELIMINADO ===`);
      console.log(`📊 Resultado:`, JSON.stringify(result, null, 2));

      // Cerrar modal
      setShowDeleteModal(false);
      setSnapshotToDelete(null);
      setDeleteConfirmationCode('');
      setDeletingSnapshotId(null);

      // ✅ Actualizar estado local: Eliminar de snapshots INMEDIATAMENTE
      console.log(`🔄 [SCREEN] Eliminando snapshot del estado local...`);
      const updatedSnapshots = snapshots.filter(snap => snap.id !== snapshot.id);
      setSnapshots(updatedSnapshots);
      console.log(`✅ [SCREEN] Snapshots actualizados: ${updatedSnapshots.length} restantes`);

      // Si estaba pagada y servicios fueron revertidos, agregarlos de vuelta a "Por Cobrar"
      if (snapshot.status === 'paid' && snapshot.services && snapshot.services.length > 0) {
        console.log(`🔄 [SCREEN] Restaurando ${snapshot.services.length} servicios a "Por Cobrar"...`);
        // Esto se hará en la próxima carga o se puede hacer aquí
        // Por ahora, simplemente indicar al usuario que recargue
      }

      // Mostrar mensaje de éxito - NO recargar automáticamente
      let successMsg = `Prefactura #${snapshot.id.slice(-8)} eliminada exitosamente`;
      if (snapshot.status === 'paid') {
        successMsg += `\n${result.services_reverted} servicio${result.services_reverted !== 1 ? 's' : ''} revertido${result.services_reverted !== 1 ? 's' : ''}`;
      }
      showNotification('success', successMsg);
    } catch (error: any) {
      console.error(`\n❌ [SCREEN] === ERROR EN ELIMINACIÓN ===`);
      console.error(`Error completo:`, error);

      setDeletingSnapshotId(null);

      const errorMsg = error?.response?.data?.message
        || error?.response?.data?.error
        || error?.message
        || 'Error desconocido al eliminar prefactura';

      console.error(`📝 Mensaje de error: ${errorMsg}`);
      showNotification('error', `No se pudo eliminar la prefactura\n${errorMsg}`);
    }
  }

  // ====================================
  // EMAIL FUNCTIONS
  // ====================================
  function openSendEmailModal(snapshot: Snapshot) {
    console.log(`📧 [SCREEN] Abriendo modal para enviar snapshot por email: ${snapshot.id}`);
    setEmailModalSnapshot(snapshot);
    setShowSendEmailModal(true);
  }

  async function executeSendEmail() {
    if (!emailModalSnapshot || !session?.access_token) {
      Alert.alert('Error', 'No hay información del snapshot o sesión expirada');
      return;
    }

    const snapshot = emailModalSnapshot;
    setSendingEmailSnapshotId(snapshot.id);

    try {
      console.log(`\n📧 [SCREEN] === ENVIANDO SNAPSHOT POR EMAIL ===`);
      console.log(`📌 Snapshot ID: ${snapshot.id}`);
      console.log(`💰 Monto total: $${snapshot.total_amount.toFixed(2)}`);
      console.log(`📦 Cantidad de servicios: ${snapshot.services_count}`);

      const result = await sendStoreSnapshotEmail(snapshot.id);

      console.log(`📊 [SCREEN] Respuesta del servidor:`, JSON.stringify(result, null, 2));
      console.log(`📊 [SCREEN] Tipo de resultado:`, typeof result);
      console.log(`📊 [SCREEN] Propiedades:`, Object.keys(result || {}));

      // El resultado debería tener propiedades como email, snapshotId, etc.
      if (!result) {
        throw new Error('No se recibió respuesta del servidor');
      }

      console.log(`✅ [SCREEN] === EMAIL ENVIADO EXITOSAMENTE ===`);

      // Cerrar modal
      setShowSendEmailModal(false);
      setEmailModalSnapshot(null);
      setSendingEmailSnapshotId(null);

      // Mostrar éxito con email - busca el email en varias posiciones posibles
      const emailDestino = result.email 
        || result.data?.email 
        || result.destinatario 
        || result.admin_email
        || 'administrador';
      
      console.log(`📧 [SCREEN] Email destino encontrado: ${emailDestino}`);
      showNotification('success', `Email enviado exitosamente a\n${emailDestino}`);
    } catch (error: any) {
      console.error(`\n❌ [SCREEN] === ERROR AL ENVIAR EMAIL ===`);
      console.error(`Error completo:`, error);
      console.error(`Error type:`, typeof error);
      console.error(`Error message:`, error?.message);
      console.error(`Error response:`, error?.response);

      setSendingEmailSnapshotId(null);

      const errorMsg = error?.response?.data?.error
        || error?.response?.data?.message
        || error?.message
        || 'Error desconocido al enviar email';

      console.error(`📝 Mensaje de error a mostrar: ${errorMsg}`);
      showNotification('error', `No se pudo enviar el email\n${errorMsg}`);
    }
  }

  function handleSendEmailCancel() {
    setShowSendEmailModal(false);
    setEmailModalSnapshot(null);
    setSendingEmailSnapshotId(null);
  }

  // Calendar helpers
  const startOfMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth(), 1);
  const daysInMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  const formatISO = (d: Date) => d.toISOString().slice(0,10);
  const onPickDate = (d: Date) => {
    const iso = formatISO(d);
    if (showCalendar?.field === 'start') setStartDate(iso);
    if (showCalendar?.field === 'end') setEndDate(iso);
    setShowCalendar(null);
  };

  const parseDate = (s: string) => {
    if (!s) return null;
    const parts = s.split('-');
    if (parts.length !== 3) return null;
    const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    return isNaN(d.getTime()) ? null : d;
  };

  const applyDateFilter = (list: any[]) => {
    const sd = parseDate(startDate);
    const ed = parseDate(endDate);
    if (!sd && !ed) return list;
    return list.filter((s)=>{
      const dt = s.completedAt ? new Date(s.completedAt) : new Date(s.createdAt);
      if (sd && dt < sd) return false;
      if (ed){ const edEnd = new Date(ed); edEnd.setHours(23,59,59,999); if (dt > edEnd) return false; }
      return true;
    });
  };

  const renderService = ({item}: any) => (
    <View style={styles.serviceCardRow}>
      <TouchableOpacity onPress={() => {
        if (selectedIds.includes(item.id)) setSelectedIds(selectedIds.filter(id=>id!==item.id));
        else setSelectedIds([...selectedIds, item.id]);
      }}>
        <Ionicons name={selectedIds.includes(item.id) ? 'checkmark-circle' : 'ellipse-outline'} size={22} color={selectedIds.includes(item.id) ? Colors.activeMenuText : Colors.menuText} style={{marginRight:12}} />
      </TouchableOpacity>
      <View style={{flex:1}}>
        <Text style={styles.serviceTitle}>Viaje #{String(item.id).slice(-6)}</Text>
        <Text style={styles.serviceDetail}>Estado: {item.status}</Text>
        <Text style={styles.serviceDetail}>Valor: {formatCurrency(item.price ?? item.amount ?? 0)}</Text>
      </View>
    </View>
  );

  const renderSnapshot = ({ item }: { item: Snapshot }) => (
    <TouchableOpacity 
      style={[
        styles.snapshotCard,
        item.status === 'paid' ? styles.snapshotCardPaid : styles.snapshotCardPending,
      ]}
      onPress={() => {
        console.log(`👁️ [RENDER] Snapshot presionado:`, item);
      }}
    >
      <View style={styles.snapshotHeader}>
        <View>
          <Text style={styles.snapshotId}>Factura #{item.id.slice(-8)}</Text>
          <Text style={styles.snapshotPeriod}>
            {item.period_start} a {item.period_end}
          </Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <View
            style={[
              styles.statusBadge,
              item.status === 'paid'
                ? styles.statusBadgePaid
                : styles.statusBadgePending,
            ]}
          >
            <Ionicons
              name={item.status === 'paid' ? 'checkmark-circle' : 'time-outline'}
              size={16}
              color={item.status === 'paid' ? '#4CAF50' : '#FFC107'}
              style={{ marginRight: 6 }}
            />
            <Text style={[styles.statusBadgeText, { color: item.status === 'paid' ? '#4CAF50' : '#FFC107' }]}>
              {item.status === 'paid' ? 'Cobrado' : 'Pendiente'}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.snapshotDetails}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <Text style={styles.snapshotAmount}>${item.total_amount.toFixed(2)}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(244, 197, 66, 0.1)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 }}>
            <Ionicons name="document-text" size={14} color={Colors.activeMenuText} />
            <Text style={styles.snapshotServices}>
              {item.services_count} servicio{item.services_count !== 1 ? 's' : ''}
            </Text>
          </View>
        </View>
      </View>

      <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
        {item.status === 'pending' && (
          <TouchableOpacity
            style={[styles.chargeButton, styles.chargeButtonActive, chargingSnapshotId === item.id && styles.chargeButtonLoading]}
            onPress={() => handleChargeSnapshot(item)}
            disabled={chargingSnapshotId === item.id}
          >
            {chargingSnapshotId === item.id ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Ionicons name="card" size={14} color="#fff" style={{ marginRight: 6 }} />
                <Text style={styles.chargeButtonText}>Cobrar</Text>
              </>
            )}
          </TouchableOpacity>
        )}

        {item.services && item.services.length > 0 && (
          <>
            <TouchableOpacity
              style={[styles.chargeButton, styles.chargeButtonSecondary]}
              onPress={() => {
                const serviceIds = item.services
                  .map((s: any) => s.service_id || s.id)
                  .filter(Boolean);
                handleViewServicesDetail(serviceIds);
              }}
            >
              <Ionicons name="eye" size={14} color={Colors.activeMenuText} style={{ marginRight: 6 }} />
              <Text style={[styles.chargeButtonText, { color: Colors.activeMenuText }]}>Detalles</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.chargeButton, styles.chargeButtonSecondary]}
              onPress={() => {
                const serviceIds = item.services
                  .map((s: any) => s.service_id || s.id)
                  .filter(Boolean);
                handleDownloadExcel(serviceIds);
              }}
            >
              <Ionicons name="download" size={14} color={Colors.activeMenuText} style={{ marginRight: 6 }} />
              <Text style={[styles.chargeButtonText, { color: Colors.activeMenuText }]}>Descargar</Text>
            </TouchableOpacity>
          </>
        )}
        
        <TouchableOpacity
          style={[styles.chargeButton, styles.chargeButtonSecondary, sendingEmailSnapshotId === item.id && styles.chargeButtonLoading]}
          onPress={() => openSendEmailModal(item)}
          disabled={sendingEmailSnapshotId === item.id}
        >
          {sendingEmailSnapshotId === item.id ? (
            <ActivityIndicator color={Colors.activeMenuText} size="small" />
          ) : (
            <>
              <Ionicons name="mail" size={14} color={Colors.activeMenuText} style={{ marginRight: 6 }} />
              <Text style={[styles.chargeButtonText, { color: Colors.activeMenuText }]}>Enviar Email</Text>
            </>
          )}
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.deleteButton, deletingSnapshotId === item.id && styles.deleteButtonLoading]}
          onPress={() => openDeleteModal(item)}
          disabled={deletingSnapshotId === item.id}
        >
          {deletingSnapshotId === item.id ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <>
              <Ionicons name="trash-outline" size={14} color="#fff" style={{ marginRight: 6 }} />
              <Text style={styles.deleteButtonText}>Eliminar</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  const handleSelectAll = () => {
    if (selectAll){ setSelectedIds([]); setSelectAll(false); }
    else { setSelectedIds(unpaid.map(s=>s.id)); setSelectAll(true); }
  };

  return (
    <View style={styles.container}>
      {/* NOTIFICACIÓN VISUAL */}
      {notification && (
        <Animated.View
          style={[
            styles.notificationContainer,
            notification.type === 'success' ? styles.notificationSuccess : styles.notificationError,
            {
              opacity: notificationOpacity,
              transform: [{ translateY: notificationTranslate }],
            },
          ]}
        >
          <View style={styles.notificationContent}>
            <View style={styles.notificationIconWrapper}>
              <Ionicons
                name={notification.type === 'success' ? 'checkmark-circle' : 'alert-circle'}
                size={24}
                color="#fff"
              />
            </View>
            <View style={styles.notificationTextWrapper}>
              <Text
                style={styles.notificationText}
                numberOfLines={3}
              >
                {notification.message}
              </Text>
            </View>
            <TouchableOpacity 
              style={styles.notificationCloseBtn}
              onPress={() => {
                Animated.parallel([
                  Animated.timing(notificationOpacity, {
                    toValue: 0,
                    duration: 200,
                    useNativeDriver: true,
                  }),
                  Animated.timing(notificationTranslate, {
                    toValue: -100,
                    duration: 200,
                    useNativeDriver: true,
                  }),
                ]).start(() => {
                  setNotification(null);
                });
              }}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="close" size={18} color="#fff" />
            </TouchableOpacity>
          </View>
        </Animated.View>
      )}

      <View style={{flexDirection:'row', alignItems:'center', marginBottom:8}}>
        <TouchableOpacity onPress={() => { if (onClose) onClose(); else navigation.goBack(); }} style={{flexDirection:'row', alignItems:'center'}}>
          <Ionicons name="chevron-back" size={20} color={Colors.activeMenuText} />
          <Text style={{color:Colors.activeMenuText, marginLeft:8, fontWeight:'600'}}>Volver</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.header}>Resumen de pagos de {storeName}</Text>

      {/* Tabs */}
      <View style={styles.tabRow}>
        <TouchableOpacity onPress={()=>setActiveTab('due')} style={[styles.tabButton, activeTab==='due' && styles.tabActive]}>
          <Text style={[styles.tabText, activeTab==='due' && styles.tabTextActive]}>Por Cobrar</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={()=>setActiveTab('history')} style={[styles.tabButton, activeTab==='history' && styles.tabActive]}>
          <Text style={[styles.tabText, activeTab==='history' && styles.tabTextActive]}>Historial</Text>
        </TouchableOpacity>
      </View>

      {/* Date filters */}
      <View style={styles.filterRow}>
        <TouchableOpacity style={styles.dateInputTouchable} onPress={()=>{ setShowCalendar({ field: 'start' }); setCalendarMonth(new Date(startDate || Date.now())); }}>
          <Text style={styles.dateInputText}>{startDate || 'Desde'}</Text>
          <Ionicons name="calendar-outline" size={18} color={Colors.menuText} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.dateInputTouchable} onPress={()=>{ setShowCalendar({ field: 'end' }); setCalendarMonth(new Date(endDate || Date.now())); }}>
          <Text style={styles.dateInputText}>{endDate || 'Hasta'}</Text>
          <Ionicons name="calendar-outline" size={18} color={Colors.menuText} />
        </TouchableOpacity>
      </View>

      {activeTab === 'due' ? (
        <>
          <View style={styles.selectAllRow}>
            <TouchableOpacity onPress={handleSelectAll}>
              <Text style={{color:Colors.menuText}}>{selectAll ? 'Deseleccionar todo' : 'Seleccionar todo'}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={()=>setShowPayModal(true)} style={styles.payButtonSmall}>
              <Text style={{color:Colors.activeMenuText, fontWeight:'bold'}}>Crear prefactura</Text>
            </TouchableOpacity>
          </View>

          {loadingUnpaid ? (
            <View style={{flex:1, justifyContent:'center', alignItems:'center', paddingVertical:40}}>
              <ActivityIndicator color={Colors.activeMenuText} size="large" />
              <Text style={{color:Colors.menuText, marginTop:12}}>Cargando servicios...</Text>
            </View>
          ) : (
            <FlatList
              data={applyDateFilter(unpaid)}
              renderItem={renderService}
              keyExtractor={i=>i.id}
              refreshControl={<RefreshControl refreshing={refreshing} onRefresh={()=>{ setRefreshing(true); loadUnpaid(); }} />}
              contentContainerStyle={{ paddingTop: 8, paddingBottom: 20 }}
              ListEmptyComponent={<Text style={styles.emptyStateText}>No hay servicios pendientes.</Text>}
            />
          )}

          <View style={styles.footerRow}>
            <Text style={{color:Colors.menuText}}>Total seleccionado:</Text>
            <Text style={{color:Colors.activeMenuText, fontWeight:'bold'}}>{formatCurrency(totalSelectedAmount())}</Text>
          </View>
        </>
      ) : loadingSnapshots ? (
        <View style={{flex:1, justifyContent:'center', alignItems:'center', paddingVertical:40}}>
          <ActivityIndicator color={Colors.activeMenuText} size="large" />
          <Text style={{color:Colors.menuText, marginTop:12}}>Cargando historial...</Text>
        </View>
      ) : (
        <FlatList
          data={snapshots}
          renderItem={renderSnapshot}
          keyExtractor={i=>i.id}
          contentContainerStyle={{ paddingTop: 8, paddingBottom: 20 }}
          ListEmptyComponent={<Text style={styles.emptyStateText}>No hay historial de prefacturas.</Text>}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={()=>{ setRefreshing(true); loadSnapshots(); }} />}
          extraData={snapshots}
        />
      )}

      <Modal visible={showPayModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Crear prefactura</Text>
            <Text style={styles.modalSubtitle}>Total: {formatCurrency(totalSelectedAmount())}</Text>
            <Text style={styles.modalText}>Se creará una prefactura con {selectedIds.length} servicio{selectedIds.length !== 1 ? 's' : ''}</Text>

            <View style={{flexDirection:'row', gap:12}}>
              <TouchableOpacity style={[styles.modalButton, styles.cancelButton]} onPress={()=>setShowPayModal(false)}>
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalButton, styles.confirmButton]} onPress={handleCreateSnapshot}>
                {processingPayment ? <ActivityIndicator color={Colors.Background} /> : <Text style={styles.confirmButtonText}>Crear prefactura</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Calendar modal */}
      <Modal visible={!!showCalendar} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modal, { width: '92%', maxWidth: 420 }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <TouchableOpacity onPress={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1))}>
                <Ionicons name="chevron-back" size={22} color={Colors.menuText} />
              </TouchableOpacity>
              <Text style={{ color: Colors.normalText, fontWeight: 'bold' }}>{calendarMonth.toLocaleString(undefined, { month: 'long', year: 'numeric' })}</Text>
              <TouchableOpacity onPress={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1))}>
                <Ionicons name="chevron-forward" size={22} color={Colors.menuText} />
              </TouchableOpacity>
            </View>

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
              {['D', 'L', 'M', 'M', 'J', 'V', 'S'].map((w) => (
                <Text key={w} style={{ width: 36, textAlign: 'center', color: Colors.menuText, fontWeight: '600' }}>{w}</Text>
              ))}
            </View>

            <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
              {(() => {
                const first = startOfMonth(calendarMonth);
                const lead = first.getDay();
                const total = daysInMonth(calendarMonth);
                const nodes = [] as any[];
                for (let i = 0; i < lead; i++) nodes.push(<View key={'e' + i} style={{ width: 36, height: 36, margin: 2 }} />);
                for (let d = 1; d <= total; d++) {
                  const cur = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), d);
                  const iso = formatISO(cur);
                  const selected = iso === startDate || iso === endDate;
                  nodes.push(
                    <TouchableOpacity key={iso} onPress={() => onPickDate(cur)} style={{ width: 36, height: 36, margin: 2, borderRadius: 6, justifyContent: 'center', alignItems: 'center', backgroundColor: selected ? Colors.gradientStart : undefined }}>
                      <Text style={{ color: selected ? Colors.Background : Colors.menuText }}>{d}</Text>
                    </TouchableOpacity>
                  );
                }
                return nodes;
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

      {/* Charge Snapshot Modal - Detalles */}
      <Modal visible={showChargeModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Confirmar Cobro de Prefactura</Text>
            
            {chargeModalSnapshot && (
              <>
                <View style={{ marginBottom: 16 }}>
                  <Text style={styles.label}>ID Prefactura:</Text>
                  <Text style={styles.modalText}>#{chargeModalSnapshot.id.slice(-8)}</Text>
                </View>

                <View style={{ marginBottom: 16 }}>
                  <Text style={styles.label}>Período:</Text>
                  <Text style={styles.modalText}>{chargeModalSnapshot.period_start} a {chargeModalSnapshot.period_end}</Text>
                </View>

                <View style={{ marginBottom: 16 }}>
                  <Text style={styles.label}>Monto Total:</Text>
                  <Text style={[styles.modalText, { fontSize: 18, fontWeight: '700', color: Colors.activeMenuText }]}>
                    ${chargeModalSnapshot.total_amount.toFixed(2)}
                  </Text>
                </View>

                <View style={{ marginBottom: 16 }}>
                  <Text style={styles.label}>Cantidad de Servicios:</Text>
                  <Text style={styles.modalText}>{chargeModalSnapshot.services_count}</Text>
                </View>

                <View style={{ marginBottom: 16 }}>
                  <Text style={styles.label}>Notas (opcional):</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Agregar notas sobre el pago..."
                    placeholderTextColor={Colors.menuText}
                    value={chargeNotes}
                    onChangeText={setChargeNotes}
                    multiline
                  />
                </View>
              </>
            )}

            {/* Botones para ver detalles y descargar */}
            <View style={{ flexDirection: 'row', gap: 12, marginBottom: 16 }}>
              <TouchableOpacity 
                style={[styles.modalButton, { flex: 1, backgroundColor: Colors.activeMenuText }]}
                onPress={() => {
                  if (chargeModalSnapshot?.services && chargeModalSnapshot.services.length > 0) {
                    const serviceIds = chargeModalSnapshot.services
                      .map((s: any) => s.service_id || s.id)
                      .filter(Boolean);
                    handleViewServicesDetail(serviceIds);
                  } else {
                    Alert.alert('Error', 'No hay servicios para mostrar');
                  }
                }}
              >
                <Text style={{ color: Colors.Background, fontWeight: '600' }}>Ver Detalles</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, { flex: 1, backgroundColor: Colors.activeMenuText }]}
                onPress={() => {
                  if (chargeModalSnapshot?.services && chargeModalSnapshot.services.length > 0) {
                    const serviceIds = chargeModalSnapshot.services
                      .map((s: any) => s.service_id || s.id)
                      .filter(Boolean);
                    handleDownloadExcel(serviceIds);
                  } else {
                    Alert.alert('Error', 'No hay servicios para descargar');
                  }
                }}
              >
                <Text style={{ color: Colors.Background, fontWeight: '600' }}>📥 Descargar</Text>
              </TouchableOpacity>
            </View>

            <View style={{ flexDirection: 'row', gap: 12 }}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]} 
                onPress={() => {
                  setShowChargeModal(false);
                  setChargeModalSnapshot(null);
                  setChargeNotes('');
                }}
                disabled={chargingSnapshotId !== null}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, styles.confirmButton]}
                onPress={executeChargeSnapshot}
                disabled={chargingSnapshotId !== null}
              >
                {chargingSnapshotId ? (
                  <ActivityIndicator color={Colors.Background} size="small" />
                ) : (
                  <Text style={styles.confirmButtonText}>Cobrar</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal de Detalles de Servicios */}
      <Modal visible={showServicesDetailModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modal, { maxHeight: '90%', flex: 0.9 }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Detalles de Servicios</Text>
              <TouchableOpacity onPress={() => setShowServicesDetailModal(false)}>
                <Text style={styles.closeButton}>×</Text>
              </TouchableOpacity>
            </View>
            
            {loadingServicesDetail ? (
              <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color={Colors.activeMenuText} />
                <Text style={{ marginTop: 10, color: Colors.menuText }}>Cargando servicios...</Text>
              </View>
            ) : servicesDetail.length > 0 ? (
              <FlatList
                data={servicesDetail}
                keyExtractor={(item, index) => item.id || index.toString()}
                renderItem={({ item }) => (
                  <View style={styles.serviceDetailCard}>
                    <View style={{ marginBottom: 12 }}>
                      <Text style={styles.detailLabel}>ID Servicio</Text>
                      <Text style={styles.detailValue}>{item.id || 'N/A'}</Text>
                    </View>
                    
                    <View style={{ marginBottom: 12 }}>
                      <Text style={styles.detailLabel}>Estado</Text>
                      <Text style={styles.detailValue}>{item.status || 'N/A'}</Text>
                    </View>

                    <View style={{ marginBottom: 12 }}>
                      <Text style={styles.detailLabel}>Cliente</Text>
                      <Text style={styles.detailValue}>{item.client_name || 'N/A'}</Text>
                    </View>

                    {item.phone && (
                      <View style={{ marginBottom: 12 }}>
                        <Text style={styles.detailLabel}>Teléfono</Text>
                        <Text style={styles.detailValue}>{item.phone}</Text>
                      </View>
                    )}

                    {item.delivery_address && (
                      <View style={{ marginBottom: 12 }}>
                        <Text style={styles.detailLabel}>Dirección Entrega</Text>
                        <Text style={styles.detailValue}>{item.delivery_address}</Text>
                      </View>
                    )}

                    {item.zone_name && (
                      <View style={{ marginBottom: 12 }}>
                        <Text style={styles.detailLabel}>Zona</Text>
                        <Text style={styles.detailValue}>{item.zone_name}</Text>
                      </View>
                    )}

                    {item.delivery_name && (
                      <View style={{ marginBottom: 12 }}>
                        <Text style={styles.detailLabel}>Domiciliario</Text>
                        <Text style={styles.detailValue}>{item.delivery_name}</Text>
                      </View>
                    )}

                    {item.price !== undefined && (
                      <View style={{ marginBottom: 12 }}>
                        <Text style={styles.detailLabel}>Valor Servicio</Text>
                        <Text style={styles.detailValue}>${(item.price || 0).toFixed(2)}</Text>
                      </View>
                    )}

                    {item.price_delivery_srv !== undefined && (
                      <View style={{ marginBottom: 12 }}>
                        <Text style={styles.detailLabel}>Valor Domicilio</Text>
                        <Text style={styles.detailValue}>${(item.price_delivery_srv || 0).toFixed(2)}</Text>
                      </View>
                    )}

                    {item.total_to_collect !== undefined && (
                      <View style={{ marginBottom: 12 }}>
                        <Text style={styles.detailLabel}>Total a Cobrar</Text>
                        <Text style={[styles.detailValue, { fontWeight: '700', color: Colors.activeMenuText }]}>
                          ${(item.total_to_collect || 0).toFixed(2)}
                        </Text>
                      </View>
                    )}

                    {item.is_paid !== undefined && (
                      <View style={{ marginBottom: 12 }}>
                        <Text style={styles.detailLabel}>Estado de Pago</Text>
                        <Text style={[styles.detailValue, { color: item.is_paid ? '#10b981' : '#ef4444' }]}>
                          {item.is_paid ? 'Pagado' : 'Pendiente'}
                        </Text>
                      </View>
                    )}

                    <View style={{ marginBottom: 0 }}>
                      <Text style={styles.detailLabel}>Creado</Text>
                      <Text style={styles.detailValue}>
                        {item.created_at ? new Date(item.created_at).toLocaleString('es-CO') : 'N/A'}
                      </Text>
                    </View>
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

      {/* Modal de Servicios Duplicados - MEJORADO */}
      <Modal visible={showDuplicateModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modal, { maxWidth: 420 }]}>
            {/* Header */}
            <View style={styles.duplicateModalHeader}>
              <View style={styles.duplicateIconContainer}>
                <Ionicons name="warning" size={32} color="#FF9800" />
              </View>
              <Text style={styles.duplicateModalTitle}>Servicios Duplicados</Text>
            </View>

            {/* Info Box */}
            <View style={styles.duplicateInfoBox}>
              {duplicateServicesInfo?.isPending && (
                <View style={{ marginBottom: 12 }}>
                  <Text style={styles.duplicateModalSubtitle}>
                    ⏳ {duplicateServicesInfo?.duplicateServiceIds.length || 0} servicio(s) está(n) en una solicitud de cobro pendiente de aprobación
                  </Text>
                </View>
              )}
              {duplicateServicesInfo?.isPaid && (
                <View style={{ marginBottom: 12 }}>
                  <Text style={styles.duplicateModalSubtitle}>
                    ✓ {duplicateServicesInfo?.duplicateServiceIds.length || 0} servicio(s) ya ha(n) sido cobrado(s)
                  </Text>
                </View>
              )}
              {!duplicateServicesInfo?.isPending && !duplicateServicesInfo?.isPaid && (
                <View style={{ marginBottom: 12 }}>
                  <Text style={styles.duplicateModalSubtitle}>
                    {duplicateServicesInfo?.duplicateServiceIds.length || 0} servicio(s) ya está(n) en otra factura de tienda
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
                          ${detail.amount.toFixed(2)}
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
                  ? 'Deselecciona estos servicios para continuar. O espera a que se apruebe la solicitud pendiente.'
                  : duplicateServicesInfo?.isPaid
                  ? 'Estos servicios ya fueron cobrados y no se pueden cobrar nuevamente.'
                  : 'Deselecciona estos servicios para continuar con la facturación.'}
              </Text>
            </View>

            {/* Botones */}
            <View style={{ flexDirection: "row", gap: 12, marginTop: 16 }}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]} 
                onPress={() => {
                  setShowDuplicateModal(false);
                  setDuplicateServicesInfo(null);
                }}
              >
                <Text style={styles.cancelButtonText}>Descartar</Text>
              </TouchableOpacity>
              {duplicateServicesInfo?.isPending && (
                <TouchableOpacity 
                  style={[styles.modalButton, styles.confirmButton]} 
                  onPress={() => {
                    // Deseleccionar los duplicados
                    const newSelection = selectedIds.filter(
                      id => !duplicateServicesInfo.duplicateServiceIds.includes(id)
                    );
                    setSelectedIds(newSelection);
                    setSelectAll(false);
                    setShowDuplicateModal(false);
                    setDuplicateServicesInfo(null);
                    console.log(`✅ [SCREEN] Servicios duplicados removidos. Nuevas selecciones: ${newSelection.length}`);
                  }}
                >
                  <Text style={styles.confirmButtonText}>Deseleccionar</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal de Eliminación de Snapshot */}
      <Modal visible={showDeleteModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modal, { maxWidth: 500 }]}>
            <View style={styles.deleteModalHeader}>
              <Ionicons name="trash" size={28} color="#D32F2F" />
              <Text style={styles.deleteModalTitle}>Eliminar Prefactura</Text>
            </View>

            {snapshotToDelete && (
              <>
                <Text style={styles.deleteModalSubtitle}>
                  ¿Estás seguro de que deseas eliminar esta prefactura?
                </Text>

                <View style={styles.deleteSnapshotInfo}>
                  <Text style={styles.deleteInfoLabel}>ID Prefactura:</Text>
                  <Text style={styles.deleteInfoValue}>#{snapshotToDelete.id.slice(-8)}</Text>

                  <Text style={styles.deleteInfoLabel}>Monto:</Text>
                  <Text style={styles.deleteInfoValue}>${snapshotToDelete.total_amount.toFixed(2)}</Text>

                  <Text style={styles.deleteInfoLabel}>Estado:</Text>
                  <Text style={[styles.deleteInfoValue, { color: snapshotToDelete.status === 'paid' ? '#4CAF50' : '#FFC107' }]}>
                    {snapshotToDelete.status === 'paid' ? 'Cobrada' : 'Pendiente'}
                  </Text>
                </View>

                {snapshotToDelete.status === 'paid' && (
                  <View style={styles.deleteWarning}>
                    <Ionicons name="warning" size={18} color="#FF9800" style={{ marginRight: 8 }} />
                    <Text style={styles.deleteWarningText}>
                      Se revertirán {snapshotToDelete.services_count} servicios a "entregado"
                    </Text>
                  </View>
                )}

                {snapshotToDelete.status === 'paid' && (
                  <View style={{ marginBottom: 16 }}>
                    <Text style={styles.deleteConfirmLabel}>
                      Ingresa los últimos 6 dígitos del snapshot para confirmar:
                    </Text>
                    <TextInput
                      style={styles.deleteConfirmInput}
                      placeholder={snapshotToDelete.id.slice(-6)}
                      placeholderTextColor={Colors.menuText}
                      value={deleteConfirmationCode}
                      onChangeText={setDeleteConfirmationCode}
                      maxLength={6}
                    />
                  </View>
                )}
              </>
            )}

            <View style={{ flexDirection: 'row', gap: 12 }}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setShowDeleteModal(false);
                  setSnapshotToDelete(null);
                  setDeleteConfirmationCode('');
                }}
                disabled={deletingSnapshotId !== null}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.deleteConfirmButton]}
                onPress={executeDeleteSnapshot}
                disabled={deletingSnapshotId !== null}
              >
                {deletingSnapshotId ? (
                  <ActivityIndicator color={Colors.Background} size="small" />
                ) : (
                  <Text style={styles.deleteConfirmButtonText}>Eliminar</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal de Envío de Email */}
      <Modal visible={showSendEmailModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>📧 Enviar Prefactura por Email</Text>
            
            {emailModalSnapshot && (
              <>
                <View style={{ marginBottom: 16 }}>
                  <Text style={styles.label}>ID Prefactura:</Text>
                  <Text style={styles.modalText}>#{emailModalSnapshot.id.slice(-8)}</Text>
                </View>

                <View style={{ marginBottom: 16 }}>
                  <Text style={styles.label}>Período:</Text>
                  <Text style={styles.modalText}>{emailModalSnapshot.period_start} a {emailModalSnapshot.period_end}</Text>
                </View>

                <View style={{ marginBottom: 16 }}>
                  <Text style={styles.label}>Monto Total:</Text>
                  <Text style={[styles.modalText, { fontSize: 18, fontWeight: '700', color: Colors.activeMenuText }]}>
                    ${emailModalSnapshot.total_amount.toFixed(2)}
                  </Text>
                </View>

                <View style={{ marginBottom: 16 }}>
                  <Text style={styles.label}>Cantidad de Servicios:</Text>
                  <Text style={styles.modalText}>{emailModalSnapshot.services_count}</Text>
                </View>

                <View style={{
                  backgroundColor: 'rgba(76, 175, 80, 0.1)',
                  borderRadius: 8,
                  padding: 12,
                  marginBottom: 16,
                  borderLeftWidth: 4,
                  borderLeftColor: Colors.activeMenuText,
                }}>
                  <Text style={{ color: Colors.normalText, fontSize: 13, lineHeight: 18 }}>
                    📎 Se enviará un email profesional al administrador de la tienda con el Excel adjunto con todos los detalles de los servicios.
                  </Text>
                </View>
              </>
            )}

            <View style={{ flexDirection: 'row', gap: 12 }}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]} 
                onPress={handleSendEmailCancel}
                disabled={sendingEmailSnapshotId !== null}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, styles.confirmButton]}
                onPress={executeSendEmail}
                disabled={sendingEmailSnapshotId !== null}
              >
                {sendingEmailSnapshotId ? (
                  <ActivityIndicator color={Colors.Background} size="small" />
                ) : (
                  <Text style={styles.confirmButtonText}>Enviar Email</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  emptyText: {
    color: Colors.menuText,
    fontStyle: "italic",
    textAlign: "center",
    marginVertical: 10,
  },
  emptyStateText: {
    color: Colors.menuText,
    fontStyle: "italic",
    textAlign: "center",
    marginVertical: 10,
  },
  serviceCardRow: {
    backgroundColor: Colors.activeMenuBackground,
    borderRadius: 10,
    padding: 14,
    marginBottom: 14,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.04)',
  },
  serviceRow: {
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
    paddingHorizontal: 0,
    paddingVertical: 2,
    marginBottom: 12,
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignItems: "center",
    justifyContent: 'center',
    marginRight: 8,
    borderRadius: 10,
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
    paddingHorizontal: 0,
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
    marginBottom: 12,
    paddingHorizontal: 0,
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
  modalText: {
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
  snapshotCardPending: {
    borderLeftColor: '#FFC107',
    backgroundColor: 'rgba(255, 193, 7, 0.04)',
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
  statusBadgePending: {
    backgroundColor: 'rgba(255, 193, 7, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 193, 7, 0.3)',
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
  chargeButtonActive: {
    backgroundColor: '#F4C542',
    shadowColor: '#F4C542',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  chargeButtonSecondary: {
    backgroundColor: 'rgba(244, 197, 66, 0.1)',
    borderWidth: 1.5,
    borderColor: 'rgba(244, 197, 66, 0.3)',
    flex: 1,
  },
  chargeButtonLoading: {
    opacity: 0.6,
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
  deleteButton: {
    backgroundColor: '#D32F2F',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 36,
    flexDirection: 'row',
  },
  deleteButtonLoading: {
    opacity: 0.7,
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  deleteModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    justifyContent: 'center',
  },
  deleteModalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#D32F2F',
    marginLeft: 8,
  },
  deleteModalSubtitle: {
    fontSize: 14,
    color: Colors.normalText,
    marginBottom: 12,
    textAlign: 'center',
  },
  deleteSnapshotInfo: {
    backgroundColor: 'rgba(211, 47, 47, 0.08)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#D32F2F',
  },
  deleteInfoLabel: {
    fontSize: 12,
    color: Colors.menuText,
    marginTop: 8,
    marginBottom: 4,
  },
  deleteInfoValue: {
    fontSize: 14,
    color: Colors.normalText,
    fontWeight: '600',
  },
  deleteWarning: {
    backgroundColor: 'rgba(255, 152, 0, 0.1)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#FF9800',
    flexDirection: 'row',
    alignItems: 'center',
  },
  deleteWarningText: {
    flex: 1,
    fontSize: 13,
    color: Colors.normalText,
  },
  deleteConfirmLabel: {
    fontSize: 13,
    color: Colors.menuText,
    marginBottom: 8,
    fontWeight: '600',
  },
  deleteConfirmInput: {
    backgroundColor: Colors.Border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: Colors.normalText,
    fontSize: 14,
    textAlign: 'center',
    letterSpacing: 2,
    fontWeight: '600',
    marginBottom: 12,
  },
  deleteConfirmButton: {
    backgroundColor: '#D32F2F',
  },
  deleteConfirmButtonText: {
    color: Colors.Background,
    fontWeight: '700',
  },
  serviceDetailCard: {
    backgroundColor: Colors.Border,
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 12,
    marginVertical: 8,
    borderLeftWidth: 4,
    borderLeftColor: Colors.activeMenuText,
  },
  detailLabel: {
    fontSize: 12,
    color: Colors.menuText,
    fontWeight: '600',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 14,
    color: Colors.normalText,
    fontWeight: '500',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.Border,
  },
  closeButton: {
    fontSize: 32,
    color: Colors.menuText,
    fontWeight: '300',
  },
  closeModalButton: {
    backgroundColor: Colors.activeMenuText,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    marginHorizontal: 12,
    marginBottom: 12,
    alignItems: 'center',
  },
  closeModalButtonText: {
    color: Colors.Background,
    fontWeight: '700',
    fontSize: 14,
  },
  notificationContainer: {
    position: 'absolute',
    top: 50,
    left: 16,
    right: 16,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 14,
    elevation: 12,
    zIndex: 1000,
  },
  notificationSuccess: {
    backgroundColor: '#10B981',
    borderLeftWidth: 6,
    borderLeftColor: '#059669',
  },
  notificationError: {
    backgroundColor: '#EF4444',
    borderLeftWidth: 6,
    borderLeftColor: '#DC2626',
  },
  notificationContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  notificationIconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  notificationTextWrapper: {
    flex: 1,
    marginRight: 10,
  },
  notificationText: {
    color: '#fff',
    fontSize: 13.5,
    fontWeight: '600',
    lineHeight: 19,
    letterSpacing: 0.35,
  },
  notificationCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});