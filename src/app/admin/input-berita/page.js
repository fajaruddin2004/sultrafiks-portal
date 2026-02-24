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
  const [modalFilter, setModalFilter] = useState('');
  const [modalNews, setModalNews] = useState([]);
  const [isModalLoading, setIsModalLoading] = useState(false);
  
  const [revisedNewsList, setRevisedNewsList] = useState([]);
  
  const [form, setForm] = useState({
    id: null, 
    title: '',
    content: '',
    photo_source: 'SultraFiks',
    photo_caption: '',
    news_link: '',
    category: 'Pemerintah'
  });

  const categories = [
    'Terbaru', 'Pemerintah', 'Travel', 'Food', 'Teknologi', 
    'Politik', 'Ekonomi', 'Budaya', 'Otomotif', 'Entertainment', 'Opini', 'Loker'
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
      photo_source: newsItem.photo_source || 'SultraFiks',
      photo_caption: newsItem.photo_caption || '',
      news_link: newsItem.news_link || '',
      category: newsItem.category || 'Pemerintah'
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
    await supabase.auth.signOut();
    router.push('/admin/login');
  };

 const handleSubmit = async (e) => {
    e.preventDefault();

    const currentUserId = user?.id || profile?.id;
    if (!currentUserId) return alert("Identitas profil belum termuat sempurna. Tunggu sampai tulisan 'Menunggu Profil' hilang, Bos!");

    if (!form.title || !form.content) return alert("Judul dan isi berita wajib diisi, Bos!");
    
    setLoading(true);
    try {
      let uploadedImageUrl = preview; 
      
      // 1. PROSES UPLOAD GAMBAR (Diperbaiki)
      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `news-${Date.now()}.${fileExt}`;
        
        // HAPUS { upsert: true } karena di Supabase cuma ada izin INSERT
        const { error: uploadError } = await supabase.storage
          .from('news-images')
          .upload(fileName, imageFile); 
        
        // Tangkap error upload dengan jelas
        if (uploadError) {
            console.error("Error Detail Storage:", uploadError);
            throw new Error("Gagal upload foto ke satelit: " + uploadError.message);
        }
        
        const { data: urlData } = supabase.storage.from('news-images').getPublicUrl(fileName);
        uploadedImageUrl = urlData.publicUrl;
      }

      // 2. PROSES SIMPAN DATABASE
      const payload = {
        title: form.title,
        content: form.content,
        image_url: uploadedImageUrl, 
        photo_source: form.photo_source,
        photo_caption: form.photo_caption,
        news_link: form.news_link,
        category: form.category,
        author_id: currentUserId,
        status: 'waiting_review', 
        revision_note: null 
      };

      if (form.id) {
        const { error } = await supabase.from('news').update(payload).eq('id', form.id);
        if (error) throw new Error(error.message);
        alert("Gacor! Berita Revisi berhasil dikirim ulang ke Redaksi.");
      } else {
        const { error } = await supabase.from('news').insert([payload]);
        if (error) throw new Error(error.message);
        alert("Gacor Bos! Berita Baru beserta Foto berhasil dikirim ke Meja Redaksi.");
      }

      // Reset Form
      setForm({ id: null, title: '', content: '', photo_source: 'SultraFiks', photo_caption: '', news_link: '', category: 'Pemerintah' });
      setPreview(null);
      setImageFile(null);
      fetchMyNewsStats(); 
      
    } catch (err) {
      console.error("ERROR KIRIM BERITA:", err);
      // Munculkan popup alert jika gagal agar tidak stuck
      alert("TERJADI KESALAHAN:\n" + err.message);
    } finally {
      // Tombol pasti berhenti loading
      setLoading(false); 
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans text-slate-800 pb-20 relative">
      
      {/* POP-UP MODAL DAFTAR BERITA SAYA */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-4xl rounded-[2.5rem] shadow-2xl flex flex-col max-h-[85vh] overflow-hidden border border-slate-200">
            <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div>
                <h2 className="text-2xl font-black italic uppercase tracking-tight text-slate-900">
                  {modalFilter}
                </h2>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">Laporan Jurnalistik Anda</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-3 bg-white hover:bg-slate-100 rounded-full text-slate-500 transition-colors shadow-sm border border-slate-200">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-8 overflow-y-auto flex-1 bg-[#F8FAFC]">
              {isModalLoading ? (
                <div className="py-20 text-center text-slate-400 font-bold italic animate-pulse">Menarik data dari satelit SultraFiks...</div>
              ) : modalNews.length === 0 ? (
                <div className="py-20 text-center border-2 border-dashed border-slate-200 rounded-3xl">
                  <p className="text-slate-500 font-bold">Belum ada berita di kategori ini.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-6">
                  {modalNews.map((item) => (
                    <div key={item.id} className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 flex flex-col md:flex-row gap-6 hover:shadow-md transition-shadow">
                      <div className="relative w-full md:w-48 aspect-video rounded-2xl overflow-hidden bg-slate-100 shrink-0 border border-slate-200">
                        {item.image_url ? (
                          <Image src={item.image_url} fill className="object-cover" alt="Thumb" unoptimized/>
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center"><ImageIcon className="text-slate-300" size={32}/></div>
                        )}
                      </div>
                      
                      <div className="flex-1 flex flex-col justify-between">
                        <div>
                          <span className="text-[10px] font-black uppercase tracking-widest text-blue-600 bg-blue-50 px-3 py-1 rounded-full">{item.category}</span>
                          <h3 className="text-lg font-black leading-tight text-slate-900 mt-3 line-clamp-2">{item.title}</h3>
                          <p className="text-sm text-slate-500 mt-2 line-clamp-2">{item.content}</p>
                        </div>
                        
                        {(item.status === 'rejected' || item.status === 'revised') && (
                          <div className="mt-4 p-4 bg-red-50 border border-red-100 rounded-2xl flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
                            <div className="flex gap-3 text-red-700 text-sm">
                              <MessageSquareWarning size={18} className="shrink-0 mt-0.5" />
                              <p className="font-medium italic">"{item.revision_note || 'Tidak ada catatan spesifik dari Redaktur.'}"</p>
                            </div>
                            <button 
                              onClick={() => handleEditNews(item)}
                              className="shrink-0 flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-lg shadow-red-500/20"
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

      {/* Navbar Atas */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 px-6 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Send className="text-white" size={20} />
          </div>
          <div>
            <h1 className="font-black italic text-xl tracking-tighter text-blue-600 uppercase leading-none">
              ADMIN SULTRAFIKS
            </h1>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Workspace Wartawan</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          
          <div className="relative" ref={dropdownRef}>
            <button 
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-3 bg-white hover:bg-slate-50 border border-slate-200 p-1.5 pr-4 rounded-full shadow-sm transition-all"
            >
              <div className="relative w-8 h-8 rounded-full overflow-hidden bg-slate-100 border border-slate-200 shadow-inner flex items-center justify-center">
                {profile?.avatar_url ? (
                  <Image src={profile.avatar_url} fill className="object-cover" alt="Avatar" unoptimized />
                ) : (
                  <User className="text-slate-400" size={16} />
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
              <ChevronDown size={14} className={`text-slate-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {isDropdownOpen && (
              <div className="absolute right-0 mt-3 w-64 bg-white rounded-3xl shadow-2xl shadow-slate-200/50 border border-slate-100 overflow-hidden animate-in slide-in-from-top-2 fade-in duration-200">
                <div className="p-5 border-b border-slate-100 bg-slate-50/50">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">Status Berita Saya</p>
                  
                  <div className="space-y-2">
                    <button onClick={() => openNewsModal('Di-ACC Tayang')} className="w-full flex items-center justify-between text-sm font-bold text-slate-700 hover:bg-white p-2 rounded-xl transition-all border border-transparent hover:border-slate-200 hover:shadow-sm">
                      <span className="flex items-center gap-2"><CheckCircle size={14} className="text-green-500" /> Di-ACC Tayang</span>
                      <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-full text-xs">{myNewsStats.published}</span>
                    </button>
                    
                    <button onClick={() => openNewsModal('Menunggu Review')} className="w-full flex items-center justify-between text-sm font-bold text-slate-700 hover:bg-white p-2 rounded-xl transition-all border border-transparent hover:border-slate-200 hover:shadow-sm">
                      <span className="flex items-center gap-2"><Clock size={14} className="text-amber-500" /> Menunggu Review</span>
                      <span className="bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full text-xs">{myNewsStats.pending}</span>
                    </button>
                    
                    <button onClick={() => openNewsModal('Ditolak / Revisi')} className="w-full flex items-center justify-between text-sm font-bold text-slate-700 hover:bg-white p-2 rounded-xl transition-all border border-transparent hover:border-slate-200 hover:shadow-sm">
                      <span className="flex items-center gap-2"><FileX size={14} className="text-red-500" /> Ditolak / Revisi</span>
                      <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded-full text-xs animate-pulse">{myNewsStats.rejected}</span>
                    </button>
                  </div>
                </div>
                
                <div className="p-2">
                  <button 
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-red-600 hover:bg-red-50 rounded-2xl transition-colors"
                  >
                    <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
                      <LogOut size={14} />
                    </div>
                    Keluar Akun
                  </button>
                </div>
              </div>
            )}
          </div>

          <button className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-slate-500 hover:text-slate-800 transition-colors">
            <Eye size={18} /> Preview
          </button>
          
          <button 
            onClick={handleSubmit}
            disabled={loading}
            className={`flex items-center gap-2 text-white px-6 py-2.5 rounded-full font-black italic text-xs uppercase tracking-widest shadow-lg transition-all active:scale-95 disabled:opacity-50 ${form.id ? 'bg-amber-500 hover:bg-amber-600 shadow-amber-500/30' : 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/30'}`}
          >
            {loading ? "MENGIRIM..." : form.id ? "KIRIM REVISI" : "KIRIM KE REDAKSI"} <Send size={14} />
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* KOLOM KIRI: Editor Berita */}
        <div className="lg:col-span-8">
          
          {/* KOTAK MASUK REVISI */}
          {revisedNewsList.length > 0 && !form.id && (
            <div className="bg-red-50 border-2 border-red-200 rounded-[2rem] p-6 shadow-sm mb-8 relative overflow-hidden animate-in slide-in-from-top-4 fade-in">
              <div className="absolute top-0 right-0 p-4 opacity-5"><AlertCircle size={100}/></div>
              <h3 className="font-black text-red-800 flex items-center gap-2 mb-4 relative z-10 uppercase tracking-widest">
                <MessageSquareWarning size={20} /> ADA {revisedNewsList.length} BERITA YANG HARUS DIREVISI!
              </h3>
              
              <div className="space-y-4 relative z-10">
                {revisedNewsList.map((item) => (
                  <div key={item.id} className="bg-white p-5 rounded-2xl border border-red-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm hover:shadow transition-shadow">
                    <div className="flex-1">
                      <span className="text-[10px] font-black bg-red-100 text-red-600 px-2 py-1 rounded uppercase tracking-widest mb-2 inline-block">Catatan Redaktur</span>
                      <h4 className="font-black text-slate-900 text-base line-clamp-1">{item.title}</h4>
                      <p className="text-sm text-red-700 font-medium italic mt-2 bg-red-50 p-3 rounded-xl">"{item.revision_note || 'Harap perbaiki berita ini sesuai standar jurnalistik.'}"</p>
                    </div>
                    <button 
                      onClick={() => handleEditNews(item)} 
                      className="w-full sm:w-auto px-6 py-3 bg-red-600 hover:bg-red-700 text-white text-xs font-black uppercase tracking-widest rounded-xl whitespace-nowrap shadow-lg shadow-red-500/20 active:scale-95 transition-all"
                    >
                      Edit Sekarang
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className={`bg-white rounded-[2rem] p-8 shadow-xl shadow-slate-200/50 border min-h-[700px] flex flex-col transition-colors ${form.id ? 'border-amber-300 ring-4 ring-amber-50' : 'border-slate-100'}`}>
            
            {form.id && (
              <div className="mb-6 bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-sm font-bold animate-in fade-in">
                <div className="flex items-center gap-3">
                  <Edit3 size={18} className="animate-pulse shrink-0"/> 
                  <span>Mode Perbaikan Berita: Anda sedang merevisi berita yang ditolak.</span>
                </div>
                <button onClick={() => {setForm({id:null, title:'', content:'', photo_source:'SultraFiks', photo_caption:'', news_link:'', category:'Pemerintah'}); setPreview(null);}} className="text-xs bg-amber-200 hover:bg-amber-300 text-amber-900 px-3 py-1 rounded-lg transition-colors whitespace-nowrap">Batal Edit</button>
              </div>
            )}

            <div className="flex items-center gap-6 pb-6 border-b border-slate-100 mb-6 text-sm font-bold text-slate-500">
              <button onClick={insertQuote} className="flex items-center gap-2 hover:text-blue-600 transition-colors">
                <Quote size={18} /> Kutipan
              </button>
              <button className="flex items-center gap-2 hover:text-blue-600 transition-colors">
                <Type size={18} /> Format Teks
              </button>
            </div>

            <input 
              type="text" 
              placeholder="Masukkan Judul Berita Utama..." 
              value={form.title}
              onChange={(e) => setForm({...form, title: e.target.value})}
              className="w-full text-4xl font-black text-slate-900 placeholder:text-slate-200 outline-none mb-6 bg-transparent"
            />

            <textarea 
              ref={contentRef}
              placeholder="Mulai menulis berita di sini. Gunakan '>' di awal baris untuk membuat kutipan otomatis..."
              value={form.content}
              onChange={(e) => setForm({...form, content: e.target.value})}
              className="w-full flex-1 resize-none text-lg text-slate-700 leading-relaxed placeholder:text-slate-300 outline-none bg-transparent"
            />
          </div>
        </div>

        {/* KOLOM KANAN: Asset Properties */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white rounded-[2rem] p-6 shadow-xl shadow-slate-200/50 border border-slate-100 sticky top-28">
            
            <div className="flex items-center justify-between mb-8">
              <h3 className="font-black italic text-sm uppercase tracking-widest flex items-center gap-2 text-slate-800">
                <Settings size={18} className="text-blue-600" /> PROPERTI BERITA
              </h3>
            </div>

            <div className="space-y-6">
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Kategori Utama</label>
                <select 
                  value={form.category}
                  onChange={(e) => setForm({...form, category: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:ring-2 ring-blue-500/20 appearance-none cursor-pointer"
                >
                  {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Thumbnail Berita</label>
                <label className="relative block w-full aspect-video rounded-2xl bg-slate-50 border-2 border-dashed border-slate-200 overflow-hidden cursor-pointer hover:border-blue-400 hover:bg-blue-50/50 transition-all group">
                  {preview ? (
                    <Image src={preview} fill className="object-cover" alt="Preview" unoptimized />
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 group-hover:text-blue-500">
                      <UploadCloud size={32} />
                      <span className="text-xs font-bold mt-2">Pilih Foto</span>
                    </div>
                  )}
                  <input type="file" className="hidden" accept="image/*" onChange={(e) => {
                    const file = e.target.files[0];
                    if(file) { setImageFile(file); setPreview(URL.createObjectURL(file)); }
                  }} />
                </label>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 flex items-center gap-1"><ImageIcon size={10}/> Sumber Foto</label>
                  <input 
                    type="text" 
                    value={form.photo_source}
                    placeholder="SultraFiks / Antara"
                    onChange={(e) => setForm({...form, photo_source: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-xs font-bold text-slate-700 outline-none focus:ring-2 ring-blue-500/20"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 flex items-center gap-1"><LinkIcon size={10}/> Link Terkait</label>
                  <input 
                    type="text" 
                    value={form.news_link}
                    placeholder="https://..."
                    onChange={(e) => setForm({...form, news_link: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-xs font-bold text-slate-700 outline-none focus:ring-2 ring-blue-500/20"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 flex items-center gap-1"><Info size={10}/> Penjelasan Foto (Caption)</label>
                <textarea 
                  value={form.photo_caption}
                  placeholder="Deskripsikan momen di dalam foto..."
                  onChange={(e) => setForm({...form, photo_caption: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 text-xs font-medium text-slate-700 outline-none focus:ring-2 ring-blue-500/20 resize-none h-[80px]"
                />
              </div>

              <div className="pt-6 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Status Saat Ini</span>
                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 transition-all ${loading ? 'bg-blue-100 text-blue-700' : form.id ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'}`}>
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