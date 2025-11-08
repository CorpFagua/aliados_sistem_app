// src/hooks/useNotifications.ts
import { useEffect, useRef } from "react";
import { Platform, Alert } from "react-native";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import type { EventSubscription } from "expo-notifications";
import Toast from "react-native-toast-message";
import { registerPushToken } from "@/services/notifications";
import type { NotificationData } from "@/models/notification"; 

/**
 * Hook para gestionar notificaciones push.
 * - Registra el token del dispositivo.
 * - Escucha notificaciones en foreground.
 * - Maneja interacciones (cuando el usuario toca la notificación).
 */
export function useNotifications(authToken?: string, enabled = true) {
  const notificationListener = useRef<EventSubscription | null>(null);
  const responseListener = useRef<EventSubscription | null>(null);

 useEffect(() => {
  if (!enabled || !authToken) return;

  (async () => {
    try {
      await registerForPushNotificationsAsync(authToken);
    } catch (err) {
      console.warn("Error registrando notificaciones:", err);
    }
  })();

  // ✅ Notificación recibida (foreground)
  notificationListener.current = Notifications.addNotificationReceivedListener((notification) => {
    const data = notification.request.content.data as unknown as NotificationData;
    handleNotification(data);
  });

  // ✅ Usuario toca la notificación
  responseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
    const data = response.notification.request.content.data as unknown as NotificationData;
    handleNotificationTap(data);
  });

  // ✅ Limpieza moderna (SDK 51+)
  return () => {
    notificationListener.current?.remove();
    responseListener.current?.remove();
  };
}, [authToken, enabled]);

}

/* --------------------------- helpers --------------------------- */

async function registerForPushNotificationsAsync(authToken: string) {
  console.log("🔔 Iniciando registro de notificaciones...");

  if (Platform.OS === "web") {
    console.log("🌐 Web detectada, omitiendo registro.");
    return;
  }

  if (!Device.isDevice) {
    console.log("⚠️ No es un dispositivo físico, no se registrará token.");
    return;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  console.log("📱 Permiso actual:", existingStatus);

  let finalStatus = existingStatus;
  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
    console.log("📝 Nuevo estado de permiso:", finalStatus);
  }

  if (finalStatus !== "granted") {
    console.log("🚫 Permiso denegado.");
    return;
  }

  // 👉 Aquí puedes saber si llega hasta este punto
  const tokenObj = await Notifications.getExpoPushTokenAsync({
    projectId: process.env.EXPO_PUBLIC_PROJECT_ID,
  });
  console.log("✅ Token Expo obtenido:", tokenObj);

  const token = tokenObj.data;
  const platform = Platform.OS === "ios" ? "ios" : "android";

  // ✅ Aquí sabrás si se intenta registrar en backend
  console.log("📤 Enviando token al backend:", { token, platform });

  await registerPushToken(token, platform, authToken);
}


/**
 * Muestra el contenido de la notificación según su tipo.
 */
function handleNotification(data: NotificationData) {
  if (!data) return;
  const { type, title, message } = data;

  switch (type) {
    case "chat":
      Toast.show({ type: "info", text1: title ?? "Nuevo mensaje", text2: message });
      break;
    case "status":
      Toast.show({ type: "success", text1: title ?? "Estado del pedido", text2: message });
      break;
    case "transfer":
      Toast.show({ type: "warning", text1: title ?? "Solicitud de transferencia", text2: message });
      break;
    default:
      Toast.show({ type: "info", text1: title ?? "Notificación", text2: message });
      break;
  }
}

/**
 * Lógica al tocar una notificación (por ejemplo, navegar al pedido o chat).
 */
function handleNotificationTap(data: NotificationData) {
  if (!data) return;
  console.log("👆 Usuario tocó la notificación:", data);

  // Aquí puedes navegar según el tipo o metadata
  // Ejemplo si usas expo-router:
  // const router = useRouter();
  // if (data.type === "chat" && data.metadata?.chatId)
  //   router.push(`/chat/${data.metadata.chatId}`);
}
