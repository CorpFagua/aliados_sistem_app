// src/lib/supabase.ts
import { Platform } from "react-native"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { createClient } from "@supabase/supabase-js"
import ENV from "@/config/environment"

const supabaseUrl = ENV.SUPABASE_URL
const supabaseAnonKey = ENV.SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('❌ Variables de Supabase no configuradas. Verifica .env y app.config.js')
} 

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: Platform.OS === "web" ? undefined : AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false, // ya no usamos magic link
    // Cada instancia de la app tendrá su propia clave de sesión
    // Esto permite múltiples sesiones independientes en diferentes dispositivos
    storageKey: 'supabase.auth.token',
  },

  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
})