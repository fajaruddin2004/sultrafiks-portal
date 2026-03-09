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
          .limit(1); 

        if (error) throw error;
        if (data && data.length > 0) setAd(data[0]); 
        else setAd(null); 
      } catch (error) {
        console.warn(`Info: Ruang iklan '${position}' kosong.`);
      } finally {
        setLoading(false);
      }
    };
    fetchAd();
  }, [position]);

  // Kalau loading atau kosong, hilangkan saja kotaknya biar bersih!
  if (loading) return null; 
  if (!ad) return null; 

  return (
    // 🔥 RAHASIANYA DI SINI: bg-transparent agar tembus pandang, tidak ada lagi ruang putih! 🔥
    <div className={`relative w-full h-full flex items-center justify-center bg-transparent ${className}`}>
      {ad.link_url ? (
        <a href={ad.link_url} target="_blank" rel="noopener noreferrer" className="block w-full h-full relative flex items-center justify-center">
          {/* object-contain memastikan tidak terpotong & unoptimized menjaga resolusi tinggi di HP */}
          <Image src={ad.image_url} fill className="object-contain" alt={ad.title} unoptimized />
          <div className="absolute top-2 right-2 bg-black/40 backdrop-blur-sm text-white text-[8px] font-bold px-2 py-0.5 rounded uppercase tracking-widest z-10">Ad</div>
        </a>
      ) : (
        <div className="w-full h-full relative flex items-center justify-center">
          <Image src={ad.image_url} fill className="object-contain" alt={ad.title} unoptimized />
          <div className="absolute top-2 right-2 bg-black/40 backdrop-blur-sm text-white text-[8px] font-bold px-2 py-0.5 rounded uppercase tracking-widest z-10">Ad</div>
        </div>
      )}
    </div>
  );
}