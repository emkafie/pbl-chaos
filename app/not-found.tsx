"use client";
import React, { useState, useEffect } from "react";
import { 
  AlertTriangle, 
  Terminal, 
  ArrowLeft, 
  Home, 
  Cpu, 
  RefreshCw 
} from "lucide-react";

/**
 * =============================================================================
 * CUSTOM 404 NOT FOUND PAGE (Y2K Retro-Futurism Style)
 * Lokasi File: app/not-found.tsx
 * =============================================================================
 */

export default function NotFound() {
  const [glitch, setGlitch] = useState(false);
  const [dots, setDots] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Efek animasi glitch halus berkala
  useEffect(() => {
    const interval = setInterval(() => {
      setGlitch(true);
      setTimeout(() => setGlitch(false), 250);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Animasi loading dots pada teks konsol
  useEffect(() => {
    const interval = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? "" : prev + "."));
    }, 500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-[#1A1A1A] text-white font-mono flex items-center justify-center p-4 overflow-hidden relative selection:bg-[#FF5555] selection:text-white">
      {/* LATAR BELAKANG DOT GRID */}
      <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: "radial-gradient(#C4FF4D 1px, transparent 1px)", backgroundSize: "24px 24px" }}></div>
      
      {/* EFEK CRT SCANLINE */}
      <div className="absolute inset-0 pointer-events-none z-50 opacity-[0.04] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%]"></div>

      {/* PIJARAN CAHAYA UNGU & LIME */}
      <div className="absolute top-[-10%] left-[-10%] w-[300px] h-[300px] bg-[#BA8CFF] opacity-10 rounded-full blur-[80px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[300px] h-[300px] bg-[#C4FF4D] opacity-10 rounded-full blur-[80px] pointer-events-none"></div>

      <div className="max-w-2xl w-full relative z-10 animate-in fade-in zoom-in-95 duration-500">
        {/* BRACKET HIASAN SUDUT */}
        <div className="absolute -top-4 -left-4 w-12 h-12 border-t-4 border-l-4 border-[#BA8CFF] pointer-events-none"></div>
        <div className="absolute -bottom-4 -right-4 w-12 h-12 border-b-4 border-r-4 border-[#C4FF4D] pointer-events-none"></div>

        {/* DIALOG BOX UTAMA */}
        <div className="bg-[#1A1A1A] border-4 border-[#FF5555] shadow-[8px_8px_0px_0px_#FF5555] p-6 sm:p-10 relative">
          
          {/* TAB ATAS DIALOG BOX */}
          <div className="absolute -top-6 -left-2 bg-[#FF5555] text-[#1A1A1A] px-4 py-1 font-black transform -rotate-1 border-2 border-[#1A1A1A] text-[10px] tracking-widest shadow-[2px_2px_0px_0px_#1A1A1A]">
            KODE_KESALAHAN_FATAL: 404
          </div>

          <div className="flex flex-col items-center text-center">
            {/* IKON PERINGATAN */}
            <div className="mb-6 bg-[#FF5555]/10 p-4 border-4 border-[#FF5555] animate-pulse">
              <AlertTriangle className="text-[#FF5555]" size={48} />
            </div>

            {/* JUDUL UTAMA */}
            <h1 className={`text-4xl sm:text-6xl font-black italic tracking-tighter mb-4 leading-none transition-all ${glitch ? 'skew-x-12 scale-105 text-[#BA8CFF]' : 'text-white'}`}>
              PAGE_<span className="text-[#FF5555] underline decoration-4">NOT_FOUND</span>
            </h1>

            <p className="text-xs sm:text-sm text-gray-400 uppercase font-bold tracking-widest mb-8 max-w-md">
              Sistem gagal melacak lokasi data yang Anda minta. Rute navigasi tidak valid atau telah kedaluwarsa.
            </p>

            {/* SIMULASI LOG TERMINAL */}
            <div className="w-full bg-[#111] border-2 border-[#4D4D4D] p-4 text-left text-[10px] leading-relaxed mb-8 select-none">
              <p className="text-[#FF5555] font-black">{">"} PENYELIDIK_RUTE_GAGAL: 404_NOT_FOUND</p>
              <p className="text-gray-500">{">"} Host Pengirim: {mounted ? window.location.host : 'localhost'}</p>
              <p className="text-gray-500">{">"} Rute Tidak Valid: {mounted ? window.location.pathname : '/unresolved'}</p>
              <p className="text-[#BA8CFF]">{">"} Membuang memori fisik ke terminal{dots}</p>
              <p className="text-[#C4FF4D]">{">"} SISTEM_PEMULIHAN_OTOMATIS: AKTIF [99.9% UPTIME]</p>
            </div>

            {/* PANEL TOMBOL NAVIGASI */}
            <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
              <a href="/dashboard" className="w-full sm:w-auto">
                <button className="w-full bg-[#C4FF4D] text-[#1A1A1A] font-black px-6 py-3 border-2 border-[#1A1A1A] shadow-[4px_4px_0px_0px_#BA8CFF] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all text-xs uppercase flex items-center justify-center gap-2">
                  <Home size={14} /> Kembali_Ke_Konsol
                </button>
              </a>
              
              <a href="/" className="w-full sm:w-auto">
                <button className="w-full bg-transparent text-[#BA8CFF] font-black px-6 py-3 border-2 border-[#BA8CFF] shadow-[4px_4px_0px_0px_#4D4D4D] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all text-xs uppercase flex items-center justify-center gap-2">
                  <ArrowLeft size={14} /> Pintu_Gerbang_Utama
                </button>
              </a>
            </div>

          </div>
        </div>

        {/* DATA METADATA BAWAH */}
        <div className="mt-6 flex justify-between text-[9px] text-gray-600 uppercase font-black tracking-widest">
          <span>Modul: NAVIGASI_KLIEN</span>
          <span className="text-[#FF5555] animate-pulse">KESALAHAN_SISTEM</span>
          <span>Node: JKT-Y2K-03</span>
        </div>

      </div>
    </div>
  );
}