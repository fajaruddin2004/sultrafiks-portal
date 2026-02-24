"use client";
import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

const NewsContext = createContext();

export function NewsProvider({ children }) {
    const [news, setNews] = useState([]);
    const [ads, setAds] = useState({ sidebar: { active: false, image: null } });
    const [loading, setLoading] = useState(true);

    const fetchPublicNews = async () => {
        try {
            // Kita hilangkan setLoading(true) di sini agar saat refresh otomatis 
            // tidak muncul loading yang mengganggu tampilan (Smooth Refresh)
            
            const { data, error } = await supabase
                .from('news')
                .select(`*, profiles(full_name, avatar_url)`)
                .eq('status', 'published')
                .order('created_at', { ascending: false });

            if (error) {
                // 🔥 REVISI ANTI-ABORT: Cek apakah error karena browser memutus koneksi 🔥
                // Ini mencegah layar merah "AbortError" muncul di localhost Bos
                if (error.message?.includes("aborted") || error.name === "AbortError" || error.code === "20") {
                    console.warn("Koneksi diputus browser (Abort), mencoba tenang...");
                    return; 
                }
                
                console.error("Gagal menarik berita publik:", error.message || error);
                return;
            }

            setNews(data || []);
        } catch (error) {
            // Filter agar error sistem "Abort" tidak memunculkan layar merah besar di localhost
            if (error.name !== "AbortError" && !error.message?.includes("aborted")) {
                console.error("System error fetch news:", error.message || error);
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPublicNews();

        const publicNewsSubscription = supabase
            .channel('public-news-channel')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'news' },
                () => {
                    // Update data otomatis jika ada perubahan di database
                    fetchPublicNews();
                }
            )
            .subscribe();

        return () => {
            // Bersihkan koneksi saat pindah halaman agar tidak terjadi kebocoran memori
            supabase.removeChannel(publicNewsSubscription);
        };
    }, []);

    return (
        <NewsContext.Provider value={{ news, ads, loading, fetchPublicNews }}>
            {children}
        </NewsContext.Provider>
    );
}

export const useNews = () => useContext(NewsContext);