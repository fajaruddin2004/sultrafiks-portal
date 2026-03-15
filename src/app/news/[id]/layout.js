import { supabase } from '@/lib/supabase';

// MANTRA SAKTI UNTUK MENGIRIM KTP BERITA BER-WATERMARK KE BOT WHATSAPP
export async function generateMetadata({ params }) {
    // 1. Suruh params menunggu (Wajib di Next.js terbaru)
    const resolvedParams = await params;
    
    // 2. Ambil ID/Slug dari link
    const rawSlug = decodeURIComponent(String(resolvedParams.id || resolvedParams.slug)).toLowerCase();
    
    // 3. Ambil data berita dari Supabase
    const { data: allNews } = await supabase.from('news').select('id, title, content, image_url').order('created_at', { ascending: false });

    let currentArticle = null;

    if (allNews && allNews.length > 0) {
        // 🔥 SISTEM PENCARIAN ANTI GAGAL (Fuzzy Match) 🔥
        const cleanSlugForMatch = rawSlug.replace(/[^a-z0-9]+/g, '');

        currentArticle = allNews.find(item => {
            if (!item.title) return false;
            if (item.id === rawSlug) return true; // Cek ID asli
            
            const cleanTitleForMatch = item.title.toLowerCase().replace(/[^a-z0-9]+/g, '');
            return cleanTitleForMatch === cleanSlugForMatch;
        });
    }

    // Jika entah kenapa masih tidak ketemu, tampilkan KTP darurat
    const productionUrl = 'https://www.sultrafiks.com';
    const cleanProductionUrl = productionUrl.replace(/\/$/, ''); // Hilangkan garis miring di akhir jika ada
    
    if (!currentArticle) {
        return { 
            metadataBase: new URL(cleanProductionUrl),
            title: 'SultraFiks - Portal Berita Terkini',
            description: 'Media siber terdepan di Sulawesi Tenggara.',
        };
    }

    // 4. Bersihkan deskripsi dari tag HTML (Ambil 150 huruf pertama)
    const cleanDescription = currentArticle.content
        ? currentArticle.content.replace(/<[^>]*>?/gm, '').substring(0, 150) + '...'
        : 'Baca berita selengkapnya di portal SultraFiks.';

    // 5. AMBIL LINK GAMBAR MENTAHAN/ASLI (Untuk disetor ke mesin stempel)
    const rawImageUrl = currentArticle.image_url || `${cleanProductionUrl}/logo.png`;
    
    // 🔥 INI RAHASIANYA: BUAT LINK KHUSUS KE MESIN STEMPEL (TAPI WA BELUM LIHAT LINK INI) 🔥
    // Kita buat URL ke api/og dengan parameter imageUrl yang sudah disandikan
    const directOgImageUrl = `${cleanProductionUrl}/api/og?imageUrl=${encodeURIComponent(rawImageUrl)}`;

    // 🔥 WAJIB UNTUK WHATSAPP: KITA KEMBALIKAN directOgImageUrl SEBAGAI OG_IMAGE UTAMA 🔥
    // WhatsApp akan menarik data ke api/og, mesin stempel akan jalan di server, dan mengembalikan PNG baru.
    // Tidak ada _next/image lagi yang diblokir WA. Keberhasilan 100%!
    const articleUrl = `${cleanProductionUrl}/news/${rawSlug}`;

    return {
        metadataBase: new URL(cleanProductionUrl),
        title: `${currentArticle.title} - SultraFiks`,
        description: cleanDescription,
        openGraph: {
            title: currentArticle.title,
            description: cleanDescription,
            url: articleUrl,
            siteName: 'SultraFiks',
            images: [
                {
                    url: directOgImageUrl, // <-- Kunci keberhasilan Thumbnail Ber-watermark ada di sini
                    width: 1200,
                    height: 630,
                    alt: currentArticle.title,
                },
            ],
            locale: 'id_ID',
            type: 'article',
        },
        twitter: {
            card: 'summary_large_image',
            title: currentArticle.title,
            description: cleanDescription,
            images: [directOgImageUrl],
        },
    };
}

export default function NewsLayout({ children }) {
    return <>{children}</>;
}