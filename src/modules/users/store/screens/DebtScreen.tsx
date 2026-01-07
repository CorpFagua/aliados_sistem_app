import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StyleSheet,
  FlatList,
  RefreshControl,
} from "react-native";
import { useAuth } from "../../../../providers/AuthProvider";
import { usePayments } from "../../../../hooks/usePayments";
import { Colors } from "../../../../constans/colors";

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
  }).format(amount);
};

/**
 * StoreDebtScreen - Pantalla de deuda de la tienda
 */
export default function StoreDebtScreen() {
  const { session } = useAuth();
  const {
    getStorePaymentRecords,
    getStoreDebt,
    loading,
  } = usePayments(session?.access_token || null);

  const [records, setRecords] = useState<any[]>([]);
  const [totalDebt, setTotalDebt] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadData();
  }, [session]);

  const loadData = async () => {
    if (!session?.access_token) return;

    setRefreshing(true);
    try {
      const [recordsData, debtData] = await Promise.all([
        getStorePaymentRecords({ limit: 100 }),
        getStoreDebt(),
      ]);
      setRecords(Array.isArray(recordsData) ? recordsData : []);
      setTotalDebt(typeof debtData === 'number' ? debtData : 0);
    } catch (err) {
      Alert.alert("Error", "No se pudieron cargar los datos");
      setRecords([]);
      setTotalDebt(0);
    } finally {
      setRefreshing(false);
    }
  };

  const renderRecordItem = ({ item }: { item: any }) => (
    <View style={styles.recordCard}>
      <View style={styles.recordHeader}>
        <View>
          <Text style={styles.period}>{item.period}</Text>
          <Text style={styles.description}>Período de servicios</Text>
        </View>
        <View
          style={[
            styles.statusBadge,
            {
              backgroundColor:
                item.status === "paid"
                  ? Colors.success
                  : item.status === "partial"
                  ? Colors.warning
                  : Colors.error,
            },
          ]}
        >
          <Text style={styles.statusText}>
            {item.status === "paid"
              ? "Pagado"
              : item.status === "partial"
              ? "Parcial"
              : "Pendiente"}
          </Text>
        </View>
      </View>

      <View style={styles.recordBody}>
        <View style={styles.amountRow}>
          <Text style={styles.label}>Cobrado:</Text>
          <Text style={styles.amount}>{formatCurrency(item.total_charged)}</Text>
        </View>

        <View style={styles.amountRow}>
          <Text style={styles.label}>Pagado:</Text>
          <Text style={styles.amount}>{formatCurrency(item.total_paid)}</Text>
        </View>

        <View style={[styles.amountRow, styles.pendingRow]}>
          <Text style={styles.label}>Pendiente:</Text>
          <Text style={styles.pendingAmount}>
            {formatCurrency(item.total_pending)}
          </Text>
        </View>
      </View>
    </View>
  );

  if (loading && records.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.activeMenuText} />
        <Text style={styles.loadingText}>Cargando información...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadData} />}
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Mi Deuda</Text>
        <Text style={styles.headerSubtitle}>Registro de cobros a la tienda</Text>
      </View>

      {/* Resumen */}
      <View style={styles.summaryCard}>
        <Text style={styles.summaryLabel}>Deuda Total</Text>
        <Text style={styles.summaryValue}>{formatCurrency(totalDebt)}</Text>
        <Text style={styles.summaryDescription}>
          Por cobros de servicios pendientes de pago
        </Text>
      </View>

      {/* Info */}
      <View style={styles.infoBox}>
        <Text style={styles.infoTitle}>ℹ️ Sobre tu deuda</Text>
        <Text style={styles.infoText}>
          • Se genera una deuda por cada servicio entregado{"\n"}
          • El coordinador registra los cobros{"\n"}
          • Debes pagar antes de que venza el período{"\n"}
          • Consulta con el coordinador sobre formas de pago
        </Text>
      </View>

      {/* Registros */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Registro de Cobros</Text>

        {records.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateIcon}>✓</Text>
            <Text style={styles.emptyStateTitle}>Sin deudas</Text>
            <Text style={styles.emptyStateText}>
              No hay deudas registradas. ¡Excelente!
            </Text>
          </View>
        ) : (
          <View style={styles.listContainer}>
            {records.map((item, index) => (
              <View key={item.id || index}>
                {renderRecordItem({ item })}
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Aviso */}
      {totalDebt > 0 && (
        <View style={styles.warningBox}>
          <Text style={styles.warningTitle}>⚠️ Acción Requerida</Text>
          <Text style={styles.warningText}>
            Tienes una deuda de {formatCurrency(totalDebt)}. Por favor, contacta
            al coordinador para acordar las formas y fechas de pago.
          </Text>
          <TouchableOpacity style={styles.contactButton}>
            <Text style={styles.contactButtonText}>📞 Contactar Coordinador</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
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
  summaryCard: {
    backgroundColor: Colors.activeMenuBackground,
    marginHorizontal: 16,
    marginTop: 16,
    paddingVertical: 20,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: Colors.error,
  },
  summaryLabel: {
    fontSize: 12,
    color: Colors.menuText,
    marginBottom: 8,
  },
  summaryValue: {
    fontSize: 28,
    fontWeight: "bold",
    color: Colors.error,
    marginBottom: 4,
  },
  summaryDescription: {
    fontSize: 11,
    color: Colors.menuText,
  },
  infoBox: {
    backgroundColor: "rgba(0, 255, 117, 0.1)",
    marginHorizontal: 16,
    marginTop: 16,
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
  section: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: Colors.normalText,
    marginBottom: 12,
  },
  listContainer: {
    gap: 10,
  },
  recordCard: {
    backgroundColor: Colors.activeMenuBackground,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: Colors.warning,
  },
  recordHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  period: {
    fontSize: 14,
    fontWeight: "bold",
    color: Colors.normalText,
  },
  description: {
    fontSize: 11,
    color: Colors.menuText,
    marginTop: 2,
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
    gap: 8,
  },
  amountRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  pendingRow: {
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.Border,
  },
  label: {
    fontSize: 12,
    color: Colors.menuText,
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
  emptyState: {
    paddingVertical: 40,
    alignItems: "center",
  },
  emptyStateIcon: {
    fontSize: 40,
    marginBottom: 12,
  },
  emptyStateTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: Colors.normalText,
    marginBottom: 4,
  },
  emptyStateText: {
    fontSize: 12,
    color: Colors.menuText,
  },
  warningBox: {
    backgroundColor: "rgba(244, 67, 54, 0.1)",
    marginHorizontal: 16,
    marginVertical: 16,
    padding: 16,
    borderRadius: 8,
  },
  warningTitle: {
    fontSize: 13,
    fontWeight: "bold",
    color: Colors.error,
    marginBottom: 8,
  },
  warningText: {
    fontSize: 12,
    color: Colors.error,
    lineHeight: 18,
    marginBottom: 12,
  },
  contactButton: {
    backgroundColor: Colors.error,
    paddingVertical: 10,
    borderRadius: 6,
    alignItems: "center",
  },
  contactButtonText: {
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
  },
});
