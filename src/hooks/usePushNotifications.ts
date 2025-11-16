import { useEffect, useRef } from "react";
import { registerPushToken } from "../services/notifications";
import { api, authHeaders } from "../lib/api";

export function usePushRegistration(session: any) {
  const tokenRef = useRef<string | null>(null);

  useEffect(() => {
    if (!session?.access_token) {
      console.log(`\n🔐 [HOOK] Sin sesión activa, limpieza delegada a AuthProvider`);
      // No limpiar tokens aquí, AuthProvider.logout() ya lo hace
      tokenRef.current = null;
      return;
    }

    console.log(`\n🔐 [HOOK] Sesión activa detectada, registrando token de push...`);

    (async () => {
      const t = await registerPushToken();
      if (!t) {
        console.warn(`⚠️  [HOOK] No se pudo obtener token (permisos denegados?)`);
        return;
      }

      // Guardar el token en la referencia
      tokenRef.current = t.token;
      console.log(`💾 [HOOK] Token guardado en referencia`);

      try {
        console.log(`📤 [HOOK] Enviando token al backend...`);
        await api.post(
          "/notifications/register-token",
          t,
          { headers: authHeaders(session.access_token) }
        );
        console.log(`✅ [HOOK] Token registrado en el backend\n`);
      } catch (err) {
        console.error(`❌ [HOOK] Error registrando token:`, err);
      }
    })();
  }, [session]);

  // Devolver función para limpiar el token
  return {
    getToken: () => {
      console.log(`📍 [HOOK] Obteniendo token... ${tokenRef.current?.substring(0, 20) || "null"}`);
      return tokenRef.current;
    },
    clearToken: async (token: string) => {
      console.log(`🧹 [HOOK] Limpiando token (delegado a AuthProvider)`);
      // La limpieza real la hace AuthProvider.logout()
      tokenRef.current = null;
    },
  };
}
