import { supabase } from '@/lib/supabase';

// Mematikan cache agar Vercel selalu narik gambar terbaru
export const revalidate = 0;
export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }) {
    try {
        const resolvedParams = await params;
        const slugParam = decodeURIComponent(resolvedParams.slug).toLowerCase();

        // KITA PAKAI JALUR RESMI (TANPA MANUAL URL/KEY)
        // Ambil 500 berita terbaru untuk dicocokkan
        const { data: allNews, error } = await supabase
            .from('news')
            .select('title, content, image_url')
            .order('created_at', { ascending: false })
            .limit(500);

        if (error) throw error;

        let article = null;

        if (allNews && allNews.length > 0) {
            // Pencarian kecocokan judul yang presisi
            article = allNews.find(item => {
                if (!item.title) return false;
                const itemSlug = item.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
                return itemSlug === slugParam;
            });
        }

        const baseUrl = 'https://www.sultrafiks.com';

        // JIKA GAGAL (Teks ini saya ganti biar Bos tahu kalau masih error)
        if (!article) {
            return {
                title: 'SultraFiks - Portal Berita Terkini',
                description: 'Baca berita selengkapnya di website resmi SultraFiks.',
            };
        }

        // BERHASIL KETEMU! Siapkan Gambar dan Teks
        const plainText = article.content 
            ? article.content.replace(/<[^>]+>/g, '').substring(0, 130) + '...' 
            : 'Baca informasi selengkapnya di portal berita terdepan SultraFiks.';

        const imageUrl = article.image_url && article.image_url.startsWith('http') 
            ? article.image_url 
            : `${baseUrl}/placeholder-news.jpg`;
            
        const articleUrl = `${baseUrl}/news/${slugParam}`;

        return {
            title: article.title,
            description: plainText,
            openGraph: {
                title: article.title,
                description: plainText,
                url: articleUrl,
                siteName: 'SultraFiks',
                images: [
                    {
                        url: imageUrl,
                        secureUrl: imageUrl, // Wajib untuk WhatsApp
                        width: 1200,
                        height: 630,
                        alt: article.title,
                    }
                ],
                locale: 'id_ID',
                type: 'article',
            },
            twitter: {
                card: 'summary_large_image',
                title: article.title,
                description: plainText,
                images: [imageUrl],
            }
        };
    } catch (err) {
        return { title: 'SultraFiks - Sedang Memuat Database...' };
    }
}

export default function NewsLayout({ children }) {
    return <>{children}</>;
}