import { useState, useEffect, useCallback } from "react";
import {
  collection,
  onSnapshot,
  query,
  orderBy,
  doc,
  updateDoc,
  getDocs,
} from "firebase/firestore";
import { db } from "@/app/lib/firebase";
import { ParkingSlot, SlotStatus } from "@/types";

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

  useEffect(() => {
    fetchSlots();
  }, [fetchSlots]);

  /*
   * ============================================================
   * IR SENSOR AUTO-UPDATE (Uncomment untuk mengaktifkan)
   * ============================================================
   * Kode di bawah ini akan mendengarkan sinyal IR sensor
   * melalui Firestore collection "ir_sensor_signals".
   * Setiap dokumen memiliki field:
   *   - slot_id: string (ID slot parkir, misal "SLOT_A1")
   *   - signal: number (1 = occupied, 0 = available)
   *
   * Ketika sinyal berubah, status slot akan otomatis di-update.
   * CATATAN: Slot dengan status "maintenance" TIDAK akan di-update
   * oleh IR sensor — hanya bisa diubah secara manual.
   * ============================================================
   */
  /*
  useEffect(() => {
    if (!db) return;

    const sensorRef = collection(db, "ir_sensor_signals");
    const unsubscribeSensor = onSnapshot(sensorRef, (snapshot) => {
      snapshot.docChanges().forEach(async (change) => {
        if (change.type === "modified" || change.type === "added") {
          const data = change.doc.data();
          const slotId = data.slot_id as string;
          const signal = data.signal as number;

          // Cek apakah slot sedang dalam mode maintenance
          const currentSlot = slots.find((s) => s.id === slotId);
          if (currentSlot && currentSlot.status === "maintenance") {
            // Slot maintenance tidak boleh diubah oleh sensor
            console.log(`[IR_SENSOR] Slot ${slotId} dalam mode MAINTENANCE, sinyal diabaikan.`);
            return;
          }

          // 1 = occupied, 0 = available
          const newStatus: SlotStatus = signal === 1 ? "occupied" : "available";

          try {
            const slotRef = doc(db, "parking_slots", slotId);
            await updateDoc(slotRef, { status: newStatus });
            console.log(`[IR_SENSOR] Slot ${slotId} → ${newStatus} (signal: ${signal})`);
          } catch (err) {
            console.error(`[IR_SENSOR] Gagal update slot ${slotId}:`, err);
          }
        }
      });
    });

    return () => unsubscribeSensor();
  }, [slots]);
  */

  // Stats dihitung langsung dari state slots — otomatis update setiap kali slots berubah
  const totalSlots = slots.length;
  const availableSlots = slots.filter((s) => s.status === "available").length;
  const occupiedSlots = slots.filter((s) => s.status === "occupied").length;
  const maintenanceSlots = slots.filter(
    (s) => s.status === "maintenance",
  ).length;
  const occupancyRate = totalSlots > 0 ? (occupiedSlots / totalSlots) * 100 : 0;

  return {
    slots,
    loading,
    error,
    totalSlots,
    availableSlots,
    occupiedSlots,
    maintenanceSlots,
    occupancyRate,
    refresh: fetchSlots,
  };
};

// Function untuk mengubah status slot parkir secara manual. Digunakan untuk debug atau ketika sistem otomatis (IR sensor) trouble.
// @param slotId - ID slot parkir (misal "SLOT_A1")
// @param newStatus - Status baru: 'available' | 'occupied' | 'maintenance'
export const updateSlotStatus = async (
  slotId: string,
  newStatus: SlotStatus,
): Promise<void> => {
  if (!db) {
    throw new Error("Firestore belum terinisialisasi.");
  }

  const slotRef = doc(db, "parking_slots", slotId);
  await updateDoc(slotRef, { status: newStatus });
  console.log(`[MANUAL] Slot ${slotId} → ${newStatus}`);
};