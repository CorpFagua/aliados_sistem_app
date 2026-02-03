import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { useAuth } from './AuthProvider';
import { useUnreadMessages } from '@/hooks/useUnreadMessages';

/**
 * Contexto para gestionar mensajes sin leer globalmente
 */
interface UnreadMessagesContextType {
  /**
   * Obtener el conteo de mensajes sin leer para un servicio
   */
  getUnreadCount: (serviceId: string) => number;

  /**
   * Marcar un servicio como leído (resetea el contador)
   */
  markServiceAsRead: (serviceId: string) => void;

  /**
   * Registrar servicios permitidos para el usuario actual
   * Debe llamarse desde cada vista con los IDs de servicios visibles
   */
  registerServices: (serviceIds: string[]) => void;

  /**
   * Total de mensajes sin leer en todos los servicios
   */
  totalUnread: number;
}

const UnreadMessagesContext = createContext<UnreadMessagesContextType>({
  getUnreadCount: () => 0,
  markServiceAsRead: () => {},
  registerServices: () => {},
  totalUnread: 0,
});

export const useUnreadMessagesContext = () => useContext(UnreadMessagesContext);

/**
 * Versión opcional que retorna undefined si el provider no está disponible
 * Útil para componentes que pueden funcionar sin el provider
 */
export const useUnreadMessagesContextOptional = () => {
  try {
    return useContext(UnreadMessagesContext);
  } catch {
    return undefined;
  }
};

/**
 * Provider para gestionar mensajes sin leer en toda la aplicación
 * 
 * Uso:
 * 1. Envolver la app con este provider
 * 2. En cada vista de rol, llamar registerServices() con los IDs visibles
 * 3. En CardService, usar getUnreadCount() para mostrar badge
 * 4. Al abrir ChatModal, llamar markServiceAsRead()
 */
export function UnreadMessagesProvider({ children }: { children: React.ReactNode }) {
  const { session, profile, role } = useAuth();
  const [registeredServices, setRegisteredServices] = useState<string[]>([]);

  // Hook que maneja la lógica de suscripción
  const { unreadCounts, getUnreadCount, markAsRead } = useUnreadMessages(registeredServices);

  /**
   * Registrar servicios permitidos (llamado desde las vistas)
   */
  const registerServices = useCallback((serviceIds: string[]) => {
    // Solo actualizar si hay cambios
    const newIds = serviceIds.sort().join(',');
    const currentIds = registeredServices.sort().join(',');

    if (newIds !== currentIds) {
      console.log(`📋 [UNREAD_PROVIDER] Registrando ${serviceIds.length} servicios`);
      setRegisteredServices(serviceIds);
    }
  }, [registeredServices]);

  /**
   * Marcar servicio como leído
   */
  const markServiceAsRead = useCallback(
    (serviceId: string) => {
      console.log(`✅ [UNREAD_PROVIDER] Marcando servicio ${serviceId} como leído`);
      markAsRead(serviceId);
    },
    [markAsRead]
  );

  /**
   * Calcular total de mensajes sin leer
   */
  const totalUnread = Object.values(unreadCounts).reduce((sum, count) => sum + count, 0);

  /**
   * Limpiar servicios registrados al cerrar sesión
   */
  useEffect(() => {
    if (!session) {
      setRegisteredServices([]);
    }
  }, [session]);

  /**
   * 📱 Reconectar listeners cuando la app vuelve del background
   */
  useEffect(() => {
    if (!session?.access_token) return;

    const subscription = AppState.addEventListener('change', async (state: AppStateStatus) => {
      if (state === 'active') {
        console.log('[UnreadMessagesProvider] 📱 App vuelve a foreground, reconectando listeners...');
        // Los listeners se reconectan automáticamente porque dependen de session
      }
    });

    return () => subscription.remove();
  }, [session?.access_token]);

  return (
    <UnreadMessagesContext.Provider
      value={{
        getUnreadCount,
        markServiceAsRead,
        registerServices,
        totalUnread,
      }}
    >
      {children}
    </UnreadMessagesContext.Provider>
  );
}
