"use client";
import React, { useState, useEffect, useMemo } from "react";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { db, appId } from "@/app/lib/firebase";
import { ParkingSession } from "@/types";
import { TrendCharts } from "@/components/analytics/TrandCharts";
import { BarChart3, TrendingUp, DollarSign, Clock } from "lucide-react";

export default function AnalyticsPage() {
  const [sessions, setSessions] = useState<ParkingSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const sessionPath = `artifacts/${appId}/public/data/sessions`;
        const q = query(collection(db, sessionPath));
        const querySnapshot = await getDocs(q);
        
        const data = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as ParkingSession[];
        
        setSessions(data);
      } catch (error) {
        console.error("Gagal mengambil data Big Data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSessions();
  }, []);

  // PROSES DATA (Logic Big Data)
  const processedData = useMemo(() => {
    // 1. Agregasi per Jam (Peak Hours)
    const hours = Array.from({ length: 24 }, (_, i) => ({ 
      hour: `${i.toString().padStart(2, '0')}:00`, 
      count: 0 
    }));

    // 2. Agregasi per Hari (Revenue)
    const dailyRev: { [key: string]: number } = {};

    let totalRevenue = 0;
    let totalDuration = 0;

    sessions.forEach(s => {
      const checkInDate = new Date(s.check_in);
      
      // Hitung jam sibuk
      const hr = checkInDate.getHours();
      hours[hr].count += 1;

      // Hitung revenue harian
      const dateKey = checkInDate.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' });
      dailyRev[dateKey] = (dailyRev[dateKey] || 0) + s.fee;

      totalRevenue += s.fee;
      totalDuration += s.duration_minutes;
    });

    const revenueArray = Object.keys(dailyRev).map(date => ({
      date,
      total: dailyRev[date]
    })).slice(-7); // Ambil 7 hari terakhir

    return {
      hourly: hours,
      daily: revenueArray,
      totalRevenue,
      avgDuration: sessions.length > 0 ? Math.round(totalDuration / sessions.length) : 0
    };
  }, [sessions]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-[#C4FF4D] font-mono">
        <div className="animate-pulse">INGESTING_BIG_DATA...</div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 md:p-8 space-y-6 sm:space-y-8 md:space-y-10 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between">
        <h1 className="text-[#C4FF4D] text-2xl sm:text-3xl font-black italic uppercase tracking-tighter flex items-center gap-3">
          <BarChart3 size={28} className="flex-shrink-0" /> Big_Data_Analytics
        </h1>
        <div className="bg-[#BA8CFF] text-[#1A1A1A] px-4 py-1 text-[10px] font-black uppercase shadow-[3px_3px_0px_0px_#C4FF4D] self-start sm:self-auto">
          Sample_Size: {sessions.length} Records
        </div>
      </div>

      {/* Ringkasan Statistik */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
        <SummaryCard 
          label="Total Revenue" 
          value={`Rp ${processedData.totalRevenue.toLocaleString()}`} 
          icon={<DollarSign size={20}/>} 
          color="#C4FF4D" 
        />
        <SummaryCard 
          label="Avg Duration" 
          value={`${processedData.avgDuration} Mins`} 
          icon={<Clock size={20}/>} 
          color="#BA8CFF" 
        />
        <SummaryCard 
          label="Conversion" 
          value={`${Math.round((sessions.filter(s => s.status === 'completed').length / sessions.length) * 100)}%`} 
          icon={<TrendingUp size={20}/>} 
          color="#C4FF4D" 
        />
      </div>

      {/* Grafik */}
      <TrendCharts hourlyData={processedData.hourly} dailyRevenue={processedData.daily} />
    </div>
  );
}

const SummaryCard = ({ label, value, icon, color }: any) => (
  <div className="bg-[#1A1A1A] border-4 p-4 sm:p-6 shadow-[5px_5px_0px_0px_#000]" style={{ borderColor: color }}>
    <div className="flex justify-between items-center opacity-70 mb-2">
      <span className="text-[10px] font-black uppercase tracking-[0.2em]" style={{ color }}>{label}</span>
      <div style={{ color }}>{icon}</div>
    </div>
    <div className="text-2xl sm:text-3xl font-black italic break-all">{value}</div>
  </div>
);