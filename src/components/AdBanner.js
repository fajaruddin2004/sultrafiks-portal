"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Image from "next/image";

export default function AdBanner({ position, className = "" }) {
  const [ad, setAd] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAd = async () => {
      try {
        const { data, error } = await supabase
          .from("ads")
          .select("*")
          .eq("is_active", true)          
          .eq("position", position)       
          .order("created_at", { ascending: false }) 
          .limit(1); // 🔥 .single() KITA HAPUS DI SINI BIAR TIDAK ERROR 406 🔥

        if (error) throw error;

        // Cek apakah datanya ada (panjang array lebih dari 0)
        if (data && data.length > 0) {
          setAd(data[0]); // Ambil data urutan pertama
        } else {
          setAd(null); // Kosongkan jika tidak ada iklan
        }
      } catch (error) {
        // Cukup tampilkan peringatan halus kuning, bukan error merah
        console.warn(`Info: Ruang iklan untuk posisi '${position}' masih kosong.`);
      } finally {
        setLoading(false);
      }
    };

    fetchAd();
  }, [position]);

  if (loading) {
    return (
      <div className={`w-full h-full bg-slate-100 animate-pulse rounded-xl flex items-center justify-center border border-slate-200 ${className}`}>
        <span className="text-[10px] font-bold text-slate-300 tracking-widest uppercase">Memuat Iklan...</span>
      </div>
    );
  }

  if (!ad) {
    // Jika tidak ada iklan aktif di posisi ini, tampilkan kotak default
    return (
      <div className={`w-full h-full bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center text-slate-400 ${className}`}>
        <span className="text-xs font-black uppercase tracking-widest">Ruang Iklan Tersedia</span>
        <span className="text-[9px] font-bold mt-1">Posisi: {position}</span>
      </div>
    );
  }

  // Jika iklan ada, tampilkan gambarnya!
  return (
    <div className={`relative w-full h-full rounded-xl overflow-hidden group shadow-sm hover:shadow-md transition-shadow bg-white ${className}`}>
      {ad.link_url ? (
        <a href={ad.link_url} target="_blank" rel="noopener noreferrer" className="block w-full h-full relative">
          <Image src={ad.image_url} fill className="object-cover" alt={ad.title} unoptimized />
          <div className="absolute top-2 right-2 bg-black/40 backdrop-blur-sm text-white text-[8px] font-bold px-2 py-0.5 rounded uppercase tracking-widest">Ad</div>
        </a>
      ) : (
        <div className="w-full h-full relative">
          <Image src={ad.image_url} fill className="object-cover" alt={ad.title} unoptimized />
          <div className="absolute top-2 right-2 bg-black/40 backdrop-blur-sm text-white text-[8px] font-bold px-2 py-0.5 rounded uppercase tracking-widest">Ad</div>
        </div>
      )}
    </div>
  );
}