// src/services/user.ts
import { supabase } from "@/lib/supabase"

export type UserRole = "coordinator" | "superadmin" | "delivery" | "store" | "client"| null

export async function fetchUserRole(userId: string): Promise<{ role: UserRole, isActive: boolean }> {
    
    const { data, error } = await supabase
        .from("profiles")
        .select("role, isActive")
        .eq("id", userId)
        .single()

    if (error || !data) return { role: null, isActive: false }
    return { role: data.role, isActive: data.isActive }
}
