/* eslint-disable @next/next/no-html-link-for-pages */
/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import { 
  Search, Zap, Menu, X, ChevronRight, PlayCircle,
  Building2, Clapperboard, Home as HomeIcon, Info, Phone, Clock, Eye, Facebook, Twitter, Youtube, Hash, BadgeCheck, Sun, Moon,
  Map, Landmark, ShieldAlert, Trophy, GraduationCap, Globe, Users, Megaphone, Instagram
} from 'lucide-react';
import Link from 'next/link'; 
import { useNews } from '@/context/NewsContext';
import { supabase } from "@/lib/supabase"; 
import { motion, AnimatePresence } from 'framer-motion';
import AdBanner from "@/components/AdBanner"; 
import { useSearchParams } from 'next/navigation';

// 🔥 IKON TIKTOK CUSTOM 🔥
const TikTokIcon = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93v7.2c0 1.92-.52 3.86-1.6 5.43-1.08 1.58-2.6 2.8-4.39 3.32-1.78.53-3.72.5-5.45-.1-1.73-.6-3.23-1.73-4.26-3.18-1.03-1.44-1.55-3.2-1.5-4.97.05-1.77.67-3.48 1.8-4.86 1.13-1.37 2.68-2.34 4.41-2.73 1.72-.4 3.55-.26 5.16.42.34.14.66.3.96.48v4.13c-.23-.1-.47-.19-.71-.25-.9-.23-1.87-.2-2.73.1-.86.3-1.6.86-2.12 1.6-.52.74-.8 1.66-.78 2.6.02.93.35 1.83.92 2.54.57.7 1.34 1.19 2.2 1.38.86.19 1.79.1 2.58-.23.79-.34 1.45-.9 1.9-1.62.45-.73.68-1.6.66-2.5v-10.75h4.08c-.04-.5-.13-1-.28-1.48-.15-.49-.36-.95-.62-1.37-.26-.43-.57-.82-.93-1.17-.35-.35-.76-.66-1.19-.92-.44-.25-.9-.46-1.39-.61-.49-.15-1-.24-1.52-.28v-4.1z"/>
  </svg>
);

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

const createSlug = (title) => {
  if (!title) return '#';
  const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
  return `/news/${slug}`;
};

const categoryConfig = {
  "Home":         { icon: HomeIcon,       color: "from-blue-600 to-indigo-600" },
  "Kilas Daerah": { icon: Map,            color: "from-emerald-500 to-green-500" },
  "Birokrasi":    { icon: Building2,      color: "from-blue-500 to-cyan-500" },
  "Parlemen":     { icon: Landmark,       color: "from-slate-700 to-slate-500" },
  "Delik":        { icon: ShieldAlert,    color: "from-red-600 to-rose-600" },
  "Arena":        { icon: Trophy,         color: "from-amber-400 to-yellow-500" },
  "Showbiz":      { icon: Clapperboard,   color: "from-fuchsia-600 to-pink-600" },
  "Edukes":       { icon: GraduationCap,  color: "from-sky-400 to-blue-400" },
  "Nusantara":    { icon: Globe,          color: "from-teal-500 to-emerald-500" },
  "Ruang Publik": { icon: Users,          color: "from-violet-600 to-purple-600" }
};
const categories = Object.keys(categoryConfig);

const isWithin7Days = (dateString) => {
  if (!dateString) return false;
  const diffDays = (new Date().getTime() - new Date(dateString).getTime()) / (1000 * 3600 * 24);
  return diffDays <= 7 && diffDays >= -1; 
};

// Bungkus dengan Suspense agar tidak error saat membaca URL
export default function HomePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0B0F19]"></div>}>
      <HomeContent />
    </Suspense>
  )
}

function HomeContent() { 
  const { news } = useNews(); 
  
  const searchParams = useSearchParams();
  const urlCat = searchParams.get('cat') || searchParams.get('category');
  const urlSearch = searchParams.get('search');
  
  const [activeCat, setActiveCat] = useState("Home");
  const [searchQuery, setSearchQuery] = useState(""); 
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [isContactOpen, setIsContactOpen] = useState(false); 

  // 🔥 STATE BARU UNTUK MEMBUKA MODAL PENCARIAN (MOBILE & DESKTOP) 🔥
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  
  const [showPopupAd, setShowPopupAd] = useState(false);
  const [showStickyAd, setShowStickyAd] = useState(true);
  const [siteConfig, setSiteConfig] = useState(null);

  const [adStatus, setAdStatus] = useState({
    popup: false, sticky: false, header: false, sidebar: false, article: false
  });

  const [isDarkMode, setIsDarkMode] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);

  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);

  useEffect(() => {
    const fetchAdsStatus = async () => {
        try {
            const { data } = await supabase.from('ads').select('position').eq('is_active', true);
            if (data) {
                setAdStatus({
                    popup: data.some(a => a.position === 'popup'),
                    sticky: data.some(a => a.position === 'sticky_bottom'),
                    header: data.some(a => a.position === 'header'),
                    sidebar: data.some(a => a.position === 'sidebar'),
                    article: data.some(a => a.position === 'in_article')
                });
            }
        } catch (error) {
            console.warn("Gagal mengecek iklan:", error);
        }
    };
    fetchAdsStatus();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowPopupAd(true);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (urlCat && categories.includes(urlCat)) {
      setActiveCat(urlCat);
    } else if (urlCat === "Indeks") {
      setActiveCat("Indeks");
    } else {
      setActiveCat("Home");
    }

    if (urlSearch) setSearchQuery(urlSearch);
    else setSearchQuery("");
  }, [urlCat, urlSearch]);

  useEffect(() => { setCurrentSlide(0); }, [activeCat]);

  useEffect(() => {
    const fetchSiteSettings = async () => {
        try {
            const { data } = await supabase.from('web_settings').select('*').eq('id', 1).single();
            if (data) setSiteConfig(data);
        } catch (error) {
            console.warn("Gagal menarik pengaturan harga:", error);
        }
    };
    fetchSiteSettings();
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedMode = localStorage.getItem('theme');
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (savedMode === 'dark' || (!savedMode && prefersDark)) setIsDarkMode(true);
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

  const allNewsSorted = useMemo(() => {
    return [...(news || [])].filter(item => item.status === 'published').sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
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
  }, [headlineCandidates.length, searchQuery, activeCat, currentSlide]); 

  const handleTouchStart = (e) => { setTouchStart(e.targetTouches[0].clientX); };
  const handleTouchMove = (e) => { setTouchEnd(e.targetTouches[0].clientX); };
  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    if (distance > 50) setCurrentSlide((prev) => (prev + 1) % headlineCandidates.length);
    if (distance < -50) setCurrentSlide((prev) => (prev === 0 ? headlineCandidates.length - 1 : prev - 1));
    setTouchStart(0); setTouchEnd(0);
  };

  const renderNewsGrid = (newsList, sectionTitle = "Terkini", hideTitle = false) => {
    if (newsList.length === 0) return null; 

    const handleSectionClick = () => {
      if (sectionTitle === "Terkini") setActiveCat("Indeks");
      else setActiveCat(sectionTitle); 
      window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
      <div className="mb-2 md:mb-4">
        {!hideTitle && (
          <div className={`flex items-center justify-between border-b-2 pb-2 mb-3 md:mb-6 ${isDarkMode ? 'border-slate-800' : 'border-slate-100'}`}>
            <div className="flex items-center gap-2 md:gap-3">
              <div className={`h-4 md:h-6 w-1 md:w-1.5 rounded-full ${sectionTitle === "Terkini" || sectionTitle === "Indeks Berita Terbaru" ? 'bg-red-600' : 'bg-blue-600'}`}></div>
              <h3 className={`font-black text-base md:text-xl tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{sectionTitle}</h3>
            </div>
            {sectionTitle !== "Indeks Berita Terbaru" && (
              <button onClick={handleSectionClick} className={`text-[10px] md:text-xs font-bold flex items-center gap-1 transition-colors ${isDarkMode ? 'text-slate-400 hover:text-blue-400' : 'text-slate-500 hover:text-blue-600'}`}>
                {sectionTitle === "Terkini" ? "Indeks" : "Lihat Semua"} <ChevronRight className="w-3 h-3"/>
              </button>
            )}
          </div>
        )}

        <div className="flex overflow-x-auto snap-x snap-mandatory gap-3 pb-2 md:pb-0 md:grid md:grid-cols-3 md:gap-5 no-scrollbar">
          {newsList.map((item, idx) => {
             const catColor = categoryConfig[item.category]?.color || "from-blue-600 to-indigo-600";
             
             return (
              <Link 
                key={item.id} 
                href={createSlug(item.title)} 
                className={`group flex flex-col rounded-xl md:rounded-2xl overflow-hidden transition-all duration-300 shrink-0 w-[150px] snap-start md:w-auto md:shrink ${idx >= 3 ? 'md:hidden' : ''} ${isDarkMode ? 'bg-slate-800 hover:bg-slate-700 border border-slate-700' : 'bg-white shadow-sm hover:shadow-xl hover:shadow-slate-200/60 hover:-translate-y-1 border border-slate-100'}`}
              >
                <div className="relative w-full aspect-[4/3] overflow-hidden bg-slate-100 shrink-0">
                  <img src={item.image_url || '/placeholder-news.jpg'} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out" alt={item.title} />
                  {item.category === "Entertainment" && <PlayCircle className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 md:w-8 md:h-8 text-white/80 drop-shadow-md" />}
                  <div className={`absolute bottom-2 left-2 md:bottom-3 md:left-3 bg-gradient-to-tr ${catColor} text-white text-[7px] md:text-[10px] font-black px-1.5 md:px-3 py-0.5 md:py-1 rounded md:rounded-lg uppercase tracking-wider shadow-md`}>
                    {item.category}
                  </div>
                </div>
                <div className="flex flex-col flex-grow p-2.5 md:p-5">
                  <h4 className={`font-bold text-[11px] md:text-base leading-snug line-clamp-3 transition-colors mb-2 md:mb-3 ${isDarkMode ? 'text-slate-200 group-hover:text-blue-400' : 'text-slate-800 group-hover:text-blue-600'}`}>
                    {item.title}
                  </h4>
                  <div className={`mt-auto flex flex-wrap items-center justify-between gap-1 text-[8px] md:text-[10px] font-bold uppercase tracking-wider border-t pt-2 md:pt-3 ${isDarkMode ? 'text-slate-400 border-slate-700' : 'text-slate-500 border-slate-100'}`}>
                    <span className="flex items-center gap-1 line-clamp-1"><Clock className="w-2.5 h-2.5 md:w-3 md:h-3 shrink-0" /> {timeAgo(item.created_at)}</span>
                    <span className="flex items-center gap-1 text-blue-500 bg-blue-50/50 dark:bg-blue-500/10 px-1.5 md:px-2 py-0.5 rounded-md"><Eye className="w-2.5 h-2.5 md:w-3 md:h-3 shrink-0" /> {item.views || 0}</span>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    );
  };

  return (
    <div 
      className="min-h-screen font-sans relative overflow-x-hidden transition-colors duration-300 pb-20"
      style={{ backgroundColor: isDarkMode ? '#0B0F19' : '#ffffff', color: isDarkMode ? '#f8fafc' : '#0f172a' }}
    >
      
      <AnimatePresence>
        {showPopupAd && adStatus.popup && (
          <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }} transition={{ type: "spring", damping: 20 }}
              className="relative w-full max-w-sm md:max-w-lg aspect-[4/5] md:aspect-video bg-transparent"
            >
              <button
                onClick={() => setShowPopupAd(false)}
                className="absolute -top-10 right-0 md:-top-12 md:-right-10 w-8 h-8 md:w-10 md:h-10 bg-red-600 hover:bg-red-700 text-white rounded-full flex items-center justify-center shadow-lg transition-transform active:scale-95 z-50"
              >
                <X size={20} />
              </button>
              <AdBanner position="popup" />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL MENU HAMBURGER (KIRI) */}
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
                <button onClick={() => handleCategoryClick("Home")} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors font-bold text-xs ${isDarkMode ? 'hover:bg-slate-800 text-slate-300' : 'hover:bg-slate-50 text-slate-700'}`}><HomeIcon className="w-4 h-4"/> Beranda</button>
                <button onClick={() => { setIsAboutOpen(true); setIsMobileMenuOpen(false); }} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors font-bold text-xs ${isDarkMode ? 'hover:bg-slate-800 text-slate-300' : 'hover:bg-slate-50 text-slate-700'}`}><Info className="w-4 h-4"/> Tentang Kami</button>
                <button onClick={() => { setIsContactOpen(true); setIsMobileMenuOpen(false); }} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors font-bold text-xs ${isDarkMode ? 'hover:bg-slate-800 text-slate-300' : 'hover:bg-slate-50 text-slate-700'}`}><Megaphone className="w-4 h-4"/> Contact Admin</button>
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
          
          <div className="h-12 md:h-16 flex items-center justify-between relative">
            <div className="flex-1 flex justify-start md:hidden">
              <button onClick={() => setIsMobileMenuOpen(true)} className={`p-1.5 rounded-lg active:scale-95 transition-all ${isDarkMode ? 'text-slate-300 hover:bg-slate-800' : 'text-slate-600 hover:bg-slate-100'}`}>
                <Menu className="w-5 h-5"/>
              </button>
            </div>
            <div className="flex-1 hidden md:flex justify-start"></div>
            
            <div className="flex shrink-0 justify-center">
              <button onClick={() => handleCategoryClick("Home")} className="flex items-center gap-1.5 md:gap-2 group cursor-pointer active:scale-95 transition-transform">
                <div className="bg-gradient-to-tr from-blue-600 to-blue-400 p-1 md:p-1.5 rounded-md md:rounded-lg text-white group-hover:rotate-12 transition-transform shadow-md">
                  <Zap className="w-3.5 h-3.5 md:w-5 md:h-5 fill-white" />
                </div>
                <span className={`text-lg md:text-2xl font-black italic tracking-tighter ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                  SULTRA<span className="text-blue-600">FIKS</span>
                </span>
              </button>
            </div>
            
            <div className="flex-1 flex justify-end items-center gap-1.5">
              
              {/* 🔥 TOMBOL SEARCH MOBILE (MENGGANTIKAN TITIK TIGA) 🔥 */}
              <button 
                  onClick={() => setIsSearchModalOpen(true)} 
                  className={`md:hidden w-7 h-7 flex items-center justify-center rounded-full transition-all border shadow-sm active:scale-95 ${isDarkMode ? 'bg-slate-800 text-slate-300 border-slate-700' : 'bg-slate-100 text-slate-600 border-slate-200'}`}
              >
                  <Search className="w-3.5 h-3.5" />
              </button>

              <button onClick={toggleDarkMode} className={`md:hidden w-7 h-7 flex items-center justify-center rounded-full transition-all border shadow-sm active:scale-95 ${isDarkMode ? 'bg-slate-800 text-yellow-400 border-slate-700 hover:bg-slate-700' : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'}`}>
                {isDarkMode ? <Sun className="w-3.5 h-3.5 fill-current" /> : <Moon className="w-3.5 h-3.5 fill-current" />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between pb-2 md:pb-3 pt-1 px-1 w-full">
            
            <div className="flex-1 overflow-x-auto no-scrollbar flex gap-2 md:gap-4 items-center pr-4">
              {categories.map((cat) => {
                const config = categoryConfig[cat];
                const IconComponent = config.icon;
                const isActive = activeCat === cat && !searchQuery && activeCat !== "Indeks"; 
                return (
                  <button key={cat} onClick={() => handleCategoryClick(cat)} className="flex flex-col items-center gap-1.5 group shrink-0 px-1 md:px-2 active:scale-95 transition-transform">
                    <div className={`w-9 h-9 md:w-12 md:h-12 rounded-[10px] md:rounded-[12px] flex items-center justify-center transition-all duration-300 relative overflow-hidden ${isActive ? `bg-gradient-to-tr ${config.color} text-white shadow-md border-0 scale-105` : (isDarkMode ? 'bg-slate-800 text-slate-400 border-slate-700 border hover:bg-slate-700 hover:text-white' : 'bg-slate-50 text-slate-500 border-slate-200 border hover:bg-white hover:text-blue-600')}`}>
                      <IconComponent className={`w-4 h-4 md:w-5 md:h-5 relative z-10 transition-transform ${isActive ? 'scale-110' : ''}`} />
                    </div>
                    <span className={`text-[9px] md:text-xs font-bold tracking-wide transition-colors ${isActive ? 'text-blue-600 dark:text-blue-400' : (isDarkMode ? 'text-slate-400 group-hover:text-slate-200' : 'text-slate-500 group-hover:text-slate-800')}`}>{cat}</span>
                  </button>
                )
              })}
            </div>

            {/* KANAN DESKTOP: TOMBOL SEARCH & DARK MODE */}
            <div className="hidden md:flex items-center gap-3 shrink-0 pl-3 border-l-2 border-slate-200 dark:border-slate-800">
              
              <button 
                  onClick={() => setIsSearchModalOpen(true)} 
                  className={`w-10 h-10 flex items-center justify-center rounded-full transition-all border shadow-sm ${isDarkMode ? 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700' : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'}`}
                  title="Cari Berita"
              >
                  <Search className="w-5 h-5" />
              </button>

              <button onClick={toggleDarkMode} className={`w-10 h-10 flex items-center justify-center rounded-full transition-all border shadow-sm ${isDarkMode ? 'bg-slate-800 text-yellow-400 border-slate-700 hover:bg-slate-700' : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'}`}>
                {isDarkMode ? <Sun className="w-5 h-5 fill-current" /> : <Moon className="w-5 h-5 fill-current" />}
              </button>

            </div>

          </div>

        </div>
      </header>

      {/* 🔥 MODAL PENCARIAN ELEGAN (UNTUK MOBILE DAN DESKTOP) 🔥 */}
      <AnimatePresence>
          {isSearchModalOpen && (
              <motion.div 
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="fixed top-16 md:top-24 left-1/2 -translate-x-1/2 w-full max-w-xl z-[100] px-4"
              >
                  <div className={`flex w-full rounded-full px-5 py-3 md:px-6 md:py-4 items-center shadow-2xl border-2 focus-within:border-blue-500 transition-colors ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
                      <Search className={`w-5 h-5 md:w-6 md:h-6 mr-3 shrink-0 ${isDarkMode ? 'text-slate-400' : 'text-slate-400'}`}/>
                      <input 
                          autoFocus
                          className={`bg-transparent border-none outline-none text-sm md:text-lg w-full font-bold ${isDarkMode ? 'text-slate-200 placeholder:text-slate-500' : 'text-slate-700 placeholder:text-slate-400'}`} 
                          placeholder="Ketik topik berita..." 
                          value={searchQuery} 
                          onChange={(e) => setSearchQuery(e.target.value)}
                          onKeyDown={(e) => { if (e.key === 'Enter') setIsSearchModalOpen(false); }}
                      />
                      <button onClick={() => { setSearchQuery(""); setIsSearchModalOpen(false); }} className="text-red-500 p-1 md:p-2 hover:bg-red-50 rounded-full transition-colors shrink-0">
                          <X className="w-5 h-5 md:w-6 md:h-6" />
                      </button>
                  </div>
                  {/* Backdrop Click to Close */}
                  <div className="fixed inset-0 -z-10 bg-black/40 backdrop-blur-sm" onClick={() => setIsSearchModalOpen(false)}></div>
              </motion.div>
          )}
      </AnimatePresence>

      <main className="max-w-7xl mx-auto px-3 md:px-4 pt-[110px] md:pt-[150px] pb-5 md:pb-8">

        {allNewsSorted.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 text-center">
             <div className="w-20 h-20 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-6">
                <Zap size={40} className="fill-blue-600" />
             </div>
             <h2 className={`text-2xl font-black mb-2 ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>Belum Ada Berita Diterbitkan</h2>
             <p className={`text-sm font-medium ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Tim Redaksi SultraFiks sedang menyiapkan berita terbaik untuk Anda.</p>
          </div>
        ) : searchQuery ? (
          <div className="mb-8">
            <h2 className={`text-lg font-bold flex items-center gap-2 mb-4 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}><Search className="w-4 h-4 text-blue-500"/>Hasil: <span className="text-blue-500 italic">&quot;{searchQuery}&quot;</span></h2>
            {renderNewsGrid(allNewsSorted.filter(n => n.title.toLowerCase().includes(searchQuery.toLowerCase())), "Hasil Pencarian", true)}
          </div>
        ) : (
          <section className="grid grid-cols-1 lg:grid-cols-12 gap-5 md:gap-6 mt-2 md:mt-4">
            
            <div className="lg:col-span-8 flex flex-col gap-5 md:gap-6 overflow-hidden">
              
              {adStatus.header && (
                <div className="w-full h-24 md:h-[120px] lg:h-[140px] mt-3 md:mt-5 relative bg-transparent">
                    <AdBanner position="header" />
                </div>
              )}

              {headlineCandidates.length > 0 && activeCat !== "Indeks" && (
                <div 
                  className={`relative w-full h-56 md:h-[400px] rounded-xl md:rounded-2xl overflow-hidden group shadow-md touch-pan-y ${isDarkMode ? 'bg-slate-900 border border-slate-800' : 'bg-slate-900'}`}
                  onTouchStart={handleTouchStart}
                  onTouchMove={handleTouchMove}
                  onTouchEnd={handleTouchEnd}
                >
                  <div className="flex h-full w-full transition-transform duration-700 ease-in-out" style={{ transform: `translateX(-${currentSlide * 100}%)` }}>
                    {headlineCandidates.map((item) => {
                      const catColor = categoryConfig[item.category]?.color || "from-blue-600 to-indigo-600";

                      return (
                        <div key={item.id} className="w-full h-full flex-shrink-0 relative">
                          <Link href={createSlug(item.title)} className="block w-full h-full">
                            <img src={item.image_url || '/placeholder-news.jpg'} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000" alt={item.title} />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent flex flex-col justify-end p-4 md:p-8 pointer-events-none">
                              <div className="flex items-center gap-1.5 md:gap-2 mb-2">
                                <span className="bg-red-600 text-white text-[8px] md:text-[10px] font-black px-2 py-0.5 md:px-3 py-1 rounded-sm uppercase tracking-wider shadow-sm">Headline</span>
                                <span className={`bg-gradient-to-tr ${catColor} text-white text-[8px] md:text-[10px] font-bold px-2 py-0.5 md:px-3 py-1 rounded-sm uppercase tracking-wider shadow-sm`}>
                                  {item.category}
                                </span>
                              </div>
                              <h2 className="text-lg md:text-3xl font-black text-white leading-tight mb-2 line-clamp-3 drop-shadow-md">{item.title}</h2>
                              <div className="flex items-center gap-2 text-slate-300 text-[9px] md:text-xs font-medium">
                                <span className="flex items-center gap-1 font-bold"><Clock className="w-3 h-3"/> {timeAgo(item.created_at)}</span>
                              </div>
                            </div>
                          </Link>
                        </div>
                      );
                    })}
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
                <div>
                  {renderNewsGrid(allNewsSorted, "Indeks Berita Terbaru")}
                </div>
              ) : activeCat === "Home" ? (
                <div className="flex flex-col gap-3 md:gap-6 mt-2">
                  
                  {renderNewsGrid(regularNewsList.slice(0, 5), "Terkini")}

                  {adStatus.article && (
                    <div className="w-full h-20 md:h-28 relative bg-transparent">
                        <AdBanner position="in_article" />
                    </div>
                  )}

                  {categories.filter(c => c !== "Home").map((catName) => {
                    const catNewsList = allNewsSorted.filter(n => n.category === catName).slice(0, 5);
                    if (catNewsList.length === 0) return null; 
                    
                    const config = categoryConfig[catName];
                    const CatIcon = config.icon;

                    return (
                      <div key={catName}>
                        <div className={`flex items-center justify-between border-b-2 pb-2 md:pb-3 mb-4 ${isDarkMode ? 'border-slate-800' : 'border-slate-100'}`}>
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

            <div className="lg:col-span-4 flex flex-col gap-5 md:gap-6 pt-3 md:pt-5">
              <div className="lg:sticky lg:top-32 flex flex-col gap-5 md:gap-6 z-10">
                
                {adStatus.sidebar && (
                  <div className="w-full max-h-[300px] aspect-[4/3] relative bg-transparent">
                      <AdBanner position="sidebar" />
                  </div>
                )}

                {trendingList.length > 0 && (
                  <div className={`p-4 md:p-6 rounded-xl border shadow-sm ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'}`}>
                    <div className={`flex items-center justify-between mb-4 border-b-2 pb-2 ${isDarkMode ? 'border-slate-700' : 'border-slate-100'}`}>
                      <h3 className={`font-black text-base md:text-xl tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Terpopuler</h3>
                    </div>
                    <div className="flex flex-col gap-4">
                        {trendingList.map((item, idx) => (
                          <Link key={item.id} href={createSlug(item.title)} className={`flex gap-3 group items-start border-b pb-3 last:border-0 last:pb-0 ${isDarkMode ? 'border-slate-700/50' : 'border-slate-50'}`}>
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
                        ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>
        )}
      </main>

      <footer className="bg-[#0f172a] text-white pt-10 md:pt-16 pb-6 px-4 mt-6">
        <div className="max-w-5xl mx-auto text-center md:text-left">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12 mb-8 md:mb-12">
            
            <div className="space-y-3">
              <a href="/" className="text-2xl md:text-3xl font-black italic text-blue-500 tracking-tighter">SULTRA<span className="text-white">FIKS</span></a>
              <p className="text-slate-400 text-[11px] md:text-sm leading-relaxed max-w-xs mx-auto md:mx-0">Media siber terdepan di Sulawesi Tenggara yang menyajikan informasi cepat, akurat, dan terpercaya.</p>
            </div>

            <div className="flex flex-col items-center md:items-start">
              <h4 className="font-black text-sm md:text-lg mb-4 md:mb-6 border-b border-slate-800 pb-2 uppercase tracking-widest text-blue-500 italic inline-block md:block">
                  Official Sosmed
              </h4>
              <div className="flex flex-col gap-3">
                  <a href="#" className="flex items-center gap-3 group w-fit">
                      <div className="w-8 h-8 rounded-full bg-[#1877F2] flex items-center justify-center text-white shadow-md group-hover:scale-110 transition-transform"><Facebook className="w-4 h-4 fill-white" /></div>
                      <span className="text-slate-400 text-xs font-bold group-hover:text-[#1877F2] transition-colors">Facebook SultraFiks</span>
                  </a>
                  <a href="#" className="flex items-center gap-3 group w-fit">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888] flex items-center justify-center text-white shadow-md group-hover:scale-110 transition-transform"><Instagram className="w-4 h-4" /></div>
                      <span className="text-slate-400 text-xs font-bold group-hover:text-pink-500 transition-colors">Instagram SultraFiks</span>
                  </a>
                  <a href="#" className="flex items-center gap-3 group w-fit">
                      <div className="w-8 h-8 rounded-full bg-[#FF0000] flex items-center justify-center text-white shadow-md group-hover:scale-110 transition-transform"><Youtube className="w-4 h-4 fill-white" /></div>
                      <span className="text-slate-400 text-xs font-bold group-hover:text-[#FF0000] transition-colors">YouTube SultraFiks</span>
                  </a>
                  <a href="#" className="flex items-center gap-3 group w-fit">
                      <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-black shadow-md group-hover:scale-110 transition-transform"><TikTokIcon className="w-4 h-4" /></div>
                      <span className="text-slate-400 text-xs font-bold group-hover:text-white transition-colors">TikTok SultraFiks</span>
                  </a>
              </div>
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
      
      {/* MODAL TENTANG KAMI & CONTACT ADMIN */}
      <AnimatePresence>
        {isAboutOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className={`w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}
            >
              <div className="bg-gradient-to-tr from-blue-600 to-indigo-600 p-6 flex flex-col items-center justify-center relative">
                <button onClick={() => setIsAboutOpen(false)} className="absolute top-4 right-4 p-2 bg-white/20 hover:bg-white/30 rounded-full text-white transition-colors active:scale-95"><X className="w-4 h-4" /></button>
                <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-lg mb-3 rotate-3"><Zap className="w-8 h-8 text-blue-600 fill-blue-600" /></div>
                <h2 className="text-2xl font-black italic text-white tracking-tighter">SULTRAFIKS</h2>
                <p className="text-blue-100 text-[10px] font-bold uppercase tracking-widest mt-1">Official Media Partner</p>
              </div>
              <div className="p-6 text-center">
                <p className={`text-sm leading-relaxed mb-6 font-medium ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                  Media siber terdepan di Sulawesi Tenggara yang menyajikan informasi cepat, akurat, dan terpercaya. Kami berkomitmen untuk menjadi mata dan telinga bagi masyarakat.
                </p>
                <div className={`flex items-center justify-center gap-2 text-xs font-bold py-3 rounded-xl border ${isDarkMode ? 'bg-slate-800 text-slate-400 border-slate-700' : 'bg-slate-50 text-slate-500 border-slate-100'}`}>
                  <BadgeCheck className="w-5 h-5 text-blue-500" /> Dikelola Oleh CV.AVA AMAZONE.IND
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {isContactOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className={`w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}
            >
              <div className="bg-gradient-to-tr from-amber-500 to-orange-600 p-6 flex flex-col items-center justify-center relative">
                <button onClick={() => setIsContactOpen(false)} className="absolute top-4 right-4 p-2 bg-white/20 hover:bg-white/30 rounded-full text-white transition-colors active:scale-95"><X className="w-4 h-4" /></button>
                <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-lg mb-3"><Megaphone className="w-8 h-8 text-amber-500" /></div>
                <h2 className="text-2xl font-black italic text-white tracking-tighter">CONTACT ADMIN</h2>
                <p className="text-amber-100 text-[10px] font-bold uppercase tracking-widest mt-1">Informasi Pemasangan Iklan</p>
              </div>
              <div className="p-6 text-center">
                <p className={`text-sm leading-relaxed mb-6 font-medium ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                  Tingkatkan jangkauan bisnis Anda dengan beriklan di portal berita SultraFiks. Berikut adalah Price List ruang iklan kami:
                </p>

                <div className={`text-left rounded-xl p-4 mb-6 border ${isDarkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                    <ul className="space-y-3">
                        <li className="flex justify-between items-center border-b pb-2 border-slate-200/50 dark:border-slate-700">
                            <span className={`text-xs font-bold ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>Banner Header (Atas)</span>
                            <span className="text-xs font-black text-amber-500">{siteConfig?.header_price || 'Rp 500k'} <span className="text-[9px] text-slate-400 font-normal">/Bulan</span></span>
                        </li>
                        <li className="flex justify-between items-center border-b pb-2 border-slate-200/50 dark:border-slate-700">
                            <span className={`text-xs font-bold ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>Banner Sidebar (Samping)</span>
                            <span className="text-xs font-black text-amber-500">{siteConfig?.sidebar_price || 'Rp 350k'} <span className="text-[9px] text-slate-400 font-normal">/Bulan</span></span>
                        </li>
                        <li className="flex justify-between items-center">
                            <span className={`text-xs font-bold ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>In-Article (Dalam Berita)</span>
                            <span className="text-xs font-black text-amber-500">{siteConfig?.article_price || 'Rp 250k'} <span className="text-[9px] text-slate-400 font-normal">/Bulan</span></span>
                        </li>
                    </ul>
                </div>

                <button 
                  onClick={() => window.open(`https://wa.me/${siteConfig?.wa_number || '6285242842268'}?text=Halo%20Admin%20SultraFiks,%20saya%20tertarik%20untuk%20memasang%20iklan.%20Boleh%20minta%20informasi%20lebih%20lanjut?`, '_blank')}
                  className="w-full py-4 bg-green-500 hover:bg-green-600 text-white rounded-xl font-black text-xs uppercase tracking-widest transition-all shadow-lg shadow-green-500/30 flex items-center justify-center gap-2 active:scale-95"
                >
                  <Phone className="w-4 h-4"/> Hubungi Admin via WA
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showStickyAd && adStatus.sticky && (
          <motion.div
            initial={{ y: 150, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 150, opacity: 0 }} transition={{ type: "spring", damping: 25 }}
            className="fixed bottom-0 left-0 right-0 z-[150] flex justify-center pb-2 md:pb-4 px-2 pointer-events-none"
          >
            <div className="relative w-full max-w-3xl h-16 md:h-24 bg-transparent pointer-events-auto">
              <button
                onClick={() => setShowStickyAd(false)}
                className="absolute -top-3 -right-1 md:-top-4 md:-right-3 w-6 h-6 md:w-8 md:h-8 bg-slate-800 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-slate-700 z-50 transition-transform active:scale-95 border-2 border-white"
              >
                <X size={14} className="md:w-4 md:h-4" />
              </button>
              <AdBanner position="sticky_bottom" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}