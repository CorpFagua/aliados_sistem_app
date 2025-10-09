import { createContext, useState, useEffect, useContext } from "react";
import { Session } from "@supabase/supabase-js";
import { router } from "expo-router";
import { signIn, signOut, signUp, getSession, onAuthStateChange } from "@/services/auth";
import { fetchCurrentUser } from "@/services/profile";

type UserRole = "coordinator" | "superadmin" | "delivery" | "store" | "client" | null;

type AuthContextType = {
  loading: boolean;
  session: Session | null;
  role: UserRole;
  profile: any | null;
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
  const [profile, setProfile] = useState<any | null>(null);

  // ✅ Redirección centralizada según rol
  const redirectByRole = (role: UserRole) => {
    switch (role) {
      case "coordinator":
        router.replace("/(protected)/(coordinator)");
        break;
      case "superadmin":
        router.replace("/(protected)/superadmin");
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

  // 🚀 Inicializar sesión y cargar perfil completo
  useEffect(() => {
    const initSession = async () => {
      try {
        const { data } = await getSession();
        const currentSession = data.session ?? null;
        setSession(currentSession);

        if (currentSession?.user) {
          const token = currentSession.access_token;

          // Obtener perfil completo desde backend
          const profileData = await fetchCurrentUser(token);
          setProfile(profileData);

          const userRole = profileData.role ?? null;
          const active = profileData.isActive ?? false;
          setRole(userRole);
          setIsActive(active);

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

    // 🔄 Listener de cambios de sesión (login/logout)
    const { data: subscription } = onAuthStateChange(async (newSession) => {
      setSession(newSession);
      if (newSession?.user) {
        try {
          const token = newSession.access_token;
          const profileData = await fetchCurrentUser(token);
          setProfile(profileData);

          const userRole = profileData.role ?? null;
          const active = profileData.isActive ?? false;
          setRole(userRole);
          setIsActive(active);

          if (!active) {
            await logout();
            router.replace("/(auth)/login");
            return;
          }

          redirectByRole(userRole);
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

    return () => {
      subscription?.subscription?.unsubscribe();
    };
  }, []);

  // 🧩 Login
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

  // 🧩 Registro
  const register = async (email: string, password: string) => {
    const { error } = await signUp(email, password);
    if (error) throw error;
  };

  // 🧩 Logout
  const logout = async () => {
    const { error } = await signOut();
    if (error) throw error;
    setProfile(null);
    setRole(null);
    setIsActive(false);
    router.replace("/(auth)/login");
  };

  return (
    <AuthContext.Provider
      value={{ loading, session, role, profile, login, register, logout, isActive }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
