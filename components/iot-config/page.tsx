"use client";
import {
  addDoc,
  collection,
  doc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { Clock, Cpu, Key, RefreshCw, Settings, ShieldAlert, Terminal } from "lucide-react";
import { useEffect, useState } from "react";
// Menggunakan jalur relatif untuk menghindari error resolusi alias
import { db } from "@/app/lib/firebase";
import { RFIDCardService } from "@/app/lib/rfidCardService";
import Y2KButton from "@/components/ui/Y2KButton";
import Y2KCard from "@/components/ui/Y2KCard";

interface MqttEvent {
  topic: string;
  payload: any;
  timestamp: string;
  rawText: string;
}

interface ParkingSession {
  id: string;
  rfid_uid: string;
  check_in: string;
  status: string;
  slot_id?: string;
  vehicle_type?: string;
  fee?: number;
  duration_minutes?: number;
}

interface IotConfigPageProps {
  activeVehicles?: string[];
}

export default function IotConfigPage({ activeVehicles }: IotConfigPageProps) {
  const [rawLogsInput, setRawLogsInput] = useState<string>("");
  const [parsedEvents, setParsedEvents] = useState<MqttEvent[]>([]);
  const [isReplaying, setIsReplaying] = useState<boolean>(false);
  const [simulationLogs, setSimulationLogs] = useState<string[]>([]);
  const [simulationDelay, setSimulationDelay] = useState<number>(2000);
  const [commandLog, setCommandLog] = useState<string>("Standby...");
  
  // Real-time ongoing sessions state
  const [ongoingSessions, setOngoingSessions] = useState<ParkingSession[]>([]);
  // Individual warp duration state mapping: sessionId -> duration in minutes
  const [warpDurations, setWarpDurations] = useState<Record<string, number>>({});

  // Filter ongoing sessions to only show vehicles currently inside the parking area
  const displayedSessions = activeVehicles
    ? ongoingSessions.filter((session) => activeVehicles.includes(session.rfid_uid))
    : ongoingSessions;

  // Fetch ongoing sessions in real-time
  useEffect(() => {
    if (!db) return;
    
    const sessionsRef = collection(db, "sessions");
    const q = query(sessionsRef, where("status", "==", "ongoing"));
    
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const activeSessions: ParkingSession[] = [];
        snapshot.forEach((docSnap) => {
          activeSessions.push({
            id: docSnap.id,
            ...docSnap.data(),
          } as ParkingSession);
        });
        // Sort by check-in time descending
        activeSessions.sort((a, b) => new Date(b.check_in).getTime() - new Date(a.check_in).getTime());
        setOngoingSessions(activeSessions);
      },
      (err) => {
        console.error("Firestore Sync Error (Ongoing Sessions):", err);
      }
    );

    return () => unsubscribe();
  }, []);

  const handlePublishCommand = (command: 'FORCE_OPEN_MASUK' | 'FORCE_CLOSE_MASUK' | 'FORCE_OPEN_KELUAR' | 'FORCE_CLOSE_KELUAR') => {
    const client = (window as any).mqttClient;
    if (!client || !client.connected) {
      setCommandLog("❌ ERROR: MQTT Client tidak terhubung di Dashboard.");
      setSimulationLogs(prev => [`[OVERRIDE_FAIL] Client offline. Tidak bisa mengirim ${command}`, ...prev]);
      return;
    }
    const topic = "parking/gate/command";
    const payload = JSON.stringify({ command });
    
    client.publish(topic, payload);
    setCommandLog(`⚡ Perintah ${command} berhasil dipublish.`);
    setSimulationLogs(prev => [`[OVERRIDE] Command "${command}" sent to ${topic}`, ...prev]);
  };

  const handleSimulateCheckout = async (session: ParkingSession, durationMinutes: number) => {
    try {
      const now = new Date();
      // Hitung check-in mundur ke belakang sesuai durasi time warp
      const checkInTime = new Date(now.getTime() - durationMinutes * 60 * 1000);
      const checkOutTime = now;
      const fee = Math.ceil(durationMinutes / 60) * 5000;

      // Update di Firestore
      const sessionDocRef = doc(db, "sessions", session.id);
      await updateDoc(sessionDocRef, {
        status: "completed",
        check_in: checkInTime.toISOString(),
        check_out: checkOutTime.toISOString(),
        duration_minutes: durationMinutes,
        fee: fee,
      });

      // 💳 DEDUCT BALANCE FROM RFID CARD
      try {
        const newBalance = await RFIDCardService.deductBalance(db, session.rfid_uid, fee);
        setSimulationLogs(prev => [
          `[TIME_WARP_CHECKOUT] UID: ${session.rfid_uid} | Durasi: ${durationMinutes} menit | Biaya: Rp${fee.toLocaleString("id-ID")} | Saldo baru: Rp${newBalance.toLocaleString("id-ID")}`,
          ...prev
        ]);
      } catch (balanceError: unknown) {
        const errorMsg = balanceError instanceof Error ? balanceError.message : "Unknown error";
        if (errorMsg === "INSUFFICIENT_BALANCE") {
          setSimulationLogs(prev => [
            `[TIME_WARP_CHECKOUT] ⚠️ Saldo kartu tidak cukup! UID: ${session.rfid_uid} | Dibutuhkan: Rp${fee.toLocaleString("id-ID")}`,
            ...prev
          ]);
        } else if (errorMsg === "CARD_NOT_FOUND") {
          setSimulationLogs(prev => [
            `[TIME_WARP_CHECKOUT] ❌ Kartu tidak ditemukan di sistem! UID: ${session.rfid_uid}`,
            ...prev
          ]);
        } else {
          setSimulationLogs(prev => [
            `[TIME_WARP_CHECKOUT] ❌ Error: ${errorMsg}`,
            ...prev
          ]);
        }
      }

      // Publish event checkout palsu ke MQTT agar hardware/sensor sinkron
      const client = (window as any).mqttClient;
      if (client && client.connected) {
        client.publish("parking/gate/event", JSON.stringify({
          event: "KELUAR_DIIZINKAN",
          uid: session.rfid_uid
        }));
      }
    } catch (e: any) {
      console.error("Simulation checkout error:", e);
      setSimulationLogs(prev => [`[ERROR] Gagal memproses Time Warp Checkout: ${e.message}`, ...prev]);
    }
  };;

  const handleParseLogs = () => {
    if (!rawLogsInput.trim()) return;
    const lines = rawLogsInput.split("\n");
    const events: MqttEvent[] = [];
    let currentTopic = "", currentPayloadStr = "";

    for (let line of lines) {
      line = line.trim();
      if (line.startsWith("Topic: ")) currentTopic = line.replace("Topic: ", "").trim();
      else if (line.startsWith("{") && line.endsWith("}")) currentPayloadStr = line;
      else if (/^\d{4}-\d{2}-\d{2}/.test(line)) {
        if (currentTopic && currentPayloadStr) {
          try {
            events.push({ topic: currentTopic, payload: JSON.parse(currentPayloadStr), timestamp: line, rawText: "" });
          } catch (e) {}
        }
        currentTopic = ""; currentPayloadStr = "";
      }
    }
    setParsedEvents(events.reverse());
    setSimulationLogs(prev => [`[PARSER] Berhasil memparsing ${events.length} event dari raw log.`, ...prev]);
  };

  const handleStartReplay = async () => {
    if (parsedEvents.length === 0) return;
    setIsReplaying(true);
    setSimulationLogs(prev => [`[REPLAY] Memulai simulasi replay ${parsedEvents.length} event...`, ...prev]);

    for (let i = 0; i < parsedEvents.length; i++) {
      const { topic, payload } = parsedEvents[i];
      let now = new Date();
      const nowIso = now.toISOString();

      if (topic === "parking/gate/event") {
        try {
          if (payload.event === "MASUK_DIIZINKAN") {
            await addDoc(collection(db, "sessions"), {
              rfid_uid: payload.uid,
              check_in: nowIso,
              status: "ongoing",
              fee: 0,
              created_at: serverTimestamp()
            });
            setSimulationLogs(prev => [`[REPLAY] Terdaftar Check-In UID: ${payload.uid}`, ...prev]);
          } else if (payload.event === "KELUAR_DIIZINKAN") {
            const q = await getDocs(collection(db, "sessions"));
            q.forEach(async (docSnap) => {
              if (docSnap.data().rfid_uid === payload.uid && docSnap.data().status === "ongoing") {
                await updateDoc(doc(db, "sessions", docSnap.id), { 
                  status: "completed", 
                  check_out: nowIso, 
                  fee: 5000 
                });
              }
            });
            setSimulationLogs(prev => [`[REPLAY] Terdaftar Check-Out UID: ${payload.uid}`, ...prev]);
          }
        } catch (e) {
          console.error("Firestore Error:", e);
        }
      }
      await new Promise(r => setTimeout(r, simulationDelay));
    }
    setIsReplaying(false);
    setSimulationLogs(prev => [`[REPLAY] Simulasi replay selesai.`, ...prev]);
  };

  const formatDateTime = (isoString: string) => {
    if (!isoString) return "-";
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric"
      }) + " " + d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
    } catch (e) {
      return isoString;
    }
  };

  return (
    <div className="space-y-8 font-mono text-(--color-y2k-text-main) bg-(--color-y2k-bg-main)">
      {/* Header Panel */}
      <div className="border-b-4 border-(--color-y2k-border) pb-6">
        <h1 className="text-3xl font-black italic uppercase flex items-center gap-3 text-(--color-y2k-lime) tracking-wider">
          <Settings size={32} className="animate-spin-slow" /> IoT_Control_&_Sim_Panel
        </h1>
        <p className="text-xs text-(--color-y2k-text-muted) uppercase tracking-widest mt-2">
          Node_Management / Diagnostic_Console / System_Override_Matrix
        </p>
      </div>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Overrides & Logs */}
        <div className="lg:col-span-5 space-y-8">
          
          {/* Hardware Override */}
          <Y2KCard title="Gerbang Override" variant="lime" icon={Cpu}>
            <div className="bg-(--color-y2k-bg-panel) border-2 border-(--color-y2k-border) p-4 mb-4">
              <div className="flex items-center gap-3 text-[10px] text-(--color-y2k-text-muted) mb-2">
                <ShieldAlert size={14} className="text-(--color-y2k-lime)" />
                <span>MQTT TOPIC: parking/gate/command</span>
              </div>
              <p className="text-xs text-(--color-y2k-text-muted) leading-relaxed">
                Kirim perintah manual langsung untuk menggerakkan servo gerbang secara paksa. Pemuatan instan ke unit hardware ESP32.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Y2KButton onClick={() => handlePublishCommand('FORCE_OPEN_MASUK')} variant="lime" className="w-full justify-center">
                🔓 FORCE OPEN MASUK
              </Y2KButton>
              <Y2KButton onClick={() => handlePublishCommand('FORCE_CLOSE_MASUK')} variant="purple" className="w-full justify-center">
                🔒 FORCE CLOSE MASUK
              </Y2KButton>
              <Y2KButton onClick={() => handlePublishCommand('FORCE_OPEN_KELUAR')} variant="lime" className="w-full justify-center">
                🔓 FORCE OPEN KELUAR
              </Y2KButton>
              <Y2KButton onClick={() => handlePublishCommand('FORCE_CLOSE_KELUAR')} variant="purple" className="w-full justify-center">
                🔒 FORCE CLOSE KELUAR
              </Y2KButton>
            </div>
            
            <div className="mt-6 bg-black/60 border border-(--color-y2k-border) p-3 rounded">
              <span className="text-[9px] text-(--color-y2k-text-muted) block mb-1">COMMAND ENGINE RESPONSE:</span>
              <p className="text-xs text-(--color-y2k-lime) font-bold">{commandLog}</p>
            </div>
          </Y2KCard>

          {/* Real-time System Log Output */}
          <Y2KCard title="Event Logger" variant="grey" icon={Terminal}>
            <div className="bg-black/80 border-2 border-(--color-y2k-border) p-4 h-64 overflow-y-auto font-mono text-[11px] space-y-2 selection:bg-(--color-y2k-lime) selection:text-black">
              {simulationLogs.length === 0 ? (
                <p className="text-(--color-y2k-text-muted) italic">Menunggu log aktivitas...</p>
              ) : (
                simulationLogs.map((log, idx) => (
                  <div key={idx} className="border-b border-gray-900 pb-1 flex gap-2">
                    <span className="text-(--color-y2k-lime) shrink-0">&gt;</span>
                    <span className={log.includes("[ERROR]") ? "text-red-500" : log.includes("[TIME_WARP") ? "text-(--color-y2k-purple)" : "text-gray-300"}>
                      {log}
                    </span>
                  </div>
                ))
              )}
            </div>
            <div className="mt-4 flex justify-end">
              <button 
                onClick={() => setSimulationLogs([])}
                className="text-[9px] uppercase border border-(--color-y2k-border) px-2 py-1 text-(--color-y2k-text-muted) hover:text-(--color-y2k-lime) hover:border-(--color-y2k-lime) transition-all"
              >
                Clear Log
              </button>
            </div>
          </Y2KCard>
        </div>

        {/* Right Column: Time Warp Active Session List */}
        <div className="lg:col-span-7 space-y-8">
          
          <Y2KCard title="Time Warp - Parked Vehicles" variant="purple" icon={Clock}>
            <div className="mb-6 flex justify-between items-center">
              <p className="text-xs text-(--color-y2k-text-muted) max-w-md">
                Daftar kendaraan aktif di Firestore (`sessions`). Lakukan manipulasi waktu individual untuk mensimulasikan durasi parkir & cek algoritma tarif.
              </p>
              <div className="flex items-center gap-2 bg-(--color-y2k-bg-panel) px-3 py-1 border border-(--color-y2k-border) text-[10px] text-(--color-y2k-lime) font-bold shrink-0">
                <RefreshCw size={12} className="animate-spin-slow" />
                <span>LIVE LINKED</span>
              </div>
            </div>

            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
              {displayedSessions.length === 0 ? (
                <div className="bg-(--color-y2k-bg-panel) border-2 border-dashed border-(--color-y2k-border) p-10 text-center">
                  <p className="text-sm text-(--color-y2k-text-muted) uppercase tracking-widest font-black">
                    Tidak Ada Sesi Parkir Ongoing / Aktif
                  </p>
                  <p className="text-[10px] text-gray-600 mt-2">
                    Lakukan simulasi scan kartu masuk atau log replayer terlebih dahulu.
                  </p>
                </div>
              ) : (
                displayedSessions.map((session) => {
                  const currentSelectedDuration = warpDurations[session.id] || 60; // default 1 hour
                  return (
                    <div 
                      key={session.id} 
                      className="border-2 border-(--color-y2k-border) bg-(--color-y2k-bg-panel) p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-(--color-y2k-lime) transition-all shadow-[3px_3px_0px_0px_rgba(0,0,0,0.3)]"
                    >
                      {/* Vehicle Details */}
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Key size={14} className="text-(--color-y2k-lime)" />
                          <span className="text-xs font-bold text-(--color-y2k-lime) tracking-widest">{session.rfid_uid}</span>
                          <span className="bg-purple-950 text-(--color-y2k-purple) text-[9px] px-2 py-0.5 border border-purple-500 uppercase font-black tracking-wider">
                            {session.slot_id || 'PENDING'}
                          </span>
                        </div>
                        <div className="text-[10px] text-(--color-y2k-text-muted) flex items-center gap-1.5">
                          <span>Check-In:</span>
                          <span className="text-white font-bold">{formatDateTime(session.check_in)}</span>
                        </div>
                      </div>

                      {/* Time Warp Actions */}
                      <div className="flex items-center gap-2 self-start md:self-auto shrink-0 w-full md:w-auto">
                        <select 
                          value={currentSelectedDuration}
                          onChange={(e) => handleWarpDurationsChange(session.id, parseInt(e.target.value))}
                          className="bg-black text-(--color-y2k-lime) border-2 border-(--color-y2k-border) p-2 text-xs font-mono focus:outline-none focus:border-(--color-y2k-lime) h-9 shrink-0 flex-1 md:flex-none"
                        >
                          <option value={15}>15 Menit</option>
                          <option value={60}>1 Jam (Rp5K)</option>
                          <option value={180}>3 Jam (Rp15K)</option>
                          <option value={360}>6 Jam (Rp30K)</option>
                          <option value={720}>12 Jam (Rp60K)</option>
                          <option value={1440}>24 Jam (Rp120K)</option>
                        </select>

                        <button 
                          onClick={() => handleSimulateCheckout(session, currentSelectedDuration)}
                          className="bg-(--color-y2k-purple) hover:bg-(--color-y2k-purple)/85 text-black border-2 border-black font-black uppercase text-[10px] tracking-wider px-3 h-9 flex items-center gap-1.5 transition-all hover:translate-x-[2px] hover:translate-y-[2px] shadow-[2px_2px_0px_0px_(--color-y2k-lime)] hover:shadow-none shrink-0"
                        >
                          ⚡ Warp & Out
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </Y2KCard>

          {/* MQTTX Log Importer */}
          <Y2KCard title="MQTTX Log Importer" variant="purple" icon={Terminal}>
            <p className="text-xs text-(--color-y2k-text-muted) mb-4">
              Impor riwayat log dari MQTTX untuk simulasi sekuensial. Tempelkan log teks mentah Anda ke editor di bawah ini.
            </p>
            <textarea 
              className="w-full h-32 bg-black/50 text-(--color-y2k-lime) border-2 border-(--color-y2k-border) p-3 text-xs font-mono focus:outline-none focus:border-(--color-y2k-lime) focus:ring-1 focus:ring-(--color-y2k-lime) rounded"
              placeholder="Paste MQTTX raw logs here..."
              value={rawLogsInput} 
              onChange={(e) => setRawLogsInput(e.target.value)} 
            />
            <div className="mt-4 flex gap-4">
              <Y2KButton onClick={handleParseLogs} variant="outline" className="text-xs py-2 px-4">
                Parse Data
              </Y2KButton>
              <Y2KButton onClick={handleStartReplay} disabled={isReplaying || parsedEvents.length === 0} variant="purple" className="text-xs py-2 px-4">
                {isReplaying ? "Simulating..." : "Jalankan Simulasi"}
              </Y2KButton>
            </div>
          </Y2KCard>
        </div>

      </div>
    </div>
  );

  // Helper helper to update warpDurations state
  function handleWarpDurationsChange(sessionId: string, val: number) {
    setWarpDurations(prev => ({
      ...prev,
      [sessionId]: val
    }));
  }
}