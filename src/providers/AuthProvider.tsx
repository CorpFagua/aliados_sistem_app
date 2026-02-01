import { createContext, useState, useEffect, useContext } from "react";
import { Session } from "@supabase/supabase-js";
import { router } from "expo-router";
import { Platform } from "react-native";

import {
  signIn,
  signOut,
  signUp,
  getSession,
  onAuthStateChange,
} from "@/services/auth";

import { fetchCurrentUser } from "@/services/profile";
import { usePushRegistration } from "@/hooks/usePushNotifications";
import { unregisterPushToken } from "@/services/notifications";
import { unregisterWebPush } from "@/services/webNotifications";

import { User, Role } from "@/models/user";
import SessionLoadingOverlay from "@/components/SessionLoadingOverlay";

type UserRole = Role;

type AuthContextType = {
  loading: boolean;
  session: Session | null;
  role: UserRole;
  profile: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isActive: boolean;
  hasReachedLowDemandLimit: boolean;
  setHasReachedLowDemandLimit: (value: boolean) => void;
};

const AuthContext = createContext<AuthContextType>({
  loading: true,
  session: null,
  role: null,
  profile: null,
  login: async () => {},
  register: async () => {},
  logout: async () => {},
  isActive: false,
  hasReachedLowDemandLimit: false,
  setHasReachedLowDemandLimit: () => {},
});

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<UserRole>(null);
  const [isActive, setIsActive] = useState(false);
  const [profile, setProfile] = useState<User | null>(null);
  const [hasReachedLowDemandLimit, setHasReachedLowDemandLimit] = useState(false);
  
  // 🔐 Para evitar recargas innecesarias cuando no hay cambios
  const [lastSessionCheckId, setLastSessionCheckId] = useState<string | null>(null);

  /**
   * 🔀 Redirige según el rol del usuario
   */
  const redirectByRole = (role: UserRole) => {
    switch (role) {
      case "coordinator":
        router.replace("/(protected)/(coordinator)");
        break;
      case "super_admin":
        router.replace("/(protected)/super_admin");
        break;
      case "delivery":
        router.replace("/(protected)/delivery");
        break;
      case "store":
        router.replace("/(protected)/store");
        break;
      case "client":
        router.replace("/(protected)/client");
        break;
      default:
        console.log("Unknown role:", role);
        router.replace("/(auth)/login");
    }
  };

  /**
   * 🚀 Carga inicial:
   *  - Obtiene sesión si existe
   *  - Carga perfil del backend
   *  - Redirige solo cuando todo está listo
   */
  useEffect(() => {
    let isMounted = true;
    let timeoutId: NodeJS.Timeout;

    const initSession = async () => {
      try {
        const { data } = await getSession();
        const currentSession = data.session ?? null;

        if (!isMounted) return;

        // Si hay usuario cargamos perfil
        if (currentSession?.user) {
          const token = currentSession.access_token;

          const profileData = await fetchCurrentUser(token);

          if (!isMounted) return;

          const userRole = profileData.role ?? null;
          const active = profileData.isActive ?? false;

          // Actualizar estado primero MIENTRAS LOADING SIGUE EN TRUE
          setSession(currentSession);
          setProfile(profileData);
          setRole(userRole);
          setIsActive(active);

          // ❌ Si el usuario está inactivo → forzar logout
          if (!active) {
            setLoading(false);
            await logout();
            return;
          }

          // Aquí loading sigue siendo true, el modal sigue visible
          // Redirigir primero
          redirectByRole(userRole);
          
          // Luego de redirigir, apagamos el loading
          timeoutId = setTimeout(() => {
            if (isMounted) {
              setLoading(false);
            }
          }, 300);
        } else {
          if (!isMounted) return;
          setSession(null);
          setLoading(false);
          router.replace("/(auth)/login");
        }

      } catch (error: any) {
        console.error("Error cargando sesión:", error.message);
        if (!isMounted) return;
        setLoading(false);
        router.replace("/(auth)/login");
      }
    };

    initSession();

    /**
     * 🔄 Listener:
     *  - Detecta login/logout automáticamente
     *  - PERO solo actualiza si la sesión cambió realmente (no cada vez que vuelves a la pantalla)
     */
    const { data: subscription } = onAuthStateChange(async (newSession) => {
      if (!isMounted) return;

      // ✅ Solo actualizar si el ID del usuario cambió (login/logout real)
      // Esto evita recargas cuando vuelves a una pantalla con la misma sesión
      const newSessionId = newSession?.user?.id ?? null;
      
      if (newSessionId === lastSessionCheckId) {
        // La sesión no cambió, no hacer nada
        console.log("[AUTH] Listener detectó el mismo usuario, ignorando...");
        return;
      }

      console.log(`[AUTH] Sesión cambió: ${lastSessionCheckId} → ${newSessionId}`);
      setLastSessionCheckId(newSessionId);
      setSession(newSession);

      if (newSession?.user) {
        try {
          const token = newSession.access_token;
          const profileData = await fetchCurrentUser(token);

          if (!isMounted) return;

          setProfile(profileData);
          setRole(profileData.role);
          setIsActive(profileData.isActive);

          if (!profileData.isActive) {
            await logout();
            return;
          }

          redirectByRole(profileData.role);
        } catch (err: any) {
          console.error("Error actualizando sesión:", err.message);
          if (!isMounted) return;
          router.replace("/(auth)/login");
        }

      } else {
        if (!isMounted) return;
        setRole(null);
        setProfile(null);
        setIsActive(false);
        router.replace("/(auth)/login");
      }
    });

    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
      subscription?.subscription?.unsubscribe();
    };

  }, [lastSessionCheckId]);

  /**
   * 🔔 Registrar notificaciones push
   *    → Se ejecuta SOLO cuando `session.user` cambia
   *    → Maneja automáticamente FCM en nativo y Web Push en web
   */
  const pushNotifications = usePushRegistration(session);

  /**
   * 🧩 Login
   */
  const login = async (email: string, password: string) => {
    try {
      const { error, data } = await signIn(email, password);
      if (error) throw error;

      if (data?.session?.access_token) {
        const profileData = await fetchCurrentUser(data.session.access_token);

        setProfile(profileData);
        setRole(profileData.role ?? null);
        setIsActive(profileData.isActive ?? false);

        if (!profileData.isActive) {
          await logout();
          throw new Error("Usuario inactivo");
        }

        redirectByRole(profileData.role);
      }
    } catch (error: any) {
      console.log("Error en login:", error.message);
      throw error;
    }
  };

  /**
   * 🧩 Registro
   */
  const register = async (email: string, password: string) => {
    const { error } = await signUp(email, password);
    if (error) throw error;
  };

  /**
   * 🧩 Logout
   */
  const logout = async () => {
    console.log(`\n🔐 [AUTH] Iniciando logout...`);
    
    // Guardar el access_token antes de limpiarlo
    const currentAccessToken = session?.access_token;
    const currentDeviceToken = pushNotifications.getToken();
    const currentSubscription = pushNotifications.getSubscription?.();
    const isWeb = Platform.OS === "web";
    
    try {
      // En plataformas nativas (Android/iOS)
      if (!isWeb && currentAccessToken && currentDeviceToken) {
        console.log(`📲 [AUTH] Eliminando token FCM del dispositivo actual...`);
        console.log(`🔑 [AUTH] Access Token disponible: ${currentAccessToken.substring(0, 20)}...`);
        console.log(`📱 [AUTH] Device Token: ${currentDeviceToken.substring(0, 30)}...`);
        try {
          await unregisterPushToken(currentDeviceToken, currentAccessToken);
          console.log(`✅ [AUTH] Token FCM del dispositivo actual eliminado`);
          pushNotifications.clearToken();
        } catch (notifErr: any) {
          console.warn(`⚠️  [AUTH] No se pudo eliminar el token FCM (continuando con logout):`, notifErr.message);
        }
      }

      // En web
      if (isWeb && currentAccessToken) {
        console.log(`🌐 [AUTH] Eliminando subscription web push...`);
        try {
          await unregisterWebPush(currentAccessToken);
          console.log(`✅ [AUTH] Subscription web push eliminada`);
          pushNotifications.clearSubscription?.();
        } catch (webNotifErr: any) {
          console.warn(`⚠️  [AUTH] No se pudo eliminar web push (continuando con logout):`, webNotifErr.message);
        }
      }

      if (!isWeb && !currentAccessToken) {
        console.warn(`⚠️  [AUTH] No hay access_token disponible`);
      }
      if (!isWeb && !currentDeviceToken) {
        console.warn(`⚠️  [AUTH] No hay device token disponible (notificaciones no configuradas)`);
      }
    } catch (err) {
      console.error(`❌ [AUTH] Error inesperado eliminando notificaciones:`, err);
    }

    console.log(`🔑 [AUTH] Cerrando sesión en Supabase (scope: local)...`);
    const { error } = await signOut();
    if (error) {
      console.error(`❌ [AUTH] Error en signOut:`, error);
      throw error;
    }

    console.log(`🧹 [AUTH] Limpiando estado local...`);
    setProfile(null);
    setRole(null);
    setIsActive(false);

    console.log(`📍 [AUTH] Redirigiendo a login...\n`);
    router.replace("/(auth)/login");
  };

  return (
    <AuthContext.Provider
      value={{
        loading,
        session,
        role,
        profile,
        login,
        register,
        logout,
        isActive,
        hasReachedLowDemandLimit,
        setHasReachedLowDemandLimit,
      }}
    >
      <SessionLoadingOverlay visible={loading} />
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
