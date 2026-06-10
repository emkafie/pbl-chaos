"use client";

import Y2KCard from "@/components/ui/Y2KCard";
import { CreditCard, Clock, AlertCircle, Car, ChevronLeft, ChevronRight } from "lucide-react";
import { useState, useEffect, useCallback, useMemo } from "react";

interface BalanceData {
  rfid_uid: string;
  saldo: number;
  owner: string;
  last_transaction: string | null;
}

interface SessionData {
  id: string;
  rfid_uid: string;
  check_in: string;
  check_out: string | null;
  duration_minutes: number;
  fee: number;
  slot_id: string;
  status: "ongoing" | "completed";
}

interface GuestTabProps {
  rfidUid: string;
}

const ITEMS_PER_PAGE = 8;

export default function GuestTab({ rfidUid }: GuestTabProps) {
  const [balance, setBalance] = useState<BalanceData | null>(null);
  const [sessions, setSessions] = useState<SessionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const fetchData = useCallback(async () => {
    if (!rfidUid) return;

    try {
      const [balanceRes, historyRes] = await Promise.all([
        fetch(`/api/guest/balance?rfid_uid=${encodeURIComponent(rfidUid)}`),
        fetch(`/api/guest/history?rfid_uid=${encodeURIComponent(rfidUid)}`),
      ]);

      if (balanceRes.ok) {
        setBalance(await balanceRes.json());
      } else if (balanceRes.status === 404) {
        setBalance(null);
      } else {
        const err = await balanceRes.json();
        throw new Error(err.error || "BALANCE_FETCH_FAILED");
      }

      if (historyRes.ok) {
        const data = await historyRes.json();
        setSessions(data.sessions || []);
      }

      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load parking data");
    } finally {
      setLoading(false);
    }
  }, [rfidUid]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  useEffect(() => {
    setPage(1);
  }, [sessions.length]);

  const totalPages = Math.max(1, Math.ceil(sessions.length / ITEMS_PER_PAGE));
  const paginatedSessions = useMemo(() => {
    const start = (page - 1) * ITEMS_PER_PAGE;
    return sessions.slice(start, start + ITEMS_PER_PAGE);
  }, [sessions, page]);

  const formatRupiah = (amount: number) =>
    `Rp${amount.toLocaleString("id-ID")}`;

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleString("id-ID", {
        year: "numeric", month: "2-digit", day: "2-digit",
        hour: "2-digit", minute: "2-digit",
      });
    } catch {
      return "Invalid Date";
    }
  };

  const formatDuration = (minutes: number) => {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
  };

  const totalFee = useMemo(() => {
    return sessions.reduce((sum, s) => sum + (s.fee || 0), 0);
  }, [sessions]);

  if (loading) {
    return (
      <div className="w-full">
        <Y2KCard title="My_Parking" variant="lime">
          <div className="p-6 text-center text-(--color-y2k-text-muted) text-[11px] uppercase animate-pulse">
            Loading parking data...
          </div>
        </Y2KCard>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="sm:col-span-2">
          <Y2KCard title="Card_Status" variant="lime" className="h-full">
            {!rfidUid ? (
              <div className="p-4 bg-(--color-y2k-border)/10 border-2 border-(--color-y2k-border) text-center">
                <CreditCard size={32} className="mx-auto mb-3 text-(--color-y2k-text-muted)" />
                <p className="text-(--color-y2k-text-main) font-bold text-[11px] uppercase mb-1">RFID Card Not Linked</p>
                <p className="text-(--color-y2k-text-muted) text-[10px]">Hubungi admin untuk mendaftarkan RFID card Anda</p>
              </div>
            ) : balance ? (
              <div className="border-2 border-(--color-y2k-lime) bg-(--color-y2k-lime)/5 p-5">
                <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
                  <div>
                    <p className="text-[10px] uppercase text-(--color-y2k-text-muted) font-bold tracking-widest mb-1">RFID Card ID</p>
                    <p className="text-(--color-y2k-lime) font-mono text-sm font-bold">{balance.rfid_uid}</p>
                    {balance.last_transaction && (
                      <p className="text-[9px] uppercase text-(--color-y2k-text-muted) font-bold mt-3">
                        Last Transaction: <span className="text-(--color-y2k-text-main)">{formatDate(balance.last_transaction)}</span>
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] uppercase text-(--color-y2k-text-muted) font-bold tracking-widest mb-1">Balance</p>
                    <p className="text-(--color-y2k-lime) text-3xl font-black">{formatRupiah(balance.saldo)}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-(--color-y2k-border)/10 border-2 border-(--color-y2k-border) text-center">
                <CreditCard size={32} className="mx-auto mb-3 text-(--color-y2k-text-muted)" />
                <p className="text-(--color-y2k-text-muted) text-[10px] uppercase font-bold">RFID card tidak ditemukan di sistem</p>
              </div>
            )}
          </Y2KCard>
        </div>

        <Y2KCard title="Summary" variant="lime" className="h-full">
          <div className="space-y-4 p-2 flex flex-col justify-center h-full min-h-[180px]">
            <div className="text-center">
              <p className="text-[10px] uppercase text-(--color-y2k-text-muted) font-bold tracking-widest mb-1">Total Sessions</p>
              <p className="text-(--color-y2k-lime) text-2xl font-black">{sessions.length}</p>
            </div>
            <div className="text-center">
              <p className="text-[10px] uppercase text-(--color-y2k-text-muted) font-bold tracking-widest mb-1">Total Spent</p>
              <p className="text-(--color-y2k-purple) text-xl font-black">{formatRupiah(totalFee)}</p>
            </div>
            <div className="text-center">
              <p className="text-[10px] uppercase text-(--color-y2k-text-muted) font-bold tracking-widest mb-1">Ongoing</p>
              <p className="text-yellow-500 text-xl font-black">{sessions.filter((s) => s.status === "ongoing").length}</p>
            </div>
          </div>
        </Y2KCard>
      </div>

      {error && (
        <div className="p-3 bg-red-500/20 border-2 border-red-500 text-red-500 font-bold text-[10px] uppercase flex items-center gap-2">
          <AlertCircle size={16} />{error}
        </div>
      )}

      <Y2KCard title="Parking_History" variant="lime" icon={Clock}>
        {sessions.length === 0 ? (
          <div className="p-6 bg-(--color-y2k-border)/10 border-2 border-(--color-y2k-border) text-center">
            <Car size={40} className="mx-auto mb-4 text-(--color-y2k-text-muted)" />
            <p className="text-(--color-y2k-text-muted) text-[11px] uppercase font-bold">Belum ada riwayat parkir</p>
          </div>
        ) : (
          <>
            <div className="block md:hidden space-y-2">
              {paginatedSessions.map((session) => (
                <div key={session.id} className="border-2 border-(--color-y2k-border) bg-(--color-y2k-bg-main) p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase text-(--color-y2k-text-muted) font-bold">{session.slot_id}</span>
                    <span className={`px-2 py-0.5 border-2 uppercase text-[8px] font-bold ${session.status === "ongoing" ? "border-yellow-500 text-yellow-500" : "border-green-500 text-green-500"}`}>{session.status}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-1 text-[10px]">
                    <div><span className="text-(--color-y2k-text-muted)">Check-in: </span><span className="text-(--color-y2k-text-main) font-bold">{formatDate(session.check_in)}</span></div>
                    <div><span className="text-(--color-y2k-text-muted)">Check-out: </span><span className="text-(--color-y2k-text-main) font-bold">{session.check_out ? formatDate(session.check_out) : "\u2014"}</span></div>
                    <div><span className="text-(--color-y2k-text-muted)">Duration: </span><span className="text-(--color-y2k-text-main) font-bold">{formatDuration(session.duration_minutes)}</span></div>
                    <div><span className="text-(--color-y2k-text-muted)">Fee: </span><span className="text-(--color-y2k-lime) font-bold">{formatRupiah(session.fee)}</span></div>
                  </div>
                </div>
              ))}
            </div>

            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-sm font-bold">
                <thead className="bg-(--color-y2k-border)/20 border-b-2 border-(--color-y2k-border)">
                  <tr className="uppercase text-(--color-y2k-purple) italic text-sm">
                    <th className="p-3">Slot</th><th className="p-3">Check-in</th><th className="p-3">Check-out</th><th className="p-3">Duration</th><th className="p-3">Fee</th><th className="p-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-(--color-y2k-border)">
                  {paginatedSessions.map((session) => (
                    <tr key={session.id} className="hover:bg-(--color-y2k-lime)/5 transition-colors text-sm">
                      <td className="p-3 text-(--color-y2k-lime)">{session.slot_id}</td>
                      <td className="p-3 text-(--color-y2k-text-main)">{formatDate(session.check_in)}</td>
                      <td className="p-3 text-(--color-y2k-text-main)">{session.check_out ? formatDate(session.check_out) : "\u2014"}</td>
                      <td className="p-3 text-(--color-y2k-text-muted)">{formatDuration(session.duration_minutes)}</td>
                      <td className="p-3 text-(--color-y2k-lime)">{formatRupiah(session.fee)}</td>
                      <td className="p-3"><span className={`px-2 py-0.5 border-2 uppercase text-xs font-bold ${session.status === "ongoing" ? "border-yellow-500 text-yellow-500" : "border-green-500 text-green-500"}`}>{session.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-4 border-t border-(--color-y2k-border) mt-4">
                <p className="text-[10px] text-(--color-y2k-text-muted) font-bold uppercase">Page {page} / {totalPages}</p>
                <div className="flex gap-2">
                  <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1} className="px-3 py-1.5 border-2 border-(--color-y2k-border) text-(--color-y2k-text-main) text-[10px] font-bold uppercase hover:bg-(--color-y2k-lime)/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center gap-1"><ChevronLeft size={12} /> Prev</button>
                  <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="px-3 py-1.5 border-2 border-(--color-y2k-lime) text-(--color-y2k-lime) text-[10px] font-bold uppercase hover:bg-(--color-y2k-lime)/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center gap-1">Next <ChevronRight size={12} /></button>
                </div>
              </div>
            )}
            <div className="mt-3 text-[9px] text-(--color-y2k-text-muted) text-right font-bold uppercase">Menampilkan {paginatedSessions.length} dari {sessions.length} sesi</div>
          </>
        )}
      </Y2KCard>
    </div>
  );
}
