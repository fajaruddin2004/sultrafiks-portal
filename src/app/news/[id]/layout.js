export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }) {
    const fallbackImage = 'https://www.sultrafiks.com/placeholder-news.jpg';

    try {
        // 1. Ambil slug
        const resolvedParams = await Promise.resolve(params);
        const slug = resolvedParams?.slug || '';
        const slugString = decodeURIComponent(slug).toLowerCase();
        const emergencyTitle = slugString.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

        // 2. Ambil Kunci dari Vercel
        let url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
        const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

        // Deteksi kalau kuncinya tidak terbaca
        if (!url) throw new Error("URL_KOSONG");
        if (!key) throw new Error("KEY_KOSONG");

        // Perbaiki otomatis kalau Bos lupa pasang https://
        if (!url.startsWith('http')) {
            url = 'https://' + url;
        }

        // 3. Tembak Database (Metode Native Anti-Crash)
        const res = await fetch(`${url}/rest/v1/news?select=title,content,image_url`, {
            headers: {
                'apikey': key,
                'Authorization': `Bearer ${key}`
            },
            cache: 'no-store'
        });

        if (!res.ok) throw new Error(`FETCH_GAGAL_KODE_${res.status}`);

        const data = await res.json();
        const article = data.find(item => {
            if (!item.title) return false;
            const itemSlug = item.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
            return itemSlug === slugString;
        });

        if (article) {
            const plainText = article.content 
                ? article.content.replace(/<[^>]+>/g, '').replace(/\n/g, ' ').substring(0, 110) + '...' 
                : 'Berita selengkapnya di SultraFiks.';
            
            const finalImg = (article.image_url && article.image_url.startsWith('http')) 
                ? article.image_url 
                : fallbackImage;

            return {
                title: article.title,
                description: plainText,
                openGraph: {
                    title: article.title,
                    description: plainText,
                    images: [finalImg]
                }
            };
        }

        // Kalau berita beneran nggak ada di database
        return {
            title: emergencyTitle,
            description: 'Berita tidak ditemukan di database.',
            openGraph: { images: [fallbackImage] }
        };

    } catch (error) {
        // 🔥 INI DIA JEBAKANNYA! KITA TAMPILKAN ERROR VERCEL KE LAYAR WA BOS 🔥
        return {
            title: `SultraFiks Error: ${error.message}`,
            description: 'Sedang mengecek sistem Vercel...',
            openGraph: { images: [fallbackImage] }
        };
    }
}

export default function NewsLayout({ children }) {
    return <>{children}</>;
}