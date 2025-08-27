
import { supabase } from "@/lib/supabase"

export async function signIn(email: string, password: string) {
  return supabase.auth.signInWithPassword({ email, password })
}

export async function signUp(email: string, password: string) {
  return supabase.auth.signUp({ email, password })
}

export async function signOut() {
  return supabase.auth.signOut()
}

export async function getSession() {
  return supabase.auth.getSession()
}

export function onAuthStateChange(callback: (session: any) => void) {
  return supabase.auth.onAuthStateChange((_event, session) => {
    callback(session)
  })
}
