/* eslint-disable @next/next/no-html-link-for-pages */
/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useState, useEffect } from 'react';
import { 
    Search, Zap, Menu, X, ChevronRight,
    Flame, Building2, Plane, Utensils, Smartphone, Scale, 
    Banknote, Theater, Car, Clapperboard, Lightbulb, Briefcase,
    Home as HomeIcon, Info, Phone, Clock, Eye, TrendingUp,
    Facebook, Twitter, Youtube, Hash, BadgeCheck, Bot, Send
} from 'lucide-react';
import NewsCard from '@/components/NewsCard';
import Link from 'next/link'; 
import { useNews } from '@/context/NewsContext';
import { motion, AnimatePresence } from 'framer-motion';

// KONFIGURASI WARNA & IKON
const categoryConfig = {
    "Home":         { icon: HomeIcon,     color: "from-blue-600 to-indigo-600",  shadow: "shadow-blue-200",    text: "text-blue-600" },
    "Terbaru":      { icon: Flame,        color: "from-red-500 to-orange-500",   shadow: "shadow-red-200",     text: "text-red-600" },
    "Pemerintah":   { icon: Building2,    color: "from-blue-600 to-indigo-600",  shadow: "shadow-blue-200",    text: "text-blue-600" },
    "Travel":       { icon: Plane,        color: "from-sky-400 to-cyan-400",     shadow: "shadow-sky-200",     text: "text-sky-500" },
    "Food":         { icon: Utensils,     color: "from-orange-400 to-yellow-500", shadow: "shadow-orange-200",   text: "text-orange-500" },
    "Teknologi":    { icon: Smartphone,   color: "from-violet-600 to-purple-600", shadow: "shadow-violet-200",   text: "text-violet-600" },
    "Politik":      { icon: Scale,        color: "from-slate-700 to-slate-500",  shadow: "shadow-slate-200",    text: "text-slate-600" },
    "Ekonomi":      { icon: Banknote,     color: "from-emerald-500 to-green-500", shadow: "shadow-emerald-200",  text: "text-emerald-600" },
    "Budaya":       { icon: Theater,      color: "from-pink-500 to-rose-500",    shadow: "shadow-pink-200",     text: "text-pink-600" },
    "Otomotif":     { icon: Car,          color: "from-gray-600 to-gray-400",    shadow: "shadow-gray-200",     text: "text-gray-600" },
    "Entertainment":{ icon: Clapperboard, color: "from-fuchsia-600 to-pink-600",  shadow: "shadow-fuchsia-200",  text: "text-fuchsia-600" },
    "Opini":        { icon: Lightbulb,    color: "from-amber-400 to-yellow-400", shadow: "shadow-amber-200",     text: "text-amber-500" },
    "Loker":        { icon: Briefcase,    color: "from-teal-500 to-emerald-500", shadow: "shadow-teal-200",     text: "text-teal-600" }
};
const categories = Object.keys(categoryConfig);

// IKLAN
const AdSlot = ({ label, image, height = "h-24", className }) => (
    <div className={`w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 flex flex-col items-center justify-center relative overflow-hidden group ${height} ${className}`}>
        <span className="absolute top-0 right-0 bg-slate-200 dark:bg-slate-700 text-[9px] text-slate-500 px-1.5 py-0.5 z-10 rounded-bl-lg">IKLAN</span>
        {image ? (
            <img src={image} className="w-full h-full object-cover" alt="Iklan" />
        ) : (
            <div className="text-center text-slate-400">
                <span className="text-xs font-bold block opacity-50 tracking-widest">{label}</span>
                <span className="text-[10px] opacity-70">Hubungi Admin</span>
            </div>
        )}
    </div>
);

// Format Tanggal untuk Tampilan
const formatIndonesianDate = (isoString) => {
    if (!isoString) return "Tanggal tidak diketahui";
    const date = new Date(isoString);
    return date.toLocaleDateString("id-ID", { day: 'numeric', month: 'long', year: 'numeric' });
};

// LOGIKA MATEMATIKA: Cek apakah berita berumur kurang dari atau sama dengan 7 hari
const isWithin7Days = (dateString) => {
    if (!dateString) return false;
    const newsDate = new Date(dateString);
    const now = new Date();
    
    // Hitung selisih waktu dalam milidetik
    const diffTime = now - newsDate; 
    
    // Konversi milidetik ke hari
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)); 
    
    // Mengembalikan True jika umurnya 7 hari atau kurang
    return diffDays <= 7 && diffDays >= 0; 
};

export default function HomePage() { 
    const { news, ads } = useNews();
    
    const [activeCat, setActiveCat] = useState("Home");
    const [searchQuery, setSearchQuery] = useState(""); 
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    
    // STATE BARU: Untuk mengontrol pop-up modal "Tentang Kami"
    const [isAboutOpen, setIsAboutOpen] = useState(false);

    const handleCategoryClick = (cat) => {
        setActiveCat(cat);      
        setSearchQuery("");
        setIsMobileMenuOpen(false); 
    };

    // Filter hanya yang sudah "published" dan urutkan dari yang paling baru
    const allNewsSorted = [...(news || [])]
        .filter(item => item.status === 'published')
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    // LOGIKA SMART FILTER BERDASARKAN TAB YANG DIPILIH
    let categoryNews = [];
    if (activeCat === "Home") {
        categoryNews = allNewsSorted; 
    } else if (activeCat === "Terbaru") {
        categoryNews = allNewsSorted.filter(item => isWithin7Days(item.created_at));
    } else {
        categoryNews = allNewsSorted.filter(item => item.category === activeCat);
    }

    let headlineCandidates = categoryNews.filter(item => item.is_headline === true && isWithin7Days(item.created_at));
    
    if (headlineCandidates.length === 0 && categoryNews.length > 0) {
        headlineCandidates = [categoryNews[0]];
    }
    const headlineItem = headlineCandidates[0] || null;

    const newsList = categoryNews.filter(item => item.id !== headlineItem?.id);

    const trendingList = [...allNewsSorted]
        .sort((a, b) => (b.views || 0) - (a.views || 0))
        .slice(0, 5);

    return (
        <div className="min-h-screen bg-white dark:bg-[#0B0F19] font-sans pb-20 relative overflow-x-hidden">
            
            {/* SIDEBAR MOBILE */}
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsMobileMenuOpen(false)} className="fixed inset-0 bg-black/50 z-[60] backdrop-blur-sm md:hidden"/>
                        <motion.div initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }} transition={{ type: "spring", damping: 25, stiffness: 200 }} className="fixed top-0 left-0 bottom-0 w-[280px] bg-white dark:bg-slate-900 z-[70] md:hidden shadow-2xl overflow-y-auto">
                            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                                <span className="text-xl font-black italic tracking-tighter text-slate-900 dark:text-white">SULTRA<span className="text-blue-600">FIKS</span></span>
                                <button onClick={() => setIsMobileMenuOpen(false)}><X className="w-6 h-6 text-slate-400"/></button>
                            </div>
                            <div className="p-4 space-y-1">
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 px-2">Menu Utama</p>
                                
                                {/* REVISI MENU: BERANDA */}
                                <button onClick={() => handleCategoryClick("Home")} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-slate-700 dark:text-slate-200 font-bold text-sm">
                                    <HomeIcon className="w-4 h-4"/> Beranda
                                </button>
                                
                                {/* REVISI MENU: TENTANG KAMI */}
                                <button onClick={() => { setIsAboutOpen(true); setIsMobileMenuOpen(false); }} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-slate-700 dark:text-slate-200 font-bold text-sm">
                                    <Info className="w-4 h-4"/> Tentang Kami
                                </button>
                                
                                {/* REVISI MENU: HUBUNGI REDAKSI */}
                                <button onClick={() => window.open('https://wa.me/6285242842268?text=Halo%20Redaksi%20SultraFiks,%20saya%20ingin%20memberikan%20informasi...', '_blank')} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-slate-700 dark:text-slate-200 font-bold text-sm">
                                    <Phone className="w-4 h-4"/> Hubungi Redaksi
                                </button>
                            </div>
                            <div className="p-4 pt-0">
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 px-2">Kategori Berita</p>
                                <div className="grid grid-cols-2 gap-2">{categories.map(cat => (<button key={cat} onClick={() => handleCategoryClick(cat)} className={`text-xs font-bold px-3 py-2 rounded-lg text-left transition-colors ${activeCat === cat ? 'bg-blue-600 text-white' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}>{cat}</button>))}</div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* HEADER */}
            <header className="sticky top-0 z-50 w-full transition-all duration-300">
                <div className="absolute inset-0 bg-white/85 dark:bg-[#0B0F19]/85 backdrop-blur-md border-b border-slate-200/50 dark:border-slate-800/50 shadow-sm"></div>
                <div className="relative z-10 max-w-7xl mx-auto px-4">
                    <div className="h-14 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <button onClick={() => setIsMobileMenuOpen(true)} className="md:hidden text-slate-600 dark:text-slate-300 hover:bg-slate-100 p-1.5 rounded-lg transition-colors"><Menu className="w-6 h-6"/></button>
                            <Link href="/" className="flex items-center gap-1 group cursor-pointer"><div className="bg-linear-to-tr from-blue-600 to-blue-400 p-1 rounded-md text-white group-hover:rotate-12 transition-transform shadow-md shadow-blue-200"><Zap className="w-3.5 h-3.5 fill-white" /></div><span className="text-lg font-black italic tracking-tighter text-slate-900 dark:text-white">SULTRA<span className="text-blue-600">FIKS</span></span></Link>
                        </div>
                        <div className="hidden md:flex flex-1 max-w-sm mx-6 bg-slate-100/50 dark:bg-slate-800/50 rounded-full px-3 py-1.5 items-center border border-slate-200/50 dark:border-slate-700 focus-within:border-blue-300 transition-colors">
                            <Search className="w-3.5 h-3.5 text-slate-400 mr-2"/><input className="bg-transparent border-none outline-none text-xs w-full text-slate-700 dark:text-slate-200 placeholder:text-slate-400" placeholder="Cari berita..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}/>{searchQuery && (<button onClick={() => setSearchQuery("")} className="text-slate-400 hover:text-red-500"><X className="w-3.5 h-3.5" /></button>)}
                        </div>
                        <div className="flex items-center gap-2"><div className="w-8 h-8 bg-slate-200 rounded-full overflow-hidden border border-white/50 dark:border-slate-800 shadow-sm"><img src="https://api.dicebear.com/7.x/avataaars/svg?seed=BosFajar" alt="Profile" /></div></div>
                    </div>
                    <div className="md:hidden pb-2"><div className="bg-slate-100/50 dark:bg-slate-800/50 rounded-lg px-3 py-1.5 flex items-center border border-slate-200/50 dark:border-slate-700"><Search className="w-3.5 h-3.5 text-slate-400 mr-2"/><input className="bg-transparent border-none outline-none text-xs w-full text-slate-700 dark:text-slate-200" placeholder="Cari topik..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}/>{searchQuery && <button onClick={() => setSearchQuery("")}><X className="w-3.5 h-3.5 text-slate-400" /></button>}</div></div>
                    <div className="overflow-x-auto no-scrollbar flex gap-2 md:gap-4 pb-2 items-center">
                        {categories.map((cat) => {
                            const config = categoryConfig[cat];
                            const IconComponent = config.icon;
                            const isActive = activeCat === cat && !searchQuery; 
                            return (
                                <button key={cat} onClick={() => handleCategoryClick(cat)} className="flex flex-col items-center gap-1 group shrink-0 py-1 px-1">
                                    <div className={`w-9 h-9 md:w-10 md:h-10 rounded-xl flex items-center justify-center transition-all duration-300 relative overflow-hidden ${isActive ? `bg-linear-to-tr ${config.color} text-white shadow-sm ${config.shadow}` : 'bg-slate-50/80 dark:bg-slate-800/80 text-slate-400 border border-slate-100 dark:border-slate-700 hover:bg-white hover:border-blue-200'}`}><IconComponent className={`w-4 h-4 md:w-5 md:h-5 relative z-10 transition-transform ${isActive ? 'scale-110' : ''}`} />{isActive && <div className="absolute inset-0 bg-white/20 blur-sm z-0"></div>}</div>
                                    <span className={`text-[9px] md:text-[10px] font-bold tracking-wide transition-colors ${isActive ? config.text : 'text-slate-500 group-hover:text-slate-800 dark:text-slate-400 dark:group-hover:text-white'}`}>{cat}</span>
                                </button>
                            )
                        })}
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 py-6 space-y-10">
                {searchQuery ? (
                    <div className="mb-8 animate-in fade-in slide-in-from-top-4">
                        <div className="flex items-center justify-between mb-4"><h2 className="text-xl font-bold flex items-center gap-2"><Search className="w-5 h-5 text-blue-600"/>Hasil: <span className="text-blue-600 italic">&quot;{searchQuery}&quot;</span></h2><button onClick={() => setSearchQuery("")} className="text-xs text-red-500 font-bold hover:underline">Reset</button></div>
                        {allNewsSorted.filter(n => n.title.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 ? (<div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200"><p className="text-slate-400 font-medium">Berita tidak ditemukan.</p></div>) : (<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">{allNewsSorted.filter(n => n.title.toLowerCase().includes(searchQuery.toLowerCase())).map((item) => (<NewsCard key={item.id} data={item} type="grid" />))}</div>)}
                    </div>
                ) : (
                    <section className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                        {/* KOLOM KIRI (Headline & Feed Berita) */}
                        <div className="lg:col-span-8 space-y-10">
                            
                            {/* --- HEADLINE BANNER --- */}
                            {headlineItem && (
                                <div className="space-y-6">
                                    <Link href={`/news/${headlineItem.id}`} className="block group">
                                        <div className="relative w-full h-80 md:h-105 rounded-3xl overflow-hidden group bg-slate-900 shadow-xl shadow-slate-200">
                                            <img src={headlineItem.image_url || '/placeholder-news.jpg'} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" alt={headlineItem.title} />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent flex flex-col justify-end p-6">
                                                <div className="flex items-center gap-2 mb-3">
                                                    <span className="bg-red-600 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider flex items-center gap-1 shadow-sm"><Flame className="w-3 h-3"/> Headline</span>
                                                    <span className="bg-white/20 backdrop-blur text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider border border-white/30">{headlineItem.category}</span>
                                                </div>
                                                <h2 className="text-2xl md:text-4xl font-black text-white leading-tight mb-3 line-clamp-3 group-hover:text-blue-300 transition-colors drop-shadow-md">
                                                    {headlineItem.title}
                                                </h2>
                                                <div className="flex items-center gap-3 text-slate-300 text-xs">
                                                    <span className="flex items-center gap-1 font-bold text-white"><Eye className="w-3 h-3"/> {headlineItem.views || 0} x</span>
                                                    <span>•</span>
                                                    <span className="flex items-center gap-1"><Clock className="w-3 h-3"/> {formatIndonesianDate(headlineItem.created_at)}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </Link>
                                </div>
                            )}

                            {/* --- LIST BERITA --- */}
                            <div>
                                <div className="flex items-center justify-between mb-6 border-b border-slate-100 dark:border-slate-800 pb-4">
                                    <h3 className="font-black text-xl text-slate-900 dark:text-white uppercase italic flex items-center gap-2">
                                        <div className="w-1 h-6 bg-blue-600 rounded-full"></div>
                                        {activeCat === "Home" ? "Berita Publikasi" : activeCat === "Terbaru" ? "Berita Terbaru (7 Hari)" : `Kanal: ${activeCat}`}
                                    </h3>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                    {newsList.length === 0 ? (
                                        <div className="col-span-2 text-center py-10 text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                                            <p className="text-sm font-bold">
                                                {activeCat === "Terbaru" 
                                                    ? "Tidak ada berita baru dalam 7 hari terakhir." 
                                                    : "Belum ada berita yang tayang di kategori ini."}
                                            </p>
                                        </div>
                                    ) : (
                                        newsList.map((item) => (
                                            <NewsCard key={item.id} data={item} type="grid" />
                                        ))
                                    )}
                                </div>
                                {newsList.length > 0 && (
                                    <div className="mt-10 flex justify-center">
                                        <button className="px-6 py-3 bg-slate-50 text-slate-600 font-bold rounded-full border border-slate-200 hover:bg-white hover:border-blue-500 hover:text-blue-600 transition-all text-sm flex items-center gap-2 shadow-sm">
                                            Muat Lebih Banyak <ChevronRight className="w-4 h-4"/>
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* KOLOM KANAN */}
                        <div className="lg:col-span-4 flex flex-col gap-6">
                            <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm sticky top-24">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="font-black text-lg text-slate-900 dark:text-white uppercase italic flex items-center gap-2">
                                        <span className="text-red-500">#</span>Trending
                                    </h3>
                                    <span className="text-[10px] font-bold text-slate-400">Terpopuler</span>
                                </div>
                                <div className="flex flex-col gap-1">
                                    {trendingList.length === 0 ? (
                                        <p className="text-xs text-slate-400 text-center py-4">Belum ada data trending.</p>
                                    ) : (
                                        trendingList.map((item, idx) => (
                                            <NewsCard key={item.id} data={item} type="list" index={idx} />
                                        ))
                                    )}
                                </div>
                            </div>
                            
                            <div className="sticky top-[500px]">
                                <AdSlot label="IKLAN SIDEBAR (300x600)" image={ads?.sidebar?.active ? ads.sidebar.image : null} height="h-[350px] md:h-[450px]" className="rounded-2xl shadow-md border-0" />
                            </div>
                        </div>
                    </section>
                )}
            </main>

            {/* --- FOOTER PREMIUM SULTRAFIKS --- */}
            <footer className="bg-slate-900 text-white pt-16 pb-8 px-4 mt-20">
                <div className="max-w-7xl mx-auto">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-16">
                        <div className="space-y-6">
                            <a href="/" className="text-3xl font-black italic text-blue-500 tracking-tighter">SULTRA<span className="text-white">FIKS</span></a>
                            <p className="text-slate-400 text-sm leading-relaxed">
                                Media siber terdepan di Sulawesi Tenggara yang menyajikan informasi cepat, akurat, dan terpercaya untuk masyarakat Indonesia.
                            </p>
                            <div className="flex gap-4">
                                <Facebook className="w-5 h-5 text-slate-400 hover:text-blue-500 cursor-pointer transition-colors" />
                                <Twitter className="w-5 h-5 text-slate-400 hover:text-blue-400 cursor-pointer transition-colors" />
                                <Youtube className="w-5 h-5 text-slate-400 hover:text-red-500 cursor-pointer transition-colors" />
                                <Hash className="w-5 h-5 text-slate-400 hover:text-pink-500 cursor-pointer transition-colors" />
                            </div>
                        </div>

                        <div>
                            <h4 className="font-black text-lg mb-6 border-b border-slate-800 pb-2 uppercase tracking-widest text-blue-500 italic">Kategori Utama</h4>
                            <ul className="space-y-4 text-slate-400 text-sm font-bold uppercase tracking-widest">
                                <li className="hover:text-blue-500 cursor-pointer transition-colors" onClick={() => handleCategoryClick("Politik")}>Politik & Hukum</li>
                                <li className="hover:text-blue-500 cursor-pointer transition-colors" onClick={() => handleCategoryClick("Ekonomi")}>Ekonomi Bisnis</li>
                                <li className="hover:text-blue-500 cursor-pointer transition-colors" onClick={() => handleCategoryClick("Budaya")}>Pendidikan & Budaya</li>
                                <li className="hover:text-blue-500 cursor-pointer transition-colors" onClick={() => handleCategoryClick("Travel")}>Gaya Hidup & Wisata</li>
                            </ul>
                        </div>

                        <div>
                            <h4 className="font-black text-lg mb-6 border-b border-slate-800 pb-2 uppercase tracking-widest text-blue-500 italic">Redaksi</h4>
                            <div className="space-y-4 text-slate-400 text-sm font-medium">
                                <p className="flex items-center gap-3"><HomeIcon className="w-4 h-4 text-blue-500"/> Kota Kendari, Sulawesi Tenggara</p>
                                <p className="flex items-center gap-3"><Clock className="w-4 h-4 text-blue-500"/> Update 24 Jam Nonstop</p>
                                <div className="bg-blue-600/10 p-5 rounded-3xl border border-blue-500/20 mt-6 shadow-xl hover:bg-blue-600/20 transition-colors cursor-pointer" onClick={() => setIsAboutOpen(true)}>
                                    <p className="text-[10px] text-blue-400 font-black mb-1 italic uppercase tracking-widest">Dikelola Oleh:</p>
                                    <p className="text-white font-black text-base tracking-tight uppercase italic">CV.AVA AMAZONE.IND</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="pt-8 border-t border-slate-800 text-center text-slate-500 text-[10px] font-black uppercase tracking-widest">
                        <p>© 2026 SULTRAFIKS. All Rights Reserved. Design by CV.AVA AMAZONE.IND.</p>
                    </div>
                </div>
            </footer>

            {/* MODAL POP-UP "TENTANG KAMI" */}
            <AnimatePresence>
                {isAboutOpen && (
                    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.9, y: 20 }} 
                            animate={{ opacity: 1, scale: 1, y: 0 }} 
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border border-slate-100 dark:border-slate-800"
                        >
                            {/* Header Modal */}
                            <div className="bg-gradient-to-tr from-blue-600 to-indigo-600 p-6 flex flex-col items-center justify-center relative">
                                <button 
                                    onClick={() => setIsAboutOpen(false)} 
                                    className="absolute top-4 right-4 p-2 bg-white/20 hover:bg-white/30 rounded-full text-white transition-colors"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                                <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-lg mb-3 rotate-3">
                                    <Zap className="w-8 h-8 text-blue-600 fill-blue-600" />
                                </div>
                                <h2 className="text-2xl font-black italic text-white tracking-tighter">SULTRAFIKS</h2>
                                <p className="text-blue-100 text-[10px] font-bold uppercase tracking-widest mt-1">Official Media Partner</p>
                            </div>
                            
                            {/* Isi Modal */}
                            <div className="p-6 text-center">
                                <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed mb-6 font-medium">
                                    Media siber terdepan di Sulawesi Tenggara yang menyajikan informasi cepat, akurat, dan terpercaya. Kami berkomitmen untuk menjadi mata dan telinga bagi masyarakat.
                                </p>
                                <div className="flex items-center justify-center gap-2 text-xs font-bold text-slate-500 bg-slate-50 dark:bg-slate-800 py-3 rounded-xl border border-slate-100 dark:border-slate-700">
                                    <BadgeCheck className="w-5 h-5 text-blue-500" />
                                    Dikelola Oleh CV.AVA AMAZONE.IND
                                </div>
                            </div>
                            
                            {/* Tombol Tutup */}
                            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800">
                                <button 
                                    onClick={() => setIsAboutOpen(false)}
                                    className="w-full py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-bold text-sm hover:scale-[0.98] transition-transform shadow-lg"
                                >
                                    Tutup Jendela
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

        </div>
    );
}