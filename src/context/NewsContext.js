"use client";
import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

const NewsContext = createContext();

export function NewsProvider({ children }) {
    const [news, setNews] = useState([]);
    const [ads, setAds] = useState({ sidebar: { active: false, image: null } });
    const [loading, setLoading] = useState(true);

    // Tambahkan parameter retryCount untuk menghitung percobaan
    const fetchPublicNews = async (retryCount = 0) => {
        try {
            const { data, error } = await supabase
                .from('news')
                .select(`*, profiles(full_name, avatar_url)`)
                .eq('status', 'published')
                .order('created_at', { ascending: false });

            if (error) {
                // JIKA DIPUTUS BROWSER (ABORT): JANGAN NYERAH, COBA LAGI!
                if (error.message?.includes("aborted") || error.name === "AbortError" || error.code === "20") {
                    console.warn(`Koneksi diputus browser. Mencoba lagi... (Percobaan ke-${retryCount + 1})`);
                    
                    // Maksimal coba ulang 3 kali dengan jeda 1 detik agar browser tidak marah
                    if (retryCount < 3) {
                        setTimeout(() => fetchPublicNews(retryCount + 1), 1000);
                    }
                    return; 
                }
                
                console.error("Gagal menarik berita publik:", error.message || error);
                return;
            }

            // Jika berhasil, masukkan datanya!
            setNews(data || []);
        } catch (error) {
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
                    fetchPublicNews();
                }
            )
            .subscribe();

        return () => {
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