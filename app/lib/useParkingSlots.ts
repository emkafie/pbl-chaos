import { useState, useEffect } from "react";
import { collection, onSnapshot, query, orderBy, doc, updateDoc } from "firebase/firestore";
import { db } from "@/app/lib/firebase";
import { ParkingSlot, SlotStatus } from "@/types";

/**
 * Custom Hook untuk mengambil data slot parkir secara real-time.
 * Memisahkan logika sinkronisasi data dari komponen UI.
 */
export const useParkingSlots = () => {
  const [slots, setSlots] = useState<ParkingSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!db) return;

    const slotsRef = collection(db, "parking_slots");
    const q = query(slotsRef, orderBy("id"));

    // Menjalankan onSnapshot (Live Listener)
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const slotsData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as ParkingSlot[];

        setSlots(slotsData);
        setLoading(false);
      },
      (err) => {
        console.error("Firestore Sync Error:", err);
        setError("Gagal menyinkronkan data dari cloud.");
        setLoading(false);
      }
    );

    // Cleanup listener saat komponen tidak digunakan
    return () => unsubscribe();
  }, []);

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
  const maintenanceSlots = slots.filter((s) => s.status === "maintenance").length;
  const occupancyRate = totalSlots > 0 ? (occupiedSlots / totalSlots) * 100 : 0;

  return { slots, loading, error, totalSlots, availableSlots, occupiedSlots, maintenanceSlots, occupancyRate };
};


// Function untuk mengubah status slot parkir secara manual. Digunakan untuk debug atau ketika sistem otomatis (IR sensor) trouble.
// @param slotId - ID slot parkir (misal "SLOT_A1")
// @param newStatus - Status baru: 'available' | 'occupied' | 'maintenance'
export const updateSlotStatus = async (slotId: string, newStatus: SlotStatus): Promise<void> => {
  if (!db) {
    throw new Error("Firestore belum terinisialisasi.");
  }

  const slotRef = doc(db, "parking_slots", slotId);
  await updateDoc(slotRef, { status: newStatus });
  console.log(`[MANUAL] Slot ${slotId} → ${newStatus}`);
};