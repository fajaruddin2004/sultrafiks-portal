import { supabase } from '@/lib/supabase';

// 🔥 Anti Cache Vercel 🔥
export const revalidate = 0;
export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }) {
    try {
        const resolvedParams = await params;
        const slugParam = decodeURIComponent(resolvedParams.slug).toLowerCase();
        
        // 🔥 TARIK 200 BERITA TERBARU SAJA AGAR LOADINGNYA KILAT!
        const { data: allNews } = await supabase
            .from('news')
            .select('title, content, image_url')
            .order('created_at', { ascending: false })
            .limit(200);
        
        let article = null;
        
        if (allNews && allNews.length > 0) {
            // TAHAP 1: Cari pencocokan judul persis 100%
            for (const item of allNews) {
                if (item.title) {
                    const itemSlug = item.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
                    if (itemSlug === slugParam) {
                        article = item;
                        break;
                    }
                }
            }

            // TAHAP 2: JURUS SAPU JAGAT (Kalau judul kepanjangan, kita cari pakai potongan kata)
            if (!article) {
                const shortSlug = slugParam.substring(0, 30); // Ambil 30 huruf pertama saja
                article = allNews.find(item => {
                    if (!item.title) return false;
                    const itemSlug = item.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
                    return itemSlug.includes(shortSlug);
                });
            }
        }

        const baseUrl = 'https://www.sultrafiks.com';

        // JIKA BERITA BENAR-BENAR TERHAPUS DARI DATABASE
        if (!article) {
            return {
                title: 'SultraFiks - Portal Berita Terkini',
                description: 'Dapatkan informasi terbaru, terakurat, dan terpercaya hari ini.',
                openGraph: {
                    images: [`${baseUrl}/placeholder-news.jpg`]
                }
            };
        }

        // BERHASIL KETEMU! SIAPKAN DESKRIPSI & GAMBAR
        const plainText = article.content 
            ? article.content.replace(/<[^>]+>/g, '').substring(0, 150) + '...' 
            : 'Baca informasi selengkapnya di portal berita terdepan SultraFiks.';

        // Pastikan link gambar tidak error
        const imageUrl = article.image_url && article.image_url.startsWith('http') 
            ? article.image_url 
            : `${baseUrl}/placeholder-news.jpg`;
            
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
            },
            alternates: {
                canonical: articleUrl,
            }
        };
    } catch (err) {
        return { title: 'SultraFiks - Berita Terkini Sulawesi Tenggara' };
    }
}

export default function NewsLayout({ children }) {
    return <>{children}</>;
}