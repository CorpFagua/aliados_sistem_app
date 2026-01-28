import React, { useState, useCallback, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { Colors } from "@/constans/colors";
import { useAuth } from "@/providers/AuthProvider";
import { getPendingTransfers, getAllTransfers, respondToTransfer } from "@/services/transfers";
import TransferNotificationCard from "../components/TransferNotificationCard";

interface TransferNotification {
  id: string;
  service_id: string;
  from_delivery_id: string;
  to_delivery_id: string;
  from_delivery_name: string;
  to_delivery_name: string;
  service_destination: string;
  store_name: string;
  status: "pending" | "accepted" | "rejected";
  type: "request_received" | "request_sent" | "accepted" | "rejected";
  created_at: string;
  viewed: boolean;
}

export default function NotificationsScreen() {
  const { session, profile } = useAuth();
  const [notifications, setNotifications] = useState<TransferNotification[]>(
    []
  );
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<"inbox" | "history">("inbox");

  // Cargar notificaciones cuando la pantalla se enfoca
  useFocusEffect(
    useCallback(() => {
      loadNotifications();
    }, [])
  );

  const loadNotifications = async () => {
    try {
      setLoading(true);
      // Obtener todas las transferencias (pendientes + historial)
      const transfers = await getAllTransfers(session?.access_token || "");

      // Transformar transfers a notificaciones
      const notifs: TransferNotification[] = (transfers || []).map((t: any) => ({
        id: t.id,
        service_id: t.service_id,
        from_delivery_id: t.from_delivery_id,
        to_delivery_id: t.to_delivery_id,
        from_delivery_name: t.from_delivery_name || "Compañero",
        to_delivery_name: t.to_delivery_name || "Tú",
        service_destination: t.service_destination || "Destino",
        store_name: t.store_name || "Tienda",
        status: t.status,
        type:
          t.to_delivery_id === profile.id
            ? "request_received"
            : "request_sent",
        created_at: t.created_at,
        viewed: t.viewed || false,
      }));

      setNotifications(notifs);
    } catch (err) {
      console.error("Error loading notifications:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadNotifications();
  };

  // Filtrar notificaciones
  const inbox = notifications.filter(
    (n) => n.type === "request_received" && n.status === "pending" && !n.viewed
  );
  const history = notifications;

  const displayData = activeTab === "inbox" ? inbox : history;

  const handleAccept = async (notificationId: string) => {
    try {
      setLoading(true);
      await respondToTransfer(
        notificationId,
        "accept",
        session?.access_token || ""
      );
      Alert.alert("Éxito", "Solicitud aceptada");
      loadNotifications();
    } catch (err) {
      Alert.alert("Error", "No se pudo aceptar la solicitud");
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async (notificationId: string) => {
    try {
      setLoading(true);
      await respondToTransfer(
        notificationId,
        "reject",
        session?.access_token || "",
        "No tengo disponibilidad en este momento"
      );
      Alert.alert("Éxito", "Solicitud rechazada");
      loadNotifications();
    } catch (err) {
      Alert.alert("Error", "No se pudo rechazar la solicitud");
    } finally {
      setLoading(false);
    }
  };

  const renderNotificationCard = ({ item }: { item: TransferNotification }) => (
    <TransferNotificationCard
      notification={item}
      currentDeliveryId={profile.id}
      onAccept={() => handleAccept(item.id)}
      onReject={() => handleReject(item.id)}
    />
  );

  return (
    <SafeAreaView edges={["top"]} style={styles.safeArea}>
      <View style={styles.container}>
        {/* Tab Navigation */}
        <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "inbox" && styles.activeTab]}
          onPress={() => setActiveTab("inbox")}
        >
          <Ionicons
            name="mail-outline"
            size={20}
            color={activeTab === "inbox" ? Colors.gradientStart : Colors.menuText}
          />
          <Text
            style={[
              styles.tabText,
              activeTab === "inbox" && styles.activeTabText,
            ]}
          >
            Bandeja ({inbox.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === "history" && styles.activeTab]}
          onPress={() => setActiveTab("history")}
        >
          <Ionicons
            name="time-outline"
            size={20}
            color={activeTab === "history" ? Colors.gradientStart : Colors.menuText}
          />
          <Text
            style={[
              styles.tabText,
              activeTab === "history" && styles.activeTabText,
            ]}
          >
            Historial
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      {loading && !notifications.length ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.gradientStart} />
        </View>
      ) : (
        <FlatList
          data={displayData}
          keyExtractor={(item) => item.id}
          renderItem={renderNotificationCard}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons
                name="mail-open-outline"
                size={48}
                color={Colors.menuText}
              />
              <Text style={styles.emptyText}>
                {activeTab === "inbox"
                  ? "Sin solicitudes nuevas"
                  : "Sin historial"}
              </Text>
            </View>
          }
          contentContainerStyle={styles.listContent}
        />
      )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.Background,
  },
  container: {
    flex: 1,
    backgroundColor: Colors.Background,
  },
  tabs: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderColor: Colors.Border,
    paddingHorizontal: 16,
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  activeTab: {
    borderBottomColor: Colors.gradientStart,
  },
  tabText: {
    fontSize: 13,
    color: Colors.menuText,
    fontWeight: "500",
  },
  activeTabText: {
    color: Colors.gradientStart,
    fontWeight: "700",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  listContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  card: {
    backgroundColor: Colors.activeMenuBackground,
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.Border,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  headerInfo: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.normalText,
  },
  cardSubtitle: {
    fontSize: 12,
    color: Colors.menuText,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#fff",
  },
  cardActions: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 12,
  },
  rejectBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#FF3B30",
  },
  rejectText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#FF3B30",
  },
  acceptBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: "#4CAF50",
  },
  acceptText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#fff",
  },
  timestamp: {
    fontSize: 11,
    color: Colors.menuText,
  },
  empty: {
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.menuText,
    marginTop: 12,
  },
});

