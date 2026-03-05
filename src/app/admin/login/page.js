"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { Send, AlertTriangle, KeyRound } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault(); 
    
    setLoading(true);
    setErrorMsg("");

    try {
      console.log("1. Mengirim request login ke Supabase Auth...");
      
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) throw new Error("Email atau password salah bos!");
      if (!authData.user) throw new Error("Tidak ada data user yang dikembalikan.");

      console.log("2. Login sukses, ID User:", authData.user.id);
      console.log("3. Mengecek KTP via Jalur Belakang...");

      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      const response = await fetch(`${supabaseUrl}/rest/v1/profiles?id=eq.${authData.user.id}&select=*`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseKey,
          'Authorization': `Bearer ${authData.session.access_token}` 
        }
      });

      if (!response.ok) {
         throw new Error("Koneksi ke tabel profil ditolak oleh server!");
      }

      const profiles = await response.json();

      if (!profiles || profiles.length === 0) {
          throw new Error("KTP Anda tidak ditemukan di tabel 'profiles'.");
      }

      const profileData = profiles[0];
      const userRole = profileData.role?.toLowerCase();
      console.log("4. KTP Ditemukan! Jabatan:", userRole);

      // 🔥 LOGIKA PENGARAHAN JALAN YANG SUDAH DIUPDATE 🔥
      if (userRole === "admin") {
        window.location.replace("/admin/super"); // Arahkan ke Ruang Super Admin
      } else if (userRole === "redaktur") {
        window.location.replace("/admin/dashboard"); // Arahkan ke Meja Redaksi
      } else {
        window.location.replace("/admin/input-berita"); // Arahkan ke Workspace Wartawan
      }

    } catch (error) {
      console.error("🔥 LOGIN ERROR:", error.message);
      setErrorMsg(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0F172A] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black italic text-white uppercase tracking-tighter">
            SULTRAFIKS<span className="text-blue-500">ADMIN</span>
          </h1>
          <p className="text-slate-400 text-sm font-bold uppercase tracking-widest mt-2">
            Pintu Gerbang Portal
          </p>
        </div>

        <form onSubmit={handleLogin} className="bg-white p-6 md:p-8 rounded-[2rem] shadow-2xl">
          
          {errorMsg && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3 text-red-600">
              <AlertTriangle className="shrink-0 mt-0.5" size={18} />
              <p className="text-xs md:text-sm font-bold leading-relaxed">{errorMsg}</p>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Alamat Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                placeholder="email@sultrafiks.com"
              />
            </div>

            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Kata Sandi</label>
              <div className="relative">
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  placeholder="••••••••"
                />
                <KeyRound size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-8 flex items-center justify-center gap-2 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black uppercase text-xs md:text-sm tracking-widest shadow-lg shadow-blue-500/30 active:scale-95 transition-all disabled:opacity-50"
          >
            {loading ? "MEMERIKSA KTP..." : "MASUK SEKARANG"}
            {!loading && <Send size={16} />}
          </button>

          <div className="mt-6 text-center">
            <button type="button" onClick={() => router.push('/admin/register')} className="text-xs font-bold text-slate-400 hover:text-blue-600 transition-colors">
              Belum punya KTP Pers? <span className="underline">Daftar di sini</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}