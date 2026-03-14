"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BellRing, X, MessageCircle } from 'lucide-react';

export default function SubscribeModal() {
    const [isOpen, setIsOpen] = useState(false);
    const [isDarkMode, setIsDarkMode] = useState(false);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            setIsDarkMode(document.documentElement.classList.contains('dark'));
            
            // Cek ingatan browser: Apakah pengunjung sudah pernah menutup popup ini?
            const hasSeenPromo = localStorage.getItem('sultrafiks_subscribe_seen');
            
            // Jika belum pernah lihat, munculkan popup setelah 3 detik pengunjung membaca berita
            if (!hasSeenPromo) {
                const timer = setTimeout(() => {
                    setIsOpen(true);
                }, 3000); 
                return () => clearTimeout(timer);
            }
        }
    }, []);

    const handleClose = () => {
        setIsOpen(false);
        // Tanamkan di ingatan browser agar tidak mengganggu pengunjung terus-menerus
        localStorage.setItem('sultrafiks_subscribe_seen', 'true');
    };

    const handleSubscribe = () => {
        // 👇👇 MASUKKAN LINK SALURAN WA SULTRAFIKS BOS DI SINI 👇👇
        window.open(' https://whatsapp.com/channel/0029Vb7e6k79xVJjaFpIUE1a', '_blank');
        handleClose();
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={handleClose}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200]"
                    />
                    
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8, y: 50 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.8, y: 50 }}
                        transition={{ type: "spring", bounce: 0.4 }}
                        className={`fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-sm p-6 md:p-8 rounded-3xl shadow-2xl z-[210] border ${isDarkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-100'}`}
                    >
                        <button 
                            onClick={handleClose}
                            className={`absolute top-4 right-4 p-2 rounded-full transition-colors ${isDarkMode ? 'text-slate-400 hover:bg-slate-800' : 'text-slate-400 hover:bg-slate-100'}`}
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <div className="flex flex-col items-center text-center">
                            <motion.div 
                                animate={{ rotate: [0, -15, 15, -15, 15, 0] }}
                                transition={{ repeat: Infinity, duration: 1.5, repeatDelay: 2 }}
                                className="w-16 h-16 bg-gradient-to-tr from-blue-600 to-indigo-500 rounded-full flex items-center justify-center shadow-lg shadow-blue-500/30 mb-5"
                            >
                                <BellRing className="w-8 h-8 text-white fill-white" />
                            </motion.div>

                            <h3 className={`text-xl font-black mb-2 italic tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                                Jangan Ketinggalan Berita!
                            </h3>
                            
                            <p className={`text-xs md:text-sm font-medium mb-6 leading-relaxed ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                                Dapatkan notifikasi berita terbaru dan terhangat seputar Sulawesi Tenggara langsung di WhatsApp Anda.
                            </p>

                            <button 
                                onClick={handleSubscribe}
                                className="w-full bg-[#25D366] hover:bg-[#1DA851] text-white font-black py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-[#25D366]/30 active:scale-95 uppercase tracking-widest text-[10px] md:text-xs"
                            >
                                <MessageCircle className="w-4 h-4 md:w-5 md:h-5" />
                                Gabung Saluran WhatsApp
                            </button>
                            
                            <button 
                                onClick={handleClose}
                                className={`mt-4 text-[10px] md:text-xs font-bold uppercase tracking-widest hover:underline ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}
                            >
                                Mungkin Nanti Saja
                            </button>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}