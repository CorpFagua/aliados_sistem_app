import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ActivityIndicator, FlatList, RefreshControl } from "react-native";
import { Colors } from "../../../../constans/colors";
import { useAuth } from "../../../../providers/AuthProvider";
import { fetchDeliveryServices, updateServiceData } from "../../../../services/services";
import { formatCurrency } from "../../../../services/payments";
import { TextInput, TouchableOpacity, Modal, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { usePayments } from "../../../../hooks/usePayments";


export default function DeliveryPaymentSummaryScreen({ delivery }) {
  const { session } = useAuth();
  const { coordinatorPayServices } = usePayments(session?.access_token || null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [unpaid, setUnpaid] = useState([]);
  const [history, setHistory] = useState([]);
  const [activeTab, setActiveTab] = useState<"due" | "history">("due");
  const [startDate, setStartDate] = useState(""); // YYYY-MM-DD
  const [endDate, setEndDate] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  const [showPayModal, setShowPayModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"efectivo" | "transferencia" | "cheque" | "otro">("efectivo");
  const [reference, setReference] = useState("");
  const [showCalendar, setShowCalendar] = useState<null | { field: "start" | "end" }>(null);
  const [calendarMonth, setCalendarMonth] = useState(() => new Date());
  const [processing, setProcessing] = useState(false);

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
        s => s.assignedDelivery === delivery.id && s.status === "entregado" && !s.isPaid
      );
      const historyData = allServices.filter(
        s => s.assignedDelivery === delivery.id
      );
      setUnpaid(unpaidData);
      setHistory(historyData);
    } catch (err) {
      console.error("❌ Error cargando datos:", err);
      setUnpaid([]);
      setHistory([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const renderService = ({ item }) => (
    <View style={styles.serviceCardRow}>
      <TouchableOpacity
        onPress={() => {
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
          style={{ marginRight: 12 }}
        />
      </TouchableOpacity>
      <View style={{ flex: 1 }}>
        <Text style={styles.serviceTitle}>Viaje #{item.id.slice(-4)}</Text>
        <Text style={styles.serviceDetail}>Estado: {item.status}</Text>
        <Text style={styles.serviceDetail}>Valor: {formatCurrency(item.priceDeliverySrv || 0)}</Text>
      </View>
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
    return list.filter((s) => {
      const dt = s.completedAt ? new Date(s.completedAt) : new Date(s.createdAt);
      if (sd && dt < sd) return false;
      if (ed) {
        const edEnd = new Date(ed);
        edEnd.setHours(23, 59, 59, 999);
        if (dt > edEnd) return false;
      }
      return true;
    });
  };

  const totalSelectedAmount = () => {
    const list = unpaid.filter((s) => selectedIds.includes(s.id));
    return list.reduce((sum, s) => sum + (s.priceDeliverySrv || 0), 0);
  };

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedIds([]);
      setSelectAll(false);
    } else {
      setSelectedIds(unpaid.map((s) => s.id));
      setSelectAll(true);
    }
  };

  const handleConfirmPayment = async () => {
    if (!session?.access_token) return Alert.alert("Error", "No hay sesión");
    if (selectedIds.length === 0) return Alert.alert("Selecciona viajes", "Debes seleccionar al menos un viaje para generar el pago.");
    
    setProcessing(true);
    try {
      console.log('\n🟦 [COORDINATOR] === handleConfirmPayment ===');
      console.log(`📦 Service IDs: ${JSON.stringify(selectedIds)}`);
      console.log(`💳 Método: ${paymentMethod}`);
      console.log(`📌 Referencia: ${reference}`);

      // Usar la nueva función que crea snapshot + marca como pagado
      const result = await coordinatorPayServices(selectedIds, delivery.id);

      if (!result) {
        throw new Error('No se pudo procesar el pago');
      }

      console.log(`✅ Pago procesado exitosamente`);
      
      Alert.alert(
        "Éxito", 
        `Se generó la factura #${result.snapshot.id.slice(-8)} y se marcaron ${selectedIds.length} viaje${selectedIds.length !== 1 ? 's' : ''} como pagados`
      );
      
      setShowPayModal(false);
      setSelectedIds([]);
      setSelectAll(false);
      setReference("");
      loadData();
    } catch (err: any) {
      console.error('❌ Error:', err);
      Alert.alert("Error", err.message || "No se pudo procesar el pago");
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
              data={applyDateFilter(history)}
              renderItem={renderService}
              keyExtractor={item => item.id}
              ListEmptyComponent={<Text style={styles.emptyText}>No hay historial de viajes.</Text>}
            />
          )}
        </>
      )}

      {/* Modal pago simple */}
      <Modal visible={showPayModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Generar pago</Text>
            <Text style={styles.modalSubtitle}>Total: {formatCurrency(totalSelectedAmount())}</Text>

            <Text style={styles.label}>Método</Text>
            <View style={{ flexDirection: "row", gap: 8, marginBottom: 12 }}>
              {(["efectivo", "transferencia", "cheque", "otro"] as any).map((m: any) => (
                <TouchableOpacity key={m} onPress={() => setPaymentMethod(m)} style={[styles.methodBtn, paymentMethod === m && styles.methodBtnActive]}>
                  <Text style={{ color: paymentMethod === m ? "white" : Colors.menuText }}>{m}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TextInput placeholder="Referencia (opcional)" style={styles.input} value={reference} onChangeText={setReference} placeholderTextColor={Colors.menuText} />

            <View style={{ flexDirection: "row", gap: 12 }}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]} 
                onPress={() => setShowPayModal(false)}
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

            {/* Weekday labels */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
              {['D', 'L', 'M', 'M', 'J', 'V', 'S'].map((w) => (
                <Text key={w} style={{ width: 36, textAlign: 'center', color: Colors.menuText, fontWeight: '600' }}>{w}</Text>
              ))}
            </View>

            {/* Days grid */}
            <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
              {(() => {
                const first = startOfMonth(calendarMonth);
                const lead = first.getDay(); // 0 (Sun) - 6
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
});
