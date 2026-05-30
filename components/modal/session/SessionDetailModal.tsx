"use client";

import React from "react";
import { ParkingSession } from "@/types";
import { X, Clock, DollarSign, Car, MapPin, Tag, Zap } from "lucide-react";

interface SessionDetailModalProps {
  session: ParkingSession | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function SessionDetailModal({
  session,
  isOpen,
  onClose,
}: SessionDetailModalProps) {
  if (!isOpen || !session) return null;

  const formatDateTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleString("id-ID", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
    } catch {
      return dateString;
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      ongoing:
        "bg-yellow-500/20 text-yellow-500 border-yellow-500 border-2 px-3 py-1 font-bold text-xs",
      completed:
        "bg-green-500/20 text-green-500 border-green-500 border-2 px-3 py-1 font-bold text-xs",
      abandoned:
        "bg-red-500/20 text-red-500 border-red-500 border-2 px-3 py-1 font-bold text-xs",
    };
    return (
      <span
        className={
          styles[status] ||
          "bg-gray-500/20 text-gray-500 border-gray-500 border-2 px-3 py-1 font-bold text-xs"
        }
      >
        {status.toUpperCase()}
      </span>
    );
  };

  const getVehicleBadge = (vehicleType: string) => {
    const badgeStyles: Record<string, string> = {
      car: "bg-blue-500/20 text-blue-500",
      motorcycle: "bg-purple-500/20 text-purple-500",
      truck: "bg-orange-500/20 text-orange-500",
      other: "bg-gray-500/20 text-gray-500",
    };
    return badgeStyles[vehicleType] || badgeStyles.other;
  };

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm"
          onClick={onClose}
        />
      )}

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div className="bg-(--color-y2k-bg-main) border-4 border-(--color-y2k-lime) shadow-[8px_8px_0px_0px_var(--color-y2k-purple)] w-full max-w-2xl pointer-events-auto max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b-4 border-(--color-y2k-lime) bg-(--color-y2k-border)/10">
            <h2 className="text-(--color-y2k-lime) font-black text-xl uppercase tracking-wider">
              SESSION_DETAIL
            </h2>
            <button
              onClick={onClose}
              className="text-(--color-y2k-lime) hover:bg-(--color-y2k-lime)/10 p-2 transition-all"
            >
              <X size={24} />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Status & ID Section */}
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div>
                <p className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-2">
                  SESSION_ID
                </p>
                <p className="text-(--color-y2k-lime) font-black font-mono text-sm break-all">
                  {session.id}
                </p>
              </div>
              <div>{getStatusBadge(session.status)}</div>
            </div>

            {/* Main Info Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-(--color-y2k-border)/10 p-4 border-l-4 border-(--color-y2k-lime)">
              {/* RFID UID */}
              <div>
                <div className="flex items-center gap-2 text-gray-500 text-xs font-bold uppercase tracking-wider mb-2">
                  <Zap size={14} />
                  RFID_UID
                </div>
                <p className="text-(--color-y2k-lime) font-mono font-black">
                  {session.rfid_uid}
                </p>
              </div>

              {/* Slot ID */}
              <div>
                <div className="flex items-center gap-2 text-gray-500 text-xs font-bold uppercase tracking-wider mb-2">
                  <MapPin size={14} />
                  SLOT_ID
                </div>
                <p className="text-(--color-y2k-lime) font-mono font-black">
                  {session.slot_id}
                </p>
              </div>

              {/* Vehicle Type */}
              <div>
                <div className="flex items-center gap-2 text-gray-500 text-xs font-bold uppercase tracking-wider mb-2">
                  <Car size={14} />
                  VEHICLE_TYPE
                </div>
                <div
                  className={`${getVehicleBadge(session.vehicle_type)} px-3 py-1 border-2 border-current font-bold text-xs inline-block`}
                >
                  {session.vehicle_type.toUpperCase()}
                </div>
              </div>

              {/* Fee */}
              <div>
                <div className="flex items-center gap-2 text-gray-500 text-xs font-bold uppercase tracking-wider mb-2">
                  <DollarSign size={14} />
                  FEE
                </div>
                <p className="text-(--color-y2k-lime) font-mono font-black text-lg">
                  Rp {session.fee.toLocaleString("id-ID")}
                </p>
              </div>
            </div>

            {/* Time Information */}
            <div className="space-y-4 bg-(--color-y2k-border)/10 p-4 border-l-4 border-(--color-y2k-purple)">
              <div>
                <div className="flex items-center gap-2 text-gray-500 text-xs font-bold uppercase tracking-wider mb-2">
                  <Clock size={14} />
                  CHECK_IN
                </div>
                <p className="text-(--color-y2k-lime) font-mono text-sm">
                  {formatDateTime(session.check_in)}
                </p>
              </div>

              {session.check_out && (
                <div>
                  <div className="flex items-center gap-2 text-gray-500 text-xs font-bold uppercase tracking-wider mb-2">
                    <Clock size={14} />
                    CHECK_OUT
                  </div>
                  <p className="text-(--color-y2k-lime) font-mono text-sm">
                    {formatDateTime(session.check_out)}
                  </p>
                </div>
              )}

              <div className="bg-(--color-y2k-lime)/10 border-l-4 border-(--color-y2k-lime) p-3">
                <p className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-1">
                  DURATION
                </p>
                <p className="text-(--color-y2k-lime) font-black text-2xl">
                  {session.duration_minutes}
                  <span className="text-sm ml-1">MINUTES</span>
                </p>
              </div>
            </div>

            {/* Created At */}
            <div>
              <p className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-2">
                CREATED_AT
              </p>
              <p className="text-(--color-y2k-lime) font-mono text-sm">
                {formatDateTime(session.created_at)}
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="border-t-4 border-(--color-y2k-lime) p-6 bg-(--color-y2k-border)/10 flex gap-4">
            <button
              onClick={onClose}
              className="flex-1 py-3 border-2 border-(--color-y2k-lime) text-(--color-y2k-lime) font-black uppercase hover:bg-(--color-y2k-lime)/10 transition-all"
            >
              CLOSE
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
