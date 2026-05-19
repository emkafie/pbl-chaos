"use client"

import { useState } from "react";
import LoginPage from "@/app/auth/login/page";
import RegisterPage from "@/app/auth/register/page";
import Y2KCard from "@/components/ui/Y2KCard";

export default function App() {
  const [view, setView] = useState<'login' | 'register' | 'success'>('login');

  if (view === 'success') {
    return (
      <div className="min-h-screen bg-[var(--color-y2k-bg-main)] flex flex-col items-center justify-center p-4 font-mono">
        <Y2KCard variant="lime" className="text-center max-w-sm">
          <h2 className="text-[var(--color-y2k-lime)] text-2xl font-black mb-4 uppercase italic tracking-tighter">ACCESS_GRANTED</h2>
          <p className="text-[var(--color-y2k-text-main)] text-xs mb-6 uppercase tracking-widest">Sistem Berhasil Diverifikasi. Mengalihkan ke Dashboard...</p>
          <div className="w-full h-3 bg-[var(--color-y2k-border)] border-2 border-[var(--color-y2k-solid-border)]">
            <div className="h-full bg-[var(--color-y2k-lime)] animate-[progress_1.5s_ease-in-out]"></div>
          </div>
        </Y2KCard>
        <style jsx>{`@keyframes progress { 0% { width: 0%; } 100% { width: 100%; } }`}</style>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--color-y2k-bg-main)] flex items-center justify-center p-4 font-mono overflow-hidden relative selection:bg-[var(--color-y2k-lime)] selection:text-[var(--color-y2k-button-text)]">
      <div className="absolute top-0 left-0 w-full h-full opacity-5 pointer-events-none" style={{ backgroundImage: "radial-gradient(var(--color-y2k-lime) 1px, transparent 1px)", backgroundSize: "24px 24px" }}></div>
      <div className="absolute top-[-10%] left-[-10%] w-[400px] h-[400px] bg-[var(--color-y2k-purple)] opacity-10 rounded-full blur-[100px]"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[400px] h-[400px] bg-[var(--color-y2k-lime)] opacity-10 rounded-full blur-[100px]"></div>

      {view === 'login' ? (
        <LoginPage onSwitch={() => setView('register')} onSuccess={() => setView('success')} />
      ) : (
        <RegisterPage onSwitch={() => setView('login')} />
      )}
    </div>
  );
}