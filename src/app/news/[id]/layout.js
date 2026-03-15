import { supabase } from '@/lib/supabase';

// MANTRA SAKTI UNTUK MENGIRIM GAMBAR RINGAN KE BOT WHATSAPP
export async function generateMetadata({ params }) {
    const slugParam = decodeURIComponent(String(params.id || params.slug));
    const { data: allNews } = await supabase.from('news').select('id, title, content, image_url');

    let currentArticle = null;
    if (allNews && allNews.length > 0) {
        currentArticle = allNews.find(item => {
            if(!item.title) return false;
            const itemSlug = item.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
            return itemSlug === slugParam || item.id === slugParam;
        });
    }

    if (!currentArticle) return { title: 'SultraFiks - Portal Berita' };

    const cleanDescription = currentArticle.content
        ? currentArticle.content.replace(/<[^>]*>?/gm, '').substring(0, 150) + '...'
        : 'Baca berita selengkapnya di portal SultraFiks.';

    const rawImageUrl = currentArticle.image_url || 'https://www.sultrafiks.com/logo.png';
    
    // 🔥 INI RAHASIANYA: KITA PAKSA WHATSAPP AMBIL GAMBAR YANG SUDAH DIGILING (Kualitas 75%) 🔥
    const optimizedWaImage = `https://www.sultrafiks.com/_next/image?url=${encodeURIComponent(rawImageUrl)}&w=1200&q=75`;
    const articleUrl = `https://www.sultrafiks.com/news/${slugParam}`;

    return {
        title: `${currentArticle.title} - SultraFiks`,
        description: cleanDescription,
        openGraph: {
            title: currentArticle.title,
            description: cleanDescription,
            url: articleUrl,
            siteName: 'SultraFiks',
            images: [
                {
                    url: optimizedWaImage, // <-- Mengirim gambar versi diet ke WA
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
            images: [optimizedWaImage],
        },
    };
}

export default function NewsLayout({ children }) {
    return <>{children}</>;
}