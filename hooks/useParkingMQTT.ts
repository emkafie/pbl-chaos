import { useState, useEffect, useRef } from 'react';
import mqtt from 'mqtt';
import { db, appId } from '@/app/lib/firebase';
import { 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  updateDoc, 
  setDoc,
  serverTimestamp 
} from 'firebase/firestore';

import { ParkingSlot } from '@/types';

// Konfigurasi WebSockets HiveMQ Cloud menggunakan Env Variables dengan fallback otomatis
// Jika NEXT_PUBLIC_MQTT_HOST tidak diset, default ke string kosong agar MQTT tidak dipaksa terhubung
const MQTT_HOST = process.env.NEXT_PUBLIC_MQTT_HOST || '';
const MQTT_USER = process.env.NEXT_PUBLIC_MQTT_USER || '';
const MQTT_PASS = process.env.NEXT_PUBLIC_MQTT_PASS || '';

const MQTT_PORT = MQTT_HOST && MQTT_HOST.includes('hivemq.cloud') ? 8884 : 8084;
const MQTT_BROKER_URL = MQTT_HOST ? `wss://${MQTT_HOST}:${MQTT_PORT}/mqtt` : '';
const ANOMALY_DEBOUNCE_TIME = 3; 

/**
 * Fungsi pembantu untuk membersihkan string payload MQTT yang kotor akibat metadata
 * seperti "Message Expiry Interval" atau QoS tambahan, agar hanya mengekstrak blok JSON {...}
 */
const safeJsonParse = (str: string) => {
  try {
    const firstBrace = str.indexOf('{');
    const lastBrace = str.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1) {
      const jsonStr = str.slice(firstBrace, lastBrace + 1);
      return JSON.parse(jsonStr);
    }
    return JSON.parse(str);
  } catch (e) {
    console.error("❌ safeJsonParse Error:", e, "Raw data was:", str);
    return null;
  }
};

export const useMqttParking = (dbSlots: ParkingSlot[]) => {

  // 2. STATE GERBANG RFID
  const [rfidActive, setRfidActive] = useState<number>(0);
  const [gateMasuk, setGateMasuk] = useState<string>("TUTUP");
  const [gateKeluar, setGateKeluar] = useState<string>("TUTUP");
  const [activeVehicles, setActiveVehicles] = useState<string[]>([]);
  const [gateOnline, setGateOnline] = useState<boolean>(false);
  const [slotOnline, setSlotOnline] = useState<boolean>(false);

  // 3. STATE DETEKSI ANOMALI LINTAS SENSOR
  const [isAnomaly, setIsAnomaly] = useState<boolean>(false);
  const [anomalyCount, setAnomalyCount] = useState<number>(0);
  const [anomalyTimestamp, setAnomalyTimestamp] = useState<string | null>(null);
  const [anomalyMessage, setAnomalyMessage] = useState<string>("");
  const [pendingAnomaly, setPendingAnomaly] = useState<boolean>(false);
  const [countdown, setCountdown] = useState<number | null>(null);

  // 4. METADATA SISTEM & LIVE LOG CONSOLE
  const [connected, setConnected] = useState<boolean>(false);
  const [lastLog, setLastLog] = useState<string>("Sistem standby. Menunggu transmisi IoT...");

  const mqttClientRef = useRef<mqtt.MqttClient | null>(null);
  const dbSlotsRef = useRef<ParkingSlot[]>(dbSlots);

  // Sinkronkan referensi data slot database terbaru tanpa memutus ulang koneksi MQTT
  useEffect(() => {
    dbSlotsRef.current = dbSlots;
  }, [dbSlots]);

  const totalSlotTerisi = dbSlots.filter((s) => s.status === 'occupied').length;

  // =====================================================================
  // 🛡️ REAKTIF ANOMALI ENGINE (TRANSISI STATE TANPA TIMEOUT CANCELLATION)
  // =====================================================================
  const selisih = totalSlotTerisi - rfidActive;

  // Efek 1: Evaluasi awal ketidakcocokan data
  useEffect(() => {
    if (selisih > 0) {
      if (!isAnomaly && !pendingAnomaly) {
        setPendingAnomaly(true);
        setCountdown(ANOMALY_DEBOUNCE_TIME);
        setLastLog(`⚠️ EVALUASI: Sensor fisik mendeteksi ${totalSlotTerisi} unit terisi, RFID aktif ${rfidActive}. Memulai debounce...`);
      }
    } else {
      if (isAnomaly) {
        setIsAnomaly(false);
        setAnomalyCount(0);
        setAnomalyTimestamp(null);
        setAnomalyMessage("");
        setLastLog("🟢 AUTO RECOVERY: Logika silang sensor kembali sinkron. Area parkir aman.");
        publishAnomalyMQTT("NORMAL", rfidActive, totalSlotTerisi, 0, "Sistem kembali sinkron.");
      }
      
      if (pendingAnomaly) {
        setPendingAnomaly(false);
        setCountdown(null);
        setLastLog("ℹ️ FILTER SUCCESS: Ketidakcocokan data terdeteksi hanya sebagai noise sesaat.");
      }
    }
  }, [selisih]); // Hanya berjalan ketika nilai selisih absolut berubah!

  // Efek 2: Mengelola hitung mundur debounce visual dan pemicu anomali aktif
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (pendingAnomaly && countdown !== null) {
      if (countdown > 0) {
        timer = setTimeout(() => {
          setCountdown(prev => (prev !== null ? prev - 1 : null));
        }, 1000);
      } else {
        setIsAnomaly(true);
        setAnomalyCount(selisih);
        const timestamp = new Date().toLocaleTimeString("id-ID");
        setAnomalyTimestamp(timestamp);
        setPendingAnomaly(false);
        setCountdown(null);

        const msg = rfidActive === 0 
          ? "Deteksi objek non-kendaraan menutupi sensor IR secara permanen" 
          : "Kendaraan masuk area parkir tanpa scan valid kartu RFID (Tailgating)";
        setAnomalyMessage(msg);
        setLastLog(`🔴 SISTEM ANOMALI: ${msg} (Selisih: ${selisih} unit)`);

        publishAnomalyMQTT("ANOMALY", rfidActive, totalSlotTerisi, selisih, msg);
      }
    }
    return () => clearTimeout(timer);
  }, [pendingAnomaly, countdown, selisih, rfidActive, totalSlotTerisi]);

  const publishAnomalyMQTT = (status: string, rfid: number, slotsCount: number, anomalyQty: number, msg: string) => {
    if (mqttClientRef.current && mqttClientRef.current.connected) {
      const payload = {
        status,
        rfid_active: rfid,
        slot_occupied: slotsCount,
        anomaly_count: anomalyQty,
        message: msg,
        timestamp: new Date().toISOString()
      };
      mqttClientRef.current.publish('parking/anomaly', JSON.stringify(payload), { qos: 0, retain: true });
    }
  };

  // =====================================================================
  // KONEKSI MQTT WEB KLIEN & EVENT LISTENER (STABIL)
  // =====================================================================
  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (!MQTT_HOST) {
      console.log("ℹ️ MQTT_HOST tidak dikonfigurasi. Berjalan dalam mode offline MQTT (Firestore-only).");
      setLastLog("ℹ️ MQTT offline. Menggunakan sinkronisasi Firestore.");
      return;
    }

    console.log(`⚡ Menghubungkan Web Dashboard ke Broker (${MQTT_HOST}) via WebSockets...`);
    
    const connectionOptions: mqtt.IClientOptions = {
      clean: true,
      connectTimeout: 5000,
      reconnectPeriod: 5000,
    };

    if (MQTT_USER && MQTT_PASS) {
      connectionOptions.username = MQTT_USER;
      connectionOptions.password = MQTT_PASS;
    }

    let client: mqtt.MqttClient | null = null;
    let isMounted = true;

    try {
      client = mqtt.connect(MQTT_BROKER_URL, connectionOptions);
      mqttClientRef.current = client;
    } catch (e) {
      console.error("❌ Gagal menginisialisasi koneksi MQTT:", e);
      return;
    }

    client.on('connect', () => {
      if (!isMounted) return;
      setConnected(true);
      if (typeof window !== 'undefined') {
        (window as any).mqttClient = client;
      }
      setLastLog(`CONNECTED_TO_BROKER_${MQTT_HOST.includes('hivemq') ? 'HIVEMQ_CLOUD' : 'EMQX'}`);
      
      const safeSubscribe = (topic: string) => {
        if (!isMounted || !client || !client.connected || client.disconnecting) return;
        try {
          client.subscribe(topic, (err) => {
            if (err) {
              console.warn(`⚠️ Gagal subscribe ke topic ${topic}:`, err);
            }
          });
        } catch (e) {
          console.warn(`⚠️ Exception saat subscribe ke topic ${topic}:`, e);
        }
      };

      safeSubscribe('parking/slot/+');
      safeSubscribe('parking/slot/status');
      safeSubscribe('parking/gate/status');
      safeSubscribe('parking/gate/event');
      safeSubscribe('parking/gate/lwt');
      safeSubscribe('parking/slot/lwt');
    });

    client.on('message', async (topic, message) => {
      if (!isMounted) return;
      const payloadString = message.toString();

      try {
        if (topic === 'parking/gate/lwt') {
          const lwt = safeJsonParse(payloadString);
          if (lwt) {
            setGateOnline(lwt.status === 'online');
            setLastLog(`INFO_LOG: Pintu Gerbang berstatus ${lwt.status.toUpperCase()}`);
          }
        } 
        
        else if (topic === 'parking/slot/lwt') {
          const lwt = safeJsonParse(payloadString);
          if (lwt) {
            setSlotOnline(lwt.status === 'online');
            setLastLog(`INFO_LOG: Monitor Slot berstatus ${lwt.status.toUpperCase()}`);
          }
        }

        else if (topic === 'parking/slot/status') {
          const slotStatus = safeJsonParse(payloadString);
          if (slotStatus && Array.isArray(slotStatus.slot)) {
            const slotArray = slotStatus.slot;

            // Menggunakan database slots paling mutakhir dari referensi penamaan A01, A02, A03, A04
            const currentSlotsInDb = dbSlotsRef.current;
            const targetSlots = currentSlotsInDb.length > 0 ? currentSlotsInDb : [
              { id: "A01", status: "available" as const, type: "car" as const },
              { id: "A02", status: "available" as const, type: "car" as const },
              { id: "A03", status: "available" as const, type: "car" as const },
              { id: "A04", status: "available" as const, type: "car" as const },
            ];

            targetSlots.forEach((item, index) => {
              if (index < slotArray.length) {
                const newStatus = slotArray[index] === 1 ? 'occupied' : 'available';
                
                // Tulis ke Firestore HANYA jika status berubah dibanding data DB
                if (item.status !== newStatus) {
                  const slotDocPath = `parking_slots/${item.id}`;
                  
                  setDoc(doc(db, slotDocPath), {
                    id: item.id,
                    status: newStatus,
                    last_updated: serverTimestamp()
                  }, { merge: true })
                  .then(() => {
                    console.log(`💾 BRIDGE_SUCCESS: Status slot ${item.id} berhasil di-sync ke Firestore -> ${newStatus}`);
                  })
                  .catch((err) => {
                    console.error(`❌ BRIDGE_ERROR: Gagal menulis data slot ${item.id} ke Firestore:`, err);
                  });
                }
              }
            });
            setSlotOnline(true);
          }
        }

        else if (topic === 'parking/gate/status') {
          const gateStatus = safeJsonParse(payloadString);
          if (gateStatus) {
            setRfidActive(gateStatus.slot_counter); 
            setGateMasuk(gateStatus.gate_masuk);
            setGateKeluar(gateStatus.gate_keluar);
            setActiveVehicles(gateStatus.kendaraan_dalam || []);
            setGateOnline(true);
          }
        }

        else if (topic === 'parking/gate/event') {
          const eventData = safeJsonParse(payloadString);
          if (eventData) {
            const { event, uid } = eventData;
            const nowIso = new Date().toISOString();

            if (event === 'MASUK_DIIZINKAN') {
              setLastLog(`AKSES_DIIZINKAN: ID Kartu ${uid} telah masuk gerbang.`);

              if (db && appId) {
                const sessionPath = `sessions`;
                await addDoc(collection(db, sessionPath), {
                  rfid_uid: uid,
                  vehicle_type: "car",
                  slot_id: "PENDING_SENSOR", 
                  check_in: nowIso,
                  check_out: null,
                  duration_minutes: 0,
                  fee: 0,
                  status: "ongoing",
                  created_at: serverTimestamp()
                });
              }
            } 
            else if (event === 'KELUAR_DIIZINKAN') {
              setLastLog(`AKSES_DIIZINKAN: ID Kartu ${uid} telah keluar gerbang.`);

              if (db && appId) {
                const sessionPath = `sessions`;
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
                  const durationMs = new Date(checkOutTime).getTime() - new Date(checkInTime).getTime();
                  const durationMinutes = Math.max(1, Math.round(durationMs / 60000));
                  const fee = Math.ceil(durationMinutes / 60) * 5000;

                  const docRef = doc(db, sessionPath, ongoingDocId);
                  await updateDoc(docRef, {
                    status: "completed",
                    check_out: checkOutTime,
                    duration_minutes: durationMinutes,
                    fee: fee
                  });
                }
              }
            }
          }
        }

      } catch (err) {
        console.error("Gagal memproses data JSON MQTT:", err);
      }
    });

    client.on('error', (err: any) => {
      if (!isMounted) return;
      console.warn('MQTT Cloud Connection Error:', err.message || err);
      setConnected(false);
    });

    client.on('close', () => {
      if (!isMounted) return;
      setConnected(false);
      setGateOnline(false);
      setSlotOnline(false);
    });

    return () => {
      isMounted = false;
      if (client) {
        try {
          client.end(true);
        } catch (e) {
          console.warn("Exception while ending MQTT client:", e);
        }
        if (typeof window !== 'undefined' && (window as any).mqttClient === client) {
          (window as any).mqttClient = null;
        }
      }
    };
  }, []);

  return {
    slots: dbSlots,
    rfidActive,
    connected,
    lastLog,
    gateMasuk,
    gateKeluar,
    gateOnline,
    slotOnline,
    activeVehicles,
    isAnomaly,
    anomalyCount,
    anomalyTimestamp,
    anomalyMessage,
    pendingAnomaly,
    countdown
  };
};