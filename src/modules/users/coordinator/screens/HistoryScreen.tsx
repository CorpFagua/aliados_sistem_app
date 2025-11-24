/**
 * HistoryScreen - Pantalla de historial de servicios para Coordinador
 */

import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  StyleSheet,
  Alert,
} from "react-native";
import { useAuth } from "../../../../providers/AuthProvider";
import { useServiceHistory, ServiceHistoryFilters } from "../../../../hooks/useServiceHistory";
import { Colors } from "../../../../constans/colors";
import CardService from "../../../../components/CardService";
import HistoryFilters from "../../../../components/HistoryFilters";
import ServiceDetailModal from "../../../../components/ServiceDetailModal";

export default function CoordinatorHistoryScreen() {
  const { session } = useAuth();
  const {
    services,
    total,
    loading,
    error,
    selectedService,
    serviceLoading,
    getServiceHistory,
    getServiceDetail,
    loadMore,
    search,
    refresh,
    setSelectedService,
    setError,
  } = useServiceHistory(session?.access_token || null);

  const [refreshing, setRefreshing] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [currentFilters, setCurrentFilters] = useState<ServiceHistoryFilters>({
    limit: 20,
    offset: 0,
    sortBy: "created_at",
    sortOrder: "desc",
  });

  // Cargar historial inicial
  useEffect(() => {
    if (session?.access_token) {
      loadInitialHistory();
    }
  }, [session?.access_token]);

  // Mostrar errores
  useEffect(() => {
    if (error) {
      Alert.alert("Error", error);
      setError(null);
    }
  }, [error]);

  const loadInitialHistory = async () => {
    await getServiceHistory({
      limit: 20,
      offset: 0,
      sortBy: "created_at",
      sortOrder: "desc",
    });
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refresh();
    } finally {
      setRefreshing(false);
    }
  };

  const handleLoadMore = () => {
    if (!loading && services.length < total) {
      loadMore();
    }
  };

  const handleSearch = (searchTerm: string) => {
    setCurrentFilters((prev) => ({
      ...prev,
      search: searchTerm,
      offset: 0,
    }));

    search(searchTerm, { offset: 0 });
  };

  const handleFiltersChange = (newFilters: Partial<ServiceHistoryFilters>) => {
    const updatedFilters = {
      ...currentFilters,
      ...newFilters,
      offset: 0, // Reset pagination
    };

    setCurrentFilters(updatedFilters);
    getServiceHistory(updatedFilters);
  };

  const handleServicePress = async (serviceId: string) => {
    setShowDetailModal(true);
    await getServiceDetail(serviceId);
  };

  const renderServiceItem = ({ item }: { item: any }) => (
    <CardService service={item} onPress={() => handleServicePress(item.id)} />
  );

  if (loading && services.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.activeMenuText} />
        <Text style={styles.loadingText}>Cargando historial...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Historial de Servicios</Text>
        <Text style={styles.headerSubtitle}>
          {total} servicio{total !== 1 ? "s" : ""} en total
        </Text>
      </View>

      {/* Filtros */}
      <HistoryFilters
        onFiltersChange={handleFiltersChange}
        onSearch={handleSearch}
        loading={loading}
      />

      {/* Lista de servicios */}
      {services.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>📭</Text>
          <Text style={styles.emptyTitle}>Sin servicios</Text>
          <Text style={styles.emptyText}>
            No hay servicios que coincidan con los filtros aplicados
          </Text>
        </View>
      ) : (
        <FlatList
          data={services}
          keyExtractor={(item) => item.id}
          renderItem={renderServiceItem}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={Colors.activeMenuText}
            />
          }
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            loading && services.length > 0 ? (
              <View style={styles.footerLoader}>
                <ActivityIndicator color={Colors.activeMenuText} />
                <Text style={styles.footerText}>Cargando más...</Text>
              </View>
            ) : services.length < total ? (
              <View style={styles.footerInfo}>
                <Text style={styles.footerText}>
                  {services.length} de {total} servicios
                </Text>
              </View>
            ) : null
          }
        />
      )}

      {/* Modal de detalle */}
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
  },

  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.Border,
  },

  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: Colors.normalText,
    marginBottom: 4,
  },

  headerSubtitle: {
    fontSize: 13,
    color: Colors.menuText,
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

  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },

  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },

  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.normalText,
    marginBottom: 8,
  },

  emptyText: {
    fontSize: 14,
    color: Colors.menuText,
    textAlign: "center",
  },

  listContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },

  footerLoader: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 16,
    gap: 8,
  },

  footerText: {
    fontSize: 12,
    color: Colors.menuText,
  },

  footerInfo: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    alignItems: "center",
    backgroundColor: Colors.activeMenuBackground,
    borderRadius: 8,
    marginHorizontal: 16,
    marginBottom: 20,
  },
});
