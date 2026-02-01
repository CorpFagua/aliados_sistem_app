import { useEffect, useRef } from "react";
import { registerPushToken } from "../services/notifications";
import { api, authHeaders } from "../lib/api";

export function usePushRegistration(session: any) {
  const tokenRef = useRef<string | null>(null);
  const subscriptionRef = useRef<any>(null);
  const lastRegisteredRef = useRef<{ userId: string; resultId: string } | null>(null);

  useEffect(() => {
    if (!session?.access_token) {
      console.log(`\n🔐 [HOOK] Sin sesión activa, limpieza delegada a AuthProvider`);
      tokenRef.current = null;
      subscriptionRef.current = null;
      // ⭐ NO reiniciamos lastRegisteredRef aquí para que funcione en cambios de sesión
      return;
    }

    console.log(`\n🔐 [HOOK] Sesión activa detectada para usuario: ${session.user?.id?.substring(0, 20)}...`);

    (async () => {
      const result = await registerPushToken();
      if (!result) {
        console.warn(`⚠️  [HOOK] No se pudo obtener token/subscription (permisos denegados?)`);
        return;
      }

      // ⭐ Crear identificador único: token+uid o subscription+uid
      const resultId = result.platform === "web" 
        ? `web_${JSON.stringify(result.webSubscription).substring(0, 50)}`
        : `fcm_${result.token}`;

      // ⭐ Si ya registramos EXACTAMENTE lo mismo PARA EL MISMO USUARIO, omitir
      if (
        lastRegisteredRef.current?.userId === session.user?.id &&
        lastRegisteredRef.current?.resultId === resultId
      ) {
        console.log(`⏭️  [HOOK] Token/subscription ya registrado para este usuario, omitiendo petición doble`);
        return;
      }

      // ⭐ Si cambió de usuario o de token, limpiar el ref anterior
      if (lastRegisteredRef.current?.userId !== session.user?.id) {
        console.log(`🔄 [HOOK] Cambio de usuario detectado, limpiando estado anterior`);
        lastRegisteredRef.current = null;
      }

      // Guardar en referencias según el tipo
      if (result.platform === "web") {
        subscriptionRef.current = result.webSubscription;
        console.log(`💾 [HOOK] Web subscription guardada en referencia`);
      } else {
        tokenRef.current = result.token;
        console.log(`💾 [HOOK] Token FCM guardado en referencia`);
      }

      try {
        console.log(`📤 [HOOK] Enviando ${result.platform === "web" ? "subscription" : "token"} al backend...`);
        await api.post(
          "/notifications/register-token",
          result,
          { headers: authHeaders(session.access_token) }
        );
        // ⭐ Marcar como registrado con userId
        lastRegisteredRef.current = {
          userId: session.user?.id,
          resultId,
        };
        console.log(`✅ [HOOK] ${result.platform === "web" ? "Subscription" : "Token"} registrado en el backend\n`);
      } catch (err) {
        console.error(`❌ [HOOK] Error registrando:`, err);
      }
    })();
  }, [session]);

  // Devolver función para obtener y limpiar el token
  return {
    getToken: () => {
      return tokenRef.current;
    },
    getSubscription: () => {
      return subscriptionRef.current;
    },
    clearToken: () => {
      tokenRef.current = null;
    },
    clearSubscription: () => {
      subscriptionRef.current = null;
    },
  };
}
