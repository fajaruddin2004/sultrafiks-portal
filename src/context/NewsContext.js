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
            setLoading(true);
            
            // REVISI 1: Sintaks Join (Relasi) disederhanakan agar tidak ditolak Supabase
            const { data, error } = await supabase
                .from('news')
                .select(`*, profiles(full_name, avatar_url)`)
                .eq('status', 'published')
                .order('created_at', { ascending: false });

            if (error) {
                // REVISI 2: Memaksa Supabase membongkar isi pesan error aslinya (bukan sekadar {})
                console.error("Gagal menarik berita publik:", error.message || error);
                return;
            }

            setNews(data || []);
        } catch (error) {
            console.error("System error fetch news:", error.message || error);
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