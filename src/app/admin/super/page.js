"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { 
  BarChart3, Users, Megaphone, TrendingUp, Eye, FileText, 
  Trash2, UploadCloud, Plus, LogOut, Settings, Save, Phone, User,
  MessageSquare, ThumbsUp, Calendar, Newspaper, X, Trophy // 🔥 Trophy ditambahkan 🔥
} from "lucide-react";
import Image from "next/image";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as ChartTooltip, ResponsiveContainer, Legend } from 'recharts';

export default function SuperAdminPage() {
  const { user, profile, loading: authLoading } = useAuth();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState("dashboard");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const [stats, setStats] = useState({ totalNews: 0, totalViews: 0, totalStaff: 0, activeAds: 0 });
  const [allNews, setAllNews] = useState([]); 
  const [staffList, setStaffList] = useState([]);
  const [adsList, setAdsList] = useState([]);
  const [chartData, setChartData] = useState([]);

  const [isCommentModalOpen, setIsCommentModalOpen] = useState(false);
  const [selectedNewsForComments, setSelectedNewsForComments] = useState(null);
  const [commentsList, setCommentsList] = useState([]);
  const [commentsLoading, setCommentsLoading] = useState(false);

  const [webSettings, setWebSettings] = useState({
    header_price: "", sidebar_price: "", article_price: "", wa_number: ""
  });

  const [adForm, setAdForm] = useState({ title: "", link_url: "", position: "header" });
  const [adImage, setAdImage] = useState(null);
  const [adPreview, setAdPreview] = useState(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user || profile?.role?.toLowerCase() !== "admin") {
      router.replace("/admin/login");
      return;
    }
    fetchAllData();
  }, [authLoading, user, profile]);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const { data: newsData } = await supabase
        .from('news')
        .select(`
          *,
          profiles:author_id(full_name),
          comments(id)
        `)
        .order('created_at', { ascending: false });
      
      setAllNews(newsData || []);

      let tViews = 0;
      let tNews = 0;
      const categoryStats = {};
      
      // 🔥 1. SIAPKAN KERANJANG PENGHITUNG BERITA PER WARTAWAN 🔥
      const authorArticleCounts = {}; 

      newsData?.forEach(n => {
        if (n.status === 'published') {
            tNews++;
            tViews += (n.views || 0);
            
            // Hitung untuk grafik kategori
            const cat = n.category || 'Lainnya';
            if(!categoryStats[cat]) categoryStats[cat] = { name: cat, views: 0, artikel: 0 };
            categoryStats[cat].views += (n.views || 0);
            categoryStats[cat].artikel += 1;

            // 🔥 2. HITUNG BERAPA BERITA YANG DIBUAT OLEH AUTHOR INI 🔥
            if(n.author_id) {
                authorArticleCounts[n.author_id] = (authorArticleCounts[n.author_id] || 0) + 1;
            }
        }
      });

      setChartData(Object.values(categoryStats).sort((a, b) => b.views - a.views));

      const { data: staffData, count: tStaff } = await supabase.from('profiles').select('*', { count: 'exact' });
      
      // 🔥 3. GABUNGKAN JUMLAH BERITA KE DATA STAF DAN URUTKAN DARI YANG TERBANYAK 🔥
      const staffWithCounts = (staffData || []).map(staff => {
          return {
              ...staff,
              article_count: authorArticleCounts[staff.id] || 0 // Jika 0 berita, set 0
          }
      }).sort((a, b) => b.article_count - a.article_count); // Diurutkan dari terbanyak ke terdikit

      setStaffList(staffWithCounts);

      const { data: adsData } = await supabase.from('ads').select('*').order('created_at', { ascending: false });
      setAdsList(adsData || []);

      const { data: settingsData } = await supabase.from('web_settings').select('*').eq('id', 1).single();
      if (settingsData) setWebSettings(settingsData);

      setStats({
        totalNews: tNews || 0,
        totalViews: tViews,
        totalStaff: tStaff || 0,
        activeAds: adsData?.filter(a => a.is_active).length || 0
      });
    } catch (error) {
      console.error("Gagal menarik data admin:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenComments = async (newsItem) => {
    setSelectedNewsForComments(newsItem);
    setIsCommentModalOpen(true);
    setCommentsLoading(true);
    try {
      const { data, error } = await supabase
        .from('comments')
        .select('*')
        .eq('news_id', newsItem.id)
        .order('created_at', { ascending: false });
        
      if(error) throw error;
      setCommentsList(data || []);
    } catch (error) {
      console.error("Gagal ambil komentar", error);
    } finally {
      setCommentsLoading(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    if(!confirm("Yakin ingin menghapus komentar ini secara permanen?")) return;
    try {
      await supabase.from('comments').delete().eq('id', commentId);
      setCommentsList(prev => prev.filter(c => c.id !== commentId));
      setAllNews(prev => prev.map(n => {
        if(n.id === selectedNewsForComments.id) {
            return { ...n, comments: n.comments.slice(0, -1) };
        }
        return n;
      }));
    } catch (error) {
      alert("Gagal menghapus komentar!");
    }
  };

  const handleUploadAd = async (e) => {
    e.preventDefault();
    if (!adForm.title || !adImage) return alert("Judul dan Foto Iklan Wajib Diisi!");
    setActionLoading(true);
    try {
      const fileExt = adImage.name.split('.').pop();
      const fileName = `iklan-${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from('news-images').upload(fileName, adImage, { upsert: true });
      if (uploadError) throw new Error("Gagal upload gambar iklan.");
      const { data: urlData } = supabase.storage.from('news-images').getPublicUrl(fileName);
      
      const payload = { title: adForm.title, link_url: adForm.link_url, position: adForm.position, image_url: urlData.publicUrl, is_active: true };
      const { error: dbError } = await supabase.from('ads').insert([payload]);
      if (dbError) throw dbError;

      alert("Iklan berhasil ditambahkan!");
      setAdForm({ title: "", link_url: "", position: "header" }); setAdImage(null); setAdPreview(null);
      fetchAllData();
    } catch (error) { alert("GAGAL UPLOAD IKLAN: " + error.message); } finally { setActionLoading(false); }
  };

  const handleToggleAd = async (id, currentStatus) => {
    await supabase.from('ads').update({ is_active: !currentStatus }).eq('id', id);
    fetchAllData();
  };

  const handleDeleteAd = async (id) => {
    if(!confirm("Yakin ingin menghapus iklan ini selamanya?")) return;
    await supabase.from('ads').delete().eq('id', id);
    fetchAllData();
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const { error } = await supabase.from('web_settings').update(webSettings).eq('id', 1);
      if (error) throw error;
      alert("Pengaturan dan Harga Iklan berhasil diperbarui!");
    } catch (error) {
      alert("Gagal menyimpan pengaturan: " + error.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.clear(); sessionStorage.clear();
    window.location.href = '/admin/login';
  };

  const getLikeCount = (newsItem) => {
    if (typeof newsItem.likes === 'number') return newsItem.likes;
    if (Array.isArray(newsItem.likes)) return newsItem.likes.length;
    if (typeof newsItem.likes_count === 'number') return newsItem.likes_count;
    if (typeof newsItem.like_count === 'number') return newsItem.like_count;
    if (typeof newsItem.total_likes === 'number') return newsItem.total_likes;
    return 0; 
  };

  if (loading) return <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white font-bold tracking-widest text-sm animate-pulse">MEMUAT RUANG KENDALI...</div>;

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col md:flex-row font-sans relative">
      
      {isCommentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white w-full max-w-2xl rounded-[2rem] shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center"><MessageSquare size={20}/></div>
                <div>
                  <h3 className="font-black text-slate-800 text-lg leading-tight line-clamp-1">{selectedNewsForComments?.title}</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Moderasi Komentar Pembaca</p>
                </div>
              </div>
              <button onClick={() => setIsCommentModalOpen(false)} className="p-2 bg-white hover:bg-slate-200 rounded-full text-slate-500 transition-colors shadow-sm border border-slate-200">
                <X size={18} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 bg-[#F8FAFC]">
              {commentsLoading ? (
                <div className="text-center text-slate-400 py-10 font-bold text-xs animate-pulse">Menarik data komentar...</div>
              ) : commentsList.length === 0 ? (
                <div className="text-center py-10 border-2 border-dashed border-slate-200 rounded-2xl bg-white">
                  <MessageSquare className="w-10 h-10 mx-auto text-slate-300 mb-2"/>
                  <p className="text-slate-400 font-bold text-sm">Belum ada komentar di berita ini.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {commentsList.map((c) => (
                    <div key={c.id} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex gap-4 items-start group">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-500 text-white flex items-center justify-center font-black text-lg shrink-0 shadow-sm">
                        {c.user_name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="font-black text-slate-800 text-sm">{c.user_name}</h4>
                          <span className="text-[9px] font-bold text-slate-400">{new Date(c.created_at).toLocaleString('id-ID')}</span>
                        </div>
                        <p className="text-slate-600 text-sm leading-relaxed">{c.content}</p>
                      </div>
                      <button 
                        onClick={() => handleDeleteComment(c.id)}
                        className="opacity-0 group-hover:opacity-100 p-2 text-red-400 hover:bg-red-50 hover:text-red-600 rounded-lg transition-all"
                        title="Hapus Komentar"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <aside className="w-full md:w-64 bg-slate-900 text-white flex flex-col sticky top-0 md:h-screen shrink-0 z-40">
        <div className="p-6 flex items-center justify-between md:justify-start gap-3">
          <div className="uppercase italic font-black text-xl tracking-tighter">
            SUPER<span className="text-blue-500">ADMIN</span>
          </div>
          <button onClick={handleLogout} className="md:hidden text-red-400"><LogOut size={20}/></button>
        </div>
        
        <nav className="flex-1 px-4 pb-4 space-y-2 overflow-x-auto flex md:flex-col no-scrollbar">
          <button onClick={() => setActiveTab("dashboard")} className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold w-full text-left whitespace-nowrap transition-colors ${activeTab === 'dashboard' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' : 'text-slate-400 hover:bg-white/5'}`}><BarChart3 size={18} /> Ringkasan & Grafik</button>
          <button onClick={() => setActiveTab("semua_berita")} className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold w-full text-left whitespace-nowrap transition-colors ${activeTab === 'semua_berita' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' : 'text-slate-400 hover:bg-white/5'}`}><Newspaper size={18} /> Semua Berita</button>
          <button onClick={() => setActiveTab("ads")} className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold w-full text-left whitespace-nowrap transition-colors ${activeTab === 'ads' ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/30' : 'text-slate-400 hover:bg-white/5'}`}><Megaphone size={18} /> Kelola Iklan</button>
          <button onClick={() => setActiveTab("staff")} className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold w-full text-left whitespace-nowrap transition-colors ${activeTab === 'staff' ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/30' : 'text-slate-400 hover:bg-white/5'}`}><Users size={18} /> Aktivitas Staf</button>
          <button onClick={() => setActiveTab("settings")} className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold w-full text-left whitespace-nowrap transition-colors ${activeTab === 'settings' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30' : 'text-slate-400 hover:bg-white/5'}`}><Settings size={18} /> Pengaturan Web</button>
        </nav>

        <div className="p-4 mt-auto hidden md:block">
           <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 py-3 bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white rounded-xl font-bold transition-all"><LogOut size={16}/> Keluar</button>
        </div>
      </aside>

      <main className="flex-1 p-4 md:p-8 overflow-y-auto">
        <div className="max-w-6xl mx-auto">
          
          <header className="mb-8">
            <h1 className="text-2xl md:text-3xl font-black text-slate-900 uppercase tracking-tight">Control Panel Dashboard</h1>
            <p className="text-slate-500 font-medium mt-1">Pantau performa website, aktivitas staf, dan kelola pendapatan iklan Anda.</p>
          </header>

          {activeTab === "dashboard" && (
            <div className="animate-in fade-in space-y-6">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-center transition-transform hover:scale-[1.02]">
                    <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center mb-3"><Eye size={20}/></div>
                    <p className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-widest">Total Pembaca</p>
                    <h3 className="text-2xl md:text-4xl font-black text-slate-800 mt-1">{stats.totalViews}</h3>
                  </div>
                  <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-center transition-transform hover:scale-[1.02]">
                    <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-lg flex items-center justify-center mb-3"><FileText size={20}/></div>
                    <p className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-widest">Total Berita</p>
                    <h3 className="text-2xl md:text-4xl font-black text-slate-800 mt-1">{stats.totalNews}</h3>
                  </div>
                  <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-center transition-transform hover:scale-[1.02]">
                    <div className="w-10 h-10 bg-amber-100 text-amber-600 rounded-lg flex items-center justify-center mb-3"><Megaphone size={20}/></div>
                    <p className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-widest">Iklan Aktif</p>
                    <h3 className="text-2xl md:text-4xl font-black text-slate-800 mt-1">{stats.activeAds}</h3>
                  </div>
                  <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-center transition-transform hover:scale-[1.02]">
                    <div className="w-10 h-10 bg-purple-100 text-purple-600 rounded-lg flex items-center justify-center mb-3"><Users size={20}/></div>
                    <p className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-widest">Jumlah Staf</p>
                    <h3 className="text-2xl md:text-4xl font-black text-slate-800 mt-1">{stats.totalStaff}</h3>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <div className="flex items-center justify-between mb-6 border-b border-slate-100 pb-4">
                       <h3 className="font-black text-lg text-slate-800 flex items-center gap-2">
                         <BarChart3 className="text-blue-600"/> Statistik Interaksi Kategori
                       </h3>
                       <span className="text-[10px] font-bold bg-blue-50 text-blue-600 px-3 py-1 rounded-full uppercase tracking-widest">Real-Time</span>
                    </div>

                    {chartData.length > 0 ? (
                        <div className="w-full h-80">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b', fontWeight: 'bold' }} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                                    <ChartTooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)', fontWeight: 'bold'}} />
                                    <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                                    <Bar dataKey="views" name="Total Pembaca (Views)" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={40} animationDuration={1500} />
                                    <Bar dataKey="artikel" name="Jumlah Berita Diterbitkan" fill="#10b981" radius={[4, 4, 0, 0]} barSize={40} animationDuration={1500} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <div className="w-full h-64 flex items-center justify-center bg-slate-50 rounded-xl border border-dashed border-slate-200 text-slate-400 font-bold text-sm">
                            Belum ada data untuk ditampilkan di grafik.
                        </div>
                    )}
                </div>
            </div>
          )}

          {activeTab === "semua_berita" && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden animate-in fade-in">
              <div className="p-5 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Newspaper className="text-blue-600"/> <h2 className="font-black text-lg text-slate-800">DATABASE SEMUA BERITA</h2>
                </div>
                <div className="bg-blue-100 text-blue-600 px-3 py-1 rounded-full text-[10px] font-black tracking-widest">
                  TOTAL: {allNews.length} BERITA
                </div>
              </div>
              <div className="overflow-x-auto max-h-[600px] overflow-y-auto relative">
                <table className="w-full text-left border-collapse relative">
                  <thead className="sticky top-0 bg-slate-50 z-10 shadow-sm">
                    <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-200">
                      <th className="p-4">Info Berita</th>
                      <th className="p-4">Kategori / Status</th>
                      <th className="p-4">Statistik Interaksi</th>
                      <th className="p-4 text-center">Aksi Moderasi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allNews.map((news) => (
                      <tr key={news.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                        <td className="p-4">
                          <h3 className="font-bold text-slate-800 text-sm line-clamp-2 leading-tight max-w-sm mb-1">{news.title}</h3>
                          <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400">
                            <span className="flex items-center gap-1"><User size={10}/> {news.profiles?.full_name || 'Tidak diketahui'}</span>
                            <span>•</span>
                            <span className="flex items-center gap-1"><Calendar size={10}/> {new Date(news.created_at).toLocaleDateString('id-ID')}</span>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex flex-col items-start gap-1">
                            <span className="bg-blue-50 text-blue-600 px-2 py-1 rounded text-[10px] font-bold">{news.category}</span>
                            <span className={`text-[9px] font-black uppercase tracking-widest ${news.status === 'published' ? 'text-emerald-500' : news.status === 'rejected' ? 'text-red-500' : 'text-amber-500'}`}>
                              • {news.status === 'published' ? 'Tayang Publik' : news.status === 'rejected' ? 'Ditolak' : 'Menunggu / Draft'}
                            </span>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-4 text-xs font-black">
                            <div className="flex items-center gap-1.5 text-blue-500 bg-blue-50 px-2 py-1 rounded-lg" title="Total Pembaca">
                                <Eye size={14}/> {news.views || 0}
                            </div>
                            <div className="flex items-center gap-1.5 text-rose-500 bg-rose-50 px-2 py-1 rounded-lg" title="Total Likes">
                                <ThumbsUp size={14}/> {getLikeCount(news)}
                            </div>
                          </div>
                        </td>
                        <td className="p-4 text-center">
                          <button 
                            onClick={() => handleOpenComments(news)}
                            className="inline-flex items-center justify-center gap-2 bg-slate-100 hover:bg-purple-100 text-slate-500 hover:text-purple-600 px-3 py-2 rounded-xl transition-colors font-bold text-[10px] uppercase tracking-widest"
                          >
                            <MessageSquare size={14}/> 
                            <span>{(news.comments && news.comments.length) || 0} Komen</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === "ads" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in">
              <div className="lg:col-span-1 bg-white rounded-2xl shadow-sm border border-slate-100 p-5 h-fit sticky top-6">
                <h3 className="font-black text-slate-800 mb-4 flex items-center gap-2 border-b pb-3"><Plus size={18} className="text-amber-500"/> Tambah Iklan Baru</h3>
                <form onSubmit={handleUploadAd} className="space-y-4">
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1 block">Nama Klien / Iklan</label>
                    <input type="text" value={adForm.title} onChange={(e)=>setAdForm({...adForm, title: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-amber-500" required/>
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1 block">Link Tujuan (URL)</label>
                    <input type="url" value={adForm.link_url} onChange={(e)=>setAdForm({...adForm, link_url: e.target.value})} placeholder="https://..." className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-amber-500"/>
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1 block">Posisi Tayang</label>
                    <select value={adForm.position} onChange={(e)=>setAdForm({...adForm, position: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-amber-500">
                      <option value="header">Header (Atas)</option><option value="sidebar">Sidebar (Samping)</option><option value="in_article">Dalam Artikel</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1 block">Banner Gambar</label>
                    <label className="relative flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50 hover:bg-amber-50 hover:border-amber-400 cursor-pointer overflow-hidden transition-all">
                      {adPreview ? ( <Image src={adPreview} fill className="object-cover" alt="Ad Preview" unoptimized /> ) : (
                        <div className="flex flex-col items-center text-slate-400"><UploadCloud size={24}/><span className="text-[10px] font-bold mt-1">Upload Gambar</span></div>
                      )}
                      <input type="file" className="hidden" accept="image/*" onChange={(e)=>{
                         if(e.target.files[0]){ setAdImage(e.target.files[0]); setAdPreview(URL.createObjectURL(e.target.files[0])); }
                      }}/>
                    </label>
                  </div>
                  <button type="submit" disabled={actionLoading} className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-white font-black text-xs uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-amber-500/30">
                    {actionLoading ? "Mengupload..." : "Terbitkan Iklan"}
                  </button>
                </form>
              </div>

              <div className="lg:col-span-2 space-y-4">
                {adsList.map(ad => (
                  <div key={ad.id} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col sm:flex-row gap-4 items-center">
                    <div className="w-full sm:w-32 h-20 bg-slate-100 rounded-lg overflow-hidden relative shrink-0">
                      <Image src={ad.image_url} fill className="object-cover" alt="Ad" unoptimized/>
                    </div>
                    <div className="flex-1 w-full text-center sm:text-left">
                      <span className="text-[9px] bg-slate-100 px-2 py-0.5 rounded font-black uppercase tracking-widest text-slate-500 mb-1 inline-block">POSISI: {ad.position}</span>
                      <h4 className="font-black text-slate-800 text-lg leading-tight truncate">{ad.title}</h4>
                      <p className="text-xs text-blue-500 truncate max-w-[200px]">{ad.link_url || 'Tanpa Link'}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button onClick={() => handleToggleAd(ad.id, ad.is_active)} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all border ${ad.is_active ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-slate-50 text-slate-500 border-slate-200'}`}>
                        {ad.is_active ? 'AKTIF TAYANG' : 'NON-AKTIF'}
                      </button>
                      <button onClick={() => handleDeleteAd(ad.id)} className="p-2 bg-red-50 text-red-500 hover:bg-red-500 hover:text-white rounded-lg transition-colors border border-red-100">
                        <Trash2 size={16}/>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "staff" && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden animate-in fade-in">
              <div className="p-5 border-b border-slate-100 bg-slate-50 flex items-center gap-2"><Users className="text-purple-600"/> <h2 className="font-black text-lg text-slate-800">DATABASE ANGGOTA PERS</h2></div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                      <th className="p-4">Nama / KTP Pers</th>
                      {/* 🔥 HEADER BARU UNTUK TOTAL BERITA 🔥 */}
                      <th className="p-4 text-center">Total Berita</th>
                      <th className="p-4">Jabatan</th>
                      <th className="p-4">No. HP</th>
                      <th className="p-4">Terdaftar Sejak</th>
                    </tr>
                  </thead>
                  <tbody>
                    {staffList.map((staff, index) => (
                      <tr key={staff.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                        <td className="p-4 flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full overflow-hidden bg-slate-200 shrink-0 relative">
                            {staff.avatar_url ? <Image src={staff.avatar_url} fill className="object-cover" alt="Avatar" unoptimized /> : <User size={16} className="m-2 text-slate-400"/>}
                          </div>
                          <div>
                            <div className="font-bold text-slate-800 flex items-center gap-1.5">
                                {staff.full_name} 
                                {/* 🔥 MAHKOTA UNTUK JUARA 1 (Yang Paling Banyak Upload Berita) 🔥 */}
                                {index === 0 && staff.article_count > 0 && <Trophy size={14} className="text-amber-500 fill-amber-500" title="Wartawan Paling Produktif"/>}
                            </div>
                            <p className="text-[10px] text-slate-400">{staff.username}</p>
                          </div>
                        </td>
                        
                        {/* 🔥 MENAMPILKAN ANGKA TOTAL BERITA 🔥 */}
                        <td className="p-4 text-center">
                            <span className="inline-flex items-center justify-center font-black text-blue-600 bg-blue-50 px-3 py-1 rounded-lg text-sm border border-blue-100">
                                {staff.article_count}
                            </span>
                        </td>

                        <td className="p-4">
                          <span className={`text-[10px] px-2 py-1 rounded font-black uppercase tracking-widest ${staff.role === 'admin' ? 'bg-red-100 text-red-600' : staff.role === 'redaktur' ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600'}`}>{staff.role}</span>
                        </td>
                        <td className="p-4 text-sm text-slate-600 font-medium">{staff.phone_number || '-'}</td>
                        <td className="p-4 text-xs text-slate-500">{new Date(staff.created_at).toLocaleDateString('id-ID')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === "settings" && (
            <div className="max-w-2xl bg-white rounded-2xl shadow-sm border border-slate-100 p-6 md:p-8 animate-in fade-in">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
                <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center"><Settings size={24}/></div>
                <div>
                  <h2 className="font-black text-xl text-slate-800">Pengaturan Website</h2>
                  <p className="text-xs text-slate-500 font-medium">Atur harga iklan dan nomor kontak yang tampil di halaman depan pembaca.</p>
                </div>
              </div>

              <form onSubmit={handleSaveSettings} className="space-y-5">
                <div className="bg-amber-50 p-4 rounded-xl border border-amber-100 space-y-4">
                    <h3 className="font-black text-amber-800 text-sm uppercase tracking-widest flex items-center gap-2"><Megaphone size={16}/> Price List Iklan</h3>
                    <div>
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1.5 block">Harga Banner Header (Atas)</label>
                        <input type="text" value={webSettings.header_price} onChange={(e)=>setWebSettings({...webSettings, header_price: e.target.value})} className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-800 outline-none focus:border-amber-500" placeholder="Misal: Rp 500k" required/>
                    </div>
                    <div>
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1.5 block">Harga Banner Sidebar (Samping)</label>
                        <input type="text" value={webSettings.sidebar_price} onChange={(e)=>setWebSettings({...webSettings, sidebar_price: e.target.value})} className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-800 outline-none focus:border-amber-500" placeholder="Misal: Rp 350k" required/>
                    </div>
                    <div>
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1.5 block">Harga In-Article (Dalam Berita)</label>
                        <input type="text" value={webSettings.article_price} onChange={(e)=>setWebSettings({...webSettings, article_price: e.target.value})} className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-800 outline-none focus:border-amber-500" placeholder="Misal: Rp 250k" required/>
                    </div>
                </div>

                <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100">
                    <h3 className="font-black text-emerald-800 text-sm uppercase tracking-widest flex items-center gap-2 mb-4"><Phone size={16}/> Kontak Redaksi</h3>
                    <div>
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1.5 block">Nomor WhatsApp Admin (Pakai kode negara, cth: 628...)</label>
                        <input type="text" value={webSettings.wa_number} onChange={(e)=>setWebSettings({...webSettings, wa_number: e.target.value})} className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-800 outline-none focus:border-emerald-500" placeholder="6285242842268" required/>
                    </div>
                </div>

                <button type="submit" disabled={actionLoading} className="w-full flex items-center justify-center gap-2 py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-emerald-500/30 active:scale-95">
                  <Save size={18}/> {actionLoading ? "MENYIMPAN..." : "SIMPAN PERUBAHAN PENGATURAN"}
                </button>
              </form>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}