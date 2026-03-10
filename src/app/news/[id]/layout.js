import { supabase } from '@/lib/supabase';

export const revalidate = 0;
export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }) {
    // 1. Ambil slug dari URL
    const resolvedParams = await params;
    const slugParam = decodeURIComponent(resolvedParams.slug).toLowerCase();
    
    // URL Utama Website Bos
    const baseUrl = 'https://www.sultrafiks.com';
    
    // 🔥 FOTO PAKSAAN (FALLBACK): Gambar ini yang akan muncul kalau WA ngambek!
    // Pastikan Bos punya file bernama "placeholder-news.jpg" di dalam folder "public" di kodingan Bos.
    const fallbackImage = `${baseUrl}/placeholder-news.jpg`; 

    // Judul Darurat (Diambil dari link URL agar tidak kosong)
    const emergencyTitle = slugParam.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

    try {
        // 2. Jurus Tarik Data Cepat (Ambil 3 kata pertama untuk dicari)
        const searchWords = slugParam.split('-').slice(0, 3).join(' ');
        
        const { data } = await supabase
            .from('news')
            .select('title, content, image_url')
            .ilike('title', `%${searchWords}%`)
            .limit(3);

        let article = null;
        if (data && data.length > 0) {
            article = data.find(item => {
                if (!item.title) return false;
                const itemSlug = item.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
                return itemSlug === slugParam;
            });
            // Kalau tidak ketemu presisi, paksa ambil hasil pencarian pertama
            if (!article) article = data[0]; 
        }

        // 3. JIKA BERITA KETEMU DI DATABASE
        if (article) {
            const cleanDesc = article.content 
                ? article.content.replace(/<[^>]+>/g, '').replace(/\n/g, ' ').substring(0, 100) + '...' 
                : 'Baca selengkapnya di SultraFiks.';

            // Cek apakah gambar ada. Kalau tidak ada, PAKAI GAMBAR LOGO!
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
                    images: [
                        {
                            url: finalImage,
                            secureUrl: finalImage,
                            width: 1200,
                            height: 630,
                            type: 'image/jpeg', // Paksa WA baca ini sebagai gambar
                            alt: article.title,
                        }
                    ],
                    type: 'article',
                },
                twitter: {
                    card: 'summary_large_image',
                    title: article.title,
                    description: cleanDesc,
                    images: [finalImage],
                }
            };
        }
    } catch (e) {
        console.error("Gagal narik metadata:", e);
    }

    // 4. JIKA SERVER ERROR / DATABASE GAGAL (KONDISI TERBURUK)
    // Akan TETAP memunculkan FOTO LOGO dan JUDUL DARI LINK! APAPUN YANG TERJADI!
    return {
        title: emergencyTitle,
        description: 'Portal Berita Terkini Sulawesi Tenggara.',
        openGraph: {
            title: emergencyTitle,
            description: 'Portal Berita Terkini Sulawesi Tenggara.',
            url: `${baseUrl}/news/${slugParam}`,
            siteName: 'SultraFiks',
            images: [
                {
                    url: fallbackImage,
                    secureUrl: fallbackImage,
                    width: 1200,
                    height: 630,
                    type: 'image/jpeg',
                    alt: emergencyTitle,
                }
            ],
            type: 'article',
        },
        twitter: {
            card: 'summary_large_image',
            title: emergencyTitle,
            images: [fallbackImage],
        }
    };
}

export default function NewsLayout({ children }) {
    return <>{children}</>;
}