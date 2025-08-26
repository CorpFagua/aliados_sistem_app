// src/providers/AuthProvider.tsx
import { createContext, useState, useEffect, useContext } from "react"
import { Session } from "@supabase/supabase-js"
import { router } from "expo-router"
import { signIn, signOut, signUp, getSession, onAuthStateChange } from "@/services/auth"
import { fetchUserRole } from "@/services/user"

type UserRole = "admin" | "superadmin" | "delivery" | "store" | null

type AuthContextType = {
    loading: boolean
    session: Session | null
    role: UserRole
    login: (email: string, password: string) => Promise<void>
    register: (email: string, password: string) => Promise<void>
    logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
    loading: true,
    session: null,
    role: null,
    login: async () => { },
    register: async () => { },
    logout: async () => { },
})

export default function AuthProvider({ children }: { children: React.ReactNode }) {
    const [loading, setLoading] = useState(true)
    const [session, setSession] = useState<Session | null>(null)
    const [role, setRole] = useState<UserRole>(null)

    // ✅ función de redirección centralizada según rol
    const redirectByRole = (role: UserRole) => {
        switch (role) {
            case "admin":
                router.replace("/(protected)/admin")
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
                const userRole = await fetchUserRole(currentSession.user.id)
                setRole(userRole)
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
                const userRole = await fetchUserRole(newSession.user.id)
                setRole(userRole)
                redirectByRole(userRole)
            } else {
                setRole(null)
                router.replace("/(auth)/login")
            }
        })

        return () => {
            subscription?.subscription?.unsubscribe()
        }
    }, [])

    const login = async (email: string, password: string) => {
        const { error } = await signIn(email, password)
        if (error) throw error
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
        <AuthContext.Provider value={{ loading, session, role, login, register, logout }}>
            {children}
        </AuthContext.Provider>
    )
}

export const useAuth = () => useContext(AuthContext)
