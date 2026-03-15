import { supabase } from '@/lib/supabase';

// MANTRA SAKTI UNTUK MENGIRIM GAMBAR KE BOT WHATSAPP & FACEBOOK
export async function generateMetadata({ params }) {
    const slugParam = decodeURIComponent(String(params.id || params.slug));

    // Server mengambil data berita diam-diam sebelum halaman terbuka
    const { data: allNews } = await supabase.from('news').select('id, title, content, image_url');

    let currentArticle = null;

    if (allNews && allNews.length > 0) {
        currentArticle = allNews.find(item => {
            if(!item.title) return false;
            const itemSlug = item.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
            return itemSlug === slugParam || item.id === slugParam;
        });
    }

    if (!currentArticle) {
        return { title: 'SultraFiks - Portal Berita' };
    }

    // Bersihkan konten dari tag HTML untuk deskripsi singkat WA
    const cleanDescription = currentArticle.content
        ? currentArticle.content.replace(/<[^>]*>?/gm, '').substring(0, 150) + '...'
        : 'Baca berita selengkapnya di portal SultraFiks.';

    // Jika tidak ada gambar, gunakan logo SultraFiks sebagai cadangan
    const imageUrl = currentArticle.image_url || 'https://www.sultrafiks.com/logo.png';
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
                    url: imageUrl,
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
            images: [imageUrl],
        },
    };
}

export default function NewsLayout({ children }) {
    return <>{children}</>;
}