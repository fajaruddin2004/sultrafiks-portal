import React from 'react';
import Link from 'next/link';
import { Clock, Eye, ImageIcon } from 'lucide-react';

// --- FUNGSI HELPER WAKTU RELATIF ---
const timeAgo = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const secondsPast = (now.getTime() - date.getTime()) / 1000;

    if (secondsPast < 60) return `Baru saja`;
    if (secondsPast < 3600) return `${Math.floor(secondsPast / 60)} mnt lalu`;
    if (secondsPast <= 86400) return `${Math.floor(secondsPast / 3600)} jam lalu`;
    if (secondsPast > 86400) {
        const day = Math.floor(secondsPast / 86400);
        if (day === 1) return "Kemarin";
        return date.toLocaleDateString("id-ID", { day: 'numeric', month: 'short', year: 'numeric' });
    }
    return '';
};

export default function NewsCard({ data, type = "grid", index }) {
    if (!data) return null;

    // ========================================================
    // GAYA 1: TAMPILAN LIST (Digunakan untuk sidebar Trending)
    // ========================================================
    if (type === "list") {
        return (
            <Link href={`/news/${data.id}`} className="group flex items-center gap-3 py-3 border-b border-slate-100 last:border-0 hover:bg-slate-50/80 rounded-xl transition-colors px-2 overflow-hidden w-full">
                {index !== undefined && (
                    <div className="text-3xl font-black italic text-slate-200 group-hover:text-blue-500 transition-colors w-6 text-center shrink-0">
                        {index + 1}
                    </div>
                )}
                
                {/* KUNCI PERBAIKAN: min-w-0 mencegah teks mendorong elemen lain keluar batas */}
                <div className="flex-1 min-w-0 pr-2">
                    <h4 className="font-bold text-sm text-slate-800 leading-snug group-hover:text-blue-600 transition-colors line-clamp-2 mb-1.5">
                        {data.title}
                    </h4>
                    <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 overflow-hidden">
                        <span className="uppercase tracking-widest text-blue-500 bg-blue-50 px-2 py-0.5 rounded truncate max-w-[80px]">
                            {data.category}
                        </span>
                        <span className="flex items-center gap-1 shrink-0">
                            <Clock className="w-3 h-3"/> {timeAgo(data.created_at)}
                        </span>
                    </div>
                </div>
                
                {/* UKURAN FOTO DISESUAIKAN: Lebih presisi di Mobile (72px) & Desktop (80px) */}
                <div className="w-[72px] h-[72px] md:w-20 md:h-20 rounded-xl bg-slate-100 overflow-hidden shrink-0 relative shadow-sm border border-slate-200">
                    {data.image_url ? (
                        <img src={data.image_url} alt={data.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                    ) : (
                        <ImageIcon className="w-6 h-6 text-slate-300 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                    )}
                </div>
            </Link>
        );
    }

    // ========================================================
    // GAYA 2: TAMPILAN GRID (Digunakan untuk list Berita Utama)
    // ========================================================
    return (
        <Link href={`/news/${data.id}`} className="group flex flex-col bg-white rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-blue-500/10 hover:border-blue-200 transition-all overflow-hidden p-3 w-full">
            
            <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-slate-100 mb-4 border border-slate-100/50">
                {data.image_url ? (
                    <img src={data.image_url} alt={data.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-300">
                        <ImageIcon size={32} className="mb-2" />
                        <span className="text-[10px] font-bold uppercase tracking-widest">Tanpa Foto</span>
                    </div>
                )}
                
                <div className="absolute top-3 left-3 px-3 py-1 bg-white/90 backdrop-blur-md text-blue-600 text-[10px] font-black uppercase tracking-widest rounded-lg shadow-sm">
                    {data.category}
                </div>
            </div>

            <div className="px-2 pb-2 flex-1 flex flex-col">
                <h3 className="font-black text-lg text-slate-900 leading-tight mb-3 line-clamp-2 group-hover:text-blue-600 transition-colors">
                    {data.title}
                </h3>
                
                <div className="mt-auto flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-widest pt-3 border-t border-slate-50">
                    <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5"/> {timeAgo(data.created_at)}</span>
                    <span className="flex items-center gap-1"><Eye className="w-3.5 h-3.5"/> {data.views || 0} Views</span>
                </div>
            </div>
        </Link>
    );
}