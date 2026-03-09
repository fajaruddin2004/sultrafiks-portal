"use client";

import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase"; 
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { 
  LogOut, CheckCircle, XCircle, Clock, FileText, Send, Edit3, 
  AlertTriangle, User, X, MessageSquareWarning, ImageIcon, 
  Info, Star, EyeOff, PenBox, UserCircle, UploadCloud, Quote, Type, Save,
  Settings, Zap, Search, ExternalLink, Bold, Italic
} from "lucide-react";
import Image from "next/image";
import { motion, AnimatePresence } from 'framer-motion';

export default function RedakturPage() {
  const { user, profile, loading: authLoading } = useAuth();
  const router = useRouter();

  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  
  const [activeTab, setActiveTab] = useState("antrean");
  const [searchQuery, setSearchQuery] = useState(""); 

  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [reviewNote, setReviewNote] = useState("");
  const [editForm, setEditForm] = useState({
    id: null, title: "", content: "", category: "Kilas Daerah", 
    photo_source: "", photo_caption: "", image_url: null, author: null, is_headline: false
  });

  const createContentRef = useRef(null);
  const [createForm, setCreateForm] = useState({
    title: "", content: "", category: "Kilas Daerah", photo_source: "", photo_caption: "", is_headline: false
  });
  const [createImageFile, setCreateImageFile] = useState(null);
  const [createPreview, setCreatePreview] = useState(null);

  const [profileForm, setProfileForm] = useState({ full_name: "", avatar_url: "" });
  const [profileImageFile, setProfileImageFile] = useState(null);
  const [profilePreview, setProfilePreview] = useState(null);

  const categories = [
    'Kilas Daerah', 'Birokrasi', 'Parlemen', 'Delik', 'Arena', 
    'Showbiz', 'Edukes', 'Nusantara', 'Ruang Publik'
  ];

  useEffect(() => {
    if (profile && activeTab === 'profil') {
      setProfileForm({ full_name: profile.full_name || "", avatar_url: profile.avatar_url || "" });
      setProfilePreview(profile.avatar_url || null);
    }
  }, [profile, activeTab]);

  const fetchNews = async (isSilent = false) => {
    try {
      if (!isSilent && news.length === 0) setLoading(true);
      
      let query = supabase
        .from("news")
        .select(`*, profiles:author_id (full_name, avatar_url)`)
        .order("created_at", { ascending: false });

      if (activeTab === "antrean") {
        query = query.in("status", ["waiting_review", "pending"]);
      } else if (activeTab === "sudah_tayang") {
        query = query.eq("status", "published");
      }

      const { data, error } = await query;
      if (error) {
         console.warn("Gagal tarik data siluman:", error.message);
         return;
      }
      setNews(data || []);
    } catch (error) {
      console.warn("Error Data:", error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authLoading && !profile) return;
    if (!user || profile?.role?.toLowerCase() !== "redaktur") return;

    if (activeTab === "antrean" || activeTab === "sudah_tayang") {
        fetchNews();
    }

    const newsSubscription = supabase
      .channel(`live-news-redaktur`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'news' },
        (payload) => {
          if (activeTab === "antrean" || activeTab === "sudah_tayang") fetchNews(true); 
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(newsSubscription);
    };
  }, [authLoading, user, profile, activeTab]);

  const handleOpenEditor = (newsItem) => {
    setEditForm({
      id: newsItem.id, title: newsItem.title, content: newsItem.content, category: newsItem.category || "Kilas Daerah",
      photo_source: newsItem.photo_source || "", photo_caption: newsItem.photo_caption || "",
      image_url: newsItem.image_url || null, author: newsItem.profiles || null, is_headline: newsItem.is_headline || false
    });
    setReviewNote(newsItem.revision_note || ""); 
    setIsEditorOpen(true);
  };

  const handleSaveAndPublish = async () => {
    if (!confirm("Yakin ingin menayangkan berita ini dengan editan Anda?")) return;
    setActionLoading(true);
    try {
      const payload = {
        title: editForm.title, content: editForm.content, category: editForm.category,
        photo_source: editForm.photo_source || null, photo_caption: editForm.photo_caption || null,
        is_headline: editForm.is_headline, status: "published", revision_note: "" 
      };
      const { data, error } = await supabase.from("news").update(payload).eq("id", editForm.id).select(); 
      if (error) throw error;
      if (!data || data.length === 0) throw new Error("Gagal menyimpan ke database.");
      alert("Gacor! Berita editan Anda berhasil ditayangkan ke publik.");
      setIsEditorOpen(false);
      fetchNews(true); 
    } catch (error) {
      alert("GAGAL TAYANG:\n" + error.message);
    } finally { setActionLoading(false); }
  };

  const handleSaveAndRevise = async () => {
    if (!reviewNote.trim()) return alert("Mohon isi Catatan Revisi agar wartawan tahu apa yang harus diperbaiki!");
    setActionLoading(true);
    try {
      const payload = {
        title: editForm.title, content: editForm.content, category: editForm.category,
        photo_source: editForm.photo_source || null, photo_caption: editForm.photo_caption || null,
        is_headline: editForm.is_headline, status: "revised", revision_note: reviewNote 
      };
      const { data, error } = await supabase.from("news").update(payload).eq("id", editForm.id).select();
      if (error) throw error;
      if (!data || data.length === 0) throw new Error("Gagal mengirim revisi.");
      alert("Draft editan Anda dan Catatan Revisi berhasil dikirim ke meja Wartawan!");
      setIsEditorOpen(false);
      fetchNews(true); 
    } catch (error) {
      alert("GAGAL REVISI:\n" + error.message);
    } finally { setActionLoading(false); }
  };

  const handleReject = async (newsId) => {
    if (!confirm("PERINGATAN: Yakin ingin menolak berita ini sepenuhnya?")) return;
    setActionLoading(true);
    try {
      const { data, error } = await supabase.from("news").update({ status: "rejected", revision_note: "DITOLAK TOTAL: Berita tidak layak tayang.", is_headline: false }).eq("id", newsId).select();
      if (error) throw error;
      alert("Berita resmi ditolak!");
      fetchNews(true); 
    } catch (error) { alert("GAGAL MENOLAK:\n" + error.message); } finally { setActionLoading(false); }
  };

  const handleUnpublish = async (newsId) => {
    if (!confirm("Tarik kembali berita ini dari Publik? Statusnya akan menjadi Menunggu Review lagi.")) return;
    setActionLoading(true);
    try {
      const { data, error } = await supabase.from("news").update({ status: "waiting_review", is_headline: false }).eq("id", newsId).select();
      if (error) throw error;
      alert("Berita berhasil ditarik dari publik!");
      fetchNews(true); 
    } catch (error) { alert("GAGAL MENARIK BERITA:\n" + error.message); } finally { setActionLoading(false); }
  };

  const insertCreateQuote = () => {
    const quoteText = '\n\n"Masukkan kutipan narasumber di sini..."\n— Nama Narasumber\n\n';
    setCreateForm(prev => ({ ...prev, content: prev.content + quoteText }));
    if (createContentRef.current) createContentRef.current.focus();
  };

  const handleFormatText = (format) => {
    const textarea = createContentRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = createForm.content;
    const selected = text.slice(start, end);

    let before = "";
    let after = "";
    let defaultText = "";

    if (format === "bold") {
      before = "**";
      after = "**";
      defaultText = "Teks Tebal";
    } else if (format === "italic") {
      before = "*";
      after = "*";
      defaultText = "Teks Miring";
    }

    const insertion = selected || defaultText;
    const newText = text.slice(0, start) + before + insertion + after + text.slice(end);

    setCreateForm({ ...createForm, content: newText });

    setTimeout(() => {
      textarea.focus();
      if (selected) {
        textarea.setSelectionRange(start + before.length, start + before.length + selected.length);
      } else {
        textarea.setSelectionRange(start + before.length, start + before.length + defaultText.length);
      }
    }, 0);
  };

  const handleCreateNewsSubmit = async (e) => {
    e.preventDefault();
    if (!createForm.title || !createForm.content) return alert("Judul dan isi berita wajib diisi, Bos!");
    
    setActionLoading(true);
    try {
      let uploadedImageUrl = createPreview || null; 
      
      if (createImageFile) {
        const fileExt = createImageFile.name.split('.').pop();
        const fileName = `news-${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage.from('news-images').upload(fileName, createImageFile, { upsert: true });
        if (uploadError) throw new Error("Gagal upload foto. Cek Storage Supabase.");
        const { data: urlData } = supabase.storage.from('news-images').getPublicUrl(fileName);
        uploadedImageUrl = urlData.publicUrl;
      }
      
      const payload = {
        title: createForm.title,
        content: createForm.content,
        category: createForm.category,
        author_id: user.id,
        status: 'published', 
        is_headline: createForm.is_headline,
        views: 0,
        likes_count: 0,
        created_at: new Date().toISOString()
      };

      if (uploadedImageUrl) { payload.image_url = uploadedImageUrl; }
      if (createForm.photo_source && createForm.photo_source.trim() !== '') { payload.photo_source = createForm.photo_source.trim(); }
      if (createForm.photo_caption && createForm.photo_caption.trim() !== '') { payload.photo_caption = createForm.photo_caption.trim(); }

      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      const response = await fetch(`${supabaseUrl}/rest/v1/news`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Prefer': 'return=representation'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) throw new Error("Gagal menyimpan ke database.");

      alert("Gacor Bos! Berita Anda langsung terbit ke publik.");
      setCreateForm({ title: "", content: "", category: "Kilas Daerah", photo_source: "", photo_caption: "", is_headline: false });
      setCreatePreview(null);
      setCreateImageFile(null);
      setActiveTab("sudah_tayang"); 
      
    } catch (err) {
      alert("⚠️ GAGAL KIRIM:\n" + err.message);
    } finally {
      setActionLoading(false); 
    }
  };

  // 🔥 UPDATE PROFIL (DENGAN HARD REFRESH DAN CLEAR STORAGE) 🔥
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (!profileForm.full_name.trim()) return alert("Nama tidak boleh kosong!");
    setActionLoading(true);

    try {
        let finalAvatarUrl = profile?.avatar_url || null; 

        if (profileImageFile) {
            const fileExt = profileImageFile.name.split('.').pop();
            const fileName = `avatar-${user.id}-${Date.now()}.${fileExt}`;
            const { error: uploadError } = await supabase.storage.from('news-images').upload(fileName, profileImageFile, { upsert: true });
            if (uploadError) throw new Error("Gagal upload foto profil.");
            const { data: urlData } = supabase.storage.from('news-images').getPublicUrl(fileName);
            finalAvatarUrl = urlData.publicUrl;
        }

        // Tembak Database
        const { error: updateError } = await supabase
            .from('profiles')
            .update({ full_name: profileForm.full_name, avatar_url: finalAvatarUrl })
            .eq('id', user.id);

        if (updateError) throw updateError;

        alert("✅ PROFIL BERHASIL DISIMPAN! Memuat ulang sistem...");
        
        // 🔥 JURUS PAMUNGKAS: Hapus cache memori browser dan hard reload 🔥
        if (typeof window !== 'undefined') {
            sessionStorage.clear(); // Bersihkan sesi sementara
            window.location.href = window.location.pathname + "?updated=" + Date.now(); // Reload dengan unique query
        }

    } catch (err) {
        alert("Gagal update profil: " + err.message);
    } finally {
        setActionLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      localStorage.clear();
      sessionStorage.clear();
      window.location.href = '/admin/login';
    } catch (error) {
      window.location.href = '/admin/login';
    }
  };

  const displayedNews = activeTab === "sudah_tayang" 
    ? news.filter(item => item.title?.toLowerCase().includes(searchQuery.toLowerCase()))
    : news;

  if (authLoading && !profile) {
    return (
      <div className="min-h-screen bg-[#0F172A] flex flex-col items-center justify-center text-center p-6">
        <div className="text-white font-black italic animate-pulse text-2xl tracking-tighter mb-4">
          SULTRAFIKS<span className="text-blue-500">VISION</span>
        </div>
        <p className="text-blue-400 text-xs font-bold uppercase tracking-widest animate-bounce">
            Menghubungkan ke Meja Redaksi...
        </p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#0F172A] flex flex-col items-center justify-center p-6 text-center">
        <AlertTriangle size={48} className="text-red-500 mb-4" />
        <h1 className="text-white text-2xl font-black mb-2">Akses Ditolak!</h1>
        <button onClick={() => router.replace("/admin/login")} className="px-6 py-3 bg-blue-600 text-white font-bold rounded-xl text-sm">Ke Halaman Login</button>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-[#0F172A] flex flex-col items-center justify-center p-6 text-center">
        <AlertTriangle size={48} className="text-amber-500 mb-4" />
        <h1 className="text-white text-2xl font-black mb-2">Data Profil Kosong!</h1>
        <p className="text-slate-400 text-sm max-w-md mb-6 leading-relaxed">
            Sistem tidak menemukan "KTP" Anda di tabel <code>profiles</code>.
            Pastikan ID <b>{user.id}</b> sudah terdaftar sebagai <b>redaktur</b>.
        </p>
        <button onClick={handleLogout} className="px-6 py-3 bg-slate-700 text-white font-bold rounded-xl text-sm transition-all hover:bg-slate-600 shadow-lg">
            Keluar & Sinkronkan Ulang
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col md:flex-row font-sans relative overflow-x-hidden">
      
      {isEditorOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
          <div className="bg-white w-full max-w-7xl h-[95vh] md:h-auto md:min-h-[90vh] rounded-3xl md:rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden my-auto border-2 md:border-4 border-amber-200/50">
            <div className="px-4 md:px-8 py-4 md:py-5 border-b border-slate-100 flex items-center justify-between bg-amber-50/50 sticky top-0 z-10">
              <div className="flex items-center gap-3 md:gap-4">
                <div className="w-10 h-10 md:w-12 h-12 bg-amber-100 text-amber-600 rounded-xl md:rounded-2xl flex items-center justify-center shadow-inner shrink-0">
                  <Edit3 size={20} className="md:w-6 md:h-6" />
                </div>
                <div>
                  <h2 className="text-lg md:text-2xl font-black italic uppercase tracking-tight text-slate-900 leading-none">
                    Intervensi Redaktur
                  </h2>
                  <p className="text-[9px] md:text-xs font-bold text-amber-600 uppercase tracking-widest mt-1 line-clamp-1">Lengkapi & Sempurnakan Berita</p>
                </div>
              </div>
              <button onClick={() => setIsEditorOpen(false)} className="p-2 md:p-3 bg-white hover:bg-slate-100 rounded-full text-slate-500 transition-colors shadow-sm border border-slate-200 shrink-0">
                <X size={18} className="md:w-5 md:h-5" />
              </button>
            </div>

            <div className="flex-1 p-4 md:p-8 bg-[#F8FAFC] grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-8 overflow-y-auto">
              
              <div className="lg:col-span-8 bg-white p-5 md:p-8 rounded-2xl md:rounded-[2rem] shadow-sm border border-slate-200 flex flex-col min-h-[400px]">
                <div className="mb-4">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Judul Berita Utama</label>
                  <textarea 
                    value={editForm.title}
                    onChange={(e) => setEditForm({...editForm, title: e.target.value})}
                    rows={2}
                    className="w-full text-xl md:text-3xl font-black text-slate-900 placeholder:text-slate-200 outline-none pb-2 md:pb-4 border-b border-slate-100 bg-transparent focus:border-amber-400 transition-colors resize-none leading-tight break-words whitespace-pre-wrap"
                  />
                </div>
                <div className="flex-1 flex flex-col mt-2 md:mt-4">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Isi Berita Lengkap</label>
                  <textarea 
                    value={editForm.content}
                    onChange={(e) => setEditForm({...editForm, content: e.target.value})}
                    className="w-full flex-1 resize-none text-base md:text-lg text-slate-700 leading-relaxed outline-none bg-transparent min-h-[300px] md:min-h-[400px] break-words whitespace-pre-wrap"
                  />
                </div>
              </div>

              <div className="lg:col-span-4 space-y-4 md:space-y-6">
                
                <div className="bg-blue-50 p-4 md:p-5 rounded-2xl md:rounded-[2rem] border border-blue-100 flex items-center gap-3 md:gap-4 shadow-sm">
                  <div className="relative w-12 h-12 md:w-14 md:h-14 rounded-full overflow-hidden bg-blue-200 border-2 border-white shadow flex items-center justify-center text-blue-500 shrink-0">
                    {editForm.author?.avatar_url && editForm.author.avatar_url.trim() !== "" ? (
                      <Image src={editForm.author.avatar_url} fill className="object-cover" alt="Wartawan" unoptimized />
                    ) : (
                      <User size={20} className="md:w-6 md:h-6" />
                    )}
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-blue-500 mb-0.5 md:mb-1">Pengirim Berita</p>
                    <p className="text-sm md:text-base font-black text-slate-800 leading-none truncate">
                      {editForm.author?.full_name || "Wartawan Lapangan"}
                    </p>
                  </div>
                </div>

                <div className="bg-white p-4 md:p-6 rounded-2xl md:rounded-[2rem] shadow-sm border border-slate-200 space-y-4 md:space-y-5">
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Kategori Utama</label>
                    <select 
                      value={editForm.category}
                      onChange={(e) => setEditForm({...editForm, category: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-100 rounded-xl md:rounded-2xl px-3 md:px-4 py-2.5 md:py-3 text-xs md:text-sm font-bold text-slate-700 outline-none focus:ring-2 ring-amber-500/20"
                    >
                      {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    </select>
                  </div>

                  <div className="bg-amber-50/50 p-3 md:p-4 rounded-xl md:rounded-2xl border border-amber-100 flex items-center justify-between">
                    <div className="flex items-center gap-2 md:gap-3">
                      <div className={`p-1.5 md:p-2 rounded-lg md:rounded-xl transition-colors ${editForm.is_headline ? 'bg-amber-500 text-white shadow-md shadow-amber-500/30' : 'bg-slate-200 text-slate-400'}`}>
                        <Star size={14} className={`md:w-4 md:h-4 ${editForm.is_headline ? 'fill-current' : ''}`} />
                      </div>
                      <div>
                        <p className={`text-[10px] md:text-xs font-black uppercase tracking-wide transition-colors ${editForm.is_headline ? 'text-amber-700' : 'text-slate-600'}`}>
                          Jadikan Headline
                        </p>
                        <p className="text-[8px] md:text-[9px] font-bold text-slate-400 mt-0.5">Berita Utama Kategori</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setEditForm({ ...editForm, is_headline: !editForm.is_headline })}
                      className={`relative inline-flex h-6 w-10 md:h-7 md:w-12 items-center rounded-full transition-colors focus:outline-none ${editForm.is_headline ? 'bg-amber-500' : 'bg-slate-300'}`}
                    >
                      <span className={`inline-block h-4 w-4 md:h-5 md:w-5 transform rounded-full bg-white transition-transform ${editForm.is_headline ? 'translate-x-5 md:translate-x-6' : 'translate-x-1'}`} />
                    </button>
                  </div>

                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Foto Berita (Read-Only)</label>
                    <div className="relative w-full aspect-video rounded-xl md:rounded-2xl bg-slate-100 overflow-hidden border border-slate-200 flex items-center justify-center">
                      {editForm.image_url ? (
                        <img src={editForm.image_url} className="w-full h-auto max-h-[300px] object-contain" alt="Thumbnail" />
                      ) : (
                        <div className="flex flex-col items-center justify-center text-slate-300 py-10">
                          <ImageIcon size={24} className="mb-1 md:mb-2 md:w-8 md:h-8" />
                          <span className="text-[10px] md:text-xs font-bold">Tanpa Foto</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1 md:mb-2 flex items-center gap-1"><ImageIcon size={10}/> Sumber</label>
                    <input 
                      type="text" 
                      value={editForm.photo_source}
                      placeholder="Kosongkan jika asli"
                      onChange={(e) => setEditForm({...editForm, photo_source: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-100 rounded-lg md:rounded-xl px-3 py-2.5 text-[10px] md:text-xs font-bold text-slate-700 outline-none focus:ring-2 ring-amber-500/20"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1 md:mb-2 flex items-center gap-1"><Info size={10}/> Caption Foto</label>
                    <textarea 
                      value={editForm.photo_caption}
                      onChange={(e) => setEditForm({...editForm, photo_caption: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-100 rounded-lg md:rounded-xl px-3 py-2 text-[10px] md:text-xs font-medium text-slate-700 outline-none focus:ring-2 ring-amber-500/20 resize-none h-[50px] md:h-[60px]"
                    />
                  </div>
                </div>

                <div className="bg-red-50 p-4 md:p-6 rounded-2xl md:rounded-[2rem] border border-red-100 shadow-sm relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-3 md:p-4 opacity-10"><MessageSquareWarning size={48} className="md:w-16 md:h-16"/></div>
                  <h3 className="font-black text-red-800 text-[10px] md:text-sm uppercase tracking-widest flex items-center gap-1.5 md:gap-2 mb-3 md:mb-4 relative z-10">
                    <MessageSquareWarning size={14} className="md:w-4 md:h-4" /> Pesan Untuk Wartawan
                  </h3>
                  <textarea
                    value={reviewNote}
                    onChange={(e) => setReviewNote(e.target.value)}
                    placeholder="Tuliskan alasan revisi di sini (Kosongkan jika langsung tayang)..."
                    className="w-full p-3 md:p-4 bg-white/80 backdrop-blur-sm border border-red-200 rounded-xl md:rounded-2xl text-xs md:text-sm font-medium text-red-900 outline-none focus:ring-2 focus:ring-red-400/50 resize-none min-h-[80px] md:min-h-[100px] placeholder:text-red-300 relative z-10"
                  />
                </div>

                <div className="flex flex-col gap-2 md:gap-3 pt-2">
                  <button
                    onClick={handleSaveAndRevise}
                    disabled={actionLoading}
                    className="w-full flex items-center justify-center gap-2 py-3 md:py-4 bg-amber-500 hover:bg-amber-600 text-white rounded-xl md:rounded-2xl font-black uppercase text-[10px] md:text-xs tracking-widest shadow-lg shadow-amber-500/30 active:scale-95 transition-all disabled:opacity-50"
                  >
                    <Send size={14} className="md:w-4 md:h-4" /> Simpan & Minta Revisi
                  </button>
                  
                  <div className="relative py-1 md:py-2 flex items-center">
                    <div className="flex-grow border-t border-slate-200"></div>
                    <span className="flex-shrink-0 mx-3 md:mx-4 text-slate-400 text-[9px] md:text-[10px] font-black uppercase">ATAU</span>
                    <div className="flex-grow border-t border-slate-200"></div>
                  </div>

                  <button
                    onClick={handleSaveAndPublish}
                    disabled={actionLoading}
                    className="w-full flex items-center justify-center gap-2 py-3 md:py-4 bg-green-500 hover:bg-green-600 text-white rounded-xl md:rounded-2xl font-black uppercase text-[10px] md:text-xs tracking-widest shadow-lg shadow-green-500/30 active:scale-95 transition-all disabled:opacity-50"
                  >
                    <CheckCircle size={14} className="md:w-4 md:h-4" /> Simpan & Langsung Tayang
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <header className="md:hidden bg-[#0F172A] text-white p-4 flex justify-between items-center shadow-md sticky top-0 z-40">
        <div className="flex items-center gap-2 uppercase italic font-black text-lg tracking-tighter">
          SULTRAFIKS<span className="text-blue-500">ADMIN</span>
        </div>
        <button onClick={handleLogout} className="p-2 text-red-400 hover:bg-white/10 rounded-lg transition-colors">
          <LogOut size={20} />
        </button>
      </header>

      <aside className="hidden md:flex w-64 bg-[#0F172A] text-white flex-col p-6 fixed top-0 left-0 h-screen shrink-0 z-40 overflow-y-auto">
        <div className="flex items-center gap-3 mb-10 uppercase italic font-black text-xl tracking-tighter">
          SULTRAFIKS<span className="text-blue-500">ADMIN</span>
        </div>
        <nav className="flex-1 space-y-2">
          <div 
            onClick={() => {setActiveTab("antrean"); setSearchQuery("");}}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold cursor-pointer transition-colors ${activeTab === 'antrean' ? 'bg-blue-600 shadow-lg shadow-blue-500/20 text-white' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
          >
            <FileText size={18} /> Antrean Berita
          </div>
          <div 
            onClick={() => setActiveTab("sudah_tayang")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold cursor-pointer transition-colors ${activeTab === 'sudah_tayang' ? 'bg-blue-600 shadow-lg shadow-blue-500/20 text-white' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
          >
            <CheckCircle size={18} /> Sudah Tayang
          </div>
          <div 
            onClick={() => {setActiveTab("tulis_berita"); setSearchQuery("");}}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold cursor-pointer transition-colors ${activeTab === 'tulis_berita' ? 'bg-amber-500 shadow-lg shadow-amber-500/20 text-white' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
          >
            <PenBox size={18} /> Tulis Berita
          </div>
          <div 
            onClick={() => {setActiveTab("profil"); setSearchQuery("");}}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold cursor-pointer transition-colors ${activeTab === 'profil' ? 'bg-purple-600 shadow-lg shadow-purple-500/20 text-white' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
          >
            <UserCircle size={18} /> Profil Redaksi
          </div>
        </nav>
        <div className="mt-auto pt-6 border-t border-white/10">
          <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/5 mb-4 border border-white/10">
            <div className="w-10 h-10 rounded-xl overflow-hidden relative bg-blue-600 flex items-center justify-center font-black uppercase text-xl shrink-0">
              {profile?.avatar_url && profile.avatar_url.trim() !== "" ? (
                <Image src={profile.avatar_url} fill className="object-cover" alt="Profile" unoptimized />
              ) : (
                profile?.full_name?.charAt(0) || "R"
              )}
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-black uppercase truncate text-white">
                {profile?.full_name || "Redaktur"}
              </p>
              <p className="text-[9px] text-blue-400 font-bold uppercase tracking-widest mt-0.5">Meja Redaksi</p>
            </div>
          </div>
          <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 py-3 text-red-400 text-xs font-black uppercase tracking-widest hover:bg-red-50/10 rounded-xl transition-colors">
            <LogOut size={16} /> Keluar Akun
          </button>
        </div>
      </aside>

      <main className="flex-1 p-4 md:p-10 pb-24 md:pb-10 overflow-y-auto w-full md:ml-64">
        <div className="max-w-5xl mx-auto">
          
          <header className="mb-6 md:mb-10 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div className="w-full">
              <h2 className="text-xl md:text-3xl font-black uppercase italic tracking-tighter text-slate-900 leading-none">
                {activeTab === "antrean" && "Meja Redaksi"}
                {activeTab === "sudah_tayang" && "Berita Publik"}
                {activeTab === "tulis_berita" && "Tulis Berita Utama"}
                {activeTab === "profil" && "Pengaturan Profil"}
              </h2>
              <p className="text-slate-400 text-xs md:text-sm font-bold mt-1 md:mt-2">
                {activeTab === "antrean" && "Verifikasi dan publikasi berita dari wartawan di lapangan."}
                {activeTab === "sudah_tayang" && "Monitoring berita yang sudah terbit di halaman pengguna."}
                {activeTab === "tulis_berita" && "Tulis dan terbitkan berita eksklusif langsung dari meja redaksi."}
                {activeTab === "profil" && "Kelola identitas dan foto profil Anda."}
              </p>

              {activeTab === "sudah_tayang" && (
                <div className="mt-4 md:mt-6 w-full max-w-xl">
                  <div className="flex items-center bg-white border border-slate-200 rounded-xl md:rounded-2xl px-3 md:px-4 py-2.5 md:py-3 shadow-sm focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 transition-all">
                    <Search size={18} className="text-slate-400 mr-2 md:w-5 md:h-5" />
                    <input
                      type="text"
                      placeholder="Cari judul berita..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full text-xs md:text-sm font-bold text-slate-700 outline-none bg-transparent placeholder:text-slate-300"
                    />
                    {searchQuery && (
                      <button onClick={() => setSearchQuery("")} className="text-slate-400 hover:text-red-500 p-1">
                        <XCircle size={16} />
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
            
            {(activeTab === "antrean" || activeTab === "sudah_tayang") && (
              <div className="inline-flex items-center self-start sm:self-auto gap-2 px-3 py-1.5 md:px-4 md:py-2 bg-green-100 text-green-700 rounded-full text-[9px] md:text-xs font-black uppercase tracking-widest shadow-sm shrink-0">
                <div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-green-500 rounded-full animate-pulse"/> LIVE MONITORING
              </div>
            )}
          </header>

          {activeTab === "tulis_berita" ? (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8 animate-in fade-in">
                <div className="lg:col-span-8">
                  <div className="bg-white rounded-3xl md:rounded-[2rem] p-5 md:p-8 shadow-xl shadow-slate-200/50 border border-slate-100 flex flex-col min-h-[500px] md:min-h-[700px]">
                    <div className="flex items-center gap-4 md:gap-6 pb-4 md:pb-6 border-b border-slate-100 mb-4 md:mb-6 text-xs md:text-sm font-bold text-slate-500 overflow-x-auto no-scrollbar">
                      <button onClick={insertCreateQuote} className="flex items-center gap-1.5 md:gap-2 hover:text-blue-600 transition-colors whitespace-nowrap">
                        <Quote size={16} className="md:w-[18px] md:h-[18px]" /> Kutipan
                      </button>
                      
                      <button onClick={() => handleFormatText('bold')} className="flex items-center gap-1.5 md:gap-2 hover:text-blue-600 transition-colors whitespace-nowrap">
                        <Bold size={16} className="md:w-[18px] md:h-[18px]" /> Bold
                      </button>
                      <button onClick={() => handleFormatText('italic')} className="flex items-center gap-1.5 md:gap-2 hover:text-blue-600 transition-colors whitespace-nowrap">
                        <Italic size={16} className="md:w-[18px] md:h-[18px]" /> Italic
                      </button>
                    </div>

                    <textarea 
                      placeholder="Judul Berita Utama..." 
                      value={createForm.title}
                      rows={2}
                      onChange={(e) => setCreateForm({...createForm, title: e.target.value})}
                      className="w-full text-2xl md:text-4xl font-black text-slate-900 placeholder:text-slate-200 outline-none mb-4 md:mb-6 bg-transparent resize-none leading-tight break-words whitespace-pre-wrap"
                    />

                    <textarea 
                      ref={createContentRef}
                      placeholder="Mulai menulis berita di sini..."
                      value={createForm.content}
                      onChange={(e) => setCreateForm({...createForm, content: e.target.value})}
                      className="w-full flex-1 resize-none text-base md:text-lg text-slate-700 leading-relaxed placeholder:text-slate-300 outline-none bg-transparent break-words whitespace-pre-wrap"
                    />
                  </div>
                </div>

                <div className="lg:col-span-4 space-y-4 md:space-y-6">
                  <div className="bg-white rounded-3xl md:rounded-[2rem] p-5 md:p-6 shadow-xl shadow-slate-200/50 border border-slate-100 lg:sticky top-10">
                    <h3 className="font-black italic text-xs md:text-sm uppercase tracking-widest flex items-center gap-2 text-slate-800 mb-5 md:mb-6 border-b border-slate-100 pb-4">
                      <Settings size={16} className="text-amber-500 md:w-[18px] md:h-[18px]" /> PROPERTI BERITA
                    </h3>

                    <div className="space-y-5 md:space-y-6">
                      <div>
                        <label className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Kategori Utama</label>
                        <select 
                          value={createForm.category}
                          onChange={(e) => setCreateForm({...createForm, category: e.target.value})}
                          className="w-full bg-slate-50 border border-slate-100 rounded-xl md:rounded-2xl px-3 md:px-4 py-2.5 md:py-3 text-xs md:text-sm font-bold text-slate-700 outline-none focus:ring-2 ring-amber-500/20 appearance-none cursor-pointer"
                        >
                          {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                        </select>
                      </div>

                      <div className="bg-amber-50/50 p-3 md:p-4 rounded-xl md:rounded-2xl border border-amber-100 flex items-center justify-between">
                        <div className="flex items-center gap-2 md:gap-3">
                          <div className={`p-1.5 md:p-2 rounded-lg md:rounded-xl transition-colors ${createForm.is_headline ? 'bg-amber-500 text-white shadow-md shadow-amber-500/30' : 'bg-slate-200 text-slate-400'}`}>
                            <Star size={14} className={`md:w-4 md:h-4 ${createForm.is_headline ? 'fill-current' : ''}`} />
                          </div>
                          <div>
                            <p className={`text-[10px] md:text-xs font-black uppercase tracking-wide transition-colors ${createForm.is_headline ? 'text-amber-700' : 'text-slate-600'}`}>
                              Jadikan Headline
                            </p>
                            <p className="text-[8px] md:text-[9px] font-bold text-slate-400 mt-0.5">Berita Utama Kategori</p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setCreateForm({ ...createForm, is_headline: !createForm.is_headline })}
                          className={`relative inline-flex h-6 w-10 md:h-7 md:w-12 items-center rounded-full transition-colors focus:outline-none ${createForm.is_headline ? 'bg-amber-500' : 'bg-slate-300'}`}
                        >
                          <span className={`inline-block h-4 w-4 md:h-5 md:w-5 transform rounded-full bg-white transition-transform ${createForm.is_headline ? 'translate-x-5 md:translate-x-6' : 'translate-x-1'}`} />
                        </button>
                      </div>

                      <div>
                        <label className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Thumbnail Berita</label>
                        <label className={`relative block w-full rounded-xl md:rounded-2xl bg-slate-50 border-2 border-dashed border-slate-200 overflow-hidden cursor-pointer hover:border-amber-400 hover:bg-amber-50/50 transition-all group flex flex-col items-center justify-center min-h-[200px]`}>
                          {createPreview ? (
                            <img src={createPreview} className="w-full h-auto max-h-[300px] object-contain block" alt="Preview" />
                          ) : (
                            <div className="flex flex-col items-center justify-center text-slate-400 group-hover:text-amber-500 py-10">
                              <UploadCloud size={28} className="md:w-8 md:h-8" />
                              <span className="text-[10px] md:text-xs font-bold mt-2">Pilih Foto</span>
                            </div>
                          )}
                          <input type="file" className="hidden" accept="image/*" onChange={(e) => {
                            const file = e.target.files[0];
                            if(file) { setCreateImageFile(file); setCreatePreview(URL.createObjectURL(file)); }
                          }} />
                        </label>
                      </div>

                      <div>
                        <label className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5 md:mb-2 flex items-center gap-1">
                          <ImageIcon size={10}/> Sumber Foto
                        </label>
                        <input 
                          type="text" 
                          value={createForm.photo_source}
                          placeholder="Kosongkan jika foto asli jepretan sendiri"
                          onChange={(e) => setCreateForm({...createForm, photo_source: e.target.value})}
                          className="w-full bg-slate-50 border border-slate-100 rounded-lg md:rounded-xl px-3 md:px-4 py-2.5 md:py-3 text-[10px] md:text-xs font-bold text-slate-700 outline-none focus:ring-2 ring-amber-500/20"
                        />
                      </div>

                      <div>
                        <label className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5 md:mb-2 flex items-center gap-1"><Info size={10}/> Penjelasan Foto (Caption)</label>
                        <textarea 
                          value={createForm.photo_caption}
                          placeholder="Deskripsikan momen di dalam foto..."
                          onChange={(e) => setCreateForm({...createForm, photo_caption: e.target.value})}
                          className="w-full bg-slate-50 border border-slate-100 rounded-xl md:rounded-2xl px-3 md:px-4 py-2.5 md:py-3 text-[10px] md:text-xs font-medium text-slate-700 outline-none focus:ring-2 ring-amber-500/20 resize-none h-[60px] md:h-[80px]"
                        />
                      </div>

                      <button 
                        onClick={handleCreateNewsSubmit}
                        disabled={actionLoading}
                        className="w-full flex items-center justify-center gap-2 py-3.5 md:py-4 bg-amber-500 hover:bg-amber-600 text-white rounded-xl md:rounded-2xl font-black uppercase text-[10px] md:text-xs tracking-widest shadow-lg shadow-amber-500/30 active:scale-95 transition-all disabled:opacity-50 mt-4"
                      >
                        <Send size={14} className="md:w-4 md:h-4" /> {actionLoading ? "MENERBITKAN..." : "TERBITKAN BERITA"}
                      </button>

                    </div>
                  </div>
                </div>
            </div>

          ) : activeTab === "profil" ? (
            <div className="max-w-2xl mx-auto bg-white rounded-3xl md:rounded-[2rem] p-6 md:p-10 shadow-xl shadow-slate-200/50 border border-slate-100 animate-in fade-in">
                <div className="flex flex-col items-center mb-8 md:mb-10">
                   <label className="relative w-24 h-24 md:w-32 md:h-32 rounded-full overflow-hidden bg-slate-100 border-4 border-white shadow-xl cursor-pointer group mb-4 flex items-center justify-center">
                      {profilePreview && profilePreview.trim() !== "" ? (
                        <Image src={profilePreview} fill className="object-cover" alt="Profile Avatar" unoptimized />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center bg-purple-100 text-purple-500 font-black text-3xl uppercase">
                            {profileForm.full_name?.charAt(0) || profile?.full_name?.charAt(0) || "R"}
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                         <UploadCloud className="text-white" size={24} />
                      </div>
                      <input type="file" className="hidden" accept="image/*" onChange={(e) => {
                          const file = e.target.files[0];
                          if(file) { setProfileImageFile(file); setProfilePreview(URL.createObjectURL(file)); }
                      }} />
                   </label>
                   <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-[10px] md:text-xs font-black uppercase tracking-widest">
                       JABATAN: {profile?.role || "REDAKTUR"}
                   </span>
                </div>

                <div className="space-y-5 md:space-y-6">
                    <div>
                        <label className="text-[10px] md:text-xs font-black uppercase tracking-widest text-slate-400 mb-2 block">Nama Lengkap (KTP)</label>
                        <input 
                            type="text" 
                            value={profileForm.full_name}
                            onChange={(e) => setProfileForm({...profileForm, full_name: e.target.value})}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl md:rounded-2xl px-4 py-3 md:py-4 text-sm font-bold text-slate-800 outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
                            placeholder="Masukkan nama lengkap Anda..."
                        />
                    </div>
                    <div>
                        <label className="text-[10px] md:text-xs font-black uppercase tracking-widest text-slate-400 mb-2 block">Alamat Email (Akun)</label>
                        <input 
                            type="email" 
                            value={user?.email || ""}
                            disabled
                            className="w-full bg-slate-100 border border-slate-200 rounded-xl md:rounded-2xl px-4 py-3 md:py-4 text-sm font-bold text-slate-500 outline-none cursor-not-allowed"
                        />
                        <p className="text-[9px] md:text-[10px] text-slate-400 mt-1 italic">*Email digunakan untuk login dan tidak dapat diubah sembarangan.</p>
                    </div>

                    <div className="pt-4 md:pt-6 border-t border-slate-100 mt-6">
                        <button 
                            onClick={handleUpdateProfile}
                            disabled={actionLoading}
                            className="w-full flex items-center justify-center gap-2 py-3.5 md:py-4 bg-purple-600 hover:bg-purple-700 text-white rounded-xl md:rounded-2xl font-black uppercase text-[10px] md:text-xs tracking-widest shadow-lg shadow-purple-500/30 active:scale-95 transition-all disabled:opacity-50"
                        >
                            <Save size={16} className="md:w-5 md:h-5"/> {actionLoading ? "MENYIMPAN..." : "SIMPAN PERUBAHAN PROFIL"}
                        </button>
                    </div>
                </div>
            </div>

          ) : loading ? (
            <div className="text-center py-20 flex flex-col items-center justify-center text-slate-400">
              <Clock className="w-6 h-6 md:w-8 md:h-8 animate-spin mb-3 md:mb-4" />
              <p className="font-bold uppercase tracking-widest text-[10px] md:text-xs">Menarik Data Berita...</p>
            </div>
          ) : displayedNews.length === 0 ? (
            <div className="bg-white p-10 md:p-20 rounded-3xl md:rounded-[3rem] text-center border-2 border-dashed border-slate-200 mt-6">
              <div className="w-16 h-16 md:w-20 md:h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 md:mb-6">
                <CheckCircle className="text-slate-300 w-6 h-6 md:w-8 md:h-8" />
              </div>
              <h3 className="text-base md:text-lg font-black text-slate-900 mb-2">
                {searchQuery ? "Pencarian Tidak Ditemukan!" : "Data Kosong!"}
              </h3>
              <p className="text-slate-500 font-medium text-xs md:text-sm">
                {searchQuery ? "Coba gunakan kata kunci yang lain." : "Belum ada berita di kategori ini."}
              </p>
            </div>
          ) : (
            <div className="space-y-4 md:space-y-6">
              {displayedNews.map((item) => (
                <div key={item.id} className="bg-white p-4 md:p-6 rounded-3xl md:rounded-[2rem] shadow-sm border border-slate-100 flex flex-col sm:flex-row gap-4 md:gap-8 hover:shadow-xl hover:shadow-slate-200/50 transition-all group relative">
                  
                  <div className="w-full sm:w-40 md:w-48 lg:w-64 aspect-video bg-slate-100 rounded-xl md:rounded-2xl overflow-hidden shrink-0 relative border border-slate-200">
                    {item.image_url ? (
                      <Image src={item.image_url} fill className="object-cover group-hover:scale-105 transition-transform duration-700" alt="News Image" unoptimized />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-slate-300 text-xs font-bold">NO FOTO</div>
                    )}
                    <div className="absolute top-2 left-2 md:top-3 md:left-3 px-2 md:px-3 py-1 bg-black/60 backdrop-blur-md text-white text-[8px] md:text-[10px] font-black uppercase tracking-widest rounded-lg">
                      {item.category}
                    </div>
                    {item.is_headline && (
                      <div className="absolute top-2 right-2 md:top-3 md:right-3 px-1.5 md:px-2 py-1 bg-amber-500 text-white rounded-md md:rounded-lg flex items-center gap-1 shadow-md">
                        <Star size={10} className="fill-current md:w-3 md:h-3" />
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2 md:gap-3 mb-2 md:mb-3 text-[9px] md:text-[10px] font-black uppercase tracking-widest text-slate-400">
                        <span className="text-blue-600 bg-blue-50 px-2 py-1 rounded flex items-center gap-1"><User size={10} className="md:w-3 md:h-3"/> {item.profiles?.full_name || 'Wartawan'}</span>
                        <span className="hidden sm:inline">•</span>
                        <span>{new Date(item.created_at).toLocaleString("id-ID", { dateStyle: 'medium', timeStyle: 'short' })}</span>
                      </div>
                      <h3 className="text-base md:text-xl font-black text-slate-900 mb-2 md:mb-3 leading-tight md:pr-10 line-clamp-2 md:line-clamp-none">{item.title}</h3>
                      
                      {activeTab !== "sudah_tayang" && (
                        <p className="text-xs md:text-sm text-slate-600 line-clamp-2 md:line-clamp-3 leading-relaxed">{item.content}</p>
                      )}
                    </div>
                    
                    <div className="flex flex-col sm:flex-row items-center gap-2 md:gap-3 mt-4 md:mt-6 pt-4 md:pt-6 border-t border-slate-100">
                      
                      {activeTab === "antrean" ? (
                        <>
                          <button
                            onClick={() => handleOpenEditor(item)}
                            disabled={actionLoading}
                            className="w-full sm:flex-1 flex items-center justify-center gap-1.5 md:gap-2 px-4 md:px-6 py-2.5 md:py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-lg md:rounded-xl text-[10px] md:text-xs font-black uppercase tracking-widest transition-all shadow-lg shadow-amber-500/20 active:scale-95"
                          >
                            <Edit3 size={14} className="md:w-4 md:h-4"/> Review & Edit
                          </button>
                          <button
                            onClick={() => handleReject(item.id)}
                            disabled={actionLoading}
                            className="w-full sm:w-12 h-10 md:h-12 flex items-center justify-center bg-slate-50 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-lg md:rounded-xl transition-colors shadow-sm border border-slate-100 gap-2 sm:gap-0"
                            title="Tolak Sepenuhnya"
                          >
                            <XCircle size={16} className="md:w-5 md:h-5"/> 
                            <span className="sm:hidden text-[10px] font-black uppercase tracking-widest">Tolak</span>
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => handleOpenEditor(item)}
                            disabled={actionLoading}
                            className="w-full sm:flex-1 flex items-center justify-center gap-1.5 md:gap-2 px-4 md:px-6 py-2.5 md:py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg md:rounded-xl text-[10px] md:text-xs font-black uppercase tracking-widest transition-all shadow-lg shadow-blue-500/20 active:scale-95"
                          >
                            <Edit3 size={14} className="md:w-4 md:h-4"/> Edit Ulang
                          </button>
                          <button
                            onClick={() => handleUnpublish(item.id)}
                            disabled={actionLoading}
                            className="w-full sm:flex-1 flex items-center justify-center gap-1.5 md:gap-2 px-4 md:px-6 py-2.5 md:py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg md:rounded-xl text-[10px] md:text-xs font-black uppercase tracking-widest transition-all border border-slate-200 active:scale-95"
                            title="Tarik kembali dari publik"
                          >
                            <EyeOff size={14} className="md:w-4 md:h-4"/> Turunkan
                          </button>
                          
                          <button
                            onClick={() => window.open(`/berita/${item.id}`, '_blank')}
                            disabled={actionLoading}
                            className="w-full sm:flex-1 flex items-center justify-center gap-1.5 md:gap-2 px-4 md:px-6 py-2.5 md:py-3 bg-green-500 hover:bg-green-600 text-white rounded-xl md:rounded-lg text-[10px] md:text-xs font-black uppercase tracking-widest transition-all shadow-lg shadow-green-500/20 active:scale-95"
                            title="Lihat berita di halaman utama website"
                          >
                            <ExternalLink size={14} className="md:w-4 md:h-4"/> Lihat Web
                          </button>
                        </>
                      )}

                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 flex items-center justify-around p-2 pb-safe z-40 shadow-[0_-10px_30px_rgba(0,0,0,0.05)]">
        <button 
          onClick={() => {setActiveTab("antrean"); setSearchQuery("");}} 
          className={`flex flex-col items-center gap-1 p-2 w-full transition-colors ${activeTab === 'antrean' ? 'text-blue-600' : 'text-slate-400'}`}
        >
          <div className={`${activeTab === 'antrean' ? 'bg-blue-100 p-1.5 rounded-xl' : 'p-1.5'}`}>
            <FileText size={20} />
          </div>
          <span className="text-[9px] font-black uppercase tracking-widest">Antrean</span>
        </button>
        <button 
          onClick={() => setActiveTab("sudah_tayang")} 
          className={`flex flex-col items-center gap-1 p-2 w-full transition-colors ${activeTab === 'sudah_tayang' ? 'text-blue-600' : 'text-slate-400'}`}
        >
          <div className={`${activeTab === 'sudah_tayang' ? 'bg-blue-100 p-1.5 rounded-xl' : 'p-1.5'}`}>
            <CheckCircle size={20} />
          </div>
          <span className="text-[9px] font-black uppercase tracking-widest">Sudah Tayang</span>
        </button>
        <button 
          onClick={() => {setActiveTab("tulis_berita"); setSearchQuery("");}} 
          className={`flex flex-col items-center gap-1 p-2 w-full transition-colors ${activeTab === 'tulis_berita' ? 'text-amber-500' : 'text-slate-400'}`}
        >
          <div className={`${activeTab === 'tulis_berita' ? 'bg-amber-100 p-1.5 rounded-xl' : 'p-1.5'}`}>
            <PenBox size={18} />
          </div>
          <span className="text-[9px] font-black uppercase tracking-widest">Tulis</span>
        </button>
        <button 
          onClick={() => {setActiveTab("profil"); setSearchQuery("");}} 
          className={`flex flex-col items-center gap-1 p-2 w-full transition-colors ${activeTab === 'profil' ? 'text-purple-600' : 'text-slate-400'}`}
        >
          <div className={`${activeTab === 'profil' ? 'bg-purple-100 p-1.5 rounded-xl' : 'p-1.5'}`}>
            <UserCircle size={18} />
          </div>
          <span className="text-[9px] font-black uppercase tracking-widest">Profil</span>
        </button>
      </nav>

    </div>
  );
}