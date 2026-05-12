"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  AlertTriangle,
  AlertCircle,
  Info,
  Send,
  CheckCircle2,
  Bell,
  Clock,
  Shield,
} from "lucide-react";
import Y2KCard from "../ui/Y2KCard";
import { useNotifications } from "@/app/lib/useNotifications";
import { Notification, NotificationSeverity } from "@/types";

interface NotificationsModalProps {
  onClose: () => void;
  role: "admin" | "operator";
}

/* ─── severity config ──────────────────────────────────────────── */
const SEVERITY_CONFIG: Record<
  NotificationSeverity,
  {
    color: string;
    bg: string;
    border: string;
    icon: React.ReactNode;
    label: string;
    pulse?: boolean;
  }
> = {
  low: {
    color: "text-[#C4FF4D]",
    bg: "bg-[#C4FF4D]/10",
    border: "border-[#C4FF4D]",
    icon: <Info size={16} strokeWidth={3} />,
    label: "LOW",
  },
  moderate: {
    color: "text-yellow-400",
    bg: "bg-yellow-400/10",
    border: "border-yellow-400",
    icon: <AlertCircle size={16} strokeWidth={3} />,
    label: "MODERATE",
  },
  critical: {
    color: "text-red-400",
    bg: "bg-red-400/10",
    border: "border-red-400",
    icon: <AlertTriangle size={16} strokeWidth={3} />,
    label: "CRITICAL",
    pulse: true,
  },
};

/* ─── timestamp formatter ──────────────────────────────────────── */
function formatTimestamp(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);

  if (diffMin < 1) return "JUST_NOW";
  if (diffMin < 60) return `${diffMin}m_AGO`;

  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h_AGO`;

  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 7) return `${diffDay}d_AGO`;

  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/* ════════════════════════════════════════════════════════════════
   OPERATOR: Notification Item
   ════════════════════════════════════════════════════════════════ */
function OperatorNotificationItem({
  notif,
  isLatest,
  onAcknowledge,
}: {
  notif: Notification;
  isLatest: boolean;
  onAcknowledge: (id: string) => void;
}) {
  const sev = SEVERITY_CONFIG[notif.severity];

  return (
    <div
      className={`relative border-2 transition-all ${sev.border} ${sev.bg} ${
        !notif.isRead
          ? "shadow-[3px_3px_0px_0px_rgba(186,140,255,0.6)]"
          : "opacity-70"
      } ${isLatest ? "p-4 sm:p-5" : "p-3 sm:p-4"}`}
    >
      {/* Unread indicator bar */}
      {!notif.isRead && (
        <div className="absolute top-0 left-0 w-1 h-full bg-[#BA8CFF]" />
      )}

      {/* Header row */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className={`flex items-center gap-2 ${sev.color}`}>
          <span className={sev.pulse ? "animate-pulse" : ""}>{sev.icon}</span>
          <span className="text-[10px] font-black uppercase tracking-[0.15em]">
            ALERT_{sev.label}
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-gray-500">
          <Clock size={10} />
          <span className="text-[9px] font-bold uppercase tracking-wider">
            {formatTimestamp(notif.createdAt)}
          </span>
        </div>
      </div>

      {/* Message */}
      <p
        className={`${
          isLatest ? "text-xs sm:text-sm" : "text-[11px]"
        } text-gray-300 font-bold uppercase tracking-tight leading-relaxed`}
      >
        {notif.message}
      </p>

      {/* Status / Acknowledge */}
      <div className="flex items-center justify-between mt-3">
        <div className="flex items-center gap-1.5">
          <Shield size={10} className="text-gray-600" />
          <span className="text-[9px] text-gray-600 font-bold uppercase tracking-wider">
            FROM_{notif.senderRole}_NODE
          </span>
        </div>

        {!notif.isRead ? (
          <button
            onClick={() => notif.id && onAcknowledge(notif.id)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#C4FF4D] text-[#1A1A1A] border border-[#1A1A1A] text-[9px] font-black uppercase tracking-wider hover:shadow-[2px_2px_0px_0px_#BA8CFF] hover:translate-x-0.5 hover:translate-y-0.5 transition-all active:scale-95"
          >
            <CheckCircle2 size={10} strokeWidth={3} />
            ACK
          </button>
        ) : (
          <span className="flex items-center gap-1 text-[9px] text-green-500/70 font-bold uppercase tracking-wider">
            <CheckCircle2 size={10} />
            ACKNOWLEDGED
          </span>
        )}
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   ADMIN: Sent Notification Item
   ════════════════════════════════════════════════════════════════ */
function AdminSentItem({ notif }: { notif: Notification }) {
  const sev = SEVERITY_CONFIG[notif.severity];

  return (
    <div className={`border-l-4 ${sev.border} ${sev.bg} px-3 py-2.5`}>
      <div className="flex items-center justify-between gap-2 mb-1">
        <div className={`flex items-center gap-1.5 ${sev.color}`}>
          {sev.icon}
          <span className="text-[9px] font-black uppercase tracking-wider">
            {sev.label}
          </span>
        </div>
        <span className="text-[9px] text-gray-500 font-bold uppercase">
          {formatTimestamp(notif.createdAt)}
        </span>
      </div>
      <p className="text-[11px] text-gray-300 font-bold uppercase tracking-tight leading-relaxed">
        {notif.message}
      </p>
      <div className="flex items-center gap-1.5 mt-1.5">
        <span className="text-[9px] text-gray-600 font-bold uppercase tracking-wider">
          → OPERATOR_BROADCAST
        </span>
        {notif.isRead ? (
          <span className="text-[9px] text-green-500/70 font-bold">
            [READ]
          </span>
        ) : (
          <span className="text-[9px] text-yellow-400/70 font-bold">
            [UNREAD]
          </span>
        )}
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   MAIN: NotificationsModal
   ════════════════════════════════════════════════════════════════ */
export default function NotificationsModal({
  onClose,
  role,
}: NotificationsModalProps) {
  const {
    notifications,
    sentNotifications,
    unreadCount,
    loading,
    sending,
    error,
    sendNotification,
    markAsRead,
    markAllAsRead,
  } = useNotifications({ role });

  /* Admin compose state */
  const [message, setMessage] = useState("");
  const [severity, setSeverity] = useState<NotificationSeverity>("low");
  const [sendSuccess, setSendSuccess] = useState(false);

  /* Mark all as read on modal open (operator) */
  useEffect(() => {
    if (role === "operator" && unreadCount > 0) {
      markAllAsRead();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSend = async () => {
    if (!message.trim()) return;
    try {
      await sendNotification(message.trim(), severity);
      setMessage("");
      setSeverity("low");
      setSendSuccess(true);
      setTimeout(() => setSendSuccess(false), 2000);
    } catch {
      // error is set in hook
    }
  };

  const handleAcknowledge = async (id: string) => {
    await markAsRead(id);
  };

  const latestNotif =
    role === "operator" && notifications.length > 0
      ? notifications[0]
      : null;

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center p-4 md:p-6">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        style={{ animation: "notifFadeIn 0.2s ease-out" }}
        onClick={onClose}
      />

      {/* Modal Container */}
      <div
        className="relative w-full max-w-xl max-h-[85vh] flex flex-col"
        style={{ animation: "notifSlideUp 0.25s ease-out" }}
      >
        <Y2KCard
          title={
            role === "operator"
              ? "SYSTEM_ALERTS://INCOMING"
              : "BROADCAST://SEND_ALERT"
          }
          icon={Bell}
          variant={role === "operator" ? "purple" : "lime"}
          className="shadow-[10px_10px_0px_0px_#BA8CFF] mb-0 flex flex-col overflow-hidden"
        >
          {/* ─── OPERATOR VIEW ──────────────────────────────── */}
          {role === "operator" && (
            <div className="flex flex-col gap-4 overflow-hidden">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-[#BA8CFF] animate-pulse" />
                    <span className="text-[11px] text-gray-500 font-bold uppercase tracking-widest">
                      SCANNING_ALERT_FEED...
                    </span>
                  </div>
                </div>
              ) : notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 gap-3">
                  <CheckCircle2
                    size={32}
                    className="text-[#C4FF4D] opacity-50"
                  />
                  <span className="text-[11px] text-gray-500 font-bold uppercase tracking-widest">
                    NO_ALERTS_IN_QUEUE
                  </span>
                </div>
              ) : (
                <>
                  {/* Latest notification — prominent display */}
                  {latestNotif && (
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-1.5 h-1.5 bg-[#C4FF4D] animate-pulse" />
                        <span className="text-[9px] text-[#C4FF4D] font-black uppercase tracking-[0.2em]">
                          LATEST_ALERT
                        </span>
                      </div>
                      <OperatorNotificationItem
                        notif={latestNotif}
                        isLatest={true}
                        onAcknowledge={handleAcknowledge}
                      />
                    </div>
                  )}

                  {/* History log */}
                  {notifications.length > 1 && (
                    <div className="flex flex-col gap-2 overflow-hidden">
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] text-gray-500 font-black uppercase tracking-[0.2em]">
                          ALERT_HISTORY_LOG
                        </span>
                        <div className="flex-1 h-px bg-[#4D4D4D]" />
                        <span className="text-[9px] text-gray-600 font-bold">
                          [{notifications.length - 1}]
                        </span>
                      </div>
                      <div className="overflow-y-auto max-h-[35vh] space-y-2 pr-1 scrollbar-thin">
                        {notifications.slice(1).map((n) => (
                          <OperatorNotificationItem
                            key={n.id}
                            notif={n}
                            isLatest={false}
                            onAcknowledge={handleAcknowledge}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* ─── ADMIN VIEW ─────────────────────────────────── */}
          {role === "admin" && (
            <div className="flex flex-col gap-5 overflow-hidden">
              {/* Compose Area */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 mb-1">
                  <Send size={12} className="text-[#C4FF4D]" />
                  <span className="text-[9px] text-[#C4FF4D] font-black uppercase tracking-[0.2em]">
                    COMPOSE_BROADCAST
                  </span>
                </div>

                {/* Textarea */}
                <textarea
                  id="notification-message-input"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="ENTER_SYSTEM_MESSAGE..."
                  maxLength={500}
                  rows={3}
                  className="w-full bg-[#0D0D0D] border-2 border-[#4D4D4D] text-white text-xs font-bold uppercase tracking-tight p-3 resize-none focus:outline-none focus:border-[#C4FF4D] transition-colors placeholder:text-gray-600 placeholder:italic"
                />

                {/* Severity selector */}
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[9px] text-gray-500 font-bold uppercase tracking-wider mr-1">
                    SEVERITY:
                  </span>
                  {(
                    Object.keys(SEVERITY_CONFIG) as NotificationSeverity[]
                  ).map((sev) => {
                    const cfg = SEVERITY_CONFIG[sev];
                    const isActive = severity === sev;
                    return (
                      <button
                        key={sev}
                        onClick={() => setSeverity(sev)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 border-2 text-[9px] font-black uppercase tracking-wider transition-all ${
                          isActive
                            ? `${cfg.border} ${cfg.bg} ${cfg.color} shadow-[2px_2px_0px_0px_rgba(186,140,255,0.5)]`
                            : "border-[#4D4D4D] text-gray-500 hover:text-gray-300 hover:border-gray-400"
                        }`}
                      >
                        {cfg.icon}
                        {cfg.label}
                      </button>
                    );
                  })}
                </div>

                {/* Send button */}
                <button
                  id="notification-send-btn"
                  onClick={handleSend}
                  disabled={!message.trim() || sending}
                  className={`w-full flex items-center justify-center gap-2 py-3 border-2 border-[#1A1A1A] font-black uppercase text-xs tracking-widest transition-all ${
                    !message.trim() || sending
                      ? "bg-[#4D4D4D]/30 text-gray-600 cursor-not-allowed"
                      : "bg-[#C4FF4D] text-[#1A1A1A] shadow-[4px_4px_0px_0px_#BA8CFF] hover:shadow-none hover:translate-x-1 hover:translate-y-1 active:scale-[0.98]"
                  }`}
                >
                  {sending ? (
                    <>
                      <div className="w-3 h-3 border-2 border-gray-500 border-t-transparent animate-spin" />
                      TRANSMITTING...
                    </>
                  ) : sendSuccess ? (
                    <>
                      <CheckCircle2 size={14} strokeWidth={3} />
                      BROADCAST_SENT
                    </>
                  ) : (
                    <>
                      <Send size={14} strokeWidth={3} />
                      SEND_BROADCAST
                    </>
                  )}
                </button>

                {error && (
                  <div className="flex items-center gap-2 text-red-400 bg-red-400/10 border border-red-400/40 px-3 py-2">
                    <AlertTriangle size={12} />
                    <span className="text-[10px] font-bold uppercase">
                      ERR: {error}
                    </span>
                  </div>
                )}
              </div>

              {/* Sent History */}
              {sentNotifications.length > 0 && (
                <div className="flex flex-col gap-2 overflow-hidden">
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] text-gray-500 font-black uppercase tracking-[0.2em]">
                      SENT_LOG
                    </span>
                    <div className="flex-1 h-px bg-[#4D4D4D]" />
                    <span className="text-[9px] text-gray-600 font-bold">
                      [{sentNotifications.length}]
                    </span>
                  </div>
                  <div className="overflow-y-auto max-h-[30vh] space-y-2 pr-1 scrollbar-thin">
                    {sentNotifications.map((n) => (
                      <AdminSentItem key={n.id} notif={n} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </Y2KCard>

        {/* Close Button Pin */}
        <button
          onClick={onClose}
          aria-label="close notifications"
          className="absolute -top-3 -right-3 bg-[#BA8CFF] text-[#1A1A1A] p-2 border-2 border-[#1A1A1A] shadow-[2px_2px_0px_0px_#C4FF4D] hover:scale-110 active:scale-95 transition-all z-10"
        >
          <X size={16} strokeWidth={3} />
        </button>
      </div>

      {/* Animation keyframes */}
      <style jsx>{`
        @keyframes notifFadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        @keyframes notifSlideUp {
          from {
            opacity: 0;
            transform: translateY(16px) scale(0.97);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        .scrollbar-thin::-webkit-scrollbar {
          width: 4px;
        }
        .scrollbar-thin::-webkit-scrollbar-track {
          background: #1a1a1a;
        }
        .scrollbar-thin::-webkit-scrollbar-thumb {
          background: #4d4d4d;
        }
        .scrollbar-thin::-webkit-scrollbar-thumb:hover {
          background: #ba8cff;
        }
      `}</style>
    </div>
  );
}
