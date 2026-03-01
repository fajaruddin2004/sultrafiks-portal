"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  // Default loading adalah true agar layar tidak langsung 'Akses Ditolak'
  const [loading, setLoading] = useState(true); 

  useEffect(() => {
    let mounted = true;

    const fetchProfile = async (userId) => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single();
          
        if (!error && mounted) {
          setProfile(data);
        }
      } catch (error) {
         console.warn("Fetch Profile Error:", error);
      } finally {
         if (mounted) setLoading(false);
      }
    };

    const initAuth = async () => {
      try {
        // Cek sesi saat ini
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
           // JIKA ERRORNYA ADALAH ABORTERROR, ABAIKAN SAJA (JANGAN PANIK)
           if (error.name === 'AbortError' || error.message.includes('signal is aborted')) {
               console.warn("⚠️ Supabase AbortError dicegat dan diabaikan.");
           } else {
               console.error("Session Error:", error);
           }
        }
        
        if (mounted) {
            if (session?.user) {
              setUser(session.user);
              fetchProfile(session.user.id);
            } else {
              setLoading(false);
            }
        }
      } catch (err) {
         // Tetap abaikan jika sistem memutus koneksi
         console.warn("Init Auth terputus:", err.message);
         if (mounted) setLoading(false);
      }
    };

    // Jalankan inisialisasi awal
    initAuth();

    // Pasang radar untuk mendengarkan perubahan status login/logout
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (mounted) {
            if (session?.user) {
              setUser(session.user);
              setLoading(true); // Loading sebentar untuk ambil profil
              fetchProfile(session.user.id);
            } else {
              setUser(null);
              setProfile(null);
              setLoading(false);
            }
        }
      }
    );

    // Pembersihan saat berpindah halaman
    return () => {
      mounted = false;
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, profile, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);