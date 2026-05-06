import { useState, useEffect } from "react";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { db } from "@/app/lib/firebase";
import { ParkingSlot } from "@/types";

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

  // Stats dihitung langsung dari state slots — otomatis update setiap kali slots berubah
  const totalSlots = slots.length;
  const availableSlots = slots.filter((s) => s.status === "available").length;
  const occupiedSlots = slots.filter((s) => s.status === "occupied").length;
  const occupancyRate = totalSlots > 0 ? (occupiedSlots / totalSlots) * 100 : 0;

  return { slots, loading, error, totalSlots, availableSlots, occupiedSlots, occupancyRate };
};