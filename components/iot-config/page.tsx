"use client";
import React, { useState, useEffect, useRef } from "react";
import { 
  Terminal, 
  Play, 
  Trash2, 
  CheckCircle, 
  AlertTriangle, 
  Database, 
  Cpu, 
  Wifi, 
  RefreshCw,
  Clock,
  Settings
} from "lucide-react";
import { 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  updateDoc, 
  serverTimestamp 
} from "firebase/firestore";
import { db, appId } from "@/app/lib/firebase";
import Y2KButton from "@/components/ui/Y2KButton";
import Y2KCard from "@/components/ui/Y2KCard";

interface MqttEvent {
  topic: string;
  payload: any;
  timestamp: string;
  rawText: string;
}

export default function IotConfigPage() {
  const [rawLogsInput, setRawLogsInput] = useState<string>("");
  const [parsedEvents, setParsedEvents] = useState<MqttEvent[]>([]);
  const [isReplaying, setIsReplaying] = useState<boolean>(false);
  const [currentEventIndex, setCurrentEventIndex] = useState<number>(-1);
  const [simulationLogs, setSimulationLogs] = useState<string[]>([]);
  const [simulationDelay, setSimulationDelay] = useState<number>(2000); // jeda antar event (ms)

  // State Simulasi UI
  const [gateMasuk, setGateMasuk] = useState<string>("TUTUP");
  const [gateKeluar, setGateKeluar] = useState<string>("TUTUP");
  const [slotCounter, setSlotCounter] = useState<number>(0);
  const [kendaraanDalam, setKendaraanDalam] = useState<string[]>([]);

  // Sesi aktif lokal untuk mencocokkan waktu masuk/keluar saat simulasi database
  const activeSessionsLocal = useRef<{ [uid: string]: string }>({});

  // =====================================================================
  // PARSER: Mengubah Teks MQTTX Mentah menjadi Array Object Event
  // =====================================================================
  const handleParseLogs = () => {
    if (!rawLogsInput.trim()) return;

    try {
      // Pecah teks berdasarkan pemisah log MQTTX (baris baru ganda atau timestamp)
      const lines = rawLogsInput.split("\n");
      const events: MqttEvent[] = [];
      
      let currentTopic = "";
      let currentPayloadStr = "";
      let currentTimestamp = "";

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();

        // 1. Deteksi Baris Topic
        if (line.startsWith("Topic: ")) {
          // Bersihkan string topic (buang "QoS: 0" jika ada)
          currentTopic = line.replace("Topic: ", "").replace(/QoS:\s*\d+/, "").trim();
        } 
        // 2. Deteksi Baris JSON Payload
        else if (line.startsWith("{") && line.endsWith("}")) {
          currentPayloadStr = line;
        } 
        // 3. Deteksi Baris Timestamp (Format tanggal di MQTTX)
        else if (/^\d{4}-\d{2}-\d{2}/.test(line)) {
          currentTimestamp = line;

          // Jika topic dan payload sudah lengkap, masukkan ke daftar
          if (currentTopic && currentPayloadStr) {
            try {
              const parsedPayload = JSON.parse(currentPayloadStr);
              events.push({
                topic: currentTopic,
                payload: parsedPayload,
                timestamp: currentTimestamp,
                rawText: `Topic: ${currentTopic} | Payload: ${currentPayloadStr}`
              });
            } catch (e) {
              console.warn("Gagal parse JSON baris ini:", currentPayloadStr);
            }
          }
          // Reset untuk pencarian event berikutnya
          currentTopic = "";
          currentPayloadStr = "";
        }
      }

      // Urutkan event berdasarkan waktu dari yang terlama ke terbaru (kronologis)
      setParsedEvents(events.reverse());
      setSimulationLogs(prev => [`[SISTEM] Berhasil mem-parsing ${events.length} event dari MQTTX.`, ...prev]);
    } catch (err) {
      setSimulationLogs(prev => ["[ERROR] Format teks tidak didukung. Pastikan menyalin log MQTTX secara penuh.", ...prev]);
    }
  };

  // =====================================================================
  // REPLAYER: Menjalankan simulasi event satu per satu secara berurutan
  // =====================================================================
  const handleStartReplay = async () => {
    if (parsedEvents.length === 0 || isReplaying) return;
    setIsReplaying(true);
    setSimulationLogs(prev => ["[SIMULASI] Memulai jalannya replika hardware...", ...prev]);

    for (let i = 0; i < parsedEvents.length; i++) {
      setCurrentEventIndex(i);
      const event = parsedEvents[i];
      await executeSimulatedEvent(event);
      // Jeda waktu antar event
      await new Promise(resolve => setTimeout(resolve, simulationDelay));
    }

    setIsReplaying(false);
    setCurrentEventIndex(-1);
    setSimulationLogs(prev => ["[SIMULASI] Selesai menjalankan seluruh skenario riwayat.", ...prev]);
  };

  // =====================================================================
  // EKSEKUSI EVENT SIMULASI (Sama seperti logika useMqttParking asli)
  // =====================================================================
  const executeSimulatedEvent = async (event: MqttEvent) => {
    const { topic, payload } = event;
    const nowIso = new Date().toISOString();

    setSimulationLogs(prev => [`[REPLAY] ${topic} -> ${JSON.stringify(payload)}`, ...prev]);

    // 1. Simulasi Status Gerbang (parking/gate/status)
    if (topic === "parking/gate/status") {
      setGateMasuk(payload.gate_masuk);
      setGateKeluar(payload.gate_keluar);
      setSlotCounter(payload.slot_counter);
      setKendaraanDalam(payload.kendaraan_dalam || []);
    }

    // 2. Simulasi Event Transaksi (parking/gate/event) -> Uji tulis Firestore
    else if (topic === "parking/gate/event") {
      const { event: actionEvent, uid } = payload;

      // Skenario Masuk
      if (actionEvent === "MASUK_DIIZINKAN") {
        setSimulationLogs(prev => [`[DB_PENDING] Membuat sesi masuk untuk UID: ${uid}`, ...prev]);
        
        // Simpan waktu masuk ke memori replayer
        activeSessionsLocal.current[uid] = nowIso;

        if (db && appId) {
          try {
            const sessionPath = `sessions`;
            await addDoc(collection(db, sessionPath), {
              rfid_uid: uid,
              vehicle_type: "car",
              slot_id: "EMULATOR_SLOT",
              check_in: nowIso,
              check_out: null,
              duration_minutes: 0,
              fee: 0,
              status: "ongoing",
              created_at: serverTimestamp()
            });
            setSimulationLogs(prev => [`[DB_SUCCESS] Berhasil menulis sesi "ongoing" ke Firestore.`, ...prev]);
          } catch (e) {
            setSimulationLogs(prev => [`[DB_ERROR] Gagal menulis ke Firestore. Cek kredensial Anda.`, ...prev]);
          }
        }
      }

      // Skenario Keluar
      else if (actionEvent === "KELUAR_DIIZINKAN") {
        setSimulationLogs(prev => [`[DB_PENDING] Mencari sesi aktif untuk penutupan UID: ${uid}`, ...prev]);

        if (db && appId) {
          try {
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
              // Simulasikan minimal durasi 45 menit agar terlihat nyata di grafik analitik
              const durationMinutes = Math.max(45, Math.round(durationMs / 60000));
              const fee = Math.ceil(durationMinutes / 60) * 5000;

              const docRef = doc(db, sessionPath, ongoingDocId);
              await updateDoc(docRef, {
                status: "completed",
                check_out: checkOutTime,
                duration_minutes: durationMinutes,
                fee: fee
              });

              setSimulationLogs(prev => [`[DB_SUCCESS] Sesi UID ${uid} diperbarui menjadi "completed" (Biaya: Rp ${fee}).`, ...prev]);
            } else {
              setSimulationLogs(prev => [`[DB_WARN] Tidak ditemukan sesi ongoing untuk UID ${uid} di Firestore.`, ...prev]);
            }
          } catch (e) {
            console.error(e);
          }
        }
      }
    }
  };

  const handleClearAll = () => {
    setRawLogsInput("");
    setParsedEvents([]);
    setSimulationLogs([]);
    setCurrentEventIndex(-1);
  };

  return (
    <div className="p-0 space-y-8 font-mono text-white selection:bg-[#C4FF4D] selection:text-[#1A1A1A]">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 border-b-4 border-[#4D4D4D] pb-6">
        <div>
          <span className="text-[10px] text-[#BA8CFF] font-black uppercase tracking-[0.3em]">Alternatif_Pengujian_Perangkat_Keras</span>
          <h1 className="text-3xl font-black text-[#C4FF4D] italic uppercase tracking-tighter flex items-center gap-2">
            <Settings size={28} /> IoT Config & Emulator
          </h1>
        </div>
        <div className="flex gap-2">
          <div className="bg-[#1A1A1A] border-2 border-[#4D4D4D] px-4 py-1 text-center">
            <p className="text-[8px] text-gray-500 uppercase">Status Prototipe</p>
            <span className="text-[10px] text-yellow-500 font-bold flex items-center gap-1"><Cpu size={12}/> REBUILDING</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* KIRI: MQTTX LOG PASTER & PANEL AKSI */}
        <div className="lg:col-span-6 space-y-8">
          <Y2KCard title="MQTTX Log Importer" variant="purple">
            <p className="text-[10px] text-gray-400 mb-4 uppercase leading-relaxed font-bold">
              Salin log history dari MQTTX (yang memuat baris Topic, JSON Payload, dan Timestamp) lalu paste di bawah:
            </p>
            
            <textarea
              className="w-full h-48 bg-[#111] border-2 border-[#BA8CFF] p-4 text-xs font-mono text-[#C4FF4D] focus:outline-none focus:border-[#C4FF4D] placeholder:text-gray-700"
              placeholder="Topic: parking/gate/statusQoS: 0&#10;{&quot;slot_counter&quot;:0,...}&#10;2026-05-19 16:01:33:934"
              value={rawLogsInput}
              onChange={(e) => setRawLogsInput(e.target.value)}
              disabled={isReplaying}
            />

            <div className="mt-4 flex flex-wrap gap-4">
              <Y2KButton className="!py-2 !px-4 !text-xs" onClick={handleParseLogs} disabled={isReplaying}>
                <RefreshCw size={14} className="inline mr-1"/> Parse_Data
              </Y2KButton>
              <Y2KButton className="!py-2 !px-4 !text-xs" onClick={handleClearAll} variant="outline" disabled={isReplaying}>
                <Trash2 size={14} className="inline mr-1" /> Bersihkan
              </Y2KButton>
            </div>
          </Y2KCard>

          {/* URUTAN SEQUENCE EVENT */}
          <Y2KCard title="Sequence Eksekusi" variant="grey">
            <div className="flex justify-between items-center mb-4">
              <span className="text-[9px] text-gray-500 font-black uppercase">Timeline_Parsed: {parsedEvents.length} Event</span>
              <div className="flex items-center gap-2">
                <span className="text-[9px] text-gray-400 font-bold uppercase">Kecepatan:</span>
                <select 
                  className="bg-[#1a1a1a] border border-[#4d4d4d] text-xs text-[#C4FF4D] px-2 py-0.5 focus:outline-none"
                  value={simulationDelay}
                  onChange={(e) => setSimulationDelay(Number(e.target.value))}
                  disabled={isReplaying}
                >
                  <option value={1000}>Cepat (1s)</option>
                  <option value={2000}>Normal (2s)</option>
                  <option value={4000}>Lambat (4s)</option>
                </select>
              </div>
            </div>

            <div className="h-48 overflow-y-auto border-2 border-[#4D4D4D] bg-[#111] p-2 space-y-2">
              {parsedEvents.length === 0 ? (
                <div className="text-gray-600 text-[10px] uppercase font-bold p-2 text-center italic">
                  Belum ada log yang dimasukkan. Silakan paste dan klik Parse Data.
                </div>
              ) : (
                parsedEvents.map((event, index) => {
                  const isActive = currentEventIndex === index;
                  const isFinished = currentEventIndex > index;
                  return (
                    <div 
                      key={index} 
                      className={`p-2 border text-[9px] flex justify-between items-center transition-all ${
                        isActive 
                        ? 'border-[#C4FF4D] bg-[#C4FF4D]/10 text-white font-black' 
                        : isFinished 
                          ? 'border-gray-800 text-gray-600 line-through' 
                          : 'border-[#4D4D4D] text-gray-400'
                      }`}
                    >
                      <div className="truncate pr-2">
                        <span className="text-[#BA8CFF] font-bold">[{event.topic}]</span> {JSON.stringify(event.payload)}
                      </div>
                      <span className="text-[8px] opacity-50 shrink-0">{event.timestamp.split(" ")[1] || event.timestamp}</span>
                    </div>
                  );
                })
              )}
            </div>

            <div className="mt-4">
              <button
                onClick={handleStartReplay}
                disabled={isReplaying || parsedEvents.length === 0}
                className="w-full bg-[#C4FF4D] text-[#1A1A1A] font-black py-3 border-2 border-[#1A1A1A] shadow-[4px_4px_0px_0px_#BA8CFF] hover:translate-x-0.5 hover:translate-y-0.5 transition-all text-xs uppercase disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Play size={14} className="inline mr-1" /> {isReplaying ? "Mengeksekusi..." : "Jalankan Simulasi Skenario"}
              </button>
            </div>
          </Y2KCard>
        </div>

        {/* KANAN: MONITOR LIVE SIMULASI */}
        <div className="lg:col-span-6 space-y-8">
          <Y2KCard title="Monitor Hardware Virtual" variant="lime">
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="p-3 border-2 border-[#4D4D4D] bg-[#1a1a1a]">
                <p className="text-[8px] text-gray-500 uppercase font-black">Pintu_Masuk</p>
                <span className={`text-sm font-black italic uppercase ${gateMasuk === "BUKA" ? "text-[#C4FF4D]" : "text-red-500"}`}>
                  {gateMasuk}
                </span>
              </div>
              <div className="p-3 border-2 border-[#4D4D4D] bg-[#1a1a1a]">
                <p className="text-[8px] text-gray-500 uppercase font-black">Pintu_Keluar</p>
                <span className={`text-sm font-black italic uppercase ${gateKeluar === "BUKA" ? "text-[#C4FF4D]" : "text-red-500"}`}>
                  {gateKeluar}
                </span>
              </div>
            </div>

            <div className="p-4 border-2 border-[#4D4D4D] bg-[#111] space-y-2 mb-6">
              <div className="flex justify-between text-[10px] font-black border-b border-[#4D4D4D] pb-1">
                <span>Total Aktif (RFID):</span>
                <span className="text-[#C4FF4D]">{slotCounter} Unit</span>
              </div>
              <div className="flex justify-between text-[10px] font-black">
                <span>Daftar UID di Dalam:</span>
                <span className="text-[#BA8CFF] truncate max-w-[200px]">
                  {kendaraanDalam.length > 0 ? kendaraanDalam.join(", ") : "KOSONG"}
                </span>
              </div>
            </div>
          </Y2KCard>

          {/* SIMULASI CONSOLE LOGS */}
          <div className="bg-[#111] border-4 border-[#4D4D4D] p-6 shadow-[6px_6px_0px_0px_#111]">
            <h3 className="text-[#C4FF4D] text-xs font-black uppercase mb-4 tracking-wider flex items-center gap-2">
              <Terminal size={14} /> Konsol Terminal Emulator
            </h3>
            <div className="h-44 overflow-y-auto space-y-2 text-[9px] pr-2 scrollbar-thin scrollbar-thumb-gray-800">
              {simulationLogs.length === 0 ? (
                <div className="text-gray-600 font-bold uppercase italic">Console standby...</div>
              ) : (
                simulationLogs.map((log, i) => (
                  <div key={i} className="flex gap-2">
                    <span className="text-gray-600 shrink-0">[{i}]</span>
                    <span className={log.includes("[ERROR]") ? "text-red-500" : log.includes("[DB_SUCCESS]") ? "text-[#C4FF4D]" : "text-gray-300"}>
                      {log}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
