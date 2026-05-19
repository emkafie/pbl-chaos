"use client"

import { useState } from "react";
import { Car, User, Lock, ShieldAlert, Eye, EyeOff } from "lucide-react";
import Y2KCard from "@/components/ui/Y2KCard";
import { AuthService } from "@/app/lib/authService";
import { db } from "@/app/lib/firebase";
import { useRouter } from "next/navigation";


import { useAuth } from "@/app/context/AuthContext";

const LoginPage = ({ onSwitch, onSuccess }: any) => {
  const { signIn } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [credentials, setCredentials] = useState({ username: "", password: "", showPassword: false });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // 1. Panggil signIn dari Context (akan menangani state & localStorage)
      await signIn(credentials.username, credentials.password);
      
      // 2. Trigger Sukses UI
      onSuccess();

      // 3. Navigasi ke Dashboard
      setTimeout(() => {
        console.log("Navigating to Dashboard...")
        router.push("/dashboard");
      }, 2000);
    } catch (err: any) {
      setError(err.message || "ACCESS_DENIED");
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md w-full relative">
      <div className="absolute -top-6 -left-2 bg-[var(--color-y2k-purple)] text-[var(--color-y2k-button-text)] px-4 py-1 font-black transform -rotate-1 border-2 border-[var(--color-y2k-solid-border)] z-10 text-[10px] shadow-[2px_2px_0px_0px_var(--color-y2k-lime)]">
        SECURITY_ACCESS_v4.0
      </div>

      <Y2KCard className="relative pt-10">
        <div className="text-center mb-10">
          <div className="inline-block p-2 border-2 border-[var(--color-y2k-lime)] mb-4 bg-[var(--color-y2k-bg-main)]"><Car className="text-[var(--color-y2k-lime)]" size={32} /></div>
          <h1 className="text-[var(--color-y2k-lime)] text-5xl font-black italic tracking-tighter mb-1 leading-none">P-IOT</h1>
          <p className="text-[var(--color-y2k-purple)] text-[10px] uppercase font-bold tracking-[0.4em]">Integrated Parking Node</p>
        </div>

        {error && (
          <div className="mb-6 p-3 border-2 border-red-500 bg-red-500/10 text-red-500 text-[10px] font-bold flex items-center gap-2 animate-pulse">
            <ShieldAlert size={14} /> {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-[var(--color-y2k-lime)] text-[10px] font-bold tracking-widest"><User size={12} /> User_Identification</label>
            <input type="text" placeholder="USER_ID" className="w-full bg-[var(--color-y2k-border)] border-2 border-[var(--color-y2k-purple)] p-3 text-[var(--color-y2k-text-main)] focus:outline-none focus:border-[var(--color-y2k-lime)] font-bold placeholder:opacity-20" value={credentials.username} onChange={(e) => setCredentials({ ...credentials, username: e.target.value })} required />
          </div>

          <div className="space-y-2">
            <label className="flex items-center gap-2 text-[var(--color-y2k-lime)] text-[10px] font-bold tracking-widest"><Lock size={12} /> Access_Key</label>
            <div className="relative">
              <input type={credentials.showPassword ? "text" : "password"} placeholder="********" className="w-full bg-[var(--color-y2k-border)] border-2 border-[var(--color-y2k-purple)] p-3 text-[var(--color-y2k-text-main)] focus:outline-none focus:border-[var(--color-y2k-lime)] font-bold placeholder:opacity-20" value={credentials.password} onChange={(e) => setCredentials({ ...credentials, password: e.target.value })} required />
              <button type="button" onClick={() => setCredentials({ ...credentials, showPassword: !credentials.showPassword })} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-y2k-purple)] hover:text-[var(--color-y2k-lime)] transition-colors">
                {credentials.showPassword ? <Eye size={20} /> : <EyeOff size={20} />}
              </button>
            </div>
          </div>

          <button type="submit" disabled={loading} className={`w-full bg-[var(--color-y2k-lime)] text-[var(--color-y2k-button-text)] font-black py-4 border-2 border-[var(--color-y2k-solid-border)] shadow-[4px_4px_0px_0px_var(--color-y2k-purple)] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all flex items-center justify-center gap-2 text-sm uppercase ${loading ? "opacity-50" : ""}`}>
            {loading ? "VERIFYING_HASH..." : "INITIATE_SESSION"}
          </button>
        </form>

        <button onClick={onSwitch} className="w-full mt-6 text-[10px] text-gray-500 hover:text-[var(--color-y2k-lime)] font-bold underline uppercase italic tracking-widest">
          Register New Node
        </button>
      </Y2KCard>
    </div>
  );
};

export default LoginPage;