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

const getStatusLabel = (status: string): string => {
  const labels: Record<string, string> = {
    pending: "Pendiente",
    approved: "Aprobado",
    paid: "Pagado",
    rejected: "Rechazado",
  };
  return labels[status] || status;
};

const getStatusColor = (status: string): string => {
  const colors: Record<string, string> = {
    pending: "#FFA500",
    approved: "#4CAF50",
    paid: "#2196F3",
    rejected: "#F44336",
  };
  return colors[status] || "#999";
};

/**
 * DeliveryRequestsScreen - Pantalla de solicitudes de corte del domiciliario
 */
export default function DeliveryRequestsScreen() {
  const { session } = useAuth();
  const { getPaymentRequests, loading } = usePayments(session?.access_token || null);

  const [requests, setRequests] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadRequests();
  }, [session]);

  const loadRequests = async () => {
    if (!session?.access_token) return;

    setRefreshing(true);
    try {
      const data = await getPaymentRequests();
      setRequests(data);
    } catch (err) {
      Alert.alert("Error", "No se pudieron cargar las solicitudes");
    } finally {
      setRefreshing(false);
    }
  };

  const renderRequestItem = ({ item }: { item: any }) => (
    <TouchableOpacity style={styles.requestCard}>
      <View style={styles.requestHeader}>
        <Text style={styles.requestDate}>
          {new Date(item.requested_at).toLocaleDateString("es-CO")}
        </Text>
        <View
          style={[
            styles.requestStatus,
            { backgroundColor: getStatusColor(item.status) },
          ]}
        >
          <Text style={styles.statusText}>{getStatusLabel(item.status)}</Text>
        </View>
      </View>

      <View style={styles.requestContent}>
        <Text style={styles.requestAmount}>{formatCurrency(item.amount)}</Text>
        <Text style={styles.requestDescription}>
          Solicitud de corte -{" "}
          {item.notes && <Text style={styles.notes}>"{item.notes}"</Text>}
        </Text>
      </View>

      <View style={styles.requestFooter}>
        {item.status === "approved" && !item.paid_at && (
          <Text style={styles.approvedInfo}>✓ Aprobado por coordinador</Text>
        )}
        {item.status === "paid" && (
          <Text style={styles.paidInfo}>✓ Pagado el {new Date(item.paid_at).toLocaleDateString("es-CO")}</Text>
        )}
        {item.status === "rejected" && (
          <Text style={styles.rejectedInfo}>✗ Rechazado - {item.coordinator_notes}</Text>
        )}
      </View>
    </TouchableOpacity>
  );

  if (loading && requests.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.activeMenuText} />
        <Text style={styles.loadingText}>Cargando solicitudes...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Mis Solicitudes</Text>
        <Text style={styles.headerSubtitle}>Historial de cortes solicitados</Text>
      </View>

      {requests.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateIcon}>📋</Text>
          <Text style={styles.emptyStateTitle}>Sin solicitudes</Text>
          <Text style={styles.emptyStateText}>
            Aún no has solicitado ningún corte de ganancias
          </Text>
        </View>
      ) : (
        <FlatList
          data={requests}
          renderItem={renderRequestItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadRequests} />}
        />
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
  listContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  requestCard: {
    backgroundColor: Colors.activeMenuBackground,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: Colors.activeMenuText,
  },
  requestHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  requestDate: {
    fontSize: 12,
    color: Colors.menuText,
  },
  requestStatus: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    color: "white",
    fontSize: 10,
    fontWeight: "bold",
  },
  requestContent: {
    marginBottom: 12,
  },
  requestAmount: {
    fontSize: 18,
    fontWeight: "bold",
    color: Colors.activeMenuText,
    marginBottom: 4,
  },
  requestDescription: {
    fontSize: 13,
    color: Colors.normalText,
  },
  notes: {
    color: Colors.menuText,
    fontStyle: "italic",
  },
  requestFooter: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.Border,
  },
  approvedInfo: {
    fontSize: 12,
    color: Colors.success,
  },
  paidInfo: {
    fontSize: 12,
    color: Colors.success,
  },
  rejectedInfo: {
    fontSize: 12,
    color: Colors.error,
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
});
