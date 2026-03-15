import { supabase } from '@/lib/supabase';

// MANTRA SAKTI UNTUK MENGIRIM KTP BERITA KE BOT WHATSAPP & FACEBOOK
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
        // Kita hilangkan semua tanda hubung dan spasi, lalu kita cocokkan huruf dan angkanya saja!
        const cleanSlugForMatch = rawSlug.replace(/[^a-z0-9]+/g, '');

        currentArticle = allNews.find(item => {
            if (!item.title) return false;
            if (item.id === rawSlug) return true; // Cek ID asli
            
            const cleanTitleForMatch = item.title.toLowerCase().replace(/[^a-z0-9]+/g, '');
            return cleanTitleForMatch === cleanSlugForMatch;
        });
    }

    // Jika entah kenapa masih tidak ketemu, tampilkan KTP darurat
    if (!currentArticle) {
        return { 
            title: 'SultraFiks - Portal Berita Terkini',
            description: 'Media siber terdepan di Sulawesi Tenggara.',
        };
    }

    // 4. Bersihkan deskripsi dari tag HTML (Ambil 150 huruf pertama)
    const cleanDescription = currentArticle.content
        ? currentArticle.content.replace(/<[^>]*>?/gm, '').substring(0, 150) + '...'
        : 'Baca berita selengkapnya di portal SultraFiks.';

    // 🔥 WAJIB UNTUK WHATSAPP: GUNAKAN LINK GAMBAR MENTAHAN/ASLI DARI DATABASE 🔥
    // Jangan gunakan /_next/image karena robot WhatsApp sering memblokirnya.
    const waImageUrl = currentArticle.image_url || 'https://www.sultrafiks.com/logo.png';
    const articleUrl = `https://www.sultrafiks.com/news/${rawSlug}`;

    return {
        metadataBase: new URL('https://www.sultrafiks.com'),
        title: `${currentArticle.title} - SultraFiks`,
        description: cleanDescription,
        openGraph: {
            title: currentArticle.title,
            description: cleanDescription,
            url: articleUrl,
            siteName: 'SultraFiks',
            images: [
                {
                    url: waImageUrl, // <-- Kunci keberhasilan gambar WA ada di sini
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
            images: [waImageUrl],
        },
    };
}

export default function NewsLayout({ children }) {
    return <>{children}</>;
}