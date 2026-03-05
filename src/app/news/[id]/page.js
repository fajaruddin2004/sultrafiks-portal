/* eslint-disable @next/next/no-img-element */
/* eslint-disable @next/next/no-html-link-for-pages */
"use client";

import React, { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useNews } from '@/context/NewsContext'; 
import { useParams, useRouter } from 'next/navigation';
import { 
    ArrowLeft, Bot, Send, Minus, Plus, Bookmark, Quote, TrendingUp,
    BadgeCheck, Zap, X, Volume2, VolumeX, Heart, MessageCircle, 
    Facebook, Twitter, Youtube, Hash, Home, Clock, Link as LinkIcon, Share2, ImageIcon, Eye, CheckCircle2, User, Sun, Moon, Instagram, BookOpen, ChevronDown
} from 'lucide-react'; 
import Link from 'next/link';
import { motion, AnimatePresence, useScroll, useSpring } from 'framer-motion';

// 🔥 KOMPONEN IKON WHATSAPP ASLI (SVG ORIGINAL) 🔥
const WhatsAppIcon = ({ className }) => (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.446-.272.371-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/>
    </svg>
);

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

const getReadingTime = (text) => {
    if (!text) return 1;
    const wordCount = text.trim().split(/\s+/).length;
    return Math.ceil(wordCount / 200); 
};

// 🔥 PEMBUAT SLUG MURNI UNTUK RELATED NEWS 🔥
const createSlug = (title) => {
    if (!title) return '#';
    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    return `/news/${slug}`;
};

export default function NewsDetail() {
    const params = useParams();
    const router = useRouter();
    const { news } = useNews(); 
    
    const chatEndRef = useRef(null); 
    const commentSectionRef = useRef(null); 

    const [articleId, setArticleId] = useState(null); // Menyimpan ID asli secara rahasia
    const [article, setArticle] = useState(null);
    const [loading, setLoading] = useState(true);
    const [relatedNews, setRelatedNews] = useState([]);

    const [authorData, setAuthorData] = useState({ name: 'Tim Redaksi SultraFiks', avatar: null });
    const [editorData, setEditorData] = useState({ name: 'Admin SultraFiks', avatar: null });
    const [showRedaksi, setShowRedaksi] = useState(false);

    const [fontSize, setFontSize] = useState(15); 
    const [isSaved, setIsSaved] = useState(false);
    const [isDarkMode, setIsDarkMode] = useState(false);

    const [likesCount, setLikesCount] = useState(10); 
    const [isLiked, setIsLiked] = useState(false);
    const [comments, setComments] = useState([]);
    
    const [commentForm, setCommentForm] = useState({ name: '', content: '' });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [toast, setToast] = useState({ show: false, message: '' });
    
    const [isAIChatOpen, setIsAIChatOpen] = useState(false);
    const [isShareModalOpen, setIsShareModalOpen] = useState(false); 
    const [chatMessages, setChatMessages] = useState([{ role: 'ai', text: 'Halo! Saya AI SultraFiks. Ada yang ingin Anda tanyakan tentang berita ini?' }]);
    const [userInput, setUserInput] = useState("");
    
    const { scrollYProgress } = useScroll();
    const scaleX = useSpring(scrollYProgress, { stiffness: 100, damping: 30, restDelta: 0.001 });

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const savedMode = localStorage.getItem('theme');
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            if (savedMode === 'dark' || (!savedMode && prefersDark)) {
                setIsDarkMode(true);
                document.documentElement.classList.add('dark');
            } else {
                setIsDarkMode(false);
                document.documentElement.classList.remove('dark');
            }
        }
    }, []);

    const toggleDarkMode = () => {
        const newMode = !isDarkMode;
        setIsDarkMode(newMode);
        if(newMode) document.documentElement.classList.add('dark');
        else document.documentElement.classList.remove('dark');
        localStorage.setItem('theme', newMode ? 'dark' : 'light');
    };

    // 1. MENCARI ARTIKEL MENGGUNAKAN JUDUL (SLUG) BUKAN ID
    useEffect(() => {
        if (!params.id) return;
        
        // Membaca Judul dari URL (yang tadinya format slug seperti: "kendari-bebas-sampah")
        const slugParam = decodeURIComponent(String(params.id));

        const fetchArticleData = async () => {
            // Tarik seluruh berita untuk dicocokkan judulnya
            const { data: allNews, error } = await supabase.from('news').select('*');

            if (allNews && allNews.length > 0) {
                // Temukan berita yang judul slug-nya cocok dengan URL
                const currentArticle = allNews.find(item => {
                    if(!item.title) return false;
                    const itemSlug = item.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
                    return itemSlug === slugParam;
                });

                if (currentArticle) {
                    const targetId = currentArticle.id;
                    setArticleId(targetId); // Simpan ID asli secara rahasia

                    const viewedKey = `viewed_${targetId}`;
                    const hasViewed = sessionStorage.getItem(viewedKey);
                    
                    let currentViews = currentArticle.views || 0;
                    if (currentViews < 25) { currentViews = 25 + currentViews; }

                    if (!hasViewed) {
                        currentViews += 1;
                        sessionStorage.setItem(viewedKey, 'true'); 
                        supabase.from('news').update({ views: currentViews }).eq('id', targetId).then();
                    }

                    currentArticle.views = currentViews;
                    setArticle(currentArticle);
                    
                    // Related News
                    setRelatedNews(allNews.filter(item => item.category === currentArticle.category && item.id !== targetId).sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 4));

                    const rawAuthor = currentArticle.author || currentArticle.penulis || currentArticle.wartawan;
                    const rawEditor = currentArticle.editor || currentArticle.redaktur;
                    const authId = currentArticle.author_id || currentArticle.user_id; 

                    let authorState = { name: rawAuthor || 'Tim Redaksi SultraFiks', avatar: null };
                    let editorState = { name: rawEditor || 'Admin SultraFiks', avatar: null };

                    if (rawAuthor || authId) {
                        let query = supabase.from('profiles').select('*');
                        if (authId) query = query.eq('id', authId);
                        else query = query.or(`full_name.ilike.%${rawAuthor}%,username.ilike.%${rawAuthor}%`);
                        
                        const { data: profile } = await query.maybeSingle();
                        if (profile) {
                            authorState.name = profile.full_name || profile.username || rawAuthor;
                            authorState.avatar = profile.avatar_url || null;
                        }
                    }

                    if (rawEditor) {
                        const { data: profile } = await supabase.from('profiles').select('*').or(`full_name.ilike.%${rawEditor}%,username.ilike.%${rawEditor}%`).maybeSingle();
                        if (profile) {
                            editorState.name = profile.full_name || profile.username || rawEditor;
                            editorState.avatar = profile.avatar_url || null;
                        }
                    }

                    setAuthorData(authorState);
                    setEditorData(editorState);
                    setLoading(false);
                } else {
                    setLoading(false); // Berita tidak ditemukan
                }
            }
        };

        fetchArticleData();
    }, [params.id]);

    // 2. FETCH LIKES & COMMENTS (Berjalan SETELAH articleId diketahui)
    useEffect(() => {
        if (!articleId) return;

        const fetchInteractions = async () => {
            const { data: newsData } = await supabase.from('news').select('likes_count').eq('id', articleId).single();
            if (newsData) setLikesCount(newsData.likes_count || 10);
            const { data: commentsData } = await supabase.from('comments').select('*').eq('news_id', articleId).order('created_at', { ascending: false });
            if (commentsData) setComments(commentsData);
        };
        fetchInteractions();

        const likedHistory = JSON.parse(localStorage.getItem('liked_articles') || '[]');
        if (likedHistory.includes(articleId)) setIsLiked(true);
        const savedHistory = JSON.parse(localStorage.getItem('saved_articles') || '[]');
        if (savedHistory.includes(articleId)) setIsSaved(true);
    }, [articleId]);

    useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [chatMessages, isAIChatOpen]);

    const showToast = (message) => {
        setToast({ show: true, message });
        setTimeout(() => setToast({ show: false, message: '' }), 3000);
    };

    const handleLikeClick = async () => {
        if (!articleId) return;
        if (isLiked) {
            showToast("Anda sudah menyukai berita ini! ❤️");
            return;
        }

        const newCount = likesCount + 1;
        setLikesCount(newCount);
        setIsLiked(true);
        showToast("Terima kasih atas apresiasinya! ❤️");
        const likedHistory = JSON.parse(localStorage.getItem('liked_articles') || '[]');
        likedHistory.push(articleId);
        localStorage.setItem('liked_articles', JSON.stringify(likedHistory));
        await supabase.from('news').update({ likes_count: newCount }).eq('id', articleId);
    };

    const handleBookmark = () => {
        if (!articleId) return;
        const savedHistory = JSON.parse(localStorage.getItem('saved_articles') || '[]');
        if (isSaved) {
            const newHistory = savedHistory.filter(id => id !== articleId);
            localStorage.setItem('saved_articles', JSON.stringify(newHistory));
            setIsSaved(false);
            showToast("Berita dihapus dari Bookmark! 🗑️");
        } else {
            savedHistory.push(articleId);
            localStorage.setItem('saved_articles', JSON.stringify(savedHistory));
            setIsSaved(true);
            showToast("Berita disimpan ke Bookmark! 🔖");
        }
    };

    const scrollToComments = () => { commentSectionRef.current?.scrollIntoView({ behavior: 'smooth' }); };

    const handlePostComment = async (e) => {
        e.preventDefault();
        if (!articleId) return;
        if (!commentForm.name.trim() || !commentForm.content.trim()) return showToast("Nama dan komentar wajib diisi! ✍️");
        setIsSubmitting(true);

        try {
            const { data, error } = await supabase.from('comments').insert([{ news_id: articleId, user_name: commentForm.name, content: commentForm.content }]).select();
            if (error) throw error;
            if (data) {
                setComments([data[0], ...comments]);
                setCommentForm({ name: '', content: '' });
                showToast("Komentar berhasil dikirim! 💬");
            }
        } catch (error) { showToast("Gagal mengirim komentar. Coba lagi."); } finally { setIsSubmitting(false); }
    };

    // 🔥 LOGIKA SHARE DIPERBARUI AGAR ROBOT WA BISA MEMBACA GAMBAR 🔥
    const handleShare = async (platform) => {
        const currentUrl = window.location.href; 
        // Format Teks WhatsApp yang sangat disukai Robot WA (URL harus ada di baris baru)
        const waText = `*${article?.title}*\n\nBaca selengkapnya di SultraFiks:\n${currentUrl}`;
        
        let url = '';
        
        switch(platform) {
            case 'facebook': 
                url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(currentUrl)}`; 
                break;
            case 'twitter': 
                url = `https://twitter.com/intent/tweet?url=${encodeURIComponent(currentUrl)}&text=${encodeURIComponent(article?.title)}`; 
                break;
            case 'whatsapp': 
                url = `https://api.whatsapp.com/send?text=${encodeURIComponent(waText)}`; 
                break;
            case 'instagram':
                navigator.clipboard.writeText(currentUrl);
                showToast("Tautan disalin! Silakan buka Instagram untuk membagikan. 📸");
                setTimeout(() => { window.open('https://instagram.com', '_blank'); }, 1500);
                return;
            case 'copy': 
                navigator.clipboard.writeText(currentUrl); 
                return showToast("Tautan berita berhasil disalin! 🔗");
            case 'native':
                if (navigator.share) {
                    try {
                        await navigator.share({ title: article?.title, text: `Baca selengkapnya:`, url: currentUrl });
                        return;
                    } catch (err) { return; }
                }
                break;
        }
        if(url) window.open(url, '_blank', 'width=600,height=400');
    };

    const handleSendMessage = async (e) => { 
        e.preventDefault(); 
        if (!userInput.trim() || !article) return; 
        const userMessage = userInput;
        setChatMessages(prev => [...prev, { role: 'user', text: userMessage }]); 
        setUserInput(""); 
        setIsThinking(true); 
        try {
            const response = await fetch('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt: userMessage, articleTitle: article.title, articleContent: article.content }) });
            const data = await response.json();
            setChatMessages(prev => [...prev, { role: 'ai', text: data.text }]);
        } catch (error) { setChatMessages(prev => [...prev, { role: 'ai', text: "Gagal terhubung ke AI." }]); } finally { setIsThinking(false); }
    };

    if (loading) return <div className={`min-h-screen flex items-center justify-center transition-colors ${isDarkMode ? 'bg-[#0B0F19]' : 'bg-white'}`}><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>;
    if (!article) return <div className={`min-h-screen flex items-center justify-center font-bold uppercase tracking-widest transition-colors ${isDarkMode ? 'bg-[#0B0F19] text-slate-500' : 'bg-white text-slate-400'}`}>Memuat Berita SultraFiks...</div>;

    const smartTags = ['Kendari', 'SultraFiks', article.category, 'Berita Terkini'];

    return (
        <div className={`min-h-screen font-sans pb-24 md:pb-0 relative transition-colors duration-300 ${isDarkMode ? 'bg-[#0B0F19] text-white' : 'bg-white text-slate-900'}`}>
            <motion.div className="fixed top-0 left-0 right-0 h-1 md:h-1.5 bg-blue-600 origin-left z-[60]" style={{ scaleX }} />

            <AnimatePresence>
                {toast.show && (
                    <motion.div 
                        initial={{ opacity: 0, y: -50, scale: 0.9 }} 
                        animate={{ opacity: 1, y: 20, scale: 1 }} 
                        exit={{ opacity: 0, y: -20, scale: 0.9 }}
                        className="fixed top-20 left-1/2 -translate-x-1/2 z-[100] bg-slate-900 text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 font-bold text-xs md:text-sm tracking-wide"
                    >
                        <CheckCircle2 className="w-5 h-5 text-green-400" />
                        {toast.message}
                    </motion.div>
                )}
            </AnimatePresence>

            <div className={`sticky top-0 z-50 backdrop-blur-xl border-b px-3 md:px-4 py-2 transition-colors duration-300 ${isDarkMode ? 'bg-[#0B0F19]/90 border-slate-800' : 'bg-white/90 border-slate-200'}`}>
                <div className="max-w-5xl mx-auto flex justify-between items-center">
                    <button onClick={() => router.back()} className={`p-2 md:p-2.5 rounded-full transition-colors ${isDarkMode ? 'bg-slate-800 hover:bg-slate-700 text-slate-300' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'}`}>
                        <ArrowLeft className="w-4 h-4 md:w-5 h-5" />
                    </button>
                    <a href="/" className={`text-base md:text-lg font-black italic tracking-tighter ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>SULTRA<span className="text-blue-600">FIKS</span></a>
                    
                    <div className="flex gap-2 items-center">
                        <div className={`flex items-center gap-0.5 md:gap-1 rounded-full p-1 border shadow-sm ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                            <button onClick={() => setFontSize(f => Math.max(12, f - 2))} className={`p-1 md:p-1.5 transition-colors rounded-full ${isDarkMode ? 'text-slate-400 hover:text-blue-400 hover:bg-slate-700' : 'text-slate-500 hover:text-blue-600 hover:bg-slate-200'}`}><Minus className="w-3.5 h-3.5 md:w-4 md:h-4"/></button>
                            <span className={`text-[9px] md:text-[11px] font-black px-0.5 md:px-1 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>Aa</span>
                            <button onClick={() => setFontSize(f => Math.min(28, f + 2))} className={`p-1 md:p-1.5 transition-colors rounded-full ${isDarkMode ? 'text-slate-400 hover:text-blue-400 hover:bg-slate-700' : 'text-slate-500 hover:text-blue-600 hover:bg-slate-200'}`}><Plus className="w-3.5 h-3.5 md:w-4 md:h-4"/></button>
                            
                            <div className={`w-px h-4 mx-0.5 md:mx-1 ${isDarkMode ? 'bg-slate-700' : 'bg-slate-300'}`}></div>
                            
                            <button onClick={toggleDarkMode} className={`p-1 md:p-1.5 rounded-full transition-all ${isDarkMode ? 'text-yellow-400 hover:bg-slate-700' : 'text-slate-600 hover:bg-slate-200'}`}>
                                {isDarkMode ? <Sun className="w-3.5 h-3.5 md:w-4 md:h-4 fill-current" /> : <Moon className="w-3.5 h-3.5 md:w-4 md:h-4 fill-current" />}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <main className="max-w-5xl mx-auto px-4 py-6 md:py-8 pb-10">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-12">
                    <div className="lg:col-span-8">
                        {/* KATEGORI & JUDUL */}
                        <div className={`flex items-center gap-2 text-[10px] md:text-xs font-bold text-blue-600 mb-3 md:mb-4 uppercase tracking-wider`}>
                            <span className={`px-2 py-1 rounded ${isDarkMode ? 'bg-blue-900/40 text-blue-400' : 'bg-blue-50'}`}>News</span> / <span>{article?.category || 'Utama'}</span>
                        </div>
                        <h1 className={`text-xl md:text-3xl lg:text-4xl font-black leading-tight md:leading-snug mb-4 md:mb-5 tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{article?.title}</h1>
                        
                        {/* INFO MEDIA & WAKTU */}
                        <div className={`flex items-center justify-between border-b pb-3 md:pb-4 mb-3 md:mb-4 ${isDarkMode ? 'border-slate-800' : 'border-slate-100'}`}>
                            <div className="flex items-center gap-3 md:gap-4">
                                <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shrink-0">
                                    <Zap className="w-5 h-5 md:w-6 md:h-6 fill-white text-white stroke-white" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-1.5">
                                        <p className={`text-sm md:text-base font-black ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>SultraFiks</p>
                                        <BadgeCheck className="w-4 h-4 md:w-5 md:h-5 text-blue-600 fill-white" />
                                    </div>
                                    <p className={`text-[9px] md:text-[10px] font-bold uppercase tracking-wider ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                                        FIXSEKALINYAMI
                                    </p>
                                    <p className={`text-[9px] md:text-[11px] font-bold flex items-center flex-wrap gap-1 mt-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                                        <Clock className="w-3 h-3 text-blue-500"/>
                                        {timeAgo(article?.created_at)}
                                        <span className="mx-0.5 md:mx-1">•</span>
                                        <Eye className="w-3 h-3 text-blue-500"/>
                                        <span>{article?.views || 25} Dilihat</span>
                                        
                                        <span className="mx-0.5 md:mx-1 inline">•</span>
                                        <BookOpen className="w-3 h-3 text-blue-500 inline"/>
                                        <span className="inline">{getReadingTime(article?.content)} Menit Baca</span>
                                    </p>
                                </div>
                            </div>

                            <div className="hidden md:flex items-center gap-1 group relative">
                                <motion.button
                                    whileTap={{ scale: 0.8, rotate: isSaved ? -15 : 15 }}
                                    onClick={handleBookmark}
                                    className={`p-2.5 md:p-3 rounded-full border-2 transition-all ${isSaved ? 'bg-yellow-50 border-yellow-400 shadow-sm' : (isDarkMode ? 'border-slate-700 bg-slate-800 hover:border-blue-500' : 'border-slate-100 hover:border-blue-200 hover:bg-blue-50')}`}
                                >
                                    <Bookmark className={`w-5 h-5 md:w-6 md:h-6 transition-colors ${isSaved ? 'fill-yellow-500 text-yellow-500' : (isDarkMode ? 'text-slate-400 group-hover:text-blue-400' : 'text-slate-400 group-hover:text-blue-500')}`}/>
                                </motion.button>
                            </div>
                        </div>

                        {/* GAMBAR UTAMA */}
                        <div className={`mb-2 md:mb-3 rounded-2xl md:rounded-3xl overflow-hidden shadow-lg md:shadow-2xl relative w-full aspect-[4/3] md:aspect-video bg-slate-100`}>
                            {article?.image_url ? (
                                <div className="relative group overflow-hidden w-full h-full">
                                    <img src={article.image_url} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" alt={article?.title} />
                                    
                                    {(!article?.photo_source || article.photo_source.trim() === '') && (
                                        <div className="absolute bottom-3 right-3 md:bottom-4 md:right-4 flex items-center gap-1 md:gap-1.5 pointer-events-none opacity-60 drop-shadow-lg z-10">
                                            <div className="bg-gradient-to-tr from-blue-600 to-blue-400 p-0.5 md:p-1 rounded text-white shadow-sm shrink-0">
                                                <Zap className="w-2.5 h-2.5 md:w-3 md:h-3 fill-white text-white" />
                                            </div>
                                            <span className="text-white text-xs md:text-base font-black italic tracking-tighter shrink-0" style={{ textShadow: '1px 1px 3px rgba(0,0,0,0.8)' }}>
                                                SULTRA<span className="text-blue-400">FIKS</span>
                                            </span>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className={`absolute inset-0 flex flex-col items-center justify-center ${isDarkMode ? 'text-slate-600' : 'text-slate-300'}`}>
                                    <ImageIcon size={48} className="mb-2" />
                                    <span className="text-sm font-bold">Tanpa Foto</span>
                                </div>
                            )}
                        </div>
                        
                        {/* CAPTION FOTO & SUMBER */}
                        <div className={`flex flex-col md:flex-row md:justify-between text-[10px] md:text-xs mb-6 md:mb-8 px-1 md:px-2 italic leading-tight md:leading-relaxed gap-0.5 md:gap-4 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                            <p className="text-left order-2 md:order-1">
                                {article?.photo_caption || "Ilustrasi berita."}
                            </p>
                            {article?.photo_source && article.photo_source.trim() !== '' && (
                                <p className="font-bold uppercase tracking-widest text-left md:text-right order-1 md:order-2">
                                    Sumber: {article.photo_source}
                                </p>
                            )}
                        </div>

                        {/* ISI BERITA */}
                        <article className={`prose max-w-none mb-8 md:mb-10 transition-colors ${isDarkMode ? 'prose-invert text-slate-300' : 'text-slate-800'}`} style={{ fontSize: `${fontSize}px`, lineHeight: '1.8' }}>
                            {article?.content?.split('\n').map((p, i) => {
                                if (!p.trim()) return null;
                                if (p.trim().startsWith('>')) {
                                    return (
                                        <div key={i} className={`my-6 pl-4 md:pl-5 border-l-[3px] border-blue-600 relative py-3 rounded-r-xl ${isDarkMode ? 'bg-slate-800/50' : 'bg-blue-50/30'}`}>
                                            <Quote className={`absolute top-2 right-2 w-5 h-5 md:w-6 md:h-6 rotate-180 ${isDarkMode ? 'text-slate-700' : 'text-blue-100'}`}/>
                                            <p className={`italic font-semibold leading-relaxed relative z-10 ${isDarkMode ? 'text-slate-200' : 'text-slate-700'}`}>
                                                <span className="text-blue-600 mr-1 leading-none align-bottom" style={{ fontSize: `${fontSize * 1.5}px` }}>“</span>
                                                {p.trim().substring(1).trim()}
                                                <span className="text-blue-600 ml-1 leading-none align-bottom" style={{ fontSize: `${fontSize * 1.5}px` }}>”</span>
                                            </p>
                                        </div>
                                    );
                                }
                                return <p key={i} className="mb-4 md:mb-6 leading-relaxed text-justify">{p}</p>;
                            })}
                        </article>

                        {/* PROFIL WARTAWAN */}
                        <div className={`mt-8 mb-8 pt-6 border-t ${isDarkMode ? 'border-slate-800' : 'border-slate-100'}`}>
                            <button 
                                onClick={() => setShowRedaksi(!showRedaksi)}
                                className={`flex items-center gap-2 text-xs md:text-sm font-black uppercase tracking-widest transition-colors ${isDarkMode ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-blue-600'}`}
                            >
                                Tim Redaksi
                                <motion.div animate={{ rotate: showRedaksi ? 180 : 0 }}>
                                    <ChevronDown className="w-4 h-4 md:w-5 md:h-5" />
                                </motion.div>
                            </button>

                            <AnimatePresence>
                                {showRedaksi && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: "auto", opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        className="overflow-hidden"
                                    >
                                        <div className={`mt-3 p-3 md:p-4 rounded-xl border flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center shadow-sm ${isDarkMode ? 'bg-slate-800/40 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                                            <Link href={`/author/${encodeURIComponent(authorData.name)}`} className="flex items-center gap-2.5 md:gap-3 group cursor-pointer w-full sm:w-auto">
                                                <div className={`w-9 h-9 md:w-10 md:h-10 rounded-full flex items-center justify-center shrink-0 border-2 overflow-hidden border-blue-500/30 bg-slate-100 ${isDarkMode ? 'bg-slate-700' : 'bg-white'}`}>
                                                    {authorData.avatar ? (
                                                        <img src={authorData.avatar} alt={authorData.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
                                                    ) : (
                                                        <User className={`w-5 h-5 ${isDarkMode ? 'text-slate-400' : 'text-slate-400'}`} />
                                                    )}
                                                </div>
                                                <div>
                                                    <p className={`text-[8px] md:text-[9px] font-black uppercase tracking-widest mb-0.5 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>Wartawan</p>
                                                    <p className={`text-xs md:text-sm font-black capitalize group-hover:text-blue-500 transition-colors ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                                                        {authorData.name}
                                                    </p>
                                                </div>
                                            </Link>
                                            
                                            <div className={`hidden sm:block w-px h-8 ${isDarkMode ? 'bg-slate-700' : 'bg-slate-200'}`}></div>
                                            
                                            <Link href={`/author/${encodeURIComponent(editorData.name)}`} className="flex items-center gap-2.5 md:gap-3 group cursor-pointer w-full sm:w-auto">
                                                <div className={`w-9 h-9 md:w-10 md:h-10 rounded-full flex items-center justify-center shrink-0 border-2 overflow-hidden border-red-500/30 bg-slate-100 ${isDarkMode ? 'bg-slate-700' : 'bg-white'}`}>
                                                    {editorData.avatar ? (
                                                        <img src={editorData.avatar} alt={editorData.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
                                                    ) : (
                                                        <div className="w-full h-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                                                            <Zap className="w-4 h-4 md:w-5 md:h-5 fill-white text-white" />
                                                        </div>
                                                    )}
                                                </div>
                                                <div>
                                                    <p className={`text-[8px] md:text-[9px] font-black uppercase tracking-widest mb-0.5 ${isDarkMode ? 'text-red-400' : 'text-red-500'}`}>Editor / Redaktur</p>
                                                    <p className={`text-xs md:text-sm font-black capitalize group-hover:text-red-500 transition-colors ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                                                        {editorData.name}
                                                    </p>
                                                </div>
                                            </Link>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* BAGIAN BAWAH (TAGS & ENGAGEMENT) */}
                        <div className={`pt-6 md:pt-8 border-t ${isDarkMode ? 'border-slate-800' : 'border-slate-100'}`}>
                            
                            {/* TAGS */}
                            <div className="flex flex-wrap gap-2 mb-6 md:mb-8">
                                {smartTags.map((tag) => (
                                    <button 
                                        key={tag} 
                                        onClick={() => router.push(`/?search=${tag}`)}
                                        className={`px-3 py-1 md:px-4 md:py-1.5 border rounded-lg text-[10px] md:text-xs font-bold transition-all shadow-sm ${isDarkMode ? 'bg-slate-800 border-slate-700 text-blue-400 hover:bg-blue-600 hover:text-white' : 'bg-white border-blue-200 text-blue-600 hover:bg-blue-600 hover:text-white'}`}
                                    >
                                        #{tag}
                                    </button>
                                ))}
                            </div>

                            {/* TOMBOL LIKE & SHARE DESKTOP */}
                            <div className={`hidden md:flex flex-col sm:flex-row justify-between items-center gap-5 py-5 md:py-6 border-y mb-8 md:mb-10 ${isDarkMode ? 'border-slate-800' : 'border-slate-100'}`}>
                                <div className="flex items-center gap-6">
                                    <motion.button whileTap={{ scale: 0.8 }} onClick={handleLikeClick} className="flex items-center gap-2 group cursor-pointer">
                                        <Heart className={`w-7 h-7 md:w-8 md:h-8 transition-all ${isLiked ? 'fill-red-500 text-red-500 scale-110 drop-shadow-md' : 'text-slate-400 group-hover:text-red-500'}`} />
                                        <span className={`font-black text-base md:text-lg transition-colors ${isLiked ? 'text-red-500' : 'text-slate-500'}`}>{likesCount}</span>
                                    </motion.button>
                                    <motion.button whileTap={{ scale: 0.9 }} onClick={scrollToComments} className={`flex items-center gap-2 transition-colors group cursor-pointer ${isDarkMode ? 'text-slate-400 hover:text-blue-400' : 'text-slate-400 hover:text-blue-600'}`}>
                                        <MessageCircle className="w-7 h-7 md:w-8 md:h-8 group-hover:fill-blue-500/50" />
                                        <span className="font-black text-base md:text-lg group-hover:text-blue-500">{comments.length}</span>
                                    </motion.button>
                                </div>
                                <div className="flex items-center gap-2 md:gap-3">
                                    <span className={`text-[10px] md:text-xs font-black uppercase tracking-widest mr-1 md:mr-2 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>Bagikan:</span>
                                    <button onClick={() => handleShare('facebook')} className={`p-2.5 md:p-3 rounded-full transition-all hover:shadow-lg hover:bg-[#1877F2] hover:text-white ${isDarkMode ? 'bg-slate-800 text-slate-400 hover:shadow-[#1877F2]/30' : 'bg-slate-100 text-slate-600 hover:shadow-[#1877F2]/30'}`}><Facebook className="w-4 h-4 md:w-5 md:h-5" /></button>
                                    <button onClick={() => handleShare('whatsapp')} className={`p-2.5 md:p-3 rounded-full transition-all hover:shadow-lg hover:bg-[#25D366] hover:text-white ${isDarkMode ? 'bg-slate-800 text-slate-400 hover:shadow-[#25D366]/30' : 'bg-slate-100 text-slate-600 hover:shadow-[#25D366]/30'}`}><WhatsAppIcon className="w-4 h-4 md:w-5 md:h-5" /></button>
                                    <button onClick={() => handleShare('copy')} className={`p-2.5 md:p-3 rounded-full transition-all hover:shadow-lg hover:text-white ${isDarkMode ? 'bg-slate-800 text-slate-400 hover:bg-slate-600' : 'bg-slate-100 text-slate-600 hover:bg-slate-800'}`}><LinkIcon className="w-4 h-4 md:w-5 md:h-5" /></button>
                                </div>
                            </div>

                            {/* --- SEKSI KOMENTAR --- */}
                            <div ref={commentSectionRef} className={`rounded-[1.5rem] md:rounded-[2rem] p-5 md:p-8 border ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-100'}`}>
                                <h3 className={`text-lg md:text-xl font-black mb-5 md:mb-6 flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>
                                    <MessageCircle className="text-blue-500 w-5 h-5 md:w-6 md:h-6"/> Diskusi Pembaca <span className="text-slate-500 text-xs md:text-sm font-bold">({comments.length})</span>
                                </h3>

                                <form onSubmit={handlePostComment} className={`p-4 md:p-6 rounded-xl md:rounded-2xl shadow-sm border mb-6 md:mb-8 ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
                                    <div className="space-y-4">
                                        <div>
                                            <label className={`text-[10px] md:text-xs font-bold uppercase tracking-wider mb-1.5 block ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Nama Anda</label>
                                            <input 
                                                type="text" 
                                                value={commentForm.name}
                                                onChange={(e) => setCommentForm({...commentForm, name: e.target.value})}
                                                placeholder="Tulis nama panggilan..."
                                                className={`w-full border rounded-lg md:rounded-xl px-3 py-2.5 md:px-4 md:py-3 text-xs md:text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500 ${isDarkMode ? 'bg-slate-900 border-slate-700 text-white placeholder:text-slate-600' : 'bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400'}`}
                                            />
                                        </div>
                                        <div>
                                            <label className={`text-[10px] md:text-xs font-bold uppercase tracking-wider mb-1.5 block ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Komentar</label>
                                            <textarea 
                                                value={commentForm.content}
                                                onChange={(e) => setCommentForm({...commentForm, content: e.target.value})}
                                                placeholder="Bagaimana pendapat Anda tentang berita ini?"
                                                className={`w-full border rounded-lg md:rounded-xl px-3 py-2.5 md:px-4 md:py-3 text-xs md:text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500 resize-none h-20 md:h-24 ${isDarkMode ? 'bg-slate-900 border-slate-700 text-white placeholder:text-slate-600' : 'bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400'}`}
                                            ></textarea>
                                        </div>
                                        <button 
                                            type="submit" 
                                            disabled={isSubmitting}
                                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-2.5 md:py-3 rounded-lg md:rounded-xl uppercase tracking-widest text-[10px] md:text-xs transition-all shadow-lg shadow-blue-500/20 active:scale-95 disabled:opacity-50"
                                        >
                                            {isSubmitting ? 'Mengirim...' : 'Kirim Komentar'}
                                        </button>
                                    </div>
                                </form>

                                <div className="space-y-3 md:space-y-4">
                                    {comments.length === 0 ? (
                                        <p className={`text-center text-xs md:text-sm font-medium py-4 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>Belum ada komentar. Jadilah yang pertama!</p>
                                    ) : (
                                        comments.map((comment) => (
                                            <div key={comment.id} className={`p-3 md:p-4 rounded-xl md:rounded-2xl border shadow-sm flex gap-3 md:gap-4 ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'}`}>
                                                <div className={`w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center shrink-0 ${isDarkMode ? 'bg-slate-700' : 'bg-slate-100'}`}>
                                                    <User className={`w-4 h-4 md:w-5 md:h-5 ${isDarkMode ? 'text-slate-400' : 'text-slate-400'}`}/>
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <h4 className={`font-bold text-xs md:text-sm ${isDarkMode ? 'text-slate-200' : 'text-slate-900'}`}>{comment.user_name}</h4>
                                                        <span className={`text-[9px] md:text-[10px] font-bold ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>• {timeAgo(comment.created_at)}</span>
                                                    </div>
                                                    <p className={`text-xs md:text-sm leading-relaxed ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>{comment.content}</p>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* SIDEBAR KANAN */}
                    <div className="lg:col-span-4 space-y-6 md:space-y-8">
                        <div className={`p-5 md:p-6 rounded-2xl md:rounded-3xl border sticky top-20 ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-100'}`}>
                            <h3 className={`font-black text-base md:text-lg mb-4 md:mb-5 flex items-center gap-2 uppercase tracking-tighter italic ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                                <TrendingUp className="w-4 h-4 md:w-5 md:h-5 text-red-500"/> Terkait <span className="text-blue-500 text-[10px] md:text-sm">({article?.category})</span>
                            </h3>
                            
                            <div className="space-y-3 md:space-y-4">
                                {relatedNews.length === 0 ? (
                                    <div className={`p-5 md:p-6 rounded-xl md:rounded-2xl border border-dashed text-center ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
                                        <p className={`text-[10px] md:text-xs font-medium ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>Belum ada berita terkait di kategori ini.</p>
                                    </div>
                                ) : (
                                    relatedNews.map((item) => (
                                        <Link href={createSlug(item.title)} key={item.id} className={`flex gap-3 md:gap-4 items-center group p-2.5 md:p-3 rounded-xl md:rounded-2xl shadow-sm border transition-all ${isDarkMode ? 'bg-slate-800 border-slate-700 hover:border-blue-500' : 'bg-white border-slate-100 hover:border-blue-200 hover:shadow-md'}`}>
                                            <div className="flex-1">
                                                <h4 className={`font-bold text-xs md:text-sm line-clamp-2 transition-colors leading-snug ${isDarkMode ? 'text-slate-200 group-hover:text-blue-400' : 'text-slate-800 group-hover:text-blue-600'}`}>{item.title}</h4>
                                                <span className={`text-[9px] md:text-[10px] uppercase font-black tracking-widest flex items-center gap-1 mt-1.5 md:mt-2 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                                                    <Clock className="w-2.5 h-2.5 md:w-3 md:h-3"/> {timeAgo(item.created_at)}
                                                </span>
                                            </div>
                                            <div className={`w-16 h-16 md:w-20 md:h-20 rounded-lg md:rounded-xl overflow-hidden shrink-0 relative border ${isDarkMode ? 'bg-slate-900 border-slate-700' : 'bg-slate-100 border-slate-100'}`}>
                                                {item.image_url ? (
                                                    <img src={item.image_url} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt="Thumbnail" />
                                                ) : (
                                                    <ImageIcon className={`w-5 h-5 md:w-6 md:h-6 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 ${isDarkMode ? 'text-slate-600' : 'text-slate-300'}`} />
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

            {/* FOOTER */}
            <footer className="bg-[#0f172a] text-white pt-10 md:pt-16 pb-6 px-4">
                <div className="max-w-5xl mx-auto text-center md:text-left">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12 mb-10 md:mb-16">
                        <div className="space-y-4 md:space-y-6">
                            <a href="/" className="text-2xl md:text-3xl font-black italic text-blue-500">SULTRA<span className="text-white">FIKS</span></a>
                            <p className="text-slate-400 text-xs md:text-sm leading-relaxed max-w-xs mx-auto md:mx-0">Media siber terdepan di Sulawesi Tenggara yang menyajikan informasi cepat, akurat, dan terpercaya.</p>
                            <div className="flex justify-center md:justify-start gap-4">
                                <Facebook className="w-4 h-4 md:w-5 md:h-5 text-slate-400 hover:text-blue-500 cursor-pointer" />
                                <Twitter className="w-4 h-4 md:w-5 md:h-5 text-slate-400 hover:text-blue-400 cursor-pointer" />
                                <Youtube className="w-4 h-4 md:w-5 md:h-5 text-slate-400 hover:text-red-500 cursor-pointer" />
                            </div>
                        </div>
                        <div>
                            <h4 className="font-black text-base md:text-lg mb-4 md:mb-6 border-b border-slate-800 pb-2 uppercase tracking-widest text-blue-500 italic">Kategori</h4>
                            <ul className="space-y-3 md:space-y-4 text-slate-400 text-xs md:text-sm font-bold uppercase">
                                <li className="hover:text-blue-400 cursor-pointer transition-colors" onClick={() => router.push('/?category=Politik')}>Politik & Hukum</li>
                                <li className="hover:text-blue-400 cursor-pointer transition-colors" onClick={() => router.push('/?category=Ekonomi')}>Ekonomi Bisnis</li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-black text-base md:text-lg mb-4 md:mb-6 border-b border-slate-800 pb-2 uppercase tracking-widest text-blue-500 italic">Redaksi</h4>
                            <div className="space-y-3 md:space-y-4 text-slate-400 text-xs md:text-sm font-medium flex flex-col items-center md:items-start">
                                <p className="flex items-center gap-2 md:gap-3"><Home className="w-3.5 h-3.5 md:w-4 md:h-4 text-blue-500"/> Kendari, Sultra</p>
                                <div className="bg-blue-600/10 p-4 md:p-5 rounded-2xl md:rounded-3xl border border-blue-500/20 mt-4 shadow-xl hover:bg-blue-600/20 transition-colors cursor-pointer">
                                    <p className="text-[9px] md:text-[10px] text-blue-400 font-black mb-1 uppercase tracking-widest">Dikelola Oleh:</p>
                                    <p className="text-white font-black text-sm md:text-base italic uppercase tracking-wider">CV.AVA AMAZONE.IND</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </footer>

            {/* 🔥 BOTTOM NAVIGATION KHUSUS MOBILE 🔥 */}
            <div className={`md:hidden fixed bottom-0 left-0 right-0 z-[90] backdrop-blur-xl border-t px-6 py-3 pb-6 flex justify-between items-center shadow-[0_-10px_20px_rgba(0,0,0,0.05)] transition-colors duration-300 ${isDarkMode ? 'bg-[#0B0F19]/90 border-slate-800' : 'bg-white/90 border-slate-100'}`}>
                <div className="flex flex-col items-center gap-1 cursor-pointer group" onClick={handleLikeClick}>
                    <Heart className={`w-5 h-5 transition-all ${isLiked ? 'fill-red-500 text-red-500 scale-110' : 'text-slate-400 group-hover:text-red-500'}`} />
                    <span className={`text-[10px] font-bold ${isLiked ? 'text-red-500' : 'text-slate-500'}`}>{likesCount}</span>
                </div>
                <div className="flex flex-col items-center gap-1 cursor-pointer group" onClick={scrollToComments}>
                    <MessageCircle className="w-5 h-5 text-slate-400 group-hover:text-blue-500 transition-colors" />
                    <span className="text-[10px] font-bold text-slate-500 group-hover:text-blue-500">{comments.length}</span>
                </div>
                
                {/* TOMBOL AI DI TENGAH */}
                <button onClick={() => setIsAIChatOpen(true)} className={`w-14 h-14 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-full flex items-center justify-center text-white shadow-lg -mt-10 border-4 active:scale-95 transition-transform ${isDarkMode ? 'border-[#0B0F19]' : 'border-white'}`}>
                    <Bot className="w-6 h-6" />
                </button>
                
                {/* TOMBOL BOOKMARK */}
                <div className="flex flex-col items-center gap-1 cursor-pointer group" onClick={handleBookmark}>
                    <Bookmark className={`w-5 h-5 transition-colors ${isSaved ? 'fill-yellow-500 text-yellow-500' : 'text-slate-400 group-hover:text-blue-500'}`} />
                    <span className={`text-[10px] font-bold transition-colors ${isSaved ? 'text-yellow-500' : 'text-slate-500 group-hover:text-blue-500'}`}>Simpan</span>
                </div>

                {/* TOMBOL MUNCULKAN POP-UP SHARE */}
                <div className="flex flex-col items-center gap-1 cursor-pointer group" onClick={() => setIsShareModalOpen(true)}>
                    <Share2 className="w-5 h-5 text-slate-400 group-hover:text-blue-500 transition-colors" />
                    <span className="text-[10px] font-bold text-slate-500 group-hover:text-blue-500 transition-colors">Share</span>
                </div>
            </div>

            {/* 🔥 MODAL POP-UP SHARE KHUSUS MOBILE (BOTTOM SHEET) 🔥 */}
            <AnimatePresence>
                {isShareModalOpen && (
                    <>
                        <motion.div 
                            initial={{ opacity: 0 }} 
                            animate={{ opacity: 1 }} 
                            exit={{ opacity: 0 }} 
                            onClick={() => setIsShareModalOpen(false)} 
                            className="fixed inset-0 bg-black/60 z-[110] backdrop-blur-sm md:hidden"
                        />
                        <motion.div 
                            initial={{ y: "100%" }} 
                            animate={{ y: 0 }} 
                            exit={{ y: "100%" }} 
                            transition={{ type: "spring", damping: 25, stiffness: 200 }} 
                            className={`fixed bottom-0 left-0 right-0 z-[120] md:hidden rounded-t-[2rem] p-6 pb-12 shadow-[0_-20px_40px_rgba(0,0,0,0.2)] border-t transition-colors duration-300 ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}
                        >
                            <div className={`w-12 h-1.5 rounded-full mx-auto mb-6 ${isDarkMode ? 'bg-slate-700' : 'bg-slate-200'}`}></div>
                            <h3 className={`text-center font-black text-lg mb-8 uppercase tracking-widest ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Bagikan Berita</h3>
                            
                            <div className="grid grid-cols-4 gap-4">
                                <div className="flex flex-col items-center gap-3 cursor-pointer group" onClick={() => { handleShare('whatsapp'); setIsShareModalOpen(false); }}>
                                    <div className="w-14 h-14 bg-gradient-to-tr from-[#25D366] to-[#128C7E] text-white rounded-full flex items-center justify-center shadow-lg shadow-[#25D366]/30 active:scale-95 transition-transform">
                                        <WhatsAppIcon className="w-7 h-7" />
                                    </div>
                                    <span className={`text-[10px] font-bold ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>WhatsApp</span>
                                </div>
                                <div className="flex flex-col items-center gap-3 cursor-pointer group" onClick={() => { handleShare('facebook'); setIsShareModalOpen(false); }}>
                                    <div className="w-14 h-14 bg-gradient-to-tr from-[#1877F2] to-[#0A57C2] text-white rounded-full flex items-center justify-center shadow-lg shadow-[#1877F2]/30 active:scale-95 transition-transform">
                                        <Facebook className="w-7 h-7 fill-white" />
                                    </div>
                                    <span className={`text-[10px] font-bold ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>Facebook</span>
                                </div>
                                <div className="flex flex-col items-center gap-3 cursor-pointer group" onClick={() => { handleShare('instagram'); setIsShareModalOpen(false); }}>
                                    <div className="w-14 h-14 bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888] text-white rounded-full flex items-center justify-center shadow-lg shadow-pink-500/30 active:scale-95 transition-transform">
                                        <Instagram className="w-7 h-7" />
                                    </div>
                                    <span className={`text-[10px] font-bold ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>Instagram</span>
                                </div>
                                <div className="flex flex-col items-center gap-3 cursor-pointer group" onClick={() => { handleShare('copy'); setIsShareModalOpen(false); }}>
                                    <div className={`w-14 h-14 rounded-full flex items-center justify-center shadow-lg active:scale-95 transition-transform border ${isDarkMode ? 'bg-slate-800 text-slate-300 border-slate-700 shadow-slate-900' : 'bg-slate-50 text-slate-600 border-slate-200 shadow-slate-200'}`}>
                                        <LinkIcon className="w-6 h-6" />
                                    </div>
                                    <span className={`text-[10px] font-bold ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>Salin Link</span>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {isAIChatOpen && (
                    <div className="fixed inset-0 z-[200] flex items-end sm:bottom-24 sm:right-6 pointer-events-none px-3 sm:px-0">
                        <motion.div initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 100, opacity: 0 }} className={`w-full sm:w-[380px] h-[85vh] sm:h-[550px] rounded-t-3xl sm:rounded-3xl shadow-2xl border flex flex-col pointer-events-auto overflow-hidden ${isDarkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'}`}>
                            <div className="bg-blue-600 p-3 md:p-4 text-white flex justify-between items-center shadow-md shrink-0">
                                <div className="flex items-center gap-2"><Bot className="w-4 h-4 md:w-5 md:h-5"/><h3 className="font-bold text-xs">Asisten AI SultraFiks</h3></div>
                                <div className="flex items-center gap-3">
                                    <button onClick={handleAISpeakNews} className={`p-1.5 md:p-2 rounded-full transition-all ${isSpeaking ? 'bg-white text-blue-600 animate-pulse' : 'bg-blue-500 hover:bg-blue-400'}`}>
                                        {isSpeaking ? <VolumeX className="w-3 h-3 md:w-4 md:h-4"/> : <Volume2 className="w-3 h-3 md:w-4 md:h-4"/>}
                                    </button>
                                    <button onClick={() => setIsAIChatOpen(false)}><X className="w-4 h-4 md:w-5 md:h-5"/></button>
                                </div>
                            </div>
                            <div className={`flex-1 p-4 overflow-y-auto space-y-4 ${isDarkMode ? 'bg-[#0B0F19]' : 'bg-slate-50'}`}>
                                {chatMessages.map((m,i)=>(
                                    <div key={i} className={`p-3 rounded-2xl text-[11px] md:text-xs shadow-sm ${m.role==='user'?'bg-blue-600 text-white ml-auto rounded-br-none':(isDarkMode ? 'bg-slate-800 text-slate-200 border-slate-700 border rounded-bl-none' : 'bg-white border border-slate-200 text-slate-700 rounded-bl-none')}`} style={{maxWidth:'85%'}}>{m.text}</div>
                                ))}
                                {isThinking && <div className="text-[10px] text-slate-400 animate-pulse px-2">AI sedang berpikir...</div>}
                                <div ref={chatEndRef}/>
                            </div>
                            <form onSubmit={handleSendMessage} className={`p-3 border-t flex gap-2 shrink-0 pb-6 md:pb-3 ${isDarkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'}`}>
                                <input value={userInput} onChange={e=>setUserInput(e.target.value)} className={`flex-1 rounded-full px-4 py-2.5 text-[11px] md:text-xs outline-none focus:ring-1 focus:ring-blue-600 font-bold ${isDarkMode ? 'bg-slate-800 text-white placeholder:text-slate-500' : 'bg-slate-100 text-slate-900 placeholder:text-slate-400'}`} placeholder="Tanyakan berita ini ke AI..."/>
                                <button type="submit" className="bg-blue-600 text-white p-2.5 md:p-3 rounded-full shadow-lg hover:bg-blue-700 transition-all"><Send className="w-3 h-3 md:w-4 md:h-4"/></button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <button onClick={() => setIsAIChatOpen(!isAIChatOpen)} className="hidden md:flex fixed bottom-6 right-6 bg-slate-900 text-white px-6 py-3.5 rounded-full shadow-2xl items-center gap-3 font-black hover:scale-110 active:scale-95 transition-all z-[90] border-2 border-blue-600">
                <Bot className="w-6 h-6 text-blue-400 group-hover:rotate-12 transition-transform"/>TANYA AI
            </button>
        </div>
    );
}