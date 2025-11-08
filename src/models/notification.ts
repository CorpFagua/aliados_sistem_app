export type NotificationType = "chat" | "status" | "transfer" | "generic";

export interface NotificationData {
  type: NotificationType;
  title: string;
  message: string;
  metadata?: any; // puede incluir { chatId, orderId, etc. }
}
