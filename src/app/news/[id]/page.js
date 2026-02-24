/* eslint-disable @next/next/no-img-element */
/* eslint-disable @next/next/no-html-link-for-pages */
"use client";

import React, { useEffect, useState, useRef } from 'react';
import { useNews } from '@/context/NewsContext'; 
import { useParams, useRouter } from 'next/navigation';
import { 
    ArrowLeft, Bot, Send, Minus, Plus, Bookmark, Quote, TrendingUp,
    BadgeCheck, Zap, X, Volume2, VolumeX, Heart, MessageCircle, 
    Facebook, Twitter, Youtube, Hash, Home, Clock, Link as LinkIcon, Share2, ImageIcon, Eye, CheckCircle2 
} from 'lucide-react'; 
import Link from 'next/link';
import { motion, AnimatePresence, useScroll, useSpring } from 'framer-motion';

// --- FUNGSI HELPER WAKTU RELATIF ---
const timeAgo = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const secondsPast = (now.getTime() - date.getTime()) / 1000;

    if (secondsPast < 60) return `Baru saja`;
    if (secondsPast < 3600) return `${Math.floor(secondsPast / 60)} menit yang lalu`;
    if (secondsPast <= 86400) return `${Math.floor(secondsPast / 3600)} jam yang lalu`;
    if (secondsPast > 86400) {
        const day = Math.floor(secondsPast / 86400);
        if (day === 1) return "Kemarin";
        return date.toLocaleDateString("id-ID", { day: 'numeric', month: 'short', year: 'numeric' });
    }
    return '';
};

// --- FUNGSI FORMAT TANGGAL ---
const formatIndonesianDate = (isoString) => {
    if (!isoString) return "Tanggal tidak diketahui";
    const date = new Date(isoString);
    return date.toLocaleDateString("id-ID", { day: 'numeric', month: 'long', year: 'numeric' });
};

export default function NewsDetail() {
    const params = useParams();
    const router = useRouter();
    const { news } = useNews(); 
    
    const chatEndRef = useRef(null); 
    const [article, setArticle] = useState(null);
    const [loading, setLoading] = useState(true);
    const [relatedNews, setRelatedNews] = useState([]);

    const [fontSize, setFontSize] = useState(18); 
    const [isSaved, setIsSaved] = useState(false);
    const [isLiked, setIsLiked] = useState(false);
    
    // STATE UNTUK NOTIFIKASI POP-UP (TOAST)
    const [toast, setToast] = useState({ show: false, message: '' });
    
    const [isAIChatOpen, setIsAIChatOpen] = useState(false);
    const [chatMessages, setChatMessages] = useState([{ role: 'ai', text: 'Halo! Saya AI SultraFiks. Ada yang ingin Anda tanyakan tentang berita ini?' }]);
    const [userInput, setUserInput] = useState("");
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [isThinking, setIsThinking] = useState(false);

    const { scrollYProgress } = useScroll();
    const scaleX = useSpring(scrollYProgress, { stiffness: 100, damping: 30, restDelta: 0.001 });

    useEffect(() => {
        if (!params.id || news.length === 0) return;
        const targetId = String(params.id);
        const found = news.find(item => String(item.id) === targetId);
        
        if (found) {
            setArticle(found);
            setRelatedNews(news.filter(item => item.category === found.category && String(item.id) !== targetId).sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 4));
        }
        setLoading(false);
    }, [params.id, news]);

    useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [chatMessages, isAIChatOpen]);

    // FUNGSI MENAMPILKAN NOTIFIKASI
    const showToast = (message) => {
        setToast({ show: true, message });
        setTimeout(() => setToast({ show: false, message: '' }), 3000);
    };

    // FUNGSI SHARE SOSIAL MEDIA AKTIF
    const handleShare = (platform) => {
        const currentUrl = window.location.href;
        const shareText = `Baca berita terbaru: ${article?.title} di SultraFiks!`;

        let url = '';
        switch(platform) {
            case 'facebook': 
                url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(currentUrl)}`; 
                break;
            case 'twitter': 
                url = `https://twitter.com/intent/tweet?url=${encodeURIComponent(currentUrl)}&text=${encodeURIComponent(shareText)}`; 
                break;
            case 'whatsapp': 
                url = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText + ' ' + currentUrl)}`; 
                break;
            case 'copy':
                navigator.clipboard.writeText(currentUrl);
                showToast("Tautan berita berhasil disalin! 🔗");
                return;
        }
        if(url) window.open(url, '_blank', 'width=600,height=400');
    };

    const handleLikeClick = () => {
        setIsLiked(!isLiked);
        if (!isLiked) showToast("Anda menyukai berita ini! ❤️");
    };

    const handleCommentClick = () => {
        showToast("Fitur komentar akan segera hadir! 💬");
    };

    const handleAISpeakNews = () => {
        if (!article) return;
        if (isSpeaking) {
            window.speechSynthesis.cancel();
            setIsSpeaking(false);
        } else {
            const utterance = new SpeechSynthesisUtterance(article.content);
            utterance.lang = 'id-ID';
            utterance.onstart = () => setIsSpeaking(true);
            utterance.onend = () => setIsSpeaking(false);
            window.speechSynthesis.speak(utterance);
        }
    };

    const handleSendMessage = async (e) => { 
        e.preventDefault(); 
        if (!userInput.trim() || !article) return; 
        const userMessage = userInput;
        setChatMessages(prev => [...prev, { role: 'user', text: userMessage }]); 
        setUserInput(""); 
        setIsThinking(true); 
        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt: userMessage, articleTitle: article.title, articleContent: article.content })
            });
            const data = await response.json();
            setChatMessages(prev => [...prev, { role: 'ai', text: data.text }]);
        } catch (error) { setChatMessages(prev => [...prev, { role: 'ai', text: "Gagal terhubung ke AI." }]); } finally { setIsThinking(false); }
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center bg-white"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>;
    if (!article) return <div className="min-h-screen flex items-center justify-center text-slate-400 font-bold uppercase tracking-widest">Memuat Berita SultraFiks...</div>;

    // Generate smart tags dari judul/kategori (karena di DB tidak ada tabel tag khusus)
    const smartTags = ['Kendari', 'SultraFiks', article.category, 'Berita Terkini'];

    return (
        <div className="min-h-screen bg-white font-sans text-slate-900 pb-20 md:pb-0 relative">
            <motion.div className="fixed top-0 left-0 right-0 h-1.5 bg-blue-600 origin-left z-[60]" style={{ scaleX }} />

            {/* KOMPONEN POP-UP TOAST */}
            <AnimatePresence>
                {toast.show && (
                    <motion.div 
                        initial={{ opacity: 0, y: -50, scale: 0.9 }} 
                        animate={{ opacity: 1, y: 20, scale: 1 }} 
                        exit={{ opacity: 0, y: -20, scale: 0.9 }}
                        className="fixed top-20 left-1/2 -translate-x-1/2 z-[100] bg-slate-900 text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 font-bold text-sm tracking-wide"
                    >
                        <CheckCircle2 className="w-5 h-5 text-green-400" />
                        {toast.message}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* HEADER */}
            <div className="sticky top-0 z-50 bg-white/90 backdrop-blur-xl border-b border-slate-200 px-4 py-3">
                <div className="max-w-5xl mx-auto flex justify-between items-center">
                    <button onClick={() => router.back()} className="p-2 rounded-full bg-slate-100 hover:bg-slate-200 transition-colors"><ArrowLeft className="w-5 h-5" /></button>
                    <a href="/" className="text-lg font-black italic text-blue-600">SULTRA<span className="text-slate-900">FIKS</span></a>
                    <div className="flex gap-2">
                        <button onClick={() => setFontSize(f => Math.max(14, f - 2))} className="p-2 text-slate-400 hover:text-blue-600"><Minus className="w-4 h-4"/></button>
                        <button onClick={() => setFontSize(f => Math.min(24, f + 2))} className="p-2 text-slate-400 hover:text-blue-600"><Plus className="w-4 h-4"/></button>
                    </div>
                </div>
            </div>

            <main className="max-w-5xl mx-auto px-4 py-8 pb-20">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                    <div className="lg:col-span-8">
                        <div className="flex items-center gap-2 text-xs font-bold text-blue-600 mb-4 uppercase">
                            <span className="bg-blue-50 px-2 py-1 rounded">News</span> / <span>{article?.category || 'Utama'}</span>
                        </div>
                        <h1 className="text-3xl md:text-5xl font-black leading-tight mb-6 tracking-tight">{article?.title}</h1>
                        
                        <div className="flex items-center justify-between border-b border-slate-100 pb-6 mb-8">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-blue-500 flex items-center justify-center shadow-lg shadow-blue-500/30 shrink-0">
                                    <Zap className="w-6 h-6 fill-white text-white stroke-white" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-1.5">
                                        <p className="text-base font-black text-slate-900">SultraFiks</p>
                                        <BadgeCheck className="w-5 h-5 text-blue-600 fill-blue-100" />
                                    </div>
                                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                                        Official Media Partner
                                    </p>
                                    <p className="text-xs text-slate-500 font-bold flex items-center gap-1 mt-1">
                                        <Clock className="w-3.5 h-3.5 text-blue-500"/>
                                        {timeAgo(article?.created_at)}
                                        <span className="mx-1">•</span>
                                        <Eye className="w-3.5 h-3.5 text-blue-500 ml-1"/>
                                        <span>{article?.views || 0} Dilihat</span>
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-1 group relative">
                                <motion.button
                                    whileTap={{ scale: 0.8, rotate: isSaved ? -15 : 15 }}
                                    onClick={() => { setIsSaved(!isSaved); if(!isSaved) showToast("Berita disimpan ke Bookmark! 🔖"); }}
                                    className={`p-3 rounded-full border-2 transition-all ${isSaved ? 'bg-yellow-50 border-yellow-400 shadow-yellow-100' : 'border-slate-100 hover:border-blue-200 hover:bg-blue-50'}`}
                                >
                                    <Bookmark className={`w-6 h-6 transition-colors ${isSaved ? 'fill-yellow-500 text-yellow-500' : 'text-slate-400 group-hover:text-blue-500'}`}/>
                                </motion.button>
                                <span className={`absolute top-full mt-2 right-0 text-[10px] font-bold uppercase tracking-widest whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 text-white px-2 py-1 rounded-md ${isSaved ? 'text-yellow-500' : 'text-slate-200'}`}>
                                    {isSaved ? 'Tersimpan' : 'Simpan Berita'}
                                </span>
                            </div>
                        </div>

                        <div className="mb-2 rounded-3xl overflow-hidden shadow-2xl bg-slate-100 relative w-full aspect-video">
                            {article?.image_url ? (
                                <img src={article.image_url} className="w-full h-full object-cover" alt={article?.title} />
                            ) : (
                                <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-300">
                                    <ImageIcon size={48} className="mb-2" />
                                    <span className="text-sm font-bold">Tanpa Foto</span>
                                </div>
                            )}
                        </div>
                        <div className="flex flex-col md:flex-row justify-between text-xs text-slate-500 mb-10 px-2 italic">
                            <p>{article?.photo_caption || "Ilustrasi berita."}</p>
                            {article?.photo_source && <p className="font-bold uppercase tracking-widest text-slate-400">Foto: {article.photo_source}</p>}
                        </div>

                        <article className="prose prose-lg max-w-none mb-12 text-slate-800" style={{ fontSize: `${fontSize}px`, lineHeight: '1.8' }}>
                            {article?.content?.split('\n').map((p, i) => {
                                if (!p.trim()) return null;
                                if (p.trim().startsWith('>')) {
                                    return (
                                        <div key={i} className="my-8 pl-6 border-l-4 border-blue-600 relative bg-blue-50/30 py-4 rounded-r-xl">
                                            <Quote className="absolute top-2 right-2 w-8 h-8 text-blue-100 rotate-180"/>
                                            <p className="italic font-semibold text-slate-700 text-lg md:text-xl leading-relaxed relative z-10">
                                                <span className="text-blue-600 font-serif text-2xl mr-1">“</span>
                                                {p.trim().substring(1).trim()}
                                                <span className="text-blue-600 font-serif text-2xl ml-1">”</span>
                                            </p>
                                        </div>
                                    );
                                }
                                return <p key={i} className="mb-6 leading-relaxed text-justify font-serif">{p}</p>;
                            })}
                        </article>

                        {/* --- BAGIAN BAWAH BERITA (SESUAI REQUEST BOS) --- */}
                        <div className="mt-12 pt-8 border-t border-slate-100">
                            
                            {/* TAGS BISA DIKLIK */}
                            <div className="flex flex-wrap gap-2 mb-8">
                                {smartTags.map((tag) => (
                                    <button 
                                        key={tag} 
                                        onClick={() => router.push(`/?search=${tag}`)}
                                        className="px-4 py-1.5 border border-blue-200 text-blue-600 rounded-lg text-xs font-bold bg-white hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                                    >
                                        {tag}
                                    </button>
                                ))}
                            </div>

                            {/* ENGAGEMENT & SHARE */}
                            <div className="flex flex-col sm:flex-row justify-between items-center gap-6 py-6 border-y border-slate-100 mb-10">
                                
                                <div className="flex items-center gap-6">
                                    <motion.button 
                                        whileTap={{ scale: 0.8 }}
                                        onClick={handleLikeClick} 
                                        className="flex items-center gap-2 group"
                                    >
                                        <Heart className={`w-8 h-8 transition-all ${isLiked ? 'fill-red-500 text-red-500 scale-110 drop-shadow-md' : 'text-slate-400 group-hover:text-red-500'}`} />
                                        <span className={`font-black text-lg transition-colors ${isLiked ? 'text-red-500' : 'text-slate-500'}`}>
                                            {isLiked ? 299 : 298}
                                        </span>
                                    </motion.button>
                                    
                                    <motion.button 
                                        whileTap={{ scale: 0.9 }}
                                        onClick={handleCommentClick}
                                        className="flex items-center gap-2 text-slate-400 hover:text-blue-600 transition-colors group"
                                    >
                                        <MessageCircle className="w-8 h-8 group-hover:fill-blue-50" />
                                        <span className="font-black text-lg text-slate-500 group-hover:text-blue-600">12</span>
                                    </motion.button>
                                </div>

                                <div className="flex items-center gap-3">
                                    <span className="text-xs font-black uppercase tracking-widest text-slate-400 mr-2">Bagikan:</span>
                                    
                                    {/* TOMBOL SHARE AKTIF */}
                                    <button onClick={() => handleShare('facebook')} className="p-3 bg-slate-100 text-slate-600 hover:bg-[#1877F2] hover:text-white rounded-full transition-all hover:shadow-lg hover:shadow-blue-500/30">
                                        <Facebook className="w-5 h-5" />
                                    </button>
                                    <button onClick={() => handleShare('twitter')} className="p-3 bg-slate-100 text-slate-600 hover:bg-[#1DA1F2] hover:text-white rounded-full transition-all hover:shadow-lg hover:shadow-sky-500/30">
                                        <Twitter className="w-5 h-5" />
                                    </button>
                                    <button onClick={() => handleShare('whatsapp')} className="p-3 bg-slate-100 text-slate-600 hover:bg-[#25D366] hover:text-white rounded-full transition-all hover:shadow-lg hover:shadow-green-500/30">
                                        {/* Zap dipakai sebagai ikon fast share/WA sesuai foto Bos */}
                                        <Zap className="w-5 h-5" />
                                    </button>
                                    <button onClick={() => handleShare('copy')} className="p-3 bg-slate-100 text-slate-600 hover:bg-slate-800 hover:text-white rounded-full transition-all hover:shadow-lg">
                                        <LinkIcon className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* SIDEBAR KANAN */}
                    <div className="lg:col-span-4 space-y-8">
                        <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 sticky top-24">
                            <h3 className="font-black text-lg mb-5 flex items-center gap-2 text-slate-900 uppercase tracking-tighter italic">
                                <TrendingUp className="w-5 h-5 text-red-500"/> Terkait <span className="text-blue-600 text-sm">({article?.category})</span>
                            </h3>
                            
                            <div className="space-y-4">
                                {relatedNews.length === 0 ? (
                                    <div className="bg-white p-6 rounded-2xl border border-dashed border-slate-200 text-center">
                                        <p className="text-xs text-slate-400 font-medium">Belum ada berita terkait di kategori ini.</p>
                                    </div>
                                ) : (
                                    relatedNews.map((item) => (
                                        <Link href={`/news/${item.id}`} key={item.id} className="flex gap-4 items-center group bg-white p-3 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md hover:border-blue-200 transition-all">
                                            <div className="flex-1">
                                                <h4 className="font-bold text-sm line-clamp-2 group-hover:text-blue-600 transition-colors leading-snug">{item.title}</h4>
                                                <span className="text-[10px] text-slate-400 uppercase font-black tracking-widest flex items-center gap-1 mt-2">
                                                    <Clock className="w-3 h-3 text-slate-300"/> {timeAgo(item.created_at)}
                                                </span>
                                            </div>
                                            <div className="w-20 h-20 rounded-xl overflow-hidden shrink-0 relative bg-slate-100 border border-slate-100">
                                                {item.image_url ? (
                                                    <img src={item.image_url} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt="Thumbnail" />
                                                ) : (
                                                    <ImageIcon className="w-6 h-6 text-slate-300 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                                                )}
                                            </div>
                                        </Link>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            <footer className="bg-slate-900 text-white pt-16 pb-8 px-4">
                <div className="max-w-5xl mx-auto">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-16">
                        <div className="space-y-6">
                            <a href="/" className="text-3xl font-black italic text-blue-500">SULTRA<span className="text-white">FIKS</span></a>
                            <p className="text-slate-400 text-sm leading-relaxed">Media siber terdepan di Sulawesi Tenggara yang menyajikan informasi cepat, akurat, dan terpercaya.</p>
                            <div className="flex gap-4">
                                <Facebook className="w-5 h-5 text-slate-400 hover:text-blue-500 cursor-pointer" />
                                <Twitter className="w-5 h-5 text-slate-400 hover:text-blue-400 cursor-pointer" />
                                <Youtube className="w-5 h-5 text-slate-400 hover:text-red-500 cursor-pointer" />
                                <Hash className="w-5 h-5 text-slate-400 hover:text-pink-500 cursor-pointer" />
                            </div>
                        </div>
                        <div>
                            <h4 className="font-black text-lg mb-6 border-b border-slate-800 pb-2 uppercase tracking-widest text-blue-500 italic text-center md:text-left">Kategori</h4>
                            <ul className="space-y-4 text-slate-400 text-sm font-bold uppercase text-center md:text-left">
                                <li className="hover:text-blue-500 cursor-pointer transition-colors" onClick={() => router.push('/?category=Politik')}>Politik & Hukum</li>
                                <li className="hover:text-blue-500 cursor-pointer transition-colors" onClick={() => router.push('/?category=Ekonomi')}>Ekonomi Bisnis</li>
                                <li className="hover:text-blue-500 cursor-pointer transition-colors" onClick={() => router.push('/?category=Pendidikan')}>Pendidikan</li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-black text-lg mb-6 border-b border-slate-800 pb-2 uppercase tracking-widest text-blue-500 italic text-center md:text-left">Redaksi</h4>
                            <div className="space-y-4 text-slate-400 text-sm font-medium text-center md:text-left">
                                <p className="flex items-center justify-center md:justify-start gap-3"><Home className="w-4 h-4 text-blue-500"/> Kota Kendari, Sultra</p>
                                <div className="bg-blue-600/10 p-5 rounded-3xl border border-blue-500/20 mt-6 shadow-xl hover:bg-blue-600/20 transition-colors cursor-pointer">
                                    <p className="text-[10px] text-blue-400 font-black mb-1 uppercase tracking-widest">Dikelola Oleh:</p>
                                    <p className="text-white font-black text-base italic uppercase tracking-wider">CV.AVA AMAZONE.IND</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </footer>

            {/* --- BOTTOM NAVIGATION KHUSUS MOBILE --- */}
            <div className="md:hidden fixed bottom-0 left-0 right-0 z-[100] bg-white/90 backdrop-blur-xl border-t border-slate-100 px-6 py-3 pb-6 flex justify-between items-center shadow-[0_-10px_20px_rgba(0,0,0,0.05)]">
                <div className="flex flex-col items-center gap-1 cursor-pointer group" onClick={handleLikeClick}>
                    <Heart className={`w-6 h-6 transition-all ${isLiked ? 'fill-red-500 text-red-500 scale-110' : 'text-slate-400 group-hover:text-red-500'}`} />
                    <span className={`text-[10px] font-bold ${isLiked ? 'text-red-500' : 'text-slate-500'}`}>{isLiked ? 299 : 298}</span>
                </div>
                <div className="flex flex-col items-center gap-1 cursor-pointer group" onClick={handleCommentClick}>
                    <MessageCircle className="w-6 h-6 text-slate-400 group-hover:text-blue-600 transition-colors" />
                    <span className="text-[10px] font-bold text-slate-500 group-hover:text-blue-600">12</span>
                </div>
                <button onClick={() => setIsAIChatOpen(true)} className="w-14 h-14 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-full flex items-center justify-center text-white shadow-lg -mt-10 border-4 border-white active:scale-95 transition-transform">
                    <Bot className="w-7 h-7" />
                </button>
                <div className="flex flex-col items-center gap-1 cursor-pointer group" onClick={() => setFontSize(f => f >= 24 ? 14 : f + 2)}>
                    <div className="w-6 h-6 flex items-center justify-center font-black text-[10px] border-2 border-slate-400 text-slate-400 rounded-sm group-hover:border-blue-600 group-hover:text-blue-600 transition-colors">Aa</div>
                    <span className="text-[10px] font-bold text-slate-500 group-hover:text-blue-600 transition-colors">Font</span>
                </div>
                <div className="flex flex-col items-center gap-1 cursor-pointer group" onClick={() => handleShare('copy')}>
                    <Share2 className="w-6 h-6 text-slate-400 group-hover:text-blue-600 transition-colors" />
                    <span className="text-[10px] font-bold text-slate-500 group-hover:text-blue-600 transition-colors">Share</span>
                </div>
            </div>

            {/* AI CHAT MODAL */}
            <AnimatePresence>
                {isAIChatOpen && (
                    <div className="fixed inset-0 z-[200] flex items-end sm:bottom-24 sm:right-6 pointer-events-none px-4 sm:px-0">
                        <motion.div initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 100, opacity: 0 }} className="bg-white w-full sm:w-[380px] h-[550px] rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200 flex flex-col pointer-events-auto overflow-hidden">
                            <div className="bg-blue-600 p-4 text-white flex justify-between items-center shadow-md">
                                <div className="flex items-center gap-2"><Bot className="w-5 h-5"/><h3 className="font-bold text-xs">Asisten AI SultraFiks</h3></div>
                                <div className="flex items-center gap-3">
                                    <button onClick={handleAISpeakNews} className={`p-2 rounded-full transition-all ${isSpeaking ? 'bg-white text-blue-600 animate-pulse' : 'bg-blue-500 hover:bg-blue-400'}`}>
                                        {isSpeaking ? <VolumeX className="w-4 h-4"/> : <Volume2 className="w-4 h-4"/>}
                                    </button>
                                    <button onClick={() => setIsAIChatOpen(false)}><X className="w-5 h-5"/></button>
                                </div>
                            </div>
                            <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-slate-50">
                                {chatMessages.map((m,i)=>(
                                    <div key={i} className={`p-3 rounded-2xl text-xs shadow-sm ${m.role==='user'?'bg-blue-600 text-white ml-auto rounded-br-none':'bg-white border text-slate-700 rounded-bl-none'}`} style={{maxWidth:'85%'}}>{m.text}</div>
                                ))}
                                {isThinking && <div className="text-[10px] text-slate-400 animate-pulse px-2">AI sedang berpikir...</div>}
                                <div ref={chatEndRef}/>
                            </div>
                            <form onSubmit={handleSendMessage} className="p-3 border-t bg-white flex gap-2">
                                <input value={userInput} onChange={e=>setUserInput(e.target.value)} className="flex-1 bg-slate-100 rounded-full px-4 py-2.5 text-xs outline-none focus:ring-1 focus:ring-blue-600 font-bold" placeholder="Tanyakan berita ini ke AI..."/>
                                <button type="submit" className="bg-blue-600 text-white p-2.5 rounded-full shadow-lg hover:bg-blue-700 transition-all"><Send className="w-4 h-4"/></button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* TOMBOL AI FLOATING DESKTOP */}
            <button onClick={() => setIsAIChatOpen(!isAIChatOpen)} className="hidden md:flex fixed bottom-6 right-6 bg-slate-900 text-white px-6 py-3.5 rounded-full shadow-2xl items-center gap-3 font-black hover:scale-110 active:scale-95 transition-all z-[90] border-2 border-blue-600">
                <Bot className="w-6 h-6 text-blue-400 group-hover:rotate-12 transition-transform"/>TANYA AI
            </button>
        </div>
    );
}