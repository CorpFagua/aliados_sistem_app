// src/lib/supabase.ts
import { Platform } from "react-native"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL 
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY 

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: Platform.OS === "web" ? undefined : AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false, // ya no usamos magic link
  },

  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
})