import { supabase } from "@/lib/supabase"

export async function testSupabase() {
  const { data, error } = await supabase.from("profiles").select("*").limit(1)

  if (error) {
    console.error("❌ Error conectando con Supabase:", error.message)
  } else {
    console.log("✅ Conexión correcta a Supabase, primer registro:", data)
  }
}
