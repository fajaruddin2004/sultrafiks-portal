import { supabase } from '@/lib/supabase';

// MANTRA SAKTI KTP BERITA UNTUK WHATSAPP (100% ANTI GAGAL - JALUR LANGSUNG)
export async function generateMetadata({ params }) {
    // 1. Suruh params menunggu (Wajib di Next.js 14/15)
    const resolvedParams = await params;
    const rawSlug = decodeURIComponent(String(resolvedParams.id || resolvedParams.slug)).toLowerCase();
    
    // 2. Ambil data berita dari Supabase
    const { data: allNews } = await supabase.from('news').select('id, title, content, image_url').order('created_at', { ascending: false });

    let currentArticle = null;

    if (allNews && allNews.length > 0) {
        // Sistem Pencarian Anti Gagal (Fuzzy Match)
        const cleanSlugForMatch = rawSlug.replace(/[^a-z0-9]+/g, '');

        currentArticle = allNews.find(item => {
            if (!item.title) return false;
            if (item.id === rawSlug) return true; 
            
            const cleanTitleForMatch = item.title.toLowerCase().replace(/[^a-z0-9]+/g, '');
            return cleanTitleForMatch === cleanSlugForMatch;
        });
    }

    const productionUrl = 'https://www.sultrafiks.com';
    const cleanProductionUrl = productionUrl.replace(/\/$/, ''); 
    
    // KTP Darurat jika berita tidak ditemukan
    if (!currentArticle) {
        return { 
            metadataBase: new URL(cleanProductionUrl),
            title: 'SultraFiks - Portal Berita Terkini',
            description: 'Media siber terdepan di Sulawesi Tenggara.',
        };
    }

    // 3. Bersihkan deskripsi
    const cleanDescription = currentArticle.content
        ? currentArticle.content.replace(/<[^>]*>?/gm, '').substring(0, 140) + '...'
        : 'Baca berita selengkapnya di portal SultraFiks.';

    // 🔥 KUNCI UTAMA KEBERHASILAN WHATSAPP: GUNAKAN LINK ASLI DATABASE 🔥
    // WhatsApp sangat menyukai link gambar murni (.jpg / .png) yang langsung terbuka.
    const directImageUrl = currentArticle.image_url || `${cleanProductionUrl}/logo.png`;
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
                    url: directImageUrl, // Murni dari database Supabase
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
            images: [directImageUrl],
        },
    };
}

export default function NewsLayout({ children }) {
    return <>{children}</>;
}