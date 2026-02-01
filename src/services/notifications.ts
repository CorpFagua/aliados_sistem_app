import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { api, authHeaders } from "@/lib/api";
import { registerWebPushToken } from "./webNotifications";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function registerPushToken() {
  console.log(`\n📲 [NOTIF] Solicitando permisos de notificaciones...`);

  // En web, usar Web Push API directamente
  if (Platform.OS === "web") {
    console.log(`🌐 [NOTIF] Detectada plataforma web, usando Web Push API...`);
    const subscription = await registerWebPushToken();
    
    if (!subscription) {
      console.warn(`⚠️  [NOTIF] No se pudo obtener subscription web`);
      return null;
    }

    console.log(`✅ [NOTIF] Web subscription obtenida`);
    
    return {
      webSubscription: subscription,
      platform: "web",
    };
  }

  // En plataformas nativas, usar Expo Notifications
  const { status } = await Notifications.requestPermissionsAsync();

  if (status !== "granted") {
    console.warn(`⚠️  [NOTIF] Permisos de notificaciones denegados. Estado: ${status}`);
    return null;
  }

  console.log(`✅ [NOTIF] Permisos concedidos`);

  console.log(`📱 [NOTIF] Obteniendo token del dispositivo (${Platform.OS})...`);
  const { data: token } = await Notifications.getDevicePushTokenAsync();

  console.log(`✅ [NOTIF] Token obtenido: ${token.substring(0, 30)}...`);

  return {
    token,
    platform: Platform.OS,
  };
}

export async function unregisterPushToken(token: string, accessToken: string) {
  try {
    console.log(`\n🗑️  [NOTIF] Eliminando token: ${token.substring(0, 30)}...`);
    
    if (!accessToken) {
      console.error(`❌ [NOTIF] No hay access token disponible`);
      throw new Error("Access token no disponible");
    }

    const headers = {
      "Authorization": `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    };

    console.log(`📤 [NOTIF] Enviando POST a /notifications/delete-token`);
    const response = await api.post(
      "/notifications/delete-token",
      { token },
      { headers }
    );
    
    console.log(`✅ [NOTIF] Token eliminado correctamente\n`);
    return response.data;
  } catch (err: any) {
    console.error(`❌ [NOTIF] Error al eliminar token:`);
    console.error(`   Status: ${err.response?.status}`);
    console.error(`   Mensaje: ${err.message}\n`);
  }
}

export async function unregisterAllPushTokens(accessToken: string) {
  try {
    console.log(`\n🗑️  [NOTIF] Eliminando TODOS los tokens...`);
    
    if (!accessToken) {
      console.error(`❌ [NOTIF] No hay access token disponible`);
      throw new Error("Access token no disponible");
    }

    console.log(`🔑 [NOTIF] Token disponible: ${accessToken.substring(0, 30)}...`);
    console.log(`📤 [NOTIF] Enviando POST a /notifications/delete-all-tokens`);

    const headers = {
      "Authorization": `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    };

    console.log(`🔐 [NOTIF] Headers siendo enviados:`);
    console.log(`   Authorization: Bearer ${accessToken.substring(0, 20)}...`);
    console.log(`   Content-Type: application/json`);

    const response = await api.post(
      "/notifications/delete-all-tokens",
      {},
      { headers }
    );

    console.log(`✅ [NOTIF] Respuesta del servidor:`, response.status, response.data);
    console.log(`✅ [NOTIF] Todos los tokens eliminados\n`);
    
    return response.data;
  } catch (err: any) {
    console.error(`\n❌ [NOTIF] Error al eliminar todos los tokens:`);
    console.error(`   Tipo de error: ${err.name}`);
    console.error(`   Status HTTP: ${err.response?.status || "N/A"}`);
    console.error(`   Mensaje: ${err.message}`);
    
    if (err.response?.data) {
      console.error(`   Response Data:`, JSON.stringify(err.response.data));
    }
    
    if (err.response?.headers) {
      console.error(`   Response Headers:`, JSON.stringify(err.response.headers));
    }

    console.error(`\n`);
    
    // No re-lanzar el error para que el logout continúe
    throw err;
  }
}

