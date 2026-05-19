import { useState, useEffect, useRef } from 'react';
import mqtt from 'mqtt';
import { db, appId } from '@/app/lib/firebase';
import { 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  updateDoc, 
  serverTimestamp 
} from 'firebase/firestore';
import { ParkingSlot } from '@/types';

// Menggunakan port WebSocket aman EMQX Broker Publik
const MQTT_BROKER_URL = 'wss://broker.emqx.io:8084/mqtt';

export const useMqttParking = () => {
  // Inisialisasi 4 slot fisik dari ESP32 Slot Monitor Anda
  const [slots, setSlots] = useState<ParkingSlot[]>([
    { id: "A01", status: "available"},
    { id: "A02", status: "available"},
    { id: "A03", status: "available"},
    { id: "A04", status: "available"},
  ]);

  // State real-time dari ESP32 Gate Controller
  const [rfidActive, setRfidActive] = useState<number>(0);
  const [gateMasuk, setGateMasuk] = useState<string>("TUTUP");
  const [gateKeluar, setGateKeluar] = useState<string>("TUTUP");
  const [gateOnline, setGateOnline] = useState<boolean>(false);
  const [activeVehicles, setActiveVehicles] = useState<string[]>([]);
  const [connected, setConnected] = useState<boolean>(false);
  const [lastLog, setLastLog] = useState<string>("Sistem siap menerima transmisi dari alat...");

  useEffect(() => {
    console.log("⚡ Menghubungkan ke Broker EMQX via WebSockets...");
    const client = mqtt.connect(MQTT_BROKER_URL, {
      clean: true,
      connectTimeout: 5000,
    });

    client.on('connect', () => {
      setConnected(true);
      setLastLog("CONNECTED_TO_MQTT_BROKER");
      
      // Subscribe ke topik sensor slot individu (dari ESP32 Slot Monitor)
      client.subscribe('parking/slot/+');
      // Subscribe ke semua topik gate (status, event, dan lwt dari ESP32 Gate)
      client.subscribe('parking/gate/status');
      client.subscribe('parking/gate/event');
      client.subscribe('parking/gate/lwt');
    });

    client.on('message', async (topic, message) => {
      const payloadString = message.toString();

      try {
        // =====================================================================
        // 1. EVENT DEVICE ONLINE/OFFLINE (LWT)
        // =====================================================================
        if (topic === 'parking/gate/lwt') {
          const lwtData = JSON.parse(payloadString);
          setGateOnline(lwtData.status === 'online');
          setLastLog(`GATE_CONTROLLER_STATUS: ${lwtData.status.toUpperCase()}`);
        }

        // =====================================================================
        // 2. PERIODIC STATUS HEARTBEAT (Hanya untuk UI, TIDAK disimpan ke DB)
        // =====================================================================
        else if (topic === 'parking/gate/status') {
          const statusData = JSON.parse(payloadString);
          
          setRfidActive(statusData.slot_counter);
          setGateMasuk(statusData.gate_masuk);
          setGateKeluar(statusData.gate_keluar);
          setActiveVehicles(statusData.kendaraan_dalam || []);
          setGateOnline(true); // Selama mengirim heartbeat, berarti online
        }

        // =====================================================================
        // 3. ACTION EVENT (Transaksi Masuk/Keluar -> Tulis ke Firestore)
        // =====================================================================
        else if (topic === 'parking/gate/event') {
          const eventData = JSON.parse(payloadString);
          const { event, uid } = eventData;

          const nowIso = new Date().toISOString();

          // --- EVENT: MASUK_DIIZINKAN ---
          if (event === 'MASUK_DIIZINKAN') {
            setLastLog(`ACCESS_GRANTED: UID ${uid} masuk gerbang.`);

            if (db && appId) {
              const sessionPath = `artifacts/${appId}/public/data/sessions`;
              
              // Buat dokumen baru dengan status "ongoing"
              await addDoc(collection(db, sessionPath), {
                rfid_uid: uid,
                vehicle_type: "car",
                slot_id: "PENDING_SENSOR", // Slot fisik akan dideteksi oleh ESP32 Slot nanti
                check_in: nowIso,
                check_out: null,
                duration_minutes: 0,
                fee: 0,
                status: "ongoing",
                created_at: serverTimestamp()
              });
              
              setLastLog(`DATABASE_WRITE: Sesi ongoing dibuat untuk UID ${uid}`);
            }
          } 
          
          // --- EVENT: KELUAR_DIIZINKAN ---
          else if (event === 'KELUAR_DIIZINKAN') {
            setLastLog(`ACCESS_GRANTED: UID ${uid} keluar gerbang.`);

            if (db && appId) {
              const sessionPath = `artifacts/${appId}/public/data/sessions`;
              
              // Tarik koleksi sessions untuk mencari sesi ongoing milik UID ini
              // Sesuai RULE 2: Ambil data sederhana lalu filter di memori JavaScript
              const querySnapshot = await getDocs(collection(db, sessionPath));
              let ongoingDocId = null;
              let checkInTime = null;

              querySnapshot.forEach((doc) => {
                const data = doc.data();
                if (data.rfid_uid === uid && data.status === "ongoing") {
                  ongoingDocId = doc.id;
                  checkInTime = data.check_in;
                }
              });

              if (ongoingDocId && checkInTime) {
                const checkOutTime = nowIso;
                
                // Hitung durasi dan tarif parkir (asumsi Rp 5.000 / jam)
                const durationMs = new Date(checkOutTime).getTime() - new Date(checkInTime).getTime();
                const durationMinutes = Math.max(1, Math.round(durationMs / 60000));
                const hourlyRate = 5000;
                const fee = Math.ceil(durationMinutes / 60) * hourlyRate;

                // Update dokumen yang lama menjadi selesai (completed)
                const docRef = doc(db, sessionPath, ongoingDocId);
                await updateDoc(docRef, {
                  status: "completed",
                  check_out: checkOutTime,
                  duration_minutes: durationMinutes,
                  fee: fee
                });

                setLastLog(`DATABASE_UPDATE: Sesi UID ${uid} selesai. Biaya: Rp ${fee}`);
              } else {
                setLastLog(`⚠️ Warning: Sesi masuk untuk UID ${uid} tidak ditemukan di DB.`);
              }
            }
          }
        }

        // =====================================================================
        // 4. PENANGANAN SENSOR INDIVIDU (Dari ESP32 Slot Monitor)
        // =====================================================================
        else if (topic.startsWith('parking/slot/')) {
          // Mengambil angka slot dari akhir topik (misal: "parking/slot/1" -> 1)
          const topicParts = topic.split('/');
          const slotNumStr = topicParts[topicParts.length - 1];
          
          // Validasi jika bagian akhir topik adalah angka murni
          if (!isNaN(Number(slotNumStr))) {
            const slotIndex = parseInt(slotNumStr) - 1;
            const mappedId = `A0${slotIndex + 1}`;
            const isOccupied = payloadString === 'TERISI';

            setSlots((prevSlots) => 
              prevSlots.map((slot) => 
                slot.id === mappedId 
                  ? { ...slot, status: isOccupied ? 'occupied' : 'available' } 
                  : slot
              )
            );
            setLastLog(`SLOT_UPDATE: ${mappedId} adalah ${payloadString}`);
          }
        }

      } catch (err) {
        console.error("Gagal memproses payload MQTT:", err);
      }
    });

    client.on('error', (err) => {
      console.error('MQTT Connection Error:', err);
      setConnected(false);
      setGateOnline(false);
    });

    client.on('close', () => {
      setConnected(false);
      setGateOnline(false);
    });

    return () => {
      if (client) client.end();
    };
  }, []);

  return { 
    slots, 
    rfidActive, 
    connected, 
    lastLog, 
    gateMasuk, 
    gateKeluar, 
    gateOnline, 
    activeVehicles 
  };
};