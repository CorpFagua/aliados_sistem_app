import { supabase } from "@/lib/supabase";
import { ChatMessage } from "@/models/chat";
import { api, authHeaders } from "../lib/api";

export async function fetchMessages(serviceId: string, token: string): Promise<ChatMessage[]> {
  const res = await api.get(`/chat/${serviceId}`, {
    headers: authHeaders(token),
  });
  return res.data.data as ChatMessage[];
}

export async function sendMessage(
  serviceId: string,
  message: string,
  token: string
): Promise<ChatMessage> {
  const res = await api.post(
    `/chat/${serviceId}/send`,
    { message },
    { headers: authHeaders(token) }
  );
  return res.data.data as ChatMessage;
}

export function subscribeToChat(
  serviceId: string,
  onNewMessage: (msg: ChatMessage) => void
) {
  const channelName = `chat-${serviceId}`;
  console.log(`🟡 Subscribiendo al canal ${channelName}`);

  const channel = supabase
    .channel(channelName)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "service_messages",
        filter: `service_id=eq.${serviceId}`,
      },
      (payload) => {
        console.log("📩 Realtime payload recibido:", payload);
        const newMsg = payload.new as ChatMessage;
        onNewMessage(newMsg);
      }
    )
    .subscribe((status, err) => {
      console.log(`📡 Estado del canal ${channelName}:`, status, err || "");
    });

  channel.on("broadcast", { event: "*" }, (msg) => {
    console.log("🛰 Broadcast:", msg);
  });

  return () => {
    console.log(`🧹 Cerrando canal ${channelName}`);
    supabase.removeChannel(channel);
  };
}

