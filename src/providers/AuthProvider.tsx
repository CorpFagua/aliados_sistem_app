// src/providers/AuthProvider.tsx
import { createContext, useState, useEffect, useContext } from "react"
import { Session } from "@supabase/supabase-js"
import { router } from "expo-router"
import { signIn, signOut, signUp, getSession, onAuthStateChange } from "@/services/auth"
import { fetchUserRole } from "@/services/user"

type UserRole = "coordinator" | "superadmin" | "delivery" | "store" | "client" | null

type AuthContextType = {
    loading: boolean
    session: Session | null
    role: UserRole
    login: (email: string, password: string) => Promise<void>
    register: (email: string, password: string) => Promise<void>
    logout: () => Promise<void>
    isActive: boolean
}

const AuthContext = createContext<AuthContextType>({
    loading: true,
    session: null,
    role: null,
    login: async () => { },
    register: async () => { },
    logout: async () => { },
    isActive: false,
})

export default function AuthProvider({ children }: { children: React.ReactNode }) {
    const [loading, setLoading] = useState(true)
    const [session, setSession] = useState<Session | null>(null)
    const [role, setRole] = useState<UserRole>(null)
    const [isActive, setIsActive] = useState(false)

    // ✅ función de redirección centralizada según rol
    const redirectByRole = (role: UserRole) => {
        switch (role) {
            case "coordinator":
                router.replace("/(protected)/coordinator")
                break
            case "superadmin":
                router.replace("/(protected)/superadmin")
                break
            case "delivery":
                router.replace("/(protected)/delivery")
                break
            case "store":
                router.replace("/(protected)/store") // 👈 ojo aquí, tu carpeta es "store"
                break
            case "client":
                router.replace("/(protected)/client")
                break
            default:
                console.log("Unknown role:", role)
                router.replace("/(auth)/login")
        }
    }


    useEffect(() => {
        const initSession = async () => {
            const { data } = await getSession()
            const currentSession = data.session ?? null
            setSession(currentSession)

            if (currentSession?.user) {
                const { role: userRole, isActive } = await fetchUserRole(currentSession.user.id)
                setRole(userRole)
                setIsActive(isActive)
                if (!isActive) {
                    await logout()
                    router.replace("/(auth)/login")
                    return
                }
                redirectByRole(userRole)
            } else {
                router.replace("/(auth)/login")
            }
            setLoading(false)
        }

        initSession()

        const { data: subscription } = onAuthStateChange(async (newSession) => {
            setSession(newSession)
            setLoading(false)

            if (newSession?.user) {
                const { role: userRole, isActive } = await fetchUserRole(newSession.user.id)
                setRole(userRole)
                setIsActive(isActive)
                if (!isActive) {
                    await logout()
                    router.replace("/(auth)/login")
                    return
                }
                redirectByRole(userRole)
            } else {
                setRole(null)
                setIsActive(false)
                router.replace("/(auth)/login")
            }
        })

        return () => {
            subscription?.subscription?.unsubscribe()
        }
    }, [])

    const login = async (email: string, password: string) => {
        try {
            const { error, data } = await signIn(email, password);
            if (error) throw error;
            
            if (data?.user) {
                const { isActive } = await fetchUserRole(data.user.id);
                if (!isActive) {
                    await logout();
                    throw new Error("Usuario inactivo");
                }
            }
        } catch (error: any) {
            console.log("Error en AuthProvider:", error.message); // Para debug
            throw error; // Importante: propagar el error
        }
    }

    const register = async (email: string, password: string) => {
        const { error } = await signUp(email, password)
        if (error) throw error
    }

    const logout = async () => {
        const { error } = await signOut()
        if (error) throw error
    }

    return (
        <AuthContext.Provider value={{ loading, session, role, login, register, logout, isActive }}>
            {children}
        </AuthContext.Provider>
    )
}

export const useAuth = () => useContext(AuthContext)
