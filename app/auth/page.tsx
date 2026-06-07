"use client"

import LoginPage from "@/app/auth/login/page";
import Y2KCard from "@/components/ui/Y2KCard";
import { useState } from "react";

export default function App() {
  const [view, setView] = useState<'login' | 'success'>('login');

  if (view === 'success') {
    return (
      <div className="min-h-screen bg-(--color-y2k-bg-main) flex flex-col items-center justify-center p-4 font-mono">
        <Y2KCard variant="lime" className="text-center max-w-sm">
          <h2 className="text-(--color-y2k-lime) text-2xl font-black mb-4 uppercase italic tracking-tighter">ACCESS_GRANTED</h2>
          <p className="text-(--color-y2k-text-main) text-xs mb-6 uppercase tracking-widest">Sistem Berhasil Diverifikasi. Mengalihkan ke Dashboard...</p>
          <div className="w-full h-3 bg-(--color-y2k-border) border-2 border-(--color-y2k-solid-border)">
            <div className="h-full bg-(--color-y2k-lime) animate-[progress_1.5s_ease-in-out]"></div>
          </div>
        </Y2KCard>
        <style jsx>{`@keyframes progress { 0% { width: 0%; } 100% { width: 100%; } }`}</style>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-(--color-y2k-bg-main) flex items-center justify-center p-4 font-mono overflow-hidden relative selection:bg-(--color-y2k-lime) selection:text-(--color-y2k-button-text)">
      <div className="absolute top-0 left-0 w-full h-full opacity-5 pointer-events-none" style={{ backgroundImage: "radial-gradient(var(--color-y2k-lime) 1px, transparent 1px)", backgroundSize: "24px 24px" }}></div>
      <div className="absolute top-[-10%] left-[-10%] w-100 h-100 bg-(--color-y2k-purple) opacity-10 rounded-full blur-[100px]"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-100 h-100 bg-(--color-y2k-lime) opacity-10 rounded-full blur-[100px]"></div>

      <LoginPage onSuccess={() => setView('success')} />
    </div>
  );
}