import { useState, useEffect, useCallback } from "react";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "@/app/lib/firebase";
import { ParkingSlot } from "@/types";

/**
 * useParkingSlots
 * ---------------
 * Fetches parking slot data from Firestore with a single one-time read (getDocs).
 *
 * ❌ REMOVED: onSnapshot live listener — was keeping a persistent WebSocket open
 *             and billing a Firestore read for every IoT write to any slot doc.
 *
 * ✅ NOW: One getDocs on mount + explicit refresh() function exposed to the UI.
 *         Slots only have 12 documents (A01–C04), so this is cheap even when
 *         re-fetched manually.
 */
export const useParkingSlots = () => {
  const [slots, setSlots] = useState<ParkingSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSlots = useCallback(async () => {
    if (!db) return;
    setLoading(true);
    setError(null);

    try {
      const slotsRef = collection(db, "parking_slots");
      const q = query(slotsRef, orderBy("id"));
      const snapshot = await getDocs(q);

      const slotsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as ParkingSlot[];

      setSlots(slotsData);
    } catch (err) {
      console.error("Firestore getDocs Error (parking_slots):", err);
      setError("Gagal mengambil data slot parkir.");
    } finally {
      setLoading(false);
    }
  }, []);

  // Single read on mount — no persistent listener
  useEffect(() => {
    fetchSlots();
  }, [fetchSlots]);

  // Stats derived from state — recalculated only when slots changes
  const totalSlots = slots.length;
  const availableSlots = slots.filter((s) => s.status === "available").length;
  const occupiedSlots = slots.filter((s) => s.status === "occupied").length;
  const occupancyRate =
    totalSlots > 0 ? (occupiedSlots / totalSlots) * 100 : 0;

  return {
    slots,
    loading,
    error,
    totalSlots,
    availableSlots,
    occupiedSlots,
    occupancyRate,
    /** Call this to manually re-fetch slot data from Firestore */
    refresh: fetchSlots,
  };
};