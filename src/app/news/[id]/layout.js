// 🔥 JURUS TEMBAK LANGSUNG ANTI VERCEL ERROR 🔥
export const revalidate = 0;
export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }) {
    try {
        const resolvedParams = await params;
        const slugParam = decodeURIComponent(resolvedParams.slug).toLowerCase();

        // =================================================================
        // ⚠️ BOS FAJARUDDIN: GANTI 2 BARIS INI DENGAN DATA SUPABASE BOS ⚠️
        // =================================================================
        const SUPABASE_URL = "https://swyafiunqihshjgtlkmd.supabase.co"; // Ganti dengan URL Supabase Bos
        const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN3eWFmaXVucWloc2hqZ3Rsa21kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE3NTQ5MjYsImV4cCI6MjA4NzMzMDkyNn0.lKVnhCeeF2HYn5ByPHB05b_cGT4vx7ZrYwsSWubrTcI"; // Ganti dengan Kunci Anon Bos
        // =================================================================

        // Tembak database langsung pakai jalur REST API murni (Pasti Tembus Vercel)
        const res = await fetch(`${SUPABASE_URL}/rest/v1/news?select=title,content,image_url`, {
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
            },
            cache: 'no-store'
        });

        const allNews = await res.json();
        
        let article = null;
        if (Array.isArray(allNews) && allNews.length > 0) {
            // Pencarian super canggih: Cari kemiripan slug
            const shortSlug = slugParam.substring(0, 30); // Ambil 30 huruf pertama saja
            
            article = allNews.find(item => {
                if (!item.title) return false;
                const itemSlug = item.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
                return itemSlug.includes(shortSlug) || slugParam.includes(itemSlug.substring(0, 30));
            });
        }

        const baseUrl = 'https://www.sultrafiks.com';

        // JIKA GAGAL KONEKSI / BERITA DIHAPUS
        if (!article) {
            return {
                title: 'SultraFiks - Portal Berita Terkini',
                description: 'Media siber terdepan di Sulawesi Tenggara.',
                openGraph: { images: [`${baseUrl}/placeholder-news.jpg`] }
            };
        }

        // BERHASIL DITARIK DARI DATABASE!
        const plainText = article.content 
            ? article.content.replace(/<[^>]+>/g, '').substring(0, 140) + '...' 
            : 'Baca informasi selengkapnya hanya di SultraFiks.';

        // Cek gambar apakah ada
        const imageUrl = article.image_url && article.image_url.startsWith('http') 
            ? article.image_url 
            : `${baseUrl}/placeholder-news.jpg`;

        return {
            title: `${article.title} - SultraFiks`,
            description: plainText,
            openGraph: {
                title: article.title,
                description: plainText,
                url: `${baseUrl}/news/${slugParam}`,
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
        return { title: 'SultraFiks - Berita Terkini' };
    }
}

export default function NewsLayout({ children }) {
    return <>{children}</>;
}