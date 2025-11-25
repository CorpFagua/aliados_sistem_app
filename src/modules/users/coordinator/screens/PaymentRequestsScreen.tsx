
import React, { useEffect, useState } from "react";
import { View, Text, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator, RefreshControl } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "../../../../constans/colors";
import { fetchDeliveries } from "../../../../services/users";
import { useAuth } from "../../../../providers/AuthProvider";
import { useNavigation } from "@react-navigation/native";
import DeliveryPaymentSummaryScreen from "./DeliveryPaymentSummaryScreen";

export default function CoordinatorPaymentRequestsScreen() {
  const { session } = useAuth();
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadDeliveries();
  }, [session]);

  const loadDeliveries = async () => {
    if (!session?.access_token) return;
    setLoading(true);
    try {
      const data = await fetchDeliveries(session.access_token);
      setDeliveries(data);
    } catch (err) {
      setDeliveries([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const navigation = useNavigation();
    const [selectedDelivery, setSelectedDelivery] = useState(null);
  const renderDeliveryCard = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.9}
      onPress={() => setSelectedDelivery(item)}
    >
      <View style={styles.cardHeader}>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <Ionicons name="person-circle" size={38} color={item.isActive ? Colors.activeMenuText : Colors.menuText} style={{ marginRight: 10 }} />
          <View>
            <Text style={styles.name}>{item.name}</Text>
            <Text style={styles.phone}>{item.phone || "Sin teléfono"}</Text>
          </View>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: item.isActive ? Colors.success : Colors.error }] }>
          <Text style={styles.statusText}>{item.isActive ? "Activo" : "Inactivo"}</Text>
        </View>
      </View>
      <View style={styles.cardBody}>
        <Text style={styles.label}>Registrado:</Text>
        <Text style={styles.value}>{item.createdAt ? new Date(item.createdAt).toLocaleDateString("es-CO") : "-"}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {selectedDelivery ? (
        <>
          <TouchableOpacity onPress={() => setSelectedDelivery(null)} style={styles.backButton}>
            <Ionicons name="arrow-back" size={20} color={Colors.activeMenuText} />
            <Text style={styles.backButtonText}>Volver a la lista</Text>
          </TouchableOpacity>
          <DeliveryPaymentSummaryScreen delivery={selectedDelivery} />
        </>
      ) : (
        <>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Domiciliarios</Text>
            <Text style={styles.headerSubtitle}>Total: {deliveries.length}</Text>
          </View>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={Colors.activeMenuText} />
              <Text style={styles.loadingText}>Cargando domiciliarios...</Text>
            </View>
          ) : (
            <FlatList
              data={deliveries}
              renderItem={renderDeliveryCard}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.listContent}
              refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadDeliveries(); }} />}
              ListEmptyComponent={
                <View style={styles.emptyState}>
                  <Ionicons name="checkmark-circle-outline" size={48} color={Colors.success} />
                  <Text style={styles.emptyStateTitle}>No hay domiciliarios</Text>
                  <Text style={styles.emptyStateText}>Aún no tienes domiciliarios registrados.</Text>
                </View>
              }
            />
          )}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.Background,
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
  card: {
    backgroundColor: Colors.activeMenuBackground,
    borderRadius: 14,
    padding: 18,
    marginBottom: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  name: {
    fontSize: 16,
    fontWeight: "bold",
    color: Colors.normalText,
  },
  phone: {
    fontSize: 13,
    color: Colors.menuText,
    marginTop: 2,
  },
  statusBadge: {
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 4,
    alignSelf: "flex-start",
  },
  statusText: {
    color: Colors.Background,
    fontSize: 12,
    fontWeight: "bold",
  },
  cardBody: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
  },
  label: {
    fontSize: 12,
    color: Colors.menuText,
    marginRight: 8,
  },
  value: {
    fontSize: 13,
    color: Colors.normalText,
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
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingBottom: 100,
  },
  emptyStateTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: Colors.normalText,
    marginTop: 8,
    marginBottom: 4,
  },
  emptyStateText: {
    fontSize: 13,
    color: Colors.menuText,
    textAlign: "center",
    paddingHorizontal: 32,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginBottom: 16,
    borderRadius: 8,
    backgroundColor: 'transparent',
  },
  backButtonText: {
    color: Colors.activeMenuText,
    fontWeight: 'bold',
    marginLeft: 8,
  },
});
