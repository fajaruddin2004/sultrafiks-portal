"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase"; 
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { LogOut, CheckCircle, XCircle, Clock, FileText, Send, Edit3, AlertTriangle, User, X, MessageSquareWarning, ImageIcon, LinkIcon, Info, Star, EyeOff } from "lucide-react";
import Image from "next/image";

export default function RedakturPage() {
  const { user, profile, loading: authLoading } = useAuth();
  const router = useRouter();

  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  
  const [activeTab, setActiveTab] = useState("antrean");

  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [reviewNote, setReviewNote] = useState("");
  const [editForm, setEditForm] = useState({
    id: null,
    title: "",
    content: "",
    category: "Pemerintah",
    photo_source: "",
    photo_caption: "",
    news_link: "",
    image_url: null,
    author: null,
    is_headline: false
  });

  const categories = [
    'Pemerintah', 'Travel', 'Food', 'Teknologi', 
    'Politik', 'Ekonomi', 'Budaya', 'Otomotif', 'Entertainment', 'Opini', 'Loker'
  ];

  const fetchNews = async (isSilent = false) => {
    try {
      if (!isSilent) setLoading(true);
      
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

      if (error) throw error;
      setNews(data || []);
    } catch (error) {
      console.error("Error fetching news:", error);
    } finally {
      if (!isSilent) setLoading(false);
    }
  };

  useEffect(() => {
    if (authLoading && !profile) return;
    if (!user || profile?.role?.toLowerCase() !== "redaktur") return;

    fetchNews();

    const newsSubscription = supabase
      .channel(`live-news-${activeTab}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'news' },
        (payload) => {
          fetchNews(true); 
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(newsSubscription);
    };
  }, [authLoading, user, profile, activeTab]);

  const handleOpenEditor = (newsItem) => {
    setEditForm({
      id: newsItem.id,
      title: newsItem.title,
      content: newsItem.content,
      category: newsItem.category || "Pemerintah",
      photo_source: newsItem.photo_source || "",
      photo_caption: newsItem.photo_caption || "",
      news_link: newsItem.news_link || "",
      image_url: newsItem.image_url || null,
      author: newsItem.profiles || null,
      is_headline: newsItem.is_headline || false
    });
    setReviewNote(newsItem.revision_note || ""); 
    setIsEditorOpen(true);
  };

  const handleSaveAndPublish = async () => {
    if (!confirm("Yakin ingin menayangkan berita ini dengan editan Anda?")) return;
    
    setActionLoading(true);
    try {
      const { data, error } = await supabase
        .from("news")
        .update({ 
          title: editForm.title,
          content: editForm.content,
          category: editForm.category,
          photo_source: editForm.photo_source,
          photo_caption: editForm.photo_caption,
          news_link: editForm.news_link,
          is_headline: editForm.is_headline,
          status: "published",
          revision_note: "Berita telah disempurnakan dan ditayangkan oleh Redaktur." 
        })
        .eq("id", editForm.id)
        .select(); 

      if (error) throw error;
      if (!data || data.length === 0) throw new Error("Akses ditolak oleh Database! Anda belum membuat Policy UPDATE di tabel news Supabase.");

      alert("Gacor! Berita editan Anda berhasil ditayangkan ke publik.");
      setIsEditorOpen(false);
      fetchNews(true); 
    } catch (error) {
      alert("GAGAL TAYANG:\n" + error.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleSaveAndRevise = async () => {
    if (!reviewNote.trim()) {
      alert("Mohon isi Catatan Revisi agar wartawan tahu apa yang harus diperbaiki!");
      return;
    }

    setActionLoading(true);
    try {
      const { data, error } = await supabase
        .from("news")
        .update({ 
          title: editForm.title,
          content: editForm.content,
          category: editForm.category,
          photo_source: editForm.photo_source,
          photo_caption: editForm.photo_caption,
          news_link: editForm.news_link,
          is_headline: editForm.is_headline,
          status: "revised", 
          revision_note: reviewNote 
        })
        .eq("id", editForm.id)
        .select();

      if (error) throw error;
      if (!data || data.length === 0) throw new Error("Akses ditolak oleh Database! Buat Policy UPDATE di Supabase.");

      alert("Draft editan Anda dan Catatan Revisi berhasil dikirim ke meja Wartawan!");
      setIsEditorOpen(false);
      fetchNews(true); 
    } catch (error) {
      alert("GAGAL REVISI:\n" + error.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (newsId) => {
    if (!confirm("PERINGATAN: Yakin ingin menolak berita ini sepenuhnya?")) return;

    setActionLoading(true);
    try {
      const { data, error } = await supabase
        .from("news")
        .update({ 
          status: "rejected",
          revision_note: "DITOLAK TOTAL: Berita tidak layak tayang.",
          is_headline: false
        })
        .eq("id", newsId)
        .select();

      if (error) throw error;
      if (!data || data.length === 0) throw new Error("Akses ditolak oleh Database! Buat Policy UPDATE di Supabase.");

      alert("Berita resmi ditolak!");
      fetchNews(true); 
    } catch (error) {
      alert("GAGAL MENOLAK:\n" + error.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleUnpublish = async (newsId) => {
    if (!confirm("Tarik kembali berita ini dari Publik? Statusnya akan menjadi Menunggu Review lagi.")) return;

    setActionLoading(true);
    try {
      const { data, error } = await supabase
        .from("news")
        .update({ 
          status: "waiting_review",
          is_headline: false
        })
        .eq("id", newsId)
        .select();

      if (error) throw error;
      if (!data || data.length === 0) throw new Error("Akses ditolak oleh Database! Buat Policy UPDATE di Supabase.");

      alert("Berita berhasil ditarik dari publik!");
      fetchNews(true); 
    } catch (error) {
      alert("GAGAL MENARIK BERITA:\n" + error.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      supabase.auth.signOut().catch(() => {});
      localStorage.clear();
      sessionStorage.clear();
      window.location.replace('/admin/login');
    } catch (error) {
      window.location.replace('/admin/login');
    }
  };

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

  if (profile.role?.toLowerCase() !== "redaktur") {
    return (
      <div className="min-h-screen bg-[#0F172A] flex flex-col items-center justify-center p-6 text-center">
        <XCircle size={48} className="text-red-500 mb-4" />
        <h1 className="text-white text-2xl font-black mb-2">Salah Kamar, Bos!</h1>
        <p className="text-slate-400 text-sm mb-6">Akun Anda terdaftar sebagai <b>{profile.role}</b>.</p>
        <button onClick={() => router.replace("/admin/input-berita")} className="px-8 py-4 bg-blue-600 text-white font-black uppercase rounded-2xl text-xs shadow-lg">Buka Workspace Wartawan</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col md:flex-row font-sans relative overflow-x-hidden">
      
      {/* --- MODAL EDITOR (RESPONSIF) --- */}
      {isEditorOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
          <div className="bg-white w-full max-w-7xl h-[95vh] md:h-auto md:min-h-[90vh] rounded-3xl md:rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden my-auto border-2 md:border-4 border-amber-200/50">
            {/* Header Modal */}
            <div className="px-4 md:px-8 py-4 md:py-5 border-b border-slate-100 flex items-center justify-between bg-amber-50/50 sticky top-0 z-10">
              <div className="flex items-center gap-3 md:gap-4">
                <div className="w-10 h-10 md:w-12 md:h-12 bg-amber-100 text-amber-600 rounded-xl md:rounded-2xl flex items-center justify-center shadow-inner shrink-0">
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

            {/* Isi Modal */}
            <div className="flex-1 p-4 md:p-8 bg-[#F8FAFC] grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-8 overflow-y-auto">
              
              {/* Kolom Kiri: Editor Teks */}
              <div className="lg:col-span-8 bg-white p-5 md:p-8 rounded-2xl md:rounded-[2rem] shadow-sm border border-slate-200 flex flex-col min-h-[400px]">
                <div className="mb-4">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Judul Berita Utama</label>
                  <input 
                    type="text" 
                    value={editForm.title}
                    onChange={(e) => setEditForm({...editForm, title: e.target.value})}
                    className="w-full text-xl md:text-3xl font-black text-slate-900 placeholder:text-slate-200 outline-none pb-2 md:pb-4 border-b border-slate-100 bg-transparent focus:border-amber-400 transition-colors"
                  />
                </div>
                <div className="flex-1 flex flex-col mt-2 md:mt-4">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Isi Berita Lengkap</label>
                  <textarea 
                    value={editForm.content}
                    onChange={(e) => setEditForm({...editForm, content: e.target.value})}
                    className="w-full flex-1 resize-none text-base md:text-lg text-slate-700 leading-relaxed outline-none bg-transparent min-h-[300px] md:min-h-[400px]"
                  />
                </div>
              </div>

              {/* Kolom Kanan: Properti & Aksi */}
              <div className="lg:col-span-4 space-y-4 md:space-y-6">
                
                {/* Info Wartawan */}
                <div className="bg-blue-50 p-4 md:p-5 rounded-2xl md:rounded-[2rem] border border-blue-100 flex items-center gap-3 md:gap-4 shadow-sm">
                  <div className="relative w-12 h-12 md:w-14 md:h-14 rounded-full overflow-hidden bg-blue-200 border-2 border-white shadow flex items-center justify-center text-blue-500 shrink-0">
                    {editForm.author?.avatar_url ? (
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

                {/* Form Properti */}
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

                  {/* Toggle Headline */}
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
                    <div className="relative w-full aspect-video rounded-xl md:rounded-2xl bg-slate-100 overflow-hidden border border-slate-200">
                      {editForm.image_url ? (
                        <Image src={editForm.image_url} fill className="object-cover" alt="Thumbnail" unoptimized />
                      ) : (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-300">
                          <ImageIcon size={24} className="mb-1 md:mb-2 md:w-8 md:h-8" />
                          <span className="text-[10px] md:text-xs font-bold">Tanpa Foto</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                    <div>
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1 md:mb-2 flex items-center gap-1"><ImageIcon size={10}/> Sumber</label>
                      <input 
                        type="text" 
                        value={editForm.photo_source}
                        onChange={(e) => setEditForm({...editForm, photo_source: e.target.value})}
                        className="w-full bg-slate-50 border border-slate-100 rounded-lg md:rounded-xl px-3 py-2 text-[10px] md:text-xs font-bold text-slate-700 outline-none focus:ring-2 ring-amber-500/20"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1 md:mb-2 flex items-center gap-1"><LinkIcon size={10}/> Link</label>
                      <input 
                        type="text" 
                        value={editForm.news_link}
                        onChange={(e) => setEditForm({...editForm, news_link: e.target.value})}
                        className="w-full bg-slate-50 border border-slate-100 rounded-lg md:rounded-xl px-3 py-2 text-[10px] md:text-xs font-bold text-slate-700 outline-none focus:ring-2 ring-amber-500/20"
                      />
                    </div>
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

                {/* Catatan Revisi */}
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

                {/* Aksi Tombol */}
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
      
      {/* --- HEADER MOBILE --- */}
      <header className="md:hidden bg-[#0F172A] text-white p-4 flex justify-between items-center shadow-md sticky top-0 z-40">
        <div className="flex items-center gap-2 uppercase italic font-black text-lg tracking-tighter">
          SULTRAFIKS<span className="text-blue-500">ADMIN</span>
        </div>
        <button onClick={handleLogout} className="p-2 text-red-400 hover:bg-white/10 rounded-lg transition-colors">
          <LogOut size={20} />
        </button>
      </header>

      {/* --- SIDEBAR DESKTOP --- */}
      <aside className="hidden md:flex w-64 bg-[#0F172A] text-white flex-col p-6 sticky top-0 h-screen shrink-0">
        <div className="flex items-center gap-3 mb-12 uppercase italic font-black text-xl tracking-tighter">
          SULTRAFIKS<span className="text-blue-500">ADMIN</span>
        </div>
        <nav className="flex-1 space-y-2">
          <div 
            onClick={() => setActiveTab("antrean")}
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
        </nav>
        <div className="mt-auto pt-6 border-t border-white/10">
          <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/5 mb-4 border border-white/10">
            <div className="w-10 h-10 rounded-xl overflow-hidden relative bg-red-600 flex items-center justify-center font-black uppercase text-xl shrink-0">
              {profile?.avatar_url ? (
                <Image src={profile.avatar_url} fill className="object-cover" alt="Profile" unoptimized />
              ) : (
                profile?.full_name?.charAt(0) || "R"
              )}
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-black uppercase truncate text-white">
                {profile?.full_name || "Redaktur"}
              </p>
              <p className="text-[9px] text-red-400 font-bold uppercase tracking-widest mt-0.5">Meja Redaksi</p>
            </div>
          </div>
          <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 py-3 text-red-400 text-xs font-black uppercase tracking-widest hover:bg-red-50/10 rounded-xl transition-colors">
            <LogOut size={16} /> Keluar Akun
          </button>
        </div>
      </aside>

      {/* --- KONTEN UTAMA --- */}
      <main className="flex-1 p-4 md:p-10 pb-24 md:pb-10 overflow-y-auto w-full">
        <div className="max-w-5xl mx-auto">
          <header className="mb-6 md:mb-10 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <h2 className="text-xl md:text-3xl font-black uppercase italic tracking-tighter text-slate-900 leading-none">
                {activeTab === "antrean" ? "Meja Redaksi" : "Berita Publik"}
              </h2>
              <p className="text-slate-400 text-xs md:text-sm font-bold mt-1 md:mt-2">
                {activeTab === "antrean" ? "Verifikasi dan publikasi berita dari wartawan di lapangan." : "Monitoring berita yang sudah terbit di halaman pengguna."}
              </p>
            </div>
            <div className="inline-flex items-center self-start sm:self-auto gap-2 px-3 py-1.5 md:px-4 md:py-2 bg-green-100 text-green-700 rounded-full text-[9px] md:text-xs font-black uppercase tracking-widest shadow-sm shrink-0">
              <div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-green-500 rounded-full animate-pulse"/> LIVE MONITORING
            </div>
          </header>

          {loading ? (
            <div className="text-center py-20 flex flex-col items-center justify-center text-slate-400">
              <Clock className="w-6 h-6 md:w-8 md:h-8 animate-spin mb-3 md:mb-4" />
              <p className="font-bold uppercase tracking-widest text-[10px] md:text-xs">Menarik Data Berita...</p>
            </div>
          ) : news.length === 0 ? (
            <div className="bg-white p-10 md:p-20 rounded-3xl md:rounded-[3rem] text-center border-2 border-dashed border-slate-200">
              <div className="w-16 h-16 md:w-20 md:h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 md:mb-6">
                <CheckCircle className="text-slate-300 w-6 h-6 md:w-8 md:h-8" />
              </div>
              <h3 className="text-base md:text-lg font-black text-slate-900 mb-2">Data Kosong!</h3>
              <p className="text-slate-500 font-medium text-xs md:text-sm">Belum ada berita di kategori ini.</p>
            </div>
          ) : (
            <div className="space-y-4 md:space-y-6">
              {news.map((item) => (
                <div key={item.id} className="bg-white p-4 md:p-6 rounded-3xl md:rounded-[2rem] shadow-sm border border-slate-100 flex flex-col sm:flex-row gap-4 md:gap-8 hover:shadow-xl hover:shadow-slate-200/50 transition-all group relative">
                  
                  {/* Thumbnail Berita List */}
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
                  
                  {/* Info Berita List */}
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2 md:gap-3 mb-2 md:mb-3 text-[9px] md:text-[10px] font-black uppercase tracking-widest text-slate-400">
                        <span className="text-blue-600 bg-blue-50 px-2 py-1 rounded flex items-center gap-1"><User size={10} className="md:w-3 md:h-3"/> {item.profiles?.full_name || 'Wartawan'}</span>
                        <span className="hidden sm:inline">•</span>
                        <span>{new Date(item.created_at).toLocaleString("id-ID", { dateStyle: 'medium', timeStyle: 'short' })}</span>
                      </div>
                      <h3 className="text-base md:text-xl font-black text-slate-900 mb-2 md:mb-3 leading-tight md:pr-10 line-clamp-2 md:line-clamp-none">{item.title}</h3>
                      <p className="text-xs md:text-sm text-slate-600 line-clamp-2 md:line-clamp-3 leading-relaxed">{item.content}</p>
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
                            <EyeOff size={14} className="md:w-4 md:h-4"/> Turunkan Berita
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

      {/* --- NAV BAWAH MOBILE --- */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 flex items-center justify-around p-2 pb-safe z-40 shadow-[0_-10px_30px_rgba(0,0,0,0.05)]">
        <button 
          onClick={() => setActiveTab("antrean")} 
          className={`flex flex-col items-center gap-1 p-2 w-full transition-colors ${activeTab === 'antrean' ? 'text-blue-600' : 'text-slate-400'}`}
        >
          <div className={`${activeTab === 'antrean' ? 'bg-blue-100 p-1.5 rounded-xl' : 'p-1.5'}`}>
            <FileText size={20} />
          </div>
          <span className="text-[10px] font-black uppercase tracking-widest">Antrean</span>
        </button>
        <button 
          onClick={() => setActiveTab("sudah_tayang")} 
          className={`flex flex-col items-center gap-1 p-2 w-full transition-colors ${activeTab === 'sudah_tayang' ? 'text-blue-600' : 'text-slate-400'}`}
        >
          <div className={`${activeTab === 'sudah_tayang' ? 'bg-blue-100 p-1.5 rounded-xl' : 'p-1.5'}`}>
            <CheckCircle size={20} />
          </div>
          <span className="text-[10px] font-black uppercase tracking-widest">Terbit</span>
        </button>
      </nav>

    </div>
  );
}