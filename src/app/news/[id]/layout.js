import { supabase } from '@/lib/supabase';

// 🔥 FUNGSI INI KHUSUS UNTUK MELAYANI ROBOT WHATSAPP, FB, & IG 🔥
export async function generateMetadata({ params }) {
    const slugParam = decodeURIComponent(params.slug);
    
    // Server diam-diam menarik data dari Supabase sebelum halaman dibuka
    const { data: allNews } = await supabase.from('news').select('title, content, image_url');
    
    let article = null;
    if (allNews) {
        article = allNews.find(item => {
            if(!item.title) return false;
            const itemSlug = item.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
            return itemSlug === slugParam;
        });
    }

    // Jika URL ngawur / berita tidak ada
    if (!article) {
        return {
            title: 'Berita Tidak Ditemukan - SultraFiks',
            description: 'Portal Berita Terkini Sulawesi Tenggara'
        }
    }

    // Memotong teks isi berita untuk dijadikan deskripsi singkat di bawah link
    const plainText = article.content ? article.content.replace(/<[^>]+>/g, '').substring(0, 160) + '...' : 'Baca selengkapnya di portal berita SultraFiks.';

    // Memberikan Data ke Robot Sosmed
    return {
        title: `${article.title} - SultraFiks`,
        description: plainText,
        openGraph: {
            title: article.title,
            description: plainText,
            url: `https://sultrafiks-portal.vercel.app/news/${slugParam}`,
            siteName: 'SultraFiks',
            images: [
                {
                    url: article.image_url || 'https://sultrafiks-portal.vercel.app/placeholder-news.jpg',
                    width: 1200,
                    height: 630,
                    alt: article.title,
                },
            ],
            locale: 'id_ID',
            type: 'article',
        },
        twitter: {
            card: 'summary_large_image',
            title: article.title,
            description: plainText,
            images: [article.image_url || 'https://sultrafiks-portal.vercel.app/placeholder-news.jpg'],
        },
    }
}

export default function NewsLayout({ children }) {
    return <>{children}</>;
}