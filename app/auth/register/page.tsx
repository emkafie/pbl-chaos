"use client"

import { useState } from "react";
import { UserPlus, User, Key, ShieldAlert, Eye, EyeOff, Lock } from "lucide-react"
import Y2KCard from "@/components/ui/Y2KCard"; 
import { AuthService } from "@/app/lib/authService";
import { db } from "@/app/lib/firebase";

const RegisterPage = ({ onSwitch }: any) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [credentials, setCredentials] = useState({ username: "", password: "", showPassword: false });

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Panggil AuthService
      await AuthService.register(db, credentials.username, credentials.password);
      
      setSuccess(true);
      setTimeout(() => {
        onSwitch(); // Kembali ke halaman login setelah 2 detik
      }, 2000);
    } catch (err: any) {
      setError(err.message || "REGISTRATION_FAILED");
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md w-full relative">
       <div className="absolute -top-6 -left-2 bg-(--color-y2k-lime) text-(--color-y2k-button-text) px-4 py-1 font-black transform -rotate-1 border-2 border-(--color-y2k-solid-border) z-10 text-[10px] shadow-[2px_2px_0px_0px_var(--color-y2k-purple)]">
        NODE_ENROLLMENT_v1.0
      </div>

      <Y2KCard className="relative pt-10" variant="grey">
        <div className="text-center mb-8">
          <UserPlus className="text-(--color-y2k-purple) mx-auto mb-4" size={40} />
          <h1 className="text-(--color-y2k-lime) text-4xl font-black italic tracking-tighter mb-1 leading-none uppercase">Register</h1>
          <p className="text-(--color-y2k-purple) text-[10px] uppercase font-bold tracking-[0.4em]">Create Operator ID</p>
        </div>

        {error && (
          <div className="mb-6 p-3 border-2 border-red-500 bg-red-500/10 text-red-500 text-[10px] font-bold flex items-center gap-2 animate-pulse">
            <ShieldAlert size={14} /> {error}
          </div>
        )}

        {success ? (
          <div className="p-6 border-2 border-(--color-y2k-lime) text-(--color-y2k-lime) text-center font-bold text-xs tracking-widest animate-pulse">
            ID CREATED SUCCESSFULLY. <br/> HASH SECURED. <br/><br/> REDIRECTING TO LOGIN...
          </div>
        ) : (
          <form onSubmit={handleRegister} className="space-y-6">
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-(--color-y2k-lime) text-[10px] font-bold tracking-widest"><User size={12} /> Desired_ID</label>
              <input type="text" placeholder="NEW_USER_ID" className="w-full bg-(--color-y2k-border) border-2 border-(--color-y2k-purple) p-3 text-(--color-y2k-text-main) focus:outline-none focus:border-(--color-y2k-lime) font-bold placeholder:opacity-20" value={credentials.username} onChange={(e) => setCredentials({ ...credentials, username: e.target.value })} required />
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-(--color-y2k-lime) text-[10px] font-bold tracking-widest"><Lock size={12} /> Secure_Key</label>
              <div className="relative">
                <input type={credentials.showPassword ? "text" : "password"} placeholder="********" className="w-full bg-(--color-y2k-border) border-2 border-(--color-y2k-purple) p-3 text-(--color-y2k-text-main) focus:outline-none focus:border-(--color-y2k-lime) font-bold placeholder:opacity-20" value={credentials.password} onChange={(e) => setCredentials({ ...credentials, password: e.target.value })} required />
                <button type="button" onClick={() => setCredentials({ ...credentials, showPassword: !credentials.showPassword })} className="absolute right-3 top-1/2 -translate-y-1/2 text-(--color-y2k-purple) hover:text-(--color-y2k-lime) transition-colors">
                  {credentials.showPassword ? <Eye size={20} /> : <EyeOff size={20} />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading} className={`w-full bg-(--color-y2k-purple) text-(--color-y2k-button-text) font-black py-4 border-2 border-(--color-y2k-solid-border) shadow-[4px_4px_0px_0px_var(--color-y2k-lime)] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all flex items-center justify-center gap-2 text-sm uppercase ${loading ? "opacity-50" : ""}`}>
              {loading ? "ENCRYPTING..." : "REGISTER_NODE"}
            </button>
          </form>
        )}

        <button onClick={onSwitch} className="w-full mt-6 text-[10px] text-gray-500 hover:text-(--color-y2k-purple) font-bold underline uppercase italic tracking-widest">
          Return to Access Gateway
        </button>
      </Y2KCard>
    </div>
  );
}

export default RegisterPage;
