import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, FlatList, TouchableOpacity, RefreshControl, Modal, TextInput, Alert } from 'react-native';
import { useAuth } from '../../../../providers/AuthProvider';
import { fetchServices, updateServiceData } from '../../../../services/services';
import { formatCurrency } from '../../../../services/payments';
import { Colors } from '../../../../constans/colors';
import { Ionicons } from '@expo/vector-icons';
import { RouteProp, useRoute, useNavigation } from '@react-navigation/native';

type Params = {
  StorePaymentSummary: {
    storeId: string;
    storeName?: string;
  };
};

export default function StorePaymentSummaryScreen({ store, onClose }: { store?: any; onClose?: ()=>void }){
  const route = useRoute<RouteProp<Params,'StorePaymentSummary'>>();
  const navigation = useNavigation();
  const { session } = useAuth();
  const routeParams = (route && (route.params as any)) || {};
  const storeId = store?.id ?? routeParams.storeId;
  const storeName = store?.name ?? routeParams.storeName;

  const [loading, setLoading] = useState(false);
  const [unpaid, setUnpaid] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
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

  useEffect(()=>{ load(); },[session, storeId]);

  async function load(){
    if (!session?.access_token || !storeId) return;
    setLoading(true);
    try{
      const all = await fetchServices(session.access_token);
      const sUnpaid = all.filter((s)=> (s.storeId === storeId || s.profileStoreId === storeId) && !s.isPaid);
      const sAll = all.filter((s)=> (s.storeId === storeId || s.profileStoreId === storeId));
      setUnpaid(sUnpaid);
      setHistory(sAll);
    }catch(e){
      setUnpaid([]); setHistory([]);
    }finally{ setLoading(false); setRefreshing(false); }
  }

  function totalSelectedAmount(){
    return selectedIds.reduce((s,id)=>{
      const it = unpaid.find(u=>u.id===id);
      return s + (it ? (it.price ?? it.amount ?? 0) : 0);
    },0);
  }

  async function handleConfirmPayment(){
    if (!session?.access_token) return Alert.alert('Error','No hay sesión');
    if (selectedIds.length === 0) return Alert.alert('Selecciona viajes', 'Debes seleccionar al menos un servicio para generar el pago.');
    setProcessingPayment(true);
    try{
      await Promise.all(selectedIds.map((id)=> updateServiceData(id, { isPaid: true }, session.access_token)));
      Alert.alert('Éxito','Se marcaron los servicios como pagados');
      setShowPayModal(false);
      setSelectedIds([]);
      setSelectAll(false);
      await load();
    }catch(e){
      console.error(e);
      Alert.alert('Error','No se pudo procesar el pago');
    }finally{ setProcessingPayment(false); }
  }

  if (loading) return <View style={{flex:1, justifyContent:'center', alignItems:'center'}}><ActivityIndicator color={Colors.activeMenuText} /></View>;

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

  const handleSelectAll = () => {
    if (selectAll){ setSelectedIds([]); setSelectAll(false); }
    else { setSelectedIds(unpaid.map(s=>s.id)); setSelectAll(true); }
  };

  return (
    <View style={styles.container}>
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
          <Text style={[styles.tabText, activeTab==='due' && styles.tabTextActive]}>Por pagar</Text>
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
              <Text style={{color:Colors.activeMenuText, fontWeight:'bold'}}>Pagar seleccionado</Text>
            </TouchableOpacity>
          </View>

          <FlatList
            data={applyDateFilter(unpaid)}
            renderItem={renderService}
            keyExtractor={i=>i.id}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={()=>{ setRefreshing(true); load(); }} />}
            contentContainerStyle={{ paddingTop: 8, paddingBottom: 20 }}
            ListEmptyComponent={<Text style={styles.emptyStateText}>No hay servicios pendientes.</Text>}
          />

          <View style={styles.footerRow}>
            <Text style={{color:Colors.menuText}}>Total seleccionado:</Text>
            <Text style={{color:Colors.activeMenuText, fontWeight:'bold'}}>{formatCurrency(totalSelectedAmount())}</Text>
          </View>
        </>
      ) : (
        <FlatList
          data={applyDateFilter(history)}
          renderItem={renderService}
          keyExtractor={i=>i.id}
          contentContainerStyle={{ paddingTop: 8, paddingBottom: 20 }}
          ListEmptyComponent={<Text style={styles.emptyStateText}>No hay historial de servicios.</Text>}
        />
      )}

      <Modal visible={showPayModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Generar pago</Text>
            <Text style={styles.modalSubtitle}>Total: {formatCurrency(totalSelectedAmount())}</Text>

            <Text style={styles.label}>Método</Text>
            <View style={{flexDirection:'row', gap:8, marginBottom:12}}>
              {( ['efectivo','transferencia','cheque','otro'] as any).map((m:any)=>(
                <TouchableOpacity key={m} onPress={()=>setPaymentMethod(m)} style={[styles.methodBtn, paymentMethod===m && styles.methodBtnActive]}>
                  <Text style={{color: paymentMethod===m ? Colors.Background : Colors.menuText}}>{m}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TextInput placeholder="Referencia (opcional)" style={styles.input} value={reference} onChangeText={setReference} placeholderTextColor={Colors.menuText} />

            <View style={{flexDirection:'row', gap:12}}>
              <TouchableOpacity style={[styles.modalButton, styles.cancelButton]} onPress={()=>setShowPayModal(false)}>
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalButton, styles.confirmButton]} onPress={handleConfirmPayment}>
                {processingPayment ? <ActivityIndicator color={Colors.Background} /> : <Text style={styles.confirmButtonText}>Confirmar pago</Text>}
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
});
