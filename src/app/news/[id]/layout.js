import { supabase } from '@/lib/supabase';

export const revalidate = 0;
export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }) {
    const baseUrl = 'https://www.sultrafiks.com';
    const fallbackImage = `${baseUrl}/placeholder-news.jpg`;

    // SEMUA PROSES KITA MASUKKAN KE DALAM PELINDUNG (TRY-CATCH)
    // Jadi apapun error di belakang layar, website TETAP BISA DIBUKA!
    try {
        if (!params) throw new Error("Params kosong");
        const resolvedParams = await params;
        if (!resolvedParams || !resolvedParams.slug) throw new Error("Slug kosong");

        const slugParam = decodeURIComponent(resolvedParams.slug).toLowerCase();
        
        // Judul darurat kalau database ngambek
        const emergencyTitle = slugParam.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

        // KARENA VERCEL SUDAH PUNYA KUNCI, KITA PAKAI JALUR RESMI YANG SUPER AMAN
        const { data } = await supabase
            .from('news')
            .select('title, content, image_url')
            .limit(200);

        let article = null;
        if (data && data.length > 0) {
            article = data.find(item => {
                if (!item.title) return false;
                const itemSlug = item.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
                return itemSlug === slugParam;
            });
        }

        // JIKA BERITA KETEMU DI DATABASE
        if (article) {
            const cleanDesc = article.content 
                ? article.content.replace(/<[^>]+>/g, '').replace(/\n/g, ' ').substring(0, 120) + '...' 
                : 'Baca berita selengkapnya di SultraFiks.';

            const finalImage = (article.image_url && article.image_url.startsWith('http')) 
                ? article.image_url 
                : fallbackImage;

            return {
                title: `${article.title} - SultraFiks`,
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

        // JIKA BERITA TIDAK KETEMU, TAMPILKAN JUDUL DARI LINK & FOTO LOGO
        return {
            title: `${emergencyTitle} - SultraFiks`,
            description: 'Portal Berita Terkini Sulawesi Tenggara.',
            openGraph: {
                title: emergencyTitle,
                description: 'Portal Berita Terkini Sulawesi Tenggara.',
                url: `${baseUrl}/news/${slugParam}`,
                images: [{ url: fallbackImage, width: 1200, height: 630 }],
                type: 'article',
            }
        };

    } catch (error) {
        // 🔥 JARING PENGAMAN TERAKHIR: ANTI ERROR 500 🔥
        // Kalau terjadi masalah server parah, kembalikan tampilan normal (bukan layar putih!)
        return {
            title: 'SultraFiks - Portal Berita Terkini',
            description: 'Media siber terdepan di Sulawesi Tenggara.',
            openGraph: {
                images: [{ url: fallbackImage, width: 1200, height: 630 }],
            }
        };
    }
}

export default function NewsLayout({ children }) {
    return <>{children}</>;
}