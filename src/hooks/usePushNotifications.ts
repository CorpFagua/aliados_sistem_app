import { useEffect } from "react";
import { registerPushToken } from "../services/notifications";
import { api, authHeaders } from "../lib/api";

export function usePushRegistration(session: any) {
  useEffect(() => {
    if (!session?.access_token) return;

    (async () => {
      const t = await registerPushToken();
      if (!t) return;

      await api.post(
        "/notifications/register-token",
        t,
        { headers: authHeaders(session.access_token) }
      );
    })();
  }, [session]);
}
