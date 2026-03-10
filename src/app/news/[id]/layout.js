// 🔥 JALUR BYPASS SERVER-SIDE VERCEL 🔥
export const revalidate = 0;
export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }) {
    try {
        const slugParam = decodeURIComponent(params.slug);
        
        // Menggunakan kunci environment dari Vercel langsung
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

        // Tembak langsung ke API REST Supabase (Anti Gagal di Server Vercel)
        const res = await fetch(`${supabaseUrl}/rest/v1/news?select=title,content,image_url&status=eq.published`, {
            headers: {
                'apikey': supabaseKey,
                'Authorization': `Bearer ${supabaseKey}`
            },
            cache: 'no-store'
        });

        if (!res.ok) throw new Error('Gagal menarik data dari Supabase Server');
        
        const allNews = await res.json();
        
        let article = null;
        if (allNews && allNews.length > 0) {
            article = allNews.find(item => {
                if (!item.title) return false;
                const itemSlug = item.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
                return itemSlug === slugParam;
            });
        }

        // Jika slug tidak cocok dengan database
        if (!article) {
            return {
                title: 'Berita Tidak Ditemukan - SultraFiks',
                description: 'Portal Berita Terkini Sulawesi Tenggara'
            };
        }

        // Bersihkan tag HTML (seperti <br> atau <strong>) agar deskripsi WA rapi
        const plainText = article.content 
            ? article.content.replace(/<[^>]+>/g, '').substring(0, 150) + '...' 
            : 'Baca informasi selengkapnya di portal berita terdepan SultraFiks.';

        // Link Utama Domain Bos
        const baseUrl = 'https://www.sultrafiks.com';
        const articleUrl = `${baseUrl}/news/${slugParam}`;
        const imageUrl = article.image_url || `${baseUrl}/placeholder-news.jpg`;

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
                        secureUrl: imageUrl, // WA sangat butuh parameter ini
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
        // Fallback kalau server benar-benar down
        return {
            title: 'SultraFiks - Portal Berita Terkini',
            description: 'Dapatkan berita terbaru seputar Sulawesi Tenggara.'
        };
    }
}

export default function NewsLayout({ children }) {
    return <>{children}</>;
}