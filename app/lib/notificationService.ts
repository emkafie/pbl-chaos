import {
  collection,
  query,
  getDocs,
  addDoc,
  updateDoc,
  doc,
  where,
  orderBy,
  onSnapshot,
  Unsubscribe,
} from "firebase/firestore";
import { Notification, NotificationSeverity } from "@/types";

export const NotificationService = {
  /**
   * Send a notification (admin → operator).
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  sendNotification: async (
    database: any,
    message: string,
    severity: NotificationSeverity,
    senderRole: "admin" | "operator",
    receiverRole: "admin" | "operator",
  ): Promise<Notification> => {
    if (!database) throw new Error("DATABASE_OFFLINE");

    try {
      const notifData = {
        message,
        severity,
        senderRole,
        receiverRole,
        createdAt: new Date().toISOString(),
        isRead: false,
      };

      const docRef = await addDoc(
        collection(database, "notifications"),
        notifData,
      );

      return { id: docRef.id, ...notifData };
    } catch (error) {
      console.error("Error sending notification:", error);
      throw new Error("SEND_NOTIFICATION_FAILED");
    }
  },

  /**
   * Fetch all notifications targeted at a specific role, sorted newest-first.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getNotificationsForRole: async (
    database: any,
    role: "admin" | "operator",
  ): Promise<Notification[]> => {
    if (!database) throw new Error("DATABASE_OFFLINE");

    try {
      const notifsRef = collection(database, "notifications");
      const q = query(
        notifsRef,
        where("receiverRole", "==", role),
        orderBy("createdAt", "desc"),
      );
      const snapshot = await getDocs(q);

      return snapshot.docs.map((d) => ({
        id: d.id,
        message: d.data().message,
        severity: d.data().severity,
        senderRole: d.data().senderRole,
        receiverRole: d.data().receiverRole,
        createdAt: d.data().createdAt,
        isRead: d.data().isRead ?? false,
      }));
    } catch (error) {
      console.error("Error fetching notifications:", error);
      throw new Error("FETCH_NOTIFICATIONS_FAILED");
    }
  },

  /**
   * Fetch all notifications sent BY a specific role (for admin sent-history).
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getNotificationsSentByRole: async (
    database: any,
    role: "admin" | "operator",
  ): Promise<Notification[]> => {
    if (!database) throw new Error("DATABASE_OFFLINE");

    try {
      const notifsRef = collection(database, "notifications");
      const q = query(
        notifsRef,
        where("senderRole", "==", role),
        orderBy("createdAt", "desc"),
      );
      const snapshot = await getDocs(q);

      return snapshot.docs.map((d) => ({
        id: d.id,
        message: d.data().message,
        severity: d.data().severity,
        senderRole: d.data().senderRole,
        receiverRole: d.data().receiverRole,
        createdAt: d.data().createdAt,
        isRead: d.data().isRead ?? false,
      }));
    } catch (error) {
      console.error("Error fetching sent notifications:", error);
      throw new Error("FETCH_SENT_NOTIFICATIONS_FAILED");
    }
  },

  /**
   * Mark a single notification as read.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  markAsRead: async (database: any, notificationId: string): Promise<void> => {
    if (!database) throw new Error("DATABASE_OFFLINE");

    try {
      const notifRef = doc(database, "notifications", notificationId);
      await updateDoc(notifRef, { isRead: true });
    } catch (error) {
      console.error("Error marking notification as read:", error);
      throw new Error("MARK_READ_FAILED");
    }
  },

  /**
   * Mark all unread notifications for a role as read.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  markAllAsRead: async (
    database: any,
    role: "admin" | "operator",
  ): Promise<void> => {
    if (!database) throw new Error("DATABASE_OFFLINE");

    try {
      const notifsRef = collection(database, "notifications");
      const q = query(
        notifsRef,
        where("receiverRole", "==", role),
        where("isRead", "==", false),
      );
      const snapshot = await getDocs(q);

      const updates = snapshot.docs.map((d) =>
        updateDoc(doc(database, "notifications", d.id), { isRead: true }),
      );
      await Promise.all(updates);
    } catch (error) {
      console.error("Error marking all as read:", error);
      throw new Error("MARK_ALL_READ_FAILED");
    }
  },

  /**
   * Subscribe to real-time notification updates for a given role.
   * Returns an unsubscribe function.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  subscribeToNotifications: (
    database: any,
    role: "admin" | "operator",
    direction: "received" | "sent",
    callback: (notifications: Notification[]) => void,
  ): Unsubscribe => {
    const notifsRef = collection(database, "notifications");
    const field = direction === "received" ? "receiverRole" : "senderRole";
    const q = query(
      notifsRef,
      where(field, "==", role),
      orderBy("createdAt", "desc"),
    );

    return onSnapshot(q, (snapshot) => {
      const notifications: Notification[] = snapshot.docs.map((d) => ({
        id: d.id,
        message: d.data().message,
        severity: d.data().severity,
        senderRole: d.data().senderRole,
        receiverRole: d.data().receiverRole,
        createdAt: d.data().createdAt,
        isRead: d.data().isRead ?? false,
      }));
      callback(notifications);
    });
  },
};
