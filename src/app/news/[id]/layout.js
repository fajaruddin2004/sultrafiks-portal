export const revalidate = 0;
export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }) {
    const baseUrl = 'https://www.sultrafiks.com';
    // Pastikan Bos sudah punya logo.png di folder public ya!
    const fallbackImage = `${baseUrl}/logo.png`; 

    try {
        const resolvedParams = await params;
        const slugParam = decodeURIComponent(resolvedParams?.slug || '').toLowerCase();
        if (!slugParam) throw new Error("Slug kosong");

        const emergencyTitle = slugParam.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

        // 🔥 JALUR NATIVE FETCH (SANGAT RINGAN & ANTI TIMEOUT) 🔥
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

        if (!supabaseUrl || !supabaseKey) {
             throw new Error("Kunci Vercel Belum Terbaca");
        }

        const searchWords = slugParam.split('-').slice(0, 4).join(' ');

        // Tembak langsung API Supabase tanpa perantara
        const res = await fetch(`${supabaseUrl}/rest/v1/news?select=title,content,image_url&title=ilike.*${encodeURIComponent(searchWords)}*&limit=3`, {
            headers: {
                'apikey': supabaseKey,
                'Authorization': `Bearer ${supabaseKey}`
            },
            cache: 'no-store'
        });

        if (!res.ok) throw new Error("Gagal Konek ke Database");
        
        const data = await res.json();
        
        let article = null;
        if (data && data.length > 0) {
            article = data.find(item => {
                if (!item.title) return false;
                const itemSlug = item.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
                return itemSlug === slugParam || slugParam.includes(itemSlug.substring(0, 30));
            });
            if (!article) article = data[0];
        }

        // 🔥 JIKA BERHASIL 🔥
        if (article) {
            const cleanDesc = article.content 
                ? article.content.replace(/<[^>]+>/g, '').replace(/\n/g, ' ').substring(0, 130) + '...' 
                : 'Baca informasi selengkapnya di portal berita SultraFiks.';

            const finalImage = (article.image_url && article.image_url.startsWith('http')) 
                ? article.image_url 
                : fallbackImage;

            return {
                title: article.title,
                description: cleanDesc,
                openGraph: {
                    title: article.title,
                    description: cleanDesc,
                    url: `${baseUrl}/news/${slugParam}`,
                    siteName: 'SultraFiks',
                    images: [{ url: finalImage, width: 1200, height: 630, alt: article.title }],
                    type: 'article',
                },
                twitter: {
                    card: 'summary_large_image',
                    title: article.title,
                    images: [finalImage],
                }
            };
        }

        // Jika berita sudah dihapus tapi server tidak error
        return {
            title: `${emergencyTitle} - SultraFiks`,
            description: 'Baca informasi selengkapnya di SultraFiks.',
            openGraph: {
                title: emergencyTitle,
                images: [{ url: fallbackImage, width: 1200, height: 630 }],
            }
        };

    } catch (error) {
        // 🔥 INI RADAR ERROR KITA! 🔥
        // Kalau masih masuk ke sini, WA akan menampilkan apa ALASAN ERROR-nya!
        return {
            title: `SultraFiks Sedang Memuat...`,
            description: `Pesan Sistem: ${error.message}`,
            openGraph: {
                images: [{ url: fallbackImage, width: 1200, height: 630 }],
            }
        };
    }
}

export default function NewsLayout({ children }) {
    return <>{children}</>;
}