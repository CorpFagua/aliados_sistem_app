import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { Colors } from "@/constans/colors";
import { useAnalytics } from "../hooks/useAnalytics";
import AnalyticsSummaryBox from "../components/AnalyticsSummaryBox";
import AnalyticsDateRangeSelector from "../components/AnalyticsDateRangeSelector";
import DeliveryPersonList from "../components/DeliveryPersonList";
import StoreList from "../components/StoreList";
import ProfitSummary from "../components/ProfitSummary";
import AnalyticsDetailedTable from "../components/AnalyticsDetailedTable";
import { getTodayLocalFormat } from "@/utils/dateTime";

export default function AnalyticsScreen() {
  const { data, loading, error, fetchData } = useAnalytics();
  const [startDate, setStartDate] = useState(getTodayLocalFormat());
  const [endDate, setEndDate] = useState(getTodayLocalFormat());

  // Cargar datos iniciales
  useEffect(() => {
    fetchData({ startDate, endDate });
  }, []);

  const handleDateRangeChange = (start: string, end: string) => {
    setStartDate(start);
    setEndDate(end);
    fetchData({ startDate: start, endDate: end });
  };

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Dashboard de Análisis</Text>
        <Text style={styles.subtitle}>Resumen de Servicios por Período</Text>
      </View>

      {/* Date Range Selector */}
      <AnalyticsDateRangeSelector
        startDate={startDate}
        endDate={endDate}
        onDateRangeChange={handleDateRangeChange}
      />

      {/* Loading State */}
      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.activeMenuText} />
          <Text style={styles.loadingText}>Cargando análisis...</Text>
        </View>
      )}

      {/* Error State */}
      {error && !loading && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Error: {error}</Text>
        </View>
      )}

      {/* Data Display */}
      {data && !loading && (
        <>
          {/* Cantidad Total de Servicios */}
          <AnalyticsSummaryBox totalServices={data.summary.totalDeliveries} />

          {/* Lista de Domiciliarios */}
          {data.deliveryPersonStats.length > 0 && (
            <DeliveryPersonList deliveryStats={data.deliveryPersonStats} />
          )}

          {/* Lista de Tiendas */}
          {data.storeStats.length > 0 && (
            <StoreList storeStats={data.storeStats} />
          )}

          {/* Resumen de Ganancias */}
          <ProfitSummary
            totalEarnings={data.summary.totalEarnings}
            totalOwed={data.summary.totalOwed}
            netProfit={data.summary.netProfit}
          />

          {/* Tabla Detallada */}
          <AnalyticsDetailedTable
            services={data.detailedServices}
            onDownload={(services) => {
              console.log("Downloaded:", services.length, "services");
            }}
          />
        </>
      )}

      {/* Empty State */}
      {!loading && !error && data?.summary.totalDeliveries === 0 && (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>
            No hay servicios completados en este período
          </Text>
        </View>
      )}

      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.Background,
  },
  header: {
    paddingVertical: 20,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: Colors.normalText,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: Colors.menuText,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  loadingText: {
    color: Colors.menuText,
    fontSize: 14,
    marginTop: 12,
  },
  errorContainer: {
    marginVertical: 16,
    marginHorizontal: 16,
    backgroundColor: "rgba(255, 107, 107, 0.1)",
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: "#ff6b6b",
    padding: 12,
  },
  errorText: {
    color: "#ff6b6b",
    fontSize: 13,
  },
  emptyContainer: {
    paddingVertical: 60,
    alignItems: "center",
  },
  emptyText: {
    color: Colors.menuText,
    fontSize: 14,
  },
});
