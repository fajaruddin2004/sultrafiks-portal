import { supabase } from '@/lib/supabase';

// 🔥 MANTRA SEO OPEN GRAPH (DENGAN PENGAMAN ANTI-ERROR NEXT.JS) 🔥
export async function generateMetadata({ params }) {
    
    // 1. Tunggu params dari Next.js siap 100%
    const resolvedParams = await params;
    
    // 2. Ambil ID/Slug dengan aman
    const rawParam = resolvedParams?.id;

    // 3. PENGAMAN: Jika sesaat URL belum terbaca, kembalikan judul default
    if (!rawParam) {
        return { title: 'Memuat Berita... - SultraFiks' };
    }

    // 4. MANTRA EKSTRAK ID DARI URL SEO
    const targetId = rawParam.includes('--') ? rawParam.split('--').pop() : rawParam;

    // 5. Ambil data dari Supabase
    const { data: article } = await supabase
        .from('news')
        .select('title, content, image_url')
        .eq('id', targetId)
        .single();

    if (!article) {
        return { title: 'Berita Tidak Ditemukan - SultraFiks' };
    }

    const plainText = article.content 
        ? article.content.replace(/<[^>]+>/g, '').substring(0, 150) + '...' 
        : 'Baca berita terupdate, tercepat, dan terpercaya di SultraFiks.';

    return {
        title: `${article.title} - SultraFiks`,
        description: plainText,
        openGraph: {
            title: article.title,
            description: plainText,
            url: `https://sultrafiks.com/news/${rawParam}`, 
            siteName: 'SultraFiks',
            images: [
                {
                    url: article.image_url || 'https://sultrafiks.com/placeholder-news.jpg',
                    width: 1200,
                    height: 630,
                    alt: article.title,
                },
            ],
            type: 'article',
        },
        twitter: {
            card: 'summary_large_image',
            title: article.title,
            description: plainText,
            images: [article.image_url],
        },
    };
}

export default function NewsLayout({ children }) {
    return <>{children}</>;
}