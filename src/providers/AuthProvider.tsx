import { createContext, useState, useEffect, useContext } from "react";
import { Session } from "@supabase/supabase-js";
import { router } from "expo-router";

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

import { User, Role } from "@/models/user";

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
});

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<UserRole>(null);
  const [isActive, setIsActive] = useState(false);
  const [profile, setProfile] = useState<User | null>(null);

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
   *  - Redirige
   */
  useEffect(() => {
    const initSession = async () => {
      try {
        const { data } = await getSession();
        const currentSession = data.session ?? null;

        setSession(currentSession);

        // Si hay usuario cargamos perfil
        if (currentSession?.user) {
          const token = currentSession.access_token;

          const profileData = await fetchCurrentUser(token);
          setProfile(profileData);

          const userRole = profileData.role ?? null;
          const active = profileData.isActive ?? false;

          setRole(userRole);
          setIsActive(active);

          // ❌ Si el usuario está inactivo → forzar logout
          if (!active) {
            await logout();
            router.replace("/(auth)/login");
            return;
          }

          redirectByRole(userRole);
        } else {
          router.replace("/(auth)/login");
        }

      } catch (error: any) {
        console.error("Error cargando sesión:", error.message);
        router.replace("/(auth)/login");
      } finally {
        setLoading(false);
      }
    };

    initSession();

    /**
     * 🔄 Listener:
     *  - Detecta login/logout automáticamente
     *  - Actualiza perfil y estado
     */
    const { data: subscription } = onAuthStateChange(async (newSession) => {
      setSession(newSession);

      if (newSession?.user) {
        try {
          const token = newSession.access_token;
          const profileData = await fetchCurrentUser(token);

          setProfile(profileData);
          setRole(profileData.role);
          setIsActive(profileData.isActive);

          if (!profileData.isActive) {
            await logout();
            router.replace("/(auth)/login");
            return;
          }

          redirectByRole(profileData.role);
        } catch (err: any) {
          console.error("Error actualizando sesión:", err.message);
          router.replace("/(auth)/login");
        }

      } else {
        setRole(null);
        setProfile(null);
        setIsActive(false);
        router.replace("/(auth)/login");
      }
    });

    return () => subscription?.subscription?.unsubscribe();

  }, []);

  /**
   * 🔔 Registrar notificaciones push
   *    → Se ejecuta SOLO cuando `session.user` cambia
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
    
    try {
      // Eliminar solo el token del dispositivo actual (no todos)
      if (currentAccessToken && currentDeviceToken) {
        console.log(`📲 [AUTH] Eliminando token de notificaciones del dispositivo actual...`);
        console.log(`🔑 [AUTH] Access Token disponible: ${currentAccessToken.substring(0, 20)}...`);
        console.log(`📱 [AUTH] Device Token: ${currentDeviceToken.substring(0, 30)}...`);
        try {
          await unregisterPushToken(currentDeviceToken, currentAccessToken);
          console.log(`✅ [AUTH] Token del dispositivo actual eliminado`);
          pushNotifications.clearToken();
        } catch (notifErr: any) {
          console.warn(`⚠️  [AUTH] No se pudo eliminar el token (continuando con logout):`, notifErr.message);
          // Continuar con el logout aunque falle la eliminación del token
        }
      } else {
        if (!currentAccessToken) {
          console.warn(`⚠️  [AUTH] No hay access_token disponible`);
        }
        if (!currentDeviceToken) {
          console.warn(`⚠️  [AUTH] No hay device token disponible (notificaciones no configuradas)`);
        }
      }
    } catch (err) {
      console.error(`❌ [AUTH] Error inesperado eliminando token de notificaciones:`, err);
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
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
