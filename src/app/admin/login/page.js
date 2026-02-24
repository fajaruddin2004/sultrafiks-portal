"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase"; 
import { useRouter } from "next/navigation";
import { Mail, Lock, LogIn } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      console.log("1. Mengirim request ke Supabase...");

      // SISTEM BOM WAKTU: Kalau 10 detik Supabase tidak jawab, paksa error!
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Koneksi gagal. Cek internet atau matikan Brave Shields.")), 10000)
      );

      const loginPromise = supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      // Balapan antara proses login vs waktu batas 10 detik
      const { data, error: loginError } = await Promise.race([loginPromise, timeoutPromise]);

      if (loginError) throw new Error(loginError.message);
      
      if (!data || !data.user) {
        throw new Error("Akun bermasalah di database!");
      }

      console.log("2. Login berhasil, mengecek profil...");
      
      // Mengambil data profile
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", data.user.id)
        .maybeSingle();
        
      if (profileError) console.error("Error Cek Profil:", profileError);

      // AMBIL ROLE & PAKSA JADI HURUF KECIL
      const userRole = profile?.role?.toLowerCase() || "user";
      console.log("3. Role ditemukan:", userRole);

      // NAVIGASI PINTAR DENGAN REPLACE (Mencegah Stuck)
      if (userRole === "redaktur") {
        console.log("Mengarahkan ke Meja Redaktur...");
        window.location.replace("/admin/redaktur");
      } else if (userRole === "admin" || userRole === "wartawan") {
        console.log("Mengarahkan ke Input Berita...");
        window.location.replace("/admin/input-berita");
      } else {
        console.log("Role tidak dikenal, balik ke beranda.");
        window.location.replace("/");
      }
      
    } catch (err) {
      console.error("LOGIN ERROR:", err);
      setError(err?.message || "Terjadi kesalahan sistem.");
      setLoading(false); 
    }
  };

  return (
    <div className="min-h-screen bg-[#0F172A] flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* Logo Section */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black italic text-white tracking-tighter">
            SULTRAFIKS<span className="text-blue-500">ADMIN</span>
          </h1>
          <p className="text-slate-400 text-sm mt-2">Masuk ke Dashboard</p>
        </div>

        {/* Form Login */}
        <form onSubmit={handleLogin} className="bg-white rounded-[2.5rem] p-8 shadow-2xl">
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-2xl text-red-600 text-sm font-bold animate-pulse">
              {error}
            </div>
          )}

          <div className="space-y-4">
            {/* Input Email */}
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-900 placeholder-slate-400 outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              />
            </div>

            {/* Input Password */}
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-900 placeholder-slate-400 outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              />
            </div>

            {/* Tombol Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-2xl font-black uppercase text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50 shadow-lg shadow-blue-500/30 active:scale-95 mt-6"
            >
              {loading ? "MENGANALISA..." : "MASUK"} <LogIn size={18} />
            </button>
          </div>

          {/* Navigasi Register */}
          <p className="mt-8 text-center text-sm text-slate-500 font-medium">
            Belum punya akun?{" "}
            <span
              onClick={() => router.push("/admin/register")}
              className="text-blue-600 font-black cursor-pointer hover:underline transition-all"
            >
              Daftar di sini
            </span>
          </p>
        </form>
      </div>
    </div>
  );
}