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
} from "react-native";
import { useAuth } from "../../../../providers/AuthProvider";
import { usePayments } from "../../../../hooks/usePayments";
import {
  getNextCutDate,
  getCurrentCutType,
} from "../../../../models/payment";
import { Colors } from "../../../../constans/colors";

// Funciones auxiliares
const formatCurrency = (amount: number): string => {
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
  const { getDeliveryEarnings, loading } = usePayments(session?.access_token || null);

  const [earnings, setEarnings] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadEarnings();
  }, [session]);

  const loadEarnings = async () => {
    if (!session?.access_token) return;

    setRefreshing(true);
    try {
      const data = await getDeliveryEarnings();
      if (data) {
        setEarnings(data);
      }
    } catch (err) {
      Alert.alert("Error", "No se pudieron cargar las ganancias");
    } finally {
      setRefreshing(false);
    }
  };

  if (loading || !earnings) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.activeMenuText} />
        <Text style={styles.loadingText}>Cargando ganancias...</Text>
      </View>
    );
  }

  const cutType = getCurrentCutType();
  const nextCut = cutType === "quincena_1" ? "15" : "1";
  const canRequestCut = new Date().getDate() >= (cutType === "quincena_1" ? 15 : 1);

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadEarnings} />}
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
        style={[styles.button, !canRequestCut && styles.buttonDisabled]}
        disabled={!canRequestCut}
        onPress={() => Alert.alert("Solicitar Corte", "Serás dirigido a solicitudes")}
      >
        <Text style={styles.buttonText}>
          {canRequestCut ? "Solicitar Corte" : "No disponible aún"}
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
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    borderRadius: 12,
  },
  cardHeader: {
    marginBottom: 8,
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
  statsGrid: {
    marginHorizontal: 16,
    marginTop: 16,
    gap: 12,
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
    marginHorizontal: 16,
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
});
