"use client"

import { useState, useEffect } from "react";
import LoginPage from "@/app/auth/login/page";
import RegisterPage from "@/app/auth/register/page";
import { onAuthStateChanged, signInAnonymously } from "firebase/auth";
import { auth, db } from "@/app/lib/firebase";
import Y2KCard from "@/components/ui/Y2KCard";

export default function App() {
  const [view, setView] = useState<'login' | 'register' | 'success'>('login');
  
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (!currentUser) signInAnonymously(auth).catch(console.error);
    });
    return () => unsubscribe();
  }, []);

  if (view === 'success') {
    return (
      <div className="min-h-screen bg-[#1A1A1A] flex flex-col items-center justify-center p-4 font-mono">
        <Y2KCard variant="lime" className="text-center max-w-sm">
          <h2 className="text-[#C4FF4D] text-2xl font-black mb-4 uppercase italic tracking-tighter">ACCESS_GRANTED</h2>
          <p className="text-white text-xs mb-6 uppercase tracking-widest">Sistem Berhasil Diverifikasi. Mengalihkan ke Dashboard...</p>
          <div className="w-full h-3 bg-[#4D4D4D] border-2 border-[#1A1A1A]">
            <div className="h-full bg-[#C4FF4D] animate-[progress_1.5s_ease-in-out]"></div>
          </div>
        </Y2KCard>
        <style jsx>{`@keyframes progress { 0% { width: 0%; } 100% { width: 100%; } }`}</style>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1A1A1A] flex items-center justify-center p-4 font-mono overflow-hidden relative selection:bg-[#C4FF4D] selection:text-[#1A1A1A]">
      <div className="absolute top-0 left-0 w-full h-full opacity-5 pointer-events-none" style={{ backgroundImage: "radial-gradient(#C4FF4D 1px, transparent 1px)", backgroundSize: "24px 24px" }}></div>
      <div className="absolute top-[-10%] left-[-10%] w-[400px] h-[400px] bg-[#BA8CFF] opacity-10 rounded-full blur-[100px]"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[400px] h-[400px] bg-[#C4FF4D] opacity-10 rounded-full blur-[100px]"></div>

      {view === 'login' ? (
        <LoginPage onSwitch={() => setView('register')} onSuccess={() => setView('success')} />
      ) : (
        <RegisterPage onSwitch={() => setView('login')} />
      )}
    </div>
  );
}