
import { supabase } from "@/lib/supabase"

export async function signIn(email: string, password: string) {
  return supabase.auth.signInWithPassword({ email, password })
}

export async function signUp(email: string, password: string) {
  return supabase.auth.signUp({ email, password })
}

export async function signOut() {
  // Usar scope 'local' para permitir múltiples sesiones en diferentes dispositivos
  return supabase.auth.signOut({ scope: 'local' })
}

export async function getSession() {
  return supabase.auth.getSession()
}

export function onAuthStateChange(callback: (session: any) => void) {
  return supabase.auth.onAuthStateChange((_event, session) => {
    callback(session)
  })
}
