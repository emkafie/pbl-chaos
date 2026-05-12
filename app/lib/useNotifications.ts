"use client";

import { useState, useEffect } from "react";
import { db } from "@/app/lib/firebase";
import { NotificationService } from "@/app/lib/notificationService";
import { Notification, NotificationSeverity } from "@/types";

interface UseNotificationsOptions {
  role: "admin" | "operator";
}

export function useNotifications({ role }: UseNotificationsOptions) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [sentNotifications, setSentNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Real-time subscription for received notifications (operator)
  useEffect(() => {
    if (role !== "operator") {
      setLoading(false);
      return;
    }

    const unsub = NotificationService.subscribeToNotifications(
      db,
      role,
      "received",
      (notifs) => {
        setNotifications(notifs);
        setLoading(false);
      },
    );

    return () => unsub();
  }, [role]);

  // Real-time subscription for sent notifications (admin)
  useEffect(() => {
    if (role !== "admin") return;

    const unsub = NotificationService.subscribeToNotifications(
      db,
      role,
      "sent",
      (notifs) => {
        setSentNotifications(notifs);
        setLoading(false);
      },
    );

    return () => unsub();
  }, [role]);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const sendNotification = async (
    message: string,
    severity: NotificationSeverity,
  ) => {
    setSending(true);
    setError(null);
    try {
      await NotificationService.sendNotification(
        db,
        message,
        severity,
        "admin",
        "operator",
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : "SEND_FAILED";
      setError(msg);
      throw err;
    } finally {
      setSending(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      await NotificationService.markAsRead(db, notificationId);
    } catch (err) {
      console.error("Failed to mark as read:", err);
    }
  };

  const markAllAsRead = async () => {
    try {
      await NotificationService.markAllAsRead(db, role);
    } catch (err) {
      console.error("Failed to mark all as read:", err);
    }
  };

  return {
    notifications,
    sentNotifications,
    unreadCount,
    loading,
    sending,
    error,
    sendNotification,
    markAsRead,
    markAllAsRead,
  };
}
