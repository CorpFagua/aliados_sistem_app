/**
 * 🌐 Servicio para notificaciones push en navegadores web
 * Requiere que el navegador soporte Service Workers y Push API
 */

const VAPID_PUBLIC_KEY = process.env.EXPO_PUBLIC_VAPID_PUBLIC_KEY;

export async function registerWebPushToken(): Promise<PushSubscription | null> {
  // Verificar soporte del navegador
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
    console.warn(`⚠️  [WEB-NOTIF] El navegador no soporta Service Workers o Push API`);
    return null;
  }

  if (!VAPID_PUBLIC_KEY) {
    console.error(`❌ [WEB-NOTIF] VAPID_PUBLIC_KEY no configurada`);
    return null;
  }

  try {
    console.log(`\n🌐 [WEB-NOTIF] Registrando Service Worker...`);

    // Registrar Service Worker
    const registration = await navigator.serviceWorker.register("/sw.js", {
      scope: "/",
    });

    console.log(`✅ [WEB-NOTIF] Service Worker registrado exitosamente`);

    // Solicitar permisos de notificaciones
    console.log(`🔔 [WEB-NOTIF] Solicitando permisos de notificaciones...`);
    const permission = await Notification.requestPermission();

    if (permission !== "granted") {
      console.warn(`⚠️  [WEB-NOTIF] Permisos de notificaciones denegados. Estado: ${permission}`);
      return null;
    }

    console.log(`✅ [WEB-NOTIF] Permisos concedidos`);

    // Obtener subscription de push
    console.log(`🔐 [WEB-NOTIF] Obteniendo push subscription...`);
    let subscription = await registration.pushManager.getSubscription();

    if (!subscription) {
      console.log(`➕ [WEB-NOTIF] No hay subscription existente, creando una nueva...`);
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY) as BufferSource,
      });
      console.log(`✅ [WEB-NOTIF] Subscription creada exitosamente`);
    } else {
      console.log(`♻️  [WEB-NOTIF] Subscription existente encontrada`);
    }

    console.log(`✅ [WEB-NOTIF] Push subscription obtenida`);
    return subscription;
  } catch (err) {
    console.error(`❌ [WEB-NOTIF] Error registrando web push:`, err);
    return null;
  }
}

export async function unregisterWebPush(accessToken: string): Promise<void> {
  if (!("serviceWorker" in navigator)) {
    console.warn(`⚠️  [WEB-NOTIF] El navegador no soporta Service Workers`);
    return;
  }

  try {
    console.log(`\n🌐 [WEB-NOTIF] Eliminando subscription de push...`);

    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();

    if (subscription) {
      await subscription.unsubscribe();
      console.log(`✅ [WEB-NOTIF] Subscription eliminada localmente`);
    }

    // Notificar al backend para eliminar SOLO la subscription web de esta sesión
    console.log(`📤 [WEB-NOTIF] Notificando al backend para eliminar solo web push de esta sesión...`);
    
    // Usar axios para que pase por el middleware de autenticación
    const { api, authHeaders } = await import("@/lib/api");
    
    try {
      const response = await api.post(
        "/notifications/delete-web-push",
        {},
        { headers: authHeaders(accessToken) }
      );
      
      console.log(`✅ [WEB-NOTIF] Web push eliminado en el backend\n`);
    } catch (apiError: any) {
      console.error(`❌ [WEB-NOTIF] Error en petición al backend:`, apiError.response?.data || apiError.message);
      throw apiError;
    }
  } catch (err) {
    console.error(`❌ [WEB-NOTIF] Error durante unsubscribe:`, err);
  }
}

/**
 * Convertir VAPID key desde Base64 a Uint8Array
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/\-/g, "+").replace(/_/g, "/");

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray;
}
