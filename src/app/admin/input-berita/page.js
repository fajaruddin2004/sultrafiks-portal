"use client";
import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { 
  Send, Image as ImageIcon, Link as LinkIcon, 
  Quote, Type, Eye, Settings, UploadCloud, Info, 
  User, LogOut, ChevronDown, CheckCircle, FileX, Clock,
  X, Edit3, MessageSquareWarning, AlertCircle
} from 'lucide-react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';

export default function WorkspaceWartawan() {
  const { profile, user } = useAuth(); 
  const router = useRouter();
  const contentRef = useRef(null);
  const dropdownRef = useRef(null);
  
  const [loading, setLoading] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [preview, setPreview] = useState(null);
  
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [myNewsStats, setMyNewsStats] = useState({ published: 0, rejected: 0, pending: 0 });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false); 

  const [modalFilter, setModalFilter] = useState('');
  const [modalNews, setModalNews] = useState([]);
  const [isModalLoading, setIsModalLoading] = useState(false);
  
  const [revisedNewsList, setRevisedNewsList] = useState([]);
  
  const [form, setForm] = useState({
    id: null, 
    title: '',
    content: '',
    photo_source: '', 
    photo_caption: '',
    category: 'Kilas Daerah',
    revision_note: '' 
  });

  const categories = [
    'Kilas Daerah', 'Birokrasi', 'Parlemen', 'Delik', 'Arena', 
    'Showbiz', 'Edukes', 'Nusantara', 'Ruang Publik'
  ];

  useEffect(() => {
    if (user) fetchMyNewsStats();
  }, [user]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [dropdownRef]);

  const fetchMyNewsStats = async () => {
    try {
      const { data, error } = await supabase
        .from('news')
        .select('*')
        .eq('author_id', user.id) 
        .order('created_at', { ascending: false });
        
      if (!error && data) {
        const stats = { published: 0, rejected: 0, pending: 0 };
        const revisions = [];

        data.forEach(item => {
          if (item.status === 'published') stats.published++;
          else if (item.status === 'rejected' || item.status === 'revised') {
            stats.rejected++;
            revisions.push(item); 
          }
          else stats.pending++; 
        });
        
        setMyNewsStats(stats);
        setRevisedNewsList(revisions); 
      }
    } catch (err) {
      console.error("Gagal ambil statistik:", err);
    }
  };

  const openNewsModal = async (statusLabel) => {
    setIsDropdownOpen(false);
    setIsModalOpen(true);
    setModalFilter(statusLabel);
    setIsModalLoading(true);

    let dbStatus = [];
    if (statusLabel === 'Di-ACC Tayang') dbStatus = ['published'];
    else if (statusLabel === 'Ditolak / Revisi') dbStatus = ['rejected', 'revised'];
    else dbStatus = ['draft', 'waiting_review', 'pending'];

    try {
      const { data, error } = await supabase
        .from('news')
        .select('*')
        .eq('author_id', user.id)
        .in('status', dbStatus)
        .order('created_at', { ascending: false });

      if (!error && data) setModalNews(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsModalLoading(false);
    }
  };

  const handleEditNews = (newsItem) => {
    setForm({
      id: newsItem.id,
      title: newsItem.title,
      content: newsItem.content,
      photo_source: newsItem.photo_source || '',
      photo_caption: newsItem.photo_caption || '',
      category: newsItem.category || 'Kilas Daerah',
      revision_note: newsItem.revision_note || '' 
    });
    setPreview(newsItem.image_url); 
    setImageFile(null); 
    setIsModalOpen(false); 
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const insertQuote = () => {
    const quoteText = '\n\n> "Masukkan kutipan narasumber di sini..."\n> — Nama Narasumber\n\n';
    setForm(prev => ({ ...prev, content: prev.content + quoteText }));
    if (contentRef.current) contentRef.current.focus();
  };

  const handleLogout = async () => {
    try {
      supabase.auth.signOut().catch(() => {});
      localStorage.clear();
      sessionStorage.clear();
      window.location.replace('/admin/login');
    } catch (error) {
      console.error("Error saat logout:", error);
      window.location.replace('/admin/login');
    }
  };

  // 🔥 FUNGSI SUBMIT SUPER KETAT & ANTI SILENT-FAILURE 🔥
  const handleSubmit = async (e) => {
    e.preventDefault();

    const currentUserId = user?.id || profile?.id;
    if (!currentUserId) return alert("Identitas profil belum termuat. Tunggu sebentar Bos!");
    if (!form.title || !form.content) return alert("Judul dan isi berita wajib diisi, Bos!");
    
    setLoading(true);
    
    try {
      let uploadedImageUrl = preview || null; 
      
      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `news-${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('news-images')
          .upload(fileName, imageFile, { cacheControl: '3600', upsert: true });
        
        if (uploadError) throw new Error("Gagal upload foto. Cek Storage Supabase.");
        
        const { data: urlData } = supabase.storage.from('news-images').getPublicUrl(fileName);
        uploadedImageUrl = urlData.publicUrl;
      }
      
      // 🔥 PISAHKAN LOGIKA PAYLOAD UNTUK UPDATE DAN INSERT 🔥
      const payloadUpdate = {
        title: form.title,
        content: form.content,
        category: form.category,
        status: 'waiting_review', // Wajib berubah jadi ini agar masuk ke Redaktur!
        revision_note: ""         // Hapus catatan redaktur setelah direvisi
      };

      if (uploadedImageUrl) { payloadUpdate.image_url = uploadedImageUrl; }
      if (form.photo_source) { payloadUpdate.photo_source = form.photo_source.trim(); }
      if (form.photo_caption) { payloadUpdate.photo_caption = form.photo_caption.trim(); }

      if (form.id) {
        // --- JALUR REVISI (UPDATE) ---
        const { data, error } = await supabase
          .from('news')
          .update(payloadUpdate)
          .eq('id', form.id)
          .select(); // Memaksa Supabase mengembalikan data yang diubah

        if (error) throw new Error(error.message);
        
        // Detektor Silent Failure: Jika panjang data 0, berarti Database gagal menimpa!
        if (!data || data.length === 0) {
           throw new Error("Gagal menimpa data! Database menolak update. Pastikan ID berita valid.");
        }

        alert("Gacor! Berita Revisi berhasil dikirim ulang ke Redaksi.");
        
      } else {
        // --- JALUR BERITA BARU (INSERT) ---
        const payloadInsert = {
            ...payloadUpdate,
            author_id: currentUserId,
            is_headline: false,
            views: 0,
            likes_count: 0
        };

        const { data, error } = await supabase
          .from('news')
          .insert([payloadInsert])
          .select();

        if (error) throw new Error(error.message);
        if (!data || data.length === 0) throw new Error("Gagal membuat berita baru!");

        alert("Gacor Bos! Berita Baru berhasil masuk ke Meja Redaksi.");
      }

      // Reset semua form setelah 100% sukses
      setForm({ id: null, title: '', content: '', photo_source: '', photo_caption: '', category: 'Kilas Daerah', revision_note: '' });
      setPreview(null);
      setImageFile(null);
      
      // Tarik ulang status berita agar Kotak Peringatan Revisi langsung hilang
      await fetchMyNewsStats(); 
      
    } catch (err) {
      console.error("🔥 ERROR TERCEGAT:", err);
      alert("⚠️ GAGAL KIRIM:\n" + err.message);
    } finally {
      setLoading(false); 
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans text-slate-800 pb-20 relative overflow-x-hidden">
      
      {/* MODAL PREVIEW BERITA SUNGGUHAN */}
      <AnimatePresence>
        {isPreviewOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-3 md:p-6 bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-4xl rounded-3xl md:rounded-[2.5rem] shadow-2xl flex flex-col max-h-[90vh] overflow-hidden border border-slate-200">
              <div className="px-5 md:px-8 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <h2 className="text-sm md:text-lg font-black italic uppercase tracking-tight text-slate-900 flex items-center gap-2">
                  <Eye size={20} className="text-blue-600" /> Preview Hasil Berita
                </h2>
                <button onClick={() => setIsPreviewOpen(false)} className="p-2 bg-white hover:bg-red-50 hover:text-red-500 rounded-full text-slate-500 transition-colors shadow-sm border border-slate-200">
                  <X size={20} />
                </button>
              </div>
              
              <div className="p-5 md:p-8 overflow-y-auto flex-1 bg-white">
                <div className="max-w-3xl mx-auto">
                  <span className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-blue-600 bg-blue-50 px-2 py-1 rounded">News / {form.category}</span>
                  <h1 className="text-2xl md:text-4xl font-black leading-tight text-slate-900 mt-4 mb-6 break-words">
                    {form.title || 'Judul Berita Belum Diisi...'}
                  </h1>
                  
                  <div className="w-full aspect-video rounded-2xl md:rounded-3xl bg-slate-100 mb-3 relative overflow-hidden shadow-md border border-slate-100">
                    {preview ? (
                      <img src={preview} className="w-full h-full object-cover" alt="Preview" />
                    ) : (
                      <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400">
                        <ImageIcon size={48} className="mb-2 opacity-50"/>
                        <span className="font-bold text-sm">Belum Ada Foto Terpilih</span>
                      </div>
                    )}
                    
                    {!form.photo_source && preview && (
                       <div className="absolute bottom-3 right-3 flex items-center gap-1.5 opacity-80 z-10">
                          <div className="bg-gradient-to-tr from-blue-600 to-blue-400 p-1 rounded text-white shadow-sm shrink-0">
                              <Zap className="w-3 h-3 fill-white text-white" />
                          </div>
                          <span className="text-white text-sm font-black italic tracking-tighter shadow-black drop-shadow-md">
                              SULTRA<span className="text-blue-400">FIKS</span>
                          </span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex justify-between text-[10px] md:text-xs text-slate-500 italic mb-8 border-b border-slate-100 pb-6">
                    <p className="text-left w-2/3 break-words">{form.photo_caption || 'Caption foto belum ditulis...'}</p>
                    {form.photo_source && <p className="font-bold uppercase tracking-widest text-right break-words">Sumber: {form.photo_source}</p>}
                  </div>

                  <article className="prose max-w-none text-slate-800 leading-relaxed text-sm md:text-base text-justify whitespace-pre-wrap break-words">
                    {form.content ? form.content.split('\n').map((p, i) => {
                        if (!p.trim()) return null;
                        if (p.trim().startsWith('>')) {
                            return (
                                <div key={i} className="my-6 pl-4 md:pl-5 border-l-[3px] border-blue-600 py-3 rounded-r-xl bg-blue-50/30">
                                    <p className="italic font-semibold leading-relaxed text-slate-700 break-words">
                                        <span className="text-blue-600 mr-1 text-xl leading-none">“</span>
                                        {p.trim().substring(1).trim()}
                                        <span className="text-blue-600 ml-1 text-xl leading-none">”</span>
                                    </p>
                                </div>
                            );
                        }
                        return <p key={i} className="mb-4 break-words">{p}</p>;
                    }) : <div className="text-slate-400 italic">Isi berita masih kosong, silakan tulis di form editor...</div>}
                  </article>
                </div>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* POP-UP MODAL DAFTAR BERITA SAYA */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-4xl rounded-3xl md:rounded-[2.5rem] shadow-2xl flex flex-col max-h-[85vh] overflow-hidden border border-slate-200">
            <div className="px-5 md:px-8 py-4 md:py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div>
                <h2 className="text-xl md:text-2xl font-black italic uppercase tracking-tight text-slate-900">
                  {modalFilter}
                </h2>
                <p className="text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">Laporan Jurnalistik Anda</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-2 md:p-3 bg-white hover:bg-slate-100 rounded-full text-slate-500 transition-colors shadow-sm border border-slate-200">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-5 md:p-8 overflow-y-auto flex-1 bg-[#F8FAFC]">
              {isModalLoading ? (
                <div className="py-20 text-center text-slate-400 font-bold italic animate-pulse text-sm">Menarik data dari satelit SultraFiks...</div>
              ) : modalNews.length === 0 ? (
                <div className="py-20 text-center border-2 border-dashed border-slate-200 rounded-3xl">
                  <p className="text-slate-500 font-bold text-sm">Belum ada berita di kategori ini.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4 md:gap-6">
                  {modalNews.map((item) => (
                    <div key={item.id} className="bg-white rounded-2xl md:rounded-3xl p-4 md:p-6 shadow-sm border border-slate-200 flex flex-col md:flex-row gap-4 md:gap-6 hover:shadow-md transition-shadow">
                      <div className="relative w-full md:w-48 aspect-video rounded-xl md:rounded-2xl overflow-hidden bg-slate-100 shrink-0 border border-slate-200">
                        {item.image_url ? (
                          <Image src={item.image_url} fill className="object-cover" alt="Thumb" unoptimized/>
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center"><ImageIcon className="text-slate-300" size={32}/></div>
                        )}
                      </div>
                      
                      <div className="flex-1 flex flex-col justify-between">
                        <div>
                          <span className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-blue-600 bg-blue-50 px-2 md:px-3 py-1 rounded-full">{item.category}</span>
                          {item.is_headline && <span className="ml-2 text-[9px] md:text-[10px] font-black uppercase tracking-widest text-red-600 bg-red-50 px-2 md:px-3 py-1 rounded-full">Headline</span>}
                          <h3 className="text-base md:text-lg font-black leading-tight text-slate-900 mt-2 md:mt-3 line-clamp-2">{item.title}</h3>
                          <p className="text-xs md:text-sm text-slate-500 mt-2 line-clamp-2">{item.content}</p>
                        </div>
                        
                        {(item.status === 'rejected' || item.status === 'revised') && (
                          <div className="mt-4 p-3 md:p-4 bg-red-50 border border-red-100 rounded-xl md:rounded-2xl flex flex-col md:flex-row gap-3 md:gap-4 justify-between items-start md:items-center">
                            <div className="flex gap-2 md:gap-3 text-red-700 text-xs md:text-sm">
                              <MessageSquareWarning size={16} className="shrink-0 mt-0.5" />
                              <p className="font-medium italic">"{item.revision_note || 'Tidak ada catatan spesifik dari Redaktur.'}"</p>
                            </div>
                            <button 
                              onClick={() => handleEditNews(item)}
                              className="w-full md:w-auto flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 md:px-5 py-2 md:py-2.5 rounded-lg md:rounded-xl text-[10px] md:text-xs font-black uppercase tracking-widest transition-all shadow-lg shadow-red-500/20"
                            >
                              <Edit3 size={14} /> Revisi Sekarang
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* --- NAVBAR ATAS YANG SUDAH RESPONSIF --- */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 px-4 md:px-6 py-3 md:py-4 flex items-center justify-between shadow-sm gap-2 md:gap-4">
        
        <div className="flex items-center gap-2 md:gap-4 shrink-0">
          <div className="w-8 h-8 md:w-10 md:h-10 bg-blue-600 rounded-lg md:rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20 shrink-0">
            <Send className="text-white w-4 h-4 md:w-5 md:h-5" />
          </div>
          <div className="hidden sm:block">
            <h1 className="font-black italic text-sm md:text-xl tracking-tighter text-blue-600 uppercase leading-none">
              <span className="hidden md:inline">ADMIN </span>SULTRAFIKS
            </h1>
            <p className="hidden md:block text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Workspace Wartawan</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2 md:gap-4 shrink-0 ml-auto">
          
          <div className="relative shrink-0" ref={dropdownRef}>
            <button 
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-2 md:gap-3 bg-white hover:bg-slate-50 border border-slate-200 p-1 md:p-1.5 md:pr-4 rounded-full shadow-sm transition-all"
            >
              <div className="relative w-7 h-7 md:w-8 md:h-8 rounded-full overflow-hidden bg-slate-100 border border-slate-200 shadow-inner flex items-center justify-center shrink-0">
                {profile?.avatar_url ? (
                  <Image src={profile.avatar_url} fill className="object-cover" alt="Avatar" unoptimized />
                ) : (
                  <User className="text-slate-400 w-3 h-3 md:w-4 md:h-4" />
                )}
              </div>
              <div className="text-left hidden md:block">
                <p className="text-[9px] font-black text-blue-600 uppercase leading-none mb-0.5">
                  {profile?.role || 'Wartawan'}
                </p>
                <p className="text-xs font-bold text-slate-800 leading-none truncate max-w-[130px]">
                  {profile?.full_name || 'Menunggu Profil...'}
                </p>
              </div>
              <ChevronDown size={14} className={`hidden md:block text-slate-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {isDropdownOpen && (
              <div className="absolute right-0 mt-3 w-56 md:w-64 bg-white rounded-2xl md:rounded-3xl shadow-2xl shadow-slate-200/50 border border-slate-100 overflow-hidden animate-in slide-in-from-top-2 fade-in duration-200">
                <div className="p-4 md:p-5 border-b border-slate-100 bg-slate-50/50">
                  <p className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3 md:mb-4">Status Berita Saya</p>
                  
                  <div className="space-y-2">
                    <button onClick={() => openNewsModal('Di-ACC Tayang')} className="w-full flex items-center justify-between text-xs md:text-sm font-bold text-slate-700 hover:bg-white p-2 rounded-xl transition-all border border-transparent hover:border-slate-200 hover:shadow-sm">
                      <span className="flex items-center gap-2"><CheckCircle size={14} className="text-green-500" /> Di-ACC Tayang</span>
                      <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-full text-[10px] md:text-xs">{myNewsStats.published}</span>
                    </button>
                    
                    <button onClick={() => openNewsModal('Menunggu Review')} className="w-full flex items-center justify-between text-xs md:text-sm font-bold text-slate-700 hover:bg-white p-2 rounded-xl transition-all border border-transparent hover:border-slate-200 hover:shadow-sm">
                      <span className="flex items-center gap-2"><Clock size={14} className="text-amber-500" /> Menunggu Review</span>
                      <span className="bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full text-[10px] md:text-xs">{myNewsStats.pending}</span>
                    </button>
                    
                    <button onClick={() => openNewsModal('Ditolak / Revisi')} className="w-full flex items-center justify-between text-xs md:text-sm font-bold text-slate-700 hover:bg-white p-2 rounded-xl transition-all border border-transparent hover:border-slate-200 hover:shadow-sm">
                      <span className="flex items-center gap-2"><FileX size={14} className="text-red-500" /> Ditolak / Revisi</span>
                      <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded-full text-[10px] md:text-xs animate-pulse">{myNewsStats.rejected}</span>
                    </button>
                  </div>
                </div>
                
                <div className="p-2">
                  <button 
                    onClick={handleLogout}
                    className="w-full flex items-center justify-center md:justify-start gap-2 md:gap-3 px-3 md:px-4 py-2.5 md:py-3 text-xs md:text-sm font-bold text-red-600 hover:bg-red-50 rounded-xl md:rounded-2xl transition-colors"
                  >
                    <div className="w-6 h-6 md:w-8 md:h-8 rounded-full bg-red-100 flex items-center justify-center">
                      <LogOut size={12} className="md:w-3.5 md:h-3.5" />
                    </div>
                    Keluar Akun
                  </button>
                </div>
              </div>
            )}
          </div>

          <button 
            onClick={() => setIsPreviewOpen(true)}
            className="flex items-center gap-2 px-3 py-2 text-sm font-bold text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
          >
            <Eye size={18} /> <span className="hidden md:inline">Preview</span>
          </button>
          
          <button 
            onClick={handleSubmit}
            disabled={loading}
            className={`flex items-center justify-center gap-1.5 md:gap-2 text-white px-4 md:px-6 py-2 md:py-2.5 rounded-full font-black italic text-[9px] md:text-xs uppercase tracking-widest shadow-lg transition-all active:scale-95 disabled:opacity-50 shrink-0 ${form.id ? 'bg-amber-500 hover:bg-amber-600 shadow-amber-500/30' : 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/30'}`}
          >
            <span className="hidden sm:inline">{loading ? "MENGIRIM..." : form.id ? "KIRIM REVISI" : "KIRIM KE REDAKSI"}</span>
            <span className="sm:hidden">{loading ? "..." : form.id ? "REVISI" : "KIRIM"}</span>
            <Send size={12} className="md:w-3.5 md:h-3.5" />
          </button>
        </div>
      </header>

      {/* --- KONTEN UTAMA --- */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 mt-6 md:mt-8 grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8">
        
        {/* KOLOM KIRI: Editor Berita */}
        <div className="lg:col-span-8">
          
          {revisedNewsList.length > 0 && !form.id && (
            <div className="bg-red-50 border-2 border-red-200 rounded-3xl md:rounded-[2rem] p-5 md:p-6 shadow-sm mb-6 md:mb-8 relative overflow-hidden animate-in slide-in-from-top-4 fade-in">
              <div className="absolute top-0 right-0 p-4 opacity-5"><AlertCircle size={80} className="md:w-[100px] md:h-[100px]"/></div>
              <h3 className="font-black text-red-800 text-sm md:text-base flex items-center gap-2 mb-4 relative z-10 uppercase tracking-widest">
                <MessageSquareWarning size={18} className="md:w-5 md:h-5" /> ADA {revisedNewsList.length} BERITA YANG HARUS DIREVISI!
              </h3>
              
              <div className="space-y-3 md:space-y-4 relative z-10">
                {revisedNewsList.map((item) => (
                  <div key={item.id} className="bg-white p-4 md:p-5 rounded-2xl border border-red-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 md:gap-4 shadow-sm hover:shadow transition-shadow">
                    <div className="flex-1 w-full">
                      <span className="text-[9px] md:text-[10px] font-black bg-red-100 text-red-600 px-2 py-1 rounded uppercase tracking-widest mb-2 inline-block">Catatan Redaktur</span>
                      <h4 className="font-black text-slate-900 text-sm md:text-base line-clamp-1">{item.title}</h4>
                      <p className="text-xs md:text-sm text-red-700 font-medium italic mt-2 bg-red-50 p-2 md:p-3 rounded-xl">"{item.revision_note || 'Harap perbaiki berita ini sesuai standar jurnalistik.'}"</p>
                    </div>
                    <button 
                      onClick={() => handleEditNews(item)} 
                      className="w-full sm:w-auto px-4 md:px-6 py-2.5 md:py-3 bg-red-600 hover:bg-red-700 text-white text-[10px] md:text-xs font-black uppercase tracking-widest rounded-xl whitespace-nowrap shadow-lg shadow-red-500/20 active:scale-95 transition-all"
                    >
                      Edit Sekarang
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className={`bg-white rounded-3xl md:rounded-[2rem] p-5 md:p-8 shadow-xl shadow-slate-200/50 border min-h-[500px] md:min-h-[700px] flex flex-col transition-colors ${form.id ? 'border-amber-300 ring-2 md:ring-4 ring-amber-50' : 'border-slate-100'}`}>
            
            {/* 🔥 KOTAK REVISI BARU: TAMPILKAN CATATAN REDAKTUR SAAT NGEDIT 🔥 */}
            {form.id && (
              <div className="mb-5 md:mb-6 bg-amber-50 border border-amber-200 p-4 md:p-5 rounded-xl md:rounded-2xl animate-in fade-in shadow-sm">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-amber-200/60 pb-3 mb-3">
                  <div className="flex items-center gap-2 md:gap-3 text-amber-800 font-black text-xs md:text-sm uppercase tracking-widest">
                    <Edit3 size={18} className="animate-pulse shrink-0"/> 
                    <span>Mode Perbaikan Berita</span>
                  </div>
                  <button onClick={() => {setForm({id:null, title:'', content:'', photo_source:'', photo_caption:'', category:'Kilas Daerah', revision_note: ''}); setPreview(null);}} className="text-[10px] md:text-xs bg-amber-200 hover:bg-amber-300 text-amber-900 px-4 py-2 rounded-lg transition-colors font-bold whitespace-nowrap shadow-sm">
                    Batal Edit
                  </button>
                </div>
                
                {/* Kotak Khusus Pesan Redaktur */}
                <div className="bg-white/60 p-3 md:p-4 rounded-lg border border-amber-100">
                  <p className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-red-600 mb-1.5 flex items-center gap-1.5">
                    <MessageSquareWarning size={14} /> Pesan / Catatan Redaktur:
                  </p>
                  <p className="text-xs md:text-sm font-medium text-amber-900 italic leading-relaxed">
                    "{form.revision_note || 'Mohon perbaiki kembali berita ini agar sesuai standar redaksi.'}"
                  </p>
                </div>
              </div>
            )}

            <div className="flex items-center gap-4 md:gap-6 pb-4 md:pb-6 border-b border-slate-100 mb-4 md:mb-6 text-xs md:text-sm font-bold text-slate-500 overflow-x-auto no-scrollbar">
              <button onClick={insertQuote} className="flex items-center gap-1.5 md:gap-2 hover:text-blue-600 transition-colors whitespace-nowrap">
                <Quote size={16} className="md:w-[18px] md:h-[18px]" /> Kutipan
              </button>
              <button className="flex items-center gap-1.5 md:gap-2 hover:text-blue-600 transition-colors whitespace-nowrap">
                <Type size={16} className="md:w-[18px] md:h-[18px]" /> Format Teks
              </button>
            </div>

            <textarea 
              placeholder="Judul Berita Utama..." 
              value={form.title}
              rows={2}
              onChange={(e) => setForm({...form, title: e.target.value})}
              className="w-full text-2xl md:text-4xl font-black text-slate-900 placeholder:text-slate-200 outline-none mb-4 md:mb-6 bg-transparent resize-none leading-tight break-words whitespace-pre-wrap"
            />

            <textarea 
              ref={contentRef}
              placeholder="Mulai menulis berita di sini..."
              value={form.content}
              onChange={(e) => setForm({...form, content: e.target.value})}
              className="w-full flex-1 resize-none text-base md:text-lg text-slate-700 leading-relaxed placeholder:text-slate-300 outline-none bg-transparent break-words whitespace-pre-wrap"
            />
          </div>
        </div>

        {/* KOLOM KANAN: Asset Properties */}
        <div className="lg:col-span-4 space-y-4 md:space-y-6">
          <div className="bg-white rounded-3xl md:rounded-[2rem] p-5 md:p-6 shadow-xl shadow-slate-200/50 border border-slate-100 lg:sticky top-24 md:top-28">
            
            <div className="flex items-center justify-between mb-5 md:mb-8">
              <h3 className="font-black italic text-xs md:text-sm uppercase tracking-widest flex items-center gap-2 text-slate-800">
                <Settings size={16} className="text-blue-600 md:w-[18px] md:h-[18px]" /> PROPERTI BERITA
              </h3>
            </div>

            <div className="space-y-5 md:space-y-6">
              <div>
                <label className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Kategori Utama</label>
                <select 
                  value={form.category}
                  onChange={(e) => setForm({...form, category: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-100 rounded-xl md:rounded-2xl px-3 md:px-4 py-2.5 md:py-3 text-xs md:text-sm font-bold text-slate-700 outline-none focus:ring-2 ring-blue-500/20 appearance-none cursor-pointer"
                >
                  {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
              </div>

              <div>
                <label className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Thumbnail Berita</label>
                <label className="relative block w-full aspect-video rounded-xl md:rounded-2xl bg-slate-50 border-2 border-dashed border-slate-200 overflow-hidden cursor-pointer hover:border-blue-400 hover:bg-blue-50/50 transition-all group">
                  {preview ? (
                    <Image src={preview} fill className="object-cover" alt="Preview" unoptimized />
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 group-hover:text-blue-500">
                      <UploadCloud size={28} className="md:w-8 md:h-8" />
                      <span className="text-[10px] md:text-xs font-bold mt-2">Pilih Foto</span>
                    </div>
                  )}
                  <input type="file" className="hidden" accept="image/*" onChange={(e) => {
                    const file = e.target.files[0];
                    if(file) { setImageFile(file); setPreview(URL.createObjectURL(file)); }
                  }} />
                </label>
              </div>

              <div>
                <label className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5 md:mb-2 flex items-center gap-1">
                  <ImageIcon size={10}/> Sumber Foto
                </label>
                <input 
                  type="text" 
                  value={form.photo_source}
                  placeholder="Kosongkan jika foto asli jepretan sendiri"
                  onChange={(e) => setForm({...form, photo_source: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-100 rounded-lg md:rounded-xl px-3 md:px-4 py-2.5 md:py-3 text-[10px] md:text-xs font-bold text-slate-700 outline-none focus:ring-2 ring-blue-500/20"
                />
              </div>

              <div>
                <label className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5 md:mb-2 flex items-center gap-1"><Info size={10}/> Penjelasan Foto (Caption)</label>
                <textarea 
                  value={form.photo_caption}
                  placeholder="Deskripsikan momen di dalam foto..."
                  onChange={(e) => setForm({...form, photo_caption: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-100 rounded-xl md:rounded-2xl px-3 md:px-4 py-2.5 md:py-3 text-[10px] md:text-xs font-medium text-slate-700 outline-none focus:ring-2 ring-blue-500/20 resize-none h-[60px] md:h-[80px]"
                />
              </div>

              <div className="pt-4 md:pt-6 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-slate-400">Status</span>
                <span className={`px-2 md:px-3 py-1 rounded-full text-[9px] md:text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 transition-all ${loading ? 'bg-blue-100 text-blue-700' : form.id ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'}`}>
                  <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${loading ? 'bg-blue-500' : form.id ? 'bg-amber-500' : 'bg-slate-400'}`}/> 
                  {loading ? 'Memproses...' : form.id ? 'Mode Revisi' : 'Draft Baru'}
                </span>
              </div>

            </div>
          </div>
        </div>

      </div>
    </div>
  );
}