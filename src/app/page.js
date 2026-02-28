/* eslint-disable @next/next/no-html-link-for-pages */
/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { 
    Search, Zap, Menu, X, ChevronRight, PlayCircle,
    Flame, Building2, Plane, Utensils, Smartphone, Scale, 
    Banknote, Theater, Car, Clapperboard, Lightbulb, Briefcase,
    Home as HomeIcon, Info, Phone, Clock, Eye, Facebook, Twitter, Youtube, Hash, BadgeCheck, Sun, Moon 
} from 'lucide-react';
import Link from 'next/link'; 
import { useNews } from '@/context/NewsContext';
import { motion, AnimatePresence } from 'framer-motion';

// --- FUNGSI WAKTU HITUNG MUNDUR ---
const timeAgo = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return `Baru saja`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} menit lalu`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} jam lalu`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days} hari lalu`;
    
    return date.toLocaleDateString("id-ID", { day: 'numeric', month: 'short', year: 'numeric' });
};

// 🔥 FUNGSI PEMBUAT URL SEO (SLUG) - MENGUBAH JUDUL JADI URL 🔥
const createSlug = (title, id) => {
    if (!title) return `/news/${id}`;
    // Ubah spasi jadi strip (-), huruf kecil semua, hilangkan simbol aneh
    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    return `/news/${slug}--${id}`;
};

// KONFIGURASI WARNA & IKON
const categoryConfig = {
    "Home":         { icon: HomeIcon,     color: "from-blue-600 to-indigo-600" },
    "Pemerintah":   { icon: Building2,    color: "from-blue-600 to-indigo-600" },
    "Travel":       { icon: Plane,        color: "from-sky-400 to-cyan-400" },
    "Food":         { icon: Utensils,     color: "from-orange-400 to-yellow-500" },
    "Teknologi":    { icon: Smartphone,   color: "from-violet-600 to-purple-600" },
    "Politik":      { icon: Scale,        color: "from-slate-700 to-slate-500" },
    "Ekonomi":      { icon: Banknote,     color: "from-emerald-500 to-green-500" },
    "Budaya":       { icon: Theater,      color: "from-pink-500 to-rose-500" },
    "Otomotif":     { icon: Car,          color: "from-gray-600 to-gray-400" },
    "Entertainment":{ icon: Clapperboard, color: "from-fuchsia-600 to-pink-600" },
    "Opini":        { icon: Lightbulb,    color: "from-amber-400 to-yellow-400" },
    "Loker":        { icon: Briefcase,    color: "from-teal-500 to-emerald-500" }
};
const categories = Object.keys(categoryConfig);

const isWithin7Days = (dateString) => {
    if (!dateString) return false;
    const diffDays = (new Date().getTime() - new Date(dateString).getTime()) / (1000 * 3600 * 24);
    return diffDays <= 7 && diffDays >= -1; 
};

export default function HomePage() { 
    const { news, ads } = useNews(); 
    
    const [activeCat, setActiveCat] = useState("Home");
    const [searchQuery, setSearchQuery] = useState(""); 
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isAboutOpen, setIsAboutOpen] = useState(false);
    
    const [isDarkMode, setIsDarkMode] = useState(false);
    const [currentSlide, setCurrentSlide] = useState(0);

    useEffect(() => { setCurrentSlide(0); }, [activeCat]);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const savedMode = localStorage.getItem('theme');
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            if (savedMode === 'dark' || (!savedMode && prefersDark)) {
                setIsDarkMode(true);
            }
        }
    }, []);

    const toggleDarkMode = () => {
        const newMode = !isDarkMode;
        setIsDarkMode(newMode);
        localStorage.setItem('theme', newMode ? 'dark' : 'light');
    };

    const handleCategoryClick = (cat) => {
        setActiveCat(cat);      
        setSearchQuery("");
        setIsMobileMenuOpen(false); 
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const AdSlot = ({ label, image, link, height = "h-24", className }) => {
        const Content = () => (
            <div className={`w-full border flex flex-col items-center justify-center relative overflow-hidden group transition-all hover:shadow-lg ${height} ${className} ${isDarkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50 border-slate-100'}`}>
                <span className={`absolute top-0 right-0 text-[8px] font-bold px-2 py-0.5 z-10 rounded-bl-lg tracking-widest ${isDarkMode ? 'bg-slate-700 text-slate-300' : 'bg-slate-200 text-slate-500'}`}>IKLAN</span>
                {image ? (
                    <img src={image} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt={`Iklan ${label}`} />
                ) : (
                    <div className="text-center p-4">
                        <span className={`text-[10px] font-black block opacity-40 tracking-widest ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>{label}</span>
                        <span className={`text-[8px] opacity-60 font-medium ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>Ruang Iklan Tersedia</span>
                    </div>
                )}
            </div>
        );
        return link ? <a href={link} target="_blank" rel="noopener noreferrer" className="block w-full"><Content /></a> : <Content />;
    };

    const allNewsSorted = useMemo(() => {
        return [...(news || [])]
            .filter(item => item.status === 'published')
            .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    }, [news]);

    const categoryNews = useMemo(() => {
        if (activeCat === "Home" || activeCat === "Indeks") return allNewsSorted;
        return allNewsSorted.filter(item => item.category === activeCat);
    }, [allNewsSorted, activeCat]);

    const headlineCandidates = useMemo(() => {
        if (activeCat === "Indeks") return []; 
        const isValidHeadline = (item) => (item.is_headline === true || item.is_headline === 'true' || item.is_headline === 1) && isWithin7Days(item.created_at);
        let candidates = [];
        if (activeCat === "Home") {
            const trueHeadlines = allNewsSorted.filter(isValidHeadline);
            candidates = trueHeadlines.length > 0 ? trueHeadlines.slice(0, 5) : allNewsSorted.slice(0, 3);
        } else {
            const catTrueHeadlines = categoryNews.filter(isValidHeadline);
            candidates = catTrueHeadlines.length > 0 ? catTrueHeadlines.slice(0, 4) : categoryNews.slice(0, 2);
        }
        return candidates;
    }, [allNewsSorted, categoryNews, activeCat]);

    const regularNewsList = useMemo(() => {
        const headlineIds = headlineCandidates.map(h => h.id);
        let list = categoryNews.filter(item => !headlineIds.includes(item.id));
        if (list.length === 0) return categoryNews; 
        return list;
    }, [categoryNews, headlineCandidates]);

    const trendingList = useMemo(() => {
        return [...allNewsSorted].sort((a, b) => (b.views || 0) - (a.views || 0)).slice(0, 5);
    }, [allNewsSorted]);

    useEffect(() => {
        if (headlineCandidates.length > 1 && !searchQuery && activeCat !== "Indeks") {
            const timer = setInterval(() => setCurrentSlide((prev) => (prev + 1) % headlineCandidates.length), 4000); 
            return () => clearInterval(timer);
        }
    }, [headlineCandidates.length, searchQuery, activeCat]);

    const renderNewsGrid = (newsList, sectionTitle = "Terkini", hideTitle = false) => {
        if (newsList.length === 0) return null;
        
        const topTwo = newsList.slice(0, 2);
        const restNews = newsList.slice(2, 60);

        const handleSectionClick = () => {
            if (sectionTitle === "Terkini") setActiveCat("Indeks");
            else setActiveCat(sectionTitle); 
            window.scrollTo({ top: 0, behavior: 'smooth' });
        };

        return (
            <div className="mb-8 md:mb-10">
                {!hideTitle && (
                    <div className={`flex items-center justify-between border-b-2 pb-2 mb-4 md:mb-5 ${isDarkMode ? 'border-slate-800' : 'border-slate-100'}`}>
                        <div className="flex items-center gap-2 md:gap-3">
                            <div className={`h-5 md:h-6 w-1 md:w-1.5 rounded-full ${sectionTitle === "Terkini" || sectionTitle === "Indeks Berita Terbaru" ? 'bg-red-600' : 'bg-blue-600'}`}></div>
                            <h3 className={`font-black text-lg md:text-xl tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{sectionTitle}</h3>
                        </div>
                        {sectionTitle !== "Indeks Berita Terbaru" && (
                            <button onClick={handleSectionClick} className={`text-[10px] md:text-xs font-bold flex items-center gap-1 transition-colors ${isDarkMode ? 'text-slate-400 hover:text-blue-400' : 'text-slate-500 hover:text-blue-600'}`}>
                                {sectionTitle === "Terkini" ? "Indeks" : "Lihat Semua"} <ChevronRight className="w-3 h-3"/>
                            </button>
                        )}
                    </div>
                )}

                {/* 🔥 LINK MENUJU HALAMAN BERITA (SUDAH PAKAI SLUG URL) 🔥 */}
                {topTwo.length > 0 && (
                    <div className="grid grid-cols-2 gap-3 md:gap-4 mb-4 md:mb-5">
                        {topTwo.map((item) => (
                            <Link key={item.id} href={createSlug(item.title, item.id)} className={`flex flex-col w-full h-full rounded-xl overflow-hidden group shadow-sm border transition-all ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200 hover:shadow-md'}`}>
                                <div className="relative w-full aspect-[4/3] md:aspect-[16/10] overflow-hidden shrink-0">
                                    <img src={item.image_url || '/placeholder-news.jpg'} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" alt={item.title} />
                                    <div className="hidden md:flex absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent flex-col justify-end p-5">
                                        <h4 className="text-white font-bold text-base leading-snug line-clamp-3 group-hover:text-blue-300 transition-colors drop-shadow-md">
                                            {item.title}
                                        </h4>
                                        <p className="text-slate-300 text-xs font-medium mt-2 drop-shadow-md flex items-center gap-2">
                                            <Clock className="w-3 h-3" /> {timeAgo(item.created_at)}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex md:hidden flex-col flex-grow p-2.5">
                                    <h4 className={`font-bold text-[11px] leading-snug line-clamp-3 transition-colors ${isDarkMode ? 'text-slate-200 group-hover:text-blue-400' : 'text-slate-800 group-hover:text-blue-600'}`}>
                                        {item.title}
                                    </h4>
                                    <p className={`mt-auto pt-2 text-[9px] font-bold flex items-center gap-1 uppercase tracking-wider ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                                        <Clock className="w-2.5 h-2.5" /> {timeAgo(item.created_at)}
                                    </p>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}

                {/* 🔥 LINK MENUJU HALAMAN BERITA (SUDAH PAKAI SLUG URL) 🔥 */}
                {restNews.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                        {restNews.map((item) => (
                            <Link key={item.id} href={createSlug(item.title, item.id)} className={`flex flex-col w-full h-full rounded-xl overflow-hidden group shadow-sm border transition-all ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200 hover:shadow-md'}`}>
                                <div className="relative w-full aspect-[4/3] overflow-hidden shrink-0">
                                    <img src={item.image_url || '/placeholder-news.jpg'} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt={item.title} />
                                    {item.category === "Entertainment" && <PlayCircle className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 text-white/80" />}
                                </div>
                                <div className="flex flex-col flex-grow p-2.5 md:p-3">
                                    <h4 className={`font-bold text-[11px] md:text-sm leading-snug line-clamp-3 transition-colors ${isDarkMode ? 'text-slate-200 group-hover:text-blue-400' : 'text-slate-800 group-hover:text-blue-600'}`}>
                                        {item.title}
                                    </h4>
                                    <p className={`mt-auto pt-2 text-[8px] md:text-[10px] font-bold flex items-center gap-1.5 uppercase tracking-wider ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                                        <Clock className="w-2.5 h-2.5 md:w-3 md:h-3" /> {timeAgo(item.created_at)}
                                    </p>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div 
            className="min-h-screen font-sans relative overflow-x-hidden transition-colors duration-300"
            style={{ 
                backgroundColor: isDarkMode ? '#0B0F19' : '#ffffff', 
                color: isDarkMode ? '#f8fafc' : '#0f172a' 
            }}
        >
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsMobileMenuOpen(false)} className="fixed inset-0 bg-black/60 z-[60] backdrop-blur-sm md:hidden"/>
                        <motion.div initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }} transition={{ type: "spring", damping: 25, stiffness: 200 }} className={`fixed top-0 left-0 bottom-0 w-[280px] z-[70] md:hidden shadow-2xl overflow-y-auto ${isDarkMode ? 'bg-slate-900' : 'bg-white'}`}>
                            <div className={`p-4 border-b flex justify-between items-center ${isDarkMode ? 'border-slate-800' : 'border-slate-100'}`}>
                                <span className={`text-lg font-black italic tracking-tighter ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>SULTRA<span className="text-blue-600">FIKS</span></span>
                                <button onClick={() => setIsMobileMenuOpen(false)}><X className={`w-5 h-5 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}/></button>
                            </div>
                            
                            <div className="p-4 space-y-1">
                                <p className={`text-[10px] font-bold uppercase tracking-wider mb-2 px-2 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>Menu Utama</p>
                                <button onClick={() => handleCategoryClick("Home")} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors font-bold text-xs ${isDarkMode ? 'hover:bg-slate-800 text-slate-300' : 'hover:bg-slate-50 text-slate-700'}`}>
                                    <HomeIcon className="w-4 h-4"/> Beranda
                                </button>
                                <button onClick={() => { setIsAboutOpen(true); setIsMobileMenuOpen(false); }} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors font-bold text-xs ${isDarkMode ? 'hover:bg-slate-800 text-slate-300' : 'hover:bg-slate-50 text-slate-700'}`}>
                                    <Info className="w-4 h-4"/> Tentang Kami
                                </button>
                                <button onClick={() => window.open('https://wa.me/6285242842268?text=Halo%20Redaksi%20SultraFiks,%20saya%20ingin%20bekerja%20sama%20memasang%20iklan...', '_blank')} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors font-bold text-xs ${isDarkMode ? 'hover:bg-slate-800 text-slate-300' : 'hover:bg-slate-50 text-slate-700'}`}>
                                    <Phone className="w-4 h-4"/> Hubungi Redaksi
                                </button>
                            </div>

                            <div className="p-4 pt-0">
                                <p className={`text-[10px] font-bold uppercase tracking-wider mb-2 px-2 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>Kategori Berita</p>
                                <div className="grid grid-cols-2 gap-2">
                                    {categories.map(cat => (
                                        <button key={cat} onClick={() => handleCategoryClick(cat)} className={`text-[10px] font-bold px-3 py-2 rounded-lg text-left transition-colors ${activeCat === cat ? 'bg-blue-600 text-white' : (isDarkMode ? 'bg-slate-800 text-slate-400 hover:bg-slate-700' : 'bg-slate-50 text-slate-600 hover:bg-slate-100')}`}>{cat}</button>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            <header className="fixed top-0 left-0 right-0 z-50 w-full transition-all duration-300">
                <div className={`absolute inset-0 backdrop-blur-md border-b shadow-sm ${isDarkMode ? 'bg-[#0B0F19]/90 border-slate-800/80' : 'bg-white/90 border-slate-200/60'}`}></div>
                <div className="relative z-10 max-w-7xl mx-auto px-3">
                    
                    <div className="h-12 flex items-center justify-between">
                        <div className="flex items-center gap-2 md:gap-3">
                            <button onClick={() => setIsMobileMenuOpen(true)} className={`md:hidden p-1.5 rounded-lg transition-colors ${isDarkMode ? 'text-slate-300 hover:bg-slate-800' : 'text-slate-600 hover:bg-slate-100'}`}><Menu className="w-5 h-5"/></button>
                            <button onClick={() => handleCategoryClick("Home")} className="flex items-center gap-1.5 group cursor-pointer">
                                <div className="bg-gradient-to-tr from-blue-600 to-blue-400 p-1 rounded-md text-white group-hover:rotate-12 transition-transform shadow-md"><Zap className="w-3 h-3 fill-white" /></div>
                                <span className={`text-base font-black italic tracking-tighter ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>SULTRA<span className="text-blue-600">FIKS</span></span>
                            </button>
                        </div>
                        
                        <div className={`hidden md:flex flex-1 max-w-sm mx-6 rounded-full px-3 py-1 items-center border focus-within:border-blue-400 transition-colors ${isDarkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-100/50 border-slate-200'}`}>
                            <Search className={`w-3 h-3 mr-2 ${isDarkMode ? 'text-slate-400' : 'text-slate-400'}`}/>
                            <input className={`bg-transparent border-none outline-none text-xs w-full ${isDarkMode ? 'text-slate-200 placeholder:text-slate-500' : 'text-slate-700 placeholder:text-slate-400'}`} placeholder="Cari berita..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}/>
                            {searchQuery && (<button onClick={() => setSearchQuery("")} className="text-red-500"><X className="w-3 h-3" /></button>)}
                        </div>
                        
                        <div className="flex items-center gap-2">
                            <button onClick={toggleDarkMode} className={`w-7 h-7 flex items-center justify-center rounded-full transition-all border shadow-sm ${isDarkMode ? 'bg-slate-800 text-yellow-400 border-slate-700 hover:bg-slate-700' : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'}`}>
                                {isDarkMode ? <Sun className="w-3.5 h-3.5 fill-current" /> : <Moon className="w-3.5 h-3.5 fill-current" />}
                            </button>
                        </div>
                    </div>

                    <div className="md:hidden pb-1">
                        <div className={`rounded-lg px-2.5 py-1 flex items-center border ${isDarkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-100/50 border-slate-200'}`}>
                            <Search className={`w-3 h-3 mr-2 ${isDarkMode ? 'text-slate-400' : 'text-slate-400'}`}/>
                            <input className={`bg-transparent border-none outline-none text-[10px] w-full ${isDarkMode ? 'text-slate-200 placeholder:text-slate-500' : 'text-slate-700 placeholder:text-slate-400'}`} placeholder="Cari topik..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}/>
                            {searchQuery && <button onClick={() => setSearchQuery("")}><X className="w-3 h-3 text-red-500" /></button>}
                        </div>
                    </div>

                    <div className="overflow-x-auto no-scrollbar flex gap-2 md:gap-3 pb-1 pt-1.5 items-center">
                        {categories.map((cat) => {
                            const config = categoryConfig[cat];
                            const IconComponent = config.icon;
                            const isActive = activeCat === cat && !searchQuery && activeCat !== "Indeks"; 
                            return (
                                <button key={cat} onClick={() => handleCategoryClick(cat)} className="flex flex-col items-center gap-1 group shrink-0 px-1">
                                    <div className={`w-7 h-7 md:w-8 md:h-8 rounded-lg flex items-center justify-center transition-all duration-300 relative overflow-hidden ${isActive ? `bg-gradient-to-tr ${config.color} text-white shadow-sm border-0` : (isDarkMode ? 'bg-slate-800 text-slate-400 border-slate-700 border hover:bg-slate-700 hover:text-white' : 'bg-slate-50 text-slate-500 border-slate-200 border hover:bg-white hover:text-blue-600')}`}>
                                        <IconComponent className={`w-3.5 h-3.5 md:w-4 md:h-4 relative z-10 transition-transform ${isActive ? 'scale-110' : ''}`} />
                                    </div>
                                    <span className={`text-[8px] md:text-[9px] font-bold tracking-wide transition-colors ${isActive ? 'text-blue-500' : (isDarkMode ? 'text-slate-400 group-hover:text-slate-200' : 'text-slate-500 group-hover:text-slate-800')}`}>{cat}</span>
                                </button>
                            )
                        })}
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-3 md:px-4 pt-36 md:pt-28 pb-5 md:pb-8 space-y-6 md:space-y-8">
                <AdSlot label="BANNER ATAS (728x90)" image={ads?.header?.image} link={ads?.header?.link} height="h-16 md:h-24" className="rounded-xl md:rounded-2xl" />

                {searchQuery ? (
                    <div className="mb-8">
                        <h2 className={`text-lg font-bold flex items-center gap-2 mb-4 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}><Search className="w-4 h-4 text-blue-500"/>Hasil: <span className="text-blue-500 italic">&quot;{searchQuery}&quot;</span></h2>
                        {renderNewsGrid(allNewsSorted.filter(n => n.title.toLowerCase().includes(searchQuery.toLowerCase())), "Hasil Pencarian", true)}
                    </div>
                ) : (
                    <section className="grid grid-cols-1 lg:grid-cols-12 gap-5 md:gap-8">
                        <div className="lg:col-span-8 space-y-6 md:space-y-10 overflow-hidden">
                            {/* 🔥 SLIDER HEADLINE JUGA MENGGUNAKAN SLUG 🔥 */}
                            {headlineCandidates.length > 0 && activeCat !== "Indeks" && (
                                <div className={`relative w-full h-56 md:h-96 rounded-xl md:rounded-2xl overflow-hidden group shadow-md ${isDarkMode ? 'bg-slate-900 border border-slate-800' : 'bg-slate-900'}`}>
                                    <div className="flex h-full w-full transition-transform duration-700 ease-in-out" style={{ transform: `translateX(-${currentSlide * 100}%)` }}>
                                        {headlineCandidates.map((item) => (
                                            <div key={item.id} className="w-full h-full flex-shrink-0 relative">
                                                <Link href={createSlug(item.title, item.id)} className="block w-full h-full">
                                                    <img src={item.image_url || '/placeholder-news.jpg'} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000" alt={item.title} />
                                                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent flex flex-col justify-end p-4 md:p-8">
                                                        <div className="flex items-center gap-1.5 md:gap-2 mb-2">
                                                            <span className="bg-red-600 text-white text-[8px] md:text-[10px] font-black px-2 py-0.5 md:px-3 md:py-1 rounded-sm uppercase tracking-wider">Headline</span>
                                                            <span className="bg-blue-600 text-white text-[8px] md:text-[10px] font-bold px-2 py-0.5 md:px-3 md:py-1 rounded-sm uppercase tracking-wider">{item.category}</span>
                                                        </div>
                                                        <h2 className="text-lg md:text-3xl font-black text-white leading-tight mb-2 line-clamp-3 drop-shadow-md">{item.title}</h2>
                                                        <div className="flex items-center gap-2 text-slate-300 text-[9px] md:text-xs font-medium">
                                                            <span className="flex items-center gap-1 font-bold"><Clock className="w-3 h-3"/> {timeAgo(item.created_at)}</span>
                                                        </div>
                                                    </div>
                                                </Link>
                                            </div>
                                        ))}
                                    </div>
                                    {headlineCandidates.length > 1 && (
                                        <div className="absolute bottom-3 right-0 left-0 flex justify-center gap-1.5 z-20">
                                            {headlineCandidates.map((_, idx) => (
                                                <button key={idx} onClick={() => setCurrentSlide(idx)} className={`h-1 md:h-1.5 rounded-full transition-all duration-500 ${idx === currentSlide ? 'w-5 md:w-6 bg-red-600' : 'w-1.5 md:w-2 bg-white/50 hover:bg-white'}`} />
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {activeCat === "Indeks" ? (
                                <div className="space-y-8 md:space-y-10">
                                    {renderNewsGrid(allNewsSorted, "Indeks Berita Terbaru")}
                                </div>
                            ) : activeCat === "Home" ? (
                                <div className="space-y-8 md:space-y-10">
                                    {renderNewsGrid(regularNewsList.slice(0, 2), "Terkini")}

                                    <AdSlot label="IKLAN IN-FEED" image={ads?.inFeed?.image} link={ads?.inFeed?.link} height="h-20 md:h-28" className={`rounded-xl ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-blue-50/50 border-blue-100'}`} />

                                    {categories.filter(c => c !== "Home").map((catName) => {
                                        const catNewsList = allNewsSorted.filter(n => n.category === catName).slice(0, 4);
                                        if (catNewsList.length === 0) return null;
                                        
                                        const config = categoryConfig[catName];
                                        const CatIcon = config.icon;

                                        return (
                                            <div key={catName} className="space-y-3 md:space-y-5">
                                                <div className={`flex items-center justify-between border-b-2 pb-2 md:pb-3 ${isDarkMode ? 'border-slate-800' : 'border-slate-100'}`}>
                                                    <div className="flex items-center gap-2">
                                                        <div className={`p-1.5 rounded-lg bg-gradient-to-tr ${config.color} shadow-sm`}>
                                                            <CatIcon className="w-3.5 h-3.5 md:w-4 md:h-4 text-white" />
                                                        </div>
                                                        <h3 className={`font-black text-base md:text-xl uppercase italic tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                                                            {catName}
                                                        </h3>
                                                    </div>
                                                    <button onClick={() => handleCategoryClick(catName)} className={`text-[9px] md:text-xs font-bold flex items-center gap-1 transition-colors ${isDarkMode ? 'text-slate-400 hover:text-blue-400' : 'text-slate-500 hover:text-blue-600'}`}>
                                                        Lihat Semua <ChevronRight className="w-3 h-3"/>
                                                    </button>
                                                </div>
                                                {renderNewsGrid(catNewsList, catName, true)}
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div>{renderNewsGrid(regularNewsList, `Kanal: ${activeCat}`)}</div>
                            )}
                        </div>

                        {/* 🔥 LINK TERPOPULER JUGA SUDAH PAKAI SLUG 🔥 */}
                        <div className="lg:col-span-4 flex flex-col gap-6 md:gap-8">
                            <AdSlot label="IKLAN KOTAK (300x250)" image={ads?.sidebarTop?.image} link={ads?.sidebarTop?.link} height="h-[180px] md:h-[250px]" className="rounded-xl" />

                            <div className={`p-4 md:p-6 rounded-xl border shadow-sm sticky top-32 ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'}`}>
                                <div className={`flex items-center justify-between mb-4 border-b-2 pb-2 ${isDarkMode ? 'border-slate-700' : 'border-slate-100'}`}>
                                    <h3 className={`font-black text-base md:text-xl tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Terpopuler</h3>
                                </div>
                                <div className="flex flex-col gap-4">
                                    {trendingList.length === 0 ? (
                                        <p className={`text-[10px] md:text-xs text-center py-4 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>Belum ada data.</p>
                                    ) : (
                                        trendingList.map((item, idx) => (
                                            <Link key={item.id} href={createSlug(item.title, item.id)} className={`flex gap-3 group items-start border-b pb-3 last:border-0 last:pb-0 ${isDarkMode ? 'border-slate-700/50' : 'border-slate-50'}`}>
                                                <div className={`w-14 h-14 md:w-20 md:h-20 rounded-lg overflow-hidden shrink-0 relative border ${isDarkMode ? 'bg-slate-900 border-slate-700' : 'bg-slate-100 border-slate-200'}`}>
                                                    <img src={item.image_url || '/placeholder-news.jpg'} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" alt={item.title} />
                                                    <div className="absolute top-0 left-0 bg-blue-600 text-white text-[8px] md:text-[10px] font-black w-4 h-4 md:w-5 md:h-5 flex items-center justify-center rounded-br-lg">{idx + 1}</div>
                                                </div>
                                                <div className="flex flex-col flex-1">
                                                    <h4 className={`font-bold text-[11px] md:text-sm leading-snug line-clamp-2 transition-colors ${isDarkMode ? 'text-slate-200 group-hover:text-blue-400' : 'text-slate-800 group-hover:text-blue-600'}`}>
                                                        {item.title}
                                                    </h4>
                                                    <p className={`text-[8px] md:text-[10px] font-bold mt-1.5 flex items-center gap-1 uppercase tracking-wider ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                                                        {timeAgo(item.created_at)}
                                                    </p>
                                                </div>
                                            </Link>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>
                    </section>
                )}

                <div className={`pt-6 md:pt-8 border-t ${isDarkMode ? 'border-slate-800' : 'border-slate-100'}`}>
                    <AdSlot label="BANNER BAWAH (728x90)" image={ads?.bottom?.image} link={ads?.bottom?.link} height="h-16 md:h-28" className="rounded-xl" />
                </div>
            </main>

            <footer className="bg-[#0f172a] text-white pt-10 md:pt-16 pb-6 px-4 mt-6">
                <div className="max-w-5xl mx-auto text-center md:text-left">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12 mb-8 md:mb-12">
                        <div className="space-y-3">
                            <a href="/" className="text-2xl md:text-3xl font-black italic text-blue-500 tracking-tighter">SULTRA<span className="text-white">FIKS</span></a>
                            <p className="text-slate-400 text-[11px] md:text-sm leading-relaxed max-w-xs mx-auto md:mx-0">Media siber terdepan di Sulawesi Tenggara yang menyajikan informasi cepat, akurat, dan terpercaya.</p>
                        </div>
                        <div>
                            <h4 className="font-black text-sm md:text-lg mb-3 md:mb-4 text-blue-500 italic">Kategori Utama</h4>
                            <ul className="space-y-2 text-slate-400 text-[10px] md:text-xs font-bold uppercase tracking-widest">
                                <li className="hover:text-blue-400 cursor-pointer transition-colors" onClick={() => handleCategoryClick("Politik")}>Politik & Hukum</li>
                                <li className="hover:text-blue-400 cursor-pointer transition-colors" onClick={() => handleCategoryClick("Ekonomi")}>Ekonomi Bisnis</li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-black text-sm md:text-lg mb-3 md:mb-4 text-blue-500 italic">Redaksi</h4>
                            <div className="space-y-2 text-slate-400 text-[10px] md:text-xs font-medium flex flex-col items-center md:items-start">
                                <p className="flex items-center gap-2"><HomeIcon className="w-3 h-3 text-blue-500"/> Kendari, Sultra</p>
                                <p className="flex items-center gap-2"><Clock className="w-3 h-3 text-blue-500"/> Update 24 Jam</p>
                            </div>
                        </div>
                    </div>
                    <div className="pt-6 border-t border-slate-800/50 text-slate-500 text-[8px] md:text-[10px] font-black uppercase tracking-widest">
                        <p>© 2026 SULTRAFIKS. All Rights Reserved. CV.AVA AMAZONE.IND.</p>
                    </div>
                </div>
            </footer>
            
            <AnimatePresence>
                {isAboutOpen && (
                    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.9, y: 20 }} 
                            animate={{ opacity: 1, scale: 1, y: 0 }} 
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className={`w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}
                        >
                            <div className="bg-gradient-to-tr from-blue-600 to-indigo-600 p-6 flex flex-col items-center justify-center relative">
                                <button onClick={() => setIsAboutOpen(false)} className="absolute top-4 right-4 p-2 bg-white/20 hover:bg-white/30 rounded-full text-white transition-colors">
                                    <X className="w-4 h-4" />
                                </button>
                                <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-lg mb-3 rotate-3">
                                    <Zap className="w-8 h-8 text-blue-600 fill-blue-600" />
                                </div>
                                <h2 className="text-2xl font-black italic text-white tracking-tighter">SULTRAFIKS</h2>
                                <p className="text-blue-100 text-[10px] font-bold uppercase tracking-widest mt-1">Official Media Partner</p>
                            </div>
                            <div className="p-6 text-center">
                                <p className={`text-sm leading-relaxed mb-6 font-medium ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                                    Media siber terdepan di Sulawesi Tenggara yang menyajikan informasi cepat, akurat, dan terpercaya. Kami berkomitmen untuk menjadi mata dan telinga bagi masyarakat.
                                </p>
                                <div className={`flex items-center justify-center gap-2 text-xs font-bold py-3 rounded-xl border ${isDarkMode ? 'bg-slate-800 text-slate-400 border-slate-700' : 'bg-slate-50 text-slate-500 border-slate-100'}`}>
                                    <BadgeCheck className="w-5 h-5 text-blue-500" />
                                    Dikelola Oleh CV.AVA AMAZONE.IND
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

        </div>
    );
}