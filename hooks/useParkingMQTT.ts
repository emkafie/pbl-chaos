import { appId, db } from '@/app/lib/firebase';
import {
  addDoc,
  collection,
  doc,
  getDocs,
  serverTimestamp,
  setDoc,
  query,
  where
} from 'firebase/firestore';
import mqtt from 'mqtt';
import { useEffect, useRef, useState } from 'react';

import { RFIDCardService } from '@/app/lib/rfidCardService';
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
  const lastEventCache = useRef<Map<string, { event: string; timestamp: number }>>(new Map());

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
      if (client !== mqttClientRef.current) return;
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
      if (client !== mqttClientRef.current) return;
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
            setSlotOnline(true);
            setLastLog(`INFO_LOG: Sinkronisasi slot parkir diterima.`);
            
            try {
              const slotArray = slotStatus.slot;
              const targetSlots = [...dbSlotsRef.current].sort((a, b) => a.id.localeCompare(b.id));
              
              for (let index = 0; index < slotArray.length; index++) {
                if (index < targetSlots.length) {
                  const item = targetSlots[index];
                  const newStatus = slotArray[index] === 1 ? 'occupied' : 'available';

                  if (item.status !== newStatus) {
                    const slotDocRef = doc(db, "parking_slots", item.id);
                    await setDoc(slotDocRef, {
                      id: item.id,
                      status: newStatus,
                      last_updated: serverTimestamp()
                    }, { merge: true });
                    console.log(`💾 Sync slot ${item.id} status to ${newStatus} client-side`);
                  }
                }
              }
            } catch (err) {
              console.error("❌ Error syncing slot status client-side:", err);
            }
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

            if (event === 'MASUK_DIIZINKAN') {
              setLastLog(`AKSES_DIIZINKAN: ID Kartu ${uid} telah masuk gerbang.`);
              
              // 1. Debounce local MQTT event bounces (e.g. 20 seconds)
              const last = lastEventCache.current.get(uid);
              const now = Date.now();
              if (last && last.event === event && (now - last.timestamp) < 20000) {
                console.log(`⚠️ Ignored duplicate bounced check-in event [${event}] for RFID ${uid}`);
                return;
              }
              lastEventCache.current.set(uid, { event, timestamp: now });

              try {
                // 2. Query Firestore to verify no ongoing session exists for this card
                const sessionsRef = collection(db, "sessions");
                const q = query(
                  sessionsRef,
                  where("rfid_uid", "==", uid),
                  where("status", "==", "ongoing")
                );
                const querySnapshot = await getDocs(q);

                if (!querySnapshot.empty) {
                  console.log(`⚠️ Card ${uid} already has an ongoing session. Skipping duplicate check-in.`);
                  return;
                }

                // 3. Create the session
                const nowIso = new Date().toISOString();
                const newSessionRef = await addDoc(sessionsRef, {
                  rfid_uid: uid,
                  vehicle_type: "car",
                  slot_id: "PENDING_SENSOR",
                  check_in: nowIso,
                  check_out: null,
                  duration_minutes: 0,
                  fee: 0,
                  status: "ongoing",
                  created_at: serverTimestamp(),
                  created_by: "client_hook"
                });
                console.log(`✅ Session created successfully client-side: ${newSessionRef.id} for RFID ${uid}.`);
              } catch (err) {
                console.error("❌ Error creating session client-side:", err);
              }
            } 
            else if (event === 'KELUAR_DIIZINKAN') {
              setLastLog(`AKSES_DIIZINKAN: ID Kartu ${uid} telah keluar gerbang.`);

              // 1. Debounce local MQTT event bounces
              const last = lastEventCache.current.get(uid);
              const now = Date.now();
              if (last && last.event === event && (now - last.timestamp) < 20000) {
                console.log(`⚠️ Ignored duplicate bounced check-out event [${event}] for RFID ${uid}`);
                return;
              }
              lastEventCache.current.set(uid, { event, timestamp: now });

              try {
                // 2. Query Firestore for the ongoing session
                const sessionsRef = collection(db, "sessions");
                const q = query(
                  sessionsRef,
                  where("rfid_uid", "==", uid),
                  where("status", "==", "ongoing")
                );
                const querySnapshot = await getDocs(q);

                if (!querySnapshot.empty) {
                  // Pick the oldest ongoing session just in case of duplicates
                  const docs = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                  } as any));
                  
                  docs.sort((a, b) => new Date(a.check_in).getTime() - new Date(b.check_in).getTime());
                  const activeSession = docs[0];

                  const checkInTime = activeSession.check_in;
                  const checkOutTime = new Date().toISOString();
                  const durationMs = new Date(checkOutTime).getTime() - new Date(checkInTime).getTime();
                  const durationMinutes = Math.max(1, Math.round(durationMs / 60000));
                  const fee = Math.ceil(durationMinutes / 60) * 5000;

                  console.log(`🚪 RFID CARD ${uid} exiting... Calling secure checkout API for session ${activeSession.id}`);

                  // 3. Call checkout API to securely update session and deduct balance
                  const res = await fetch("/api/parking/checkout", {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                      session_id: activeSession.id,
                      rfid_uid: uid,
                      check_in: checkInTime,
                      check_out: checkOutTime,
                      duration_minutes: durationMinutes,
                      fee: fee,
                    }),
                  });

                  const resData = await res.json();
                  if (resData.success) {
                    console.log(`✅ Checkout successful client-side for RFID ${uid}. New balance: Rp${resData.new_balance}`);
                  } else {
                    console.error(`❌ Checkout API returned error:`, resData.error || resData.deduction_error);
                  }
                } else {
                  console.warn(`⚠️ No ongoing parking session found for RFID ${uid}.`);
                }
              } catch (err) {
                console.error("❌ Error during check-out client-side:", err);
              }
            }
          }
        }

      } catch (err) {
        console.error("Gagal memproses data JSON MQTT:", err);
      }
    });

    client.on('error', (err) => {
      if (client !== mqttClientRef.current) return;
      console.error('MQTT Cloud Error:', err);
      setConnected(false);
    });

    client.on('close', () => {
      if (client !== mqttClientRef.current) return;
      setConnected(false);
      setGateOnline(false);
      setSlotOnline(false);
    });

    return () => {
      isMounted = false;
      if (client) {
        client.end();
        if (mqttClientRef.current === client) {
          mqttClientRef.current = null;
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