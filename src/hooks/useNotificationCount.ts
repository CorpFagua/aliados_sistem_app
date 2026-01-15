import { useState, useCallback } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { useAuth } from "@/providers/AuthProvider";
import { getPendingTransfers } from "@/services/transfers";

/**
 * Hook para obtener el conteo de notificaciones no vistas
 * Se utiliza principalmente en el Header para mostrar el badge
 */
export function useNotificationCount() {
  const { session, profile } = useAuth();
  const [unviewedCount, setUnviewedCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const loadNotificationCount = useCallback(async () => {
    if (!session?.access_token || !profile?.id) return;

    try {
      setLoading(true);
      const transfers = await getPendingTransfers(session.access_token);

      // Contar notificaciones no vistas que son para este delivery
      const unviewedNotifications = (transfers || []).filter(
        (t: any) =>
          t.to_delivery_id === profile.id &&
          t.status === "pending" &&
          !t.viewed
      );

      setUnviewedCount(unviewedNotifications.length);
    } catch (err) {
      console.error("Error loading notification count:", err);
      setUnviewedCount(0);
    } finally {
      setLoading(false);
    }
  }, [session?.access_token, profile?.id]);

  // Cargar el conteo cuando la pantalla se enfoca
  useFocusEffect(
    useCallback(() => {
      loadNotificationCount();
    }, [loadNotificationCount])
  );

  return {
    unviewedCount,
    loading,
    refetch: loadNotificationCount,
  };
}
