"use client";
import React, { useState, useEffect } from "react";
import {
  signInAnonymously,
  signInWithCustomToken,
  onAuthStateChanged,
  User as FirebaseUser,
} from "firebase/auth";
import { doc, setDoc, getDocs, collection, query, where, updateDoc } from "firebase/firestore";
import Y2KCard from "@/components/ui/Y2KCard";
import { Car, User, Lock, Cloud, Database, ShieldAlert, icons, Icon, EyeIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { appId, auth, db } from "./lib/firebase";

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [credentials, setCredentials] = useState({
    username: "",
    password: "",
    showPassword: false,
  });
  const [loginSuccess, setLoginSuccess] = useState(false);

  // Pantau status autentikasi
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (!currentUser) {
        signInAnonymously(auth).catch((err) => {
          console.error("Auth Error:", err);
          setError("Gagal inisialisasi sesi anonim.");
        });
      }
    });
    return () => unsubscribe();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!db) {
      setError("DATABASE_OFFLINE");
      return;
    }

    setLoading(true);
    setError(null);

    try {

      const usersRef = collection(db, "users");
      const q = query(usersRef, where("username", "==", credentials.username));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        setError("USER_NOT_FOUND");
        setLoading(false);
        return;
      }

      // Ambil data dari dokumen pertama yang ditemukan
      const userDoc = querySnapshot.docs[0];
      const userData = userDoc.data();
      const userRef = doc(db, "users", userDoc.id);

      // Validasi Password
      if (userData.password !== credentials.password) {
        setError("INVALID_PASSWORD");
        setLoading(false);
        return;
      }

      // SIMPAN DATA KE LOCALSTORAGE UNTUK DASHBOARD
      localStorage.setItem("active_user", JSON.stringify({
        username: userData.username,
        role: userData.role || 'operator',
        lastLogin: new Date().toISOString()
      }));

      // Update timestamp login terakhir
      await updateDoc(userRef, {
        last_login: new Date(),
      });

      setLoginSuccess(true);
      
      // Simulasi pindah halaman setelah 2 detik
      setTimeout(() => {
        console.log("Navigating to /dashboard...");
        router.push("/dashboard");
      }, 2000);

    } catch (err: any) {
      console.error("Login Error:", err);
      setError("ACCESS_DENIED");
      setLoading(false);
    }
  };

  if (loginSuccess) {
    return (
      <div className="min-h-screen bg-[#1A1A1A] flex flex-col items-center justify-center p-4 font-mono">
        <Y2KCard variant="lime" className="text-center max-w-sm">
          <h2 className="text-[#C4FF4D] text-2xl font-black mb-4 uppercase italic tracking-tighter">
            ACCESS_GRANTED
          </h2>
          <p className="text-white text-xs mb-6 uppercase tracking-widest">
            Sistem Berhasil Diverifikasi. Mengalihkan ke Dashboard...
          </p>
          <div className="w-full h-3 bg-[#4D4D4D] border-2 border-[#1A1A1A]">
            <div className="h-full bg-[#C4FF4D] animate-[progress_1.5s_ease-in-out]"></div>
          </div>
        </Y2KCard>
        <style jsx>{`
          @keyframes progress {
            0% {
              width: 0%;
            }
            100% {
              width: 100%;
            }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1A1A1A] flex items-center justify-center p-4 font-mono overflow-hidden relative">
      {/* Efek Background Y2K */}
      <div
        className="absolute top-0 left-0 w-full h-full opacity-5 pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(#C4FF4D 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      ></div>
      <div className="absolute top-[-10%] left-[-10%] w-[400px] h-[400px] bg-[#BA8CFF] opacity-10 rounded-full blur-[100px]"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[400px] h-[400px] bg-[#C4FF4D] opacity-10 rounded-full blur-[100px]"></div>

      <div className="max-w-md w-full relative">
        {/* Label Melayang */}
        <div className="absolute -top-6 -left-2 bg-[#BA8CFF] text-[#1A1A1A] px-4 py-1 font-black transform -rotate-1 border-2 border-[#1A1A1A] z-10 text-[10px] shadow-[2px_2px_0px_0px_#C4FF4D]">
          SECURITY_ACCESS_v3.2
        </div>

        <Y2KCard className="relative pt-10">
          <div className="text-center mb-10">
            <div className="inline-block p-2 border-2 border-[#C4FF4D] mb-4 bg-[#1A1A1A]">
              <Car className="text-[#C4FF4D]" size={32} />
            </div>
            <h1 className="text-[#C4FF4D] text-5xl font-black italic tracking-tighter mb-1 leading-none">
              P-IOT
            </h1>
            <p className="text-[#BA8CFF] text-[10px] uppercase font-bold tracking-[0.4em]">
              Integrated Parking Node
            </p>
          </div>

          {error && (
            <div className="mb-6 p-3 border-2 border-red-500 bg-red-500/10 text-red-500 text-[10px] font-bold flex items-center gap-2 animate-pulse">
              <ShieldAlert size={14} /> {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-[#C4FF4D] text-[10px] font-bold  tracking-widest">
                <User size={12} /> User_Identification
              </label>
              <input
                type="text"
                placeholder="USER_ID"
                className="w-full bg-[#4D4D4D] border-2 border-[#BA8CFF] p-3 text-white focus:outline-none focus:border-[#C4FF4D] font-bold  placeholder:opacity-20"
                value={credentials.username}
                onChange={(e) =>
                  setCredentials({ ...credentials, username: e.target.value })
                }
                required
              />
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-[#C4FF4D] text-[10px] font-bold  tracking-widest">
              <Lock size={12} /> Access_Key
              </label>
              <div className="relative">
              <input
                type={credentials.showPassword ? "text" : "password"}
                placeholder="********"
                className="w-full bg-[#4D4D4D] border-2 border-[#BA8CFF] p-3 text-white focus:outline-none focus:border-[#C4FF4D] font-bold placeholder:opacity-20"
                value={credentials.password}
                onChange={(e) =>
                setCredentials({ ...credentials, password: e.target.value })
                }
                required
              />
              <button
                type="button"
                onClick={() =>
                setCredentials({
                  ...credentials,
                  showPassword: !credentials.showPassword,
                })
                }
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#BA8CFF] hover:text-[#C4FF4D] transition-colors"
              >
                {credentials.showPassword ? <icons.Eye size={20} /> : <icons.EyeOff size={20} />}
              </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full bg-[#C4FF4D] text-[#1A1A1A] font-black py-4 border-2 border-[#1A1A1A] shadow-[4px_4px_0px_0px_rgba(186,140,255,1)] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all flex items-center justify-center gap-2  text-sm ${loading ? "opacity-50" : ""}`}
            >
              {loading ? "CONNECTING_TO_CLOUD..." : "INITIATE_SESSION"}
            </button>
          </form>

          {/* Status Footer */}
          <div className="mt-8 pt-6 border-t border-[#4D4D4D] flex justify-between items-center text-[9px] text-[#4D4D4D] font-bold uppercase italic tracking-tighter">
            <span className="flex items-center gap-1 text-[#BA8CFF]">
              <Cloud size={12} /> Firebase: {user ? "Online" : "Linking..."}
            </span>
            <span className="flex items-center gap-1 text-[#C4FF4D]">
              <Database size={12} /> DB: Firestore_Ready
            </span>
          </div>
        </Y2KCard>

        {/* Ornamen Sudut */}
        <div className="absolute -bottom-4 -right-4 w-12 h-12 border-r-4 border-b-4 border-[#BA8CFF] pointer-events-none opacity-50"></div>
      </div>
    </div>
  );
}
