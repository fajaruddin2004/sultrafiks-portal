import { supabase } from '@/lib/supabase';

// 🔥 Anti Cache Vercel 🔥
export const revalidate = 0;
export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }) {
    try {
        // 🔥 INI KUNCI UTAMANYA: Wajib di-await untuk Next.js terbaru!
        const resolvedParams = await params; 
        const slugParam = resolvedParams.slug;
        
        // Tarik data langsung dari Supabase Client yang sudah stabil
        const { data: allNews } = await supabase.from('news').select('title, content, image_url');
        
        let article = null;
        if (allNews && allNews.length > 0) {
            // Looping pencarian slug yang lebih akurat
            for (const item of allNews) {
                if (item.title) {
                    const itemSlug = item.title.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
                    if (itemSlug === slugParam) {
                        article = item;
                        break;
                    }
                }
            }
        }

        const baseUrl = 'https://www.sultrafiks.com';

        // JIKA GAGAL (Server Lemot/Slug Salah), JANGAN TAMPILKAN "TIDAK DITEMUKAN"
        if (!article) {
            return {
                title: 'SultraFiks - Portal Berita Terkini Sulawesi Tenggara',
                description: 'Dapatkan informasi terbaru, terakurat, dan terpercaya hari ini.',
                openGraph: {
                    images: [`${baseUrl}/placeholder-news.jpg`]
                }
            };
        }

        // BERHASIL DITEMUKAN!
        const plainText = article.content 
            ? article.content.replace(/<[^>]+>/g, '').substring(0, 150) + '...' 
            : 'Baca informasi selengkapnya di portal berita terdepan SultraFiks.';

        const imageUrl = article.image_url || `${baseUrl}/placeholder-news.jpg`;
        const articleUrl = `${baseUrl}/news/${slugParam}`;

        return {
            title: `${article.title} - SultraFiks`,
            description: plainText,
            openGraph: {
                title: article.title,
                description: plainText,
                url: articleUrl,
                siteName: 'SultraFiks',
                images: [
                    {
                        url: imageUrl,
                        secureUrl: imageUrl,
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
        // Fallback terakhir jika sistem down
        return { title: 'SultraFiks - Berita Terkini' };
    }
}

export default function NewsLayout({ children }) {
    return <>{children}</>;
}