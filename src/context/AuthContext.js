"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase"; 

const AuthContext = createContext();

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);

    const getLatestProfile = async (userId) => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .maybeSingle(); 
            
            if (!error && data) {
                setProfile(data);
                return data;
            }
        } catch (err) {
            console.error("Gagal ambil profil:", err);
        }
        return null;
    };

    useEffect(() => {
        const initializeAuth = async () => {
            setLoading(true);
            try {
                // Ambil Sesi Login
                const { data: { session: currentSession } } = await supabase.auth.getSession();
                
                if (currentSession?.user) {
                    setUser(currentSession.user);
                    await getLatestProfile(currentSession.user.id);
                }
            } catch (err) {
                console.error("Auth Init Error:", err);
            } finally {
                setLoading(false);
            }
        };

        initializeAuth();

        const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (session?.user) {
                setUser(session.user);
                await getLatestProfile(session.user.id);
            } else {
                setUser(null);
                setProfile(null);
            }
            setLoading(false);
        });

        return () => authListener.subscription.unsubscribe();
    }, []);

    return (
        <AuthContext.Provider value={{ user, profile, loading }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);