import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db, appId } from '@/app/lib/firebase';
import { ParkingSlot, SlotStatus } from '@/types';

/**
 * Custom Hook untuk mengambil data slot parkir secara real-time dari Firestore.
 * Dilengkapi dengan auto-calculation metrik statistik untuk UI dashboard.
 */
export const useParkingSlots = () => {
  const [slots, setSlots] = useState<ParkingSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fungsi untuk refresh manual via tombol UI
  const fetchSlotsManual = async () => {
    try {
      setLoading(true);
      const slotsRef = collection(db, "parking_slots");
      const q = query(slotsRef, orderBy("id"));
      const snapshot = await getDocs(q);
      const slotsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ParkingSlot[];
      setSlots(slotsData);
      setLoading(false);
    } catch (err) {
      console.error("Gagal melakukan refresh manual:", err);
      setError("Gagal memperbarui data slot.");
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!db || !appId) return;

    const slotsRef = collection(db, "parking_slots");
    const q = query(slotsRef, orderBy("id"));

    // Menjalankan onSnapshot (Live Listener dari Firestore)
    const unsubscribe = onSnapshot(
      q, 
      (snapshot) => {
        const slotsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
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

    // Cleanup listener saat komponen unmount
    return () => unsubscribe();
  }, []);

  // --- LOGIKA AGREGASI DATA UNTUK STATS CARD ---
  const totalSlots = slots.length || 4; // fallback ke 4 jika data cloud kosong saat inisialisasi
  const availableSlots = slots.filter(s => s.status === 'available').length;
  const occupiedSlots = slots.filter(s => s.status === 'occupied').length;
  const maintenanceSlots = slots.filter(s => s.status === 'maintenance').length;
  const occupancyRate = totalSlots > 0 ? Math.round((occupiedSlots / totalSlots) * 100) : 0;

  return { 
    slots, 
    loading, 
    error,
    totalSlots,
    availableSlots,
    occupiedSlots,
    maintenanceSlots,
    occupancyRate,
    refresh: fetchSlotsManual
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