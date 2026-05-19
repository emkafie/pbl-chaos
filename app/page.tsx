"use client";
import React, { useState, useEffect } from "react";
import { 
  Car, 
  Cpu, 
  Cloud, 
  Database, 
  ArrowRight, 
  Terminal, 
  ShieldCheck, 
  Activity, 
  Zap,
  Globe,
  Menu,
  X
} from "lucide-react";
import Y2KButton from "@/components/ui/Y2KButton";
import FeatureCard from "@/components/ui/FeatureCard";
import SlotGrid from "@/components/parking/SlotGrid";
import { ParkingSlot } from "@/types";
import { useParkingSlots } from "@/app/lib/useParkingSlots";

export default function App() {
  const [glitch, setGlitch] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { slots, totalSlots, availableSlots, occupiedSlots, occupancyRate } = useParkingSlots();

  useEffect(() => {
    const interval = setInterval(() => {
      setGlitch(true);
      setTimeout(() => setGlitch(false), 200);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-[var(--color-y2k-bg-main)] text-[var(--color-y2k-text-main)] font-mono overflow-x-hidden selection:bg-[var(--color-y2k-lime)] selection:text-[var(--color-y2k-button-text)]">
      {/* DOT GRID BACKGROUND */}
      <div className="fixed inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: "radial-gradient(var(--color-y2k-lime) 1px, transparent 1px)", backgroundSize: "24px 24px" }}></div>
      
      {/* SCANLINE EFFECT */}
      <div className="fixed inset-0 pointer-events-none z-50 opacity-[0.03] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-size[length:100%_2px,3px_100%]"></div>

      {/* NAVBAR */}
      <nav className="relative z-10 h-20 sm:h-24 border-b-4 border-[var(--color-y2k-border)] bg-[var(--color-y2k-bg-main)]/80 backdrop-blur-md px-4 sm:px-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-[var(--color-y2k-lime)] p-2 border-2 border-[var(--color-y2k-solid-border)] shadow-[3px_3px_0px_0px_var(--color-y2k-purple)]">
            <Car className="text-[var(--color-y2k-button-text)]" size={22} />
          </div>
          <span className="font-black text-xl sm:text-2xl italic tracking-tighter text-[var(--color-y2k-lime)]">P-IOT</span>
        </div>

        {/* Desktop nav links */}
        <div className="hidden md:flex gap-8 text-[11px] font-black uppercase tracking-widest text-gray-500">
          <a href="#" className="hover:text-[var(--color-y2k-lime)] transition-colors">Technology</a>
          <a href="#" className="hover:text-[var(--color-y2k-lime)] transition-colors">Devices</a>
          <a href="#" className="hover:text-[var(--color-y2k-lime)] transition-colors">Analytics</a>
        </div>

        {/* Desktop CTA */}
        <div className="hidden sm:block">
          <Y2KButton onClick={() => window.location.href = '/auth'}>
            Access_Terminal <ArrowRight size={16} />
          </Y2KButton>
        </div>

        {/* Mobile hamburger */}
        <button
          className="sm:hidden p-2 border-2 border-[var(--color-y2k-lime)] text-[var(--color-y2k-lime)]"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </nav>

      {/* Mobile menu dropdown */}
      {mobileMenuOpen && (
        <div className="relative z-10 bg-[var(--color-y2k-bg-main)]/95 border-b-4 border-[var(--color-y2k-border)] px-4 py-6 flex flex-col gap-4 sm:hidden">
          <a href="#" className="text-[11px] font-black uppercase tracking-widest text-[var(--color-y2k-text-muted)] hover:text-[var(--color-y2k-lime)] transition-colors">Technology</a>
          <a href="#" className="text-[11px] font-black uppercase tracking-widest text-[var(--color-y2k-text-muted)] hover:text-[var(--color-y2k-lime)] transition-colors">Devices</a>
          <a href="#" className="text-[11px] font-black uppercase tracking-widest text-[var(--color-y2k-text-muted)] hover:text-[var(--color-y2k-lime)] transition-colors">Analytics</a>
          <Y2KButton onClick={() => window.location.href = '/auth'}>
            Access_Terminal <ArrowRight size={16} />
          </Y2KButton>
        </div>
      )}

      {/* HERO SECTION */}
      <section className="relative pt-16 sm:pt-20 pb-24 sm:pb-32 px-4 sm:px-8 flex flex-col items-center text-center">
        {/* Decorative Elements — hidden on very small screens */}
        <div className="hidden sm:block absolute top-20 left-10 w-24 h-24 border-t-4 border-l-4 border-[var(--color-y2k-purple)] opacity-30"></div>
        <div className="hidden sm:block absolute bottom-20 right-10 w-24 h-24 border-b-4 border-r-4 border-[var(--color-y2k-lime)] opacity-30"></div>

        <div className="bg-[var(--color-y2k-purple)] text-[var(--color-y2k-button-text)] px-4 py-1 font-black text-[10px] uppercase mb-4 shadow-[3px_3px_0px_0px_var(--color-y2k-lime)]">
          [ System Status: Online ] Node_ID: JKT-01
        </div>

        <h1 className={`text-5xl sm:text-7xl md:text-9xl font-black italic tracking-tighter mb-6 leading-none transition-all ${glitch ? 'skew-x-12 scale-105 text-[var(--color-y2k-purple)]' : 'text-[var(--color-y2k-text-main)]'}`}>
          SMART<br/>
          <span className="text-[var(--color-y2k-lime)] underline decoration-4 underline-offset-8">PARKING</span>
        </h1>

        <p className="max-w-xl text-[var(--color-y2k-text-muted)] text-sm md:text-base font-bold uppercase tracking-widest leading-relaxed mb-10 px-2">
          Monitoring ketersediaan slot parkir secara real-time dengan integrasi <span className="text-[var(--color-y2k-purple)]">Cloud Computing</span> &amp; <span className="text-[var(--color-y2k-lime)]">Big Data Analytics</span>.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 w-full sm:w-auto px-4 sm:px-0">
          <Y2KButton variant="lime">Explore Features</Y2KButton>
          <Y2KButton variant="outline">Watch Demo</Y2KButton>
        </div>

        {/* Floating Icons Decors */}
        <div className="mt-16 sm:mt-20 flex gap-8 sm:gap-12 text-[var(--color-y2k-border)] animate-bounce">
           <Globe size={28} />
           <Activity size={28} />
           <Zap size={28} />
        </div>
      </section>

      {/* FEATURES GRID */}
      <section className="px-4 sm:px-8 pb-24 sm:pb-32 max-w-7xl mx-auto">
        <div className="mb-12 sm:mb-16 border-l-8 border-[var(--color-y2k-lime)] pl-6">
          <h2 className="text-2xl sm:text-3xl font-black italic uppercase tracking-tighter text-[var(--color-y2k-lime)]">Integrated_Technologies</h2>
          <p className="text-[10px] text-gray-500 font-bold uppercase tracking-[0.4em]">Multi-Node Synergy v4.2</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-10">
          <FeatureCard 
            icon={Cpu} 
            color="var(--color-y2k-lime)"
            title="IoT Nodes" 
            desc="Deteksi presisi menggunakan sensor IR & Ultrasonic pada setiap slot, dikendalikan oleh mikrokontroler NodeMCU/ESP32."
          />
          <FeatureCard 
            icon={Cloud} 
            color="var(--color-y2k-purple)"
            title="Cloud Sync" 
            desc="Sinkronisasi data instan ke Firestore dengan protokol HTTP/MQTT untuk visualisasi real-time di dashboard web."
          />
          <FeatureCard 
            icon={Database} 
            color="var(--color-y2k-lime)"
            title="Big Data" 
            desc="Pencatatan riwayat transaksi parkir untuk analisis okupansi dan prediksi jam sibuk berbasis data historis."
          />
        </div>
      </section>

      {/* SYSTEM PREVIEW / TERMINAL BOX */}
      <section className="px-4 sm:px-8 pb-24 sm:pb-32">
        <div className="max-w-4xl mx-auto bg-[var(--color-y2k-bg-main)] border-4 border-[var(--color-y2k-border)] overflow-hidden shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] sm:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]">
          <div className="h-10 bg-[var(--color-y2k-border)] flex items-center justify-between px-4">
            <div className="flex gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
            </div>
            <div className="text-[10px] font-black uppercase text-gray-300">Preview_Terminal.exe</div>
            <div className="w-10"></div>
          </div>
          <div className="p-4 sm:p-8 font-mono text-[11px] leading-relaxed overflow-x-auto">
            <p className="text-[var(--color-y2k-lime)] mb-2">{">"} INITIALIZING_P-IOT_SYTEM...</p>
            <p className="text-[var(--color-y2k-text-main)] mb-2">{">"} CONNECTING TO FIRESTORE CLOUD... [ OK ]</p>
            <p className="text-[var(--color-y2k-text-main)] mb-2">{">"} DISCOVERING IOT NODES... [ 12 NODES FOUND ]</p>
            <p className="text-[var(--color-y2k-purple)] animate-pulse">{">"} LISTENING FOR INCOMING DATA STREAM_</p>
            
            <div className="mt-4">
              <SlotGrid slots={slots} totalSlots={totalSlots} availableSlots={availableSlots} occupiedSlots={occupiedSlots} occupancyRate={occupancyRate} />
            </div>

          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t-4 border-[var(--color-y2k-border)] p-6 sm:p-12 text-center">
        <div className="flex justify-center gap-4 mb-6">
          <ShieldCheck className="text-[var(--color-y2k-lime)]" size={20} />
          <Terminal className="text-[var(--color-y2k-purple)]" size={20} />
        </div>
        <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">
          &copy; 2026 POLITEKNIK NEGERI MALANG - JURUSAN TEKNOLOGI INFORMASI
        </p>
        <p className="text-[9px] text-[var(--color-y2k-lime)] mt-2 italic font-bold">SMART PARKING PROJECT TEAM 03</p>
      </footer>
    </div>
  );
}