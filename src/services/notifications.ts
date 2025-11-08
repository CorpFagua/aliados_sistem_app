import { api, authHeaders } from "../lib/api";

export async function registerPushToken(token: string, platform: string, authToken: string) {
  try {
    const res = await api.post<{ ok: boolean }>("/notifications/register", 
      { token, platform },
      { headers: authHeaders(authToken) }
    );

    if (!res.data.ok) throw new Error("Error al registrar token");
    console.log("✅ Token push registrado correctamente");
  } catch (err: any) {
    console.error("❌ Error registrando token push:", err.message);
  }
}

export async function sendPushNotification(
  userId: string,
  title: string,
  message: string,
  type: string,
  data: any,
  authToken: string
) {
  try {
    const res = await api.post<{ ok: boolean }>("/notifications/send", 
      { userId, title, message, data: { type, ...data } },
      { headers: authHeaders(authToken) }
    );

    if (!res.data.ok) throw new Error("Error enviando notificación");
    console.log("✅ Notificación enviada a", userId);
  } catch (err: any) {
    console.error("❌ Error enviando notificación:", err.message);
  }
}
