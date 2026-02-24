"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase"; 
import { useRouter } from "next/navigation";
import Image from "next/image";
import { User, Mail, Lock, Phone, ArrowRight, Camera } from "lucide-react";

export default function RegisterPage() {
  const [form, setForm] = useState({
    fullName: "",
    username: "",
    email: "",
    password: "",
    phone: "",
  });
  // State baru untuk menyimpan file foto dan preview-nya
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const router = useRouter();

  // Fungsi untuk menangani saat user memilih file
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatarFile(file);
      // Membuat URL preview lokal agar user bisa melihat foto yang dipilih
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // PEMBERSIHAN NUKLIR: Hilangkan semua jenis spasi, karakter gaib, dan paksa huruf kecil
      const cleanEmail = form.email.replace(/[\s\u200B-\u200D\uFEFF]/g, '').toLowerCase();

      // 1. Buat user dengan Supabase Auth pakai email yang sudah dibersihkan
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: cleanEmail, 
        password: form.password,
      });

      if (authError) throw authError;

      if (authData.user) {
        let avatarUrl = null;

        // 2. Proses Upload Foto (Jika user memilih foto)
        if (avatarFile) {
          // Membuat nama file unik: ID-User/timestamp_namafile
          const fileExt = avatarFile.name.split('.').pop();
          const fileName = `${authData.user.id}/${Date.now()}_avatar.${fileExt}`;

          const { error: uploadError } = await supabase.storage
            .from('avatars') 
            .upload(fileName, avatarFile);

          if (uploadError) throw uploadError;

          // Dapatkan URL publik foto yang baru diupload
          const { data: urlData } = supabase.storage
            .from('avatars')
            .getPublicUrl(fileName);
          
          avatarUrl = urlData.publicUrl;
        }

        // 3. Simpan data profile lengkap (termasuk URL foto jika ada)
        const { error: profileError } = await supabase
          .from("profiles")
          .insert([
            {
              id: authData.user.id,
              full_name: form.fullName,
              username: form.username,
              phone_number: form.phone,
              role: "wartawan",
              avatar_url: avatarUrl, // Masukkan URL foto ke database
            },
          ]);

        if (profileError) throw profileError;
      }

      alert("Pendaftaran berhasil! Silakan login.");
      router.push("/admin/login");
    } catch (error) {
      console.error("Register Error:", error);
      setError(error.message || "Terjadi kesalahan saat mendaftar.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0F172A] flex items-center justify-center p-6 py-12">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black italic text-white tracking-tighter">
            SULTRAFIKS<span className="text-blue-500">ADMIN</span>
          </h1>
          <p className="text-slate-400 text-sm mt-2">Daftar Wartawan Baru</p>
        </div>

        {/* Form Register */}
        <form onSubmit={handleRegister} className="bg-white rounded-[2.5rem] p-8 shadow-2xl">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl text-red-600 text-sm font-medium break-words">
              {error}
            </div>
          )}

          <div className="space-y-5">
            {/* --- INPUT FOTO PROFIL --- */}
            <div className="flex justify-center mb-6">
              <label className="relative group cursor-pointer">
                <div className="w-28 h-28 rounded-full bg-slate-100 border-4 border-slate-50 shadow-inner overflow-hidden relative flex items-center justify-center group-hover:border-blue-200 transition-all">
                  {avatarPreview ? (
                    <Image 
                      src={avatarPreview} 
                      alt="Avatar Preview" 
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  ) : (
                    <User className="text-slate-300" size={48} />
                  )}
                  
                  <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Camera className="text-white" size={24} />
                  </div>
                </div>
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleFileChange}
                  className="hidden" 
                />
                 <p className="text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-3 group-hover:text-blue-500 transition-colors">
                  {avatarPreview ? "Ganti Foto" : "Upload Foto"}
                </p>
              </label>
            </div>
            {/* --- END INPUT FOTO --- */}


            {/* Full Name */}
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              <input
                type="text"
                placeholder="Nama Lengkap"
                value={form.fullName}
                onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                required
                className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              />
            </div>

            {/* Username */}
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              <input
                type="text"
                placeholder="Username"
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                required
                className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              />
            </div>

            {/* Email */}
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              <input
                type="email"
                placeholder="Email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
                className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              />
            </div>

            {/* Phone */}
            <div className="relative">
              <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              <input
                type="tel"
                placeholder="No. WhatsApp"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                required
                className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              />
            </div>

            {/* Password */}
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              <input
                type="password"
                placeholder="Password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
                minLength={6}
                className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              />
            </div>

            {/* Tombol Register */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-2xl font-black uppercase text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50 hover:shadow-lg shadow-blue-500/30 active:scale-95 mt-8"
            >
              {loading ? "Mendaftarkan..." : "Daftar Wartawan"} <ArrowRight size={18} />
            </button>
          </div>

          {/* Link ke Login */}
          <p className="mt-8 text-center text-sm text-slate-500 font-medium">
            Sudah punya akun?{" "}
            <span
              onClick={() => router.push("/admin/login")}
              className="text-blue-600 font-black cursor-pointer hover:underline transition-all"
            >
              Login di sini
            </span>
          </p>
        </form>
      </div>
    </div>
  );
}