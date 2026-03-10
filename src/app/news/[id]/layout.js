export const revalidate = 0;

export async function generateMetadata({ params }) {
    const resolvedParams = await params;
    const slug = resolvedParams.slug;
    const baseUrl = 'https://www.sultrafiks.com';

    // 🔥 PENGAMAN MUTLAK: Judul diambil dari URL, Gambar pakai Logo Bos
    // Pastikan Bos punya gambar "placeholder-news.jpg" di folder "public"
    const safeTitle = slug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    const safeImage = `${baseUrl}/placeholder-news.jpg`;

    try {
        // AMBIL KUNCI YANG SUDAH BOS PASANG DI VERCEL SEJAK 24 FEB
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

        // Ambil 3 kata pertama dari link untuk pencarian super kilat
        const searchWords = slug.split('-').slice(0, 3).join(' ');

        // 🔥 JALUR NATIVE FETCH (SANGAT RINGAN, ANTI TIMEOUT VERCEL) 🔥
        const res = await fetch(`${supabaseUrl}/rest/v1/news?select=title,content,image_url&title=ilike.*${searchWords}*&limit=3`, {
            headers: {
                'apikey': supabaseKey,
                'Authorization': `Bearer ${supabaseKey}`
            },
            cache: 'no-store'
        });

        if (res.ok) {
            const data = await res.json();
            if (data && data.length > 0) {
                // Ambil hasil pencarian teratas
                const article = data[0];

                const desc = article.content
                    ? article.content.replace(/<[^>]+>/g, '').replace(/\n/g, ' ').substring(0, 120) + '...'
                    : 'Baca berita selengkapnya di SultraFiks.';

                const img = (article.image_url && article.image_url.startsWith('http'))
                    ? article.image_url
                    : safeImage;

                return {
                    title: article.title,
                    description: desc,
                    openGraph: {
                        title: article.title,
                        description: desc,
                        url: `${baseUrl}/news/${slug}`,
                        siteName: 'SultraFiks',
                        images: [{ url: img, width: 1200, height: 630, alt: article.title }],
                        type: 'article',
                    },
                    twitter: {
                        card: 'summary_large_image',
                        title: article.title,
                        images: [img],
                    }
                };
            }
        }
    } catch (error) {
        console.error("Vercel Fetch Error:", error);
    }

    // 🔥 JIKA SEMUA GAGAL, TETAP TAMPILKAN JUDUL BERITA & GAMBAR LOGO 🔥
    return {
        title: safeTitle,
        description: 'Portal Berita Terkini Sulawesi Tenggara.',
        openGraph: {
            title: safeTitle,
            description: 'Portal Berita Terkini Sulawesi Tenggara.',
            url: `${baseUrl}/news/${slug}`,
            siteName: 'SultraFiks',
            images: [{ url: safeImage, width: 1200, height: 630, alt: safeTitle }],
            type: 'article',
        },
        twitter: {
            card: 'summary_large_image',
            title: safeTitle,
            images: [safeImage],
        }
    };
}

export default function NewsLayout({ children }) {
    return <>{children}</>;
}