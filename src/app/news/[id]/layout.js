import { supabase } from '@/lib/supabase';

// MANTRA SAKTI KTP BERITA UNTUK WHATSAPP (VERSI WATERMARK OTOMATIS)
export async function generateMetadata({ params }) {
    const resolvedParams = await params;
    const rawSlug = decodeURIComponent(String(resolvedParams.id || resolvedParams.slug)).toLowerCase();
    
    const { data: allNews } = await supabase.from('news').select('id, title, content, image_url').order('created_at', { ascending: false });

    let currentArticle = null;
    if (allNews && allNews.length > 0) {
        const cleanSlugForMatch = rawSlug.replace(/[^a-z0-9]+/g, '');
        currentArticle = allNews.find(item => {
            if (!item.title) return false;
            if (item.id === rawSlug) return true; 
            
            const cleanTitleForMatch = item.title.toLowerCase().replace(/[^a-z0-9]+/g, '');
            return cleanTitleForMatch === cleanSlugForMatch;
        });
    }

    const productionUrl = 'https://www.sultrafiks.com';

    if (!currentArticle) {
        return { 
            metadataBase: new URL(productionUrl),
            title: 'SultraFiks - Portal Berita Terkini',
            description: 'Media siber terdepan di Sulawesi Tenggara.',
        };
    }

    const cleanDescription = currentArticle.content
        ? currentArticle.content.replace(/<[^>]*>?/gm, '').substring(0, 140) + '...'
        : 'Baca berita selengkapnya di portal SultraFiks.';

    // 1. Ambil Foto Asli
    const rawImageUrl = currentArticle.image_url || `${productionUrl}/logo.png`;
    
    // 🔥 TRIK RAHASIA UNTUK WHATSAPP 🔥
    // Kita tambahkan &v=waktu dan &ext=.png di akhir link agar WA mengira ini file gambar asli yang baru!
    const watermarkedImageUrl = `${productionUrl}/api/og?imageUrl=${encodeURIComponent(rawImageUrl)}&v=${Date.now()}&ext=.png`;
    
    const articleUrl = `${productionUrl}/news/${rawSlug}`;

    return {
        metadataBase: new URL(productionUrl),
        title: `${currentArticle.title} - SultraFiks`,
        description: cleanDescription,
        openGraph: {
            title: currentArticle.title,
            description: cleanDescription,
            url: articleUrl,
            siteName: 'SultraFiks',
            images: [
                {
                    url: watermarkedImageUrl, // Setor gambar stempel ke WA
                    width: 1200,
                    height: 630,
                    alt: currentArticle.title,
                    type: 'image/png', 
                },
            ],
            locale: 'id_ID',
            type: 'article',
        },
        twitter: {
            card: 'summary_large_image',
            title: currentArticle.title,
            description: cleanDescription,
            images: [watermarkedImageUrl],
        },
    };
}

export default function NewsLayout({ children }) {
    return <>{children}</>;
}