/**
 * HistorialScreen v3 - Con Real-time Subscriptions
 * ✅ Filtrado local (sin nuevas peticiones)
 * ✅ Carga más si no está todo
 * ✅ Suscripción en tiempo real (Supabase)
 * ✅ Nuevo servicio aparece instantáneamente
 * ✅ Cambios se reflejan sin refrescar
 */

import React, { useEffect, useState, useCallback, useRef } from "react";
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  StyleSheet,
  Alert,
  Dimensions,
  ListRenderItemInfo,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useAuth } from "../../../../providers/AuthProvider";
import { useServiceHistoryRealtime } from "../../../../hooks/useServiceHistoryRealtime";
import { Colors } from "../../../../constans/colors";
import CardService from "../../../../components/CardService";
import HistoryFilters from "../../../../components/HistoryFilters";
import ServiceDetailModal from "../../../../components/ServiceDetailModal";
import { ServiceHistorySummary } from "../../../../services/serviceHistory";

const { width: screenWidth } = Dimensions.get("window");
const isLargeScreen = screenWidth > 600;
const contentMaxWidth = isLargeScreen ? 600 : "100%";

export default function CoordinatorHistoryScreen() {
  const { session } = useAuth();
  const {
    services,
    total,
    loading,
    isLoadingMore,
    error,
    selectedService,
    serviceLoading,
    getServiceHistory,
    getServiceDetail,
    search,
    applyFilters,
    clearFilters,
    refresh,
    loadMore,
    saveScrollPosition,
    setSelectedService,
    setError,
  } = useServiceHistoryRealtime(session?.access_token || null);

  const [refreshing, setRefreshing] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const flatListRef = useRef<FlatList>(null);
  const scrollPositionRef = useRef({ offset: 0, index: 0 });

  useEffect(() => {
    if (session?.access_token) {
      loadInitialHistory();
    }
  }, [session?.access_token]);

  useFocusEffect(
    useCallback(() => {
      const { index } = scrollPositionRef.current;
      if (flatListRef.current && index > 0) {
        setTimeout(() => {
          flatListRef.current?.scrollToIndex({
            index,
            animated: false,
          });
        }, 100);
      }
      return () => {};
    }, [])
  );

  useEffect(() => {
    if (error) {
      Alert.alert("Error", error);
      setError(null);
    }
  }, [error]);

  const loadInitialHistory = async () => {
    await getServiceHistory({
      limit: 50,
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

  const handleSearch = (searchTerm: string) => {
    search(searchTerm);
  };

  const handleFiltersChange = (newFilters: any) => {
    applyFilters(newFilters);
  };

  const handleClearFilters = () => {
    clearFilters();
  };

  const handleServicePress = async (serviceId: string) => {
    setShowDetailModal(true);
    await getServiceDetail(serviceId);
  };

  const handleScroll = (event: any) => {
    const offset = event.nativeEvent.contentOffset.y;
    const index = Math.floor(
      offset / (event.nativeEvent.layoutMeasurement.height / 3)
    );
    scrollPositionRef.current = { offset, index };
    saveScrollPosition(offset, index);
  };

  const handleEndReached = () => {
    if (!loading && !isLoadingMore && services.length < total) {
      console.log("[INFINITE] Cargando más servicios...");
      loadMore();
    }
  };

  const renderServiceItem = ({ item }: ListRenderItemInfo<ServiceHistorySummary>) => (
    <CardService service={item} onPress={() => handleServicePress(item.id)} />
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>📭</Text>
      <Text style={styles.emptyTitle}>Sin servicios</Text>
      <Text style={styles.emptyText}>
        No hay servicios que coincidan con los filtros aplicados
      </Text>
    </View>
  );

  const renderFooter = () => {
    if (services.length === 0) return null;

    if (isLoadingMore) {
      return (
        <View style={styles.footerContainer}>
          <ActivityIndicator color={Colors.activeMenuText} size="small" />
          <Text style={styles.footerText}>Cargando más servicios...</Text>
        </View>
      );
    }

    if (services.length < total) {
      return (
        <View style={styles.footerContainer}>
          <Text style={styles.footerText}>
            Mostrando {services.length} de {total} servicios
          </Text>
          <Text style={styles.footerSubtext}>
            Scroll hacia abajo para cargar más
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.footerComplete}>
        <Text style={styles.footerCompleteText}>
          Todos los {total} servicios cargados
        </Text>
      </View>
    );
  };

  if (loading && services.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.activeMenuText} />
        <Text style={styles.loadingText}>Cargando historial...</Text>
      </View>
    );
  }

  return (
    <View style={styles.screenWrapper}>
      <View style={styles.contentContainer}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Historial de Servicios</Text>
          <Text style={styles.headerSubtitle}>
            {services.length} de {total} servicio{total !== 1 ? "s" : ""}{" "}
            {total > services.length && "(cargando más...)"}
          </Text>
        </View>

        <View style={styles.filtersContainer}>
          <HistoryFilters
            onFiltersChange={handleFiltersChange}
            onSearch={handleSearch}
            onClear={handleClearFilters}
            loading={loading}
          />
        </View>

        <FlatList
          ref={flatListRef}
          data={services}
          keyExtractor={(item) => item.id}
          renderItem={renderServiceItem}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={renderEmpty}
          ListFooterComponent={renderFooter}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          onEndReached={handleEndReached}
          onEndReachedThreshold={0.3}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={Colors.activeMenuText}
            />
          }
          initialNumToRender={10}
          maxToRenderPerBatch={20}
          updateCellsBatchingPeriod={50}
          removeClippedSubviews={true}
        />
      </View>

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
  screenWrapper: {
    flex: 1,
    alignItems: "center",
    width: "100%",
    backgroundColor: Colors.Background,
  },

  contentContainer: {
    width: isLargeScreen ? contentMaxWidth : "100%",
    paddingHorizontal: isLargeScreen ? 12 : 0,
    flex: 1,
  },

  header: {
    paddingHorizontal: 12,
    paddingVertical: 16,
    backgroundColor: Colors.Background,
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
    fontSize: 14,
    color: Colors.menuText,
    textAlign: "left",
  },

  filtersContainer: {
    backgroundColor: Colors.Background,
    zIndex: 100,
    paddingHorizontal: 12,
    paddingVertical: 10,
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
    paddingHorizontal: 0,
    paddingVertical: 10,
  },

  footerContainer: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    alignItems: "center",
    backgroundColor: Colors.activeMenuBackground,
    marginHorizontal: 12,
    marginVertical: 8,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: Colors.activeMenuText,
  },

  footerText: {
    fontSize: 13,
    fontWeight: "500",
    color: Colors.normalText,
  },

  footerSubtext: {
    fontSize: 12,
    color: Colors.menuText,
    marginTop: 4,
  },

  footerComplete: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginHorizontal: 12,
    marginVertical: 8,
    alignItems: "center",
    backgroundColor: "#E8F5E9",
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: "#4CAF50",
  },

  footerCompleteText: {
    fontSize: 13,
    color: "#2E7D32",
    fontWeight: "500",
  },
});
