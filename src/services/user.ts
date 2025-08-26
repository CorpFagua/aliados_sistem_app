// src/services/user.ts
import { supabase } from "@/lib/supabase"

export type UserRole = "admin" | "superadmin" | "delivery" | "store" | null

export async function fetchUserRole(userId: string): Promise<UserRole> {
  const { data, error } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .single()

  if (error) {
    console.error("Error fetching role:", error.message)
    return null
  }

  if (["admin", "superadmin", "delivery", "store"].includes(data.role)) {
    return data.role as UserRole
  }
  return null
}
